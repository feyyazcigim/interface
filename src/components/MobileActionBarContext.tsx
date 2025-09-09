import React, { createContext, useContext, useState, ReactNode } from "react";

interface MobileActionBarContextType {
  isMobileActionBarVisible: boolean;
  setMobileActionBarVisible: (visible: boolean) => void;
}

const MobileActionBarContext = createContext<MobileActionBarContextType | undefined>(undefined);

export const useMobileActionBarContext = () => {
  const context = useContext(MobileActionBarContext);
  if (context === undefined) {
    throw new Error("useMobileActionBarContext must be used within a MobileActionBarProvider");
  }
  return context;
};

interface MobileActionBarProviderProps {
  children: ReactNode;
}

export const MobileActionBarProvider = ({ children }: MobileActionBarProviderProps) => {
  const [isMobileActionBarVisible, setMobileActionBarVisible] = useState(false);

  return (
    <MobileActionBarContext.Provider
      value={{
        isMobileActionBarVisible,
        setMobileActionBarVisible,
      }}
    >
      {children}
    </MobileActionBarContext.Provider>
  );
};
