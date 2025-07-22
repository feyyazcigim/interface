import BinanceLogo from "@/assets/misc/binance-logo.svg";
import CoinbaseLogo from "@/assets/misc/coinbase-logo.svg";
import KrakenLogo from "@/assets/misc/kraken-logo.svg";
import { Checkbox } from "@/components/ui/Checkbox";
import { Label } from "@/components/ui/Label";
import { Dispatch, SetStateAction } from "react";
import Warning from "./ui/Warning";

interface PintoAssetTransferNotice {
  transferNotice: boolean;
  setTransferNotice: Dispatch<SetStateAction<boolean>>;
}

export default function PintoAssetTransferNotice({ transferNotice, setTransferNotice }: PintoAssetTransferNotice) {
  return (
    <Warning variant="warning">
      <div className="flex flex-col gap-8">
        <p className="text-2xl">
          Important: Only send Pinto assets to wallets custodied by individuals. Assets sent to smart contracts or
          exchange companies (for example:{" "}
          <img src={CoinbaseLogo} alt="Coinbase" className="inline h-5 w-5 mb-1.5 mx-1" />
          Coinbase, <img src={BinanceLogo} alt="Binance" className="inline h-5 w-5 mb-1.5 mx-1" />
          Binance, <img src={KrakenLogo} alt="Kraken" className="inline h-5 w-5 mb-1.5 mx-1" />
          Kraken, etc) deposit addresses may be permanently lost and cannot be recovered.
        </p>
        <div className="flex flex-row gap-3 items-center">
          <Checkbox
            id="farm-balance-notice"
            checked={transferNotice}
            onCheckedChange={(checked) => {
              if (checked !== "indeterminate") {
                setTransferNotice(checked);
              } else {
                setTransferNotice(false);
              }
            }}
            className="mt-0.5"
          />
          <Label htmlFor="farm-balance-notice" className="text-sm font-medium cursor-pointer text-pinto-error">
            I acknowledge that the destination address is custodied by an individual
          </Label>
        </div>
      </div>
    </Warning>
  );
}
