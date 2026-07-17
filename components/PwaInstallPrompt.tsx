"use client";

import { Download, Share2, X } from "lucide-react";
import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

declare global {
  interface Navigator {
    standalone?: boolean;
  }
}

const DISMISS_KEY = "balot-arena-install-dismissed";

export default function PwaInstallPrompt() {
  const [visible, setVisible] = useState(false);
  const [ios, setIos] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
    const dismissed = window.localStorage.getItem(DISMISS_KEY) === "1";
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    setIos(isIos);

    if (standalone || dismissed) return;

    const onPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    const timer = window.setTimeout(() => {
      if (isIos) setVisible(true);
    }, 1200);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", onPrompt);
    };
  }, []);

  const dismiss = () => {
    window.localStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  };

  const install = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    if (result.outcome === "accepted") setVisible(false);
    setDeferredPrompt(null);
  };

  if (!visible) return null;

  return (
    <aside className="pwaInstallPrompt" aria-label="تثبيت Balot Arena">
      <button className="pwaInstallClose" onClick={dismiss} aria-label="إخفاء رسالة التثبيت">
        <X size={18} />
      </button>
      <img src="/icons/icon-192.png" alt="" width="54" height="54" />
      <div>
        <strong>ثبّت Balot Arena على جهازك</strong>
        {ios ? (
          <p><Share2 size={16} aria-hidden="true" /> اضغط زر المشاركة في Safari، ثم اختر «إضافة إلى الشاشة الرئيسية».</p>
        ) : (
          <p>افتح التطبيق مباشرة من الشاشة الرئيسية مثل أي تطبيق آخر.</p>
        )}
      </div>
      {!ios && deferredPrompt && (
        <button className="primary compact" onClick={install}>
          <Download size={17} /> تثبيت
        </button>
      )}
    </aside>
  );
}
