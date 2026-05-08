export type StickerKind = "fwc" | "badge" | "team_photo" | "player";

export type Sticker = {
  number: number;
  code: string;
  sectionId: string;
  sectionName: string;
  kind: StickerKind;
  label: string;
  teamCode?: string;
  flag?: string;
  teamLocalIndex?: number;
};

export type Section = {
  id: string;
  name: string;
  flag?: string;
  range: [number, number];
  kind: "fwc" | "team";
  group?: string;
};

export type GroupId =
  | "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I" | "J" | "K" | "L";

type TeamSeed = {
  code: string;
  name: string;
  flag: string;
  group: GroupId;
};

// Orden oficial del álbum (grupo A → L; dentro de cada grupo, el orden
// con el que aparecen impresos: anfitrión/cabeza de grupo primero).
export const TEAMS: TeamSeed[] = [
  // Grupo A
  { code: "MEX", name: "México", flag: "🇲🇽", group: "A" },
  { code: "RSA", name: "Sudáfrica", flag: "🇿🇦", group: "A" },
  { code: "KOR", name: "Corea del Sur", flag: "🇰🇷", group: "A" },
  { code: "CZE", name: "Chequia", flag: "🇨🇿", group: "A" },
  // Grupo B
  { code: "CAN", name: "Canadá", flag: "🇨🇦", group: "B" },
  { code: "BIH", name: "Bosnia y Herzegovina", flag: "🇧🇦", group: "B" },
  { code: "QAT", name: "Catar", flag: "🇶🇦", group: "B" },
  { code: "SUI", name: "Suiza", flag: "🇨🇭", group: "B" },
  // Grupo C
  { code: "BRA", name: "Brasil", flag: "🇧🇷", group: "C" },
  { code: "MAR", name: "Marruecos", flag: "🇲🇦", group: "C" },
  { code: "HAI", name: "Haití", flag: "🇭🇹", group: "C" },
  { code: "SCO", name: "Escocia", flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", group: "C" },
  // Grupo D
  { code: "USA", name: "Estados Unidos", flag: "🇺🇸", group: "D" },
  { code: "PAR", name: "Paraguay", flag: "🇵🇾", group: "D" },
  { code: "AUS", name: "Australia", flag: "🇦🇺", group: "D" },
  { code: "TUR", name: "Türkiye", flag: "🇹🇷", group: "D" },
  // Grupo E
  { code: "GER", name: "Alemania", flag: "🇩🇪", group: "E" },
  { code: "CUW", name: "Curazao", flag: "🇨🇼", group: "E" },
  { code: "CIV", name: "Costa de Marfil", flag: "🇨🇮", group: "E" },
  { code: "ECU", name: "Ecuador", flag: "🇪🇨", group: "E" },
  // Grupo F
  { code: "NED", name: "Países Bajos", flag: "🇳🇱", group: "F" },
  { code: "JPN", name: "Japón", flag: "🇯🇵", group: "F" },
  { code: "SWE", name: "Suecia", flag: "🇸🇪", group: "F" },
  { code: "TUN", name: "Túnez", flag: "🇹🇳", group: "F" },
  // Grupo G
  { code: "BEL", name: "Bélgica", flag: "🇧🇪", group: "G" },
  { code: "EGY", name: "Egipto", flag: "🇪🇬", group: "G" },
  { code: "IRN", name: "Irán", flag: "🇮🇷", group: "G" },
  { code: "NZL", name: "Nueva Zelanda", flag: "🇳🇿", group: "G" },
  // Grupo H
  { code: "ESP", name: "España", flag: "🇪🇸", group: "H" },
  { code: "CPV", name: "Cabo Verde", flag: "🇨🇻", group: "H" },
  { code: "KSA", name: "Arabia Saudita", flag: "🇸🇦", group: "H" },
  { code: "URU", name: "Uruguay", flag: "🇺🇾", group: "H" },
  // Grupo I
  { code: "FRA", name: "Francia", flag: "🇫🇷", group: "I" },
  { code: "SEN", name: "Senegal", flag: "🇸🇳", group: "I" },
  { code: "IRQ", name: "Irak", flag: "🇮🇶", group: "I" },
  { code: "NOR", name: "Noruega", flag: "🇳🇴", group: "I" },
  // Grupo J
  { code: "ARG", name: "Argentina", flag: "🇦🇷", group: "J" },
  { code: "ALG", name: "Argelia", flag: "🇩🇿", group: "J" },
  { code: "AUT", name: "Austria", flag: "🇦🇹", group: "J" },
  { code: "JOR", name: "Jordania", flag: "🇯🇴", group: "J" },
  // Grupo K
  { code: "POR", name: "Portugal", flag: "🇵🇹", group: "K" },
  { code: "COD", name: "RD Congo", flag: "🇨🇩", group: "K" },
  { code: "UZB", name: "Uzbekistán", flag: "🇺🇿", group: "K" },
  { code: "COL", name: "Colombia", flag: "🇨🇴", group: "K" },
  // Grupo L
  { code: "ENG", name: "Inglaterra", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", group: "L" },
  { code: "CRO", name: "Croacia", flag: "🇭🇷", group: "L" },
  { code: "GHA", name: "Ghana", flag: "🇬🇭", group: "L" },
  { code: "PAN", name: "Panamá", flag: "🇵🇦", group: "L" },
];

export const GROUPS: GroupId[] = [
  "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L",
];

const FWC_SIZE = 20;
const FWC_TROPHY = "🏆";

function makeCode(s: Omit<Sticker, "code">): string {
  if (s.kind === "fwc") {
    if (s.number === 1) return "00";
    return `FWC ${s.number - 1}`;
  }
  if (s.teamCode && s.teamLocalIndex !== undefined)
    return `${s.teamCode} ${s.teamLocalIndex}`;
  return `#${s.number}`;
}

function pushSticker(
  arr: Sticker[],
  data: Omit<Sticker, "code">,
): void {
  arr.push({ ...data, code: makeCode(data) });
}

function buildAlbum(): { stickers: Sticker[]; sections: Section[] } {
  const stickers: Sticker[] = [];
  const sections: Section[] = [];

  // FWC section: sticker #1 is the cover ("00") and #2..#20 are FWC 1..19.
  const fwcStart = 1;
  for (let i = 0; i < FWC_SIZE; i++) {
    pushSticker(stickers, {
      number: fwcStart + i,
      sectionId: "FWC",
      sectionName: "FIFA World Cup",
      kind: "fwc",
      label: i === 0 ? "Portada" : `FWC ${i}`,
      flag: FWC_TROPHY,
      teamLocalIndex: i,
    });
  }
  sections.push({
    id: "FWC",
    name: "FIFA World Cup",
    flag: FWC_TROPHY,
    range: [fwcStart, fwcStart + FWC_SIZE - 1],
    kind: "fwc",
  });

  let cursor = fwcStart + FWC_SIZE;
  for (const team of TEAMS) {
    const start = cursor;

    // 1: badge
    pushSticker(stickers, {
      number: cursor,
      sectionId: team.code,
      sectionName: team.name,
      kind: "badge",
      label: "Escudo",
      teamCode: team.code,
      flag: team.flag,
      teamLocalIndex: 1,
    });
    cursor += 1;

    // 2..12: first 11 players
    for (let i = 0; i < 11; i++) {
      pushSticker(stickers, {
        number: cursor,
        sectionId: team.code,
        sectionName: team.name,
        kind: "player",
        label: `Jugador ${i + 1}`,
        teamCode: team.code,
        flag: team.flag,
        teamLocalIndex: 2 + i,
      });
      cursor += 1;
    }

    // 13: team photo
    pushSticker(stickers, {
      number: cursor,
      sectionId: team.code,
      sectionName: team.name,
      kind: "team_photo",
      label: "Foto de equipo",
      teamCode: team.code,
      flag: team.flag,
      teamLocalIndex: 13,
    });
    cursor += 1;

    // 14..20: remaining 7 players
    for (let i = 0; i < 7; i++) {
      pushSticker(stickers, {
        number: cursor,
        sectionId: team.code,
        sectionName: team.name,
        kind: "player",
        label: `Jugador ${12 + i}`,
        teamCode: team.code,
        flag: team.flag,
        teamLocalIndex: 14 + i,
      });
      cursor += 1;
    }

    sections.push({
      id: team.code,
      name: team.name,
      flag: team.flag,
      range: [start, cursor - 1],
      kind: "team",
      group: team.group,
    });
  }

  return { stickers, sections };
}

const built = buildAlbum();

export const STICKERS: Sticker[] = built.stickers;
export const SECTIONS: Section[] = built.sections;
export const TOTAL_STICKERS = STICKERS.length;

export const STICKER_BY_NUMBER = new Map<number, Sticker>(
  STICKERS.map((s) => [s.number, s]),
);

export const STICKER_BY_CODE = new Map<string, Sticker>(
  STICKERS.map((s) => [s.code, s]),
);

export function getSticker(n: number): Sticker | undefined {
  return STICKER_BY_NUMBER.get(n);
}

export function getStickerByCode(code: string): Sticker | undefined {
  return STICKER_BY_CODE.get(code);
}

export function formatStickerCode(s: Sticker): string {
  return s.code;
}

export function formatStickerCodeByNumber(n: number): string {
  const s = STICKER_BY_NUMBER.get(n);
  return s ? s.code : `#${n}`;
}
