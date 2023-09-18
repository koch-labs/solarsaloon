import { utils } from "@coral-xyz/anchor";
import { useLocalStorage, useWallet } from "@solana/wallet-adapter-react";
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
import { User } from "../models/types";

export interface UserContextState {
  user?: User;
  token?: string;
  signIn(): Promise<void>;
  logOff(): Promise<void>;
  isSignedIn: boolean;
}

export const UserContext = createContext<UserContextState>(
  {} as UserContextState
);

export function useUser(): UserContextState {
  return useContext(UserContext);
}

export const UserProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [defaultToken, setDefaultToken] = useLocalStorage<string>(
    "saloon_token",
    undefined
  );
  const [defaultUser, setDefaultUser] = useLocalStorage<User>(
    "saloon_user",
    undefined
  );
  const { signMessage, publicKey } = useWallet();
  const [user, setUser] = useState<User>(defaultUser);
  const [token, setToken] = useState<string>(defaultToken);
  const isSignedIn = useMemo(() => {
    return user?.lastLogin
      ? new Date(user?.lastLogin).valueOf() + TOKEN_EXPIRATION_DELAY >
          Date.now()
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
    setUser(user);
    setDefaultUser(user);
    setToken(token);
    setDefaultToken(token);
  }, [signMessage, publicKey, setDefaultToken, setDefaultUser]);

  const logOff = useCallback(async () => {
    setUser(undefined);
    setDefaultUser(undefined);
    setToken(undefined);
    setDefaultToken(undefined);
  }, [setDefaultToken, setDefaultUser]);

  return (
    <UserContext.Provider value={{ signIn, logOff, user, token, isSignedIn }}>
      {children}
    </UserContext.Provider>
  );
};
