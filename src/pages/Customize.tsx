import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Upload, Check, MessageCircle, Shirt, Sparkles, Package, Image as ImageIcon, Plus, Minus, CreditCard, UserCircle } from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import { ModalPagamento } from "@/components/pagamento/ModalPagamento";
import { supabase } from "@/integrations/supabase/client";
import { PasswordInput } from "@/components/PasswordInput";
import { PasswordConfirmInput } from "@/components/PasswordConfirmInput";

type PrintType = "front" | "both";
type FabricType = "cotton" | "dryfit" | "premium";
type SizeQuantities = {
  PP: number;
  P: number;
  M: number;
  G: number;
  GG: number;
  XG: number;
};

const Customize = () => {
  const [printType, setPrintType] = useState<PrintType>("front");
  const [fabricType, setFabricType] = useState<FabricType>("cotton");
  const [sizeQuantities, setSizeQuantities] = useState<SizeQuantities>({
    PP: 0,
    P: 0,
    M: 0,
    G: 0,
    GG: 0,
    XG: 0,
  });
  const [previewColor, setPreviewColor] = useState("#FFFFFF");
  const [frontImage, setFrontImage] = useState<File | null>(null);
  const [backImage, setBackImage] = useState<File | null>(null);
  const [frontPreview, setFrontPreview] = useState<string>("");
  const [backPreview, setBackPreview] = useState<string>("");
  
  const [showLoginStep, setShowLoginStep] = useState(true);
  const [hasAccount, setHasAccount] = useState<boolean | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [formData, setFormData] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    endereco_rua: "",
    endereco_numero: "",
    endereco_bairro: "",
    endereco_cidade: "",
    endereco_uf: "",
    cep: "",
  });

  const [metodoPagamento, setMetodoPagamento] = useState<'pix' | 'pagseguro' | 'mercadopago'>('pix');
  const [modalPagamentoOpen, setModalPagamentoOpen] = useState(false);
  const [dadosPagamento, setDadosPagamento] = useState<any>(null);
  const [processando, setProcessando] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsAuthenticated(true);
        setShowLoginStep(false);
        setFormData(prev => ({
          ...prev,
          customerEmail: session.user.email || "",
        }));
      }
    };
    checkAuth();
  }, []);

  const handleLogin = async () => {
    if (!loginEmail || !loginPassword) {
      toast.error("Preencha email e senha para fazer login");
      return;
    }

    setIsLoggingIn(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });

      if (error) throw error;

      toast.success("Login realizado com sucesso!");
      setIsAuthenticated(true);
      setShowLoginStep(false);
      setFormData(prev => ({
        ...prev,
        customerEmail: data.user.email || "",
      }));
    } catch (error: any) {
      toast.error("Erro ao fazer login", {
        description: error.message === "Invalid login credentials"
          ? "Email ou senha incorretos"
          : error.message
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const validatePasswordStrength = (password: string): boolean => {
    const requirements = {
      length: password.length >= 9,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      noSpaces: !/\s/.test(password),
    };
    return Object.values(requirements).every(Boolean);
  };

  const handleRegister = async () => {
    if (!formData.customerName || !formData.customerEmail) {
      toast.error("Preencha nome e email para criar sua conta");
      return;
    }

    if (!registerPassword) {
      toast.error("Defina uma senha para sua conta");
      return;
    }

    if (!validatePasswordStrength(registerPassword)) {
      toast.error("Senha não atende aos requisitos de segurança");
      return;
    }

    if (registerPassword !== confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }

    setIsLoggingIn(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.customerEmail,
        password: registerPassword,
        options: {
          data: {
            nome_completo: formData.customerName,
            telefone: formData.customerPhone,
          },
        },
      });

      if (error) throw error;

      toast.success("Conta criada com sucesso!", {
        description: "Você já pode continuar com seu pedido"
      });
      setIsAuthenticated(true);
      setShowLoginStep(false);
    } catch (error: any) {
      toast.error("Erro ao criar conta", {
        description: error.message
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const colors = [
    { name: "Branco", hex: "#FFFFFF", border: true },
    { name: "Preto", hex: "#000000" },
    { name: "Cinza", hex: "#6B7280" },
    { name: "Azul-marinho", hex: "#1E3A8A" },
    { name: "Vermelho", hex: "#DC2626" },
  ];

  const sizes: (keyof SizeQuantities)[] = ["PP", "P", "M", "G", "GG", "XG"];

  const fabricOptions = [
    { 
      id: "cotton", 
      name: "Algodão Tradicional", 
      description: "Conforto e toque natural", 
      price: 0 
    },
    { 
      id: "dryfit", 
      name: "Dry Fit Esportivo", 
      description: "Leve, ideal para eventos ao ar livre", 
      price: 10 
    },
    { 
      id: "premium", 
      name: "Premium Soft Touch", 
      description: "Tecido nobre, ideal para uniformes de empresa", 
      price: 20 
    },
  ];

  const calculateBasePrice = () => {
    return printType === "front" ? 75 : 95;
  };

  const calculateFabricPrice = () => {
    const fabric = fabricOptions.find(f => f.id === fabricType);
    return fabric?.price || 0;
  };

  const getTotalQuantity = () => {
    return Object.values(sizeQuantities).reduce((sum, qty) => sum + qty, 0);
  };

  const calculateUnitPrice = () => {
    const totalQty = getTotalQuantity();
    if (totalQty >= 10) return 70;
    return calculateBasePrice() + calculateFabricPrice();
  };

  const calculateTotal = () => {
    return calculateUnitPrice() * getTotalQuantity();
  };

  const updateSizeQuantity = (size: keyof SizeQuantities, delta: number) => {
    setSizeQuantities(prev => ({
      ...prev,
      [size]: Math.max(0, prev[size] + delta)
    }));
  };

  const setSizeQuantityDirect = (size: keyof SizeQuantities, value: number) => {
    setSizeQuantities(prev => ({
      ...prev,
      [size]: Math.max(0, value)
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, side: "front" | "back") => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Arquivo muito grande! Máximo 10MB");
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        if (side === "front") {
          setFrontImage(file);
          setFrontPreview(reader.result as string);
        } else {
          setBackImage(file);
          setBackPreview(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!frontImage) {
      toast.error("Por favor, envie a arte para a frente da camiseta!");
      return;
    }

    if (printType === "both" && !backImage) {
      toast.error("Por favor, envie a arte para o verso da camiseta!");
      return;
    }

    const totalQty = getTotalQuantity();
    if (totalQty === 0) {
      toast.error("Por favor, selecione ao menos uma quantidade em um tamanho para continuar!");
      return;
    }

    // Validar dados do cliente
    if (!formData.customerName || !formData.customerEmail || !formData.customerPhone) {
      toast.error("Por favor, preencha todos os dados de contato!");
      return;
    }

    if (!formData.cep || !formData.endereco_rua || !formData.endereco_cidade || !formData.endereco_uf) {
      toast.error("Por favor, preencha o endereço completo!");
      return;
    }

    setProcessando(true);

    try {
      const fabric = fabricOptions.find(f => f.id === fabricType);
      const selectedColor = colors.find(c => c.hex === previewColor);

      // Preparar dados do pedido
      const pedidoData = {
        cliente: {
          nome: formData.customerName,
          email: formData.customerEmail,
          telefone: formData.customerPhone,
          endereco_rua: formData.endereco_rua,
          endereco_numero: formData.endereco_numero,
          endereco_bairro: formData.endereco_bairro,
          endereco_cidade: formData.endereco_cidade,
          endereco_uf: formData.endereco_uf,
          cep: formData.cep
        },
        produtos: {
          tipo_estampa: printType === "front" ? "Somente Frente" : "Frente e Verso",
          tecido: fabric?.name || "Algodão Tradicional",
          tamanhos: sizeQuantities,
          cor: selectedColor?.name || "Branco",
          total_pecas: totalQty
        },
        pagamento: {
          metodo: metodoPagamento,
          valor_total: calculateTotal()
        },
        imagens: {
          frente: frontPreview,
          verso: backPreview || undefined
        }
      };

      console.log('Enviando pedido:', pedidoData);

      // Chamar edge function para criar pedido e processar pagamento
      const { data, error } = await supabase.functions.invoke('criar-pedido-pagamento', {
        body: pedidoData
      });

      if (error) {
        console.error('Erro ao criar pedido:', error);
        throw new Error(error.message || 'Erro ao processar pedido');
      }

      console.log('Resposta do servidor:', data);

      if (!data.success) {
        throw new Error(data.error || 'Erro ao processar pedido');
      }

      // Armazenar dados para o modal
      setDadosPagamento({
        pedidoId: data.pedido_id,
        pagamentoUrl: data.pagamento_url,
        qrCodeData: data.qr_code_data
      });

      // Abrir modal de pagamento
      setModalPagamentoOpen(true);

      toast.success("Pedido criado com sucesso!", {
        description: "Complete o pagamento para confirmar"
      });

    } catch (error) {
      console.error('Erro ao processar pedido:', error);
      toast.error("Erro ao processar pedido", {
        description: error instanceof Error ? error.message : "Tente novamente"
      });
    } finally {
      setProcessando(false);
    }
  };

  if (showLoginStep) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <Navbar />

        <div className="container mx-auto px-4 pt-24 pb-20">
          <div className="text-center mb-12 animate-fade-in">
            <Badge className="mb-4 bg-accent text-accent-foreground">
              🎉 Promoção válida até 31/10/2025
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                Camiseta Personalizada Profissional
              </span>
            </h1>
          </div>

          <div className="max-w-2xl mx-auto">
            {hasAccount === null ? (
              <Card className="border-2 border-primary/20">
                <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10">
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <UserCircle className="w-6 h-6" />
                    Bem-vindo! Vamos começar
                  </CardTitle>
                  <CardDescription className="text-base">
                    Para fazer seu pedido, você precisa ter uma conta
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <p className="text-center text-muted-foreground mb-6">
                    Você já possui uma conta cadastrada?
                  </p>
                  <div className="grid gap-3">
                    <Button
                      onClick={() => setHasAccount(true)}
                      size="lg"
                      className="w-full text-lg py-6"
                    >
                      Sim, já tenho conta
                    </Button>
                    <Button
                      onClick={() => setHasAccount(false)}
                      variant="outline"
                      size="lg"
                      className="w-full text-lg py-6"
                    >
                      Não, quero criar uma conta
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : hasAccount ? (
              <Card className="border-2 border-primary/20">
                <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10">
                  <CardTitle>Login</CardTitle>
                  <CardDescription>
                    Entre com seu email e senha para continuar
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div>
                    <Label htmlFor="login-email">Email *</Label>
                    <Input
                      id="login-email"
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="seu@email.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="login-password">Senha *</Label>
                    <Input
                      id="login-password"
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Digite sua senha"
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <Button
                      onClick={handleLogin}
                      disabled={isLoggingIn}
                      className="flex-1"
                    >
                      {isLoggingIn ? "Entrando..." : "Entrar"}
                    </Button>
                    <Button
                      onClick={() => setHasAccount(null)}
                      variant="outline"
                      className="flex-1"
                    >
                      Voltar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-2 border-primary/20">
                <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10">
                  <CardTitle>Criar Conta</CardTitle>
                  <CardDescription>
                    Preencha seus dados para criar sua conta e fazer o pedido
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div>
                    <Label htmlFor="register-name">Nome Completo *</Label>
                    <Input
                      id="register-name"
                      value={formData.customerName}
                      onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                      placeholder="Seu nome completo"
                    />
                  </div>
                  <div>
                    <Label htmlFor="register-email">Email *</Label>
                    <Input
                      id="register-email"
                      type="email"
                      value={formData.customerEmail}
                      onChange={(e) => setFormData({...formData, customerEmail: e.target.value})}
                      placeholder="seu@email.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="register-phone">WhatsApp *</Label>
                    <Input
                      id="register-phone"
                      type="tel"
                      value={formData.customerPhone}
                      onChange={(e) => setFormData({...formData, customerPhone: e.target.value})}
                      placeholder="(41) 99999-9999"
                    />
                  </div>
                  <div>
                    <PasswordInput
                      value={registerPassword}
                      onChange={setRegisterPassword}
                      label="Senha"
                      placeholder="Crie uma senha segura"
                      showStrengthIndicator={true}
                    />
                  </div>
                  <div>
                    <PasswordConfirmInput
                      value={confirmPassword}
                      onChange={setConfirmPassword}
                      passwordValue={registerPassword}
                      label="Confirmar Senha"
                      placeholder="Digite sua senha novamente"
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <Button
                      onClick={handleRegister}
                      disabled={isLoggingIn}
                      className="flex-1"
                    >
                      {isLoggingIn ? "Criando conta..." : "Criar Conta e Continuar"}
                    </Button>
                    <Button
                      onClick={() => setHasAccount(null)}
                      variant="outline"
                      className="flex-1"
                    >
                      Voltar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Navbar />
      
      <div className="container mx-auto px-4 pt-24 pb-20">
        {/* Hero */}
        <div className="text-center mb-12 animate-fade-in">
          <Badge className="mb-4 bg-accent text-accent-foreground">
            🎉 Promoção válida até 31/10/2025
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              Camiseta Personalizada Profissional
            </span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground">
            Escolha o tecido, personalize e receba em casa. Perfeito para eventos e uniformes!
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {/* Coluna 1 - Configuração */}
          <div className="lg:col-span-2 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Tipo de Estampa */}
              <Card className="border-2 border-primary/20">
                <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10">
                  <CardTitle className="flex items-center gap-2">
                    <Shirt className="w-5 h-5" />
                    Escolha o tipo de estampa
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <RadioGroup value={printType} onValueChange={(v) => setPrintType(v as PrintType)}>
                    <div className="grid md:grid-cols-2 gap-4">
                      <label className={`relative flex items-center space-x-3 border-2 rounded-lg p-4 cursor-pointer transition-all hover:scale-105 ${
                        printType === "front" ? "border-primary bg-primary/10" : "border-border"
                      }`}>
                        <RadioGroupItem value="front" id="front" />
                        <div className="flex-1">
                          <div className="font-semibold text-lg">🟠 Somente Frente</div>
                          <div className="text-sm text-muted-foreground">R$ 75,00</div>
                        </div>
                      </label>
                      
                      <label className={`relative flex items-center space-x-3 border-2 rounded-lg p-4 cursor-pointer transition-all hover:scale-105 ${
                        printType === "both" ? "border-primary bg-primary/10" : "border-border"
                      }`}>
                        <RadioGroupItem value="both" id="both" />
                        <div className="flex-1">
                          <div className="font-semibold text-lg">⚫ Frente e Verso</div>
                          <div className="text-sm text-muted-foreground">R$ 95,00</div>
                        </div>
                      </label>
                    </div>
                  </RadioGroup>
                  <p className="text-sm text-muted-foreground mt-4">
                    💡 A opção frente e verso inclui impressão nos dois lados — ideal para eventos e uniformes corporativos.
                  </p>
                </CardContent>
              </Card>

              {/* Tipo de Tecido */}
              <Card className="border-2 border-primary/20">
                <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10">
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    Escolha o tipo de tecido
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <RadioGroup value={fabricType} onValueChange={(v) => setFabricType(v as FabricType)}>
                    <div className="space-y-3">
                      {fabricOptions.map((fabric) => (
                        <label 
                          key={fabric.id}
                          className={`relative flex items-center space-x-3 border-2 rounded-lg p-4 cursor-pointer transition-all hover:scale-105 ${
                            fabricType === fabric.id ? "border-primary bg-primary/10" : "border-border"
                          }`}
                        >
                          <RadioGroupItem value={fabric.id} id={fabric.id} />
                          <div className="flex-1">
                            <div className="font-semibold">{fabric.name}</div>
                            <div className="text-sm text-muted-foreground">{fabric.description}</div>
                          </div>
                          {fabric.price > 0 && (
                            <Badge variant="secondary">+ R$ {fabric.price},00</Badge>
                          )}
                        </label>
                      ))}
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>

              {/* Upload das Artes */}
              <Card className="border-2 border-primary/20">
                <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10">
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="w-5 h-5" />
                    Envie sua logo ou imagem para estampar
                  </CardTitle>
                  <CardDescription>JPG ou PNG até 10MB</CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div>
                    <Label htmlFor="front-image" className="text-base font-semibold mb-2 block">
                      Arte da Frente *
                    </Label>
                    <Input
                      id="front-image"
                      type="file"
                      accept="image/png,image/jpeg"
                      onChange={(e) => handleImageChange(e, "front")}
                      className="cursor-pointer"
                    />
                    {frontPreview && (
                      <div className="mt-3 relative w-32 h-32 border-2 border-primary/20 rounded-lg overflow-hidden">
                        <img src={frontPreview} alt="Preview Frente" className="w-full h-full object-contain" />
                      </div>
                    )}
                  </div>

                  {printType === "both" && (
                    <div>
                      <Label htmlFor="back-image" className="text-base font-semibold mb-2 block">
                        Arte do Verso *
                      </Label>
                      <Input
                        id="back-image"
                        type="file"
                        accept="image/png,image/jpeg"
                        onChange={(e) => handleImageChange(e, "back")}
                        className="cursor-pointer"
                      />
                      {backPreview && (
                        <div className="mt-3 relative w-32 h-32 border-2 border-primary/20 rounded-lg overflow-hidden">
                          <img src={backPreview} alt="Preview Verso" className="w-full h-full object-contain" />
                        </div>
                      )}
                    </div>
                  )}

                  {frontPreview && (
                    <Button type="button" variant="outline" size="sm" className="w-full">
                      <ImageIcon className="w-4 h-4 mr-2" />
                      Pré-visualizar Estampa
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Pré-visualização com Cores */}
              {frontPreview && (
                <Card className="border-2 border-primary/20">
                  <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10">
                    <CardTitle>Veja como sua arte fica em diferentes cores!</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-center mb-4">
                      <div 
                        className="relative w-64 h-64 rounded-lg shadow-lg flex items-center justify-center"
                        style={{ backgroundColor: previewColor }}
                      >
                        <img 
                          src={frontPreview} 
                          alt="Preview" 
                          className="max-w-[50%] max-h-[50%] object-contain"
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-center gap-3">
                      {colors.map((color) => (
                        <button
                          key={color.hex}
                          type="button"
                          onClick={() => setPreviewColor(color.hex)}
                          className={`w-12 h-12 rounded-full transition-all hover:scale-110 ${
                            previewColor === color.hex ? "ring-4 ring-primary" : ""
                          } ${color.border ? "border-2 border-border" : ""}`}
                          style={{ backgroundColor: color.hex }}
                          title={color.name}
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Tamanhos com Quantidade */}
              <Card className="border-2 border-primary/20">
                <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10">
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Escolha os tamanhos e quantidades *
                  </CardTitle>
                  {getTotalQuantity() >= 10 && (
                    <Badge className="w-fit bg-accent text-accent-foreground">
                      🎉 Desconto automático aplicado!
                    </Badge>
                  )}
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div className="grid gap-3">
                    {sizes.map((size) => (
                      <div 
                        key={size}
                        className="flex items-center justify-between border-2 border-border rounded-lg p-4 hover:border-primary/50 transition-colors"
                      >
                        <div className="font-semibold text-lg min-w-[50px]">{size}</div>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => updateSizeQuantity(size, -1)}
                            disabled={sizeQuantities[size] === 0}
                            className="h-8 w-8"
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <Input
                            type="number"
                            min="0"
                            value={sizeQuantities[size]}
                            onChange={(e) => setSizeQuantityDirect(size, parseInt(e.target.value) || 0)}
                            className="w-20 text-center text-lg font-semibold"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => updateSizeQuantity(size, 1)}
                            className="h-8 w-8"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="bg-primary/10 border-2 border-primary/20 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-lg">Total de camisetas:</span>
                      <span className="text-2xl font-bold text-primary">{getTotalQuantity()} unidades</span>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground">
                    💡 <strong>Desconto automático para pedidos com 10 ou mais camisetas:</strong> R$ 70,00 cada (independente do tipo de estampa ou tecido)
                  </p>
                </CardContent>
              </Card>

              {/* Dados do Cliente */}
              <Card className="border-2 border-primary/20">
                <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10">
                  <CardTitle>Seus Dados</CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div>
                    <Label htmlFor="name">Nome Completo *</Label>
                    <Input
                      id="name"
                      value={formData.customerName}
                      onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.customerEmail}
                      onChange={(e) => setFormData({...formData, customerEmail: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">WhatsApp *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="(41) 99999-9999"
                      value={formData.customerPhone}
                      onChange={(e) => setFormData({...formData, customerPhone: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="cep">CEP *</Label>
                    <Input
                      id="cep"
                      placeholder="00000-000"
                      value={formData.cep}
                      onChange={(e) => setFormData({...formData, cep: e.target.value})}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <Label htmlFor="endereco_rua">Rua *</Label>
                      <Input
                        id="endereco_rua"
                        value={formData.endereco_rua}
                        onChange={(e) => setFormData({...formData, endereco_rua: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="endereco_numero">Número *</Label>
                      <Input
                        id="endereco_numero"
                        value={formData.endereco_numero}
                        onChange={(e) => setFormData({...formData, endereco_numero: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="endereco_bairro">Bairro *</Label>
                    <Input
                      id="endereco_bairro"
                      value={formData.endereco_bairro}
                      onChange={(e) => setFormData({...formData, endereco_bairro: e.target.value})}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <Label htmlFor="endereco_cidade">Cidade *</Label>
                      <Input
                        id="endereco_cidade"
                        value={formData.endereco_cidade}
                        onChange={(e) => setFormData({...formData, endereco_cidade: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="endereco_uf">UF *</Label>
                      <Input
                        id="endereco_uf"
                        placeholder="PR"
                        maxLength={2}
                        value={formData.endereco_uf}
                        onChange={(e) => setFormData({...formData, endereco_uf: e.target.value.toUpperCase()})}
                        required
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Forma de Pagamento */}
              <Card className="border-2 border-primary/20">
                <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10">
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Forma de Pagamento
                  </CardTitle>
                  <CardDescription>Escolha como deseja pagar seu pedido</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <RadioGroup value={metodoPagamento} onValueChange={(v) => setMetodoPagamento(v as 'pix' | 'pagseguro' | 'mercadopago')}>
                    <div className="space-y-3">
                      <label className={`relative flex items-center space-x-3 border-2 rounded-lg p-4 cursor-pointer transition-all hover:scale-105 ${
                        metodoPagamento === 'pix' ? "border-primary bg-primary/10" : "border-border"
                      }`}>
                        <RadioGroupItem value="pix" id="pix" />
                        <div className="flex-1">
                          <div className="font-semibold text-lg">💠 PIX</div>
                          <div className="text-sm text-muted-foreground">Pagamento instantâneo via chave PIX</div>
                        </div>
                        <Badge variant="secondary">Mais rápido</Badge>
                      </label>
                      
                      <label className={`relative flex items-center space-x-3 border-2 rounded-lg p-4 cursor-pointer transition-all hover:scale-105 ${
                        metodoPagamento === 'pagseguro' ? "border-primary bg-primary/10" : "border-border"
                      }`}>
                        <RadioGroupItem value="pagseguro" id="pagseguro" />
                        <div className="flex-1">
                          <div className="font-semibold text-lg">💳 Cartão - PagSeguro</div>
                          <div className="text-sm text-muted-foreground">Crédito ou débito em até 12x</div>
                        </div>
                      </label>
                      
                      <label className={`relative flex items-center space-x-3 border-2 rounded-lg p-4 cursor-pointer transition-all hover:scale-105 ${
                        metodoPagamento === 'mercadopago' ? "border-primary bg-primary/10" : "border-border"
                      }`}>
                        <RadioGroupItem value="mercadopago" id="mercadopago" />
                        <div className="flex-1">
                          <div className="font-semibold text-lg">🛍️ Mercado Pago</div>
                          <div className="text-sm text-muted-foreground">Cartão, boleto ou saldo Mercado Pago</div>
                        </div>
                      </label>
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>

              {/* Botão de Envio */}
              <Button 
                type="submit" 
                size="lg" 
                className="w-full text-lg py-6"
                disabled={processando}
              >
                {processando ? (
                  <>Processando...</>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5 mr-2" />
                    💳 FINALIZAR PEDIDO
                  </>
                )}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                🔒 Pagamento 100% seguro • Seus dados estão protegidos
              </p>
            </form>
          </div>

          {/* Coluna 2 - Resumo do Pedido (Fixo) */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24 border-2 border-primary/20 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10">
                <CardTitle className="text-xl">Resumo do Pedido</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between pb-2 border-b">
                    <span className="text-muted-foreground">Tipo de estampa:</span>
                    <span className="font-semibold">{printType === "front" ? "Somente Frente" : "Frente e Verso"}</span>
                  </div>
                  
                  <div className="flex justify-between pb-2 border-b">
                    <span className="text-muted-foreground">Tecido:</span>
                    <span className="font-semibold">{fabricOptions.find(f => f.id === fabricType)?.name}</span>
                  </div>
                  
                  <div className="flex justify-between pb-2 border-b">
                    <span className="text-muted-foreground">Quantidade:</span>
                    <span className="font-semibold">{getTotalQuantity()} {getTotalQuantity() === 1 ? "unidade" : "unidades"}</span>
                  </div>
                  
                  <div className="flex justify-between pb-2 border-b">
                    <span className="text-muted-foreground">Cor:</span>
                    <span className="font-semibold">{colors.find(c => c.hex === previewColor)?.name || "Branco"}</span>
                  </div>
                  
                  <div className="flex justify-between pb-2 border-b">
                    <span className="text-muted-foreground">Tamanhos:</span>
                    <span className="font-semibold">
                      {sizes
                        .filter(size => sizeQuantities[size] > 0)
                        .map(size => `${sizeQuantities[size]} ${size}`)
                        .join(", ") || "—"}
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t-2 border-primary/20">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-muted-foreground">Preço unitário:</span>
                    <span className="font-semibold">R$ {calculateUnitPrice().toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center text-2xl font-bold">
                    <span className="text-primary">Total:</span>
                    <span className="text-primary">R$ {calculateTotal().toFixed(2)}</span>
                  </div>
                  
                  {getTotalQuantity() >= 10 && (
                    <Badge className="w-full mt-3 justify-center bg-accent text-accent-foreground">
                      🎉 Desconto aplicado!
                    </Badge>
                  )}
                </div>

                <div className="pt-4 space-y-2 text-xs text-muted-foreground border-t">
                  <p className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    Produção em até 3 dias úteis após aprovação do layout
                  </p>
                  <p className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    Enviamos para todo o Brasil ou retirada em Curitiba
                  </p>
                  <p className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    Você receberá o layout por e-mail/WhatsApp para aprovação
                  </p>
                  <p className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    Trocas apenas por defeito de fabricação
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Informações Complementares */}
        <div className="max-w-4xl mx-auto mt-12 space-y-6">
          <Card className="border-2 border-accent/20">
            <CardHeader className="bg-gradient-to-r from-accent/10 to-primary/10">
              <CardTitle className="text-center">🎁 Na compra de 10 camisetas, ganhe 1 grátis!</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">
                Promoção válida até 31/10/2025. Aproveite nossos descontos progressivos em pedidos maiores!
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-center">📦 Política de Trocas e Garantia</CardTitle>
            </CardHeader>
            <CardContent className="text-center text-sm text-muted-foreground">
              <p>
                Trocas somente por defeito de fabricação. Confirme o tamanho antes de finalizar.
                <br />
                Garantimos a qualidade do tecido e impressão.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal de Pagamento */}
      {dadosPagamento && (
        <ModalPagamento
          open={modalPagamentoOpen}
          onClose={() => setModalPagamentoOpen(false)}
          metodo={metodoPagamento}
          pagamentoUrl={dadosPagamento.pagamentoUrl}
          qrCodeData={dadosPagamento.qrCodeData}
          pedidoId={dadosPagamento.pedidoId}
        />
      )}
    </div>
  );
};

export default Customize;
