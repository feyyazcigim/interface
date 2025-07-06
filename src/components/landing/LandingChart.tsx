import { AnimatePresence, animate, motion, useMotionValue, useTransform } from "framer-motion";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import TxFloater from "./TxFloater";

const height = 577;
const repetitions = 10; // Number of times to repeat the pattern
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
}

const unstablePriceData: PricePoint[] = [
  { txType: null, value: 1.0 },
  { txType: null, value: 1.0 },
  { txType: "deposit", value: 1.008 },
  { txType: "harvest", value: 0.992 },
  { txType: "deposit", value: 1.006 },
  { txType: "withdraw", value: 0.995 },
  { txType: "convert", value: 1.005 },
  { txType: "convert", value: 0.997 },
  { txType: "deposit", value: 1.004 },
  { txType: "harvest", value: 0.998 },
  { txType: "sow", value: 1.003 },
  { txType: "withdraw", value: 0.999 },
  { txType: "convert", value: 1.002 },
  { txType: "yield", value: 1.0 },
  { txType: null, value: 1.001 },
  { txType: null, value: 1.0 },
  { txType: null, value: 0.999 },
  { txType: null, value: 1.001 },
  { txType: null, value: 1.0 },
  { txType: null, value: 1.002 },
  { txType: "deposit", value: 1.004 },
  { txType: "harvest", value: 0.997 },
  { txType: "deposit", value: 1.003 },
  { txType: "withdraw", value: 0.998 },
  { txType: "convert", value: 1.0025 },
  { txType: "yield", value: 1.0 },
  { txType: null, value: 1.0005 },
  { txType: null, value: 0.9995 },
  { txType: null, value: 1.0002 },
  { txType: null, value: 0.9998 },
  { txType: null, value: 1.0003 },
  { txType: null, value: 0.9999 },
];

const stablePriceData: PricePoint[] = [
  { txType: null, value: 0.9998 },
  { txType: "withdraw", value: 1.0 },
  { txType: "sow", value: 0.9994 },
  { txType: "harvest", value: 1.0004 },
  { txType: "deposit", value: 0.9994 },
  { txType: "yield", value: 1.003 },
  { txType: "convert", value: 0.997 },
  { txType: "withdraw", value: 1.0004 },
  { txType: "deposit", value: 0.9994 },
  { txType: "convert", value: 1.0002 },
];

// Combine unstablePriceData once, then stablePriceData repeated for seamless looping
const fullPriceData: PricePoint[] = [
  ...unstablePriceData,
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
const FarmerProfile = React.memo(function FarmerProfile({ icon, bg }: { icon: string; bg: string }) {
  return (
    <div className="w-8 h-8 flex items-center justify-center rounded-full" style={{ backgroundColor: bg }}>
      <span className="text-2xl">{icon}</span>
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
  const totalLength = fullPriceData.length;
  const totalWidth = totalLength * pointSpacing;
  const points: { x: number; y: number; price: number }[] = [];
  const beziers: {
    p0: { x: number; y: number };
    c1: { x: number; y: number };
    c2: { x: number; y: number };
    p1: { x: number; y: number };
  }[] = [];
  // Add index to each transaction marker for robust placement
  const transactionMarkers: { x: number; y: number; txType: string; farmer?: Farmer; index: number }[] = [];

  for (let i = 0; i < fullPriceData.length; i++) {
    const x = i * pointSpacing;
    const y = priceToY(fullPriceData[i].value);
    points.push({ x, y, price: fullPriceData[i].value });
    if (fullPriceData[i].txType) {
      const txType = fullPriceData[i].txType as string;
      transactionMarkers.push({ x, y, txType, farmer: fullPriceData[i].farmer, index: i });
    }
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

  return { path, points, totalWidth, beziers, transactionMarkers };
}

// Helper: cubic Bezier at t
function cubicBezier(p0: number, c1: number, c2: number, p1: number, t: number) {
  const mt = 1 - t;
  return mt ** 3 * p0 + 3 * mt ** 2 * t * c1 + 3 * mt * t ** 2 * c2 + t ** 3 * p1;
}

export default function LandingChart() {
  const [viewportWidth, setViewportWidth] = useState(1920); // Default width
  const containerRef = useRef<HTMLDivElement>(null);

  const scrollOffset = useMotionValue(0);
  const x = useTransform(scrollOffset, (value) => -value);

  // Update viewport width on mount and resize
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setViewportWidth(containerRef.current.clientWidth);
        if (viewportWidth && singlePatternWidth) {
          scrollOffset.set(viewportWidth * -1);
        }
      }
    };

    // Initial measurement
    updateWidth();

    // Listen for resize events
    window.addEventListener("resize", updateWidth);

    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  const initialPhaseWidth = unstablePriceData.length * pointSpacing;
  const singlePatternWidth = stablePriceData.length * pointSpacing;

  // Memoize generateCompletePath result, only recalculating if pointSpacing or priceData changes
  const { path, beziers, transactionMarkers } = useMemo(() => generateCompletePath(pointSpacing), []);

  // Memoize measurementX
  const measurementX = useMemo(() => viewportWidth * 0.75, [viewportWidth]);

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

  // Use Bezier curve for indicator Y
  const totalDataWidth = fullPriceData.length * pointSpacing;
  const currentY = useTransform(scrollOffset, (currentOffset) => {
    const measurementX = viewportWidth * 0.75;
    const xVal = (measurementX + currentOffset) % totalDataWidth;
    return getYOnBezierCurve(xVal);
  });

  // Get current price and txType at the 75% position
  const currentIndex = useTransform(scrollOffset, (currentOffset) => {
    const positionInPattern = (measurementX + currentOffset) % totalDataWidth;
    const exactIndex = positionInPattern / pointSpacing;
    return Math.round(exactIndex);
  });

  // Get the current txType and farmer for the floating marker
  const [currentTxType, setCurrentTxType] = useState<string | null>(null);
  const [currentFarmer, setCurrentFarmer] = useState<Farmer | undefined>(undefined);
  useEffect(() => {
    const unsubscribe = currentIndex.on("change", (idx) => {
      const i = Math.max(0, Math.min(Math.round(idx), fullPriceData.length - 1));
      setCurrentTxType(fullPriceData[i].txType);
      setCurrentFarmer(fullPriceData[i].farmer);
    });
    return unsubscribe;
  }, [currentIndex]);

  useEffect(() => {
    let controls: ReturnType<typeof animate> | null = null;
    // Calculate speed in pixels per second
    const pxPerSecond = scrollSpeed * 60; // scrollSpeed is in px/frame, 60fps
    controls = animate(scrollOffset, initialPhaseWidth, {
      duration: initialPhaseWidth / pxPerSecond,
      ease: "linear",
      delay: 5.5,
      onComplete: () => {
        // Start infinite loop after initial phase, same px/sec speed
        controls = animate(scrollOffset, singlePatternWidth + initialPhaseWidth, {
          duration: singlePatternWidth / pxPerSecond / 2,
          ease: "linear",
          repeat: Infinity,
          repeatType: "loop",
        });
      },
    });
    return () => {
      controls?.stop();
    };
  }, [scrollOffset, initialPhaseWidth, singlePatternWidth]);

  return (
    <div className="flex flex-col items-center justify-center h-full w-full">
      <div ref={containerRef} className="w-full relative">
        <svg width="100%" height={height} viewBox={`0 0 ${viewportWidth} ${height}`} style={{ overflow: "visible" }}>
          <defs>
            <pattern id="grid" width="72" height="72" patternUnits="userSpaceOnUse">
              <path d="M 72 0 L 0 0 0 72" fill="none" stroke="#D9D9D9" strokeWidth="1" />
            </pattern>
            {/* Clip path to hide line outside viewport */}
            <clipPath id="viewport">
              <rect x="0" y="0" width={viewportWidth - viewportWidth * 0.25} height={height} />
            </clipPath>
          </defs>
          <motion.rect
            width="100%"
            height="100%"
            fill="url(#grid)"
            initial={{ opacity: 0, clipPath: "inset(0 0 100% 0)" }}
            animate={{ opacity: 1, clipPath: "inset(0 0 0 0)" }}
            transition={{ duration: 3, ease: "easeInOut", delay: 2 }}
          />
          {/* Measurement line at 75% */}
          <motion.line
            x1={measurementX}
            y1={0}
            x2={measurementX}
            y2={height}
            stroke="#387F5C"
            strokeWidth="2"
            strokeDasharray="3,3"
            initial={{ clipPath: "inset(0 0 100% 0)" }}
            animate={{ clipPath: "inset(0 0 0 0)" }}
            transition={{ duration: 0.5, ease: "easeInOut", delay: 4.5 }}
          />
          {/* Scrolling price line */}
          <g clipPath="url(#viewport)">
            <motion.path
              d={path}
              fill="none"
              stroke="#387F5C"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ x }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 5.5 }}
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
          className="absolute -ml-[0.625rem] -mt-[0.625rem] z-10 rounded-full border-4 w-5 h-5 border-pinto-green-4 bg-pinto-green-4 shadow-lg "
          style={{
            left: measurementX,
            top: currentY,
            pointerEvents: "none",
            boxShadow: "0 0 10px #387F5C, 0 0 4.32px #387F5C, 0 0 2.16px #387F5C",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, scale: [1, 1.1, 1] }}
          transition={{
            opacity: { duration: 0.25, delay: 5.75 },
            scale: { duration: 1, repeat: Infinity, ease: "easeInOut" },
          }}
        >
          <div className="w-full h-full rounded-full bg-white border-pinto-green-4" />
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

// Assign a unique farmer icon to each non-null txType price point
const assignedFarmers = personIcons.slice();
let farmerIdx = 0;
for (let i = 0; i < fullPriceData.length; i++) {
  if (fullPriceData[i].txType) {
    fullPriceData[i].farmer = assignedFarmers[farmerIdx % assignedFarmers.length];
    farmerIdx++;
  }
}
