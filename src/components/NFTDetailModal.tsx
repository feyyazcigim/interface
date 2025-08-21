import openSeaLogo from "@/assets/misc/opensea-logo.svg";
import FrameAnimator from "@/components/LoadingSpinner";
import { TraitsCard } from "@/components/TraitsCard";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Dialog, DialogContent } from "@/components/ui/Dialog";
import { Separator } from "@/components/ui/Separator";
import { getCollectionName } from "@/constants/collections";
import { externalLinks } from "@/constants/links";
import { useNFTImage } from "@/hooks/useNFTImage";
import { Link } from "react-router-dom";

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

  if (!selectedNFT) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="w-[95vw] sm:w-[90vw] lg:w-[80vw] max-w-6xl max-h-[85vh] lg:h-[95vh] rounded-2xl border bg-white backdrop-blur-sm p-0"
        hideCloseButton
      >
        <div className="flex flex-col lg:flex-row h-full relative">
          {/* Left Panel - NFT Image */}
          <div className="flex-shrink-0 w-full h-[35vh] lg:w-1/2 lg:h-full bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
            {selectedImageUrl && !selectedLoading && (
              <img
                src={selectedImageUrl}
                alt={selectedMetadata?.name || `NFT #${selectedNFT.id}`}
                className="w-full h-full object-cover lg:rounded-l-2xl"
              />
            )}

            {selectedLoading && (
              <div className="flex items-center justify-center">
                <FrameAnimator size={48} />
              </div>
            )}

            {!selectedImageUrl && !selectedLoading && (
              <div className="text-gray-400 pinto-h3 lg:pinto-h2 text-center px-4">
                {getCollectionName(selectedNFT.contractAddress)} #{selectedNFT.id}
              </div>
            )}
          </div>

          {/* Right Panel - NFT Details */}
          <div className="flex-1 bg-white flex flex-col min-h-0">
            {/* Header */}
            <div className="flex-shrink-0 bg-white border-b border-gray-100 px-4 py-3 lg:px-6 lg:py-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h1 className="pinto-h4 sm:pinto-h3 lg:pinto-h2 text-pinto-dark truncate">
                    {
                      /*selectedMetadata?.name || */ `${getCollectionName(selectedNFT.contractAddress)} #${selectedNFT.id}`
                    }
                  </h1>
                </div>
              </div>
            </div>

            {/* Scrollable Content */}
            <div
              className="flex-1 overflow-y-auto overscroll-contain px-4 py-3 lg:px-6 lg:py-4 space-y-4 pb-20 lg:pb-6"
              style={{ WebkitOverflowScrolling: "touch" }}
            >
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
                      <span className="pinto-xs sm:pinto-sm font-medium text-pinto-dark">#{selectedNFT.id}</span>
                    </div>

                    <div className="flex justify-between items-start gap-2">
                      <span className="pinto-xs sm:pinto-sm text-pinto-light flex-shrink-0">Contract Address</span>
                      <Link
                        to={`https://basescan.org/address/${selectedNFT.contractAddress}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[0.65rem] sm:pinto-xs text-pinto-green-3 font-mono hover:underline text-right break-all min-w-0"
                      >
                        {selectedNFT.contractAddress}
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
            </div>
          </div>

          {/* Mobile Close Button */}
          <div className="lg:hidden absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20">
            <button
              type="button"
              onClick={onClose}
              className="bg-white border border-gray-200 rounded-full p-3 shadow-lg hover:bg-gray-50 transition-colors"
              aria-label="Close modal"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
