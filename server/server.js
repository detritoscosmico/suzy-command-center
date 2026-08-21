const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const { URL } = require("node:url");
const { SuzyDatabase } = require("./database.js");
const {
  constantTimeTextEqual,
  generateRecoveryKey,
  hashPassword,
  hashRecoveryKey,
  parseCookies,
  serializeCookie,
  validatePassword,
  validateUsername,
  verifyPassword,
  verifyRecoveryKey
} = require("./security.js");
const { normalizeJournalPayload } = require("./validation.js");

const SESSION_COOKIE = "suzy_session";
const MAX_BODY_BYTES = 2 * 1024 * 1024;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 5;

const MIME_TYPES = new Map([
  [".css", "text/css; charset=utf-8"],
  [".csv", "text/csv; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".ico", "image/x-icon"],
  [".jpeg", "image/jpeg"],
  [".jpg", "image/jpeg"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".webp", "image/webp"]
]);

function sendJson(response, status, payload, headers = {}) {
  const body = JSON.stringify(payload);
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    "Cache-Control": "no-store",
    ...headers
  });
  response.end(body);
}

function applySecurityHeaders(response) {
  response.setHeader("Content-Security-Policy", "default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; connect-src 'self'; font-src 'self'; frame-src https://ssltvc.investing.com; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
  response.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  response.setHeader("Referrer-Policy", "no-referrer");
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("X-Frame-Options", "DENY");
  response.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");
}

async function readJsonBody(request) {
  const chunks = [];
  let total = 0;
  for await (const chunk of request) {
    total += chunk.length;
    if (total > MAX_BODY_BYTES) {
      const error = new Error("Corpo da requisição excede 2 MB.");
      error.statusCode = 413;
      throw error;
    }
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    const error = new Error("JSON inválido.");
    error.statusCode = 400;
    throw error;
  }
}

function requestAddress(request) {
  return request.socket.remoteAddress || "local";
}

function createRateLimiter() {
  const attempts = new Map();
  return {
    blocked(key) {
      const now = Date.now();
      const record = attempts.get(key);
      if (!record || now - record.startedAt > LOGIN_WINDOW_MS) {
        attempts.delete(key);
        return false;
      }
      return record.count >= LOGIN_MAX_ATTEMPTS;
    },
    fail(key) {
      const now = Date.now();
      const record = attempts.get(key);
      if (!record || now - record.startedAt > LOGIN_WINDOW_MS) {
        attempts.set(key, { count: 1, startedAt: now });
        return;
      }
      record.count += 1;
    },
    clear(key) {
      attempts.delete(key);
    }
  };
}

function isSameOrigin(request, allowedOrigins) {
  const origin = request.headers.origin;
  return !origin || allowedOrigins.has(origin);
}

function createApplication(options = {}) {
  const rootDir = path.resolve(options.rootDir || path.join(__dirname, ".."));
  const host = options.host || "127.0.0.1";
  const configuredPort = Number.isFinite(Number(options.port)) ? Number(options.port) : 8787;
  const dbPath = path.resolve(options.dbPath || process.env.SUZY_DB_PATH || path.join(rootDir, "data", "suzy-local.sqlite3"));
  const secureCookie = options.secureCookie ?? process.env.SUZY_HTTPS === "1";
  const database = new SuzyDatabase(dbPath);
  const loginLimiter = createRateLimiter();
  const recoveryLimiter = createRateLimiter();
  const passwordLimiter = createRateLimiter();
  let listeningPort = configuredPort;

  function sessionFromRequest(request) {
    const cookies = parseCookies(request.headers.cookie);
    const token = cookies[SESSION_COOKIE];
    return { token, session: database.getSession(token) };
  }

  function setSessionCookie(response, token, ttlSeconds) {
    response.setHeader("Set-Cookie", serializeCookie(SESSION_COOKIE, token, {
      maxAge: ttlSeconds,
      httpOnly: true,
      sameSite: "Strict",
      secure: secureCookie,
      path: "/"
    }));
  }

  function clearSessionCookie(response) {
    response.setHeader("Set-Cookie", serializeCookie(SESSION_COOKIE, "", {
      maxAge: 0,
      expires: new Date(0),
      httpOnly: true,
      sameSite: "Strict",
      secure: secureCookie,
      path: "/"
    }));
  }

  function requireSession(request, response, requireCsrf = false) {
    const auth = sessionFromRequest(request);
    if (!auth.session) {
      sendJson(response, 401, { error: "Autenticação necessária." });
      return null;
    }
    if (requireCsrf) {
      const csrf = request.headers["x-csrf-token"];
      if (!constantTimeTextEqual(csrf, auth.session.csrfToken)) {
        sendJson(response, 403, { error: "Token CSRF inválido." });
        return null;
      }
    }
    return auth;
  }

  function createFreshSession(response, userId) {
    database.deleteSessionsForUser(userId);
    const session = database.createSession(userId);
    setSessionCookie(response, session.token, session.ttlSeconds);
    return session;
  }

  function passwordResponse(user, session, recoveryKey = null) {
    return {
      authenticated: true,
      username: user.username,
      csrfToken: session.csrfToken,
      expiresAt: session.expiresAt,
      recoveryConfigured: true,
      recoveryKey
    };
  }

  async function handleApi(request, response, pathname, allowedOrigins) {
    if (!isSameOrigin(request, allowedOrigins)) {
      return sendJson(response, 403, { error: "Origem não autorizada." });
    }

    if (request.method === "GET" && pathname === "/api/health") {
      return sendJson(response, 200, {
        status: "ok",
        configured: database.countUsers() > 0,
        storage: "sqlite-local"
      });
    }

    if (request.method === "GET" && pathname === "/api/auth/status") {
      const { session } = sessionFromRequest(request);
      const user = session ? database.findUserById(session.userId) : null;
      return sendJson(response, 200, {
        configured: database.countUsers() > 0,
        authenticated: Boolean(session),
        username: session?.username || null,
        csrfToken: session?.csrfToken || null,
        expiresAt: session?.expiresAt || null,
        recoveryConfigured: Boolean(user?.recoveryKeyHash)
      });
    }

    if (request.method === "POST" && pathname === "/api/auth/setup") {
      if (database.countUsers() > 0) {
        return sendJson(response, 409, { error: "A conta local já foi configurada." });
      }
      const body = await readJsonBody(request);
      const usernameResult = validateUsername(body.username);
      const passwordResult = validatePassword(body.password);
      if (!usernameResult.valid) return sendJson(response, 400, { error: usernameResult.message });
      if (!passwordResult.valid) return sendJson(response, 400, { error: passwordResult.message });

      const password = hashPassword(body.password);
      const recoveryKey = generateRecoveryKey();
      const user = database.createUser({
        username: usernameResult.username,
        passwordSalt: password.salt,
        passwordHash: password.hash,
        passwordIterations: password.iterations,
        recoveryKeyHash: hashRecoveryKey(recoveryKey)
      });
      const session = database.createSession(user.id);
      setSessionCookie(response, session.token, session.ttlSeconds);
      return sendJson(response, 201, passwordResponse(user, session, recoveryKey));
    }

    if (request.method === "POST" && pathname === "/api/auth/login") {
      const limiterKey = `${requestAddress(request)}:login`;
      if (loginLimiter.blocked(limiterKey)) {
        return sendJson(response, 429, { error: "Muitas tentativas. Aguarde 15 minutos." });
      }
      const body = await readJsonBody(request);
      const username = validateUsername(body.username).username;
      const user = database.findUserByUsername(username);
      if (!user || !verifyPassword(body.password, user)) {
        loginLimiter.fail(limiterKey);
        return sendJson(response, 401, { error: "Usuário ou senha inválidos." });
      }
      loginLimiter.clear(limiterKey);
      const session = database.createSession(user.id);
      setSessionCookie(response, session.token, session.ttlSeconds);
      return sendJson(response, 200, passwordResponse(user, session));
    }

    if (request.method === "POST" && pathname === "/api/auth/logout") {
      const auth = requireSession(request, response, true);
      if (!auth) return;
      database.deleteSession(auth.token);
      clearSessionCookie(response);
      return sendJson(response, 200, { authenticated: false });
    }

    if (request.method === "POST" && pathname === "/api/auth/recovery-key") {
      const auth = requireSession(request, response, true);
      if (!auth) return;
      const limiterKey = `${auth.session.userId}:sensitive`;
      if (passwordLimiter.blocked(limiterKey)) {
        return sendJson(response, 429, { error: "Muitas tentativas. Aguarde 15 minutos." });
      }
      const body = await readJsonBody(request);
      const user = database.findUserById(auth.session.userId);
      if (!user || !verifyPassword(body.currentPassword, user)) {
        passwordLimiter.fail(limiterKey);
        return sendJson(response, 401, { error: "Senha atual inválida." });
      }
      passwordLimiter.clear(limiterKey);
      const recoveryKey = generateRecoveryKey();
      database.setRecoveryKeyHash(user.id, hashRecoveryKey(recoveryKey));
      return sendJson(response, 200, { recoveryConfigured: true, recoveryKey });
    }

    if (request.method === "POST" && pathname === "/api/auth/change-password") {
      const auth = requireSession(request, response, true);
      if (!auth) return;
      const limiterKey = `${auth.session.userId}:sensitive`;
      if (passwordLimiter.blocked(limiterKey)) {
        return sendJson(response, 429, { error: "Muitas tentativas. Aguarde 15 minutos." });
      }
      const body = await readJsonBody(request);
      const user = database.findUserById(auth.session.userId);
      if (!user || !verifyPassword(body.currentPassword, user)) {
        passwordLimiter.fail(limiterKey);
        return sendJson(response, 401, { error: "Senha atual inválida." });
      }
      const passwordResult = validatePassword(body.newPassword);
      if (!passwordResult.valid) return sendJson(response, 400, { error: passwordResult.message });
      if (verifyPassword(body.newPassword, user)) {
        return sendJson(response, 400, { error: "A nova senha deve ser diferente da senha atual." });
      }

      passwordLimiter.clear(limiterKey);
      const password = hashPassword(body.newPassword);
      const recoveryKey = generateRecoveryKey();
      database.updatePassword(user.id, {
        passwordSalt: password.salt,
        passwordHash: password.hash,
        passwordIterations: password.iterations,
        recoveryKeyHash: hashRecoveryKey(recoveryKey)
      });
      const session = createFreshSession(response, user.id);
      return sendJson(response, 200, passwordResponse(user, session, recoveryKey));
    }

    if (request.method === "POST" && pathname === "/api/auth/recover") {
      const limiterKey = `${requestAddress(request)}:recovery`;
      if (recoveryLimiter.blocked(limiterKey)) {
        return sendJson(response, 429, { error: "Muitas tentativas. Aguarde 15 minutos." });
      }
      const body = await readJsonBody(request);
      const username = validateUsername(body.username).username;
      const user = database.findUserByUsername(username);
      const validRecovery = user?.recoveryKeyHash && verifyRecoveryKey(body.recoveryKey, user.recoveryKeyHash);
      const passwordResult = validatePassword(body.newPassword);
      if (!validRecovery || !passwordResult.valid || verifyPassword(body.newPassword, user)) {
        recoveryLimiter.fail(limiterKey);
        return sendJson(response, 401, { error: "Dados de recuperação inválidos ou nova senha não permitida." });
      }

      recoveryLimiter.clear(limiterKey);
      const password = hashPassword(body.newPassword);
      const recoveryKey = generateRecoveryKey();
      database.updatePassword(user.id, {
        passwordSalt: password.salt,
        passwordHash: password.hash,
        passwordIterations: password.iterations,
        recoveryKeyHash: hashRecoveryKey(recoveryKey)
      });
      const session = createFreshSession(response, user.id);
      return sendJson(response, 200, passwordResponse(user, session, recoveryKey));
    }

    if (request.method === "GET" && pathname === "/api/journal") {
      const auth = requireSession(request, response);
      if (!auth) return;
      const entries = database.listJournal(auth.session.userId);
      return sendJson(response, 200, { entries, total: entries.length });
    }

    if (request.method === "PUT" && pathname === "/api/journal") {
      const auth = requireSession(request, response, true);
      if (!auth) return;
      const payload = normalizeJournalPayload(await readJsonBody(request));
      if (!payload.valid) return sendJson(response, 400, { error: payload.message });
      const result = database.replaceJournal(auth.session.userId, payload.entries);
      return sendJson(response, 200, result);
    }

    return sendJson(response, 404, { error: "Rota de API não encontrada." });
  }

  function serveStatic(response, pathname) {
    let decodedPath;
    try {
      decodedPath = decodeURIComponent(pathname);
    } catch {
      response.writeHead(400);
      return response.end("Caminho inválido.");
    }

    const requested = decodedPath === "/" ? "/index.html" : decodedPath;
    const relative = requested.replace(/^\/+/, "");
    const filePath = path.resolve(rootDir, relative);
    if (filePath !== rootDir && !filePath.startsWith(`${rootDir}${path.sep}`)) {
      response.writeHead(403);
      return response.end("Acesso negado.");
    }
    if (relative.split(/[\\/]/).some(part => part.startsWith(".") && part !== ".well-known")) {
      response.writeHead(404);
      return response.end("Arquivo não encontrado.");
    }

    let stat;
    try {
      stat = fs.statSync(filePath);
    } catch {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      return response.end("Arquivo não encontrado.");
    }
    if (!stat.isFile()) {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      return response.end("Arquivo não encontrado.");
    }

    const type = MIME_TYPES.get(path.extname(filePath).toLowerCase()) || "application/octet-stream";
    response.writeHead(200, {
      "Content-Type": type,
      "Content-Length": stat.size,
      "Cache-Control": type.startsWith("text/html") ? "no-cache" : "public, max-age=300"
    });
    fs.createReadStream(filePath).pipe(response);
  }

  const server = http.createServer(async (request, response) => {
    applySecurityHeaders(response);
    const hostHeader = request.headers.host || `${host}:${listeningPort}`;
    const allowedOrigins = new Set([
      `http://${hostHeader}`,
      `http://127.0.0.1:${listeningPort}`,
      `http://localhost:${listeningPort}`
    ]);

    try {
      const url = new URL(request.url || "/", `http://${hostHeader}`);
      if (url.pathname.startsWith("/api/")) {
        await handleApi(request, response, url.pathname, allowedOrigins);
        return;
      }
      if (!new Set(["GET", "HEAD"]).has(request.method)) {
        response.writeHead(405, { Allow: "GET, HEAD" });
        response.end("Método não permitido.");
        return;
      }
      serveStatic(response, url.pathname);
    } catch (error) {
      const status = Number(error.statusCode) || 500;
      if (!response.headersSent) {
        sendJson(response, status, {
          error: status === 500 ? "Erro interno do servidor local." : error.message
        });
      } else {
        response.end();
      }
      if (status === 500) console.error(error);
    }
  });

  return {
    database,
    server,
    async start() {
      await new Promise((resolve, reject) => {
        server.once("error", reject);
        server.listen(configuredPort, host, () => {
          server.off("error", reject);
          resolve();
        });
      });
      listeningPort = server.address().port;
      return { host, port: listeningPort, url: `http://${host}:${listeningPort}` };
    },
    async close() {
      if (server.listening) {
        await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
      }
      database.close();
    }
  };
}

if (require.main === module) {
  const application = createApplication({
    port: process.env.SUZY_PORT ? Number(process.env.SUZY_PORT) : 8787
  });
  application.start().then(({ url }) => {
    console.log(`Suzy Command Center local: ${url}`);
    console.log(`Conta e autenticação: ${url}/login.html`);
    console.log("O servidor aceita conexões somente de 127.0.0.1.");
  }).catch(error => {
    console.error("Não foi possível iniciar o servidor local.", error);
    process.exitCode = 1;
  });

  const shutdown = async () => {
    await application.close();
    process.exit(0);
  };
  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);
}

module.exports = { createApplication };