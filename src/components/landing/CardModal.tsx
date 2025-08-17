import { Dialog, DialogContent, DialogOverlay } from "@/components/ui/Dialog";
import { cn } from "@/utils/utils";
import { motion } from "framer-motion";
import React from "react";

interface CardData {
  logo: string;
  title: string;
  description: string;
  definition: string;
  pintoImplementation: string;
  partOfSpeech: string;
  pronunciation: string;
}

interface CardModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  cardData: CardData | null;
}

export default function CardModal({ isOpen, onOpenChange, cardData }: CardModalProps) {
  if (!cardData) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogOverlay className="bg-white/30 backdrop-blur-md" />
      <DialogContent
        className={cn(
          "w-[90vw] h-[60vh] sm:w-[60rem] sm:h-[35rem]",
          "max-w-none",
          "border border-gray-200 rounded-2xl shadow-2xl",
          "bg-pinto-off-white",
          "p-6 sm:p-10",
          "focus:outline-none focus:ring-0 focus:border-gray-200",
        )}
        hideCloseButton={true}
      >
        <motion.div
          className="flex flex-col gap-6 sm:gap-10 h-full"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{
            duration: 0.3,
            ease: [0.16, 1, 0.3, 1], // Custom ease for smooth feel
          }}
        >
          <div className="flex justify-center sm:justify-start">
            <img src={cardData.logo} className="w-20 h-20 sm:w-32 sm:h-32 flex-shrink-0" alt={cardData.title} />
          </div>

          <div className="flex flex-col gap-4 sm:gap-6 flex-1">
            {/* Dictionary entry header */}
            <div className="flex flex-col gap-3 sm:gap-4">
              {/* Word + Part of Speech */}
              <div className="flex items-baseline gap-2 sm:gap-4">
                <h2 className="text-lg sm:text-3xl leading-[1.1] font-thin text-black">{cardData.title}</h2>
                <span className="text-xs sm:text-base italic text-pinto-gray-4 font-light">
                  {cardData.partOfSpeech}
                </span>
              </div>

              {/* IPA Pronunciation */}
              <div className="text-sm sm:text-lg text-pinto-gray-4 font-mono">/{cardData.pronunciation}/</div>
            </div>

            {/* Dictionary-style definition section */}
            <div className="flex flex-col gap-6 sm:gap-8">
              {/* General Definition (no header needed) */}
              <div className="flex flex-col gap-2 sm:gap-3">
                <p className="text-sm sm:text-xl leading-[1.3] font-thin text-pinto-gray-4">{cardData.definition}</p>
              </div>

              {/* Pinto Implementation */}
              <div className="flex flex-col gap-2 sm:gap-3">
                <p className="text-base sm:text-2xl leading-[1.3] font-thin text-black">
                  {cardData.pintoImplementation}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
