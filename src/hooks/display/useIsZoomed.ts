import { breakpoints } from "@/utils/theme/breakpoints";
import { useEffect, useState } from "react";

const useIsZoomed = () => {
  const [isZoomed, setIsZoomed] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(`(min-width: ${breakpoints.sm}px) and (max-width: ${breakpoints["3xl"]}px)`);

    // Handler to update state
    const handleChange = (e: MediaQueryListEvent) => {
      setIsZoomed(e.matches);
    };

    // Initialize with correct value
    setIsZoomed(mediaQuery.matches);

    // Modern Safari & browsers
    mediaQuery.addEventListener("change", handleChange);

    // Fallback for older Safari versions
    return () => mediaQuery.removeEventListener?.("change", handleChange);
  }, []);

  return isZoomed;
};

export default useIsZoomed;
