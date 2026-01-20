import { Droplets, Heart, LucideIcon } from "lucide-react";
import { OccurrenceSubtype } from "@/types/occurrence";

export interface NursingOccurrenceType {
    id: OccurrenceSubtype;
    label: string;
    icon: LucideIcon;
    description: string;
}

export const NURSING_OCCURRENCE_TYPES: NursingOccurrenceType[] = [
    {
        id: "extravasamento_enfermagem",
        label: "Extravasamento de Contraste",
        icon: Droplets,
        description: "Extravasamento de contraste ocorrido durante procedimento"
    },
    {
        id: "reacoes_adversas",
        label: "Reações Adversas",
        icon: Heart,
        description: "Reação adversa ao meio de contraste ou medicação"
    }
];
