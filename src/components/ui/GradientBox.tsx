import { Col } from "@/components/Container";
import { cn, isObject } from "@/utils/utils";
import clsx from "clsx";
import { motion, useTime, useTransform } from "framer-motion";
import { ReactNode, useState } from "react";

type CornerRadius = {
  tl?: boolean;
  tr?: boolean;
  bl?: boolean;
  br?: boolean;
};

type Range = [number, number];

export interface IGradientBox {
  children: ReactNode;
  rounded?: CornerRadius | boolean;
  timeRange?: Range;
  rotationRange?: Range;
  innerClassName?: string;
  outerClassName?: string;
  animate?: boolean;
  stillGradient?: string;
  rotateGradient?: (r: number) => string;
}

const defaultTimeRange: Range = [0, 1500] as const;
const defaultRotationRange: Range = [0, 360] as const;
const defaultGradient =
  "linear-gradient(292deg, rgba(154, 159, 108, 0.50) 2.84%, rgba(152, 196, 140, 0.90) 79.19%, #7DBC7C 99.27%)";

const defaultRotateGradient = (r: number) => `conic-gradient(from ${r}deg, #6FBF6F, #E9E7E0, #FEE18C, #F1F88C)`;

const GradientBox = ({
  children,
  timeRange = defaultTimeRange,
  rotationRange = defaultRotationRange,
  rounded,
  innerClassName = "",
  outerClassName = "",
  animate = true,
  stillGradient = defaultGradient,
  rotateGradient = defaultRotateGradient,
}: IGradientBox) => {
  const [isHovered, setIsHovered] = useState(false);

  const time = useTime();
  const rotate = useTransform(time, timeRange, rotationRange, { clamp: false });
  const rotatingBox = useTransform(rotate, rotateGradient);

  const { outer, inner } = useCornerRadiusClassNames(rounded);

  // callback functions
  const handleMouseEnter = () => {
    if (!animate) return;
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    if (!animate) return;
    setIsHovered(false);
  };

  return (
    <div className="relative" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <Col className={cn("relative flex flex-col items-center justify-center z-10 bg-white", outer, outerClassName)}>
        {children}
      </Col>
      <motion.div
        className={cn("absolute -inset-[0.125rem] z-0", inner, innerClassName)}
        style={{
          background: animate && isHovered ? rotatingBox : stillGradient,
        }}
      />
    </div>
  );
};

export default GradientBox;

const useCornerRadiusClassNames = (rounded: IGradientBox["rounded"] = {}) => {
  // if rounded is an object, return the class names for the outer and inner elements
  if (rounded !== undefined && isObject(rounded)) {
    const radiuses = Object.entries(rounded).filter(([_, value]) => Boolean(value));

    const outer = clsx(radiuses.map(([key]) => `rounded-${key}-sm`));
    const inner = clsx(radiuses.map(([key]) => `rounded-${key}-[0.65rem]`));

    return { outer, inner };
  }

  // if rounded is a boolean, return the class names for the outer and inner elements
  return {
    outer: rounded ? "rounded-sm" : "",
    inner: rounded ? "rounded-[0.65rem]" : "",
  };
};
