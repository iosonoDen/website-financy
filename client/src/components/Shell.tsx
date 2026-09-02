import { useState, type ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import {
  CalendarClock,
  ShieldHalf,
  UserRound,
  LayoutDashboard,
  Landmark,
  ListOrdered,
  LogOut,
  Menu,
  Moon,
  RefreshCw,
  Sun,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStato } from '@/lib/stato';
import { Logotipo } from './Logo';
import { Button } from '@/components/ui/button';

const VOCI = [
  { href: '/panoramica', etichetta: 'Panoramica', icona: LayoutDashboard },
  { href: '/conti', etichetta: 'Conti collegati', icona: Landmark },
  { href: '/transazioni', etichetta: 'Transazioni', icona: ListOrdered },
  { href: '/previsioni', etichetta: 'Previsioni', icona: CalendarClock },
  { href: '/profilo', etichetta: 'Profilo', icona: UserRound },
];

export function Avatar({ className }: { className?: string }) {
  const { utente } = useStato();
  const iniziali = `${utente?.nome?.[0] ?? ''}${utente?.cognome?.[0] ?? ''}`.toUpperCase();
  if (utente?.avatar) {
    return (
      <img
        src={utente.avatar}
        alt={`Foto profilo di ${utente.nome} ${utente.cognome}`}
        className={cn('h-8 w-8 shrink-0 rounded-full object-cover ring-1 ring-border', className)}
        data-testid="img-avatar"
      />
    );
  }
  return (
    <span
      className={cn(
        'flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/12 ring-1 ring-primary/25 text-xs font-semibold text-primary',
        className,
      )}
      data-testid="text-iniziali"
    >
      {iniziali || 'FN'}
    </span>
  );
}

function Navigazione({ onNaviga }: { onNaviga?: () => void }) {
  const [percorso] = useLocation();
  const { utente } = useStato();
  const voci = utente?.ruolo === 'admin'
    ? [...VOCI, { href: '/admin', etichetta: 'Amministrazione', icona: ShieldHalf }]
    : VOCI;
  return (
    <nav className="flex flex-col gap-0.5" aria-label="Sezioni">
      {voci.map((v) => {
        const attivo = percorso === v.href;
        return (
          <Link
            key={v.href}
            href={v.href}
            onClick={onNaviga}
            data-testid={`link-${v.href.slice(1)}`}
            aria-current={attivo ? 'page' : undefined}
            className={cn(
              'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors',
              attivo
                ? 'bg-sidebar-accent font-medium text-sidebar-foreground'
                : 'text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground',
            )}
          >
            <v.icona className="h-4 w-4 shrink-0" strokeWidth={attivo ? 2.2 : 1.8} />
            {v.etichetta}
          </Link>
        );
      })}
    </nav>
  );
}

function PannelloLaterale({ onNaviga }: { onNaviga?: () => void }) {
  const { esci, conti, utente, impostazioni } = useStato();
  const collegati = conti.length;
  return (
    <div className="flex h-full flex-col gap-6 p-4">
      <Link
        href="/panoramica"
        onClick={onNaviga}
        aria-label={`${impostazioni.nomeApp} — vai alla panoramica`}
        data-testid="link-logo"
        className="mx-1 rounded-lg px-1 pt-1 pb-1 transition-colors hover:bg-sidebar-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Logotipo nome={impostazioni.nomeApp} />
      </Link>
      <Navigazione onNaviga={onNaviga} />
      <div className="mt-auto space-y-3">
        <div className="rounded-lg border border-sidebar-border bg-card/60 p-3">
          <p className="text-xs font-medium">{collegati} conti collegati</p>
          <p className="mt-1 text-xs leading-snug text-muted-foreground">
            Accesso in sola lettura tramite open banking PSD2.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg px-1 py-1">
          <Link
            href="/profilo"
            onClick={onNaviga}
            className="flex min-w-0 flex-1 items-center gap-2 rounded-lg p-1 hover:bg-sidebar-accent/60"
            data-testid="link-profilo-laterale"
          >
            <Avatar />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-medium">
                {utente ? `${utente.nome} ${utente.cognome}` : ''}
              </span>
              <span className="block truncate text-xs text-muted-foreground">{utente?.piano}</span>
            </span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground"
            onClick={esci}
            data-testid="button-esci"
            aria-label="Esci"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function Shell({
  titolo,
  sottotitolo,
  azioni,
  children,
}: {
  titolo: string;
  sottotitolo?: string;
  azioni?: ReactNode;
  children: ReactNode;
}) {
  const { tema, cambiaTema, ultimoAggiornamento, aggiorna } = useStato();
  const [apertoMobile, setApertoMobile] = useState(false);

  return (
    <div className="grid h-full grid-cols-1 md:grid-cols-[15.5rem_1fr] grid-rows-[auto_1fr] overflow-hidden bg-background">
      <aside className="hidden md:block md:row-span-2 border-r border-sidebar-border bg-sidebar overflow-y-auto [overscroll-behavior:contain]">
        <PannelloLaterale />
      </aside>

      {apertoMobile && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setApertoMobile(false)} />
          <div className="absolute inset-y-0 left-0 w-[17rem] border-r border-sidebar-border bg-sidebar">
            <button
              className="absolute right-3 top-3 rounded-md p-1.5 text-muted-foreground hover:bg-sidebar-accent"
              onClick={() => setApertoMobile(false)}
              aria-label="Chiudi menu"
            >
              <X className="h-4 w-4" />
            </button>
            <PannelloLaterale onNaviga={() => setApertoMobile(false)} />
          </div>
        </div>
      )}

      <header className="sticky top-0 z-20 flex flex-wrap items-center gap-3 border-b border-border bg-background/85 px-4 py-3 backdrop-blur sm:px-6">
        <button
          className="md:hidden rounded-md p-2 text-muted-foreground hover:bg-secondary"
          onClick={() => setApertoMobile(true)}
          aria-label="Apri menu"
          data-testid="button-menu"
        >
          <Menu className="h-4.5 w-4.5" />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base font-semibold tracking-tight sm:text-lg" data-testid="text-titolo-pagina">
            {titolo}
          </h1>
          {sottotitolo && (
            <p className="hidden truncate text-xs text-muted-foreground sm:block">{sottotitolo}</p>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {azioni}
          <Button
            variant="ghost"
            size="sm"
            className="hidden gap-1.5 text-xs text-muted-foreground sm:inline-flex"
            onClick={aggiorna}
            data-testid="button-aggiorna"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            {ultimoAggiornamento === 0 ? 'Ora' : `${ultimoAggiornamento} min`}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-muted-foreground"
            onClick={cambiaTema}
            aria-label={tema === 'dark' ? 'Passa al tema chiaro' : 'Passa al tema scuro'}
            data-testid="button-tema"
          >
            {tema === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>
      </header>

      <main className="overflow-y-auto [overscroll-behavior:contain] px-4 py-5 sm:px-6 sm:py-6">
        <div className="mx-auto w-full max-w-[76rem] pb-10">{children}</div>
      </main>
    </div>
  );
}
