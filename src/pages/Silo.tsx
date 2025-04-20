import { TokenValue } from "@/classes/TokenValue";
import AccordionGroup, { IBaseAccordionContent } from "@/components/AccordionGroup";
import ActionsMenu from "@/components/ActionsMenu";
import { Col, Row } from "@/components/Container";
import DonutChart from "@/components/DonutChart";
import GerminationNotice from "@/components/GerminationNotice";
import HelperLink from "@/components/HelperLink";
import ReadMoreAccordion from "@/components/ReadMoreAccordion";
import StatPanel from "@/components/StatPanel";
import TableRowConnector from "@/components/TableRowConnector";
import { TimeTab, tabToSeasonalLookback } from "@/components/charts/SeasonalChart";
import { navLinks } from "@/components/nav/nav/Navbar";
import { Card } from "@/components/ui/Card";
import IconImage from "@/components/ui/IconImage";
import PageContainer from "@/components/ui/PageContainer";
import { Separator } from "@/components/ui/Separator";
import useIsMobile from "@/hooks/display/useIsMobile";
import useIsSmallDesktop from "@/hooks/display/useIsSmallDesktop";
import { useClaimRewards } from "@/hooks/useClaimRewards";
import useFarmerActions from "@/hooks/useFarmerActions";
import { useSeasonalSiloActiveFarmers } from "@/state/seasonal/seasonalDataHooks";
import { useFarmerSilo } from "@/state/useFarmerSilo";
import { usePriceData } from "@/state/usePriceData";
import { useSeedGauge } from "@/state/useSeedGauge";
import { useSiloData } from "@/state/useSiloData";
import { useSeason } from "@/state/useSunData";
import useTokenData, { useWhitelistedTokens } from "@/state/useTokenData";
import { formatter } from "@/utils/format";
import { getClaimText } from "@/utils/string";
import { getTokenIndex } from "@/utils/token";
import { StatPanelData, Token } from "@/utils/types";
import { getSiloConvertUrl } from "@/utils/url";
import { cn } from "@/utils/utils";
import { AnimatePresence, motion } from "framer-motion";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { label } from "three/webgpu";
import SiloTable from "./silo/SiloTable";

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
          <div className="flex flex-col w-full gap-8">
            {/* <div className="grid grid-cols-[1fr_2fr]"> */}
            <div className="w-full">
              <SiloStats />
            </div>
            <div className="w-full">
              <AccordionGroup items={FAQ_ITEMS} allExpanded={false} groupTitle="Frequently Asked Questions" />
            </div>
            {/* </div> */}
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

const SiloStats = React.memo(() => {
  const { data: siloStats, siloWhitelistData, isLoading } = useSiloStats();

  const [hoveredIndex, setHoveredIndex] = useState<number | undefined>(undefined);

  const handleSetHoveredIndex = useCallback((index: number) => {
    setHoveredIndex(index);
  }, []);

  return (
    <Card className="flex flex-col p-6 gap-6 h-auto w-full">
      <Col className="gap-2">
        <div className="flex flex-row gap-4">
          <SiloStatContent data={siloStats} isLoading={isLoading} />
        </div>
        <Link
          to="/explorer/silo"
          className="pinto-xs sm:pinto-sm font-light text-pinto-green-4 sm:text-pinto-green-4 hover:underline transition-all mt-2"
        >
          See more data →
        </Link>
      </Col>
      <div className="grid grid-cols-[2fr_3fr] gap-4 w-full justify-between">
        <Col className="gap-4 self-stretch pt-4">
          {Object.entries(siloWhitelistData).map(([key, wlData], i) => {
            return (
              <HoveredSiloTokenStatContent
                key={`${key}-${wlData.token.symbol}`}
                wlTokenSiloDetails={wlData}
                isHovered={(hoveredIndex || 0) === i}
              />
            );
          })}
        </Col>
        <DepositedByTokenDoughnutChart
          setHoveredIndex={handleSetHoveredIndex}
          siloWhitelistData={siloWhitelistData}
          isLoading={isLoading}
        />
        <div className="" />
      </div>
    </Card>
  );
});

interface HoveredSiloTokenStatContentProps {
  wlTokenSiloDetails: SiloTokenDepositOverallDetails;
  isHovered: boolean;
}

const HoveredSiloTokenStatContent = ({ wlTokenSiloDetails, isHovered }: HoveredSiloTokenStatContentProps) => {
  const {
    token,
    depositedBDV,
    depositedAmount,
    siloDepositedRatio,
    optimalPctDepositedBdv,
    currentDepositedLPBDVRatio,
  } = wlTokenSiloDetails;
  const { tokenPrices } = usePriceData();

  if (!isHovered) return null;

  const usdPrice = tokenPrices.get(token)?.instant;

  const usdDeposited = usdPrice ? depositedAmount.mul(usdPrice) : undefined;

  return (
    <Col className="gap-4 justify-start self-stretch h-auto">
      <div className="pinto-body sm:pinto-body-light flex flex-row gap-1">
        <span>{<IconImage size={5} src={token.logoURI} />}</span>
        <>{token.symbol}</>
      </div>
      <Row className="gap-2 justify-between">
        <div className="pinto-sm-light sm:pinto-body-light text-pinto-light sm:text-pinto-light">
          Total Deposited Amount:
        </div>
        <div className="pinto-body sm:pinto-body-light flex flex-row gap-1">
          <span>
            <IconImage size={5} src={token.logoURI} />
          </span>
          {formatter.token(depositedAmount, token)}
        </div>
      </Row>
      <Row className="gap-2 justify-between">
        <div className="pinto-sm-light sm:pinto-body-light text-pinto-light sm:text-pinto-light">
          Total Deposited BDV:
        </div>
        <div className="pinto-body sm:pinto-body-light flex flex-row gap-2">{formatter.twoDec(depositedBDV)}</div>
      </Row>
      <Row className="gap-2 justify-between">
        <div className="pinto-sm-light sm:pinto-body-light text-pinto-light sm:text-pinto-light">
          Total Deposited Value:
        </div>
        <div className="pinto-body sm:pinto-body-light flex flex-row gap-2">
          {usdDeposited ? formatter.usd(usdDeposited) : "--"}
        </div>
      </Row>
      <Row className="gap-2 justify-between">
        <div className="pinto-sm-light sm:pinto-body-light text-pinto-light sm:text-pinto-light">
          % of Total Deposited PDV:
        </div>
        <div className="pinto-body sm:pinto-body-light flex flex-row gap-2">
          {formatter.pct(siloDepositedRatio.mul(100))}
        </div>
      </Row>
      <Row className="gap-2 justify-between">
        <div className="pinto-sm-light sm:pinto-body-light text-pinto-light sm:text-pinto-light">
          Optimal % LP Deposited PDV:
        </div>
        <div className="pinto-body sm:pinto-body-light flex flex-row gap-2">
          {token.isLP ? formatter.pct(optimalPctDepositedBdv) : "N/A"}
        </div>
      </Row>
      <Row className="gap-2 justify-between">
        <div className="pinto-sm-light sm:pinto-body-light text-pinto-light sm:text-pinto-light">
          Current % LP Deposited PDV:
        </div>
        <div className="pinto-body sm:pinto-body-light flex flex-row gap-2">
          {token.isLP ? formatter.pct(currentDepositedLPBDVRatio.mul(100)) : "N/A"}
        </div>
      </Row>
    </Col>
  );
};

const SiloStatContent = ({
  data,
  isLoading,
}: { data: ReturnType<typeof useSiloStats>["data"]; isLoading: boolean }) => {
  const stats = useMemo(
    () => [
      {
        label: "Total Deposited PDV",
        subLabel: "Total Pinto Denominated Value deposited into the Silo",
        value: formatter.twoDec(data.totalDepositedBDV),
      },
      {
        label: "Total Stalk",
        subLabel: "Total Stalk issued to Silo Depositors",
        value: formatter.twoDec(data.totalStalk),
      },
      {
        label: "Active Farmers",
        subLabel: "Total number of unique depositors in the Silo",
        value: data.uniqueDepositors,
      },
    ],
    [data.totalDepositedBDV, data.totalStalk, data.uniqueDepositors],
  );

  return (
    <>
      <div className="hidden sm:flex flex-row gap-x-12 gap-y-4 flex-wrap w-full">
        {stats.map(({ label, subLabel, value }) => {
          return (
            <div key={`silo-stat-desktop-${label}`} className="flex flex-col flex-grow gap-1 sm:gap-2">
              <div className="pinto-sm-light sm:pinto-body-light font-thin">{label}</div>
              <div className="pinto-xs sm:pinto-sm text-pinto-light sm:text-pinto-light">{subLabel}</div>
              <div className="pinto-body sm:pinto-h3">{isLoading ? "--" : value}</div>
            </div>
          );
        })}
      </div>
      <Col className="flex sm:hidden gap-2 w-full">
        {stats.map(({ label, value }) => {
          return (
            <Row key={`silo-stat-mobile-${label}`} className="gap-2 items-center justify-between">
              <div className="pinto-xs">{label}</div>
              <div className="pinto-sm text-end">{value}</div>
            </Row>
          );
        })}
      </Col>
    </>
  );
};

const donutOptions = {
  layout: {
    padding: 12,
  },
  plugins: {
    tooltip: {
      enabled: true,
      callbacks: {
        label: (context) => {
          return `% TVD: ${context.formattedValue}%`;
        },
      },
    },
  },
} as const;

const chartColors = [
  "#246645", // Pinto Green (pinto-green-3)
  "#1E6091", // Deep Blue
  "#D62828", // Vibrant Red
  "#8338EC", // Bright Purple
  "#FF9F1C", // Golden Orange
  "#00BCD4", // Light Blue / Cyan
];

// Memoize to prevent chart animations from re-rendering
const DepositedByTokenDoughnutChart = React.memo(
  (
    props: Omit<ReturnType<typeof useSiloStats>, "data"> & {
      setHoveredIndex: (index: number) => void;
    },
  ) => {
    const { siloWhitelistData, isLoading, setHoveredIndex } = props;

    const isMobile = useIsMobile();

    const donutChartProps = useMemo(() => {
      return {
        labels: Object.keys(siloWhitelistData),
        datasets: [
          {
            label: "",
            data: Object.values(siloWhitelistData).map((d) => d.siloDepositedRatio.mul(100).toNumber()),
            backgroundColor: chartColors,
            borderWidth: 0,
            offset: 2,
            borderRadius: 4,
          },
        ],
      };
    }, [siloWhitelistData]);

    return (
      <Col className="relative gap-4 items-center">
        <div className="pinto-sm-light sm:pinto-body-light font-thin">Silo Deposits By Token</div>
        <div className="flex flex-col self-stretch items-center">
          <DonutChart
            className={cn("w-72 h-72", isMobile && "w-40 h-40")}
            size={isMobile ? 120 : 350}
            data={donutChartProps}
            options={donutOptions}
            showLabels={true}
            onHover={setHoveredIndex}
          />
        </div>
      </Col>
    );
  },
);

const useUniqueDepositors = () => {
  const season = useSeason();
  const query = useSeasonalSiloActiveFarmers(Math.max(0, season - tabToSeasonalLookback(TimeTab.Week)), season);

  return {
    ...query,
    data: query.data?.length ? query.data[0].value : undefined,
  };
};

type SiloTokenDepositOverallDetails = {
  token: Token;
  depositedBDV: TokenValue;
  depositedAmount: TokenValue;
  siloDepositedRatio: TokenValue;
  optimalPctDepositedBdv: TokenValue;
  currentDepositedLPBDVRatio: TokenValue;
};

const baseObj: Omit<SiloTokenDepositOverallDetails, "token"> = {
  depositedBDV: TokenValue.ZERO,
  siloDepositedRatio: TokenValue.ZERO,
  depositedAmount: TokenValue.ZERO,
  optimalPctDepositedBdv: TokenValue.ZERO,
  currentDepositedLPBDVRatio: TokenValue.ZERO,
};

const reduceTotalDepositedBDV = (tokenData: ReturnType<typeof useSiloData>["tokenData"]) => {
  const entries = [...tokenData.entries()];
  return entries.reduce<TokenValue>((acc, [_, tokenData]) => acc.add(tokenData.depositedBDV), TokenValue.ZERO);
};

const useSiloStats = () => {
  const [totalDepositedBDV, setTotalDepositedBDV] = useState<TokenValue>(TokenValue.ZERO);
  const [byToken, setByToken] = useState<Record<string, SiloTokenDepositOverallDetails>>({});
  const whitelist = useWhitelistedTokens();

  const uniqueDepositors = useUniqueDepositors();
  const seedGauge = useSeedGauge();
  const silo = useSiloData();

  const gaugeDataLoaded = !!Object.values(seedGauge.data.gaugeData).length && !seedGauge.isLoading;
  const siloDataLoaded = !!silo.tokenData.size;

  const dataLoaded = gaugeDataLoaded && siloDataLoaded;

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (!dataLoaded) return;

    const totalBDV = reduceTotalDepositedBDV(silo.tokenData);

    // Only set data if data has changed.
    if (totalBDV.gt(0) && totalDepositedBDV.eq(totalBDV)) return;

    const map = whitelist.reduce<Record<string, SiloTokenDepositOverallDetails>>((prev, token) => {
      const obj = { token, ...baseObj };

      const wlTokenData = silo.tokenData.get(token);
      const tokenGaugeData = seedGauge.data.gaugeData[getTokenIndex(token)];

      if (wlTokenData) {
        obj.depositedBDV = wlTokenData.depositedBDV;
        obj.siloDepositedRatio = wlTokenData.depositedBDV.div(totalBDV);
        obj.depositedAmount = wlTokenData.totalDeposited;
      }

      if (tokenGaugeData) {
        obj.optimalPctDepositedBdv = tokenGaugeData.optimalPctDepositedBdv;
        obj.currentDepositedLPBDVRatio = tokenGaugeData.currentDepositedLPBDVRatio ?? TokenValue.ZERO;
      }

      prev[token.symbol] = obj;
      return prev;
    }, {});

    setTotalDepositedBDV(totalBDV);
    setByToken(map);
  }, [whitelist, silo.tokenData, seedGauge.data.gaugeData]);

  const isLoading = uniqueDepositors.isLoading || totalDepositedBDV.lte(0);

  return useMemo(() => {
    return {
      data: {
        totalDepositedBDV: totalDepositedBDV,
        uniqueDepositors: uniqueDepositors.data,
        totalStalk: silo.totalStalk,
      },
      siloWhitelistData: byToken,
      isLoading,
    };
  }, [totalDepositedBDV, uniqueDepositors.data, silo.totalStalk, byToken, isLoading]);
};

const FAQ_ITEMS: IBaseAccordionContent[] = [
  {
    key: "what-is-stalk",
    title: "What is Stalk?",
    content:
      "Stalk is a Pinto native asset that represents your ownership of the Silo. When Pinto is above it's value target, more Pintos are issued and distributed amongst the Silo and Field. The higher your ownership, the larger your share of the pinto mints.",
  },
  {
    key: "how-do-i-get-more-stalk",
    title: "How do I get more Stalk?",
    content: (
      <div className="flex flex-col gap-2 pinto-sm font-thin text-pinto-light">
        <>{"There are two ways to get more Stalk."}</>
        <ul className="flex flex-col gap-1 pl-2">
          <li>
            {
              "- You can deposit more into the Silo to get more stalk. 1 Pinto (or Pinto Denominated Value) gives you 1 Stalk."
            }
          </li>
          <li>
            {
              "- Every season you stay in the silo, you earn Stalk based on the amount of seeds you have. Each seed earns 1/10000 stalk. The amount of seeds you have is based on the amount and token type you deposited in the Silo."
            }
          </li>
        </ul>
      </div>
    ),
  },
  {
    key: "can-i-lose-stalk",
    title: "Can I lose Stalk?",
    content: (
      <>
        <span className="font-medium">Yes.</span> Upon withdrawing from the Silo, you forfeit all stalk grown from the
        withdrawn amount, and cannot be regained.
      </>
    ),
  },
  {
    key: "can-i-switch-my-deposit-type",
    title: "Can I switch my Deposit type?",
    content:
      "Yes! Pinto allows you to Convert your Pinto Deposits to LP Deposits, when Pinto is above its value target, and LP Deposits to Pinto Deposits below its value target, without losing Stalk. Pinto also allows you to Convert between LP types.",
  },
  {
    key: "how-can-i-maximize-stalk-growth",
    title: "How can I maximize Stalk growth?",
    content:
      "A user can maximize their stalk growth by maximizing their seeds, which may change on a season-by-season basis. The system incentivizes conversions to occur by adjusting the seed values of each Silo Token as needed every season.",
  },
  {
    key: "how-c",
    title: "How can I learn more on the Silo?",
    content: (
      <>
        Head to the{" "}
        <Link
          className="text-pinto-green-4 hover:underline transition-all"
          to={`${navLinks.docs}/farm/silo`}
          rel="noopener noreferrer"
          target="_blank"
        >
          Pinto docs
        </Link>{" "}
        for more info, or ask any questions in the{" "}
        <Link
          className="text-pinto-green-4 hover:underline transition-all"
          to={navLinks.discord}
          rel="noopener noreferrer"
          target="_blank"
        >
          discord
        </Link>{" "}
        community!
      </>
    ),
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
