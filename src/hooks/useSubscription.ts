import { useCallback, useEffect, useState } from "react";
import { Fetchable, FullSubscription } from "../models/types";
import toast from "react-hot-toast";
import { useCurrentUser } from "../contexts/UserContextProvider";

export default function useSubscription(
  tokenMint: string
): Fetchable<FullSubscription> {
  const { token } = useCurrentUser();
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

  return {
    data: subscription,
    reload: async () => fetchSubscription(),
  };
}
