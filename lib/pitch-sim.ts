export type Side = "home" | "away";

export type PitchPlayer = {
  id: string;
  side: Side;
  gk: boolean;
  slotX: number;
  slotY: number;
  x: number;
  y: number;
  pace: number;
  finish: number;
};

export type PitchBall = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  holder: string | null;
  touch: Side;
};

export type PitchState = {
  players: PitchPlayer[];
  ball: PitchBall;
  score: [number, number];
  phase: "play" | "kickoff";
  kickoffLeft: number;
  minute: number;
  /** Real-time length of a 90-minute match. */
  matchSeconds: number;
};

export type Stick = {
  x: number;
  y: number;
  sprint: boolean;
  pass: boolean;
  through: boolean;
  shoot: boolean;
  tackle: boolean;
};

export type RemotePitch = {
  players: { id: string; x: number; y: number }[];
  at: number;
  ball?: PitchBall;
  ballAt?: number;
  score?: [number, number];
} | null;

const GOAL_LO = 43;
const GOAL_HI = 57;

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function dist(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function createPitch(players: PitchPlayer[], matchSeconds = 150): PitchState {
  const copy = players.map((p) => ({ ...p, x: p.slotX, y: p.slotY }));
  const kick = copy.find((p) => p.side === "home" && !p.gk) ?? copy[0];
  return {
    players: copy,
    ball: {
      x: kick?.x ?? 50,
      y: kick?.y ?? 50,
      vx: 0,
      vy: 0,
      holder: kick?.id ?? null,
      touch: "home",
    },
    score: [0, 0],
    phase: "play",
    kickoffLeft: 0,
    minute: 0,
    matchSeconds,
  };
}

function launch(ball: PitchBall, from: PitchPlayer, tx: number, ty: number, speed: number) {
  const dx = tx - from.x;
  const dy = ty - from.y;
  const len = Math.hypot(dx, dy) || 1;
  ball.holder = null;
  ball.touch = from.side;
  ball.x = from.x + (dx / len) * 1.4;
  ball.y = from.y + (dy / len) * 1.4;
  ball.vx = (dx / len) * speed;
  ball.vy = (dy / len) * speed;
}

function pickControlled(mine: PitchPlayer[], ball: PitchBall, control: Side) {
  const holder = mine.find((p) => p.id === ball.holder);
  if (holder) return holder;
  let best = mine.find((p) => !p.gk) ?? mine[0];
  let bestD = Infinity;
  for (const p of mine) {
    if (!p) continue;
    if (p.gk && ball.x > 16 && ball.x < 84) continue;
    const d = dist(p, ball);
    if (d < bestD) {
      bestD = d;
      best = p;
    }
  }
  return best;
}

function bestMate(players: PitchPlayer[], from: PitchPlayer, stick: Stick, control: Side) {
  const atk = control === "home" ? 1 : -1;
  const aimX = stick.y * atk;
  const aimY = stick.x * atk;
  const mates = players.filter((p) => p.side === from.side && p.id !== from.id && !p.gk);
  let best = mates[0];
  let score = -Infinity;
  for (const m of mates) {
    const dx = m.x - from.x;
    const dy = m.y - from.y;
    const len = Math.hypot(dx, dy) || 1;
    const align = aimX === 0 && aimY === 0 ? (control === "home" ? dx : -dx) : (dx / len) * aimX + (dy / len) * aimY;
    const s = align * 8 - len * 0.05;
    if (s > score) {
      score = s;
      best = m;
    }
  }
  return best ?? null;
}

function steerAi(p: PitchPlayer, state: PitchState, step: number) {
  const ball = state.ball;
  if (ball.holder === p.id) {
    const dir = p.side === "home" ? 1 : -1;
    const speed = 8 + p.pace / 22;
    p.x = clamp(p.x + dir * speed * step, 3, 97);
    p.y = clamp(p.y + (50 - p.y) * step * 0.7, 10, 90);
    return;
  }
  let tx = p.slotX;
  let ty = p.slotY;
  if (p.gk) {
    tx = p.side === "home" ? 7 : 93;
    ty = clamp(ball.y, 38, 62);
  } else {
    const shift = (ball.x - 50) * 0.22;
    tx = clamp(p.slotX + shift, 4, 96);
    ty = clamp(p.slotY * 0.72 + ball.y * 0.28, 4, 96);
    if (!ball.holder && dist(p, ball) < 16) {
      tx = ball.x;
      ty = ball.y;
    }
  }
  const speed = p.gk ? 8 : 6.5 + p.pace / 28;
  const dx = tx - p.x;
  const dy = ty - p.y;
  const len = Math.hypot(dx, dy) || 1;
  const m = Math.min(speed * step, len);
  p.x += (dx / len) * m;
  p.y += (dy / len) * m;
}

function kickoff(state: PitchState, side: Side) {
  for (const p of state.players) {
    p.x = p.slotX;
    p.y = p.slotY;
  }
  const taker =
    state.players.find((p) => p.side === side && !p.gk && p.slotX > 40 && p.slotX < 70) ??
    state.players.find((p) => p.side === side && !p.gk);
  state.ball = {
    x: 50,
    y: 50,
    vx: 0,
    vy: 0,
    holder: taker?.id ?? null,
    touch: side,
  };
  if (taker) {
    taker.x = 50;
    taker.y = 50;
  }
  state.phase = "kickoff";
  state.kickoffLeft = 1.1;
}

export function tickPitch(
  state: PitchState,
  dt: number,
  control: Side,
  stick: Stick,
  remote: RemotePitch,
  now = Date.now(),
): { goal: Side | null; done: boolean } {
  const step = Math.min(0.05, Math.max(0, dt));
  state.minute = Math.min(90, state.minute + (step * 90) / state.matchSeconds);
  if (remote?.score) {
    state.score[0] = Math.max(state.score[0], remote.score[0]);
    state.score[1] = Math.max(state.score[1], remote.score[1]);
  }
  if (state.phase === "kickoff") {
    state.kickoffLeft -= step;
    if (state.kickoffLeft <= 0) state.phase = "play";
    return { goal: null, done: state.minute >= 90 };
  }

  const remoteFresh = Boolean(remote && now - remote.at < 1200);
  if (
    remote?.ball &&
    remote.ball.touch !== control &&
    (remote.ballAt ?? 0) > 0 &&
    remoteFresh
  ) {
    const localHolder = state.players.find((p) => p.id === state.ball.holder);
    if (!localHolder || localHolder.side !== control) {
      state.ball = { ...remote.ball };
    }
  }

  const mine = state.players.filter((p) => p.side === control);
  const controlled = pickControlled(mine, state.ball, control);
  const remoteMap = new Map(remoteFresh ? remote!.players.map((p) => [p.id, p]) : []);
  const atk = control === "home" ? 1 : -1;

  for (const p of state.players) {
    if (p.side !== control && remoteMap.has(p.id)) {
      const r = remoteMap.get(p.id)!;
      const k = Math.min(1, step * 10);
      p.x += (r.x - p.x) * k;
      p.y += (r.y - p.y) * k;
      continue;
    }
    if (controlled && p.id === controlled.id) {
      const speed = (p.gk ? 6.5 : 8.5 + p.pace / 16) * (stick.sprint ? 1.55 : 1);
      p.x = clamp(p.x + stick.y * atk * speed * step, 2, 98);
      p.y = clamp(p.y + stick.x * atk * speed * step, 3, 97);
      continue;
    }
    steerAi(p, state, step);
  }

  const wantPass = stick.pass;
  const wantThrough = stick.through;
  const wantShoot = stick.shoot;
  const wantTackle = stick.tackle;
  stick.pass = false;
  stick.through = false;
  stick.shoot = false;
  stick.tackle = false;

  const holder = state.players.find((p) => p.id === state.ball.holder) ?? null;
  if (controlled && holder?.id === controlled.id) {
    if (wantShoot) {
      const targetX = control === "home" ? 106 : -6;
      const wobble = (Math.random() - 0.5) * (16 - controlled.finish / 12);
      launch(state.ball, controlled, targetX, 50 + wobble, 36);
    } else if (wantThrough || wantPass) {
      const mate = bestMate(state.players, controlled, stick, control);
      if (mate) {
        const lead = wantThrough ? 14 : 0;
        launch(state.ball, controlled, mate.x + atk * lead, mate.y, wantThrough ? 32 : 24);
      }
    }
  } else if (wantTackle && holder && holder.side !== control && controlled && dist(controlled, holder) < 2.6) {
    state.ball.holder = controlled.id;
    state.ball.touch = control;
    state.ball.vx = 0;
    state.ball.vy = 0;
  }

  let goal: Side | null = null;
  if (state.ball.holder) {
    const h = state.players.find((p) => p.id === state.ball.holder);
    if (h) {
      state.ball.x = h.x;
      state.ball.y = h.y;
      state.ball.vx = 0;
      state.ball.vy = 0;
      const attacking = h.side === "home" ? h.x > 80 : h.x < 20;
      if (h.side !== control && attacking && !remoteFresh && Math.random() < step * 1.6) {
        launch(state.ball, h, h.side === "home" ? 106 : -6, 50, 33);
      }
    }
  }

  if (!state.ball.holder) {
    state.ball.x += state.ball.vx * step;
    state.ball.y += state.ball.vy * step;
    const drag = Math.pow(0.28, step);
    state.ball.vx *= drag;
    state.ball.vy *= drag;
    for (const p of state.players) {
      if (p.gk) {
        const near = p.side === "home" ? state.ball.x < 14 : state.ball.x > 86;
        if (near && dist(p, state.ball) < 3.4) {
          state.ball.holder = p.id;
          state.ball.touch = p.side;
          state.ball.vx = 0;
          state.ball.vy = 0;
        }
      }
    }
    if (!state.ball.holder) {
      let catcher: PitchPlayer | null = null;
      let bestD = 1.25;
      for (const p of state.players) {
        const d = dist(p, state.ball);
        if (d < bestD) {
          bestD = d;
          catcher = p;
        }
      }
      if (catcher && Math.hypot(state.ball.vx, state.ball.vy) < 20) {
        state.ball.holder = catcher.id;
        state.ball.touch = catcher.side;
      }
    }
    if (state.ball.y < GOAL_LO || state.ball.y > GOAL_HI) {
      if (state.ball.x < 1.5 || state.ball.x > 98.5) {
        state.ball.vx *= -0.45;
        state.ball.x = clamp(state.ball.x, 1.5, 98.5);
      }
    }
    if (state.ball.y < 1.5 || state.ball.y > 98.5) {
      state.ball.vy *= -0.45;
      state.ball.y = clamp(state.ball.y, 1.5, 98.5);
    }
    if (state.ball.x >= 100 && state.ball.y >= GOAL_LO && state.ball.y <= GOAL_HI) {
      state.score[0] += 1;
      goal = "home";
      kickoff(state, "away");
    } else if (state.ball.x <= 0 && state.ball.y >= GOAL_LO && state.ball.y <= GOAL_HI) {
      state.score[1] += 1;
      goal = "away";
      kickoff(state, "home");
    }
  }

  return { goal, done: state.minute >= 90 };
}
