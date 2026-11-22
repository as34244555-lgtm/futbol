import type { Position } from "./types";

export type RosterSpec = {
  slot?: number;
  name: string;
  nationality: string;
  nationality_code: string;
  position: Position;
  age: number;
  attack: number;
  defense: number;
  tier: "standard" | "special";
  portrait: string;
};

/** The 24 supplied figures. All outfield. None of them is a goalkeeper. */
export const STANDARD_SPECS: RosterSpec[] = [
  { slot: 0, name: "Deniz Karaman", nationality: "Türkiye", nationality_code: "tr", position: "FV", age: 24, attack: 86, defense: 42, tier: "standard", portrait: "/portraits/p00.webp?v=ef3d" },
  { slot: 1, name: "Luan Ferreira", nationality: "Brezilya", nationality_code: "br", position: "KANAT", age: 23, attack: 84, defense: 48, tier: "standard", portrait: "/portraits/p01.webp?v=ef3d" },
  { slot: 2, name: "Mert Aydın", nationality: "Türkiye", nationality_code: "tr", position: "MOS", age: 25, attack: 78, defense: 76, tier: "standard", portrait: "/portraits/p02.webp?v=ef3d" },
  { slot: 3, name: "Jonas Keller", nationality: "Almanya", nationality_code: "de", position: "STP", age: 28, attack: 52, defense: 86, tier: "standard", portrait: "/portraits/p03.webp?v=ef3d" },
  { slot: 4, name: "Efe Tan", nationality: "Türkiye", nationality_code: "tr", position: "SLB", age: 22, attack: 70, defense: 80, tier: "standard", portrait: "/portraits/p04.webp?v=ef3d" },
  { slot: 5, name: "Niko Brandt", nationality: "Almanya", nationality_code: "de", position: "SĞB", age: 26, attack: 72, defense: 79, tier: "standard", portrait: "/portraits/p05.webp?v=ef3d" },
  { slot: 6, name: "Rafael Costa", nationality: "Portekiz", nationality_code: "pt", position: "FV", age: 27, attack: 85, defense: 44, tier: "standard", portrait: "/portraits/p06.webp?v=ef3d" },
  { slot: 7, name: "Yuto Hanari", nationality: "Japonya", nationality_code: "jp", position: "KANAT", age: 21, attack: 83, defense: 46, tier: "standard", portrait: "/portraits/p07.webp?v=ef3d" },
  { slot: 8, name: "Luka Peric", nationality: "Hırvatistan", nationality_code: "hr", position: "MOS", age: 29, attack: 76, defense: 80, tier: "standard", portrait: "/portraits/p08.webp?v=ef3d" },
  { slot: 9, name: "Sabri Koçhan", nationality: "Türkiye", nationality_code: "tr", position: "STP", age: 30, attack: 48, defense: 87, tier: "standard", portrait: "/portraits/p09.webp?v=ef3d" },
  { slot: 10, name: "Enes Uçar", nationality: "Türkiye", nationality_code: "tr", position: "SLB", age: 24, attack: 68, defense: 81, tier: "standard", portrait: "/portraits/p10.webp?v=ef3d" },
  { slot: 11, name: "Marco Silva", nationality: "Brezilya", nationality_code: "br", position: "SĞB", age: 25, attack: 74, defense: 78, tier: "standard", portrait: "/portraits/p11.webp?v=ef3d" },
  { slot: 12, name: "Iker Navarro", nationality: "İspanya", nationality_code: "es", position: "MOS", age: 27, attack: 80, defense: 74, tier: "standard", portrait: "/portraits/p12.webp?v=ef3d" },
  { slot: 13, name: "Kenzo Mori", nationality: "Japonya", nationality_code: "jp", position: "KANAT", age: 22, attack: 82, defense: 50, tier: "standard", portrait: "/portraits/p13.webp?v=ef3d" },
  { slot: 14, name: "Hugo Berger", nationality: "Fransa", nationality_code: "fr", position: "STP", age: 28, attack: 50, defense: 85, tier: "standard", portrait: "/portraits/p14.webp?v=ef3d" },
  { slot: 15, name: "Nelo Prest", nationality: "Fransa", nationality_code: "fr", position: "FV", age: 26, attack: 88, defense: 40, tier: "standard", portrait: "/portraits/p15.webp?v=ef3d" },
  { slot: 16, name: "Can Yüce", nationality: "Türkiye", nationality_code: "tr", position: "SĞB", age: 23, attack: 71, defense: 80, tier: "standard", portrait: "/portraits/p16.webp?v=ef3d" },
  { slot: 17, name: "Amir Haddad", nationality: "Fransa", nationality_code: "fr", position: "MOS", age: 24, attack: 79, defense: 73, tier: "standard", portrait: "/portraits/p17.webp?v=ef3d" },
  { slot: 18, name: "Diego Vargas", nationality: "Kolombiya", nationality_code: "co", position: "KANAT", age: 23, attack: 84, defense: 47, tier: "standard", portrait: "/portraits/p18.webp?v=ef3d" },
  { slot: 19, name: "Okan Demir", nationality: "Türkiye", nationality_code: "tr", position: "STP", age: 29, attack: 46, defense: 86, tier: "standard", portrait: "/portraits/p19.webp?v=ef3d" },
  { slot: 20, name: "Arda Şen", nationality: "Türkiye", nationality_code: "tr", position: "SLB", age: 21, attack: 73, defense: 78, tier: "standard", portrait: "/portraits/p20.webp?v=ef3d" },
  { slot: 21, name: "Mateo Ruiz", nationality: "İspanya", nationality_code: "es", position: "MOS", age: 26, attack: 77, defense: 75, tier: "standard", portrait: "/portraits/p21.webp?v=ef3d" },
  { slot: 22, name: "Bruno Alves", nationality: "Portekiz", nationality_code: "pt", position: "KANAT", age: 24, attack: 83, defense: 49, tier: "standard", portrait: "/portraits/p22.webp?v=ef3d" },
  { slot: 23, name: "Kerem Aslan", nationality: "Türkiye", nationality_code: "tr", position: "FV", age: 22, attack: 87, defense: 41, tier: "standard", portrait: "/portraits/p23.webp?v=ef3d" },
];

/** Named cards outside the 24. Goalkeepers live here, because the 24 are all outfield. */
export const SPECIAL_SPECS: RosterSpec[] = [
  { name: "Emre Dursun", nationality: "Türkiye", nationality_code: "tr", position: "KL", age: 31, attack: 34, defense: 97, tier: "special", portrait: "/portraits/special/emre-dursun.jpg" },
  { name: "Nils Berger", nationality: "Almanya", nationality_code: "de", position: "KL", age: 27, attack: 30, defense: 94, tier: "special", portrait: "/portraits/special/nils-berger.jpg" },
  { name: "Baran Yıldız", nationality: "Türkiye", nationality_code: "tr", position: "FV", age: 25, attack: 99, defense: 68, tier: "special", portrait: "/portraits/special/baran-yildiz.jpg" },
  { name: "Leandro Costa", nationality: "Brezilya", nationality_code: "br", position: "KANAT", age: 23, attack: 99, defense: 72, tier: "special", portrait: "/portraits/special/leandro-costa.jpg" },
  { name: "Harun Bektaş", nationality: "Türkiye", nationality_code: "tr", position: "STP", age: 29, attack: 72, defense: 99, tier: "special", portrait: "/portraits/special/harun-bektas.jpg" },
  { name: "Idris Ndiaye", nationality: "Senegal", nationality_code: "sn", position: "MOS", age: 26, attack: 92, defense: 90, tier: "special", portrait: "/portraits/special/idris-ndiaye.jpg" },
  { name: "Piero Conti", nationality: "İtalya", nationality_code: "it", position: "SĞB", age: 28, attack: 84, defense: 92, tier: "special", portrait: "/portraits/special/piero-conti.jpg" },
  { name: "Yusuf Acar", nationality: "Türkiye", nationality_code: "tr", position: "KANAT", age: 22, attack: 97, defense: 60, tier: "special", portrait: "/portraits/special/yusuf-acar.jpg" },
  {
    name: "Muhammed Zaid",
    nationality: "Suudi Arabistan",
    nationality_code: "sa",
    position: "FV",
    age: 22,
    attack: 99,
    defense: 70,
    tier: "special",
    portrait: "/portraits/special/muhammed-zaid.jpg",
  },
];
