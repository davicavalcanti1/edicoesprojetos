import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Loader2,
  Send,
  CheckCircle,
  AlertTriangle,
  FileText,
  User,
  Stethoscope,
  Paperclip,
  Info,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import imagoLogo from "@/assets/imago-logo-transparent.png";
import imagoLoginCover from "@/assets/imago-login-cover.png";
import { FormattedDetails } from "@/components/occurrence/FormattedDetails";
import { AttachmentGallery } from "@/components/attachments/AttachmentGallery";
import type { Attachment } from "@/hooks/useAttachments";

interface PublicOccurrence {
  id: string;
  protocolo: string;
  paciente_nome_completo: string | null;
  paciente_tipo_exame: string | null;
  paciente_unidade_local: string | null;
  paciente_data_hora_evento: string | null;
  descricao_detalhada: string;
  mensagem_admin_medico: string | null;
  mensagem_medico: string | null;
  status: string;
  medico_destino: string | null;
  encaminhada_em: string | null;
  finalizada_em: string | null;
  paciente_sexo: string | null;
  paciente_telefone: string | null;
}

export default function PublicRevisaoLaudo() {
  const { token } = useParams<{ token: string }>();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [occurrence, setOccurrence] = useState<PublicOccurrence | null>(null);
  const [attachments, setAttachments] = useState<(Attachment & { signed_url: string | null })[]>([]);
  const [mensagemMedico, setMensagemMedico] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isInvalid, setIsInvalid] = useState(false);

  useEffect(() => {
    const fetchOccurrence = async () => {
      if (!token) {
        setIsInvalid(true);
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await (supabase
          .from("occurrences")
          .select(
            "id, protocolo, paciente_nome_completo, paciente_tipo_exame, paciente_unidade_local, paciente_data_hora_evento, paciente_sexo, paciente_telefone, descricao_detalhada, mensagem_admin_medico, mensagem_medico, status, medico_destino, encaminhada_em, finalizada_em"
          )
          .eq("public_token", token)
          .eq("subtipo", "revisao_exame")
          .maybeSingle() as any);

        if (error) {
          console.error("Error fetching occurrence:", error);
          setIsInvalid(true);
        } else if (!data) {
          setIsInvalid(true);
        } else {
          setOccurrence(data as PublicOccurrence);
          setMensagemMedico(data.mensagem_medico || "");

          // Fetch attachments with signed URLs
          const { data: attachmentsData } = await supabase
            .from("occurrence_attachments")
            .select("*")
            .eq("occurrence_id", data.id)
            .order("uploaded_em", { ascending: true });

          if (attachmentsData && attachmentsData.length > 0) {
            // Generate signed URLs for each attachment
            const attachmentsWithUrls = await Promise.all(
              attachmentsData.map(async (att: any) => {
                const { data: urlData } = await supabase.storage
                  .from("occurrence-attachments")
                  .createSignedUrl(att.file_url, 60 * 60 * 24 * 7); // 7 days

                return {
                  ...att,
                  is_image: att.is_image ?? att.file_type?.startsWith("image/"),
                  signed_url: urlData?.signedUrl || null,
                };
              })
            );
            setAttachments(attachmentsWithUrls);
          }
        }
      } catch (err) {
        console.error("Error:", err);
        setIsInvalid(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOccurrence();
  }, [token]);

  const handleSendMessage = async (isFinalUpdate = false) => {
    if (!occurrence || !mensagemMedico.trim()) {
      toast({
        title: "Mensagem obrigatória",
        description: "Por favor, escreva sua análise antes de enviar.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      // 1. Update Supabase (Message only)
      const { error } = await supabase
        .from("occurrences")
        .update({ mensagem_medico: mensagemMedico })
        .eq("public_token", token);

      if (error) throw error;

      // 2. Call Webhook (Response)
      try {
        await fetch("https://n8n.imagoradiologia.cloud/webhook/confirmacao", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            occurrence_id: occurrence.id,
            protocolo: occurrence.protocolo,
            mensagem_medico: mensagemMedico,
            status: occurrence.status,
            finalizada_em: null,
            medico_destino: occurrence.medico_destino,
            paciente: occurrence.paciente_nome_completo,
            requires_finalization: isFinalUpdate, // Hint for coordination
          }),
        });
      } catch (webhookError) {
        console.error("Webhook error:", webhookError);
      }

      // 3. Update Local State
      setOccurrence((prev) =>
        prev
          ? {
            ...prev,
            mensagem_medico: mensagemMedico,
          }
          : null
      );

      toast({
        title: isFinalUpdate ? "Atualização enviada" : "Mensagem enviada",
        description: isFinalUpdate
          ? "Coordenação notificada para finalizar ocorrência."
          : "Sua análise foi salva. Você pode atualizar ou finalizar quando quiser.",
      });
    } catch (error: any) {
      console.error("Error sending:", error);
      toast({
        title: "Erro ao enviar",
        description: error.message || "Não foi possível enviar sua análise.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleFinalizeWithOpinion = async () => {
    if (!occurrence || !mensagemMedico.trim()) {
      toast({
        title: "Parecer obrigatório",
        description: "Para finalizar, é necessário escrever seu parecer final na caixa de texto.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      const finalDate = new Date().toISOString();

      // 1. Update Supabase (Message + Status)
      const { error } = await supabase
        .from("occurrences")
        .update({
          mensagem_medico: mensagemMedico,
          status: "concluida",
          finalizada_em: finalDate,
        })
        .eq("public_token", token);

      if (error) throw error;

      // 2. Insert status history
      await supabase.from("occurrence_status_history").insert({
        occurrence_id: occurrence.id,
        status_de: occurrence.status as any,
        status_para: "concluida",
        alterado_por: occurrence.id, // Using occurrence ID as a proxy for "System/Doctor Link" since we don't have user ID
        motivo: "Médico finalizou análise com parecer (Link Público)",
      });

      // 3. Call Webhook (Response)
      try {
        await fetch("https://n8n.imagoradiologia.cloud/webhook/confirmacao", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            occurrence_id: occurrence.id,
            protocolo: occurrence.protocolo,
            mensagem_medico: mensagemMedico,
            status: "concluida",
            finalizada_em: finalDate,
            medico_destino: occurrence.medico_destino,
            paciente: occurrence.paciente_nome_completo,
          }),
        });
      } catch (webhookError) {
        console.error("Webhook error:", webhookError);
      }

      // 4. Update Local State
      setOccurrence((prev) =>
        prev
          ? {
            ...prev,
            mensagem_medico: mensagemMedico,
            status: "concluida",
            finalizada_em: finalDate,
          }
          : null
      );

      toast({
        title: "Ocorrência Finalizada",
        description: "Obrigado! Seu parecer foi registrado e o ciclo concluído.",
      });
    } catch (error: any) {
      console.error("Error finalizing:", error);
      toast({
        title: "Erro ao finalizar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLaudoMantido = async () => {
    if (!occurrence) return;
    setIsSaving(true);
    const automaticMessage = "Laudo Mantido";

    try {
      const finalDate = new Date().toISOString();

      // 1. Update Supabase (Message + Status)
      const { error } = await supabase
        .from("occurrences")
        .update({
          mensagem_medico: automaticMessage,
          status: "concluida",
          finalizada_em: finalDate,
        })
        .eq("public_token", token);

      if (error) throw error;

      // 2. Insert status history
      await supabase.from("occurrence_status_history").insert({
        occurrence_id: occurrence.id,
        status_de: occurrence.status as any,
        status_para: "concluida",
        alterado_por: occurrence.id,
        motivo: "Médico acionou 'Laudo Mantido' (Link Público)",
      });

      // 3. Call Webhook (Response)
      try {
        await fetch("https://n8n.imagoradiologia.cloud/webhook/confirmacao", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            occurrence_id: occurrence.id,
            protocolo: occurrence.protocolo,
            mensagem_medico: automaticMessage,
            status: "concluida",
            finalizada_em: finalDate,
            medico_destino: occurrence.medico_destino,
            paciente: occurrence.paciente_nome_completo,
          }),
        });
      } catch (webhookError) {
        console.error("Webhook error:", webhookError);
      }

      // 4. Update Local State
      setOccurrence((prev) =>
        prev
          ? {
            ...prev,
            mensagem_medico: automaticMessage,
            status: "concluida",
            finalizada_em: finalDate,
          }
          : null
      );

      toast({
        title: "Laudo Mantido",
        description: "Revisão finalizada e coordenação notificada.",
      });
    } catch (error: any) {
      console.error("Error Laudo Mantido:", error);
      toast({
        title: "Erro ao processar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isInvalid) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <div className="max-w-md text-center">
          <AlertTriangle className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Link inválido ou expirado
          </h1>
          <p className="text-muted-foreground">
            Este link de revisão não é válido ou já expirou. Por favor, entre em
            contato com o administrador caso precise de um novo link.
          </p>
        </div>
      </div>
    );
  }

  const isConcluida = occurrence?.status === "concluida";
  const hasExistingMessage = !!occurrence?.mensagem_medico;

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
                Sistema de Ocorrências
              </h1>
              <p className="text-sm text-muted-foreground">
                Portal de Revisão de Laudo
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/instrucoes" target="_blank" className="text-sm text-primary hover:text-primary/80 flex items-center gap-1 font-medium bg-primary/10 px-3 py-1.5 rounded-full transition-colors">
              <Info className="h-4 w-4" />
              <span className="hidden sm:inline">Ajuda & Instruções</span>
              <ExternalLink className="h-3 w-3 ml-0.5 opacity-70" />
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl relative z-10 animate-fade-in">
        {/* Status Banner */}
        {isConcluida && (
          <div className="rounded-xl bg-green-50/80 backdrop-blur-sm border border-green-200 p-6 mb-8 flex items-center gap-4 shadow-sm animate-in fade-in slide-in-from-top-4">
            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="font-bold text-green-800 text-lg">Revisão Finalizada</p>
              <p className="text-green-700">
                Esta revisão foi concluída em{" "}
                {occurrence?.finalizada_em
                  ? format(
                    new Date(occurrence.finalizada_em),
                    "dd/MM/yyyy 'às' HH:mm",
                    { locale: ptBR }
                  )
                  : ""}
              </p>
            </div>
          </div>
        )}

        {/* Occurrence Info Card */}
        <div className="rounded-2xl border border-white/40 bg-white/60 backdrop-blur-xl shadow-xl p-8 mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-black/5">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <span className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">Protocolo</span>
                <h2 className="text-2xl font-bold text-foreground tracking-tight">
                  {occurrence?.protocolo}
                </h2>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium border ${isConcluida
                ? "bg-green-100/50 text-green-700 border-green-200"
                : "bg-blue-100/50 text-blue-700 border-blue-200"
                }`}>
                {isConcluida ? "Concluída" : "Aguardando Análise"}
              </span>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 text-sm">
            <div className="p-4 rounded-xl bg-secondary/30 border border-secondary/50">
              <p className="text-muted-foreground text-xs mb-1 uppercase tracking-wide">Paciente</p>
              <p className="font-semibold text-base text-foreground">
                {occurrence?.paciente_nome_completo || "Não informado"}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-secondary/30 border border-secondary/50">
              <p className="text-muted-foreground text-xs mb-1 uppercase tracking-wide">Unidade</p>
              <p className="font-semibold text-base text-foreground">
                {occurrence?.paciente_unidade_local || "Não informada"}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-secondary/30 border border-secondary/50">
              <p className="text-muted-foreground text-xs mb-1 uppercase tracking-wide">Data do Exame</p>
              <p className="font-semibold text-base text-foreground">
                {occurrence?.paciente_data_hora_evento
                  ? format(
                    new Date(occurrence.paciente_data_hora_evento),
                    "dd/MM/yyyy 'às' HH:mm",
                    { locale: ptBR }
                  )
                  : "Não informado"}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-secondary/30 border border-secondary/50">
              <p className="text-muted-foreground text-xs mb-1 uppercase tracking-wide">Telefone</p>
              <p className="font-semibold text-base text-foreground">{occurrence?.paciente_telefone || "Não informado"}</p>
            </div>
            <div className="p-4 rounded-xl bg-secondary/30 border border-secondary/50">
              <p className="text-muted-foreground text-xs mb-1 uppercase tracking-wide">Sexo</p>
              <p className="font-semibold text-base text-foreground">{occurrence?.paciente_sexo || "Não informado"}</p>
            </div>
            <div className="p-4 rounded-xl bg-secondary/30 border border-secondary/50">
              <p className="text-muted-foreground text-xs mb-1 uppercase tracking-wide">Tipo de Exame</p>
              <p className="font-semibold text-base text-foreground">{occurrence?.paciente_tipo_exame || "Não informado"}</p>
            </div>
          </div>
        </div>

        {/* Detailed Description */}
        <div className="rounded-2xl border border-white/40 bg-white/60 backdrop-blur-xl shadow-xl p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <FileText className="h-4 w-4" />
            </div>
            <h3 className="text-lg font-bold text-foreground">
              Descrição da Solicitação
            </h3>
          </div>
          <div className="prose prose-sm max-w-none text-foreground/90 bg-white/40 p-6 rounded-xl border border-white/30 shadow-inner">
            <FormattedDetails content={occurrence?.descricao_detalhada || ""} />
          </div>
        </div>

        {/* Attachments Section */}
        {attachments.length > 0 && (
          <div className="rounded-2xl border border-white/40 bg-white/60 backdrop-blur-xl shadow-xl p-8 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Paperclip className="h-4 w-4" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Anexos do Exame</h3>
            </div>
            <AttachmentGallery
              attachments={attachments}
              emptyMessage="Nenhum anexo disponível"
            />
          </div>
        )}

        {/* Admin Message */}
        {occurrence?.mensagem_admin_medico && (
          <div className="rounded-2xl border border-primary/20 bg-primary/5 backdrop-blur-sm p-8 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                <User className="h-4 w-4" />
              </div>
              <h3 className="text-lg font-bold text-foreground">
                Mensagem da Coordenação Médica
              </h3>
            </div>
            <div className="bg-white/50 p-6 rounded-xl border border-primary/10">
              <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                {occurrence.mensagem_admin_medico}
              </p>
            </div>
          </div>
        )}

        {/* Doctor's Response */}
        <div className="rounded-2xl border border-white/40 bg-white/60 backdrop-blur-xl shadow-xl p-8 mb-8 ring-1 ring-primary/5">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Stethoscope className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">
                Área de {occurrence?.medico_destino || "Médico Responsável"}
              </h3>
              <p className="text-sm text-muted-foreground">Registre sua análise e conclusão sobre o caso</p>
            </div>
          </div>

          {isConcluida ? (
            <div className="rounded-xl bg-secondary/50 border border-secondary p-6">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Sua Resposta Registrada</span>
              <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                {occurrence?.mensagem_medico}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="mensagem-medico" className="text-base font-medium">
                  Parecer Técnico / Análise *
                </Label>
                <Textarea
                  id="mensagem-medico"
                  placeholder="Descreva detalhadamente sua análise do caso, se houve concordância ou discordância com o laudo original, e suas recomendações..."
                  value={mensagemMedico}
                  onChange={(e) => setMensagemMedico(e.target.value)}
                  rows={8}
                  className="resize-none bg-white/50 border-white/40 focus:bg-white focus:border-primary/50 transition-all text-base"
                />
              </div>

              <div className="flex flex-col space-y-3 pt-4 border-t border-black/5">
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={() => handleSendMessage(false)}
                    disabled={isSaving}
                    variant="secondary"
                    className="flex-1 h-12 text-base shadow-sm hover:translate-y-px transition-all bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Salvar Análise Parcial
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={() => handleSendMessage(true)}
                    disabled={isSaving}
                    className="flex-1 h-12 text-base shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Enviar Atualização p/ Coordenação
                      </>
                    )}
                  </Button>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 mt-4 pt-4 border-t border-dashed border-gray-200">
                  <Button
                    onClick={() => handleFinalizeWithOpinion()}
                    disabled={isSaving}
                    className="flex-1 h-12 text-base shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5 bg-green-600 hover:bg-green-700 text-white"
                  >
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Finalizar Ocorrência (Com meu Parecer)
                  </Button>

                  <Button
                    onClick={handleLaudoMantido}
                    disabled={isSaving}
                    variant="outline"
                    className="flex-1 h-12 text-base border-primary/20 hover:bg-primary/5 text-primary hover:text-primary transition-colors"
                  >
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Laudo Mantido (Finalização Rápida)
                  </Button>
                </div>
              </div>

              <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-4 flex gap-3 text-sm text-blue-800">
                <Info className="h-5 w-5 shrink-0 text-blue-600" />
                <div>
                  <p className="font-medium mb-1">Como finalizar?</p>
                  <ul className="list-disc list-inside space-y-1 opacity-90">
                    <li><strong>Salvar/Enviar:</strong> Mantém o chamado aberto para mais interações.</li>
                    <li><strong>Finalizar (Com meu Parecer):</strong> Encerra o chamado usando o texto que você escreveu acima.</li>
                    <li><strong>Laudo Mantido:</strong> Encerra imediatamente com a mensagem padrão "Laudo Mantido".</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/20 bg-white/40 backdrop-blur-md mt-auto">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <div className="flex items-center justify-center gap-2 mb-2 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
            <img src={imagoLogo} alt="IMAGO" className="h-6 w-auto" />
          </div>
          <p className="font-medium">Imago 2026 Productions Version 1.1</p>
          <p className="text-xs mt-2 opacity-75">
            Link de acesso exclusivo e rastreável. O compartilhamento não autorizado é proibido.
          </p>
        </div>
      </footer>
    </div>
  );
}
