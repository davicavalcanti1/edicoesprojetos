
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ADMIN_OCCURRENCE_TYPES } from "@/lib/admin-occurrence-types";

export default function AdminTypeSelection() {
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
                        Ocorrência Administrativa
                    </h1>
                    <p className="mt-2 text-muted-foreground">
                        Selecione o tipo de ocorrência administrativa que deseja registrar.
                    </p>
                </div>

                <div className="grid gap-4">
                    {ADMIN_OCCURRENCE_TYPES.map((type) => {
                        const Icon = type.icon;
                        return (
                            <Card
                                key={type.id}
                                className="cursor-pointer hover:border-amber-400 transition-all duration-200 group"
                                onClick={() => navigate(`/ocorrencias/nova/administrativa/${type.id}`)}
                            >
                                <CardContent className="flex items-center gap-4 p-6">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 group-hover:bg-amber-100 transition-colors">
                                        <Icon className="h-6 w-6 text-amber-600" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-foreground text-lg">
                                            {type.label}
                                        </h3>
                                    </div>
                                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-amber-600 transition-colors" />
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </div>
        </MainLayout>
    );
}
