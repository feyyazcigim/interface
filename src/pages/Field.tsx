import backArrowIcon from "@/assets/misc/LeftArrow.svg";
import podIcon from "@/assets/protocol/Pod.png";
import { TokenValue } from "@/classes/TokenValue";
import EmptyTable from "@/components/EmptyTable";

import { LeftArrowIcon, UpDownArrowsIcon } from "@/components/Icons";
import { OnlyMorningCard } from "@/components/MorningCard";
import PlotsTable from "@/components/PlotsTable";
import { Button } from "@/components/ui/Button";
import PageContainer from "@/components/ui/PageContainer";
import { Separator } from "@/components/ui/Separator";
import MorningTemperatureChart from "@/pages/field/MorningTemperature";
import {
  useUpdateMorningSoilOnInterval,
  useUpdateMorningTemperatureOnInterval,
} from "@/state/protocol/field/field.updater";

import AccordionGroup, { IBaseAccordionContent } from "@/components/AccordionGroup";
import MobileActionBar from "@/components/MobileActionBar";
import ReadMoreAccordion from "@/components/ReadMoreAccordion";
import TooltipSimple from "@/components/TooltipSimple";
import { Skeleton } from "@/components/ui/Skeleton";
import useIsMobile from "@/hooks/display/useIsMobile";
import { useFarmerField } from "@/state/useFarmerField";
import { useHarvestableIndex, useHarvestableIndexLoading } from "@/state/useFieldData";
import { useMorning } from "@/state/useSunData";
import { formatter } from "@/utils/format";
import { useMemo } from "react";
import { Link, NavLink, useNavigate, useSearchParams } from "react-router-dom";
import FieldActions from "./field/FieldActions";
import FieldStats from "./field/FieldStats";
import MorningPanel from "./field/MorningPanel";
import TemperatureChart from "./field/Temperature";

function Field() {
  useUpdateMorningTemperatureOnInterval();
  useUpdateMorningSoilOnInterval();
  const farmerField = useFarmerField();
  const harvestableIndex = useHarvestableIndex();
  const harvestableIndexLoading = useHarvestableIndexLoading();

  const hasPods = farmerField.plots.length > 0;
  const totalPods = useMemo(
    () =>
      farmerField.plots.reduce(
        (total, plot) =>
          total
            .add(plot.unharvestablePods ?? TokenValue.ZERO) // Add non-harvestable pods
            .add(plot.harvestablePods ?? TokenValue.ZERO), // Add harvestable pods (or 0 if undefined)
        TokenValue.ZERO,
      ),
    [farmerField.plots],
  );

  const navigate = useNavigate();

  const isMobile = useIsMobile();
  const [params] = useSearchParams();
  const currentAction = params.get("action");

  const morning = useMorning();

  return (
    <PageContainer variant="xlAltField">
      {/* <div className="flex flex-col w-full items-center"> */}
      <div className="flex flex-col lg:flex-row justify-between gap-14 mt-0 sm:mt-0">
        <div className="flex flex-col w-full gap-4 sm:gap-8">
          {(!isMobile || (!currentAction && isMobile)) && (
            <div className="flex flex-col gap-4">
              <div className="pinto-h2 sm:pinto-h1">Field</div>
              <div className="pinto-sm sm:pinto-body-light text-pinto-light sm:text-pinto-light">
                Lend in the decentralized credit facility for Pods, the Pinto debt asset.
              </div>
              <div className="hidden sm:block pinto-sm sm:pinto-body-light text-pinto-light sm:text-pinto-light">
                Pods become redeemable for Pinto 1:1 when they reach the front of the Pod Line.
              </div>
              <ReadMoreField />
            </div>
          )}
          {currentAction && isMobile && (
            <Button variant={"outline"} rounded="full" noPadding className="h-9 w-9 sm:h-12 sm:w-12">
              <Link to={`/field`}>
                <img src={backArrowIcon} alt="go to previous page" className="h-6 w-6 sm:h-8 sm:w-8" />
              </Link>
            </Button>
          )}
          {(!isMobile || (!currentAction && isMobile)) && <Separator />}
          <MorningPanel />
          <FieldStats />
          {(!isMobile || (!currentAction && isMobile)) && <DynamicTemperatureChart />}
          {(!isMobile || (!currentAction && isMobile)) && (
            <div className="flex flex-row items-center justify-between rounded-[1rem] p-4 sm:p-6 bg-pinto-off-white border-pinto-gray-2 border w-full">
              <div className="flex flex-col gap-2">
                <div className="pinto-sm sm:pinto-body-light text-pinto-light sm:text-pinto-light flex flex-row gap-1 items-center">
                  Pods which have become Harvestable
                  <TooltipSimple
                    variant="gray"
                    content="Debt repaid to Pod holders since deployment. These Pods do not count towards the current Pod Line"
                  />
                </div>
                <div className="pinto-h4 sm:pinto-h3">
                  {harvestableIndexLoading ? (
                    <Skeleton className="flex w-20 h-4 sm:w-24 sm:h-[2.2rem] rounded-[0.75rem]" />
                  ) : (
                    formatter.noDec(harvestableIndex)
                  )}
                </div>
                <Button asChild variant={"outline"} className="rounded-full text-[1rem] sm:text-[1.25rem]">
                  <Link to={"/explorer/field"}>View Data</Link>
                </Button>
              </div>
            </div>
          )}
          {(!isMobile || (!currentAction && isMobile)) && (
            <div className="flex flex-row justify-between items-center">
              <div className="pinto-h3">My Pods</div>
              <div className="flex flex-row gap-2 items-center">
                <img src={podIcon} className="w-8 h-8" alt={"total pods"} />
                {harvestableIndexLoading ? (
                  <Skeleton className="w-6 h-8" />
                ) : (
                  <div className="pinto-h3">{formatter.number(totalPods)}</div>
                )}
              </div>
            </div>
          )}
          {(!isMobile || (!currentAction && isMobile)) && (
            <div>{hasPods ? <PlotsTable showClaimable disableHover /> : <EmptyTable type="plots-field" />}</div>
          )}
        </div>
        {/*
         * Right side
         */}
        <div className="flex flex-col gap-6 w-full mb-14 sm:mb-0 lg:max-w-[384px] 3xl:max-w-[518px] 3xl:min-w-[425px] lg:mt-[5.25rem]">
          {(!isMobile || (currentAction && isMobile)) && (
            <OnlyMorningCard onlyMorning className="p-4 w-full">
              <FieldActions />
            </OnlyMorningCard>
          )}
          {/* <div className="p-4 rounded-[1.25rem] bg-pinto-off-white border-pinto-gray-2 border"></div> */}
          {!isMobile && (
            <div className="p-2 rounded-[1rem] bg-pinto-off-white border-pinto-gray-2 border flex flex-col gap-2">
              <Button
                className="w-full"
                variant="silo-action"
                disabled={totalPods.isZero}
                onClick={(e) => {
                  if (totalPods.isZero) {
                    e.preventDefault();
                    e.stopPropagation();
                  }
                }}
              >
                <NavLink to="/transfer/pods" className="flex flex-row gap-2 items-center">
                  <div className="rounded-full bg-pinto-green h-6 w-6 flex justify-evenly">
                    <span className="self-center items-center">
                      <LeftArrowIcon color={"white"} height={"1rem"} width={"1rem"} />
                    </span>
                  </div>
                  Send Pods
                </NavLink>
              </Button>
              <Button asChild variant="silo-action" className="w-full">
                <NavLink to="/market/pods" className="flex flex-row gap-2 items-center">
                  <div className="rounded-full bg-pinto-green h-6 w-6 flex justify-evenly">
                    <span className="self-center items-center">
                      <UpDownArrowsIcon color={"white"} height={"1rem"} width={"1rem"} />
                    </span>
                  </div>
                  Buy or sell Pods in the Market
                </NavLink>
              </Button>
            </div>
          )}
          <AccordionGroup groupTitle="Frequently Asked Questions" items={FieldFAQ} allExpanded={false} />
          {!currentAction && (
            <MobileActionBar>
              <Button
                onClick={() => navigate(`/field?action=harvest`)}
                rounded={"full"}
                variant={"outline-secondary"}
                className="pinto-sm-bold text-sm flex-1 flex h-full"
              >
                Harvest
              </Button>
              <Button
                onClick={() => navigate(`/field?action=sow`)}
                rounded={"full"}
                className={`pinto-sm-bold text-sm flex-1 flex h-full transition-colors ${morning.isMorning ? "bg-pinto-morning-orange text-pinto-morning" : ""}`}
              >
                Sow
              </Button>
            </MobileActionBar>
          )}
        </div>
      </div>
    </PageContainer>
  );
}

export default Field;

export const DynamicTemperatureChart = () => {
  const { isMorning } = useMorning();

  if (isMorning) {
    return <MorningTemperatureChart />;
  } else {
    return <TemperatureChart />;
  }
};

const ReadMoreField = () => (
  <ReadMoreAccordion defaultOpen>
    <div>
      Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore
      magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo
      consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
      Excepteur sint occaecat cupidatat non proident
    </div>
  </ReadMoreAccordion>
);

const FieldFAQ: IBaseAccordionContent[] = [
  {
    key: "what-is-a-pod",
    title: "What are pods?",
    content: "Pods are Pinto's native debt asset, minted whenever the protocol borrows Pinto from the open market.",
  },
  {
    key: "what-makes-pods-unique",
    title: "What makes pods unique?",
    content: (
      <div className="flex flex-col gap-2 pinto-sm font-thin text-pinto-light">
        <>
          Pods are similar to bonds in that 1 pod is redeemable for 1 Pinto once the pods mature, but have these unique
          properties:
        </>
        <ul className="flex flex-col gap-1 pl-2 list-disc">
          <li>
            Pods are placed in a FIFO queue, where newly issued pods are placed at the end of the line, and newly issued
            pinto are used to pay off pods at the front of the line.
          </li>
          <li>Maturity is determined by your place in line, rather than at some date.</li>
          <li>Pods never expire.</li>
        </ul>
      </div>
    ),
  },
  {
    key: "what-is-soil",
    title: "What is Soil?",
    content:
      "Soil is the amount of Pinto the protocol is willing to borrow in a given Season. The protocol issues debt every Season, but the exact Soil available varies with system conditions.",
  },
  {
    key: "what-is-temperature",
    title: "What is Temperature?",
    content:
      "Temperature is the interest rate you earn when you Sow (buy) Pods. It adjusts automatically each Season based on market activity in the previous one.",
  },
  {
    key: "does-temperature-have-a-cap",
    title: "Does Temperature have a cap?",
    content:
      "Temperature has no fixed cap. Instead, the protocol raises or lowers it incrementally each Season in response to supply and demand—avoiding the systemic risks a hard ceiling would introduce.",
  },
  {
    key: "what-is-the-morning-auction",
    title: "What is the Morning Auction?",
    content:
      "The Morning Auction is the first 10 minutes of each Season. During this window, Temperature ramps from its opening value to the Season's maximum, letting farmers Sow Soil at a lower rate when demand is significant.",
  },
] as const;
