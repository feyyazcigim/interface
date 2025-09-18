import { breakpoints } from "@/utils/theme/breakpoints";
import { MotionValue, motion, useTransform } from "framer-motion";
import { memo } from "react";
import { TransactionMarker } from "./LandingChart";
import TxFloater from "./TxFloater";

interface FloaterContainerProps {
  marker: TransactionMarker;
  x: MotionValue<number>;
  viewportWidth: number;
  positionAbove: boolean;
  isFirst: boolean;
  measurementX: MotionValue<number>;
}

function FloaterContainer({ marker, x, viewportWidth, positionAbove, isFirst, measurementX }: FloaterContainerProps) {
  const leftPosition = useTransform(x, (scrollX: number) => marker.x + scrollX);
  const transformValue = useTransform(leftPosition, (pos: number) => `translateX(${pos}px) translateX(-50%)`);

  // Check if this floater is in the early reveal zone (0-75% of viewport)
  const shouldPopOnReveal = useTransform([measurementX, x], (values: number[]) => {
    const measX = values[0];
    const scrollX = values[1];
    const markerScreenPosition = marker.x + scrollX;
    const isInEarlyZone = markerScreenPosition <= viewportWidth * 0.75;
    const shouldTriggerPop = isInEarlyZone && measX >= markerScreenPosition;

    return shouldTriggerPop;
  });

  return (
    <motion.div
      className="absolute z-20 will-change-transform"
      style={{
        opacity: 1,
        top: positionAbove
          ? viewportWidth >= breakpoints.sm && viewportWidth < breakpoints["3xl"]
            ? marker.y - 40
            : marker.y - 50
          : marker.y,
        transform: transformValue,
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
        shouldPopOnReveal={shouldPopOnReveal}
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
    prevProps.measurementX !== nextProps.measurementX
  ) {
    return false;
  }

  return true;
}

export default memo(FloaterContainer, arePropsEqual);
