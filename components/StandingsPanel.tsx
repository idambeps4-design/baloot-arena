"use client";
import type { MatchRow, Player } from "@/lib/types";

export default function StandingsPanel({players,matches}:{players:Player[];matches:MatchRow[]}){
 const rows=players.map(p=>{let w=0,l=0,k=0;matches.forEach(m=>{const inA=[m.team_a_player_1,m.team_a_player_2].includes(p.id);const inB=[m.team_b_player_1,m.team_b_player_2].includes(p.id);if(!inA&&!inB)return;const won=(inA&&m.score_a>m.score_b)||(inB&&m.score_b>m.score_a);won?w++:l++;k+=inA?(m.kaboot_count_a||0):(m.kaboot_count_b||0);});return{...p,w,l,k,total:w+l,rate:w+l?Math.round(w/(w+l)*100):0};}).sort((a,b)=>b.w-a.w||b.rate-a.rate||b.k-a.k||a.name.localeCompare(b.name,"ar"));
 return <section className="stack"><div className="card"><span className="eyebrow">الدوري</span><h2>ترتيب اللاعبين</h2><div className="standings">{rows.map((r,i)=><div className="standingRow" key={r.id}><span className="rank">{i+1}</span><div><strong>{r.name}{r.nickname?` (${r.nickname})`:""}</strong><small>{r.total} صكة</small></div><div className="record"><b>{r.w}</b><span>فوز</span></div><div className="record"><b>{r.l}</b><span>خسارة</span></div><div className="record"><b>{r.k}</b><span>كبوت</span></div><div className="rate">{r.rate}%</div></div>)}</div></div></section>
}
