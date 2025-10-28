import { createContext, useContext, ReactNode } from "react";
import { useTenant, Tenant, TenantBranding } from "@/hooks/useTenant";

interface TenantContextType {
  tenant: Tenant | null;
  branding: TenantBranding | null;
  loading: boolean;
  error: string | null;
  switchTenant: (slug: string) => Promise<void>;
  reload: () => Promise<void>;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const TenantProvider = ({ children }: { children: ReactNode }) => {
  const tenantData = useTenant();

  return (
    <TenantContext.Provider value={tenantData}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenantContext = () => {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error("useTenantContext deve ser usado dentro de um TenantProvider");
  }
  return context;
};
