import { PublicKey } from "@solana/web3.js";
import { useCallback, useEffect, useState } from "react";
import { Saloon } from "../models/types";
import toast from "react-hot-toast";

export type Fetchable<T> = T & {
  reload: () => Promise<void>;
};

export default function useSaloon(saloonMint: string): Fetchable<Saloon> {
  const [saloon, setSaloon] = useState<Saloon>();
  console.log("Use saloon", saloonMint, saloon);

  const fetchSaloon = useCallback(async () => {
    if (!saloonMint) return;

    try {
      const response = await fetch(`/api/saloon/${saloonMint}`);
      const { saloon } = await response.json();
      setSaloon(saloon);
    } catch (err) {
      toast.error(String(err));
    }
  }, [saloonMint]);

  useEffect(() => {
    fetchSaloon();
  }, [fetchSaloon]);

  return { ...saloon, reload: async () => fetchSaloon() };
}
