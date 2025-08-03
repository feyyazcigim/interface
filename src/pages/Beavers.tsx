import openSeaLogo from "@/assets/misc/opensea-logo.svg";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import PageContainer from "@/components/ui/PageContainer";
import { Separator } from "@/components/ui/Separator";
import { externalLinks } from "@/constants/links";
import { useState } from "react";
import { useAccount } from "wagmi";

type CollectionFilter = "all" | "genesis";

export default function Beavers() {
  const { address } = useAccount();
  const [activeFilter, setActiveFilter] = useState<CollectionFilter>("all");

  // Placeholder data - in the future this would come from NFT contract calls
  const userBeavers: any[] = [];

  const handleFilterToggle = (filter: CollectionFilter) => {
    setActiveFilter(activeFilter === filter ? "all" : filter);
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

  const BeaversGrid = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {userBeavers.map((beaver, index) => (
        <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow">
          <CardContent className="p-0">
            <div className="aspect-square bg-gray-100 flex items-center justify-center">
              <div className="text-gray-400 pinto-body">Beaver #{beaver.id}</div>
            </div>
            <div className="p-4">
              <div className="pinto-sm font-medium mb-1">{beaver.name}</div>
              <div className="pinto-xs text-pinto-light">{beaver.description}</div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

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
            <div className="pinto-h2 sm:pinto-h1">My Collection</div>
            <div className="pinto-sm sm:pinto-body-light text-pinto-light">Your collection of Pinto Beavers.</div>
          </div>

          {/* Collection Filters */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => handleFilterToggle("genesis")}
              className={`rounded-full font-medium px-6 py-2 ${
                activeFilter === "genesis"
                  ? "bg-pinto-green-1 text-pinto-green-4 border-pinto-green-3 hover:bg-pinto-green-1/90 hover:text-pinto-green-3"
                  : "hover:bg-pinto-green-1/50"
              }`}
            >
              Genesis Pinto Beavers
            </Button>
            <Button
              variant="outline"
              onClick={() => handleFilterToggle("all")}
              className={`rounded-full font-medium px-6 py-2 ${
                activeFilter === "all"
                  ? "bg-pinto-green-1 text-pinto-green-4 border-pinto-green-3 hover:bg-pinto-green-1/90 hover:text-pinto-green-3"
                  : "hover:bg-pinto-green-1/50"
              }`}
            >
              All
            </Button>
          </div>
          <Separator />

          <div>{userBeavers.length === 0 ? <EmptyState /> : <BeaversGrid />}</div>
        </div>
      </div>
    </PageContainer>
  );
}
