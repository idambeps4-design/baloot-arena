"use client";
import { RotateCcw, Undo2 } from "lucide-react";
import { useMemo, useState } from "react";
import DealerTable from "./DealerTable";

type Round={a:number;b:number;dealer:number};
export default function CasualScorer(){
  const [names,setNames]=useState(["لاعب ١","لاعب ٢","لاعب ٣","لاعب ٤"]); const [dealer,setDealer]=useState(0); const [a,setA]=useState(0); const [b,setB]=useState(0); const [ra,setRa]=useState(0); const [rb,setRb]=useState(0); const [rounds,setRounds]=useState<Round[]>([]);
  const totals=useMemo(()=>rounds.reduce((x,r)=>({a:x.a+r.a,b:x.b+r.b}),{a:0,b:0}),[rounds]);
  function add(){if(ra===0&&rb===0)return;setRounds([...rounds,{a:ra,b:rb,dealer}]);setRa(0);setRb(0);setDealer((dealer+3)%4)}
  function undo(){const copy=[...rounds];const last=copy.pop();setRounds(copy);if(last)setDealer(last.dealer)}
  function reset(){if(confirm("تصفير الحسبة بالكامل؟")){setRounds([]);setDealer(0)}}
  return <section className="stack"><div className="scoreHero"><div><span>الحسبة العادية</span><strong>{totals.a}</strong><small>الفريق الأول</small></div><div className="scoreDivider">:</div><div><span>حتى ١٥٢</span><strong>{totals.b}</strong><small>الفريق الثاني</small></div></div>
  <div className="card"><h3>أسماء الجلسة</h3><div className="nameGrid">{names.map((n,i)=><input key={i} value={n} onChange={e=>setNames(names.map((x,j)=>j===i?e.target.value:x))}/>)}</div><DealerTable names={names} dealer={dealer} onDealer={setDealer}/></div>
  <div className="card scoreEntry"><h3>أدخل نتيجة الراوند</h3><div className="twoColumns"><label>الفريق الأول<input type="number" min="0" value={ra} onChange={e=>setRa(Number(e.target.value))}/></label><label>الفريق الثاني<input type="number" min="0" value={rb} onChange={e=>setRb(Number(e.target.value))}/></label></div><button className="primary wide" onClick={add}>حفظ الراوند</button><div className="secondaryActions"><button onClick={undo} disabled={!rounds.length}><Undo2 size={18}/>تراجع</button><button onClick={reset}><RotateCcw size={18}/>تصفير</button></div></div>
  <div className="card"><h3>سجل الراوندات</h3>{rounds.length===0?<p className="empty">لم تتم إضافة راوندات بعد.</p>:<div className="roundList">{[...rounds].reverse().map((r,idx)=><div className="roundRow" key={rounds.length-idx}><span>الراوند {rounds.length-idx}</span><strong>{r.a} - {r.b}</strong></div>)}</div>}</div></section>
}
