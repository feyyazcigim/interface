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
import { WheelEvent, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

export default function Landing() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const isMobile = useIsMobile();
  const [currentTriggerPhase, setCurrentTriggerPhase] = useState<string | undefined>(undefined);
  const [reachedMainCta, setReachedMainCta] = useState<boolean>(false);
  const [isAtTop, setIsAtTop] = useState<boolean>(true); // Track if scroll is at very top

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
      const currentScrollTop = scrollContainer.scrollTop;
      const halfScreenHeight = window.innerHeight / 2;
      setIsAtTop(currentScrollTop < halfScreenHeight);
    };

    scrollContainer.addEventListener("scroll", handleScroll, { passive: true });

    // Check initial position
    handleScroll();

    return () => {
      scrollContainer.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleWheel = (e: WheelEvent<HTMLAnchorElement>) => {
    e.stopPropagation();
    document.body.scrollTop += e.deltaY;
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
        className="flex flex-col h-screen overflow-y-auto snap-y snap-mandatory scrollbar-none"
        data-scroll-container="true"
        ref={scrollContainerRef}
      >
        <section className="flex flex-col overflow-clip place-content-center min-h-screen snap-center">
          <LandingChart currentTriggerPhase={currentTriggerPhase} setCurrentTriggerPhase={setCurrentTriggerPhase} />
        </section>
        {sectionsVisible && (
          <>
            <section className="flex flex-col overflow-clip place-content-center gap-4 min-h-screen snap-center">
              <SecondaryCTAValues />
              <SecondaryCTA />
              <SecondaryCTAProperties />
            </section>
            <section className="flex flex-col overflow-clip place-content-center min-h-screen snap-center">
              <ProjectStats />
            </section>
            <section className="flex flex-col overflow-clip place-content-center min-h-screen snap-center">
              <BugBounty />
              {/* 
            <AuditsList />
            */}
            </section>
            <section className="flex flex-col overflow-clip place-content-center min-h-screen snap-center">
              <Resources />
            </section>
          </>
        )}
      </div>
      <Link
        to={navLinks.overview}
        onWheelCapture={handleWheel}
        className={`${isAtTop && reachedMainCta ? "pointer-events-none" : "pointer-events-auto"} z-20`}
      >
        <div
          className={`fixed left-1/2 -translate-x-1/2 flex z-20 justify-center ${
            reachedMainCta ? "bottom-6 sm:bottom-12" : "-bottom-28"
          } transition-all duration-500 ease-in-out`}
        >
          <Button
            rounded="full"
            size={isAtTop && reachedMainCta ? (isMobile ? "md" : "xl") : "xxl"}
            className={`${isMobile || (isAtTop && reachedMainCta) ? "scale-100" : "scale-150"} z-20 hover:bg-pinto-green-4 hover:brightness-125 transition-all duration-300 ease-in-out flex flex-row gap-2 items-center relative overflow-hidden !font-[340] !tracking-[-0.025rem]`}
            shimmer={!isAtTop}
            glow={!isAtTop}
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
              <PintoRightArrow
                width={isMobile ? (isAtTop && reachedMainCta ? "1.5rem" : "1.25rem") : "1.5rem"}
                height={isMobile ? (isAtTop && reachedMainCta ? "1.5rem" : "1.25rem") : "1.5rem"}
                className="transition-all"
              />
            </div>
          </Button>
        </div>
      </Link>
    </div>
  );
}
