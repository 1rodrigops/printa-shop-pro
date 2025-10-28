import { Button } from "@/components/ui/button";
import { Save, X } from "lucide-react";

interface CadastroFormActionsProps {
  editing: boolean;
  onClear: () => void;
  submitLabel?: string;
  clearLabel?: string;
}

export const CadastroFormActions = ({
  editing,
  onClear,
  submitLabel,
  clearLabel = "Limpar Campos",
}: CadastroFormActionsProps) => {
  return (
    <div className="flex gap-3">
      <Button type="submit" className="gap-2">
        <Save className="w-4 h-4" />
        {submitLabel || (editing ? "Atualizar" : "Salvar")}
      </Button>
      <Button
        type="button"
        variant="outline"
        onClick={onClear}
        className="gap-2"
      >
        <X className="w-4 h-4" />
        {clearLabel}
      </Button>
    </div>
  );
};
