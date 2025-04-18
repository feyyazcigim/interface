import useBoolean from "@/hooks/useBoolean";
import { cn } from "@/utils/utils";
import { motion } from "framer-motion";
import { Col } from "./Container";

interface IReadMoreAccordion {
  children: React.ReactNode;
  defaultOpen?: boolean;
}
export default function ReadMoreAccordion({ children, defaultOpen = false }: IReadMoreAccordion) {
  const [open, toggle] = useBoolean(defaultOpen);

  return (
    <Col>
      <Col className="relative overflow-hidden pinto-body-light text-pinto-light">
        <motion.div
          initial={{ height: defaultOpen ? "auto" : 0, opacity: defaultOpen ? 1 : 0 }}
          animate={{
            height: open ? "auto" : 0,
            opacity: open ? 1 : 0,
          }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className={open ? "flex flex-col": ""}
        >
          {children}
        </motion.div>
      </Col>
      <div onClick={toggle} className={cn("cursor-pointer w-max pinto-sm-light text-pinto-green", open && "mt-2")}>
        {open ? "Read less" : "Read more"}
      </div>
    </Col>
  );
}
