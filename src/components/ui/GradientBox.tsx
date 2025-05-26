import { Col } from "@/components/Container";
import { cn, isObject } from "@/utils/utils";
import clsx from "clsx";
import { motion, useTime, useTransform } from "framer-motion";
import { ReactNode, useRef, useState } from "react";


export interface IGradientBox {
  children: ReactNode;
  rounded?: CornerRadius | RadiusKey;
  timeRange?: Range;
  rotationRange?: Range;
  innerClassName?: string;
  outerClassName?: string;
  animate?: boolean;
  defaultGradientRotation?: number;
  rotateGradient?: (r: number) => string;
}



const GradientBox = ({
  children,
  timeRange = DEFAULT_TIME_RANGE,
  rotationRange = DEFAULT_ROTATION_RANGE,
  rounded,
  innerClassName = "",
  outerClassName = "",
  animate = true,
  defaultGradientRotation = 180,
  rotateGradient = getDefaultConicGradient,
}: IGradientBox) => {
  const [isHovered, setIsHovered] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const time = useTime();
  const rotate = useTransform(time, timeRange, rotationRange, { clamp: false });
  const rotatingBox = useTransform(rotate, rotateGradient);

  const { outer, inner } = useCornerRadiusClassNames(rounded);

  const stillGradient = getDefaultConicGradient(defaultGradientRotation);

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
    <div className="relative" ref={ref} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <Col className={cn("relative flex flex-col items-center justify-center z-10 bg-white", outer, outerClassName)}>
        {children}
      </Col>
      <motion.div
        className={cn(`absolute -inset-[0.125rem] z-0`, inner, innerClassName)}
        style={{
          background: animate && isHovered ? rotatingBox : stillGradient,
        }}
      />
    </div>
  );
};

export default GradientBox;

// ────────────────────────────────────────────────────────────────────────────────
// Helper Functions
// ────────────────────────────────────────────────────────────────────────────────

const useCornerRadiusClassNames = (rounded: IGradientBox["rounded"] = {}) => {
  // if rounded is an object, return the class names for the outer and inner elements
  if (rounded !== undefined && isObject(rounded)) {
    const radiuses = Object.entries(rounded).filter(([_, value]) => Boolean(value));

    const outer = clsx(radiuses.map(([key, radius]) => RADIUS_TO_INNER_RADIUS.outer[radius][key]).join(" "));
    const inner = clsx(radiuses.map(([keyBy, radius]) => RADIUS_TO_INNER_RADIUS.inner[radius][keyBy]).join(" "));

    return { outer, inner } as const;
  }

  return {
    outer: RADIUS_TO_INNER_RADIUS.outer[rounded]?.all ?? "",
    inner: RADIUS_TO_INNER_RADIUS.inner[rounded]?.all ?? "",
  } as const;
};

const getDefaultConicGradient = (r: number) => `conic-gradient(from ${r}deg, #6FBF6F, #E9E7E0, #FEE18C, #F1F88C)`;


// ────────────────────────────────────────────────────────────────────────────────
// Constants
// ────────────────────────────────────────────────────────────────────────────────


const DEFAULT_TIME_RANGE: Range = [0, 1500] as const;
const DEFAULT_ROTATION_RANGE: Range = [0, 360] as const;

/**
 * pre-computed radiuses for the outer and inner elements
 *
 * @description
 * - outer: the radius of the outer element
 * - inner: the radius of the inner element
 *
 * B/c the inner card is inset by 0.125rem, we pre-define these radiuses because the inner card requires a slightly sharper radius than the outer card.
 *
 */
const RADIUS_TO_INNER_RADIUS = {
  outer: {
    sm: { tl: "rounded-tl-sm", tr: "rounded-tr-sm", bl: "rounded-bl-sm", br: "rounded-br-sm", all: "rounded-sm" },
    md: { tl: "rounded-tl-md", tr: "rounded-tr-md", bl: "rounded-bl-md", br: "rounded-br-md", all: "rounded-md" },
    lg: { tl: "rounded-tl-lg", tr: "rounded-tr-lg", bl: "rounded-bl-lg", br: "rounded-br-lg", all: "rounded-lg" },
    xl: { tl: "rounded-tl-xl", tr: "rounded-tr-xl", bl: "rounded-bl-xl", br: "rounded-br-xl", all: "rounded-xl" },
  },
  inner: {
    sm: {
      tl: "rounded-tl-[0.575rem]",
      tr: "rounded-tr-[0.575rem]",
      bl: "rounded-bl-[0.575rem]",
      br: "rounded-br-[0.575rem]",
      all: "rounded-[0.575rem]",
    },
    md: {
      tl: "rounded-tl-[0.7rem]",
      tr: "rounded-tr-[0.7rem]",
      bl: "rounded-bl-[0.7rem]",
      br: "rounded-br-[0.7rem]",
      all: "rounded-[0.7rem]",
    },
    lg: {
      tl: "rounded-tl-[0.825rem]",
      tr: "rounded-tr-[0.825rem]",
      bl: "rounded-bl-[0.825rem]",
      br: "rounded-br-[0.825rem]",
      all: "rounded-[0.825rem]",
    },
    xl: {
      tl: "rounded-tl-[1.325rem]",
      tr: "rounded-tr-[1.325rem]",
      bl: "rounded-bl-[1.325rem]",
      br: "rounded-br-[1.325rem]",
      all: "rounded-[1.325rem]",
    },
  },
};

// ────────────────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────────────────

type RadiusKey = "sm" | "md" | "lg" | "xl";

type CornerRadius = {
  tl?: RadiusKey;
  tr?: RadiusKey;
  bl?: RadiusKey;
  br?: RadiusKey;
};

type Range = [number, number];
