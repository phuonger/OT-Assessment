import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch, Router as WouterRouter } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";

/**
 * Use hash-based routing (e.g., /#/path) so the app works correctly
 * both in the browser and when loaded via file:// in Electron.
 * With file:// protocol, the pathname is the filesystem path, not "/",
 * which breaks standard path-based routing.
 */

function AppRouter() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      {/* Catch-all: render Home instead of NotFound to avoid double-screen issue */}
      <Route>
        <Home />
      </Route>
    </Switch>
  );
}

function App() {
  // Detect if running in Electron (file:// protocol)
  const isElectron = typeof window !== 'undefined' && (
    window.location.protocol === 'file:' ||
    (window as any).electronAPI !== undefined
  );

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          {isElectron ? (
            <WouterRouter hook={useHashLocation}>
              <AppRouter />
            </WouterRouter>
          ) : (
            <AppRouter />
          )}
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
