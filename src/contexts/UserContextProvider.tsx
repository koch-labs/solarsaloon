import { utils } from "@coral-xyz/anchor";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import {
  createContext,
  FC,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { TOKEN_EXPIRATION_DELAY } from "../utils/constants";

export interface User {
  id: number;
  publicKey: PublicKey;
  lastLogin: Date;
}
export interface UserContextState {
  user?: User;
  token?: string;
  signIn(): Promise<void>;
}

export const UserContext = createContext<UserContextState>(
  {} as UserContextState
);

export function useUser(): UserContextState {
  return useContext(UserContext);
}

export const UserProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const { signMessage, publicKey } = useWallet();
  const [user, setUser] = useState<User>();
  const [token, setToken] = useState<string>();
  const isSignedIn = useMemo(() => {
    user?.lastLogin
      ? user?.lastLogin.valueOf() + TOKEN_EXPIRATION_DELAY > Date.now()
      : false;
  }, [user]);

  const signIn = useCallback(async () => {
    const responseChallenge = await fetch(
      `/api/auth/challenge?pubkey=${publicKey}`
    );
    const { challenge } = await responseChallenge.json();

    const signature = await signMessage(
      Uint8Array.from(utils.bytes.utf8.encode(challenge))
    );
    const responseLogin = await fetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        challenge,
        signature: utils.bytes.hex.encode(Buffer.from(signature)),
      }),
    });
    const { token, user } = await responseLogin.json();
    console.log(user);
    setUser({ ...user, lastLogin: new Date(user.lastLogin) });
    setToken(token);
  }, [signMessage, publicKey]);

  return (
    <UserContext.Provider value={{ signIn, user, token }}>
      {children}
    </UserContext.Provider>
  );
};
