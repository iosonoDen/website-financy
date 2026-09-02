import { useRef, useState } from 'react';
import { AlertCircle, Camera, KeyRound, Loader2, Lock, Mail, ShieldCheck, Trash2, UserRound } from 'lucide-react';
import { Shell, Avatar } from '@/components/Shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useStato, type Utente } from '@/lib/stato';
import { api } from '@/lib/api';

type Modale = null | 'nome' | 'email' | 'password' | 'foto';

/** Riduce l'immagine scelta a un quadrato di 256px per non appesantire il database. */
function ridimensiona(file: File): Promise<string> {
  return new Promise((risolvi, rifiuta) => {
    const lettore = new FileReader();
    lettore.onerror = () => rifiuta(new Error('Impossibile leggere il file.'));
    lettore.onload = () => {
      const img = new Image();
      img.onerror = () => rifiuta(new Error('Formato immagine non supportato.'));
      img.onload = () => {
        const lato = Math.min(img.width, img.height);
        const c = document.createElement('canvas');
        c.width = 256;
        c.height = 256;
        const ctx = c.getContext('2d');
        if (!ctx) return rifiuta(new Error('Elaborazione non disponibile.'));
        ctx.drawImage(img, (img.width - lato) / 2, (img.height - lato) / 2, lato, lato, 0, 0, 256, 256);
        risolvi(c.toDataURL('image/jpeg', 0.85));
      };
      img.src = String(lettore.result);
    };
    lettore.readAsDataURL(file);
  });
}

function Riga({
  icona: Icona,
  etichetta,
  valore,
  azione,
  testid,
}: {
  icona: typeof UserRound;
  etichetta: string;
  valore: string;
  azione: () => void;
  testid: string;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-border/60 px-4 py-3.5 last:border-0">
      <Icona className="h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{etichetta}</p>
        <p className="truncate text-sm font-medium">{valore}</p>
      </div>
      <Button variant="outline" size="sm" onClick={azione} data-testid={testid}>
        Modifica
      </Button>
    </div>
  );
}

export default function Profilo() {
  const { utente, aggiornaUtente, impostazioni, tema, cambiaTema, conti } = useStato();
  const { toast } = useToast();
  const [modale, setModale] = useState<Modale>(null);
  const [password, setPassword] = useState('');
  const [errore, setErrore] = useState('');
  const [inCorso, setInCorso] = useState(false);

  const [nome, setNome] = useState(utente?.nome ?? '');
  const [cognome, setCognome] = useState(utente?.cognome ?? '');
  const [email, setEmail] = useState(utente?.email ?? '');
  const [nuovaPassword, setNuovaPassword] = useState('');
  const [ripetiPassword, setRipetiPassword] = useState('');
  const [anteprima, setAnteprima] = useState<string | null>(null);
  const inputFile = useRef<HTMLInputElement>(null);

  if (!utente) return null;

  function apri(m: Modale) {
    setErrore('');
    setPassword('');
    setNuovaPassword('');
    setRipetiPassword('');
    setAnteprima(null);
    setNome(utente!.nome);
    setCognome(utente!.cognome);
    setEmail(utente!.email);
    setModale(m);
  }

  async function conferma() {
    if (!password) return setErrore('Inserisci la password per confermare.');
    setErrore('');
    setInCorso(true);
    try {
      if (modale === 'nome') {
        const d = await api<{ utente: Utente; messaggio: string }>('/profilo', {
          metodo: 'PATCH',
          corpo: { password, nome, cognome },
        });
        aggiornaUtente(d.utente);
        toast({ description: d.messaggio });
      } else if (modale === 'email') {
        const d = await api<{ utente: Utente; messaggio: string }>('/profilo', {
          metodo: 'PATCH',
          corpo: { password, email },
        });
        aggiornaUtente(d.utente);
        toast({ description: 'Indirizzo email aggiornato.' });
      } else if (modale === 'password') {
        if (nuovaPassword !== ripetiPassword) {
          setInCorso(false);
          return setErrore('Le due nuove password non coincidono.');
        }
        const d = await api<{ messaggio: string }>('/profilo/password', {
          metodo: 'POST',
          corpo: { password, nuovaPassword },
        });
        toast({ description: d.messaggio });
      } else if (modale === 'foto') {
        if (!anteprima && !utente!.avatar) {
          setInCorso(false);
          return setErrore('Scegli prima un’immagine.');
        }
        const d = await api<{ utente: Utente; messaggio: string }>('/profilo/avatar', {
          metodo: 'POST',
          corpo: { password, avatar: anteprima },
        });
        aggiornaUtente(d.utente);
        toast({ description: d.messaggio });
      }
      setModale(null);
    } catch (e: any) {
      setErrore(e?.message ?? 'Operazione non riuscita.');
    } finally {
      setInCorso(false);
    }
  }

  const titoli: Record<Exclude<Modale, null>, string> = {
    nome: 'Modifica nome e cognome',
    email: 'Modifica indirizzo email',
    password: 'Cambia password',
    foto: 'Immagine del profilo',
  };

  return (
    <Shell titolo="Profilo" sottotitolo="Dati dell'account, credenziali e immagine">
      <div className="grid gap-3 lg:grid-cols-[1fr_20rem] lg:items-start">
        <section className="overflow-hidden rounded-xl border bg-card">
          <div className="flex items-center gap-4 border-b border-border/60 px-4 py-5">
            <div className="relative">
              <Avatar className="h-16 w-16 text-lg" />
              <button
                onClick={() => apri('foto')}
                className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-sm hover:text-foreground"
                aria-label="Cambia immagine del profilo"
                data-testid="button-cambia-foto"
              >
                <Camera className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="min-w-0">
              <p className="truncate text-base font-semibold" data-testid="text-nome-completo">
                {utente.nome} {utente.cognome}
              </p>
              <p className="truncate text-sm text-muted-foreground" data-testid="text-email-profilo">
                {utente.email}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <span className="rounded-md bg-secondary px-2 py-0.5 text-xs">{utente.piano}</span>
                <span className="rounded-md bg-primary/12 px-2 py-0.5 text-xs font-medium text-primary">
                  {utente.ruolo === 'admin' ? 'Amministratore' : 'Utente'}
                </span>
              </div>
            </div>
          </div>

          <Riga
            icona={UserRound}
            etichetta="Nome e cognome"
            valore={`${utente.nome} ${utente.cognome}`}
            azione={() => apri('nome')}
            testid="button-modifica-nome"
          />
          <Riga
            icona={Mail}
            etichetta="Email di accesso"
            valore={utente.email}
            azione={() => apri('email')}
            testid="button-modifica-email"
          />
          <Riga
            icona={KeyRound}
            etichetta="Password"
            valore="••••••••••"
            azione={() => apri('password')}
            testid="button-modifica-password"
          />
          <Riga
            icona={Camera}
            etichetta="Immagine del profilo"
            valore={utente.avatar ? 'Immagine personalizzata' : 'Iniziali'}
            azione={() => apri('foto')}
            testid="button-modifica-foto"
          />
        </section>

        <aside className="space-y-3">
          <div className="rounded-xl border bg-card p-4">
            <p className="flex items-center gap-2 text-sm font-medium">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Sicurezza
            </p>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Ogni modifica al profilo richiede la conferma della password attuale. Le password sono salvate solo come
              hash scrypt con sale casuale: nemmeno {impostazioni.nomeApp} può leggerle.
            </p>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Cambiando password tutte le altre sessioni attive vengono chiuse.
            </p>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <p className="text-sm font-medium">Preferenze</p>
            <div className="mt-3 flex items-center justify-between">
              <div>
                <p className="text-xs">Tema scuro</p>
                <p className="text-xs text-muted-foreground">Vale per questa sessione.</p>
              </div>
              <Switch checked={tema === 'dark'} onCheckedChange={cambiaTema} data-testid="switch-tema-profilo" />
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3">
              <p className="text-xs">Conti collegati</p>
              <p className="num text-sm">{conti.length}</p>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-4">
            <p className="text-xs text-muted-foreground">Account creato il</p>
            <p className="mt-1 text-sm num">{new Date(utente.creatoIl).toLocaleDateString('it-IT')}</p>
            <p className="mt-3 text-xs text-muted-foreground">Identificativo</p>
            <p className="mt-1 text-sm num">{utente.id}</p>
          </div>
        </aside>
      </div>

      <Dialog open={modale !== null} onOpenChange={(v) => !v && setModale(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{modale ? titoli[modale] : ''}</DialogTitle>
            <DialogDescription>
              Per motivi di sicurezza conferma la modifica con la tua password attuale.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {modale === 'nome' && (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="p-nome" className="text-xs">
                    Nome
                  </Label>
                  <Input id="p-nome" value={nome} onChange={(e) => setNome(e.target.value)} data-testid="input-nome" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="p-cognome" className="text-xs">
                    Cognome
                  </Label>
                  <Input
                    id="p-cognome"
                    value={cognome}
                    onChange={(e) => setCognome(e.target.value)}
                    data-testid="input-cognome"
                  />
                </div>
              </div>
            )}

            {modale === 'email' && (
              <div className="space-y-1.5">
                <Label htmlFor="p-email" className="text-xs">
                  Nuova email
                </Label>
                <Input
                  id="p-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  data-testid="input-nuova-email"
                />
              </div>
            )}

            {modale === 'password' && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="p-nuova" className="text-xs">
                    Nuova password
                  </Label>
                  <Input
                    id="p-nuova"
                    type="password"
                    value={nuovaPassword}
                    onChange={(e) => setNuovaPassword(e.target.value)}
                    data-testid="input-nuova-password"
                  />
                  <p className="text-xs text-muted-foreground">Almeno 8 caratteri.</p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="p-ripeti" className="text-xs">
                    Ripeti la nuova password
                  </Label>
                  <Input
                    id="p-ripeti"
                    type="password"
                    value={ripetiPassword}
                    onChange={(e) => setRipetiPassword(e.target.value)}
                    data-testid="input-ripeti-password"
                  />
                </div>
              </>
            )}

            {modale === 'foto' && (
              <div className="flex items-center gap-4">
                {anteprima ? (
                  <img src={anteprima} alt="Anteprima" className="h-16 w-16 rounded-full object-cover" />
                ) : (
                  <Avatar className="h-16 w-16 text-base" />
                )}
                <div className="space-y-2">
                  <input
                    ref={inputFile}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    data-testid="input-file-avatar"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      try {
                        setAnteprima(await ridimensiona(f));
                        setErrore('');
                      } catch (err: any) {
                        setErrore(err?.message ?? 'Immagine non valida.');
                      }
                    }}
                  />
                  <Button variant="outline" size="sm" onClick={() => inputFile.current?.click()} data-testid="button-scegli-file">
                    Scegli immagine
                  </Button>
                  {utente.avatar && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1.5 text-destructive"
                      onClick={() => setAnteprima(null)}
                      data-testid="button-rimuovi-foto"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Rimuovi immagine attuale
                    </Button>
                  )}
                  <p className="text-xs text-muted-foreground">JPG o PNG, ritagliata automaticamente a 256×256.</p>
                </div>
              </div>
            )}

            <div className="space-y-1.5 rounded-lg bg-secondary/60 p-3">
              <Label htmlFor="p-conferma" className="flex items-center gap-1.5 text-xs">
                <Lock className="h-3.5 w-3.5" />
                Password attuale
              </Label>
              <Input
                id="p-conferma"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                data-testid="input-conferma-password"
              />
            </div>

            {errore && (
              <p className="flex items-center gap-2 text-xs text-destructive" role="alert" data-testid="text-errore-modale">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {errore}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setModale(null)} data-testid="button-annulla">
              Annulla
            </Button>
            <Button onClick={conferma} disabled={inCorso} className="gap-2" data-testid="button-conferma">
              {inCorso && <Loader2 className="h-4 w-4 animate-spin" />}
              Conferma modifica
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Shell>
  );
}
