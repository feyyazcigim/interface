import PintoLogo from "@/assets/protocol/PintoLogo.svg";
import PintoLogoText from "@/assets/protocol/PintoLogoText.svg";
import useIsMobile from "@/hooks/display/useIsMobile";
import { cubicBezier, findBezierExtrema, generateChaoticUnstableData } from "@/utils/utils";
import { AnimatePresence, animate, motion, useMotionValue, useTransform } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { PintoRightArrow } from "../Icons";
import { navLinks } from "../nav/nav/Navbar";
import { Button } from "../ui/Button";
import FloaterContainer from "./FloaterContainer";

// Master animation configuration - Variable-driven system
// This configuration drives all animations through percentages and proportions
// instead of hardcoded values, making the entire system responsive and scalable
const ANIMATION_CONFIG = {
  // Visual constants
  height: 577,
  repetitions: 6,
  pointSpacing: 140,

  // Speed constants
  baseSpeed: 2.8, // pixels per frame at 60fps

  gridSpacing: 72,
  gridStrokeWidth: 1,

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
    grid: { start: 0.0, duration: 0.4 },
    measurementLine: { start: 0.1, duration: 0.2 },
    priceLine: { start: 0.2, duration: 0.4 },
    priceIndicator: { start: 0.1, duration: 0.2 },
  },

  // Price indicator
  priceIndicator: {
    staticPosition: 0.5, // 50% of chart height
  },

  // Horizontal reference line (represents $1.00)
  horizontalReference: {
    position: 0.5, // 50% of chart height
    color: "#387F5C", // pinto-green-4
    strokeWidth: 2,
    dashArray: "10,10",
  },

  // Price labels configuration
  priceLabels: {
    staticX: 0.75, // 75% from left (same as measurement line final position)
    xOffset: 20, // pixels to the right of the line
    yOffset: 4,
    levels: [1.3, 1.2, 1.1, 0.9, 0.8, 0.7], // Removed 1.0 since it overlaps with horizontal line
    fontSize: 14,
    color: "#9C9C9C", // pinto-gray-4
  },
};

// Legacy constants for backward compatibility during transition
const height = ANIMATION_CONFIG.height;
const repetitions = ANIMATION_CONFIG.repetitions;
const pointSpacing = ANIMATION_CONFIG.pointSpacing;

// Position calculation system based on data segment widths
function calculatePositions(chartHeight: number) {
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
      totalInitial: unstableWidth + semiStableWidth,
    },

    // Price indicator positions
    priceIndicator: {
      staticY: chartHeight * ANIMATION_CONFIG.priceIndicator.staticPosition,
    },
  };
}

// Duration calculation system - simplified for fade-in only
function calculateDurations() {
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
export interface PricePoint {
  txType: string | null;
  value: number;
  farmer?: string; // Farmer is now just a filename string
  speed?: number; // Optional speed for specific transactions
  triggerPhase?: string; // Optional phase trigger, for the animation above the chart
}

const unstablePriceData: PricePoint[] = generateChaoticUnstableData();

const semiStablePriceData: PricePoint[] = [
  { txType: null, value: 0.9998 },
  { txType: "withdraw", value: 1.004 },
  { txType: null, value: 0.997 },
  { txType: null, value: 1.003 },
  { txType: "deposit", value: 0.998, triggerPhase: "semiStable" },
  { txType: null, value: 1.0025 },
  { txType: null, value: 1.0 },
  { txType: "sow", value: 0.9994 },
  { txType: "harvest", value: 1.0004 },
];

const stablePriceData: PricePoint[] = [
  { txType: null, value: 0.9994, speed: 3 },
  { txType: "yield", value: 1.005, speed: 3, triggerPhase: "stable" },
  { txType: "withdraw", value: 0.995, speed: 0.85 },
  { txType: null, value: 1.0004, speed: 0.85 },
  { txType: null, value: 0.9994, speed: 0.85 },
  { txType: "deposit", value: 1.0004, speed: 0.85, triggerPhase: "mainCTA" },
  { txType: null, value: 0.9994, speed: 3 },
  { txType: "yield", value: 1.005, speed: 3, triggerPhase: "stable" },
  { txType: null, value: 0.995, speed: 0.85 },
  { txType: "deposit", value: 1.0004, speed: 0.85 },
  { txType: null, value: 0.9994, speed: 0.85 },
  { txType: "deposit", value: 1.0004, speed: 0.85, triggerPhase: "mainCTA" },
  { txType: "yield", value: 0.9994, speed: 3 },
  { txType: null, value: 1.005, speed: 3, triggerPhase: "stable" },
  { txType: "withdraw", value: 0.995, speed: 0.85 },
  { txType: null, value: 1.0004, speed: 0.85 },
  { txType: "withdraw", value: 0.9994, speed: 0.85 },
  { txType: null, value: 1.0004, speed: 0.85, triggerPhase: "mainCTA" },
];

// Combine unstablePriceData once, then stablePriceData repeated for seamless looping
const fullPriceData: PricePoint[] = [
  ...unstablePriceData,
  ...semiStablePriceData,
  ...Array.from({ length: repetitions }).flatMap(() => stablePriceData),
];

// Array of person icons with different color backgrounds
const personIcons = [
  "farmer_1.png",
  "farmer_2.png",
  "farmer_3.png",
  "farmer_4.png",
  "farmer_5.png",
  "farmer_6.png",
  "farmer_7.png",
  "farmer_8.png",
  "farmer_9.png",
  "farmer_10.png",
  "farmer_11.png",
  "farmer_12.png",
];

// Convert price to Y coordinate (inverted because SVG Y increases downward)
function priceToY(price: number) {
  const minPrice = 0.99;
  const maxPrice = 1.01;
  const minY = height - 0; // Bottom margin
  const maxY = 0; // Top margin
  return minY - ((price - minPrice) / (maxPrice - minPrice)) * (minY - maxY);
}

// Convert price to Y coordinate for labels (aligned to grid lines)
function priceLabelToY(price: number) {
  const middle = height / 2;
  const gridSpacing = ANIMATION_CONFIG.gridSpacing;
  const levels = ANIMATION_CONFIG.priceLabels.levels;
  const fontSize = ANIMATION_CONFIG.priceLabels.fontSize;
  const yOffset = ANIMATION_CONFIG.priceLabels.yOffset;

  // Find the index of this price in the levels array
  const index = levels.indexOf(price);
  if (index === -1) return middle; // Fallback to middle if not found

  // Calculate center reference index based on levels array
  const totalLevels = levels.length;
  const centerIndex = Math.ceil((totalLevels - 1) / 2);

  // Adjust index for symmetric spacing (skip center position)
  const beforeMiddle = index < centerIndex;
  const adjustedIndex = beforeMiddle ? index : index + 1;

  const gridOffset = (adjustedIndex - centerIndex) * gridSpacing + (beforeMiddle ? yOffset * -1 : fontSize);
  return middle + gridOffset;
}

// Generate complete line path with multiple repetitions (Bezier smoothing)
function generateCompletePath(pointSpacing: number) {
  const points: { x: number; y: number; price: number }[] = [];
  const beziers: {
    p0: { x: number; y: number };
    c1: { x: number; y: number };
    c2: { x: number; y: number };
    p1: { x: number; y: number };
  }[] = [];
  const transactionMarkers: {
    x: number;
    y: number;
    txType: string;
    farmer?: string;
    index: number;
    apexType?: "peak" | "valley";
  }[] = [];

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

  // Find all curve extrema (apexes) for better marker positioning
  type ExtremumPoint = { x: number; y: number; type: "peak" | "valley"; segmentIndex: number };
  const allExtrema: Array<ExtremumPoint> = [];
  beziers.forEach((segment, index) => {
    const extrema = findBezierExtrema(segment);
    extrema.forEach((extremum) => {
      allExtrema.push({ ...extremum, segmentIndex: index });
    });
  });

  // Reposition transaction markers to nearest appropriate apex
  const apexTransactionMarkers = transactionMarkers.map((marker) => {
    // Find the closest apex to this transaction marker
    let closestApex: ExtremumPoint | null = null;
    let minDistance = Infinity;

    allExtrema.forEach((apex) => {
      const distance = Math.abs(apex.x - marker.x);
      // Only consider apexes within reasonable range (half segment width)
      if (distance < pointSpacing * 0.75 && distance < minDistance) {
        minDistance = distance;
        closestApex = apex;
      }
    });

    // If we found a close apex, use it; otherwise keep original position
    if (closestApex) {
      const apex = closestApex as ExtremumPoint;
      return {
        ...marker,
        x: apex.x,
        y: apex.y,
        apexType: apex.type, // Add metadata for positioning logic
      };
    }

    return marker;
  });

  const totalWidth = points.length > 0 ? points[points.length - 1].x : 0;
  return { path, points, totalWidth, beziers, transactionMarkers: apexTransactionMarkers };
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

// Generate price label data
function generatePriceLabelData() {
  return ANIMATION_CONFIG.priceLabels.levels.map((price) => {
    return {
      price,
      y: priceLabelToY(price),
      label: price.toFixed(1),
    };
  });
}

export default function LandingChart() {
  const [viewportWidth, setViewportWidth] = useState(1920); // Default width
  const [txFloaterWidth, _setTxFloaterWidth] = useState(114); // Default width
  const containerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  // Calculate durations and positions
  const durations = useMemo(() => calculateDurations(), []);
  const positions = useMemo(() => calculatePositions(height), []);

  // Generate price label data
  const priceLabelData = useMemo(() => {
    const data = generatePriceLabelData();
    console.log("Price label data:", data);
    return data;
  }, []);

  const scrollOffset = useMotionValue(0);
  const measurementLineOffset = useMotionValue(ANIMATION_CONFIG.measurementLine.initial * 100); // Separate offset for measurement line movement (percentage)
  const clipPathWidth = useMotionValue(ANIMATION_CONFIG.clipPath.initial); // Separate motion value for clip path (decimal 0-1)
  const horizontalLineClipPath = useMotionValue(viewportWidth); // For horizontal line reveal animation (starts hidden from right)
  const priceTrackingActive = useMotionValue(0); // 0 = inactive, 1 = active
  const priceLabelsOpacity = useMotionValue(0); // 0 = hidden, 1 = visible
  const floatersOpacity = useTransform(priceTrackingActive, (active) => (active >= 1 ? 1 : 0));
  const x = useTransform(scrollOffset, (value) => viewportWidth * ANIMATION_CONFIG.clipPath.initial - value);

  // Transform values for motion properties (moved from JSX to avoid hook violations)
  const clipPathRectWidth = useTransform(clipPathWidth, (pct) => pct * viewportWidth);
  const measurementLineX = useTransform(measurementLineOffset, (offset) => (offset / 100) * viewportWidth);
  const horizontalLineClipPathStyle = useTransform(horizontalLineClipPath, (clipX) => `inset(0 ${clipX}px 0 0)`);

  // Update viewport width on mount and resize with ResizeObserver for better performance
  useEffect(() => {
    const updateWidth = (newViewportWidth: number) => {
      setViewportWidth(newViewportWidth);
    };

    // Use ResizeObserver for more efficient resize detection
    const resizeObserver = new ResizeObserver((entries) => {
      const { width } = entries[0].contentRect;
      updateWidth(width);
    });

    if (containerRef.current) {
      // Initial measurement
      updateWidth(containerRef.current.clientWidth);

      // Start observing
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Measure txFloater width
  /*
  useEffect(() => {
    const measureTxFloater = () => {
      const txFloaterElement = document.getElementById("txFloater");
      if (txFloaterElement) {
        const width = txFloaterElement.getBoundingClientRect().width;
        setTxFloaterWidth(width);
      }
    };
    measureTxFloater();
  }, []);
  */

  // Assign farmers to price data and generate path
  const { path, beziers, transactionMarkers } = useMemo(() => {
    // Assign a random farmer icon to each non-null txType price point
    for (let i = 0; i < fullPriceData.length; i++) {
      if (fullPriceData[i].txType) {
        const randomIndex = Math.floor(Math.random() * personIcons.length);
        fullPriceData[i].farmer = personIcons[randomIndex];
      }
    }
    return generateCompletePath(pointSpacing);
  }, []);

  // Dynamic measurement line position using percentage
  const measurementX = useTransform(measurementLineOffset, (offset) => (offset / 100) * viewportWidth);

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
      // @ts-ignore-next-line
      if (isActive < 1) {
        return staticY;
      }

      // Looping logic: after initial phase (unstable + semi-stable), loop only the stable segment
      // @ts-ignore-next-line
      let xVal = measX + currentOffset - viewportWidth * ANIMATION_CONFIG.clipPath.initial; // Account for price line offset
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
    // @ts-ignore-next-line
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
  const [currentTriggerPhase, setCurrentTriggerPhase] = useState<string | undefined>(undefined);

  // Refs to prevent timer interference
  const pintoTimerRef = useRef<NodeJS.Timeout | null>(null);

  const lineStrokeColor = useMotionValue("#387F5C");

  useEffect(() => {
    const unsubscribe = currentIndex.on("change", (idx) => {
      const i = Math.max(0, Math.min(Math.round(idx), fullPriceData.length - 1));
      const newTxType = fullPriceData[i].txType;
      const newTriggerPhase = fullPriceData[i].triggerPhase;

      // Trigger flash effect when txType is depositing or converting and is not null (only if price tracking is active)
      if (
        (newTxType === "deposit" || newTxType === "convert") &&
        newTxType !== null &&
        priceTrackingActive.get() >= 1
      ) {
        animate(lineStrokeColor, "#00C767", { duration: 0.1, ease: "linear" }).then(() => {
          animate(lineStrokeColor, "#387F5C", { duration: 0.6, ease: "linear" });
        });
      }

      if (newTriggerPhase && currentTriggerPhase !== "mainCTA" && priceTrackingActive.get() >= 1) {
        setCurrentTriggerPhase(newTriggerPhase);
      }
    });
    return unsubscribe;
  }, [currentIndex, currentTriggerPhase, lineStrokeColor, priceTrackingActive]);

  // Monitor scroll progress to fade in price labels during semi-stable phase
  useEffect(() => {
    const unsubscribe = scrollOffset.on("change", (currentOffset) => {
      // Check if we've reached the semi-stable phase (after unstable phase)
      if (currentOffset >= positions.segments.unstable && priceLabelsOpacity.get() === 0) {
        animate(priceLabelsOpacity, 1, { duration: 1, ease: "easeInOut" });
      }
    });
    return unsubscribe;
  }, [scrollOffset, positions.segments.unstable, priceLabelsOpacity]);

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
        durations.fadeInSequence.priceIndicator.start + durations.fadeInSequence.priceIndicator.duration + 0.5;
      const measurementLineDuration = 1.5;

      // Horizontal line Stage 1: Start when measurement line reveals, end halfway through measurement line reveal
      animate(horizontalLineClipPath, viewportWidth * 0.25, {
        duration: durations.fadeInSequence.measurementLine.duration / 2, // Half the measurement line reveal duration
        ease: "easeInOut",
        delay: durations.fadeInSequence.measurementLine.start, // Start when measurement line reveals
      });

      // Phase 1: Move measurement line to 10% position
      controls = animate(measurementLineOffset, ANIMATION_CONFIG.measurementLine.minimum * 100, {
        duration: measurementLineDuration,
        ease: "anticipate",
        delay: measurementLineStartDelay,
      });

      // Phase 2: Move measurement line back to final position and expand clip path
      const phase2Duration = 3;
      const phase2StartDelay = measurementLineStartDelay + measurementLineDuration - 0.5;

      // Horizontal line Stage 2: Start when measurement line begins moving back to left
      const _horizontalStage2 = animate(horizontalLineClipPath, 0, {
        duration: 1.5 * phase2Duration, // Same duration as measurement line return
        ease: "easeInOut",
        delay: phase2StartDelay - 0.5, // Start when Phase 2 begins
      });

      await controls;

      animate(clipPathWidth, ANIMATION_CONFIG.clipPath.final, {
        duration: phase2Duration,
        ease: "easeIn",
      });

      controls = animate(measurementLineOffset, ANIMATION_CONFIG.measurementLine.final * 100, {
        duration: phase2Duration,
        ease: "easeIn",
      });

      // Activate price tracking at the start of Phase 2
      priceTrackingActive.set(1);

      await controls;

      // No need for setTimeout-based messages anymore - they're handled by position monitoring

      // Phase 3: Start continuous scrolling through all data
      const speedScale = viewportWidth / 1920; // Scale speed based on viewport width (1920 = base)
      const pxPerSecond = ANIMATION_CONFIG.baseSpeed * 60 * speedScale;
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
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full w-full sm:mb-32 sm:gap-10">
      {/* Stage Messages */}
      <div className="min-h-[200px] flex flex-col items-center justify-center">
        <AnimatePresence mode="wait">
          {currentTriggerPhase === "unstable" && (
            <motion.span
              key="real-stability"
              className="text-[2.5rem] sm:text-6xl leading-[1.1] font-thin text-pinto-gray-5 sm:text-pinto-gray-5 text-center w-[70%] sm:w-fit"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            >
              Real stability takes time.
            </motion.span>
          )}
          {currentTriggerPhase === "semiStable" && (
            <motion.span
              key="credit-earned"
              className="text-[2.5rem] sm:text-6xl leading-[1.1] font-thin text-pinto-gray-5 sm:text-pinto-gray-5 text-center w-[70%] sm:w-fit"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            >
              Credit is earned.
            </motion.span>
          )}
          {currentTriggerPhase === "stable" && (
            <motion.span
              key="pinto-alive"
              className="text-[2.5rem] sm:text-6xl leading-[1.1] font-thin text-pinto-gray-5 sm:text-pinto-gray-5 text-center w-[70%] sm:w-fit"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            >
              Pinto is alive.
            </motion.span>
          )}
          {/* MainCTA Component */}
          {currentTriggerPhase === "mainCTA" && (
            <motion.div
              className="flex flex-col gap-4 sm:gap-8"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
            >
              <div className="flex flex-col gap-2 sm:gap-4 self-stretch items-center">
                <motion.h2
                  className="text-[4rem] leading-[1.1] font-thin text-black"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: "easeInOut", delay: 0.2 }}
                >
                  <div className="flex flex-row gap-4 items-center">
                    <img src={PintoLogo} alt="Pinto Logo" className="h-14 sm:h-20" />
                    <img src={PintoLogoText} alt="Pinto Logo" className="h-14 sm:h-20" />
                  </div>
                </motion.h2>
                <motion.span
                  className="text-[1.25rem] sm:text-2xl sm:leading-[1.4] font-thin text-pinto-gray-4 w-[70%] sm:w-fit text-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: "easeInOut", delay: 0.4 }}
                >
                  An Algorithmic Stablecoin Balanced by Farmers like you.
                </motion.span>
              </div>
              <motion.div
                className="flex flex-col sm:flex-row gap-4 mx-auto items-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeInOut", delay: 0.6 }}
              >
                <Link to={navLinks.overview}>
                  <Button
                    rounded="full"
                    size={isMobile ? "sm" : "default"}
                    className="hover:bg-pinto-green-4 hover:brightness-125 [transition:filter_0.3s_ease] flex flex-row gap-2 items-center relative overflow-hidden animate-[pulse-glow_3s_ease-in-out_infinite] hover:shadow-[0_0_30px_rgba(36,102,69,0.6)] transition-shadow"
                    id={"come-seed-the-trustless-economy"}
                  >
                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-pinto-green-2/50 to-transparent" />
                    <span className="relative z-10">Come Seed the Trustless Economy</span>
                    <div className="relative z-10" style={{ isolation: "isolate" }}>
                      <PintoRightArrow width={"1rem"} height={"1rem"} />
                    </div>
                  </Button>
                </Link>
                <Link to={navLinks.docs} target="_blank" rel="noopener noreferrer">
                  <Button
                    variant="outline"
                    rounded="full"
                    size={isMobile ? "sm" : "default"}
                    className="shadow-none text-pinto-gray-4"
                  >
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
            <linearGradient id="priceLabelsGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="white" stopOpacity="0.1" />
              <stop offset="20%" stopColor="white" stopOpacity="0.3" />
              <stop offset="50%" stopColor="white" stopOpacity="1" />
              <stop offset="80%" stopColor="white" stopOpacity="0.3" />
              <stop offset="100%" stopColor="white" stopOpacity="0.1" />
            </linearGradient>
            <mask id="priceLabelsOpacityMask" maskUnits="userSpaceOnUse">
              <rect x="0" y="0" width="100%" height={height} fill="url(#priceLabelsGradient)" />
            </mask>
            <pattern
              id="grid"
              width={ANIMATION_CONFIG.gridSpacing}
              height={ANIMATION_CONFIG.gridSpacing}
              patternUnits="userSpaceOnUse"
            >
              <path
                d={`M ${ANIMATION_CONFIG.gridSpacing} 0 L 0 0 0 ${ANIMATION_CONFIG.gridSpacing}`}
                fill="none"
                stroke="#D9D9D9"
                strokeWidth={ANIMATION_CONFIG.gridStrokeWidth}
              />
            </pattern>
            {/* Clip path to hide line outside viewport */}
            <clipPath id="viewport">
              <motion.rect x="0" y="0" width={clipPathRectWidth} height={height} />
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
            d={`M 0 0 L 0 ${height}`}
            stroke="#387F5C"
            strokeWidth="2"
            strokeDasharray="3,3"
            fill="none"
            mask="url(#fadeMask)"
            style={{
              x: measurementLineX,
            }}
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
            stroke={ANIMATION_CONFIG.horizontalReference.color}
            strokeWidth={ANIMATION_CONFIG.horizontalReference.strokeWidth}
            strokeDasharray={ANIMATION_CONFIG.horizontalReference.dashArray}
            fill="none"
            mask="url(#fadeMask)"
            style={{
              clipPath: horizontalLineClipPathStyle,
            }}
          />
          {/* Price labels - static positioned to the right of final measurement line position */}
          <g mask="url(#priceLabelsOpacityMask)">
            {priceLabelData.map((labelData) => (
              <motion.text
                key={labelData.price}
                x={viewportWidth * ANIMATION_CONFIG.priceLabels.staticX + ANIMATION_CONFIG.priceLabels.xOffset}
                y={labelData.y}
                fontSize={ANIMATION_CONFIG.priceLabels.fontSize}
                fill={ANIMATION_CONFIG.priceLabels.color}
                textAnchor="start"
                style={{ opacity: priceLabelsOpacity }}
              >
                {labelData.label}
              </motion.text>
            ))}
          </g>
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
          </g>
        </svg>
        {/* Static transaction floaters - only show during price tracking */}
        {transactionMarkers.map((marker, i) => {
          // Use apex type for smarter positioning, with fallback to original logic
          let positionAbove = false;

          if (marker.apexType) {
            // If positioned at an apex, use the apex type
            positionAbove = marker.apexType === "valley";
          } else {
            // Fallback to original logic for non-apex markers
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
          }
          return (
            <FloaterContainer
              key={`${marker.x}-${marker.y}-${marker.txType}`}
              marker={marker}
              x={x}
              viewportWidth={viewportWidth}
              txFloaterWidth={txFloaterWidth}
              floatersOpacity={floatersOpacity}
              positionAbove={positionAbove}
              isFirst={i === 0}
            />
          );
        })}
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
      </div>
    </div>
  );
}
