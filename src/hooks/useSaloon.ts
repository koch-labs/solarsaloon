import { PublicKey } from "@solana/web3.js";
import { useCallback, useEffect, useState } from "react";
import { Saloon } from "../models/types";
import toast from "react-hot-toast";
import { useUser } from "../contexts/UserContextProvider";

export type Fetchable<T> = T & {
  reload: () => Promise<void>;
};

export default function useSaloon(saloonMint: string): Fetchable<Saloon> {
  const { token } = useUser();
  const [saloon, setSaloon] = useState<Saloon>();
  console.log("Use saloon", saloonMint, saloon);

  const fetchSaloon = useCallback(async () => {
    if (!saloonMint) return;

    try {
      const response = await fetch(`/api/saloon/${saloonMint}`, {
        headers: {
          authorization: token ? `Bearer ${token}` : undefined,
        },
      });
      const { saloon } = await response.json();
      setSaloon(saloon);
    } catch (err) {
      toast.error(String(err));
    }
  }, [saloonMint, token]);

  useEffect(() => {
    fetchSaloon();
  }, [fetchSaloon]);

  return saloon ? { ...saloon, reload: async () => fetchSaloon() } : undefined;
}
