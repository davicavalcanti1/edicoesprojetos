import imagoLogo from "@/assets/imago-logo-transparent.png";
import imagoLoginCover from "@/assets/imago-login-cover.png";

interface SimpleLayoutProps {
    children: React.ReactNode;
    title?: string;
    subtitle?: string;
}

export function SimpleLayout({ children, title, subtitle }: SimpleLayoutProps) {
    return (
        <div className="min-h-screen bg-background relative overflow-x-hidden font-sans antialiased flex flex-col">
            {/* Global Background (Same as MainLayout) */}
            <div className="fixed inset-0 z-0 select-none pointer-events-none">
                <img
                    src={imagoLoginCover}
                    alt="Background"
                    className="w-full h-full object-cover opacity-[0.08]"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background/80 to-background/95" />
            </div>

            {/* Header */}
            <header className="relative z-10 w-full border-b border-white/40 bg-white/70 backdrop-blur-md shadow-sm">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img src={imagoLogo} alt="IMAGO" className="h-10 w-auto" />
                        <div>
                            <h1 className="font-semibold text-foreground text-lg leading-tight">
                                {title || "Solicitação de Serviço"}
                            </h1>
                            {subtitle && (
                                <p className="text-xs text-muted-foreground hidden sm:block">
                                    {subtitle}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="relative z-10 flex-1 container mx-auto px-4 py-8 max-w-lg animate-fade-in">
                {children}
            </main>

            {/* Footer */}
            <footer className="relative z-10 py-6 text-center text-xs text-muted-foreground border-t border-white/20 bg-white/40 backdrop-blur-md">
                <p>Imago Radiologia - Sistema Operacional</p>
            </footer>
        </div>
    );
}
