import { PintoRightArrow } from "@/components/Icons";
import BugBounty from "@/components/landing/BugBounty";
import LandingChart from "@/components/landing/LandingChart";
import ProjectStats from "@/components/landing/ProjectStats";
import Resources from "@/components/landing/Resources";
import SecondaryCTA from "@/components/landing/SecondaryCTA";
import { navLinks } from "@/components/nav/nav/Navbar";
import { Button } from "@/components/ui/Button";
import useIsMobile from "@/hooks/display/useIsMobile";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

export default function Landing() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const isMobile = useIsMobile();
  const [currentTriggerPhase, setCurrentTriggerPhase] = useState<string | undefined>(undefined);
  const [reachedMainCta, setReachedMainCta] = useState<boolean>(false);
  const [isAtTop, setIsAtTop] = useState<boolean>(true); // Track if scroll is at very top
  const [isInLastSection, setIsInLastSection] = useState<boolean>(false); // Track if in last section

  // Track first-time visitor status
  const [isFirstTimeVisitor, setIsFirstTimeVisitor] = useState<boolean>(false);
  const [sectionsVisible, setSectionsVisible] = useState<boolean>(true); // Default to visible

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
      const newIsAtTop = currentScrollTop < halfScreenHeight;
      setIsAtTop(newIsAtTop);

      // Check if in last section
      const sections = scrollContainer.querySelectorAll("section");
      if (sections.length > 0) {
        const lastSection = sections[sections.length - 1] as HTMLElement;
        const lastSectionTop = lastSection.offsetTop;
        const viewportHeight = window.innerHeight;
        const isInLast = currentScrollTop >= lastSectionTop - viewportHeight / 2;
        setIsInLastSection(isInLast);
      }
    };

    (scrollContainer as HTMLElement).addEventListener("scroll", handleScroll, { passive: true });

    // Check initial position
    handleScroll();

    return () => {
      (scrollContainer as HTMLElement).removeEventListener("scroll", handleScroll);
    };
  }, [sectionsVisible]);

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
      if (currentScrollTop >= sectionTop - viewportHeight / 10) {
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
    <div className="w-full place-self-center">
      <div
        className={`flex flex-col items-center h-screen ${sectionsVisible ? "overflow-y-auto overflow-scroll scrollbar-none" : "overflow-hidden"}`}
        data-scroll-container="true"
        ref={scrollContainerRef}
      >
        <section
          className="flex flex-col overflow-clip place-content-center min-h-screen sm:max-w-[1920px] sm:w-full"
          style={{
            mask: "linear-gradient(to right, transparent, white 2%, white 98%, transparent)",
            WebkitMask: "linear-gradient(to right, transparent, white 2%, white 98%, transparent)",
          }}
        >
          <LandingChart currentTriggerPhase={currentTriggerPhase} setCurrentTriggerPhase={setCurrentTriggerPhase} />
        </section>
        <section className="flex flex-col overflow-clip place-content-center gap-4 min-h-[64rem] sm:w-full sm:min-h-[max(1024px,100vh)] bg-[linear-gradient(180deg,#FEFDF7_-0.11%,#ECF7ED_49.41%,#FEFDF6_99.89%)]">
          <SecondaryCTA />
        </section>
        <section className="flex flex-col overflow-clip place-content-center sm:w-full min-h-[50rem] sm:min-h-[max(800px,100vh)] sm:max-w-[1920px] bg-[linear-gradient(180deg,#FEFDF7_-0.11%,#ECF7ED_49.41%,#FEFDF6_99.89%)]">
          <ProjectStats />
        </section>
        <section className="flex flex-col overflow-clip place-content-center sm:w-full min-h-screen sm:max-w-[2200px] bg-[linear-gradient(180deg,#FEFDF7_-0.11%,#D8F1E2_49.41%,#FEFDF6_99.89%)]">
          <BugBounty />
          {/* 
            <AuditsList />
            */}
        </section>
        <section className="flex flex-col overflow-clip place-content-center h-auto min-h-[110rem] w-full sm:h-screen sm:min-h-[max(800px,100vh)] bg-[linear-gradient(180deg,#FEFDF7_-0.11%,#D8F1E2_49.41%,#FEFDF6_99.89%)]">
          <Resources />
        </section>
      </div>
      <div
        className={`fixed left-1/2 -translate-x-1/2 flex z-20 justify-center ${
          reachedMainCta && !isInLastSection ? "bottom-[1vh] sm:bottom-[2vh]" : "-bottom-28"
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
        onClick={isAtTop && reachedMainCta ? handleArrowClick : undefined}
        className={`z-20`}
      >
        <div
          className={`fixed left-1/2 -translate-x-1/2 flex z-20 justify-center ${
            reachedMainCta && !isAtTop ? "top-[2vh]" : "-top-28"
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
