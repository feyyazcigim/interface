import React from 'react';
import { TokenValue } from '@/classes/TokenValue';
import { formatter } from '@/utils/format';
import { Skeleton } from '@/components/ui/Skeleton';
import IconImage from '@/components/ui/IconImage';
import TooltipSimple from '@/components/TooltipSimple';
import pintoIcon from '@/assets/tokens/PINTO.png';
import podIcon from '@/assets/protocol/Pod.png';
import tractorIcon from '@/assets/protocol/Tractor.png';
import { usePublicClient } from 'wagmi';
import { diamondABI } from '@/constants/abi/diamondABI';
import { useProtocolAddress } from '@/hooks/pinto/useProtocolAddress';
import { parseEther } from 'viem';
import { useSeason } from '@/state/useSunData';

interface FieldActivityItem {
  id: string;
  timestamp: number; // Unix timestamp
  season: number;
  type: 'sow' | 'harvest' | 'transfer' | 'other';
  amount: TokenValue;
  pods: TokenValue;
  temperature: number;
  placeInLine: string;
  address: string;
  txHash: string;
}

const FieldActivity: React.FC = () => {
  const publicClient = usePublicClient();
  const protocolAddress = useProtocolAddress();
  const [loading, setLoading] = React.useState(true);
  const [activities, setActivities] = React.useState<FieldActivityItem[]>([]);
  const currentSeason = useSeason();

  React.useEffect(() => {
    const fetchSowEvents = async () => {
      if (!publicClient || !protocolAddress) return;
      
      try {
        setLoading(true);
        
        // Get the current block number and timestamp
        const latestBlock = await publicClient.getBlock();
        const latestBlockNumber = Number(latestBlock.number);
        const latestBlockTimestamp = Number(latestBlock.timestamp);
        
        // Calculate a fromBlock value for 30 days worth of blocks on Base
        // Base has a 2-second block time
        // 30 days = 30 * 24 * 60 * 60 = 2,592,000 seconds
        // At 2 seconds per block: 2,592,000 / 2 = 1,296,000 blocks
        const lookbackBlocks = 1_296_000n; 
        const fromBlock = latestBlock.number > lookbackBlocks ? latestBlock.number - lookbackBlocks : 0n;
        
        console.log(`Fetching events from block ${fromBlock} to ${latestBlock.number} (30 days of Base blocks)`);
        
        // Fetch the most recent sow events
        const sowEvents = await publicClient.getContractEvents({
          address: protocolAddress,
          abi: diamondABI,
          eventName: "Sow", // Use the correct event name for sow events
          fromBlock,
          toBlock: "latest",
        });
        
        console.log(`Found ${sowEvents.length} sow events`);
        
        // Blockchain events typically come in chronological order (oldest first)
        // Reverse the array to get newest first
        const reversedEvents = [...sowEvents].reverse();
        
        // Limit to 100 events
        const limitedEvents = reversedEvents.slice(0, 100);
        
        // Convert events to activity items
        const activityItems: FieldActivityItem[] = limitedEvents.map((event, index) => {
          const { args, blockNumber, transactionHash } = event;
          
          // From the ABI, Sow event has: account, fieldId, index, beans, pods
          const account = args.account || '0x0000000000000000000000000000000000000000';
          const fieldId = args.fieldId || BigInt(0);
          const podIndex = args.index || BigInt(0);
          const beans = args.beans || BigInt(0); // PINTO amount in beans
          const pods = args.pods || BigInt(0);
          
          // Calculate timestamp using block number difference and 2-second block time
          // Base has 2 second blocks
          const blockDiff = latestBlockNumber - Number(blockNumber);
          const timestamp = latestBlockTimestamp - blockDiff * 2;
          
          // We'll use newer events with more recent seasons
          // In a real implementation, you would get the actual season from the block timestamp
          const mockSeason = Math.max(Number(currentSeason) - 5 + index, 1);
          
          // Place in line is 1e6 precision, so divide by 1e6
          const placeInLine = formatter.number(Number(podIndex) / 1e6);
          
          // Calculate temperature from the ratio of pods to beans
          // This represents the bonus percentage (pods/beans - 100%)
          const beanAmount = TokenValue.fromBlockchain(beans.toString(), 6);
          const podAmount = TokenValue.fromBlockchain(pods.toString(), 6);
          const rawTemperature = beanAmount.gt(0) 
            ? Math.round(podAmount.div(beanAmount).mul(100).toNumber()) 
            : 0;
          
          // Subtract 100% to get the bonus percentage
          const temperature = Math.max(0, rawTemperature - 100);
          
          return {
            id: `${transactionHash}-${index}`,
            timestamp,
            season: mockSeason,
            type: 'sow',
            amount: beanAmount,
            pods: podAmount,
            temperature, // Calculated temperature percentage
            placeInLine,
            address: account as string,
            txHash: transactionHash
          };
        });
        
        setActivities(activityItems);
      } catch (error) {
        console.error("Error fetching sow events:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSowEvents();
  }, [publicClient, protocolAddress, currentSeason]);

  const formatType = (type: string) => {
    switch (type) {
      case 'sow': return 'Sow';
      case 'harvest': return 'Harvest';
      case 'transfer': return 'Transfer';
      default: return 'Other';
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleTimeString();
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (loading) {
    return (
      <div className="w-full">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="px-2 py-2 text-left text-xs font-antarctica font-light text-pinto-gray-4">Season</th>
                <th className="px-2 py-2 text-left text-xs font-antarctica font-light text-pinto-gray-4">Date</th>
                <th className="px-2 py-2 text-left text-xs font-antarctica font-light text-pinto-gray-4">Time</th>
                <th className="px-2 py-2 text-left text-xs font-antarctica font-light text-pinto-gray-4">Address</th>
                <th className="px-2 py-2 text-left text-xs font-antarctica font-light text-pinto-gray-4">Txn Hash</th>
                <th className="px-2 py-2 text-left text-xs font-antarctica font-light text-pinto-gray-4">Temp</th>
                <th className="px-2 py-2 text-right text-xs font-antarctica font-light text-pinto-gray-4">Amount Sown</th>
                <th className="px-2 py-2 text-right text-xs font-antarctica font-light text-pinto-gray-4">Pods minted</th>
                <th className="px-2 py-2 text-right text-xs font-antarctica font-light text-pinto-gray-4">Place in Line</th>
              </tr>
            </thead>
            <tbody>
              {Array(5).fill(0).map((_, index) => (
                <tr key={index}>
                  <td className="px-2 py-2"><Skeleton className="h-4 w-12" /></td>
                  <td className="px-2 py-2"><Skeleton className="h-4 w-24" /></td>
                  <td className="px-2 py-2"><Skeleton className="h-4 w-20" /></td>
                  <td className="px-2 py-2"><Skeleton className="h-4 w-28" /></td>
                  <td className="px-2 py-2"><Skeleton className="h-4 w-28" /></td>
                  <td className="px-2 py-2"><Skeleton className="h-4 w-14" /></td>
                  <td className="px-2 py-2"><Skeleton className="h-4 w-20" /></td>
                  <td className="px-2 py-2"><Skeleton className="h-4 w-20" /></td>
                  <td className="px-2 py-2"><Skeleton className="h-4 w-24" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="w-full p-8 flex flex-col items-center justify-center">
        <p className="text-sm text-pinto-gray-4 mb-2">No field activity found</p>
        <p className="text-xs text-pinto-gray-3">Activities like Sowing and Harvesting will appear here</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="px-2 py-2 text-left text-xs font-antarctica font-light text-pinto-gray-4">Season</th>
              <th className="px-2 py-2 text-left text-xs font-antarctica font-light text-pinto-gray-4">Date</th>
              <th className="px-2 py-2 text-left text-xs font-antarctica font-light text-pinto-gray-4">Time</th>
              <th className="px-2 py-2 text-left text-xs font-antarctica font-light text-pinto-gray-4">Address</th>
              <th className="px-2 py-2 text-left text-xs font-antarctica font-light text-pinto-gray-4">Txn Hash</th>
              <th className="px-2 py-2 text-left text-xs font-antarctica font-light text-pinto-gray-4">Temp</th>
              <th className="px-2 py-2 text-right text-xs font-antarctica font-light text-pinto-gray-4">Amount Sown</th>
              <th className="px-2 py-2 text-right text-xs font-antarctica font-light text-pinto-gray-4">Pods minted</th>
              <th className="px-2 py-2 text-right text-xs font-antarctica font-light text-pinto-gray-4">Place in Line</th>
            </tr>
          </thead>
          <tbody>
            {activities.map((activity) => (
              <tr key={activity.id} className="transition-colors">
                <td className="px-2 py-2 text-xs font-antarctica font-light text-pinto-dark">{activity.season}</td>
                <td className="px-2 py-2 text-xs font-antarctica font-light text-pinto-dark">{formatDate(activity.timestamp)}</td>
                <td className="px-2 py-2 text-xs font-antarctica font-light text-pinto-dark">{formatTime(activity.timestamp)}</td>
                <td className="px-2 py-2">
                  <a 
                    href={`https://basescan.org/address/${activity.address}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs font-antarctica font-light text-pinto-dark underline"
                  >
                    {formatAddress(activity.address)}
                  </a>
                </td>
                <td className="px-2 py-2">
                  <a 
                    href={`https://basescan.org/tx/${activity.txHash}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs font-antarctica font-light text-pinto-dark underline"
                  >
                    {formatAddress(activity.txHash)}
                  </a>
                </td>
                <td className="px-2 py-2 text-xs font-antarctica font-light text-pinto-dark">
                  {activity.temperature.toFixed(2)}%
                </td>
                <td className="px-2 py-2 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <IconImage 
                      src={pintoIcon}
                      alt="PINTO" 
                      size={4} 
                    />
                    <span className="text-xs font-antarctica font-light text-pinto-dark">
                      {formatter.number(activity.amount, { minDecimals: 2, maxDecimals: 2 })}
                    </span>
                  </div>
                </td>
                <td className="px-2 py-2 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <IconImage 
                      src={podIcon}
                      alt="Pods" 
                      size={4} 
                    />
                    <span className="text-xs font-antarctica font-light text-pinto-dark">
                      {formatter.number(activity.pods, { minDecimals: 2, maxDecimals: 2 })}
                    </span>
                  </div>
                </td>
                <td className="px-2 py-2 text-xs font-antarctica font-light text-pinto-dark text-right">{activity.placeInLine}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FieldActivity; 