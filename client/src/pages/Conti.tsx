import { useMemo, useState } from 'react';
import { Check, Loader2, Plus, RefreshCw, Search, ShieldCheck, Trash2 } from 'lucide-react';
import { Shell } from '@/components/Shell';
import { Barra, Sigla } from '@/components/Comuni';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useStato } from '@/lib/stato';
import { BANCHE_DISPONIBILI, OGGI, iso, liquidi, patrimonio, type Conto } from '@/lib/data';
import { euro } from '@/lib/format';

const ETICHETTA_TIPO: Record<Conto['tipo'], string> = {
  corrente: 'Conto corrente',
  prepagata: 'Carta prepagata',
  carta: 'Carta di credito',
  investimento: 'Investimenti',
};

type Fase = 'scelta' | 'consenso' | 'sincronizzazione' | 'fatto';

function ModaleCollega() {
  const { conti, aggiungiConto, impostazioni } = useStato();
  const [aperto, setAperto] = useState(false);
  const [fase, setFase] = useState<Fase>('scelta');
  const [ricerca, setRicerca] = useState('');
  const [banca, setBanca] = useState<(typeof BANCHE_DISPONIBILI)[number] | null>(null);

  const risultati = useMemo(
    () =>
      BANCHE_DISPONIBILI.filter(
        (b) =>
          b.nome.toLowerCase().includes(ricerca.toLowerCase()) &&
          !conti.some((c) => c.banca === b.nome),
      ),
    [ricerca, conti],
  );

  function reset() {
    setFase('scelta');
    setBanca(null);
    setRicerca('');
  }

  function scegli(b: (typeof BANCHE_DISPONIBILI)[number]) {
    setBanca(b);
    setFase('consenso');
  }

  function autorizza() {
    setFase('sincronizzazione');
    setTimeout(() => {
      if (banca) {
        aggiungiConto({
          id: banca.sigla.toLowerCase(),
          banca: banca.nome,
          nome: 'Conto corrente',
          tipo: 'corrente',
          iban: 'IT•• •••• •••• •••• •••• 0 000',
          saldo: 1370.6,
          hue: banca.hue,
          sigla: banca.sigla,
          sincronizzato: 'adesso',
          consensoGiorni: impostazioni.giorniConsenso,
        });
      }
      setFase('fatto');
    }, 1400);
  }

  return (
    <Dialog
      open={aperto}
      onOpenChange={(v) => {
        setAperto(v);
        if (!v) setTimeout(reset, 200);
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5" data-testid="button-collega-conto">
          <Plus className="h-4 w-4" />
          Collega conto
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        {fase === 'scelta' && (
          <>
            <DialogHeader>
              <DialogTitle className="text-base">Collega un conto</DialogTitle>
              <DialogDescription className="text-xs">
                Scegli la banca: verrai portato sul suo sito per autorizzare la sola lettura dei dati.
              </DialogDescription>
            </DialogHeader>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cerca fra 240 istituti italiani"
                className="pl-9"
                value={ricerca}
                onChange={(e) => setRicerca(e.target.value)}
                data-testid="input-cerca-banca"
              />
            </div>
            <ul className="max-h-64 space-y-1 overflow-y-auto [overscroll-behavior:contain]" role="list">
              {risultati.map((b) => (
                <li key={b.nome}>
                  <button
                    onClick={() => scegli(b)}
                    data-testid={`button-banca-${b.sigla}`}
                    className="flex w-full items-center gap-3 rounded-lg border border-transparent p-2 text-left hover:border-border hover:bg-secondary/60"
                  >
                    <Sigla sigla={b.sigla} hue={b.hue} className="h-8 w-8" />
                    <span className="flex-1 text-sm">{b.nome}</span>
                    <Plus className="h-4 w-4 text-muted-foreground" />
                  </button>
                </li>
              ))}
              {!risultati.length && (
                <li className="py-6 text-center text-xs text-muted-foreground">
                  Nessun istituto trovato per «{ricerca}»
                </li>
              )}
            </ul>
          </>
        )}

        {fase === 'consenso' && banca && (
          <>
            <DialogHeader>
              <DialogTitle className="text-base">Autorizza {banca.nome}</DialogTitle>
              <DialogDescription className="text-xs">
                {impostazioni.nomeApp} richiede un consenso PSD2 valido {impostazioni.giorniConsenso} giorni, rinnovabile.
              </DialogDescription>
            </DialogHeader>
            <ul className="space-y-2.5" role="list">
              {[
                'Lettura di saldo e movimenti dei conti selezionati',
                'Storico transazioni fino a 24 mesi',
                'Nessuna autorizzazione a disporre pagamenti',
              ].map((t) => (
                <li key={t} className="flex gap-2.5 text-sm">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span className="text-muted-foreground">{t}</span>
                </li>
              ))}
            </ul>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setFase('scelta')}>
                Indietro
              </Button>
              <Button className="flex-1" onClick={autorizza} data-testid="button-autorizza">
                Autorizza
              </Button>
            </div>
          </>
        )}

        {fase === 'sincronizzazione' && banca && (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
            <p className="text-sm font-medium">Sincronizzazione con {banca.nome}</p>
            <p className="text-xs text-muted-foreground">Recupero conti, saldi e 24 mesi di transazioni…</p>
          </div>
        )}

        {fase === 'fatto' && banca && (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/12">
              <Check className="h-5 w-5 text-primary" />
            </span>
            <p className="text-sm font-medium">{banca.nome} collegata</p>
            <p className="max-w-xs text-xs text-muted-foreground">
              Financy sta analizzando i movimenti per riconoscere le tue ricorrenze. Le previsioni si
              aggiornano entro pochi minuti.
            </p>
            <Button className="mt-2 w-full" onClick={() => setAperto(false)} data-testid="button-chiudi-collega">
              Vai alla panoramica
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function Conti() {
  const { conti, transazioni, impostazioni } = useStato();

  const movimenti30 = (id: string) => {
    const da = iso(new Date(OGGI.getFullYear(), OGGI.getMonth() - 1, OGGI.getDate()));
    return transazioni.filter((t) => t.contoId === id && t.data >= da).length;
  };

  return (
    <Shell
      titolo="Conti collegati"
      sottotitolo="Aggregazione open banking in sola lettura"
      azioni={<ModaleCollega />}
    >
      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Patrimonio totale</p>
          <p className="mt-2 text-lg font-semibold num">{euro(patrimonio(conti))}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Liquidità</p>
          <p className="mt-2 text-lg font-semibold num">{euro(liquidi(conti))}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Investimenti</p>
          <p className="mt-2 text-lg font-semibold num">
            {euro(conti.filter((c) => c.tipo === 'investimento').reduce((s, c) => s + c.saldo, 0))}
          </p>
        </div>
      </section>

      <ul className="mt-3 grid gap-3 lg:grid-cols-2" role="list">
        {conti.map((c) => (
          <li key={c.id} className="rounded-xl border bg-card p-4 sm:p-5" data-testid={`riga-conto-${c.id}`}>
            <div className="flex items-start gap-3">
              <Sigla sigla={c.sigla} hue={c.hue} className="h-10 w-10" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{c.banca}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {ETICHETTA_TIPO[c.tipo]} · {c.iban}
                </p>
              </div>
              <div className="text-right">
                <p className={`text-base font-semibold num ${c.saldo < 0 ? 'text-destructive' : ''}`}>
                  {euro(c.saldo)}
                </p>
                <p className="text-xs text-muted-foreground">{movimenti30(c.id)} movimenti / 30 gg</p>
              </div>
            </div>

            <div className="mt-4 space-y-1.5">
              <div className="flex items-baseline justify-between text-xs">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Consenso PSD2
                </span>
                <span className="num text-muted-foreground">scade tra {c.consensoGiorni} giorni</span>
              </div>
              <Barra
                valore={c.consensoGiorni / (impostazioni.giorniConsenso || 90)}
                hue={c.consensoGiorni < 20 ? 12 : c.consensoGiorni < 45 ? 35 : 164}
              />
            </div>

            <div className="mt-4 flex items-center gap-2 border-t border-border pt-3">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                Sincronizzato {c.sincronizzato} fa
              </span>
              <Button variant="ghost" size="sm" className="ml-auto h-8 gap-1.5 text-xs text-muted-foreground">
                <RefreshCw className="h-3.5 w-3.5" />
                Aggiorna
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Revoca
              </Button>
            </div>
          </li>
        ))}

        <li className="flex min-h-[11rem] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border p-6 text-center">
          <p className="text-sm font-medium">Manca un conto?</p>
          <p className="max-w-xs text-xs text-muted-foreground">
            Collega banche, carte e conti digitali: Financy unisce tutto in un unico prospetto.
          </p>
          <div className="mt-2">
            <ModaleCollega />
          </div>
        </li>
      </ul>
    </Shell>
  );
}
