import { useMemo, useState } from 'react';
import { CalendarClock, Download, Search } from 'lucide-react';
import { Shell } from '@/components/Shell';
import { Sigla, TargaCategoria } from '@/components/Comuni';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useStato } from '@/lib/stato';
import { MESI_LUNGHI, OGGI, iso } from '@/lib/data';
import { dataBreve, euro, euroSegno } from '@/lib/format';

export default function Transazioni() {
  const { conti, transazioni } = useStato();
  const [testo, setTesto] = useState('');
  const [conto, setConto] = useState('tutti');
  const [categoria, setCategoria] = useState('tutte');
  const [mese, setMese] = useState('tutti');
  const [soloRicorrenti, setSoloRicorrenti] = useState(false);

  const passate = useMemo(() => transazioni.filter((t) => t.data <= iso(OGGI)), [transazioni]);

  const categorie = useMemo(
    () => Array.from(new Set(passate.map((t) => t.categoria))).sort(),
    [passate],
  );
  const mesi = useMemo(
    () => Array.from(new Set(passate.map((t) => t.data.slice(0, 7)))).sort().reverse(),
    [passate],
  );

  const filtrate = useMemo(
    () =>
      passate.filter(
        (t) =>
          (conto === 'tutti' || t.contoId === conto) &&
          (categoria === 'tutte' || t.categoria === categoria) &&
          (mese === 'tutti' || t.data.startsWith(mese)) &&
          (!soloRicorrenti || !!t.ricorrenzaId) &&
          (testo.trim() === '' || t.descrizione.toLowerCase().includes(testo.trim().toLowerCase())),
      ),
    [passate, conto, categoria, mese, soloRicorrenti, testo],
  );

  const entrate = filtrate.filter((t) => t.importo > 0).reduce((s, t) => s + t.importo, 0);
  const uscite = filtrate.filter((t) => t.importo < 0).reduce((s, t) => s + t.importo, 0);
  const contoDi = (id: string) => conti.find((c) => c.id === id);
  const etichettaMese = (m: string) => `${MESI_LUNGHI[Number(m.slice(5)) - 1]} ${m.slice(0, 4)}`;

  return (
    <Shell
      titolo="Transazioni"
      sottotitolo="Movimenti di tutti i conti, categorizzati automaticamente"
      azioni={
        <Button size="sm" variant="outline" className="gap-1.5 text-xs" data-testid="button-esporta">
          <Download className="h-3.5 w-3.5" />
          CSV
        </Button>
      }
    >
      {/* Filtri */}
      <section className="rounded-xl border bg-card p-3 sm:p-4">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative sm:col-span-2 lg:col-span-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cerca descrizione"
              className="pl-9"
              value={testo}
              onChange={(e) => setTesto(e.target.value)}
              data-testid="input-cerca-transazioni"
            />
          </div>
          <Select value={conto} onValueChange={setConto}>
            <SelectTrigger data-testid="select-conto">
              <SelectValue placeholder="Conto" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tutti">Tutti i conti</SelectItem>
              {conti.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.banca}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={categoria} onValueChange={setCategoria}>
            <SelectTrigger data-testid="select-categoria">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tutte">Tutte le categorie</SelectItem>
              {categorie.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={mese} onValueChange={setMese}>
            <SelectTrigger data-testid="select-mese">
              <SelectValue placeholder="Periodo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tutti">Tutto il periodo</SelectItem>
              {mesi.map((m) => (
                <SelectItem key={m} value={m}>
                  {etichettaMese(m)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-border pt-3">
          <button
            onClick={() => setSoloRicorrenti((v) => !v)}
            data-testid="button-solo-ricorrenti"
            aria-pressed={soloRicorrenti}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors ${
              soloRicorrenti
                ? 'border-primary/40 bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:bg-secondary/60'
            }`}
          >
            <CalendarClock className="h-3.5 w-3.5" />
            Solo ricorrenti
          </button>
          <span className="text-xs text-muted-foreground num">{filtrate.length} movimenti</span>
          <div className="ml-auto flex gap-4 text-xs">
            <span>
              Entrate <span className="num text-primary">{euroSegno(entrate)}</span>
            </span>
            <span>
              Uscite <span className="num">{euro(uscite)}</span>
            </span>
            <span className="font-medium text-foreground">
              Saldo <span className="num">{euro(entrate + uscite)}</span>
            </span>
          </div>
        </div>
      </section>

      {/* Tabella */}
      <section className="mt-3 overflow-hidden rounded-xl border bg-card">
        <div className="max-h-[34rem] overflow-y-auto [overscroll-behavior:contain]">
          <table className="w-full table-fixed text-sm">
            <thead className="sticky top-0 z-10 bg-card/95 backdrop-blur">
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="w-[4.25rem] px-3 py-2.5 font-medium sm:w-20 sm:px-4">Data</th>
                <th className="px-1 py-2.5 font-medium sm:px-4">Descrizione</th>
                <th className="hidden w-36 px-4 py-2.5 font-medium sm:table-cell">Categoria</th>
                <th className="hidden w-44 px-4 py-2.5 font-medium md:table-cell">Conto</th>
                <th className="w-[6.75rem] px-3 py-2.5 text-right font-medium sm:w-32 sm:px-4">Importo</th>
              </tr>
            </thead>
            <tbody>
              {filtrate.slice(0, 120).map((t) => {
                const c = contoDi(t.contoId);
                return (
                  <tr
                    key={t.id}
                    className="border-b border-border/60 last:border-0 hover:bg-secondary/40"
                    data-testid={`riga-transazione-${t.id}`}
                  >
                    <td className="whitespace-nowrap px-3 py-2.5 text-xs text-muted-foreground num sm:px-4">
                      {dataBreve(t.data)}
                    </td>
                    <td className="px-1 py-2.5 sm:px-4">
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="truncate">{t.descrizione}</span>
                        {t.ricorrenzaId && (
                          <CalendarClock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-label="ricorrente" />
                        )}
                      </span>
                    </td>
                    <td className="hidden px-4 py-2.5 sm:table-cell">
                      <TargaCategoria categoria={t.categoria} />
                    </td>
                    <td className="hidden px-4 py-2.5 md:table-cell">
                      <span className="flex items-center gap-2 text-xs text-muted-foreground">
                        {c && <Sigla sigla={c.sigla} hue={c.hue} className="h-6 w-6 text-[0.5625rem]" />}
                        <span className="truncate">{c?.banca}</span>
                      </span>
                    </td>
                    <td
                      className={`whitespace-nowrap px-3 py-2.5 text-right num sm:px-4 ${
                        t.importo > 0 ? 'text-primary' : ''
                      }`}
                    >
                      {euro(t.importo)}
                    </td>
                  </tr>
                );
              })}
              {!filtrate.length && (
                <tr>
                  <td colSpan={5} className="px-4 py-16 text-center">
                    <p className="text-sm font-medium">Nessun movimento</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Prova a rimuovere un filtro o ad ampliare il periodo.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {filtrate.length > 120 && (
          <div className="border-t border-border px-4 py-2.5 text-center text-xs text-muted-foreground">
            Mostrati i primi 120 movimenti su {filtrate.length}
          </div>
        )}
      </section>
    </Shell>
  );
}
