import openSeaLogo from "@/assets/misc/opensea-logo.svg";
import { NFTCard } from "@/components/NFTCard";
import { NFTDetailModal } from "@/components/NFTDetailModal";
import { Button } from "@/components/ui/Button";
import PageContainer from "@/components/ui/PageContainer";
import { Separator } from "@/components/ui/Separator";
import { NFT_COLLECTION_1_CONTRACT } from "@/constants/address";
import { getCollectionName } from "@/constants/collections";
import { externalLinks } from "@/constants/links";
import { type NFTData, type ViewMode, useNFTData } from "@/state/useNFTData";
import { useCallback, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAccount } from "wagmi";

type CollectionFilter = "all" | "genesis";

interface NFTsGridProps {
  nfts: NFTData[];
  viewMode: ViewMode;
  userNFTs: NFTData[];
  onNFTClick: (nft: NFTData) => void;
}

function EmptyState() {
  return (
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
}

function NFTsGrid({ nfts, viewMode, userNFTs, onNFTClick }: NFTsGridProps) {
  const gridCols = useMemo(
    () =>
      viewMode === "all"
        ? "grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-8"
        : "grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4",
    [viewMode],
  );

  return (
    <div className={`grid ${gridCols} gap-2 sm:gap-4`}>
      {nfts.map((nft, index) => {
        const isOwned = viewMode === "all" && userNFTs.some((owned) => owned.id === nft.id);

        return (
          <NFTCard
            key={`${nft.contractAddress}-${nft.id}`}
            contractAddress={nft.contractAddress}
            tokenId={nft.id}
            onClick={() => onNFTClick(nft)}
            showOwned={viewMode === "all"}
            isOwned={isOwned}
          />
        );
      })}
    </div>
  );
}

export default function Collection() {
  const { address } = useAccount();
  const [activeFilter, setActiveFilter] = useState<CollectionFilter>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("owned");
  const [selectedNFT, setSelectedNFT] = useState<NFTData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { userNFTs, allNFTs, displayNFTs, balance, totalSupply, loading, error } = useNFTData({
    contractAddress: NFT_COLLECTION_1_CONTRACT,
    viewMode,
  });

  // Log wallet connection status
  console.log("Collection page - Connected address:", address);
  console.log("Collection page - Pinto NFTs contract:", NFT_COLLECTION_1_CONTRACT);

  const handleFilterToggle = (filter: CollectionFilter) => {
    setActiveFilter(activeFilter === filter ? "all" : filter);
  };

  const handleNFTClick = useCallback((nft: any) => {
    console.log("NFT clicked:", nft);
    setSelectedNFT(nft);
    setIsModalOpen(true);
  }, []);

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

  if (!address) {
    return (
      <PageContainer variant="xl">
        <div className="flex flex-col w-full mt-4 sm:mt-0">
          <div className="flex flex-col self-center w-full gap-4 mb-20 sm:mb-0 sm:gap-8">
            <div className="flex flex-col gap-y-3">
              <div className="pinto-h2 sm:pinto-h1">My Collection</div>
              <div className="pinto-sm sm:pinto-body-light text-pinto-light">
                Connect your wallet to view your collection of Pinto NFTs.
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
              {viewMode === "owned" ? "My Collection" : `${getCollectionName(NFT_COLLECTION_1_CONTRACT)}s Collection`}
            </div>
            <div className="pinto-sm sm:pinto-body-light text-pinto-light">
              {viewMode === "owned"
                ? `Your collection of ${getCollectionName(NFT_COLLECTION_1_CONTRACT)}s.`
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
            {displayNFTs.length === 0 ? (
              <EmptyState />
            ) : (
              <NFTsGrid nfts={displayNFTs} viewMode={viewMode} userNFTs={userNFTs} onNFTClick={handleNFTClick} />
            )}
          </div>
        </div>
      </div>

      <NFTDetailModal isOpen={isModalOpen} onClose={handleCloseModal} selectedNFT={selectedNFT} />
    </PageContainer>
  );
}
