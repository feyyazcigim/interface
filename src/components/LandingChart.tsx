import { useEffect, useRef, useState } from "react";

const height = 577;
const baselinePrice = 1.0;

// Convert price to Y coordinate (inverted because SVG Y increases downward)
const priceToY = (price) => {
  const minPrice = 0.99;
  const maxPrice = 1.01;
  const minY = height - 0; // Bottom margin
  const maxY = 0; // Top margin
  return minY - ((price - minPrice) / (maxPrice - minPrice)) * (minY - maxY);
};

export default function LandingChart() {
  const [scrollOffset, setScrollOffset] = useState(0);
  const [viewportWidth, setViewportWidth] = useState(1920); // Default width
  const animationRef = useRef(null);
  const containerRef = useRef(null);

  // Price data with more baseline points to space out peaks and dips
  const priceData = [
    1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.01, 1.005, 1.002, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0,
    1.0, 0.998, 0.995, 0.99, 0.995, 0.998, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.003,
    1.006, 1.003, 1.0, 1.0, 1.0, 1.0, 1.0,
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

  const baselineY = priceToY(baselinePrice);
  const pointSpacing = 30; // pixels between each data point
  const scrollSpeed = 1.5;

  // Generate complete line path
  const generateCompletePath = () => {
    const totalWidth = priceData.length * pointSpacing;
    const points = [];

    // Create points from price data
    for (let i = 0; i < priceData.length; i++) {
      const x = i * pointSpacing;
      const y = priceToY(priceData[i]);
      points.push({ x, y, price: priceData[i] });
    }

    // Create SVG path
    if (points.length === 0) return "";

    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      path += ` L ${points[i].x} ${points[i].y}`;
    }

    return { path, points, totalWidth };
  };

  const { path, points, totalWidth } = generateCompletePath();

  // Animation loop
  useEffect(() => {
    const animate = () => {
      setScrollOffset((prevOffset) => {
        const newOffset = prevOffset + scrollSpeed;
        // Reset when the line has completely scrolled past
        return newOffset > totalWidth + viewportWidth ? 0 : newOffset;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [totalWidth, viewportWidth]);

  // Get current price at the 75% position
  const measurementX = viewportWidth * 0.75;
  const getCurrentPrice = () => {
    // Find exact position between points for smooth interpolation
    const originalPositionAtMeasurement = (measurementX + scrollOffset) % totalWidth;
    const exactIndex = originalPositionAtMeasurement / pointSpacing;

    // Get the two surrounding points
    const lowerIndex = Math.floor(exactIndex);
    const upperIndex = Math.ceil(exactIndex);

    // Handle bounds
    const clampedLowerIndex = Math.max(0, Math.min(lowerIndex, points.length - 1));
    const clampedUpperIndex = Math.max(0, Math.min(upperIndex, points.length - 1));

    // If we're exactly on a point, return that price
    if (clampedLowerIndex === clampedUpperIndex) {
      return points[clampedLowerIndex].price;
    }

    // Linear interpolation between the two points
    const t = exactIndex - lowerIndex; // fraction between 0 and 1
    const lowerPrice = points[clampedLowerIndex].price;
    const upperPrice = points[clampedUpperIndex].price;

    return lowerPrice + (upperPrice - lowerPrice) * t;
  };

  const currentPrice = getCurrentPrice();

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
            stroke="rgba(0,0,0,0.3)"
            strokeWidth="2"
            strokeDasharray="5,5"
          />

          {/* Scrolling price line */}
          <g clipPath="url(#viewport)">
            <path
              d={path}
              fill="none"
              stroke="#22c55e"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              transform={`translate(${-scrollOffset}, 0)`}
            />

            {/* Duplicate the line for seamless looping */}
            <path
              d={path}
              fill="none"
              stroke="#22c55e"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              transform={`translate(${totalWidth - scrollOffset}, 0)`}
            />
          </g>

          {/* Current measurement point */}
          <circle cx={measurementX} cy={priceToY(currentPrice)} r="4" fill="#22c55e" stroke="white" strokeWidth="2" />
        </svg>
      </div>
    </div>
  );
}
