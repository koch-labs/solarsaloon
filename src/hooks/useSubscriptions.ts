import { PublicKey } from "@solana/web3.js";
import { useCallback, useEffect, useState } from "react";
import { Fetchable, Saloon, Subscription } from "../models/types";
import toast from "react-hot-toast";
import { useCurrentUser } from "../contexts/UserContextProvider";
import { concatUnique } from "../utils";

export default function useSubscriptions(
  collectionMint: string
): Fetchable<Subscription[]> {
  const { token } = useCurrentUser();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [page, setPage] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(5);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchSubscriptions = useCallback(
    async (page: number) => {
      setIsLoading(true);
      console.log("fetching subscriptions", page, collectionMint);
      try {
        const response = await fetch(
          `/api/subscription/all?mint=${collectionMint}&page=${page}&limit=${pageSize}`,
          {
            headers: {
              authorization: token ? `Bearer ${token}` : undefined,
            },
          }
        );
        const { subscriptions } = await response.json();
        setHasMore(subscriptions?.length >= pageSize);
        console.log("found subscriptions at page", subscriptions.length, page);
        setSubscriptions((old) =>
          old
            ? concatUnique(
                [old, subscriptions],
                (a, b) => a.tokenMint === b.tokenMint
              )
            : subscriptions
        );
      } catch (err) {
        toast.error(String(err));
      }
      setIsLoading(false);
    },
    [token, pageSize, collectionMint]
  );

  const fetchMore = useCallback(async () => {
    if (hasMore && !isLoading) {
      setPage((old) => {
        fetchSubscriptions(old + 1);
        return old + 1;
      });
    }
  }, [hasMore, isLoading, fetchSubscriptions]);

  useEffect(() => {
    if (hasMore && !isLoading && page === 0) {
      fetchSubscriptions(0);
    }
  }, [page, fetchSubscriptions, hasMore, isLoading]);

  return subscriptions
    ? {
        data: subscriptions,
        reload: async () => fetchSubscriptions(page),
        fetchMore,
        hasMore,
      }
    : undefined;
}
