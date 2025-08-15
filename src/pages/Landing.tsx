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
import { Button } from "@/components/ui/Button";
import useIsMobile from "@/hooks/display/useIsMobile";
import { useEffect, useState } from "react";

export default function Landing() {
  const [isCtaVisible, setIsCtaVisible] = useState(false);
  const [isCtaPresent, setIsCtaPresent] = useState(false);

  const isMobile = useIsMobile();

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

  return (
    <div
      className="sm:max-w-[1920px] w-full place-self-center"
      style={{
        mask: "linear-gradient(to right, transparent, white 2%, white 98%, transparent)",
        WebkitMask: "linear-gradient(to right, transparent, white 2%, white 98%, transparent)",
      }}
    >
      <div className="flex flex-col">
        <section className="flex flex-col sm:mt-4 overflow-clip">
          <LandingChart />
        </section>
        <section className="flex flex-col overflow-clip max-sm:place-content-center gap-14 h-[67.5rem] max-h-[67.5rem]">
          <SecondaryCTAValues />
          <SecondaryCTA />
          <SecondaryCTAProperties />
        </section>
        <section className="flex flex-col gap-12 overflow-clip h-[67.5rem] max-h-[67.5rem]">
          <ProjectStats />
        </section>
        <section className="flex flex-col gap-4 overflow-clip mb-8 h-[67.5rem] max-h-[67.5rem]">
          <BugBounty />
          {/* 
        <AuditsList />
        */}
        </section>
        <section className="flex flex-col gap-12 h-[67.5rem] max-h-[67.5rem]">
          <Resources />
        </section>
      </div>
      <div
        className={`fixed left-1/2 -translate-x-1/2 flex justify-center ${
          isCtaVisible ? "-bottom-24" : isCtaPresent ? "bottom-6 sm:bottom-12" : "-bottom-24"
        } transition-all duration-300 ease-in-out`}
      >
        <Button
          rounded="full"
          size={isMobile ? "xl" : "xxl"}
          className={`${isMobile ? "scale-100" : "scale-150"} flex flex-row gap-2 items-center relative overflow-hidden animate-[pulse-glow_3s_ease-in-out_infinite] hover:shadow-[0_0_30px_rgba(36,102,69,0.6)] transition-shadow duration-1500`}
        >
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-pinto-green-2/50 to-transparent" />
          <span className="relative z-10">Join the Farm</span>
          <PintoRightArrow
            width={isMobile ? "1.25rem" : "1.5rem"}
            height={isMobile ? "1.25rem" : "1.5rem"}
            className="relative z-10"
          />
        </Button>
      </div>
    </div>
  );
}
