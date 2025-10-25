import AdminNavbar from "@/components/AdminNavbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Estoque = () => {
  return (
    <div className="min-h-screen bg-background">
      <AdminNavbar />
      <div className="container mx-auto px-4 pt-24 pb-8">
        <h1 className="text-3xl font-bold mb-6">Estoque</h1>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Produtos</CardTitle>
              <CardDescription>Gerencie produtos em estoque</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Em desenvolvimento...</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Movimentações</CardTitle>
              <CardDescription>Entradas e saídas</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Em desenvolvimento...</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Alertas</CardTitle>
              <CardDescription>Produtos com estoque baixo</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Em desenvolvimento...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Estoque;
