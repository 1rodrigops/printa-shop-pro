import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Palette, Upload, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { useTenantContext } from "@/contexts/TenantContext";
import heroImage from "@/assets/hero-tshirts.jpg";
import shirtModel1 from "@/assets/shirt-model-1.jpg";
import shirtModel2 from "@/assets/shirt-model-2.jpg";
import shirtModel3 from "@/assets/shirt-model-3.jpg";
import fabricCotton from "@/assets/fabric-cotton.jpg";
import fabricDryfit from "@/assets/fabric-dryfit.jpg";
import fabricPremium from "@/assets/fabric-premium.jpg";

const Index = () => {
  const { tenant, branding } = useTenantContext();
  const primaryColor = branding?.primary || "#111111";
  const accentColor = branding?.accent || "#FF6A00";

  const features = [
    {
      icon: <Upload className="w-8 h-8" style={{ color: primaryColor }} />,
      title: "Envie Sua Foto",
      description: "Faça upload da imagem que você quer estampar na sua camisa"
    },
    {
      icon: <Palette className="w-8 h-8" style={{ color: accentColor }} />,
      title: "Personalize",
      description: "Escolha cor, tamanho e quantidade da sua camisa"
    },
    {
      icon: <ShoppingBag className="w-8 h-8" style={{ color: primaryColor }} />,
      title: "Receba em Casa",
      description: "Produzimos e enviamos sua camisa personalizada"
    }
  ];

  const colors = [
    { name: "Branca", color: "bg-white border-2" },
    { name: "Preta", color: "bg-black" },
    { name: "Azul", color: "bg-blue-500" },
    { name: "Vermelha", color: "bg-red-500" },
    { name: "Verde", color: "bg-green-500" },
    { name: "Rosa", color: "bg-pink-500" }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h1 className="text-5xl lg:text-7xl font-bold leading-tight">
                {tenant?.nome || "Crie Sua"}
                <span
                  className="block bg-clip-text text-transparent"
                  style={{
                    backgroundImage: `linear-gradient(to right, ${primaryColor}, ${accentColor})`,
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  Camisa Perfeita
                </span>
              </h1>
              <p className="text-lg text-muted-foreground">
                Transforme suas ideias em realidade! Personalize camisas com suas próprias fotos e designs. 
                Qualidade premium, entrega rápida e preços acessíveis.
              </p>
              <div className="flex gap-4">
                <Link to="/personalizar">
                  <Button variant="gradient" size="xl" className="group">
                    Começar Agora
                    <CheckCircle2 className="ml-2 group-hover:rotate-12 transition-transform" />
                  </Button>
                </Link>
                <Button variant="outline" size="xl">
                  Ver Exemplos
                </Button>
              </div>
            </div>
            
            <div className="relative">
              <div
                className="absolute inset-0 blur-3xl -z-10"
                style={{
                  background: `linear-gradient(to right, ${primaryColor}20, ${accentColor}20)`,
                }}
              />
              <img
                src={heroImage}
                alt="Camisas personalizadas coloridas"
                className="rounded-2xl shadow-2xl w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Como Funciona */}
      <section className="py-20 px-4 bg-muted/50">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Como Funciona</h2>
            <p className="text-muted-foreground text-lg">
              3 passos simples para ter sua camisa personalizada
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="relative overflow-hidden group hover:shadow-xl transition-all duration-300">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-transparent rounded-bl-full" />
                <CardContent className="p-8">
                  <div className="mb-4 transform group-hover:scale-110 transition-transform">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Modelos de Produtos */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Modelos em Destaque</h2>
            <p className="text-muted-foreground text-lg">
              Confira alguns exemplos de camisas personalizadas
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="overflow-hidden group hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
              <div className="relative overflow-hidden">
                <img 
                  src={shirtModel1} 
                  alt="Camisa branca com design geométrico colorido" 
                  className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-2">Geometria Abstrata</h3>
                <p className="text-muted-foreground mb-4">
                  Design moderno com formas geométricas coloridas
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold text-primary">R$ 79,90</span>
                  <Link to="/personalizar">
                    <Button variant="secondary" size="sm">
                      Personalizar
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden group hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
              <div className="relative overflow-hidden">
                <img 
                  src={shirtModel2} 
                  alt="Camisa preta com arte neon urbana" 
                  className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-2">Neon Street Art</h3>
                <p className="text-muted-foreground mb-4">
                  Arte urbana vibrante com efeitos neon
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold text-primary">R$ 79,90</span>
                  <Link to="/personalizar">
                    <Button variant="secondary" size="sm">
                      Personalizar
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden group hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
              <div className="relative overflow-hidden">
                <img 
                  src={shirtModel3} 
                  alt="Camisa azul com paisagem minimalista" 
                  className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-2">Paisagem Natural</h3>
                <p className="text-muted-foreground mb-4">
                  Design minimalista inspirado na natureza
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold text-primary">R$ 79,90</span>
                  <Link to="/personalizar">
                    <Button variant="secondary" size="sm">
                      Personalizar
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Tipos de Tecidos */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">
              👕 Trabalhamos com os melhores tecidos para sua camiseta personalizada
            </h2>
            <p className="text-muted-foreground text-lg">
              Escolha o tecido ideal para seu conforto, estilo e ocasião
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {/* Algodão Tradicional */}
            <Card className="overflow-hidden group hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
              <div className="relative overflow-hidden h-64">
                <img 
                  src={fabricCotton} 
                  alt="Tecido 100% algodão com textura natural e suave" 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute top-4 right-4 bg-primary text-white px-3 py-1 rounded-full text-sm font-semibold">
                  🪶 Clássico
                </div>
              </div>
              <CardContent className="p-6">
                <h3 className="text-2xl font-bold mb-3 flex items-center gap-2">
                  🧵 Algodão Tradicional
                </h3>
                <p className="text-muted-foreground mb-4 leading-relaxed">
                  Tecido 100% algodão com toque suave e respirável. 
                  Ideal para uso diário, conforto e durabilidade.
                </p>
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
                  <p className="text-sm font-semibold text-primary">
                    💬 Perfeito para brindes e uso casual
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Dry Fit Esportivo */}
            <Card className="overflow-hidden group hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
              <div className="relative overflow-hidden h-64">
                <img 
                  src={fabricDryfit} 
                  alt="Tecido dry fit esportivo com textura microperfurada que seca rápido" 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute top-4 right-4 bg-secondary text-white px-3 py-1 rounded-full text-sm font-semibold">
                  💨 Performance
                </div>
              </div>
              <CardContent className="p-6">
                <h3 className="text-2xl font-bold mb-3 flex items-center gap-2">
                  ⚡ Dry Fit Esportivo
                </h3>
                <p className="text-muted-foreground mb-4 leading-relaxed">
                  Tecido leve e ventilado que seca rápido. 
                  Excelente para eventos, uniformes e atividades externas.
                </p>
                <div className="bg-secondary/10 border border-secondary/20 rounded-lg p-3">
                  <p className="text-sm font-semibold text-secondary">
                    💬 Alta performance e conforto térmico
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Premium Soft Touch */}
            <Card className="overflow-hidden group hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
              <div className="relative overflow-hidden h-64">
                <img 
                  src={fabricPremium} 
                  alt="Tecido premium soft touch com acabamento sofisticado e toque macio" 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute top-4 right-4 bg-accent text-white px-3 py-1 rounded-full text-sm font-semibold">
                  ✨ Premium
                </div>
              </div>
              <CardContent className="p-6">
                <h3 className="text-2xl font-bold mb-3 flex items-center gap-2">
                  👔 Premium Soft Touch
                </h3>
                <p className="text-muted-foreground mb-4 leading-relaxed">
                  Tecido premium com toque macio e caimento sofisticado. 
                  Perfeito para uniformes empresariais e linhas premium.
                </p>
                <div className="bg-accent/10 border border-accent/20 rounded-lg p-3">
                  <p className="text-sm font-semibold text-accent">
                    💬 Visual elegante, toque exclusivo
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* CTA para Personalização */}
          <div className="text-center space-y-4">
            <Link to="/personalizar">
              <Button variant="gradient" size="xl" className="group">
                🛒 Personalize sua camiseta agora
                <CheckCircle2 className="ml-2 group-hover:rotate-12 transition-transform" />
              </Button>
            </Link>
            <p className="text-muted-foreground text-sm max-w-2xl mx-auto">
              Escolha o tecido, o tipo de estampa e o tamanho ideal. Envie sua arte e receba seu pedido com aprovação pelo WhatsApp!
            </p>
          </div>
        </div>
      </section>

      {/* Cores Disponíveis */}
      <section className="py-20 px-4 bg-muted/50">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Cores Disponíveis</h2>
            <p className="text-muted-foreground text-lg">
              Escolha entre diversas cores vibrantes
            </p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-6">
            {colors.map((color, index) => (
              <div key={index} className="text-center group cursor-pointer">
                <div className={`w-20 h-20 rounded-full ${color.color} shadow-lg transform group-hover:scale-110 transition-transform`} />
                <p className="mt-2 text-sm font-medium">{color.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 px-4 bg-gradient-to-r from-primary via-secondary to-accent">
        <div className="container mx-auto text-center text-white">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            Pronto para Criar Sua Camisa?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Comece agora e receba em casa em poucos dias!
          </p>
          <Link to="/personalizar">
            <Button variant="outline" size="xl" className="bg-white text-primary hover:bg-white/90">
              Personalizar Agora
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 bg-muted/30 text-center text-muted-foreground">
        <p>&copy; 2025 StampShirts. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
};

export default Index;
