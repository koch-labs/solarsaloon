import {
  BidStateJSON,
  CollectionConfigJSON,
  TokenStateJSON,
} from "@koch-labs/rent-nft";

export type EndpointTypes = "mainnet" | "devnet" | "localnet";

export type Fetchable<T> = {
  data: T;
  reload: () => Promise<void>;
  fetchMore?: () => Promise<void>;
  hasMore?: boolean;
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
  postCooldown: number;
  tags: string[];
  metadata: DigitalAssetStandardMetadata;
  subscriptions?: Subscription[];
  nSubscriptions?: number;
}

export interface Subscription {
  tokenMint: string;
  lastPost: string;
  tokenState: TokenStateJSON;
  currentOwner: User;
  ownerChangedTimestamp: string;
  expirationTimestamp: string;
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
