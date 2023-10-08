import { Button, Dialog, Flex, Text, TextField } from "@radix-ui/themes";
import { tokens } from "../../utils/tokens";
import numeral from "numeral";
import { useCallback, useMemo, useState } from "react";
import { PublicKey, Transaction } from "@solana/web3.js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { builders as rentBuilders } from "@koch-labs/rent-nft";
import { AnchorProvider, BN } from "@coral-xyz/anchor";
import { FullSubscription } from "../../models/types";
import { Fetchable } from "../../models/types";
import { TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import WaitingButton from "../../components/WaitingButton";
import { useCurrentUser } from "../../contexts/UserContextProvider";
import useFees from "../../hooks/useFees";

export default function SetSellingPriceModal({
  setOpen,
  open,
  subscription,
}: {
  setOpen: (boolean) => void;
  open: boolean;
  subscription: Fetchable<FullSubscription>;
}) {
  const token = tokens.find(
    (e) => e.publicKey.toString() === subscription?.data?.saloon?.taxMint
  );
  const { connection } = useConnection();
  const wallet = useWallet();
  const user = useCurrentUser();
  const provider = useMemo(
    () =>
      wallet ? new AnchorProvider(connection, wallet as any, {}) : undefined,
    [wallet, connection]
  );
  const [newPrice, setNewPrice] = useState<number>(0);
  const [isWaiting, setIsWaiting] = useState<boolean>(false);
  const { taxesPerYear, timeLeft } = useFees({
    price: newPrice,
    taxRate: Number(subscription?.data?.saloon?.config?.taxRate || 0),
    lastUpdate: Date.now(),
    depositAmount: Number(
      numeral(subscription?.data?.bidState?.amount || 0)
        .divide(10 ** (token?.decimals || 0))
        .format("0.000a")
    ),
    increaseDeposit: false,
  });

  const handleBuy = useCallback(async () => {
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

      const collectionMint = new PublicKey(
        subscription?.data?.saloon.collectionMint
      );
      const tokenMint = new PublicKey(subscription?.data?.tokenState.tokenMint);

      tx.add(
        await rentBuilders
          .updateBid({
            provider,
            bidder: new PublicKey(
              subscription?.data?.subscription?.currentOwner.publicKey
            ),
            collectionMint,
            tokenMint,
          })
          .builder.transaction()
      );
      tx.add(
        await rentBuilders
          .updateSellingPrice({
            provider,
            newPrice: new BN(Math.round(newPrice * 10 ** token.decimals)),
            owner: new PublicKey(
              subscription?.data?.subscription?.currentOwner.publicKey
            ),
            collectionMint: new PublicKey(
              subscription?.data?.saloon.collectionMint
            ),
            tokenMint: new PublicKey(subscription?.data?.tokenState.tokenMint),
            tokenProgram: TOKEN_2022_PROGRAM_ID,
          })
          .builder.transaction()
      );

      const conf = await wallet.sendTransaction(tx, connection, {
        skipPreflight: true,
      });
      await connection.confirmTransaction(conf);

      await fetch("/api/subscription/change", {
        method: "POST",
        body: JSON.stringify({
          tokenMint: subscription?.data?.subscription?.tokenMint,
          currentPrice: newPrice,
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
    newPrice,
    provider,
    subscription,
    token,
    user,
    setOpen,
    timeLeft,
  ]);

  return (
    <Dialog.Root open={open}>
      <Dialog.Content style={{ maxWidth: 450 }}>
        <Dialog.Title>update selling price</Dialog.Title>
        <Dialog.Description size="2" mb="4">
          Change from the current price of{" "}
          {numeral(
            subscription?.data?.tokenState?.ownerBidState
              ? subscription?.data?.tokenState?.currentSellingPrice
              : "0"
          )
            .divide(10 ** (token?.decimals || 0))
            .format("0.0a")}{" "}
          ${token?.symbol || "???"} to{" "}
          {numeral(newPrice.toString()).format("0.0a")} $
          {token?.symbol || "???"}. While you have the subscription?.data, it
          will cost you{" "}
          {numeral(taxesPerYear / 365)
            .divide(10 ** (token?.decimals || 0))
            .format("0.00a")
            .replace("NaN", "0")}{" "}
          ${token?.symbol} per day.
        </Dialog.Description>
        <Flex direction="column" gap="3">
          <label>
            <Text as="div" size="2" mb="1" weight="bold">
              new sell price
            </Text>
            <TextField.Input
              placeholder="Enter the new sell price..."
              onChange={(e) => setNewPrice(Number(e.target.value))}
            />
          </label>
        </Flex>
        <Flex gap="3" mt="4" justify="end">
          <Dialog.Close>
            <Button variant="soft" color="gray" onClick={() => setOpen(false)}>
              cancel
            </Button>
          </Dialog.Close>
          <Dialog.Close>
            <WaitingButton
              color="green"
              onClick={handleBuy}
              disabled={newPrice === 0}
              loading={isWaiting}
            >
              update
            </WaitingButton>
          </Dialog.Close>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}
