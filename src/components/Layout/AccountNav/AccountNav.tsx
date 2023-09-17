import React from "react";
import { DropdownMenu, Tooltip } from "@radix-ui/themes";
import { HamburgerMenuIcon } from "@radix-ui/react-icons";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Button } from "@radix-ui/themes";
import { useUser } from "../../../contexts/UserContextProvider";
import Link from "next/link";
import { CheckCircledIcon, CrossCircledIcon } from "@radix-ui/react-icons";

const AccountNav: React.FC = () => {
  const { signIn, isSignedIn } = useUser();
  const walletModal = useWalletModal();
  const wallet = useWallet();

  return wallet.connected ? (
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
            Authentication
          </DropdownMenu.Label>
          {isSignedIn ? null : (
            <DropdownMenu.Item color="green" onClick={() => signIn()}>
              Sign In
            </DropdownMenu.Item>
          )}
          <DropdownMenu.Item
            color="crimson"
            onClick={() => wallet.disconnect()}
          >
            Disconnect
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    </div>
  ) : (
    <Button onClick={() => walletModal.setVisible(!walletModal.visible)}>
      Connect key
    </Button>
  );
};

export default AccountNav;
