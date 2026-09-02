// Base URL delle API: in sviluppo è lo stesso server, in anteprima viene riscritta al deploy.
const SEGNAPOSTO = '__PORT_5000__';
export const BASE = SEGNAPOSTO.startsWith('__') ? '' : SEGNAPOSTO;

export class ErroreApi extends Error {
  stato: number;
  constructor(messaggio: string, stato: number) {
    super(messaggio);
    this.stato = stato;
  }
}

let tokenCorrente: string | null = null;
export const impostaToken = (t: string | null) => {
  tokenCorrente = t;
};

export async function api<T = any>(percorso: string, opzioni: { metodo?: string; corpo?: unknown } = {}): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (tokenCorrente) headers.Authorization = `Bearer ${tokenCorrente}`;
  let risposta: Response;
  try {
    risposta = await fetch(`${BASE}/api${percorso}`, {
      method: opzioni.metodo ?? 'GET',
      headers,
      body: opzioni.corpo === undefined ? undefined : JSON.stringify(opzioni.corpo),
    });
  } catch {
    throw new ErroreApi('Server non raggiungibile. Riprova fra qualche istante.', 0);
  }
  const testo = await risposta.text();
  const dati = testo ? (() => { try { return JSON.parse(testo); } catch { return {}; } })() : {};
  if (!risposta.ok) throw new ErroreApi(dati.messaggio ?? 'Operazione non riuscita.', risposta.status);
  return dati as T;
}
