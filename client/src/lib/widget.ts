import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  BarChart3,
  CalendarClock,
  Coins,
  Landmark,
  LineChart,
  ListOrdered,
  PieChart,
  PiggyBank,
  Sparkles,
  TrendingDown,
  Wallet,
} from 'lucide-react';

export type Larghezza = 3 | 4 | 6 | 8 | 12;
export type Altezza = 'bassa' | 'media' | 'alta';
export type Orientamento = 'verticale' | 'orizzontale';

export type TipoWidget =
  | 'kpi-patrimonio'
  | 'kpi-liquidita'
  | 'kpi-uscite'
  | 'kpi-previsto'
  | 'kpi-risparmio'
  | 'kpi-minimo'
  | 'previsione'
  | 'grafico'
  | 'scadenze'
  | 'conti'
  | 'categorie'
  | 'transazioni'
  | 'ricorrenze-nuove'
  | 'salute';

export type Widget = {
  id: string;
  tipo: TipoWidget;
  larghezza: Larghezza;
  altezza: Altezza;
  orientamento: Orientamento;
  limite: number;
};

export type DefinizioneWidget = {
  titolo: string;
  descrizione: string;
  icona: LucideIcon;
  gruppo: 'Numeri chiave' | 'Grafici' | 'Elenchi';
  larghezze: Larghezza[];
  altezze: boolean;
  orientabile: boolean;
  limiti?: [number, number];
  predefinito: { larghezza: Larghezza; altezza: Altezza; orientamento: Orientamento; limite: number };
};

const kpi = (larghezza: Larghezza = 3) => ({
  larghezze: [3, 4, 6, 12] as Larghezza[],
  altezze: false,
  orientabile: false,
  predefinito: { larghezza, altezza: 'bassa' as Altezza, orientamento: 'verticale' as Orientamento, limite: 0 },
});

export const CATALOGO: Record<TipoWidget, DefinizioneWidget> = {
  'kpi-patrimonio': {
    titolo: 'Patrimonio totale',
    descrizione: 'Liquidità e investimenti sommati.',
    icona: Wallet,
    gruppo: 'Numeri chiave',
    ...kpi(),
  },
  'kpi-liquidita': {
    titolo: 'Liquidità disponibile',
    descrizione: 'Quanto puoi usare oggi, esclusi gli investimenti.',
    icona: Coins,
    gruppo: 'Numeri chiave',
    ...kpi(),
  },
  'kpi-uscite': {
    titolo: 'Uscite programmate',
    descrizione: 'Scadenze certe dei prossimi 30 giorni.',
    icona: TrendingDown,
    gruppo: 'Numeri chiave',
    ...kpi(),
  },
  'kpi-previsto': {
    titolo: 'Saldo previsto a fine mese',
    descrizione: 'Proiezione della liquidità all’ultimo giorno del mese.',
    icona: LineChart,
    gruppo: 'Numeri chiave',
    ...kpi(),
  },
  'kpi-risparmio': {
    titolo: 'Risparmio medio mensile',
    descrizione: 'Entrate meno uscite fisse e spesa variabile.',
    icona: PiggyBank,
    gruppo: 'Numeri chiave',
    ...kpi(),
  },
  'kpi-minimo': {
    titolo: 'Minimo di liquidità previsto',
    descrizione: 'Il punto più basso della proiezione e quando arriva.',
    icona: Activity,
    gruppo: 'Numeri chiave',
    ...kpi(4),
  },
  previsione: {
    titolo: 'Cosa succede nei prossimi mesi',
    descrizione: 'Riepilogo con minimo di liquidità, risparmio e novità.',
    icona: Sparkles,
    gruppo: 'Grafici',
    larghezze: [6, 8, 12],
    altezze: false,
    orientabile: true,
    predefinito: { larghezza: 12, altezza: 'bassa', orientamento: 'orizzontale', limite: 0 },
  },
  grafico: {
    titolo: 'Proiezione della liquidità',
    descrizione: 'Storico e previsione a 6 o 12 mesi.',
    icona: LineChart,
    gruppo: 'Grafici',
    larghezze: [6, 8, 12],
    altezze: true,
    orientabile: false,
    predefinito: { larghezza: 8, altezza: 'media', orientamento: 'verticale', limite: 0 },
  },
  categorie: {
    titolo: 'Uscite per categoria',
    descrizione: 'Dove finiscono i soldi negli ultimi 30 giorni.',
    icona: PieChart,
    gruppo: 'Grafici',
    larghezze: [4, 6, 8, 12],
    altezze: false,
    orientabile: false,
    limiti: [3, 8],
    predefinito: { larghezza: 4, altezza: 'bassa', orientamento: 'verticale', limite: 6 },
  },
  salute: {
    titolo: 'Salute finanziaria',
    descrizione: 'Indice sintetico su copertura, risparmio e stabilità.',
    icona: BarChart3,
    gruppo: 'Grafici',
    larghezze: [4, 6, 8],
    altezze: false,
    orientabile: false,
    predefinito: { larghezza: 4, altezza: 'bassa', orientamento: 'verticale', limite: 0 },
  },
  scadenze: {
    titolo: 'Prossime scadenze',
    descrizione: 'Le uscite e le entrate già calendarizzate.',
    icona: CalendarClock,
    gruppo: 'Elenchi',
    larghezze: [4, 6, 8, 12],
    altezze: false,
    orientabile: true,
    limiti: [3, 12],
    predefinito: { larghezza: 4, altezza: 'bassa', orientamento: 'verticale', limite: 7 },
  },
  conti: {
    titolo: 'Conti collegati',
    descrizione: 'Saldo e ultima sincronizzazione di ogni conto.',
    icona: Landmark,
    gruppo: 'Elenchi',
    larghezze: [4, 6, 8, 12],
    altezze: false,
    orientabile: true,
    limiti: [2, 12],
    predefinito: { larghezza: 8, altezza: 'bassa', orientamento: 'verticale', limite: 6 },
  },
  transazioni: {
    titolo: 'Ultime transazioni',
    descrizione: 'I movimenti più recenti su tutti i conti.',
    icona: ListOrdered,
    gruppo: 'Elenchi',
    larghezze: [6, 8, 12],
    altezze: false,
    orientabile: true,
    limiti: [3, 12],
    predefinito: { larghezza: 12, altezza: 'bassa', orientamento: 'verticale', limite: 6 },
  },
  'ricorrenze-nuove': {
    titolo: 'Ricorrenze rilevate',
    descrizione: 'Spese ripetute riconosciute in automatico.',
    icona: Sparkles,
    gruppo: 'Elenchi',
    larghezze: [4, 6, 8, 12],
    altezze: false,
    orientabile: true,
    limiti: [1, 6],
    predefinito: { larghezza: 4, altezza: 'bassa', orientamento: 'verticale', limite: 3 },
  },
};

export const TIPI_WIDGET = Object.keys(CATALOGO) as TipoWidget[];

export const ETICHETTA_LARGHEZZA: Record<Larghezza, string> = {
  3: 'Piccolo',
  4: 'Medio',
  6: 'Metà riga',
  8: 'Largo',
  12: 'Riga intera',
};

export const ETICHETTA_ALTEZZA: Record<Altezza, string> = {
  bassa: 'Compatta',
  media: 'Media',
  alta: 'Alta',
};

export const CLASSE_LARGHEZZA: Record<Larghezza, string> = {
  3: 'col-span-1 md:col-span-3 lg:col-span-3',
  4: 'col-span-2 md:col-span-3 lg:col-span-4',
  6: 'col-span-2 md:col-span-6 lg:col-span-6',
  8: 'col-span-2 md:col-span-6 lg:col-span-8',
  12: 'col-span-2 md:col-span-6 lg:col-span-12',
};

let contatore = 0;
export function nuovoWidget(tipo: TipoWidget): Widget {
  contatore += 1;
  const d = CATALOGO[tipo].predefinito;
  return { id: `${tipo}-${Date.now().toString(36)}-${contatore}`, tipo, ...d };
}

function w(tipo: TipoWidget, patch: Partial<Widget> = {}): Widget {
  return { ...nuovoWidget(tipo), ...patch, id: `${tipo}-base` };
}

export const LAYOUT_PREDEFINITO: Record<string, Widget[]> = {
  panoramica: [
    w('kpi-patrimonio'),
    w('kpi-liquidita'),
    w('kpi-uscite'),
    w('kpi-previsto'),
    w('previsione'),
    w('grafico'),
    w('scadenze'),
    w('conti'),
    w('categorie'),
    w('transazioni'),
  ],
};

export function layoutPagina(layout: Record<string, Widget[]> | null | undefined, pagina: string): Widget[] {
  const salvato = layout?.[pagina];
  if (Array.isArray(salvato) && salvato.length) {
    return salvato
      .filter((v) => v && CATALOGO[v.tipo as TipoWidget])
      .map((v) => ({
        id: String(v.id),
        tipo: v.tipo,
        larghezza: (CATALOGO[v.tipo].larghezze.includes(v.larghezza) ? v.larghezza : CATALOGO[v.tipo].predefinito.larghezza),
        altezza: v.altezza ?? 'bassa',
        orientamento: v.orientamento ?? 'verticale',
        limite: typeof v.limite === 'number' ? v.limite : CATALOGO[v.tipo].predefinito.limite,
      }));
  }
  return LAYOUT_PREDEFINITO[pagina] ?? [];
}
