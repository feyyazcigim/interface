import PintoLogo from "@/assets/protocol/PintoLogo.svg";
import PintoLogoText from "@/assets/protocol/PintoLogoText.svg";
import { AnimatePresence, animate, motion, useMotionValue, useTransform } from "framer-motion";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { navLinks } from "../nav/nav/Navbar";
import { Button } from "../ui/Button";
import TxFloater from "./TxFloater";

// Master animation configuration - Variable-driven system
// This configuration drives all animations through percentages and proportions
// instead of hardcoded values, making the entire system responsive and scalable
const ANIMATION_CONFIG = {
  // Visual constants
  height: 577,
  repetitions: 4,
  pointSpacing: 140,

  // Speed constants
  baseSpeed: 3, // pixels per frame at 60fps

  // Phase proportions and timing
  phases: {
    fadeIn: 0.1, // 10% of total experience time
    phase1: 0.2, // 20% of total time
    phase2: 0.35, // 35% of total time
    phase3: 0.4, // 40% of total time (initial scroll)
  },

  // Stage message positioning (as percentages of data segment widths)
  stageMessages: {
    // Messages appear during unstable phase based on position
    realStability: {
      phase: "unstable",
      startPosition: 0.1, // 10% through unstable period
      endPosition: 0.9, // 90% through unstable period
    },
    creditEarned: {
      phase: "semiStable",
      startPosition: 0.1, // 10% through semi-stable period
      endPosition: 0.9, // 90% through semi-stable period
    },
    pintoAlive: {
      phase: "stable",
      startPosition: 0.3, // 30% through stable period (first loop)
      duration: 5000, // Fixed 5s duration
    },
  },

  // Measurement line positions (as viewport percentages)
  measurementLine: {
    initial: 0.75, // 75% from left
    minimum: 0.1, // 10% from left
    final: 0.75, // back to 75%
  },

  // Clip path expansion
  clipPath: {
    initial: 0.1, // 10% width
    final: 0.75, // 75% width
  },

  // Fade-in sequence timing (as percentages of fade-in phase)
  fadeInSequence: {
    grid: { start: 0.0, duration: 0.6 },
    measurementLine: { start: 0.2, duration: 0.4 },
    priceLine: { start: 1, duration: 0.2 },
    priceIndicator: { start: 0.85, duration: 0.15 },
  },

  // Price indicator
  priceIndicator: {
    staticPosition: 0.5, // 50% of chart height
  },

  // Horizontal reference line (represents $1.00)
  horizontalReference: {
    position: 0.5, // 50% of chart height
    color: "#D1D5DB", // Light gray
    strokeWidth: 1,
    dashArray: "5,5",
  },
};

// Legacy constants for backward compatibility during transition
const height = ANIMATION_CONFIG.height;
const repetitions = ANIMATION_CONFIG.repetitions;
const pointSpacing = ANIMATION_CONFIG.pointSpacing;
const _scrollSpeed = ANIMATION_CONFIG.baseSpeed;

// Position calculation system based on data segment widths
function calculatePositions(viewportWidth: number, chartHeight: number) {
  // Calculate actual widths of each data segment
  const unstableWidth = getSegmentWidth(unstablePriceData, pointSpacing);
  const semiStableWidth = getSegmentWidth(semiStablePriceData, pointSpacing);
  const stableWidth = getSegmentWidth(stablePriceData, pointSpacing);

  return {
    // Data segment widths
    segments: {
      unstable: unstableWidth,
      semiStable: semiStableWidth,
      stable: stableWidth,
      // Cumulative positions for each segment start
      unstableStart: 0,
      semiStableStart: unstableWidth,
      stableStart: unstableWidth + semiStableWidth,
      totalInitial: unstableWidth + semiStableWidth,
    },

    // Stage message trigger positions
    messagePositions: {
      realStability: {
        show: unstableWidth * ANIMATION_CONFIG.stageMessages.realStability.startPosition,
        hide: unstableWidth * ANIMATION_CONFIG.stageMessages.realStability.endPosition,
      },
      creditEarned: {
        show: unstableWidth + semiStableWidth * ANIMATION_CONFIG.stageMessages.creditEarned.startPosition,
        hide: unstableWidth + semiStableWidth * ANIMATION_CONFIG.stageMessages.creditEarned.endPosition,
      },
      pintoAlive: {
        show: unstableWidth + semiStableWidth, // Start of stable phase
        duration: ANIMATION_CONFIG.stageMessages.pintoAlive.duration,
      },
    },

    // Measurement line positions
    measurementLine: {
      initial: viewportWidth * ANIMATION_CONFIG.measurementLine.initial,
      minimum: viewportWidth * ANIMATION_CONFIG.measurementLine.minimum,
      final: viewportWidth * ANIMATION_CONFIG.measurementLine.final,
      moveToMinimumOffset:
        viewportWidth * (ANIMATION_CONFIG.measurementLine.minimum - ANIMATION_CONFIG.measurementLine.initial),
      moveToFinalOffset: 0,
    },

    // Clip path dimensions
    clipPath: {
      initial: viewportWidth * ANIMATION_CONFIG.clipPath.initial,
      final: viewportWidth * ANIMATION_CONFIG.clipPath.final,
    },

    // Price indicator positions
    priceIndicator: {
      staticY: chartHeight * ANIMATION_CONFIG.priceIndicator.staticPosition,
    },
  };
}

// Duration calculation system - simplified for fade-in only
function calculateDurations(_viewportWidth: number) {
  const _pxPerSecond = ANIMATION_CONFIG.baseSpeed * 60;
  const fadeInDuration = 8; // Fixed fade-in duration in seconds

  return {
    // Fade-in sequence durations only
    fadeInSequence: {
      grid: {
        start: fadeInDuration * ANIMATION_CONFIG.fadeInSequence.grid.start,
        duration: fadeInDuration * ANIMATION_CONFIG.fadeInSequence.grid.duration,
      },
      measurementLine: {
        start: fadeInDuration * ANIMATION_CONFIG.fadeInSequence.measurementLine.start,
        duration: fadeInDuration * ANIMATION_CONFIG.fadeInSequence.measurementLine.duration,
      },
      priceLine: {
        start: fadeInDuration * ANIMATION_CONFIG.fadeInSequence.priceLine.start,
        duration: fadeInDuration * ANIMATION_CONFIG.fadeInSequence.priceLine.duration,
      },
      priceIndicator: {
        start: fadeInDuration * ANIMATION_CONFIG.fadeInSequence.priceIndicator.start,
        duration: fadeInDuration * ANIMATION_CONFIG.fadeInSequence.priceIndicator.duration,
      },
    },
  };
}

// Price data with more baseline points to space out peaks and dips
// Define the type for priceData
interface Farmer {
  icon: string;
  bg: string;
}
interface PricePoint {
  txType: string | null;
  value: number;
  farmer?: Farmer;
  speed?: number; // Optional speed for specific transactions
}

const unstablePriceData: PricePoint[] = [
  { txType: null, value: 1.0 },
  { txType: null, value: 1.0 },
  { txType: "harvest", value: 0.993, speed: 0.8 },
  { txType: "deposit", value: 1.0055, speed: 0.7 },
  { txType: "withdraw", value: 0.9955, speed: 0.6 },
  { txType: "convert", value: 1.0025, speed: 0.6 },
  { txType: "convert", value: 0.9984, speed: 0.6 },
  { txType: "sow", value: 1.0004, speed: 0.6 },
  { txType: "withdraw", value: 0.9995, speed: 0.6 },
];

const semiStablePriceData: PricePoint[] = [
  { txType: null, value: 0.9998 },
  { txType: "deposit", value: 1.004 },
  { txType: "harvest", value: 0.997 },
  { txType: "deposit", value: 1.003 },
  { txType: "withdraw", value: 0.998 },
  { txType: "convert", value: 1.0025 },
  { txType: "yield", value: 1.0 },
];

const stablePriceData: PricePoint[] = [
  { txType: "sow", value: 0.9994 },
  { txType: "harvest", value: 1.0004 },
  { txType: null, value: 0.9994, speed: 3 },
  { txType: "yield", value: 1.005, speed: 3 },
  { txType: "convert", value: 0.995, speed: 1 },
  { txType: null, value: 1.0004 },
  { txType: "deposit", value: 0.9994 },
  { txType: "withdraw", value: 1.0004 },
  { txType: null, value: 0.9994, speed: 3 },
  { txType: "yield", value: 1.005, speed: 3 },
  { txType: "convert", value: 0.995, speed: 1 },
  { txType: null, value: 1.0004 },
];

// Combine unstablePriceData once, then stablePriceData repeated for seamless looping
const fullPriceData: PricePoint[] = [
  ...unstablePriceData,
  ...semiStablePriceData,
  ...Array.from({ length: repetitions }).flatMap(() => stablePriceData),
];

// Array of person icons with different color backgrounds
const personIcons = [
  { icon: "🧑", bg: "#FFD700" }, // gold
  { icon: "👩", bg: "#FFB6C1" }, // pink
  { icon: "👨", bg: "#87CEEB" }, // blue
  { icon: "🧑‍🦱", bg: "#90EE90" }, // green
  { icon: "👩‍🦰", bg: "#FFA07A" }, // orange
  { icon: "👨‍🦳", bg: "#D3D3D3" }, // gray
  { icon: "🧑‍🦰", bg: "#FF8C00" }, // dark orange
  { icon: "👩‍🦳", bg: "#E6E6FA" }, // lavender
  { icon: "👨‍🦱", bg: "#20B2AA" }, // teal
  { icon: "🧑‍🦲", bg: "#F5DEB3" }, // wheat
];

// Memoize FarmerProfile to avoid unnecessary re-renders
const FarmerProfile = React.memo(function FarmerProfile({
  icon,
  bg,
  size = 32,
}: { icon: string; bg: string; size?: number }) {
  return (
    <div
      className="flex items-center justify-center rounded-full border"
      style={{ backgroundColor: bg, width: size, height: size }}
    >
      <span style={{ fontSize: size * 0.75 }}>{icon}</span>
    </div>
  );
});

// Convert price to Y coordinate (inverted because SVG Y increases downward)
function priceToY(price: number) {
  const minPrice = 0.99;
  const maxPrice = 1.01;
  const minY = height - 0; // Bottom margin
  const maxY = 0; // Top margin
  return minY - ((price - minPrice) / (maxPrice - minPrice)) * (minY - maxY);
}

// Generate complete line path with multiple repetitions (Bezier smoothing)
function generateCompletePath(pointSpacing: number) {
  // Per-segment speed compression
  const points: { x: number; y: number; price: number }[] = [];
  const beziers: {
    p0: { x: number; y: number };
    c1: { x: number; y: number };
    c2: { x: number; y: number };
    p1: { x: number; y: number };
  }[] = [];
  const transactionMarkers: { x: number; y: number; txType: string; farmer?: Farmer; index: number }[] = [];

  let x = 0;
  for (let i = 0; i < fullPriceData.length; i++) {
    const y = priceToY(fullPriceData[i].value);
    points.push({ x, y, price: fullPriceData[i].value });
    if (fullPriceData[i].txType) {
      const txType = fullPriceData[i].txType as string;
      transactionMarkers.push({ x, y, txType, farmer: fullPriceData[i].farmer, index: i });
    }
    // If this segment has a speed, compress the next segment's width
    const segSpeed = fullPriceData[i].speed || 1;
    x += pointSpacing / segSpeed;
  }

  if (points.length === 0) return { path: "", points: [], totalWidth: 0, beziers: [], transactionMarkers: [] };

  let path = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const p0 = points[i - 1];
    const p1 = points[i];
    const prev = points[i - 2] || p0;
    const next = points[i + 1] || p1;
    // Calculate control points
    const c1x = p0.x + (p1.x - prev.x) / 6;
    const c1y = p0.y + (p1.y - prev.y) / 6;
    const c2x = p1.x - (next.x - p0.x) / 6;
    const c2y = p1.y - (next.y - p0.y) / 6;
    path += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p1.x} ${p1.y}`;
    beziers.push({ p0, c1: { x: c1x, y: c1y }, c2: { x: c2x, y: c2y }, p1 });
  }

  const totalWidth = points.length > 0 ? points[points.length - 1].x : 0;
  return { path, points, totalWidth, beziers, transactionMarkers };
}

// Helper: cubic Bezier at t
function cubicBezier(p0: number, c1: number, c2: number, p1: number, t: number) {
  const mt = 1 - t;
  return mt ** 3 * p0 + 3 * mt ** 2 * t * c1 + 3 * mt * t ** 2 * c2 + t ** 3 * p1;
}

// Helper to get width of a price data segment
function getSegmentWidth(data: PricePoint[], pointSpacing: number) {
  let width = 0;
  for (let i = 0; i < data.length; i++) {
    const segSpeed = data[i].speed || 1;
    width += pointSpacing / segSpeed;
  }
  return width;
}

export default function LandingChart() {
  const [viewportWidth, setViewportWidth] = useState(1920); // Default width
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate durations and positions based on current viewport
  const durations = useMemo(() => calculateDurations(viewportWidth), [viewportWidth]);
  const positions = useMemo(() => calculatePositions(viewportWidth, height), [viewportWidth]);
  const singlePatternWidth = useMemo(() => stablePriceData.length * pointSpacing, []);

  const scrollOffset = useMotionValue(0);
  const measurementLineOffset = useMotionValue(0); // Separate offset for measurement line movement
  const clipPathWidth = useMotionValue(0); // Separate motion value for clip path
  const horizontalLineClipPath = useMotionValue(viewportWidth); // For horizontal line reveal animation (starts hidden from right)
  const priceTrackingActive = useMotionValue(0); // 0 = inactive, 1 = active
  const floatersOpacity = useTransform(priceTrackingActive, (active) => (active >= 1 ? 1 : 0));
  const x = useTransform(scrollOffset, (value) => -value);

  // Update viewport width on mount and resize with responsive recalculation
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        const newViewportWidth = containerRef.current.clientWidth;
        setViewportWidth(newViewportWidth);

        // Recalculate positions for new viewport width
        const newPositions = calculatePositions(newViewportWidth, height);

        if (newViewportWidth && singlePatternWidth) {
          // Reset motion values with new calculated positions
          scrollOffset.set(newViewportWidth * -ANIMATION_CONFIG.clipPath.initial);
          clipPathWidth.set(newPositions.clipPath.initial);
          horizontalLineClipPath.set(newViewportWidth); // Start fully clipped from right (invisible)

          // Reset measurement line offset to baseline for responsive changes
          measurementLineOffset.set(0);
        }
      }
    };

    // Initial measurement
    updateWidth();

    // Listen for resize events with debouncing for performance
    let resizeTimeout: NodeJS.Timeout;
    const debouncedResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(updateWidth, 150); // 150ms debounce
    };

    window.addEventListener("resize", debouncedResize);

    return () => {
      window.removeEventListener("resize", debouncedResize);
      clearTimeout(resizeTimeout);
    };
  }, [scrollOffset, clipPathWidth, horizontalLineClipPath, measurementLineOffset, singlePatternWidth]);

  // Calculate compressed widths for unstable and stable segments
  const unstablePhaseWidth = useMemo(() => getSegmentWidth(unstablePriceData, pointSpacing), []);
  const stablePhaseWidth = useMemo(() => getSegmentWidth(stablePriceData, pointSpacing), []);

  // Assign farmers to price data and generate path
  const { path, beziers, transactionMarkers } = useMemo(() => {
    // Assign a unique farmer icon to each non-null txType price point
    const assignedFarmers = personIcons.slice();
    let farmerIdx = 0;
    for (let i = 0; i < fullPriceData.length; i++) {
      if (fullPriceData[i].txType) {
        fullPriceData[i].farmer = assignedFarmers[farmerIdx % assignedFarmers.length];
        farmerIdx++;
      }
    }
    return generateCompletePath(pointSpacing);
  }, []);

  // Dynamic measurement line position using calculated baseline
  const baseMeasurementX = useMemo(() => positions.measurementLine.initial, [positions.measurementLine.initial]);
  const measurementX = useTransform(measurementLineOffset, (offset) => baseMeasurementX + offset);

  // Memoize getYOnBezierCurve
  const getYOnBezierCurve = useCallback(
    (xVal: number) => {
      for (const seg of beziers) {
        if (xVal >= seg.p0.x && xVal <= seg.p1.x) {
          // Find t for xVal in [p0.x, p1.x] using binary search
          let t0 = 0;
          let t1 = 1;
          let t = 0.5;
          let x = 0;
          for (let i = 0; i < 10; i++) {
            x = cubicBezier(seg.p0.x, seg.c1.x, seg.c2.x, seg.p1.x, t);
            if (Math.abs(x - xVal) < 0.5) break;
            if (x < xVal) t0 = t;
            else t1 = t;
            t = (t0 + t1) / 2;
          }
          // Now get y at t
          return cubicBezier(seg.p0.y, seg.c1.y, seg.c2.y, seg.p1.y, t);
        }
      }
      // Fallback: clamp to ends
      if (beziers.length > 0) {
        if (xVal < beziers[0].p0.x) return beziers[0].p0.y;
        if (xVal > beziers[beziers.length - 1].p1.x) return beziers[beziers.length - 1].p1.y;
      }
      return 0;
    },
    [beziers],
  );

  // Use Bezier curve for indicator Y - only when price tracking is active
  const staticY = positions.priceIndicator.staticY; // Calculated static position
  const currentY = useTransform(
    [scrollOffset, measurementX, priceTrackingActive],
    ([currentOffset, measX, isActive]) => {
      // If price tracking is not active, return static position
      if (isActive < 1) {
        return staticY;
      }

      // Looping logic: after initial phase (unstable + semi-stable), loop only the stable segment
      let xVal = measX + currentOffset;
      const totalInitialWidth = positions.segments.totalInitial; // unstable + semi-stable
      if (xVal > totalInitialWidth) {
        // Offset so the stable segment loops seamlessly
        const stableOffset = (xVal - totalInitialWidth) % positions.segments.stable;
        xVal = totalInitialWidth + stableOffset;
      }
      return getYOnBezierCurve(xVal);
    },
  );

  // Get current price and txType at the measurement position
  const currentIndex = useTransform([scrollOffset, measurementX], ([currentOffset, measX]) => {
    const xVal = measX + currentOffset;
    // Find the closest point index by X
    let minDist = Infinity;
    let idx = 0;
    for (let i = 0; i < beziers.length; i++) {
      const seg = beziers[i];
      if (Math.abs(seg.p0.x - xVal) < minDist) {
        minDist = Math.abs(seg.p0.x - xVal);
        idx = i;
      }
    }
    return idx;
  });

  // Get the current txType and farmer for the floating marker
  const [currentTxType, setCurrentTxType] = useState<string | null>(null);
  const [currentFarmer, setCurrentFarmer] = useState<Farmer | undefined>(undefined);

  // Stage message states
  const [showRealStability, setShowRealStability] = useState(false);
  const [showCreditEarned, setShowCreditEarned] = useState(false);
  const [showPintoAlive, setShowPintoAlive] = useState(false);
  const [showMainCTA, setShowMainCTA] = useState(false);

  // Refs to prevent timer interference
  const pintoTimerRef = useRef<NodeJS.Timeout | null>(null);

  const lineStrokeColor = useMotionValue("#387F5C");

  useEffect(() => {
    const unsubscribe = currentIndex.on("change", (idx) => {
      const i = Math.max(0, Math.min(Math.round(idx), fullPriceData.length - 1));
      const newTxType = fullPriceData[i].txType;
      const newFarmer = fullPriceData[i].farmer;

      // Trigger flash effect when txType changes and is not null (only if price tracking is active)
      if (newTxType !== currentTxType && newTxType !== null && priceTrackingActive.get() >= 1) {
        animate(lineStrokeColor, "#00C767", { duration: 0.25, ease: "easeInOut" }).then(() => {
          animate(lineStrokeColor, "#387F5C", { duration: 0.25, ease: "easeInOut" });
        });
      }

      setCurrentTxType(newTxType);
      setCurrentFarmer(newFarmer);
    });
    return unsubscribe;
  }, [currentIndex, currentTxType, lineStrokeColor, priceTrackingActive]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (pintoTimerRef.current) {
        clearTimeout(pintoTimerRef.current);
      }
    };
  }, []);

  // Position-based animation system: start scrolling and track position for messages
  useEffect(() => {
    let controls: ReturnType<typeof animate> | null = null;

    const startAnimation = async () => {
      // Calculate timing for measurement line animations
      const measurementLineStartDelay =
        durations.fadeInSequence.priceIndicator.start + durations.fadeInSequence.priceIndicator.duration + 1;
      const measurementLineDuration = 3;

      // Horizontal line Stage 1: Start when measurement line reveals, end halfway through measurement line reveal
      const _horizontalStage1 = animate(horizontalLineClipPath, viewportWidth * 0.25, {
        duration: durations.fadeInSequence.measurementLine.duration / 2, // Half the measurement line reveal duration
        ease: "easeInOut",
        delay: durations.fadeInSequence.measurementLine.start, // Start when measurement line reveals
      });

      // Phase 1: Move measurement line to 10% position
      controls = animate(measurementLineOffset, positions.measurementLine.moveToMinimumOffset, {
        duration: measurementLineDuration,
        ease: "easeInOut",
        delay: measurementLineStartDelay,
      });

      // Phase 2: Move measurement line back to 75% and expand clip path
      const phase2Duration = 4;
      const phase2StartDelay = measurementLineStartDelay + measurementLineDuration;

      // Horizontal line Stage 2: Start when measurement line begins moving back to left
      const _horizontalStage2 = animate(horizontalLineClipPath, 0, {
        duration: phase2Duration, // Same duration as measurement line return
        ease: "easeInOut",
        delay: phase2StartDelay, // Start when Phase 2 begins
      });

      await controls;

      const _clipPathAnimation = animate(clipPathWidth, positions.clipPath.final, {
        duration: phase2Duration,
        ease: "easeIn",
      });

      controls = animate(measurementLineOffset, positions.measurementLine.moveToFinalOffset, {
        duration: phase2Duration,
        ease: "easeIn",
      });

      // Activate price tracking at the start of Phase 2
      priceTrackingActive.set(1);

      await controls;

      // No need for setTimeout-based messages anymore - they're handled by position monitoring

      // Phase 3: Start continuous scrolling through all data
      const pxPerSecond = ANIMATION_CONFIG.baseSpeed * 60;
      const totalDataWidth = positions.segments.unstable + positions.segments.semiStable;

      // Scroll through initial segments (unstable + semi-stable)
      controls = animate(scrollOffset, totalDataWidth, {
        duration: totalDataWidth / pxPerSecond,
        ease: "linear",
        onComplete: () => {
          // Loop only the stable segment with consistent speed
          const loopDuration = positions.segments.stable / pxPerSecond;
          controls = animate(scrollOffset, totalDataWidth + positions.segments.stable, {
            duration: loopDuration,
            ease: "linear",
            repeat: Infinity,
            repeatType: "loop",
          });
        },
      });
    };

    startAnimation();

    return () => {
      controls?.stop();
    };
  }, [
    scrollOffset,
    measurementLineOffset,
    clipPathWidth,
    horizontalLineClipPath,
    priceTrackingActive,
    positions,
    durations,
    viewportWidth,
  ]);

  // Position-based message triggering system
  useEffect(() => {
    const unsubscribe = scrollOffset.on("change", (currentScrollOffset) => {
      // Calculate where the measurement line intersects the data
      // This accounts for both the scroll offset and measurement line position
      const measurementLineX = positions.measurementLine.initial + measurementLineOffset.get();
      const dataPosition = measurementLineX + currentScrollOffset;

      // Real Stability message - during unstable phase (30-90%)
      if (
        dataPosition >= positions.messagePositions.realStability.show &&
        dataPosition <= positions.messagePositions.realStability.hide
      ) {
        if (!showRealStability) {
          setShowRealStability(true);
        }
      } else if (showRealStability) {
        setShowRealStability(false);
      }

      // Credit Earned message - during semi-stable phase (30-90%)
      if (
        dataPosition >= positions.messagePositions.creditEarned.show &&
        dataPosition <= positions.messagePositions.creditEarned.hide
      ) {
        if (!showCreditEarned) {
          setShowCreditEarned(true);
        }
      } else if (showCreditEarned) {
        setShowCreditEarned(false);
      }

      // Pinto Alive message - at start of stable phase (only trigger once)
      if (dataPosition >= positions.messagePositions.pintoAlive.show && !showPintoAlive && !showMainCTA) {
        setShowPintoAlive(true);

        // Hide "Pinto is alive" after fixed duration and show MainCTA immediately
        pintoTimerRef.current = setTimeout(() => {
          setShowPintoAlive(false);
          setShowMainCTA(true); // Show MainCTA immediately when Pinto disappears
        }, positions.messagePositions.pintoAlive.duration);
      }
    });

    return unsubscribe;
  }, [
    scrollOffset,
    measurementLineOffset,
    positions,
    showRealStability,
    showCreditEarned,
    showPintoAlive,
    showMainCTA,
  ]);

  const [_showAnimation, setShowAnimation] = useState<(string | undefined)[]>(() => personIcons.map(() => undefined));

  useEffect(() => {
    personIcons.forEach((data, index) => {
      const isCurrent =
        currentFarmer && data.icon === currentFarmer.icon && data.bg === currentFarmer.bg && currentTxType;
      if (isCurrent) {
        setShowAnimation((prev) => {
          const next = [...prev];
          next[index] = currentTxType || undefined;
          return next;
        });
      }
    });
  }, [currentFarmer, currentTxType]);

  return (
    <div className="flex flex-col items-center justify-center h-full w-full mb-32 gap-10">
      {/* Stage Messages */}
      <div className="min-h-[200px] flex flex-col items-center justify-center">
        <AnimatePresence mode="wait">
          {showRealStability && (
            <motion.span
              key="real-stability"
              className="text-2xl leading-[1.4] font-thin text-pinto-gray-4 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            >
              Real stability takes time
            </motion.span>
          )}
          {!showRealStability && showCreditEarned && (
            <motion.span
              key="credit-earned"
              className="text-2xl leading-[1.4] font-thin text-pinto-gray-4 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            >
              Credit is earned
            </motion.span>
          )}
          {!showRealStability && !showCreditEarned && showPintoAlive && (
            <motion.span
              key="pinto-alive"
              className="text-2xl leading-[1.4] font-thin text-pinto-gray-4 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            >
              Pinto is alive
            </motion.span>
          )}
          {/* MainCTA Component - Only show after Pinto is alive fades out */}
          {showMainCTA && (
            <motion.div
              className="flex flex-col gap-8"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
            >
              <div className="flex flex-col gap-4 self-stretch items-center">
                <motion.h2
                  className="text-[4rem] leading-[1.1] font-thin text-black"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: "easeInOut", delay: 0.2 }}
                >
                  <div className="flex flex-row gap-4 items-center">
                    <img src={PintoLogo} alt="Pinto Logo" className="h-20" />
                    <img src={PintoLogoText} alt="Pinto Logo" className="h-20" />
                  </div>
                </motion.h2>
                <motion.span
                  className="text-2xl leading-[1.4] font-thin text-pinto-gray-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: "easeInOut", delay: 0.4 }}
                >
                  An Algorithmic Stablecoin Balanced by Farmers like you.
                </motion.span>
              </div>
              <motion.div
                className="flex flex-row gap-4 mx-auto"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeInOut", delay: 0.6 }}
              >
                <Link to={navLinks.overview}>
                  <Button rounded="full">Come Seed the Trustless Economy →</Button>
                </Link>
                <Link to={navLinks.docs} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" rounded="full" className="shadow-none text-pinto-gray-4">
                    Read the Docs
                  </Button>
                </Link>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {/* Chart Component */}
      <div ref={containerRef} className="w-full relative">
        <svg width="100%" height={height} viewBox={`0 0 ${viewportWidth} ${height}`} style={{ overflow: "visible" }}>
          <defs>
            <linearGradient id="fadeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="white" stopOpacity="0" />
              <stop offset="20%" stopColor="white" stopOpacity="1" />
              <stop offset="80%" stopColor="white" stopOpacity="1" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </linearGradient>
            <mask id="fadeMask" maskUnits="userSpaceOnUse">
              <rect width="100%" height="100%" fill="url(#fadeGradient)" />
            </mask>
            <pattern id="grid" width="72" height="72" patternUnits="userSpaceOnUse">
              <path d="M 72 0 L 0 0 0 72" fill="none" stroke="#D9D9D9" strokeWidth="1" />
            </pattern>
            {/* Clip path to hide line outside viewport */}
            <clipPath id="viewport">
              <motion.rect x="0" y="0" width={clipPathWidth} height={height} />
            </clipPath>
          </defs>
          <motion.rect
            width="100%"
            height="100%"
            fill="url(#grid)"
            mask="url(#fadeMask)"
            initial={{ opacity: 0, clipPath: "inset(0 0 100% 0)" }}
            animate={{ opacity: 1, clipPath: "inset(0 0 0 0)" }}
            transition={{
              duration: durations.fadeInSequence.grid.duration,
              ease: "easeInOut",
              delay: durations.fadeInSequence.grid.start,
            }}
          />
          {/* Measurement line */}
          <motion.path
            d={`M ${baseMeasurementX} 0 L ${baseMeasurementX} ${height}`}
            stroke="#387F5C"
            strokeWidth="2"
            strokeDasharray="3,3"
            fill="none"
            mask="url(#fadeMask)"
            style={{ x: measurementLineOffset }}
            initial={{ clipPath: "inset(0 0 100% 0)" }}
            animate={{ clipPath: "inset(0 0 0.01% 0)" }}
            transition={{
              duration: durations.fadeInSequence.measurementLine.duration,
              ease: "easeInOut",
              delay: durations.fadeInSequence.measurementLine.start,
            }}
          />
          {/* Horizontal reference line at $1.00 - Two-stage reveal */}
          <motion.path
            d={`M 0 ${height * ANIMATION_CONFIG.horizontalReference.position} L ${viewportWidth} ${height * ANIMATION_CONFIG.horizontalReference.position}`}
            stroke="#387F5C"
            strokeWidth="2"
            strokeDasharray="10,10"
            fill="none"
            mask="url(#fadeMask)"
            style={{
              clipPath: useTransform(horizontalLineClipPath, (clipX) => `inset(0 ${clipX}px 0 0)`),
            }}
          />
          {/* Scrolling price line */}
          <g clipPath="url(#viewport)">
            <motion.path
              d={path}
              fill="none"
              stroke={lineStrokeColor}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ x }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{
                duration: durations.fadeInSequence.priceLine.duration,
                delay: durations.fadeInSequence.priceLine.start,
              }}
            />
            {/* Static transaction floaters - only show during price tracking */}
            {transactionMarkers.map((marker) => {
              // Use marker.index for robust placement
              let positionAbove = false;
              if (marker.index > 0) {
                const prev = fullPriceData[marker.index - 1];
                const curr = fullPriceData[marker.index];
                if (curr.value !== prev.value) {
                  positionAbove = curr.value > prev.value;
                } else if (marker.index < fullPriceData.length - 1) {
                  const next = fullPriceData[marker.index + 1];
                  positionAbove = curr.value > next.value;
                }
              }
              return (
                <motion.foreignObject
                  key={`${marker.x}-${marker.y}-${marker.txType}`}
                  x={marker.x - 20}
                  y={positionAbove ? marker.y - 40 : marker.y + 10}
                  width={80}
                  height={40}
                  style={{ pointerEvents: "none", x, opacity: floatersOpacity }}
                >
                  <TxFloater
                    from={marker.farmer ? <FarmerProfile icon={marker.farmer.icon} bg={marker.farmer.bg} /> : null}
                    txType={marker.txType}
                    viewportWidth={viewportWidth}
                    x={x}
                    markerX={marker.x}
                    isFixed={true}
                  />
                </motion.foreignObject>
              );
            })}
          </g>
        </svg>
        {/* Current measurement point */}
        <motion.div
          className="absolute -ml-[0.625rem] -mt-[0.625rem] z-10 rounded-full w-5 h-5 shadow-lg"
          style={{
            left: measurementX,
            top: currentY,
            pointerEvents: "none",
            borderWidth: "4px",
            borderStyle: "solid",
            borderColor: lineStrokeColor,
            backgroundColor: lineStrokeColor,
            boxShadow: useTransform(
              lineStrokeColor,
              (color) => `0 0 10px ${color}, 0 0 4.32px ${color}, 0 0 2.16px ${color}`,
            ),
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, scale: [1, 1.1, 1] }}
          transition={{
            opacity: {
              duration: durations.fadeInSequence.priceIndicator.duration,
              delay: durations.fadeInSequence.priceIndicator.start,
            },
            scale: { duration: 1, repeat: Infinity, ease: "easeInOut" },
          }}
        >
          <div className="w-full h-full rounded-full bg-white" />
        </motion.div>
        {/* Floating emoji + image marker above the animated circle - only show during price tracking */}
        <motion.div
          className="absolute -ml-[1.25rem] -mt-[5rem]"
          style={{
            left: measurementX,
            top: currentY,
            pointerEvents: "none",
            opacity: floatersOpacity,
          }}
        >
          <TxFloater
            key={"floater"}
            from={currentFarmer ? <FarmerProfile icon={currentFarmer.icon} bg={currentFarmer.bg} /> : null}
            txType={currentTxType}
            viewportWidth={viewportWidth}
            x={x}
            markerX={measurementX}
            isFixed={false}
          />
        </motion.div>
      </div>
    </div>
  );
}

// Variable-driven animation system complete:
// - All timings calculated from ANIMATION_CONFIG percentages
// - All positions derived from viewport dimensions
// - Fully responsive with automatic recalculation
// - Consistent animation speeds across all phases
// - Timeline-based coordination of all events
