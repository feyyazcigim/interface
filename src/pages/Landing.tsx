import AuditsList from "@/components/landing/AuditsList";
import BugBounty from "@/components/landing/BugBounty";
import FarmToTable from "@/components/landing/FarmToTable";
import LandingChart from "@/components/landing/LandingChart";
import ProjectStats from "@/components/landing/ProjectStats";
import Resources from "@/components/landing/Resources";
import SecondaryCTA from "@/components/landing/SecondaryCTA";
import SecondaryCTAProperties from "@/components/landing/SecondaryCTAProperties";
import SecondaryCTAValues from "@/components/landing/SecondaryCTAValues";
import { useEffect, useState } from "react";

export default function Landing() {
  const [initialHeightRem, setInitialHeightRem] = useState(100);
  const [initialHeightPx, setInitialHeightPx] = useState(1600);
  const [navBarHeightRem, setNavBarHeightRem] = useState(3.125);

  useEffect(() => {
    const calculateHeight = () => {
      // Get the current rem value based on root font size
      const remSize = parseFloat(getComputedStyle(document.documentElement).fontSize);

      const elem = document.getElementById("pinto-navbar");
      if (!elem) return;

      const windowHeight = window.screen.availHeight - (window.outerHeight - window.innerHeight);
      const headerOffset = elem.getBoundingClientRect().height;
      const newHeight = windowHeight - headerOffset;

      // Convert pixel values to rem
      setInitialHeightRem(newHeight / remSize);
      setInitialHeightPx(newHeight);
      setNavBarHeightRem(headerOffset / remSize);
    };

    calculateHeight();

    window.addEventListener("resize", calculateHeight);
    return () => {
      window.removeEventListener("resize", calculateHeight);
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
        <section className="flex flex-col sm:mt-9 overflow-clip">
          <LandingChart />
        </section>
        <section className="flex flex-col overflow-clip place-content-center gap-14 h-[67.5rem] max-h-[67.5rem]">
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
    </div>
  );
}
