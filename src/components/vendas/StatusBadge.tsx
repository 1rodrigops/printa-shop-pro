import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  status: string;
  orderId: string;
  onStatusChange: (newStatus: any) => void;
}

const statusConfig = {
  pending: { label: "🔵 Pendente", color: "bg-blue-500" },
  processing: { label: "🧵 Produção", color: "bg-orange-500" },
  completed: { label: "✅ Concluído", color: "bg-emerald-500" },
  cancelled: { label: "❌ Cancelado", color: "bg-red-500" },
};

const StatusBadge = ({ status, orderId, onStatusChange }: StatusBadgeProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const currentStatus = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;

  if (isEditing) {
    return (
      <Select
        defaultValue={status}
        onValueChange={(value) => {
          onStatusChange(value);
          setIsEditing(false);
        }}
        onOpenChange={(open) => !open && setIsEditing(false)}
      >
        <SelectTrigger className="w-[150px] h-8">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="pending">🔵 Pendente</SelectItem>
          <SelectItem value="processing">🧵 Produção</SelectItem>
          <SelectItem value="completed">✅ Concluído</SelectItem>
          <SelectItem value="cancelled">❌ Cancelado</SelectItem>
        </SelectContent>
      </Select>
    );
  }

  return (
    <Badge
      className="cursor-pointer hover:opacity-80"
      onClick={() => setIsEditing(true)}
    >
      {currentStatus.label}
    </Badge>
  );
};

export default StatusBadge;
