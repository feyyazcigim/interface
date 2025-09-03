import { AnimatePresence, AnimationDefinition, MotionValue, motion, useAnimation, useTransform } from "framer-motion";
import { ReactNode, useEffect, useRef, useState } from "react";

const TxTypeIcons: Record<string, string> = {
  deposit: "DoubleCaret_Landing.svg", // Deposit transaction type icon
  withdraw: "ReverseDoubleCaret_Landing.svg", // Withdraw transaction type icon
  sow: "DoubleCaret_Landing.svg", // Sow transaction type icon
  harvest: "ReverseDoubleCaret_Landing.svg", // Harvest transaction type icon
  convertUp: "SpinningArrows_Landing.svg", // Convert transaction type icon
  convertDown: "SpinningArrows_Landing.svg", // Convert transaction type icon
  yield: "Cross_Landing.svg", // Yield transaction type icon
};

const TxIcons: Record<string, string> = {
  deposit: "Silo_Landing.svg",
  withdraw: "Silo_Landing.svg",
  sow: "Sow_Landing.svg",
  harvest: "Harvest_Landing.svg",
  convertUp: "Silo_Landing.svg",
  convertDown: "Silo_Landing.svg",
  yield: "Silo_Landing.svg",
};

const TxActionLabels: Record<string, string> = {
  deposit: "Bought",
  withdraw: "Sold",
  sow: "Lent",
  harvest: "Harvested",
  convertUp: "Converted Up",
  convertDown: "Converted Down",
  yield: "Mint",
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
  positionAbove,
  showAllLabels,
  toggleAllLabels,
}: {
  from: string | undefined;
  txType: string | null;
  viewportWidth: number;
  x: MotionValue<number>; // The shared scroll position
  markerX: number; // The absolute X position of the marker
  isFixed: boolean; // true for static markers on the chart line, false for the floating marker at the measurement point
  id?: string;
  positionAbove?: boolean; // Whether the pill is positioned above the value target
  showAllLabels?: boolean; // Global state for showing all labels
  toggleAllLabels?: () => void; // Global toggle function
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

  const currentTxType = isFixed ? txType : lastValidTxTypeRef.current;
  const actionLabel = currentTxType ? TxActionLabels[currentTxType] : undefined;

  // Handle pill click to toggle all labels globally
  const handlePillClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent the click from bubbling up to the chart's restart handler
    if (toggleAllLabels) {
      toggleAllLabels();
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={controls} className="z-10 relative" id={id}>
      {/* Action label positioned above or below based on pill position relative to value target */}
      <AnimatePresence>
        {actionLabel && showAllLabels && (
          <motion.div
            key="label"
            className="absolute text-pinto-gray-6 text-base font-normal opacity-90 text-center whitespace-nowrap w-full"
            style={{
              top: positionAbove ? "-28px" : "50px", // When pill is above $1 target, text goes above; when pill is below $1 target, text goes below
            }}
            initial={{ opacity: 0, y: positionAbove ? 5 : -5 }}
            animate={{ opacity: 0.9, y: 0 }}
            exit={{ opacity: 0, y: positionAbove ? -5 : 5 }}
            transition={{ duration: 0.3 }}
          >
            {actionLabel}
          </motion.div>
        )}
      </AnimatePresence>
      {/* The pill stays in its original position */}
      <motion.div
        className="flex items-center justify-center bg-white border border-pinto-green-4 rounded-full p-2 gap-2 w-fit cursor-pointer hover:shadow-lg hover:border-pinto-green-5 transition-all duration-200"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={handlePillClick}
        whileHover={{ scale: 1.15, borderColor: "#246645", transition: { duration: 0.1 } }}
        whileTap={{ scale: 0.95, transition: { duration: 0 } }}
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
    </motion.div>
  );
}
