import { DEFAULT_STADIUM, type StadiumPrefs } from "./types";

export const STADIUM_SKY_LABEL: Record<StadiumPrefs["sky"], string> = {
  day: "Gündüz",
  sunset: "Gün batımı",
  night: "Gece",
};

export const STADIUM_WEATHER_LABEL: Record<StadiumPrefs["weather"], string> = {
  clear: "Açık",
  rain: "Yağmur",
};

export const STADIUM_CROWD_LABEL: Record<StadiumPrefs["crowd"], string> = {
  low: "Seyrek",
  full: "Tıklım tıklım",
};

export const STADIUM_CAM_LABEL: Record<StadiumPrefs["camera"], string> = {
  broadcast: "Yayın",
  sideline: "Kenar",
  tactical: "Taktik",
};

export function normalizeStadium(raw?: Partial<StadiumPrefs> | null): StadiumPrefs {
  return {
    sky: raw?.sky === "day" || raw?.sky === "sunset" || raw?.sky === "night" ? raw.sky : DEFAULT_STADIUM.sky,
    weather: raw?.weather === "rain" ? "rain" : "clear",
    crowd: raw?.crowd === "low" ? "low" : "full",
    camera: raw?.camera === "sideline" || raw?.camera === "tactical" ? raw.camera : "broadcast",
  };
}
