import { MainLayout } from "@/components/layout/MainLayout";
import { AdminKanbanBoard } from "@/components/kanban/AdminKanbanBoard";

export default function AdminKanban() {
    return (
        <MainLayout>
            <div className="h-full">
                <h1 className="text-2xl font-bold font-mono tracking-tight text-foreground mb-1">Kanban Administrativo</h1>
                {/* The Board has its own header but we might want a global one or just let the board handle it. 
                    The Board component I wrote has a header "Fluxo Administrativo".
                    The previous page had "Kanban Administrativo".
                    I'll let the Board handle the header to be consistent if reused, or hide it if needed.
                    Actually, in the page view, the Title "Kanban Administrativo" was top level.
                    In the Board component, I added "Fluxo Administrativo" and description.
                    I will remove the layout title here and let Board handle it, or adjust Board to be flexible.
                    The Board component has: 
                    <div className="flex items-center justify-between mb-6">... title ... button ...</div>
                    So I just need to render the board.
                    Wait, if I reuse it in Kanbans.tsx (Tabs), I might not want the title to be "Fluxo Administrativo" or maybe I do.
                    The user said "appear in the kanban as it already exists".
                    "As it already exists" -> probably means the card style.
                    I'll just render it.
                 */}
                <AdminKanbanBoard />
            </div>
        </MainLayout>
    );
}
