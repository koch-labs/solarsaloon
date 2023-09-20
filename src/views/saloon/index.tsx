import {
  ArrowLeftIcon,
  QuestionMarkCircledIcon,
  InfoCircledIcon,
  FileTextIcon,
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
  const { user } = useUser();
  const saloonMint = router.query.mint as string;
  const saloon = useSaloon(saloonMint);

  return (
    <Container className="content-center">
      <Flex gap="2" direction="column">
        <Card className="flex flex-col gap-4 items-stretch">
          <Flex gap={"3"} direction={"column"}>
            <Flex align="start" justify="between" position="absolute" gap={"3"}>
              <Link href="/saloons">
                <IconButton variant="ghost">
                  <ArrowLeftIcon width={32} height={32} strokeWidth={5} />
                </IconButton>
              </Link>
              <Flex gap={"3"}>
                {user && user?.publicKey === saloon?.owner?.publicKey ? (
                  <Link href={`/saloon/${saloonMint}/edit`}>
                    <IconButton variant="ghost">
                      <FileTextIcon width={32} height={32} strokeWidth={5} />
                    </IconButton>
                  </Link>
                ) : null}
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
                        The number of of available subscriptions can be
                        increased at any time, but only a subscriber can burn a
                        subscription so be carefull before minting too many.
                      </Text>
                      <Popover.Close>
                        <Button size="1">OK</Button>
                      </Popover.Close>
                    </Flex>
                  </Popover.Content>
                </Popover.Root>
              </Flex>
            </Flex>
            <Heading align="center">
              Saloon {shortKey(router.query.mint as string)}
            </Heading>
            {saloon &&
            user?.publicKey &&
            saloon.owner?.publicKey === user.publicKey ? (
              <CreateSubscription saloon={saloon} />
            ) : null}
            <SubscriptionsList saloon={saloon} />
          </Flex>
        </Card>
      </Flex>
    </Container>
  );
};

export default SaloonView;
