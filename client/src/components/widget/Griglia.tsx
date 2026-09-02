import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  GripVertical,
  LayoutGrid,
  Plus,
  RotateCcw,
  Settings2,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStato } from '@/lib/stato';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import {
  CATALOGO,
  CLASSE_LARGHEZZA,
  ETICHETTA_ALTEZZA,
  ETICHETTA_LARGHEZZA,
  LAYOUT_PREDEFINITO,
  TIPI_WIDGET,
  layoutPagina,
  nuovoWidget,
  type Altezza,
  type Larghezza,
  type TipoWidget,
  type Widget,
} from '@/lib/widget';

export const ALTEZZA_CONTENUTO: Record<Altezza, string> = {
  bassa: 'h-[15rem]',
  media: 'h-[19rem]',
  alta: 'h-[25rem]',
};

function Segmenti<T extends string | number>({
  valore,
  opzioni,
  onCambia,
  testid,
}: {
  valore: T;
  opzioni: { v: T; etichetta: string }[];
  onCambia: (v: T) => void;
  testid?: string;
}) {
  return (
    <div className="flex flex-wrap gap-1 rounded-lg border border-border p-1">
      {opzioni.map((o) => (
        <button
          key={String(o.v)}
          type="button"
          onClick={() => onCambia(o.v)}
          data-testid={testid ? `${testid}-${o.v}` : undefined}
          className={cn(
            'rounded-md px-2 py-1 text-xs transition-colors',
            valore === o.v ? 'bg-secondary font-medium' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {o.etichetta}
        </button>
      ))}
    </div>
  );
}

function Impostazioni({
  widget,
  onCambia,
}: {
  widget: Widget;
  onCambia: (patch: Partial<Widget>) => void;
}) {
  const def = CATALOGO[widget.tipo];
  return (
    <div className="space-y-3">
      <div>
        <p className="text-xs font-medium">{def.titolo}</p>
        <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{def.descrizione}</p>
      </div>
      <div>
        <p className="mb-1.5 text-xs text-muted-foreground">Dimensione</p>
        <Segmenti
          valore={widget.larghezza}
          opzioni={def.larghezze.map((l) => ({ v: l, etichetta: ETICHETTA_LARGHEZZA[l] }))}
          onCambia={(v) => onCambia({ larghezza: v as Larghezza })}
          testid="opzione-larghezza"
        />
      </div>
      {def.altezze && (
        <div>
          <p className="mb-1.5 text-xs text-muted-foreground">Altezza</p>
          <Segmenti
            valore={widget.altezza}
            opzioni={(['bassa', 'media', 'alta'] as Altezza[]).map((a) => ({
              v: a,
              etichetta: ETICHETTA_ALTEZZA[a],
            }))}
            onCambia={(v) => onCambia({ altezza: v as Altezza })}
            testid="opzione-altezza"
          />
        </div>
      )}
      {def.orientabile && (
        <div>
          <p className="mb-1.5 text-xs text-muted-foreground">Orientamento</p>
          <Segmenti
            valore={widget.orientamento}
            opzioni={[
              { v: 'verticale', etichetta: 'Verticale' },
              { v: 'orizzontale', etichetta: 'Orizzontale' },
            ]}
            onCambia={(v) => onCambia({ orientamento: v as 'verticale' | 'orizzontale' })}
            testid="opzione-orientamento"
          />
        </div>
      )}
      {def.limiti && (
        <div>
          <div className="mb-1.5 flex items-baseline justify-between">
            <p className="text-xs text-muted-foreground">Elementi mostrati</p>
            <p className="num text-xs">{widget.limite}</p>
          </div>
          <input
            type="range"
            min={def.limiti[0]}
            max={def.limiti[1]}
            value={widget.limite}
            onChange={(e) => onCambia({ limite: Number(e.target.value) })}
            className="w-full accent-[hsl(var(--primary))]"
            data-testid="opzione-limite"
            aria-label="Elementi mostrati"
          />
        </div>
      )}
    </div>
  );
}

export function GrigliaWidget({
  pagina,
  rendi,
  intestazione,
}: {
  pagina: string;
  rendi: (widget: Widget) => ReactNode;
  intestazione?: ReactNode;
}) {
  const { utente, salvaLayout } = useStato();
  const { toast } = useToast();
  const [modifica, setModifica] = useState(false);
  const [catalogoAperto, setCatalogoAperto] = useState(false);
  const [widgets, setWidgets] = useState<Widget[]>(() =>
    layoutPagina(utente?.layout as never, pagina),
  );
  const trascinato = useRef<number | null>(null);
  const [sopra, setSopra] = useState<number | null>(null);

  useEffect(() => {
    setWidgets(layoutPagina(utente?.layout as never, pagina));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagina, utente?.id]);

  const salva = useCallback(
    (prossimi: Widget[]) => {
      setWidgets(prossimi);
      const layout = { ...(utente?.layout ?? {}), [pagina]: prossimi } as Record<string, unknown[]>;
      salvaLayout(layout);
    },
    [pagina, salvaLayout, utente?.layout],
  );

  const sposta = (da: number, a: number) => {
    if (a < 0 || a >= widgets.length || da === a) return;
    const prossimi = widgets.slice();
    const [el] = prossimi.splice(da, 1);
    prossimi.splice(a, 0, el);
    salva(prossimi);
  };

  const aggiorna = (id: string, patch: Partial<Widget>) =>
    salva(widgets.map((w) => (w.id === id ? { ...w, ...patch } : w)));

  const rimuovi = (id: string) => {
    const w = widgets.find((x) => x.id === id);
    salva(widgets.filter((x) => x.id !== id));
    if (w) toast({ description: `Widget «${CATALOGO[w.tipo].titolo}» rimosso.` });
  };

  const aggiungi = (tipo: TipoWidget) => {
    salva([...widgets, nuovoWidget(tipo)]);
    setCatalogoAperto(false);
    setModifica(true);
    toast({ description: `Widget «${CATALOGO[tipo].titolo}» aggiunto in fondo.` });
  };

  const ripristina = () => {
    salva(LAYOUT_PREDEFINITO[pagina] ?? []);
    toast({ description: 'Disposizione predefinita ripristinata.' });
  };

  const perGruppo = useMemo(() => {
    const gruppi: Record<string, TipoWidget[]> = {};
    TIPI_WIDGET.forEach((t) => {
      const g = CATALOGO[t].gruppo;
      (gruppi[g] ??= []).push(t);
    });
    return gruppi;
  }, []);

  return (
    <>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {intestazione}
        <div className="ml-auto flex items-center gap-1.5">
          {modifica ? (
            <>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-xs"
                onClick={() => setCatalogoAperto(true)}
                data-testid="button-aggiungi-widget"
              >
                <Plus className="h-3.5 w-3.5" /> Aggiungi widget
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="gap-1.5 text-xs text-muted-foreground"
                onClick={ripristina}
                data-testid="button-ripristina-layout"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Ripristina
              </Button>
              <Button
                size="sm"
                className="gap-1.5 text-xs"
                onClick={() => setModifica(false)}
                data-testid="button-fine-personalizza"
              >
                <Check className="h-3.5 w-3.5" /> Fine
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs"
              onClick={() => setModifica(true)}
              data-testid="button-personalizza"
            >
              <LayoutGrid className="h-3.5 w-3.5" /> Personalizza
            </Button>
          )}
        </div>
      </div>

      {modifica && (
        <p className="mb-3 rounded-lg border border-dashed border-primary/40 bg-primary/[0.04] px-3 py-2 text-xs text-muted-foreground">
          Trascina le schede per riordinarle, usa le frecce da telefono, l’ingranaggio per dimensione
          e orientamento, la ✕ per rimuoverle. Tutto si salva sul tuo account.
        </p>
      )}

      <div className="grid grid-cols-2 items-start gap-3 md:grid-cols-6 lg:grid-cols-12">
        {widgets.map((w, i) => (
          <div
            key={w.id}
            className={cn(
              CLASSE_LARGHEZZA[w.larghezza],
              'relative min-w-0',
              modifica && 'cursor-grab active:cursor-grabbing',
              modifica && sopra === i && 'ring-2 ring-primary ring-offset-2 ring-offset-background rounded-xl',
            )}
            draggable={modifica}
            onDragStart={() => {
              trascinato.current = i;
            }}
            onDragOver={(e) => {
              if (!modifica) return;
              e.preventDefault();
              setSopra(i);
            }}
            onDragLeave={() => setSopra((s) => (s === i ? null : s))}
            onDrop={(e) => {
              e.preventDefault();
              setSopra(null);
              if (trascinato.current !== null) sposta(trascinato.current, i);
              trascinato.current = null;
            }}
            onDragEnd={() => {
              trascinato.current = null;
              setSopra(null);
            }}
            data-testid={`widget-${w.tipo}`}
          >
            <div className={cn('h-full', modifica && 'animate-oscilla')}>{rendi(w)}</div>

            {modifica && (
              <>
                <div className="absolute inset-0 rounded-xl border-2 border-dashed border-primary/45 bg-background/10" />
                <button
                  type="button"
                  onClick={() => rimuovi(w.id)}
                  aria-label={`Rimuovi ${CATALOGO[w.tipo].titolo}`}
                  data-testid={`button-rimuovi-${w.tipo}`}
                  className="absolute -left-2 -top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-sm hover:text-destructive"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
                <div className="absolute -bottom-2 -right-2 z-10 flex items-center gap-1 rounded-full border border-border bg-background p-1 shadow-sm">
                  <button
                    type="button"
                    onClick={() => sposta(i, i - 1)}
                    disabled={i === 0}
                    aria-label="Sposta indietro"
                    data-testid={`button-indietro-${w.tipo}`}
                    className="flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-30"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => sposta(i, i + 1)}
                    disabled={i === widgets.length - 1}
                    aria-label="Sposta avanti"
                    data-testid={`button-avanti-${w.tipo}`}
                    className="flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-30"
                  >
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        aria-label={`Impostazioni ${CATALOGO[w.tipo].titolo}`}
                        data-testid={`button-opzioni-${w.tipo}`}
                        className="flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
                      >
                        <Settings2 className="h-3.5 w-3.5" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent align="end" className="w-64">
                      <Impostazioni widget={w} onCambia={(patch) => aggiorna(w.id, patch)} />
                    </PopoverContent>
                  </Popover>
                </div>
                <span className="pointer-events-none absolute -top-2 right-2 z-10 flex items-center gap-1 rounded-full border border-border bg-background px-2 py-0.5 text-[0.625rem] text-muted-foreground">
                  <GripVertical className="h-2.5 w-2.5" />
                  {ETICHETTA_LARGHEZZA[w.larghezza]}
                </span>
              </>
            )}
          </div>
        ))}

        {modifica && (
          <button
            type="button"
            onClick={() => setCatalogoAperto(true)}
            data-testid="button-aggiungi-slot"
            className="col-span-2 flex min-h-[6rem] items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border text-sm text-muted-foreground transition-colors hover:border-primary/60 hover:text-foreground md:col-span-3 lg:col-span-4"
          >
            <Plus className="h-4 w-4" /> Aggiungi widget
          </button>
        )}
      </div>

      {!widgets.length && !modifica && (
        <div className="rounded-xl border border-dashed border-border p-10 text-center">
          <p className="text-sm font-medium">Nessun widget in questa pagina</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Premi Personalizza e aggiungi le schede che vuoi vedere.
          </p>
        </div>
      )}

      <Dialog open={catalogoAperto} onOpenChange={setCatalogoAperto}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Aggiungi un widget</DialogTitle>
            <DialogDescription>
              Puoi inserire lo stesso widget più volte e configurarlo in modo diverso.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {Object.entries(perGruppo).map(([gruppo, tipi]) => (
              <div key={gruppo}>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {gruppo}
                </p>
                <div className="grid gap-2">
                  {tipi.map((t) => {
                    const def = CATALOGO[t];
                    const presenti = widgets.filter((w) => w.tipo === t).length;
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => aggiungi(t)}
                        data-testid={`button-catalogo-${t}`}
                        className="flex items-start gap-3 rounded-lg border border-border p-3 text-left transition-colors hover:border-primary/50 hover:bg-secondary/40"
                      >
                        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <def.icona className="h-4 w-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2 text-sm font-medium">
                            {def.titolo}
                            {presenti > 0 && (
                              <span className="rounded-full bg-secondary px-1.5 py-0.5 text-[0.625rem] text-muted-foreground">
                                già presente ×{presenti}
                              </span>
                            )}
                          </span>
                          <span className="mt-0.5 block text-xs text-muted-foreground">
                            {def.descrizione}
                          </span>
                        </span>
                        <Plus className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
