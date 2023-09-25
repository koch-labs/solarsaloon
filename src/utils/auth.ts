import { PublicKey } from "@solana/web3.js";

export const createChallengeString = (key: PublicKey) => {
  return `Login request from ${key.toString()} at timestamp ${Date.now()}`;
};

export const parseChallenge = (challenge: string) => {
  const parts = challenge.split(" ");
  return { pubkey: parts[3], timestamp: parts[6] };
};
