"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import ThemeToggle from "@/components/ThemeToggle";
import Nav, { type Tab } from "@/components/Nav";
import PlayersPanel from "@/components/PlayersPanel";
import CasualScorer from "@/components/CasualScorer";
import CompetitionScorer from "@/components/CompetitionScorer";
import HomePanel from "@/components/HomePanel";
import StandingsPanel from "@/components/StandingsPanel";
import { mergeCompletedMatchSnapshot } from "@/lib/data";
import { buildPlayerProfiles } from "@/lib/analytics";
import { isSupabaseConfigured, SHARED_GROUP_CODE, supabase } from "@/lib/supabase";
import type { MatchHandRow, MatchRow, Player } from "@/lib/types";

const handColumns = "match_id,sequence_no,dealer_position,bidder_position,original_bidder_position,exposed_card_receiver_position,bidding_stage,game_type,multiplier,multiplier_announcer_position,entered_team,raw_card_score,team_a_base,team_b_base,team_a_projects,team_b_projects,team_a_baloot,team_b_baloot,counted_project_team,project_items,tied_project_winner,kaboot_team,reverse_kaboot_team,bidder_failed,team_a_total,team_b_total";

export default function Page() {
  const [tab, setTab] = useState<Tab>("home");
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [hands, setHands] = useState<MatchHandRow[]>([]);
  const [groupId, setGroupId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async (silent = false) => {
    if (!supabase) {
      setError("لم تتم إضافة بيانات Supabase في إعدادات الموقع");
      setLoading(false);
      return;
    }
    if (!silent) setLoading(true);
    const { data: group, error: groupError } = await supabase
      .from("groups")
      .select("id")
      .eq("invite_code", SHARED_GROUP_CODE)
      .single();
    if (groupError || !group) {
      setError("لم يتم تشغيل ملف supabase/setup.sql في Supabase");
      if (!silent) setLoading(false);
      return;
    }

    setGroupId(group.id);
    const [{ data: playerRows, error: playerError }, { data: matchRows, error: matchError }] = await Promise.all([
      supabase.from("players").select("id,name,nickname,is_active,created_at").eq("group_id", group.id).order("created_at"),
      supabase.from("matches")
        .select("id,score_a,score_b,created_at,team_a_player_1,team_a_player_2,team_b_player_1,team_b_player_2,kaboot_count_a,kaboot_count_b,match_key,summary_json")
        .eq("group_id", group.id)
        .eq("status", "completed")
        .order("created_at", { ascending: false }),
    ]);

    if (playerError || matchError) {
      setError("تعذر تحميل البيانات من Supabase");
      if (!silent) setLoading(false);
      return;
    }

    const completedMatches = (matchRows ?? []) as MatchRow[];
    const loadedHands: MatchHandRow[] = [];
    let handLoadFailed = false;
    const matchIds = completedMatches.map((match) => match.id);
    for (let index = 0; index < matchIds.length; index += 50) {
      const chunk = matchIds.slice(index, index + 50);
      let from = 0;
      while (chunk.length) {
        const { data: handRows, error: handError } = await supabase
          .from("match_hands")
          .select(handColumns)
          .in("match_id", chunk)
          .order("sequence_no")
          .range(from, from + 999);
        if (handError) {
          setError("تم تحميل الصكات لكن تعذر تحميل تفاصيل الإحصائيات");
          handLoadFailed = true;
          break;
        }
        const rows = handRows ?? [];
        loadedHands.push(...rows.map((row) => ({
          ...row,
          projects: Array.isArray(row.project_items) ? row.project_items : [],
        })) as MatchHandRow[]);
        if (rows.length < 1000) break;
        from += 1000;
      }
    }

    setPlayers((playerRows ?? []) as Player[]);
    setMatches(completedMatches);
    if (!handLoadFailed) setHands(loadedHands);
    if (!handLoadFailed) setError("");
    if (!silent) setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const playerProfiles = useMemo(() => buildPlayerProfiles(players, matches, hands), [hands, matches, players]);

  return <main className="appShell">
    <header className="topBar"><div className="logo"><span>♠</span><div><strong>ساحة البلوت</strong><small>الحسبة والمنافسات</small></div></div><ThemeToggle/></header>
    <div className="content">
      {!isSupabaseConfigured && <div className="alert">أضف متغيرات Supabase في Vercel ثم أعد النشر.</div>}
      {error && <div className="alert">{error}</div>}
      {loading ? <div className="loading">جاري تجهيز الطاولة...</div> : <>
        {tab === "home" && <HomePanel players={players} matches={matches} setTab={setTab}/>} 
        {tab === "players" && <PlayersPanel players={players} matches={matches} hands={hands} groupId={groupId} refresh={load}/>} 
        {tab === "casual" && <CasualScorer/>} 
        {tab === "competition" && <CompetitionScorer players={players} historicalProfiles={playerProfiles} groupId={groupId} onSaved={async (match, savedRounds) => {
          if (match) {
            const merged = mergeCompletedMatchSnapshot(matches, hands, match, savedRounds);
            setMatches(merged.matches);
            setHands(merged.hands);
          }
          await load(true);
        }}/>} 
        {tab === "standings" && <StandingsPanel players={players} matches={matches}/>} 
      </>}
    </div>
    <Nav tab={tab} setTab={setTab}/>
  </main>;
}
