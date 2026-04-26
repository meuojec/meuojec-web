"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const [light, setLight] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("meuojec-theme");
    if (saved === "light") {
      setLight(true);
      document.documentElement.classList.add("light");
    }
  }, []);

  function toggle() {
    const next = !light;
    setLight(next);
    if (next) {
      document.documentElement.classList.add("light");
      localStorage.setItem("meuojec-theme", "light");
    } else {
      document.documentElement.classList.remove("light");
      localStorage.setItem("meuojec-theme", "dark");
    }
  }

  return (
    <button
      onClick={toggle}
      title={light ? "Cambiar a modo oscuro" : "Cambiar a modo claro"}
      className="flex items-center justify-center w-8 h-8 rounded-lg border border-white/10 hover:bg-white/5 transition shrink-0"
      aria-label="Cambiar tema"
    >
      {light ? (
        <Moon className="h-4 w-4 text-white/70" />
      ) : (
        <Sun className="h-4 w-4 text-white/70" />
      )}
    </button>
  );
}
