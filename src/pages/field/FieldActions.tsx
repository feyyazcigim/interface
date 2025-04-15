import SowOrderDialog from "@/components/SowOrderDialog";
import { Separator } from "@/components/ui/Separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { useParamsTabs } from "@/hooks/useRouterTabs";
import { useMorning } from "@/state/useSunData";
import clsx from "clsx";
import { useState } from "react";
import Harvest from "./actions/Harvest";
import Sow from "./actions/Sow";

const slugs = ["sow", "harvest"] as const;

const morningClass = clsx("data-[state=active]:bg-pinto-morning-orange data-[state=active]:text-pinto-morning");

export default function FieldActions() {
  const isMorning = useMorning().isMorning;
  const [tab, handleChangeTab] = useParamsTabs(slugs, "action", true);
  const [showSowOrder, setShowSowOrder] = useState(false);

  return (
    <div className="relative h-full">
      <div className={showSowOrder ? "invisible" : "visible"}>
        <Tabs defaultValue="sow" className="w-full h-full" value={!tab ? "sow" : tab} onValueChange={handleChangeTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="sow" className={isMorning ? morningClass : undefined}>
              Sow
            </TabsTrigger>
            <TabsTrigger value="harvest" className={isMorning ? morningClass : undefined}>
              Harvest
            </TabsTrigger>
          </TabsList>
          <Separator className="my-4" />
          {tab === "sow" && (
            <TabsContent value="sow">
              <Sow isMorning={isMorning} onShowOrder={() => setShowSowOrder(true)} />
            </TabsContent>
          )}
          {tab === "harvest" && (
            <TabsContent value="harvest">
              <Harvest isMorning={isMorning} />
            </TabsContent>
          )}
        </Tabs>
      </div>

      {showSowOrder && (
        <div className="absolute inset-x-0 -top-[56px] min-h-[calc(100%)] bg-[#FCFCFC] rounded-[20px] border border-[#D9D9D9] z-10 flex items-start overflow-auto">
          <div className="w-full max-w-[90%] my-2 mx-auto pb-4">
            <SowOrderDialog open={showSowOrder} onOpenChange={setShowSowOrder} />
          </div>
        </div>
      )}
    </div>
  );
}
