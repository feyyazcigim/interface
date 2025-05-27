import { Col, Row } from "@/components/Container";
import Navbar, { navLinks } from "@/components/nav/nav/Navbar";
import GradientBox from "@/components/ui/GradientBox";
import { getIsWindowScaledDown, useWindowDimensions } from "@/hooks/display/useDimensions";
import { navbarPanelAtom } from "@/state/app/navBar.atoms";
import { stringEq } from "@/utils/string";
import { cn } from "@/utils/utils";
import { ExternalLinkIcon } from "@radix-ui/react-icons";
import { motion } from "framer-motion";
import { useAtomValue } from "jotai";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";

const TourOfTheFarmTab = ({ onClick }: { onClick: () => void }) => {
  return (
    // overflow-visible to allow rotated content to overflow perpendicularly
    <div className="relative overflow-visible z-[4]" onClick={onClick}>
      {/**
       * Rotate Wrapper. Position absolute otherwise DOM will think the layout is not rotated.
       * top 5.65rem to offset rotation and center
       * left -2.75rem to offset the tab's width
       */}
      <div className={cn("absolute rotate-[-90deg] origin-top-left -left-[2.5rem]", "top-[5.65rem]")}>
        <GradientBox rounded={cornerRadius} animate>
          <div className="pinto-body-bold whitespace-nowrap px-4 py-2">Tour of the Farm</div>
        </GradientBox>
      </div>
    </div>
  );
};

// make stable reference to rounded prop
const cornerRadius = { tl: "sm", tr: "sm" } as const;

// ────────────────────────────────────────────────────────────────────────────────

export const TourOfTheFarmCard = ({ url, img, title }: IPost) => {
  return (
    <div
      className={cn(
        "w-96 max-w-96 border-[0.5px] max-h-10 h-10 border-pinto-lighter rounded-sm overflow-hidden group",
        "transition-all duration-200 group hover:border-pinto-green-4 hover:shadow-gray-200 hover:shadow-md box-border",
      )}
    >
      <Link to={url} target="_blank" rel="noopener noreferrer" className="w-full h-full">
        <Row className="items-center">
          <img src={img} alt={title} className="max-h-10 h-10 object-cover" />
          <Row className="items-center justify-between w-full px-2 group-hover:bg-pinto-green-1 rounded-b-sm transition-colors duration-200 self-stretch box-border">
            <div className="pinto-sm box-border text-left flex-wrap p-2">{title}</div>
            <ExternalLinkIcon
              color="currentColor"
              className="w-4 h-4 group-hover:text-pinto-green-4 transition-colors duration-200"
            />
          </Row>
        </Row>
      </Link>
    </div>
  );
};

// make stable reference to rounded prop
const contentCornerRadius = { tl: "sm", bl: "sm" } as const;

// ────────────────────────────────────────────────────────────────────────────────

const TourOfTheFarmSuggestionCard = ({ title, img, url }: IPost) => {
  return (
    <Link
      to={url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "flex flex-col w-96 max-w-96 rounded-sm border-[0.5px] border-pinto-lighter group overflow-hidden",
        "transition-all duration-200 group hover:border-pinto-green-4 hover:shadow-gray-200 hover:shadow-md box-border",
      )}
    >
      <img src={img} alt={title} className="h-[12.5rem] object-cover" />
      <Row className="box-border gap-2 p-3 justify-between items-start group-hover:bg-pinto-green-1 rounded-b-sm transition-colors duration-200">
        <div className="pinto-sm box-border text-left group-hover:text-pinto-green-4 transition-colors duration-200 ">
          {title}
        </div>
        <ExternalLinkIcon
          color="currentColor"
          className="w-4 h-4 self-start group-hover:text-pinto-green-4 transition-colors duration-200 "
        />
      </Row>
    </Link>
  );
};

const tourOfTheFarmOpenX = "-26rem";
const tourOfTheFarmClosedX = "0rem";

const motionSettings = {
  initial: { x: tourOfTheFarmClosedX, y: "-35%" },
  transition: { stiffness: 70, duration: 0.15, ease: "easeInOut" },
} as const;

const VW_SCALAR = 0.75;
const CONDENSED_OFFSET = 700;

const getDisplayCard = () => {
  const scalar = getIsWindowScaledDown(window.innerWidth) ? VW_SCALAR : 1;
  return window.innerHeight >= CONDENSED_OFFSET * scalar;
};

const useShowSuggestion = () => {
  // tab is flipped 90 deg so use width instead of height
  const windowDimensions = useWindowDimensions();

  const [display, setDisplay] = useState(getDisplayCard());

  // biome-ignore lint/correctness/useExhaustiveDependencies: update display on window resize
  useEffect(() => {
    setDisplay(getDisplayCard());
  }, [windowDimensions]);

  return display;
};

function useClickAway(active: boolean, ref: React.RefObject<HTMLDivElement>, callback: () => void) {
  useEffect(() => {
    if (!active) return;
    function handleClick(event: MouseEvent) {
      // prevent click away if clicking on navbar
      const navBar = document.getElementById("pinto-navbar");
      if (!navBar) return;

      const navBarRect = navBar.getBoundingClientRect();
      const clickY = event.clientY;

      // Only trigger if click is below navbar and not in the ref element
      if (clickY > navBarRect.bottom && ref.current && !ref.current.contains(event.target as Node)) {
        callback();
      }
    }

    document.addEventListener("mousedown", handleClick);

    return () => document.removeEventListener("mousedown", handleClick);
  }, [callback, ref, active]);
}

export default function TourOfTheFarm() {
  const tourOfTheFarmRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const [activeFinished, setActiveFinished] = useState(false);
  const isPanelOpen = usePanelOpenState();

  const showSuggestion = useShowSuggestion();

  const suggested = useSuggestedContentWithSlug();

  const handleClickAway = useCallback(() => setActive(false), []);

  useClickAway(active, tourOfTheFarmRef, handleClickAway);

  const handleToggle = () => setActive((ac) => !ac);

  const handleOnAnimationComplete = () => {
    if (active) return;
    setActiveFinished(true);
  };

  const handleOnAnimationStart = () => {
    if (!active) return;
    setActiveFinished(false);
  };

  return (
    <div className="">
      <motion.div
        animate={{
          x: active ? tourOfTheFarmOpenX : tourOfTheFarmClosedX,
        }}
        {...motionSettings}
        onAnimationComplete={handleOnAnimationComplete}
        onAnimationStart={handleOnAnimationStart}
        ref={tourOfTheFarmRef}
        className={cn(
          "hidden sm:flex fixed -bottom-0 -right-[25.875rem] w-max origin-bottom-right z-[3]",
          // hide if panel is open to prevent unexpected z-index clashes
          isPanelOpen && "sm:hidden",
        )}
      >
        <Row className="relative gap-0">
          <div className="cursor-pointer z-[4]">
            <TourOfTheFarmTab onClick={handleToggle} />
          </div>
          <div className="relative">
            <GradientBox animate={false} rounded={contentCornerRadius}>
              <Col className="gap-3 p-4 z-[2]">
                <Row className="justify-between items-center">
                  <div className="pinto-body-bold cursor-default">Looking For More Material?</div>
                  <Link
                    to={navLinks.blog}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="pinto-sm w-fit text-pinto-green-4 text-right hover:underline pr-2"
                  >
                    Visit Blog
                  </Link>
                </Row>
                {showSuggestion && <TourOfTheFarmSuggestionCard {...suggested} />}
                {getSortedPosts(suggested).map(([key, post], i) => {
                  // if display is false, we don't want to show the suggested card
                  if (showSuggestion && stringEq(post.title, suggested.title)) {
                    return null;
                  }

                  return <TourOfTheFarmCard key={`tour-of-the-farm-${key}-${i.toString()}`} {...post} />;
                })}
              </Col>
            </GradientBox>
            {/*
             * Overlay the Gradient Box w/ bg color when not active & the animation has finished.
             * This is to prevent the content box from being visible on fast window width resizes.
             */}
            {!active && activeFinished && (
              <div className="absolute bg-gradient-light -inset-[0.125rem] rounded-sm h-[calc(100%+0.25rem)] w-[calc(100%+0.25rem)] z-[2]" />
            )}
          </div>
        </Row>
      </motion.div>
    </div>
  );
}

const getSortedPosts = (suggested: IPost) => {
  // bubble up the suggested post to the top
  return [...Object.entries(POSTS)].sort(([keyA], [keyB]) => {
    if (!suggested) return 0;
    if (suggested && stringEq(keyA, suggested.title)) return -1;
    if (suggested && stringEq(keyB, suggested.title)) return 1;
    return 0;
  });
};

// ────────────────────────────────────────────────────────────────────────────────
// Helper Functions & Constants
// ────────────────────────────────────────────────────────────────────────────────

// Make stable boolean reference to the panel open state
const usePanelOpenState = () => useAtomValue(navbarPanelAtom).openPanel;

const getSuggestedWithSlug = (slug: string | undefined) => POSTS[slug === "field" ? "field" : "silo"];

const useSuggestedContentWithSlug = () => {
  const { pathname } = useLocation();
  const split = pathname.split("/");

  const slug = split.length === 1 ? undefined : split[1];

  const [suggested, setSuggested] = useState<IPost>(getSuggestedWithSlug(slug));

  useEffect(() => {
    setSuggested(getSuggestedWithSlug(slug));
  }, [slug]);

  return suggested;
};

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
