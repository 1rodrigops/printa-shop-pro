import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Verificar autenticação
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verificar se é superadmin
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (roleError || roleData?.role !== "superadmin") {
      return new Response(JSON.stringify({ error: "Forbidden: Only superadmin can manage users" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, data } = await req.json();

    switch (action) {
      case "create": {
        const { email, password, nome_completo, telefone, status, role } = data;

        // Criar usuário
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            nome_completo,
            telefone: telefone || "",
            status,
          },
        });

        if (createError) throw createError;

        // Atribuir role
        const { error: roleInsertError } = await supabaseAdmin
          .from("user_roles")
          .insert({
            user_id: newUser.user.id,
            role,
          });

        if (roleInsertError) throw roleInsertError;

        return new Response(JSON.stringify({ user: newUser.user }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "update": {
        const { userId, email, password, nome_completo, telefone, status, role } = data;

        // Atualizar usuário
        const updateData: any = {
          email,
          user_metadata: {
            nome_completo,
            telefone: telefone || "",
            status,
          },
        };

        if (password) {
          updateData.password = password;
        }

        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
          userId,
          updateData
        );

        if (updateError) throw updateError;

        // Atualizar role
        const { error: roleUpdateError } = await supabaseAdmin
          .from("user_roles")
          .update({ role })
          .eq("user_id", userId);

        if (roleUpdateError) throw roleUpdateError;

        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "delete": {
        const { userId } = data;

        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

        if (deleteError) throw deleteError;

        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "list": {
        // Buscar todos os usuários com suas roles
        const { data: rolesData, error: rolesError } = await supabaseAdmin
          .from("user_roles")
          .select("user_id, role");

        if (rolesError) throw rolesError;

        // Buscar dados dos usuários
        const usersWithRoles = [];

        for (const roleData of rolesData) {
          const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(
            roleData.user_id
          );

          if (userError) {
            console.error("Error fetching user:", userError);
            continue;
          }

          if (userData.user) {
            usersWithRoles.push({
              id: userData.user.id,
              email: userData.user.email,
              role: roleData.role,
              created_at: userData.user.created_at,
              last_sign_in_at: userData.user.last_sign_in_at,
              metadata: userData.user.user_metadata,
            });
          }
        }

        return new Response(JSON.stringify({ users: usersWithRoles }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        return new Response(JSON.stringify({ error: "Invalid action" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
