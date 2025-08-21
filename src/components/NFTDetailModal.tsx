import openSeaLogo from "@/assets/misc/opensea-logo.svg";
import FrameAnimator from "@/components/LoadingSpinner";
import { TraitsCard } from "@/components/TraitsCard";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Dialog, DialogContent } from "@/components/ui/Dialog";
import { Separator } from "@/components/ui/Separator";
import { abiSnippets } from "@/constants/abiSnippets";
import { getCollectionName } from "@/constants/collections";
import { externalLinks } from "@/constants/links";
import { useNFTImage } from "@/hooks/useNFTImage";
import { Link } from "react-router-dom";
import { useReadContract } from "wagmi";

interface NFTData {
  id: number;
  contractAddress: string;
}

interface NFTDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedNFT: NFTData | null;
}

export const NFTDetailModal = ({ isOpen, onClose, selectedNFT }: NFTDetailModalProps) => {
  // Load selected NFT image data for modal
  const {
    imageUrl: selectedImageUrl,
    metadata: selectedMetadata,
    loading: selectedLoading,
  } = useNFTImage(selectedNFT?.contractAddress || "", selectedNFT?.id || 0);

  // Get NFT owner
  const { data: owner } = useReadContract({
    address: selectedNFT?.contractAddress as `0x${string}`,
    abi: abiSnippets.erc721Enum,
    functionName: "ownerOf",
    args: selectedNFT ? [BigInt(selectedNFT.id)] : undefined,
    query: {
      enabled: !!selectedNFT,
    },
  });

  // Format owner address for display
  const formatOwner = (address: string | undefined) => {
    if (!address) return "Loading...";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (!selectedNFT) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="w-[100vw] h-[100vh] sm:w-[95vw] sm:h-[95vh] lg:w-[100vw] lg:h-[70vh] lg:max-w-7xl lg:rounded-2xl border bg-white backdrop-blur-sm p-0 flex flex-col overflow-hidden"
        hideCloseButton
      >
        {/* Desktop Layout */}
        <div className="hidden lg:flex flex-1 min-h-0 relative">
          {/* Left Panel - NFT Image */}
          <div className="flex-shrink-0 w-[65%] h-full flex items-center justify-center p-6">
            {selectedImageUrl && !selectedLoading && (
              <img
                src={selectedImageUrl}
                alt={selectedMetadata?.name || `NFT #${selectedNFT.id}`}
                className="max-w-full max-h-full w-auto h-auto object-contain rounded-xl"
              />
            )}

            {selectedLoading && (
              <div className="flex items-center justify-center">
                <FrameAnimator size={48} />
              </div>
            )}

            {!selectedImageUrl && !selectedLoading && (
              <div className="text-gray-400 pinto-h2 text-center px-4">
                {getCollectionName(selectedNFT.contractAddress)} #{selectedNFT.id}
              </div>
            )}
          </div>

          {/* Right Panel - NFT Details */}
          <div className="flex-1 bg-white flex flex-col min-h-0">
            {/* Header */}
            <div className="flex-shrink-0 bg-white border-b border-gray-200 px-8 py-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h1 className="text-3xl font-bold text-gray-900 truncate">
                    {`${getCollectionName(selectedNFT.contractAddress)} #${selectedNFT.id}`}
                  </h1>
                  <p className="text-gray-600 mt-1">Owned by {formatOwner(owner)}</p>
                </div>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-8 py-6 space-y-8" style={{ WebkitOverflowScrolling: "touch" }}>
              {/* Details */}
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600">Token ID</span>
                  <span className="font-medium text-gray-900">#{selectedNFT.id}</span>
                </div>
                <div className="flex justify-between items-start gap-2 py-2">
                  <span className="text-gray-600 flex-shrink-0">Contract Address</span>
                  <Link
                    to={`https://basescan.org/address/${selectedNFT.contractAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 font-mono hover:underline text-right min-w-0"
                  >
                    {`${selectedNFT.contractAddress.slice(0, 10)}...${selectedNFT.contractAddress.slice(-4)}`}
                  </Link>
                </div>
              </div>

              {/* Traits */}
              <TraitsCard attributes={selectedMetadata?.attributes} />

              {/* Action Section */}
              <div>
                <Button asChild className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold">
                  <Link
                    to={externalLinks.nftMarketplace}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 text-white"
                  >
                    <img src={openSeaLogo} alt="OpenSea" className="w-5 h-5" />
                    View on OpenSea
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="lg:hidden flex flex-col h-full relative">
          {/* Top Navigation with Title */}
          <div className="flex-shrink-0 flex items-center justify-between p-4">
            <div className="flex-1">
              <h1 className="text-xl text-gray-900">Pinto NFT #{selectedNFT.id}</h1>
              <p className="text-gray-600 text-sm mt-1">Owned by {formatOwner(owner)}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-gray-700 hover:bg-white/20 rounded-full border border-orange-400 flex-shrink-0 ml-4"
              aria-label="Close modal"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Image Section */}
          <div className="flex-shrink-0 flex items-center justify-center p-4" style={{ minHeight: "40vh" }}>
            {selectedImageUrl && !selectedLoading && (
              <img
                src={selectedImageUrl}
                alt={selectedMetadata?.name || `NFT #${selectedNFT.id}`}
                className="max-w-full max-h-full w-auto h-auto object-contain rounded-lg shadow-lg"
              />
            )}

            {selectedLoading && (
              <div className="flex items-center justify-center">
                <FrameAnimator size={48} />
              </div>
            )}

            {!selectedImageUrl && !selectedLoading && (
              <div className="text-gray-400 pinto-h3 text-center px-4">
                {getCollectionName(selectedNFT.contractAddress)} #{selectedNFT.id}
              </div>
            )}
          </div>

          {/* Bottom Content */}
          <div className="flex-1 bg-white rounded-t-3xl min-h-0 flex flex-col">
            {/* Header */}
            <div className="flex-shrink-0 px-6 pt-6 pb-4">
              <h2 className="text-lg font-semibold text-gray-900">Details</h2>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-6" style={{ WebkitOverflowScrolling: "touch" }}>
              {/* Action Button */}
              <div>
                <Button
                  asChild
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl"
                >
                  <Link
                    to={externalLinks.nftMarketplace}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 text-white"
                  >
                    <img src={openSeaLogo} alt="OpenSea" className="w-5 h-5" />
                    View on OpenSea
                  </Link>
                </Button>
              </div>

              {/* Traits */}
              <TraitsCard attributes={selectedMetadata?.attributes} />

              {/* Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Details</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600">Token ID</span>
                    <span className="font-medium text-gray-900">#{selectedNFT.id}</span>
                  </div>
                  <div className="flex justify-between items-start gap-2 py-2">
                    <span className="text-gray-600 flex-shrink-0">Contract Address</span>
                    <Link
                      to={`https://basescan.org/address/${selectedNFT.contractAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 font-mono hover:underline text-right min-w-0"
                    >
                      {`${selectedNFT.contractAddress.slice(0, 10)}...${selectedNFT.contractAddress.slice(-4)}`}
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
