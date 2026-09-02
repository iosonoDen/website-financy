import { Switch, Route, Router } from 'wouter';
import { useHashLocation } from 'wouter/use-hash-location';
import { queryClient } from './lib/queryClient';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import Accesso from '@/pages/Accesso';
import Panoramica from '@/pages/Panoramica';
import Conti from '@/pages/Conti';
import Transazioni from '@/pages/Transazioni';
import Previsioni from '@/pages/Previsioni';
import Profilo from '@/pages/Profilo';
import Admin from '@/pages/Admin';
import { ProviderStato, useStato } from '@/lib/stato';

function AppRouter() {
  const { autenticato, pronto } = useStato();

  if (!pronto) return <div className="h-full w-full bg-background" />;
  if (!autenticato) return <Accesso />;

  return (
    <Switch>
      <Route path="/" component={Panoramica} />
      <Route path="/panoramica" component={Panoramica} />
      <Route path="/conti" component={Conti} />
      <Route path="/transazioni" component={Transazioni} />
      <Route path="/previsioni" component={Previsioni} />
      <Route path="/profilo" component={Profilo} />
      <Route path="/admin" component={Admin} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ProviderStato>
        <TooltipProvider>
          <Toaster />
          <Router hook={useHashLocation}>
            <AppRouter />
          </Router>
        </TooltipProvider>
      </ProviderStato>
    </QueryClientProvider>
  );
}

export default App;
