import { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

interface CadastroTableProps {
  title: string;
  count: number;
  searchPlaceholder: string;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  children: ReactNode;
  headerActions?: ReactNode;
  filters?: ReactNode;
  pagination?: ReactNode;
}

export const CadastroTable = ({
  title,
  count,
  searchPlaceholder,
  searchTerm,
  onSearchChange,
  children,
  headerActions,
  filters,
  pagination,
}: CadastroTableProps) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>
              {count} {count === 1 ? "registro" : "registros"} encontrado(s)
            </CardDescription>
          </div>
          {headerActions}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className={filters ? "grid gap-4 md:grid-cols-3" : ""}>
            <div className={`relative ${filters ? "md:col-span-1" : "mb-4"}`}>
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
            {filters}
          </div>

          <div className="rounded-md border">{children}</div>

          {pagination}
        </div>
      </CardContent>
    </Card>
  );
};
