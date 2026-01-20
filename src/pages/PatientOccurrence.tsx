import { useState } from "react";
import { useCreatePatientOccurrence } from "@/hooks/usePatientOccurrence";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function PublicPatientOccurrence() {
    const navigate = useNavigate();
    const { mutate: submit, isPending } = useCreatePatientOccurrence();
    const [isAnonymous, setIsAnonymous] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        nome: "",
        telefone: "",
        dataNascimento: "",
        descricao: ""
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        submit({
            descricao_detalhada: formData.descricao,
            is_anonymous: isAnonymous,
            paciente_nome_completo: isAnonymous ? undefined : formData.nome,
            paciente_telefone: isAnonymous ? undefined : formData.telefone,
            paciente_data_nascimento: isAnonymous ? undefined : formData.dataNascimento
        }, {
            onSuccess: () => {
                // Determine logic after success. Maybe show success message and clear form.
                setFormData({ nome: "", telefone: "", dataNascimento: "", descricao: "" });
            }
        });
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
            <Card className="w-full max-w-lg shadow-xl">
                <CardHeader className="space-y-1">
                    <Button variant="ghost" className="w-fit p-0 h-auto mb-2 text-gray-500" onClick={() => navigate('/')}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Voltar
                    </Button>
                    <CardTitle className="text-2xl font-bold text-center text-primary">Nova Ocorrência</CardTitle>
                    <CardDescription className="text-center">
                        Relate aqui sua ocorrência. Você pode optar por não se identificar.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">

                        <div className="flex items-center space-x-2 border p-3 rounded-md bg-white">
                            <Checkbox
                                id="anonymous"
                                checked={isAnonymous}
                                onCheckedChange={(checked) => setIsAnonymous(checked as boolean)}
                            />
                            <Label htmlFor="anonymous" className="cursor-pointer">
                                <b>Prefiro não me identificar</b> (Ocorrência Anônima)
                            </Label>
                        </div>

                        {!isAnonymous && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                                <div className="space-y-2">
                                    <Label htmlFor="nome">Nome Completo</Label>
                                    <Input
                                        id="nome"
                                        required={!isAnonymous}
                                        value={formData.nome}
                                        onChange={e => setFormData({ ...formData, nome: e.target.value })}
                                        placeholder="Seu nome"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="telefone">Telefone</Label>
                                        <Input
                                            id="telefone"
                                            type="tel"
                                            required={!isAnonymous}
                                            value={formData.telefone}
                                            onChange={e => setFormData({ ...formData, telefone: e.target.value })}
                                            placeholder="(00) 00000-0000"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="dob">Data de Nascimento</Label>
                                        <Input
                                            id="dob"
                                            type="date"
                                            required={!isAnonymous}
                                            value={formData.dataNascimento}
                                            onChange={e => setFormData({ ...formData, dataNascimento: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="descricao">Descrição da Ocorrência</Label>
                            <Textarea
                                id="descricao"
                                required
                                className="min-h-[150px]"
                                value={formData.descricao}
                                onChange={e => setFormData({ ...formData, descricao: e.target.value })}
                                placeholder="Descreva detalhadamente o que aconteceu..."
                            />
                        </div>

                        <Button type="submit" className="w-full text-lg py-6" disabled={isPending}>
                            {isPending ? "Enviando..." : "Enviar Ocorrência"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
