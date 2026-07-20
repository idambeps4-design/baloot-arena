"use client";

import { ChevronDown, ChevronUp, Minus, Plus, Save, Sparkles, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import DealerTable from "./DealerTable";
import {
  calculateRound,
  gameEnded,
  nextDealerToRight,
  projectSummary,
  oppositeTeam,
  defaultScoreTeamForBidder,
  sunMultiplierAllowed,
  teamForSeat,
  validateRawScore,
  validateRoundInput,
} from "@/lib/scoring";
import { buildMatchSummary, buildRoundAnnouncement } from "@/lib/analytics";
import { buildProgressAnnouncement } from "@/lib/jokes";
import { SOUND_SETTING_EVENT, SOUND_SETTING_KEY } from "./SoundToggle";
import { supabase } from "@/lib/supabase";
import type {
  GameType,
  MatchRow,
  MatchSummary,
  Multiplier,
  Player,
  PlayerProfile,
  ProjectItem,
  ProjectType,
  Round,
  RoundAnnouncement,
  TeamCode,
} from "@/lib/types";

const projectTypes: ProjectType[] = ["سرى", "خمسين", "مية", "أربعمئة", "بلوت"];
const emptyProjects = (): ProjectItem[] => [];
const newMatchKey = () => typeof crypto !== "undefined" && "randomUUID" in crypto
  ? crypto.randomUUID()
  : `match-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export default function CompetitionScorer({
  players,
  groupId,
  historicalProfiles,
  onSaved,
}: {
  players: Player[];
  historicalProfiles: Record<string, PlayerProfile>;
  groupId: string | null;
  onSaved: (match: MatchRow, rounds: Round[]) => Promise<void>;
}) {
  const active = players.filter((player) => player.is_active);
  const [selected, setSelected] = useState(["", "", "", ""]);
  const [dealer, setDealer] = useState(0);
  const [dealerChosen, setDealerChosen] = useState(false);
  const [dealerAnimating, setDealerAnimating] = useState(false);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [editing, setEditing] = useState<number | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [originalBidder, setOriginalBidder] = useState(0);
  const [gameType, setGameType] = useState<GameType>("صن");
  const [enteredTeam, setEnteredTeam] = useState<TeamCode>("B");
  const [rawScore, setRawScore] = useState(0);
  const [multiplier, setMultiplier] = useState<Multiplier>(1);
  const [multiplierAnnouncer, setMultiplierAnnouncer] = useState<number | null>(null);
  const [projects, setProjects] = useState<ProjectItem[]>(emptyProjects());
  const [tieWinner, setTieWinner] = useState<TeamCode | null>(null);
  const [kaboot, setKaboot] = useState<TeamCode | null>(null);
  const [reverseKaboot, setReverseKaboot] = useState<TeamCode | null>(null);
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [matchKey, setMatchKey] = useState(newMatchKey);
  const [recentJokeIds, setRecentJokeIds] = useState<string[]>([]);
  const [lockedSummary, setLockedSummary] = useState<MatchSummary | null>(null);
  const [announcement, setAnnouncement] = useState<RoundAnnouncement | null>(null);
  const [shownRoundJokeIds, setShownRoundJokeIds] = useState<string[]>([]);
  const [matchInspectionShown, setMatchInspectionShown] = useState(false);
  const [soundMuted, setSoundMuted] = useState(false);
  const spokenSummaryKey = useRef("");

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("baloot-arena-recent-jokes") ?? "[]");
      setRecentJokeIds(Array.isArray(stored) ? stored.slice(0, 2) : []);
    } catch {
      setRecentJokeIds([]);
    }
  }, []);

  useEffect(() => {
    setSoundMuted(localStorage.getItem(SOUND_SETTING_KEY) === "true");
    const listener = (event: Event) => setSoundMuted(Boolean((event as CustomEvent<{ muted: boolean }>).detail?.muted));
    window.addEventListener(SOUND_SETTING_EVENT, listener);
    return () => window.removeEventListener(SOUND_SETTING_EVENT, listener);
  }, []);

  function speak(text: string) {
    if (soundMuted || !text || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ar-AE";
    utterance.rate = 0.92;
    const arabicVoice = window.speechSynthesis.getVoices().find((voice) => voice.lang.toLowerCase().startsWith("ar"));
    if (arabicVoice) utterance.voice = arabicVoice;
    window.speechSynthesis.speak(utterance);
  }

  useEffect(() => {
    if (announcement) speak(announcement.text);
  }, [announcement, soundMuted]);

  const names = selected.map((id) => active.find((player) => player.id === id)?.name || "");
  const validPlayers = new Set(selected.filter(Boolean)).size === 4;
  const totals = useMemo(() => rounds.reduce(
    (total, round) => ({ a: total.a + round.team_a_total, b: total.b + round.team_b_total }),
    { a: 0, b: 0 },
  ), [rounds]);
  const scoreBeforeEntry = useMemo(() => {
    if (editing === null) return totals;
    const editedRound = rounds.find((round) => round.sequence_no === editing);
    return editedRound
      ? { a: totals.a - editedRound.team_a_total, b: totals.b - editedRound.team_b_total }
      : totals;
  }, [editing, rounds, totals]);
  const endState = gameEnded(totals.a, totals.b);
  const pSummary = projectSummary(gameType, projects, tieWinner);
  const rawError = validateRawScore(gameType, rawScore);
  const sunDoubleAllowed = sunMultiplierAllowed(gameType, originalBidder, scoreBeforeEntry.a, scoreBeforeEntry.b);
  const setupLocked = rounds.length > 0 || saved;
  const generatedSummary = useMemo(() => {
    if (!endState.ended || !validPlayers || editing !== null) return null;
    return buildMatchSummary({
      matchKey,
      playerIds: selected as [string, string, string, string],
      playerNames: names as [string, string, string, string],
      scoreA: totals.a,
      scoreB: totals.b,
      rounds,
      historicalProfiles,
      excludedJokeIds: recentJokeIds,
    });
  }, [editing, endState.ended, historicalProfiles, matchKey, names, recentJokeIds, rounds, selected, totals.a, totals.b, validPlayers]);
  const finalSummary = lockedSummary ?? generatedSummary;

  useEffect(() => {
    if (!finalSummary?.jokes.length) return;
    const key = `${matchKey}:${finalSummary.jokeIds.join(",")}`;
    if (spokenSummaryKey.current === key) return;
    spokenSummaryKey.current = key;
    speak(finalSummary.jokes.join(". "));
  }, [finalSummary, matchKey, soundMuted]);

  useEffect(() => {
    if (!endState.ended || !generatedSummary || matchInspectionShown) return;
    if (!generatedSummary.jokeIds.includes("abdullah-sharif-inspection")) return;
    setAnnouncement({
      id: "abdullah-sharif-match-inspection",
      title: "🚨 عبدالله شريف خسر الصكة 🚨",
      text: "زخه التفتيش",
      special: true,
    });
    setMatchInspectionShown(true);
  }, [endState.ended, generatedSummary, matchInspectionShown]);

  function choose(index: number, value: string) {
    if (setupLocked) return;
    const copy = [...selected];
    copy[index] = value;
    setSelected(copy);
  }

  function setBidderAndDefaultScoreTeam(position: number) {
    setOriginalBidder(position);
    setMultiplierAnnouncer(null);
    setMultiplier(1);
    setEnteredTeam(defaultScoreTeamForBidder(position));
  }

  function randomDealer() {
    if (!validPlayers) {
      setNotice("اختر أربعة لاعبين مختلفين أولاً");
      return;
    }
    if (setupLocked) return;
    setDealerAnimating(true);
    setNotice("");
    let count = 0;
    const final = Math.floor(Math.random() * 4);
    const timer = setInterval(() => {
      setDealer((value) => nextDealerToRight(value));
      count += 1;
      if (count > 10 + final) {
        clearInterval(timer);
        setDealer(final);
        setDealerChosen(true);
        setDealerAnimating(false);
        setBidderAndDefaultScoreTeam(final);
      }
    }, 90);
  }

  function passDealerForRedeal() {
    if (!validPlayers || !dealerChosen || saved || endState.ended || editing !== null) return;
    const next = nextDealerToRight(dealer);
    setDealer(next);
    setBidderAndDefaultScoreTeam(next);
    resetEntry();
    setOriginalBidder(next);
    setEnteredTeam(defaultScoreTeamForBidder(next));
    setNotice("محد شرى — انتقل التوزيع للاعب التالي بدون تسجيل راوند");
  }

  function qty(team: TeamCode, type: ProjectType) {
    return projects.find((project) => project.team === team && project.type === type)?.quantity || 0;
  }

  function changeProject(team: TeamCode, type: ProjectType, delta: number) {
    if (saved || (gameType !== "حكم" && type === "بلوت") || (gameType === "حكم" && type === "أربعمئة")) return;
    const next = Math.max(0, qty(team, type) + delta);
    setProjects((previous) => [
      ...previous.filter((project) => !(project.team === team && project.type === type)),
      ...(next ? [{ team, type, quantity: next } as ProjectItem] : []),
    ]);
  }

  function resetEntry() {
    setRawScore(0);
    setMultiplier(1);
    setMultiplierAnnouncer(null);
    setProjects(emptyProjects());
    setTieWinner(null);
    setKaboot(null);
    setReverseKaboot(null);
    setGameType("صن");
    setEnteredTeam(defaultScoreTeamForBidder(originalBidder));
    setEditing(null);
  }

  function saveRound() {
    if (saved || (endState.ended && editing === null)) return;
    if (!validPlayers || !dealerChosen) {
      setNotice("اختر اللاعبين وحدد الموزع أولاً");
      return;
    }
    if (rawError) {
      setNotice(rawError);
      return;
    }
    if (pSummary.tied && !tieWinner) {
      setNotice("المشاريع متساوية، اختر أي فريق يُحسب له المشروع");
      return;
    }
    if (gameType !== "حكم" && multiplier > 2) {
      setNotice("في صن وأشكل تتوقف المضاعفة عند دبل");
      return;
    }
    if (multiplier === 2 && gameType !== "حكم" && !sunDoubleAllowed) {
      setNotice("الدبل في صن وأشكل يحتاج الطالع ١٠٠ أو أكثر والخصم أقل من ١٠٠");
      return;
    }
    const effectiveBidder = multiplierAnnouncer ?? originalBidder;
    const input = {
      sequence_no: editing ?? rounds.length + 1,
      dealer_position: dealer,
      bidder_position: effectiveBidder,
      original_bidder_position: originalBidder,
      exposed_card_receiver_position: null,
      bidding_stage: "أول",
      game_type: gameType,
      multiplier,
      multiplier_announcer_position: multiplierAnnouncer,
      entered_team: enteredTeam,
      raw_card_score: rawScore,
      kaboot_team: kaboot,
      reverse_kaboot_team: reverseKaboot,
      projects,
      tied_project_winner: tieWinner,
    } as const;
    const matchScore = { currentA: scoreBeforeEntry.a, currentB: scoreBeforeEntry.b };
    const inputErrors = validateRoundInput(input, matchScore);
    if (inputErrors.length) {
      setNotice(inputErrors[0]);
      return;
    }
    const round = calculateRound(input, matchScore);
    let nextEntryBidder: number | null = null;
    if (editing) {
      const updated = rounds
        .map((item) => item.sequence_no === editing ? round : item)
        .sort((a, b) => a.sequence_no - b.sequence_no);
      nextEntryBidder = updated.length ? nextDealerToRight(updated[updated.length - 1].dealer_position) : dealer;
      setRounds(updated);
      setDealer(nextEntryBidder);
    } else {
      setRounds((previous) => [...previous, round]);
      setDealer(nextDealerToRight(dealer));
    }
    resetEntry();
    if (nextEntryBidder !== null) {
      setOriginalBidder(nextEntryBidder);
      setEnteredTeam(defaultScoreTeamForBidder(nextEntryBidder));
    }
    const resultingRounds = editing
      ? rounds.map((item) => item.sequence_no === editing ? round : item).sort((a, b) => a.sequence_no - b.sequence_no)
      : [...rounds, round];
    const nextAnnouncement = buildProgressAnnouncement(resultingRounds) ?? buildRoundAnnouncement({
      matchKey,
      playerNames: names as [string, string, string, string],
      round,
      excludedIds: shownRoundJokeIds,
    });
    if (nextAnnouncement) {
      setAnnouncement(nextAnnouncement);
      setShownRoundJokeIds((current) => [...current, nextAnnouncement.id].slice(-8));
    }
    setNotice(round.bidder_failed ? "تم تسجيل الراوند — الطالع طاح 😅" : "تم تسجيل الراوند");
  }

  function editRound(round: Round) {
    if (saved) return;
    setEditing(round.sequence_no);
    setDealer(round.dealer_position);
    setOriginalBidder(round.original_bidder_position);
    setGameType(round.game_type);
    setEnteredTeam(round.entered_team);
    setRawScore(round.raw_card_score);
    setMultiplier(round.multiplier);
    setMultiplierAnnouncer(round.multiplier_announcer_position);
    setTieWinner(round.tied_project_winner);
    setKaboot(round.kaboot_team);
    setReverseKaboot(round.reverse_kaboot_team);
    setProjects(round.projects.map((project) => ({ ...project })));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveMatch() {
    if (!supabase || !groupId || !validPlayers || rounds.length === 0 || !endState.ended || !finalSummary || saved || saving) return;
    setSaving(true);
    setNotice("");
    const kabootA = rounds.filter((round) => round.kaboot_team === "A" || round.reverse_kaboot_team === "A").length;
    const kabootB = rounds.filter((round) => round.kaboot_team === "B" || round.reverse_kaboot_team === "B").length;
    const handRows = rounds.map((round) => ({
      sequence_no: round.sequence_no,
      dealer_position: round.dealer_position,
      bidder_position: round.bidder_position,
      original_bidder_position: round.original_bidder_position,
      exposed_card_receiver_position: round.exposed_card_receiver_position,
      bidding_stage: round.bidding_stage,
      game_type: round.game_type,
      multiplier: round.multiplier,
      multiplier_announcer_position: round.multiplier_announcer_position,
      entered_team: round.entered_team,
      raw_card_score: round.raw_card_score,
      team_a_base: round.team_a_base,
      team_b_base: round.team_b_base,
      team_a_projects: round.team_a_projects,
      team_b_projects: round.team_b_projects,
      team_a_baloot: round.team_a_baloot,
      team_b_baloot: round.team_b_baloot,
      counted_project_team: round.counted_project_team,
      project_items: round.projects,
      tied_project_winner: round.tied_project_winner,
      kaboot_team: round.kaboot_team,
      reverse_kaboot_team: round.reverse_kaboot_team,
      bidder_failed: round.bidder_failed,
      team_a_total: round.team_a_total,
      team_b_total: round.team_b_total,
    }));
    const { data, error } = await supabase.rpc("save_completed_match_v1", {
      p_match: {
        group_id: groupId,
        match_key: matchKey,
        team_a_player_1: selected[0],
        team_a_player_2: selected[2],
        team_b_player_1: selected[1],
        team_b_player_2: selected[3],
        score_a: totals.a,
        score_b: totals.b,
        dealer_start: rounds[0]?.dealer_position ?? dealer,
        kaboot_count_a: kabootA,
        kaboot_count_b: kabootB,
        summary_json: finalSummary,
      },
      p_hands: handRows,
    });
    setSaving(false);
    if (error || !data) {
      setNotice(error?.message.includes("save_completed_match_v1")
        ? "شغّل ملف supabase/v1.sql ثم حاول مرة ثانية"
        : "تعذر حفظ الصكة — لم يتم حفظ أي جزء منها");
      return;
    }

    const match = data as MatchRow;
    const nextRecent = finalSummary.jokeIds.slice(0, 2);
    setLockedSummary(finalSummary);
    setRecentJokeIds(nextRecent);
    try {
      localStorage.setItem("baloot-arena-recent-jokes", JSON.stringify(nextRecent));
    } catch {
      // Local storage is optional; match saving is not affected.
    }
    setSaved(true);
    setNotice("تم حفظ الصكة كاملة وتحديث الإحصائيات");
    await onSaved(match, rounds);
  }

  function discardAndStartNewMatch() {
    if (rounds.length > 0 && !confirm("بدء صكة جديدة؟ لن يتم حفظ الصكة الحالية.")) return;
    startNewMatch();
  }

  function startNewMatch() {
    setSelected(["", "", "", ""]);
    setDealer(0);
    setDealerChosen(false);
    setDealerAnimating(false);
    setRounds([]);
    setEditing(null);
    setExpanded(null);
    setOriginalBidder(0);
    setGameType("صن");
    setEnteredTeam("B");
    setRawScore(0);
    setMultiplier(1);
    setMultiplierAnnouncer(null);
    setProjects([]);
    setTieWinner(null);
    setKaboot(null);
    setReverseKaboot(null);
    setNotice("");
    setSaving(false);
    setSaved(false);
    setLockedSummary(null);
    setAnnouncement(null);
    setShownRoundJokeIds([]);
    setMatchInspectionShown(false);
    setMatchKey(newMatchKey());
  }

  return <section className="stack">
    {announcement && <div className={`announcementOverlay ${announcement.special ? "special" : ""}`} role="dialog" aria-modal="true" aria-live="assertive">
      <div className="announcementCard">
        <button className="announcementClose" onClick={() => setAnnouncement(null)} aria-label="إغلاق الإعلان"><X size={22}/></button>
        <span>{announcement.title}</span>
        <strong>{announcement.text}</strong>
        <button className="primary" onClick={() => setAnnouncement(null)}>إخفاء</button>
      </div>
    </div>}
    <div className="scoreHero competition">
      <div><span>الفريق الأول</span><strong>{totals.a}</strong><small>{names[0] || "—"} + {names[2] || "—"}</small></div>
      <div className="scoreDivider">:</div>
      <div><span>الفريق الثاني</span><strong>{totals.b}</strong><small>{names[1] || "—"} + {names[3] || "—"}</small></div>
    </div>
    {((totals.a < 30 && totals.b >= 80) || (totals.b < 30 && totals.a >= 80)) &&
      <div className="banter">بعدكم ما افطرتوا يا مصخرة 😂</div>}

    {finalSummary && <div className="card finalSummary">
      <span className="eyebrow">ملخص الصكة</span>
      <h2>{finalSummary.headline}</h2>
      <p>{finalSummary.resultLine}</p>
      <div className="summaryAwards">
        <div><span>⭐ نجم الصكة</span><strong>{finalSummary.starPlayerName}</strong><small>{finalSummary.starReasons?.join(" · ")}</small></div>
        <div><span>🪙 مفلس الصكة</span><strong>{finalSummary.bankruptPlayerName}</strong><small>{finalSummary.bankruptReasons?.join(" · ")}</small></div>
      </div>
      {finalSummary.eventLabels.length > 0 && <div className="eventPills">{finalSummary.eventLabels.map((label) => <span key={label}>{label}</span>)}</div>}
      <div className="matchStory"><strong>قصة الصكة</strong>{finalSummary.storyline.map((line) => <p key={line}>{line}</p>)}</div>
      <div className="summaryJokes">{finalSummary.jokes.map((joke) => <p key={joke}>{joke}</p>)}</div>
      <div className="summaryActions">
        {!saved && <><button className="primary" onClick={saveMatch} disabled={saving}><Save size={17}/>{saving ? "جاري الحفظ" : "حفظ الصكة المكتملة"}</button><button className="textButton" onClick={discardAndStartNewMatch}>صكة جديدة بدون حفظ</button></>}
        {saved && <button className="primary" onClick={startNewMatch}>ابدأ صكة جديدة</button>}
      </div>
      {notice && <p className="formMessage">{notice}</p>}
    </div>}

    <div className="card">
      <span className="eyebrow">المنافسات</span><h2>تجهيز الصكة</h2>
      <div className="selectGrid">{selected.map((value, index) => <select key={index} value={value} disabled={setupLocked} onChange={(event) => choose(index, event.target.value)}>
        <option value="">{`المقعد ${index + 1}`}</option>
        {active.map((player) => <option key={player.id} value={player.id} disabled={selected.includes(player.id) && value !== player.id}>{player.name}{player.nickname ? ` (${player.nickname})` : ""}</option>)}
      </select>)}</div>
      <DealerTable names={names} dealer={dealer} canPass={validPlayers && dealerChosen && !saved && !endState.ended && editing === null} onPassDealer={passDealerForRedeal} onDealer={(index) => { if (!setupLocked) { setDealer(index); setDealerChosen(true); setBidderAndDefaultScoreTeam(index); } }} />
      <button className="primary wide dealerRandom" onClick={randomDealer} disabled={dealerAnimating || !validPlayers || setupLocked}>
        <Sparkles size={18}/>{dealerAnimating ? "جاري الاختيار..." : "من يبدأ التوزيع؟"}
      </button>
    </div>

    {!saved && <div className="card scoreEntry">
      <div className="sectionHeader"><h3>{editing ? `تعديل الراوند ${editing}` : "الراوند الحالي"}</h3>{editing && <button className="textOnly" onClick={resetEntry}>إلغاء التعديل</button>}</div>
      <label>الطالع<select value={originalBidder} onChange={(event) => setBidderAndDefaultScoreTeam(Number(event.target.value))}>{names.map((name, index) => <option key={index} value={index}>{name || `اللاعب ${index + 1}`}</option>)}</select></label>
      <div className="gameTypeLine"><span>نوع اللعب</span><div className="gameTypeButtons">{(["صن", "حكم"] as GameType[]).map((type) => <button type="button" key={type} className={gameType === type ? "active" : ""} onClick={() => { setGameType(type); setProjects([]); if (type !== "حكم" && multiplier > 2) { setMultiplier(1); setMultiplierAnnouncer(null); } }}>{type}</button>)}</div></div>
      <div className="twoColumns">
        <label>أدخل عدد أي فريق<select value={enteredTeam} onChange={(event) => setEnteredTeam(event.target.value as TeamCode)}><option value="A">الفريق الأول</option><option value="B">الفريق الثاني</option></select></label>
        <label>عدد الورق<input type="number" min="0" value={rawScore} onChange={(event) => setRawScore(Number(event.target.value))} /></label>
      </div>
      <div className="twoColumns">
        <label>المضاعفة<select value={multiplier} onChange={(event) => { const value = Number(event.target.value) as Multiplier; setMultiplier(value); setMultiplierAnnouncer(null); }}><option value={1}>عادي</option><option value={2} disabled={gameType !== "حكم" && !sunDoubleAllowed}>دبل</option><option value={3} disabled={gameType !== "حكم"}>ثري</option><option value={4} disabled={gameType !== "حكم"}>فور</option><option value={152} disabled={gameType !== "حكم"}>قهوة</option></select></label>
        <label>آخر من رفع الطلب<select disabled={multiplier === 1} value={multiplierAnnouncer ?? ""} onChange={(event) => setMultiplierAnnouncer(Number(event.target.value))}><option value="">اختر اللاعب</option>{names.map((name, index) => { const originalTeam = teamForSeat(originalBidder); const expected = multiplier === 2 || multiplier === 4 ? oppositeTeam(originalTeam) : originalTeam; return <option key={index} value={index} disabled={multiplier !== 1 && teamForSeat(index) !== expected}>{name || `اللاعب ${index + 1}`}</option>; })}</select></label>
      </div>
      <h3>المشاريع</h3>
      <div className="projectTeams">{(["A", "B"] as TeamCode[]).map((team) => <div className="projectTeam" key={team}>
        <strong>{team === "A" ? "الفريق الأول" : "الفريق الثاني"}</strong>
        {projectTypes.filter((type) => !(gameType !== "حكم" && type === "بلوت") && !(gameType === "حكم" && type === "أربعمئة")).map((type) => <div className="projectItem" key={type}><span>{type}</span><div><button onClick={() => changeProject(team, type, -1)}><Minus size={15}/></button><b>{qty(team, type)}</b><button onClick={() => changeProject(team, type, 1)}><Plus size={15}/></button></div></div>)}
      </div>)}</div>
      {pSummary.tied && <label>المشاريع متساوية، تُحسب لمن؟<select value={tieWinner ?? ""} onChange={(event) => setTieWinner(event.target.value as TeamCode)}><option value="">اختر الفريق</option><option value="A">الفريق الأول</option><option value="B">الفريق الثاني</option></select></label>}
      <div className="kabootRow"><button className={kaboot === "A" ? "active" : ""} onClick={() => { setKaboot(kaboot === "A" ? null : "A"); setReverseKaboot(null); }}>كبوت للأول</button><button className={kaboot === "B" ? "active" : ""} onClick={() => { setKaboot(kaboot === "B" ? null : "B"); setReverseKaboot(null); }}>كبوت للثاني</button></div>
      {gameType !== "حكم" && <div className="kabootRow"><button className={reverseKaboot === "A" ? "active" : ""} onClick={() => { setReverseKaboot(reverseKaboot === "A" ? null : "A"); setKaboot(null); }}>كبوت عكسي للأول</button><button className={reverseKaboot === "B" ? "active" : ""} onClick={() => { setReverseKaboot(reverseKaboot === "B" ? null : "B"); setKaboot(null); }}>كبوت عكسي للثاني</button></div>}
      <button className="primary wide" onClick={saveRound} disabled={endState.ended && editing === null}>{editing ? "حفظ تعديل الراوند" : "تسجيل الراوند"}</button>
      {!finalSummary && notice && <p className="formMessage">{notice}</p>}
      {rounds.length > 0 && !endState.ended && <button className="textButton" onClick={discardAndStartNewMatch}>إلغاء الحالية وبدء صكة جديدة</button>}
    </div>}

    <div className="card">
      <div className="sectionHeader"><h3>راوندات الصكة الحالية</h3></div>
      {endState.suddenDeath && <p className="formMessage">تعادل بعد ١٥٢ — تبدأ جولة فاصلة</p>}
      {rounds.length === 0 ? <p className="empty">ابدأ بتسجيل أول راوند.</p> : <div className="roundList">{[...rounds].reverse().map((round) => <div className="roundCard" key={round.sequence_no}>
        <button className="roundRow detailed" onClick={() => setExpanded(expanded === round.sequence_no ? null : round.sequence_no)}><div><span>الراوند {round.sequence_no} · {round.game_type}</span><small>{round.multiplier === 152 ? "قهوة" : `×${round.multiplier}`} · {round.bidder_failed ? "الطالع طاح" : "طلب ناجح"}</small></div><strong>{round.team_a_total} - {round.team_b_total}</strong>{expanded === round.sequence_no ? <ChevronUp size={17}/> : <ChevronDown size={17}/>}</button>
        {expanded === round.sequence_no && <div className="roundDetails"><span>عدد الورق: {round.raw_card_score}</span><span>الأساس: {round.team_a_base} - {round.team_b_base}</span><span>المشاريع: {round.team_a_projects + round.team_a_baloot} - {round.team_b_projects + round.team_b_baloot}</span>{!saved && <button onClick={() => editRound(round)}>تعديل الراوند</button>}</div>}
      </div>)}</div>}
    </div>
  </section>;
}
