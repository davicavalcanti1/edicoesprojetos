
import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { BarChart3, FileText, Wind, Droplets, Bath } from "lucide-react";
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
    return <DashboardChamados typeFilter={type} embedded={true} />;
};

const FilteredRelatoriosWrapper = ({ type }: { type?: 'ar_condicionado' | 'dispenser' | 'banheiro' | undefined }) => {
    return <RelatoriosChamados typeFilter={type} embedded={true} />;
}


export default function Inspecoes() {
    const [activeTab, setActiveTab] = useState<'dashboard' | 'relatorios' | 'ar_condicionado' | 'dispenser' | 'banheiro'>('dashboard');
    const [subTab, setSubTab] = useState<'dashboard' | 'relatorios'>('dashboard');

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
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold capitalize text-primary flex items-center gap-2">
                                {activeTab === 'ar_condicionado' ? <Wind className="h-5 w-5" /> :
                                    activeTab === 'dispenser' ? <Droplets className="h-5 w-5" /> : <Bath className="h-5 w-5" />}
                                {activeTab === 'ar_condicionado' ? 'Ar Condicionado' : activeTab}
                            </h2>
                            <div className="flex bg-muted p-1 rounded-lg">
                                <Button
                                    variant={subTab === 'dashboard' ? 'default' : 'ghost'}
                                    size="sm"
                                    onClick={() => setSubTab('dashboard')}
                                    className="gap-2 shadow-none"
                                >
                                    <BarChart3 className="h-4 w-4" /> Dashboard
                                </Button>
                                <Button
                                    variant={subTab === 'relatorios' ? 'default' : 'ghost'}
                                    size="sm"
                                    onClick={() => setSubTab('relatorios')}
                                    className="gap-2 shadow-none"
                                >
                                    <FileText className="h-4 w-4" /> Relatórios
                                </Button>
                            </div>
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

    const getButtonStyle = (tabName: string) => {
        const isActive = activeTab === tabName;
        // We rely on variant='default' for active color, so we don't need manual bg-primary here.
        // We just add layout and hover scale.
        return `h-auto py-6 flex flex-col gap-3 transition-all duration-300 ${isActive
            ? 'shadow-lg scale-[1.02] ring-2 ring-primary ring-offset-2'
            : 'hover:bg-gray-50 hover:scale-[1.01] shadow-sm'
            }`;
    };

    return (
        <MainLayout>
            <div className="space-y-8 animate-in fade-in">
                {/* Header with 5 Buttons */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    <Button
                        variant={activeTab === 'dashboard' ? 'default' : 'outline'}
                        className={getButtonStyle('dashboard')}
                        onClick={() => setActiveTab('dashboard')}
                    >
                        <BarChart3 className="h-8 w-8 mb-1" />
                        <span className="font-semibold text-sm">Dashboard Geral</span>
                    </Button>

                    <Button
                        variant={activeTab === 'relatorios' ? 'default' : 'outline'}
                        className={getButtonStyle('relatorios')}
                        onClick={() => setActiveTab('relatorios')}
                    >
                        <FileText className="h-8 w-8 mb-1" />
                        <span className="font-semibold text-sm">Relatórios Gerais</span>
                    </Button>

                    <Button
                        variant={activeTab === 'ar_condicionado' ? 'default' : 'outline'}
                        className={getButtonStyle('ar_condicionado')}
                        onClick={() => setActiveTab('ar_condicionado')}
                    >
                        <Wind className="h-8 w-8 mb-1" />
                        <span className="font-semibold text-sm">Ar Condicionado</span>
                    </Button>

                    <Button
                        variant={activeTab === 'dispenser' ? 'default' : 'outline'}
                        className={getButtonStyle('dispenser')}
                        onClick={() => setActiveTab('dispenser')}
                    >
                        <Droplets className="h-8 w-8 mb-1" />
                        <span className="font-semibold text-sm">Dispenser</span>
                    </Button>

                    <Button
                        variant={activeTab === 'banheiro' ? 'default' : 'outline'}
                        className={getButtonStyle('banheiro')}
                        onClick={() => setActiveTab('banheiro')}
                    >
                        <Bath className="h-8 w-8 mb-1" />
                        <span className="font-semibold text-sm">Banheiros</span>
                    </Button>
                </div>

                {/* Content Area */}
                <div className="mt-8 min-h-[500px]">
                    {renderContent()}
                </div>
            </div>
        </MainLayout>
    );
}
