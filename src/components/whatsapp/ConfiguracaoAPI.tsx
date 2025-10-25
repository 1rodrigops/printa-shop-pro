import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle2, XCircle, Key, Phone } from "lucide-react";

interface ConfiguracaoAPIProps {
  formData: {
    url: string;
    key: string;
    provider: string;
    numeroWhatsApp: string;
  };
  setFormData: (data: any) => void;
  testResult: { success: boolean; message: string } | null;
  testing: boolean;
  loading: boolean;
  onTestConnection: () => void;
  onTestNumber: () => void;
  onSave: () => void;
  onReset: () => void;
}

export const ConfiguracaoAPI = ({
  formData,
  setFormData,
  testResult,
  testing,
  loading,
  onTestConnection,
  onTestNumber,
  onSave,
  onReset,
}: ConfiguracaoAPIProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5 text-primary" />
          🔧 Configuração da API
        </CardTitle>
        <CardDescription>
          Configure a integração com sua API de WhatsApp (WuzAPI ou Evolution API)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="provider">Provedor de API</Label>
          <Select value={formData.provider} onValueChange={(value) => setFormData({ ...formData, provider: value })}>
            <SelectTrigger id="provider">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white z-50">
              <SelectItem value="WuzAPI">WuzAPI</SelectItem>
              <SelectItem value="Evolution API">Evolution API</SelectItem>
              <SelectItem value="Outro">Outro</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="url">URL do Servidor</Label>
          <Input
            id="url"
            type="text"
            placeholder="https://api.wuzapi.local/v1"
            value={formData.url}
            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="key">Chave de API Global</Label>
          <Input
            id="key"
            type="password"
            placeholder="••••••••••••••••"
            value={formData.key}
            onChange={(e) => setFormData({ ...formData, key: e.target.value })}
          />
        </div>

        <div className="border-t pt-4">
          <div className="space-y-2 mb-4">
            <Label htmlFor="numeroWhatsApp" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              ☎️ Número de WhatsApp Remetente
            </Label>
            <Input
              id="numeroWhatsApp"
              type="text"
              placeholder="+55 41 99999-0000"
              value={formData.numeroWhatsApp}
              onChange={(e) => setFormData({ ...formData, numeroWhatsApp: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Formato internacional: +55 (código país) + DDD + número
            </p>
          </div>

          <Button
            variant="outline"
            onClick={onTestNumber}
            disabled={testing || !formData.numeroWhatsApp}
            className="w-full mb-4"
          >
            {testing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            📞 Testar Número
          </Button>
        </div>

        {testResult && (
          <Alert variant={testResult.success ? "default" : "destructive"}>
            {testResult.success ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            <AlertDescription>{testResult.message}</AlertDescription>
          </Alert>
        )}

        <div className="flex gap-4">
          <Button onClick={onSave} disabled={loading} className="flex-1">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            💾 Salvar Configuração
          </Button>
          <Button variant="outline" onClick={onTestConnection} disabled={testing}>
            {testing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            🔍 Testar Conexão
          </Button>
          <Button variant="secondary" onClick={onReset}>
            🔄 Resetar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};