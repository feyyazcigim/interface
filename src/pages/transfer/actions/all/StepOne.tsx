import AddressInputField from "@/components/AddressInputField";
import PintoAssetTransferNotice from "@/components/PintoAssetTransferNotice";
import { Label } from "@/components/ui/Label";
import { Dispatch, SetStateAction } from "react";

interface StepOneProps {
  destination?: string | undefined;
  setDestination: Dispatch<SetStateAction<string | undefined>>;
  transferNotice: boolean;
  setTransferNotice: Dispatch<SetStateAction<boolean>>;
}

export default function StepOne({ destination, setDestination, transferNotice, setTransferNotice }: StepOneProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label>Send to</Label>
        <AddressInputField value={destination} setValue={setDestination} />
        <PintoAssetTransferNotice transferNotice={transferNotice} setTransferNotice={setTransferNotice} />
      </div>
    </div>
  );
}
