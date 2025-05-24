import GradientBox from "@/components/ui/GradientBox";
import { navbarPanelAtom } from "@/state/app/navBar.atoms";
import { useAtomValue } from "jotai";

function TourOfTheFarmTab() {
  const panelState = useAtomValue(navbarPanelAtom);

  if (panelState.openPanel) {
    return null;
  }

  return (
    // width of the 'Tour of the Farm box is roughly 12.12rem'
    <div className="fixed right-0 top-[calc(50%-6.6rem)] translate-y-1/2 w-max cursor-pointer origin-bottom-right rotate-[-90deg] z-50">
      <GradientBox rounded={{ tl: true, tr: true }} animate>
        <div className="pinto-body-bold whitespace-nowrap px-6 py-2">Tour of the Farm</div>
      </GradientBox>
    </div>
  );
}

export default function TourOfTheFarm() {
  return (
    <>
      <TourOfTheFarmTab />
    </>
  );
}
