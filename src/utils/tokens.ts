// import solanaLogo from "../assets/react.svg";

import { PublicKey } from "@solana/web3.js";

export interface Token {
  name: string;
  symbol: string;
  icon: string;
  publicKey: PublicKey;
}

export const tokens: Token[] = [
  {
    name: "Solana",
    symbol: "SOL",
    icon: "",
    publicKey: new PublicKey("So11111111111111111111111111111111111111112"),
  },
];
