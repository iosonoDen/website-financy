import { Link } from 'wouter';
import {
  Area,
  CartesianGrid,
  ComposedChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ArrowUpRight, CalendarClock, Sparkles, TrendingDown, TrendingUp } from 'lucide-react';
import { Barra, CartaKpi, Sigla, TargaCategoria } from '@/components/Comuni';
import { cn } from '@/lib/utils';
import { MESI_BREVI, OGGI, iso, type Conto, type Ricorrenza, type Transazione } from '@/lib/data';
import { dataBreve, dataLunga, euro, euroTondo, quandoRelativo } from '@/lib/format';
import { ALTEZZA_CONTENUTO } from './Griglia';
import type { Widget } from '@/lib/widget';

export interface DatiPanoramica {
  conti: Conto[];
  ricorrenze: Ricorrenza[];
  transazioni: Transazione[];
  prev: {
    punti: { data: string; storico?: number | null; previsto?: number | null; eventi?: unknown[] }[];
    minimo: { data: string; valore: number };
    nettoMensile: number;
    saldoFinale: number;
  };
  orizzonte: 6 | 12;
  setOrizzonte: (m: 6 | 12) => void;
  patrimonioTotale: number;
  liquiditaOggi: number;
  uscite30: number;
  entrate30: number;
  scadenze30: { data: string; ricorrenza: Ricorrenza }[];
  fineMese: string;
  saldoFineMese: number;
  spesaVar: number;
  categorie: { categoria: string; totale: number }[];
  ultime: Transazione[];
  nuoveRicorrenze: Ricorrenza[];
}

function Riquadro({
  titolo,
  sottotitolo,
  azione,
  children,
  className,
}: {
  titolo: string;
  sottotitolo?: string;
  azione?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('flex h-full flex-col rounded-xl border bg-card p-4 sm:p-5', className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold">{titolo}</h2>
          {sottotitolo && <p className="mt-0.5 text-xs text-muted-foreground">{sottotitolo}</p>}
        </div>
        {azione}
      </div>
      <div className="mt-3 min-w-0 flex-1">{children}</div>
    </section>
  );
}

function Fila({ orizzontale, children }: { orizzontale: boolean; children: React.ReactNode }) {
  if (orizzontale) {
    return (
      <ul
        className="flex snap-x gap-2 overflow-x-auto pb-1 [&>li]:w-[15rem] [&>li]:shrink-0 [&>li]:snap-start [&>li]:rounded-lg [&>li]:border [&>li]:border-border [&>li]:p-3"
        role="list"
      >
        {children}
      </ul>
    );
  }
  return (
    <ul className="divide-y divide-border" role="list">
      {children}
    </ul>
  );
}

export function ContenutoWidget({ w, d }: { w: Widget; d: DatiPanoramica }) {
  const contoDi = (id: string) => d.conti.find((c) => c.id === id);
  const orizzontale = w.orientamento === 'orizzontale';

  switch (w.tipo) {
    case 'kpi-patrimonio':
      return (
        <CartaKpi
          etichetta="Patrimonio totale"
          valore={euro(d.patrimonioTotale)}
          nota="liquidità + investimenti"
        />
      );

    case 'kpi-liquidita':
      return (
        <CartaKpi
          etichetta="Liquidità disponibile"
          valore={euro(d.liquiditaOggi)}
          nota={`su ${d.conti.filter((c) => c.tipo !== 'investimento').length} conti e carte`}
        />
      );

    case 'kpi-uscite':
      return (
        <CartaKpi
          etichetta="Uscite già programmate · 30 gg"
          valore={euro(-d.uscite30)}
          nota={`${d.scadenze30.filter((s) => s.ricorrenza.importo < 0).length} scadenze certe`}
        />
      );

    case 'kpi-previsto':
      return (
        <CartaKpi
          accento
          etichetta={`Saldo previsto al ${dataBreve(d.fineMese)}`}
          valore={euro(d.saldoFineMese)}
          nota={`${d.saldoFineMese >= d.liquiditaOggi ? '+' : ''}${euro(
            d.saldoFineMese - d.liquiditaOggi,
          )} vs oggi`}
        />
      );

    case 'kpi-risparmio':
      return (
        <CartaKpi
          etichetta="Risparmio medio mensile"
          valore={`${euro(d.prev.nettoMensile)} / mese`}
          nota={`inclusi ${euroTondo(d.spesaVar)} di spesa variabile`}
          extra={
            d.prev.nettoMensile >= 0 ? (
              <TrendingUp className="h-4 w-4 text-primary" />
            ) : (
              <TrendingDown className="h-4 w-4 text-destructive" />
            )
          }
        />
      );

    case 'kpi-minimo':
      return (
        <CartaKpi
          etichetta="Minimo di liquidità previsto"
          valore={euro(d.prev.minimo.valore)}
          nota={`${dataLunga(d.prev.minimo.data)} · ${quandoRelativo(d.prev.minimo.data)}`}
        />
      );

    case 'previsione':
      return (
        <section className="h-full rounded-xl border border-primary/25 bg-primary/[0.05] p-4 sm:p-5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">Cosa succede nei prossimi {d.orizzonte} mesi</h2>
          </div>
          <div className={cn('mt-3 grid gap-3', orizzontale ? 'sm:grid-cols-3' : 'grid-cols-1')}>
            <div className="rounded-lg border border-border bg-card p-3.5">
              <p className="text-xs text-muted-foreground">Minimo di liquidità previsto</p>
              <p className="mt-1 num text-sm font-semibold">{euro(d.prev.minimo.valore)}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                il {dataLunga(d.prev.minimo.data)} ({quandoRelativo(d.prev.minimo.data)})
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card p-3.5">
              <p className="text-xs text-muted-foreground">Risparmio medio reale</p>
              <p
                className={cn(
                  'mt-1 flex items-center gap-1.5 num text-sm font-semibold',
                  d.prev.nettoMensile >= 0 ? 'text-primary' : 'text-destructive',
                )}
              >
                {d.prev.nettoMensile >= 0 ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                {euro(d.prev.nettoMensile)} / mese
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                entrate meno uscite fisse e {euroTondo(d.spesaVar)} di spesa variabile
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card p-3.5">
              <p className="text-xs text-muted-foreground">Nuova ricorrenza rilevata</p>
              {d.nuoveRicorrenze.length ? (
                <>
                  <p className="mt-1 text-sm font-semibold">{d.nuoveRicorrenze[0].nome}</p>
                  <p className="mt-0.5 num text-xs text-muted-foreground">
                    {euro(d.nuoveRicorrenze[0].importo)} · ogni mese · affidabilità{' '}
                    {Math.round(d.nuoveRicorrenze[0].affidabilita * 100)}%
                  </p>
                </>
              ) : (
                <p className="mt-1 text-sm text-muted-foreground">Nessuna novità</p>
              )}
            </div>
          </div>
        </section>
      );

    case 'grafico':
      return (
        <Riquadro
          titolo="Proiezione della liquidità"
          sottotitolo="Storico 120 giorni, poi previsione da ricorrenze e spesa media"
          azione={
            <div className="flex rounded-lg border border-border p-0.5">
              {([6, 12] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => d.setOrizzonte(m)}
                  data-testid={`button-orizzonte-${m}`}
                  className={cn(
                    'rounded-md px-2.5 py-1 text-xs transition-colors',
                    d.orizzonte === m
                      ? 'bg-secondary font-medium'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {m} mesi
                </button>
              ))}
            </div>
          }
        >
          <div className={ALTEZZA_CONTENUTO[w.altezza]}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={d.prev.punti} margin={{ top: 6, right: 6, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gStorico" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--chart-1))" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="hsl(var(--chart-1))" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="gPrev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--chart-2))" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="hsl(var(--chart-2))" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 4" vertical={false} />
                <XAxis
                  dataKey="data"
                  ticks={d.prev.punti.filter((p) => p.data.endsWith('-01')).map((p) => p.data)}
                  tickFormatter={(v: string) => {
                    const dt = new Date(v + 'T00:00:00');
                    return `${MESI_BREVI[dt.getMonth()]} ${String(dt.getFullYear()).slice(2)}`;
                  }}
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  stroke="hsl(var(--border))"
                  tickMargin={8}
                />
                <YAxis
                  tickFormatter={(v) => `${Math.round(Number(v) / 1000)}k`}
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  stroke="hsl(var(--border))"
                  width={38}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    const p = payload[0].payload;
                    const valore = p.storico ?? p.previsto;
                    return (
                      <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-md">
                        <p className="text-xs text-muted-foreground">{dataLunga(String(label))}</p>
                        <p className="mt-0.5 num text-sm font-semibold">{euro(valore ?? 0)}</p>
                        {p.storico == null && <p className="text-xs text-muted-foreground">previsione</p>}
                        {p.eventi?.length > 0 && (
                          <ul className="mt-1.5 space-y-0.5 border-t border-border pt-1.5">
                            {p.eventi.map((e: { nome: string; importo: number }) => (
                              <li key={e.nome} className="flex gap-3 text-xs">
                                <span className="text-muted-foreground">{e.nome}</span>
                                <span
                                  className={cn('ml-auto num', e.importo > 0 && 'text-primary')}
                                >
                                  {euro(e.importo)}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    );
                  }}
                />
                <ReferenceLine
                  x={iso(OGGI)}
                  stroke="hsl(var(--muted-foreground))"
                  strokeDasharray="2 4"
                  label={{
                    value: 'oggi',
                    position: 'insideTopRight',
                    fontSize: 10,
                    fill: 'hsl(var(--muted-foreground))',
                  }}
                />
                <Area
                  dataKey="storico"
                  stroke="hsl(var(--chart-1))"
                  strokeWidth={2}
                  fill="url(#gStorico)"
                  dot={false}
                  isAnimationActive={false}
                  connectNulls={false}
                />
                <Area
                  dataKey="previsto"
                  stroke="hsl(var(--chart-2))"
                  strokeWidth={2}
                  strokeDasharray="5 4"
                  fill="url(#gPrev)"
                  dot={false}
                  isAnimationActive={false}
                  connectNulls={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-4 border-t border-border pt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-0.5 w-4 rounded bg-[hsl(var(--chart-1))]" /> Storico
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-0.5 w-4 rounded bg-[hsl(var(--chart-2))]" style={{ opacity: 0.8 }} />{' '}
              Previsione
            </span>
            <span className="ml-auto num">
              Saldo atteso tra {d.orizzonte} mesi:{' '}
              <span className="font-medium text-foreground">{euro(d.prev.saldoFinale)}</span>
            </span>
          </div>
        </Riquadro>
      );

    case 'scadenze':
      return (
        <Riquadro
          titolo="Prossime scadenze"
          sottotitolo={`${euro(d.entrate30)} in entrata · ${euro(-d.uscite30)} in uscita`}
          azione={
            <Link href="/previsioni" className="text-xs text-primary hover:underline">
              Tutte
            </Link>
          }
        >
          <Fila orizzontale={orizzontale}>
            {d.scadenze30.slice(0, w.limite).map((s, i) => {
              const c = contoDi(s.ricorrenza.contoId);
              return (
                <li
                  key={`${s.ricorrenza.id}-${i}`}
                  className={cn('flex items-center gap-3', !orizzontale && 'py-2.5')}
                >
                  <div className="flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-lg border border-border bg-secondary/50">
                    <span className="num text-[0.6875rem] font-semibold leading-none">
                      {new Date(s.data + 'T00:00:00').getDate()}
                    </span>
                    <span className="text-[0.625rem] leading-none text-muted-foreground">
                      {MESI_BREVI[new Date(s.data + 'T00:00:00').getMonth()]}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{s.ricorrenza.nome}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {c?.banca} · {quandoRelativo(s.data)}
                    </p>
                  </div>
                  <span
                    className={cn(
                      'shrink-0 num text-sm',
                      s.ricorrenza.importo > 0 ? 'text-primary' : 'text-foreground',
                    )}
                  >
                    {euro(s.ricorrenza.importo)}
                  </span>
                </li>
              );
            })}
          </Fila>
        </Riquadro>
      );

    case 'conti':
      return (
        <Riquadro
          titolo="Conti collegati"
          azione={
            <Link href="/conti" className="text-xs text-primary hover:underline">
              Gestisci
            </Link>
          }
        >
          {orizzontale ? (
            <Fila orizzontale>
              {d.conti.slice(0, w.limite).map((c) => (
                <li key={c.id} className="flex items-center gap-3" data-testid={`card-conto-${c.id}`}>
                  <Sigla sigla={c.sigla} hue={c.hue} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{c.banca}</p>
                    <p className="truncate text-xs text-muted-foreground">{c.nome}</p>
                  </div>
                  <p className={cn('num text-sm', c.saldo < 0 && 'text-destructive')}>{euro(c.saldo)}</p>
                </li>
              ))}
            </Fila>
          ) : (
            <ul
              className={cn('grid gap-2', w.larghezza >= 8 ? 'sm:grid-cols-2' : 'grid-cols-1')}
              role="list"
            >
              {d.conti.slice(0, w.limite).map((c) => (
                <li
                  key={c.id}
                  className="flex items-center gap-3 rounded-lg border border-border p-3"
                  data-testid={`card-conto-${c.id}`}
                >
                  <Sigla sigla={c.sigla} hue={c.hue} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{c.banca}</p>
                    <p className="truncate text-xs text-muted-foreground">{c.nome}</p>
                  </div>
                  <div className="text-right">
                    <p className={cn('num text-sm', c.saldo < 0 && 'text-destructive')}>{euro(c.saldo)}</p>
                    <p className="text-xs text-muted-foreground">{c.sincronizzato} fa</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Riquadro>
      );

    case 'categorie': {
      const max = d.categorie[0]?.totale ?? 1;
      return (
        <Riquadro titolo="Uscite per categoria" sottotitolo="Ultimi 30 giorni, tutti i conti">
          <ul className="space-y-3" role="list">
            {d.categorie.slice(0, w.limite).map((c, i) => (
              <li key={c.categoria}>
                <div className="flex items-baseline justify-between gap-2 text-xs">
                  <span className="truncate">{c.categoria}</span>
                  <span className="num text-muted-foreground">{euroTondo(c.totale)}</span>
                </div>
                <div className="mt-1.5">
                  <Barra valore={c.totale / max} hue={[164, 200, 35, 12, 265, 145][i % 6]} />
                </div>
              </li>
            ))}
          </ul>
        </Riquadro>
      );
    }

    case 'transazioni':
      return (
        <Riquadro
          titolo="Ultime transazioni"
          azione={
            <Link
              href="/transazioni"
              className="flex items-center gap-1 text-xs text-primary hover:underline"
            >
              Vedi tutte <ArrowUpRight className="h-3 w-3" />
            </Link>
          }
        >
          <Fila orizzontale={orizzontale}>
            {d.ultime.slice(0, w.limite).map((t) => {
              const c = contoDi(t.contoId);
              return (
                <li key={t.id} className={cn('flex items-center gap-3', !orizzontale && 'py-2.5')}>
                  {c && <Sigla sigla={c.sigla} hue={c.hue} className="h-8 w-8" />}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{t.descrizione}</p>
                    <p className="text-xs text-muted-foreground">
                      {dataBreve(t.data)} · {c?.banca}
                    </p>
                  </div>
                  {!orizzontale && t.ricorrenzaId && (
                    <span className="hidden items-center gap-1 text-xs text-muted-foreground sm:inline-flex">
                      <CalendarClock className="h-3.5 w-3.5" /> ricorrente
                    </span>
                  )}
                  {!orizzontale && w.larghezza >= 8 && (
                    <div className="hidden sm:block">
                      <TargaCategoria categoria={t.categoria} />
                    </div>
                  )}
                  <span className={cn('shrink-0 num text-sm', t.importo > 0 && 'text-primary')}>
                    {euro(t.importo)}
                  </span>
                </li>
              );
            })}
          </Fila>
        </Riquadro>
      );

    case 'ricorrenze-nuove':
      return (
        <Riquadro
          titolo="Ricorrenze rilevate"
          sottotitolo="Riconosciute automaticamente dalle transazioni"
        >
          {d.nuoveRicorrenze.length ? (
            <Fila orizzontale={orizzontale}>
              {d.nuoveRicorrenze.slice(0, w.limite).map((r) => (
                <li key={r.id} className={cn('flex items-center gap-3', !orizzontale && 'py-2.5')}>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Sparkles className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{r.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      affidabilità {Math.round(r.affidabilita * 100)}%
                    </p>
                  </div>
                  <span className="shrink-0 num text-sm">{euro(r.importo)}</span>
                </li>
              ))}
            </Fila>
          ) : (
            <p className="text-sm text-muted-foreground">
              Nessuna nuova ricorrenza negli ultimi movimenti.
            </p>
          )}
        </Riquadro>
      );

    case 'salute': {
      const copertura = d.uscite30 > 0 ? Math.min(1, d.liquiditaOggi / d.uscite30 / 3) : 1;
      const risparmio = Math.max(0, Math.min(1, d.prev.nettoMensile / 800));
      const stabilita = Math.max(0, Math.min(1, d.prev.minimo.valore / Math.max(1, d.liquiditaOggi)));
      const punteggio = Math.round(((copertura + risparmio + stabilita) / 3) * 100);
      const voci = [
        { nome: 'Copertura delle uscite', v: copertura, hue: 164 },
        { nome: 'Capacità di risparmio', v: risparmio, hue: 200 },
        { nome: 'Stabilità della liquidità', v: stabilita, hue: 265 },
      ];
      return (
        <Riquadro titolo="Salute finanziaria" sottotitolo="Indice calcolato su conti e proiezione">
          <div className="flex items-baseline gap-2">
            <p className="num text-2xl font-semibold leading-none">{punteggio}</p>
            <p className="text-xs text-muted-foreground">/ 100</p>
          </div>
          <ul className="mt-4 space-y-3" role="list">
            {voci.map((x) => (
              <li key={x.nome}>
                <div className="flex items-baseline justify-between gap-2 text-xs">
                  <span className="truncate">{x.nome}</span>
                  <span className="num text-muted-foreground">{Math.round(x.v * 100)}%</span>
                </div>
                <div className="mt-1.5">
                  <Barra valore={x.v} hue={x.hue} />
                </div>
              </li>
            ))}
          </ul>
        </Riquadro>
      );
    }

    default:
      return null;
  }
}
