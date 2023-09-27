import { CollectionConfigJSON, TokenStateJSON } from "@koch-labs/rent-nft";

export type EndpointTypes = "mainnet" | "devnet" | "localnet";

export interface User {
  publicKey: string;
  lastLogin: string;
}

export interface DigitalAssetStandardMetadata {
  name: string;
  description: string;
  image: string;
}

export interface Saloon {
  owner: User;
  collectionMint: string;
  taxMint: string;
  authoritiesGroup: string;
  config: CollectionConfigJSON;
  metadata: DigitalAssetStandardMetadata;
  subscriptions?: Subscription[];
}

export interface Subscription {
  tokenMint: string;
  lastPost: string;
  tokenState: TokenStateJSON;
  currentOwner: string;
}

export interface Post {
  id: number;
  creator: string;
  collectionMint: string;
  content: string;
  draft: boolean;
  creationTimestamp: string;
}
