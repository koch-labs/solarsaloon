import {
  Avatar,
  Box,
  Button,
  Card,
  Flex,
  Heading,
  Table,
  Text,
} from "@radix-ui/themes";
import { EnterIcon } from "@radix-ui/react-icons";
import Link from "next/link";
import numeral from "numeral";
import { Fetchable, Saloon } from "../../models/types";
import UserBadge from "../../components/UserBadge";
import { formatTime } from "../../utils";
import TagsPicker from "../../components/TagsPicker";
import InfiniteScroll from "react-infinite-scroller";
import React, { Fragment, HTMLProps, ReactNode, forwardRef } from "react";
import useSaloons from "../../hooks/useSaloons";

interface ForwardRefWrapperProps extends HTMLProps<HTMLDivElement> {
  children: ReactNode;
}

const ForwardRefWrapper = forwardRef<HTMLDivElement, ForwardRefWrapperProps>(
  ({ children, ...props }, ref) => {
    return (
      <div {...props} ref={ref}>
        {children}
      </div>
    );
  }
);
ForwardRefWrapper.displayName = "ForwardRefWrapper";

export const SaloonsList = ({ saloons }: { saloons?: Fetchable<Saloon[]> }) => {
  return (
    <Flex direction="column">
      <InfiniteScroll
        page={0}
        loadMore={saloons?.fetchMore}
        hasMore={saloons?.hasMore}
        loading={<Heading>Fetching more</Heading>}
      >
        <Table.Root>
          <Table.Header className="bg-brand-gray-2 w-100">
            <Table.Row className="pl-2">
              <Table.ColumnHeaderCell>Name</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Creator</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell className="hidden sm:table-cell">
                Subscriptions
              </Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell className="hidden sm:table-cell">
                Post period
              </Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body className="align-middle">
            {saloons?.data.map((s, i) => (
              <Table.Row
                key={s.collectionMint}
                className="bg-brand-gray w-full"
              >
                <Table.RowHeaderCell>
                  <Flex gap="2" align="center" className="pl-2">
                    <Avatar src={s.metadata.image} fallback="?" />
                    <Flex direction="column" gap="1">
                      <Text weight={"bold"}>{s.metadata.name}</Text>
                      <TagsPicker tags={s?.tags || []} />
                    </Flex>
                  </Flex>
                </Table.RowHeaderCell>
                <Table.Cell>
                  <UserBadge user={s.owner} />
                </Table.Cell>
                <Table.Cell className="hidden sm:table-cell">
                  {s?.nSubscriptions || 0}
                </Table.Cell>
                <Table.Cell className="hidden sm:table-cell">
                  every {formatTime(s.postCooldown)}
                </Table.Cell>
                <Table.Cell>
                  <Link href={`/saloon/${s.collectionMint}`}>
                    <Button variant="soft" size="1">
                      <EnterIcon /> enter
                    </Button>
                  </Link>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </InfiniteScroll>
    </Flex>
  );
};
