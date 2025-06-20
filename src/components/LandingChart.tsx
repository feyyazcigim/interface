import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";

const height = 577;

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

  // Price data with more baseline points to space out peaks and dips
  const priceData = [
    1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 0.9994, 1.0004, 0.9994,
    1.01, 0.99, 1.0004, 0.9994, 1.0002, 1.0,
  ];

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
  const scrollSpeed = 1.5;

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
        const y = priceToY(priceData[i]);
        points.push({ x, y, price: priceData[i] });
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

  const { path, points, totalWidth } = generateCompletePath();

  // Get current price at the 75% position
  const measurementX = viewportWidth * 0.75;

  const currentPrice = useTransform(scrollOffset, (currentOffset) => {
    const positionInPattern = (measurementX + currentOffset) % singlePatternWidth;
    const exactIndex = positionInPattern / pointSpacing;

    const lowerIndex = Math.floor(exactIndex);
    const upperIndex = Math.ceil(exactIndex);

    const clampedLowerIndex = Math.max(0, Math.min(lowerIndex, priceData.length - 1));
    const clampedUpperIndex = Math.max(0, Math.min(upperIndex, priceData.length - 1));

    if (clampedLowerIndex === clampedUpperIndex) {
      return priceData[clampedLowerIndex];
    }

    const t = exactIndex - lowerIndex;
    const lowerPrice = priceData[clampedLowerIndex];
    const upperPrice = priceData[clampedUpperIndex];

    return lowerPrice + (upperPrice - lowerPrice) * t;
  });

  useEffect(() => {
    const controls = animate(scrollOffset, singlePatternWidth, {
      duration: singlePatternWidth / scrollSpeed / 60, // Convert to seconds based on 60fps
      ease: "linear",
      repeat: Infinity,
      repeatType: "loop",
    });

    return () => controls.stop();
  }, [scrollOffset, singlePatternWidth]);

  const currentY = useTransform(currentPrice, priceToY);

  return (
    <div className="flex flex-col items-center justify-center h-full w-full">
      <div ref={containerRef} className="w-full">
        <svg width="100%" height={height} viewBox={`0 0 ${viewportWidth} ${height}`}>
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
          {/* Current measurement point */}
          <motion.circle
            cx={measurementX}
            cy={currentY}
            r="4"
            fill="#FFF"
            stroke="#387F5C"
            strokeWidth="4"
            filter="drop-shadow(0px 0px 2.16px #387F5C) drop-shadow(0px 0px 4.32px #387F5C) drop-shadow(0px 0px 10px #387F5C)"
            animate={{
              r: [4, 5, 4],
              opacity: [0.9, 1, 0.9],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </svg>
      </div>
    </div>
  );
}
