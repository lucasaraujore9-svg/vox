// Catálogo dos 66 livros bíblicos em PT-BR.
// `abbrev` é o identificador usado pela API abibliadigital (lowercase, 2-3 chars).
// `aliases` cobre todas as variações de nome/abreviação que o parser deve reconhecer.

export interface BookInfo {
  /** Abreviação canônica usada pela API (ex: "gn", "rm", "1co") */
  abbrev: string;
  /** Nome canônico exibido na UI (ex: "Gênesis", "Romanos", "1 Coríntios") */
  name: string;
  /** Número de capítulos */
  chapters: number;
  /** "VT" ou "NT" */
  testament: "VT" | "NT";
}

interface BookSpec {
  info: BookInfo;
  /** Todas as formas que podem aparecer no texto, em minúsculas */
  aliases: string[];
}

const BOOKS: BookSpec[] = [
  // ========== Antigo Testamento ==========
  { info: { abbrev: "gn", name: "Gênesis", chapters: 50, testament: "VT" },
    aliases: ["gênesis", "genesis", "gn", "gen"] },
  { info: { abbrev: "ex", name: "Êxodo", chapters: 40, testament: "VT" },
    aliases: ["êxodo", "exodo", "ex", "êx"] },
  { info: { abbrev: "lv", name: "Levítico", chapters: 27, testament: "VT" },
    aliases: ["levítico", "levitico", "lv", "lev"] },
  { info: { abbrev: "nm", name: "Números", chapters: 36, testament: "VT" },
    aliases: ["números", "numeros", "nm", "núm", "num"] },
  { info: { abbrev: "dt", name: "Deuteronômio", chapters: 34, testament: "VT" },
    aliases: ["deuteronômio", "deuteronomio", "dt", "deut"] },
  { info: { abbrev: "js", name: "Josué", chapters: 24, testament: "VT" },
    aliases: ["josué", "josue", "js", "jos"] },
  { info: { abbrev: "jz", name: "Juízes", chapters: 21, testament: "VT" },
    aliases: ["juízes", "juizes", "jz", "juiz"] },
  { info: { abbrev: "rt", name: "Rute", chapters: 4, testament: "VT" },
    aliases: ["rute", "rt"] },
  { info: { abbrev: "1sm", name: "1 Samuel", chapters: 31, testament: "VT" },
    aliases: ["1 samuel", "1samuel", "1 sm", "1sm", "i samuel", "i sm"] },
  { info: { abbrev: "2sm", name: "2 Samuel", chapters: 24, testament: "VT" },
    aliases: ["2 samuel", "2samuel", "2 sm", "2sm", "ii samuel", "ii sm"] },
  { info: { abbrev: "1rs", name: "1 Reis", chapters: 22, testament: "VT" },
    aliases: ["1 reis", "1reis", "1 rs", "1rs", "i reis", "i rs"] },
  { info: { abbrev: "2rs", name: "2 Reis", chapters: 25, testament: "VT" },
    aliases: ["2 reis", "2reis", "2 rs", "2rs", "ii reis", "ii rs"] },
  { info: { abbrev: "1cr", name: "1 Crônicas", chapters: 29, testament: "VT" },
    aliases: ["1 crônicas", "1 cronicas", "1cr", "1 cr", "1cron", "i crônicas", "i cr"] },
  { info: { abbrev: "2cr", name: "2 Crônicas", chapters: 36, testament: "VT" },
    aliases: ["2 crônicas", "2 cronicas", "2cr", "2 cr", "2cron", "ii crônicas", "ii cr"] },
  { info: { abbrev: "ed", name: "Esdras", chapters: 10, testament: "VT" },
    aliases: ["esdras", "ed", "esd"] },
  { info: { abbrev: "ne", name: "Neemias", chapters: 13, testament: "VT" },
    aliases: ["neemias", "ne", "neem"] },
  { info: { abbrev: "et", name: "Ester", chapters: 10, testament: "VT" },
    aliases: ["ester", "et", "est"] },
  { info: { abbrev: "job", name: "Jó", chapters: 42, testament: "VT" },
    aliases: ["jó", "jo", "job"] },
  { info: { abbrev: "sl", name: "Salmos", chapters: 150, testament: "VT" },
    aliases: ["salmos", "salmo", "sl", "sal", "salm"] },
  { info: { abbrev: "pv", name: "Provérbios", chapters: 31, testament: "VT" },
    aliases: ["provérbios", "proverbios", "pv", "prov", "prv"] },
  { info: { abbrev: "ec", name: "Eclesiastes", chapters: 12, testament: "VT" },
    aliases: ["eclesiastes", "ec", "ecl"] },
  { info: { abbrev: "ct", name: "Cânticos", chapters: 8, testament: "VT" },
    aliases: ["cânticos", "canticos", "cantares", "ct", "cant"] },
  { info: { abbrev: "is", name: "Isaías", chapters: 66, testament: "VT" },
    aliases: ["isaías", "isaias", "is", "isa"] },
  { info: { abbrev: "jr", name: "Jeremias", chapters: 52, testament: "VT" },
    aliases: ["jeremias", "jr", "jer"] },
  { info: { abbrev: "lm", name: "Lamentações", chapters: 5, testament: "VT" },
    aliases: ["lamentações", "lamentacoes", "lm", "lam"] },
  { info: { abbrev: "ez", name: "Ezequiel", chapters: 48, testament: "VT" },
    aliases: ["ezequiel", "ez", "eze", "ezq"] },
  { info: { abbrev: "dn", name: "Daniel", chapters: 12, testament: "VT" },
    aliases: ["daniel", "dn", "dan"] },
  { info: { abbrev: "os", name: "Oseias", chapters: 14, testament: "VT" },
    aliases: ["oseias", "oséias", "os", "ose"] },
  { info: { abbrev: "jl", name: "Joel", chapters: 3, testament: "VT" },
    aliases: ["joel", "jl"] },
  { info: { abbrev: "am", name: "Amós", chapters: 9, testament: "VT" },
    aliases: ["amós", "amos", "am"] },
  { info: { abbrev: "ob", name: "Obadias", chapters: 1, testament: "VT" },
    aliases: ["obadias", "ob", "obd"] },
  { info: { abbrev: "jn", name: "Jonas", chapters: 4, testament: "VT" },
    aliases: ["jonas", "jn", "jon"] },
  { info: { abbrev: "mq", name: "Miqueias", chapters: 7, testament: "VT" },
    aliases: ["miqueias", "mq", "miq"] },
  { info: { abbrev: "na", name: "Naum", chapters: 3, testament: "VT" },
    aliases: ["naum", "na", "nau"] },
  { info: { abbrev: "hc", name: "Habacuque", chapters: 3, testament: "VT" },
    aliases: ["habacuque", "hc", "hab"] },
  { info: { abbrev: "sf", name: "Sofonias", chapters: 3, testament: "VT" },
    aliases: ["sofonias", "sf", "sof"] },
  { info: { abbrev: "ag", name: "Ageu", chapters: 2, testament: "VT" },
    aliases: ["ageu", "ag"] },
  { info: { abbrev: "zc", name: "Zacarias", chapters: 14, testament: "VT" },
    aliases: ["zacarias", "zc", "zac"] },
  { info: { abbrev: "ml", name: "Malaquias", chapters: 4, testament: "VT" },
    aliases: ["malaquias", "ml", "mal"] },

  // ========== Novo Testamento ==========
  { info: { abbrev: "mt", name: "Mateus", chapters: 28, testament: "NT" },
    aliases: ["mateus", "mt", "mat"] },
  { info: { abbrev: "mc", name: "Marcos", chapters: 16, testament: "NT" },
    aliases: ["marcos", "mc", "mar"] },
  { info: { abbrev: "lc", name: "Lucas", chapters: 24, testament: "NT" },
    aliases: ["lucas", "lc", "luc"] },
  { info: { abbrev: "jo", name: "João", chapters: 21, testament: "NT" },
    aliases: ["joão", "joao", "jo", "joã"] },
  { info: { abbrev: "atos", name: "Atos", chapters: 28, testament: "NT" },
    aliases: ["atos", "at"] },
  { info: { abbrev: "rm", name: "Romanos", chapters: 16, testament: "NT" },
    aliases: ["romanos", "rm", "rom"] },
  { info: { abbrev: "1co", name: "1 Coríntios", chapters: 16, testament: "NT" },
    aliases: ["1 coríntios", "1 corintios", "1co", "1 co", "1cor", "i coríntios", "i co"] },
  { info: { abbrev: "2co", name: "2 Coríntios", chapters: 13, testament: "NT" },
    aliases: ["2 coríntios", "2 corintios", "2co", "2 co", "2cor", "ii coríntios", "ii co"] },
  { info: { abbrev: "gl", name: "Gálatas", chapters: 6, testament: "NT" },
    aliases: ["gálatas", "galatas", "gl", "gal"] },
  { info: { abbrev: "ef", name: "Efésios", chapters: 6, testament: "NT" },
    aliases: ["efésios", "efesios", "ef", "efe"] },
  { info: { abbrev: "fp", name: "Filipenses", chapters: 4, testament: "NT" },
    aliases: ["filipenses", "fp", "fil"] },
  { info: { abbrev: "cl", name: "Colossenses", chapters: 4, testament: "NT" },
    aliases: ["colossenses", "cl", "col"] },
  { info: { abbrev: "1ts", name: "1 Tessalonicenses", chapters: 5, testament: "NT" },
    aliases: ["1 tessalonicenses", "1ts", "1 ts", "1tes", "i tessalonicenses", "i ts"] },
  { info: { abbrev: "2ts", name: "2 Tessalonicenses", chapters: 3, testament: "NT" },
    aliases: ["2 tessalonicenses", "2ts", "2 ts", "2tes", "ii tessalonicenses", "ii ts"] },
  { info: { abbrev: "1tm", name: "1 Timóteo", chapters: 6, testament: "NT" },
    aliases: ["1 timóteo", "1 timoteo", "1tm", "1 tm", "1tim", "i timóteo", "i tm"] },
  { info: { abbrev: "2tm", name: "2 Timóteo", chapters: 4, testament: "NT" },
    aliases: ["2 timóteo", "2 timoteo", "2tm", "2 tm", "2tim", "ii timóteo", "ii tm"] },
  { info: { abbrev: "tt", name: "Tito", chapters: 3, testament: "NT" },
    aliases: ["tito", "tt", "tit"] },
  { info: { abbrev: "fm", name: "Filemom", chapters: 1, testament: "NT" },
    aliases: ["filemom", "filemon", "fm", "flm"] },
  { info: { abbrev: "hb", name: "Hebreus", chapters: 13, testament: "NT" },
    aliases: ["hebreus", "hb", "heb"] },
  { info: { abbrev: "tg", name: "Tiago", chapters: 5, testament: "NT" },
    aliases: ["tiago", "tg", "tia"] },
  { info: { abbrev: "1pe", name: "1 Pedro", chapters: 5, testament: "NT" },
    aliases: ["1 pedro", "1pe", "1 pe", "1ped", "i pedro", "i pe"] },
  { info: { abbrev: "2pe", name: "2 Pedro", chapters: 3, testament: "NT" },
    aliases: ["2 pedro", "2pe", "2 pe", "2ped", "ii pedro", "ii pe"] },
  { info: { abbrev: "1jo", name: "1 João", chapters: 5, testament: "NT" },
    aliases: ["1 joão", "1 joao", "1jo", "1 jo", "i joão", "i jo"] },
  { info: { abbrev: "2jo", name: "2 João", chapters: 1, testament: "NT" },
    aliases: ["2 joão", "2 joao", "2jo", "2 jo", "ii joão", "ii jo"] },
  { info: { abbrev: "3jo", name: "3 João", chapters: 1, testament: "NT" },
    aliases: ["3 joão", "3 joao", "3jo", "3 jo", "iii joão", "iii jo"] },
  { info: { abbrev: "jd", name: "Judas", chapters: 1, testament: "NT" },
    aliases: ["judas", "jd", "jud"] },
  { info: { abbrev: "ap", name: "Apocalipse", chapters: 22, testament: "NT" },
    aliases: ["apocalipse", "ap", "apo"] },
];

/** Lookup case-insensitive de alias → BookInfo. */
export const BIBLE_BOOK_INDEX: Record<string, BookInfo> = Object.fromEntries(
  BOOKS.flatMap((b) => b.aliases.map((a) => [a.toLowerCase(), b.info]))
);

/** Lista canônica de todos os livros. */
export const BIBLE_BOOKS: readonly BookInfo[] = BOOKS.map((b) => b.info);

export function findBookByAbbrev(abbrev: string): BookInfo | undefined {
  return BIBLE_BOOKS.find((b) => b.abbrev === abbrev);
}
