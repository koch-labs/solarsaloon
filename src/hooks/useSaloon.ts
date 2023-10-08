import { PublicKey } from "@solana/web3.js";
import { useCallback, useEffect, useState } from "react";
import { Fetchable, Saloon } from "../models/types";
import toast from "react-hot-toast";
import { useCurrentUser } from "../contexts/UserContextProvider";

export default function useSaloon(saloonMint: string): Fetchable<Saloon> {
  const { token } = useCurrentUser();
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

  return saloon
    ? { data: saloon, reload: async () => fetchSaloon() }
    : undefined;
}
