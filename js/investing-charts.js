(function(root,factory){
 const api=factory();
 if(typeof module==="object"&&module.exports)module.exports=api;
 if(root)root.SuzyInvestingCharts=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
 const WIDGET_ORIGIN="https://ssltvc.investing.com";
 const DEFAULT_CONFIG=Object.freeze({
  pairId:1,
  interval:300,
  plotStyle:"candles",
  width:1900,
  height:650,
  domainId:30,
  languageId:12,
  timezoneId:10
 });
 const VALID_INTERVALS=new Set([60,300,900,1800,3600,14400,86400,"week","month"]);
 const VALID_STYLES=new Set(["area","candles","bars","heiken_ashi","line"]);

 function integerInRange(value,fallback,min,max){
  const number=Number(value);
  return Number.isInteger(number)&&number>=min&&number<=max?number:fallback;
 }

 function dimension(value,fallback,min,max){
  const number=Number(value);
  return Number.isFinite(number)?Math.min(max,Math.max(min,Math.round(number))):fallback;
 }

 function buildWidgetUrl(options={}){
  const pairId=integerInRange(options.pairId,DEFAULT_CONFIG.pairId,1,99999999);
  const width=dimension(options.width,DEFAULT_CONFIG.width,320,1900);
  const height=dimension(options.height,DEFAULT_CONFIG.height,320,1100);
  const interval=VALID_INTERVALS.has(options.interval)?options.interval:DEFAULT_CONFIG.interval;
  const plotStyle=VALID_STYLES.has(options.plotStyle)?options.plotStyle:DEFAULT_CONFIG.plotStyle;
  const params=new URLSearchParams({
   domain_ID:String(DEFAULT_CONFIG.domainId),
   height:String(height),
   interval:String(interval),
   lang_ID:String(DEFAULT_CONFIG.languageId),
   pair_ID:String(pairId),
   plotStyle,
   timezone_ID:String(DEFAULT_CONFIG.timezoneId),
   width:String(width)
  });
  return `${WIDGET_ORIGIN}/?${params.toString()}`;
 }

 function mountInvestingChart({mount,button,status}={}){
  if(!mount||mount.querySelector("iframe"))return false;
  const iframe=document.createElement("iframe");
  iframe.className="investing-chart-iframe";
  iframe.title="Gráfico técnico externo fornecido pelo Investing.com";
  mount.hidden=false;
  const width=Math.round(mount.getBoundingClientRect().width||DEFAULT_CONFIG.width);
  iframe.src=buildWidgetUrl({width});
  iframe.loading="lazy";
  iframe.referrerPolicy="strict-origin-when-cross-origin";
  iframe.setAttribute("allow","fullscreen");
  iframe.setAttribute("sandbox","allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox");
  mount.appendChild(iframe);
  if(button){button.disabled=true;button.textContent="GRÁFICO CARREGADO";}
  if(status)status.textContent="Conteúdo externo carregado. Use a busca do gráfico para trocar o instrumento.";
  return true;
 }

 function bindInvestingChart(){
  const button=document.getElementById("loadInvestingChart");
  const mount=document.getElementById("investingChartFrame");
  const status=document.getElementById("investingChartStatus");
  if(!button||!mount)return;
  button.addEventListener("click",()=>mountInvestingChart({mount,button,status}));
 }

 if(typeof document!=="undefined"){
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",bindInvestingChart,{once:true});
  else bindInvestingChart();
 }

 return {WIDGET_ORIGIN,DEFAULT_CONFIG,buildWidgetUrl,mountInvestingChart};
});