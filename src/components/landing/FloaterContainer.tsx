import { MotionValue, motion, useTransform } from "framer-motion";
import TxFloater from "./TxFloater";

interface FloaterContainerProps {
  marker: {
    x: number;
    y: number;
    txType: string;
    farmer?: string;
    index: number;
    apexType?: "peak" | "valley";
  };
  x: MotionValue<number>;
  viewportWidth: number;
  floatersOpacity: MotionValue<1 | 0>;
  positionAbove: boolean;
  isFirst: boolean;
}

export default function FloaterContainer({
  marker,
  x,
  viewportWidth,
  floatersOpacity,
  positionAbove,
  isFirst,
}: FloaterContainerProps) {
  const leftPosition = useTransform(x, (scrollX) => marker.x + scrollX);

  return (
    <motion.div
      className="absolute z-20"
      style={{
        pointerEvents: "none",
        opacity: floatersOpacity,
        left: leftPosition,
        top: positionAbove ? marker.y - 50 : marker.y + 10,
        transform: "translateX(-50%)",
      }}
    >
      <TxFloater
        from={marker.farmer}
        txType={marker.txType}
        viewportWidth={viewportWidth}
        x={x}
        markerX={marker.x}
        isFixed={true}
        id={isFirst ? "txFloater" : undefined}
      />
    </motion.div>
  );
}
