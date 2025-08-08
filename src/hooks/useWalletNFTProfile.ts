import { PINTO_BEAVERS_CONTRACT } from "@/constants/address";
import { useNFTImage } from "@/hooks/useNFTImage";
import { useEffect, useState } from "react";
import { erc721Abi } from "viem";
import { useAccount, useReadContract, useReadContracts } from "wagmi";

interface WalletNFTProfile {
  hasNFT: boolean;
  profileImageUrl: string | null;
  tokenId: number | null;
  loading: boolean;
}

export const useWalletNFTProfile = (): WalletNFTProfile => {
  const { address } = useAccount();
  const [lowestTokenId, setLowestTokenId] = useState<number | null>(null);

  // Get user's NFT balance
  const { data: balance } = useReadContract({
    address: PINTO_BEAVERS_CONTRACT as `0x${string}`,
    abi: erc721Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  // Get all user's token IDs
  const balanceNum = balance ? Number(balance) : 0;
  const tokenIndexCalls = Array.from({ length: balanceNum }, (_, index) => ({
    address: PINTO_BEAVERS_CONTRACT as `0x${string}`,
    abi: erc721Abi,
    functionName: "tokenOfOwnerByIndex",
    args: address ? [address, BigInt(index)] : undefined,
  }));

  const { data: tokenIds } = useReadContracts({
    contracts: tokenIndexCalls,
    query: {
      enabled: !!address && balanceNum > 0,
    },
  });

  // Get user's NFT image for the lowest tokenId (rarest)
  const { imageUrl, loading: imageLoading } = useNFTImage(PINTO_BEAVERS_CONTRACT, lowestTokenId || 0);

  useEffect(() => {
    if (!tokenIds || tokenIds.length === 0) {
      setLowestTokenId(null);
      return;
    }

    // Extract token IDs and find the lowest one (representing rarity)
    const userTokenIds = tokenIds
      .filter((result) => result.status === "success" && result.result)
      .map((result) => Number(result.result))
      .filter((id) => !Number.isNaN(id));

    if (userTokenIds.length > 0) {
      setLowestTokenId(Math.min(...userTokenIds));
    }
  }, [tokenIds]);

  return {
    hasNFT: balanceNum > 0,
    profileImageUrl: imageUrl,
    tokenId: lowestTokenId,
    loading: imageLoading || (!!address && balanceNum > 0 && lowestTokenId === null),
  };
};
