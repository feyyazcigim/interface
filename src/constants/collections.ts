import { PINTO_BEAVERS_CONTRACT } from "./address";

export const COLLECTION_NAMES = {
  [PINTO_BEAVERS_CONTRACT]: "Genesis Pinto Beaver",
} as const;

export const getCollectionName = (contractAddress: string): string => {
  return COLLECTION_NAMES[contractAddress as keyof typeof COLLECTION_NAMES] || "Unknown Collection";
};
