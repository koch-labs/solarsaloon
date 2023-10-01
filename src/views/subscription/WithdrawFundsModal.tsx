import { Button, Dialog, Flex, Text, TextField } from "@radix-ui/themes";
import { tokens } from "../../utils/tokens";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { getConfigKey, builders as rentBuilders } from "@koch-labs/rent-nft";
import { AnchorProvider, BN } from "@coral-xyz/anchor";
import numeral from "numeral";
import { FullSubscription } from "../../hooks/useSubscription";
import {
  createAssociatedTokenAccountIdempotentInstruction,
  createCloseAccountInstruction,
  createSyncNativeInstruction,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import WaitingButton from "../../components/WaitingButton";
import { Fetchable } from "../../models/types";

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
    (e) => e.publicKey.toString() === subscription?.saloon?.taxMint
  );
  const { connection } = useConnection();
  const wallet = useWallet();
  const provider = useMemo(
    () =>
      wallet ? new AnchorProvider(connection, wallet as any, {}) : undefined,
    [wallet, connection]
  );
  const [amount, setAmount] = useState(0);
  const [isWaiting, setIsWaiting] = useState<boolean>(false);
  const taxesPerYear = new BN(
    subscription?.tokenState?.currentSellingPrice || 0
  )
    .mul(new BN(subscription?.saloon?.config?.taxRate || 0))
    .div(new BN(10000));
  const [amountLeft, setAmountLeft] = useState<string>(
    numeral(subscription?.ownerBidState?.amount || "0").format("0.000a")
  );

  useEffect(() => {
    const interval = setInterval(() => {
      if (!subscription?.bidState) {
        setAmountLeft(numeral("0").format("0.000a"));
        return;
      } else if (
        subscription?.ownerBidState?.bidder !== wallet?.publicKey?.toString()
      ) {
        setAmountLeft(
          numeral(subscription.bidState?.amount)
            .divide(10 ** (token?.decimals || 0))
            .format("0.000a")
        );
        return;
      }

      setAmountLeft(
        numeral(
          new BN(subscription.ownerBidState?.amount || 0)
            .sub(
              taxesPerYear
                .mul(
                  new BN(
                    Math.round(
                      Date.now() / 1000 -
                        Number(subscription?.ownerBidState?.lastUpdate || 0)
                    )
                  )
                )
                .div(new BN(31536000))
            )
            .toString()
        )
          .divide(10 ** (token?.decimals || 0))
          .format("0.000a")
      );
    }, 500);

    return () => clearInterval(interval);
  }, [token, subscription, taxesPerYear, wallet.publicKey]);

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
            collectionMint: new PublicKey(subscription.saloon.collectionMint),
            tokenMint: new PublicKey(subscription.tokenState.tokenMint),
          })
          .builder.transaction()
      );
      tx.add(
        await rentBuilders
          .decreaseBid({
            provider,
            amount: new BN(Math.round(amount * 10 ** (token?.decimals || 0))),
            collectionMint: new PublicKey(subscription.saloon.collectionMint),
            tokenMint: new PublicKey(subscription.subscription.tokenMint),
            authoritiesGroup: new PublicKey(
              subscription.saloon.authoritiesGroup
            ),
            taxMint: new PublicKey(subscription.saloon.taxMint),
            tokenProgram: token.tokenProgram,
          })
          .builder.transaction()
      );

      if (subscription.saloon.taxMint === tokens[0].publicKey.toString()) {
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
      subscription.reload();
      setOpen(false);
    } finally {
      setIsWaiting(false);
    }
  }, [connection, wallet, amount, provider, subscription, token, setOpen]);

  return (
    <Dialog.Root open={open}>
      <Dialog.Content style={{ maxWidth: 450 }}>
        <Dialog.Title>Withdraw funds</Dialog.Title>
        <Dialog.Description size="2" mb="4"></Dialog.Description>
        <Flex direction="column" gap="1" className="text-sm">
          <Text>Choose the amount of {token?.name} you want to withraw.</Text>
          {subscription.subscription?.currentOwner.publicKey ===
          wallet?.publicKey?.toString() ? (
            <Text color="crimson">
              Withdrawing everything you have might will make your subscription
              claimable by anyone for{" "}
              {numeral(subscription?.saloon?.config.minimumSellPrice)
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
                Deposited balance: {amountLeft} ${token?.symbol || "???"}
              </Text>
            </Flex>
            <TextField.Root>
              <TextField.Input
                placeholder="Enter the amount to deposit..."
                onChange={(e) => setAmount(Number(e.target.value))}
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
              color="green"
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
