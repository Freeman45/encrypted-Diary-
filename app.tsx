import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";

/**
 * Encrypted Diary App - Main Application Component
 * Design Philosophy: Warm Minimalism with Organic Curves
 * 
 * Color Palette:
 * - Background: Warm cream (#F5F1E8)
 * - Foreground: Dark taupe (#3D3D3D)
 * - Accent: Warm terracotta (#D97757)
 * - Secondary: Soft sage (#A8B8A8)
 * 
 * Typography:
 * - Headlines: Playfair Display (serif, 700 weight)
 * - Body: Lato (sans-serif, 400 weight)
 */

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
