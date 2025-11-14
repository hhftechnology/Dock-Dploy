import {Outlet, createRootRoute} from '@tanstack/react-router'
import {ThemeProvider} from "../components/ThemeProvider";
import {Header} from "../components/Header";
import {Footer} from "../components/Footer";

export const Route = createRootRoute({
    component: () => (
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
            <div className="flex min-h-screen flex-col">
                <Header />
                <main className="flex-1">
                    <Outlet/>
                </main>
                <Footer />
            </div>
        </ThemeProvider>
    ),
})