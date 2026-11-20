"use client";

import { GameShell } from "@/components/GameShell";
import { HomeMenu } from "@/components/home/HomeMenu";

export default function DashboardPage() {
  return (
    <GameShell bare>
      <HomeMenu />
    </GameShell>
  );
}
