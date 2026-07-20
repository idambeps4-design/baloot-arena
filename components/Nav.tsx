"use client";
import { Home, Users, Calculator, Trophy, BarChart3 } from "lucide-react";

export type Tab = "home" | "players" | "casual" | "competition" | "standings" | "stats";

const items: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "home", label: "الرئيسية", icon: <Home size={20} /> },
  { id: "players", label: "اللاعبون", icon: <Users size={20} /> },
  { id: "casual", label: "الحسبة", icon: <Calculator size={20} /> },
  { id: "competition", label: "المنافسات", icon: <Trophy size={20} /> },
  { id: "standings", label: "الترتيب", icon: <BarChart3 size={20} /> },
  { id: "stats", label: "الإحصائيات", icon: <BarChart3 size={20} /> },
];

export default function Nav({ tab, setTab }: { tab: Tab; setTab: (tab: Tab) => void }) {
  return <nav className="bottomNav">{items.map(item => (
    <button key={item.id} className={tab === item.id ? "active" : ""} onClick={() => setTab(item.id)}>
      {item.icon}<span>{item.label}</span>
    </button>
  ))}</nav>;
}
