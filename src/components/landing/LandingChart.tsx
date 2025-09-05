import PintoLogo from "@/assets/protocol/PintoLogo.svg";
import PintoLogoText from "@/assets/protocol/PintoLogoText.svg";
import useIsMobile from "@/hooks/display/useIsMobile";
import { cubicBezier, findBezierExtrema, generateChaoticUnstableData } from "@/utils/utils";
import { AnimatePresence, MotionValue, animate, motion, useMotionValue, useTransform } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { PintoRightArrow } from "../Icons";
import { navLinks } from "../nav/nav/Navbar";
import { Button } from "../ui/Button";
import FloaterContainer from "./FloaterContainer";

// Function to calculate grid X offset so measurement line aligns with grid lines
function calculateGridXOffset(viewportWidth: number) {
  const defaultWidth = 1920; // Grid is aligned at this width
  const measurementLinePercentage = ANIMATION_CONFIG.measurementLine.final; // 75%

  // Calculate the difference in measurement line position between default and current width
  const defaultMeasurementPosition = defaultWidth * measurementLinePercentage;
  const currentMeasurementPosition = viewportWidth * measurementLinePercentage;
  const offset = currentMeasurementPosition - defaultMeasurementPosition;

  return offset;
}

// Function to calculate grid Y offset so price line aligns with grid lines
function calculateGridYOffset(chartHeight: number) {
  const defaultHeight = ANIMATION_CONFIG.height; // Grid is aligned at this height (577)
  const priceLinePercentage = ANIMATION_CONFIG.horizontalReference.position; // 50%

  // Calculate the difference in price line position between default and current height
  const defaultPricePosition = defaultHeight * priceLinePercentage;
  const currentPricePosition = chartHeight * priceLinePercentage;
  const offset = currentPricePosition - defaultPricePosition;

  return offset;
}

// Master animation configuration - Variable-driven system
// This configuration drives all animations through percentages and proportions
// instead of hardcoded values, making the entire system responsive and scalable
const ANIMATION_CONFIG = {
  // Visual constants
  height: 577,
  repetitions: 2,
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
  triggerPulse?: boolean; // Trigger price line pulse
}

// Define transaction marker with stable ID
export interface TransactionMarker {
  id: string; // Stable unique identifier
  x: number;
  y: number;
  txType: string;
  farmer?: string;
  index: number;
  apexType?: "peak" | "valley";
}

const unstablePriceData: PricePoint[] = generateChaoticUnstableData();

const semiStablePriceData: PricePoint[] = [
  { txType: null, value: 0.9998 },
  { txType: "withdraw", value: 1.004 },
  { txType: null, value: 0.997 },
  { txType: null, value: 1.003 },
  { txType: "deposit", value: 0.998, triggerPhase: "semiStable" },
  { txType: null, value: 1.0025, triggerPulse: true },
  { txType: null, value: 1.0 },
  { txType: "sow", value: 0.9994 },
  { txType: "harvest", value: 1.0004 },
];

const stablePriceData: PricePoint[] = [
  { txType: null, value: 0.9994, speed: 3 },
  { txType: "yield", value: 1.005, speed: 3, triggerPulse: true, triggerPhase: "stable" },
  { txType: "withdraw", value: 0.995, speed: 0.85 },
  { txType: null, value: 1.0004, speed: 0.85 },
  { txType: null, value: 0.9994, speed: 0.85 },
  { txType: "deposit", value: 1.0004, speed: 0.85, triggerPhase: "mainCTA" },
  { txType: null, value: 0.9994, speed: 3 },
  { txType: "yield", value: 1.005, speed: 3, triggerPulse: true, triggerPhase: "stable" },
  { txType: null, value: 0.995, speed: 0.85 },
  { txType: "deposit", value: 1.0004, speed: 0.85 },
  { txType: null, value: 0.9994, speed: 0.85 },
  { txType: "deposit", value: 1.0004, speed: 0.85, triggerPhase: "mainCTA" },
  { txType: "yield", value: 0.9994, speed: 3 },
  { txType: null, value: 1.005, speed: 3, triggerPulse: true, triggerPhase: "stable" },
  { txType: "withdraw", value: 0.995, speed: 0.85 },
  { txType: null, value: 1.0004, speed: 0.85 },
  { txType: "withdraw", value: 0.9994, speed: 0.85 },
  { txType: null, value: 1.0004, speed: 0.85, triggerPhase: "mainCTA" },
];

// Track amplitude calls for progressive dampening
let amplitudeCallCount = 0;

// Generate randomized stable data with slight variations (0.1%)
function generateRandomizedStableData(baseData: PricePoint[]): PricePoint[] {
  // Increment call count for progressive amplitude reduction
  amplitudeCallCount++;

  // Calculate amplitude modifier (decreases price movement over time)
  // Starts at 1.0 (full amplitude) and can reduce to 0.2 (20% amplitude)
  const maxReduction = 0.2; // 80% reduction maximum
  const reductionRate = 0.2; // 20% reduction per call
  const amplitudeModifier = Math.max(maxReduction, 1.0 - (amplitudeCallCount - 1) * reductionRate);
  // Transaction types for different price movements
  const priceUpTxTypes = ["deposit", "convertUp", "sow"];
  const priceDownTxTypes = ["withdraw", "convertDown", "yield", "harvest"];

  // Count original non-null txTypes
  const originalTxTypeCount = baseData.filter((point) => point.txType !== null).length;

  // First pass: randomize values and speeds, clear all txTypes
  const randomizedData = baseData.map((point) => {
    // Determine price randomization direction based on original price relative to $1.00
    let priceMultiplier: number;
    if (point.value > 1.0) {
      // Price is above $1.00, only allow upward movement
      priceMultiplier = 1 + Math.random() * 0.002 * amplitudeModifier; // 0% to +0.2% * amplitude
    } else if (point.value < 1.0) {
      // Price is below $1.00, only allow downward movement
      priceMultiplier = 1 - Math.random() * 0.002 * amplitudeModifier; // -0.2% to 0% * amplitude
    } else {
      // Price is exactly $1.00, allow small movement in either direction
      priceMultiplier = 1 + (Math.random() - 0.5) * 0.002 * amplitudeModifier; // ±0.1% * amplitude
    }

    return {
      ...point,
      value: point.value * priceMultiplier,
      txType: null as string | null, // Clear all txTypes initially
      farmer: undefined, // Clear farmer assignment so new batch gets fresh farmers
      speed: (point.speed || 1) + (Math.random() - 0.5) * 0.1 * amplitudeModifier, // ±0.05 randomization * amplitude
    };
  });

  // Second pass: randomly assign txTypes to maintain the same count
  const availableIndices = randomizedData.map((_, index) => index);

  // Shuffle and pick random indices for transactions
  for (let i = availableIndices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [availableIndices[i], availableIndices[j]] = [availableIndices[j], availableIndices[i]];
  }

  const selectedIndices = availableIndices.slice(0, originalTxTypeCount);

  // Assign appropriate txTypes based on price movement
  selectedIndices.forEach((index) => {
    if (index < randomizedData.length - 1) {
      const currentPoint = randomizedData[index];
      const nextPoint = randomizedData[index + 1];
      const priceIncreases = nextPoint.value > currentPoint.value;

      if (priceIncreases) {
        // Choose from bullish transaction types
        randomizedData[index].txType = priceUpTxTypes[Math.floor(Math.random() * priceUpTxTypes.length)];
      } else {
        // Choose from bearish transaction types
        randomizedData[index].txType = priceDownTxTypes[Math.floor(Math.random() * priceDownTxTypes.length)];
      }
    } else {
      // For the last point, randomly choose any transaction type
      const allTxTypes = [...priceUpTxTypes, ...priceDownTxTypes];
      randomizedData[index].txType = allTxTypes[Math.floor(Math.random() * allTxTypes.length)];
    }
  });

  // Calculate total speed deviation and balance it
  const originalTotalSpeed = baseData.reduce((sum, point) => sum + (point.speed || 1), 0);
  const randomizedTotalSpeed = randomizedData.reduce((sum, point) => sum + point.speed, 0);
  const speedDeviation = randomizedTotalSpeed - originalTotalSpeed;

  // Distribute the correction across all points
  const correctionPerPoint = speedDeviation / randomizedData.length;
  return randomizedData.map((point) => ({
    ...point,
    speed: Math.max(0.1, point.speed - correctionPerPoint), // Ensure speed never goes below 0.1
  }));
}

// Initial combined price data
const initialFullPriceData: PricePoint[] = [
  ...unstablePriceData,
  ...semiStablePriceData,
  ...Array.from({ length: repetitions }).flatMap(() => generateRandomizedStableData(stablePriceData)),
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

// Helper function to get group index (farmers 1&2 = group 0, farmers 3&4 = group 1, etc.)
function getFarmerGroup(farmerFilename: string): number {
  const farmerNumber = parseInt(farmerFilename.replace(/\D/g, ""), 10);
  return Math.floor((farmerNumber - 1) / 2);
}

// Helper function to select a farmer that doesn't have the same group as the previous one
function selectFarmer(previousFarmer?: string): string {
  if (!previousFarmer) {
    // First farmer, can be any
    const randomIndex = Math.floor(Math.random() * personIcons.length);
    return personIcons[randomIndex];
  }

  const previousGroup = getFarmerGroup(previousFarmer);
  const availableFarmers = personIcons.filter((farmer) => getFarmerGroup(farmer) !== previousGroup);

  const randomIndex = Math.floor(Math.random() * availableFarmers.length);
  return availableFarmers[randomIndex];
}

// Convert price to Y coordinate (inverted because SVG Y increases downward)
function priceToY(price: number, chartHeight = ANIMATION_CONFIG.height) {
  const minPrice = 0.99;
  const maxPrice = 1.01;
  const minY = chartHeight - 0; // Bottom margin
  const maxY = 0; // Top margin
  return minY - ((price - minPrice) / (maxPrice - minPrice)) * (minY - maxY);
}

// Convert Y coordinate back to price (inverse of priceToY)
function yToPrice(y: number, chartHeight = ANIMATION_CONFIG.height) {
  const minPrice = 0.99;
  const maxPrice = 1.01;
  const minY = chartHeight - 0; // Bottom margin
  const maxY = 0; // Top margin
  const normalizedY = (minY - y) / (minY - maxY);
  return minPrice + normalizedY * (maxPrice - minPrice);
}

// Convert price to Y coordinate for labels (aligned to grid lines)
function priceLabelToY(
  price: number,
  chartHeight = ANIMATION_CONFIG.height,
  gridSpacing = ANIMATION_CONFIG.gridSpacing,
) {
  const middle = chartHeight / 2;
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

// Generate stable ID for transaction marker based on data content (not index)
function generateMarkerId(txType: string, value: number, farmer?: string, speed?: number): string {
  // Create a content-based hash that's independent of array position
  const contentHash = `${txType}-${value.toFixed(6)}-${farmer || "default"}-${speed || 1}`;
  return `marker-${contentHash}`;
}

// Update markers incrementally based on data changes
function updateMarkersIncremental(
  currentData: PricePoint[],
  previousData: PricePoint[],
  existingMarkers: Map<string, TransactionMarker>,
  pointSpacing: number,
  chartHeight: number,
): Map<string, TransactionMarker> {
  const updatedMarkers = new Map<string, TransactionMarker>();

  // If this is the first run (no previous data), generate all markers from scratch
  if (previousData.length === 0 || existingMarkers.size === 0) {
    let x = 0;
    for (let i = 0; i < currentData.length; i++) {
      const dataPoint = currentData[i];
      if (dataPoint.txType) {
        const markerId = generateMarkerId(dataPoint.txType, dataPoint.value, dataPoint.farmer, dataPoint.speed);
        const y = priceToY(dataPoint.value, chartHeight);
        updatedMarkers.set(markerId, {
          id: markerId,
          x,
          y,
          txType: dataPoint.txType,
          farmer: dataPoint.farmer,
          index: i,
        });
      }
      const segSpeed = dataPoint.speed || 1;
      x += pointSpacing / segSpeed;
    }
    return updatedMarkers;
  }

  // Find the common prefix length (unchanged data at the beginning)
  let commonPrefixLength = 0;
  const minLength = Math.min(currentData.length, previousData.length);

  for (let i = 0; i < minLength; i++) {
    const current = currentData[i];
    const previous = previousData[i];

    // Compare data points for equality (including farmer to maintain consistency)
    if (
      current.txType === previous.txType &&
      current.value === previous.value &&
      current.speed === previous.speed &&
      current.triggerPhase === previous.triggerPhase &&
      current.farmer === previous.farmer
    ) {
      commonPrefixLength++;
    } else {
      break;
    }
  }

  // Preserve markers from unchanged prefix
  let x = 0;
  for (let i = 0; i < commonPrefixLength; i++) {
    const dataPoint = currentData[i];
    if (dataPoint.txType) {
      const markerId = generateMarkerId(dataPoint.txType, dataPoint.value, dataPoint.farmer, dataPoint.speed);
      const existingMarker = existingMarkers.get(markerId);
      if (existingMarker) {
        // Update position but preserve the marker object identity
        updatedMarkers.set(markerId, {
          ...existingMarker,
          x, // Update x position in case spacing changed
          y: priceToY(dataPoint.value, chartHeight),
          index: i, // Update index to reflect current position
        });
      } else {
        // Fallback: create new marker if existing not found
        const y = priceToY(dataPoint.value, chartHeight);
        updatedMarkers.set(markerId, {
          id: markerId,
          x,
          y,
          txType: dataPoint.txType,
          farmer: dataPoint.farmer,
          index: i,
        });
      }
    }
    const segSpeed = dataPoint.speed || 1;
    x += pointSpacing / segSpeed;
  }

  // Generate new markers for changed/added data
  for (let i = commonPrefixLength; i < currentData.length; i++) {
    const dataPoint = currentData[i];
    if (dataPoint.txType) {
      const markerId = generateMarkerId(dataPoint.txType, dataPoint.value, dataPoint.farmer, dataPoint.speed);
      const y = priceToY(dataPoint.value, chartHeight);
      updatedMarkers.set(markerId, {
        id: markerId,
        x,
        y,
        txType: dataPoint.txType,
        farmer: dataPoint.farmer,
        index: i,
      });
    }
    const segSpeed = dataPoint.speed || 1;
    x += pointSpacing / segSpeed;
  }

  return updatedMarkers;
}

// Generate complete line path with incremental marker updates
function generateCompletePathWithIncrementalMarkers(
  pointSpacing: number,
  chartHeight = ANIMATION_CONFIG.height,
  priceData = initialFullPriceData,
  previousData: PricePoint[] = [],
  existingMarkers: Map<string, TransactionMarker> = new Map(),
) {
  const points: { x: number; y: number; price: number }[] = [];
  const beziers: {
    p0: { x: number; y: number };
    c1: { x: number; y: number };
    c2: { x: number; y: number };
    p1: { x: number; y: number };
  }[] = [];

  // Update markers incrementally instead of regenerating all
  const transactionMarkers = updateMarkersIncremental(
    priceData,
    previousData,
    existingMarkers,
    pointSpacing,
    chartHeight,
  );

  let x = 0;
  for (let i = 0; i < priceData.length; i++) {
    const y = priceToY(priceData[i].value, chartHeight);
    points.push({ x, y, price: priceData[i].value });
    // If this segment has a speed, compress the next segment's width
    const segSpeed = priceData[i].speed || 1;
    x += pointSpacing / segSpeed;
  }

  if (points.length === 0) return { path: "", points: [], totalWidth: 0, beziers: [], transactionMarkers: new Map() };

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
  const apexTransactionMarkers = new Map<string, TransactionMarker>();

  transactionMarkers.forEach((marker, id) => {
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
      apexTransactionMarkers.set(id, {
        ...marker,
        x: apex.x,
        y: apex.y,
        apexType: apex.type, // Add metadata for positioning logic
      });
    } else {
      apexTransactionMarkers.set(id, marker);
    }
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
function generatePriceLabelData(chartHeight = ANIMATION_CONFIG.height) {
  return ANIMATION_CONFIG.priceLabels.levels.map((price) => {
    return {
      price,
      y: priceLabelToY(price, chartHeight),
      label: price.toFixed(1),
    };
  });
}

interface LandingChartProps {
  currentTriggerPhase: string | undefined;
  setCurrentTriggerPhase: (phase: string | undefined) => void;
}

export default function LandingChart({ currentTriggerPhase, setCurrentTriggerPhase }: LandingChartProps) {
  const [viewportWidth, setViewportWidth] = useState(1920); // Default width
  const [showAllLabels, setShowAllLabels] = useState(true); // Global state for showing all farmer labels

  // Toggle function for all farmer labels
  const toggleAllLabels = () => {
    setShowAllLabels(!showAllLabels);
  };
  const [dynamicHeight, setDynamicHeight] = useState(ANIMATION_CONFIG.height); // Default to config height
  const [gridXOffset, setGridXOffset] = useState(() => calculateGridXOffset(1920)); // Grid X offset to align with measurement line
  const [gridYOffset, setGridYOffset] = useState(() => calculateGridYOffset(ANIMATION_CONFIG.height)); // Grid Y offset to align with price line
  const containerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  // Check if user has seen the full animation before
  const [hasSeenFullAnimation, setHasSeenFullAnimation] = useState(() => {
    try {
      return localStorage.getItem("pinto-landing-animation-completed") === "true";
    } catch {
      return false;
    }
  });

  // Dynamic price data that gets updated
  const [fullPriceData, setFullPriceData] = useState<PricePoint[]>(() => {
    // For returning users, start with only stable data
    if (hasSeenFullAnimation) {
      return [
        { txType: null, value: 1, speed: 0.85 },
        { txType: null, value: 1.0005, speed: 0.85 },
        ...Array.from({ length: repetitions }).flatMap(() => generateRandomizedStableData(stablePriceData)),
      ];
    }
    return initialFullPriceData;
  });

  // Persistent marker cache that survives data updates
  const persistentMarkersRef = useRef<Map<string, TransactionMarker>>(new Map());
  const previousDataRef = useRef<PricePoint[]>(initialFullPriceData);

  // Calculate durations and positions
  const durations = useMemo(() => calculateDurations(), []);
  const positions = useMemo(() => calculatePositions(dynamicHeight), [dynamicHeight]);

  // Generate price label data
  const priceLabelData = useMemo(() => {
    const data = generatePriceLabelData(dynamicHeight);
    // console.log("Price label data:", data);
    return data;
  }, [dynamicHeight]);

  const scrollOffset = useMotionValue(0);
  const measurementLineOffset = useMotionValue(ANIMATION_CONFIG.measurementLine.initial * 100); // Separate offset for measurement line movement (percentage)
  const clipPathWidth = useMotionValue(ANIMATION_CONFIG.clipPath.initial); // Separate motion value for clip path (decimal 0-1)
  const horizontalLineClipPath = useMotionValue(viewportWidth); // For horizontal line reveal animation (starts hidden from right)
  const priceTrackingActive = useMotionValue(0); // 0 = inactive, 1 = active
  const priceLabelsOpacity = useMotionValue(0); // 0 = hidden, 1 = visible
  const priceLineOpacity = useMotionValue(1); // 0 = hidden, 1 = visible
  const horizontalLineOpacity = useMotionValue(1); // 0 = hidden, 1 = visible
  const transactionMarkersOpacity = useMotionValue<number>(1); // 0 = hidden, 1 = visible
  const baseFloatersOpacity = useTransform(priceTrackingActive, (active: number) => (active >= 1 ? 1 : 0) as number);
  const floatersOpacity = useTransform(
    [baseFloatersOpacity, transactionMarkersOpacity, priceLineOpacity],
    ([base, restart, priceLineOpac]: number[]) => base * restart * priceLineOpac,
  ) as MotionValue<0 | 1>;
  const x = useTransform(scrollOffset, (value) => viewportWidth * ANIMATION_CONFIG.clipPath.initial - value);

  // Transform values for motion properties (moved from JSX to avoid hook violations)
  const clipPathRectWidth = useTransform(clipPathWidth, (pct) => pct * viewportWidth);
  const measurementLineX = useTransform(measurementLineOffset, (offset) => (offset / 100) * viewportWidth);
  const horizontalLineClipPathStyle = useTransform(horizontalLineClipPath, (clipX) => `inset(0 ${clipX}px 0 0)`);

  // Update viewport width and dynamic height on mount and resize
  useEffect(() => {
    const updateDimensions = () => {
      let newViewportWidth = viewportWidth;
      if (containerRef.current) {
        newViewportWidth = containerRef.current.clientWidth;
        setViewportWidth(newViewportWidth);
      }

      // Calculate dynamic height
      const ctaHeaderElement = document.getElementById("cta-header");
      if (ctaHeaderElement) {
        const ctaHeaderHeight = ctaHeaderElement.offsetHeight;
        const screenHeight = window.innerHeight;
        const availableHeight = screenHeight - ctaHeaderHeight;

        // Apply maximum constraint of the current default height (577px)
        const newHeight = Math.min(availableHeight, ANIMATION_CONFIG.height);

        // Only update if the new height is significantly different and positive
        if (newHeight > 200 && Math.abs(newHeight - dynamicHeight) > 10) {
          setDynamicHeight(newHeight);
        }
      }

      // Recalculate grid X offset when viewport width changes
      if (newViewportWidth !== viewportWidth) {
        const newGridXOffset = calculateGridXOffset(newViewportWidth);
        setGridXOffset(newGridXOffset);
      }
    };

    // Use ResizeObserver for more efficient resize detection
    const resizeObserver = new ResizeObserver(() => {
      updateDimensions();
    });

    // Also add a direct window resize listener to catch maximize/minimize events
    const handleWindowResize = () => {
      // Use a small delay to ensure the window has finished resizing
      setTimeout(updateDimensions, 10);
    };

    if (containerRef.current) {
      // Initial measurement
      updateDimensions();

      // Start observing
      resizeObserver.observe(containerRef.current);
    }

    // Listen to window resize events (for maximize/minimize and other window operations)
    window.addEventListener("resize", handleWindowResize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", handleWindowResize);
    };
  }, [dynamicHeight, viewportWidth]);

  // Update grid X offset when viewportWidth changes
  useEffect(() => {
    const newGridXOffset = calculateGridXOffset(viewportWidth);
    setGridXOffset(newGridXOffset);
  }, [viewportWidth]);

  // Update grid Y offset when dynamicHeight changes
  useEffect(() => {
    const newGridYOffset = calculateGridYOffset(dynamicHeight);
    setGridYOffset(newGridYOffset);
  }, [dynamicHeight]);

  // Assign farmers to price data and generate path with incremental markers
  const { path, beziers, transactionMarkersMap } = useMemo(() => {
    // Create a working copy to avoid mutating state
    const workingData = [...fullPriceData];

    // Assign farmer icons consistently - check existing markers for assignments
    let lastAssignedFarmer: string | undefined;
    for (let i = 0; i < workingData.length; i++) {
      if (workingData[i].txType !== null && !workingData[i].farmer) {
        // Look for existing marker with same content pattern
        let existingMarker: TransactionMarker | undefined;
        for (const [id, marker] of persistentMarkersRef.current) {
          const txType = workingData[i].txType;
          if (
            txType &&
            id.includes(txType) &&
            id.includes(workingData[i].value.toFixed(6)) &&
            id.includes(`${workingData[i].speed || 1}`)
          ) {
            existingMarker = marker;
            break;
          }
        }

        if (existingMarker) {
          // Reuse farmer from existing marker
          workingData[i].farmer = existingMarker.farmer;
          lastAssignedFarmer = existingMarker.farmer;
        } else {
          // Generate new farmer assignment avoiding same group as previous
          workingData[i].farmer = selectFarmer(lastAssignedFarmer);
          lastAssignedFarmer = workingData[i].farmer;
        }
      } else if (workingData[i].farmer) {
        // Track existing farmer assignments
        lastAssignedFarmer = workingData[i].farmer;
      }
    }

    const result = generateCompletePathWithIncrementalMarkers(
      pointSpacing,
      dynamicHeight,
      workingData,
      previousDataRef.current,
      persistentMarkersRef.current,
    );

    // Update persistent cache and previous data reference
    persistentMarkersRef.current = result.transactionMarkers;
    previousDataRef.current = workingData;

    return { ...result, transactionMarkersMap: result.transactionMarkers };
  }, [dynamicHeight, fullPriceData]);

  // Convert Map to array for rendering while maintaining stable order
  const transactionMarkers = useMemo(() => {
    return Array.from(transactionMarkersMap.values()).sort((a, b) => a.index - b.index);
  }, [transactionMarkersMap]);

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

      // Direct position calculation without looping to prevent desync
      // @ts-ignore-next-line
      const xVal = measX + currentOffset - viewportWidth * ANIMATION_CONFIG.clipPath.initial; // Account for price line offset
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
      if (Math.abs(seg.p1.x - xVal) < minDist) {
        minDist = Math.abs(seg.p1.x - xVal);
        idx = i;
      }
    }
    return idx;
  });

  // currentTriggerPhase and setCurrentTriggerPhase are now passed as props

  // Refs to prevent timer interference
  const pintoTimerRef = useRef<NodeJS.Timeout | null>(null);
  const animationControlsRef = useRef<ReturnType<typeof animate> | null>(null);
  const clipPathControlsRef = useRef<ReturnType<typeof animate> | null>(null);
  const lineStrokeColor = useMotionValue("#387F5C");

  // Track if animations are paused due to page visibility or component visibility
  const isPausedRef = useRef(false);
  const componentRef = useRef<HTMLDivElement>(null);
  const isComponentVisibleRef = useRef(false);

  // Combined position and price-based flash trigger system
  useEffect(() => {
    const unsubscribe = currentY.on("change", (yPosition) => {
      if (priceTrackingActive.get() < 1 || isPausedRef.current) return;

      // Get current position index to determine nearby datapoints
      const currentIdx = currentIndex.get();
      const currentIndexValue = Math.max(0, Math.min(Math.round(currentIdx), fullPriceData.length - 1));

      // Define a range around current position (±2 indices to account for bezier curve quirks)
      const rangeSize = 2;
      const startIdx = Math.max(0, currentIndexValue - rangeSize);
      const endIdx = Math.min(fullPriceData.length - 1, currentIndexValue + rangeSize);

      // Convert current Y position to price
      const currentPrice = yToPrice(yPosition, dynamicHeight);

      // Only check datapoints within the current range
      for (let i = startIdx; i <= endIdx; i++) {
        const dataPoint = fullPriceData[i];
        if (dataPoint?.triggerPulse === true) {
          // Check if we've crossed this trigger price (within a small tolerance)
          const priceDifference = Math.abs(currentPrice - dataPoint.value);
          const tolerance = 0.0005; // Much smaller tolerance (0.05% of price range)

          if (priceDifference <= tolerance) {
            /*
            console.log(
              `🔥 Flash triggered at index ${i} (current: ${currentIndexValue})! Current price: ${currentPrice.toFixed(6)}, Target: ${dataPoint.value.toFixed(6)}, Diff: ${priceDifference.toFixed(6)}`,
            );
            */

            // Trigger flash effect
            animate(lineStrokeColor, "#00C767", { duration: 0.1, ease: "linear" }).then(() => {
              animate(lineStrokeColor, "#387F5C", { duration: 0.1, ease: "linear" });
            });

            return; // Exit early after first trigger to avoid multiple flashes
          }
        }
      }
    });
    return unsubscribe;
  }, [currentY, currentIndex, lineStrokeColor, priceTrackingActive, fullPriceData, dynamicHeight]);

  // Phase trigger system (still based on position/index)
  useEffect(() => {
    const unsubscribe = currentIndex.on("change", (idx) => {
      if (isPausedRef.current) return;
      const i = Math.max(0, Math.min(Math.round(idx), fullPriceData.length - 1));
      const newTriggerPhase = fullPriceData[i].triggerPhase;

      if (newTriggerPhase && currentTriggerPhase !== "mainCTA" && priceTrackingActive.get() >= 1) {
        setCurrentTriggerPhase(newTriggerPhase);

        // Mark animation as completed when mainCTA phase is reached for the first time
        if (newTriggerPhase === "mainCTA" && !hasSeenFullAnimation) {
          try {
            localStorage.setItem("pinto-landing-animation-completed", "true");
            setHasSeenFullAnimation(true);
          } catch {
            // Ignore localStorage errors
          }
        }
      }
    });
    return unsubscribe;
  }, [currentIndex, currentTriggerPhase, priceTrackingActive, hasSeenFullAnimation]);

  // Monitor scroll progress to fade in price labels during semi-stable phase
  // Track if we've reached stable phase to know when to remove initial segments
  const [hasReachedStable, setHasReachedStable] = useState(false);

  // Track last extension to prevent rapid fire updates
  const lastExtensionRef = useRef<number>(0);

  // Monitor scroll progress to fade in price labels and extend data
  useEffect(() => {
    const unsubscribe = scrollOffset.on("change", (currentOffset) => {
      if (isPausedRef.current) return;
      // Check if we've reached the semi-stable phase (after unstable phase)
      if (currentOffset >= positions.segments.unstable && priceLabelsOpacity.get() === 0) {
        animate(priceLabelsOpacity, 1, { duration: 1, ease: "easeInOut" });
      }

      // Check if we've reached stable phase
      const stableThreshold = positions.segments.unstable + positions.segments.semiStable;
      if (currentOffset >= stableThreshold && !hasReachedStable) {
        setHasReachedStable(true);
        // console.log("🎯 Reached stable phase - initial story arc complete");
      }

      // Calculate total data width for progress tracking
      const totalDataWidth = fullPriceData.reduce((width, point) => {
        const segSpeed = point.speed || 1;
        return width + pointSpacing / segSpeed;
      }, 0);

      // Calculate progress relative to measurement marker position
      const measurementX = viewportWidth * ANIMATION_CONFIG.measurementLine.final;
      const adjustedMeasurementX = measurementX + currentOffset - viewportWidth * ANIMATION_CONFIG.clipPath.initial;
      const progress = adjustedMeasurementX / totalDataWidth;

      // Throttle extensions to prevent rapid fire updates (minimum 2 seconds between extensions)
      const now = Date.now();
      const timeSinceLastExtension = now - lastExtensionRef.current;

      if (progress >= 0.8 && timeSinceLastExtension > 2000) {
        // console.log("🔄 Extending price data at 80% progress");
        lastExtensionRef.current = now;

        // Stop current animation
        if (animationControlsRef.current) {
          animationControlsRef.current.stop();
        }

        setFullPriceData((currentData) => {
          // Generate new randomized stable data
          const newStableData = generateRandomizedStableData(stablePriceData);

          if (hasReachedStable) {
            // Story arc is complete - remove oldest stable points from beginning
            // But only remove points that are well off-screen to the left
            const clipPathStartX = viewportWidth * ANIMATION_CONFIG.clipPath.initial;
            const offScreenBuffer = viewportWidth * 0.2; // 20% of viewport as buffer
            const safeRemovalThreshold = currentOffset - clipPathStartX - offScreenBuffer;

            // Calculate how much data we can safely remove
            let removableWidth = 0;
            let pointsToRemove = 0;

            for (let i = 0; i < currentData.length; i++) {
              const segSpeed = currentData[i].speed || 1;
              const pointWidth = pointSpacing / segSpeed;

              if (removableWidth + pointWidth <= safeRemovalThreshold) {
                removableWidth += pointWidth;
                pointsToRemove++;
              } else {
                break;
              }
            }

            // Only remove points if we have a reasonable amount to remove
            // and don't remove more than we're adding
            const maxPointsToRemove = Math.min(pointsToRemove, newStableData.length);

            if (maxPointsToRemove > 0) {
              const actualRemovedPoints = currentData.slice(0, maxPointsToRemove);
              const actualRemovedWidth = actualRemovedPoints.reduce((width, point) => {
                const segSpeed = point.speed || 1;
                return width + pointSpacing / segSpeed;
              }, 0);

              const newData = [
                ...currentData.slice(maxPointsToRemove), // Remove safe points from beginning
                ...newStableData, // Add new randomized points to end
              ];

              // Adjust scroll offset to account for removed points
              const newScrollOffset = Math.max(0, currentOffset - actualRemovedWidth);
              scrollOffset.set(newScrollOffset);

              /* console.log(
                `📊 Safely removed ${maxPointsToRemove} off-screen points, added ${newStableData.length} new points`,
              );*/
              return newData;
            } else {
              // If we can't safely remove points, just add new ones
              // console.log("📊 Added new data without removing (not safe to remove yet)");
              return [...currentData, ...newStableData];
            }
          } else {
            // Still in story arc - keep initial segments, remove some stable points
            const initialSegmentLength = unstablePriceData.length + semiStablePriceData.length;
            const pointsToRemove = newStableData.length;

            const newData = [
              ...currentData.slice(0, initialSegmentLength), // Keep unstable + semi-stable
              ...currentData.slice(initialSegmentLength + pointsToRemove), // Remove old stable points
              ...newStableData, // Add new randomized points
            ];
            return newData;
          }
        });

        // Restart the continuous scroll with new data immediately
        const speedScale = 1; // viewportWidth / 1920;
        const pxPerSecond = ANIMATION_CONFIG.baseSpeed * 60 * speedScale;

        // Use requestAnimationFrame for smoother restart
        requestAnimationFrame(() => {
          const startContinuousScroll = () => {
            const currentDataWidth = fullPriceData.reduce((width, point) => {
              const segSpeed = point.speed || 1;
              return width + pointSpacing / segSpeed;
            }, 0);

            const currentScrollOffset = scrollOffset.get();
            const remainingWidth = currentDataWidth - currentScrollOffset;
            const scrollDuration = remainingWidth / pxPerSecond;

            const controls = animate(scrollOffset, currentDataWidth, {
              duration: scrollDuration,
              ease: "linear",
              onComplete: startContinuousScroll,
            });
            animationControlsRef.current = controls;
          };

          startContinuousScroll();
        });
      }
    });
    return unsubscribe;
  }, [
    scrollOffset,
    positions.segments.unstable,
    positions.segments.semiStable,
    priceLabelsOpacity,
    fullPriceData,
    hasReachedStable,
  ]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (pintoTimerRef.current) {
        clearTimeout(pintoTimerRef.current);
      }
    };
  }, []);

  // Start animation function
  const startAnimation = useCallback(
    async (isRestart = false) => {
      // Skip intro phases for returning users, unless it's a restart
      if (hasSeenFullAnimation && !isRestart) {
        // Set up initial positions for returning users
        measurementLineOffset.set(ANIMATION_CONFIG.measurementLine.minimum * 100); // Start at 10%
        clipPathWidth.set(ANIMATION_CONFIG.clipPath.initial); // Start at 0.1
        horizontalLineClipPath.set(viewportWidth); // Start hidden from right
        priceLabelsOpacity.set(0);
        priceLineOpacity.set(0); // Start price line hidden
        priceTrackingActive.set(0); // Start price tracking inactive

        // Start directly at mainCTA phase
        setCurrentTriggerPhase("mainCTA");

        // For returning users, start at the beginning since we only have stable data
        scrollOffset.set(0);

        // Reveal animations first (similar to full animation sequence)

        // Start with price line reveal animation
        animate(priceLineOpacity, 1, {
          duration: durations.fadeInSequence.priceLine.duration,
          ease: "easeInOut",
        });

        // Wait for reveals to complete before starting movement
        await new Promise((resolve) =>
          setTimeout(
            resolve,
            Math.max(
              durations.fadeInSequence.priceLine.duration * 1000,
              durations.fadeInSequence.priceIndicator.duration * 1000,
            ),
          ),
        );

        // Now animate to final positions like the full animation does
        const phase2Duration = 3;

        // Horizontal line: Reveal during position animations
        animate(horizontalLineClipPath, 0, {
          duration: phase2Duration, // Same duration as full animation
          ease: "easeInOut",
        });

        const clipPathControls = animate(clipPathWidth, ANIMATION_CONFIG.clipPath.final, {
          duration: phase2Duration,
          ease: "easeIn",
        });
        clipPathControlsRef.current = clipPathControls;

        const controls = animate(measurementLineOffset, ANIMATION_CONFIG.measurementLine.final * 100, {
          duration: phase2Duration,
          ease: "easeIn",
        });
        animationControlsRef.current = controls;

        // Activate price tracking at the start of phase 2
        priceTrackingActive.set(1);

        await controls;

        // Fade in price labels only after measurement line reaches final position
        animate(priceLabelsOpacity, 1, { duration: 1, ease: "easeInOut" });

        // Start continuous scrolling after animation completes
        const speedScale = 1; // viewportWidth / 1920;
        const pxPerSecond = ANIMATION_CONFIG.baseSpeed * 60 * speedScale;

        const startContinuousScroll = () => {
          const currentDataWidth = fullPriceData.reduce((width, point) => {
            const segSpeed = point.speed || 1;
            return width + pointSpacing / segSpeed;
          }, 0);

          const currentOffset = scrollOffset.get();
          const remainingWidth = currentDataWidth - currentOffset;
          const scrollDuration = remainingWidth / pxPerSecond;

          const controls = animate(scrollOffset, currentDataWidth, {
            duration: scrollDuration,
            ease: "linear",
            onComplete: () => {
              setTimeout(startContinuousScroll, 0);
            },
          });
          animationControlsRef.current = controls;
        };

        startContinuousScroll();
        return;
      }

      // Calculate timing for measurement line animations
      const measurementLineStartDelay = isRestart
        ? 0
        : durations.fadeInSequence.priceIndicator.start + durations.fadeInSequence.priceIndicator.duration + 0.5;
      const measurementLineDuration = 1.5;

      // Horizontal line Stage 1: Start when measurement line reveals, end halfway through measurement line reveal
      animate(horizontalLineClipPath, viewportWidth * 0.25, {
        duration: durations.fadeInSequence.measurementLine.duration / 2, // Half the measurement line reveal duration
        ease: "easeInOut",
        delay: isRestart ? 0 : durations.fadeInSequence.measurementLine.start, // Start when measurement line reveals
      });

      // Phase 1: Move measurement line to 10% position
      let controls = animate(measurementLineOffset, ANIMATION_CONFIG.measurementLine.minimum * 100, {
        duration: measurementLineDuration,
        ease: "anticipate",
        delay: measurementLineStartDelay,
      });
      animationControlsRef.current = controls;

      // Phase 2: Move measurement line back to final position and expand clip path
      const phase2Duration = 3;
      const phase2StartDelay = measurementLineStartDelay + measurementLineDuration - 0.5;

      // Horizontal line Stage 2: Start when measurement line begins moving back to left
      const horizontalStage2Delay = isRestart ? measurementLineDuration - 0.5 : phase2StartDelay - 0.5;
      const _horizontalStage2 = animate(horizontalLineClipPath, 0, {
        duration: 1.5 * phase2Duration, // Same duration as measurement line return
        ease: "easeInOut",
        delay: horizontalStage2Delay, // Start when Phase 2 begins
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
      animationControlsRef.current = controls;

      // Activate price tracking at the start of Phase 2
      priceTrackingActive.set(1);

      await controls;

      // No need for setTimeout-based messages anymore - they're handled by position monitoring

      // Phase 3: Start continuous scrolling through all data
      const speedScale = 1; // viewportWidth / 1920; // Scale speed based on viewport width (1920 = base)
      const pxPerSecond = ANIMATION_CONFIG.baseSpeed * 60 * speedScale;
      const totalDataWidth = positions.segments.unstable + positions.segments.semiStable;

      // Scroll through initial segments (unstable + semi-stable)
      controls = animate(scrollOffset, totalDataWidth, {
        duration: totalDataWidth / pxPerSecond,
        ease: "linear",
        onComplete: () => {
          // Start continuous linear scrolling without fixed loops
          // This will be controlled by the data extension logic
          const startContinuousScroll = () => {
            // Calculate current total data width dynamically
            const currentDataWidth = fullPriceData.reduce((width, point) => {
              const segSpeed = point.speed || 1;
              return width + pointSpacing / segSpeed;
            }, 0);

            const currentOffset = scrollOffset.get();
            const remainingWidth = currentDataWidth - currentOffset;
            const scrollDuration = remainingWidth / pxPerSecond;

            controls = animate(scrollOffset, currentDataWidth, {
              duration: scrollDuration,
              ease: "linear",
              onComplete: () => {
                // When we reach the end, restart the continuous scroll
                setTimeout(startContinuousScroll, 0);
              },
            });
            animationControlsRef.current = controls;
          };

          startContinuousScroll();
        },
      });
      animationControlsRef.current = controls;
    },
    [
      durations,
      measurementLineOffset,
      horizontalLineClipPath,
      viewportWidth,
      clipPathWidth,
      priceTrackingActive,
      scrollOffset,
      positions,
      fullPriceData,
      pointSpacing,
      hasSeenFullAnimation,
    ],
  );

  // Function to restart the animation
  const restartAnimation = useCallback(async () => {
    // Stop current animation
    if (animationControlsRef.current) {
      animationControlsRef.current.stop();
    }
    if (clipPathControlsRef.current) {
      clipPathControlsRef.current.stop();
    }

    priceTrackingActive.set(0);
    scrollOffset.set(0);
    clipPathWidth.set(ANIMATION_CONFIG.clipPath.initial);
    amplitudeCallCount = 0; // Reset amplitude for fresh randomization

    // Fade out visible elements and move measurement point to center
    await Promise.all([
      animate(priceLineOpacity, 0, {
        duration: 0.3,
        ease: "easeOut",
      }),
      animate(horizontalLineOpacity, 0, {
        duration: 0.3,
        ease: "easeOut",
      }),
      animate(priceLabelsOpacity, 0, {
        duration: 0.3,
        ease: "easeOut",
      }),
      animate(transactionMarkersOpacity, 0, {
        duration: 0.3,
        ease: "easeOut",
      }),
      // Move measurement point to 50% height (center)
      animate(currentY, dynamicHeight * 0.5, {
        duration: 0.3,
        ease: "easeOut",
      }),
      animate(measurementLineOffset, ANIMATION_CONFIG.measurementLine.minimum * 100, {
        duration: 1,
        ease: "anticipate",
      }),
    ]);

    // Reset all motion values to initial state
    horizontalLineClipPath.set(viewportWidth);
    priceLabelsOpacity.set(0);
    lineStrokeColor.set("#387F5C");
    priceLineOpacity.set(1); // Reset price line opacity
    horizontalLineOpacity.set(1); // Reset horizontal line opacity
    transactionMarkersOpacity.set(1); // Reset transaction markers opacity
    setCurrentTriggerPhase(undefined);

    // Reset to full data for restarts (always show complete story arc)
    setFullPriceData(initialFullPriceData);

    // Start the animation again with restart flag
    startAnimation(true);
  }, [
    scrollOffset,
    measurementLineOffset,
    clipPathWidth,
    horizontalLineClipPath,
    priceTrackingActive,
    priceLabelsOpacity,
    priceLineOpacity,
    horizontalLineOpacity,
    transactionMarkersOpacity,
    lineStrokeColor,
    viewportWidth,
    dynamicHeight,
    startAnimation,
  ]);

  // Click handler for chart during stable phase
  const handleChartClick = useCallback(() => {
    if (currentTriggerPhase === "mainCTA") {
      // console.log("RESTARTING");
      restartAnimation();
    }
  }, [currentTriggerPhase, restartAnimation]);

  // Handle component visibility with Intersection Observer
  useEffect(() => {
    const currentComponent = componentRef.current;
    if (!currentComponent) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isVisible = entry.isIntersecting;
        isComponentVisibleRef.current = isVisible;

        if (!isVisible && !isPausedRef.current) {
          // Component scrolled out of view - pause animations
          isPausedRef.current = true;
          if (animationControlsRef.current) {
            animationControlsRef.current.pause();
          }
          if (clipPathControlsRef.current) {
            clipPathControlsRef.current.pause();
          }
        } else if (isVisible && isPausedRef.current && !document.hidden) {
          // Component scrolled into view and page is visible - resume animations
          setTimeout(() => {
            isPausedRef.current = false;
            if (animationControlsRef.current) {
              animationControlsRef.current.play();
            }
            if (clipPathControlsRef.current) {
              clipPathControlsRef.current.play();
            }
          }, 100);
        }
      },
      {
        root: null,
        rootMargin: "0px",
        threshold: 0.1, // Trigger when 10% of component is visible
      },
    );

    observer.observe(currentComponent);

    return () => {
      observer.disconnect();
    };
  }, []);

  // Handle page visibility changes to pause/resume animations properly
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is now hidden - pause all animations
        isPausedRef.current = true;
        if (animationControlsRef.current) {
          animationControlsRef.current.pause();
        }
        if (clipPathControlsRef.current) {
          clipPathControlsRef.current.pause();
        }
        // Note: setTimeout/setInterval will be throttled by browser automatically
      } else if (isComponentVisibleRef.current) {
        // Page is now visible AND component is visible - resume animations
        setTimeout(() => {
          isPausedRef.current = false;
          if (animationControlsRef.current) {
            animationControlsRef.current.play();
          }
          if (clipPathControlsRef.current) {
            clipPathControlsRef.current.play();
          }
        }, 100);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  // Position-based animation system: start scrolling and track position for messages
  useEffect(() => {
    startAnimation();

    return () => {
      if (animationControlsRef.current) {
        animationControlsRef.current.stop();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  return (
    <div ref={componentRef} className="flex flex-col items-center justify-around h-full w-full">
      {/* Stage Messages */}
      <div
        className="min-h-[250px] sm:min-h-[300px] flex flex-col items-center justify-center pt-4 pb-2 sm:pt-8 sm:pb-4"
        id={"cta-header"}
      >
        <AnimatePresence mode="wait">
          {currentTriggerPhase === "unstable" && (
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
          {currentTriggerPhase === "semiStable" && (
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
                  An Algorithmic Stablecoin Balanced by Farmers Like You.
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
                    size={isMobile ? "lg" : "xxl"}
                    className="hover:bg-pinto-green-4 max-sm:px-4 hover:brightness-125 [transition:filter_0.3s_ease] flex flex-row gap-2 items-center relative overflow-hidden !font-[340] !tracking-[-0.025rem]"
                    id={"come-seed-the-trustless-economy"}
                    shimmer
                    glow
                  >
                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-pinto-green-2/50 to-transparent" />
                    <span className="relative z-10">Come Seed the Leviathan Free Economy</span>
                    <div className="relative z-10" style={{ isolation: "isolate" }}>
                      <PintoRightArrow width={isMobile ? "1rem" : "1.25rem"} height={isMobile ? "1rem" : "1.25rem"} />
                    </div>
                  </Button>
                </Link>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {/* Chart Component */}
      <div
        ref={containerRef}
        className={`w-full relative ${currentTriggerPhase === "stable" ? "cursor-pointer" : ""} mb-10`}
        id={"cta-chart"}
        onClick={handleChartClick}
      >
        <svg
          width="100%"
          height={dynamicHeight}
          viewBox={`0 0 ${viewportWidth} ${dynamicHeight}`}
          style={{ overflow: "visible" }}
        >
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
              <rect x="0" y="0" width="100%" height={dynamicHeight} fill="url(#priceLabelsGradient)" />
            </mask>
            <pattern
              id="grid"
              width={ANIMATION_CONFIG.gridSpacing}
              height={ANIMATION_CONFIG.gridSpacing}
              patternUnits="userSpaceOnUse"
              x={gridXOffset}
              y={gridYOffset}
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
              <motion.rect x="0" y="0" width={clipPathRectWidth} height={dynamicHeight} />
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
            d={`M 0 0 L 0 ${dynamicHeight}`}
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
            d={`M 0 ${dynamicHeight * ANIMATION_CONFIG.horizontalReference.position} L ${viewportWidth} ${dynamicHeight * ANIMATION_CONFIG.horizontalReference.position}`}
            stroke={ANIMATION_CONFIG.horizontalReference.color}
            strokeWidth={ANIMATION_CONFIG.horizontalReference.strokeWidth}
            strokeDasharray={ANIMATION_CONFIG.horizontalReference.dashArray}
            fill="none"
            mask="url(#fadeMask)"
            style={{
              clipPath: horizontalLineClipPathStyle,
              opacity: horizontalLineOpacity,
            }}
          />
          {/* Price labels - static positioned to the right of final measurement line position */}
          <motion.g mask="url(#priceLabelsOpacityMask)" style={{ opacity: priceLabelsOpacity }}>
            {priceLabelData.map((labelData) => (
              <motion.text
                key={labelData.price}
                x={viewportWidth * ANIMATION_CONFIG.priceLabels.staticX + ANIMATION_CONFIG.priceLabels.xOffset}
                y={labelData.y}
                fontSize={ANIMATION_CONFIG.priceLabels.fontSize}
                fill={ANIMATION_CONFIG.priceLabels.color}
                textAnchor="start"
              >
                {labelData.label}
              </motion.text>
            ))}
          </motion.g>
          {/* Scrolling price line */}
          <g clipPath="url(#viewport)">
            <motion.path
              d={path}
              fill="none"
              stroke={lineStrokeColor}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ x, opacity: priceLineOpacity }}
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
            if (marker.index > 0 && marker.index < fullPriceData.length) {
              const prev = fullPriceData[marker.index - 1];
              const curr = fullPriceData[marker.index];
              if (prev && curr && curr.value !== prev.value) {
                positionAbove = curr.value > prev.value;
              } else if (marker.index < fullPriceData.length - 1) {
                const next = fullPriceData[marker.index + 1];
                if (next && curr) {
                  positionAbove = curr.value > next.value;
                }
              }
            }
          }
          return (
            <FloaterContainer
              key={marker.id}
              marker={marker}
              x={x}
              viewportWidth={viewportWidth}
              floatersOpacity={floatersOpacity}
              positionAbove={positionAbove}
              isFirst={i === 0}
              showAllLabels={showAllLabels}
              toggleAllLabels={toggleAllLabels}
              measurementX={measurementX}
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
