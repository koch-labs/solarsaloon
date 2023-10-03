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
import Link from "next/link";
import { ArrowLeftIcon, QuestionMarkCircledIcon } from "@radix-ui/react-icons";
import { shortKey } from "../../utils";
import { getExplorerUrl } from "../../utils/explorer";
import DepositFundsModal from "./DepositFundsModal";
import { useEffect, useState } from "react";
import { tokens } from "../../utils/tokens";
import CreatePostCard from "./CreatePostCard";
import { PostsList } from "./PostsList";
import { useCurrentUser } from "../../contexts/UserContextProvider";
import WithdrawFundsModal from "./WithdrawFundsModal";
import UserBadge from "../../components/UserBadge";
import { BN } from "@coral-xyz/anchor";
import { Fetchable, FullSubscription } from "../../models/types";
import Image from "next/image";
import { PencilIcon } from "@heroicons/react/24/outline";
import SubscriptionHeader from "./SubscriptionHeader";

export default function ManageSubscription({
  subscription,
}: {
  subscription?: Fetchable<FullSubscription>;
}) {
  const { user } = useCurrentUser();
  const token = tokens.find(
    (t) => t.publicKey.toString() === subscription?.saloon?.taxMint
  );
  const [openOwnerDeposit, setOpenOwnerDeposit] = useState(false);
  const [openSelfDeposit, setOpenSelfDeposit] = useState(false);
  const [openSelfWithdraw, setOpenSelfWithdraw] = useState(false);
  const taxesPerYear = new BN(
    subscription?.tokenState?.currentSellingPrice || 0
  )
    .mul(new BN(subscription?.saloon?.config?.taxRate || 0))
    .div(new BN(10000));
  const [taxes, setTaxes] = useState<string>(
    numeral(subscription?.ownerBidState?.amount || "0").format("0.000a")
  );

  useEffect(() => {
    const interval = setInterval(() => {
      if (!subscription?.ownerBidState) {
        setTaxes(numeral("0").format("0.000a"));
        return;
      }

      setTaxes(
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
  }, [token, subscription, taxesPerYear]);

  return (
    <Flex gap="2" direction="column">
      <Container>
        <SubscriptionHeader subscription={subscription} />
      </Container>
      <Flex gap={"3"} direction={"column"}>
        {user?.publicKey &&
        ((subscription.subscription?.currentOwner &&
          subscription.subscription.currentOwner.publicKey ===
            user.publicKey) ||
          (subscription.saloon?.owner?.publicKey &&
            subscription.saloon.owner.publicKey === user.publicKey)) ? (
          <CreatePostCard subscription={subscription} />
        ) : null}
        {subscription?.posts && subscription.posts.length > 0 ? (
          <PostsList posts={subscription.posts} />
        ) : null}
      </Flex>
    </Flex>
  );
}
