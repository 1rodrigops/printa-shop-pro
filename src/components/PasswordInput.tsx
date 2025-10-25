import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  showStrengthIndicator?: boolean;
  error?: string;
}

export const PasswordInput = ({
  value,
  onChange,
  label = "Senha",
  placeholder = "Digite sua senha",
  showStrengthIndicator = true,
  error,
}: PasswordInputProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const validatePassword = (password: string) => {
    const requirements = {
      length: password.length >= 9,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      noSpaces: !/\s/.test(password),
    };

    const metRequirements = Object.values(requirements).filter(Boolean).length;
    
    let strength: "weak" | "medium" | "strong" = "weak";
    let strengthText = "Senha muito fraca";
    let strengthColor = "bg-red-500";

    if (requirements.length && metRequirements >= 4) {
      strength = "medium";
      strengthText = "Senha razoável, adicione símbolo e número";
      strengthColor = "bg-orange-500";
    }

    if (Object.values(requirements).every(Boolean)) {
      strength = "strong";
      strengthText = "Senha forte ✅";
      strengthColor = "bg-green-500";
    }

    return {
      requirements,
      strength,
      strengthText,
      strengthColor,
      isValid: Object.values(requirements).every(Boolean),
    };
  };

  const validation = validatePassword(value);

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
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className={`pr-10 ${error || (!validation.isValid && value.length > 0) ? "border-red-500" : ""}`}
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

      {isFocused && value.length === 0 && (
        <div className="text-xs text-muted-foreground bg-muted p-3 rounded-md">
          <p className="font-medium mb-2">A senha precisa ter:</p>
          <ul className="space-y-1">
            <li>• No mínimo 9 caracteres</li>
            <li>• Pelo menos uma letra maiúscula (A-Z)</li>
            <li>• Pelo menos uma letra minúscula (a-z)</li>
            <li>• Pelo menos um número (0-9)</li>
            <li>• Pelo menos um símbolo especial (! @ # $ % ^ & *)</li>
            <li>• Sem espaços</li>
          </ul>
        </div>
      )}

      {showStrengthIndicator && value.length > 0 && (
        <div className="space-y-2">
          <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${validation.strengthColor}`}
              style={{
                width:
                  validation.strength === "weak"
                    ? "33%"
                    : validation.strength === "medium"
                    ? "66%"
                    : "100%",
              }}
            />
          </div>
          <p
            className={`text-xs font-medium ${
              validation.strength === "weak"
                ? "text-red-500"
                : validation.strength === "medium"
                ? "text-orange-500"
                : "text-green-500"
            }`}
          >
            {validation.strengthText}
          </p>

          {!validation.isValid && (
            <div className="text-xs text-muted-foreground space-y-1">
              {!validation.requirements.length && (
                <p>• Adicione pelo menos 9 caracteres</p>
              )}
              {!validation.requirements.uppercase && (
                <p>• Adicione uma letra maiúscula</p>
              )}
              {!validation.requirements.lowercase && (
                <p>• Adicione uma letra minúscula</p>
              )}
              {!validation.requirements.number && <p>• Adicione um número</p>}
              {!validation.requirements.special && (
                <p>• Adicione um símbolo especial</p>
              )}
              {!validation.requirements.noSpaces && (
                <p>• Remova os espaços</p>
              )}
            </div>
          )}
        </div>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
};
