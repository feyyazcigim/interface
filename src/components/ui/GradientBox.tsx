import { Col } from "@/components/Container";
import { cn } from "@/utils/utils";
import { motion, useTime, useTransform } from "framer-motion";
import { ReactNode, useState } from "react";

export interface IGradientBox {
  children: ReactNode;
  rounded?: {
    tl?: boolean;
    tr?: boolean;
    bl?: boolean;
    br?: boolean;
  };
  timeRange?: [number, number];
  rotationRange?: [number, number];
  innerClassName?: string;
  outerClassName?: string;
  animate?: boolean;
}

const defaultTimeRange: [number, number] = [0, 1500];
const defaultRotationRange: [number, number] = [0, 360];

const GradientBox = ({
  children,
  timeRange = defaultTimeRange,
  rotationRange = defaultRotationRange,
  rounded = {},
  innerClassName = "",
  outerClassName = "",
  animate = true,
}: IGradientBox) => {
  const time = useTime();
  const [isHovered, setIsHovered] = useState(false);

  const rotate = useTransform(time, timeRange, rotationRange, { clamp: false });

  const rotatingBox = useTransform(rotate, (r) => {
    return `conic-gradient(from ${r}deg, #6FBF6F, #E9E7E0, #FEE18C, #F1F88C)`;
  });

  const toggle = () => {
    if (animate) {
      setIsHovered((prev) => !prev);
    }
  };

  return (
    <div className="relative" onMouseEnter={toggle} onMouseLeave={toggle}>
      <Col className={cn(
        `relative flex flex-col items-center justify-center z-10 bg-white`,
        rounded.tl && "rounded-tl-sm",
        rounded.tr && "rounded-tr-sm",
        rounded.bl && "rounded-bl-sm",
        rounded.br && "rounded-br-sm",
        outerClassName
      )}>
        {children}
      </Col>
      <motion.div
        className={cn(
          `absolute -inset-[0.125rem] z-0`,
          rounded.tl && "rounded-tl-[0.65rem]",
          rounded.tr && "rounded-tr-[0.65rem]",
          rounded.bl && "rounded-bl-[0.65rem]",
          rounded.br && "rounded-br-[0.65rem]",
          innerClassName
        )}
        style={{
          background: isHovered
            ? rotatingBox
            : // have to define here because style overrides the tailwind class
              "linear-gradient(292deg, rgba(154, 159, 108, 0.50) 2.84%, rgba(152, 196, 140, 0.90) 79.19%, #7DBC7C 99.27%)",
        }}
      />
    </div>
  );
};

export default GradientBox;
