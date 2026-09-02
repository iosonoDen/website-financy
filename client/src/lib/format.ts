import { MESI_BREVI, MESI_LUNGHI, OGGI } from './data';

const eur = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, useGrouping: 'always' } as Intl.NumberFormatOptions);
const eur0 = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0, useGrouping: 'always' } as Intl.NumberFormatOptions);

export const euro = (n: number) => eur.format(n);
export const euroTondo = (n: number) => eur0.format(n);
export const euroSegno = (n: number) => `${n > 0 ? '+' : ''}${eur.format(n)}`;

export function dataBreve(isoData: string) {
  const d = new Date(isoData + 'T00:00:00');
  return `${d.getDate()} ${MESI_BREVI[d.getMonth()]}`;
}

export function dataLunga(isoData: string) {
  const d = new Date(isoData + 'T00:00:00');
  return `${d.getDate()} ${MESI_LUNGHI[d.getMonth()]} ${d.getFullYear()}`;
}

export function giorniDaOggi(isoData: string) {
  const d = new Date(isoData + 'T00:00:00');
  return Math.round((d.getTime() - OGGI.getTime()) / 86400000);
}

export function quandoRelativo(isoData: string) {
  const g = giorniDaOggi(isoData);
  if (g === 0) return 'oggi';
  if (g === 1) return 'domani';
  if (g === -1) return 'ieri';
  if (g > 0) return `tra ${g} giorni`;
  return `${-g} giorni fa`;
}

export const COLORI_CATEGORIA: Record<string, string> = {
  Stipendio: 'hsl(var(--chart-1))',
  Casa: 'hsl(var(--chart-2))',
  Utenze: 'hsl(var(--chart-3))',
  Assicurazioni: 'hsl(var(--chart-4))',
  Tasse: 'hsl(var(--chart-5))',
  Trasporti: 'hsl(var(--chart-2))',
  Spesa: 'hsl(var(--chart-1))',
  Ristoranti: 'hsl(var(--chart-4))',
  Abbonamenti: 'hsl(var(--chart-5))',
  Shopping: 'hsl(var(--chart-3))',
  Salute: 'hsl(var(--chart-2))',
  'Tempo libero': 'hsl(var(--chart-5))',
  Risparmio: 'hsl(var(--chart-1))',
};
