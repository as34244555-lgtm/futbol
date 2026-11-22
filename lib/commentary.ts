"use client";

import { isMuted } from "./sfx";

const LINES: Record<string, string[]> = {
  goal: ["Gooool!", "Filelerdeee!", "Muhteşem bir gol!", "Kale yıkıldı!"],
  shot: ["Şut geliyor!", "Kaleye deneme!", "Tehlikeli bir şut!"],
  save: ["Kaleci kurtardı!", "Müthiş bir kurtarış!", "Top dışarı!"],
  skill: ["Ne beceri!", "Çalımlar peş peşe!", "Rakibi eledi!"],
  corner: ["Korner!", "Kale sahasına top!", "Durak topu!"],
  freekick: ["Serbest vuruş!", "Duvar kuruluyor!", "Tehlikeli pozisyon!"],
  penalty: ["Penaltı!", "Nokta vuruşu!", "Kaleciyle karşı karşıya!"],
  tackle: ["Sert müdahale!", "Topu kaptı!", "Pres yüksek!"],
  pass: ["Akıcı pas!", "Ara pası arıyor!", "Kanatlara açıldı!"],
  kickoff: ["Maç başladı!", "İlk düdük!", "Top ortada!"],
  half: ["İlk yarı bitti!", "Devre arası!", "İkinci yarıya!"],
  full: ["Maç bitti!", "Son düdük!", "Skor tahtada!"],
};

export function commentLine(event: string, lang: "tr" | "en" = "tr"): string {
  const pool = LINES[event] ?? ["Devam ediyor..."];
  return pool[Math.floor(Math.random() * pool.length)]!;
}

export function speakComment(event: string, lang: "tr" | "en" = "tr") {
  if (typeof window === "undefined" || isMuted()) return;
  const text = commentLine(event, lang);
  try {
    window.speechSynthesis?.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang === "tr" ? "tr-TR" : "en-US";
    u.rate = 1.02;
    u.pitch = 1;
    u.volume = 0.95;
    window.speechSynthesis?.speak(u);
  } catch {
    /* optional */
  }
  return text;
}
