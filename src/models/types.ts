import { TokenStateJSON } from "@koch-labs/rent-nft";

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
  subscriptions?: Subscription[];
}

export interface Subscription {
  id: number;
  tokenMint: string;
  lastPost: string;
  tokenState: TokenStateJSON;
  owner?: string;
}
