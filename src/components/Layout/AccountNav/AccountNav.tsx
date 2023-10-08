import React from "react";
import { Flex, Text } from "@radix-ui/themes";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Button } from "@radix-ui/themes";
import { useCurrentUser } from "../../../contexts/UserContextProvider";
import Link from "next/link";
import { UserIcon, WalletIcon } from "@heroicons/react/24/solid";
import UserBadge from "../../UserBadge";

const AccountNav: React.FC = () => {
  const { signIn, logOff, isSignedIn, user } = useCurrentUser();
  const walletModal = useWalletModal();
  const wallet = useWallet();

  return wallet.connected ? (
    isSignedIn ? (
      <Flex gap="4" align="center">
        <Button variant="ghost" onClick={() => logOff()}>
          <WalletIcon width="20" />
          log off
        </Button>
        {/* <Link href={`/user/${wallet?.publicKey.toString()}`}>
          <Button variant="ghost">
            <UserIcon width="20" />
            account
          </Button>
        </Link> */}
        <UserBadge user={user} />
      </Flex>
    ) : (
      <Flex gap="4">
        <Button variant="ghost" onClick={() => wallet.disconnect()}>
          <WalletIcon width="20" />
          <Text className="hidden sm:block">disconnect wallet</Text>
        </Button>
        <Button color="green" variant="ghost" onClick={() => signIn()}>
          <UserIcon width="20" />
          <Text className="hidden sm:block">sign in</Text>
        </Button>
      </Flex>
    )
  ) : (
    <Button
      variant="ghost"
      onClick={() => walletModal.setVisible(!walletModal.visible)}
    >
      <WalletIcon width="20" />
      <Text>connect wallet</Text>
    </Button>
  );
};

export default AccountNav;
