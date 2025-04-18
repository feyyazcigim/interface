import { TokenValue } from "@/classes/TokenValue";
import ActionsMenu from "@/components/ActionsMenu";
import { Col, Row } from "@/components/Container";
import GerminationNotice from "@/components/GerminationNotice";
import HelperLink from "@/components/HelperLink";
import ReadMoreAccordion from "@/components/ReadMoreAccordion";
import StatPanel from "@/components/StatPanel";
import TableRowConnector from "@/components/TableRowConnector";
import PageContainer from "@/components/ui/PageContainer";
import { Separator } from "@/components/ui/Separator";
import useIsSmallDesktop from "@/hooks/display/useIsSmallDesktop";
import { useClaimRewards } from "@/hooks/useClaimRewards";
import useFarmerActions from "@/hooks/useFarmerActions";
import { useFarmerSilo } from "@/state/useFarmerSilo";
import { usePriceData } from "@/state/usePriceData";
import { useSiloData } from "@/state/useSiloData";
import useTokenData from "@/state/useTokenData";
import { formatter } from "@/utils/format";
import { getClaimText } from "@/utils/string";
import { StatPanelData } from "@/utils/types";
import { getSiloConvertUrl } from "@/utils/url";
import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import SiloTable from "./silo/SiloTable";
import AccordionGroup, { IBaseAccordionContent } from "@/components/AccordionGroup";

function Silo() {
  const farmerSilo = useFarmerSilo();
  const farmerActions = useFarmerActions();
  const tokenData = useTokenData();
  const priceData = usePriceData();
  const mainToken = tokenData.mainToken;
  const { submitClaimRewards } = useClaimRewards();
  const navigate = useNavigate();
  const isSmallDesktop = useIsSmallDesktop();

  const [hoveredButton, setHoveredButton] = useState("");
  const enableStatPanels =
    farmerSilo.depositsUSD.gt(0) || farmerSilo.activeStalkBalance.gt(0) || farmerSilo.activeSeedsBalance.gt(0);

  // Action states
  const convertEnabled = farmerActions.convertDeposits.enabled;
  const convertFrom = farmerActions.convertDeposits.bestConversion.from;
  const convertTo = farmerActions.convertDeposits.bestConversion.to;
  const bestDeposit = farmerActions.optimalDepositToken?.token;

  const claimEnabled =
    farmerActions.claimRewards.outputs.beanGain.gt(0.01) ||
    farmerActions.claimRewards.outputs.stalkGain.gt(0.01) ||
    farmerActions.claimRewards.outputs.seedGain.gt(0.01) ||
    farmerActions.updateDeposits.enabled;
  const claimableText = getClaimText(
    farmerActions.claimRewards.outputs.beanGain,
    farmerActions.claimRewards.outputs.stalkGain.add(farmerActions.updateDeposits.totalGains.stalkGain),
    farmerActions.claimRewards.outputs.seedGain,
  );
  const hasGerminatingDeposits = Array.from(farmerSilo.deposits.values()).some((depositData) =>
    depositData.deposits.some((deposit) => deposit.isGerminating && !deposit.isPlantDeposit),
  );

  const statPanelData: Record<"stalk" | "seeds" | "depositedValue", StatPanelData> = {
    depositedValue: {
      title: "My Deposited Value",
      mode: "depositedValue",
      mainValue: farmerSilo.depositsUSD,
      mainValueChange: farmerActions.claimRewards.outputs.bdvGain.mul(priceData.price),
      secondaryValue: farmerSilo.depositsBDV,
      actionValue: farmerActions.claimRewards.outputs.bdvGain,
      showActionValues: hoveredButton === "claim",
      isLoading: farmerSilo.isLoading,
    },
    stalk: {
      title: "My Stalk",
      mode: "stalk",
      mainValue: farmerSilo.activeStalkBalance,
      auxValue: farmerSilo.germinatingStalkBalance,
      mainValueChange: farmerActions.claimRewards.outputs.stalkGain,
      secondaryValue: farmerActions.claimRewards.outputs.stalkGain,
      showActionValues: hoveredButton === "claim",
      altTooltipContent:
        "Stalk entitles holders to passive interest in the form of a share of future Pinto. Your Stalk is forfeited when you Withdraw your Deposited assets from the Silo.",
      isLoading: farmerSilo.isLoading,
    },
    seeds: {
      title: "My Seeds",
      mode: "seeds",
      mainValue: farmerSilo.activeSeedsBalance,
      mainValueChange: farmerActions.claimRewards.outputs.seedGain,
      secondaryValue: farmerActions.claimRewards.outputs.seedGain,
      showActionValues: hoveredButton === "claim",
      altTooltipContent: "Seeds are illiquid tokens that yield 1/10,000 Stalk each Season.",
      isLoading: farmerSilo.isLoading,
    },
  };

  return (
    <PageContainer variant={"lgAlt"} bottomMarginOnMobile>
      <div className="flex flex-col w-full items-center">
        <div className="flex flex-col w-full gap-4 sm:gap-12">
          <div className="flex flex-col gap-2">
            <div className="pinto-h2 sm:pinto-h1">Silo</div>
            <div className="pinto-sm sm:pinto-body-light text-pinto-light sm:text-pinto-light">
              Deposit value in the Silo to earn yield.
            </div>
            <LearnSilo />
          </div>
          <Separator />
          {enableStatPanels && (
            <div className="hidden sm:flex flex-col gap-12">
              <div className="flex flex-col items-center">
                <StatPanel {...statPanelData.depositedValue} size={"large"} />
              </div>
              <div className="flex w-full items-center justify-center">
                <div className="flex flex-row gap-18">
                  <div className="px-4">
                    <StatPanel {...statPanelData.stalk} variant={"silo"} />
                  </div>
                  <div className="px-4">
                    <StatPanel {...statPanelData.seeds} variant={"silo"} />
                  </div>
                </div>
              </div>
            </div>
          )}
          <AnimatePresence>
            {hasGerminatingDeposits && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="w-full"
              >
                <GerminationNotice type="multiple" deposits={farmerSilo.deposits} />
              </motion.div>
            )}
          </AnimatePresence>
          <div className="flex flex-col gap-4 sm">
            <div className="pinto-body-light sm:pinto-h3">Deposit Whitelist</div>
            <div className="pinto-sm-light sm:pinto-body-light text-pinto-light sm:text-pinto-light">
              These are Deposits which are currently incentivized by Pinto.
            </div>
            <div className="relative action-container">
              <SiloTable hovering={hoveredButton === "claim"} />
              {convertEnabled && convertFrom && convertTo && (
                <TableRowConnector
                  fromTarget={`token-row-${convertFrom.address}`}
                  toTarget={`token-row-${convertTo.address}`}
                  color="#246645"
                  capHeight={isSmallDesktop ? 52 : 68}
                  extensionLength={isSmallDesktop ? 20 : 35}
                  componentOffset={10}
                  dotted={true}
                  startCapColor={convertFrom.color}
                  endCapColor={convertTo.color}
                  component={
                    <div className="group flex flex-col group max-w-[250px] cursor-pointer place-items-end gap-2">
                      <div
                        data-action-target="convert"
                        className="cursor-pointer convert-color text-[1.25rem] font-[340] tracking-[-0.025rem] leading-[1.375rem] text-end"
                        // @ts-ignore
                        style={{ "--convert-color": convertFrom.color }}
                        onClick={() => navigate(getSiloConvertUrl(convertFrom, convertTo))}
                      >
                        {`Convert ${convertFrom.name}`}
                      </div>
                      {/*
                      <div className="flex flex-col gap-4">
                        <Text
                          data-action-target="convert"
                          variant="sm-light"
                          className="text-pinto-gray-4 text-end opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          {`Convert ${convertFrom.name} for ${convertTo.name} a gain in Seeds`}
                        </Text>
                        <Text
                          data-action-target="convert"
                          variant="sm-light"
                          className="text-pinto-gray-4 text-end opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          {"Arbitrage the increased Seeds reward for a gain in Seeds."}
                        </Text>
                      </div>*/}
                    </div>
                  }
                />
              )}
              {claimEnabled && (
                <HelperLink
                  text={claimableText}
                  className="absolute -right-[90px] max-[1800px]:-right-[215px] top-8 max-[1800px]:whitespace-break-spaces max-[1800px]:w-[160px]"
                  dataTarget={`token-row-${mainToken.address}`}
                  sourceAnchor="left"
                  targetAnchor="right"
                  source90Degree={true}
                  perpLength={10}
                  onClick={submitClaimRewards}
                  onMouseEnter={() => setHoveredButton("claim")}
                  onMouseLeave={() => setHoveredButton("")}
                />
              )}
              {/* {enablePintoToLPHelper && (
                <TableRowConnector
                  toTarget={`token-row-${mainToken.address}`}
                  color="#246645"
                  mode="singleLine"
                  extensionLength={40}
                  dotted={true}
                  endCapColor={mainToken.color}
                  componentOffsetHeight={22}
                  component={
                    <div className="group flex flex-col group max-w-[250px] cursor-pointer place-items-end gap-2">
                      <div
                        data-action-target="convert"
                        className="cursor-pointer convert-color text-[1.25rem] font-[340] tracking-[-0.025rem] leading-[1.375rem] text-end"
                        // @ts-ignore
                        style={{ "--convert-color": mainToken.color }}
                        onClick={() =>
                          navigate(
                            `/silo/${mainToken.address}?action=convert&mode=max`
                          )
                        }
                      >
                        {`Convert ${mainToken.name} to LP`}
                      </div>
                      <div className="flex flex-col gap-4">
                        <div
                          data-action-target="convert"
                          className="pinto-sm-light text-pinto-gray-4 text-end"
                        >
                          {`Arbitrage the increased price of Pinto for an increase in Seeds`}
                        </div>
                      </div>
                    </div>
                  }
                />
              )} */}
              {!convertEnabled && bestDeposit && (
                <TableRowConnector
                  toTarget={`token-row-${bestDeposit.address}`}
                  color="#246645"
                  mode="singleLine"
                  capHeight={isSmallDesktop ? 52 : 68}
                  extensionLength={40}
                  dotted={true}
                  endCapColor={bestDeposit.color}
                  componentOffsetHeight={22}
                  component={
                    <div className="group flex flex-col group max-w-[250px] cursor-pointer place-items-end gap-2">
                      <div
                        data-action-target="convert"
                        className="cursor-pointer convert-color text-[1.25rem] font-[340] tracking-[-0.025rem] leading-[1.375rem] text-end"
                        // @ts-ignore
                        style={{ "--convert-color": bestDeposit.color }}
                        onClick={() => navigate(`/silo/${bestDeposit.address}`)}
                      >
                        {`Deposit ${bestDeposit.name}`}
                      </div>
                      <div className="flex flex-col gap-4">
                        <div
                          data-action-target="convert"
                          className="text-pinto-gray-4 pinto-sm-light text-end w-[12rem]"
                        >
                          {`${bestDeposit.name} currently has the highest incentive for Depositors.`}
                        </div>
                      </div>
                    </div>
                  }
                />
              )}
            </div>
          </div>
          <div className="flex flex-col w-full">
            <div className="flex flex-col gap-6">
          <SiloStats />
          <AccordionGroup items={FAQ_ITEMS} groupTitle="Frequently Asked Questions" />
            </div>
        </div>
        </div>
      </div>
      
      <ActionsMenu showOnTablet />
    </PageContainer>
  );
}

export default Silo;

// ---------- Sub Components ----------

const LearnSilo = () => (
  <>
    <ReadMoreAccordion defaultOpen>
      <div>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore
        magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo
        consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
        pariatur. Excepteur sint occaecat cupidatat non proident
      </div>
    </ReadMoreAccordion>
  </>
);

const SiloStats = () => {
  const siloStats = useSiloStats();

  const stats = [
    {
      label: "Total Deposited PDV",
      value: formatter.twoDec(siloStats.totalDepositedBDV),
    },
    {
      label: "Total Stalk",
      value: formatter.twoDec(siloStats.totalStalk),
    },
    {
      label: "Unique Depositors",
      value: siloStats.uniqueDepositors,
    },
  ] as const;

  return (
    <div className="flex flex-col gap-4">
      <div className="hidden sm:grid grid-cols-3 gap-4">
        {stats.map(({ label, value }) => {
          return (
            <div key={`silo-stat-desktop-${label}`} className="flex flex-col gap-2 items-center">
              <div className="pinto-xs text-pinto-light">{label}</div>
              <div className="pinto-h3 w-full text-center text-pinto-gray-5">{value}</div>
            </div>
          );
        })}
      </div>
      <Col className="flex sm:hidden gap-2">
        {stats.map(({ label, value }) => {
          return (
            <Row key={`silo-stat-mobile-${label}`} className="gap-2 items-center justify-between">
              <div className="pinto-xs text-pinto-light">{label}</div>
              <div className="pinto-sm text-end text-pinto-gray-5">{value}</div>
            </Row>
          );
        })}
      </Col>
    </div>
  );
};

const fakeData: { uniqueDepositors: number; isLoading: boolean } = {
  uniqueDepositors: 413,
  isLoading: false,
};

const useUniqueDepositors = () => {
  return fakeData;
};

const useSiloStats = () => {
  const silo = useSiloData();
  const uniqueDepositors = useUniqueDepositors();

  const totals = useMemo(() => {
    return [...silo.tokenData.values()].reduce<{ totalDepositedBDV: TokenValue }>(
      (acc, tokenData) => {
        acc.totalDepositedBDV = acc.totalDepositedBDV.add(tokenData.depositedBDV);
        return acc;
      },
      {
        totalDepositedBDV: TokenValue.ZERO,
      },
    );
  }, [silo.tokenData]);

  return {
    ...totals,
    ...uniqueDepositors,
    totalStalk: silo.totalStalk,
    isLoading: totals.totalDepositedBDV.lte(0) || uniqueDepositors.isLoading,
  };
};


const FAQ_ITEMS: IBaseAccordionContent[] = [
  {
    key: "what-is-stalk",
    title: "What is Stalk?",
    content:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
  },
  {
    key: "what-is-grown-stalk",
    title: "What is Grown Stalk?",
    content:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
  },
  {
    key: "what-is-seed",
    title: "What are Seeds?",
    content:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam.",
  },
  {
    key: "How-do-you-earn-yield",
    title: "How do you earn yield?",
    content:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip.",
  },
  {
    key: "why-should-i-care-about-grown-stalk",
    title: "Why should I care about Grown Stalk?",
    content:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip.",
  },
  {
    key: "why-should-i-care-about-grown-stalks",
    title: "Why does PINTO need liquidity?",
    content:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip.",
  },
] as const;


/*

Silo Token Page

Want to learn more? 
-> link to the /explorer/silo

Charts
- Total Deposited Value
- Avg Seeds Per BDV

How much stalk they've grown & What does this mean? 
- It would take x months for a new depositor to catch up to me
- I have x multiplier on my mints
- Some fun fact. 
  - You are top x % of grown stalk holders. etc. 
  - Nuggets of information
  
FAQ
- Why does PINTO need liquidity
- What benefit do I get for holding LP?
- Why should I care about Grown Stalk?

Field Page
- implied market cap in which my pods will be paid off

- My plots chart
-> my place in line if I sow now
-> If someone sows before me, how much farther behind will I be? 
-> Somehow convey that you want to get in line asap
-> If I knew how much my sow would affect temperature? 
  if no soil was sold out last season and you were to sow, you decrease the temperature by 0.5%
  -> arrow down by temperature stat?

  Convey how our single actions affect the model
  -> convey the secondary effects of the action

  -> If there no soil, expose link to marketplace. "Come back next season".

Market Page
- FAQ
  - What is the Pod Market?
  - Why should I buy pods in the marketplace?

- Data
  - Charts
    - Executed orders over time
    - Total pods listed over time

  - Stats
    - Total Pods Listed
    - Total Pods Ordered
    - Total Pods Orders Executed


 */