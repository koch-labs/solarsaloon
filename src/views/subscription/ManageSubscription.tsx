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
import useCurrentFees from "../../hooks/useCurrentFees";

export default function ManageSubscription({
  subscription,
}: {
  subscription?: Fetchable<FullSubscription>;
}) {
  const { user } = useCurrentUser();

  return (
    <Flex gap="2" direction="column">
      <Container>
        <SubscriptionHeader subscription={subscription} />
      </Container>
      <Flex gap={"3"} direction={"column"} mt="5">
        <Heading align="center">
          {subscription?.saloon?.metadata?.name}&apos;s feed
        </Heading>
        {user?.publicKey &&
        ((subscription.subscription?.currentOwner &&
          subscription.subscription.currentOwner.publicKey ===
            user.publicKey) ||
          (subscription.saloon?.owner?.publicKey &&
            subscription.saloon.owner.publicKey === user.publicKey)) ? (
          <CreatePostCard subscription={subscription} />
        ) : null}
        {subscription?.posts && subscription.posts.length > 0 ? (
          <PostsList subscription={subscription} />
        ) : null}
      </Flex>
    </Flex>
  );
}
