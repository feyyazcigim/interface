import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";

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
 * Create a separate persister to prevent the persisting behavior from affecting other pages.
 * Otherwise, 'meta: { persist: true }' & { gcTime: ms } will have to be applied to all queries throughout the app.
 *
 * If the cache that is found has a different buster string than what is set here, it will be discarded.
 * Should be changed whenever there's a significant change in the subgraphs.
 * Currently it is based on the date that the string is being set, in the YYYYMMDD format.
 * But really it can be anything, as long as it's different than what's expected to be stored.
 */
const PersistReactQueryClientProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <PersistQueryClientProvider
      client={explorerQueryClient}
      persistOptions={{ persister: localStoragePersister, buster: "20250422" }}
    >
      {children}
    </PersistQueryClientProvider>
  );
};

export default PersistReactQueryClientProvider;
