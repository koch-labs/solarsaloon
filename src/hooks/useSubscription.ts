import { PublicKey } from "@solana/web3.js";
import { useCallback, useEffect, useState } from "react";
import {
  Fetchable,
  FullSubscription,
  Post,
  Saloon,
  Subscription,
} from "../models/types";
import toast from "react-hot-toast";
import { useCurrentUser } from "../contexts/UserContextProvider";
import { BidStateJSON, TokenStateJSON } from "@koch-labs/rent-nft";

export default function useSubscription(
  tokenMint: string
): Fetchable<FullSubscription> {
  const { token } = useCurrentUser();
  const [subscription, setSubscription] = useState<FullSubscription>();
  const [currentPage, setCurrentPage] = useState(0);

  const fetchSubscription = useCallback(async () => {
    if (!tokenMint) return;

    try {
      const response = await fetch(
        `/api/subscription/${tokenMint}?page=${currentPage}`,
        {
          headers: {
            authorization: token ? `Bearer ${token}` : undefined,
          },
        }
      );
      const fullSubscription: FullSubscription = await response.json();
      const allPosts: Post[] = [];
      setSubscription((old) => {
        old?.posts.forEach((p) =>
          allPosts.find((e) => e.id === p.id) ? undefined : allPosts.push(p)
        );
        fullSubscription?.posts.forEach((p) =>
          allPosts.find((e) => e.id === p.id) ? undefined : allPosts.push(p)
        );
        fullSubscription.posts = allPosts;
        return fullSubscription;
      });
    } catch (err) {
      toast.error(String(err));
    }
  }, [tokenMint, token, currentPage]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  return {
    data: subscription,
    reload: async () => fetchSubscription(),
    fetchMore: async () => setCurrentPage((old) => old + 1),
  };
}
