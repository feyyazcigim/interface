import openSeaLogo from "@/assets/misc/opensea-logo.svg";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/Dialog";
import PageContainer from "@/components/ui/PageContainer";
import { Separator } from "@/components/ui/Separator";
import { ERC721ABI } from "@/constants/abi/ERC721ABI";
import { PINTO_BEAVERS_CONTRACT } from "@/constants/address";
import { getCollectionName } from "@/constants/collections";
import { externalLinks } from "@/constants/links";
import { useEffect, useState } from "react";
import { useAccount, useReadContract, useReadContracts } from "wagmi";

type CollectionFilter = "all" | "genesis";
type ViewMode = "owned" | "all";

export default function Collection() {
  const { address } = useAccount();
  const [activeFilter, setActiveFilter] = useState<CollectionFilter>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("owned");
  const [userBeavers, setUserBeavers] = useState<any[]>([]);
  const [allBeavers, setAllBeavers] = useState<any[]>([]);
  const [selectedNFT, setSelectedNFT] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Log wallet connection status
  console.log("Collection page - Connected address:", address);
  console.log("Collection page - Pinto Beavers contract:", PINTO_BEAVERS_CONTRACT);

  // Query user's NFT balance
  const {
    data: balance,
    error: balanceError,
    isLoading: balanceLoading,
  } = useReadContract({
    address: PINTO_BEAVERS_CONTRACT,
    abi: ERC721ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
  });

  // Query total supply of NFTs
  const {
    data: totalSupply,
    error: totalSupplyError,
    isLoading: totalSupplyLoading,
  } = useReadContract({
    address: PINTO_BEAVERS_CONTRACT,
    abi: ERC721ABI,
    functionName: "totalSupply",
  });

  console.log("NFT Balance Query:", {
    balance: balance?.toString(),
    error: balanceError,
    isLoading: balanceLoading,
    address,
  });

  console.log("Total Supply Query:", {
    totalSupply: totalSupply?.toString(),
    error: totalSupplyError,
    isLoading: totalSupplyLoading,
  });

  // Query actual token IDs owned by user
  const userTokenQueries =
    balance && Number(balance) > 0 && address
      ? Array.from({ length: Number(balance) }, (_, index) => ({
          address: PINTO_BEAVERS_CONTRACT,
          abi: ERC721ABI,
          functionName: "tokenOfOwnerByIndex",
          args: [address, BigInt(index)],
        }))
      : [];

  const { data: userTokenIds, error: userTokenError } = useReadContracts({
    contracts: userTokenQueries,
    query: {
      enabled: userTokenQueries.length > 0,
    },
  });

  useEffect(() => {
    if (userTokenIds && userTokenIds.length > 0) {
      console.log("Raw user token IDs response:", userTokenIds);
      const userNFTs = userTokenIds
        .map((result, index) => {
          if (result.status === "success" && result.result) {
            const tokenId = Number(result.result);
            console.log(`User owns token ID: ${tokenId}`);
            return {
              id: tokenId,
              name: `${getCollectionName(PINTO_BEAVERS_CONTRACT)} #${tokenId}`,
              description: null,
              image: null,
            };
          }
          return null;
        })
        .filter(Boolean);

      setUserBeavers(userNFTs);
      console.log("User NFTs with real token IDs:", userNFTs);
    } else if (balance && Number(balance) === 0) {
      console.log("User has 0 NFTs");
      setUserBeavers([]);
    } else if (userTokenError) {
      console.error("Error fetching user token IDs:", userTokenError);
    }
  }, [userTokenIds, balance, userTokenError]);

  // Query actual token IDs for all tokens in collection
  const allTokenQueries =
    totalSupply && Number(totalSupply) > 0
      ? Array.from({ length: Number(totalSupply) }, (_, index) => ({
          address: PINTO_BEAVERS_CONTRACT,
          abi: ERC721ABI,
          functionName: "tokenByIndex",
          args: [BigInt(index)],
        }))
      : [];

  const { data: allTokenIds, error: allTokenError } = useReadContracts({
    contracts: allTokenQueries,
    query: {
      enabled: allTokenQueries.length > 0,
    },
  });

  useEffect(() => {
    if (allTokenIds && allTokenIds.length > 0) {
      console.log("Raw all token IDs response:", allTokenIds);
      const allNFTs = allTokenIds
        .map((result, index) => {
          if (result.status === "success" && result.result) {
            const tokenId = Number(result.result);
            console.log(`Collection token ID: ${tokenId}`);
            return {
              id: tokenId,
              name: `${getCollectionName(PINTO_BEAVERS_CONTRACT)} #${tokenId}`,
              description: null,
              image: null,
            };
          }
          return null;
        })
        .filter(Boolean);

      setAllBeavers(allNFTs);
      console.log("All collection NFTs with real token IDs:", allNFTs);
    } else if (totalSupply && Number(totalSupply) === 0) {
      console.log("Collection has 0 NFTs");
      setAllBeavers([]);
    } else if (allTokenError) {
      console.error("Error fetching all token IDs:", allTokenError);
    }
  }, [allTokenIds, totalSupply, allTokenError]);

  const handleFilterToggle = (filter: CollectionFilter) => {
    setActiveFilter(activeFilter === filter ? "all" : filter);
  };

  const handleNFTClick = (beaver: any) => {
    console.log("NFT clicked:", beaver);
    setSelectedNFT(beaver);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    // Delay clearing the selected NFT to prevent text flicker during modal close animation
    setTimeout(() => {
      setSelectedNFT(null);
    }, 150);
  };

  const handleViewModeToggle = () => {
    const newMode = viewMode === "owned" ? "all" : "owned";
    setViewMode(newMode);
    console.log("View mode changed to:", newMode);
  };

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="text-center max-w-md">
        <div className="pinto-h3 mb-4 text-pinto-dark">No Beavers Found</div>
        <div className="pinto-body text-pinto-light mb-6">
          You have no Beavers. You can purchase one from a NFT marketplace.
        </div>
        <Button asChild variant="outline" className="rounded-[0.75rem] font-medium inline-flex items-center gap-2">
          <a href={externalLinks.beaversMarketplace} target="_blank" rel="noopener noreferrer">
            <img src={openSeaLogo} alt="OpenSea" className="w-5 h-5" />
            Visit OpenSea
          </a>
        </Button>
      </div>
    </div>
  );

  const BeaversGrid = () => {
    const displayBeavers = viewMode === "owned" ? userBeavers : allBeavers;
    const gridCols =
      viewMode === "all"
        ? "grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-8"
        : "grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4";

    return (
      <div className={`grid ${gridCols} gap-2 sm:gap-4`}>
        {displayBeavers.map((beaver, index) => {
          const isOwned = viewMode === "all" && userBeavers.some((owned) => owned.id === beaver.id);

          return (
            <Card
              key={index}
              className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer hover:scale-105 transform transition-transform relative"
              onClick={() => handleNFTClick(beaver)}
            >
              {/* Ownership badge for "all" view mode */}
              {viewMode === "all" && isOwned && (
                <div className="absolute top-1 right-1 sm:top-2 sm:right-2 bg-pinto-green-1 text-pinto-green-3 text-xs px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full z-10">
                  Owned
                </div>
              )}
              <CardContent className="p-0">
                <div className="aspect-square bg-gray-100 flex items-center justify-center">
                  <div className="text-gray-400 text-xs sm:pinto-sm">Beaver #{beaver.id}</div>
                </div>
                <div className="p-2 sm:p-3">
                  <div className="text-xs sm:pinto-xs font-medium mb-1">{beaver.name}</div>
                  {viewMode === "owned" && beaver.description && (
                    <div className="text-xs sm:pinto-xs text-pinto-light">{beaver.description}</div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  if (!address) {
    return (
      <PageContainer variant="xl">
        <div className="flex flex-col w-full mt-4 sm:mt-0">
          <div className="flex flex-col self-center w-full gap-4 mb-20 sm:mb-0 sm:gap-8">
            <div className="flex flex-col gap-y-3">
              <div className="pinto-h2 sm:pinto-h1">My Collection</div>
              <div className="pinto-sm sm:pinto-body-light text-pinto-light">
                Connect your wallet to view your collection of Pinto Beavers.
              </div>
            </div>
            <Separator />
            <div className="flex flex-col items-center justify-center py-16">
              <div className="text-center">
                <div className="pinto-body text-pinto-light mb-4">
                  Please connect your wallet to view your collection.
                </div>
              </div>
            </div>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer variant="xl">
      <div className="flex flex-col w-full mt-4 sm:mt-0">
        <div className="flex flex-col self-center w-full gap-4 mb-20 sm:mb-0 sm:gap-8">
          <div className="flex flex-col gap-y-3">
            <div className="pinto-h2 sm:pinto-h1">
              {viewMode === "owned" ? "My Collection" : `${getCollectionName(PINTO_BEAVERS_CONTRACT)}s Collection`}
            </div>
            <div className="pinto-sm sm:pinto-body-light text-pinto-light">
              {viewMode === "owned"
                ? `Your collection of ${getCollectionName(PINTO_BEAVERS_CONTRACT)}s.`
                : `Browse all ${getCollectionName(PINTO_BEAVERS_CONTRACT)}s.`}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => handleFilterToggle("genesis")}
              className={`rounded-full font-medium px-6 py-2 ${
                activeFilter === "genesis"
                  ? "bg-pinto-green-1 text-pinto-green-3 border-pinto-green-3 hover:bg-pinto-green-1/90"
                  : "hover:bg-pinto-green-1/50 hover:text-pinto-gray-4"
              }`}
            >
              {getCollectionName(PINTO_BEAVERS_CONTRACT)}s
            </Button>
            {viewMode === "owned" && (
              <Button
                variant="outline"
                onClick={() => handleFilterToggle("all")}
                className={`rounded-full font-medium px-6 py-2 ${
                  activeFilter === "all"
                    ? "bg-pinto-green-1 text-pinto-green-3 border-pinto-green-3 hover:bg-pinto-green-1/90"
                    : "hover:bg-pinto-green-1/50 hover:text-pinto-gray-4"
                }`}
              >
                All
              </Button>
            )}
          </div>

          {/* Toggle link above separator */}
          {activeFilter === "genesis" && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleViewModeToggle}
                className="text-pinto-green-4 hover:text-pinto-green-3 pinto-sm font-medium"
              >
                {viewMode === "owned" ? "View All in Collection" : "View My Collection"}
              </button>
            </div>
          )}

          <Separator />

          <div className="mt-4">
            {(viewMode === "owned" ? userBeavers : allBeavers).length === 0 ? <EmptyState /> : <BeaversGrid />}
          </div>
        </div>
      </div>

      {/* NFT Detail Modal */}
      <Dialog open={isModalOpen} onOpenChange={handleCloseModal}>
        <DialogContent className="max-w-2xl mx-auto w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">
              {getCollectionName(PINTO_BEAVERS_CONTRACT)} #{selectedNFT?.id}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
            {/* NFT Image */}
            <div className="flex-shrink-0 w-full sm:w-80 h-80 bg-gray-100 rounded-lg flex items-center justify-center">
              {selectedNFT?.image ? (
                <img src={selectedNFT.image} alt={selectedNFT.name} className="w-full h-full object-cover rounded-lg" />
              ) : (
                <div className="text-gray-400 pinto-h3">Beaver #{selectedNFT?.id}</div>
              )}
            </div>

            {/* NFT Metadata */}
            <div className="flex-1 space-y-3 sm:space-y-4">
              <div className="space-y-2 sm:space-y-3">
                <div>
                  <span className="text-sm sm:pinto-sm font-medium">Token ID:</span>
                  <span className="text-sm sm:pinto-sm text-pinto-light ml-2">#{selectedNFT?.id}</span>
                </div>
                {selectedNFT?.description && (
                  <div>
                    <span className="text-sm sm:pinto-sm font-medium">Description:</span>
                    <p className="text-sm sm:pinto-sm text-pinto-light mt-1">{selectedNFT?.description}</p>
                  </div>
                )}
                <div>
                  <span className="text-sm sm:pinto-sm font-medium">Contract:</span>
                  <a
                    href={`https://basescan.org/address/${PINTO_BEAVERS_CONTRACT}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs sm:pinto-xs text-pinto-green-3 mt-1 font-mono break-all hover:underline block"
                  >
                    {PINTO_BEAVERS_CONTRACT.slice(0, 8)}...{PINTO_BEAVERS_CONTRACT.slice(-6)}
                  </a>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 sm:pt-4">
                <Button asChild variant="default" className="w-full text-sm sm:text-base py-2 sm:py-3">
                  <a
                    href={externalLinks.beaversMarketplace}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2"
                  >
                    <img src={openSeaLogo} alt="OpenSea" className="w-4 h-4" />
                    Trade on OpenSea
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
