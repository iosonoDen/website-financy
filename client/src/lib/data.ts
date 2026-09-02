// Financy — modello dati e motore di previsione (prototipo con dati dimostrativi)

export type Cadenza = 'mensile' | 'bimestrale' | 'trimestrale' | 'semestrale' | 'annuale';

export type TipoConto = 'corrente' | 'prepagata' | 'carta' | 'investimento';

export interface Conto {
  id: string;
  banca: string;
  nome: string;
  tipo: TipoConto;
  iban: string;
  saldo: number;
  hue: number;
  sigla: string;
  sincronizzato: string;
  consensoGiorni: number;
}

export interface Ricorrenza {
  id: string;
  nome: string;
  categoria: string;
  importo: number; // negativo = uscita, positivo = entrata
  cadenza: Cadenza;
  ancora: string; // una occorrenza nota (ISO)
  contoId: string;
  affidabilita: number; // 0..1
  rilevataAuto: boolean;
  nuova?: boolean;
}

export interface Transazione {
  id: string;
  data: string;
  descrizione: string;
  categoria: string;
  contoId: string;
  importo: number;
  ricorrenzaId?: string;
}

export interface Scadenza {
  data: string;
  ricorrenza: Ricorrenza;
}

export const OGGI = new Date('2026-09-01T00:00:00');

export const MESI_CADENZA: Record<Cadenza, number> = {
  mensile: 1,
  bimestrale: 2,
  trimestrale: 3,
  semestrale: 6,
  annuale: 12,
};

export const ETICHETTA_CADENZA: Record<Cadenza, string> = {
  mensile: 'Ogni mese',
  bimestrale: 'Ogni 2 mesi',
  trimestrale: 'Ogni 3 mesi',
  semestrale: 'Ogni 6 mesi',
  annuale: 'Ogni anno',
};

export const CONTI_INIZIALI: Conto[] = [
  {
    id: 'isp',
    banca: 'Intesa Sanpaolo',
    nome: 'Conto Corrente',
    tipo: 'corrente',
    iban: 'IT•• •••• •••• •••• •••• 4 812',
    saldo: 4812.4,
    hue: 200,
    sigla: 'IS',
    sincronizzato: '4 min',
    consensoGiorni: 68,
  },
  {
    id: 'uni',
    banca: 'UniCredit',
    nome: 'Conto cointestato',
    tipo: 'corrente',
    iban: 'IT•• •••• •••• •••• •••• 2 145',
    saldo: 2145.9,
    hue: 3,
    sigla: 'UC',
    sincronizzato: '11 min',
    consensoGiorni: 41,
  },
  {
    id: 'rev',
    banca: 'Revolut',
    nome: 'Conto EUR',
    tipo: 'corrente',
    iban: 'LT•• •••• •••• •••• •••• 1 284',
    saldo: 1284.15,
    hue: 265,
    sigla: 'RV',
    sincronizzato: '2 min',
    consensoGiorni: 84,
  },
  {
    id: 'hype',
    banca: 'Hype',
    nome: 'Carta prepagata',
    tipo: 'prepagata',
    iban: 'IT•• •••• •••• •••• •••• 0 320',
    saldo: 320.5,
    hue: 165,
    sigla: 'HY',
    sincronizzato: '9 min',
    consensoGiorni: 12,
  },
  {
    id: 'amex',
    banca: 'American Express',
    nome: 'Carta di credito',
    tipo: 'carta',
    iban: 'XXXX •••• •••• 3 742',
    saldo: -742.3,
    hue: 215,
    sigla: 'AX',
    sincronizzato: '26 min',
    consensoGiorni: 55,
  },
  {
    id: 'fin',
    banca: 'Fineco',
    nome: 'Deposito titoli',
    tipo: 'investimento',
    iban: 'IT•• •••• •••• •••• •••• 8 640',
    saldo: 18640.0,
    hue: 35,
    sigla: 'FB',
    sincronizzato: '1 h',
    consensoGiorni: 73,
  },
];

export const RICORRENZE: Ricorrenza[] = [
  { id: 'r1', nome: 'Stipendio', categoria: 'Stipendio', importo: 2480, cadenza: 'mensile', ancora: '2026-08-27', contoId: 'isp', affidabilita: 0.99, rilevataAuto: true },
  { id: 'r19', nome: 'Compenso partita IVA', categoria: 'Stipendio', importo: 520, cadenza: 'mensile', ancora: '2026-09-25', contoId: 'uni', affidabilita: 0.91, rilevataAuto: true },
  { id: 'r2', nome: 'Mutuo casa', categoria: 'Casa', importo: -685, cadenza: 'mensile', ancora: '2026-09-05', contoId: 'isp', affidabilita: 0.99, rilevataAuto: true },
  { id: 'r3', nome: 'Spese condominiali', categoria: 'Casa', importo: -130, cadenza: 'mensile', ancora: '2026-09-10', contoId: 'uni', affidabilita: 0.94, rilevataAuto: true },
  { id: 'r4', nome: 'Bonifico PAC ETF', categoria: 'Risparmio', importo: -250, cadenza: 'mensile', ancora: '2026-09-15', contoId: 'isp', affidabilita: 0.99, rilevataAuto: false },
  { id: 'r5', nome: 'Palestra Virgin Active', categoria: 'Tempo libero', importo: -45, cadenza: 'mensile', ancora: '2026-09-03', contoId: 'rev', affidabilita: 0.97, rilevataAuto: true },
  { id: 'r6', nome: 'Fibra TIM', categoria: 'Utenze', importo: -29.9, cadenza: 'mensile', ancora: '2026-09-20', contoId: 'isp', affidabilita: 0.86, rilevataAuto: true, nuova: true },
  { id: 'r7', nome: 'Netflix', categoria: 'Abbonamenti', importo: -13.99, cadenza: 'mensile', ancora: '2026-09-18', contoId: 'rev', affidabilita: 0.98, rilevataAuto: true },
  { id: 'r8', nome: 'Spotify Family', categoria: 'Abbonamenti', importo: -17.99, cadenza: 'mensile', ancora: '2026-09-08', contoId: 'hype', affidabilita: 0.98, rilevataAuto: true },
  { id: 'r9', nome: 'Iliad mobile', categoria: 'Utenze', importo: -9.99, cadenza: 'mensile', ancora: '2026-09-12', contoId: 'rev', affidabilita: 0.99, rilevataAuto: true },
  { id: 'r10', nome: 'Gas Eni', categoria: 'Utenze', importo: -78.2, cadenza: 'bimestrale', ancora: '2026-09-22', contoId: 'isp', affidabilita: 0.89, rilevataAuto: true },
  { id: 'r11', nome: 'Luce Enel', categoria: 'Utenze', importo: -96.4, cadenza: 'bimestrale', ancora: '2026-10-02', contoId: 'isp', affidabilita: 0.91, rilevataAuto: true },
  { id: 'r12', nome: 'TARI — rata', categoria: 'Tasse', importo: -142, cadenza: 'trimestrale', ancora: '2026-09-30', contoId: 'isp', affidabilita: 0.85, rilevataAuto: true },
  { id: 'r13', nome: 'Assicurazione auto Genertel', categoria: 'Assicurazioni', importo: -612, cadenza: 'annuale', ancora: '2026-11-14', contoId: 'uni', affidabilita: 0.96, rilevataAuto: true },
  { id: 'r14', nome: 'Assicurazione vita Allianz', categoria: 'Assicurazioni', importo: -320, cadenza: 'semestrale', ancora: '2026-12-05', contoId: 'isp', affidabilita: 0.92, rilevataAuto: true },
  { id: 'r15', nome: 'IMU — rata', categoria: 'Tasse', importo: -224, cadenza: 'semestrale', ancora: '2026-12-16', contoId: 'isp', affidabilita: 0.88, rilevataAuto: true },
  { id: 'r16', nome: 'Bollo auto', categoria: 'Trasporti', importo: -268, cadenza: 'annuale', ancora: '2027-01-31', contoId: 'isp', affidabilita: 0.93, rilevataAuto: true },
  { id: 'r17', nome: 'Amazon Prime', categoria: 'Abbonamenti', importo: -49.9, cadenza: 'annuale', ancora: '2027-03-11', contoId: 'hype', affidabilita: 0.95, rilevataAuto: true },
  { id: 'r18', nome: 'RC Moto Zurich', categoria: 'Assicurazioni', importo: -189, cadenza: 'annuale', ancora: '2027-06-10', contoId: 'isp', affidabilita: 0.9, rilevataAuto: true },
];

/* ---------- utilità date ---------- */

export const iso = (d: Date) => d.toISOString().slice(0, 10);

export function addMesi(d: Date, n: number) {
  const giorno = d.getDate();
  const r = new Date(d.getFullYear(), d.getMonth() + n, 1);
  const ultimo = new Date(r.getFullYear(), r.getMonth() + 1, 0).getDate();
  r.setDate(Math.min(giorno, ultimo));
  return r;
}

export function addGiorni(d: Date, n: number) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

export const MESI_BREVI = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'];
export const MESI_LUNGHI = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];

/** Espande tutte le occorrenze di una ricorrenza in un intervallo. */
export function occorrenze(r: Ricorrenza, da: Date, a: Date): Date[] {
  const passo = MESI_CADENZA[r.cadenza];
  const ancora = new Date(r.ancora + 'T00:00:00');
  const out: Date[] = [];
  // allinea l'ancora prima dell'inizio dell'intervallo
  let k = Math.floor(((da.getFullYear() - ancora.getFullYear()) * 12 + (da.getMonth() - ancora.getMonth())) / passo) - 1;
  for (let i = 0; i < 400; i++) {
    const d = addMesi(ancora, (k + i) * passo);
    if (d > a) break;
    if (d >= da) out.push(d);
  }
  return out;
}

/** Prossime scadenze ordinate per data. */
export function prossimeScadenze(ricorrenze: Ricorrenza[], da: Date, giorni: number): Scadenza[] {
  const a = addGiorni(da, giorni);
  const out: Scadenza[] = [];
  ricorrenze.forEach((r) => occorrenze(r, da, a).forEach((d) => out.push({ data: iso(d), ricorrenza: r })));
  return out.sort((x, y) => x.data.localeCompare(y.data));
}

/* ---------- transazioni storiche (deterministiche) ---------- */

function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

const SPESE_VARIABILI: [string, string, number, number, string[]][] = [
  ['Spesa', 'Esselunga', 28, 96, ['isp', 'uni']],
  ['Spesa', 'Lidl', 18, 62, ['hype', 'isp']],
  ['Spesa', 'Carrefour Express', 9, 34, ['rev', 'hype']],
  ['Ristoranti', 'Trattoria del Corso', 22, 68, ['amex', 'rev']],
  ['Ristoranti', 'Bar Centrale', 3, 12, ['hype', 'rev']],
  ['Ristoranti', 'Pizzeria Da Michele', 18, 46, ['amex']],
  ['Trasporti', 'Q8 Easy', 35, 78, ['isp', 'amex']],
  ['Trasporti', 'Trenord', 4, 19, ['rev']],
  ['Trasporti', 'Telepass', 8, 41, ['isp']],
  ['Shopping', 'Amazon.it', 12, 128, ['amex', 'rev']],
  ['Shopping', 'Decathlon', 19, 89, ['uni']],
  ['Shopping', 'Zara', 25, 96, ['amex']],
  ['Salute', 'Farmacia Comunale', 7, 44, ['isp']],
  ['Tempo libero', 'Cinema Anteo', 9, 26, ['rev']],
  ['Tempo libero', 'Feltrinelli', 11, 38, ['hype']],
  ['Utenze', 'Ricarica Enel X', 6, 22, ['rev']],
];

export function generaTransazioni(ricorrenze: Ricorrenza[], giorniIndietro = 150): Transazione[] {
  const r = rng(20260901);
  const inizio = addGiorni(OGGI, -giorniIndietro);
  const out: Transazione[] = [];

  ricorrenze.forEach((rec) => {
    occorrenze(rec, inizio, addGiorni(OGGI, -1)).forEach((d, i) => {
      out.push({
        id: `t-${rec.id}-${i}-${iso(d)}`,
        data: iso(d),
        descrizione: rec.nome,
        categoria: rec.categoria,
        contoId: rec.contoId,
        importo: rec.importo,
        ricorrenzaId: rec.id,
      });
    });
  });

  for (let g = 0; g < giorniIndietro; g++) {
    const d = addGiorni(inizio, g);
    const quante = r() < 0.28 ? 0 : r() < 0.55 ? 1 : r() < 0.9 ? 2 : 3;
    for (let i = 0; i < quante; i++) {
      const [categoria, descrizione, min, max, conti] = SPESE_VARIABILI[Math.floor(r() * SPESE_VARIABILI.length)];
      const importo = -Math.round((min + r() * (max - min)) * 100) / 100;
      out.push({
        id: `v-${g}-${i}`,
        data: iso(d),
        descrizione,
        categoria,
        contoId: conti[Math.floor(r() * conti.length)],
        importo,
      });
    }
  }

  return out.sort((a, b) => b.data.localeCompare(a.data) || a.id.localeCompare(b.id));
}

export const TRANSAZIONI = generaTransazioni(RICORRENZE);

/* ---------- metriche ---------- */

export const liquidi = (conti: Conto[]) => conti.filter((c) => c.tipo !== 'investimento').reduce((s, c) => s + c.saldo, 0);
export const patrimonio = (conti: Conto[]) => conti.reduce((s, c) => s + c.saldo, 0);

/** Spesa variabile media mensile (non ricorrente) sugli ultimi 90 giorni. */
export function spesaVariabileMedia(transazioni: Transazione[]) {
  const da = iso(addGiorni(OGGI, -90));
  const tot = transazioni
    .filter((t) => !t.ricorrenzaId && t.importo < 0 && t.data >= da)
    .reduce((s, t) => s + t.importo, 0);
  return Math.abs(tot) / 3;
}

export interface PuntoProiezione {
  data: string;
  storico: number | null;
  previsto: number | null;
  eventi: { nome: string; importo: number }[];
}

export interface Proiezione {
  punti: PuntoProiezione[];
  minimo: { data: string; valore: number };
  nettoMensile: number;
  saldoFinale: number;
}

export function proiezione(
  conti: Conto[],
  ricorrenze: Ricorrenza[],
  transazioni: Transazione[],
  opzioni: { mesi: number; spesaVariabile?: number; risparmioExtra?: number; nuovaRata?: number } = { mesi: 12 },
): Proiezione {
  const spesaVar = opzioni.spesaVariabile ?? spesaVariabileMedia(transazioni);
  const extra = opzioni.risparmioExtra ?? 0;
  const rata = opzioni.nuovaRata ?? 0;
  const start = liquidi(conti);

  // storico: 120 giorni ricostruiti a ritroso dalle transazioni
  const giorniStorico = 120;
  const perGiorno = new Map<string, number>();
  transazioni.forEach((t) => perGiorno.set(t.data, (perGiorno.get(t.data) ?? 0) + t.importo));

  const storico: PuntoProiezione[] = [];
  let saldo = start;
  for (let g = 0; g <= giorniStorico; g++) {
    const d = addGiorni(OGGI, -g);
    storico.push({ data: iso(d), storico: Math.round(saldo * 100) / 100, previsto: g === 0 ? Math.round(saldo * 100) / 100 : null, eventi: [] });
    saldo -= perGiorno.get(iso(d)) ?? 0;
  }
  storico.reverse();

  // futuro
  const fine = addMesi(OGGI, opzioni.mesi);
  const eventiFuturi = new Map<string, { nome: string; importo: number }[]>();
  ricorrenze.forEach((r) =>
    occorrenze(r, addGiorni(OGGI, 1), fine).forEach((d) => {
      const k = iso(d);
      if (!eventiFuturi.has(k)) eventiFuturi.set(k, []);
      eventiFuturi.get(k)!.push({ nome: r.nome, importo: r.importo });
    }),
  );

  const futuro: PuntoProiezione[] = [];
  let s = start;
  let minimo = { data: iso(OGGI), valore: start };
  const giorniTot = Math.round((fine.getTime() - OGGI.getTime()) / 86400000);
  const quotaGiornaliera = (spesaVar + extra + rata) / 30.4;

  for (let g = 1; g <= giorniTot; g++) {
    const d = addGiorni(OGGI, g);
    const k = iso(d);
    const ev = eventiFuturi.get(k) ?? [];
    s += ev.reduce((a, e) => a + e.importo, 0);
    s -= quotaGiornaliera;
    if (s < minimo.valore) minimo = { data: k, valore: s };
    futuro.push({ data: k, storico: null, previsto: Math.round(s * 100) / 100, eventi: ev });
  }

  const mesiTot = opzioni.mesi;
  return {
    punti: [...storico, ...futuro],
    minimo: { data: minimo.data, valore: Math.round(minimo.valore * 100) / 100 },
    nettoMensile: Math.round(((s - start) / mesiTot) * 100) / 100,
    saldoFinale: Math.round(s * 100) / 100,
  };
}

/** Entrate/uscite mese per mese (previsione 12 mesi). */
export function flussiMensili(ricorrenze: Ricorrenza[], spesaVariabile: number, mesi = 12) {
  const out: { mese: string; etichetta: string; entrate: number; usciteFisse: number; usciteVariabili: number; netto: number; eventi: Scadenza[] }[] = [];
  for (let m = 0; m < mesi; m++) {
    const inizio = m === 0 ? OGGI : new Date(OGGI.getFullYear(), OGGI.getMonth() + m, 1);
    const fineMese = new Date(inizio.getFullYear(), inizio.getMonth() + 1, 0);
    const eventi: Scadenza[] = [];
    let entrate = 0;
    let uscite = 0;
    ricorrenze.forEach((r) =>
      occorrenze(r, inizio, fineMese).forEach((d) => {
        eventi.push({ data: iso(d), ricorrenza: r });
        if (r.importo > 0) entrate += r.importo;
        else uscite += -r.importo;
      }),
    );
    out.push({
      mese: `${inizio.getFullYear()}-${String(inizio.getMonth() + 1).padStart(2, '0')}`,
      etichetta: `${MESI_BREVI[inizio.getMonth()]} ${String(inizio.getFullYear()).slice(2)}`,
      entrate: Math.round(entrate * 100) / 100,
      usciteFisse: Math.round(uscite * 100) / 100,
      usciteVariabili: Math.round(spesaVariabile * 100) / 100,
      netto: Math.round((entrate - uscite - spesaVariabile) * 100) / 100,
      eventi: eventi.sort((a, b) => a.data.localeCompare(b.data)),
    });
  }
  return out;
}

/** Uscite per categoria negli ultimi N giorni. */
export function uscitePerCategoria(transazioni: Transazione[], giorni = 30) {
  const da = iso(addGiorni(OGGI, -giorni));
  const m = new Map<string, number>();
  transazioni
    .filter((t) => t.data >= da && t.importo < 0)
    .forEach((t) => m.set(t.categoria, (m.get(t.categoria) ?? 0) + -t.importo));
  return Array.from(m.entries())
    .map(([categoria, totale]) => ({ categoria, totale: Math.round(totale * 100) / 100 }))
    .sort((a, b) => b.totale - a.totale);
}

export const BANCHE_DISPONIBILI = [
  { nome: 'Intesa Sanpaolo', sigla: 'IS', hue: 200 },
  { nome: 'UniCredit', sigla: 'UC', hue: 3 },
  { nome: 'Banco BPM', sigla: 'BP', hue: 145 },
  { nome: 'BPER Banca', sigla: 'BE', hue: 15 },
  { nome: 'Poste Italiane', sigla: 'PI', hue: 48 },
  { nome: 'Fineco', sigla: 'FB', hue: 35 },
  { nome: 'Credit Agricole', sigla: 'CA', hue: 95 },
  { nome: 'BNL BNP Paribas', sigla: 'BN', hue: 160 },
  { nome: 'Banca Sella', sigla: 'BS', hue: 220 },
  { nome: 'Banca Mediolanum', sigla: 'BM', hue: 250 },
  { nome: 'Widiba', sigla: 'WD', hue: 300 },
  { nome: 'ING Italia', sigla: 'IN', hue: 25 },
  { nome: 'Revolut', sigla: 'RV', hue: 265 },
  { nome: 'N26', sigla: 'N26', hue: 185 },
  { nome: 'Hype', sigla: 'HY', hue: 165 },
  { nome: 'Illimity', sigla: 'IL', hue: 340 },
];
