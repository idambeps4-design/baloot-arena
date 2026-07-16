"use client";
import { Calculator, Trophy, Users } from "lucide-react";
import type { Tab } from "./Nav";
import type { MatchRow, Player } from "@/lib/types";

export default function HomePanel({players,matches,setTab}:{players:Player[];matches:MatchRow[];setTab:(t:Tab)=>void}){
 return <section className="stack"><div className="welcome"><div><span className="eyebrow">ساحة البلوت</span><h1>كل جلساتكم في مكان واحد</h1><p>حسبة مريحة، منافسات محفوظة، ولاعبون بدون تكرار.</p></div><div className="brandCard">♠</div></div><div className="quickGrid"><button onClick={()=>setTab("casual")}><Calculator/><strong>الحسبة العادية</strong><span>بدون حفظ</span></button><button onClick={()=>setTab("competition")}><Trophy/><strong>المنافسات</strong><span>تسجيل وإحصائيات</span></button><button onClick={()=>setTab("players")}><Users/><strong>اللاعبون</strong><span>{players.filter(p=>p.is_active).length} لاعب نشط</span></button></div><div className="card"><div className="sectionHeader"><h3>آخر المباريات</h3><button className="textOnly" onClick={()=>setTab("standings")}>عرض الترتيب</button></div>{matches.length===0?<p className="empty">لا توجد مباريات محفوظة بعد.</p>:matches.slice(0,5).map(m=><div className="matchRow" key={m.id}><span>{new Date(m.created_at).toLocaleDateString("ar-AE")}</span><strong>{m.score_a} - {m.score_b}</strong></div>)}</div></section>
}
