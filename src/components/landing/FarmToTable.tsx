import MinimalistConcentricCircles from "@/components/MinimalistConcentricCircles";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { navLinks } from "../nav/nav/Navbar";
import { Button } from "../ui/Button";

export default function FarmToTable({ height = 1600 }: { height: number }) {
  const [beginAnimation, setBeginAnimation] = useState(false);
  const sloganRef = useRef(null);

  useEffect(() => {
    if (!sloganRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setBeginAnimation(true);
          observer.disconnect();
        }
      },
      { threshold: 0.5 },
    );

    observer.observe(sloganRef.current);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center relative w-full h-screen overflow-hidden">
      {/* Background expanding rings centered properly */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-full h-auto opacity-10">
          <MinimalistConcentricCircles canvasHeight={height} beginAnimation={beginAnimation} />
        </div>
      </div>

      <div className="flex flex-col items-center gap-4 z-10">
        <h2 className="pinto-h2 text-5xl leading-[1.1] text-black items-center flex flex-col">
          <span>Pinto incentivizes coordination between</span>
          <span>farmers to create new money</span>
        </h2>
        <span ref={sloganRef} className="pinto-body-light font-thin text-pinto-gray-4">
          100% community backed
        </span>
        <div className="flex flex-row gap-4">
          <Link to={`${navLinks.docs}advanced/economics`} target="_blank" rel="noopener noreferrer">
            <Button rounded="full">Learn How →</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
