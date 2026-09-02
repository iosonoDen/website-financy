import { Link } from 'wouter';
import { AlertCircle } from 'lucide-react';
import { Marchio } from '@/components/Logo';

export default function NotFound() {
  return (
    <div className="flex min-h-full w-full items-center justify-center bg-background p-6">
      <div className="w-full max-w-md rounded-xl border bg-card p-6">
        <Marchio className="h-7 w-7 text-foreground" />
        <div className="mt-5 flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-lg font-semibold">Pagina non trovata</h1>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          La sezione che cerchi non esiste in questo prototipo.
        </p>
        <Link
          href="/panoramica"
          className="mt-5 inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          data-testid="link-panoramica"
        >
          Torna alla panoramica
        </Link>
      </div>
    </div>
  );
}
