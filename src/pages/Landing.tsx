import PintoLogo from "@/assets/protocol/PintoLogo.svg";
import PintoLogoText from "@/assets/protocol/PintoLogoText.svg";
import Footer from "@/components/Footer";
import { PintoRightArrow } from "@/components/Icons";
import BugBounty from "@/components/landing/BugBounty";
import LandingChart from "@/components/landing/LandingChart";
import ProjectStats from "@/components/landing/ProjectStats";
import Resources from "@/components/landing/Resources";
import SecondaryCTA from "@/components/landing/SecondaryCTA";
import { navLinks } from "@/components/nav/nav/Navbar";
import { Button } from "@/components/ui/Button";
import useIsMobile from "@/hooks/display/useIsMobile";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

export default function Landing() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const isMobile = useIsMobile();
  const [currentTriggerPhase, setCurrentTriggerPhase] = useState<string | undefined>(undefined);
  const [reachedMainCta, setReachedMainCta] = useState<boolean>(true);
  const [isInLastSection, setIsInLastSection] = useState<boolean>(false); // Track if in last section

  // Track first-time visitor status
  const [isFirstTimeVisitor, setIsFirstTimeVisitor] = useState<boolean>(false);
  const [sectionsVisible, setSectionsVisible] = useState<boolean>(true); // Default to visible

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
    <div className="w-full place-self-center relative">
      <div
        className={`flex flex-col items-center h-screen overflow-y-auto overflow-x-clip scrollbar-none`}
        data-scroll-container="true"
        ref={scrollContainerRef}
      >
        {/* Header Logo and Text - static, above everything */}
        <div className="flex flex-col gap-2 sm:gap-4 self-stretch items-center pt-[5dvh] sm:pt-[10dvh] 3xl:pt-[6dvh] min-[2130px]:pt-[8dvh] min-[2400px]:pt-[10dvh] pb-2 sm:pb-4">
          <motion.h2
            className="text-[4rem] leading-[1.1] font-thin text-black"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeInOut", delay: 0.2 }}
          >
            <div className="flex flex-row gap-4 items-center">
              <img src={PintoLogo} alt="Pinto Logo" className="h-14 sm:h-20" />
              <img src={PintoLogoText} alt="Pinto Logo" className="h-14 sm:h-20" />
            </div>
          </motion.h2>
          <motion.span
            className="text-[1.25rem] sm:text-2xl sm:leading-[1.4] font-thin text-pinto-gray-4 w-[70%] sm:w-fit text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeInOut", delay: 0.4 }}
          >
            An Algorithmic Stablecoin Balanced by Farmers Like You.
          </motion.span>
        </div>
        {/* Sticky CTA Button - below header, outside scroll container */}
        <motion.div
          id="landing-cta"
          className="flex flex-col sm:flex-row gap-4 mx-auto items-center sticky top-4 sm:top-8 sm:mt-4 mt-2 sm:mb-10 mb-4 place-self-center z-50 justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut", delay: 0.6 }}
        >
          <Link to={navLinks.overview}>
            <Button
              rounded="full"
              size={isMobile ? "lg" : "xxl"}
              className="hover:bg-pinto-green-4 max-sm:px-4 hover:brightness-125 [transition:filter_0.3s_ease] flex flex-row gap-2 items-center relative overflow-hidden !font-[340] !tracking-[-0.025rem]"
              id={"come-seed-the-trustless-economy"}
              shimmer
              glow
            >
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-pinto-green-2/50 to-transparent" />
              <span className="relative z-10">Come Seed the Leviathan Free Economy</span>
              <div className="relative z-10" style={{ isolation: "isolate" }}>
                <PintoRightArrow width={isMobile ? "1rem" : "1.25rem"} height={isMobile ? "1rem" : "1.25rem"} />
              </div>
            </Button>
          </Link>
        </motion.div>
        <section className="flex flex-col overflow-clip place-content-center min-h-[calc(100dvh-250px)] sm:min-h-[calc(100dvh-300px)] w-full bg-[linear-gradient(180deg,#FEFDF7_-0.11%,#ECF7ED_49.41%,#FEFDF6_99.89%)]">
          <div className="sm:max-w-[1920px] w-full mx-auto min-h-[calc(100dvh-250px)] sm:min-h-[calc(100dvh-300px)] overflow-clip">
            <LandingChart currentTriggerPhase={currentTriggerPhase} setCurrentTriggerPhase={setCurrentTriggerPhase} />
          </div>
        </section>
        <section className="flex flex-col overflow-clip place-content-center gap-4 min-h-[64rem] sm:w-full sm:min-h-[max(1024px,100vh)] bg-[linear-gradient(180deg,#FEFDF7_-0.11%,#ECF7ED_49.41%,#FEFDF6_99.89%)]">
          <SecondaryCTA />
        </section>
        <section className="flex flex-col overflow-clip place-content-center sm:w-full min-h-[50rem] sm:min-h-[max(800px,100vh)] bg-[linear-gradient(180deg,#FEFDF7_-0.11%,#ECF7ED_49.41%,#FEFDF6_99.89%)]">
          <ProjectStats />
        </section>
        <section className="flex flex-col overflow-clip place-content-center sm:w-full min-h-[34rem] sm:min-h-[54rem] bg-[linear-gradient(180deg,#FEFDF7_-0.11%,#D8F1E2_49.41%,#FEFDF6_99.89%)]">
          <BugBounty />
        </section>
        <section className="flex flex-col overflow-clip place-content-center h-auto min-h-[114rem] w-full sm:h-screen sm:min-h-[max(800px,100vh)] bg-[linear-gradient(180deg,#FEFDF7_-0.11%,#D8F1E2_49.41%,#FEFDF6_99.89%)]">
          <Resources />
        </section>
        <div className="flex-1 w-full">
          <Footer landingPageVersion />
        </div>
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
    </div>
  );
}
