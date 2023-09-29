import React from "react";
import { DropdownMenu, Flex, Text, Tooltip } from "@radix-ui/themes";
import { HamburgerMenuIcon } from "@radix-ui/react-icons";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Button } from "@radix-ui/themes";
import { useCurrentUser } from "../../../contexts/UserContextProvider";
import Link from "next/link";
import { CheckCircledIcon, CrossCircledIcon } from "@radix-ui/react-icons";
import { useNetworkConfiguration } from "../../../contexts/NetworkConfigurationProvider";
import { shortKey } from "../../../utils";

const AccountNav: React.FC = () => {
  const { setNetworkConfiguration } = useNetworkConfiguration();
  const { signIn, logOff, isSignedIn } = useCurrentUser();
  const walletModal = useWalletModal();
  const wallet = useWallet();

  return wallet.connected ? (
    isSignedIn ? (
      <div className="flex gap-2">
        <DropdownMenu.Root>
          <DropdownMenu.Trigger>
            <Button variant="soft">
              <HamburgerMenuIcon />
              {isSignedIn ? (
                <Tooltip content="You are signed in">
                  <CheckCircledIcon color="green" />
                </Tooltip>
              ) : (
                <Tooltip content="You are not signed in">
                  <CrossCircledIcon color="crimson" />
                </Tooltip>
              )}
            </Button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content>
            <Link href="/profile">
              <DropdownMenu.Item className="DropdownMenuItem">
                Profile
              </DropdownMenu.Item>
            </Link>

            <DropdownMenu.Separator className="DropdownMenuSeparator" />

            <DropdownMenu.Label className="DropdownMenuLabel">
              Authentication <br />
              {shortKey(wallet?.publicKey)}
            </DropdownMenu.Label>
            <DropdownMenu.Item color="crimson" onClick={() => logOff()}>
              Log off
            </DropdownMenu.Item>
            <DropdownMenu.Item
              color="crimson"
              onClick={() => wallet.disconnect()}
            >
              Disconnect
            </DropdownMenu.Item>

            <DropdownMenu.Separator className="DropdownMenuSeparator" />

            <DropdownMenu.Sub>
              <DropdownMenu.SubTrigger>Pick Network...</DropdownMenu.SubTrigger>
              <DropdownMenu.SubContent>
                <DropdownMenu.Item
                  onClick={(e) => setNetworkConfiguration("mainnet-beta")}
                >
                  Mainnet
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  onClick={(e) => setNetworkConfiguration("devnet")}
                >
                  Devnet
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  onClick={(e) => setNetworkConfiguration("testnet")}
                >
                  Testnet
                </DropdownMenu.Item>
              </DropdownMenu.SubContent>
            </DropdownMenu.Sub>
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      </div>
    ) : (
      <Flex gap="1">
        <Button color="green" onClick={() => signIn()}>
          Sign in
        </Button>
        <Button color="crimson" onClick={() => wallet.disconnect()}>
          Disconnect
        </Button>
      </Flex>
    )
  ) : (
    <Button onClick={() => walletModal.setVisible(!walletModal.visible)}>
      Connect key
    </Button>
  );
};

export default AccountNav;
