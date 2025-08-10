import { AnimatePresence, animate, motion, useMotionValue, useTransform } from "framer-motion";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import TxFloater from "./TxFloater";

const height = 577;
const repetitions = 50; // Number of times to repeat the pattern
const pointSpacing = 120; // pixels between each data point
const scrollSpeed = 1.5;

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
  speedVariance?: number;
  priceVariance?: number;
  spacingVariance?: number; // Optional spacing variance for this data point
}

const unstablePriceData: PricePoint[] = [
  { txType: null, value: 1.0 },
  { txType: null, value: 1.0 },
  { txType: "deposit", value: 1.008 },
  { txType: "harvest", value: 0.993, speed: 0.8 },
  { txType: "deposit", value: 1.0055, speed: 0.7 },
  { txType: "withdraw", value: 0.9955, speed: 0.6 },
  { txType: "convert", value: 1.0025, speed: 0.6 },
  { txType: "convert", value: 0.9984, speed: 0.6 },
  { txType: "sow", value: 1.0004, speed: 0.6 },
  { txType: "withdraw", value: 0.9995, speed: 0.6 },
  { txType: null, value: 1.0001 },
  { txType: null, value: 0.9998 },
  { txType: "deposit", value: 1.004 },
  { txType: "harvest", value: 0.997 },
  { txType: "deposit", value: 1.003 },
  { txType: "withdraw", value: 0.998 },
  { txType: "convert", value: 1.0025 },
  { txType: "yield", value: 1.0 },
];

const stablePriceData: PricePoint[] = [
  { txType: "deposit", value: 0.9994, speedVariance: 0.25, priceVariance: 0.0004, spacingVariance: 50 },
  { txType: "withdraw", value: 1.0004, speedVariance: 0.25, priceVariance: 0.0004, spacingVariance: 50 },
  { txType: "sow", value: 0.9994, speed: 3, speedVariance: 0.25, priceVariance: 0.0004, spacingVariance: 50 },
  { txType: "yield", value: 1.005, speed: 3, speedVariance: 0.25, priceVariance: 0.0004, spacingVariance: 50 },
  { txType: "convert", value: 0.995, speed: 1, speedVariance: 0.25, priceVariance: 0.0004, spacingVariance: 50 },
  { txType: "harvest", value: 1.0004, speedVariance: 0.25, priceVariance: 0.0004, spacingVariance: 50 },
];

// Segment-based data structure
interface ChartSegment {
  id: string;
  startX: number;
  endX: number;
  pathData: string;
  points: { x: number; y: number; price: number }[];
  transactionMarkers: { x: number; y: number; txType: string; farmer?: Farmer; index: number }[];
  bezierSegments: {
    p0: { x: number; y: number };
    c1: { x: number; y: number };
    c2: { x: number; y: number };
    p1: { x: number; y: number };
  }[];
}

// Function to apply variance to price data points
function applyVarianceToPoint(point: PricePoint): PricePoint {
  const newPoint = { ...point };

  // Apply speed variance if present
  if (point.speedVariance !== undefined) {
    const speedVar = (Math.random() - 0.5) * 2 * point.speedVariance;
    if (point.speed !== undefined) {
      newPoint.speed = Math.max(0.1, point.speed + speedVar);
    } else {
      newPoint.speed = Math.max(0.1, scrollSpeed + speedVar);
    }
  }

  // Apply price variance if present
  if (point.priceVariance !== undefined) {
    const priceVar = (Math.random() - 0.5) * 2 * point.priceVariance;
    newPoint.value = point.value + priceVar;
  }

  return newPoint;
}

// Generate a single segment from price data
function generateSegment(
  data: PricePoint[],
  startX: number,
  segmentId: string,
  lastPrice?: number,
  globalIndexOffset: number = 0,
  nextSegmentFirstPoint?: { x: number; y: number; price: number },
): ChartSegment {
  const points: { x: number; y: number; price: number }[] = [];
  const transactionMarkers: { x: number; y: number; txType: string; farmer?: Farmer; index: number }[] = [];
  const beziers: {
    p0: { x: number; y: number };
    c1: { x: number; y: number };
    c2: { x: number; y: number };
    p1: { x: number; y: number };
  }[] = [];

  let x = startX;
  const processedData = [...data];

  // Ensure price continuity
  if (lastPrice !== undefined && processedData.length > 0) {
    processedData[0] = { ...processedData[0], value: lastPrice };
  }

  for (let i = 0; i < processedData.length; i++) {
    const y = priceToY(processedData[i].value);
    points.push({ x, y, price: processedData[i].value });

    if (processedData[i].txType) {
      const txType = processedData[i].txType as string;
      transactionMarkers.push({
        x,
        y,
        txType,
        farmer: processedData[i].farmer,
        index: globalIndexOffset + i,
      });
    }

    // Don't add spacing after the last point
    if (i < processedData.length - 1) {
      let spacing = pointSpacing;
      if (processedData[i].spacingVariance !== undefined) {
        const spacingVar = (Math.random() - 0.5) * 2 * (processedData[i].spacingVariance || 0);
        spacing = Math.max(10, pointSpacing + spacingVar);
      }
      const segSpeed = processedData[i].speed || 1;
      x += spacing / segSpeed;
    }
  }

  // Generate path with Bezier smoothing
  let pathData = "";
  if (points.length > 0) {
    pathData = segmentId === "unstable" ? `M ${points[0].x} ${points[0].y}` : "";

    for (let i = segmentId === "unstable" ? 1 : 0; i < points.length; i++) {
      const p0 = i > 0 ? points[i - 1] : points[i];
      const p1 = points[i];
      const prev = points[i - 2] || p0;

      // For the last point, use the next segment's first point if available
      let next = points[i + 1] || p1;
      if (i === points.length - 1 && nextSegmentFirstPoint) {
        next = nextSegmentFirstPoint;
      }

      // Calculate control points
      const c1x = p0.x + (p1.x - prev.x) / 6;
      const c1y = p0.y + (p1.y - prev.y) / 6;
      const c2x = p1.x - (next.x - p0.x) / 6;
      const c2y = p1.y - (next.y - p0.y) / 6;

      pathData += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p1.x} ${p1.y}`;

      if (i > 0) {
        beziers.push({ p0, c1: { x: c1x, y: c1y }, c2: { x: c2x, y: c2y }, p1 });
      }
    }
  }

  return {
    id: segmentId,
    startX,
    endX: x,
    pathData,
    points,
    transactionMarkers,
    bezierSegments: beziers,
  };
}

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

// Helper: cubic Bezier at t
function cubicBezier(p0: number, c1: number, c2: number, p1: number, t: number) {
  const mt = 1 - t;
  return mt ** 3 * p0 + 3 * mt ** 2 * t * c1 + 3 * mt * t ** 2 * c2 + t ** 3 * p1;
}

export default function LandingChart() {
  const [viewportWidth, setViewportWidth] = useState(1920);
  const [segments, setSegments] = useState<ChartSegment[]>([]);
  const [unstableSegment, setUnstableSegment] = useState<ChartSegment | null>(null);
  const segmentIdCounterRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const scrollOffset = useMotionValue(0);
  const x = useTransform(scrollOffset, (value) => -value);

  // Generate the initial unstable segment
  useEffect(() => {
    const unstable = generateSegment(unstablePriceData, 0, "unstable", undefined, 0);
    setUnstableSegment(unstable);

    // Assign farmers to unstable segment transaction markers
    let farmerIdx = 0;
    unstable.transactionMarkers.forEach((marker) => {
      const pointIndex = unstable.points.findIndex((p) => p.x === marker.x);
      if (pointIndex !== -1 && unstable.points[pointIndex]) {
        marker.farmer = personIcons[farmerIdx % personIcons.length];
        farmerIdx++;
      }
    });
  }, []);

  // Update viewport width on mount and resize
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setViewportWidth(containerRef.current.clientWidth);
        // Initialize scroll to show the left edge
        if (viewportWidth === 1920) {
          // Only on first load
          scrollOffset.set(-viewportWidth);
        }
      }
    };

    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  // Segment management: generate segments based on scroll position
  useEffect(() => {
    if (!unstableSegment) return;

    const unsubscribe = scrollOffset.on("change", (currentScroll) => {
      const bufferWidth = viewportWidth * 2;
      const visibleStart = currentScroll;
      const visibleEnd = currentScroll + viewportWidth;
      const generateEnd = visibleEnd + bufferWidth;

      setSegments((currentSegments) => {
        // Find the rightmost point we need to cover
        const lastSegment = currentSegments.length > 0 ? currentSegments[currentSegments.length - 1] : null;
        const currentRightEdge = lastSegment ? lastSegment.endX : unstableSegment.endX;

        // Generate new segments if needed
        if (currentRightEdge < generateEnd) {
          const newSegments: ChartSegment[] = [...currentSegments];
          let nextX = currentRightEdge;
          let globalIndex =
            unstableSegment.points.length + currentSegments.reduce((acc, seg) => acc + seg.points.length, 0);

          while (nextX < generateEnd) {
            // Get the last price for continuity
            let lastPrice: number | undefined;
            if (newSegments.length > 0) {
              const lastSeg = newSegments[newSegments.length - 1];
              lastPrice = lastSeg.points[lastSeg.points.length - 1]?.price;
            } else {
              lastPrice = unstableSegment.points[unstableSegment.points.length - 1]?.price;
            }

            // Generate current segment data
            const currentVarianceData = stablePriceData.map(applyVarianceToPoint);

            // Generate next segment data to get its first point for smooth connection
            const nextVarianceData = stablePriceData.map(applyVarianceToPoint);
            let nextSegmentFirstPoint: { x: number; y: number; price: number } | undefined;

            if (nextX + 500 < generateEnd) {
              // Only if we need another segment
              // Calculate where the next segment would start
              let tempX = nextX;
              for (let i = 0; i < currentVarianceData.length - 1; i++) {
                let spacing = pointSpacing;
                if (currentVarianceData[i].spacingVariance !== undefined) {
                  const spacingVar = (Math.random() - 0.5) * 2 * (currentVarianceData[i].spacingVariance || 0);
                  spacing = Math.max(10, pointSpacing + spacingVar);
                }
                const segSpeed = currentVarianceData[i].speed || 1;
                tempX += spacing / segSpeed;
              }

              // Get the first point of next segment
              const nextLastPrice = currentVarianceData[currentVarianceData.length - 1].value;
              const nextFirstPrice = nextVarianceData.length > 0 ? nextLastPrice : nextLastPrice;
              nextSegmentFirstPoint = {
                x: tempX,
                y: priceToY(nextFirstPrice),
                price: nextFirstPrice,
              };
            }

            // Generate the current segment with next segment's first point for smooth curves
            const newSegment = generateSegment(
              currentVarianceData,
              nextX,
              `stable-${segmentIdCounterRef.current}`,
              lastPrice,
              globalIndex,
              nextSegmentFirstPoint,
            );

            // Assign farmers to transaction markers
            let farmerIdx = 0;
            newSegment.transactionMarkers.forEach((marker) => {
              marker.farmer = personIcons[farmerIdx % personIcons.length];
              farmerIdx++;
            });

            newSegments.push(newSegment);
            nextX = newSegment.endX;
            segmentIdCounterRef.current++;
            globalIndex += newSegment.points.length;
          }

          return newSegments;
        }

        // Clean up segments that are far to the left
        const cleanupThreshold = visibleStart - bufferWidth * 2;
        const keptSegments = currentSegments.filter((seg) => seg.endX > cleanupThreshold);
        return keptSegments.length !== currentSegments.length ? keptSegments : currentSegments;
      });
    });

    return unsubscribe;
  }, [unstableSegment, viewportWidth]);

  // Combine all segments for rendering
  const allSegments = useMemo(() => {
    return unstableSegment ? [unstableSegment, ...segments] : segments;
  }, [unstableSegment, segments]);

  const allBeziers = useMemo(() => {
    return allSegments.flatMap((seg) => seg.bezierSegments);
  }, [allSegments]);

  const allTransactionMarkers = useMemo(() => {
    return allSegments.flatMap((seg) => seg.transactionMarkers);
  }, [allSegments]);

  const combinedPath = useMemo(() => {
    if (allSegments.length === 0) return "";

    let combined = "";
    for (let i = 0; i < allSegments.length; i++) {
      const segment = allSegments[i];
      if (i === 0) {
        // First segment includes the Move command
        combined += segment.pathData;
      } else {
        // Subsequent segments: skip the 'M x y' part and just add the curves
        const pathWithoutMove = segment.pathData.replace(/^M\s+[\d.-]+\s+[\d.-]+\s*/, "");
        combined += " " + pathWithoutMove;
      }
    }
    return combined;
  }, [allSegments]);

  // Memoize measurementX
  const measurementX = useMemo(() => viewportWidth * 0.75, [viewportWidth]);

  // Memoize getYOnBezierCurve
  const getYOnBezierCurve = useCallback(
    (xVal: number) => {
      for (const seg of allBeziers) {
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
      // Fallback: find closest point
      const allPoints = allSegments.flatMap((seg) => seg.points);
      if (allPoints.length > 0) {
        let closest = allPoints[0];
        let minDist = Math.abs(closest.x - xVal);
        for (const point of allPoints) {
          const dist = Math.abs(point.x - xVal);
          if (dist < minDist) {
            minDist = dist;
            closest = point;
          }
        }
        return closest.y;
      }
      return height / 2; // Fallback to middle
    },
    [allBeziers, allSegments],
  );

  // Use Bezier curve for indicator Y
  const currentY = useTransform(scrollOffset, (currentOffset) => {
    const xVal = measurementX + currentOffset;
    return getYOnBezierCurve(xVal);
  });

  // Get current transaction data at the measurement position
  const getCurrentTransactionData = useCallback(
    (currentOffset: number) => {
      const xVal = measurementX + currentOffset;

      // Find the closest transaction marker
      let closestMarker: { txType: string; farmer?: Farmer } | null = null;
      let minDist = Infinity;

      for (const marker of allTransactionMarkers) {
        const dist = Math.abs(marker.x - xVal);
        if (dist < minDist && dist < pointSpacing / 2) {
          // Within half spacing
          minDist = dist;
          closestMarker = { txType: marker.txType, farmer: marker.farmer };
        }
      }

      return closestMarker;
    },
    [measurementX, allTransactionMarkers],
  );

  // Get the current txType and farmer for the floating marker
  const [currentTxType, setCurrentTxType] = useState<string | null>(null);
  const [currentFarmer, setCurrentFarmer] = useState<Farmer | undefined>(undefined);

  const lineStrokeColor = useMotionValue("#387F5C");

  useEffect(() => {
    const unsubscribe = scrollOffset.on("change", (currentOffset) => {
      const transactionData = getCurrentTransactionData(currentOffset);
      const newTxType = transactionData?.txType || null;
      const newFarmer = transactionData?.farmer;

      // Trigger flash effect when txType changes and is not null
      if (newTxType !== currentTxType && newTxType !== null) {
        animate(lineStrokeColor, "#00C767", { duration: 0.25, ease: "easeInOut" }).then(() => {
          animate(lineStrokeColor, "#387F5C", { duration: 0.25, ease: "easeInOut" });
        });
      }

      setCurrentTxType(newTxType);
      setCurrentFarmer(newFarmer);
    });
    return unsubscribe;
  }, [scrollOffset, getCurrentTransactionData, currentTxType]);

  // Infinite scrolling animation at constant rate
  useEffect(() => {
    let animationId: number;
    let startTime: number;
    let initialScrollValue: number;

    const animate = () => {
      const currentTime = performance.now();
      const elapsed = currentTime - startTime;

      // Scroll at constant rate: scrollSpeed pixels per second
      const newScrollValue = initialScrollValue + (elapsed / 1000) * scrollSpeed * 60;
      scrollOffset.set(newScrollValue);

      animationId = requestAnimationFrame(animate);
    };

    // Start animation after delay
    const startAnimation = () => {
      startTime = performance.now();
      initialScrollValue = scrollOffset.get();
      animationId = requestAnimationFrame(animate);
    };

    const timeoutId = setTimeout(startAnimation, 5500); // 5.5 second delay

    return () => {
      clearTimeout(timeoutId);
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [scrollOffset]);

  const [showAnimation, setShowAnimation] = useState<(string | undefined)[]>(() => personIcons.map(() => undefined));

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
    <div className="flex flex-col items-center justify-center h-full w-full mb-32">
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
              <rect x="0" y="0" width={viewportWidth - viewportWidth * 0.25} height={height} />
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
          {/* Measurement line at 75% */}
          <motion.path
            d={`M ${measurementX} 0 L ${measurementX} ${height}`}
            stroke="#387F5C"
            strokeWidth="2"
            strokeDasharray="3,3"
            fill="none"
            mask="url(#fadeMask)"
            initial={{ clipPath: "inset(0 0 100% 0)" }}
            animate={{ clipPath: "inset(0 0 0.01% 0)" }}
            transition={{ duration: 4, ease: "easeInOut", delay: 4.5 }}
          />
          {/* Scrolling price line */}
          <g clipPath="url(#viewport)">
            <motion.path
              d={combinedPath}
              fill="none"
              stroke={lineStrokeColor}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ x }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 5.5 }}
            />
            {/* Static transaction floaters */}
            {allTransactionMarkers.map((marker, index) => {
              // Simple positioning logic
              const positionAbove = Math.random() > 0.5; // Randomize for now
              return (
                <motion.foreignObject
                  key={`${marker.x}-${marker.y}-${marker.txType}-${index}`}
                  x={marker.x - 40}
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
            opacity: { duration: 0.25, delay: 5.75 },
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
