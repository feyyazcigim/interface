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
import clsx from "clsx";
import { WheelEvent, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

export default function Landing() {
  const [isCtaVisible, setIsCtaVisible] = useState(false);
  const [isCtaPresent, setIsCtaPresent] = useState(false);

  const lastScrollTop = useRef(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const projectStatsSectionRef = useRef<HTMLElement>(null);

  const isMobile = useIsMobile();

  // Track scroll direction for ProjectStats snap behavior
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    const projectStatsSection = projectStatsSectionRef.current;
    if (!scrollContainer || !projectStatsSection) return;

    const handleScroll = () => {
      const currentScrollTop = scrollContainer.scrollTop;
      const scrollDirection = currentScrollTop > lastScrollTop.current ? "down" : "up";

      // Directly update the className without causing re-renders
      const baseClasses = clsx("flex flex-col overflow-clip place-content-center min-h-[125rem] sm:min-h-screen");

      if (scrollDirection === "down") {
        projectStatsSection.className = `${baseClasses} snap-start`;
      } else {
        projectStatsSection.className = `${baseClasses} snap-end`;
      }

      lastScrollTop.current = currentScrollTop;
    };

    scrollContainer.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      scrollContainer.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Intersection observer to track CTA visibility
  useEffect(() => {
    let intersectionObserver: IntersectionObserver | null = null;
    let mutationObserver: MutationObserver | null = null;

    const setupIntersectionObserver = (targetElement: Element) => {
      intersectionObserver = new IntersectionObserver(
        ([entry]) => {
          setIsCtaVisible(entry.isIntersecting);
        },
        {
          threshold: 0.1, // Trigger when 10% of the element is visible
        },
      );

      intersectionObserver.observe(targetElement);
    };

    const checkForElement = () => {
      const targetElement = document.getElementById("come-seed-the-trustless-economy");
      if (targetElement) {
        setIsCtaPresent(true);
        setupIntersectionObserver(targetElement);
        if (mutationObserver) {
          mutationObserver.disconnect();
          mutationObserver = null;
        }
        return true;
      }
      return false;
    };

    // Try to find element immediately
    if (!checkForElement()) {
      // If not found, watch for DOM changes
      mutationObserver = new MutationObserver(() => {
        checkForElement();
      });

      mutationObserver.observe(document.body, {
        childList: true,
        subtree: true,
      });
    }

    return () => {
      if (intersectionObserver) {
        intersectionObserver.disconnect();
      }
      if (mutationObserver) {
        mutationObserver.disconnect();
      }
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
        ref={scrollContainerRef}
        className="flex flex-col h-screen overflow-y-auto snap-y snap-mandatory scrollbar-none"
        data-scroll-container="true"
      >
        <section className="flex flex-col overflow-clip place-content-center min-h-screen snap-center">
          <LandingChart />
        </section>
        <section className="flex flex-col overflow-clip place-content-center gap-4 min-h-screen snap-center">
          <SecondaryCTAValues />
          <SecondaryCTA />
          <SecondaryCTAProperties />
        </section>
        <section
          ref={projectStatsSectionRef}
          className="flex flex-col overflow-clip place-content-center min-h-[125rem] sm:min-h-screen snap-start"
        >
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
      </div>
      <Link to={navLinks.overview} onWheelCapture={handleWheel}>
        <div
          className={`fixed left-1/2 -translate-x-1/2 flex justify-center ${
            isCtaVisible ? "-bottom-28" : isCtaPresent ? "bottom-6 sm:bottom-12" : "-bottom-28"
          } transition-all duration-500 ease-in-out`}
        >
          <Button
            rounded="full"
            size={isMobile ? "xl" : "xxl"}
            className={`${isMobile ? "scale-100" : "scale-150"} hover:bg-pinto-green-4 hover:brightness-125 transition-all duration-300 ease-in-out flex flex-row gap-2 items-center relative overflow-hidden !font-[340] !tracking-[-0.025rem]`}
            shimmer
            glow
          >
            <span className="relative z-10">Join the Farm</span>
            <div className="relative z-10" style={{ isolation: "isolate" }}>
              <PintoRightArrow
                width={isMobile ? "1.25rem" : "1.5rem"}
                height={isMobile ? "1.25rem" : "1.5rem"}
                className="relative z-10"
              />
            </div>
          </Button>
        </div>
      </Link>
    </div>
  );
}
