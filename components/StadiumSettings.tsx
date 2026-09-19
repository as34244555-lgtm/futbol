"use client";

import { Button } from "@/components/ui/Button";
import { useI18n } from "@/lib/i18n";
import {
  STADIUM_CAMERAS,
  STADIUM_CROWD,
  STADIUM_LIGHTS,
  STADIUM_PITCHES,
  STADIUM_ROOFS,
  STADIUM_SEATS,
  STADIUM_SKIES,
  STADIUM_WEATHER,
  type StadiumPrefs,
} from "@/lib/types";
import type { ReactNode } from "react";

export function StadiumSettings({
  value,
  onChange,
}: {
  value: StadiumPrefs;
  onChange: (next: StadiumPrefs) => void;
}) {
  const { t } = useI18n();
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-400">{t("stadium.title")}</p>
      <Row label={t("stadium.sky")}>
        {STADIUM_SKIES.map((s) => (
          <Button key={s} size="sm" variant={value.sky === s ? "gold" : "ghost"} onClick={() => onChange({ ...value, sky: s })}>
            {t(`sky.${s}`)}
          </Button>
        ))}
      </Row>
      <Row label={t("stadium.weather")}>
        {STADIUM_WEATHER.map((s) => (
          <Button key={s} size="sm" variant={value.weather === s ? "gold" : "ghost"} onClick={() => onChange({ ...value, weather: s })}>
            {t(`weather.${s}`)}
          </Button>
        ))}
      </Row>
      <Row label={t("stadium.crowd")}>
        {STADIUM_CROWD.map((s) => (
          <Button key={s} size="sm" variant={value.crowd === s ? "gold" : "ghost"} onClick={() => onChange({ ...value, crowd: s })}>
            {t(`crowd.${s}`)}
          </Button>
        ))}
      </Row>
      <Row label={t("stadium.camera")}>
        {STADIUM_CAMERAS.map((s) => (
          <Button key={s} size="sm" variant={value.camera === s ? "gold" : "ghost"} onClick={() => onChange({ ...value, camera: s })}>
            {t(`camera.${s}`)}
          </Button>
        ))}
      </Row>
      <Row label={t("stadium.pitch")}>
        {STADIUM_PITCHES.map((s) => (
          <Button key={s} size="sm" variant={(value.pitch ?? "lush") === s ? "gold" : "ghost"} onClick={() => onChange({ ...value, pitch: s })}>
            {t(`pitch.${s}`)}
          </Button>
        ))}
      </Row>
      <Row label={t("stadium.roof")}>
        {STADIUM_ROOFS.map((s) => (
          <Button key={s} size="sm" variant={(value.roof ?? "open") === s ? "gold" : "ghost"} onClick={() => onChange({ ...value, roof: s })}>
            {t(`roof.${s}`)}
          </Button>
        ))}
      </Row>
      <Row label={t("stadium.lights")}>
        {STADIUM_LIGHTS.map((s) => (
          <Button key={s} size="sm" variant={(value.lights ?? "led") === s ? "gold" : "ghost"} onClick={() => onChange({ ...value, lights: s })}>
            {t(`lights.${s}`)}
          </Button>
        ))}
      </Row>
      <Row label={t("stadium.seats")}>
        {STADIUM_SEATS.map((s) => (
          <Button key={s} size="sm" variant={(value.seats ?? "mixed") === s ? "gold" : "ghost"} onClick={() => onChange({ ...value, seats: s })}>
            {t(`seats.${s}`)}
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
