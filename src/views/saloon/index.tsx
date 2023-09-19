import {
  ArrowLeftIcon,
  QuestionMarkCircledIcon,
  InfoCircledIcon,
} from "@radix-ui/react-icons";
import {
  Button,
  Card,
  Container,
  Flex,
  Heading,
  IconButton,
  Popover,
  Callout,
  Slider,
  Text,
  TextFieldInput,
} from "@radix-ui/themes";
import React, { useMemo } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { AnchorProvider } from "@coral-xyz/anchor";
import { useRouter } from "next/router";
import Link from "next/link";
import { useUser } from "../../contexts/UserContextProvider";
import CreateSubscription from "./CreateSubscription";
import useSaloon from "../../hooks/useSaloon";
import { SubscriptionsList } from "./SubscriptionsList";
import { shortKey } from "../../utils";

const SaloonView: React.FC = () => {
  const router = useRouter();
  const wallet = useWallet();
  const { user } = useUser();
  const saloonMint = router.query.mint as string;
  const saloon = useSaloon(saloonMint);

  return (
    <Container className="content-center">
      <Flex gap="2" direction="column">
        <Flex align="start" justify="between">
          <Link href="/saloons">
            <IconButton variant="ghost">
              <ArrowLeftIcon width={32} height={32} strokeWidth={5} />
            </IconButton>
          </Link>
          <Card className="flex flex-col gap-4 items-stretch">
            <Flex gap={"3"} direction={"column"}>
              <Heading align="center">
                Saloon {shortKey(router.query.mint as string)}
              </Heading>
              {saloon &&
              wallet?.publicKey &&
              user?.publicKey &&
              wallet.publicKey.toString() === user.publicKey.toString() ? (
                <CreateSubscription saloon={saloon} />
              ) : null}
              <SubscriptionsList saloon={saloon} />
            </Flex>
          </Card>
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
                  Saloons are digital spaces that only subscribers can access.
                  <br />
                  The number of of available subscriptions can be increased at
                  any time, but only a subscriber can burn a subscription so be
                  carefull before minting too many.
                </Text>
                <Popover.Close>
                  <Button size="1">OK</Button>
                </Popover.Close>
              </Flex>
            </Popover.Content>
          </Popover.Root>
        </Flex>
      </Flex>
    </Container>
  );
};

export default SaloonView;
