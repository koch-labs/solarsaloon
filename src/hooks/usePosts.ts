import { PublicKey } from "@solana/web3.js";
import { useCallback, useEffect, useState } from "react";
import { Fetchable, Post, Saloon, Subscription } from "../models/types";
import toast from "react-hot-toast";
import { useCurrentUser } from "../contexts/UserContextProvider";
import { concatUnique } from "../utils";

export default function usePosts(collectionMint: string): Fetchable<Post[]> {
  const { token } = useCurrentUser();
  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(5);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchPosts = useCallback(
    async (page: number) => {
      if (!collectionMint) return;

      setIsLoading(true);

      try {
        const response = await fetch(
          `/api/post/all?mint=${collectionMint}&page=${page}&limit=${pageSize}`,
          {
            headers: {
              authorization: token ? `Bearer ${token}` : undefined,
            },
          }
        );
        const { posts } = await response.json();
        setHasMore((posts?.length || 0) >= pageSize);
        setPosts((old) =>
          old ? concatUnique([old, posts], (a, b) => a.id === b.id) : posts
        );
      } catch (err) {
        toast.error(String(err));
      }
      setIsLoading(false);
    },
    [token, pageSize, collectionMint]
  );

  const fetchMore = useCallback(async () => {
    if (hasMore && !isLoading && collectionMint) {
      setPage((old) => {
        fetchPosts(old + 1);
        return old + 1;
      });
    }
  }, [collectionMint, hasMore, isLoading, fetchPosts]);

  useEffect(() => {
    if (hasMore && !isLoading && page === 0) {
      fetchPosts(0);
    }
  }, [page, fetchPosts, hasMore, isLoading]);

  return posts
    ? {
        data: posts,
        reload: async () => {
          setPosts([]);
          setPage(0);
          fetchPosts(0);
        },
        fetchMore,
        hasMore,
      }
    : undefined;
}
