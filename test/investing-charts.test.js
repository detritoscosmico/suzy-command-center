const test = require("node:test");
const assert = require("node:assert/strict");
const {
  WIDGET_ORIGIN,
  DEFAULT_CONFIG,
  buildWidgetUrl,
  mountInvestingChart
} = require("../js/investing-charts.js");

test("gera URL HTTPS do widget oficial do Investing.com Brasil", () => {
  const url = new URL(buildWidgetUrl());

  assert.equal(url.origin, WIDGET_ORIGIN);
  assert.equal(url.protocol, "https:");
  assert.equal(url.searchParams.get("domain_ID"), String(DEFAULT_CONFIG.domainId));
  assert.equal(url.searchParams.get("lang_ID"), String(DEFAULT_CONFIG.languageId));
  assert.equal(url.searchParams.get("timezone_ID"), String(DEFAULT_CONFIG.timezoneId));
  assert.equal(url.searchParams.get("pair_ID"), "1");
  assert.equal(url.searchParams.get("plotStyle"), "candles");
});

test("aceita somente dimensões, intervalos e estilos previstos", () => {
  const customized = new URL(buildWidgetUrl({
    pairId:945629,
    width:960,
    height:720,
    interval:"week",
    plotStyle:"area"
  }));
  assert.equal(customized.searchParams.get("pair_ID"), "945629");
  assert.equal(customized.searchParams.get("width"), "960");
  assert.equal(customized.searchParams.get("height"), "720");
  assert.equal(customized.searchParams.get("interval"), "week");
  assert.equal(customized.searchParams.get("plotStyle"), "area");

  const rejected = new URL(buildWidgetUrl({
    pairId:"1&domain_ID=1",
    width:999999,
    height:-1,
    interval:"javascript:alert(1)",
    plotStyle:"<script>"
  }));
  assert.equal(rejected.searchParams.get("pair_ID"), String(DEFAULT_CONFIG.pairId));
  assert.equal(rejected.searchParams.get("width"), "1900");
  assert.equal(rejected.searchParams.get("height"), "320");
  assert.equal(rejected.searchParams.get("interval"), String(DEFAULT_CONFIG.interval));
  assert.equal(rejected.searchParams.get("plotStyle"), DEFAULT_CONFIG.plotStyle);
  assert.equal(rejected.searchParams.getAll("domain_ID").length, 1);
});

test("monta um único iframe restrito somente após chamada explícita", t => {
  const previousDocument = global.document;
  t.after(() => { global.document = previousDocument; });
  global.document = {
    createElement(tagName) {
      return {
        tagName: tagName.toUpperCase(),
        attributes: {},
        setAttribute(name, value) { this.attributes[name] = value; }
      };
    }
  };
  const mount = {
    hidden: true,
    children: [],
    querySelector(selector) { return selector === "iframe" ? this.children.find(child => child.tagName === "IFRAME") : null; },
    getBoundingClientRect() { return { width: 960 }; },
    appendChild(child) { this.children.push(child); }
  };
  const button = { disabled: false, textContent: "CARREGAR GRÁFICO" };
  const status = { textContent: "Nenhum conteúdo externo foi carregado." };

  assert.equal(mountInvestingChart({ mount, button, status }), true);
  assert.equal(mount.hidden, false);
  assert.equal(mount.children.length, 1);
  assert.equal(new URL(mount.children[0].src).searchParams.get("width"), "960");
  assert.match(mount.children[0].attributes.sandbox, /allow-scripts/);
  assert.equal(button.disabled, true);
  assert.match(status.textContent, /Conteúdo externo carregado/);
  assert.equal(mountInvestingChart({ mount, button, status }), false);
  assert.equal(mount.children.length, 1);
});
