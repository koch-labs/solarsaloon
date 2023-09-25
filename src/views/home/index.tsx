// Next, React
import { FC, useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  Container,
  Flex,
  Heading,
  Text,
} from "@radix-ui/themes";
import Link from "next/link";
import { Saloon, User } from "../../models/types";
import { SaloonsList } from "./SaloonsList";

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
  const [saloons, setSaloons] = useState<Saloon[]>([]);

  useEffect(() => {
    async function fetchSaloons() {
      const { saloons } = await (await fetch("/api/saloon/all")).json();
      setSaloons(saloons);
    }

    fetchSaloons();
  }, []);

  console.log(saloons);
  return (
    <Box className="flex flex-col gap-3">
      <CreateSaloonCard />
      <SaloonsList saloons={saloons} />
    </Box>
  );
};
