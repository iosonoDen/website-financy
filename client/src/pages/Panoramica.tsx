import { useMemo, useState } from 'react';
import { Link } from 'wouter';
import { Shell } from '@/components/Shell';
import { Button } from '@/components/ui/button';
import { GrigliaWidget } from '@/components/widget/Griglia';
import { ContenutoWidget, type DatiPanoramica } from '@/components/widget/contenuti';
import { useStato } from '@/lib/stato';
import {
  OGGI,
  iso,
  liquidi,
  patrimonio,
  proiezione,
  prossimeScadenze,
  spesaVariabileMedia,
  uscitePerCategoria,
} from '@/lib/data';
import { dataLunga } from '@/lib/format';

export default function Panoramica() {
  const { conti, ricorrenze, transazioni, utente, impostazioni } = useStato();
  const [orizzonte, setOrizzonte] = useState<6 | 12>(
    impostazioni.orizzonteDefault === 6 ? 6 : 12,
  );

  const spesaVar = useMemo(
    () => impostazioni.spesaVariabileManuale || spesaVariabileMedia(transazioni),
    [transazioni, impostazioni.spesaVariabileManuale],
  );
  const prev = useMemo(
    () => proiezione(conti, ricorrenze, transazioni, { mesi: orizzonte }),
    [conti, ricorrenze, transazioni, orizzonte],
  );

  const scadenze30 = useMemo(() => prossimeScadenze(ricorrenze, OGGI, 30), [ricorrenze]);
  const uscite30 = scadenze30
    .filter((s) => s.ricorrenza.importo < 0)
    .reduce((a, s) => a + -s.ricorrenza.importo, 0);
  const entrate30 = scadenze30
    .filter((s) => s.ricorrenza.importo > 0)
    .reduce((a, s) => a + s.ricorrenza.importo, 0);

  const fineMese = iso(new Date(OGGI.getFullYear(), OGGI.getMonth() + 1, 0));
  const liquiditaOggi = liquidi(conti);
  const saldoFineMese = prev.punti.find((p) => p.data === fineMese)?.previsto ?? liquiditaOggi;

  const dati: DatiPanoramica = {
    conti,
    ricorrenze,
    transazioni,
    prev,
    orizzonte,
    setOrizzonte,
    patrimonioTotale: patrimonio(conti),
    liquiditaOggi,
    uscite30,
    entrate30,
    scadenze30,
    fineMese,
    saldoFineMese,
    spesaVar,
    categorie: useMemo(() => uscitePerCategoria(transazioni, 30), [transazioni]),
    ultime: transazioni.filter((t) => t.data <= iso(OGGI)).slice(0, 12),
    nuoveRicorrenze: ricorrenze.filter((r) => r.nuova),
  };

  return (
    <Shell
      titolo={`${impostazioni.titoloPanoramica} ${utente?.nome ?? ''}`.trim()}
      sottotitolo={`${conti.length} conti sincronizzati · ${dataLunga(iso(OGGI))}`}
      azioni={
        <Link href="/conti">
          <Button size="sm" variant="outline" className="gap-1.5 text-xs" data-testid="button-vai-conti">
            Collega conto
          </Button>
        </Link>
      }
    >
      <GrigliaWidget pagina="panoramica" rendi={(w) => <ContenutoWidget w={w} d={dati} />} />
    </Shell>
  );
}
