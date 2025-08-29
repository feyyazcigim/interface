import { PintoRightArrow } from "@/components/Icons";
import AuditsList from "@/components/landing/AuditsList";
import BugBounty from "@/components/landing/BugBounty";
import FarmToTable from "@/components/landing/FarmToTable";
import LandingChart from "@/components/landing/LandingChart";
import ProjectStats from "@/components/landing/ProjectStats";
import Resources from "@/components/landing/Resources";
import SecondaryCTA from "@/components/landing/SecondaryCTA";
import SecondaryCTAProperties from "@/components/landing/SecondaryCTAProperties";
import SecondaryCTAValues from "@/components/landing/SecondaryCTAValues";
import { navLinks } from "@/components/nav/nav/Navbar";
import { Button } from "@/components/ui/Button";
import useIsMobile from "@/hooks/display/useIsMobile";
import { WheelEvent, useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

interface GlowingCard {
  component: "values" | "properties";
  cardIndex: number;
}

export default function Landing() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const isMobile = useIsMobile();
  const [currentTriggerPhase, setCurrentTriggerPhase] = useState<string | undefined>(undefined);
  const [reachedMainCta, setReachedMainCta] = useState<boolean>(false);
  const [isAtTop, setIsAtTop] = useState<boolean>(true); // Track if scroll is at very top
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isScrollingRef = useRef(false);
  const lastSnappedSectionRef = useRef<Element | null>(null);

  // Glow effect state management
  const [glowingCard, setGlowingCard] = useState<GlowingCard | null>(null);
  const glowTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Track first-time visitor status
  const [isFirstTimeVisitor, setIsFirstTimeVisitor] = useState<boolean>(false);
  const [sectionsVisible, setSectionsVisible] = useState<boolean>(true); // Default to visible
  const scrollAttemptCountRef = useRef(0);

  // Constants for glow effect
  const GLOW_DURATION = 2000; // 2 second glow
  const GAP_DURATION = 1500; // 1 second gap with no glow
  const TOTAL_CYCLE_TIME = GLOW_DURATION + GAP_DURATION; // 3 seconds total
  const TOTAL_VALUES_CARDS = 5; // Number of cards in SecondaryCTAValues
  const TOTAL_PROPERTIES_CARDS = 4; // Number of cards in SecondaryCTAProperties

  // Flip-flop selection logic with center-weighted preference for better visibility
  const selectRandomCard = useCallback(
    (currentCard: GlowingCard | null): GlowingCard => {
      // Determine which component to use next (flip-flop between values and properties)
      const nextComponent: "values" | "properties" = currentCard?.component === "values" ? "properties" : "values";

      // Get the appropriate card count for the next component
      const cardCount = nextComponent === "values" ? TOTAL_VALUES_CARDS : TOTAL_PROPERTIES_CARDS;

      // HEAVILY center-weighted selection - strongly prefer middle cards for visibility
      const centerIndex = Math.floor(cardCount / 2);

      // Heavily weighted random: 85% chance for center area, 15% for any card
      let selectedIndex: number;
      if (Math.random() < 0.85) {
        // Always select from center area (±1 from center for all card counts)
        const centerStart = Math.max(0, centerIndex - 1);
        const centerEnd = Math.min(cardCount - 1, centerIndex + 1);
        selectedIndex = centerStart + Math.floor(Math.random() * (centerEnd - centerStart + 1));
      } else {
        // 15% chance: select any card (including outer cards)
        selectedIndex = Math.floor(Math.random() * cardCount);
      }

      return {
        component: nextComponent,
        cardIndex: selectedIndex,
      };
    },
    [TOTAL_VALUES_CARDS, TOTAL_PROPERTIES_CARDS],
  );

  // Check if user is a first-time visitor
  useEffect(() => {
    const hasVisited = localStorage.getItem("pinto-has-visited");
    if (!hasVisited) {
      setIsFirstTimeVisitor(true);
      setSectionsVisible(false); // Hide sections for first-time visitors
      localStorage.setItem("pinto-has-visited", "true");
    }
    // For returning visitors, sectionsVisible remains true by default
  }, []);

  // Trigger bottom cta once we reach mainCTA for the first time
  useEffect(() => {
    if (currentTriggerPhase === "mainCTA" && !reachedMainCta) {
      setReachedMainCta(true);
    }
  }, [currentTriggerPhase, reachedMainCta]);

  // Show sections when mainCTA phase is reached for first-time visitors
  useEffect(() => {
    if (isFirstTimeVisitor && currentTriggerPhase === "mainCTA" && !sectionsVisible) {
      setSectionsVisible(true);
    }
  }, [isFirstTimeVisitor, currentTriggerPhase, sectionsVisible]);

  // Glow effect timer - start when sections become visible
  useEffect(() => {
    if (!sectionsVisible) return;

    let currentGlowingCard: GlowingCard | null = null;
    let mainInterval: NodeJS.Timeout | null = null;
    let glowClearTimeout: NodeJS.Timeout | null = null;

    const runGlowCycle = () => {
      // Start glow phase - select next card
      currentGlowingCard = selectRandomCard(currentGlowingCard);
      setGlowingCard(currentGlowingCard);

      // Clear glow after GLOW_DURATION
      glowClearTimeout = setTimeout(() => {
        setGlowingCard(null);
      }, GLOW_DURATION);
    };

    // Start immediately with first glow
    runGlowCycle();

    // Set up recurring cycle (glow + gap = total cycle time)
    mainInterval = setInterval(runGlowCycle, TOTAL_CYCLE_TIME);

    // Store reference for cleanup
    glowTimerRef.current = mainInterval;

    // Cleanup function
    return () => {
      if (mainInterval) {
        clearInterval(mainInterval);
        mainInterval = null;
      }
      if (glowClearTimeout) {
        clearTimeout(glowClearTimeout);
        glowClearTimeout = null;
      }
      if (glowTimerRef.current) {
        clearInterval(glowTimerRef.current);
        glowTimerRef.current = null;
      }
      setGlowingCard(null);
    };
  }, [sectionsVisible, selectRandomCard, GLOW_DURATION, TOTAL_CYCLE_TIME]);

  // Initialize lastSnappedSectionRef to first section on mount
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      const sections = scrollContainer.querySelectorAll("section");
      if (sections.length > 0) {
        lastSnappedSectionRef.current = sections[0];
      }
    }
  }, [sectionsVisible]);

  // Scroll snapping functionality
  const snapToNearestSection = useCallback(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer || isScrollingRef.current) return;

    const sections = scrollContainer.querySelectorAll("section");
    if (sections.length === 0) return;

    const viewportHeight = window.innerHeight;
    const currentScrollTop = scrollContainer.scrollTop;
    const _containerHeight = scrollContainer.scrollHeight;

    // Check if we're currently in the Resources section (last section)
    const resourcesSection = sections[sections.length - 1] as HTMLElement;
    const resourcesSectionTop = resourcesSection.offsetTop;
    const resourcesSectionBottom = resourcesSectionTop + resourcesSection.offsetHeight;
    const viewportTop = currentScrollTop;
    const viewportBottom = currentScrollTop + viewportHeight;

    // If we're within the Resources section, disable snapping
    if (viewportTop >= resourcesSectionTop - 100 && viewportBottom <= resourcesSectionBottom + 100) {
      return;
    }

    let nearestSection: Element | null = null;
    let smallestDistance = Infinity;

    sections.forEach((section, _index) => {
      const sectionTop = (section as HTMLElement).offsetTop;

      // All sections use top alignment
      const targetPoint = sectionTop;
      const viewportReference = currentScrollTop;

      const distance = Math.abs(targetPoint - viewportReference);

      if (distance < smallestDistance) {
        smallestDistance = distance;
        nearestSection = section;
      }
    });

    if (nearestSection) {
      const sectionTop = (nearestSection as HTMLElement).offsetTop;
      const firstSection = sections[0] as HTMLElement;
      const isNearestSectionFirst = nearestSection === firstSection;

      const wasLastSnappedFirst = lastSnappedSectionRef.current === firstSection;

      // Prevent snapping from first section to first section
      if (isNearestSectionFirst && wasLastSnappedFirst) {
        return;
      }

      // All sections snap to top alignment
      const targetScrollTop = sectionTop;

      // Only snap if we're not already close to the target
      const currentDistance = Math.abs(currentScrollTop - targetScrollTop);
      if (currentDistance > 50) {
        isScrollingRef.current = true;
        lastSnappedSectionRef.current = nearestSection;
        scrollContainer.scrollTo({
          top: targetScrollTop,
          behavior: "smooth",
        });

        // Reset scrolling flag after animation completes
        setTimeout(() => {
          isScrollingRef.current = false;
        }, 800);
      }
    }
  }, []);

  const handleScrollEnd = useCallback(() => {
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    scrollTimeoutRef.current = setTimeout(() => {
      snapToNearestSection();
    }, 150); // Wait 150ms after scroll stops
  }, [snapToNearestSection]);

  // Track scroll position to determine if at top
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const handleScroll = () => {
      // If sections are not visible, ignore all scroll events
      if (!sectionsVisible) {
        return;
      }

      const currentScrollTop = scrollContainer.scrollTop;
      const halfScreenHeight = window.innerHeight / 2;
      setIsAtTop(currentScrollTop < halfScreenHeight);

      // Trigger scroll end detection
      handleScrollEnd();
    };

    const handleScrollAttempt = () => {
      if (!sectionsVisible) {
        scrollAttemptCountRef.current += 1;

        // Enable scrolling after 2 attempts
        if (scrollAttemptCountRef.current > 2) {
          setSectionsVisible(true);
          setReachedMainCta(true);
        }
      }
    };

    const handleWheel = (_e: globalThis.WheelEvent) => {
      handleScrollAttempt();
    };

    const handleTouchStart = (_e: globalThis.TouchEvent) => {
      handleScrollAttempt();
    };

    scrollContainer.addEventListener("scroll", handleScroll, { passive: true });
    scrollContainer.addEventListener("wheel", handleWheel, { passive: true });
    scrollContainer.addEventListener("touchstart", handleTouchStart, { passive: true });

    // Check initial position
    handleScroll();

    return () => {
      scrollContainer.removeEventListener("scroll", handleScroll);
      scrollContainer.removeEventListener("wheel", handleWheel);
      scrollContainer.removeEventListener("touchstart", handleTouchStart);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [handleScrollEnd, sectionsVisible]);

  const handleWheel = (e: WheelEvent<HTMLAnchorElement>) => {
    e.stopPropagation();
    document.body.scrollTop += e.deltaY;
  };

  const handleArrowClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    // Find the next section to scroll to
    const viewportHeight = window.innerHeight;

    scrollContainer.scrollTo({
      top: viewportHeight,
      behavior: "smooth",
    });
  };

  return (
    <div
      className="sm:max-w-[1920px] w-full place-self-center"
      style={{
        mask: "linear-gradient(to right, transparent, white 2%, white 98%, transparent)",
        WebkitMask: "linear-gradient(to right, transparent, white 2%, white 98%, transparent)",
      }}
    >
      <div
        className={`flex flex-col h-screen ${sectionsVisible ? "overflow-y-auto overflow-scroll" : "overflow-hidden"}`}
        data-scroll-container="true"
        ref={scrollContainerRef}
      >
        <section className="flex flex-col overflow-clip place-content-center min-h-screen">
          <LandingChart currentTriggerPhase={currentTriggerPhase} setCurrentTriggerPhase={setCurrentTriggerPhase} />
        </section>
        <section className="flex flex-col overflow-clip place-content-center gap-4 min-h-screen">
          <div className="mb-[2.5%]">
            <SecondaryCTAValues glowingCardIndex={glowingCard?.component === "values" ? glowingCard.cardIndex : -1} />
            <SecondaryCTA />
            <SecondaryCTAProperties
              glowingCardIndex={glowingCard?.component === "properties" ? glowingCard.cardIndex : -1}
            />
          </div>
        </section>
        <section className="flex flex-col overflow-clip place-content-center min-h-screen">
          <ProjectStats />
        </section>
        <section className="flex flex-col overflow-clip place-content-center min-h-screen">
          <BugBounty />
          {/* 
            <AuditsList />
            */}
        </section>
        <section className="flex flex-col overflow-clip place-content-center h-fit sm:h-screen">
          <Resources />
        </section>
      </div>
      <Link
        to={isAtTop && reachedMainCta ? "" : navLinks.overview}
        onWheelCapture={handleWheel}
        onClick={isAtTop && reachedMainCta ? handleArrowClick : undefined}
        className={`z-20`}
      >
        <div
          className={`fixed left-1/2 -translate-x-1/2 flex z-20 justify-center ${
            reachedMainCta ? "bottom-[3%]" : "-bottom-28"
          } transition-all duration-500 ease-in-out`}
        >
          <Button
            rounded="full"
            size={"md"}
            className={`scale-150 md:scale-100 2xl:scale-150 z-20 hover:bg-pinto-green-4 hover:brightness-125 transition-all [transition:transform_300ms_cubic-bezier(0.4,0,0.2,1)] ease-in-out flex flex-row gap-2 items-center relative overflow-hidden !font-[340] !tracking-[-0.025rem]`}
            shimmer={true}
            glow={true}
          >
            {/* Conditionally show text based on scroll position */}
            <span
              className={`relative transition-opacity ${isAtTop && reachedMainCta ? "w-0 opacity-0 -ml-2 text-pinto-green-4" : "w-auto opacity-100 ml-0 text-white"}`}
            >
              Join the Farm
            </span>
            <div
              className={`relative transition-transform transform duration-300 ${
                isAtTop && reachedMainCta ? `rotate-90 ${!isMobile ? "-mx-1" : ""}` : "rotate-0"
              }`}
              style={{ isolation: "isolate" }}
            >
              <PintoRightArrow width={"1.25rem"} height={"1.25rem"} className="transition-all" />
            </div>
          </Button>
        </div>
      </Link>
    </div>
  );
}
