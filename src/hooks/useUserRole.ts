import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export type UserRole = "superadmin" | "admin" | "cliente" | "moderator" | "user" | null;

export interface UseUserRoleReturn {
  role: UserRole;
  loading: boolean;
  userEmail: string | null;
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
          setLoading(false);
          setDebugInfo({ userId: null, rawRoles: [], detectedRole: null });
          return;
        }

        setUserEmail(user.email || null);

        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
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
          setDebugInfo({
            userId: user.id,
            rawRoles: [],
            detectedRole: "error",
          });
        } else if (data && data.length > 0) {
          const roleHierarchy: UserRole[] = ["superadmin", "admin", "moderator", "cliente", "user"];
          const userRoles = data.map(r => r.role as UserRole);

          const highestRole = roleHierarchy.find(hierarchyRole =>
            userRoles.includes(hierarchyRole)
          );

          console.log("✅ Role detected:", highestRole, "from", userRoles);

          setRole(highestRole || null);
          setDebugInfo({
            userId: user.id,
            rawRoles: data,
            detectedRole: highestRole || "none",
          });
        } else {
          console.warn("⚠️ No roles found for user");
          setRole(null);
          setDebugInfo({
            userId: user.id,
            rawRoles: [],
            detectedRole: "no_roles",
          });
        }
      } catch (error) {
        console.error("❌ Exception fetching role:", error);
        setRole(null);
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

  return { role, loading, userEmail, debugInfo };
};
