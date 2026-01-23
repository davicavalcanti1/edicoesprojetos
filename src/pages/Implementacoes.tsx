
import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Package, BarChart3, FileText, Wind, Droplets, Bath } from "lucide-react";
import DashboardChamados from "@/pages/dashboard/DashboardChamados";
import RelatoriosChamados from "@/pages/relatorios/RelatoriosChamados";

// Specific filtered views can be implemented by passing props to DashboardChamados/RelatoriosChamados 
// or by creating wrapper components. For now we reuse the existing components and assume they might filter internally 
// if we pass a "type" prop, or we'll just show the same dashboard/report but the user concept is "specific function".
// Since the prompt asks for specific functions for each type, let's implement a filtered view wrapper.

const FilteredDashboardWrapper = ({ type }: { type?: 'ar_condicionado' | 'dispenser' | 'banheiro' | undefined }) => {
    // If the DashboardChamados supports filtering by props, we pass it. 
    // currently it reads from DB view which has "tipo_chamado".
    // We'll need to update DashboardChamados to accept a filter prop or we filter in client side there.
    return <DashboardChamados typeFilter={type} />;
};

const FilteredRelatoriosWrapper = ({ type }: { type?: 'ar_condicionado' | 'dispenser' | 'banheiro' | undefined }) => {
    return <RelatoriosChamados typeFilter={type} />;
}


export default function Implementacoes() {
    const [activeTab, setActiveTab] = useState<'dashboard' | 'relatorios' | 'ar_condicionado' | 'dispenser' | 'banheiro'>('dashboard');
    const [subTab, setSubTab] = useState<'dashboard' | 'relatorios'>('dashboard');

    // Render content based on activeTab
    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return <FilteredDashboardWrapper />;

            case 'relatorios':
                return <FilteredRelatoriosWrapper />;

            case 'ar_condicionado':
            case 'dispenser':
            case 'banheiro':
                return (
                    <div className="space-y-6">
                        <div className="flex gap-2 mb-4">
                            <Button
                                variant={subTab === 'dashboard' ? 'default' : 'outline'}
                                onClick={() => setSubTab('dashboard')}
                                className="gap-2"
                            >
                                <BarChart3 className="h-4 w-4" /> Dashboard {activeTab === 'ar_condicionado' ? 'Ar Comb.' : activeTab}
                            </Button>
                            <Button
                                variant={subTab === 'relatorios' ? 'default' : 'outline'}
                                onClick={() => setSubTab('relatorios')}
                                className="gap-2"
                            >
                                <FileText className="h-4 w-4" /> Relatórios {activeTab === 'ar_condicionado' ? 'Ar Comb.' : activeTab}
                            </Button>
                        </div>

                        {subTab === 'dashboard' ? (
                            <FilteredDashboardWrapper type={activeTab} />
                        ) : (
                            <FilteredRelatoriosWrapper type={activeTab} />
                        )}
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <MainLayout>
            <div className="space-y-6 animate-in fade-in">
                {/* Header with 5 Buttons */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    <Button
                        variant={activeTab === 'dashboard' ? 'default' : 'outline'}
                        className="h-20 flex flex-col gap-2"
                        onClick={() => setActiveTab('dashboard')}
                    >
                        <BarChart3 className="h-6 w-6" />
                        Dashboard Geral
                    </Button>

                    <Button
                        variant={activeTab === 'relatorios' ? 'default' : 'outline'}
                        className="h-20 flex flex-col gap-2"
                        onClick={() => setActiveTab('relatorios')}
                    >
                        <FileText className="h-6 w-6" />
                        Relatórios Gerais
                    </Button>

                    <Button
                        variant={activeTab === 'ar_condicionado' ? 'default' : 'outline'}
                        className="h-20 flex flex-col gap-2"
                        onClick={() => setActiveTab('ar_condicionado')}
                    >
                        <Wind className="h-6 w-6" />
                        Ar Condicionado
                    </Button>

                    <Button
                        variant={activeTab === 'dispenser' ? 'default' : 'outline'}
                        className="h-20 flex flex-col gap-2"
                        onClick={() => setActiveTab('dispenser')}
                    >
                        <Droplets className="h-6 w-6" />
                        Dispenser
                    </Button>

                    <Button
                        variant={activeTab === 'banheiro' ? 'default' : 'outline'}
                        className="h-20 flex flex-col gap-2"
                        onClick={() => setActiveTab('banheiro')}
                    >
                        <Bath className="h-6 w-6" />
                        Banheiros
                    </Button>
                </div>

                {/* Content Area */}
                <div className="mt-8">
                    {renderContent()}
                </div>
            </div>
        </MainLayout>
    );
}
