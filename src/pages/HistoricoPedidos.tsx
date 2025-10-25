import AdminNavbar from "@/components/AdminNavbar";
import HistoricoPedidosComponent from "@/components/vendas/HistoricoPedidos";

const HistoricoPedidos = () => {
  return (
    <div className="min-h-screen bg-background">
      <AdminNavbar />
      <div className="container mx-auto px-4 pt-24 pb-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">🕓 Histórico</h1>
          <p className="text-muted-foreground">Pedidos finalizados e arquivados</p>
        </div>

        <HistoricoPedidosComponent />
      </div>
    </div>
  );
};

export default HistoricoPedidos;
