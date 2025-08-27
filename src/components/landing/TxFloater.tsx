import { AnimationDefinition, MotionValue, motion, useAnimation, useTransform } from "framer-motion";
import { ReactNode, useEffect, useRef } from "react";

const TxTypeIcons: Record<string, string> = {
  deposit: "DoubleCaret_Landing.svg", // Deposit transaction type icon
  withdraw: "ReverseDoubleCaret_Landing.svg", // Withdraw transaction type icon
  sow: "DoubleCaret_Landing.svg", // Sow transaction type icon
  harvest: "ReverseDoubleCaret_Landing.svg", // Harvest transaction type icon
  convert: "SpinningArrows_Landing.svg", // Convert transaction type icon
  yield: "Cross_Landing.svg", // Yield transaction type icon
};

const TxIcons: Record<string, string> = {
  deposit: "Silo_Landing.svg",
  withdraw: "Silo_Landing.svg",
  sow: "Sow_Landing.svg",
  harvest: "Harvest_Landing.svg",
  convert: "Silo_Landing.svg",
  yield: "Silo_Landing.svg",
};

const bounceInAnimation: AnimationDefinition = {
  scale: [0, 1, 0.8],
  opacity: [1, 1, 1],
  transition: {
    duration: 0.8,
    times: [0, 0.5, 1],
    ease: "easeInOut",
    repeat: 0,
  },
};

export default function TxFloater({
  from,
  txType,
  viewportWidth,
  x,
  markerX,
  isFixed,
  id,
}: {
  from: string | undefined;
  txType: string | null;
  viewportWidth: number;
  x: MotionValue<number>; // The shared scroll position
  markerX: number; // The absolute X position of the marker
  isFixed: boolean; // true for static markers on the chart line, false for the floating marker at the measurement point
  id?: string;
}) {
  // Compute the floater's current screen X position
  const screenX = useTransform(x, (scrollX) => markerX + scrollX);

  // Use animation controls for better control
  const controls = useAnimation();
  const lastValidFromRef = useRef<string | undefined>(undefined);
  const lastValidTxTypeRef = useRef<string | null>(null);
  const hasInitialized = useRef(false);
  const hasAnimated = useRef(false);

  // Pop in as the floater crosses 75% of the viewport and stays visible
  const popInStart = viewportWidth * 0.775;
  const popInEnd = viewportWidth * 0.755;
  const fixedOpacity = useTransform(screenX, [popInStart, popInEnd], [0, 1]);
  const showFixedTx = useTransform(fixedOpacity, (o) => (from && txType ? o : 0));

  // For fixed floaters, listen to screenX changes directly
  useEffect(() => {
    if (!isFixed) return;

    const unsubscribe = showFixedTx.on("change", (showTx) => {
      if (showTx === 1 && !hasAnimated.current) {
        controls.start(bounceInAnimation);
        hasAnimated.current = true;
      } else if (showTx < 1 && hasAnimated.current) {
        controls.stop();
        controls.set({ scale: 0, opacity: 0 });
        hasAnimated.current = false;
      }
    });

    return unsubscribe;
  }, [isFixed, showFixedTx, controls]);

  // Effect for floating floater data changes
  useEffect(() => {
    if (isFixed) return;

    // Only update and animate if we have a valid txType
    if (!from || !txType) {
      // Hide immediately if no valid data
      if (!hasInitialized.current) {
        controls.set({ opacity: 0, scale: 0 });
        hasInitialized.current = true;
      }
      return;
    }

    // Create a combined key for comparison using only valid values
    const currentValidKey = `${from}-${txType}`;
    const lastValidKey = `${lastValidFromRef.current}-${lastValidTxTypeRef.current}`;

    // Skip on first mount to set initial values
    if (!hasInitialized.current) {
      lastValidFromRef.current = from;
      lastValidTxTypeRef.current = txType;
      hasInitialized.current = true;
      return;
    }

    // Only trigger animation if the valid state actually changed
    if (currentValidKey !== lastValidKey) {
      // Cancel any existing animation before starting new one
      controls.stop();
      // controls.start(shortBounceInAnimation);

      // Update last valid values
      lastValidFromRef.current = from;
      lastValidTxTypeRef.current = txType;
    }
  }, [from, txType, isFixed, controls]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={controls}
      className={`z-10 flex items-center justify-center bg-white border border-pinto-green-4 rounded-full p-2 gap-2 w-fit`}
      id={id}
    >
      <img className="w-8 h-8" src={isFixed ? from : lastValidFromRef.current} alt="Farmer Icon" />
      <img
        alt={lastValidTxTypeRef.current || "Transaction Type Icon"}
        src={
          isFixed
            ? txType
              ? TxTypeIcons[txType]
              : undefined
            : lastValidTxTypeRef.current
              ? TxTypeIcons[lastValidTxTypeRef.current]
              : undefined
        }
        className="w-4 h-4"
      />
      <img
        alt={lastValidTxTypeRef.current || "Transaction Icon"}
        src={
          isFixed
            ? txType
              ? TxIcons[txType]
              : undefined
            : lastValidTxTypeRef.current
              ? TxIcons[lastValidTxTypeRef.current]
              : undefined
        }
        className={`w-8 h-8`}
      />
    </motion.div>
  );
}
