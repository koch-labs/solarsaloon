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
import useSaloon, { Fetchable } from "../../hooks/useSaloon";
import { shortKey } from "../../utils";
import Image from "next/image";
import { Saloon } from "../../models/types";

const UserView: React.FC<{ publicKey: string }> = ({ publicKey }) => {
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
          </Flex>
        </Card>
      </Flex>
    </Container>
  );
};

export default UserView;
