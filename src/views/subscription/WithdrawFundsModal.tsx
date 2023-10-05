import { Button, Dialog, Flex, Text, TextField } from "@radix-ui/themes";
import { tokens } from "../../utils/tokens";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { getConfigKey, builders as rentBuilders } from "@koch-labs/rent-nft";
import { AnchorProvider, BN } from "@coral-xyz/anchor";
import numeral from "numeral";
import { FullSubscription } from "../../models/types";
import {
  createCloseAccountInstruction,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import WaitingButton from "../../components/WaitingButton";
import { Fetchable } from "../../models/types";
import useFees from "../../hooks/useFees";
import { useCurrentUser } from "../../contexts/UserContextProvider";

export default function WithdrawFundsModal({
  setOpen,
  open,
  subscription,
}: {
  setOpen: (boolean) => void;
  open: boolean;
  subscription: Fetchable<FullSubscription>;
  externalAccount?: boolean;
}) {
  const token = tokens.find(
    (e) => e.publicKey.toString() === subscription?.data?.saloon?.taxMint
  );
  const { connection } = useConnection();
  const user = useCurrentUser();
  const wallet = useWallet();
  const provider = useMemo(
    () =>
      wallet ? new AnchorProvider(connection, wallet as any, {}) : undefined,
    [wallet, connection]
  );
  const [amount, setAmount] = useState(0);
  const [isWaiting, setIsWaiting] = useState<boolean>(false);
  const { amount: amountLeft, timeLeft } = useFees({
    price: Number(
      numeral(subscription?.data?.tokenState?.currentSellingPrice || 0)
        .divide(10 ** (token?.decimals || 0))
        .format("0.000")
    ),
    taxRate: Number(subscription?.data?.saloon?.config?.taxRate),
    lastUpdate: Number(subscription?.data?.bidState?.lastUpdate),
    depositAmount: Number(
      numeral(subscription?.data?.bidState?.amount)
        .divide(10 ** (token?.decimals || 0))
        .format("0.000")
    ),
  });

  const handleWithdraw = useCallback(async () => {
    if (!amount) return;

    setIsWaiting(true);

    try {
      const tx = new Transaction();
      const {
        value: { blockhash, lastValidBlockHeight },
        context: { slot },
      } = await connection.getLatestBlockhashAndContext();
      tx.recentBlockhash = blockhash;
      tx.lastValidBlockHeight = lastValidBlockHeight;
      tx.feePayer = wallet.publicKey;
      tx.minNonceContextSlot = slot;

      tx.add(
        await rentBuilders
          .updateBid({
            provider,
            collectionMint: new PublicKey(
              subscription?.data?.saloon.collectionMint
            ),
            tokenMint: new PublicKey(subscription?.data?.tokenState.tokenMint),
          })
          .builder.transaction()
      );
      tx.add(
        await rentBuilders
          .decreaseBid({
            provider,
            amount: new BN(Math.round(amount * 10 ** (token?.decimals || 0))),
            collectionMint: new PublicKey(
              subscription?.data?.saloon.collectionMint
            ),
            tokenMint: new PublicKey(
              subscription?.data?.subscription?.tokenMint
            ),
            authoritiesGroup: new PublicKey(
              subscription?.data?.saloon.authoritiesGroup
            ),
            taxMint: new PublicKey(subscription?.data?.saloon.taxMint),
            tokenProgram: token.tokenProgram,
          })
          .builder.transaction()
      );

      if (
        subscription?.data?.saloon.taxMint === tokens[0].publicKey.toString()
      ) {
        // Closing wsol account to recover sol
        tx.add(
          createCloseAccountInstruction(
            getAssociatedTokenAddressSync(
              token.publicKey,
              wallet.publicKey,
              true,
              token.tokenProgram
            ),
            wallet.publicKey,
            wallet.publicKey,
            [],
            token.tokenProgram
          )
        );
      }

      const conf = await wallet.sendTransaction(tx, connection);
      await connection.confirmTransaction(conf);

      await fetch("/api/subscription?.data/change", {
        method: "POST",
        body: JSON.stringify({
          tokenMint: subscription?.data?.subscription?.tokenMint,
          currentPrice: numeral(
            subscription?.data?.ownerBidState.sellingPrice || 0
          )
            .divide(10 ** (token?.decimals || 0))
            .format("0.000"),
          expirationDate: new Date(Date.now() + timeLeft),
        }),
        headers: {
          authorization: `Bearer ${user.token}`,
        },
      });

      subscription.reload();
      setOpen(false);
    } finally {
      setIsWaiting(false);
    }
  }, [
    connection,
    wallet,
    amount,
    provider,
    subscription,
    token,
    setOpen,
    timeLeft,
    user,
  ]);

  return (
    <Dialog.Root open={open}>
      <Dialog.Content style={{ maxWidth: 450 }}>
        <Dialog.Title>Withdraw funds</Dialog.Title>
        <Dialog.Description size="2" mb="4"></Dialog.Description>
        <Flex direction="column" gap="1" className="text-sm">
          <Text>Choose the amount of {token?.name} you want to withraw.</Text>
          {subscription?.data?.subscription?.currentOwner.publicKey ===
          wallet?.publicKey?.toString() ? (
            <Text color="crimson">
              Withdrawing everything you have might will make your subscription
              claimable by anyone for{" "}
              {numeral(subscription?.data?.saloon?.config.minimumSellPrice)
                .divide(10 ** token?.decimals)
                .format("0.0a")}{" "}
              ${token?.symbol}
            </Text>
          ) : null}
        </Flex>
        <Flex direction="column" gap="3">
          <label>
            <Flex justify="between" align="center">
              <Text as="div" size="2" mb="1" weight="bold">
                Amount
              </Text>
              <Text weight="light">
                Deposited balance: {numeral(amountLeft).format("0.000")} $
                {token?.symbol || "???"}
              </Text>
            </Flex>
            <TextField.Root>
              <TextField.Input
                placeholder="Enter the amount to withdraw..."
                onChange={(e) => setAmount(Number(e.target.value))}
                type="number"
                value={amount}
              />
              <TextField.Slot className="m-1">
                <Button
                  size="1"
                  variant="ghost"
                  onClick={() => setAmount(Number(amountLeft))}
                >
                  MAX
                </Button>
              </TextField.Slot>
            </TextField.Root>
          </label>
        </Flex>

        <Flex gap="3" mt="4" justify="end">
          <Dialog.Close>
            <Button
              variant="soft"
              color="gray"
              onClick={() => {
                setOpen(false);
                setIsWaiting(false);
              }}
            >
              Cancel
            </Button>
          </Dialog.Close>
          <Dialog.Close>
            <WaitingButton
              onClick={handleWithdraw}
              disabled={!amount}
              loading={isWaiting}
            >
              Withdraw
            </WaitingButton>
          </Dialog.Close>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}
