import { Outlet, createRootRoute, useRouterState } from "@tanstack/react-router";
import { ThemeProvider } from "../components/ThemeProvider";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { MetaTags } from "../components/MetaTags";
import { ToastProvider } from "../components/ui/toast";
import { TooltipProvider } from "../components/ui/tooltip";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  const router = useRouterState();
  const path = router.location.pathname;
  const isLanding = path === "/";

  return (
    <ThemeProvider defaultTheme="light" storageKey="dock-dploy-theme">
      <ToastProvider>
        <TooltipProvider>
          <MetaTags />
          <div className="app-root">
            <Header />
            <main className="app-main">
              <Outlet />
            </main>
            {isLanding && <Footer />}
          </div>
        </TooltipProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
