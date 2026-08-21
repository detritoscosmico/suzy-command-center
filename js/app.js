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
{ticker:"TSLA",name:"Tesla",price:336.45,decimals:2,cat:"Ações",icon:"🇺🇸",pop:3,force:4},
{ticker:"GS",name:"Goldman Sachs",price:745.20,decimals:2,cat:"Ações",icon:"🇺🇸",pop:3,force:3},
{ticker:"AAPL",name:"Apple",price:276.85,decimals:2,cat:"Ações",icon:"🇺🇸",pop:3,force:4},
{ticker:"AA",name:"Alcoa",price:48.30,decimals:2,cat:"Ações",icon:"🇺🇸",pop:2,force:3},
{ticker:"MSFT",name:"Microsoft",price:561.40,decimals:2,cat:"Ações",icon:"🇺🇸",pop:3,force:4},
{ticker:"AMZN",name:"Amazon",price:244.75,decimals:2,cat:"Ações",icon:"🇺🇸",pop:3,force:4},
{ticker:"GOOGL",name:"Alphabet (Google)",price:221.60,decimals:2,cat:"Ações",icon:"🇺🇸",pop:3,force:4},
{ticker:"NVDA",name:"Nvidia",price:193.25,decimals:2,cat:"Ações",icon:"🇺🇸",pop:3,force:4},
{ticker:"BAC",name:"Bank of America",price:52.40,decimals:2,cat:"Ações",icon:"🇺🇸",pop:3,force:3},
{ticker:"VALE3",name:"Vale",price:63.80,decimals:2,cat:"Ações",icon:"🇧🇷",pop:3,force:4},
{ticker:"WEGE3",name:"WEG",price:49.70,decimals:2,cat:"Ações",icon:"🇧🇷",pop:3,force:4},
{ticker:"PETR4",name:"Petrobras",price:37.55,decimals:2,cat:"Ações",icon:"🇧🇷",pop:3,force:4},
{ticker:"JPM",name:"JPMorgan Chase",price:310.90,decimals:2,cat:"Ações",icon:"🇺🇸",pop:3,force:4},
{ticker:"META",name:"Meta Platforms",price:780.60,decimals:2,cat:"Ações",icon:"🇺🇸",pop:3,force:4},
{ticker:"BRK.B",name:"Berkshire Hathaway",price:512.30,decimals:2,cat:"Ações",icon:"🇺🇸",pop:3,force:3},
{ticker:"KO",name:"Coca-Cola",price:78.20,decimals:2,cat:"Ações",icon:"🇺🇸",pop:3,force:3},
{ticker:"WMT",name:"Walmart",price:119.45,decimals:2,cat:"Ações",icon:"🇺🇸",pop:3,force:3},
{ticker:"XOM",name:"Exxon Mobil",price:126.80,decimals:2,cat:"Ações",icon:"🇺🇸",pop:3,force:3},
{ticker:"ITUB4",name:"Itaú Unibanco",price:41.65,decimals:2,cat:"Ações",icon:"🇧🇷",pop:3,force:3},
{ticker:"ABEV3",name:"Ambev",price:14.25,decimals:2,cat:"Ações",icon:"🇧🇷",pop:3,force:3},
{ticker:"ASML",name:"ASML Holding",price:1035.40,decimals:2,cat:"Ações",icon:"🇳🇱",pop:3,force:4},
{ticker:"SAP",name:"SAP",price:345.70,decimals:2,cat:"Ações",icon:"🇩🇪",pop:3,force:3},
{ticker:"TM",name:"Toyota Motor",price:215.90,decimals:2,cat:"Ações",icon:"🇯🇵",pop:3,force:3},
{ticker:"SHEL",name:"Shell",price:78.60,decimals:2,cat:"Ações",icon:"🇬🇧",pop:3,force:3},
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
const VOICE_STORAGE_KEY="suzy-voice-profile-v1";
const defaultState={
 initialBank:10000,riskPct:1,stopLossPct:3,stopGainPct:5,maxOps:5,maxLosses:3,payoutPct:85,
 favorites:["EUR/USD (OTC)","BTC/USD (OTC)","XAU/USD (OTC)","USD/JPY"],operations:[]
};
let state=loadState();
let sortMode="default";
let chartCandles=[];
let chartDrawings=[];
let drawingTool="cursor";
let pendingDrawingPoint=null;
let chartKeyboardPoint={x:.5,y:.5};
const chartIndicators={ema:true,sma:false,bollinger:false,rsi:true};
const $=id=>document.getElementById(id);
let selectedVoiceProfile=loadVoiceProfile();

function loadVoiceProfile(){
 try{return SuzyVoiceCore.normalizeProfileId(localStorage.getItem(VOICE_STORAGE_KEY));}
 catch(error){return "natural";}
}

function saveVoiceProfile(profileId){
 selectedVoiceProfile=SuzyVoiceCore.normalizeProfileId(profileId);
 try{localStorage.setItem(VOICE_STORAGE_KEY,selectedVoiceProfile);}catch(error){}
 return selectedVoiceProfile;
}

function setVoiceStatus(message){
 const status=$("voiceStatus");
 if(status)status.textContent=message;
}

function currentSpeechSettings(){
 const voices=typeof speechSynthesis?.getVoices==="function"?speechSynthesis.getVoices():[];
 return SuzyVoiceCore.createSpeechSettings(selectedVoiceProfile,voices);
}

function renderVoiceSelection(message){
 const profile=SuzyVoiceCore.getProfile(selectedVoiceProfile);
 $("voiceProfile").value=profile.id;
 setVoiceStatus(message||`Voz ${profile.label} selecionada: ${profile.description}.`);
}

function initializeVoiceControl(){
 const supported="speechSynthesis" in window&&"SpeechSynthesisUtterance" in window;
 $("voiceProfile").disabled=!supported;
 $("voiceBtn").disabled=!supported;
 if(!supported){setVoiceStatus("A voz da Suzy não é suportada neste navegador.");return;}
 renderVoiceSelection();
 if(typeof speechSynthesis.addEventListener==="function")speechSynthesis.addEventListener("voiceschanged",()=>renderVoiceSelection());
}

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
  populateChartAssets();
  renderAssets();
  renderScanner();
  generateChartScenario();
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
function renderScanner(){
 const list=SuzyCore.analyzeDemoAssets(assets,{category:$("scannerCategory").value,minForce:Number($("scannerMinForce").value),limit:Number($("scannerLimit").value)});
 const counts={UP:0,DOWN:0,WAIT:0};list.forEach(item=>counts[item.direction]++);
 $("scannerTotal").textContent=list.length;$("scannerUp").textContent=counts.UP;$("scannerDown").textContent=counts.DOWN;$("scannerWait").textContent=counts.WAIT;
 const directionMeta={UP:{label:"ALTA DEMO",className:"green",icon:"↗"},DOWN:{label:"BAIXA DEMO",className:"red",icon:"↘"},WAIT:{label:"AGUARDAR",className:"orange",icon:"—"}};
 $("scannerBody").innerHTML=list.length?list.map((asset,index)=>{const meta=directionMeta[asset.direction];return`<tr>
  <td><strong>${index+1}</strong></td><td><div class="asset-cell"><span class="flag">${asset.icon}</span>${escapeHtml(asset.ticker)}</div></td><td>${escapeHtml(asset.cat)}</td>
  <td class="${asset.change>0?'green':asset.change<0?'red':''}">${asset.change>=0?'+':''}${asset.change.toFixed(2)}%</td>
  <td class="force">${[1,2,3,4].map(i=>`<span class="${i<=asset.force?'on':''}" style="height:${8+i*4}px"></span>`).join("")}</td>
  <td><strong class="${meta.className}">${meta.icon} ${meta.label}</strong></td><td><span class="scanner-score">${asset.score}</span></td>
  <td><button class="trade-shortcut" data-scanner-trade="${escapeHtml(asset.ticker)}">Abrir no demo</button></td></tr>`;}).join(""):`<tr><td colspan="8" class="empty-row">Nenhum ativo atende aos filtros escolhidos.</td></tr>`;
 document.querySelectorAll("[data-scanner-trade]").forEach(button=>button.onclick=()=>openTrade(button.dataset.scannerTrade));
 $("scannerUpdated").textContent=`Última análise demo: ${new Date().toLocaleTimeString("pt-BR")}`;
}
function populateChartAssets(){
 const selected=$("chartAsset").value;
 $("chartAsset").innerHTML=assets.map(asset=>`<option value="${escapeHtml(asset.ticker)}">${asset.icon} ${escapeHtml(asset.ticker)}</option>`).join("");
 if(selected&&assets.some(asset=>asset.ticker===selected))$("chartAsset").value=selected;
}
function selectedChartAsset(){return assets.find(asset=>asset.ticker===$("chartAsset").value)||assets[0];}
function chartPrice(value,asset=selectedChartAsset()){return Number(value).toFixed(Math.min(asset?.decimals??2,6));}
function chartTimeframeDuration(){return SuzyCore.timeframeDuration($("chartTimeframe").value);}
function chartDisplayedSpan(){return chartCandles.length>1?chartCandles.at(-1).time-chartCandles[0].time:0;}
function formatChartTimestamp(time){const mode=SuzyCore.chartTimeLabelMode(chartTimeframeDuration(),chartDisplayedSpan());const date=new Date(time);if(mode==="DATE_YEAR")return date.toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit",year:"2-digit"});if(mode==="DATE")return date.toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit"});if(mode==="DATE_TIME")return date.toLocaleString("pt-BR",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"});return date.toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit",second:mode==="TIME_SECONDS"?"2-digit":undefined});}
function generateChartScenario(){
 const asset=selectedChartAsset();if(!asset)return;
 chartCandles=SuzyCore.generateDemoCandles({basePrice:asset.price,count:80,timeframeCode:$("chartTimeframe").value,intervalMilliseconds:chartTimeframeDuration()});
 chartDrawings=[];pendingDrawingPoint=null;chartKeyboardPoint={x:.5,y:.5};
 renderCandleChart();
}
function drawChartSeries(ctx,values,color,geometry,options={}){
 const {margin,step,y}=geometry;ctx.save();ctx.strokeStyle=color;ctx.lineWidth=options.width||1.7;ctx.setLineDash(options.dash||[]);ctx.beginPath();let started=false;
 values.forEach((value,index)=>{if(value===null||!Number.isFinite(Number(value)))return;const x=margin.left+step*index+step/2;const py=y(value);if(!started){ctx.moveTo(x,py);started=true;}else ctx.lineTo(x,py);});if(started)ctx.stroke();ctx.restore();
}
function drawManualLines(ctx,geometry){
 const {margin,plotWidth,plotHeight}=geometry;ctx.save();ctx.strokeStyle="#f8fafc";ctx.lineWidth=1.5;ctx.setLineDash([7,5]);
 chartDrawings.forEach(drawing=>{ctx.beginPath();ctx.moveTo(margin.left+drawing.from.x*plotWidth,margin.top+drawing.from.y*plotHeight);ctx.lineTo(margin.left+drawing.to.x*plotWidth,margin.top+drawing.to.y*plotHeight);ctx.stroke();});ctx.restore();
}
function renderRsiChart(){
 const shell=$("rsiShell");shell.classList.toggle("hidden",!chartIndicators.rsi);if(!chartIndicators.rsi)return;
 const canvas=$("rsiChart");const width=Math.max(1,Math.floor(canvas.parentElement.clientWidth));const height=130;const ratio=Math.min(window.devicePixelRatio||1,2);canvas.width=width*ratio;canvas.height=height*ratio;canvas.style.width=`${width}px`;canvas.style.height=`${height}px`;
 const ctx=canvas.getContext("2d");ctx.scale(ratio,ratio);ctx.fillStyle="#06101d";ctx.fillRect(0,0,width,height);const margin={top:12,right:48,bottom:16,left:16};const plotHeight=height-margin.top-margin.bottom;const plotWidth=width-margin.left-margin.right;const y=value=>margin.top+(100-value)/100*plotHeight;
 ctx.font="10px Segoe UI";ctx.fillStyle="#8fa4bd";ctx.strokeStyle="rgba(143,164,189,.25)";[30,50,70].forEach(level=>{ctx.beginPath();ctx.moveTo(margin.left,y(level));ctx.lineTo(width-margin.right,y(level));ctx.stroke();ctx.fillText(String(level),width-margin.right+8,y(level)+3);});
 const values=SuzyCore.calculateRsi(chartCandles.map(candle=>candle.close),14);const step=plotWidth/chartCandles.length;ctx.strokeStyle="#38bdf8";ctx.lineWidth=1.8;ctx.beginPath();let started=false;values.forEach((value,index)=>{if(value===null)return;const x=margin.left+step*index+step/2;if(!started){ctx.moveTo(x,y(value));started=true;}else ctx.lineTo(x,y(value));});if(started)ctx.stroke();const last=values.filter(value=>value!==null).at(-1);$("rsiValue").textContent=last===undefined?"—":last.toFixed(1);
}
function renderPatternSummary(patterns,flag){
 const recent=patterns.filter(pattern=>pattern.index>=chartCandles.length-12).slice(-8);$("candlePatterns").innerHTML=recent.length?recent.map(pattern=>`<span class="pattern-chip ${pattern.bias.toLowerCase()}">${escapeHtml(pattern.label)} • vela ${pattern.index+1}</span>`).join(""):"Nenhum padrão recente.";
 $("flagPattern").textContent=flag?flag.label:"Não identificada";$("flagPattern").className=flag?(flag.bias==="BULLISH"?"green":"red"):"orange";
}
function renderCandleChart(){
 const canvas=$("candleChart");const asset=selectedChartAsset();if(!canvas||!asset||!chartCandles.length)return;
 const width=Math.max(1,Math.floor(canvas.parentElement.clientWidth));const height=480;const ratio=Math.min(window.devicePixelRatio||1,2);
 canvas.width=width*ratio;canvas.height=height*ratio;canvas.style.width=`${width}px`;canvas.style.height=`${height}px`;
 const ctx=canvas.getContext("2d");ctx.scale(ratio,ratio);ctx.clearRect(0,0,width,height);ctx.fillStyle="#06101d";ctx.fillRect(0,0,width,height);
 const margin={top:22,right:76,bottom:34,left:16};const plotWidth=Math.max(1,width-margin.left-margin.right);const plotHeight=height-margin.top-margin.bottom;const closes=chartCandles.map(candle=>candle.close);const bands=chartIndicators.bollinger?SuzyCore.calculateBollinger(closes,20,2):null;const overlayValues=bands?[...bands.upper,...bands.lower].filter(value=>value!==null&&Number.isFinite(Number(value))):[];
 const highest=Math.max(...chartCandles.map(candle=>candle.high),...overlayValues);const lowest=Math.min(...chartCandles.map(candle=>candle.low),...overlayValues);const padding=(highest-lowest||highest*.01)*.08;const max=highest+padding;const min=lowest-padding;
 const y=value=>margin.top+(max-value)/(max-min)*plotHeight;const step=plotWidth/chartCandles.length;const bodyWidth=Math.max(2,Math.min(9,step*.62));const geometry={margin,plotWidth,plotHeight,y,step};
 ctx.strokeStyle="rgba(143,164,189,.16)";ctx.lineWidth=1;ctx.fillStyle="#8fa4bd";ctx.font="11px Segoe UI";ctx.textAlign="left";
 for(let line=0;line<=5;line++){const py=margin.top+plotHeight/5*line;ctx.beginPath();ctx.moveTo(margin.left,py);ctx.lineTo(width-margin.right,py);ctx.stroke();const price=max-(max-min)/5*line;ctx.fillText(chartPrice(price,asset),width-margin.right+8,py+4);}
 chartCandles.forEach((candle,index)=>{const x=margin.left+step*index+step/2;const rising=candle.close>=candle.open;const color=rising?"#22e582":"#ff5c5c";ctx.strokeStyle=color;ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(x,y(candle.high));ctx.lineTo(x,y(candle.low));ctx.stroke();const top=y(Math.max(candle.open,candle.close));const bottom=y(Math.min(candle.open,candle.close));ctx.fillRect(x-bodyWidth/2,top,bodyWidth,Math.max(1,bottom-top));});
 if(bands){ctx.save();ctx.fillStyle="rgba(167,139,250,.08)";ctx.beginPath();bands.upper.forEach((value,index)=>{if(value===null)return;const x=margin.left+step*index+step/2;if(index===19)ctx.moveTo(x,y(value));else ctx.lineTo(x,y(value));});for(let index=bands.lower.length-1;index>=0;index-=1){if(bands.lower[index]!==null)ctx.lineTo(margin.left+step*index+step/2,y(bands.lower[index]));}ctx.closePath();ctx.fill();ctx.restore();drawChartSeries(ctx,bands.upper,"#a78bfa",geometry,{width:1});drawChartSeries(ctx,bands.lower,"#a78bfa",geometry,{width:1});}
 if(chartIndicators.ema){drawChartSeries(ctx,SuzyCore.calculateEma(closes,9),"#38bdf8",geometry);drawChartSeries(ctx,SuzyCore.calculateEma(closes,21),"#ff5ec7",geometry);}
 if(chartIndicators.sma)drawChartSeries(ctx,SuzyCore.calculateSma(closes,50),"#facc15",geometry,{width:1.8});
 const patterns=SuzyCore.detectCandlePatterns(chartCandles);patterns.filter(pattern=>pattern.index>=chartCandles.length-12).slice(-6).forEach(pattern=>{const candle=chartCandles[pattern.index];const x=margin.left+step*pattern.index+step/2;ctx.fillStyle=pattern.bias==="BULLISH"?"#22e582":pattern.bias==="BEARISH"?"#ff5c5c":"#ff981a";ctx.font="bold 10px Segoe UI";ctx.textAlign="center";ctx.fillText("◆",x,Math.max(margin.top+10,y(candle.high)-7));});
 drawManualLines(ctx,geometry);if(drawingTool!=="cursor"&&document.activeElement===canvas){const cursorX=margin.left+chartKeyboardPoint.x*plotWidth;const cursorY=margin.top+chartKeyboardPoint.y*plotHeight;ctx.save();ctx.strokeStyle="#facc15";ctx.setLineDash([3,3]);ctx.beginPath();ctx.moveTo(cursorX-8,cursorY);ctx.lineTo(cursorX+8,cursorY);ctx.moveTo(cursorX,cursorY-8);ctx.lineTo(cursorX,cursorY+8);ctx.stroke();ctx.restore();}ctx.fillStyle="#8fa4bd";ctx.textAlign="center";for(let index=0;index<chartCandles.length;index+=20){const candle=chartCandles[index];ctx.fillText(formatChartTimestamp(candle.time),margin.left+step*index+step/2,height-12);}
 const last=chartCandles.at(-1);const ema9=SuzyCore.calculateEma(chartCandles.map(candle=>candle.close),9).at(-1);const ema21=SuzyCore.calculateEma(chartCandles.map(candle=>candle.close),21).at(-1);
 $("chartOpen").textContent=chartPrice(last.open,asset);$("chartHigh").textContent=chartPrice(last.high,asset);$("chartLow").textContent=chartPrice(last.low,asset);$("chartClose").textContent=chartPrice(last.close,asset);
 const trend=last.close>ema9&&ema9>ema21?{label:"ALTA DEMO",className:"green"}:last.close<ema9&&ema9<ema21?{label:"BAIXA DEMO",className:"red"}:{label:"LATERAL",className:"orange"};$("chartTrend").textContent=trend.label;$("chartTrend").className=trend.className;
 renderRsiChart();renderPatternSummary(patterns,SuzyCore.detectFlagPattern(chartCandles));
 $("chartUpdated").textContent=`${asset.ticker} • ${$("chartTimeframe").selectedOptions[0].text} • cenário gerado às ${new Date().toLocaleTimeString("pt-BR")}`;
}
function setDrawingTool(tool){drawingTool=tool;pendingDrawingPoint=null;document.querySelectorAll("[data-drawing-tool]").forEach(button=>{const active=button.dataset.drawingTool===tool;button.classList.toggle("active",active);button.setAttribute("aria-pressed",String(active));});$("candleChart").parentElement.classList.toggle("cursor-mode",tool==="cursor");$("drawingHelp").textContent=tool==="trend"?"Clique em dois pontos para traçar uma linha de tendência.":tool==="horizontal"?"Clique no nível desejado para traçar suporte ou resistência.":"Selecione Tendência ou Horizontal para desenhar diretamente no gráfico.";}
function chartCanvasPoint(event){const canvas=$("candleChart");const rect=canvas.getBoundingClientRect();const margin={top:22,right:76,bottom:34,left:16};const width=rect.width;const height=rect.height;const plotWidth=width-margin.left-margin.right;const plotHeight=height-margin.top-margin.bottom;const x=Math.min(1,Math.max(0,(event.clientX-rect.left-margin.left)/plotWidth));const y=Math.min(1,Math.max(0,(event.clientY-rect.top-margin.top)/plotHeight));return{x,y};}
function commitChartDrawingPoint(point){if(drawingTool==="horizontal"){chartDrawings.push({type:"horizontal",from:{x:0,y:point.y},to:{x:1,y:point.y}});$("drawingHelp").textContent="Linha horizontal criada.";renderCandleChart();return;}if(!pendingDrawingPoint){pendingDrawingPoint=point;$("drawingHelp").textContent="Primeiro ponto marcado. Escolha o segundo ponto.";renderCandleChart();return;}chartDrawings.push({type:"trend",from:pendingDrawingPoint,to:point});pendingDrawingPoint=null;$("drawingHelp").textContent="Linha de tendência criada.";renderCandleChart();}
function handleChartDrawing(event){if(drawingTool==="cursor")return;commitChartDrawingPoint(chartCanvasPoint(event));}
function handleChartKeyboard(event){if(drawingTool==="cursor")return;const movement={ArrowLeft:[-.025,0],ArrowRight:[.025,0],ArrowUp:[0,-.025],ArrowDown:[0,.025]}[event.key];if(movement){event.preventDefault();chartKeyboardPoint={x:Math.min(1,Math.max(0,chartKeyboardPoint.x+movement[0])),y:Math.min(1,Math.max(0,chartKeyboardPoint.y+movement[1]))};$("drawingHelp").textContent="Use as setas para posicionar e Enter ou Espaço para marcar.";renderCandleChart();return;}if(event.key==="Enter"||event.key===" "){event.preventDefault();commitChartDrawingPoint({...chartKeyboardPoint});}}
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
const viewMeta={assets:["Painel de Ativos","Cotações e indicadores demonstrativos para treinamento."],operations:["Operações Demo","Registre resultados manuais com travas de gestão de risco."],reports:["Relatórios","Analise o histórico salvo neste navegador."],mission:["Centro de Missão","Defina banca, limites e disciplina operacional."],scanner:["Scanner Demo","Ranking educacional baseado somente em dados simulados."],chart:["Velas Japonesas","Pratique leitura de candles em cenários totalmente simulados."],investing:["Mercado ao Vivo","Consulte gráficos externos do Investing.com sem misturá-los aos dados simulados."]};
function navigate(view){document.querySelectorAll(".view").forEach(section=>section.classList.remove("active"));document.querySelectorAll(".nav[data-view]").forEach(button=>button.classList.toggle("active",button.dataset.view===view));$(`${view}View`).classList.add("active");$("pageTitle").textContent=viewMeta[view][0];$("pageSubtitle").textContent=viewMeta[view][1];$("sidebar").classList.remove("open");if(view==="operations")renderStats();if(view==="mission")fillMissionForm();if(view==="scanner")renderScanner();if(view==="chart")renderCandleChart();}
function speak(text){if(!("speechSynthesis" in window)||!("SpeechSynthesisUtterance" in window)){alert("A voz não é suportada neste navegador.");return;}speechSynthesis.cancel();const settings=currentSpeechSettings();const utterance=new SpeechSynthesisUtterance(text||getSuzyBrief());utterance.lang=settings.lang;utterance.rate=settings.rate;utterance.pitch=settings.pitch;utterance.volume=settings.volume;if(settings.voice)utterance.voice=settings.voice;setVoiceStatus(`Reproduzindo a voz ${settings.profile.label}.`);utterance.onend=()=>renderVoiceSelection(`Voz ${settings.profile.label} pronta.`);utterance.onerror=()=>setVoiceStatus("Não foi possível reproduzir a voz neste navegador.");speechSynthesis.speak(utterance);}
function getSuzyBrief(){const stats=getStats();const risk=getRiskState(Number($("tradeAmount").value||100));return risk.blocked?`Danilo, operações bloqueadas. ${risk.reason}`:`Danilo, saldo demo em ${money(stats.balance)}. Resultado do dia ${signedMoney(stats.dailyPnl)}. Você realizou ${stats.total} operações com ${stats.winrate} por cento de acerto.`;}
function updateClock(){const now=new Date();$("today").textContent=now.toLocaleDateString("pt-BR");$("clock").textContent=now.toLocaleTimeString("pt-BR");}
function simulateQuotes(){assets.forEach(asset=>{const move=(Math.random()-.5)*.08;asset.change=Number(((asset.change||0)*.65+move).toFixed(2));asset.price=Math.max(.00001,asset.price*(1+move/100));});renderAssets();if($("scannerView").classList.contains("active"))renderScanner();}
function initialize(){populateTradeAssets();populateChartAssets();fillMissionForm();renderAssets();renderStats();renderScanner();generateChartScenario();updateClock();initializeVoiceControl();loadAssetCatalog();}
$("scannerCategory").addEventListener("change",renderScanner);$("scannerMinForce").addEventListener("change",renderScanner);$("scannerLimit").addEventListener("change",renderScanner);$("scanRefresh").onclick=renderScanner;
$("chartAsset").addEventListener("change",generateChartScenario);$("chartTimeframe").addEventListener("change",generateChartScenario);$("newChartScenario").onclick=generateChartScenario;$("candleChart").addEventListener("click",handleChartDrawing);$("candleChart").addEventListener("keydown",handleChartKeyboard);$("candleChart").addEventListener("focus",renderCandleChart);document.querySelectorAll("[data-indicator]").forEach(button=>button.onclick=()=>{const indicator=button.dataset.indicator;chartIndicators[indicator]=!chartIndicators[indicator];button.classList.toggle("active",chartIndicators[indicator]);button.setAttribute("aria-pressed",String(chartIndicators[indicator]));renderCandleChart();});document.querySelectorAll("[data-drawing-tool]").forEach(button=>button.onclick=()=>setDrawingTool(button.dataset.drawingTool));$("undoDrawing").onclick=()=>{chartDrawings.pop();pendingDrawingPoint=null;renderCandleChart();};$("clearDrawings").onclick=()=>{chartDrawings=[];pendingDrawingPoint=null;renderCandleChart();};window.addEventListener("resize",()=>{if($("chartView").classList.contains("active"))renderCandleChart();});
$("searchInput").addEventListener("input",renderAssets);$("categoryFilter").addEventListener("change",renderAssets);$("popularBtn").onclick=()=>{sortMode=sortMode==="popular"?"default":"popular";renderAssets();};$("volBtn").onclick=()=>{sortMode=sortMode==="volatility"?"default":"volatility";renderAssets();};$("tradeAmount").addEventListener("input",renderStats);$("registerWin").onclick=()=>registerOperation("WIN");$("registerLoss").onclick=()=>registerOperation("LOSS");$("exportCsv").onclick=exportCsv;$("resetOps").onclick=resetOperations;$("saveMission").onclick=saveMission;$("voiceProfile").addEventListener("change",event=>{const profile=SuzyVoiceCore.getProfile(saveVoiceProfile(event.target.value));renderVoiceSelection(`Voz ${profile.label} selecionada. Clique em Ouvir Suzy para testar.`);});$("voiceBtn").onclick=()=>speak();$("menuBtn").onclick=()=>$("sidebar").classList.toggle("open");document.querySelectorAll(".nav[data-view]").forEach(button=>button.onclick=()=>navigate(button.dataset.view));document.querySelectorAll("[data-go]").forEach(button=>button.onclick=()=>navigate(button.dataset.go));initialize();setInterval(updateClock,1000);setInterval(simulateQuotes,8000);
