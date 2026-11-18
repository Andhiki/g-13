import {
  createContext,
  useContext,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";

const AdminLayoutContext = createContext<{
  detailsOpen: boolean;
  setDetailsOpen: Dispatch<SetStateAction<boolean>>;
} | null>(null);

export function AdminLayoutProvider({ children }: { children: ReactNode }) {
  const [detailsOpen, setDetailsOpen] = useState(true);
  return (
    <AdminLayoutContext.Provider value={{ detailsOpen, setDetailsOpen }}>
      {children}
    </AdminLayoutContext.Provider>
  );
}

export function useAdminLayout() {
  const context = useContext(AdminLayoutContext);
  if (!context) throw new Error("Admin layout context is unavailable");
  return context;
}
