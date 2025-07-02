import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import FisheyeEffect from "./FisheyeEffect";
import TxFloater from "./TxFloater";

const height = 577;

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

const priceData: PricePoint[] = [
  { txType: null, value: 1.0 },
  { txType: null, value: 1.0 },
  { txType: null, value: 1.0 },
  { txType: null, value: 1.0 },
  { txType: null, value: 1.0 },
  { txType: "withdraw", value: 1.0 },
  { txType: "sow", value: 0.9994 },
  { txType: "harvest", value: 1.0004 },
  { txType: "deposit", value: 0.9994 },
  { txType: "yield", value: 1.01 },
  { txType: "convert", value: 0.99 },
  { txType: "withdraw", value: 1.0004 },
  { txType: "deposit", value: 0.9994 },
  { txType: "convert", value: 1.0002 },
  { txType: null, value: 1.0 },
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

function FarmerProfile({ icon, bg }) {
  return (
    <div className="w-8 h-8 flex items-center justify-center rounded-full" style={{ backgroundColor: bg }}>
      <span className="text-2xl">{icon}</span>
    </div>
  );
}

// Convert price to Y coordinate (inverted because SVG Y increases downward)
const priceToY = (price) => {
  const minPrice = 0.99;
  const maxPrice = 1.01;
  const minY = height - 0; // Bottom margin
  const maxY = 0; // Top margin
  return minY - ((price - minPrice) / (maxPrice - minPrice)) * (minY - maxY);
};

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
      }
    };

    // Initial measurement
    updateWidth();

    // Listen for resize events
    window.addEventListener("resize", updateWidth);

    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  const pointSpacing = 20; // pixels between each data point
  const scrollSpeed = 0.5;

  const singlePatternWidth = priceData.length * pointSpacing;

  // Generate complete line path with multiple repetitions
  const generateCompletePath = () => {
    const repetitions = 10; // Number of times to repeat the pattern
    const totalLength = priceData.length * repetitions;
    const totalWidth = totalLength * pointSpacing;
    const points: { x: number; y: number; price: number }[] = [];

    // Create points from repeated price data
    for (let rep = 0; rep < repetitions; rep++) {
      for (let i = 0; i < priceData.length; i++) {
        const x = (rep * priceData.length + i) * pointSpacing;
        const y = priceToY(priceData[i].value);
        points.push({ x, y, price: priceData[i].value });
      }
    }

    // Create SVG path
    if (points.length === 0) return { path: "", points: [], totalWidth: 0 };

    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      path += ` L ${points[i].x} ${points[i].y}`;
    }

    return { path, points, totalWidth };
  };

  const { path } = generateCompletePath();

  // Get current price and txType at the 75% position
  const measurementX = viewportWidth * 0.75;

  const currentIndex = useTransform(scrollOffset, (currentOffset) => {
    const positionInPattern = (measurementX + currentOffset) % singlePatternWidth;
    const exactIndex = positionInPattern / pointSpacing;
    return Math.round(exactIndex);
  });

  const currentPrice = useTransform(scrollOffset, (currentOffset) => {
    const positionInPattern = (measurementX + currentOffset) % singlePatternWidth;
    const exactIndex = positionInPattern / pointSpacing;

    const lowerIndex = Math.floor(exactIndex);
    const upperIndex = Math.ceil(exactIndex);

    const clampedLowerIndex = Math.max(0, Math.min(lowerIndex, priceData.length - 1));
    const clampedUpperIndex = Math.max(0, Math.min(upperIndex, priceData.length - 1));

    if (clampedLowerIndex === clampedUpperIndex) {
      return priceData[clampedLowerIndex].value;
    }

    const t = exactIndex - lowerIndex;
    const lowerPrice = priceData[clampedLowerIndex].value;
    const upperPrice = priceData[clampedUpperIndex].value;

    return lowerPrice + (upperPrice - lowerPrice) * t;
  });

  // Get the current txType and farmer for the floating marker
  const [currentTxType, setCurrentTxType] = useState<string | null>(null);
  const [currentFarmer, setCurrentFarmer] = useState<Farmer | undefined>(undefined);
  useEffect(() => {
    const unsubscribe = currentIndex.on("change", (idx) => {
      const i = Math.max(0, Math.min(Math.round(idx), priceData.length - 1));
      setCurrentTxType(priceData[i].txType);
      setCurrentFarmer(priceData[i].farmer);
    });
    return unsubscribe;
  }, [currentIndex]);

  useEffect(() => {
    const controls = animate(scrollOffset, singlePatternWidth, {
      duration: singlePatternWidth / scrollSpeed / 60, // Convert to seconds based on 60fps
      ease: "linear",
      repeat: Infinity,
      repeatType: "loop",
    });

    return () => controls.stop();
  }, [scrollOffset, singlePatternWidth]);

  const currentY = useTransform(currentPrice, (y) => priceToY(y));

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
          <rect width="100%" height="100%" fill="url(#grid)" />
          {/* Measurement line at 75% */}
          <line
            x1={measurementX}
            y1={0}
            x2={measurementX}
            y2={height}
            stroke="#387F5C"
            strokeWidth="2"
            strokeDasharray="3,3"
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
            />
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
          animate={{
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: "easeInOut",
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
            from={currentFarmer ? <FarmerProfile icon={currentFarmer.icon} bg={currentFarmer.bg} /> : null}
            txType={currentTxType}
          />
        </motion.div>
      </div>
    </div>
  );
}

// Assign a unique farmer icon to each non-null txType price point
const assignedFarmers = personIcons.slice();
let farmerIdx = 0;
for (let i = 0; i < priceData.length; i++) {
  if (priceData[i].txType) {
    priceData[i].farmer = assignedFarmers[farmerIdx % assignedFarmers.length];
    farmerIdx++;
  }
}
