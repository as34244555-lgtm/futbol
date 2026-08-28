export type Nation = {
  code: string;
  name: string;
  first: string[];
  last: string[];
};

export const NATIONS: Nation[] = [
  {
    code: "tr",
    name: "Türkiye",
    first: ["Kerem", "Arda", "Emre", "Baran", "Yusuf", "Ozan", "Mert", "Can", "Deniz", "Efe", "Burak", "Hakan", "Serkan", "Tolga", "Alp"],
    last: ["Yıldızhan", "Karataş", "Demirsoy", "Aslanbey", "Koçhan", "Yücel", "Aksoy", "Erdal", "Tunçer", "Özbek", "Sancak", "Baran"],
  },
  {
    code: "br",
    name: "Brezilya",
    first: ["Lucas", "Rafael", "Thiago", "Mateus", "Caio", "Bruno", "Diego", "Nico", "Luan", "Pedro"],
    last: ["Silva", "Costa", "Nunes", "Teixeira", "Moreira", "Vasquez", "Alves", "Ribeiro", "Santos", "Faria"],
  },
  {
    code: "de",
    name: "Almanya",
    first: ["Lukas", "Jonas", "Niklas", "Leon", "Finn", "Max", "Erik", "Timo", "Kai", "Julian"],
    last: ["Bergmann", "Hoffner", "Kramer", "Vogel", "Richter", "Hahn", "Steiner", "Keller", "Wolff", "Brandt"],
  },
  {
    code: "ar",
    name: "Arjantin",
    first: ["Mateo", "Joaquin", "Tomas", "Franco", "Santiago", "Enzo", "Ian", "Lautaro", "Bautista", "Valentino"],
    last: ["Roldan", "Ibarra", "Paredes", "Quiroga", "Bustos", "Ferreyra", "Molina", "Caceres", "Nunez", "Sosa"],
  },
  {
    code: "fr",
    name: "Fransa",
    first: ["Hugo", "Noah", "Louis", "Jules", "Ethan", "Aaron", "Malik", "Theo", "Adam", "Noham"],
    last: ["Moreau", "Durand", "Petit", "Laurent", "Roussel", "Garnier", "Blanc", "Noel", "Marchand", "Collet"],
  },
  {
    code: "es",
    name: "İspanya",
    first: ["Hugo", "Mateo", "Pablo", "Alejandro", "Daniel", "Marco", "Iker", "Alvaro", "Sergio", "Oscar"],
    last: ["Navarro", "Crespo", "Molina", "Iglesias", "Vega", "Serrano", "Campos", "Reyes", "Ortega", "Cano"],
  },
  {
    code: "pt",
    name: "Portekiz",
    first: ["Diogo", "Rui", "Goncalo", "Tiago", "Nuno", "Afonso", "Miguel", "Andre", "Pedro", "Rafa"],
    last: ["Ferreira", "Almeida", "Carvalho", "Mendes", "Rocha", "Teixeira", "Lopes", "Pinto", "Neves", "Soares"],
  },
  {
    code: "nl",
    name: "Hollanda",
    first: ["Daan", "Sem", "Luuk", "Finn", "Milan", "Lars", "Bram", "Sven", "Niels", "Jasper"],
    last: ["de Vries", "Bakker", "Visser", "Meijer", "Willems", "Bos", "Hendriks", "Dekker", "Prinsen", "Van Loon"],
  },
  {
    code: "it",
    name: "İtalya",
    first: ["Lorenzo", "Mattia", "Luca", "Alessandro", "Marco", "Davide", "Nicolo", "Federico", "Andrea", "Giovanni"],
    last: ["Ricci", "Greco", "Romano", "Gallo", "Costa", "Fontana", "Moretti", "Marchetti", "Vitale", "Rizzo"],
  },
  {
    code: "gb-eng",
    name: "İngiltere",
    first: ["Harry", "Jack", "Oliver", "George", "Charlie", "Noah", "Leo", "Finley", "Archie", "Mason"],
    last: ["Hartley", "Bennett", "Colton", "Hayes", "Whitmore", "Shaw", "Reed", "Foster", "Brooks", "Nash"],
  },
  {
    code: "ng",
    name: "Nijerya",
    first: ["Chidi", "Tunde", "Emeka", "Ifeanyi", "Segun", "Kelechi", "Yusuf", "Ade", "Nnamdi", "Bayo"],
    last: ["Okafor", "Okoye", "Nwankwo", "Nwosu", "Chukwu", "Obi", "Lawal", "Adebayo", "Olatunji", "Chibueze"],
  },
  {
    code: "sn",
    name: "Senegal",
    first: ["Mamadou", "Ibrahima", "Cheikh", "Ousmane", "Pape", "Sadio", "Kalidou", "Ismaila", "Boulaye", "Nampalys"],
    last: ["Diop", "Ndiaye", "Fall", "Thiam", "Gueye", "Sow", "Diallo", "Ba", "Seck", "Faye"],
  },
  {
    code: "jp",
    name: "Japonya",
    first: ["Haruto", "Yuto", "Sota", "Ren", "Kaito", "Riku", "Hinata", "Kota", "Minato", "Asahi"],
    last: ["Tanaka", "Yamamoto", "Nakamura", "Kobayashi", "Kato", "Yoshida", "Sasaki", "Matsumoto", "Inoue", "Kimura"],
  },
  {
    code: "kr",
    name: "Güney Kore",
    first: ["Minjun", "Seojoon", "Jiwon", "Hyunwoo", "Taeyang", "Jisung", "Donghyun", "Seungho", "Jaemin", "Woobin"],
    last: ["Kim", "Park", "Lee", "Choi", "Jung", "Kang", "Cho", "Yoon", "Jang", "Han"],
  },
  {
    code: "hr",
    name: "Hırvatistan",
    first: ["Luka", "Ivan", "Marko", "Josip", "Mateo", "Dino", "Ante", "Filip", "Borna", "Domagoj"],
    last: ["Kolar", "Peric", "Horvat", "Bozic", "Juric", "Petrovic", "Novak", "Vidovic", "Maric", "Kovac"],
  },
  {
    code: "be",
    name: "Belçika",
    first: ["Arthur", "Noah", "Liam", "Louis", "Adam", "Jules", "Matteo", "Victor", "Nathan", "Finn"],
    last: ["Peeters", "Janssens", "Maes", "Jacobs", "Verstraete", "Willems", "Claes", "Wouters", "Lambert", "Dumont"],
  },
  {
    code: "co",
    name: "Kolombiya",
    first: ["Santiago", "Mateo", "Samuel", "Matias", "Nicolas", "Juan", "Sebastian", "Daniel", "David", "Andres"],
    last: ["Restrepo", "Cardona", "Hoyos", "Montoya", "Murillo", "Rios", "Castano", "Pineda", "Osorio", "Mejia"],
  },
  {
    code: "uy",
    name: "Uruguay",
    first: ["Thiago", "Benja", "Mateo", "Facundo", "Agustin", "Bruno", "Diego", "Maximo", "Joaquin", "Valentin"],
    last: ["Pereira", "Iglesias", "Gomez", "Cabrera", "Silveira", "Bustos", "Nunez", "Varela", "Alonso", "Perez"],
  },
];

export const NATION_BY_CODE: Record<string, Nation> = Object.fromEntries(
  NATIONS.map((n) => [n.code, n]),
);

export const NATION_BY_NAME: Record<string, Nation> = Object.fromEntries(
  NATIONS.map((n) => [n.name.toLowerCase(), n]),
);

export function flagUrl(code: string, w = 40): string {
  return `https://flagcdn.com/w${w}/${code}.png`;
}
