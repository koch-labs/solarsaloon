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

export interface User {
  id: number;
  publicKey: PublicKey;
  lastLogin: Date;
}
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

const deserializeUser = ({
  id,
  publicKey,
  lastLogin,
}: {
  id: number;
  publicKey: string;
  lastLogin: string;
}) => {
  return {
    id,
    publicKey: new PublicKey(publicKey),
    lastLogin: new Date(lastLogin),
  };
};

export const UserProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [defaultToken, setDefaultToken] = useLocalStorage(
    "saloon_token",
    undefined
  );
  const [defaultUser, setDefaultUser] = useLocalStorage(
    "saloon_user",
    undefined
  );
  const { signMessage, publicKey } = useWallet();
  const [user, setUser] = useState<User>(
    defaultUser ? deserializeUser(defaultUser) : undefined
  );
  const [token, setToken] = useState<string>(defaultToken);
  const isSignedIn = useMemo(() => {
    return user?.lastLogin
      ? user?.lastLogin.valueOf() + TOKEN_EXPIRATION_DELAY > Date.now()
      : false;
  }, [user]);
  console.log(user, isSignedIn);

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
    setUser({
      id: user.id,
      publicKey: user.publickey,
      lastLogin: new Date(user.lastlogin),
    });
    setDefaultUser({
      id: user.id,
      publicKey: user.publickey,
      lastLogin: new Date(user.lastlogin),
    });
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
