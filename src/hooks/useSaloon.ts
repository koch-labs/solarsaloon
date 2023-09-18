import { PublicKey } from "@solana/web3.js";
import { useEffect, useState } from "react";
import { Saloon } from "../models/types";
import toast from "react-hot-toast";

export default function useSaloon(saloonMint: string) {
  const [saloon, setSaloon] = useState<Saloon>();
  console.log("Use saloon", saloonMint, saloon);

  useEffect(() => {
    if (!saloonMint) return;

    async function fetchSaloon() {
      try {
        const response = await fetch(`/api/saloon/${saloonMint}`);
        console.log("saloon", response);
        const { saloon } = await response.json();
        setSaloon(saloon);
      } catch (err) {
        toast.error(String(err));
      }
    }

    fetchSaloon();
  }, [saloonMint]);

  return saloon;
}
