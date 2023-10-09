import numeral, { Numeral } from "numeral";
import useSubscription from "../../hooks/useSubscription";
import {
  Badge,
  Button,
  Card,
  Container,
  Flex,
  Heading,
  Text,
} from "@radix-ui/themes";
import { formatTime, shortKey } from "../../utils";
import { useState } from "react";
import { tokens } from "../../utils/tokens";
import BuyTokenModal from "./BuyTokenModal";
import { useCurrentUser } from "../../contexts/UserContextProvider";
import SetSellingPriceModal from "./SetSellingPriceModal";
import ClaimFeesButton from "./ClaimFeesButton";
import UserBadge from "../../components/UserBadge";
import { Fetchable, FullSubscription } from "../../models/types";
import { PencilIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import useFees from "../../hooks/useFees";
import DepositWidget from "./DepositWidget";

export default function SubscriptionHeader({
  subscription,
}: {
  subscription: Fetchable<FullSubscription>;
}) {
  const { user } = useCurrentUser();
  const token = tokens.find(
    (t) => t.publicKey.toString() === subscription?.data?.saloon?.taxMint
  );
  const [openBuy, setOpenBuy] = useState(false);
  const [openPrice, setOpenPrice] = useState(false);
  const { timeLeft, amount } = useFees({
    price: Number(
      numeral(subscription?.data?.tokenState?.currentSellingPrice)
        .divide(10 ** (token?.decimals || 0))
        .format("0.000")
    ),
    taxRate: Number(subscription?.data?.saloon?.config?.taxRate),
    depositAmount: Number(
      numeral(subscription?.data?.ownerBidState?.amount)
        .divide(10 ** (token?.decimals || 0))
        .format("0.000")
    ),
    lastUpdate: Number(subscription?.data?.ownerBidState?.lastUpdate),
    increaseDeposit: false,
  });

  return (
    <Flex align="center" className="justify-around grid grid-cols-4 p-5" m="5">
      <Image
        src={
          subscription?.data?.subscription?.metadata?.image ||
          subscription?.data?.saloon?.metadata?.image
        }
        width={250}
        height={250}
        alt="Saloon's picture"
        className="w-56 h-56 object-center object-cover rounded-xl"
      />
      <Flex direction="column" className="grid grid-cols-3 col-span-3 gap-1">
        <Flex direction="column" className="col-span-2" gap="1">
          <Heading>
            {subscription?.data?.subscription?.metadata?.name ||
              subscription?.data?.saloon?.metadata?.name ||
              shortKey(subscription?.data?.saloon?.collectionMint)}
          </Heading>
          <hr className="w-48" />
          {subscription?.data?.subscription?.metadata?.description ||
          subscription?.data?.saloon?.metadata?.description ? (
            <Text>
              {subscription?.data?.subscription?.metadata?.description ||
                subscription?.data?.saloon?.metadata.description}
            </Text>
          ) : null}
          <Flex gap="2" align="center">
            <Text>creator:</Text>
            <UserBadge user={subscription?.data?.saloon?.owner} />
          </Flex>
          <Flex gap="2" align="center">
            <Text>owner:</Text>
            <UserBadge user={subscription?.data?.subscription?.currentOwner} />
          </Flex>
          <Flex>current owner has {formatTime(timeLeft)} left</Flex>
          {subscription?.data?.saloon?.owner?.publicKey === user?.publicKey ? (
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
          (timeLeft === 0 ||
            subscription?.data?.subscription?.currentOwner?.publicKey !==
              user?.publicKey ||
            subscription?.data?.ownerBidState?.bidder !== user?.publicKey) ? (
            <Button onClick={() => setOpenBuy(true)}>
              buy this subscription (
              {amount <= 0
                ? numeral(subscription?.data?.saloon?.config?.minimumSellPrice)
                    .divide(10 ** (token?.decimals || 0))
                    .format("0.00a")
                : numeral(subscription?.data?.ownerBidState?.sellingPrice)
                    .divide(10 ** (token?.decimals || 0))
                    .format("0.00a")}{" "}
              ${token?.symbol})
            </Button>
          ) : null}
          {user &&
          subscription?.data?.ownerBidState?.bidder === user?.publicKey ? (
            <Button variant="soft" onClick={() => setOpenPrice(true)}>
              update selling price
            </Button>
          ) : null}
          {user && subscription?.data?.bidState?.amount !== "0" ? (
            <DepositWidget subscription={subscription} />
          ) : null}
          {user &&
          subscription?.data?.saloon?.owner.publicKey === user?.publicKey ? (
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
