// Next, React
import { FC, useEffect } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import {
  Box,
  Button,
  Card,
  Container,
  Flex,
  Heading,
  Text,
} from "@radix-ui/themes";

import { useUser } from "../../contexts/UserContextProvider";
import Link from "next/link";

const CreateSaloonCard = () => {
  return (
    <Container size={"2"}>
      <Card>
        <Flex direction="column" align="center" gap="2">
          <Heading size={"4"}>Create a saloon</Heading>
          <Text align="center">
            Your saloon is the place where people come to hear about YOU.
            <br />
            Publish exclusive content in here to attract a limited number of
            paid members.
          </Text>
          <Link href="/saloon/create">
            <Button>Create</Button>
          </Link>
        </Flex>
      </Card>
    </Container>
  );
};

export const HomeView: FC = ({}) => {
  return (
    <Box>
      <CreateSaloonCard />
    </Box>
  );
};
