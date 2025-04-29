import PageContainer from "@/components/ui/PageContainer";
import { Separator } from "@/components/ui/Separator";
import useRouterTabs, { UseRouterTabsOptions } from "@/hooks/useRouterTabs";
import { useCallback } from "react";
import AllExplorer from "./explorer/AllExplorer";
import FarmerExplorer from "./explorer/FarmerExplorer";
import FieldExplorer from "./explorer/FieldExplorer";
import PintoExplorer from "./explorer/PintoExplorer";

import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import SeasonsExplorer from "./explorer/SeasonsExplorer";
import SiloExplorer from "./explorer/SiloExplorer";

const TABS = [
  {
    urlSlug: "pinto",
    tabName: "Pinto",
  },
  {
    urlSlug: "silo",
    tabName: "Silo",
  },
  {
    urlSlug: "field",
    tabName: "Field",
  },
  {
    urlSlug: "farmer",
    tabName: "Farmer",
  },
  {
    urlSlug: "seasons",
    tabName: "Seasons",
    description:
      "Seasons are how Pinto keeps time. Each Season is about 1 hour. Pinto adjusts the supply and various incentives every Season to facilitate price stability.",
  },
  {
    urlSlug: "all",
    tabName: "All",
  },
];

const routerSlugs = TABS.map((t) => t.urlSlug);
const routerTabsOptions: UseRouterTabsOptions = {
  type: "path",
  key: "tab",
  pathname: "/explorer/:tab",
};
const Explorer = () => {
  const [tab, handleChangeTab] = useRouterTabs(routerSlugs, routerTabsOptions);

  const handleMainTabClickFactory = useCallback(
    (selection: string) => () => handleChangeTab(selection),
    [handleChangeTab],
  );

  const selectedIdx = TABS.findIndex((t) => t.urlSlug === tab);
  const description = TABS[selectedIdx].description;
  const removeBottomPadding = selectedIdx === 4; //Remove on seasons table for the pagination to fit nicely on the bottm

  return (
    <ExplorerProvider>
      <PageContainer variant="xlAltExplorer" removeBottomPadding={removeBottomPadding}>
        <div className="flex flex-col w-full items-center">
          <div className="flex flex-col w-full gap-4 sm:gap-8">
            <div className="flex flex-col gap-2 sm:ml-4">
              <div className="pinto-h2 sm:pinto-h1 ml-[-3px]">Explorer</div>
              <div className="flex gap-6 sm:gap-10 mt-4 sm:mt-8 overflow-x-auto scrollbar-none  ml-[-1px]">
                {TABS.map(({ tabName, urlSlug }, idx) => (
                  <div
                    key={tabName}
                    data-state={selectedIdx === idx ? "active" : "inactive"}
                    onClick={handleMainTabClickFactory(urlSlug)}
                    className={`pinto-h4 sm:pinto-h3 shrink-0 cursor-pointer ${selectedIdx === idx ? "text-pinto-primary sm:text-pinto-primary" : "text-pinto-light sm:text-pinto-light"} data-[state=inactive]:hover:text-pinto-green-3`}
                  >
                    {tabName}
                  </div>
                ))}
              </div>
            </div>
            {description && (
              <div className="hidden sm:grid px-4 grid-column-0">
                <span>Seasons</span>
                <span className="text-pinto-gray-4">{description}</span>
              </div>
            )}
            <Separator />
            {selectedIdx === 0 && <PintoExplorer />}
            {selectedIdx === 1 && <SiloExplorer />}
            {selectedIdx === 2 && <FieldExplorer />}
            {selectedIdx === 3 && <FarmerExplorer />}
            {selectedIdx === 4 && <SeasonsExplorer />}
            {selectedIdx === 5 && <AllExplorer />}
          </div>
        </div>
      </PageContainer>
    </ExplorerProvider>
  );
};
export default Explorer;

const explorerQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24 * 30, // 30 days
    },
    dehydrate: {
      shouldDehydrateQuery: (query) => {
        return query.meta?.persist === true;
      },
    },
  },
});

const localStoragePersister = createSyncStoragePersister({
  storage: window.localStorage,
});

/**
 *
 * Create a separate persister for The Explorer page only to prevent the persisting behavior from affecting other pages.
 * Otherwise, 'meta: { persist: true }' & { gcTime: ms } will have to be applied to all queries throughout the app
 *
 * If the cache that is found has a different buster string than what is set here, it will be discarded.
 * Should be changed whenever there's a significant change in the subgraphs.
 * Currently it is based on the date that the string is being set, in the YYYYMMDD format.
 * But really it can be anything, as long as it's different than what's expected to be stored.
 */
const ExplorerProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <PersistQueryClientProvider
      client={explorerQueryClient}
      persistOptions={{ persister: localStoragePersister, buster: "20250422" }}
    >
      {children}
    </PersistQueryClientProvider>
  );
};
