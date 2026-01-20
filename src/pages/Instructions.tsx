import { FileText, User, Send, CheckCircle, Info, Stethoscope, AlertTriangle } from "lucide-react";
import imagoLogo from "@/assets/imago-logo-transparent.png";
import imagoLoginCover from "@/assets/imago-login-cover.png";
import { Button } from "@/components/ui/button";


export default function Instructions() {
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

            {/* Header */}
            <header className="sticky top-0 z-50 w-full border-b border-white/40 bg-white/70 backdrop-blur-md shadow-sm">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img src={imagoLogo} alt="IMAGO" className="h-10 w-auto" />
                        <div className="hidden sm:block">
                            <h1 className="font-semibold text-foreground text-lg">
                                Manual do Médico
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                Instruções de Uso do Portal
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm bg-primary/10 px-3 py-1.5 rounded-full">
                        <Info className="h-4 w-4 text-primary" />
                        <span className="font-medium text-primary">Ajuda & Instruções</span>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8 max-w-4xl relative z-10 animate-fade-in">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-foreground mb-4">Como funciona a Revisão de Laudo?</h1>
                    <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
                        Este guia explica como utilizar o portal de ocorrências para revisar exames, comunicar-se com a coordenação e finalizar solicitações.
                    </p>
                </div>

                <div className="grid gap-8">
                    {/* Section 1: O que é a página */}
                    <section className="bg-white/60 backdrop-blur-xl border border-white/40 rounded-2xl p-8 shadow-sm">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                                <Stethoscope className="h-6 w-6" />
                            </div>
                            <h2 className="text-xl font-bold text-foreground">A Página de Revisão</h2>
                        </div>
                        <p className="text-foreground/80 leading-relaxed mb-4">
                            Ao receber um link de revisão, você terá acesso a uma página segura contendo todas as informações necessárias para avaliar o caso:
                        </p>
                        <ul className="grid sm:grid-cols-2 gap-3 text-sm">
                            <li className="flex items-center gap-2 bg-white/50 p-3 rounded-lg border border-white/20">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                <span>Dados do Paciente e Exame</span>
                            </li>
                            <li className="flex items-center gap-2 bg-white/50 p-3 rounded-lg border border-white/20">
                                <Info className="h-4 w-4 text-muted-foreground" />
                                <span>Descrição da Solicitação</span>
                            </li>
                            <li className="flex items-center gap-2 bg-white/50 p-3 rounded-lg border border-white/20">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span>Mensagens da Coordenação</span>
                            </li>
                            <li className="flex items-center gap-2 bg-white/50 p-3 rounded-lg border border-white/20">
                                <CheckCircle className="h-4 w-4 text-muted-foreground" />
                                <span>Status da Ocorrência</span>
                            </li>
                        </ul>
                    </section>

                    {/* Section 2: Fluxo de Trabalho */}
                    <section className="bg-white/60 backdrop-blur-xl border border-white/40 rounded-2xl p-8 shadow-sm">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                <Send className="h-6 w-6" />
                            </div>
                            <h2 className="text-xl font-bold text-foreground">Envio de Mensagens e Fluxo</h2>
                        </div>
                        <div className="space-y-4 text-foreground/80 leading-relaxed">
                            <p>
                                A comunicação é direta com a <strong>Coordenação de Exames</strong>. Através do portal, você pode:
                            </p>
                            <ul className="list-disc list-inside space-y-2 ml-2">
                                <li>Solicitar informações adicionais.</li>
                                <li>Pedir novas imagens ou dados clínicos.</li>
                                <li>Responder a questionamentos da coordenação.</li>
                            </ul>
                            <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex gap-3 text-blue-800 mt-4">
                                <Info className="h-5 w-5 shrink-0" />
                                <p className="text-sm">
                                    Todas as mensagens são registradas no histórico da ocorrência garantindo rastreabilidade e segurança para todos os envolvidos.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Section 3: Finalização */}
                    <section className="bg-white/60 backdrop-blur-xl border border-white/40 rounded-2xl p-8 shadow-sm">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center text-green-600">
                                <CheckCircle className="h-6 w-6" />
                            </div>
                            <h2 className="text-xl font-bold text-foreground">Parecer e Finalização</h2>
                        </div>
                        <div className="space-y-4 text-foreground/80 leading-relaxed">
                            <p>
                                Ao concluir sua análise, é <strong>fundamental</strong> que você forneça seu parecer final.
                            </p>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="p-4 border rounded-xl bg-white/50">
                                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                                        <Send className="h-4 w-4" />
                                        Enviar Análise
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        Use esta opção para enviar uma resposta parcial e manter o chamado aberto para futuras interações.
                                    </p>
                                </div>
                                <div className="p-4 border rounded-xl bg-green-50/50 border-green-100">
                                    <h3 className="font-semibold mb-2 flex items-center gap-2 text-green-700">
                                        <CheckCircle className="h-4 w-4" />
                                        Finalizar Ocorrência
                                    </h3>
                                    <p className="text-sm text-green-800/80">
                                        Use esta opção <strong>somente quando encerrar o caso</strong>. Lembre-se de registrar o que foi feito e seu parecer final na caixa de texto antes de clicar.
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 mt-4 text-amber-700 bg-amber-50 p-4 rounded-xl border border-amber-100">
                                <AlertTriangle className="h-5 w-5 shrink-0" />
                                <p className="text-sm">
                                    <strong>Importante:</strong> Sempre anote o parecer final e as ações tomadas na caixa de texto antes de finalizar a ocorrência. Isso documenta a resolução do caso.
                                </p>
                            </div>
                        </div>
                    </section>
                </div>

                <div className="mt-12 text-center text-sm text-muted-foreground">
                    <p>Dúvidas? Entre em contato com o suporte da Imago.</p>
                </div>
            </main>
        </div>
    );
}
