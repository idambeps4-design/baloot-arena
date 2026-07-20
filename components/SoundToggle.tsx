"use client";

import { Volume2, VolumeX } from "lucide-react";
import { useEffect, useState } from "react";

export const SOUND_SETTING_KEY = "baloot-arena-sound-muted";
export const SOUND_SETTING_EVENT = "baloot-arena-sound-change";

export default function SoundToggle() {
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    setMuted(localStorage.getItem(SOUND_SETTING_KEY) === "true");
  }, []);

  function toggle() {
    const next = !muted;
    setMuted(next);
    localStorage.setItem(SOUND_SETTING_KEY, String(next));
    window.dispatchEvent(new CustomEvent(SOUND_SETTING_EVENT, { detail: { muted: next } }));
    if (next) window.speechSynthesis?.cancel();
  }

  return <button className="iconButton" onClick={toggle} aria-label={muted ? "تشغيل صوت النكت" : "كتم صوت النكت"} title={muted ? "تشغيل صوت النكت" : "كتم صوت النكت"}>
    {muted ? <VolumeX size={20}/> : <Volume2 size={20}/>}
  </button>;
}
