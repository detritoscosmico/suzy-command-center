const assets=[
{ticker:"US 500 (OTC)",name:"US 500 (OTC)",price:"7572.723",change:"+0.14%",cat:"OTC",icon:"🇺🇸",pop:3,force:4,fav:true},
{ticker:"BTC/USD (OTC)",name:"Bitcoin / Dólar",price:"67615.56",change:"-0.05%",cat:"Cripto",icon:"₿",pop:3,force:4,fav:true},
{ticker:"USD/DOP (OTC)",name:"Dólar / Peso Dominicano",price:"58.50515",change:"-0.01%",cat:"OTC",icon:"🇩🇴",pop:3,force:4,fav:true},
{ticker:"USD/BDT (OTC)",name:"Dólar / Taka",price:"122.9026",change:"+0.06%",cat:"OTC",icon:"🇧🇩",pop:2,force:2,fav:true},
{ticker:"USD/MYR (OTC)",name:"Dólar / Ringgit",price:"4.070265",change:"-0.03%",cat:"OTC",icon:"🇲🇾",pop:2,force:3,fav:true},
{ticker:"USD/JPY",name:"Dólar / Iene",price:"159.9645",change:"-0.01%",cat:"Moedas",icon:"🇯🇵",pop:3,force:3,fav:true},
{ticker:"USD/ARS (OTC)",name:"Dólar / Peso Argentino",price:"1438.330",change:"-0.64%",cat:"OTC",icon:"🇦🇷",pop:3,force:3,fav:false},
{ticker:"USD/VND (OTC)",name:"Dólar / Dong",price:"26338.12",change:"-0.37%",cat:"OTC",icon:"🇻🇳",pop:3,force:3,fav:false},
{ticker:"XAUUSD (OTC)",name:"Ouro / Dólar",price:"4430.293",change:"-0.14%",cat:"Commodities",icon:"🪙",pop:3,force:4,fav:false},
{ticker:"AUS 200 (OTC)",name:"Australia 200 (OTC)",price:"8617.186",change:"-0.07%",cat:"Índice",icon:"🇦🇺",pop:3,force:4,fav:false},
{ticker:"US 30 (OTC)",name:"US 30 (OTC)",price:"51276.66",change:"-0.05%",cat:"Índice",icon:"🇺🇸",pop:3,force:2,fav:false},
{ticker:"SOL/USD (OTC)",name:"Solana / Dólar",price:"66.56242",change:"-1.61%",cat:"Cripto",icon:"◎",pop:3,force:4,fav:false},
{ticker:"GER 30",name:"Germany 30 (DAX)",price:"24832.48",change:"+0.14%",cat:"Índice",icon:"🇩🇪",pop:3,force:4,fav:false},
{ticker:"Dollar Index",name:"Índice do Dólar",price:"99.41421",change:"-0.05%",cat:"Índice",icon:"💲",pop:2,force:4,fav:false},
{ticker:"Pound Index",name:"Índice da Libra",price:"135.5795",change:"-0.01%",cat:"Índice",icon:"£",pop:2,force:3,fav:false},
{ticker:"Australian Dollar Index",name:"Índice do Dólar Australiano",price:"71.36179",change:"-0.06%",cat:"Índice",icon:"A$",pop:2,force:4,fav:false},
{ticker:"Euro Index",name:"Índice do Euro",price:"117.7738",change:"+0.06%",cat:"Índice",icon:"€",pop:2,force:3,fav:false},
{ticker:"Canadian Dollar Index",name:"Índice do Dólar Canadense",price:"72.69807",change:"-0.03%",cat:"Índice",icon:"C$",pop:2,force:3,fav:false},
{ticker:"Yen Index",name:"Índice do Iene",price:"62.86132",change:"-0.01%",cat:"Índice",icon:"¥",pop:2,force:4,fav:false},
{ticker:"US 100",name:"US 100",price:"30153.17",change:"-0.64%",cat:"Índice",icon:"🇺🇸",pop:3,force:4,fav:false},
{ticker:"US 500",name:"US 500",price:"7553.490",change:"-0.37%",cat:"Índice",icon:"🇺🇸",pop:3,force:3,fav:false},
{ticker:"US 30",name:"US 30",price:"51532.21",change:"-0.14%",cat:"Índice",icon:"🇺🇸",pop:3,force:4,fav:false},
{ticker:"JP 225",name:"Japan 225 (Nikkei)",price:"66528.06",change:"-1.61%",cat:"Índice",icon:"🇯🇵",pop:3,force:4,fav:false},
{ticker:"UK 100",name:"UK 100",price:"10354.85",change:"-0.07%",cat:"Índice",icon:"🇬🇧",pop:3,force:4,fav:false}
];

const body=document.getElementById("assetsBody");
const searchInput=document.getElementById("searchInput");
const categoryFilter=document.getElementById("categoryFilter");

function renderAssets(list=assets){
 body.innerHTML=list.map((a,index)=>`<tr>
 <td><div class="asset-cell"><span class="flag">${a.icon}</span>${a.ticker}</div></td>
 <td>${a.name}</td><td>${a.price}</td>
 <td class="${a.change.startsWith('+')?'green':'red'}">${a.change}</td>
 <td class="popular">${"🔥".repeat(a.pop)}</td><td class="popular">${"▮".repeat(a.force)}</td>
 <td class="force">${[1,2,3,4].map(i=>`<span class="${i<=a.force?'on':''}" style="height:${8+i*4}px"></span>`).join("")}</td>
 <td><span class="star ${a.fav?'on':''}" data-ticker="${a.ticker}" title="Favoritar">★</span> <span class="info" title="Dados demonstrativos">ⓘ</span></td></tr>`).join("");
 document.querySelectorAll(".star").forEach(star=>star.addEventListener("click",()=>toggleFavorite(star.dataset.ticker)));
}

function filterAssets(){
 const term=searchInput.value.trim().toLowerCase();
 const cat=categoryFilter.value;
 const filtered=assets.filter(a=>{
  const matchTerm=a.ticker.toLowerCase().includes(term)||a.name.toLowerCase().includes(term);
  const matchCat=cat==="Todos"||a.cat===cat||(cat==="OTC"&&a.ticker.includes("(OTC)"));
  return matchTerm&&matchCat;
 });
 renderAssets(filtered);
}

function toggleFavorite(ticker){
 const asset=assets.find(a=>a.ticker===ticker);
 if(asset){asset.fav=!asset.fav;filterAssets();}
}

function updateClock(){
 const now=new Date();
 document.getElementById("today").textContent=now.toLocaleDateString("pt-BR");
 document.getElementById("clock").textContent=now.toLocaleTimeString("pt-BR");
}

searchInput.addEventListener("input",filterAssets);
categoryFilter.addEventListener("change",filterAssets);
document.getElementById("popularBtn").addEventListener("click",()=>renderAssets([...assets].sort((a,b)=>b.pop-a.pop)));
document.getElementById("volBtn").addEventListener("click",()=>renderAssets([...assets].sort((a,b)=>b.force-a.force)));

renderAssets();updateClock();setInterval(updateClock,1000);
