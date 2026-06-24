import React, { createContext, useContext } from "react";
import type { Organization } from "../components/Header";

interface ActiveOrgContextType {
  activeOrg: Organization | null;
  setActiveOrg?: React.Dispatch<React.SetStateAction<Organization | null>>;
}

const ActiveOrgContext = createContext<ActiveOrgContextType>({
  activeOrg: null,
});

export const ActiveOrgProvider: React.FC<{
  activeOrg: Organization | null;
  setActiveOrg?: React.Dispatch<React.SetStateAction<Organization | null>>;
  children: React.ReactNode;
}> = ({ activeOrg, setActiveOrg, children }) => {
  return (
    <ActiveOrgContext.Provider value={{ activeOrg, setActiveOrg }}>
      {children}
    </ActiveOrgContext.Provider>
  );
};

export const useActiveOrg = () => useContext(ActiveOrgContext);
