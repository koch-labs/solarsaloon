import {
  BidStateJSON,
  CollectionConfigJSON,
  TokenStateJSON,
} from "@koch-labs/rent-nft";

export type EndpointTypes = "mainnet" | "devnet" | "localnet";

export type Fetchable<T> = T & {
  reload: () => Promise<void>;
  fetchNextPage?: () => Promise<void>;
};

export interface User {
  publicKey: string;
  username: string;
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
  currentOwner: User;
  metadata?: DigitalAssetStandardMetadata;
}

export interface FullSubscription {
  subscription: Subscription;
  saloon: Saloon;
  tokenState: TokenStateJSON;
  bidState?: BidStateJSON;
  ownerBidState?: BidStateJSON;
  userBalance?: number;
  posts?: Post[];
}

export interface Post {
  id: number;
  creator: User;
  collectionMint: string;
  content: string;
  draft: boolean;
  creationTimestamp: string;
}
