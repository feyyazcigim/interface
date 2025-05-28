import { breakpoints } from "@/utils/theme/breakpoints";
import { useLayoutEffect, useState } from "react";

export interface Dimensions {
  width: number;
  height: number;
}

// ────────────────────────────────────────────────────────────────────────────────
// WINDOW
// ────────────────────────────────────────────────────────────────────────────────

/**
 * Hook to track the current window dimensions.
 * Updates synchronously on mount and when the window is resized.
 */
export const useWindowDimensions = () => {
  const [dimensions, setDimensions] = useState<Dimensions>({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useLayoutEffect(() => {
    const onResize = () => setDimensions(getWindowHeight());

    // Set initial height
    onResize();

    // Add resize listener
    window.addEventListener("resize", onResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return dimensions;
};

/**
 * Hook to track the current window height.
 * Use this when you only need the height.
 */
export const useWindowHeight = () => {
  const [height, setHeight] = useState(window.innerHeight);

  useLayoutEffect(() => {
    const onResize = () => setHeight(getWindowHeight().height);

    // Set initial height
    onResize();

    // Add resize listener
    window.addEventListener("resize", onResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return height;
};

const getWindowHeight = () => ({ width: window.innerWidth, height: window.innerHeight });

// ────────────────────────────────────────────────────────────────────────────────
// Utility Functions
// ────────────────────────────────────────────────────────────────────────────────

export const getIsWindowScaledDown = (windowWidth: number) => {
  return windowWidth >= breakpoints.sm && windowWidth <= breakpoints["3xl"];
};
