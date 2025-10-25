import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PasswordConfirmInputProps {
  value: string;
  onChange: (value: string) => void;
  passwordValue: string;
  label?: string;
  placeholder?: string;
  error?: string;
}

export const PasswordConfirmInput = ({
  value,
  onChange,
  passwordValue,
  label = "Confirmar Senha",
  placeholder = "Digite sua senha novamente",
  error,
}: PasswordConfirmInputProps) => {
  const [showPassword, setShowPassword] = useState(false);

  const passwordsMatch = value.length > 0 && value === passwordValue;
  const passwordsDontMatch = value.length > 0 && value !== passwordValue;

  return (
    <div className="space-y-2">
      <Label htmlFor={label}>
        {label} <span className="text-red-500">*</span>
      </Label>
      
      <div className="relative">
        <Input
          id={label}
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`pr-10 ${passwordsDontMatch || error ? "border-red-500" : passwordsMatch ? "border-green-500" : ""}`}
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
          onClick={() => setShowPassword(!showPassword)}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Eye className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>
      </div>

      {passwordsMatch && (
        <div className="flex items-center gap-2 text-xs text-green-500 font-medium">
          <Check className="h-4 w-4" />
          <span>Senhas coincidem</span>
        </div>
      )}

      {passwordsDontMatch && (
        <div className="flex items-center gap-2 text-xs text-red-500 font-medium">
          <X className="h-4 w-4" />
          <span>Senhas não coincidem</span>
        </div>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
};
