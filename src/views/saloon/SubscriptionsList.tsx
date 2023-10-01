import {
  Button,
  Card,
  Table,
  Badge,
  Text,
  Flex,
  Heading,
  Box,
} from "@radix-ui/themes";
import { EnterIcon } from "@radix-ui/react-icons";
import numeral from "numeral";
import Link from "next/link";
import { Saloon } from "../../models/types";
import { shortKey } from "../../utils";
import { useWallet } from "@solana/wallet-adapter-react";
import { tokens } from "../../utils/tokens";
import {
  MagnifyingGlassCircleIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";

export const SubscriptionsList = ({ saloon }: { saloon: Saloon }) => {
  const wallet = useWallet();
  const token = tokens.find((t) => t.publicKey.toString() === saloon.taxMint);

  return (
    <Box>
      <Heading align="center" size="5">
        Subscriptions
      </Heading>
      <Table.Root className="bg-brand-gray-2">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeaderCell>Mint</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Current price</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Last post</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell></Table.ColumnHeaderCell>
          </Table.Row>
        </Table.Header>

        <Table.Body className="align-middle bg-brand-gray">
          {saloon?.subscriptions
            ?.sort((a, b) =>
              a.tokenState?.currentSellingPrice >
              b.tokenState?.currentSellingPrice
                ? -1
                : 1
            )
            .map((s) => (
              <Table.Row key={s?.tokenMint}>
                <Table.RowHeaderCell>
                  <Flex gap={"2"}>
                    {s.currentOwner.publicKey ===
                    wallet.publicKey?.toString() ? (
                      <Badge color="blue">Yours</Badge>
                    ) : s.tokenState?.ownerBidState === null ? (
                      <Badge color="green">Claimable</Badge>
                    ) : null}
                    <Text>{shortKey(s.tokenMint)}</Text>
                  </Flex>
                </Table.RowHeaderCell>
                <Table.Cell>
                  {numeral(s.tokenState?.currentSellingPrice || "0")
                    .divide(10 ** (token.decimals || 0))
                    .format("0.0a")}
                </Table.Cell>
                <Table.Cell>
                  {new Date(s.lastPost).valueOf() === -3600000
                    ? "never"
                    : new Date(s.lastPost).toLocaleDateString()}
                </Table.Cell>
                <Table.Cell>
                  <Link href={`/subscription/${s.tokenMint}`}>
                    <Button variant="soft">
                      <MagnifyingGlassIcon width={16} />
                    </Button>
                  </Link>
                </Table.Cell>
              </Table.Row>
            ))}
        </Table.Body>
      </Table.Root>
    </Box>
  );
};
