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
  Avatar,
} from "@radix-ui/themes";
import React, { useMemo } from "react";
import Link from "next/link";
import { useCurrentUser } from "../../contexts/UserContextProvider";
import CreateSubscription from "./CreateSubscription";
import useSaloon, { Fetchable } from "../../hooks/useSaloon";
import { SubscriptionsList } from "./SubscriptionsList";
import { shortKey } from "../../utils";
import Image from "next/image";
import { Saloon } from "../../models/types";

const SaloonView: React.FC<{ saloon: Fetchable<Saloon> }> = ({ saloon }) => {
  const { user } = useCurrentUser();

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
                  <Link href={`/saloon/${saloon.collectionMint}/edit`}>
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
            <Flex align="center" justify="center" direction="column">
              <Avatar src={saloon.metadata?.image} fallback="?" size="9" />
              <Heading align="center">
                {saloon.metadata?.name || shortKey(saloon.collectionMint)}
              </Heading>
              {saloon.metadata?.description ? (
                <Text>{saloon.metadata.description}</Text>
              ) : null}
            </Flex>
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
