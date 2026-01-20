import { TopNav } from "./TopNav";
import imagoLoginCover from "@/assets/imago-login-cover.png";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden font-sans antialiased">
      {/* Global Background */}
      <div className="fixed inset-0 z-0 select-none pointer-events-none">
        <img
          src={imagoLoginCover}
          alt="Background"
          className="w-full h-full object-cover opacity-[0.08]"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background/80 to-background/95" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <TopNav />
        <main className="container px-4 py-6 md:px-6 md:py-8 flex-1 animate-fade-in">
          {children}
        </main>
        <footer className="py-4 text-center text-xs text-muted-foreground border-t bg-background/50 backdrop-blur-sm">
          Imago 2026 Productions Version 1.1
        </footer>
      </div>
    </div>
  );
}
