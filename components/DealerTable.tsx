"use client";
import { dealerArrow } from "@/lib/scoring";

export default function DealerTable({ names, dealer, onDealer }: { names: string[]; dealer: number; onDealer: (i: number)=>void }) {
  const pos = ["north","east","south","west"];
  return <div className="tableWrap"><div className="feltTable"><div className="tableMark">بلوت</div>{names.map((name,i)=><button key={i} className={`seat ${pos[i]} ${dealer===i?"dealer":""}`} onClick={()=>onDealer(i)}><span className="dealerArrow">{dealer===i?dealerArrow(i):""}</span><strong>{name||`اللاعب ${i+1}`}</strong><small>{dealer===i?"يوزع الورق":""}</small></button>)}</div></div>;
}
