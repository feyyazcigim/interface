import { motion, useAnimation } from "framer-motion";
import { ReactNode, useEffect } from "react";

const TxTypeIcons: Record<string, string> = {
  deposit: "DoubleCaret_Landing.svg", // Deposit transaction type icon
  withdraw: "ReverseDoubleCaret_Landing.svg", // Withdraw transaction type icon
  sow: "DoubleCaret_Landing.svg", // Sow transaction type icon
  harvest: "ReverseDoubleCaret_Landing.svg", // Harvest transaction type icon
  convert: "SpinningArrows_Landing.svg", // Convert transaction type icon
  yield: "Cross_Landing.svg", // Yield transaction type icon
};

export default function TxFloater({ from, txType }: { from: ReactNode; txType: string | null }) {
  const controls = useAnimation();

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    controls.set({ opacity: 0 });
    controls.start({ opacity: 1, transition: { duration: 0.2 } }).then(() => {
      timeout = setTimeout(() => {
        controls.start({ opacity: 0, transition: { duration: 0.2 } });
      }, 500);
    });
    return () => clearTimeout(timeout);
  }, [from, txType, controls]);

  return (
    from &&
    txType && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={controls}
        className="z-10 w-[7.75rem] h-[3.25rem] flex items-center justify-center bg-white border border-pinto-green-4 rounded-full px-3 py-2 gap-2"
      >
        <div className="w-8 h-8">{from}</div>
        {txType && TxTypeIcons[txType] && <img alt="Convert" src={TxTypeIcons[txType]} className="w-4 h-4" />}
        <img alt="Stuff" src="Sow_Landing.svg" className="w-8 h-8" />
      </motion.div>
    )
  );
}
