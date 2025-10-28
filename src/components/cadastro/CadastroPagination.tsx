import { Button } from "@/components/ui/button";

interface CadastroPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const CadastroPagination = ({
  currentPage,
  totalPages,
  onPageChange,
}: CadastroPaginationProps) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex justify-center gap-2 mt-4">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
      >
        Anterior
      </Button>
      <span className="flex items-center px-4 text-sm text-muted-foreground">
        Página {currentPage} de {totalPages}
      </span>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
      >
        Próxima
      </Button>
    </div>
  );
};
