import GradientBox from "@/components/ui/GradientBox";
import { navbarPanelAtom } from "@/state/app/navBar.atoms";
import { cn } from "@/utils/utils";
import { ChevronDownIcon, ExternalLinkIcon } from "@radix-ui/react-icons";
import { AnimatePresence, motion } from "framer-motion";
import { useAtomValue } from "jotai";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Col, Row } from "./Container";
import { navLinks } from "./nav/nav/Navbar";
import { Accordion } from "./ui/Accordion";

const slugsWithContent = new Set(["silo", "field"]);

/**
 * Dimensions = 192.8px x 38px (width x height)
 *
 * Because this component is rotated -90 deg, we need to calculate the amount of negative margin to offset the secondary component
 *
 * We calculate this by (width - height) / 2
 *
 * = (192.8px - 38px) / 2 = 77.4px
 * => to REM = 4.8375rem
 */

const TourOfTheFarmTab = ({ onClick }: { onClick: () => void }) => {
  const isPanelOpen = usePanelOpenState();

  // if the panel is open, don't render the component to prevent unexpected z-index clashes
  if (isPanelOpen) {
    return null;
  }

  return (
    <div className="rotate-[-90deg] z-[3]" onClick={onClick}>
      <GradientBox rounded={cornerRadius} animate>
        <div className="pinto-body-bold whitespace-nowrap px-4 py-2">Tour of the Farm</div>
      </GradientBox>
    </div>
  );
};

export const TourOfTheFarmCard = ({ url, img, title }: IPost) => {
  return (
    <div
      className={cn(
        "w-[25rem] max-w-[25rem] border-[0.5px] border-pinto-light rounded-sm overflow-hidden group",
        "transition-all duration-200 group hover:border-pinto-green-4 hover:shadow-gray-200 hover:shadow-md box-border",
      )}
    >
      <Link to={url} target="_blank" rel="noopener noreferrer" className="w-full h-full">
        <Row className="items-center">
          <div className="aspect-[3/2]">
            <img src={img} alt={title} className="min-w-[5rem] w-[5rem] max-w-[5rem] h-auto object-contain" />
          </div>
          <Row className="items-center justify-between w-full px-4 group-hover:bg-pinto-green-1 rounded-b-sm transition-colors duration-200 self-stretch">
            <div className="pinto-sm font-medium box-border text-left flex-wrap p-2">{title}</div>
            <ExternalLinkIcon
              color="currentColor"
              className="w-5 h-5 group-hover:text-pinto-green-4 transition-colors duration-200"
            />
          </Row>
        </Row>
      </Link>
    </div>
  );
};

const useContentWithSlug = (): keyof typeof POSTS | undefined => {
  const { pathname } = useLocation();
  const split = pathname.split("/");

  const slug = split.length === 1 ? undefined : split[1];

  if (slug && slug in slugsWithContent) {
    return slug as keyof typeof POSTS;
  }

  return undefined;
};

const TourOfTheFarmSuggestionCard = ({ title, img, url }: IPost) => {
  return (
    <Link
      to={url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "flex flex-col w-[25rem] max-w-[25rem] rounded-sm border-[1px] border-pinto-light group overflow-hidden",
        "transition-all duration-200 group hover:border-pinto-green-4 hover:shadow-gray-200 hover:shadow-md box-border",
      )}
    >
      <img src={img} alt={title} className="w-[25rem] h-[12.5rem] object-cover" />
      <Row className="box-border gap-2 px-3 py-4 justify-between items-start group-hover:bg-pinto-green-1 rounded-b-sm transition-colors duration-200">
        <div className="pinto-body font-medium box-border text-left group-hover:text-pinto-green-4 transition-colors duration-200 ">
          {title}
        </div>
        <ExternalLinkIcon
          color="currentColor"
          className="w-6 h-6 self-start group-hover:text-pinto-green-4 transition-colors duration-200 "
        />
      </Row>
    </Link>
  );
};

const start = "3.75rem";
const end = "31.25rem";

const motionSettings = {
  transition: { stiffness: 70, duration: 0.3, ease: "easeInOut" },
} as const;

export default function TourOfTheFarm() {
  const [active, setActive] = useState(false);

  return (
    <>
      <Row
        className={cn(
          "hidden sm:block fixed right-0 top-[10rem] translate-y-1/2 w-max origin-bottom-right z-[3] max-h-screen",
        )}
      >
        <AnimatePresence mode="wait">
          <motion.div animate={{ x: !active ? end : start }} initial={{ x: end }} {...motionSettings}>
            <Row className="relative gap-0">
              <div className="cursor-pointer">
                <TourOfTheFarmTab onClick={() => setActive((ac) => !ac)} />
              </div>
              <div className="relative -left-[4rem]">
                <GradientBox animate={false} rounded={{ tl: true, bl: true }}>
                  <Col className="gap-3 p-4">
                    <div className="pinto-body-bold cursor-default">Looking For More Material?</div>
                    <TourOfTheFarmSuggestionCard {...POSTS.silo} />
                    {Object.entries(POSTS).map(([key, post], i) => {
                      if (key === "silo") return null;
                      return <TourOfTheFarmCard key={`tour-of-the-farm-${key}-${i}`} {...post} />;
                    })}
                  <Link
                    to={navLinks.blog}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full pinto-sm text-pinto-secondary text-right hover:underline hover:text-pinto-green-4 pr-2"
                  >
                    Visit Blog
                  </Link>
                  </Col>
                </GradientBox>
              </div>
            </Row>
          </motion.div>
        </AnimatePresence>
      </Row>
    </>
  );
}

// ────────────────────────────────────────────────────────────────────────────────
// Helper Functions & Constants
// ────────────────────────────────────────────────────────────────────────────────

// Make stable boolean reference to the panel open state
const usePanelOpenState = () => useAtomValue(navbarPanelAtom).openPanel;

// make stable reference to rounded prop
const cornerRadius = {
  tl: true,
  tr: true,
} as const;

// ────────────────────────────────────────────────────────────────────────────────
// Interface
// ────────────────────────────────────────────────────────────────────────────────

interface IPost {
  url: string;
  img: string;
  title: string;
}

const POSTS: {
  silo: IPost;
  field: IPost;
  sun: IPost;
} = {
  silo: {
    url: "https://mirror.xyz/0xEA13D1fB14934E41Ee7074198af8F089a6d956B5/GCyB1WmkKI6YB4j-HEZa7TfeIUNCfr2QXqvMYbxKB2k",
    title: "Understanding the Silo",
    img: "https://images.mirror-media.xyz/publication-images/vTTP5AxogZN1LzGc039Db.jpeg",
  },
  field: {
    url: "https://mirror.xyz/0xEA13D1fB14934E41Ee7074198af8F089a6d956B5/wdRHVI5mzDxMOp3BxKkZBS8m9BbrmWVPYd7dbPI6EMI",
    title: "Understanding the Field",
    img: "https://images.mirror-media.xyz/publication-images/TYI1sz-fdcz1H46ypaLZB.png?height=1130&width=2259",
  },
  sun: {
    url: "https://mirror.xyz/0xEA13D1fB14934E41Ee7074198af8F089a6d956B5/HObFHK3WL2ajHZmGwiuEJy-XWLypvxd41ilG6kRRF0o",
    title: "Sunrise and Parameterization",
    img: "https://images.mirror-media.xyz/publication-images/1waB-4RrTrZ9sx5UiLpUy.png?height=768&width=1536",
  },
} as const;
