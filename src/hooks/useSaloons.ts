import { PublicKey } from "@solana/web3.js";
import { useCallback, useEffect, useState } from "react";
import { Fetchable, Saloon } from "../models/types";
import toast from "react-hot-toast";
import { useCurrentUser } from "../contexts/UserContextProvider";
import { concatUnique } from "../utils";

export default function useSaloons({
  tags,
}: {
  tags: string[];
}): Fetchable<Saloon[]> {
  const { token } = useCurrentUser();
  const [saloons, setSaloons] = useState<Saloon[]>([]);
  const [page, setPage] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchSaloons = useCallback(
    async (page: number) => {
      setIsLoading(true);
      console.log("fetching saloons", page);
      try {
        const response = await fetch(
          `/api/saloon/all?page=${page}&limit=${pageSize}`,
          {
            headers: {
              authorization: token ? `Bearer ${token}` : undefined,
            },
          }
        );
        const { saloons } = await response.json();
        setHasMore(saloons?.length >= pageSize);
        console.log("found saloons at page", saloons.length, page);
        setSaloons((old) =>
          old
            ? concatUnique(
                [old, saloons],
                (a, b) => a.collectionMint === b.collectionMint
              )
            : saloons
        );
      } catch (err) {
        toast.error(String(err));
      }
      setIsLoading(false);
    },
    [token, pageSize]
  );

  const fetchMore = useCallback(async () => {
    if (hasMore && !isLoading) {
      setPage((old) => {
        fetchSaloons(old + 1);
        return old + 1;
      });
    }
  }, [hasMore, isLoading, fetchSaloons]);

  useEffect(() => {
    if (hasMore && !isLoading && page === 0) {
      fetchSaloons(0);
    }
  }, [page, fetchSaloons, hasMore, isLoading]);

  return saloons
    ? {
        data: saloons,
        reload: async () => fetchSaloons(page),
        fetchMore,
        hasMore,
      }
    : undefined;
}
