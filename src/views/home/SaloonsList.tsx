import { Button, Card, Flex, IconButton, Table, Text } from "@radix-ui/themes";
import { EnterIcon, ExternalLinkIcon } from "@radix-ui/react-icons";
import Link from "next/link";
import numeral from "numeral";
import { Saloon } from "../../models/types";
import { shortKey } from "../../utils";
import { getExplorerUrl } from "../../utils/explorer";
import Image from "next/image";

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
                  <Image
                    src={s.metadata.image}
                    width="32"
                    height="32"
                    alt={s.metadata.name}
                  />
                  <Text weight={"bold"}>{s.metadata.name}</Text>
                </Flex>
              </Table.RowHeaderCell>
              <Table.Cell>
                <Flex gap="2" align="center">
                  <Text>{shortKey(s.owner.publicKey)}</Text>
                  <Link href={getExplorerUrl(s.owner.publicKey)}>
                    <IconButton variant="ghost">
                      <ExternalLinkIcon />
                    </IconButton>
                  </Link>
                </Flex>
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
