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
import { shortKey } from "../../utils";
import { AnchorProvider, BN } from "@coral-xyz/anchor";
import { getExplorerUrl } from "../../utils/explorer";
import { useCallback, useMemo, useState } from "react";
import { tokens } from "../../utils/tokens";
import BuyTokenModal from "./BuyTokenModal";
import { useUser } from "../../contexts/UserContextProvider";
import Link from "next/link";
import { Fetchable } from "../../hooks/useSaloon";
import { PublicKey, Transaction } from "@solana/web3.js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { builders } from "@koch-labs/rent-nft";

export default function SubscriptionDescriptionCard({
  subscription,
}: {
  subscription: Fetchable<FullSubscription>;
}) {
  const { user } = useUser();
  const token = tokens.find(
    (t) => t.publicKey.toString() === subscription?.saloon?.taxMint
  );
  const wallet = useWallet();
  const { connection } = useConnection();
  const provider = useMemo(
    () =>
      wallet ? new AnchorProvider(connection, wallet as any, {}) : undefined,
    [wallet, connection]
  );
  const [openBuy, setOpenBuy] = useState(false);

  const handleUpdate = useCallback(async () => {
    if (!wallet.sendTransaction) return;

    const tx = new Transaction(await connection.getLatestBlockhash());
    tx.add(
      await builders
        .updateBid({
          provider,
          collectionMint: new PublicKey(subscription.saloon.collectionMint),
          tokenMint: new PublicKey(subscription.subscription.tokenMint),
        })
        .builder.transaction()
    );
    if (
      subscription.subscription?.currentOwner !== wallet?.publicKey?.toString()
    ) {
      tx.add(
        await builders
          .updateBid({
            provider,
            bidder: new PublicKey(subscription.subscription?.currentOwner),
            collectionMint: new PublicKey(subscription.saloon.collectionMint),
            tokenMint: new PublicKey(subscription.subscription.tokenMint),
          })
          .builder.transaction()
      );
    }

    await wallet.sendTransaction(tx, connection, { skipPreflight: true });
  }, [connection, subscription, provider, wallet]);

  return (
    <Card>
      <Flex direction="column">
        <Heading size={"3"}>Subscription</Heading>
        <Text>Last post: {subscription.subscription?.lastPost || "Never"}</Text>
        <Text>
          Tax rate:{" "}
          {numeral(subscription.saloon?.config.taxRate || "0")
            .divide(100)
            .format("0a%")}{" "}
          per year
        </Text>
        <Text>
          Collected tax:{" "}
          {numeral(subscription.saloon?.config.collectedTax || "0")
            .divide(10 ** (token?.decimals || 0))
            .format("0.00a")}{" "}
          {token?.symbol}
        </Text>
        <Text>
          Total amount deposited:{" "}
          {numeral(subscription.tokenState?.deposited || "0")
            .divide(10 ** (token?.decimals || 0))
            .format("0.00a")}{" "}
          {token?.symbol}
        </Text>
        <Text>
          Current selling price:{" "}
          {numeral(
            subscription.tokenState?.ownerBidState
              ? subscription.tokenState?.currentSellingPrice || "0"
              : "0"
          )
            .divide(10 ** (token?.decimals || 0))
            .format("0.0a")}{" "}
          {token?.symbol}
        </Text>
        <Text>
          Owner:{" "}
          {subscription.subscription?.currentOwner === user?.publicKey ? (
            <Link
              href={getExplorerUrl(subscription.subscription?.currentOwner)}
            >
              <Badge color="blue">You</Badge>
            </Link>
          ) : (
            shortKey(subscription.tokenState?.ownerBidState)
          )}
        </Text>
        <Text>
          Subscription mint:{" "}
          {subscription.tokenState?.tokenMint
            ? shortKey(subscription.tokenState.tokenMint)
            : null}
        </Text>
        <Flex className="justify-around">
          <Button onClick={handleUpdate} className="w-36">
            Update bids
          </Button>
          {user &&
          subscription.subscription?.currentOwner !== user.publicKey ? (
            <Button
              color="green"
              className="w-36"
              disabled={(new BN(subscription.bidState?.amount) || new BN(0)).lt(
                new BN(
                  subscription.tokenState?.ownerBidState
                    ? subscription.tokenState?.currentSellingPrice
                    : "0"
                )
              )}
              onClick={() => setOpenBuy(true)}
            >
              Buy
            </Button>
          ) : null}
        </Flex>
        <BuyTokenModal
          open={openBuy}
          setOpen={setOpenBuy}
          subscription={subscription}
        />
      </Flex>
    </Card>
  );
}
