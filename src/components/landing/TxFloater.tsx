import { MotionValue, motion, useAnimation, useTransform } from "framer-motion";
import { ReactNode, useEffect } from "react";

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

export default function TxFloater({
  from,
  txType,
  viewportWidth,
  x,
  markerX,
  isFixed,
}: {
  from: ReactNode;
  txType: string | null;
  viewportWidth: number;
  x: MotionValue<number>; // The shared scroll position
  markerX: number; // The absolute X position of the marker
  isFixed: boolean; // true for static markers on the chart line, false for the floating marker at the measurement point
}) {
  const controls = useAnimation();

  // Only run the fade-in/fade-out effect for fixed floaters
  useEffect(() => {
    if (!isFixed) return;
    let timeout: NodeJS.Timeout;
    controls.set({ opacity: 0 });
    controls.start({ opacity: 1, transition: { duration: 0.2 } }).then(() => {
      timeout = setTimeout(() => {
        controls.start({ opacity: 0, transition: { duration: 0.2 } });
      }, 500);
    });
    return () => clearTimeout(timeout);
  }, [controls, isFixed]);

  // Compute the floater's current screen X position
  const screenX = useTransform(x, (scrollX) => markerX + scrollX);
  // Fade in as the floater crosses 65% of the viewport and stays visible
  const fadeStart = viewportWidth * 0.67;
  const fadeEnd = viewportWidth * 0.65;
  const opacity = useTransform(screenX, [fadeStart, fadeEnd, fadeEnd + 1], [0, 1, 1]);

  return (
    from &&
    txType && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={isFixed ? undefined : { opacity: 1 }}
        exit={isFixed ? undefined : { opacity: 0 }}
        style={{
          opacity: isFixed ? opacity : 1,
        }}
        transition={{ opacity: { ease: "easeInOut", duration: 0.5 } }}
        className={`z-10 flex items-center justify-center bg-white border border-pinto-green-4 rounded-full ${
          isFixed ? "h-8 py-1 gap-1" : "w-[7.75rem] h-[3.25rem] px-3 py-2 gap-2"
        }`}
      >
        <div className={`w-8 h-8 ${isFixed ? "scale-75" : "scale-100"}`}>{from}</div>
        {txType && TxTypeIcons[txType] && <img alt="Convert" src={TxTypeIcons[txType]} className="w-4 h-4" />}
        <img alt="Stuff" src={TxIcons[txType]} className={`w-8 h-8 ${isFixed ? "scale-[0.85] mr-0.5" : "scale-100"}`} />
      </motion.div>
    )
  );
}
