import { Link, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import {
  Home,
  FileText,
  Columns3,
  BarChart3,
  Settings,
  User,
  LogOut,
  ChevronDown,
  SlidersHorizontal,
  Package,
  BookOpen
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import imagoLogo from "@/assets/imago-logo-transparent.png";

export function TopNav() {
  const location = useLocation();
  const { toast } = useToast();
  const { profile, tenant, isAdmin, role, signOut } = useAuth();

  // Get user initials
  const userInitials = profile?.full_name
    ?.split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'U';

  // Filter nav links based on role (Configurações is only in the dropdown)
  const navLinks = [
    { href: "/", label: "Início", icon: Home, adminOnly: false },
    { href: "/ocorrencias", label: "Ocorrências", icon: FileText, adminOnly: false },
    { href: "/kanbans", label: "Kanbans", icon: Columns3, adminOnly: false },
    { href: "/analise", label: "Análise", icon: SlidersHorizontal, adminOnly: true },
    // Novo item Inspeções (Agrupa Dashboard e Relatórios de Chamados)
    { href: "/inspecoes", label: "Inspeções", icon: BarChart3, adminOnly: false, allowedRoles: ['admin', 'estoque'] },
    { href: "/livro", label: "Livro", icon: BookOpen, adminOnly: false },

  ].filter(link => {
    // 1. Check Admin Only
    if (link.adminOnly && !isAdmin) return false;

    // 2. Specific Role Exclusions that override allowances

    // RH exclusions
    if (role === 'rh') {
      if (link.href === '/analise') return false;
      if (link.href === '/inspecoes') return false; // RH não vê inspeções operacionais por padrão? Se quiser liberar, remova essa linha.
    }

    // Enfermagem exclusions
    if (role === 'enfermagem') {
      if (link.href === '/analise') return false;
      if (link.href === '/inspecoes') return false;
    }

    // User exclusions
    if (role === 'user') {
      if (link.href === '/livro') return false;
      if (link.href === '/analise') return false;
      if (link.href === '/inspecoes') return false;
    }

    // 3. Allowed Roles Whitelist (strongest check)
    // Se o link define allowedRoles, o usuário PRECISA ter uma delas, OU ser admin (que geralmente bypassa, mas aqui admin está incluso em allowedRoles explicitamente ou tratado em adminOnly)
    // No caso de 'inspecoes', definimos allowedRoles: ['admin', 'estoque'].
    if ((link as any).allowedRoles) {
      // Se usuário é admin, ele passa se admin estiver na lista ou se adminOnly for true (já checado acima).
      // Mas vamos seguir a lista estrita:
      const allowed = (link as any).allowedRoles;
      if (!allowed.includes(role || '')) {
        // Se não tiver a role exata, bloqueia. (A menos que seja admin e adminOnly=true tratou antes, mas aqui adminOnly=false para inspecoes)
        if (isAdmin && allowed.includes('admin')) return true;
        return false;
      }
    }

    return true;
  });

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <header className="relative">
      {/* Top colored line */}
      <div className="h-1 bg-gradient-to-r from-[#3b5998] via-[#5b7fc3] to-[#8b5cf6]" />

      {/* Main header container */}
      <div className="bg-white border border-border/40 rounded-b-2xl shadow-sm mb-2">
        <div className="flex h-[76px] items-center justify-between px-10">
          {/* Left: Logo */}
          <div className="flex items-center flex-shrink-0">
            <Link to="/" className="flex items-center">
              <img
                src={imagoLogo}
                alt="Sistema de ocorrências"
                className="h-10 w-auto object-contain scale-[1.8] origin-left ml-2"
              />
            </Link>
          </div>

          {/* Center: Navigation Links - shifted right */}
          <nav className="hidden lg:flex items-center gap-1 ml-24">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.href || (link.href === '/inspecoes' && (location.pathname.includes('/dashboard/chamados') || location.pathname.includes('/relatorios/chamados')));

              // Lógica Especial para Inspeções (Dropdown)
              if (link.label === "Inspeções") {
                return (
                  <DropdownMenu key="inspecoes-menu">
                    <DropdownMenuTrigger
                      className={cn(
                        "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors focus:outline-none",
                        isActive
                          ? "bg-[#dbeafe] text-[#2563eb]"
                          : "text-[#64748b] hover:bg-gray-100 hover:text-[#475569]"
                      )}
                    >
                      <link.icon className="h-4 w-4" />
                      {link.label}
                      <ChevronDown className="h-3 w-3 ml-1 opacity-50" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuItem asChild>
                        <Link to="/dashboard/chamados" className="cursor-pointer">
                          <BarChart3 className="h-4 w-4 mr-2" />
                          Dashboard
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/relatorios/chamados" className="cursor-pointer">
                          <FileText className="h-4 w-4 mr-2" />
                          Relatórios
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                );
              }

              if ((link as any).isMock) {
                return (
                  <button
                    key={link.label}
                    onClick={() => {
                      toast({
                        title: "Em construção...",
                        description: "Esta funcionalidade estará disponível em breve.",
                      });
                    }}
                    className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors text-[#64748b] hover:bg-gray-100 hover:text-[#475569]"
                  >
                    <link.icon className="h-4 w-4" />
                    {link.label}
                  </button>
                );
              }

              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className={cn(
                    "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-[#dbeafe] text-[#2563eb]"
                      : "text-[#64748b] hover:bg-gray-100 hover:text-[#475569]"
                  )}
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right: User Avatar with Dropdown */}
          <div className="flex items-center">
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 rounded-full p-1 transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name} />
                  <AvatarFallback className="bg-[#1e3a5f] text-white text-sm font-semibold">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <ChevronDown className="h-4 w-4 text-[#64748b]" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="flex items-center gap-2 p-2">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name} />
                    <AvatarFallback className="bg-[#1e3a5f] text-white text-sm font-semibold">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{profile?.full_name}</span>
                    <span className="text-xs text-muted-foreground">{tenant?.name}</span>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/perfil" className="flex items-center gap-2 cursor-pointer">
                    <User className="h-4 w-4" />
                    Meu Perfil
                  </Link>
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link to="/configuracoes" className="flex items-center gap-2 cursor-pointer">
                      <Settings className="h-4 w-4" />
                      Configurações
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-destructive cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Mobile Navigation */}
        <nav className="flex lg:hidden items-center gap-1 px-4 pb-3 overflow-x-auto">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.href;
            return (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  "flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-[#dbeafe] text-[#2563eb]"
                    : "text-[#64748b] hover:bg-gray-100 hover:text-[#475569]"
                )}
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
