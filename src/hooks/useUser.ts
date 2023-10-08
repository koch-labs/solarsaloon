import { useCallback, useEffect, useState } from "react";
import { Fetchable, Saloon, User } from "../models/types";
import toast from "react-hot-toast";

export type ExtendedUser = { user: User; saloons: Saloon[] };

export default function useUser(publicKey: string): Fetchable<ExtendedUser> {
  const [user, setUser] = useState<ExtendedUser>();

  const fetchSaloon = useCallback(async () => {
    if (!publicKey) return;

    try {
      const response = await fetch(`/api/user/${publicKey}`);
      const { user, saloons } = await response.json();
      setUser({ user, saloons });
    } catch (err) {
      toast.error(String(err));
    }
  }, [publicKey]);

  useEffect(() => {
    fetchSaloon();
  }, [fetchSaloon]);

  return { data: user, reload: async () => fetchSaloon() };
}
