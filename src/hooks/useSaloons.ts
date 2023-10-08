import { useCallback, useEffect, useState } from "react";
import { Fetchable, Saloon } from "../models/types";
import toast from "react-hot-toast";
import { useCurrentUser } from "../contexts/UserContextProvider";
import { concatUnique } from "../utils";

export default function useSaloons({
  creator,
  tags,
}: {
  creator?: string;
  tags?: string[];
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
      try {
        console.log(
          `/api/saloon/all?page=${page}&limit=${pageSize}${
            creator ? `&creator=${creator}` : ""
          }${tags?.length > 0 ? `&tags=${tags.join(",")}` : ""}`,
          tags
        );
        const response = await fetch(
          `/api/saloon/all?page=${page}&limit=${pageSize}${
            creator ? `&creator=${creator}` : ""
          }${tags?.length > 0 ? `&tags=${tags}` : ""}`,
          {
            headers: {
              authorization: token ? `Bearer ${token}` : undefined,
            },
          }
        );
        const { saloons } = await response.json();
        setHasMore(saloons?.length >= pageSize);
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
    [token, pageSize, tags, creator]
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
        reload: async () => {
          setSaloons([]);
          setPage(0);
          setHasMore(true);
        },
        fetchMore,
        hasMore,
      }
    : undefined;
}
