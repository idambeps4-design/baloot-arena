"use client";

import { Download } from "lucide-react";
import { useMemo, useState } from "react";
import { buildAdvancedStats, completedMatchesCsv } from "@/lib/statistics";
import type { MatchHandRow, MatchRow, Player, PlayerProfile } from "@/lib/types";

export default function StatsPanel({ players, matches, hands, profiles }: { players: Player[]; matches: MatchRow[]; hands: MatchHandRow[]; profiles: Record<string, PlayerProfile> }) {
  const [query, setQuery] = useState("");
  const [period, setPeriod] = useState<"all" | "30" | "90">("all");
  const cutoff = period === "all" ? 0 : Date.now() - Number(period) * 86400000;
  const filteredMatches = useMemo(() => matches.filter((match) => !cutoff || new Date(match.created_at).getTime() >= cutoff), [matches, cutoff]);
  const matchIds = useMemo(() => new Set(filteredMatches.map((match) => match.id)), [filteredMatches]);
  const filteredHands = useMemo(() => hands.filter((hand) => matchIds.has(hand.match_id)), [hands, matchIds]);
  const stats = useMemo(() => buildAdvancedStats(players, filteredMatches, filteredHands, profiles).filter((row) => row.name.includes(query.trim())), [players, filteredMatches, filteredHands, profiles, query]);
  const totalRounds = filteredHands.length;
  const averageRounds = filteredMatches.length ? Math.round((totalRounds / filteredMatches.length) * 10) / 10 : 0;

  function exportCsv() {
    const blob = new Blob([completedMatchesCsv(filteredMatches, players)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `balot-arena-matches-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return <section className="stack">
    <div className="card"><span className="eyebrow">v1.3</span><h2>الإحصائيات المتقدمة</h2>
      <div className="statsSummary"><div><b>{filteredMatches.length}</b><span>صكة</span></div><div><b>{totalRounds}</b><span>راوند</span></div><div><b>{averageRounds}</b><span>متوسط الراوندات</span></div></div>
      <div className="statsFilters"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ابحث عن لاعب"/><select value={period} onChange={(event) => setPeriod(event.target.value as typeof period)}><option value="all">كل الوقت</option><option value="30">آخر 30 يوم</option><option value="90">آخر 90 يوم</option></select><button className="primary" onClick={exportCsv} disabled={!filteredMatches.length}><Download size={17}/>تصدير CSV</button></div>
    </div>
    <div className="card"><h3>أداء اللاعبين</h3><div className="advancedStats">{stats.map((row) => <div className="advancedStatRow" key={row.playerId}><div><strong>{row.name}</strong><small>{row.matches} صكة · {row.rounds} راوند</small></div><span><b>{row.wins}</b> فوز</span><span><b>{row.winRate}%</b> نسبة الفوز</span><span><b>{row.averagePointsPerRound}</b> نقطة/راوند</span><span><b>{row.hokmRoundWins}</b> حكم</span><span><b>{row.sunRoundWins}</b> صن</span><span><b>{row.kaboots}</b> كبوت</span><span><b>{row.longestWinningStreak}</b> أطول سلسلة</span></div>)}</div>{!stats.length && <p className="empty">لا توجد نتائج مطابقة.</p>}</div>
  </section>;
}
