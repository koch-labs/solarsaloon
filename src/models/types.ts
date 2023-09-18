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
}
