import numeral from "numeral";
import useSubscription, { FullSubscription } from "../../hooks/useSubscription";
import {
  Badge,
  Button,
  Card,
  Container,
  Flex,
  Heading,
  IconButton,
  Popover,
  Text,
} from "@radix-ui/themes";
import Link from "next/link";
import { ArrowLeftIcon, QuestionMarkCircledIcon } from "@radix-ui/react-icons";
import { shortKey } from "../../utils";
import { getExplorerUrl } from "../../utils/explorer";
import DepositFundsModal from "./DepositFundsModal";
import { useCallback, useMemo, useState } from "react";
import { tokens } from "../../utils/tokens";
import CreatePostCard from "./CreatePostCard";
import { PostsList } from "./PostsList";
import { useCurrentUser } from "../../contexts/UserContextProvider";
import SubscriptionDescriptionCard from "./SubscriptionDescriptionCard";
import WithdrawFundsModal from "./WithdrawFundsModal";
import { Fetchable } from "../../hooks/useSaloon";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { builders } from "@koch-labs/rent-nft";
import { AnchorProvider } from "@coral-xyz/anchor";
import WaitingButton from "../../components/WaitingButton";
import {
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountIdempotentInstruction,
  createCloseAccountInstruction,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";

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
      }

      const conf = await wallet.sendTransaction(tx, connection, {
        skipPreflight: true,
      });
      await connection.confirmTransaction(conf);
      subscription.reload();
    } finally {
      setIsWaiting(false);
    }
  }, [subscription, connection, provider, wallet, token]);

  return (
    <WaitingButton color="green" loading={isWaiting} onClick={handleClaim}>
      Claim fees
    </WaitingButton>
  );
}
