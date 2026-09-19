"use client";

import {
  STADIUM_CAM_LABEL,
  STADIUM_CROWD_LABEL,
  STADIUM_SKY_LABEL,
  STADIUM_WEATHER_LABEL,
} from "@/lib/stadium";
import {
  STADIUM_CAMERAS,
  STADIUM_CROWD,
  STADIUM_SKIES,
  STADIUM_WEATHER,
  type StadiumPrefs,
} from "@/lib/types";
import { Button } from "@/components/ui/Button";
import type { ReactNode } from "react";

export function StadiumSettings({
  value,
  onChange,
}: {
  value: StadiumPrefs;
  onChange: (next: StadiumPrefs) => void;
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-400">Stadyum</p>
      <Row label="Gökyüzü">
        {STADIUM_SKIES.map((s) => (
          <Button key={s} size="sm" variant={value.sky === s ? "gold" : "ghost"} onClick={() => onChange({ ...value, sky: s })}>
            {STADIUM_SKY_LABEL[s]}
          </Button>
        ))}
      </Row>
      <Row label="Hava">
        {STADIUM_WEATHER.map((s) => (
          <Button key={s} size="sm" variant={value.weather === s ? "gold" : "ghost"} onClick={() => onChange({ ...value, weather: s })}>
            {STADIUM_WEATHER_LABEL[s]}
          </Button>
        ))}
      </Row>
      <Row label="Tribün">
        {STADIUM_CROWD.map((s) => (
          <Button key={s} size="sm" variant={value.crowd === s ? "gold" : "ghost"} onClick={() => onChange({ ...value, crowd: s })}>
            {STADIUM_CROWD_LABEL[s]}
          </Button>
        ))}
      </Row>
      <Row label="Kamera">
        {STADIUM_CAMERAS.map((s) => (
          <Button key={s} size="sm" variant={value.camera === s ? "gold" : "ghost"} onClick={() => onChange({ ...value, camera: s })}>
            {STADIUM_CAM_LABEL[s]}
          </Button>
        ))}
      </Row>
    </div>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-[10px] uppercase tracking-wider text-slate-500">{label}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}
