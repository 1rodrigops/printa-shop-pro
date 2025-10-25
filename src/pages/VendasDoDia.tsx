import AdminNavbar from "@/components/AdminNavbar";
import VendasDoDiaComponent from "@/components/vendas/VendasDoDia";

const VendasDoDia = () => {
  return (
    <div className="min-h-screen bg-background">
      <AdminNavbar />
      <div className="container mx-auto px-4 pt-24 pb-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">📊 Vendas do Dia</h1>
          <p className="text-muted-foreground">Foco no dia atual (produção, entregas e envios)</p>
        </div>

        <VendasDoDiaComponent />
      </div>
    </div>
  );
};

export default VendasDoDia;
