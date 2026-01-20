import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { NURSING_OCCURRENCE_TYPES } from "@/lib/nursing-occurrence-types";

export default function NursingSubtypeSelection() {
    const navigate = useNavigate();

    return (
        <MainLayout>
            <div className="mx-auto max-w-3xl animate-fade-in">
                <Button
                    variant="ghost"
                    className="mb-4 -ml-2 text-muted-foreground hover:text-foreground"
                    onClick={() => navigate("/")}
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Voltar ao Painel
                </Button>

                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-foreground">
                        Ocorrência de Enfermagem
                    </h1>
                    <p className="mt-2 text-muted-foreground">
                        Selecione o tipo de ocorrência de enfermagem que deseja registrar.
                    </p>
                </div>

                <div className="grid gap-4">
                    {NURSING_OCCURRENCE_TYPES.map((type) => {
                        const Icon = type.icon;
                        return (
                            <Card
                                key={type.id}
                                className="cursor-pointer hover:border-emerald-400 transition-all duration-200 group"
                                onClick={() => navigate(`/ocorrencias/nova/enfermagem/${type.id}`)}
                            >
                                <CardContent className="flex items-center gap-4 p-6">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 group-hover:bg-emerald-100 transition-colors">
                                        <Icon className="h-6 w-6 text-emerald-600" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-foreground text-lg">
                                            {type.label}
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                            {type.description}
                                        </p>
                                    </div>
                                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-emerald-600 transition-colors" />
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </div>
        </MainLayout>
    );
}
