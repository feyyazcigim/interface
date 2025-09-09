import podIcon from "@/assets/protocol/Pod.png";
import pintoLogo from "@/assets/tokens/PINTO.png";
import { AnimatePresence, AnimationDefinition, MotionValue, motion, useAnimation, useTransform } from "framer-motion";
import { useEffect, useRef } from "react";

const TxTypeIcons: Record<string, string> = {
  deposit: "DoubleCaret_Landing.svg", // Deposit transaction type icon
  withdraw: "ReverseDoubleCaret_Landing.svg", // Withdraw transaction type icon
  sow: "DoubleCaret_Landing.svg", // Sow transaction type icon
  harvest: "ReverseDoubleCaret_Landing.svg", // Harvest transaction type icon
  convertUp: "SpinningArrows_Landing.svg", // Convert transaction type icon
  convertDown: "SpinningArrows_Landing.svg", // Convert transaction type icon
  yield: "Cross_Landing.svg", // Yield transaction type icon
  flood: "ReverseDoubleCaret_Landing.svg", // Flood transaction type icon
  buy: "DoubleCaret_Landing.svg", // Buy transaction type icon
  sell: "ReverseDoubleCaret_Landing.svg", // Sell transaction type icon
};

const TxIcons: Record<string, string> = {
  deposit: pintoLogo,
  withdraw: pintoLogo,
  sow: podIcon,
  harvest: podIcon,
  convertUp: pintoLogo,
  convertDown: pintoLogo,
  yield: pintoLogo,
  flood: pintoLogo,
  buy: pintoLogo,
  sell: pintoLogo,
};

const TxActionLabels: Record<string, string> = {
  deposit: "Deposited",
  withdraw: "Withdrew",
  sow: "Lent",
  harvest: "Harvested",
  convertUp: "Converted Up",
  convertDown: "Converted Down",
  yield: "Mint",
  flood: "Flood",
  buy: "Bought",
  sell: "Sold",
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
  shouldPopOnReveal,
}: {
  from: string | undefined;
  txType: string | null;
  viewportWidth: number;
  x: MotionValue<number>; // The shared scroll position
  markerX: number; // The absolute X position of the marker
  isFixed: boolean; // true for static markers on the chart line, false for the floating marker at the measurement point
  id?: string;
  positionAbove?: boolean; // Whether the pill is positioned above the value target
  shouldPopOnReveal?: MotionValue<boolean>; // Whether to trigger pop animation when revealed
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

  // Listen for reveal trigger and play pop animation
  useEffect(() => {
    if (!shouldPopOnReveal) return;

    const unsubscribe = shouldPopOnReveal.on("change", (shouldPop) => {
      if (shouldPop && !hasAnimated.current) {
        controls.start(bounceInAnimation);
        hasAnimated.current = true;
      } else if (!shouldPop && hasAnimated.current) {
        // Reset when shouldPop becomes false (animation restart)
        controls.set({ scale: 0, opacity: 0 });
        hasAnimated.current = false;
      }
    });

    return unsubscribe;
  }, [controls, shouldPopOnReveal]);

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

  return (
    <motion.div initial={{ opacity: 0 }} animate={controls} className="z-10 relative" id={id}>
      {/* Action label positioned above or below based on pill position relative to value target */}
      <AnimatePresence>
        {actionLabel && (
          <motion.div
            key="label"
            className="absolute text-pinto-gray-6 text-base text-[18px] font-normal opacity-90 whitespace-nowrap w-full flex justify-center items-center"
            style={{
              top: positionAbove ? "-24px" : "50px", // When pill is above $1 target, text goes above; when pill is below $1 target, text goes below
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
        className="flex items-center justify-center bg-white border border-pinto-green-4 rounded-full p-2 gap-2 w-fit transition-all duration-200"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center">
          <img
            className="w-full h-full object-cover"
            src={isFixed ? from : lastValidFromRef.current}
            alt="Farmer Icon"
          />
        </div>
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
