import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export type UserRole = "superadmin" | "admin" | "cliente" | "moderator" | "user" | null;

export const useUserRole = () => {
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        console.log("=== useUserRole Debug ===");
        console.log("User ID:", user?.id);
        console.log("User email:", user?.email);

        if (!user) {
          console.log("No user found");
          setRole(null);
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id);

        console.log("Query result - data:", data);
        console.log("Query result - error:", error);

        if (error) {
          console.error("Error fetching role:", error);
          setRole(null);
        } else if (data && data.length > 0) {
          const roleHierarchy: UserRole[] = ["superadmin", "admin", "moderator", "cliente", "user"];

          const userRoles = data.map(r => r.role as UserRole);
          console.log("User roles found:", userRoles);

          const highestRole = roleHierarchy.find(hierarchyRole =>
            userRoles.includes(hierarchyRole)
          );

          console.log("Highest role assigned:", highestRole);
          setRole(highestRole || null);
        } else {
          console.log("No roles found for user");
          setRole(null);
        }
      } catch (error) {
        console.error("Error fetching role:", error);
        setRole(null);
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

  return { role, loading };
};
