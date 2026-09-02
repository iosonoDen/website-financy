import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { euro } from '@/lib/format';

export function Sigla({ sigla, hue, className }: { sigla: string; hue: number; className?: string }) {
  return (
    <span
      className={cn(
        'sigla inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[0.6875rem] font-semibold tracking-tight',
        className,
      )}
      style={{ ['--sig-h' as string]: hue }}
    >
      {sigla}
    </span>
  );
}

export function Delta({ valore, suffisso = '' }: { valore: number; suffisso?: string }) {
  const neutro = Math.abs(valore) < 0.01;
  const su = valore > 0;
  const Icona = neutro ? Minus : su ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-xs font-medium num',
        neutro ? 'text-muted-foreground' : su ? 'text-primary' : 'text-destructive',
      )}
    >
      <Icona className="h-3.5 w-3.5" strokeWidth={2.4} />
      {su && !neutro ? '+' : ''}
      {Math.abs(valore) >= 1000 || suffisso === '' ? euro(valore) : `${valore.toFixed(1)}${suffisso}`}
    </span>
  );
}

export function CartaKpi({
  etichetta,
  valore,
  nota,
  extra,
  accento = false,
}: {
  etichetta: string;
  valore: string;
  nota?: string;
  extra?: React.ReactNode;
  accento?: boolean;
}) {
  return (
    <div
      className={cn(
        'rounded-xl border bg-card p-4 sm:p-5',
        accento && 'border-primary/25 bg-primary/[0.04]',
      )}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{etichetta}</p>
      <p className="mt-2 text-lg font-semibold num leading-tight">{valore}</p>
      <div className="mt-1.5 flex items-center gap-2">
        {extra}
        {nota && <span className="text-xs text-muted-foreground">{nota}</span>}
      </div>
    </div>
  );
}

export function TargaCategoria({ categoria }: { categoria: string }) {
  return (
    <span className="inline-flex items-center rounded-md border border-border bg-secondary/60 px-2 py-0.5 text-xs text-muted-foreground whitespace-nowrap">
      {categoria}
    </span>
  );
}

export function Barra({ valore, hue = 164 }: { valore: number; hue?: number }) {
  return (
    <span className="inline-block h-1.5 w-full overflow-hidden rounded-full bg-secondary">
      <span
        className="barra block h-full rounded-full"
        style={{ width: `${Math.max(2, Math.min(100, valore * 100))}%`, ['--sig-h' as string]: hue }}
      />
    </span>
  );
}
