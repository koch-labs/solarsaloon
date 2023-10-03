import numeral from "numeral";
import { FullSubscription } from "../../models/types";
import { useCallback, useMemo, useState } from "react";
import { tokens } from "../../utils/tokens";
import { Fetchable } from "../../models/types";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { builders } from "@koch-labs/rent-nft";
import { AnchorProvider, BN } from "@coral-xyz/anchor";
import WaitingButton from "../../components/WaitingButton";
import {
  createAssociatedTokenAccountIdempotentInstruction,
  createCloseAccountInstruction,
  createTransferCheckedInstruction,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import { Flex, Text } from "@radix-ui/themes";
import { TREASURY } from "../../utils/constants";
import useFees from "../../hooks/useFees";

export default function ClaimFeesButton({
  subscription,
}: {
  subscription: Fetchable<FullSubscription>;
}) {
  const wallet = useWallet();
  const { connection } = useConnection();
  const provider = useMemo(
    () =>
      wallet ? new AnchorProvider(connection, wallet as any, {}) : undefined,
    [wallet, connection]
  );
  const token = tokens.find(
    (e) => e.publicKey.toString() === subscription?.saloon?.taxMint
  );
  const { amount } = useFees({
    price: Number(
      numeral(subscription?.ownerBidState?.sellingPrice)
        .divide(10 ** (token?.decimals || 0))
        .format("0.000")
    ),
    taxRate: Number(subscription?.saloon?.config?.taxRate),
    lastUpdate: Number(subscription?.ownerBidState?.lastUpdate),
    depositAmount: Number(subscription?.saloon?.config?.collectedTax),
    increaseDeposit: true,
  });
  const [isWaiting, setIsWaiting] = useState(false);

  const handleClaim = useCallback(async () => {
    if (!wallet.sendTransaction) return;

    setIsWaiting(true);

    try {
      const tokenAccount = getAssociatedTokenAddressSync(
        token.publicKey,
        wallet.publicKey,
        true,
        token.tokenProgram
      );

      const tx = new Transaction(await connection.getLatestBlockhash());
      tx.add(
        createAssociatedTokenAccountIdempotentInstruction(
          wallet.publicKey,
          tokenAccount,
          wallet.publicKey,
          token.publicKey,
          token.tokenProgram
        )
      );
      tx.add(
        await builders
          .updateBid({
            provider,
            bidder: new PublicKey(subscription.ownerBidState.bidder),
            collectionMint: new PublicKey(subscription.saloon.collectionMint),
            tokenMint: new PublicKey(subscription.subscription.tokenMint),
          })
          .builder.transaction()
      );
      tx.add(
        await builders
          .withdrawTax({
            provider,
            admin: wallet.publicKey,
            collectionMint: new PublicKey(subscription.saloon.collectionMint),
            taxMint: token.publicKey,
            taxTokenProgram: token.tokenProgram,
          })
          .builder.transaction()
      );

      if (subscription.saloon.taxMint === tokens[0].publicKey.toString()) {
        // Closing wsol account to recover sol
        tx.add(
          createCloseAccountInstruction(
            tokenAccount,
            wallet.publicKey,
            wallet.publicKey,
            [],
            token.tokenProgram
          )
        );
        tx.add(
          SystemProgram.transfer({
            fromPubkey: wallet.publicKey,
            toPubkey: TREASURY,
            lamports: new BN(
              Math.round((Number(amount) * 10 ** (token.decimals || 0)) / 100)
            ).toNumber(),
          })
        );
      } else {
        tx.add(
          createTransferCheckedInstruction(
            tokenAccount,
            new PublicKey(token.publicKey),
            getAssociatedTokenAddressSync(
              new PublicKey(token.publicKey),
              TREASURY,
              true,
              token.tokenProgram
            ),
            wallet.publicKey,
            new BN(
              Math.round((Number(amount) * 10 ** (token.decimals || 0)) / 100)
            ).toNumber(),
            token.decimals
          )
        );
      }

      const conf = await wallet.sendTransaction(tx, connection, {
        skipPreflight: true,
      });
      await connection.confirmTransaction(conf);
      subscription.reload();
    } finally {
      setIsWaiting(false);
    }
  }, [subscription, connection, provider, wallet, token, amount]);

  return (
    <Flex direction="row" gap="2" align="center">
      <WaitingButton color="green" loading={isWaiting} onClick={handleClaim}>
        claim fees
      </WaitingButton>
      <Flex direction="column">
        <Flex gap="1">
          <Text weight="bold" size="2">
            {numeral(amount).format("0.000a")} ${token?.symbol}
          </Text>
          <Text size="2">available</Text>
        </Flex>
        <Text size="1" color="gray">
          {numeral(amount).divide(100).format("0.000a")} ${token?.symbol} fee
        </Text>
      </Flex>
    </Flex>
  );
}
