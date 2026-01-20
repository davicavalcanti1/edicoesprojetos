import { useState, useEffect } from "react";
import { useOccurrenceBook, useCreateBookEntry } from "@/hooks/useOccurrenceBook";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { BookOpen, Printer, ChevronLeft, ChevronRight, Calendar, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

export default function OccurrenceBook() {
    const navigate = useNavigate();
    const { role } = useAuth();
    const [selectedSector, setSelectedSector] = useState<'administrativo' | 'enfermagem'>(
        role === 'enfermagem' ? 'enfermagem' : 'administrativo'
    );
    const [currentDate, setCurrentDate] = useState<Date>(new Date());
    const [newEntry, setNewEntry] = useState("");

    const canSwitch = role === 'admin';
    const canWrite =
        (role === 'admin') ||
        (role === 'rh' && selectedSector === 'administrativo') ||
        (role === 'enfermagem' && selectedSector === 'enfermagem');

    // Pass currentDate to hook
    const { data: entries, isLoading } = useOccurrenceBook(selectedSector, currentDate);
    const { mutate: addEntry, isPending } = useCreateBookEntry();

    const handleAdd = () => {
        if (!newEntry.trim()) return;
        addEntry({ content: newEntry, sector: selectedSector }, {
            onSuccess: () => setNewEntry("")
        });
    };

    // Date Navigation
    const handlePrevDay = () => {
        const prev = new Date(currentDate);
        prev.setDate(prev.getDate() - 1);
        setCurrentDate(prev);
    };

    const handleNextDay = () => {
        const next = new Date(currentDate);
        next.setDate(next.getDate() + 1);
        setCurrentDate(next);
    };

    // Prevent users from accessing wrong book if not admin
    useEffect(() => {
        if (role === 'rh' && selectedSector !== 'administrativo') {
            setSelectedSector('administrativo');
        }
        if (role === 'enfermagem' && selectedSector !== 'enfermagem') {
            setSelectedSector('enfermagem');
        }
    }, [role, selectedSector]);

    return (
        <div className="container mx-auto p-4 print:p-0 min-h-screen bg-gray-50/50">
            {/* Back Button */}
            <div className="mb-4 print:hidden">
                <Button variant="ghost" className="gap-2 pl-0 hover:bg-transparent hover:text-primary" onClick={() => navigate("/")}>
                    <ArrowLeft className="h-4 w-4" />
                    Voltar para Início
                </Button>
            </div>

            {/* Header / Toolbar */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 print:hidden bg-white p-4 rounded-lg shadow-sm border gap-4">
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="p-2 bg-primary/10 rounded-full">
                        <BookOpen className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Livro de Ocorrências</h1>
                        <p className="text-sm text-gray-500">Setor: {selectedSector === 'administrativo' ? 'Administrativo' : 'Enfermagem'}</p>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
                    {/* Date Navigation (LOCKED to Today) */}
                    <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-md opacity-80 cursor-not-allowed" title="Navegação desabilitada">
                        <Button variant="ghost" size="icon" disabled className="opacity-50">
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="flex items-center gap-2 px-2 font-medium min-w-[140px] justify-center text-gray-400">
                            <Calendar className="h-4 w-4" />
                            {currentDate.toLocaleDateString()}
                        </div>
                        <Button variant="ghost" size="icon" disabled className="opacity-50">
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>

                    {canSwitch && (
                        <Select value={selectedSector} onValueChange={(v: any) => setSelectedSector(v)}>
                            <SelectTrigger className="w-[160px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="administrativo">Administrativo</SelectItem>
                                <SelectItem value="enfermagem">Enfermagem</SelectItem>
                            </SelectContent>
                        </Select>
                    )}
                    <Button variant="outline" onClick={() => window.print()} className="gap-2">
                        <Printer className="w-4 h-4" />
                        Imprimir
                    </Button>
                </div>
            </div>

            {/* Content Area - One Page Per Day */}
            <div className="print:block pb-32">
                {isLoading ? (
                    <div className="text-center p-12">Carregando registros...</div>
                ) : (
                    <div className="relative bg-white shadow-md print:shadow-none print:border-none border border-gray-200 rounded-lg overflow-hidden mx-auto max-w-[29.7cm] min-h-[21cm] w-full p-12 print:p-0 print:m-0 print:w-full landscape:w-full">

                        {/* Static Header for the Day */}
                        <div className="flex justify-between items-end border-b-2 border-primary/20 pb-4 mb-8">
                            <div>
                                <h2 className="text-xl font-serif font-bold text-gray-700">
                                    {selectedSector === 'administrativo' ? 'Livro Administrativo' : 'Livro Enfermagem'}
                                </h2>
                                <p className="text-sm text-gray-500 mt-1">Imago Radiologia</p>
                            </div>
                            <div className="text-right">
                                <div className="text-2xl font-serif font-bold text-primary">
                                    {currentDate.toLocaleDateString()}
                                </div>
                                <div className="text-sm text-gray-500">
                                    {entries?.length || 0} registros
                                </div>
                            </div>
                        </div>

                        {/* Entries Table */}
                        <div className="min-h-[500px] border-t-2 border-b-2 border-gray-800 my-4">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="border-b-2 border-gray-800">
                                        <th className="p-3 text-left font-serif font-bold text-gray-900 w-[20%] border-r border-gray-400">Responsável</th>
                                        <th className="p-3 text-left font-serif font-bold text-gray-900 w-[15%] border-r border-gray-400">Data/Hora</th>
                                        <th className="p-3 text-left font-serif font-bold text-gray-900">Ocorrência</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(!entries || entries.length === 0) ? (
                                        <tr>
                                            <td colSpan={3} className="p-12 text-center text-gray-400 italic">
                                                Nenhum registro para esta data.
                                            </td>
                                        </tr>
                                    ) : (
                                        entries.map((entry) => (
                                            <tr key={entry.id} className="border-b border-gray-300">
                                                <td className="p-3 align-top font-serif text-gray-800 border-r border-gray-400 text-sm">
                                                    {entry.created_by_name}
                                                </td>
                                                <td className="p-3 align-top font-serif text-gray-800 border-r border-gray-400 text-sm">
                                                    {format(new Date(entry.created_at), "dd/MM/yyyy")}<br />
                                                    {format(new Date(entry.created_at), "HH:mm")}
                                                </td>
                                                <td className="p-3 align-top font-serif text-gray-800 whitespace-pre-wrap leading-relaxed text-sm break-words max-w-[400px]">
                                                    {entry.content}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Footer (Static for page) */}
                        <div className="mt-auto pt-8 border-t border-gray-200 flex justify-between text-sm text-gray-400 print:hidden">
                            <div>Página gerada digitalmente</div>
                            <div>{currentDate.toLocaleDateString()}</div>
                        </div>
                    </div>
                )}
            </div>

            {/* Input Area - Fixed at bottom */}
            {canWrite && (
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] print:hidden z-10">
                    <div className="container mx-auto max-w-4xl flex gap-4">
                        <Textarea
                            value={newEntry}
                            onChange={e => setNewEntry(e.target.value)}
                            placeholder={`Escreva uma nova ocorrência para HOJE (${new Date().toLocaleDateString()})...`}
                            className="flex-1 min-h-[80px]"
                        />
                        <Button
                            onClick={handleAdd}
                            disabled={isPending || !newEntry.trim()}
                            className="h-auto w-32"
                        >
                            {isPending ? "Salvando..." : "Registrar"}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

