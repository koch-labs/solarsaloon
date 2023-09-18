import { Button, Card, Table, Badge, Text, Flex } from "@radix-ui/themes";
import { EnterIcon } from "@radix-ui/react-icons";

import Link from "next/link";
import { Saloon } from "../../models/types";

export const SubscriptionsList = ({ saloon }: { saloon: Saloon }) => {
  return (
    <Card>
      <Table.Root>
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeaderCell>Mint</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Last post</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell></Table.ColumnHeaderCell>
          </Table.Row>
        </Table.Header>

        <Table.Body className="align-middle">
          {saloon?.subscriptions?.map((s) => (
            <Table.Row key={s.id}>
              <Table.RowHeaderCell>
                <Flex gap={"2"}>
                  <Badge color="blue">Yours</Badge>
                  <Text>{s.tokenMint.toString()}</Text>
                </Flex>
              </Table.RowHeaderCell>
              <Table.Cell>
                {new Date(s.lastPost).valueOf() === -3600000
                  ? "never"
                  : new Date(s.lastPost).toLocaleDateString()}
              </Table.Cell>
              <Table.Cell>
                <Link href={`/subscription/${s.tokenMint}`}>
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
