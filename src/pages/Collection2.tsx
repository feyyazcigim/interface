import openSeaLogo from "@/assets/misc/opensea-logo.svg";
import FrameAnimator from "@/components/LoadingSpinner";
import { NFTCard } from "@/components/NFTCard";
import { TraitsCard } from "@/components/TraitsCard";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/Dialog";
import PageContainer from "@/components/ui/PageContainer";
import { Separator } from "@/components/ui/Separator";
import { ERC721ABI } from "@/constants/abi/ERC721ABI";
import { PINTO_BEAVERS_CONTRACT } from "@/constants/address";
import { getCollectionName } from "@/constants/collections";
import { externalLinks } from "@/constants/links";
import { useNFTImage } from "@/hooks/useNFTImage";
import { useEffect, useState } from "react";
import { useAccount, useReadContract, useReadContracts } from "wagmi";

type ViewMode = "owned" | "all";

interface NFTData {
  id: number;
  contractAddress: string;
}

export default function Collection2() {
  const { address } = useAccount();
  const [viewMode, setViewMode] = useState<ViewMode>("owned");
  const [userBeavers, setUserBeavers] = useState<NFTData[]>([]);
  const [allBeavers, setAllBeavers] = useState<NFTData[]>([]);
  const [selectedNFT, setSelectedNFT] = useState<NFTData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Load selected NFT image data for modal
  const {
    imageUrl: selectedImageUrl,
    metadata: selectedMetadata,
    loading: selectedLoading,
  } = useNFTImage(selectedNFT?.contractAddress || "", selectedNFT?.id || 0);

  // Log wallet connection status
  console.log("Collection2 page - Connected address:", address);
  console.log("Collection2 page - Pinto Beavers contract:", PINTO_BEAVERS_CONTRACT);

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
              contractAddress: PINTO_BEAVERS_CONTRACT,
            };
          }
          return null;
        })
        .filter(Boolean) as NFTData[];

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
              contractAddress: PINTO_BEAVERS_CONTRACT,
            };
          }
          return null;
        })
        .filter(Boolean) as NFTData[];

      setAllBeavers(allNFTs);
      console.log("All collection NFTs with real token IDs:", allNFTs);
    } else if (totalSupply && Number(totalSupply) === 0) {
      console.log("Collection has 0 NFTs");
      setAllBeavers([]);
    } else if (allTokenError) {
      console.error("Error fetching all token IDs:", allTokenError);
    }
  }, [allTokenIds, totalSupply, allTokenError]);

  const handleNFTClick = (beaver: NFTData) => {
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
        <div className="pinto-h3 mb-4 text-pinto-dark">No NFT Found</div>
        <div className="pinto-body text-pinto-light mb-6">You can purchase one from a NFT marketplace.</div>
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
        ? "grid-cols-1 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-8"
        : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4";

    return (
      <div className={`grid ${gridCols} gap-2 sm:gap-4`}>
        {displayBeavers.map((beaver, index) => {
          const isOwned = viewMode === "all" && userBeavers.some((owned) => owned.id === beaver.id);

          return (
            <NFTCard
              key={`${beaver.contractAddress}-${beaver.id}`}
              contractAddress={beaver.contractAddress}
              tokenId={beaver.id}
              onClick={() => handleNFTClick(beaver)}
              showOwned={viewMode === "all"}
              isOwned={isOwned}
            />
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
              {viewMode === "owned" ? `Your collection of Pinto NFTs.` : `Browse all Pinto NFTs.`}
            </div>
          </div>

          {/* Toggle link above separator */}
          {/* <div className="flex justify-end">
            <button
              type="button"
              onClick={handleViewModeToggle}
              className="text-pinto-green-4 hover:text-pinto-green-3 pinto-sm font-medium"
            >
              {viewMode === "owned" ? "View All in Collection" : "View My Collection"}
            </button>
          </div> */}

          <Separator />

          <div className="mt-4">
            {(viewMode === "owned" ? userBeavers : allBeavers).length === 0 ? <EmptyState /> : <BeaversGrid />}
          </div>
        </div>
      </div>

      {/* NFT Detail Modal */}
      <Dialog open={isModalOpen} onOpenChange={handleCloseModal}>
        <DialogContent className="w-full h-full max-w-none max-h-none rounded-none border-none bg-white">
          <div className="flex flex-col lg:flex-row h-full">
            {/* Left Panel - NFT Image */}
            <div className="flex-1 lg:flex-[3] bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-2 sm:p-4 lg:p-8 min-h-[40vh] lg:min-h-full">
              <div className="w-full h-full max-w-xs sm:max-w-md lg:max-w-lg max-h-[32vh] sm:max-h-[40vh] lg:max-h-lg bg-white rounded-xl lg:rounded-2xl shadow-lg relative overflow-hidden">
                {selectedLoading && (
                  <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
                    <FrameAnimator size={48} />
                  </div>
                )}

                {selectedImageUrl && !selectedLoading && (
                  <img
                    src={selectedImageUrl}
                    alt={selectedMetadata?.name || `NFT #${selectedNFT?.id}`}
                    className="w-full h-full object-cover"
                  />
                )}

                {!selectedImageUrl && !selectedLoading && (
                  <div className="text-gray-400 pinto-h3 lg:pinto-h2 text-center px-4">
                    {getCollectionName(selectedNFT?.contractAddress || "")} #{selectedNFT?.id}
                  </div>
                )}
              </div>
            </div>

            {/* Right Panel - NFT Details */}
            <div className="flex-1 lg:flex-[2] bg-white flex flex-col h-auto lg:h-full overflow-y-auto">
              {/* Header */}
              <div className="sticky top-0 bg-white z-10 border-b border-gray-100 p-3 sm:p-4 lg:p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h1 className="pinto-h3 sm:pinto-h2 text-pinto-dark mb-1 truncate">
                      {selectedMetadata?.name || `${getCollectionName(PINTO_BEAVERS_CONTRACT)} #${selectedNFT?.id}`}
                    </h1>
                    <p className="pinto-xs sm:pinto-sm text-pinto-light">{getCollectionName(PINTO_BEAVERS_CONTRACT)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="ml-2 sm:ml-4 p-2 rounded-full hover:bg-gray-100 transition-colors flex-shrink-0"
                    aria-label="Close modal"
                  >
                    <svg
                      className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
                {/* Action Section */}
                <div className="space-y-3 sm:space-y-4">
                  <Button
                    asChild
                    variant="default"
                    size="lg"
                    className="w-full py-3 sm:py-4 text-sm sm:text-base font-semibold"
                  >
                    <a
                      href={externalLinks.beaversMarketplace}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 sm:gap-3"
                    >
                      <img src={openSeaLogo} alt="OpenSea" className="w-4 h-4 sm:w-5 sm:h-5" />
                      Trade on OpenSea
                    </a>
                  </Button>
                </div>

                <Separator />

                {/* Traits */}
                <TraitsCard attributes={selectedMetadata?.attributes} />

                <Separator />

                {/* Details */}
                <Card>
                  <CardContent className="p-3 sm:p-4 space-y-3 sm:space-y-4">
                    <h3 className="pinto-h4 sm:pinto-h3 text-pinto-dark">Details</h3>

                    <div className="space-y-2 sm:space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="pinto-xs sm:pinto-sm text-pinto-light">Token ID</span>
                        <span className="pinto-xs sm:pinto-sm font-medium text-pinto-dark">#{selectedNFT?.id}</span>
                      </div>

                      <div className="flex justify-between items-start gap-2">
                        <span className="pinto-xs sm:pinto-sm text-pinto-light flex-shrink-0">Contract Address</span>
                        <a
                          href={`https://basescan.org/address/${selectedNFT?.contractAddress}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[0.65rem] sm:pinto-xs text-pinto-green-3 font-mono hover:underline text-right break-all min-w-0"
                        >
                          {selectedNFT?.contractAddress}
                        </a>
                      </div>

                      {selectedMetadata?.description && (
                        <div className="space-y-1 sm:space-y-2">
                          <span className="pinto-xs sm:pinto-sm text-pinto-light block">Description</span>
                          <p className="pinto-xs sm:pinto-sm text-pinto-dark leading-relaxed">
                            {selectedMetadata.description}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
