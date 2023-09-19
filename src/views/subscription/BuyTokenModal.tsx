import { Button, Dialog, Flex, Text, TextField } from "@radix-ui/themes";
import { tokens } from "../../utils/tokens";
import numeral from "numeral";
import { useCallback, useMemo, useState } from "react";
import { PublicKey, Transaction } from "@solana/web3.js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { builders as rentBuilders } from "@koch-labs/rent-nft";
import { AnchorProvider, BN } from "@coral-xyz/anchor";
import { FullSubscription } from "../../hooks/useSubscription";
import { Fetchable } from "../../hooks/useSaloon";
import {
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountIdempotentInstruction,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";

export default function BuyTokenModal({
  setOpen,
  open,
  subscription,
}: {
  setOpen: (boolean) => void;
  open: boolean;
  subscription: Fetchable<FullSubscription>;
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
  const [newPrice, setNewPrice] = useState(0);

  const handleBuy = useCallback(async () => {
    const tx = new Transaction();
    const {
      value: { blockhash, lastValidBlockHeight },
      context: { slot },
    } = await connection.getLatestBlockhashAndContext();
    tx.recentBlockhash = blockhash;
    tx.lastValidBlockHeight = lastValidBlockHeight;
    tx.feePayer = wallet.publicKey;
    tx.minNonceContextSlot = slot;

    const collectionMint = new PublicKey(subscription.saloon.collectionMint);
    const tokenMint = new PublicKey(subscription.tokenState.tokenMint);
    tx.add(
      createAssociatedTokenAccountIdempotentInstruction(
        wallet.publicKey,
        getAssociatedTokenAddressSync(
          tokenMint,
          wallet.publicKey,
          true,
          TOKEN_2022_PROGRAM_ID
        ),
        wallet.publicKey,
        tokenMint,
        TOKEN_2022_PROGRAM_ID
      )
    );

    if (!subscription.bidState) {
      tx.add(
        await rentBuilders
          .createBid({
            provider,
            collectionMint,
            authoritiesGroup: new PublicKey(
              subscription.saloon.authoritiesGroup
            ),
            tokenMint,
          })
          .builder.transaction()
      );
    }

    tx.add(
      await rentBuilders
        .updateBid({
          provider,
          collectionMint,
          tokenMint,
        })
        .builder.transaction()
    );

    if (!subscription.ownerBidState) {
      // Token has no owner, claim it
      tx.add(
        await rentBuilders
          .claimToken({
            provider,
            newSellPrice: new BN(Math.round(newPrice * 10 ** token.decimals)),
            newOwner: wallet.publicKey,
            oldOwner: new PublicKey(subscription.subscription.currentOwner),
            collectionMint,
            tokenMint: tokenMint,
            tokenProgram: TOKEN_2022_PROGRAM_ID,
          })
          .builder.transaction()
      );
    } else {
      // Buy token from current owner
      tx.add(
        await rentBuilders
          .updateBid({
            provider,
            bidder: new PublicKey(subscription.subscription.currentOwner),
            collectionMint,
            tokenMint,
          })
          .builder.transaction()
      );
      tx.add(
        await rentBuilders
          .buyToken({
            provider,
            newSellPrice: new BN(Math.round(newPrice * 10 ** token.decimals)),
            owner: new PublicKey(subscription.subscription.currentOwner),
            collectionMint: new PublicKey(subscription.saloon.collectionMint),
            tokenMint: new PublicKey(subscription.tokenState.tokenMint),
            tokenProgram: TOKEN_2022_PROGRAM_ID,
          })
          .builder.transaction()
      );
    }

    const conf = await wallet.sendTransaction(tx, connection, {
      skipPreflight: true,
    });
    await connection.confirmTransaction(conf);
    subscription.reload();
    setOpen(false);
  }, [connection, wallet, newPrice, provider, subscription, token, setOpen]);

  return (
    <Dialog.Root open={open}>
      <Dialog.Content style={{ maxWidth: 450 }}>
        <Dialog.Title>Buy token</Dialog.Title>
        <Dialog.Description size="2" mb="4">
          Buying the token will debit your account of{" "}
          {numeral(subscription?.tokenState?.currentSellingPrice)
            .divide(10 ** (token?.decimals || 0))
            .format("0.0a")}{" "}
          ${token?.symbol || "???"}.
        </Dialog.Description>
        <Flex direction="column" gap="3">
          <label>
            <Text as="div" size="2" mb="1" weight="bold">
              New sell price
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
              Cancel
            </Button>
          </Dialog.Close>
          <Dialog.Close>
            <Button color="green" onClick={handleBuy} disabled={newPrice === 0}>
              Buy
            </Button>
          </Dialog.Close>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}