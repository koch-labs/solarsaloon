// Next, React
import { FC, useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  Container,
  Flex,
  Heading,
  Table,
  Text,
} from "@radix-ui/themes";
import { EnterIcon } from "@radix-ui/react-icons";
import Link from "next/link";
import { PublicKey } from "@solana/web3.js";
import { Saloon, User } from "../../models/types";

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

export const SaloonsList = ({ saloons }: { saloons: Saloon[] }) => {
  return (
    <Card>
      <Table.Root>
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeaderCell>Name</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Owner</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell></Table.ColumnHeaderCell>
          </Table.Row>
        </Table.Header>

        <Table.Body className="align-middle">
          {saloons.map((s) => (
            <Table.Row key={s.id}>
              <Table.RowHeaderCell>
                {s.collectionMint.toString()}
              </Table.RowHeaderCell>
              <Table.Cell>{s.owner.publicKey.toString()}</Table.Cell>
              <Table.Cell>
                <Link href={`/saloon/${s.collectionMint.toString()}`}>
                  <Button variant="soft">
                    <EnterIcon />
                  </Button>
                </Link>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </Card>
  );
};

export const HomeView: FC = ({}) => {
  const [saloons, setSaloons] = useState<Saloon[]>([]);

  useEffect(() => {
    async function fetchSaloons() {
      const { saloons } = await (await fetch("/api/saloon/all")).json();
      setSaloons(
        saloons.map((s) => ({
          id: s.id,
          collectionMint: new PublicKey(s.collectionmint),
          owner: {
            id: s.ownerid,
            lastLogin: s.lastlogin,
            publicKey: new PublicKey(s.publickey),
          },
        }))
      );
    }

    fetchSaloons();
  }, []);

  return (
    <Box className="flex flex-col gap-3">
      <CreateSaloonCard />
      <SaloonsList saloons={saloons} />
    </Box>
  );
};
