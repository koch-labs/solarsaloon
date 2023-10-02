import numeral from "numeral";
import useSubscription from "../../hooks/useSubscription";
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
import { formatTime, shortKey } from "../../utils";
import { AnchorProvider, BN } from "@coral-xyz/anchor";
import { getExplorerUrl } from "../../utils/explorer";
import { useCallback, useEffect, useMemo, useState } from "react";
import { tokens } from "../../utils/tokens";
import BuyTokenModal from "./BuyTokenModal";
import { useCurrentUser } from "../../contexts/UserContextProvider";
import Link from "next/link";
import { PublicKey, Transaction } from "@solana/web3.js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { builders } from "@koch-labs/rent-nft";
import SetSellingPriceModal from "./SetSellingPriceModal";
import ClaimFeesButton from "./ClaimFeesButton";
import UserBadge from "../../components/UserBadge";
import { Fetchable, FullSubscription } from "../../models/types";
import { PencilIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import { format } from "path";
import useCurrentFees from "../../hooks/useCurrentFees";
import DepositFundsModal from "./DepositFundsModal";
import WithdrawFundsModal from "./WithdrawFundsModal";

export default function SubscriptionHeader({
  subscription,
}: {
  subscription: Fetchable<FullSubscription>;
}) {
  const { user } = useCurrentUser();
  const token = tokens.find(
    (t) => t.publicKey.toString() === subscription?.saloon?.taxMint
  );
  const [openBuy, setOpenBuy] = useState(false);
  const [openPrice, setOpenPrice] = useState(false);
  const [openDeposit, setOpenDeposit] = useState(false);
  const [openWithdraw, setOpenWithdraw] = useState(false);
  const { timeLeft } = useCurrentFees({
    subscription,
    token,
    increasing: false,
  });

  return (
    <Flex align="center" className="justify-around grid grid-cols-4" m="5">
      <Image
        src={subscription?.saloon?.metadata?.image}
        width={250}
        height={250}
        alt="Saloon's picture"
        className="w-56 h-56 object-center object-cover rounded-xl"
      />
      {/* <Avatar src={saloon.metadata?.image} fallback="?" size="9" /> */}
      <Flex direction="column" className="grid grid-cols-3 col-span-3 gap-1">
        <Flex direction="column" className="col-span-2" gap="1">
          <Heading>
            {subscription?.saloon?.metadata?.name ||
              shortKey(subscription?.saloon?.collectionMint)}
          </Heading>
          <hr className="w-48" />
          {subscription?.saloon?.metadata?.description ? (
            <Text>{subscription?.saloon?.metadata.description}</Text>
          ) : null}
          <Flex gap="2" align="center">
            <Text>creator:</Text>
            <UserBadge user={subscription?.saloon?.owner} />
          </Flex>
          <Flex gap="2" align="center">
            <Text>owner:</Text>
            <UserBadge user={subscription?.subscription?.currentOwner} />
          </Flex>
          <Flex>current owner has {formatTime(timeLeft)}</Flex>
          {subscription?.saloon?.owner?.publicKey === user?.publicKey ? (
            <Button variant="ghost" color="gray" className="w-44 m-1">
              <Flex gap="2">
                <PencilIcon width="16" />
                edit subscription&apos;s info
              </Flex>
            </Button>
          ) : null}
        </Flex>
        <Flex gap="2" direction="column">
          {user &&
          (subscription.subscription?.currentOwner?.publicKey !==
            user?.publicKey ||
            subscription?.ownerBidState?.bidder !== user?.publicKey) ? (
            <Button onClick={() => setOpenBuy(true)}>
              buy this subscription (
              {numeral(subscription?.ownerBidState?.sellingPrice)
                .divide(10 ** (token?.decimals || 0))
                .format("0.00a")}{" "}
              ${token?.symbol})
            </Button>
          ) : null}
          {user && subscription?.ownerBidState?.bidder === user?.publicKey ? (
            <>
              <Button onClick={() => setOpenPrice(true)}>
                update selling price
              </Button>
              <Button
                style={{ backgroundColor: "white", color: "black" }}
                onClick={() => setOpenDeposit(true)}
                className="border border-solid"
              >
                deposit more
              </Button>
              <Button
                style={{ backgroundColor: "black" }}
                onClick={() => setOpenWithdraw(true)}
              >
                withdraw funds (up to{" "}
                {numeral(subscription?.ownerBidState?.amount)
                  .divide(10 ** (token?.decimals || 0))
                  .format("0.0a")}{" "}
                ${token?.symbol})
              </Button>
              <DepositFundsModal
                setOpen={setOpenDeposit}
                open={openDeposit}
                subscription={subscription}
              />
              <WithdrawFundsModal
                setOpen={setOpenWithdraw}
                open={openWithdraw}
                subscription={subscription}
              />
            </>
          ) : null}
          {user && subscription.saloon?.owner.publicKey === user?.publicKey ? (
            <ClaimFeesButton subscription={subscription} />
          ) : null}
        </Flex>
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
  );
}
