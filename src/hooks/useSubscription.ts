import { PublicKey } from "@solana/web3.js";
import { useCallback, useEffect, useState } from "react";
import { Saloon, Subscription } from "../models/types";
import toast from "react-hot-toast";
import { useUser } from "../contexts/UserContextProvider";
import { Fetchable } from "./useSaloon";
import { BidStateJSON, TokenStateJSON } from "@koch-labs/rent-nft";

export interface FullSubscription {
  subscription: Subscription;
  saloon: Saloon;
  tokenState: TokenStateJSON;
  bidState?: BidStateJSON;
  ownerBidState?: BidStateJSON;
  userBalance?: number;
}
export default function useSubscription(
  tokenMint: string
): Fetchable<FullSubscription> {
  const { token } = useUser();
  const [subscription, setSubscription] = useState<FullSubscription>();

  const fetchSubscription = useCallback(async () => {
    if (!tokenMint) return;

    try {
      const response = await fetch(`/api/subscription/${tokenMint}`, {
        headers: {
          authorization: token ? `Bearer ${token}` : undefined,
        },
      });
      const fullSubscription: FullSubscription = await response.json();
      setSubscription(fullSubscription);
    } catch (err) {
      toast.error(String(err));
    }
  }, [tokenMint, token]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  return { ...subscription, reload: async () => fetchSubscription() };
}
