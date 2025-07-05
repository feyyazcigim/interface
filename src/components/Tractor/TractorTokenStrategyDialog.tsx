import seedIcon from "@/assets/protocol/Seed.png";
import stalkIcon from "@/assets/protocol/Stalk.png";
import { TokenValue } from "@/classes/TokenValue";
import { InfoOutlinedIcon } from "@/components/Icons";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from "@/components/ui/Dialog";
import IconImage from "@/components/ui/IconImage";
import { Separator } from "@/components/ui/Separator";
import useSowOrderV0Calculations from "@/hooks/tractor/useSowOrderV0Calculations";
import { TractorTokenStrategy } from "@/lib/Tractor/types";
import { useFarmerSilo } from "@/state/useFarmerSilo";
import useTokenData from "@/state/useTokenData";
import { formatter } from "@/utils/format";

export type ITractorTokenStrategyDialogProps = {
  open: boolean;
  selectedTokenStrategy: TractorTokenStrategy | undefined;
  farmerDeposits: ReturnType<typeof useFarmerSilo>["deposits"];
  onOpenChange: (open: boolean) => void;
  onTokenStrategySelected: (tokenStrategy: TractorTokenStrategy) => void;
} & ReturnType<typeof useSowOrderV0Calculations>;

const DyamicFundingSource = ({
  tokenStrategy,
  label,
  selectedTokenStrategy,
  onTokenStrategySelected,
}: {
  label: string;
  tokenStrategy: TractorTokenStrategy;
  selectedTokenStrategy: TractorTokenStrategy | undefined;
  onTokenStrategySelected: (tokenStrategy: TractorTokenStrategy) => void;
}) => {
  return (
    <div
      className={`flex items-center px-6 py-4 gap-2 rounded-[36px] cursor-pointer bg-pinto-gray-1 border border-pinto-gray-2`}
      onClick={() => {
        onTokenStrategySelected(tokenStrategy);
      }}
    >
      <div
        className={`w-10 h-10 rounded-full ${
          selectedTokenStrategy?.type === tokenStrategy.type
            ? "bg-pinto-green-1 border border-dashed border-pinto-green-4"
            : "border border-pinto-gray-2"
        }`}
      />
      <div className="flex flex-col gap-1">
        <span className="pinto-sm">{label}</span>
        <span className="pinto-sm text-pinto-light">at time of execution</span>
      </div>
    </div>
  );
};

export default function TractorTokenStrategyDialog({
  open,
  selectedTokenStrategy,
  farmerDeposits,
  onOpenChange,
  onTokenStrategySelected,
  swapResults,
  priceData,
}: ITractorTokenStrategyDialogProps) {
  const { whitelistedTokens } = useTokenData();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay className="fixed inset-0 backdrop-blur-sm bg-black/30" />
        <DialogContent
          className="sm:max-w-[40rem] w-full mx-auto p-0 bg-white rounded-2xl border border-pinto-gray-2"
          style={{ padding: 0, gap: 0 }}
        >
          <div className="p-3">
            <DialogHeader className="mb-6 -mt-1">
              <DialogTitle className="font-medium mb-1 text-[1.25rem] tracking-normal">
                Select Token from Silo Deposits
              </DialogTitle>
              <DialogDescription className="text-gray-500 pb-1">
                Tractor allows you to fund Orders for Soil using Deposits
              </DialogDescription>
              <Separator />
            </DialogHeader>

            {/* Dynamic funding source options */}
            <div className="flex flex-col gap-4 mb-6">
              <div className="text-gray-500">Dynamic funding source</div>
              <div className="grid grid-cols-2 gap-4">
                <DyamicFundingSource
                  label="Token with Best Price"
                  tokenStrategy={{ type: "LOWEST_PRICE" }}
                  selectedTokenStrategy={selectedTokenStrategy}
                  onTokenStrategySelected={onTokenStrategySelected}
                />
                <DyamicFundingSource
                  label="Token with Least Seeds"
                  tokenStrategy={{ type: "LOWEST_SEEDS" }}
                  selectedTokenStrategy={selectedTokenStrategy}
                  onTokenStrategySelected={onTokenStrategySelected}
                />
              </div>
            </div>

            {/* Deposited Tokens */}
            <div className="flex flex-col gap-2">
              <div className="text-gray-500">Deposited Tokens</div>
              <div className="flex flex-col space-y-1 bg-white rounded-xl">
                {whitelistedTokens.map((token) => {
                  const deposit = farmerDeposits.get(token);
                  const amount = deposit?.amount || TokenValue.ZERO;

                  // Calculate dollar value - use price for PINTO, swap results for LP tokens
                  const pintoAmount =
                    token.symbol === "PINTO"
                      ? amount.mul(priceData.price)
                      : swapResults.get(token.address) || TokenValue.ZERO;

                  const isSelected =
                    selectedTokenStrategy?.type === "SPECIFIC_TOKEN" &&
                    selectedTokenStrategy?.address === token.address;

                  return (
                    <div
                      key={token.address}
                      className={`flex items-center justify-between py-4 cursor-pointer rounded-lg ${
                        isSelected ? "bg-green-50" : "bg-white"
                      }`}
                      onClick={() => {
                        onTokenStrategySelected({
                          type: "SPECIFIC_TOKEN",
                          address: token.address as `0x${string}`,
                        });
                        onOpenChange(false);
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <IconImage src={token.logoURI} alt={token.symbol} size={12} className="rounded-full" />
                        <div className="flex flex-col">
                          <div className="font-medium text-lg mb-1">{token.symbol}</div>
                          <div className="flex items-center text-xs text-gray-500 gap-1">
                            <IconImage src={stalkIcon} size={3} alt="Stalk" />{" "}
                            {formatter.number(deposit?.stalk?.total || 0)} Stalk
                            <IconImage src={seedIcon} size={3} alt="Seeds" className="ml-1" />{" "}
                            {formatter.number(deposit?.seeds || 0)} Seeds
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <div className="text-right text-xl font-medium">
                          {amount.toNumber() > 0 && amount.toNumber() < 0.01
                            ? formatter.number(amount, { minDecimals: 4, maxDecimals: 8 })
                            : formatter.number(amount)}
                        </div>
                        <div className="text-right text-gray-500 text-sm">${formatter.twoDec(pintoAmount)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="text-xs text-gray-500 flex items-center gap-1 mt-2">
                <InfoOutlinedIcon width={14} height={14} />
                Deposits with the least Grown Stalk will always be used first
              </div>
            </div>
          </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}
