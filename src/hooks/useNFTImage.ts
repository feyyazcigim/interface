import { imageCache, imageToDataUrl, metadataCache } from "@/utils/imageCache";
import { type NFTMetadata, fetchNFTMetadata, getOptimizedImageUrl } from "@/utils/ipfs";
import { useEffect, useState } from "react";
import { erc721Abi } from "viem";
import { useReadContract } from "wagmi";

interface UseNFTImageResult {
  imageUrl: string | null;
  metadata: NFTMetadata | null;
  loading: boolean;
  error: string | null;
}

export const useNFTImage = (contractAddress: string, tokenId: number): UseNFTImageResult => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<NFTMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Query tokenURI from contract
  const { data: tokenURI, error: contractError } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: erc721Abi,
    functionName: "tokenURI",
    args: [BigInt(tokenId)],
    query: {
      enabled: !!contractAddress && tokenId > 0,
    },
  });

  useEffect(() => {
    const loadNFTImage = async () => {
      if (!tokenURI || contractError) {
        setLoading(false);
        setError(contractError?.message || "No token URI available");
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const cacheKey = `${contractAddress}_${tokenId}`;

        // Check cached image first
        const cachedImageUrl = await imageCache.get(tokenId);
        if (cachedImageUrl) {
          console.log(`Using cached image for token ${tokenId}`);
          setImageUrl(cachedImageUrl);

          // Still load metadata if not cached
          const cachedMetadata = metadataCache.get(cacheKey);
          if (cachedMetadata) {
            setMetadata(cachedMetadata);
            setLoading(false);
            return;
          }
        }

        // Fetch metadata from IPFS
        console.log(`Fetching metadata for token ${tokenId} from:`, tokenURI);
        const nftMetadata = await fetchNFTMetadata(tokenURI);

        // Cache metadata
        metadataCache.set(cacheKey, nftMetadata);
        setMetadata(nftMetadata);

        if (nftMetadata.image) {
          const optimizedImageUrl = getOptimizedImageUrl(nftMetadata.image);
          console.log(`Found image URL for token ${tokenId}:`, optimizedImageUrl);

          // If we have a cached image, use it
          if (cachedImageUrl) {
            setImageUrl(cachedImageUrl);
            setLoading(false);
            return;
          }

          // Load and cache the actual image file
          try {
            console.log(`Fetching and caching image for token ${tokenId}...`);
            const dataUrl = await imageToDataUrl(optimizedImageUrl);
            await imageCache.set(tokenId, optimizedImageUrl, dataUrl);
            setImageUrl(dataUrl);
            console.log(`Successfully cached image for token ${tokenId}`);
          } catch (imageError) {
            console.warn(`Failed to cache image for token ${tokenId}:`, imageError);
            // Fallback to direct URL (no caching)
            setImageUrl(optimizedImageUrl);
          }
        } else {
          console.warn(`No image found in metadata for token ${tokenId}`);
        }

        setLoading(false);
      } catch (err) {
        console.error(`Failed to load NFT ${tokenId}:`, err);
        setError(err instanceof Error ? err.message : "Failed to load NFT data");
        setLoading(false);
      }
    };

    loadNFTImage();
  }, [tokenURI, contractError, contractAddress, tokenId]);

  return {
    imageUrl,
    metadata,
    loading,
    error,
  };
};

// Hook for batch loading multiple NFTs (for grid views)
export const useNFTImages = (contractAddress: string, tokenIds: number[]) => {
  const [results, setResults] = useState<Record<number, UseNFTImageResult>>({});
  const [globalLoading, setGlobalLoading] = useState(true);

  useEffect(() => {
    const loadAllImages = async () => {
      setGlobalLoading(true);
      const newResults: Record<number, UseNFTImageResult> = {};

      // Initialize all results
      tokenIds.forEach((tokenId) => {
        newResults[tokenId] = {
          imageUrl: null,
          metadata: null,
          loading: true,
          error: null,
        };
      });

      setResults(newResults);

      // Load images in batches to avoid overwhelming IPFS gateways
      const batchSize = 5;
      for (let i = 0; i < tokenIds.length; i += batchSize) {
        const batch = tokenIds.slice(i, i + batchSize);

        await Promise.allSettled(
          batch.map(async (tokenId) => {
            try {
              // This is a simplified version - in practice you'd want to implement
              // the full loading logic here or use the individual hook
              const cacheKey = `${contractAddress}_${tokenId}`;
              const cachedImageUrl = await imageCache.get(tokenId);
              const cachedMetadata = metadataCache.get(cacheKey);

              newResults[tokenId] = {
                imageUrl: cachedImageUrl,
                metadata: cachedMetadata,
                loading: !cachedImageUrl || !cachedMetadata,
                error: null,
              };
            } catch (error) {
              newResults[tokenId] = {
                imageUrl: null,
                metadata: null,
                loading: false,
                error: error instanceof Error ? error.message : "Loading failed",
              };
            }
          }),
        );

        // Update results after each batch
        setResults({ ...newResults });

        // Small delay between batches
        if (i + batchSize < tokenIds.length) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }

      setGlobalLoading(false);
    };

    if (tokenIds.length > 0) {
      loadAllImages();
    } else {
      setGlobalLoading(false);
    }
  }, [contractAddress, tokenIds.join(",")]);

  return {
    results,
    loading: globalLoading,
  };
};
