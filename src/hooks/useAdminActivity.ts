import { supabase } from "@/integrations/supabase/client";

export const useAdminActivity = () => {
  const logActivity = async (
    actionType: string,
    actionDetail: string,
    metadata?: any
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const { error } = await supabase.rpc('log_admin_activity', {
        p_action_type: actionType,
        p_action_detail: actionDetail,
        p_metadata: metadata ? JSON.stringify(metadata) : null,
      });

      if (error) {
        console.error('Error logging activity:', error);
      }
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  };

  const logLogin = async () => {
    await logActivity('login', 'Fez login no sistema');
  };

  const logLogout = async () => {
    await logActivity('logout', 'Fez logout do sistema');
  };

  return {
    logActivity,
    logLogin,
    logLogout,
  };
};
