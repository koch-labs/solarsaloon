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
import InfiniteScroll from "react-infinite-scroller";
import numeral from "numeral";
import Link from "next/link";
import { Fetchable, Saloon, Subscription } from "../../models/types";
import { formatTime, shortKey } from "../../utils";
import { useWallet } from "@solana/wallet-adapter-react";
import { tokens } from "../../utils/tokens";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

export const SubscriptionsList = ({
  saloon,
  subscriptions,
}: {
  saloon: Saloon;
  subscriptions: Fetchable<Subscription[]>;
}) => {
  const wallet = useWallet();
  const token = tokens.find((t) => t.publicKey.toString() === saloon.taxMint);

  return (
    <Box>
      <Heading align="center" size="5">
        Subscriptions
      </Heading>
      <InfiniteScroll
        page={0}
        loadMore={subscriptions?.fetchMore}
        hasMore={subscriptions?.hasMore}
        loading={<Heading>Fetching more</Heading>}
      >
        <Table.Root className="bg-brand-gray-2">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeaderCell>Name</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Current price</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Last post</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell></Table.ColumnHeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body className="align-middle bg-brand-gray">
            {subscriptions?.data?.map((s) => (
              <Table.Row key={s?.tokenMint}>
                <Table.RowHeaderCell>
                  <Flex gap={"2"}>
                    {s.currentOwner.publicKey ===
                    wallet.publicKey?.toString() ? (
                      <Badge color="blue">Yours</Badge>
                    ) : s.tokenState?.ownerBidState === null ? (
                      <Badge color="green">Claimable</Badge>
                    ) : null}
                    <Text>
                      {s?.metadata ? s.metadata.name : shortKey(s.tokenMint)}
                    </Text>
                  </Flex>
                </Table.RowHeaderCell>
                <Table.Cell>
                  {numeral(s.tokenState?.currentSellingPrice || "0")
                    .divide(10 ** (token.decimals || 0))
                    .format("0.0a")}{" "}
                  ${token?.symbol}
                </Table.Cell>
                <Table.Cell>
                  {new Date(s.lastPost).valueOf() <= 0 ? (
                    "never"
                  ) : (
                    <Text>
                      {formatTime(
                        Date.now() -
                          new Date(s.lastPost).valueOf() -
                          new Date().getTimezoneOffset() * 60000
                      )}{" "}
                      ago
                    </Text>
                  )}
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
      </InfiniteScroll>
    </Box>
  );
};
