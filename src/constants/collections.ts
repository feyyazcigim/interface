import { NFT_COLLECTION_1_CONTRACT } from "./address";

export const COLLECTION_NAMES = {
  [NFT_COLLECTION_1_CONTRACT]: "Genesis Pinto Beaver",
} as const;

export const getCollectionName = (contractAddress: string): string => {
  return COLLECTION_NAMES[contractAddress as keyof typeof COLLECTION_NAMES] || "Unknown Collection";
};
