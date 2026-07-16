"use client";

import { Archive, ChevronDown, ChevronUp, Pencil, RotateCcw, UserPlus } from "lucide-react";
import { useMemo, useState } from "react";
import { buildPlayerProfiles } from "@/lib/analytics";
import { supabase } from "@/lib/supabase";
import type { MatchHandRow, MatchRow, Player } from "@/lib/types";

export default function PlayersPanel({
  players,
  matches,
  hands,
  groupId,
  refresh,
}: {
  players: Player[];
  matches: MatchRow[];
  hands: MatchHandRow[];
  groupId: string | null;
  refresh: () => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const normalized = useMemo(() => name.trim().replace(/\s+/g, " ").toLocaleLowerCase("ar"), [name]);
  const profiles = useMemo(() => buildPlayerProfiles(players, matches, hands), [hands, matches, players]);

  async function addPlayer() {
    if (!supabase || !groupId || !normalized) return;
    if (players.some((player) => player.name.trim().replace(/\s+/g, " ").toLocaleLowerCase("ar") === normalized)) {
      setMessage("هذا اللاعب موجود مسبقاً");
      return;
    }
    setBusy(true);
    setMessage("");
    const { error } = await supabase.from("players").insert({ group_id: groupId, name: name.trim().replace(/\s+/g, " "), is_active: true });
    setBusy(false);
    if (error) setMessage(error.message.includes("duplicate") ? "هذا اللاعب موجود مسبقاً" : "تعذر إضافة اللاعب");
    else {
      setName("");
      setMessage("تمت إضافة اللاعب");
      await refresh();
    }
  }

  async function rename(player: Player) {
    if (!supabase) return;
    const next = prompt("اكتب الاسم الجديد", player.name)?.trim().replace(/\s+/g, " ");
    if (!next || next === player.name) return;
    if (players.some((item) => item.id !== player.id && item.name.toLocaleLowerCase("ar") === next.toLocaleLowerCase("ar"))) {
      alert("هذا الاسم مستخدم من لاعب آخر");
      return;
    }
    const { error } = await supabase.from("players").update({ name: next }).eq("id", player.id);
    if (error) alert("تعذر تعديل الاسم");
    else await refresh();
  }

  async function toggle(player: Player) {
    if (!supabase) return;
    const { error } = await supabase.from("players").update({ is_active: !player.is_active }).eq("id", player.id);
    if (error) alert("تعذر تحديث اللاعب");
    else await refresh();
  }

  return <section className="stack">
    <div className="card heroCard">
      <div><span className="eyebrow">إدارة اللاعبين</span><h2>سجل اللاعب مرة واحدة</h2><p>اضغط على بطاقة اللاعب لعرض ملفه وإحصائياته.</p></div>
      <div className="addPlayerBox"><input value={name} onChange={(event) => setName(event.target.value)} placeholder="اسم اللاعب" onKeyDown={(event) => event.key === "Enter" && addPlayer()} /><button className="primary" onClick={addPlayer} disabled={busy}><UserPlus size={18}/>{busy ? "جاري الإضافة" : "إضافة لاعب"}</button></div>
      {message && <p className="formMessage">{message}</p>}
    </div>

    <div className="playerGrid">{players.map((player) => {
      const profile = profiles[player.id];
      const isExpanded = expanded === player.id;
      return <article className={`playerCard profileCard ${player.is_active ? "" : "inactive"}`} key={player.id}>
        <button className="profileHeader" onClick={() => setExpanded(isExpanded ? null : player.id)}>
          <div className="avatar">{player.name.charAt(0)}</div>
          <div className="playerMeta"><strong>{player.name}{player.nickname ? ` (${player.nickname})` : ""}</strong><span>{profile?.matchesPlayed ?? 0} صكة · {profile?.winPercentage ?? 0}% فوز</span></div>
          {isExpanded ? <ChevronUp size={18}/> : <ChevronDown size={18}/>} 
        </button>
        <div className="rowActions"><button onClick={() => rename(player)} title="تعديل"><Pencil size={17}/></button><button onClick={() => toggle(player)} title={player.is_active ? "أرشفة" : "استعادة"}>{player.is_active ? <Archive size={17}/> : <RotateCcw size={17}/>}</button></div>
        {isExpanded && profile && <div className="profileStats">
          <div><b>{profile.matchesPlayed}</b><span>لعب</span></div>
          <div><b>{profile.wins}</b><span>فوز</span></div>
          <div><b>{profile.losses}</b><span>خسارة</span></div>
          <div><b>{profile.winPercentage}%</b><span>نسبة الفوز</span></div>
          <div><b>{profile.currentWinningStreak}</b><span>سلسلة حالية</span></div>
          <div><b>{profile.longestWinningStreak}</b><span>أطول سلسلة فوز</span></div>
          <div><b>{profile.currentLosingStreak}</b><span>سلسلة خسارة حالية</span></div>
          <div><b>{profile.longestLosingStreak}</b><span>أطول سلسلة خسارة</span></div>
          <div><b>{profile.successfulBids}</b><span>طلبات ناجحة</span></div>
          <div><b>{profile.failedBids}</b><span>طلبات فاشلة</span></div>
          <div><b>{profile.kaboots}</b><span>كبوت</span></div>
          <div><b>{profile.reverseKaboots}</b><span>كبوت عكسي</span></div>
          <div><b>{profile.coffeeFinishes}</b><span>نهايات قهوة</span></div>
          <div><b>{profile.projectPoints}</b><span>نقاط المشاريع</span></div>
          <div className="relationStat"><span>أفضل شريك</span><b>{profile.bestPartner}</b></div>
          <div className="relationStat"><span>أكثر شريك</span><b>{profile.mostFrequentPartner}</b></div>
          <div className="relationStat"><span>أصعب خصم</span><b>{profile.hardestOpponent}</b></div>
        </div>}
      </article>;
    })}</div>
  </section>;
}
