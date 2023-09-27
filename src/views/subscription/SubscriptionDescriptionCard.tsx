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
import { useCallback, useEffect, useMemo, useState } from "react";
import { tokens } from "../../utils/tokens";
import BuyTokenModal from "./BuyTokenModal";
import { useUser } from "../../contexts/UserContextProvider";
import Link from "next/link";
import { Fetchable } from "../../hooks/useSaloon";
import { PublicKey, Transaction } from "@solana/web3.js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { builders } from "@koch-labs/rent-nft";
import SetSellingPriceModal from "./SetSellingPriceModal";

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
  const taxesPerYear = new BN(
    subscription?.tokenState?.currentSellingPrice || 0
  )
    .mul(new BN(subscription?.saloon?.config?.taxRate || 0))
    .div(new BN(10000));
  const [openBuy, setOpenBuy] = useState(false);
  const [openPrice, setOpenPrice] = useState(false);
  const [taxes, setTaxes] = useState<string>(
    numeral(subscription?.saloon?.config?.collectedTax || "0").format("0.00a")
  );

  useEffect(() => {
    const interval = setInterval(() => {
      if (!subscription?.ownerBidState) {
        setTaxes("0");
        return;
      }

      setTaxes(
        numeral(
          new BN(subscription?.saloon?.config?.collectedTax || 0)
            .add(
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
  }, [token, subscription, taxesPerYear]);

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

    const conf = await wallet.sendTransaction(tx, connection, {
      skipPreflight: true,
    });
    await connection.confirmTransaction(conf);
    subscription.reload();
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
          Collected tax: {taxes} {token?.symbol}{" "}
          {subscription?.ownerBidState ? (
            <Text>
              (+
              {numeral(taxesPerYear.div(new BN(365)))
                .divide(10 ** (token?.decimals || 0))
                .format("0.000a")}{" "}
              per day )
            </Text>
          ) : null}
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
          <Button onClick={handleUpdate} className="w-42">
            Update bids
          </Button>
          {user &&
          subscription.subscription?.currentOwner !== user.publicKey ? (
            <Button
              color="green"
              className="w-42"
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
          {user &&
          subscription.subscription?.currentOwner === user.publicKey ? (
            <Button className="w-42" onClick={() => setOpenPrice(true)}>
              Update selling price
            </Button>
          ) : null}
        </Flex>
        <BuyTokenModal
          open={openBuy}
          setOpen={setOpenBuy}
          subscription={subscription}
        />
        <SetSellingPriceModal
          open={openPrice}
          setOpen={setOpenPrice}
          subscription={subscription}
        />
      </Flex>
    </Card>
  );
}
