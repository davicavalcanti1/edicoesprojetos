
import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { useAuth, AppRole } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const roles: { value: AppRole; label: string }[] = [
    { value: "admin", label: "Administrador" },
    { value: "user", label: "Usuário Comum" },
    { value: "rh", label: "Recursos Humanos" },
];

export function RoleSwitcher() {
    const { user, role } = useAuth();
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    const handleSelect = async (newRole: AppRole) => {
        if (!user) return;
        setOpen(false);
        setIsUpdating(true);

        try {
            // Direct update to user_roles table
            const { error } = await supabase
                .from("user_roles")
                .update({ role: newRole as any })
                .eq("user_id", user.id);

            if (error) throw error;

            toast({
                title: "Função atualizada",
                description: `Sua função foi alterada para ${roles.find(r => r.value === newRole)?.label}. A página será recarregada.`,
            });

            // Reload to apply changes in context immediately/cleanly
            setTimeout(() => window.location.reload(), 1000);

        } catch (error: any) {
            console.error("Error updating role:", error);
            toast({
                title: "Erro ao atualizar função",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-[200px] justify-between"
                    disabled={isUpdating}
                >
                    {isUpdating ? "Atualizando..." : (role
                        ? roles.find((r) => r.value === role)?.label
                        : "Selecione a função...")}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0">
                <Command>
                    <CommandInput placeholder="Buscar função..." />
                    <CommandList>
                        <CommandEmpty>Função não encontrada.</CommandEmpty>
                        <CommandGroup>
                            {roles.map((r) => (
                                <CommandItem
                                    key={r.value}
                                    value={r.value}
                                    onSelect={() => handleSelect(r.value)}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            role === r.value ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {r.label}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
