import { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface CadastroFormCardProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  children: ReactNode;
  editing?: boolean;
}

export const CadastroFormCard = ({
  title,
  description,
  icon: Icon,
  children,
  editing = false,
}: CadastroFormCardProps) => {
  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {Icon && <Icon className="h-5 w-5" />}
          {editing ? `Editar ${title}` : `Novo ${title}`}
        </CardTitle>
        <CardDescription>
          {editing
            ? `Atualize as informações ${description}`
            : `Preencha os dados para cadastrar ${description}`}
        </CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
};
