import { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  GalleryHorizontalEnd,
  Lightbulb,
  Loader2,
  Palette,
  Plus,
  RotateCcw,
  Save,
  Sparkles,
  Trash2,
  Type,
  Users,
} from 'lucide-react';
import { Shell } from '@/components/Shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useStato, type Impostazioni, type SlideAccesso, type Utente } from '@/lib/stato';
import { api } from '@/lib/api';
import { Sigla } from '@/components/Comuni';
import { euro } from '@/lib/format';
import { ETICHETTA_CADENZA, type Cadenza, type Conto, type Ricorrenza } from '@/lib/data';

const CADENZE: Cadenza[] = ['mensile', 'bimestrale', 'trimestrale', 'semestrale', 'annuale'];
const TIPI = ['corrente', 'prepagata', 'carta', 'investimento'] as const;

function Campo({
  etichetta,
  aiuto,
  children,
}: {
  etichetta: string;
  aiuto?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{etichetta}</Label>
      {children}
      {aiuto && <p className="text-xs text-muted-foreground">{aiuto}</p>}
    </div>
  );
}

function Sezione({ titolo, descrizione, children }: { titolo: string; descrizione?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border bg-card p-4">
      <h2 className="text-sm font-semibold">{titolo}</h2>
      {descrizione && <p className="mt-0.5 text-xs text-muted-foreground">{descrizione}</p>}
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

export default function Admin() {
  const { impostazioni, applicaImpostazioni, conti, impostaConti, ricorrenze, impostaRicorrenze, utente } = useStato();
  const { toast } = useToast();

  const [bozza, setBozza] = useState<Impostazioni>(impostazioni);
  const [salvataggio, setSalvataggio] = useState(false);
  const [utenti, setUtenti] = useState<Utente[]>([]);
  const [contoAperto, setContoAperto] = useState<Conto | null>(null);
  const [ricorrenzaAperta, setRicorrenzaAperta] = useState<Ricorrenza | null>(null);
  const [nuovaRicorrenza, setNuovaRicorrenza] = useState(false);
  const [ripristino, setRipristino] = useState(false);
  const [passwordRipristino, setPasswordRipristino] = useState('');
  const [errore, setErrore] = useState('');

  useEffect(() => setBozza(impostazioni), [impostazioni]);
  useEffect(() => {
    api<{ utenti: Utente[] }>('/admin/utenti')
      .then((d) => setUtenti(d.utenti))
      .catch(() => undefined);
  }, []);

  if (utente?.ruolo !== 'admin') return null;

  const modifica = <K extends keyof Impostazioni>(k: K, v: Impostazioni[K]) => setBozza((b) => ({ ...b, [k]: v }));

  // ---- gestione delle slide della schermata di accesso ----
  const slide = bozza.slideAccesso ?? [];
  const aggiornaSlide = (i: number, campo: keyof SlideAccesso, valore: string) =>
    modifica('slideAccesso', slide.map((s, j) => (j === i ? { ...s, [campo]: valore } : s)) as SlideAccesso[]);
  const spostaSlide = (i: number, delta: number) => {
    const destinazione = i + delta;
    if (destinazione < 0 || destinazione >= slide.length) return;
    const copia = [...slide];
    [copia[i], copia[destinazione]] = [copia[destinazione], copia[i]];
    modifica('slideAccesso', copia);
  };

  async function salva() {
    setSalvataggio(true);
    try {
      const d = await api<{ impostazioni: Impostazioni; messaggio: string }>('/admin/impostazioni', {
        metodo: 'PUT',
        corpo: bozza,
      });
      applicaImpostazioni(d.impostazioni);
      toast({ description: d.messaggio });
    } catch (e: any) {
      toast({ description: e?.message ?? 'Salvataggio non riuscito.', variant: 'destructive' });
    } finally {
      setSalvataggio(false);
    }
  }

  async function salvaConto(c: Conto) {
    try {
      const d = await api<{ conti: Conto[]; messaggio: string }>(`/admin/conti/${c.id}`, { metodo: 'PUT', corpo: c });
      impostaConti(d.conti);
      setContoAperto(null);
      toast({ description: d.messaggio });
    } catch (e: any) {
      toast({ description: e?.message ?? 'Errore', variant: 'destructive' });
    }
  }

  async function eliminaConto(id: string) {
    const d = await api<{ conti: Conto[]; ricorrenze: Ricorrenza[]; messaggio: string }>(`/admin/conti/${id}`, {
      metodo: 'DELETE',
    });
    impostaConti(d.conti);
    impostaRicorrenze(d.ricorrenze);
    setContoAperto(null);
    toast({ description: d.messaggio });
  }

  async function salvaRicorrenza(r: Ricorrenza, creazione: boolean) {
    try {
      const d = await api<{ ricorrenze: Ricorrenza[]; messaggio: string }>(
        creazione ? '/admin/ricorrenze' : `/admin/ricorrenze/${r.id}`,
        { metodo: creazione ? 'POST' : 'PUT', corpo: r },
      );
      impostaRicorrenze(d.ricorrenze);
      setRicorrenzaAperta(null);
      setNuovaRicorrenza(false);
      toast({ description: d.messaggio });
    } catch (e: any) {
      toast({ description: e?.message ?? 'Errore', variant: 'destructive' });
    }
  }

  async function eliminaRicorrenza(id: string) {
    const d = await api<{ ricorrenze: Ricorrenza[]; messaggio: string }>(`/admin/ricorrenze/${id}`, { metodo: 'DELETE' });
    impostaRicorrenze(d.ricorrenze);
    setRicorrenzaAperta(null);
    toast({ description: d.messaggio });
  }

  async function ripristina() {
    setErrore('');
    try {
      const d = await api<{ impostazioni: Impostazioni; conti: Conto[]; ricorrenze: Ricorrenza[]; messaggio: string }>(
        '/admin/ripristina',
        { metodo: 'POST', corpo: { password: passwordRipristino } },
      );
      applicaImpostazioni(d.impostazioni);
      impostaConti(d.conti);
      impostaRicorrenze(d.ricorrenze);
      setRipristino(false);
      setPasswordRipristino('');
      toast({ description: d.messaggio });
    } catch (e: any) {
      setErrore(e?.message ?? 'Operazione non riuscita.');
    }
  }

  return (
    <Shell
      titolo="Amministrazione"
      sottotitolo="Personalizza testi, colori, conti, ricorrenze e utenti"
      azioni={
        <Button size="sm" className="gap-1.5" onClick={salva} disabled={salvataggio} data-testid="button-salva-impostazioni">
          {salvataggio ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          Salva
        </Button>
      }
    >
      <Tabs defaultValue="testi">
        <TabsList className="mb-3 flex w-full justify-start overflow-x-auto">
          <TabsTrigger value="testi" data-testid="tab-testi" className="gap-1.5">
            <Type className="h-3.5 w-3.5" /> Testi
          </TabsTrigger>
          <TabsTrigger value="slide" data-testid="tab-slide" className="gap-1.5">
            <GalleryHorizontalEnd className="h-3.5 w-3.5" /> Slide accesso
          </TabsTrigger>
          <TabsTrigger value="aspetto" data-testid="tab-aspetto" className="gap-1.5">
            <Palette className="h-3.5 w-3.5" /> Aspetto
          </TabsTrigger>
          <TabsTrigger value="dati" data-testid="tab-dati">
            Conti e ricorrenze
          </TabsTrigger>
          <TabsTrigger value="utenti" data-testid="tab-utenti" className="gap-1.5">
            <Users className="h-3.5 w-3.5" /> Utenti
          </TabsTrigger>
        </TabsList>

        {/* ---------------- TESTI ---------------- */}
        <TabsContent value="testi" className="space-y-3">
          <Sezione titolo="Marchio" descrizione="Nome e promessa mostrati ovunque nel prodotto.">
            <div className="grid gap-3 sm:grid-cols-2">
              <Campo etichetta="Nome dell'app">
                <Input value={bozza.nomeApp} onChange={(e) => modifica('nomeApp', e.target.value)} data-testid="input-nome-app" />
              </Campo>
              <Campo etichetta="Payoff">
                <Input value={bozza.payoff} onChange={(e) => modifica('payoff', e.target.value)} data-testid="input-payoff" />
              </Campo>
            </div>
          </Sezione>

          <Sezione titolo="Schermata di accesso">
            <div className="grid gap-3 sm:grid-cols-2">
              <Campo etichetta="Occhiello">
                <Input value={bozza.occhielloAccesso} onChange={(e) => modifica('occhielloAccesso', e.target.value)} />
              </Campo>
              <Campo etichetta="Saluto">
                <Input value={bozza.messaggioBenvenuto} onChange={(e) => modifica('messaggioBenvenuto', e.target.value)} />
              </Campo>
              <Campo etichetta="Titolo, prima riga">
                <Input value={bozza.titoloAccesso1} onChange={(e) => modifica('titoloAccesso1', e.target.value)} data-testid="input-titolo1" />
              </Campo>
              <Campo etichetta="Titolo, seconda riga">
                <Input value={bozza.titoloAccesso2} onChange={(e) => modifica('titoloAccesso2', e.target.value)} />
              </Campo>
            </div>
            <Campo etichetta="Sottotitolo del form">
              <Input value={bozza.sottotitoloAccesso} onChange={(e) => modifica('sottotitoloAccesso', e.target.value)} />
            </Campo>
            <Campo etichetta="Paragrafo di presentazione">
              <Textarea rows={3} value={bozza.testoAccesso} onChange={(e) => modifica('testoAccesso', e.target.value)} />
            </Campo>
          </Sezione>

          <Sezione titolo="Punti di forza" descrizione="Elenco mostrato nel pannello scuro dell'accesso.">
            {bozza.punti.map((p, i) => (
              <div key={i} className="grid gap-2 rounded-lg border border-border/70 p-3 sm:grid-cols-[1fr_1.6fr_auto]">
                <Input
                  value={p.titolo}
                  placeholder="Titolo"
                  onChange={(e) =>
                    modifica('punti', bozza.punti.map((x, j) => (j === i ? { ...x, titolo: e.target.value } : x)))
                  }
                  data-testid={`input-punto-titolo-${i}`}
                />
                <Input
                  value={p.testo}
                  placeholder="Descrizione"
                  onChange={(e) =>
                    modifica('punti', bozza.punti.map((x, j) => (j === i ? { ...x, testo: e.target.value } : x)))
                  }
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive"
                  onClick={() => modifica('punti', bozza.punti.filter((_, j) => j !== i))}
                  aria-label="Elimina punto"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => modifica('punti', [...bozza.punti, { titolo: 'Nuovo punto', testo: '' }])}
              data-testid="button-aggiungi-punto"
            >
              <Plus className="h-3.5 w-3.5" /> Aggiungi punto
            </Button>
          </Sezione>

          <Sezione titolo="Avvisi">
            <Campo etichetta="Nota a piè di pagina">
              <Input value={bozza.notaPrototipo} onChange={(e) => modifica('notaPrototipo', e.target.value)} />
            </Campo>
            <div className="flex items-center justify-between rounded-lg bg-secondary/60 p-3">
              <div>
                <p className="text-sm font-medium">Mostra la nota</p>
                <p className="text-xs text-muted-foreground">Disattivala per le demo con i clienti.</p>
              </div>
              <Switch
                checked={bozza.mostraNotaPrototipo}
                onCheckedChange={(v) => modifica('mostraNotaPrototipo', v)}
                data-testid="switch-nota"
              />
            </div>
            <Campo etichetta="Saluto nella panoramica" aiuto="Verrà seguito dal nome dell'utente.">
              <Input value={bozza.titoloPanoramica} onChange={(e) => modifica('titoloPanoramica', e.target.value)} />
            </Campo>
          </Sezione>
        </TabsContent>

        {/* ---------------- SLIDE ACCESSO ---------------- */}
        <TabsContent value="slide" className="space-y-3">
          <Sezione
            titolo="Scorrimento automatico"
            descrizione="Le slide ruotano nel pannello verde della schermata di accesso."
          >
            <div className="flex items-center justify-between rounded-lg bg-secondary/60 p-3">
              <div>
                <p className="text-sm font-medium">Avanzamento automatico</p>
                <p className="text-xs text-muted-foreground">
                  Si mette in pausa quando il visitatore passa il mouse sul testo.
                </p>
              </div>
              <Switch
                checked={bozza.slideAutomatico}
                onCheckedChange={(v) => modifica('slideAutomatico', v)}
                data-testid="switch-slide-automatico"
              />
            </div>
            <Campo etichetta="Secondi per slide" aiuto="Minimo 3 secondi. Valore consigliato: 15.">
              <Input
                type="number"
                min={3}
                max={120}
                value={bozza.slideIntervallo}
                onChange={(e) => modifica('slideIntervallo', Math.max(3, Number(e.target.value) || 15))}
                className="num max-w-[10rem]"
                data-testid="input-slide-intervallo"
              />
            </Campo>
          </Sezione>

          <Sezione
            titolo="Slide"
            descrizione="Informazioni sull'azienda o consigli finanziari. Vai a capo nel titolo per spezzarlo su due righe."
          >
            {slide.length === 0 && (
              <p className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                Nessuna slide: la schermata di accesso mostra i testi singoli della scheda Testi.
              </p>
            )}

            {slide.map((s, i) => (
              <div key={i} className="space-y-3 rounded-lg border border-border/70 p-3" data-testid={`slide-admin-${i}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    {s.tipo === 'consiglio' ? (
                      <Lightbulb className="h-3.5 w-3.5 text-primary" />
                    ) : (
                      <Sparkles className="h-3.5 w-3.5 text-primary" />
                    )}
                    Slide {i + 1} di {slide.length}
                  </span>
                  <div className="flex items-center gap-0.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      disabled={i === 0}
                      onClick={() => spostaSlide(i, -1)}
                      aria-label="Sposta la slide in alto"
                      data-testid={`button-slide-su-${i}`}
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      disabled={i === slide.length - 1}
                      onClick={() => spostaSlide(i, 1)}
                      aria-label="Sposta la slide in basso"
                      data-testid={`button-slide-giu-${i}`}
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => modifica('slideAccesso', slide.filter((_, j) => j !== i))}
                      aria-label="Elimina la slide"
                      data-testid={`button-slide-elimina-${i}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-[11rem_1fr]">
                  <Campo etichetta="Tipo">
                    <Select value={s.tipo} onValueChange={(v) => aggiornaSlide(i, 'tipo', v)}>
                      <SelectTrigger data-testid={`select-slide-tipo-${i}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="azienda">Azienda</SelectItem>
                        <SelectItem value="consiglio">Consiglio</SelectItem>
                      </SelectContent>
                    </Select>
                  </Campo>
                  <Campo etichetta="Occhiello">
                    <Input
                      value={s.occhiello}
                      placeholder="Consiglio finanziario"
                      onChange={(e) => aggiornaSlide(i, 'occhiello', e.target.value)}
                      data-testid={`input-slide-occhiello-${i}`}
                    />
                  </Campo>
                </div>

                <Campo etichetta="Titolo" aiuto="Due righe rendono meglio del testo su una sola.">
                  <Textarea
                    rows={2}
                    value={s.titolo}
                    onChange={(e) => aggiornaSlide(i, 'titolo', e.target.value)}
                    data-testid={`input-slide-titolo-${i}`}
                  />
                </Campo>
                <Campo etichetta="Testo">
                  <Textarea
                    rows={3}
                    value={s.testo}
                    onChange={(e) => aggiornaSlide(i, 'testo', e.target.value)}
                    data-testid={`input-slide-testo-${i}`}
                  />
                </Campo>
              </div>
            ))}

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() =>
                  modifica('slideAccesso', [
                    ...slide,
                    { tipo: 'azienda', occhiello: 'Perché Financy', titolo: 'Nuovo titolo', testo: '' },
                  ])
                }
                data-testid="button-aggiungi-slide-azienda"
              >
                <Sparkles className="h-3.5 w-3.5" /> Aggiungi informazione
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() =>
                  modifica('slideAccesso', [
                    ...slide,
                    { tipo: 'consiglio', occhiello: 'Consiglio finanziario', titolo: 'Nuovo consiglio', testo: '' },
                  ])
                }
                data-testid="button-aggiungi-slide-consiglio"
              >
                <Lightbulb className="h-3.5 w-3.5" /> Aggiungi consiglio
              </Button>
            </div>
          </Sezione>
        </TabsContent>

        {/* ---------------- ASPETTO ---------------- */}
        <TabsContent value="aspetto" className="space-y-3">
          <Sezione titolo="Colore del marchio" descrizione="Si applica in tempo reale a pulsanti, grafici e accenti.">
            <div className="grid gap-4 sm:grid-cols-[1fr_11rem] sm:items-start">
              <div className="space-y-4">
                <Campo etichetta={`Tonalità · ${bozza.tonalita}`}>
                  <Slider
                    value={[bozza.tonalita]}
                    min={0}
                    max={360}
                    step={1}
                    onValueChange={([v]) => modifica('tonalita', v)}
                    data-testid="slider-tonalita"
                  />
                </Campo>
                <Campo etichetta={`Saturazione · ${bozza.saturazione}%`}>
                  <Slider
                    value={[bozza.saturazione]}
                    min={0}
                    max={100}
                    step={1}
                    onValueChange={([v]) => modifica('saturazione', v)}
                  />
                </Campo>
                <Campo etichetta={`Luminosità · ${bozza.luminosita}%`}>
                  <Slider
                    value={[bozza.luminosita]}
                    min={10}
                    max={60}
                    step={1}
                    onValueChange={([v]) => modifica('luminosita', v)}
                  />
                </Campo>
                <Campo etichetta={`Tonalità in tema scuro · ${bozza.tonalitaScura}`}>
                  <Slider
                    value={[bozza.tonalitaScura]}
                    min={0}
                    max={360}
                    step={1}
                    onValueChange={([v]) => modifica('tonalitaScura', v)}
                  />
                </Campo>
              </div>
              <div className="space-y-2 rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Anteprima</p>
                <div
                  className="h-16 rounded-md"
                  style={{ background: `hsl(${bozza.tonalita} ${bozza.saturazione}% ${bozza.luminosita}%)` }}
                />
                <div
                  className="h-8 rounded-md"
                  style={{ background: `hsl(${bozza.tonalitaScura} 50% 50%)` }}
                />
                <p className="text-xs num">
                  hsl({bozza.tonalita} {bozza.saturazione}% {bozza.luminosita}%)
                </p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Premi Salva per rendere il colore permanente: senza salvataggio torna al valore del database.
            </p>
          </Sezione>

          <Sezione titolo="Parametri di calcolo" descrizione="Governano previsioni e simulazioni di tutto il prodotto.">
            <div className="grid gap-3 sm:grid-cols-2">
              <Campo etichetta="Orizzonte previsione predefinito (mesi)">
                <Select value={String(bozza.orizzonteDefault)} onValueChange={(v) => modifica('orizzonteDefault', Number(v))}>
                  <SelectTrigger data-testid="select-orizzonte">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="6">6 mesi</SelectItem>
                    <SelectItem value="12">12 mesi</SelectItem>
                    <SelectItem value="24">24 mesi</SelectItem>
                  </SelectContent>
                </Select>
              </Campo>
              <Campo etichetta="Durata del consenso PSD2 (giorni)">
                <Input
                  type="number"
                  value={bozza.giorniConsenso}
                  onChange={(e) => modifica('giorniConsenso', Number(e.target.value))}
                />
              </Campo>
              <Campo etichetta="Spesa variabile mensile" aiuto="0 = calcolata dalle transazioni.">
                <Input
                  type="number"
                  value={bozza.spesaVariabileManuale}
                  onChange={(e) => modifica('spesaVariabileManuale', Number(e.target.value))}
                  data-testid="input-spesa-manuale"
                />
              </Campo>
              <Campo etichetta="Storico movimenti generati (giorni)">
                <Input
                  type="number"
                  value={bozza.giorniStorico}
                  onChange={(e) => modifica('giorniStorico', Number(e.target.value))}
                />
              </Campo>
            </div>
          </Sezione>

          <Sezione titolo="Ripristino" descrizione="Riporta conti, ricorrenze e impostazioni ai valori dimostrativi iniziali.">
            <Button variant="outline" className="gap-1.5 text-destructive" onClick={() => setRipristino(true)} data-testid="button-ripristina">
              <RotateCcw className="h-3.5 w-3.5" /> Ripristina dati dimostrativi
            </Button>
          </Sezione>
        </TabsContent>

        {/* ---------------- DATI ---------------- */}
        <TabsContent value="dati" className="space-y-3">
          <Sezione titolo="Conti" descrizione="Saldi, banche e stato del consenso mostrati nel prodotto.">
            <div className="divide-y divide-border/60">
              {conti.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setContoAperto(c)}
                  className="flex w-full items-center gap-3 py-2.5 text-left hover:bg-secondary/40"
                  data-testid={`button-conto-${c.id}`}
                >
                  <Sigla sigla={c.sigla} hue={c.hue} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{c.banca}</span>
                    <span className="block truncate text-xs text-muted-foreground">{c.nome}</span>
                  </span>
                  <span className="num text-sm">{euro(c.saldo)}</span>
                </button>
              ))}
            </div>
          </Sezione>

          <Sezione titolo={`Ricorrenze (${ricorrenze.length})`} descrizione="Le voci che alimentano le previsioni future.">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => {
                setNuovaRicorrenza(true);
                setRicorrenzaAperta({
                  id: 'nuova',
                  nome: '',
                  categoria: 'Spesa',
                  importo: -50,
                  cadenza: 'mensile',
                  ancora: '2026-09-15',
                  contoId: conti[0]?.id ?? 'isp',
                  affidabilita: 0.9,
                  rilevataAuto: false,
                });
              }}
              data-testid="button-nuova-ricorrenza"
            >
              <Plus className="h-3.5 w-3.5" /> Nuova ricorrenza
            </Button>
            <div className="divide-y divide-border/60">
              {ricorrenze.map((r) => (
                <button
                  key={r.id}
                  onClick={() => {
                    setNuovaRicorrenza(false);
                    setRicorrenzaAperta(r);
                  }}
                  className="flex w-full items-center gap-3 py-2.5 text-left hover:bg-secondary/40"
                  data-testid={`button-ricorrenza-${r.id}`}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{r.nome}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {ETICHETTA_CADENZA[r.cadenza]} · {r.categoria}
                    </span>
                  </span>
                  <span className={`num text-sm ${r.importo > 0 ? 'text-primary' : ''}`}>{euro(r.importo)}</span>
                </button>
              ))}
            </div>
          </Sezione>
        </TabsContent>

        {/* ---------------- UTENTI ---------------- */}
        <TabsContent value="utenti">
          <Sezione titolo={`Utenti registrati (${utenti.length})`} descrizione="Ruolo e piano di ciascun account.">
            <div className="space-y-2">
              {utenti.map((u) => (
                <div key={u.id} className="grid gap-2 rounded-lg border p-3 sm:grid-cols-[1fr_9rem_9rem]">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {u.nome} {u.cognome}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                  </div>
                  <Select
                    value={u.ruolo}
                    onValueChange={async (v) => {
                      const d = await api<{ utenti: Utente[] }>(`/admin/utenti/${u.id}`, {
                        metodo: 'PUT',
                        corpo: { ruolo: v, piano: u.piano },
                      });
                      setUtenti(d.utenti);
                      toast({ description: 'Ruolo aggiornato.' });
                    }}
                  >
                    <SelectTrigger data-testid={`select-ruolo-${u.id}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="utente">Utente</SelectItem>
                      <SelectItem value="admin">Amministratore</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={u.piano}
                    onValueChange={async (v) => {
                      const d = await api<{ utenti: Utente[] }>(`/admin/utenti/${u.id}`, {
                        metodo: 'PUT',
                        corpo: { ruolo: u.ruolo, piano: v },
                      });
                      setUtenti(d.utenti);
                      toast({ description: 'Piano aggiornato.' });
                    }}
                  >
                    <SelectTrigger data-testid={`select-piano-${u.id}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Piano Base">Piano Base</SelectItem>
                      <SelectItem value="Piano Plus">Piano Plus</SelectItem>
                      <SelectItem value="Piano Famiglia">Piano Famiglia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </Sezione>
        </TabsContent>
      </Tabs>

      {/* modale conto */}
      <Dialog open={!!contoAperto} onOpenChange={(v) => !v && setContoAperto(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Modifica conto</DialogTitle>
            <DialogDescription>I valori si applicano subito a tutte le pagine del prodotto.</DialogDescription>
          </DialogHeader>
          {contoAperto && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Campo etichetta="Banca">
                <Input
                  value={contoAperto.banca}
                  onChange={(e) => setContoAperto({ ...contoAperto, banca: e.target.value })}
                  data-testid="input-conto-banca"
                />
              </Campo>
              <Campo etichetta="Nome del conto">
                <Input value={contoAperto.nome} onChange={(e) => setContoAperto({ ...contoAperto, nome: e.target.value })} />
              </Campo>
              <Campo etichetta="Saldo (€)">
                <Input
                  type="number"
                  step="0.01"
                  value={contoAperto.saldo}
                  onChange={(e) => setContoAperto({ ...contoAperto, saldo: Number(e.target.value) })}
                  data-testid="input-conto-saldo"
                />
              </Campo>
              <Campo etichetta="Tipo">
                <Select
                  value={contoAperto.tipo}
                  onValueChange={(v) => setContoAperto({ ...contoAperto, tipo: v as Conto['tipo'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPI.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Campo>
              <Campo etichetta="Sigla">
                <Input
                  maxLength={2}
                  value={contoAperto.sigla}
                  onChange={(e) => setContoAperto({ ...contoAperto, sigla: e.target.value.toUpperCase() })}
                />
              </Campo>
              <Campo etichetta={`Colore · ${contoAperto.hue}`}>
                <Slider
                  value={[contoAperto.hue]}
                  min={0}
                  max={360}
                  step={1}
                  onValueChange={([v]) => setContoAperto({ ...contoAperto, hue: v })}
                />
              </Campo>
              <Campo etichetta="IBAN mostrato">
                <Input value={contoAperto.iban} onChange={(e) => setContoAperto({ ...contoAperto, iban: e.target.value })} />
              </Campo>
              <Campo etichetta="Consenso residuo (giorni)">
                <Input
                  type="number"
                  value={contoAperto.consensoGiorni}
                  onChange={(e) => setContoAperto({ ...contoAperto, consensoGiorni: Number(e.target.value) })}
                />
              </Campo>
            </div>
          )}
          <DialogFooter className="gap-2 sm:justify-between">
            <Button
              variant="ghost"
              className="gap-1.5 text-destructive"
              onClick={() => contoAperto && eliminaConto(contoAperto.id)}
              data-testid="button-elimina-conto"
            >
              <Trash2 className="h-4 w-4" /> Elimina
            </Button>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setContoAperto(null)}>
                Annulla
              </Button>
              <Button onClick={() => contoAperto && salvaConto(contoAperto)} data-testid="button-salva-conto">
                Salva conto
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* modale ricorrenza */}
      <Dialog open={!!ricorrenzaAperta} onOpenChange={(v) => !v && setRicorrenzaAperta(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{nuovaRicorrenza ? 'Nuova ricorrenza' : 'Modifica ricorrenza'}</DialogTitle>
            <DialogDescription>Importo negativo per un'uscita, positivo per un'entrata.</DialogDescription>
          </DialogHeader>
          {ricorrenzaAperta && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Campo etichetta="Nome">
                <Input
                  value={ricorrenzaAperta.nome}
                  onChange={(e) => setRicorrenzaAperta({ ...ricorrenzaAperta, nome: e.target.value })}
                  data-testid="input-ric-nome"
                />
              </Campo>
              <Campo etichetta="Categoria">
                <Input
                  value={ricorrenzaAperta.categoria}
                  onChange={(e) => setRicorrenzaAperta({ ...ricorrenzaAperta, categoria: e.target.value })}
                />
              </Campo>
              <Campo etichetta="Importo (€)">
                <Input
                  type="number"
                  step="0.01"
                  value={ricorrenzaAperta.importo}
                  onChange={(e) => setRicorrenzaAperta({ ...ricorrenzaAperta, importo: Number(e.target.value) })}
                  data-testid="input-ric-importo"
                />
              </Campo>
              <Campo etichetta="Cadenza">
                <Select
                  value={ricorrenzaAperta.cadenza}
                  onValueChange={(v) => setRicorrenzaAperta({ ...ricorrenzaAperta, cadenza: v as Cadenza })}
                >
                  <SelectTrigger data-testid="select-ric-cadenza">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CADENZE.map((c) => (
                      <SelectItem key={c} value={c}>
                        {ETICHETTA_CADENZA[c]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Campo>
              <Campo etichetta="Prima occorrenza">
                <Input
                  type="date"
                  value={ricorrenzaAperta.ancora}
                  onChange={(e) => setRicorrenzaAperta({ ...ricorrenzaAperta, ancora: e.target.value })}
                />
              </Campo>
              <Campo etichetta="Conto">
                <Select
                  value={ricorrenzaAperta.contoId}
                  onValueChange={(v) => setRicorrenzaAperta({ ...ricorrenzaAperta, contoId: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {conti.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.banca}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Campo>
              <Campo etichetta={`Affidabilità · ${Math.round(ricorrenzaAperta.affidabilita * 100)}%`}>
                <Slider
                  value={[Math.round(ricorrenzaAperta.affidabilita * 100)]}
                  min={30}
                  max={100}
                  step={1}
                  onValueChange={([v]) => setRicorrenzaAperta({ ...ricorrenzaAperta, affidabilita: v / 100 })}
                />
              </Campo>
              <div className="flex items-end justify-between rounded-lg bg-secondary/60 p-3">
                <div>
                  <p className="text-sm font-medium">Rilevata automaticamente</p>
                  <p className="text-xs text-muted-foreground">Altrimenti risulta inserita a mano.</p>
                </div>
                <Switch
                  checked={ricorrenzaAperta.rilevataAuto}
                  onCheckedChange={(v) => setRicorrenzaAperta({ ...ricorrenzaAperta, rilevataAuto: v })}
                />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:justify-between">
            {!nuovaRicorrenza && (
              <Button
                variant="ghost"
                className="gap-1.5 text-destructive"
                onClick={() => ricorrenzaAperta && eliminaRicorrenza(ricorrenzaAperta.id)}
                data-testid="button-elimina-ricorrenza"
              >
                <Trash2 className="h-4 w-4" /> Elimina
              </Button>
            )}
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setRicorrenzaAperta(null)}>
                Annulla
              </Button>
              <Button
                onClick={() => ricorrenzaAperta && salvaRicorrenza(ricorrenzaAperta, nuovaRicorrenza)}
                data-testid="button-salva-ricorrenza"
              >
                Salva
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* modale ripristino */}
      <Dialog open={ripristino} onOpenChange={(v) => !v && setRipristino(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ripristinare i dati dimostrativi?</DialogTitle>
            <DialogDescription>
              Conti, ricorrenze e impostazioni tornano ai valori iniziali. Gli account utente non vengono toccati.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label className="text-xs">Password attuale</Label>
            <Input
              type="password"
              value={passwordRipristino}
              onChange={(e) => setPasswordRipristino(e.target.value)}
              data-testid="input-password-ripristino"
            />
            {errore && (
              <p className="flex items-center gap-2 text-xs text-destructive" role="alert">
                <AlertCircle className="h-3.5 w-3.5" />
                {errore}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRipristino(false)}>
              Annulla
            </Button>
            <Button onClick={ripristina} data-testid="button-conferma-ripristino">
              Ripristina
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Shell>
  );
}
