import { PintoRightArrow } from "@/components/Icons";
import AuditsList from "@/components/landing/AuditsList";
import BugBounty from "@/components/landing/BugBounty";
import FarmToTable from "@/components/landing/FarmToTable";
import LandingChart from "@/components/landing/LandingChart";
import ProjectStats from "@/components/landing/ProjectStats";
import Resources from "@/components/landing/Resources";
import SecondaryCTA from "@/components/landing/SecondaryCTA";
import { navLinks } from "@/components/nav/nav/Navbar";
import { Button } from "@/components/ui/Button";
import useIsMobile from "@/hooks/display/useIsMobile";
import { WheelEvent, useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

export default function Landing() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const isMobile = useIsMobile();
  const [currentTriggerPhase, setCurrentTriggerPhase] = useState<string | undefined>(undefined);
  const [reachedMainCta, setReachedMainCta] = useState<boolean>(false);
  const [isAtTop, setIsAtTop] = useState<boolean>(true); // Track if scroll is at very top
  const [isInLastSection, setIsInLastSection] = useState<boolean>(false); // Track if in last section
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isScrollingRef = useRef(false);
  const lastSnappedSectionRef = useRef<Element | null>(null);

  // Track first-time visitor status
  const [isFirstTimeVisitor, setIsFirstTimeVisitor] = useState<boolean>(false);
  const [sectionsVisible, setSectionsVisible] = useState<boolean>(true); // Default to visible
  const scrollAttemptCountRef = useRef(0);

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

      // Calculate target scroll position
      let targetScrollTop = sectionTop;

      // Adjust for CTA button spaces when they are visible
      if (reachedMainCta) {
        const sectionIndex = Array.from(sections).indexOf(nearestSection);
        const isResourcesSection = sectionIndex === sections.length - 1;

        // Calculate CTA button spaces
        const topCtaSpace = viewportHeight * 0.02; // 2% + button height
        const bottomCtaSpace = viewportHeight * 0.01 + 32; // 1% + button height

        if (!isResourcesSection) {
          // For all sections except Resources: center content between both CTAs
          const ctaOffset = topCtaSpace; // Adjust for CTA size
          targetScrollTop = sectionTop - ctaOffset;
        }
        // Resources section: no adjustment needed as CTAs are typically hidden
      }

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
  }, [isMobile, reachedMainCta]);

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

      // Check if in last section
      const sections = scrollContainer.querySelectorAll("section");
      if (sections.length > 0) {
        const lastSection = sections[sections.length - 1] as HTMLElement;
        const lastSectionTop = lastSection.offsetTop;
        const viewportHeight = window.innerHeight;
        const isInLast = currentScrollTop >= lastSectionTop - viewportHeight / 2;
        setIsInLastSection(isInLast);
      }

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

    const handleTouchEnd = (_e: globalThis.TouchEvent) => {
      handleScrollAttempt();
    };

    scrollContainer.addEventListener("scroll", handleScroll, { passive: true });
    scrollContainer.addEventListener("wheel", handleWheel, { passive: true });
    scrollContainer.addEventListener("touchend", handleTouchEnd, { passive: true });

    // Check initial position
    handleScroll();

    return () => {
      scrollContainer.removeEventListener("scroll", handleScroll);
      scrollContainer.removeEventListener("wheel", handleWheel);
      scrollContainer.removeEventListener("touchend", handleTouchEnd);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [handleScrollEnd, sectionsVisible]);

  const handleWheel = (e: WheelEvent<HTMLElement>) => {
    e.stopPropagation();
    document.body.scrollTop += e.deltaY;
  };

  const handleArrowClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const sections = scrollContainer.querySelectorAll("section");
    if (sections.length === 0) return;

    const currentScrollTop = scrollContainer.scrollTop;
    const viewportHeight = window.innerHeight;

    // Find current section
    let currentSectionIndex = 0;
    sections.forEach((section, index) => {
      const sectionTop = (section as HTMLElement).offsetTop;
      if (currentScrollTop >= sectionTop - viewportHeight / 2) {
        currentSectionIndex = index;
      }
    });

    // Get next section
    const nextSectionIndex = Math.min(currentSectionIndex + 1, sections.length - 1);
    const nextSection = sections[nextSectionIndex] as HTMLElement;

    if (nextSection) {
      let targetScrollTop = nextSection.offsetTop;

      // Apply same CTA offset logic as in snapToNearestSection
      if (reachedMainCta && nextSectionIndex !== sections.length - 1) {
        const topCtaSpace = viewportHeight * 0.02;
        const ctaOffset = topCtaSpace;
        targetScrollTop = targetScrollTop - ctaOffset;
      }

      scrollContainer.scrollTo({
        top: targetScrollTop,
        behavior: "smooth",
      });
    }
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
        className={`flex flex-col h-screen ${sectionsVisible ? "overflow-y-auto overflow-scroll scrollbar-none" : "overflow-hidden"}`}
        data-scroll-container="true"
        ref={scrollContainerRef}
      >
        <section className="flex flex-col overflow-clip place-content-center min-h-screen">
          <LandingChart currentTriggerPhase={currentTriggerPhase} setCurrentTriggerPhase={setCurrentTriggerPhase} />
        </section>
        <section className="flex flex-col overflow-clip place-content-center gap-4 min-h-screen">
          <div className="mb-[2.5%]">
            <SecondaryCTA />
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
      <div
        className={`fixed left-1/2 -translate-x-1/2 flex z-20 justify-center ${
          reachedMainCta && !isInLastSection ? "bottom-[1%] sm:bottom-[2%]" : "-bottom-28"
        } transition-all duration-500 ease-in-out pointer-events-none`}
        onClick={handleArrowClick}
      >
        <Button
          rounded="full"
          size={"md"}
          className={`z-20 h-8 sm:px-2 sm:scale-[1.5] hover:bg-pinto-green-4 hover:brightness-125 transition-all [transition:transform_300ms_cubic-bezier(0.4,0,0.2,1)] ease-in-out flex flex-row gap-2 items-center relative overflow-hidden !font-[340] !tracking-[-0.025rem] pointer-events-auto`}
          shimmer={true}
          glow={true}
        >
          <div className="rotate-90">
            <PintoRightArrow width={"1rem"} height={"1rem"} className="transition-all" />
          </div>
        </Button>
      </div>
      <Link
        to={isAtTop && reachedMainCta ? "" : navLinks.overview}
        onWheelCapture={handleWheel}
        onClick={isAtTop && reachedMainCta ? handleArrowClick : undefined}
        className={`z-20`}
      >
        <div
          className={`fixed left-1/2 -translate-x-1/2 flex z-20 justify-center ${
            reachedMainCta && !isAtTop ? "top-[2%]" : "-top-28"
          } transition-all duration-500 ease-in-out`}
        >
          <Button
            rounded="full"
            size={isMobile ? "lg" : "xxl"}
            className={`z-20 hover:bg-pinto-green-4 max-sm:px-4 hover:brightness-125 transition-all [transition:transform_300ms_cubic-bezier(0.4,0,0.2,1)] ease-in-out flex flex-row gap-2 items-center relative overflow-hidden !font-[340] !tracking-[-0.025rem]`}
            shimmer={true}
            glow={true}
          >
            <span className="relative z-10">Come Seed the Leviathan Free Economy</span>
            <div className="relative z-10" style={{ isolation: "isolate" }}>
              <PintoRightArrow width={isMobile ? "1rem" : "1.25rem"} height={isMobile ? "1rem" : "1.25rem"} />
            </div>
          </Button>
        </div>
      </Link>
    </div>
  );
}
