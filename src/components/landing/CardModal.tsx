import { Dialog, DialogContent, DialogOverlay } from "@/components/ui/Dialog";
import { cn } from "@/utils/utils";
import { motion } from "framer-motion";
import React from "react";
import Markdown from "react-markdown";

interface CardData {
  logo: string;
  title: string;
  subtitle: string;
  definition: string;
  description: string;
}

interface CardModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  cardData: CardData | null;
}

export default function CardModal({ isOpen, onOpenChange, cardData }: CardModalProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  if (!cardData) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogOverlay className="bg-pinto-morning-yellow-0/80" />
      <DialogContent
        className={cn(
          isExpanded ? "w-[90vw] h-[90vh]" : "w-[90vw] h-[60vh] sm:w-[60rem] sm:h-[35rem]",
          "max-w-none",
          "border border-gray-200 rounded-2xl shadow-2xl",
          "bg-pinto-off-white",
          "p-6 sm:p-10",
          "focus:outline-none focus:ring-0 focus:border-gray-200",
          "transition-all duration-300 ease-in-out",
        )}
        hideCloseButton={true}
      >
        {/* Expand button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          type="button"
          className="absolute top-4 right-4 px-3 py-1.5 text-xs font-medium text-pinto-gray-4 hover:text-black border border-pinto-gray-3 hover:border-pinto-gray-4 rounded-full bg-white hover:bg-pinto-gray-3/50 transition-all duration-200 z-10"
        >
          {isExpanded ? "Contract" : "Expand"}
        </button>

        <motion.div
          className="flex flex-col gap-4 h-full min-h-0"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{
            duration: 0.3,
            ease: [0.16, 1, 0.3, 1], // Custom ease for smooth feel
          }}
        >
          {/* Header section - fixed height */}
          <div className="flex flex-col gap-8 flex-shrink-0">
            <div className="flex flex-row items-center gap-6 sm:gap-8">
              <img src={cardData.logo} className="w-20 h-20 sm:w-32 sm:h-32 flex-shrink-0" alt={cardData.title} />
              <h2 className="text-2xl sm:text-4xl leading-[1.1] font-thin text-black">{cardData.title}</h2>
            </div>
            <div className="text-base sm:text-lg md:text-xl lg:text-2xl leading-[1.1] font-thin text-pinto-gray-4">
              {cardData.subtitle}
            </div>
          </div>

          {/* Definition section */}
          <div className="text-base sm:text-xl md:text-2xl lg:text-3xl leading-[1.2] font-thin text-black prose prose-neutral max-w-none prose-strong:font-bold flex-shrink-0">
            <Markdown>{cardData.definition}</Markdown>
          </div>

          {/* Description section - fills remaining space with scroll */}
          <div className="flex-1 min-h-0 relative">
            <div className="text-sm sm:text-lg prose-p:leading-[1.3] prose-a:text-pinto-green-4 hover:prose-a:text-pinto-green-2 prose-a:transition-all prose-a:duration-300 prose-a:after:content-['↗'] prose-a:after:ml-1 prose-a:after:inline-block font-thin text-black overflow-y-auto h-full prose prose-neutral max-w-none prose-h2:font-normal prose-h2:sm:text-lg prose-h2:text-sm prose-h2:text-pinto-gray-4 prose-img:inline prose-img:w-6 prose-img:h-6 prose-img:mx-1 prose-img:align-text-top prose-img:translate-y-1 prose-img:!my-0 prose-img:!py-0 prose-ul:!mt-4 prose-ul:!mb-4 prose-ul:!py-0 prose-li:!my-2 prose-li:!py-0 prose-p:!mb-4 prose-p:first:!mt-0 prose-p:last:!mb-0 p-2">
              <Markdown>{cardData.description}</Markdown>
            </div>
            {/* Fade overlay at top of description */}
            <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-pinto-off-white to-transparent pointer-events-none" />
            {/* Fade overlay at bottom of description */}
            <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-pinto-off-white to-transparent pointer-events-none" />
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
