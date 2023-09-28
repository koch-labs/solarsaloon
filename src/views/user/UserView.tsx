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
import React, { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import useUser from "../../hooks/useUser";
import { shortKey } from "../../utils";
import { SaloonsList } from "../home/SaloonsList";
import { useCurrentUser } from "../../contexts/UserContextProvider";

const UserView: React.FC<{ publicKey: string }> = ({ publicKey }) => {
  const { user: currentUser, token } = useCurrentUser();
  const { user, saloons, reload } = useUser(publicKey);
  const [name, setName] = useState<string>();

  const handleSetName = useCallback(async () => {
    await fetch(`/api/user/change`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        username: name,
      }),
    });
    reload();
  }, [name, token, reload]);

  return (
    <Container className="content-center">
      <Flex gap="2" direction="column">
        <Card className="flex flex-col gap-4 items-stretch">
          <Flex
            gap={"3"}
            direction={"column"}
            width={"100%"}
            className="w-auto"
          >
            <Flex align="start" justify="between" position="absolute" gap={"3"}>
              <Link href="/users">
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
            <Flex direction="column" align="center" gap="5" className="w-full">
              <Heading>
                {user?.username ? user.username : shortKey(user?.publicKey)}
              </Heading>
              {currentUser?.publicKey === publicKey ? (
                <Card>
                  <Flex direction="column" gap="2">
                    <Text weight="bold" size="4">
                      Change your name
                    </Text>
                    <TextFieldInput
                      onChange={(e) => setName(e.target.value as string)}
                      maxLength={20}
                    />
                    <Button onClick={handleSetName}>Change</Button>
                  </Flex>
                </Card>
              ) : null}
              <Flex className="w-full" direction="column">
                {saloons ? <SaloonsList saloons={saloons} /> : null}
              </Flex>
            </Flex>
          </Flex>
        </Card>
      </Flex>
    </Container>
  );
};

export default UserView;
