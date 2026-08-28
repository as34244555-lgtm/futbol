export const POSITIONS = ["KL", "DEF", "OS", "FV"] as const;
export type Position = (typeof POSITIONS)[number];

export const POSITION_LABEL: Record<Position, string> = {
  KL: "Kaleci",
  DEF: "Defans",
  OS: "Orta Saha",
  FV: "Forvet",
};

export const TACTICS = ["BALANCED", "ATTACKING", "DEFENSIVE", "POSSESSION", "COUNTER"] as const;
export type Tactic = (typeof TACTICS)[number];

export const TACTIC_LABEL: Record<Tactic, string> = {
  BALANCED: "Dengeli",
  ATTACKING: "Hücum",
  DEFENSIVE: "Savunma",
  POSSESSION: "Topa Sahip Olma",
  COUNTER: "Kontra Atak",
};

export const FORMATIONS = ["4-3-3", "4-4-2", "3-5-2", "4-2-3-1", "5-3-2", "3-4-3"] as const;
export type Formation = (typeof FORMATIONS)[number];

export const TRANSFER_STATUS = ["active", "sold", "cancelled"] as const;
export type TransferStatus = (typeof TRANSFER_STATUS)[number];

export const MATCH_STATUS = ["pending", "completed"] as const;
export type MatchStatus = (typeof MATCH_STATUS)[number];

export type Profile = {
  id: string;
  username: string;
  created_at: string;
};

export type Team = {
  id: string;
  user_id: string | null;
  name: string;
  coins: number;
  division: number;
  formation: Formation;
  tactics: Tactic;
  points: number;
  created_at: string;
  kit_primary: string;
  kit_secondary: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goals_for: number;
  goals_against: number;
};

export type Player = {
  id: string;
  name: string;
  nationality: string;
  nationality_code: string;
  position: Position;
  age: number;
  attack: number;
  defense: number;
  overall: number;
  base_value: number;
};

export type TeamPlayer = {
  id: string;
  team_id: string;
  player_id: string;
  energy: number;
  form: number;
  is_starter: boolean;
  squad_position: string | null;
  acquired_at: string;
};

export type TransferListing = {
  id: string;
  team_player_id: string;
  seller_team_id: string;
  price: number;
  status: TransferStatus;
  created_at: string;
};

export type Match = {
  id: string;
  home_team_id: string | null;
  away_team_id: string | null;
  home_score: number;
  away_score: number;
  status: MatchStatus;
  played_at: string;
  week: number;
  /** İnsan-insan maçında hafta, her iki menajer de sonucu açana kadar kapanmaz. */
  claimed_by?: string[];
};

export type MatchLog = {
  id: string;
  match_id: string;
  minute: number;
  event_type: string;
  description: string;
};

export type PitchPoint = { x: number; y: number };

export type TimelineEvent = {
  minute: number;
  second: number;
  eventType: string;
  description: string;
  ball: PitchPoint;
  actorName?: string;
  actorId?: string;
  team: "home" | "away" | "neutral";
  score: [number, number];
};

export type MatchSimulationResult = {
  match: Match;
  logs: MatchLog[];
  timeline: TimelineEvent[];
  motm?: { playerId: string; name: string; team: "home" | "away" };
  coinsDelta?: number;
  pointsDelta?: number;
};

export type GameWorld = {
  players: Player[];
  teams: Team[];
  teamPlayers: TeamPlayer[];
  listings: TransferListing[];
  matches: Match[];
  matchLogs: MatchLog[];
  week: number;
  season: number;
};

export type Account = {
  id: string;
  username: string;
  passwordHash: string;
  created_at: string;
};

export type SessionUser = {
  id: string;
  username: string;
  teamId: string;
  roomCode?: string;
};

export type ManagerInfo = {
  userId: string;
  username: string;
  teamId: string;
  teamName: string;
  lastSeen: string | null;
  online: boolean;
  kind: "human" | "bot";
};

export type LeagueDocument = {
  version: number;
  world: GameWorld;
  accounts: Account[];
  lastSim: Record<string, MatchSimulationResult>;
  lastSeen: Record<string, string>;
};

export type SquadSlot = {
  key: string;
  position: Position;
  label: string;
  x: number;
  y: number;
};

export type CommunityPlayerRow = {
  name: string;
  nationality: string;
  nationality_code?: string;
  position: string;
  age: number;
  attack: number;
  defense: number;
  overall?: number;
  base_value?: number;
};

export const SAVE_KEY = "futbol-save-v1";
export const SYSTEM_TEAM_ID = "00000000-0000-4000-8000-000000agency0";
export const USER_TEAM_SLOT = "user";
export const ONLINE_MS = 25_000;
