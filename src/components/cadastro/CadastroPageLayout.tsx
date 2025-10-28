import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, LucideIcon } from "lucide-react";
import AdminNavbar from "@/components/AdminNavbar";

interface CadastroPageLayoutProps {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  breadcrumb: string;
  children: ReactNode;
}

export const CadastroPageLayout = ({
  title,
  subtitle,
  icon: Icon,
  breadcrumb,
  children,
}: CadastroPageLayoutProps) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <AdminNavbar />

      <div className="container mx-auto px-4 pt-24 pb-8">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <span>Admin</span>
          <span>/</span>
          <span>Cadastro</span>
          <span>/</span>
          <span className="text-foreground font-medium">{breadcrumb}</span>
        </div>

        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => navigate("/admin/cadastro")}
              variant="outline"
              size="icon"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Icon className="h-8 w-8 text-primary" />
                {title}
              </h1>
              <p className="text-muted-foreground mt-1">{subtitle}</p>
            </div>
          </div>
        </div>

        {children}
      </div>
    </div>
  );
};
