import { DEFAULT_STADIUM, type StadiumPrefs } from "./types";

export function normalizeStadium(raw?: Partial<StadiumPrefs> | null): StadiumPrefs {
  return {
    sky: raw?.sky === "day" || raw?.sky === "sunset" || raw?.sky === "night" ? raw.sky : DEFAULT_STADIUM.sky,
    weather: raw?.weather === "rain" ? "rain" : "clear",
    crowd: raw?.crowd === "low" ? "low" : "full",
    camera: raw?.camera === "sideline" || raw?.camera === "tactical" ? raw.camera : "broadcast",
    pitch: raw?.pitch === "worn" || raw?.pitch === "dry" ? raw.pitch : "lush",
    roof: raw?.roof === "partial" || raw?.roof === "closed" ? raw.roof : "open",
    lights: raw?.lights === "warm" || raw?.lights === "off" ? raw.lights : "led",
    seats: raw?.seats === "red" || raw?.seats === "blue" || raw?.seats === "gold" || raw?.seats === "green" ? raw.seats : "mixed",
  };
}
