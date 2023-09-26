import { Button, Dialog, Flex, Text, TextField } from "@radix-ui/themes";
import { tokens } from "../../utils/tokens";
import { useCallback, useMemo, useState } from "react";
import { PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { getConfigKey, builders as rentBuilders } from "@koch-labs/rent-nft";
import { AnchorProvider, BN } from "@coral-xyz/anchor";
import numeral from "numeral";
import { FullSubscription } from "../../hooks/useSubscription";
import { Fetchable } from "../../hooks/useSaloon";
import {
  createAssociatedTokenAccountIdempotentInstruction,
  createSyncNativeInstruction,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import WaitingButton from "../../components/WaitingButton";

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
            amount: new BN(Math.round(amount * 10 ** token.decimals)),
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
          {subscription.subscription?.currentOwner ===
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
                Deposited balance:{" "}
                {numeral(subscription?.bidState?.amount || 0)
                  .divide(10 ** token.decimals)
                  .format("0.00a")}{" "}
                ${token?.symbol || "???"}
              </Text>
            </Flex>
            <TextField.Input
              placeholder="Enter the amount to deposit..."
              onChange={(e) => setAmount(Number(e.target.value))}
            />
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
