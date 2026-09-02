import type { Express, Request, Response, NextFunction } from 'express';
import type { Server } from 'node:http';
import { randomBytes } from 'node:crypto';
import {
  db,
  hashPassword,
  verificaPassword,
  leggiImpostazioni,
  scriviImpostazioni,
  elencoConti,
  elencoRicorrenze,
  utentePubblico,
  ripristinaDatiDimostrativi,
} from './db';

interface ReqAuth extends Request {
  utente?: any;
}

function utenteDaToken(token?: string) {
  if (!token) return null;
  const s = db.prepare('SELECT utenteId FROM sessioni WHERE token = ?').get(token) as { utenteId: string } | undefined;
  if (!s) return null;
  return db.prepare('SELECT * FROM utenti WHERE id = ?').get(s.utenteId) ?? null;
}

function autenticato(req: ReqAuth, res: Response, next: NextFunction) {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  const u = utenteDaToken(token);
  if (!u) return res.status(401).json({ messaggio: 'Sessione scaduta, accedi di nuovo.' });
  req.utente = u;
  next();
}

function soloAdmin(req: ReqAuth, res: Response, next: NextFunction) {
  if (req.utente?.ruolo !== 'admin') return res.status(403).json({ messaggio: 'Serve un account amministratore.' });
  next();
}

/** Ogni modifica del profilo richiede la password corrente. */
function confermaPassword(req: ReqAuth, res: Response): boolean {
  const pw = String(req.body?.password ?? '');
  if (!pw) {
    res.status(400).json({ messaggio: 'Inserisci la password per confermare.' });
    return false;
  }
  if (!verificaPassword(pw, req.utente.password)) {
    res.status(400).json({ messaggio: 'Password non corretta.' });
    return false;
  }
  return true;
}

const configurazione = () => ({
  impostazioni: leggiImpostazioni(),
  conti: elencoConti(),
  ricorrenze: elencoRicorrenze(),
});

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  // ---------- accesso ----------
  app.post('/api/accesso', (req, res) => {
    const email = String(req.body?.email ?? '').trim().toLowerCase();
    const password = String(req.body?.password ?? '');
    const u = db.prepare('SELECT * FROM utenti WHERE lower(email) = ?').get(email) as any;
    if (!u || !verificaPassword(password, u.password)) {
      return res.status(400).json({ messaggio: 'Email o password non corretti.' });
    }
    const token = randomBytes(24).toString('hex');
    db.prepare('INSERT INTO sessioni (token, utenteId, creataIl) VALUES (?, ?, ?)').run(token, u.id, Date.now());
    res.json({ token, utente: utentePubblico(u), ...configurazione() });
  });

  app.post('/api/esci', autenticato, (req: ReqAuth, res) => {
    const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    db.prepare('DELETE FROM sessioni WHERE token = ?').run(token);
    res.json({ ok: true });
  });

  app.get('/api/io', autenticato, (req: ReqAuth, res) => {
    res.json({ utente: utentePubblico(req.utente), ...configurazione() });
  });

  // configurazione pubblica: serve alla schermata di accesso (testi, colori)
  app.get('/api/pubblico', (_req, res) => res.json({ impostazioni: leggiImpostazioni() }));

  // layout dei widget: preferenza personale, non richiede password
  app.put('/api/layout', autenticato, (req: ReqAuth, res) => {
    const layout = req.body?.layout;
    if (layout !== null && typeof layout !== 'object') {
      return res.status(400).json({ messaggio: 'Layout non valido.' });
    }
    db.prepare('UPDATE utenti SET layout = ? WHERE id = ?').run(
      layout ? JSON.stringify(layout) : null,
      req.utente.id,
    );
    const u = db.prepare('SELECT * FROM utenti WHERE id = ?').get(req.utente.id);
    res.json({ utente: utentePubblico(u) });
  });

  // ---------- profilo (password richiesta a ogni modifica) ----------
  app.patch('/api/profilo', autenticato, (req: ReqAuth, res) => {
    if (!confermaPassword(req, res)) return;
    const nome = String(req.body?.nome ?? req.utente.nome).trim();
    const cognome = String(req.body?.cognome ?? req.utente.cognome).trim();
    const email = String(req.body?.email ?? req.utente.email).trim().toLowerCase();
    if (!nome || !cognome) return res.status(400).json({ messaggio: 'Nome e cognome non possono essere vuoti.' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ messaggio: 'Indirizzo email non valido.' });
    const esiste = db.prepare('SELECT id FROM utenti WHERE lower(email) = ? AND id <> ?').get(email, req.utente.id);
    if (esiste) return res.status(400).json({ messaggio: 'Questa email è già associata a un altro account.' });
    db.prepare('UPDATE utenti SET nome = ?, cognome = ?, email = ? WHERE id = ?').run(nome, cognome, email, req.utente.id);
    const u = db.prepare('SELECT * FROM utenti WHERE id = ?').get(req.utente.id);
    res.json({ utente: utentePubblico(u), messaggio: 'Profilo aggiornato.' });
  });

  app.post('/api/profilo/password', autenticato, (req: ReqAuth, res) => {
    if (!confermaPassword(req, res)) return;
    const nuova = String(req.body?.nuovaPassword ?? '');
    if (nuova.length < 8) return res.status(400).json({ messaggio: 'La nuova password deve avere almeno 8 caratteri.' });
    if (verificaPassword(nuova, req.utente.password))
      return res.status(400).json({ messaggio: 'La nuova password è uguale a quella attuale.' });
    db.prepare('UPDATE utenti SET password = ? WHERE id = ?').run(hashPassword(nuova), req.utente.id);
    // le altre sessioni vengono chiuse, quella corrente resta valida
    const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    db.prepare('DELETE FROM sessioni WHERE utenteId = ? AND token <> ?').run(req.utente.id, token);
    res.json({ messaggio: 'Password aggiornata. Le altre sessioni sono state chiuse.' });
  });

  app.post('/api/profilo/avatar', autenticato, (req: ReqAuth, res) => {
    if (!confermaPassword(req, res)) return;
    const avatar = req.body?.avatar;
    if (avatar !== null) {
      if (typeof avatar !== 'string' || !avatar.startsWith('data:image/'))
        return res.status(400).json({ messaggio: 'Immagine non valida.' });
      if (avatar.length > 1_500_000) return res.status(400).json({ messaggio: 'Immagine troppo grande.' });
    }
    db.prepare('UPDATE utenti SET avatar = ? WHERE id = ?').run(avatar, req.utente.id);
    const u = db.prepare('SELECT * FROM utenti WHERE id = ?').get(req.utente.id);
    res.json({ utente: utentePubblico(u), messaggio: avatar ? 'Immagine del profilo aggiornata.' : 'Immagine rimossa.' });
  });

  // ---------- conti (collegamento dalla app) ----------
  app.post('/api/conti', autenticato, (req, res) => {
    const c = req.body ?? {};
    const id = String(c.id ?? `c${Date.now()}`);
    const ordine = (db.prepare('SELECT COALESCE(MAX(ordine), 0) m FROM conti').get() as { m: number }).m + 1;
    db.prepare(
      'INSERT INTO conti (id, banca, nome, tipo, iban, saldo, hue, sigla, sincronizzato, consensoGiorni, ordine) VALUES (@id, @banca, @nome, @tipo, @iban, @saldo, @hue, @sigla, @sincronizzato, @consensoGiorni, @ordine)',
    ).run({
      id,
      banca: String(c.banca ?? 'Banca'),
      nome: String(c.nome ?? 'Conto Corrente'),
      tipo: String(c.tipo ?? 'corrente'),
      iban: String(c.iban ?? 'IT00 X000 0000 0000 0000 0000'),
      saldo: Number(c.saldo ?? 0),
      hue: Number(c.hue ?? 164),
      sigla: String(c.sigla ?? 'XX'),
      sincronizzato: String(c.sincronizzato ?? 'adesso'),
      consensoGiorni: Number(c.consensoGiorni ?? leggiImpostazioni().giorniConsenso),
      ordine,
    });
    res.status(201).json({ conti: elencoConti() });
  });

  // ---------- amministrazione ----------
  app.put('/api/admin/impostazioni', autenticato, soloAdmin, (req, res) => {
    const impostazioni = scriviImpostazioni(req.body ?? {});
    res.json({ impostazioni, messaggio: 'Impostazioni salvate.' });
  });

  app.put('/api/admin/conti/:id', autenticato, soloAdmin, (req, res) => {
    const c = req.body ?? {};
    const esiste = db.prepare('SELECT id FROM conti WHERE id = ?').get(req.params.id);
    if (!esiste) return res.status(404).json({ messaggio: 'Conto non trovato.' });
    db.prepare(
      'UPDATE conti SET banca=@banca, nome=@nome, tipo=@tipo, iban=@iban, saldo=@saldo, hue=@hue, sigla=@sigla, sincronizzato=@sincronizzato, consensoGiorni=@consensoGiorni WHERE id=@id',
    ).run({
      id: req.params.id,
      banca: String(c.banca ?? ''),
      nome: String(c.nome ?? ''),
      tipo: String(c.tipo ?? 'corrente'),
      iban: String(c.iban ?? ''),
      saldo: Number(c.saldo ?? 0),
      hue: Number(c.hue ?? 164),
      sigla: String(c.sigla ?? 'XX').slice(0, 2).toUpperCase(),
      sincronizzato: String(c.sincronizzato ?? 'adesso'),
      consensoGiorni: Number(c.consensoGiorni ?? 90),
    });
    res.json({ conti: elencoConti(), messaggio: 'Conto aggiornato.' });
  });

  app.delete('/api/admin/conti/:id', autenticato, soloAdmin, (req, res) => {
    db.prepare('DELETE FROM ricorrenze WHERE contoId = ?').run(req.params.id);
    db.prepare('DELETE FROM conti WHERE id = ?').run(req.params.id);
    res.json({ conti: elencoConti(), ricorrenze: elencoRicorrenze(), messaggio: 'Conto eliminato.' });
  });

  app.post('/api/admin/ricorrenze', autenticato, soloAdmin, (req, res) => {
    const r = req.body ?? {};
    const id = `r${Date.now()}`;
    const ordine = (db.prepare('SELECT COALESCE(MAX(ordine), 0) m FROM ricorrenze').get() as { m: number }).m + 1;
    db.prepare(
      'INSERT INTO ricorrenze (id, nome, categoria, importo, cadenza, ancora, contoId, affidabilita, rilevataAuto, nuova, ordine) VALUES (@id, @nome, @categoria, @importo, @cadenza, @ancora, @contoId, @affidabilita, @rilevataAuto, @nuova, @ordine)',
    ).run({
      id,
      nome: String(r.nome ?? 'Nuova voce'),
      categoria: String(r.categoria ?? 'Spesa'),
      importo: Number(r.importo ?? 0),
      cadenza: String(r.cadenza ?? 'mensile'),
      ancora: String(r.ancora ?? '2026-09-01'),
      contoId: String(r.contoId ?? (elencoConti()[0] as any)?.id ?? 'isp'),
      affidabilita: Number(r.affidabilita ?? 0.9),
      rilevataAuto: r.rilevataAuto === false ? 0 : 1,
      nuova: r.nuova ? 1 : 0,
      ordine,
    });
    res.status(201).json({ ricorrenze: elencoRicorrenze(), messaggio: 'Ricorrenza creata.' });
  });

  app.put('/api/admin/ricorrenze/:id', autenticato, soloAdmin, (req, res) => {
    const r = req.body ?? {};
    const esiste = db.prepare('SELECT id FROM ricorrenze WHERE id = ?').get(req.params.id);
    if (!esiste) return res.status(404).json({ messaggio: 'Ricorrenza non trovata.' });
    db.prepare(
      'UPDATE ricorrenze SET nome=@nome, categoria=@categoria, importo=@importo, cadenza=@cadenza, ancora=@ancora, contoId=@contoId, affidabilita=@affidabilita, rilevataAuto=@rilevataAuto, nuova=@nuova WHERE id=@id',
    ).run({
      id: req.params.id,
      nome: String(r.nome ?? ''),
      categoria: String(r.categoria ?? 'Spesa'),
      importo: Number(r.importo ?? 0),
      cadenza: String(r.cadenza ?? 'mensile'),
      ancora: String(r.ancora ?? '2026-09-01'),
      contoId: String(r.contoId ?? 'isp'),
      affidabilita: Number(r.affidabilita ?? 0.9),
      rilevataAuto: r.rilevataAuto === false ? 0 : 1,
      nuova: r.nuova ? 1 : 0,
    });
    res.json({ ricorrenze: elencoRicorrenze(), messaggio: 'Ricorrenza aggiornata.' });
  });

  app.delete('/api/admin/ricorrenze/:id', autenticato, soloAdmin, (req, res) => {
    db.prepare('DELETE FROM ricorrenze WHERE id = ?').run(req.params.id);
    res.json({ ricorrenze: elencoRicorrenze(), messaggio: 'Ricorrenza eliminata.' });
  });

  app.get('/api/admin/utenti', autenticato, soloAdmin, (_req, res) => {
    const righe = db.prepare('SELECT * FROM utenti ORDER BY creatoIl').all() as any[];
    res.json({ utenti: righe.map(utentePubblico) });
  });

  app.put('/api/admin/utenti/:id', autenticato, soloAdmin, (req, res) => {
    const u = db.prepare('SELECT * FROM utenti WHERE id = ?').get(req.params.id) as any;
    if (!u) return res.status(404).json({ messaggio: 'Utente non trovato.' });
    const ruolo = req.body?.ruolo === 'admin' ? 'admin' : 'utente';
    const piano = String(req.body?.piano ?? u.piano);
    db.prepare('UPDATE utenti SET ruolo = ?, piano = ? WHERE id = ?').run(ruolo, piano, u.id);
    const righe = db.prepare('SELECT * FROM utenti ORDER BY creatoIl').all() as any[];
    res.json({ utenti: righe.map(utentePubblico), messaggio: 'Utente aggiornato.' });
  });

  app.post('/api/admin/ripristina', autenticato, soloAdmin, (req: ReqAuth, res) => {
    if (!confermaPassword(req, res)) return;
    ripristinaDatiDimostrativi();
    res.json({ ...configurazione(), messaggio: 'Dati dimostrativi ripristinati.' });
  });

  return httpServer;
}
