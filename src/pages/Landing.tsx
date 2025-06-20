import LandingChart from "@/components/LandingChart";
import AuditsList from "@/components/landing/AuditsList";
import BugBounty from "@/components/landing/BugBounty";
import FarmToTable from "@/components/landing/FarmToTable";
import MainCTA from "@/components/landing/MainCTA";
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
    <div className="flex flex-col">
      <div className="flex flex-col gap-20 mt-9 overflow-clip" style={{ height: `${initialHeightRem}rem` }}>
        <div className="mx-auto">
          <MainCTA />
        </div>
        <div>
          <LandingChart />
        </div>
      </div>
      <div className="flex flex-col overflow-clip gap-14" style={{ height: `${initialHeightRem + 8}rem` }}>
        <SecondaryCTAValues />
        <SecondaryCTA />
        <SecondaryCTAProperties />
      </div>
      <div className="flex flex-col gap-12 overflow-clip" style={{ height: `${initialHeightRem}rem` }}>
        <FarmToTable height={initialHeightPx} />
      </div>
      <div className="flex flex-col gap-4 overflow-clip mb-8" style={{ height: `${initialHeightRem + 8}rem` }}>
        <BugBounty />
        {/* 
        <AuditsList />
        */}
      </div>
      <div className="flex flex-col gap-12" style={{ height: `${initialHeightRem + navBarHeightRem / 3}rem` }}>
        <Resources />
      </div>
    </div>
  );
}
