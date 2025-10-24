import { Progress } from "@/components/ui/progress";
import { Package, Scissors, CheckCircle, Truck, PartyPopper } from "lucide-react";

interface OrderProgressBarProps {
  status: string;
}

const statusSteps = [
  { key: "pending", label: "Pedido Recebido", icon: Package, color: "text-gray-400" },
  { key: "in_production", label: "Em Produção", icon: Scissors, color: "text-blue-500" },
  { key: "completed", label: "Finalizado", icon: CheckCircle, color: "text-green-500" },
  { key: "shipped", label: "Enviado", icon: Truck, color: "text-orange-500" },
  { key: "delivered", label: "Entregue", icon: PartyPopper, color: "text-green-700" },
];

export const OrderProgressBar = ({ status }: OrderProgressBarProps) => {
  const currentStepIndex = statusSteps.findIndex((step) => step.key === status);
  const progress = currentStepIndex >= 0 ? ((currentStepIndex + 1) / statusSteps.length) * 100 : 0;

  return (
    <div className="space-y-6">
      <Progress value={progress} className="h-3" />
      
      <div className="flex justify-between items-start">
        {statusSteps.map((step, index) => {
          const Icon = step.icon;
          const isActive = index <= currentStepIndex;
          const isCurrent = index === currentStepIndex;
          
          return (
            <div key={step.key} className="flex flex-col items-center flex-1">
              <div
                className={`rounded-full p-3 mb-2 transition-all ${
                  isActive ? "bg-primary/10" : "bg-muted"
                } ${isCurrent ? "ring-2 ring-primary scale-110" : ""}`}
              >
                <Icon
                  className={`h-6 w-6 ${
                    isActive ? step.color : "text-muted-foreground"
                  }`}
                />
              </div>
              <p
                className={`text-xs text-center font-medium ${
                  isActive ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {step.label}
              </p>
            </div>
          );
        })}
      </div>
      
      <div className="text-center">
        <p className="text-sm font-semibold text-foreground">
          Status atual: {statusSteps[currentStepIndex]?.label || "Aguardando"}
        </p>
      </div>
    </div>
  );
};
