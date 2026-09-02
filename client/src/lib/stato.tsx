import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { generaTransazioni, type Conto, type Ricorrenza, type Transazione } from './data';
import { api, impostaToken } from './api';

export interface Utente {
  id: string;
  email: string;
  nome: string;
  cognome: string;
  avatar: string | null;
  ruolo: 'admin' | 'utente';
  piano: string;
  creatoIl: string;
  layout?: Record<string, unknown[]> | null;
}

export interface Punto {
  titolo: string;
  testo: string;
}

export type TipoSlide = 'azienda' | 'consiglio';

export interface SlideAccesso {
  tipo: TipoSlide;
  occhiello: string;
  titolo: string;
  testo: string;
}

export interface Impostazioni {
  nomeApp: string;
  payoff: string;
  occhielloAccesso: string;
  titoloAccesso1: string;
  titoloAccesso2: string;
  testoAccesso: string;
  punti: Punto[];
  slideAccesso: SlideAccesso[];
  slideIntervallo: number;
  slideAutomatico: boolean;
  notaPrototipo: string;
  mostraNotaPrototipo: boolean;
  tonalita: number;
  saturazione: number;
  luminosita: number;
  tonalitaScura: number;
  orizzonteDefault: number;
  giorniConsenso: number;
  spesaVariabileManuale: number;
  giorniStorico: number;
  titoloPanoramica: string;
  messaggioBenvenuto: string;
  sottotitoloAccesso: string;
}

interface Stato {
  pronto: boolean;
  autenticato: boolean;
  utente: Utente | null;
  entra: (email: string, password: string) => Promise<void>;
  esci: () => void;
  aggiornaUtente: (u: Utente) => void;
  salvaLayout: (layout: Record<string, unknown[]>) => void;
  tema: 'light' | 'dark';
  cambiaTema: () => void;
  impostazioni: Impostazioni;
  applicaImpostazioni: (i: Impostazioni) => void;
  conti: Conto[];
  impostaConti: (c: Conto[]) => void;
  aggiungiConto: (c: Conto) => Promise<void>;
  ricorrenze: Ricorrenza[];
  impostaRicorrenze: (r: Ricorrenza[]) => void;
  transazioni: Transazione[];
  ultimoAggiornamento: number;
  aggiorna: () => void;
}

const PREDEFINITE: Impostazioni = {
  nomeApp: 'Financy',
  payoff: 'Il gestore automatico delle tue finanze',
  occhielloAccesso: 'Gestore automatico delle finanze',
  titoloAccesso1: 'Tutti i tuoi conti.',
  titoloAccesso2: 'Un unico futuro.',
  testoAccesso:
    "Financy non è l'app della tua banca: unisce ogni conto, riconosce le spese che tornano ogni mese e ti mostra quanto avrai davvero sul conto tra sei mesi.",
  punti: [],
  slideAccesso: [],
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

const Ctx = createContext<Stato | null>(null);

export function ProviderStato({ children }: { children: ReactNode }) {
  const [pronto, setPronto] = useState(false);
  const [utente, setUtente] = useState<Utente | null>(null);
  const [tema, setTema] = useState<'light' | 'dark'>(() =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
  );
  const [impostazioni, setImpostazioni] = useState<Impostazioni>(PREDEFINITE);
  const [conti, setConti] = useState<Conto[]>([]);
  const [ricorrenze, setRicorrenze] = useState<Ricorrenza[]>([]);
  const [ultimoAggiornamento, setUltimoAggiornamento] = useState(4);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', tema === 'dark');
  }, [tema]);

  // colore del marchio personalizzabile dall'area amministrazione
  useEffect(() => {
    const r = document.documentElement;
    const chiaro = `${impostazioni.tonalita} ${impostazioni.saturazione}% ${impostazioni.luminosita}%`;
    const scuro = `${impostazioni.tonalitaScura} 50% 50%`;
    r.style.setProperty('--primary', tema === 'dark' ? scuro : chiaro);
    r.style.setProperty('--ring', tema === 'dark' ? scuro : chiaro);
    r.style.setProperty('--chart-1', tema === 'dark' ? scuro : chiaro);
  }, [impostazioni.tonalita, impostazioni.saturazione, impostazioni.luminosita, impostazioni.tonalitaScura, tema]);

  useEffect(() => {
    api<{ impostazioni: Impostazioni }>('/pubblico')
      .then((d) => setImpostazioni({ ...PREDEFINITE, ...d.impostazioni }))
      .catch(() => undefined)
      .finally(() => setPronto(true));
  }, []);

  const transazioni = useMemo(
    () => generaTransazioni(ricorrenze, impostazioni.giorniStorico),
    [ricorrenze, impostazioni.giorniStorico],
  );

  const entra = useCallback(async (email: string, password: string) => {
    const d = await api<{ token: string; utente: Utente; impostazioni: Impostazioni; conti: Conto[]; ricorrenze: Ricorrenza[] }>(
      '/accesso',
      { metodo: 'POST', corpo: { email, password } },
    );
    impostaToken(d.token);
    setUtente(d.utente);
    setImpostazioni({ ...PREDEFINITE, ...d.impostazioni });
    setConti(d.conti);
    setRicorrenze(d.ricorrenze);
    setUltimoAggiornamento(4);
  }, []);

  const esci = useCallback(() => {
    api('/esci', { metodo: 'POST' }).catch(() => undefined);
    impostaToken(null);
    setUtente(null);
  }, []);

  const aggiungiConto = useCallback(async (c: Conto) => {
    const d = await api<{ conti: Conto[] }>('/conti', { metodo: 'POST', corpo: c });
    setConti(d.conti);
  }, []);

  const valore = useMemo<Stato>(
    () => ({
      pronto,
      autenticato: !!utente,
      utente,
      entra,
      esci,
      aggiornaUtente: setUtente,
      salvaLayout: (layout: Record<string, unknown[]>) => {
        setUtente((u) => (u ? { ...u, layout } : u));
        void api('/layout', { metodo: 'PUT', corpo: { layout } }).catch(() => undefined);
      },
      tema,
      cambiaTema: () => setTema((t) => (t === 'dark' ? 'light' : 'dark')),
      impostazioni,
      applicaImpostazioni: (i) => setImpostazioni({ ...PREDEFINITE, ...i }),
      conti,
      impostaConti: setConti,
      aggiungiConto,
      ricorrenze,
      impostaRicorrenze: setRicorrenze,
      transazioni,
      ultimoAggiornamento,
      aggiorna: () => setUltimoAggiornamento(0),
    }),
    [pronto, utente, entra, esci, tema, impostazioni, conti, aggiungiConto, ricorrenze, transazioni, ultimoAggiornamento],
  );

  return <Ctx.Provider value={valore}>{children}</Ctx.Provider>;
}

export function useStato() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useStato fuori dal provider');
  return c;
}
