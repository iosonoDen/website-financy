import { useMemo, useState } from 'react';
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ChevronDown, Info, Wand2 } from 'lucide-react';
import { Shell } from '@/components/Shell';
import { Barra, Sigla } from '@/components/Comuni';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useStato } from '@/lib/stato';
import {
  ETICHETTA_CADENZA,
  MESI_BREVI,
  MESI_LUNGHI,
  OGGI,
  flussiMensili,
  iso,
  occorrenze,
  addMesi,
  proiezione,
  spesaVariabileMedia,
} from '@/lib/data';
import { dataBreve, dataLunga, euro, euroTondo } from '@/lib/format';

function EtichettaMese(v: string) {
  const d = new Date(v + 'T00:00:00');
  return `${MESI_BREVI[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`;
}

export default function Previsioni() {
  const { conti, ricorrenze, transazioni, impostazioni } = useStato();
  const spesaBase = useMemo(
    () => Math.round(impostazioni.spesaVariabileManuale || spesaVariabileMedia(transazioni)),
    [transazioni, impostazioni.spesaVariabileManuale],
  );

  const [meseAperto, setMeseAperto] = useState<string | null>(null);
  const [spesaVar, setSpesaVar] = useState(spesaBase);
  const [risparmioExtra, setRisparmioExtra] = useState(0);
  const [nuovaRata, setNuovaRata] = useState(0);

  const flussi = useMemo(() => flussiMensili(ricorrenze, spesaBase, 12), [ricorrenze, spesaBase]);

  const base = useMemo(
    () => proiezione(conti, ricorrenze, transazioni, { mesi: 12, spesaVariabile: spesaBase }),
    [conti, ricorrenze, transazioni, spesaBase],
  );
  const scenario = useMemo(
    () =>
      proiezione(conti, ricorrenze, transazioni, {
        mesi: 12,
        spesaVariabile: spesaVar,
        risparmioExtra,
        nuovaRata,
      }),
    [conti, ricorrenze, transazioni, spesaVar, risparmioExtra, nuovaRata],
  );

  const datiScenario = useMemo(
    () =>
      scenario.punti
        .filter((p) => p.data >= iso(OGGI))
        .map((p, i) => ({
          data: p.data,
          scenario: p.previsto,
          base: base.punti.filter((b) => b.data >= iso(OGGI))[i]?.previsto ?? null,
        })),
    [scenario, base],
  );

  const ticksScenario = datiScenario.filter((p) => p.data.endsWith('-01')).map((p) => p.data);

  const ordinate = useMemo(
    () =>
      [...ricorrenze]
        .map((r) => {
          const prossima = occorrenze(r, OGGI, addMesi(OGGI, 13))[0];
          return { r, prossima: prossima ? iso(prossima) : '' };
        })
        .sort((a, b) => a.prossima.localeCompare(b.prossima)),
    [ricorrenze],
  );

  const impattoAnnuo = (importo: number, cadenza: keyof typeof ETICHETTA_CADENZA) =>
    (importo * 12) / ({ mensile: 1, bimestrale: 2, trimestrale: 3, semestrale: 6, annuale: 12 } as const)[cadenza];

  const totaleFisseAnno = ricorrenze
    .filter((r) => r.importo < 0)
    .reduce((s, r) => s + impattoAnnuo(-r.importo, r.cadenza), 0);

  return (
    <Shell titolo="Previsioni" sottotitolo="Ricorrenze riconosciute e prospetto dei prossimi 12 mesi">
      <Tabs defaultValue="calendario">
        <TabsList className="w-full justify-start overflow-x-auto sm:w-auto">
          <TabsTrigger value="calendario" data-testid="tab-calendario">
            Calendario 12 mesi
          </TabsTrigger>
          <TabsTrigger value="ricorrenze" data-testid="tab-ricorrenze">
            Ricorrenze rilevate
          </TabsTrigger>
          <TabsTrigger value="scenari" data-testid="tab-scenari">
            Simula scenario
          </TabsTrigger>
        </TabsList>

        {/* CALENDARIO */}
        <TabsContent value="calendario" className="mt-3 space-y-3">
          <section className="rounded-xl border bg-card p-4 sm:p-5">
            <h2 className="text-sm font-semibold">Entrate e uscite mese per mese</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Uscite fisse dalle ricorrenze, spesa variabile stimata su {euroTondo(spesaBase)} al mese
            </p>
            <div className="mt-4 h-[15rem] sm:h-[17rem]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={flussi} margin={{ top: 6, right: 6, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 4" vertical={false} />
                  <XAxis
                    dataKey="etichetta"
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    stroke="hsl(var(--border))"
                    tickMargin={8}
                  />
                  <YAxis
                    tickFormatter={(v) => `${Math.round(v / 1000)}k`}
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    stroke="hsl(var(--border))"
                    width={38}
                    domain={[(min: number) => Math.min(0, min * 1.2), (max: number) => max * 1.15]}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      const p = payload[0].payload;
                      return (
                        <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-md">
                          <p className="text-xs font-medium">{label}</p>
                          <ul className="mt-1 space-y-0.5 text-xs">
                            <li className="flex gap-4">
                              <span className="text-muted-foreground">Entrate</span>
                              <span className="ml-auto num text-primary">{euro(p.entrate)}</span>
                            </li>
                            <li className="flex gap-4">
                              <span className="text-muted-foreground">Uscite fisse</span>
                              <span className="ml-auto num">{euro(-p.usciteFisse)}</span>
                            </li>
                            <li className="flex gap-4">
                              <span className="text-muted-foreground">Spesa variabile</span>
                              <span className="ml-auto num">{euro(-p.usciteVariabili)}</span>
                            </li>
                            <li className="flex gap-4 border-t border-border pt-1 font-medium">
                              <span>Netto</span>
                              <span className={`ml-auto num ${p.netto >= 0 ? 'text-primary' : 'text-destructive'}`}>
                                {euro(p.netto)}
                              </span>
                            </li>
                          </ul>
                        </div>
                      );
                    }}
                  />
                  <ReferenceLine y={0} stroke="hsl(var(--border))" />
                  <Bar dataKey="entrate" fill="hsl(var(--chart-1))" radius={[3, 3, 0, 0]} maxBarSize={18} />
                  <Bar dataKey="usciteFisse" fill="hsl(var(--chart-4))" radius={[3, 3, 0, 0]} maxBarSize={18} />
                  <Bar dataKey="usciteVariabili" fill="hsl(var(--chart-3))" radius={[3, 3, 0, 0]} maxBarSize={18} />
                  <Line
                    dataKey="netto"
                    stroke="hsl(var(--chart-2))"
                    strokeWidth={2}
                    dot={{ r: 2.5, fill: 'hsl(var(--chart-2))' }}
                    isAnimationActive={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex flex-wrap gap-4 border-t border-border pt-3 text-xs text-muted-foreground">
              {[
                ['Entrate', 'chart-1'],
                ['Uscite fisse', 'chart-4'],
                ['Spesa variabile', 'chart-3'],
                ['Netto', 'chart-2'],
              ].map(([l, c]) => (
                <span key={l} className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-sm" style={{ background: `hsl(var(--${c}))` }} />
                  {l}
                </span>
              ))}
            </div>
          </section>

          <section className="rounded-xl border bg-card">
            <div className="border-b border-border p-4 sm:px-5">
              <h2 className="text-sm font-semibold">Dettaglio scadenze</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">Apri un mese per vedere ogni movimento previsto</p>
            </div>
            <div className="hidden items-center gap-3 border-b border-border/60 px-4 py-2 text-xs text-muted-foreground sm:flex sm:px-5">
              <span className="w-4 shrink-0" />
              <span className="w-28 shrink-0">Mese</span>
              <span className="flex-1">Movimenti</span>
              <span className="ml-auto flex items-center gap-3 sm:gap-5">
                <span className="w-[4.5rem] text-right">Entrate</span>
                <span className="w-[4.5rem] text-right">Uscite fisse</span>
                <span className="w-20 text-right">Netto</span>
              </span>
            </div>
            <ul role="list">
              {flussi.map((m) => {
                const aperto = meseAperto === m.mese;
                const nome = MESI_LUNGHI[Number(m.mese.slice(5)) - 1];
                return (
                  <li key={m.mese} className="border-b border-border/60 last:border-0">
                    <button
                      onClick={() => setMeseAperto(aperto ? null : m.mese)}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-secondary/40 sm:px-5"
                      aria-expanded={aperto}
                      data-testid={`button-mese-${m.mese}`}
                    >
                      <ChevronDown
                        className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${
                          aperto ? 'rotate-180' : ''
                        }`}
                      />
                      <span className="w-24 shrink-0 text-sm capitalize sm:w-28">
                        {nome} <span className="text-muted-foreground">{m.mese.slice(2, 4)}</span>
                      </span>
                      <span className="hidden flex-1 text-xs text-muted-foreground sm:block">
                        {m.eventi.length} movimenti programmati
                      </span>
                      <span className="ml-auto flex items-center gap-3 sm:gap-5">
                        <span className="num hidden w-[4.5rem] text-right text-xs text-primary sm:inline">
                          {euro(m.entrate)}
                        </span>
                        <span className="num hidden w-[4.5rem] text-right text-xs sm:inline">
                          {euro(-m.usciteFisse)}
                        </span>
                        <span
                          className={`num w-20 text-right text-sm ${
                            m.netto >= 0 ? 'text-primary' : 'text-destructive'
                          }`}
                        >
                          {euro(m.netto)}
                        </span>
                      </span>
                    </button>
                    {aperto && (
                      <ul className="space-y-1 bg-secondary/25 px-4 pb-3 sm:px-5" role="list">
                        {m.eventi.map((e, i) => {
                          const c = conti.find((x) => x.id === e.ricorrenza.contoId);
                          return (
                            <li key={`${e.ricorrenza.id}-${i}`} className="flex items-center gap-3 py-1.5">
                              <span className="w-14 shrink-0 text-xs text-muted-foreground num">
                                {dataBreve(e.data)}
                              </span>
                              {c && <Sigla sigla={c.sigla} hue={c.hue} className="h-6 w-6 text-[0.5625rem]" />}
                              <span className="min-w-0 flex-1 truncate text-sm">{e.ricorrenza.nome}</span>
                              <span
                                className={`num text-sm ${e.ricorrenza.importo > 0 ? 'text-primary' : ''}`}
                              >
                                {euro(e.ricorrenza.importo)}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        </TabsContent>

        {/* RICORRENZE */}
        <TabsContent value="ricorrenze" className="mt-3 space-y-3">
          <section className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border bg-card p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Ricorrenze attive</p>
              <p className="mt-2 text-lg font-semibold num">{ricorrenze.length}</p>
            </div>
            <div className="rounded-xl border bg-card p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Uscite fisse su 12 mesi</p>
              <p className="mt-2 text-lg font-semibold num">{euroTondo(totaleFisseAnno)}</p>
            </div>
            <div className="rounded-xl border bg-card p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Rilevate automaticamente</p>
              <p className="mt-2 text-lg font-semibold num">
                {ricorrenze.filter((r) => r.rilevataAuto).length} su {ricorrenze.length}
              </p>
            </div>
          </section>

          <section className="overflow-hidden rounded-xl border bg-card">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[44rem] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="px-4 py-2.5 font-medium">Voce</th>
                    <th className="px-4 py-2.5 font-medium">Cadenza</th>
                    <th className="px-4 py-2.5 font-medium">Prossima</th>
                    <th className="px-4 py-2.5 font-medium">Conto</th>
                    <th className="px-4 py-2.5 font-medium">Affidabilità</th>
                    <th className="px-4 py-2.5 text-right font-medium">Importo</th>
                    <th className="px-4 py-2.5 text-right font-medium">Su 12 mesi</th>
                  </tr>
                </thead>
                <tbody>
                  {ordinate.map(({ r, prossima }) => {
                    const c = conti.find((x) => x.id === r.contoId);
                    return (
                      <tr
                        key={r.id}
                        className="border-b border-border/60 last:border-0 hover:bg-secondary/40"
                        data-testid={`riga-ricorrenza-${r.id}`}
                      >
                        <td className="px-4 py-3">
                          <span className="flex items-center gap-2">
                            <span className="font-medium">{r.nome}</span>
                            {r.nuova && (
                              <span className="rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-[0.6875rem] text-primary">
                                nuova
                              </span>
                            )}
                          </span>
                          <span className="text-xs text-muted-foreground">{r.categoria}</span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">
                          {ETICHETTA_CADENZA[r.cadenza]}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-xs num">{dataLunga(prossima)}</td>
                        <td className="px-4 py-3">
                          <span className="flex items-center gap-2 text-xs text-muted-foreground">
                            {c && <Sigla sigla={c.sigla} hue={c.hue} className="h-6 w-6 text-[0.5625rem]" />}
                            {c?.banca}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="flex items-center gap-2">
                            <span className="w-16">
                              <Barra
                                valore={r.affidabilita}
                                hue={r.affidabilita > 0.95 ? 164 : r.affidabilita > 0.88 ? 38 : 10}
                              />
                            </span>
                            <span className="text-xs text-muted-foreground num">
                              {Math.round(r.affidabilita * 100)}%
                            </span>
                          </span>
                        </td>
                        <td
                          className={`whitespace-nowrap px-4 py-3 text-right num ${
                            r.importo > 0 ? 'text-primary' : ''
                          }`}
                        >
                          {euro(r.importo)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right text-xs text-muted-foreground num">
                          {euroTondo(impattoAnnuo(r.importo, r.cadenza))}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <p className="flex items-start gap-2 px-1 text-xs text-muted-foreground">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            L'affidabilità indica quanto il pattern è regolare nello storico: sotto l'88% Financy chiede una
            conferma prima di usare la voce nelle previsioni.
          </p>
        </TabsContent>

        {/* SCENARI */}
        <TabsContent value="scenari" className="mt-3 grid gap-3 lg:grid-cols-3">
          <section className="rounded-xl border bg-card p-4 sm:p-5">
            <div className="flex items-center gap-2">
              <Wand2 className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold">Simula uno scenario</h2>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Muovi i parametri: la previsione si ricalcola sulle tue ricorrenze reali.
            </p>

            <div className="mt-6 space-y-7">
              {[
                {
                  id: 'spesa',
                  etichetta: 'Spesa variabile mensile',
                  valore: spesaVar,
                  set: setSpesaVar,
                  max: 2200,
                  passo: 25,
                  nota: `media attuale ${euroTondo(spesaBase)}`,
                },
                {
                  id: 'risparmio',
                  etichetta: 'Accantonamento extra',
                  valore: risparmioExtra,
                  set: setRisparmioExtra,
                  max: 600,
                  passo: 25,
                  nota: 'spostato ogni mese su un conto deposito',
                },
                {
                  id: 'rata',
                  etichetta: 'Nuova rata mensile',
                  valore: nuovaRata,
                  set: setNuovaRata,
                  max: 900,
                  passo: 25,
                  nota: 'es. finanziamento auto o prestito',
                },
              ].map((s) => (
                <div key={s.id}>
                  <div className="flex items-baseline justify-between gap-2">
                    <label className="text-xs font-medium" htmlFor={`slider-${s.id}`}>
                      {s.etichetta}
                    </label>
                    <span className="text-sm num">{euroTondo(s.valore)}</span>
                  </div>
                  <Slider
                    id={`slider-${s.id}`}
                    className="mt-3"
                    value={[s.valore]}
                    max={s.max}
                    step={s.passo}
                    onValueChange={([v]) => s.set(v)}
                    data-testid={`slider-${s.id}`}
                  />
                  <p className="mt-1.5 text-xs text-muted-foreground">{s.nota}</p>
                </div>
              ))}
            </div>

            <button
              className="mt-7 w-full rounded-lg border border-border py-2 text-xs text-muted-foreground hover:bg-secondary/60"
              onClick={() => {
                setSpesaVar(spesaBase);
                setRisparmioExtra(0);
                setNuovaRata(0);
              }}
              data-testid="button-reset-scenario"
            >
              Ripristina i valori attuali
            </button>
          </section>

          <section className="rounded-xl border bg-card p-4 sm:p-5 lg:col-span-2">
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Saldo tra 12 mesi</p>
                <p className="mt-1.5 text-lg font-semibold num">{euro(scenario.saldoFinale)}</p>
                <p className="text-xs text-muted-foreground num">
                  {scenario.saldoFinale - base.saldoFinale >= 0 ? '+' : ''}
                  {euro(scenario.saldoFinale - base.saldoFinale)} vs scenario attuale
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Minimo previsto</p>
                <p
                  className={`mt-1.5 text-lg font-semibold num ${
                    scenario.minimo.valore < 1000 ? 'text-destructive' : ''
                  }`}
                >
                  {euro(scenario.minimo.valore)}
                </p>
                <p className="text-xs text-muted-foreground">{dataLunga(scenario.minimo.data)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Netto mensile</p>
                <p
                  className={`mt-1.5 text-lg font-semibold num ${
                    scenario.nettoMensile >= 0 ? 'text-primary' : 'text-destructive'
                  }`}
                >
                  {euro(scenario.nettoMensile)}
                </p>
                <p className="text-xs text-muted-foreground">media sui 12 mesi</p>
              </div>
            </div>

            <div className="mt-5 h-[16rem] sm:h-[19rem]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={datiScenario} margin={{ top: 6, right: 6, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gScenario" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--chart-1))" stopOpacity={0.26} />
                      <stop offset="100%" stopColor="hsl(var(--chart-1))" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 4" vertical={false} />
                  <XAxis
                    dataKey="data"
                    ticks={ticksScenario}
                    tickFormatter={EtichettaMese}
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    stroke="hsl(var(--border))"
                    tickMargin={8}
                  />
                  <YAxis
                    tickFormatter={(v) => `${Math.round(v / 1000)}k`}
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    stroke="hsl(var(--border))"
                    width={38}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      const p = payload[0].payload;
                      return (
                        <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-md">
                          <p className="text-xs text-muted-foreground">{dataLunga(String(label))}</p>
                          <p className="mt-0.5 text-sm font-semibold num">{euro(p.scenario ?? 0)}</p>
                          <p className="text-xs text-muted-foreground num">
                            attuale {euro(p.base ?? 0)}
                          </p>
                        </div>
                      );
                    }}
                  />
                  <ReferenceLine y={0} stroke="hsl(var(--destructive))" strokeDasharray="3 3" />
                  <Area
                    dataKey="base"
                    stroke="hsl(var(--muted-foreground))"
                    strokeWidth={1.4}
                    strokeDasharray="4 4"
                    fill="none"
                    dot={false}
                    isAnimationActive={false}
                  />
                  <Area
                    dataKey="scenario"
                    stroke="hsl(var(--chart-1))"
                    strokeWidth={2.2}
                    fill="url(#gScenario)"
                    dot={false}
                    isAnimationActive={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex flex-wrap gap-4 border-t border-border pt-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="h-0.5 w-4 rounded bg-[hsl(var(--chart-1))]" /> Scenario simulato
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-0.5 w-4 rounded bg-muted-foreground" /> Traiettoria attuale
              </span>
            </div>
          </section>
        </TabsContent>
      </Tabs>
    </Shell>
  );
}
