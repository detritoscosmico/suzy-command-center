const fallbackAssets=[
{ticker:"EUR/USD (OTC)",name:"Euro / Dólar",price:1.08742,decimals:5,cat:"OTC",icon:"🇪🇺",pop:3,force:4},
{ticker:"GBP/USD (OTC)",name:"Libra / Dólar",price:1.27364,decimals:5,cat:"OTC",icon:"🇬🇧",pop:3,force:4},
{ticker:"USD/JPY (OTC)",name:"Dólar / Iene",price:159.9645,decimals:4,cat:"OTC",icon:"🇯🇵",pop:3,force:3},
{ticker:"US 500 (OTC)",name:"US 500",price:7572.723,decimals:3,cat:"OTC",icon:"🇺🇸",pop:3,force:4},
{ticker:"BTC/USD (OTC)",name:"Bitcoin / Dólar",price:67615.56,decimals:2,cat:"Cripto",icon:"₿",pop:3,force:4},
{ticker:"ETH/USD (OTC)",name:"Ethereum / Dólar",price:3542.28,decimals:2,cat:"Cripto",icon:"Ξ",pop:3,force:4},
{ticker:"XLM/USD (OTC)",name:"Stellar / Dólar",price:0.28416,decimals:5,cat:"Cripto",icon:"✦",pop:2,force:4},
{ticker:"SOL/USD (OTC)",name:"Solana / Dólar",price:166.5624,decimals:4,cat:"Cripto",icon:"◎",pop:3,force:4},
{ticker:"USD/DOP (OTC)",name:"Dólar / Peso Dominicano",price:58.50515,decimals:5,cat:"OTC",icon:"🇩🇴",pop:2,force:3},
{ticker:"USD/BDT (OTC)",name:"Dólar / Taka",price:122.9026,decimals:4,cat:"OTC",icon:"🇧🇩",pop:2,force:2},
{ticker:"USD/MYR (OTC)",name:"Dólar / Ringgit",price:4.070265,decimals:6,cat:"OTC",icon:"🇲🇾",pop:2,force:3},
{ticker:"USD/JPY",name:"Dólar / Iene",price:159.9645,decimals:4,cat:"Moedas",icon:"🇯🇵",pop:3,force:3},
{ticker:"USD/ARS (OTC)",name:"Dólar / Peso Argentino",price:1438.33,decimals:2,cat:"OTC",icon:"🇦🇷",pop:2,force:3},
{ticker:"USD/VND (OTC)",name:"Dólar / Dong",price:26338.12,decimals:2,cat:"OTC",icon:"🇻🇳",pop:2,force:3},
{ticker:"XAU/USD (OTC)",name:"Ouro / Dólar",price:4430.293,decimals:3,cat:"Commodities",icon:"🪙",pop:3,force:4},
{ticker:"AUS 200 (OTC)",name:"Australia 200",price:8617.186,decimals:3,cat:"Índice",icon:"🇦🇺",pop:2,force:4},
{ticker:"US 30 (OTC)",name:"US 30",price:51276.66,decimals:2,cat:"Índice",icon:"🇺🇸",pop:3,force:3},
{ticker:"GER 30",name:"Germany 30 (DAX)",price:24832.48,decimals:2,cat:"Índice",icon:"🇩🇪",pop:3,force:4},
{ticker:"Dollar Index",name:"Índice do Dólar",price:99.41421,decimals:5,cat:"Índice",icon:"💲",pop:2,force:4},
{ticker:"Pound Index",name:"Índice da Libra",price:135.5795,decimals:4,cat:"Índice",icon:"£",pop:2,force:3},
{ticker:"Australian Dollar Index",name:"Índice do Dólar Australiano",price:71.36179,decimals:5,cat:"Índice",icon:"A$",pop:2,force:4},
{ticker:"Euro Index",name:"Índice do Euro",price:117.7738,decimals:4,cat:"Índice",icon:"€",pop:2,force:3},
{ticker:"Canadian Dollar Index",name:"Índice do Dólar Canadense",price:72.69807,decimals:5,cat:"Índice",icon:"C$",pop:2,force:3},
{ticker:"Yen Index",name:"Índice do Iene",price:62.86132,decimals:5,cat:"Índice",icon:"¥",pop:2,force:4},
{ticker:"US 100",name:"US 100",price:30153.17,decimals:2,cat:"Índice",icon:"🇺🇸",pop:3,force:4},
{ticker:"US 500",name:"US 500",price:7553.49,decimals:2,cat:"Índice",icon:"🇺🇸",pop:3,force:3},
{ticker:"US 30",name:"US 30",price:51532.21,decimals:2,cat:"Índice",icon:"🇺🇸",pop:3,force:4},
{ticker:"JP 225",name:"Japan 225 (Nikkei)",price:66528.06,decimals:2,cat:"Índice",icon:"🇯🇵",pop:3,force:4},
{ticker:"UK 100",name:"UK 100",price:10354.85,decimals:2,cat:"Índice",icon:"🇬🇧",pop:3,force:4}
];

let assets=SuzyCore.normalizeCatalog(null,fallbackAssets);
const STORAGE_KEY="suzy-command-center-v2";
const defaultState={
 initialBank:10000,riskPct:1,stopLossPct:3,stopGainPct:5,maxOps:5,maxLosses:3,payoutPct:85,
 favorites:["EUR/USD (OTC)","BTC/USD (OTC)","XAU/USD (OTC)","USD/JPY"],operations:[]
};
let state=loadState();
let sortMode="default";
const $=id=>document.getElementById(id);

async function loadAssetCatalog(){
 if(window.location.protocol==="file:")return;
 try{
  const response=await fetch("dados/ativos.json",{cache:"no-store"});
  if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const payload=await response.json();
  const loaded=SuzyCore.normalizeCatalog(payload);
  if(!loaded.length)throw new Error("Catálogo sem ativos válidos.");
  assets=loaded;
  populateTradeAssets();
  renderAssets();
 }catch(error){
  console.warn("Catálogo JSON indisponível; usando catálogo local de segurança.",error);
 }
}

function loadState(){
 try{
  const saved=JSON.parse(localStorage.getItem(STORAGE_KEY));
  return saved?{...defaultState,...saved,favorites:Array.isArray(saved.favorites)?saved.favorites:defaultState.favorites,operations:Array.isArray(saved.operations)?saved.operations:[]}:structuredClone(defaultState);
 }catch(error){return structuredClone(defaultState);}
}
function saveState(){localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}
function money(value){return Number(value||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});}
function signedMoney(value){const amount=money(Math.abs(value));return value>0?`+${amount}`:value<0?`-${amount}`:amount;}
function todayKey(date=new Date()){return SuzyCore.localDateKey(date);}
function escapeHtml(value){return String(value??"").replace(/[&<>'"]/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#039;",'"':"&quot;"}[char]));}
function allPnl(){return state.operations.reduce((sum,op)=>sum+Number(op.pnl),0);}
function getStats(){return SuzyCore.calculateStats({operations:state.operations,initialBank:state.initialBank,dateKey:todayKey()});}
function getLimits(stats=getStats()){return SuzyCore.calculateLimits({balance:stats.balance,initialBank:state.initialBank,riskPct:state.riskPct,stopLossPct:state.stopLossPct,stopGainPct:state.stopGainPct});}
function getRiskState(amount=0){const stats=getStats();const limits=getLimits(stats);return SuzyCore.evaluateRisk({stats,limits,maxOps:state.maxOps,maxLosses:state.maxLosses,amount,formatMoney:money});}

function renderAssets(){
 const term=$("searchInput").value.trim().toLowerCase();
 const category=$("categoryFilter").value;
 let list=assets.filter(asset=>{
  const textMatch=asset.ticker.toLowerCase().includes(term)||asset.name.toLowerCase().includes(term);
  const favorite=state.favorites.includes(asset.ticker);
  const categoryMatch=category==="Todos"||(category==="Favoritos"&&favorite)||(category==="OTC"&&asset.ticker.includes("(OTC)"))||asset.cat===category;
  return textMatch&&categoryMatch;
 });
 if(sortMode==="popular")list=[...list].sort((a,b)=>b.pop-a.pop||b.force-a.force);
 if(sortMode==="volatility")list=[...list].sort((a,b)=>b.force-a.force||b.pop-a.pop);
 $("assetsBody").innerHTML=list.length?list.map(asset=>{
  const favorite=state.favorites.includes(asset.ticker);
  const change=asset.change??0;
  return`<tr>
   <td><div class="asset-cell"><span class="flag">${asset.icon}</span>${escapeHtml(asset.ticker)}</div></td>
   <td>${escapeHtml(asset.name)}</td><td>${asset.price.toFixed(asset.decimals)}</td>
   <td class="${change>=0?'green':'red'}">${change>=0?'+':''}${change.toFixed(2)}%</td>
   <td class="popular">${"🔥".repeat(asset.pop)}</td>
   <td class="force">${[1,2,3,4].map(i=>`<span class="${i<=asset.force?'on':''}" style="height:${8+i*4}px"></span>`).join("")}</td>
   <td><div class="asset-actions"><button class="star ${favorite?'on':''}" data-favorite="${escapeHtml(asset.ticker)}" title="Favoritar">★</button><button class="trade-shortcut" data-trade="${escapeHtml(asset.ticker)}">Operar demo</button></div></td>
  </tr>`;
 }).join(""):`<tr><td colspan="7" class="empty-row">Nenhum ativo encontrado.</td></tr>`;
 document.querySelectorAll("[data-favorite]").forEach(button=>button.onclick=()=>toggleFavorite(button.dataset.favorite));
 document.querySelectorAll("[data-trade]").forEach(button=>button.onclick=()=>openTrade(button.dataset.trade));
}
function toggleFavorite(ticker){state.favorites=state.favorites.includes(ticker)?state.favorites.filter(item=>item!==ticker):[...state.favorites,ticker];saveState();renderAssets();}
function populateTradeAssets(){const selected=$("tradeAsset").value;$("tradeAsset").innerHTML=assets.map(asset=>`<option value="${escapeHtml(asset.ticker)}">${asset.icon} ${escapeHtml(asset.ticker)}</option>`).join("");if(selected&&assets.some(asset=>asset.ticker===selected))$("tradeAsset").value=selected;}
function openTrade(ticker){populateTradeAssets();$("tradeAsset").value=ticker;navigate("operations");$("tradeAmount").focus();}
function renderStats(){
 const stats=getStats();const limits=getLimits(stats);const risk=getRiskState(Number($("tradeAmount").value||0));
 const pnlClass=stats.dailyPnl>0?"green":stats.dailyPnl<0?"red":"";
 $("balanceCard").textContent=money(stats.balance);$("pnlCard").textContent=signedMoney(stats.dailyPnl);$("pnlCard").className=pnlClass;
 $("opsCard").textContent=`${stats.total} / ${state.maxOps}`;$("winrateCard").textContent=`${stats.winrate}%`;
 $("sideBalance").textContent=money(stats.balance);$("sidePnl").textContent=signedMoney(stats.dailyPnl);$("sidePnl").className=pnlClass;
 $("sideOps").textContent=stats.total;$("sideWinrate").textContent=`${stats.winrate}%`;
 $("missionGain").textContent=money(limits.stopGain);$("missionLoss").textContent=`-${money(limits.stopLoss)}`;$("missionMaxOps").textContent=state.maxOps;
 $("maxEntryRule").textContent=money(limits.maxEntry);$("stopLossRule").textContent=money(limits.stopLoss);$("stopGainRule").textContent=money(limits.stopGain);$("lossStreakRule").textContent=`${stats.lossStreak} / ${state.maxLosses}`;
 const mission=risk.blocked?risk.reason:"STATUS ATIVO";$("missionStatus").textContent=mission;$("missionStatus").className=risk.blocked?"red":"green";
 $("riskBanner").textContent=risk.blocked?`Bloqueado: ${risk.reason}`:"Suzy pronta. Respeite as regras da missão.";$("riskBanner").className=`risk-banner ${risk.blocked?'blocked':'ok'}`;
 $("registerWin").disabled=risk.blocked;$("registerLoss").disabled=risk.blocked;
 renderProgress(stats,limits);renderAdvice(stats,limits,risk);renderRecent(stats);renderReport();
}
function renderProgress(stats,limits){const pct=limits.stopGain?Math.max(0,Math.min(100,stats.dailyPnl/limits.stopGain*100)):0;$("missionProgress").style.width=`${pct}%`;$("progressText").textContent=`${signedMoney(stats.dailyPnl)} de ${money(limits.stopGain)}`;}
function renderAdvice(stats,limits,risk){let advice="Danilo, comece devagar. O primeiro objetivo é não perder o controle.";if(risk.blocked)advice=`Pare agora. ${risk.reason}`;else if(stats.lossStreak>=2)advice="Duas perdas seguidas. Reduza estímulos, revise o setup e não tente recuperar no impulso.";else if(stats.dailyPnl>0&&stats.dailyPnl>=limits.stopGain*.7)advice="Você está perto da meta. Proteja o resultado; não aumente a mão.";else if(stats.total>=Math.ceil(state.maxOps*.7))advice="Você já consumiu boa parte do limite de operações. Seja seletivo.";$("suzyAdvice").textContent=advice;}
function renderRecent(stats=getStats()){const items=[...stats.daily].reverse().slice(0,5);$("recentOps").innerHTML=items.length?items.map(op=>`<li><span>${op.direction==='CALL'?'↗':'↘'} ${escapeHtml(op.asset)}</span><strong class="${op.result==='WIN'?'green':'red'}">${op.result}</strong><small>${escapeHtml(op.time)}</small></li>`).join(""):`<li class="empty-state">Nenhuma operação registrada.</li>`;}
function renderReport(){const all=[...state.operations].reverse();const total=state.operations.length;const wins=state.operations.filter(op=>op.result==="WIN").length;const losses=total-wins;const pnl=allPnl();$("reportTotal").textContent=total;$("reportWins").textContent=wins;$("reportLosses").textContent=losses;$("reportPnl").textContent=signedMoney(pnl);$("reportPnl").className=pnl>0?"green":pnl<0?"red":"";$("reportBody").innerHTML=all.length?all.map(op=>`<tr><td>${escapeHtml(op.dateLabel)}</td><td>${escapeHtml(op.asset)}</td><td>${op.direction}</td><td>${escapeHtml(op.setup)}</td><td>${money(op.amount)}</td><td class="${op.result==='WIN'?'green':'red'}">${op.result}</td><td class="${op.pnl>=0?'green':'red'}">${signedMoney(op.pnl)}</td><td>${escapeHtml(op.reason)}</td></tr>`).join(""):`<tr><td colspan="8" class="empty-row">Nenhuma operação registrada.</td></tr>`;}
function registerOperation(result){const amount=Number($("tradeAmount").value);const risk=getRiskState(amount);if(risk.blocked){$("tradeFeedback").textContent=risk.reason;renderStats();return;}const now=new Date();const pnl=result==="WIN"?amount*(state.payoutPct/100):-amount;const operation={id:crypto.randomUUID?crypto.randomUUID():String(Date.now()),dateKey:todayKey(now),dateLabel:now.toLocaleString("pt-BR"),time:now.toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"}),asset:$("tradeAsset").value,direction:$("tradeDirection").value,setup:$("tradeSetup").value,amount,result,pnl:Number(pnl.toFixed(2)),reason:$("tradeReason").value.trim()||"Sem observação"};state.operations.push(operation);saveState();$("tradeReason").value="";$("tradeFeedback").textContent=`${result} registrado: ${signedMoney(operation.pnl)}.`;renderStats();speak(result==="WIN"?"Win registrado. Sem euforia: continue dentro do plano.":"Loss registrado. Não aumente a mão e não tente vingança.");}
function exportCsv(){
 if(!state.operations.length){alert("Não há operações para exportar.");return;}
 const header=["data","ativo","direcao","setup","valor","resultado","pnl","motivo"];
 const rows=state.operations.map(op=>[op.dateLabel,op.asset,op.direction,op.setup,op.amount,op.result,op.pnl,op.reason]);
 const csv=SuzyCore.serializeCsv([header,...rows]);
 const blob=new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8"});const url=URL.createObjectURL(blob);const link=document.createElement("a");link.href=url;link.download=`suzy-relatorio-${todayKey()}.csv`;link.click();URL.revokeObjectURL(url);
}
function resetOperations(){if(confirm("Apagar todas as operações registradas neste navegador?")){state.operations=[];saveState();renderStats();$("tradeFeedback").textContent="Histórico limpo.";}}
function fillMissionForm(){$("cfgBank").value=state.initialBank;$("cfgRisk").value=state.riskPct;$("cfgStopLoss").value=state.stopLossPct;$("cfgStopGain").value=state.stopGainPct;$("cfgMaxOps").value=state.maxOps;$("cfgMaxLosses").value=state.maxLosses;}
function saveMission(){const next={initialBank:Number($("cfgBank").value),riskPct:Number($("cfgRisk").value),stopLossPct:Number($("cfgStopLoss").value),stopGainPct:Number($("cfgStopGain").value),maxOps:Number($("cfgMaxOps").value),maxLosses:Number($("cfgMaxLosses").value)};if(next.initialBank<100||next.riskPct<=0||next.riskPct>5||next.stopLossPct<=0||next.stopGainPct<=0||next.maxOps<1||next.maxLosses<1){$("missionFeedback").textContent="Revise os valores. Risco por entrada deve ficar entre 0,1% e 5%.";return;}Object.assign(state,next);saveState();$("missionFeedback").textContent="Missão salva com sucesso.";renderStats();speak("Missão diária atualizada. As novas travas de risco já estão ativas.");}
const viewMeta={assets:["Painel de Ativos","Cotações e indicadores demonstrativos para treinamento."],operations:["Operações Demo","Registre resultados manuais com travas de gestão de risco."],reports:["Relatórios","Analise o histórico salvo neste navegador."],mission:["Centro de Missão","Defina banca, limites e disciplina operacional."]};
function navigate(view){document.querySelectorAll(".view").forEach(section=>section.classList.remove("active"));document.querySelectorAll(".nav[data-view]").forEach(button=>button.classList.toggle("active",button.dataset.view===view));$(`${view}View`).classList.add("active");$("pageTitle").textContent=viewMeta[view][0];$("pageSubtitle").textContent=viewMeta[view][1];$("sidebar").classList.remove("open");if(view==="operations")renderStats();if(view==="mission")fillMissionForm();}
function speak(text){if(!("speechSynthesis" in window)){alert("A voz não é suportada neste navegador.");return;}speechSynthesis.cancel();const utterance=new SpeechSynthesisUtterance(text||getSuzyBrief());utterance.lang="pt-BR";utterance.rate=.95;speechSynthesis.speak(utterance);}
function getSuzyBrief(){const stats=getStats();const risk=getRiskState(Number($("tradeAmount").value||100));return risk.blocked?`Danilo, operações bloqueadas. ${risk.reason}`:`Danilo, saldo demo em ${money(stats.balance)}. Resultado do dia ${signedMoney(stats.dailyPnl)}. Você realizou ${stats.total} operações com ${stats.winrate} por cento de acerto.`;}
function updateClock(){const now=new Date();$("today").textContent=now.toLocaleDateString("pt-BR");$("clock").textContent=now.toLocaleTimeString("pt-BR");}
function simulateQuotes(){assets.forEach(asset=>{const move=(Math.random()-.5)*.08;asset.change=Number(((asset.change||0)*.65+move).toFixed(2));asset.price=Math.max(.00001,asset.price*(1+move/100));});renderAssets();}
function initialize(){populateTradeAssets();fillMissionForm();renderAssets();renderStats();updateClock();loadAssetCatalog();}
$("searchInput").addEventListener("input",renderAssets);$("categoryFilter").addEventListener("change",renderAssets);$("popularBtn").onclick=()=>{sortMode=sortMode==="popular"?"default":"popular";renderAssets();};$("volBtn").onclick=()=>{sortMode=sortMode==="volatility"?"default":"volatility";renderAssets();};$("tradeAmount").addEventListener("input",renderStats);$("registerWin").onclick=()=>registerOperation("WIN");$("registerLoss").onclick=()=>registerOperation("LOSS");$("exportCsv").onclick=exportCsv;$("resetOps").onclick=resetOperations;$("saveMission").onclick=saveMission;$("voiceBtn").onclick=()=>speak();$("menuBtn").onclick=()=>$("sidebar").classList.toggle("open");document.querySelectorAll(".nav[data-view]").forEach(button=>button.onclick=()=>navigate(button.dataset.view));document.querySelectorAll("[data-go]").forEach(button=>button.onclick=()=>navigate(button.dataset.go));initialize();setInterval(updateClock,1000);setInterval(simulateQuotes,8000);
