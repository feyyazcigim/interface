import { Dialog, DialogContent, DialogOverlay } from "@/components/ui/Dialog";
import { cn } from "@/utils/utils";
import { motion } from "framer-motion";
import React from "react";
import Markdown from "react-markdown";

interface CardData {
  logo: string;
  title: string;
  subtitle: string;
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
          className="flex flex-col gap-6 sm:gap-10 h-full min-h-0"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{
            duration: 0.3,
            ease: [0.16, 1, 0.3, 1], // Custom ease for smooth feel
          }}
        >
          {/* Header section - fixed height */}
          <div className="flex flex-row gap-4 flex-shrink-0">
            <div>
              <div className="flex flex-row gap-4 sm:gap-6 flex-1">
                <div className="flex flex-col gap-4">
                  <div className="flex justify-start">
                    <img src={cardData.logo} className="w-20 h-20 sm:w-32 sm:h-32 flex-shrink-0" alt={cardData.title} />
                  </div>
                  <h2 className="text-lg sm:text-3xl leading-[1.1] font-thin text-black">{cardData.title}</h2>
                </div>
              </div>
            </div>
          </div>

          {/* Description section - fills remaining space */}
          <div className="flex flex-col gap-2 sm:gap-3 flex-1 min-h-0">
            <div className="text-base sm:text-lg prose-p:leading-[1.1] prose-a:text-pinto-green-4 hover:prose-a:text-pinto-green-2 prose-a:transition-all prose-a:duration-300 prose-a:after:content-['↗'] prose-a:after:ml-1 prose-a:after:inline-block font-thin text-black overflow-y-auto h-full prose prose-neutral max-w-none prose-h2:font-normal prose-h2:sm:text-lg prose-h2:text-sm prose-h2:text-pinto-gray-4">
              <Markdown>{cardData.description}</Markdown>
            </div>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
