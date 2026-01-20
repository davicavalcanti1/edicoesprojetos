import { useNavigate } from "react-router-dom";
import { Plus, Briefcase } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import RHDashboard from "./RHDashboard";

export default function Index() {
  const navigate = useNavigate();
  const { role } = useAuth();

  // No automatic redirect for RH anymore, they see the specific button
  // if (role === 'rh') {
  //   return <RHDashboard />;
  // }

  return (
    <MainLayout>
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">
            Painel de Ação
          </h1>
          <p className="mt-2 text-muted-foreground">
            Registre e acompanhe ocorrências para garantir a qualidade e
            segurança dos processos da clínica.
          </p>
        </div>

        {/* Botões de Ação */}
        <section className="mb-10 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150">
          <div className="flex flex-col gap-6">
            {/* Ocorrência de Revisão de Laudo - Visible for Admin and User (Doctors/Techs) */}
            {(role === 'admin' || role === 'user') && (
              <Button
                onClick={() => navigate("/ocorrencias/nova/assistencial/revisao_exame")}
                size="lg"
                className="w-full h-24 text-lg gap-3 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 shadow-lg transition-all hover:scale-[1.01]"
              >
                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-white/20">
                  <Plus className="h-6 w-6" />
                </div>
                <div className="flex flex-col items-start text-left">
                  <span className="font-bold text-xl">Ocorrência de Revisão de Laudo</span>
                  <span className="text-sm font-normal text-white/80">Registrar nova solicitação</span>
                </div>
              </Button>
            )}

            {/* Ocorrência de Enfermagem - Visible for Admin, User, and Enfermagem */}
            {(role === 'admin' || role === 'user' || role === 'enfermagem') && (
              <Button
                onClick={() => navigate("/ocorrencias/nova/enfermagem")}
                size="lg"
                className="w-full h-24 text-lg gap-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-600/90 hover:to-teal-600/90 shadow-lg transition-all hover:scale-[1.01]"
              >
                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-white/20">
                  <Plus className="h-6 w-6" />
                </div>
                <div className="flex flex-col items-start text-left">
                  <span className="font-bold text-xl">Ocorrência de Enfermagem</span>
                  <span className="text-sm font-normal text-white/80">Registrar extravasamento ou reação</span>
                </div>
              </Button>
            )}

            {/* Ocorrência Administrativa - Visible for Admin and RH */}
            {(role === 'admin' || role === 'rh') && (
              <Button
                onClick={() => navigate("/ocorrencias/nova/administrativa")}
                size="lg"
                className="w-full h-24 text-lg gap-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-500/90 hover:to-yellow-500/90 shadow-lg transition-all hover:scale-[1.01]"
              >
                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-white/20">
                  <Briefcase className="h-6 w-6" />
                </div>
                <div className="flex flex-col items-start text-left">
                  <span className="font-bold text-xl">Ocorrência Administrativa</span>
                  <span className="text-sm font-normal text-white/80">Registrar ocorrência RH</span>
                </div>
              </Button>
            )}

            {/* Ocorrência Livre - Visible for All (or restricted if needed) */}
            <Button
              onClick={() => navigate("/ocorrencias/nova-livre")}
              size="lg"
              className="w-full h-24 text-lg gap-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-600/90 hover:to-indigo-600/90 shadow-lg transition-all hover:scale-[1.01]"
            >
              <div className="flex items-center justify-center h-12 w-12 rounded-full bg-white/20">
                <div className="h-6 w-6 text-white flex items-center justify-center font-bold">L</div>
              </div>
              <div className="flex flex-col items-start text-left">
                <span className="font-bold text-xl">Ocorrência Livre</span>
                <span className="text-sm font-normal text-white/80">Registro manual flexível</span>
              </div>
            </Button>

          </div>
        </section>
      </div>
    </MainLayout>
  );
}
