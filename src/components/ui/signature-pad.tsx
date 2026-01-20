
import React, { useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Button } from "@/components/ui/button";
import { Eraser, Save } from "lucide-react";

interface SignaturePadProps {
    onSave: (signatureData: string) => void;
    label?: string;
}

export function SignaturePad({ onSave, label }: SignaturePadProps) {
    const sigCanvas = useRef<SignatureCanvas>(null);
    const [isEmpty, setIsEmpty] = useState(true);

    const clear = () => {
        sigCanvas.current?.clear();
        setIsEmpty(true);
    };

    const save = () => {
        if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
            const dataUrl = sigCanvas.current.getTrimmedCanvas().toDataURL("image/png");
            onSave(dataUrl);
        }
    };

    return (
        <div className="flex flex-col gap-2 w-full max-w-md border rounded-lg p-4 bg-white shadow-sm">
            {label && <span className="text-sm font-medium text-muted-foreground">{label}</span>}
            <div className="border border-dashed border-gray-300 rounded-md bg-gray-50 h-40">
                <SignatureCanvas
                    ref={sigCanvas}
                    canvasProps={{
                        className: "w-full h-full cursor-crosshair rounded-md",
                    }}
                    backgroundColor="rgba(0,0,0,0)"
                    onBegin={() => setIsEmpty(false)}
                />
            </div>
            <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={clear} type="button">
                    <Eraser className="h-4 w-4 mr-2" />
                    Limpar
                </Button>
                <Button size="sm" onClick={save} disabled={isEmpty} type="button" className="bg-green-600 hover:bg-green-700">
                    <Save className="h-4 w-4 mr-2" />
                    Confirmar Assinatura
                </Button>
            </div>
        </div>
    );
}
