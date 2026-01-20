import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2, Mail, Lock, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import imagoLogo from "@/assets/imago-logo.png";
import imagoLoginCover from "@/assets/imago-login-cover.png";

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

const resetSchema = z.object({
  email: z.string().email("Email inválido"),
});

type LoginFormData = z.infer<typeof loginSchema>;
type ResetFormData = z.infer<typeof resetSchema>;

type AuthMode = "login" | "reset";

export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { signIn, requestPasswordReset } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState<AuthMode>("login");

  const from = location.state?.from?.pathname || "/";

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const resetForm = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
    defaultValues: { email: "" },
  });

  const onLogin = async (data: LoginFormData) => {
    setIsLoading(true);
    const { error } = await signIn(data.email, data.password);

    if (error) {
      toast({
        title: "Erro ao fazer login",
        description: error.message,
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    toast({
      title: "Bem-vindo!",
      description: "Login realizado com sucesso.",
    });

    navigate(from, { replace: true });
    setIsLoading(false);
  };

  const onResetPassword = async (data: ResetFormData) => {
    setIsLoading(true);
    const { error } = await requestPasswordReset(data.email);

    if (error) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    toast({
      title: "Email enviado",
      description: "Verifique seu email para redefinir sua senha.",
    });
    setMode("login");
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-background">
      {/* Background with building image and sophisticated overlay */}
      <div className="absolute inset-0 z-0 select-none">
        <img
          src={imagoLoginCover}
          alt="Background cover"
          className="w-full h-full object-cover opacity-20 lg:opacity-30 transition-opacity duration-1000"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background/60 to-background/95" />
        <div className="absolute inset-0 backdrop-blur-[2px]" />
      </div>

      {/* Auth Card - Modern Glassmorphism */}
      <div className="z-10 w-full max-w-[1000px] min-h-[600px] grid lg:grid-cols-2 bg-card/60 backdrop-blur-2xl border border-white/20 shadow-[-20px_20px_60px_rgba(0,0,0,0.1),20px_-20px_60px_rgba(255,255,255,0.05)] rounded-[2.5rem] overflow-hidden animate-in fade-in zoom-in duration-1000">

        {/* Visual Side (Left) - Only on Desktop */}
        <div className="hidden lg:flex flex-col justify-between p-16 bg-gradient-to-br from-primary/5 to-transparent relative overflow-hidden border-r border-white/10 text-white">
          <div className="absolute -top-24 -left-24 h-96 w-96 bg-primary/20 blur-[100px] rounded-full animate-pulse" />

          <div className="relative z-10 transition-transform duration-700 hover:scale-105">
            <img
              src={imagoLogo}
              alt="Imago Logo"
              className="w-48 h-auto object-contain drop-shadow-md"
            />
          </div>

          <div className="relative z-10 space-y-6">
            <div className="space-y-2">
              <h1 className="text-4xl xl:text-5xl font-extrabold text-[#111827] leading-tight tracking-tight">
                Sistema de Gestão <br />
                <span className="text-primary italic">de Ocorrências</span>
              </h1>
              <div className="h-1.5 w-20 bg-primary rounded-full" />
            </div>
            <p className="text-lg xl:text-xl text-muted-foreground font-medium max-w-xs">
              Excelência e segurança em cada diagnóstico por imagem.
            </p>
          </div>
        </div>

        {/* Form Side (Right) */}
        <div className="flex flex-col justify-center p-8 lg:p-14 bg-white/40">
          {/* Mobile Logo Only */}
          <div className="lg:hidden flex items-center justify-center mb-10">
            <img
              src={imagoLogo}
              alt="Imago Logo"
              className="h-14 w-auto object-contain"
            />
          </div>

          <div className="text-left mb-10">
            <h2 className="text-3xl font-bold text-foreground tracking-tight">
              {mode === "login" && "Bem-vindo"}
              {mode === "reset" && "Recuperar Conta"}
            </h2>
            <p className="text-muted-foreground mt-3 text-lg">
              {mode === "login" && "Entre com suas credenciais para continuar."}
              {mode === "reset" && "Enviaremos um link de acesso ao seu e-mail."}
            </p>
          </div>

          {mode === "login" && (
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-6">
                <FormField
                  control={loginForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground/80 font-semibold ml-1">Email Corporativo</FormLabel>
                      <FormControl>
                        <div className="group relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
                          <Input
                            {...field}
                            type="email"
                            placeholder="exemplo@imago.com.br"
                            className="pl-12 h-14 bg-white/70 border-white/30 focus:bg-white focus:border-primary transition-all text-lg rounded-xl shadow-sm"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={loginForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between ml-1">
                        <FormLabel className="text-foreground/80 font-semibold">Sua Senha</FormLabel>
                        <button
                          type="button"
                          onClick={() => setMode("reset")}
                          className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                        >
                          Esqueceu?
                        </button>
                      </div>
                      <FormControl>
                        <div className="group relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
                          <Input
                            {...field}
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            className="pl-12 pr-12 h-14 bg-white/70 border-white/30 focus:bg-white focus:border-primary transition-all text-lg rounded-xl shadow-sm"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                          >
                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full h-14 text-lg font-bold rounded-xl shadow-[0_10px_15px_-3px_rgba(50,92,147,0.3)] hover:shadow-[0_20px_25px_-5px_rgba(50,92,147,0.4)] transition-all hover:-translate-y-0.5"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                      Autenticando...
                    </>
                  ) : (
                    <>
                      Acessar Sistema
                      <ArrowRight className="h-5 w-5 ml-3" />
                    </>
                  )}
                </Button>
              </form>
            </Form>
          )}

          {mode === "reset" && (
            <Form {...resetForm}>
              <form onSubmit={resetForm.handleSubmit(onResetPassword)} className="space-y-6">
                <FormField
                  control={resetForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground/80 font-semibold ml-1">Email</FormLabel>
                      <FormControl>
                        <div className="group relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
                          <Input
                            {...field}
                            type="email"
                            placeholder="seu@email.com"
                            className="pl-12 h-14 bg-white/70 border-white/30 focus:bg-white focus:border-primary transition-all text-lg rounded-xl shadow-sm"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full h-14 text-lg font-bold rounded-xl" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    "Enviar Link de Redefinição"
                  )}
                </Button>

                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className="w-full text-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                >
                  Voltar ao login
                </button>
              </form>
            </Form>
          )}
        </div>
      </div>
    </div>
  );
}
