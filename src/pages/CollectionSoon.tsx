import PageContainer from "@/components/ui/PageContainer";
import { Separator } from "@/components/ui/Separator";

export default function CollectionSoon() {
  return (
    <PageContainer variant="xl">
      <div className="flex flex-col w-full mt-4 sm:mt-0">
        <div className="flex flex-col self-center w-full gap-4 mb-20 sm:mb-0 sm:gap-8">
          <div className="flex flex-col gap-y-3">
            <div className="pinto-h2 sm:pinto-h1">My Collection</div>
          </div>

          <Separator />

          <div className="flex flex-col items-center justify-center py-32">
            <div className="text-center max-w-md">
              <div className="pinto-h2 mb-4 text-pinto-dark">Coming Soon...</div>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
