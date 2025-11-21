import {Outlet, createRootRoute, useRouterState} from '@tanstack/react-router'
import {ThemeProvider} from "../components/ThemeProvider";
import {Header} from "../components/Header";
import {Footer} from "../components/Footer";
import {MetaTags} from "../components/MetaTags";
import {ToastProvider} from "../components/ui/toast";
import {TooltipProvider} from "../components/ui/tooltip";

export const Route = createRootRoute({
    component: RootComponent,
})

function RootComponent() {
    const router = useRouterState();
    const isIndexPage = router.location.pathname === '/';

    return (
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
            <ToastProvider>
                <TooltipProvider>
                    <MetaTags />
                    <div className="flex min-h-screen flex-col">
                        <Header />
                        <main className="flex-1">
                            <Outlet/>
                        </main>
                        {isIndexPage && <Footer />}
                    </div>
                </TooltipProvider>
            </ToastProvider>
        </ThemeProvider>
    );
}