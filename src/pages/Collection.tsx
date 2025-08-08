import openSeaLogo from "@/assets/misc/opensea-logo.svg";
import { NFTCard } from "@/components/NFTCard";
import { NFTCardFlipReveal } from "@/components/NFTCardFlipReveal";
import { TraitsCard } from "@/components/TraitsCard";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Dialog, DialogContent } from "@/components/ui/Dialog";
import PageContainer from "@/components/ui/PageContainer";
import { Separator } from "@/components/ui/Separator";
import { abiSnippets } from "@/constants/abiSnippets";
import { NFT_COLLECTION_1_CONTRACT } from "@/constants/address";
import { getCollectionName } from "@/constants/collections";
import { externalLinks } from "@/constants/links";
import { useCardFlipAnimation } from "@/hooks/useCardFlipAnimation";
import { useNFTImage } from "@/hooks/useNFTImage";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAccount, useReadContract, useReadContracts } from "wagmi";

type CollectionFilter = "all" | "genesis";
type ViewMode = "owned" | "all";

interface NFTData {
  id: number;
  contractAddress: string;
}

export default function Collection() {
  const { address } = useAccount();
  const queryClient = useQueryClient();
  const [activeFilter, setActiveFilter] = useState<CollectionFilter>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("owned");
  const [userNFTs, setUserNFTs] = useState<NFTData[]>([]);
  const [allNFTs, setAllNFTs] = useState<NFTData[]>([]);
  const [selectedNFT, setSelectedNFT] = useState<NFTData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [animationCompleted, setAnimationCompleted] = useState(false);

  // Load selected NFT image data for modal
  const {
    imageUrl: selectedImageUrl,
    metadata: selectedMetadata,
    loading: selectedLoading,
  } = useNFTImage(selectedNFT?.contractAddress || "", selectedNFT?.id || 0);

  // Log wallet connection status
  console.log("Collection page - Connected address:", address);
  console.log("Collection page - Pinto NFTs contract:", NFT_COLLECTION_1_CONTRACT);

  // Query user's NFT balance
  const {
    data: balance,
    error: balanceError,
    isLoading: balanceLoading,
    refetch: refetchBalance,
  } = useReadContract({
    address: NFT_COLLECTION_1_CONTRACT,
    abi: abiSnippets.erc721Enum,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
  });

  // Query total supply of NFTs
  const {
    data: totalSupply,
    error: totalSupplyError,
    isLoading: totalSupplyLoading,
    refetch: refetchTotalSupply,
  } = useReadContract({
    address: NFT_COLLECTION_1_CONTRACT,
    abi: abiSnippets.erc721Enum,
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
          address: NFT_COLLECTION_1_CONTRACT,
          abi: abiSnippets.erc721Enum,
          functionName: "tokenOfOwnerByIndex",
          args: [address, BigInt(index)],
        }))
      : [];

  const {
    data: userTokenIds,
    error: userTokenError,
    refetch: refetchUserTokenIds,
  } = useReadContracts({
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
              contractAddress: NFT_COLLECTION_1_CONTRACT,
            };
          }
          return null;
        })
        .filter(Boolean) as NFTData[];

      setUserNFTs(userNFTs);
      console.log("User NFTs with real token IDs:", userNFTs);
    } else if (balance && Number(balance) === 0) {
      console.log("User has 0 NFTs");
      setUserNFTs([]);
    } else if (userTokenError) {
      console.error("Error fetching user token IDs:", userTokenError);
    }
  }, [userTokenIds, balance, userTokenError]);

  // Query actual token IDs for all tokens in collection
  const allTokenQueries =
    totalSupply && Number(totalSupply) > 0
      ? Array.from({ length: Number(totalSupply) }, (_, index) => ({
          address: NFT_COLLECTION_1_CONTRACT,
          abi: abiSnippets.erc721Enum,
          functionName: "tokenByIndex",
          args: [BigInt(index)],
        }))
      : [];

  const {
    data: allTokenIds,
    error: allTokenError,
    refetch: refetchAllTokenIds,
  } = useReadContracts({
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
              contractAddress: NFT_COLLECTION_1_CONTRACT,
            };
          }
          return null;
        })
        .filter(Boolean) as NFTData[];

      setAllNFTs(allNFTs);
      console.log("All collection NFTs with real token IDs:", allNFTs);
    } else if (totalSupply && Number(totalSupply) === 0) {
      console.log("Collection has 0 NFTs");
      setAllNFTs([]);
    } else if (allTokenError) {
      console.error("Error fetching all token IDs:", allTokenError);
    }
  }, [allTokenIds, totalSupply, allTokenError]);

  // Check if user has NFTs and setup reveal animation
  const hasNFTs = balance && Number(balance) > 0;
  const firstNFT = userNFTs[0];

  const { shouldShowAnimation, hasSeenAnimation, resetAnimation } = useCardFlipAnimation(address, !!hasNFTs);

  // Debug: Log when hasSeenAnimation changes
  useEffect(() => {
    console.log("🔍 hasSeenAnimation changed to:", hasSeenAnimation);
  }, [hasSeenAnimation]);

  // Refresh all NFT data after animation completes
  const handleAnimationComplete = useCallback(() => {
    console.log("🎯 Animation complete callback triggered!");
    console.log("🎯 Current userNFTs length:", userNFTs.length);
    console.log("🎯 Current balance:", balance?.toString());
    console.log("🎯 Setting animationCompleted to true to force re-render");

    // Force re-render by updating local state
    setAnimationCompleted(true);
  }, [userNFTs.length, balance]);

  const handleFilterToggle = (filter: CollectionFilter) => {
    setActiveFilter(activeFilter === filter ? "all" : filter);
  };

  const handleNFTClick = (nft: any) => {
    console.log("NFT clicked:", nft);
    setSelectedNFT(nft);
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
        <Button
          asChild
          variant="outline"
          className="rounded-[0.75rem] font-medium inline-flex items-center gap-2 bg-[#0086FF] hover:bg-[#0074E0] hover:text-white text-white border-[#0086FF] hover:border-[#0074E0]"
        >
          <Link to={externalLinks.nftMarketplace} target="_blank" rel="noopener noreferrer" className="text-white">
            <img src={openSeaLogo} alt="OpenSea" className="w-5 h-5" />
            Visit OpenSea
          </Link>
        </Button>
      </div>
    </div>
  );

  const NFTsGrid = () => {
    let displayNFTs = viewMode === "owned" ? userNFTs : allNFTs;

    console.log("🔍 NFTsGrid render - hasNFTs:", hasNFTs, "hasSeenAnimation:", hasSeenAnimation, "viewMode:", viewMode);
    console.log("🔍 Initial displayNFTs length:", displayNFTs.length);

    // Hide NFTs from grid if user hasn't seen the reveal animation yet
    if (hasNFTs && !hasSeenAnimation && !animationCompleted && viewMode === "owned") {
      console.log("🔍 Hiding NFTs because animation not seen yet");
      displayNFTs = [];
    }

    // Temporarily limit to first NFT for owned view
    if (viewMode === "owned" && displayNFTs.length > 0) {
      displayNFTs = [displayNFTs[0]];
    }

    const isSingleCard = viewMode === "owned" && displayNFTs.length === 1;

    const gridCols =
      viewMode === "all"
        ? "grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-8"
        : isSingleCard
          ? "grid-cols-1 place-items-center"
          : "grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4";

    return (
      <div className={`grid ${gridCols} gap-2 sm:gap-4 ${isSingleCard ? "justify-center" : ""}`}>
        {displayNFTs.map((nft, index) => {
          const isOwned = viewMode === "all" && userNFTs.some((owned) => owned.id === nft.id);

          return (
            <div
              key={`${nft.contractAddress}-${nft.id}`}
              className={isSingleCard ? "w-[80vw] sm:w-[60vw] md:w-[50vw] lg:w-[40vw] xl:w-[30vw] max-w-[800px]" : ""}
            >
              <NFTCard
                contractAddress={nft.contractAddress}
                tokenId={nft.id}
                onClick={() => handleNFTClick(nft)}
                showOwned={viewMode === "all"}
                isOwned={isOwned}
              />
            </div>
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
              {/* <div className="pinto-h2 sm:pinto-h1">My Pinto Beavers</div> */}
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
              {viewMode === "owned"
                ? /* "My Pinto Beavers" */ null
                : `${getCollectionName(NFT_COLLECTION_1_CONTRACT)}s Collection`}
            </div>
            <div className="pinto-sm sm:pinto-body-light text-pinto-light">
              {viewMode === "owned"
                ? /* "My Collection of Pinto Beaver NFTs" */ null
                : `Browse all ${getCollectionName(NFT_COLLECTION_1_CONTRACT)}s.`}
            </div>
          </div>
          {/*
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
              {getCollectionName(NFT_COLLECTION_1_CONTRACT)}s
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
*/}
          {/* Toggle link above separator */}
          {/*}
          {activeFilter === "genesis" && (
            <div className="flex justify-end">
              <Button
                variant="ghost"
                onClick={handleViewModeToggle}
                className="text-pinto-green-4 hover:text-pinto-green-3 pinto-sm font-medium p-0 h-auto"
              >
                {viewMode === "owned" ? "View All in Collection" : "View My Collection"}
              </Button>
            </div>
          )}
            */}

          <Separator />

          <div className="mt-4">
            {(viewMode === "owned" ? userNFTs : allNFTs).length === 0 ? <EmptyState /> : <NFTsGrid />}
          </div>
        </div>
      </div>

      {/* NFT Detail Modal */}
      <Dialog open={isModalOpen} onOpenChange={handleCloseModal}>
        <DialogContent className="w-[90vw] h-[90vh] max-w-[90vw] max-h-[90vh] rounded-2xl border bg-white backdrop-blur-sm">
          <div className="flex flex-col lg:flex-row h-full overflow-y-scroll scrollbar-none">
            {/* Left Panel - NFT Image */}
            <div className="flex-1 lg:flex-[3] bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
              {selectedImageUrl && !selectedLoading && (
                <img
                  src={selectedImageUrl}
                  alt={selectedMetadata?.name || `NFT #${selectedNFT?.id}`}
                  className="w-full h-full object-cover rounded-2xl"
                />
              )}
              {/*
              <div className="w-full h-full max-w-xs sm:max-w-md lg:max-w-lg max-h-[32vh] sm:max-h-[40vh] lg:max-h-lg bg-white rounded-xl lg:rounded-2xl shadow-lg relative overflow-hidden">
                {/*selectedLoading && (
                  <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
                    <FrameAnimator size={48} />
                  </div>
                )*/}

              {/*!selectedImageUrl && !selectedLoading && (
                  <div className="text-gray-400 pinto-h3 lg:pinto-h2 text-center px-4">
                    {getCollectionName(selectedNFT?.contractAddress || "")} #{selectedNFT?.id}
                  </div>
                )*/}
            </div>

            {/* Right Panel - NFT Details */}
            <div className="flex-1 lg:flex-[2] bg-white flex flex-col h-auto overflow-y-auto scrollbar-none">
              {/* Header */}
              <div className="sticky top-0 bg-white z-10 px-3 pt-3 sm:px-4 sm:pt-4 lg:px-6 lg:pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h1 className="pinto-h3 sm:pinto-h2 text-pinto-dark mb-1 truncate">
                      {`${getCollectionName(NFT_COLLECTION_1_CONTRACT)} #${selectedNFT?.id}`}
                    </h1>
                    <p className="pinto-xs sm:pinto-sm text-pinto-light">
                      {getCollectionName(NFT_COLLECTION_1_CONTRACT)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="flex flex-col p-3 sm:p-4 lg:p-6 gap-6">
                <Separator />

                {/* Action Section */}
                <div className="space-y-3 sm:space-y-4">
                  <Button
                    asChild
                    variant="default"
                    size="lg"
                    className="w-full py-3 sm:py-4 text-sm sm:text-base font-semibold bg-[#0086FF] hover:bg-[#0074E0] text-white border-[#0086FF] hover:border-[#0074E0]"
                  >
                    <Link
                      to={externalLinks.nftMarketplace}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 sm:gap-3 text-white"
                    >
                      <img src={openSeaLogo} alt="OpenSea" className="w-4 h-4 sm:w-5 sm:h-5" />
                      Trade on OpenSea
                    </Link>
                  </Button>
                </div>

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
                        <Link
                          to={`https://basescan.org/address/${selectedNFT?.contractAddress}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[0.65rem] sm:pinto-xs text-pinto-green-3 font-mono hover:underline text-right break-all min-w-0"
                        >
                          {selectedNFT?.contractAddress}
                        </Link>
                      </div>

                      {/*selectedMetadata?.description && (
                        <div className="space-y-1 sm:space-y-2">
                          <span className="pinto-xs sm:pinto-sm text-pinto-light block">Description</span>
                          <p className="pinto-xs sm:pinto-sm text-pinto-dark leading-relaxed">
                            {selectedMetadata.description}
                          </p>
                        </div>
                      )*/}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* NFT Card Flip Reveal Animation Overlay */}
      {shouldShowAnimation && firstNFT && (
        <NFTCardFlipReveal
          contractAddress={firstNFT.contractAddress}
          tokenId={firstNFT.id}
          address={address}
          hasNFTs={!!hasNFTs}
          onComplete={handleAnimationComplete}
        />
      )}
    </PageContainer>
  );
}
