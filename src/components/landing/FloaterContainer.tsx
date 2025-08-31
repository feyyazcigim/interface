import { MotionValue, motion, useTransform } from "framer-motion";
import { memo } from "react";
import { TransactionMarker } from "./LandingChart";
import TxFloater from "./TxFloater";

interface FloaterContainerProps {
  marker: TransactionMarker;
  x: MotionValue<number>;
  viewportWidth: number;
  floatersOpacity: MotionValue<1 | 0>;
  positionAbove: boolean;
  isFirst: boolean;
  showAllLabels: boolean;
  toggleAllLabels: () => void;
}

function FloaterContainer({
  marker,
  x,
  viewportWidth,
  floatersOpacity,
  positionAbove,
  isFirst,
  showAllLabels,
  toggleAllLabels,
}: FloaterContainerProps) {
  const leftPosition = useTransform(x, (scrollX) => marker.x + scrollX);

  return (
    <motion.div
      className="absolute z-20"
      style={{
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
        positionAbove={positionAbove}
        showAllLabels={showAllLabels}
        toggleAllLabels={toggleAllLabels}
      />
    </motion.div>
  );
}

// Custom comparison function to prevent unnecessary re-renders
function arePropsEqual(prevProps: FloaterContainerProps, nextProps: FloaterContainerProps): boolean {
  // Compare marker properties
  const prevMarker = prevProps.marker;
  const nextMarker = nextProps.marker;

  // First check the stable ID - if it's the same, compare other properties
  if (prevMarker.id !== nextMarker.id) {
    return false;
  }

  if (
    prevMarker.x !== nextMarker.x ||
    prevMarker.y !== nextMarker.y ||
    prevMarker.txType !== nextMarker.txType ||
    prevMarker.farmer !== nextMarker.farmer ||
    prevMarker.index !== nextMarker.index ||
    prevMarker.apexType !== nextMarker.apexType
  ) {
    return false;
  }

  // Compare other props (excluding MotionValues which should be stable references)
  if (
    prevProps.viewportWidth !== nextProps.viewportWidth ||
    prevProps.positionAbove !== nextProps.positionAbove ||
    prevProps.isFirst !== nextProps.isFirst ||
    prevProps.x !== nextProps.x ||
    prevProps.floatersOpacity !== nextProps.floatersOpacity ||
    prevProps.showAllLabels !== nextProps.showAllLabels ||
    prevProps.toggleAllLabels !== nextProps.toggleAllLabels
  ) {
    return false;
  }

  return true;
}

export default memo(FloaterContainer, arePropsEqual);
