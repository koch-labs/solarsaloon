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

import { User, useUser } from "../../contexts/UserContextProvider";
import Link from "next/link";
import { PublicKey } from "@solana/web3.js";
import { Saloon } from "../home";

export interface Subscription {
  id: number;
  tokenMint: PublicKey;
  saloon: Saloon;
  lastPost: Date;
}

export const SubscriptionsList = ({
  subscriptions,
}: {
  subscriptions: Subscription[];
}) => {
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
          {subscriptions.map((s) => (
            <Table.Row key={s.id}>
              <Table.RowHeaderCell>
                {s.tokenMint.toString()}
              </Table.RowHeaderCell>
              <Table.Cell>{s.lastPost.toLocaleDateString()}</Table.Cell>
              <Table.Cell>
                <Link href={`/saloon/${s.saloon.collectionMint.toString()}`}>
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
