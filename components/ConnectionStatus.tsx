"use client";

import { useEffect, useState } from "react";

export default function ConnectionStatus() {
  const [online, setOnline] = useState<boolean | null>(null);

  useEffect(() => {
    const sync = () => setOnline(navigator.onLine);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  if (online !== false) return null;

  return (
    <div className="connectionBanner" role="status" aria-live="polite">
      لا يوجد اتصال — يمكنك فتح التطبيق، لكن حفظ الصكة وتحديث الإحصائيات يحتاجان الإنترنت
    </div>
  );
}
