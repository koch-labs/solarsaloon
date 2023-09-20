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
import { BN } from "@coral-xyz/anchor";
import { getExplorerUrl } from "../../utils/explorer";
import { useWallet } from "@solana/wallet-adapter-react";
import DepositFundsModal from "./DepositFundsModal";
import { useState } from "react";
import { tokens } from "../../utils/tokens";
import BuyTokenModal from "./BuyTokenModal";
import CreatePostCard from "./CreatePostCard";
import { PostsList } from "./PostsList";
import { useUser } from "../../contexts/UserContextProvider";

export default function ManageSubscription({ mint }: { mint: string }) {
  const { user } = useUser();
  const subscription = useSubscription(mint as string);
  const token = tokens.find(
    (t) => t.publicKey.toString() === subscription?.saloon?.taxMint
  );
  const [openBuy, setOpenBuy] = useState(false);
  const [openOwnerDeposit, setOpenOwnerDeposit] = useState(false);
  const [openSelfDeposit, setOpenSelfDeposit] = useState(false);

  return (
    <Container className="content-center">
      <Flex gap="2" direction="column">
        <Card className="flex flex-col gap-4 items-stretch">
          <Flex gap={"3"} direction={"column"}>
            <Flex align="start" justify="between">
              <Link href={`/saloon/${subscription.saloon?.collectionMint}`}>
                <IconButton variant="ghost">
                  <ArrowLeftIcon width={32} height={32} strokeWidth={5} />
                </IconButton>
              </Link>
              <Heading align="center">Subscription {shortKey(mint)}</Heading>
              <Popover.Root>
                <Popover.Trigger>
                  <IconButton variant="ghost">
                    <QuestionMarkCircledIcon
                      width={32}
                      height={32}
                      strokeWidth={5}
                    />
                  </IconButton>
                </Popover.Trigger>
                <Popover.Content style={{ width: 360 }}>
                  <Flex gap="3" direction="column">
                    <Text size="5">What are Saloons ?</Text>
                    <Text size="2">
                      Saloons are digital spaces that only subscribers can
                      access.
                      <br />
                      The number of of available subscriptions can be increased
                      at any time, but only a subscriber can burn a subscription
                      so be carefull before minting too many.
                    </Text>
                    <Popover.Close>
                      <Button size="1">OK</Button>
                    </Popover.Close>
                  </Flex>
                </Popover.Content>
              </Popover.Root>
            </Flex>
            <Card>
              <Flex direction="column">
                <Heading size={"3"}>Subscription</Heading>
                <Text>
                  Last post: {subscription.subscription?.lastPost || "Never"}
                </Text>
              </Flex>
            </Card>
            <Card>
              <Flex direction="column">
                <Heading size={"3"}>Token</Heading>
                <Text>
                  Total amount deposited:{" "}
                  {numeral(subscription.tokenState?.deposited || "0")
                    .divide(10 ** (token?.decimals || 0))
                    .format("0.0a")}
                </Text>
                <Text>
                  Current selling price:{" "}
                  {numeral(subscription.tokenState?.currentSellingPrice || "0")
                    .divide(10 ** (token?.decimals || 0))
                    .format("0.0a")}
                </Text>
                <Text>
                  Owner:{" "}
                  {subscription.subscription?.currentOwner ===
                  user?.publicKey ? (
                    <Link
                      href={getExplorerUrl(
                        subscription.subscription?.currentOwner
                      )}
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
                {user &&
                subscription.subscription?.currentOwner !== user.publicKey ? (
                  <Flex justify="center">
                    <Button
                      color="green"
                      disabled={(
                        new BN(subscription.bidState?.amount) || new BN(0)
                      ).lt(
                        new BN(subscription.tokenState?.currentSellingPrice)
                      )}
                      onClick={() => setOpenBuy(true)}
                    >
                      Buy
                    </Button>
                    <BuyTokenModal
                      open={openBuy}
                      setOpen={setOpenBuy}
                      subscription={subscription}
                    />
                  </Flex>
                ) : null}
              </Flex>
            </Card>
            <Flex wrap={"wrap"} className="justify-around">
              <Card>
                <Flex direction="column">
                  <Heading size={"3"}>Your bid</Heading>
                  <Text>
                    Owner:
                    <Link href={getExplorerUrl(user?.publicKey)}>
                      <Badge color="blue">You</Badge>
                    </Link>
                  </Text>
                  <Text>
                    Amount deposited:{" "}
                    {numeral(subscription.bidState?.amount || "0")
                      .divide(10 ** (token?.decimals || 0))
                      .format("0.0a")}
                  </Text>
                  <Text>
                    Last update:{" "}
                    {subscription.bidState?.lastUpdate
                      ? new Date(
                          Number(subscription.bidState.lastUpdate) * 1000
                        ).toLocaleString()
                      : "never"}
                  </Text>
                  {user ? (
                    <Flex justify="center" gap="4">
                      <Button
                        color="green"
                        onClick={() => setOpenSelfDeposit(true)}
                      >
                        Deposit funds
                      </Button>
                      <Button
                        color="crimson"
                        disabled={!subscription.bidState?.amount}
                      >
                        Withdraw funds
                      </Button>
                    </Flex>
                  ) : null}
                </Flex>
                <DepositFundsModal
                  setOpen={setOpenSelfDeposit}
                  open={openSelfDeposit}
                  subscription={subscription}
                  externalAccount={false}
                />
              </Card>
              <Card>
                <Flex direction="column">
                  <Heading size={"3"}>The owner&apos;s bid</Heading>
                  <Text>
                    Owner:
                    {subscription.ownerBidState?.bidder === user?.publicKey ? (
                      <Link href={getExplorerUrl(user?.publicKey)}>
                        <Badge color="blue">You</Badge>
                      </Link>
                    ) : (
                      <Link
                        href={getExplorerUrl(
                          subscription.ownerBidState?.bidder
                        )}
                      >
                        {shortKey(subscription.ownerBidState?.bidder)}
                      </Link>
                    )}
                  </Text>
                  <Text>
                    Amount deposited:{" "}
                    {numeral(subscription.ownerBidState?.amount || "0")
                      .divide(10 ** (token?.decimals || 0))
                      .format("0.0a")}
                  </Text>
                  <Text>
                    Last update:{" "}
                    {subscription.ownerBidState?.lastUpdate
                      ? new Date(
                          Number(subscription.ownerBidState.lastUpdate) * 1000
                        ).toLocaleString()
                      : "Never"}
                  </Text>
                  {user ? (
                    <Flex justify="center" gap="4">
                      <Button
                        color="crimson"
                        onClick={() => setOpenOwnerDeposit(true)}
                      >
                        Deposit funds
                      </Button>
                    </Flex>
                  ) : null}
                </Flex>
                <DepositFundsModal
                  setOpen={setOpenOwnerDeposit}
                  open={openOwnerDeposit}
                  subscription={subscription}
                  externalAccount
                />
              </Card>
            </Flex>
            {user?.publicKey &&
            ((subscription.subscription?.currentOwner &&
              subscription.subscription.currentOwner === user.publicKey) ||
              (subscription.saloon?.owner?.publicKey &&
                subscription.saloon.owner.publicKey === user.publicKey)) ? (
              <CreatePostCard subscription={subscription} />
            ) : null}
            {subscription?.posts && subscription.posts.length > 0 ? (
              <PostsList posts={subscription.posts} />
            ) : null}
          </Flex>
        </Card>
      </Flex>
    </Container>
  );
}
