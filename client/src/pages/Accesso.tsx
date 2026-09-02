import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'wouter';
import {
  AlertCircle,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Fingerprint,
  Lightbulb,
  Loader2,
  Lock,
  Moon,
  ShieldCheck,
  Sparkles,
  Sun,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Marchio } from '@/components/Logo';
import { useStato, type SlideAccesso } from '@/lib/stato';

function CurvaDecorativa() {
  return (
    <svg viewBox="0 0 320 90" className="w-full" fill="none" aria-hidden="true">
      <path
        d="M2 62 C 30 58, 52 70, 74 54 C 96 38, 118 60, 140 48"
        stroke="hsl(100 12% 78%)"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M140 48 C 168 34, 186 66, 214 44 C 240 24, 266 40, 316 16"
        stroke="hsl(161 50% 55%)"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeDasharray="4 5"
      />
      <circle cx="140" cy="48" r="3.4" fill="hsl(161 50% 55%)" />
      <line x1="140" y1="12" x2="140" y2="82" stroke="hsl(100 8% 40%)" strokeWidth="1" strokeDasharray="2 4" />
      <text x="146" y="20" fill="hsl(100 8% 62%)" fontSize="9" fontFamily="Geist Mono, monospace">
        oggi
      </text>
    </svg>
  );
}

/** Carosello del pannello di accesso: avanza da solo e si mette in pausa al passaggio del mouse. */
function CaroselloAccesso({
  slide,
  intervallo,
  automatico,
}: {
  slide: SlideAccesso[];
  intervallo: number;
  automatico: boolean;
}) {
  const [indice, setIndice] = useState(0);
  const [pausa, setPausa] = useState(false);

  const totale = slide.length;
  const corrente = slide[Math.min(indice, totale - 1)];

  useEffect(() => {
    if (indice > totale - 1) setIndice(0);
  }, [totale, indice]);

  useEffect(() => {
    if (!automatico || pausa || totale < 2) return;
    const secondi = Math.max(3, Number(intervallo) || 15);
    const timer = window.setInterval(() => setIndice((v) => (v + 1) % totale), secondi * 1000);
    return () => window.clearInterval(timer);
  }, [automatico, pausa, intervallo, totale]);

  if (!corrente) return null;

  const vai = (delta: number) => setIndice((v) => (v + delta + totale) % totale);
  const Icona = corrente.tipo === 'consiglio' ? Lightbulb : Sparkles;

  return (
    <div
      className="w-full max-w-2xl text-center"
      onMouseEnter={() => setPausa(true)}
      onMouseLeave={() => setPausa(false)}
      aria-live="polite"
      data-testid="carosello-accesso"
    >
      {/* key sull'indice: rimonta il blocco e riattiva l'animazione a ogni cambio slide */}
      <div key={indice} className="animate-comparsa" data-testid={`slide-${indice}`}>
        <p className="flex items-center justify-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-[hsl(161_38%_66%)]">
          <Icona className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {corrente.occhiello}
        </p>
        <h2 className="mx-auto mt-5 max-w-xl whitespace-pre-line text-2xl font-semibold leading-[1.2] tracking-tight xl:text-3xl">
          {corrente.titolo}
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-[0.9375rem] leading-relaxed text-[hsl(100_8%_74%)]">
          {corrente.testo}
        </p>
      </div>

      <div className="mt-8 max-w-md mx-auto">
        <CurvaDecorativa />
      </div>

      {totale > 1 && (
        <div className="mt-8 flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => vai(-1)}
            className="rounded-full p-1.5 text-[hsl(100_8%_60%)] transition-colors hover:bg-white/10 hover:text-[hsl(100_10%_92%)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[hsl(161_50%_55%)]"
            aria-label="Slide precedente"
            data-testid="button-slide-precedente"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-2" role="tablist" aria-label="Slide">
            {slide.map((s, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={i === indice}
                aria-label={`Slide ${i + 1}: ${s.titolo.replace(/\n/g, ' ')}`}
                onClick={() => setIndice(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === indice ? 'w-7 bg-[hsl(161_50%_55%)]' : 'w-1.5 bg-white/25 hover:bg-white/45'
                }`}
                data-testid={`punto-slide-${i}`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => vai(1)}
            className="rounded-full p-1.5 text-[hsl(100_8%_60%)] transition-colors hover:bg-white/10 hover:text-[hsl(100_10%_92%)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[hsl(161_50%_55%)]"
            aria-label="Slide successiva"
            data-testid="button-slide-successiva"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

export default function Accesso() {
  const { entra, tema, cambiaTema, impostazioni } = useStato();
  const [, naviga] = useLocation();
  const [email, setEmail] = useState('dennis.oteri@gmail.com');
  const [password, setPassword] = useState('financy2026');
  const [caricamento, setCaricamento] = useState(false);
  const [errore, setErrore] = useState('');

  // Se non ci sono slide configurate, ricade sui testi singoli dell'accesso.
  const slide = useMemo<SlideAccesso[]>(() => {
    if (impostazioni.slideAccesso?.length) return impostazioni.slideAccesso;
    return [
      {
        tipo: 'azienda',
        occhiello: impostazioni.occhielloAccesso,
        titolo: `${impostazioni.titoloAccesso1}\n${impostazioni.titoloAccesso2}`,
        testo: impostazioni.testoAccesso,
      },
    ];
  }, [impostazioni]);

  async function invia(e?: React.FormEvent) {
    e?.preventDefault();
    setErrore('');
    setCaricamento(true);
    try {
      await entra(email, password);
      naviga('/panoramica');
    } catch (err: any) {
      setErrore(err?.message ?? 'Accesso non riuscito.');
    } finally {
      setCaricamento(false);
    }
  }

  return (
    <div className="grid min-h-full lg:grid-cols-[1.05fr_1fr]">
      {/* Pannello brand */}
      <div className="relative hidden flex-col bg-[hsl(166_44%_9%)] px-10 pb-12 pt-8 text-[hsl(100_10%_92%)] lg:flex">
        {/* Marchio: occupa almeno un quarto dell'altezza del pannello */}
        <div className="flex min-h-[25vh] shrink-0 flex-col items-center justify-center gap-5 text-center">
          <Marchio className="h-20 w-20 text-[hsl(100_10%_92%)] xl:h-24 xl:w-24" />
          <p className="text-4xl font-semibold leading-none tracking-tight xl:text-5xl">{impostazioni.nomeApp}</p>
        </div>

        {/* Carosello centrato */}
        <div className="flex flex-1 items-center justify-center py-8">
          <CaroselloAccesso
            slide={slide}
            intervallo={impostazioni.slideIntervallo}
            automatico={impostazioni.slideAutomatico}
          />
        </div>

        {/* Punti di forza: due per colonna */}
        <ul className="grid shrink-0 grid-cols-2 gap-x-10 gap-y-5" role="list">
          {impostazioni.punti.map((p) => (
            <li key={p.titolo} className="flex gap-3">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[hsl(161_50%_55%)]" />
              <div>
                <p className="text-sm font-medium leading-snug">{p.titolo}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-[hsl(100_8%_66%)]">{p.testo}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Pannello accesso */}
      <div className="relative flex flex-col justify-center bg-background px-5 py-12 sm:px-10">
        <button
          onClick={cambiaTema}
          className="absolute right-5 top-5 rounded-md p-2 text-muted-foreground hover:bg-secondary"
          aria-label={tema === 'dark' ? 'Passa al tema chiaro' : 'Passa al tema scuro'}
          data-testid="button-tema-accesso"
        >
          {tema === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        <div className="mx-auto w-full max-w-sm">
          <div className="flex items-center gap-2.5 lg:hidden">
            <Marchio className="h-7 w-7 text-foreground" />
            <span className="text-[1.0625rem] font-semibold tracking-tight">{impostazioni.nomeApp}</span>
          </div>

          <h1 className="mt-6 text-lg font-semibold tracking-tight lg:mt-0">{impostazioni.messaggioBenvenuto}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{impostazioni.sottotitoloAccesso}</p>

          <form onSubmit={invia} className="mt-7 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                data-testid="input-email"
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs">
                  Password
                </Label>
                <button type="button" className="text-xs text-primary hover:underline">
                  Password dimenticata?
                </button>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                data-testid="input-password"
              />
            </div>

            {errore && (
              <p
                className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive"
                role="alert"
                data-testid="text-errore-accesso"
              >
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {errore}
              </p>
            )}

            <Button type="submit" className="w-full gap-2" disabled={caricamento} data-testid="button-accedi">
              {caricamento ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Accesso in corso
                </>
              ) : (
                <>
                  Accedi <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>

            <div className="flex items-center gap-3 py-1">
              <span className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground">oppure</span>
              <span className="h-px flex-1 bg-border" />
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full gap-2"
              disabled={caricamento}
              onClick={() => invia()}
              data-testid="button-biometria"
            >
              <Fingerprint className="h-4 w-4" />
              Entra con impronta
            </Button>
          </form>

          <div className="mt-7 space-y-2.5 rounded-lg border border-border bg-card p-3.5">
            <p className="flex items-center gap-2 text-xs font-medium">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              Accesso ai conti in sola lettura
            </p>
            <p className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
              <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {impostazioni.nomeApp} non può disporre pagamenti. Le credenziali bancarie restano sulla tua banca: il
              consenso PSD2 dura {impostazioni.giorniConsenso} giorni e lo revochi quando vuoi.
            </p>
          </div>

          {impostazioni.mostraNotaPrototipo && (
            <p className="mt-6 text-center text-xs text-muted-foreground">{impostazioni.notaPrototipo}</p>
          )}
        </div>
      </div>
    </div>
  );
}
