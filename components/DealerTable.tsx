"use client";
import { dealerArrow } from "@/lib/scoring";

export default function DealerTable({ names, dealer, onDealer, onPassDealer, canPass = false }: { names: string[]; dealer: number; onDealer: (i: number)=>void; onPassDealer?: ()=>void; canPass?: boolean }) {
  const pos = ["north","east","south","west"];
  return <div className="tableWrap"><div className="feltTable">
    <button type="button" className="tableMark tablePass" disabled={!canPass} onClick={onPassDealer} aria-label="لا يوجد شراء، مرر الموزع وأعد التوزيع"><span>بلوت</span><small>{canPass ? "اضغط هنا إذا محد شرى" : ""}</small></button>
    {names.map((name,i)=><button key={i} className={`seat ${pos[i]} ${dealer===i?"dealer":""}`} onClick={()=>onDealer(i)}><span className="dealerArrow">{dealer===i?dealerArrow(i):""}</span><strong>{name||`اللاعب ${i+1}`}</strong><small>{dealer===i?"يوزع الورق":""}</small></button>)}
  </div></div>;
}
