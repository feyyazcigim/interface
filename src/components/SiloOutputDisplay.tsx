import { TokenValue } from "@/classes/TokenValue";
import OutputDisplay from "@/components/OutputDisplay";
import { SEEDS, STALK } from "@/constants/internalTokens";
import { formatSeasonsAsTime, formatter } from "@/utils/format";
import { Token } from "@/utils/types";
import { Link } from "react-router-dom";
import Warning from "./ui/Warning";

interface SiloOutputDisplayProps {
  title?: string;
  amount?: TokenValue;
  token?: Token;
  stalk: TokenValue;
  seeds: TokenValue;
  showNegativeDeltas?: boolean;
  showGrownStalkSeasonsNotice?: boolean;
  grownStalkSeasons?: number;
}

export default function SiloOutputDisplay({
  title = "I receive",
  amount,
  token,
  stalk,
  seeds,
  showNegativeDeltas = false,
  showGrownStalkSeasonsNotice = false,
  grownStalkSeasons = 0,
}: SiloOutputDisplayProps) {
  const deltaMultiplier = showNegativeDeltas ? -1 : 1;

  return (
    <OutputDisplay title={title}>
      {amount && token && (
        <OutputDisplay.Item label="Deposited Amount">
          <OutputDisplay.Value
            value={formatter.token(amount, token)}
            token={token}
            suffix={token.symbol}
            className="whitespace-nowrap"
          />
        </OutputDisplay.Item>
      )}
      <OutputDisplay.Item label="Stalk">
        <OutputDisplay.Value
          value={formatter.twoDec(stalk)}
          suffix="Stalk"
          delta={stalk.toNumber() * deltaMultiplier}
          token={STALK}
          showArrow={stalk.toNumber() !== 0}
          className="whitespace-nowrap"
        />
      </OutputDisplay.Item>
      {showGrownStalkSeasonsNotice && grownStalkSeasons > 0 && (
        <Warning variant="info">
          <div className="flex flex-col gap-2">
            <span>
              It would take ~{formatter.number(grownStalkSeasons.toFixed(0))} Season
              {grownStalkSeasons > 1 && <span>s</span>}
              {grownStalkSeasons >= 168 && formatSeasonsAsTime(grownStalkSeasons)} for this much value to grow the
              amount of Stalk being burned.
            </span>
            <span>
              <Link
                to="https://docs.pinto.money/farm/silo#the-stalk-system"
                target="_blank"
                rel="noopener noreferrer"
                className="text-pinto-green-4 sm:text-pinto-green-4 hover:text-pinto-green-4 hover:underline transition-colors"
              >
                Learn More
              </Link>
            </span>
          </div>
        </Warning>
      )}
      <OutputDisplay.Item label="Seed">
        <OutputDisplay.Value
          value={formatter.twoDec(seeds)}
          suffix="Seeds"
          delta={seeds.toNumber() * deltaMultiplier}
          token={SEEDS}
          showArrow={seeds.toNumber() !== 0}
          className="whitespace-nowrap"
        />
      </OutputDisplay.Item>
    </OutputDisplay>
  );
}
