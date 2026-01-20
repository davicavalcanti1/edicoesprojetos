
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ADMIN_OCCURRENCE_TYPES } from "@/lib/admin-occurrence-types";

export default function AdminSubtypeSelection() {
    const navigate = useNavigate();
    const { typeId } = useParams();

    const selectedType = ADMIN_OCCURRENCE_TYPES.find((t) => t.id === typeId);

    if (!selectedType) {
        return (
            <MainLayout>
                <div className="mx-auto max-w-3xl text-center py-12">
                    <p className="text-muted-foreground">Tipo não encontrado.</p>
                    <Button onClick={() => navigate("/ocorrencias/nova/administrativa")} className="mt-4">
                        Voltar
                    </Button>
                </div>
            </MainLayout>
        );
    }

    const TypeIcon = selectedType.icon;

    return (
        <MainLayout>
            <div className="mx-auto max-w-3xl animate-fade-in">
                <Button
                    variant="ghost"
                    className="mb-4 -ml-2 text-muted-foreground hover:text-foreground"
                    onClick={() => navigate("/ocorrencias/nova/administrativa")}
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Voltar para Tipos
                </Button>

                <div className="mb-8 flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 shrink-0">
                        <TypeIcon className="h-6 w-6 text-amber-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">
                            {selectedType.label}
                        </h1>
                        <p className="mt-2 text-muted-foreground">
                            Selecione o subtipo específico desta ocorrência.
                        </p>
                    </div>
                </div>

                <div className="grid gap-4">
                    {selectedType.subtypes.map((subtype) => (
                        <Card
                            key={subtype.id}
                            className="cursor-pointer hover:border-amber-400 transition-all duration-200 group"
                            onClick={() => navigate(`/ocorrencias/nova/administrativa/${selectedType.id}/${subtype.id}`)}
                        >
                            <CardContent className="flex items-center gap-4 p-6">
                                <div className="flex-1">
                                    <h3 className="font-medium text-foreground text-lg">
                                        {subtype.label}
                                    </h3>
                                </div>
                                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-amber-600 transition-colors" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </MainLayout>
    );
}
