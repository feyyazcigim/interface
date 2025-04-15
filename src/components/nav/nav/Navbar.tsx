import AnnouncementBanner from "@/components/AnnouncementBanner";
import HelperLink, { hoveredIdAtom } from "@/components/HelperLink";
import NoBaseValueAlert from "@/components/NoBaseValueAlert";
import { ScrollHideComponent } from "@/components/ScrollHideComponent";
import useFarmerActions from "@/hooks/useFarmerActions";
import useFarmerStatus from "@/hooks/useFarmerStatus";
import { NavbarPanelType, navbarPanelAtom } from "@/state/app/navBar.atoms";
import { useFarmerBalances } from "@/state/useFarmerBalances";
import { useFarmerSilo } from "@/state/useFarmerSilo";
import useFieldSnapshots from "@/state/useFieldSnapshots";
import { usePriceData, useTwaDeltaBLPQuery, useTwaDeltaBQuery } from "@/state/usePriceData";
import useSiloSnapshots from "@/state/useSiloSnapshots";
import { useInvalidateSun, useSeason } from "@/state/useSunData";
import { cn } from "@/utils/utils";
import { useQueryClient } from "@tanstack/react-query";
import clsx from "clsx";
import { useModal } from "connectkit";
import { useAtom } from "jotai";
import { useCallback, useRef } from "react";
import { useMatch } from "react-router-dom";
import { useAccount } from "wagmi";

import chevronDown from "@/assets/misc/ChevronDown.svg";
import sunIcon from "@/assets/protocol/Sun.png";
import { default as pintoIcon, default as pintoIconOriginal } from "@/assets/tokens/PINTO.png";
import { Button } from "@/components/ui/Button";
import IconImage from "@/components/ui/IconImage";
import Panel from "@/components/ui/Panel";
import { Skeleton } from "@/components/ui/Skeleton";
import useIsMobile from "@/hooks/display/useIsMobile";
import useSupplySnapshots from "@/state/useSupplySnapshots";
import WalletButton from "../../WalletButton";
import Backdrop from "../../ui/Backdrop";
import ChartSelectPanel from "../ChartSelectPanel";
import PricePanel from "../PricePanel";
import SeasonsPanel from "../SeasonsPanel";
import Navi from "./Navi.desktop";
import MobileNavi from "./Navi.mobile";

type PanelTypes = "price" | "seasons" | "wallet" | "mobile-navi";

const DURATION = 150;

const Navbar = () => {
  const [panelState, setPanelState] = useAtom(navbarPanelAtom);
  const [, setHoveredId] = useAtom(hoveredIdAtom);

  const walletButton = useRef<HTMLButtonElement>(null);
  const modal = useModal();
  const queryClient = useQueryClient();

  const account = useAccount();
  const season = useSeason();
  const farmerActions = useFarmerActions();
  const farmerBalances = useFarmerBalances();
  const priceData = usePriceData();
  const farmerSilo = useFarmerSilo();
  const invalidateSun = useInvalidateSun();

  const fieldSnapshots = useFieldSnapshots();
  const siloSnapshots = useSiloSnapshots();
  const { refetch: refetchTwaDeltaBLP, queryKey: TwaDeltaBLPQuery } = useTwaDeltaBLPQuery();
  const { refetch: refetchTwaDeltaB } = useTwaDeltaBQuery();

  const hasInternal = farmerActions.totalValue.wallet.internal.gt(0);
  const floodValue = farmerActions.floodAssets.totalValue;
  const usdValue = farmerActions.totalValue.wallet.total;

  const isHome = useMatch("/");
  const isOverview = useMatch("/overview");
  const isSilo = useMatch("/silo");

  const { address, hasDeposits, hasPlots, loading, didLoad } = useFarmerStatus();
  const isNewUser = !address || (!hasDeposits && !hasPlots);
  const showWalletHelper = (isOverview || isSilo) && !isNewUser && !loading && didLoad;

  const isSeasonsPanelOpen = panelState.openPanel === "seasons";
  const isPricePanelOpen = panelState.openPanel === "price";
  const isChartSelectPanelOpen = panelState.openPanel === "chart-select";

  const isLeftPanelOpen = isSeasonsPanelOpen || isPricePanelOpen || isChartSelectPanelOpen;

  const isMobile = useIsMobile();

  const supplySnapshots = useSupplySnapshots();
  const hasFloodOrRain = !!supplySnapshots.data.find(
    (seasonData) => seasonData.floodFieldBeans.gt(0) || seasonData.floodSiloBeans.gt(0),
  );

  const closePanel = () => {
    setPanelState({
      ...panelState,
      backdropVisible: false,
      openPanel: undefined,
      walletPanel: {
        balanceTab: "combined",
        showClaim: false,
        showTransfer: false,
      },
    });
    setHoveredId("");
  };

  const togglePanel = (panel: NavbarPanelType) => {
    if (panelState.openPanel === panel) {
      setPanelState({
        ...panelState,
        backdropVisible: false,
        openPanel: undefined,
        walletPanel: {
          ...panelState.walletPanel,
          showClaim: false,
          showTransfer: false,
        },
      });
    } else {
      setPanelState({
        ...panelState,
        backdropMounted: true,
        backdropVisible: true,
        openPanel: panel,
        walletPanel: {
          ...panelState.walletPanel,
          showClaim: false,
          showTransfer: false,
        },
      });
    }
  };

  const handleHelperLinkClick = () => {
    if (!account.address) {
      modal.setOpen(true);
      return;
    }

    if (floodValue.gt(0)) {
      setPanelState({
        ...panelState,
        openPanel: "wallet",
        backdropMounted: true,
        backdropVisible: true,
        walletPanel: {
          ...panelState.walletPanel,
          showClaim: true,
          showTransfer: false,
        },
      });
    }
    togglePanel("wallet");
  };

  const handleMobileNavToggle = () => {
    // Update panel state directly instead of using immer
    setPanelState({
      ...panelState,
      backdropVisible: !panelState.backdropVisible,
      openPanel: panelState.openPanel === "mobile-navi" ? undefined : "mobile-navi",
      walletPanel: {
        ...panelState.walletPanel,
        showClaim: false,
      },
    });
  };

  const invalidateData = (panel: PanelTypes) => {
    if (panel === "wallet") {
      const allQueryKeys = [...priceData.queryKeys, ...farmerSilo.queryKeys, ...farmerBalances.queryKeys];
      allQueryKeys.forEach((query) => queryClient.invalidateQueries({ queryKey: query, refetchType: "active" }));
    } else if (panel === "seasons") {
      const allQueryKeys = [fieldSnapshots.queryKey, siloSnapshots.queryKey];
      allQueryKeys.forEach((query) => queryClient.invalidateQueries({ queryKey: query, refetchType: "active" }));
      invalidateSun("all", { refetchType: "active" });
    } else if (panel === "price") {
      const allQueryKeys = [...priceData.queryKeys, TwaDeltaBLPQuery];
      allQueryKeys.forEach((query) => queryClient.invalidateQueries({ queryKey: query, refetchType: "active" }));
    }
  };

  const refetchPriceData = useCallback(async () => {
    return Promise.all([priceData.refetch(), refetchTwaDeltaBLP(), refetchTwaDeltaB()]);
  }, [priceData.refetch, refetchTwaDeltaBLP, refetchTwaDeltaB]);

  return (
    <div className="flex flex-col sticky top-0 z-[2]" id="pinto-navbar" style={{ transformOrigin: "top left" }}>
      <AnnouncementBanner />
      <div
        className={cn(
          `grid px-4 pt-4 pb-2 sm:px-6 sm:pt-6 w-full z-[2] ${isHome ? "bg-transparent" : "bg-gradient-light"} action-container transition-colors`,
          styles.navGrid,
        )}
      >
        <div className="flex flex-row">
          <Panel
            isOpen={isLeftPanelOpen}
            side="left"
            panelProps={{
              className: cn(
                isSeasonsPanelOpen
                  ? hasFloodOrRain
                    ? "max-w-panel-seasons w-panel-seasons"
                    : "max-w-panel-seasons-sm w-panel-seasons-sm"
                  : "max-w-panel-price w-panel-price",
                "mt-14",
              ),
            }}
            trigger={<></>}
            toggle={() => togglePanel(panelState.openPanel)}
          >
            {isPricePanelOpen && <PricePanel />}
            {isSeasonsPanelOpen && <SeasonsPanel />}
            {isChartSelectPanelOpen && <ChartSelectPanel />}
          </Panel>
          <div className="flex flex-row gap-4">
            <div className={`transition-all duration-100 ${isPricePanelOpen && "z-[51]"}`}>
              <Button
                variant="outline-primary"
                size="default"
                rounded="full"
                onClick={() => togglePanel("price")}
                onMouseEnter={() => refetchPriceData()}
                noShrink
                className={cn(`flex flex-row gap-0.5 sm:gap-2 ${isPricePanelOpen && "border-pinto-green"}`)}
              >
                <IconImage src={pintoIcon} size={6} alt="pinto icon" />
                {priceData.loading ? (
                  <Skeleton className="w-14 h-6" />
                ) : (
                  <>${Number(priceData.price.toHuman()).toFixed(isMobile ? 3 : 4)}</>
                )}
                <IconImage src={chevronDown} size={4} mobileSize={2.5} alt="chevron down" />
              </Button>
            </div>
            <div className={`transition-all duration-100 ${isSeasonsPanelOpen && "z-[51]"}`}>
              <Button
                variant="outline-secondary"
                onClick={() => togglePanel("seasons")}
                onMouseEnter={() => invalidateData("seasons")}
                noShrink
                rounded="full"
                className={cn(`flex flex-row gap-0.5 sm:gap-2 ${isSeasonsPanelOpen && "border-pinto-green"}`)}
              >
                <IconImage src={sunIcon} size={6} />
                {season === 0 ? (
                  <div className="hidden sm:block">
                    <Skeleton className="w-14 h-6" />
                  </div>
                ) : (
                  <div className="hidden sm:block">Season {season}</div>
                )}
                <IconImage src={chevronDown} size={4} mobileSize={2.5} />
              </Button>
            </div>
          </div>
        </div>
        <div className="hidden lg:flex lg:justify-center pr-[208px]">
          <Navi />
        </div>
        <div className="flex flex-row justify-end">
          <div className="flex flex-row justify-end gap-x-1">
            <div className={`${panelState.openPanel === "wallet" && "z-[51]"} relative`}>
              <div data-action-target={"wallet-button"}>
                <WalletButton
                  isOpen={panelState.openPanel === "wallet"}
                  togglePanel={() => togglePanel("wallet")}
                  onMouseEnter={() => invalidateData("wallet")}
                  ref={walletButton}
                />
              </div>
              {!panelState.openPanel && showWalletHelper && (
                <ScrollHideComponent>
                  <HelperLink
                    onClick={handleHelperLinkClick}
                    text={
                      !account.address
                        ? "Connect your Wallet"
                        : /* : floodValue.gt(0)
                          ? `Claim ${formatter.usd(floodValue)} from Flood`
                          : `Manage ${usdValue.gt(0.01) ? `${formatter.usd(usdValue)} in` : "your"} Wallet ${hasInternal ? "+ Farm Balances" : "Balance"}`
                          */
                          /*
                        `Manage ${usdValue.gt(0.01) ? `${formatter.usd(usdValue)} in` : "your"} Wallet Balance`
                        */
                          `Manage Wallet Balance`
                    }
                    className={`absolute top-[9.375rem] right-[22.5rem] flex flex-row-reverse`}
                    sourceAnchor="right"
                    targetAnchor="left"
                    source90Degree={true}
                    perpLength={5}
                    dataTarget="wallet-button"
                  />
                </ScrollHideComponent>
              )}
            </div>
            <div className={`lg:hidden ${panelState.openPanel === "mobile-navi" && "z-[51]"}`}>
              <MobileNavi
                isOpen={panelState.openPanel === "mobile-navi"}
                togglePanel={() => togglePanel("mobile-navi")}
                close={closePanel}
                mounted={panelState.backdropMounted}
                unmount={handleMobileNavToggle}
              />
            </div>
          </div>
          <div className="hidden sm:block">
            <Backdrop
              active={panelState.backdropVisible}
              noBlur={panelState.openPanel === "chart-select"}
              onClick={closePanel}
              transitionDuration={DURATION}
            />
          </div>
        </div>
      </div>
      <NoBaseValueAlert />
    </div>
  );
};

export default Navbar;

const styles = {
  navGrid: clsx("grid-cols-[180px_1fr] sm:grid-cols-[400px_1fr] lg:grid-cols-[400px_1fr_200px] grid-rows-1"),
} as const;

export const navLinks = {
  about: "/?fromNav=true",
  overview: "/overview",
  silo: "/silo",
  field: "/field",
  swap: "/swap",
  wrap: "/wrap",
  podmarket: "/market/pods",
  explorer: "/explorer",
  whitepaper: "/whitepaper",
  twitter: "https://x.com/pintocommunity",
  docs: "https://docs.pinto.money/",
  discord: "https://pinto.money/discord",
  github: "https://github.com/pinto-org",
  disclosures: "https://docs.pinto.money/disclosures",
  exchange: "https://pinto.exchange/",
  blog: "https://mirror.xyz/0xEA13D1fB14934E41Ee7074198af8F089a6d956B5",
} as const;
