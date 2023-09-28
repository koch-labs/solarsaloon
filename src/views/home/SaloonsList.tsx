import { Avatar, Button, Card, Flex, Table, Text } from "@radix-ui/themes";
import { EnterIcon } from "@radix-ui/react-icons";
import Link from "next/link";
import numeral from "numeral";
import { Saloon } from "../../models/types";
import UserBadge from "../../components/UserBadge";

export const SaloonsList = ({ saloons }: { saloons: Saloon[] }) => {
  return (
    <Card>
      <Table.Root>
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeaderCell>Name</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Owner</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Tax rate</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
          </Table.Row>
        </Table.Header>

        <Table.Body className="align-middle">
          {saloons.map((s) => (
            <Table.Row key={s.collectionMint}>
              <Table.RowHeaderCell>
                <Flex gap="2" align="center">
                  <Avatar src={s.metadata.image} fallback="?" />
                  <Text weight={"bold"}>{s.metadata.name}</Text>
                </Flex>
              </Table.RowHeaderCell>
              <Table.Cell>
                <UserBadge user={s.owner} />
              </Table.Cell>
              <Table.Cell>
                {numeral(s.config?.taxRate).divide(100).format("0.0a%")}
              </Table.Cell>
              <Table.Cell>
                <Link href={`/saloon/${s.collectionMint}`}>
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
