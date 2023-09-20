import { CollectionConfigJSON, TokenStateJSON } from "@koch-labs/rent-nft";

export type EndpointTypes = "mainnet" | "devnet" | "localnet";

export interface User {
  id: number;
  publicKey: string;
  lastLogin: string;
}

export interface Saloon {
  id: number;
  owner: User;
  collectionMint: string;
  taxMint: string;
  authoritiesGroup: string;
  config: CollectionConfigJSON;
  subscriptions?: Subscription[];
}

export interface Subscription {
  id: number;
  tokenMint: string;
  lastPost: string;
  tokenState: TokenStateJSON;
  currentOwner: string;
}

export interface Post {
  id: number;
  creatorId: number;
  saloonId: number;
  content: string;
  draft: boolean;
  creationTimestamp: string;
}
