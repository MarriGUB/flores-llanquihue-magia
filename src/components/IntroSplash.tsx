import { useEffect, useState } from "react";
import logo from "@/assets/logo.png";

export function IntroSplash() {
  const [visible, setVisible] = useState(true);
  const [hiding, setHiding] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("intro-shown")) {
      setVisible(false);
      return;
    }
    const hideTimer = setTimeout(() => setHiding(true), 1800);
    const removeTimer = setTimeout(() => {
      setVisible(false);
      sessionStorage.setItem("intro-shown", "1");
    }, 2400);
    return () => {
      clearTimeout(hideTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center transition-opacity duration-500"
      style={{
        background: "var(--gradient-bloom)",
        opacity: hiding ? 0 : 1,
        pointerEvents: hiding ? "none" : "auto",
      }}
    >
      <img
        src={logo}
        alt="Flores Eternas Jovita"
        className="animate-logo-in h-48 w-48 rounded-full object-cover shadow-[var(--shadow-soft)] sm:h-60 sm:w-60"
      />
      <h1
        className="animate-fade-up mt-6 font-display text-3xl text-primary sm:text-4xl"
        style={{ animationDelay: "0.4s" }}
      >
        Flores Eternas Jovita
      </h1>
      <p
        className="animate-fade-up mt-2 text-sm text-muted-foreground sm:text-base"
        style={{ animationDelay: "0.65s" }}
      >
        Hechas con amor y cariño · Llanquihue
      </p>
    </div>
  );
}
