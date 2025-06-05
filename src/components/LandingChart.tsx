import {
  animate,
  cubicBezier,
  motion,
  progress,
  steps,
  useAnimation,
  useMotionTemplate,
  useMotionValue,
  useTime,
  useTransform,
} from "framer-motion";
import { useEffect } from "react";

type Segment = { x: number; y: number; price: number };

export default function LandingChart() {
  // Predefined price-like data points (oscillating between 0.95 and 1.01)
  const priceData = [
    // Extended initial baseline period (hovering between 0.999-1.001)
    0.9995, 1, 1.0005, 1, 0.9997, 1, 1.0002, 1, 0.9998, 1, 0.9999, 1, 1.001, 1, 0.9993, 1, 1.0001, 1, 0.9998, 1, 1.0001,
    1, 0.999, 1, 1.0002, 1, 0.9998, 1, 1.0001, 1, 0.9997, 1, 1.0003, 1, 0.999, 1, 1.0001, 1, 0.9999,

    // First spike cycle - DOUBLED LENGTH
    1, 0.9999, 1, 1.002, 1.015, 1.013, 1.014, 1.0135, 1.014, 1.0138, 1.0145, 1.015, 1.0148, 1.015, 1.0141, 1.0147, 1,
    0.985, 0.987, 0.99, 0.9865, 0.9875, 0.988, 0.9855, 0.986, 0.9852, 0.9868, 0.9855, 0.987, 0.9858, 0.9862, 0.9858, 1,

    // Extended middle baseline period (hovering between 0.999-1.001)
    1.0001, 1, 0.9998, 1, 1.0001, 1, 0.9997, 1, 1.0001, 1, 1.0002, 1, 0.999, 1, 1.0001, 1, 1.0002, 1, 0.9998, 1, 1.0001,
    1, 0.9997, 1, 1.0003, 1, 0.9999, 1, 1.0001, 1, 0.9998, 1, 1.0003, 1, 0.9997, 1, 1.0002, 1, 0.9999, 1, 1.0001, 1,
    0.9997, 1, 1.0002, 1, 0.999, 1, 1.0002, 1, 0.9998, 1, 1.0001, 1, 0.9997, 1, 1.0003, 1, 0.9999,

    // Second spike cycle - DOUBLED LENGTH
    1, 1.015, 1.014, 1.0142, 1.01435, 1.01425, 1.0147, 1.0148, 1.0143, 1.0145, 1.015, 1.0146, 1.015, 1.0142, 1.015,
    1.0149, 1, 0.985, 0.9852, 0.9851, 0.986, 0.9857, 0.9855, 0.9856, 0.9853, 0.9855, 0.9862, 0.9858, 0.9865, 0.9854,
    0.9858, 0.985, 1,

    // Extended final baseline period (hovering between 0.999-1.001)
    1.0001, 1, 0.9998, 1, 1.0003, 1, 0.9999, 1, 0.9998, 1, 0.9997, 1, 1.0001, 1, 0.9998, 1, 1.0001, 1, 0.999, 1, 1.0003,
    1, 0.999, 1, 1.0001, 1, 0.9997, 1, 1.0002, 1, 0.9999, 1, 1.0001, 1, 0.9998, 1, 1.0001, 1, 0.9997, 1, 1.0002, 1,
    0.9999, 1, 1.0001, 1, 0.9998, 1, 1.0001, 1, 0.999, 1, 1.0001, 1, 0.9997,
  ];

  const width = 1920;
  const height = 576;

  // Calculate min/max for scaling
  const minPrice = 0.98;
  const maxPrice = 1.02;
  const priceRange = maxPrice - minPrice;

  const time = useTime();
  const clipPathValue = useTransform(time, (latest) => {
    const progress = (latest % 20000) / 20000;
    return 100 - progress * 100;
  });
  const clipPathTemplate = useMotionTemplate`inset(0px ${clipPathValue}% 0px 0px)`;

  // Generate path points
  const generatePath = () => {
    const points = priceData.map((price, index) => {
      const x = (index / (priceData.length - 1)) * width;
      const y = height - ((price - minPrice) / priceRange) * height;
      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    });

    return points.join(" ");
  };

  // Generate green area paths (only where price is above 1)
  const generateGreenAreaPaths = () => {
    const baselineY = height - ((1 - minPrice) / priceRange) * height;
    const segments: Segment[][] = [];
    let currentSegment: Segment[] = [];

    priceData.forEach((price, index) => {
      const x = (index / (priceData.length - 1)) * width;
      const y = height - ((price - minPrice) / priceRange) * height;

      if (price >= 1) {
        // Add to current segment
        currentSegment.push({ x, y, price });
      } else {
        // End current segment if it exists
        if (currentSegment.length > 0) {
          segments.push([...currentSegment]);
          currentSegment = [];
        }
      }
    });

    // Don't forget the last segment
    if (currentSegment.length > 0) {
      segments.push(currentSegment);
    }

    // Convert segments to paths
    return segments
      .map((segment) => {
        if (segment.length === 0) return "";

        const points: string[] = [];

        // Start at baseline
        points.push(`M ${segment[0].x} ${baselineY}`);

        // Follow the price line
        segment.forEach((point) => {
          points.push(`L ${point.x} ${point.y}`);
        });

        // Close back to baseline
        points.push(`L ${segment[segment.length - 1].x} ${baselineY}`);
        points.push("Z");

        return points.join(" ");
      })
      .filter((path) => path !== "");
  };

  // Generate yellow area paths (only where price is below 1)
  const generateYellowAreaPaths = () => {
    const baselineY = height - ((1 - minPrice) / priceRange) * height;
    const segments: Segment[][] = [];
    let currentSegment: Segment[] = [];

    priceData.forEach((price, index) => {
      const x = (index / (priceData.length - 1)) * width;
      const y = height - ((price - minPrice) / priceRange) * height;

      if (price <= 1) {
        // Add to current segment
        currentSegment.push({ x, y, price });
      } else {
        // End current segment if it exists
        if (currentSegment.length > 0) {
          segments.push([...currentSegment]);
          currentSegment = [];
        }
      }
    });

    // Don't forget the last segment
    if (currentSegment.length > 0) {
      segments.push(currentSegment);
    }

    // Convert segments to paths
    return segments
      .map((segment) => {
        if (segment.length === 0) return "";

        const points: string[] = [];

        // Start at price line
        points.push(`M ${segment[0].x} ${segment[0].y}`);

        // Follow the price line
        segment.forEach((point, index) => {
          if (index > 0) points.push(`L ${point.x} ${point.y}`);
        });

        // Close to baseline and back
        points.push(`L ${segment[segment.length - 1].x} ${baselineY}`);
        points.push(`L ${segment[0].x} ${baselineY}`);
        points.push("Z");

        return points.join(" ");
      })
      .filter((path) => path !== "");
  };

  const path = generatePath();
  const greenAreaPaths = generateGreenAreaPaths();
  const yellowAreaPaths = generateYellowAreaPaths();

  // Transform values for the dot position
  // const dotX = useTransform(clipPathValue, [0, 1], [0, width]);
  /*const dotY = useTransform(clipPathValue, (progress) => {
    const index = Math.floor(progress * (priceData.length - 1));
    const price = priceData[index] || priceData[0];
    return height - ((price - minPrice) / priceRange) * height;
  });*/

  return (
    <div className="flex flex-col items-center justify-center h-full w-full">
      <div>
        <div>
          <svg width={width} height={height}>
            <defs>
              <pattern id="grid" width="72" height="72" patternUnits="userSpaceOnUse">
                <path d="M 72 0 L 0 0 0 72" fill="none" stroke="#D9D9D9" strokeWidth="1" />
              </pattern>
              <linearGradient id="priceGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style={{ stopColor: "#387F5C", stopOpacity: 1 }} />
                <stop offset="49.9999%" style={{ stopColor: "#387F5C", stopOpacity: 1 }} />
                <stop offset="50.0001%" style={{ stopColor: "#D5AB38", stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: "#D5AB38", stopOpacity: 1 }} />
              </linearGradient>

              {/* Gradient for green area (above 1) */}
              <linearGradient id="greenAreaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style={{ stopColor: "#387F5C", stopOpacity: 0.4 }} />
                <stop offset="100%" style={{ stopColor: "#387F5C", stopOpacity: 0.1 }} />
              </linearGradient>

              {/* Gradient for yellow area (below 1) */}
              <linearGradient id="yellowAreaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style={{ stopColor: "#D5AB38", stopOpacity: 0.1 }} />
                <stop offset="100%" style={{ stopColor: "#D5AB38", stopOpacity: 0.4 }} />
              </linearGradient>

              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <rect width="100%" height="100%" fill="url(#grid)" />

            {/* Animated axes */}
            <line x1={0} y1={height / 2} x2={width} y2={height / 2} stroke="rgba(0,0,0,0.4)" strokeWidth="1" />

            {/* Ghost line - shows full path */}
            <path d={path} fill="none" stroke="rgba(0,0,0,0.15)" strokeWidth="2" strokeLinecap="round" />

            <motion.g
              style={{
                clipPath: clipPathTemplate,
              }}
            >
              {/* Green area fills (only where price is above 1) */}
              {greenAreaPaths.map((pathData, index) => (
                <path key={`green-${index}`} d={pathData} fill="url(#greenAreaGradient)" stroke="none" />
              ))}

              {/* Yellow area fills (only where price is below 1) */}
              {yellowAreaPaths.map((pathData, index) => (
                <path key={`yellow-${index}`} d={pathData} fill="url(#yellowAreaGradient)" stroke="none" />
              ))}

              {/* Animated price line */}
              <path
                d={path}
                fill="none"
                stroke="url(#priceGradient)"
                strokeWidth="3"
                strokeLinecap="round"
                filter="url(#glow)"
              />
            </motion.g>

            {/* Current price indicator dot */}
            {/*<motion.circle
              r="5"
              fill="#fff"
              stroke="url(#priceGradient)"
              strokeWidth="3"
              className="drop-shadow-lg"
              cx={dotX}
              cy={dotY}
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.8, 1, 0.8],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />*/}
          </svg>
        </div>
      </div>
    </div>
  );
}
