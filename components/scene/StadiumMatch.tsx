"use client";

import { ThreeCanvas } from "@/components/scene/ThreeCanvas";
import { FORMATION_SLOTS } from "@/lib/formations";
import { normalizeStadium } from "@/lib/stadium";
import { photoBody } from "@/lib/player-photo";
import { clipForEvent } from "@/lib/player-anims";
import { createPlayerFigure, tickPlayerFigure } from "@/lib/three-player";
import {
  applyStadiumLights,
  cameraFor,
  createRain,
  createStadium,
  pitchToWorld,
  tickRain,
} from "@/lib/three-stadium";
import type { Player, StadiumPrefs, Team, TeamPlayer, TimelineEvent } from "@/lib/types";
import { useCallback, useRef } from "react";
import * as THREE from "three";

type Roster = TeamPlayer & { player: Player };

export function StadiumMatch({
  home,
  away,
  homeStarters,
  awayStarters,
  event,
  prefs,
}: {
  home: Team;
  away: Team;
  homeStarters: Roster[];
  awayStarters: Roster[];
  event: TimelineEvent;
  prefs?: StadiumPrefs;
}) {
  const figures = useRef<Map<string, THREE.Group>>(new Map());
  const ball = useRef<THREE.Mesh | null>(null);
  const rain = useRef<THREE.Points | null>(null);
  const clock = useRef(0);
  const eventRef = useRef(event);
  eventRef.current = event;
  const stadium = normalizeStadium(prefs ?? home.stadium);

  const build = useCallback(
    (scene: THREE.Scene, camera: THREE.PerspectiveCamera) => {
      applyStadiumLights(scene, stadium);
      scene.add(createStadium(stadium));
      if (stadium.weather === "rain") {
        rain.current = createRain();
        scene.add(rain.current);
      }
      const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.22, 16, 12),
        new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.4 }),
      );
      sphere.castShadow = true;
      ball.current = sphere;
      scene.add(sphere);

      const place = (rows: Roster[], team: Team, homeSide: boolean) => {
        for (const row of rows) {
          const fig = createPlayerFigure({
            id: row.player.id,
            kit: team.kit_primary,
            kitSecondary: team.kit_secondary,
            kitStyle: team.kit_style,
            gk: row.player.position === "KL",
            bodyUrl: photoBody(row.player),
          });
          fig.scale.setScalar(1.22);
          figures.current.set(row.id, fig);
          scene.add(fig);
          const slots = FORMATION_SLOTS[team.formation];
          const slot = slots.find((s) => s.key === row.squad_position) ?? slots[0]!;
          const x = homeSide ? slot.x : 100 - slot.x;
          const y = homeSide ? slot.y : 100 - slot.y;
          const w = pitchToWorld(x, y);
          fig.position.set(w.x, 0, w.z);
          fig.rotation.y = homeSide ? 0 : Math.PI;
        }
      };
      place(homeStarters, home, true);
      place(awayStarters, away, false);
      cameraFor(stadium, camera);
      return () => {
        figures.current.clear();
        ball.current = null;
        rain.current = null;
      };
    },
    [away, awayStarters, home, homeStarters, stadium],
  );

  const onFrame = useCallback((dt: number) => {
    clock.current += dt;
    const ev = eventRef.current;
    if (ball.current) {
      const w = pitchToWorld(ev.ball.x, ev.ball.y);
      ball.current.position.lerp(new THREE.Vector3(w.x, 0.22, w.z), 0.18);
    }
    if (rain.current) tickRain(rain.current, dt);
    const move = (rows: Roster[], team: Team, homeSide: boolean) => {
      const slots = FORMATION_SLOTS[team.formation];
      for (const row of rows) {
        const fig = figures.current.get(row.id);
        if (!fig) continue;
        const slot = slots.find((s) => s.key === row.squad_position) ?? slots[0]!;
        const baseX = homeSide ? slot.x : 100 - slot.x;
        const baseY = homeSide ? slot.y : 100 - slot.y;
        const involved = ev.actorId === row.player.id;
        const attacking = ev.team === (homeSide ? "home" : "away");
        const clip = clipForEvent({
          eventType: ev.eventType,
          minute: ev.minute,
          actorId: ev.actorId,
          playerId: row.player.id,
          gk: row.player.position === "KL",
          involved,
          attacking,
        });
        const pull = involved ? 0.55 : attacking ? 0.12 : 0.04;
        const x = baseX + (ev.ball.x - baseX) * pull;
        const y = baseY + (ev.ball.y - baseY) * pull;
        const w = pitchToWorld(x, y);
        fig.position.x += (w.x - fig.position.x) * 0.12;
        fig.position.z += (w.z - fig.position.z) * 0.12;
        fig.rotation.y = homeSide ? 0 : Math.PI;
        tickPlayerFigure(fig, clock.current, clip, involved || attacking);
      }
    };
    move(homeStarters, home, true);
    move(awayStarters, away, false);
  }, [away, awayStarters, home, homeStarters]);

  return (
    <ThreeCanvas
      key={`${stadium.sky}-${stadium.weather}-${stadium.crowd}-${stadium.camera}-${stadium.pitch}-${stadium.roof}-${stadium.lights}-${stadium.seats}-${home.id}-${away.id}`}
      className="aspect-[16/10] min-h-[240px] w-full overflow-hidden rounded-xl bg-[#07140c] sm:min-h-[320px]"
      build={build}
      onFrame={onFrame}
    />
  );
}
