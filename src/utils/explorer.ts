import { PublicKey } from "@solana/web3.js";

export function getExplorerUrl(
  account?: PublicKey | string,
  cluster: "devnet" | "mainnet-beta" = "devnet"
) {
  return account
    ? `https://solscan.io/account/${account.toString()}${
        cluster === "devnet" ? "?cluster=devnet" : ""
      }`
    : "#";
}
