// Financy — database locale SQLite (file su disco, nessun servizio esterno, nessun costo)
import Database from 'better-sqlite3';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { CONTI_INIZIALI, RICORRENZE } from '../client/src/lib/data';

const cartella = path.resolve(process.cwd(), 'data');
mkdirSync(cartella, { recursive: true });

export const db = new Database(path.join(cartella, 'financy.db'));
db.pragma('journal_mode = WAL');

db.exec(`
CREATE TABLE IF NOT EXISTS utenti (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  cognome TEXT NOT NULL,
  password TEXT NOT NULL,
  avatar TEXT,
  ruolo TEXT NOT NULL DEFAULT 'utente',
  piano TEXT NOT NULL DEFAULT 'Piano Plus',
  creatoIl TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS sessioni (
  token TEXT PRIMARY KEY,
  utenteId TEXT NOT NULL,
  creataIl INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS impostazioni (
  chiave TEXT PRIMARY KEY,
  valore TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS conti (
  id TEXT PRIMARY KEY,
  banca TEXT NOT NULL,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL,
  iban TEXT NOT NULL,
  saldo REAL NOT NULL,
  hue INTEGER NOT NULL,
  sigla TEXT NOT NULL,
  sincronizzato TEXT NOT NULL,
  consensoGiorni INTEGER NOT NULL,
  ordine INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS ricorrenze (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  categoria TEXT NOT NULL,
  importo REAL NOT NULL,
  cadenza TEXT NOT NULL,
  ancora TEXT NOT NULL,
  contoId TEXT NOT NULL,
  affidabilita REAL NOT NULL,
  rilevataAuto INTEGER NOT NULL DEFAULT 1,
  nuova INTEGER NOT NULL DEFAULT 0,
  ordine INTEGER NOT NULL DEFAULT 0
);
`);

// ---------- password ----------
export function hashPassword(pw: string) {
  const sale = randomBytes(16).toString('hex');
  return `${sale}:${scryptSync(pw, sale, 64).toString('hex')}`;
}

export function verificaPassword(pw: string, salvata: string) {
  const [sale, atteso] = salvata.split(':');
  if (!sale || !atteso) return false;
  const calcolato = scryptSync(pw, sale, 64);
  const bufAtteso = Buffer.from(atteso, 'hex');
  if (bufAtteso.length !== calcolato.length) return false;
  return timingSafeEqual(calcolato, bufAtteso);
}

// ---------- impostazioni predefinite ----------
export const IMPOSTAZIONI_PREDEFINITE = {
  nomeApp: 'Financy',
  payoff: 'Il gestore automatico delle tue finanze',
  occhielloAccesso: 'Gestore automatico delle finanze',
  titoloAccesso1: 'Tutti i tuoi conti.',
  titoloAccesso2: 'Un unico futuro.',
  testoAccesso:
    "Financy non è l'app della tua banca: unisce ogni conto, riconosce le spese che tornano ogni mese e ti mostra quanto avrai davvero sul conto tra sei mesi.",
  punti: [
    { titolo: 'Tutti i conti, una sola vista', testo: 'Banche, carte e conti digitali aggregati via open banking PSD2, in sola lettura.' },
    { titolo: 'Le ricorrenze le trova Financy', testo: 'Mutuo, bollo, assicurazioni e abbonamenti riconosciuti dalle transazioni.' },
    { titolo: 'Il saldo di domani, non di ieri', testo: 'Proiezione della liquidità a 12 mesi con le scadenze già calcolate.' },
    { titolo: 'I tuoi dati restano tuoi', testo: 'Nessun pagamento disponibile, consenso revocabile in ogni momento, crittografia end-to-end.' },
  ],
  // Slide del pannello di accesso: informazioni sull'azienda e consigli finanziari.
  slideAccesso: [
    {
      tipo: 'azienda',
      occhiello: 'Gestore automatico delle finanze',
      titolo: 'Tutti i tuoi conti.\nUn unico futuro.',
      testo:
        "Financy non è l'app della tua banca: unisce ogni conto, riconosce le spese che tornano ogni mese e ti mostra quanto avrai davvero sul conto tra sei mesi.",
    },
    {
      tipo: 'azienda',
      occhiello: 'Come funziona',
      titolo: 'Colleghi i conti\nuna volta sola.',
      testo:
        'Banche, carte e conti digitali si aggregano via open banking PSD2 in sola lettura. Da quel momento Financy aggiorna tutto da sé, senza inserimenti manuali.',
    },
    {
      tipo: 'consiglio',
      occhiello: 'Consiglio finanziario',
      titolo: 'Tieni da parte\ntre mesi di uscite.',
      testo:
        'Un fondo di emergenza pari a tre mesi di spese fisse è la difesa più efficace contro gli imprevisti. Financy calcola la cifra esatta a partire dalle tue ricorrenze.',
    },
    {
      tipo: 'consiglio',
      occhiello: 'Consiglio finanziario',
      titolo: 'Guarda le ricorrenze,\nnon il saldo di oggi.',
      testo:
        'Il saldo di fine mese dice poco: contano le uscite già impegnate. Mutuo, bollo e assicurazione pesano di più se cadono nello stesso mese, e va previsto prima.',
    },
    {
      tipo: 'azienda',
      occhiello: 'Perché Financy',
      titolo: 'Il saldo di domani,\nnon quello di ieri.',
      testo:
        'Le app bancarie raccontano il passato. Financy proietta la liquidità a 12 mesi e ti avvisa quando una scadenza rischia di portarti sotto la soglia di sicurezza.',
    },
  ] as { tipo: 'azienda' | 'consiglio'; occhiello: string; titolo: string; testo: string }[],
  slideIntervallo: 15,
  slideAutomatico: true,
  notaPrototipo: 'Prototipo dimostrativo — i dati mostrati sono fittizi.',
  mostraNotaPrototipo: true,
  tonalita: 164,
  saturazione: 66,
  luminosita: 23,
  tonalitaScura: 161,
  orizzonteDefault: 12,
  giorniConsenso: 90,
  spesaVariabileManuale: 0,
  giorniStorico: 150,
  titoloPanoramica: 'Ciao',
  messaggioBenvenuto: 'Bentornato',
  sottotitoloAccesso: 'Accedi per vedere il tuo prospetto aggiornato.',
};

export type Impostazioni = typeof IMPOSTAZIONI_PREDEFINITE;

export function leggiImpostazioni(): Impostazioni {
  const righe = db.prepare('SELECT chiave, valore FROM impostazioni').all() as { chiave: string; valore: string }[];
  const out: Record<string, unknown> = { ...IMPOSTAZIONI_PREDEFINITE };
  for (const r of righe) {
    try {
      out[r.chiave] = JSON.parse(r.valore);
    } catch {
      out[r.chiave] = r.valore;
    }
  }
  return out as Impostazioni;
}

/**
 * Allinea i database già esistenti quando aggiungiamo voci ai valori predefiniti.
 * Interviene solo se il contenuto salvato non è stato personalizzato dall'admin.
 */
function allineaImpostazioni() {
  const riga = db.prepare("SELECT valore FROM impostazioni WHERE chiave = 'punti'").get() as
    | { valore: string }
    | undefined;
  if (!riga) return;
  try {
    const salvati = JSON.parse(riga.valore) as { titolo: string }[];
    const predefiniti = IMPOSTAZIONI_PREDEFINITE.punti;
    const invariati =
      Array.isArray(salvati) &&
      salvati.length < predefiniti.length &&
      salvati.every((p, i) => p.titolo === predefiniti[i].titolo);
    if (invariati) {
      db.prepare("DELETE FROM impostazioni WHERE chiave = 'punti'").run();
    }
  } catch {
    /* valore illeggibile: lo lasciamo com'è */
  }
}

export function scriviImpostazioni(parziale: Record<string, unknown>) {
  const stmt = db.prepare('INSERT INTO impostazioni (chiave, valore) VALUES (?, ?) ON CONFLICT(chiave) DO UPDATE SET valore = excluded.valore');
  const tx = db.transaction((obj: Record<string, unknown>) => {
    for (const [k, v] of Object.entries(obj)) {
      if (!(k in IMPOSTAZIONI_PREDEFINITE)) continue;
      stmt.run(k, JSON.stringify(v));
    }
  });
  tx(parziale);
  return leggiImpostazioni();
}

// ---------- seed ----------
export function seed() {
  const nUtenti = (db.prepare('SELECT COUNT(*) n FROM utenti').get() as { n: number }).n;
  if (nUtenti === 0) {
    const ins = db.prepare(
      'INSERT INTO utenti (id, email, nome, cognome, password, avatar, ruolo, piano, creatoIl) VALUES (@id, @email, @nome, @cognome, @password, @avatar, @ruolo, @piano, @creatoIl)',
    );
    ins.run({
      id: 'u1',
      email: 'dennis.oteri@gmail.com',
      nome: 'Dennis',
      cognome: 'Oteri',
      password: hashPassword('financy2026'),
      avatar: null,
      ruolo: 'admin',
      piano: 'Piano Plus',
      creatoIl: new Date().toISOString(),
    });
    ins.run({
      id: 'u2',
      email: 'giulia.rossi@example.com',
      nome: 'Giulia',
      cognome: 'Rossi',
      password: hashPassword('financy2026'),
      avatar: null,
      ruolo: 'utente',
      piano: 'Piano Base',
      creatoIl: new Date().toISOString(),
    });
  }

  allineaImpostazioni();

  const nConti = (db.prepare('SELECT COUNT(*) n FROM conti').get() as { n: number }).n;
  if (nConti === 0) {
    const ins = db.prepare(
      'INSERT INTO conti (id, banca, nome, tipo, iban, saldo, hue, sigla, sincronizzato, consensoGiorni, ordine) VALUES (@id, @banca, @nome, @tipo, @iban, @saldo, @hue, @sigla, @sincronizzato, @consensoGiorni, @ordine)',
    );
    CONTI_INIZIALI.forEach((c, i) => ins.run({ ...c, ordine: i }));
  }

  const nRic = (db.prepare('SELECT COUNT(*) n FROM ricorrenze').get() as { n: number }).n;
  if (nRic === 0) {
    const ins = db.prepare(
      'INSERT INTO ricorrenze (id, nome, categoria, importo, cadenza, ancora, contoId, affidabilita, rilevataAuto, nuova, ordine) VALUES (@id, @nome, @categoria, @importo, @cadenza, @ancora, @contoId, @affidabilita, @rilevataAuto, @nuova, @ordine)',
    );
    RICORRENZE.forEach((r, i) =>
      ins.run({
        id: r.id,
        nome: r.nome,
        categoria: r.categoria,
        importo: r.importo,
        cadenza: r.cadenza,
        ancora: r.ancora,
        contoId: r.contoId,
        affidabilita: r.affidabilita,
        rilevataAuto: r.rilevataAuto ? 1 : 0,
        nuova: r.nuova ? 1 : 0,
        ordine: i,
      }),
    );
  }
}

export function ripristinaDatiDimostrativi() {
  const tx = db.transaction(() => {
    db.exec('DELETE FROM conti; DELETE FROM ricorrenze; DELETE FROM impostazioni;');
  });
  tx();
  seed();
}

// ---------- lettura entità ----------
export const elencoConti = () =>
  db.prepare('SELECT id, banca, nome, tipo, iban, saldo, hue, sigla, sincronizzato, consensoGiorni FROM conti ORDER BY ordine, rowid').all();

export const elencoRicorrenze = () =>
  (db.prepare('SELECT * FROM ricorrenze ORDER BY ordine, rowid').all() as any[]).map((r) => ({
    id: r.id,
    nome: r.nome,
    categoria: r.categoria,
    importo: r.importo,
    cadenza: r.cadenza,
    ancora: r.ancora,
    contoId: r.contoId,
    affidabilita: r.affidabilita,
    rilevataAuto: !!r.rilevataAuto,
    nuova: !!r.nuova,
  }));

// colonna aggiunta dopo la prima versione dello schema
try {
  db.prepare('SELECT layout FROM utenti LIMIT 1').get();
} catch {
  db.exec('ALTER TABLE utenti ADD COLUMN layout TEXT');
}

export const utentePubblico = (u: any) => ({
  id: u.id,
  email: u.email,
  nome: u.nome,
  cognome: u.cognome,
  avatar: u.avatar ?? null,
  ruolo: u.ruolo,
  piano: u.piano,
  creatoIl: u.creatoIl,
  layout: u.layout ? JSON.parse(u.layout) : null,
});

seed();
