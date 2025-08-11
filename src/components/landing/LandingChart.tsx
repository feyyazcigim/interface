import PintoLogo from "@/assets/protocol/PintoLogo.svg";
import PintoLogoText from "@/assets/protocol/PintoLogoText.svg";
import { AnimatePresence, animate, motion, useMotionValue, useTransform } from "framer-motion";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { navLinks } from "../nav/nav/Navbar";
import { Button } from "../ui/Button";
import TxFloater from "./TxFloater";

const height = 577;
const repetitions = 4; // Number of times to repeat the pattern
const pointSpacing = 80; // pixels between each data point
const scrollSpeed = 0.75;

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

  const scrollOffset = useMotionValue(0);
  const measurementLineOffset = useMotionValue(0); // Separate offset for measurement line movement
  const clipPathWidth = useMotionValue(0); // Separate motion value for clip path
  const priceTrackingActive = useMotionValue(0); // 0 = inactive, 1 = active
  const x = useTransform(scrollOffset, (value) => -value);

  // Update viewport width on mount and resize
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setViewportWidth(containerRef.current.clientWidth);
        if (viewportWidth && singlePatternWidth) {
          scrollOffset.set(viewportWidth * -0.1);
          clipPathWidth.set(viewportWidth * 0.1); // Initialize clip path to 10%
        }
      }
    };

    // Initial measurement
    updateWidth();

    // Listen for resize events
    window.addEventListener("resize", updateWidth);

    return () => window.removeEventListener("resize", updateWidth);
  }, [viewportWidth, scrollOffset, clipPathWidth]);

  const singlePatternWidth = stablePriceData.length * pointSpacing;

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

  // Dynamic measurement line position
  const baseMeasurementX = useMemo(() => viewportWidth * 0.75, [viewportWidth]);
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
  const staticY = height * 0.5; // 50% of chart height for neutral position
  const currentY = useTransform(
    [scrollOffset, measurementX, priceTrackingActive],
    ([currentOffset, measX, isActive]) => {
      // If price tracking is not active, return static position
      if (isActive < 1) {
        return staticY;
      }

      // Looping logic: after initial phase, loop only the stable segment
      let xVal = measX + currentOffset;
      if (xVal > unstablePhaseWidth) {
        // Offset so the stable segment loops seamlessly
        const stableOffset = (xVal - unstablePhaseWidth) % stablePhaseWidth;
        xVal = unstablePhaseWidth + stableOffset;
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
  const ctaTimerRef = useRef<NodeJS.Timeout | null>(null);

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
      if (ctaTimerRef.current) {
        clearTimeout(ctaTimerRef.current);
      }
    };
  }, []);

  // Two-phase animation: measurement line movement, then chart scrolling
  useEffect(() => {
    let controls: ReturnType<typeof animate> | null = null;

    const startAnimation = async () => {
      // Phase 1: Move measurement line from 75% to 10% (chart draws behind)
      const moveToStart = viewportWidth * (0.1 - 0.75); // Negative offset to move left
      controls = animate(measurementLineOffset, moveToStart, {
        duration: 3,
        ease: "easeInOut",
        delay: 6.5, // After all fade-ins complete
      });

      await controls;

      // Phase 2: Move measurement line back to 75% AND expand clip path (chart draws)
      const _clipPathAnimation = animate(clipPathWidth, viewportWidth * 0.75, {
        duration: 4,
        ease: "easeIn",
      });

      controls = animate(measurementLineOffset, 0, {
        duration: 4,
        ease: "easeIn",
      });

      // Activate price tracking at the start of Phase 2
      priceTrackingActive.set(1);

      // Trigger stage messages during Phase 2
      setTimeout(() => setShowRealStability(true), 500); // 0.5s into Phase 2
      setTimeout(() => {
        setShowRealStability(false);
        setShowCreditEarned(true);
      }, 2000); // 2s into Phase 2
      setTimeout(() => {
        setShowCreditEarned(false);
        setShowPintoAlive(true);
        // Hide "Pinto is alive" after 5 seconds and then show MainCTA
        pintoTimerRef.current = setTimeout(() => {
          setShowPintoAlive(false);
          ctaTimerRef.current = setTimeout(() => {
            setShowMainCTA(true);
          }, 500);
        }, 5000);
      }, 3500); // 3.5s into Phase 2

      await controls;

      // Phase 3: Resume normal chart scrolling behavior
      const pxPerSecond = scrollSpeed * 60;
      const totalInitialWidth = unstablePhaseWidth + getSegmentWidth(semiStablePriceData, pointSpacing);
      controls = animate(scrollOffset, totalInitialWidth, {
        duration: totalInitialWidth / pxPerSecond,
        ease: "linear",
        onComplete: () => {
          // Loop only the stable segment
          controls = animate(scrollOffset, totalInitialWidth + stablePhaseWidth, {
            duration: stablePhaseWidth / pxPerSecond / 2,
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
    unstablePhaseWidth,
    stablePhaseWidth,
    viewportWidth,
    clipPathWidth,
    priceTrackingActive,
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
            transition={{ duration: 3, ease: "easeInOut", delay: 2 }}
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
            transition={{ duration: 2, ease: "easeInOut", delay: 3 }}
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
              transition={{ duration: 0.5, delay: 5.2 }}
            />
            {/* Static transaction floaters */}
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
                  style={{ pointerEvents: "none", x }}
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
            opacity: { duration: 0.25, delay: 5.9 },
            scale: { duration: 1, repeat: Infinity, ease: "easeInOut" },
          }}
        >
          <div className="w-full h-full rounded-full bg-white" />
        </motion.div>
        {/* Floating emoji + image marker above the animated circle */}
        <motion.div
          className="absolute -ml-[1.25rem] -mt-[5rem]"
          style={{
            left: measurementX,
            top: currentY,
            pointerEvents: "none",
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
