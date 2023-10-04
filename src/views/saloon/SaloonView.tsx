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
  Separator,
} from "@radix-ui/themes";
import React, { useMemo } from "react";
import Link from "next/link";
import { useCurrentUser } from "../../contexts/UserContextProvider";
import CreateSubscription from "./CreateSubscription";
import useSaloon from "../../hooks/useSaloon";
import { SubscriptionsList } from "./SubscriptionsList";
import { shortKey } from "../../utils";
import { Fetchable, Saloon } from "../../models/types";
import Image from "next/image";
import { PencilIcon } from "@heroicons/react/24/outline";
import UserBadge from "../../components/UserBadge";

const SaloonView: React.FC<{ saloon: Fetchable<Saloon> }> = ({ saloon }) => {
  const { user } = useCurrentUser();

  return (
    <Flex gap={"3"} direction={"column"}>
      <Container>
        <Flex align="center" className="justify-around grid grid-cols-4">
          <Image
            src={saloon.metadata?.image}
            width={250}
            height={250}
            alt="Saloon's picture"
            className="w-56 h-56 object-center object-cover rounded-xl"
          />
          {/* <Avatar src={saloon.metadata?.image} fallback="?" size="9" /> */}
          <Flex direction="column" className="col-span-3 gap-1">
            <Heading>
              {saloon.metadata?.name || shortKey(saloon.collectionMint)}
            </Heading>
            <hr />
            {saloon.metadata?.description ? (
              <Text>{saloon.metadata.description}</Text>
            ) : null}
            <Flex gap="1" align="center">
              <Text>creator: </Text>
              <UserBadge user={saloon?.owner} />
            </Flex>
            <Button variant="ghost" color="gray" className="w-40">
              <Flex gap="2">
                <PencilIcon width="16" />
                edit saloon&apos;s info
              </Flex>
            </Button>
          </Flex>
        </Flex>
      </Container>
      {saloon &&
      user?.publicKey &&
      saloon.owner?.publicKey === user.publicKey ? (
        <CreateSubscription saloon={saloon} />
      ) : null}
      <SubscriptionsList saloon={saloon} />
    </Flex>
  );
};

export default SaloonView;
