import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Crown, Medal } from "lucide-react";

interface AdminRanking {
  name: string;
  email: string;
  actions: number;
  rank: number;
}

interface TopAdminsRankingProps {
  admins: AdminRanking[];
}

export const TopAdminsRanking = ({ admins }: TopAdminsRankingProps) => {
  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Medal className="h-5 w-5 text-orange-600" />;
    return <span className="text-muted-foreground">#{rank}</span>;
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return "border-l-4 border-yellow-500";
    if (rank === 2) return "border-l-4 border-gray-400";
    if (rank === 3) return "border-l-4 border-orange-600";
    return "";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crown className="h-5 w-5 text-primary" />
          Top Admins por Atividade
        </CardTitle>
        <CardDescription>Ranking baseado em ações realizadas no período</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {admins.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhuma atividade registrada no período
            </p>
          ) : (
            admins.map((admin) => (
              <div
                key={admin.email}
                className={`flex items-center gap-4 p-3 rounded-lg bg-muted/50 ${getRankColor(admin.rank)}`}
              >
                <div className="flex items-center justify-center w-8">
                  {getRankIcon(admin.rank)}
                </div>
                <Avatar>
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {admin.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium">{admin.name}</p>
                  <p className="text-sm text-muted-foreground">{admin.email}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg text-primary">{admin.actions}</p>
                  <p className="text-xs text-muted-foreground">ações</p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
