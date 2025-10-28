import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export type UserRole = "superadmin" | "admin" | "cliente" | "moderator" | "user" | "vendedor" | null;

export interface UserRoleData {
  role: UserRole;
  empresa_id: string | null;
}

export interface UseUserRoleReturn {
  role: UserRole;
  loading: boolean;
  userEmail: string | null;
  empresaId: string | null;
  allRoles: UserRoleData[];
  hasRole: (role: UserRole, empresaId?: string) => boolean;
  debugInfo: {
    userId: string | null;
    rawRoles: any[];
    detectedRole: string | null;
  };
}

export const useUserRole = (): UseUserRoleReturn => {
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [empresaId, setEmpresaId] = useState<string | null>(null);
  const [allRoles, setAllRoles] = useState<UserRoleData[]>([]);
  const [debugInfo, setDebugInfo] = useState<UseUserRoleReturn["debugInfo"]>({
    userId: null,
    rawRoles: [],
    detectedRole: null,
  });

  useEffect(() => {
    const fetchRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          setRole(null);
          setUserEmail(null);
          setEmpresaId(null);
          setAllRoles([]);
          setLoading(false);
          setDebugInfo({ userId: null, rawRoles: [], detectedRole: null });
          return;
        }

        setUserEmail(user.email || null);

        const { data, error } = await supabase
          .from("user_roles")
          .select("role, empresa_id")
          .eq("user_id", user.id);

        console.log("🔍 User Role Debug:", {
          userId: user.id,
          email: user.email,
          rawData: data,
          error: error,
        });

        if (error) {
          console.error("❌ Error fetching role:", error);
          setRole(null);
          setEmpresaId(null);
          setAllRoles([]);
          setDebugInfo({
            userId: user.id,
            rawRoles: [],
            detectedRole: "error",
          });
        } else if (data && data.length > 0) {
          const roleHierarchy: UserRole[] = ["superadmin", "admin", "vendedor", "moderator", "cliente", "user"];
          const userRoles: UserRoleData[] = data.map(r => ({
            role: r.role as UserRole,
            empresa_id: r.empresa_id
          }));

          setAllRoles(userRoles);

          const highestRole = roleHierarchy.find(hierarchyRole =>
            userRoles.some(ur => ur.role === hierarchyRole)
          );

          const primaryRoleData = userRoles.find(ur => ur.role === highestRole);

          console.log("✅ Role detected:", highestRole, "from", userRoles);

          setRole(highestRole || null);
          setEmpresaId(primaryRoleData?.empresa_id || null);
          setDebugInfo({
            userId: user.id,
            rawRoles: data,
            detectedRole: highestRole || "none",
          });
        } else {
          console.warn("⚠️ No roles found for user");
          setRole(null);
          setEmpresaId(null);
          setAllRoles([]);
          setDebugInfo({
            userId: user.id,
            rawRoles: [],
            detectedRole: "no_roles",
          });
        }
      } catch (error) {
        console.error("❌ Exception fetching role:", error);
        setRole(null);
        setEmpresaId(null);
        setAllRoles([]);
        setDebugInfo({
          userId: null,
          rawRoles: [],
          detectedRole: "exception",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchRole();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchRole();
    });

    return () => subscription.unsubscribe();
  }, []);

  const hasRole = (checkRole: UserRole, checkEmpresaId?: string): boolean => {
    if (!checkRole) return false;

    if (role === "superadmin") return true;

    if (checkEmpresaId) {
      return allRoles.some(r => r.role === checkRole && r.empresa_id === checkEmpresaId);
    }

    return allRoles.some(r => r.role === checkRole);
  };

  return { role, loading, userEmail, empresaId, allRoles, hasRole, debugInfo };
};
