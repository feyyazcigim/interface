import React, { useEffect } from "react";
import { useMobileActionBarContext } from "./MobileActionBarContext";

interface MobileActionBarProps {
  children: React.ReactNode;
  showOnTablet?: boolean;
}

const MobileActionBar = ({ children, showOnTablet }: MobileActionBarProps) => {
  const { setMobileActionBarVisible } = useMobileActionBarContext();

  useEffect(() => {
    // Register that this MobileActionBar is visible
    setMobileActionBarVisible(true);

    // Cleanup when component unmounts
    return () => {
      setMobileActionBarVisible(false);
    };
  }, [setMobileActionBarVisible]);

  return (
    <div
      className={`${showOnTablet ? "lg:hidden" : "sm:hidden"} fixed bottom-0 left-0 border-t h-[4.5rem] bg-pinto-off-white w-full max-w-full flex flex-row gap-2 justify-between items-center p-3`}
    >
      {children}
    </div>
  );
};

export default MobileActionBar;
