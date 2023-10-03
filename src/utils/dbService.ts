import { NextApiRequest, NextApiResponse } from "next";
import { sql } from "@vercel/postgres";
import jwt from "jsonwebtoken";
import { AccountInfo, Connection, PublicKey } from "@solana/web3.js";
import {
  BidState,
  CollectionConfig,
  TokenState,
  getConfigKey,
  getTokenStateKey,
} from "@koch-labs/rent-nft";
import { TOKEN_2022_PROGRAM_ID, getAccount } from "@solana/spl-token";
import { Saloon, Subscription } from "../models/types";

export async function getSaloonByCollectionMint({
  collectionMint,
}: {
  collectionMint: string;
}) {
  const saloonQuery = await sql`
      SELECT * FROM
      users AS u
      JOIN saloons AS s ON s.owner = u.publicKey
      JOIN saloonMetadata AS m ON m.collectionMint = s.collectionMint
      WHERE s.collectionMint = ${collectionMint}`;

  const connection = new Connection(
    (process.env.SOLANA_NETWORK === "devnet"
      ? process.env.HELIUS_RPC_DEVNET
      : process.env.HELIUS_RPC_MAINNET) +
      "?api-key=" +
      process.env.HELIUS_KEY
  );
  const accounts = await connection.getMultipleAccountsInfo([
    getConfigKey(new PublicKey(collectionMint)),
  ]);
  const [configAccount] = accounts;
  const config = CollectionConfig.decode(configAccount.data).toJSON();

  // Check if the querier owns any subscriptions
  const rawSaloon = saloonQuery.rows[0];
  const saloon: Saloon = {
    owner: {
      publicKey: rawSaloon.publickey,
      username: rawSaloon.username,
      lastLogin: rawSaloon.lastlogin,
    },
    collectionMint: rawSaloon.collectionmint,
    taxMint: rawSaloon.taxmint,
    authoritiesGroup: rawSaloon.authoritiesgroup,
    config,
    metadata: rawSaloon.metadata,
  };

  return saloon;
}

export async function getSubscriptionsByCollectionMint({
  collectionMint,
  limit = 10,
  page = 0,
}: {
  collectionMint: string;
  limit: number;
  page: number;
}) {
  const subscriptionsQuery = await sql`
  SELECT * FROM saloons AS sa JOIN subscriptions AS su ON sa.collectionMint = su.collectionMint
  WHERE sa.collectionMint = ${collectionMint}
  LIMIT ${limit} OFFSET ${limit * page};
  `;

  // Fetch token states for each subscription
  const connection = new Connection(
    (process.env.SOLANA_NETWORK === "devnet"
      ? process.env.HELIUS_RPC_DEVNET
      : process.env.HELIUS_RPC_MAINNET) +
      "?api-key=" +
      process.env.HELIUS_KEY
  );
  const accounts = await connection.getMultipleAccountsInfo([
    ...subscriptionsQuery.rows.map((r) =>
      getTokenStateKey(
        new PublicKey(collectionMint),
        new PublicKey(r.tokenmint)
      )
    ),
  ]);
  const [...subsAccounts] = accounts;
  const tokenStates = subsAccounts
    .filter(Boolean)
    .map((a) => TokenState.decode(a.data).toJSON());

  const subscriptions: Subscription[] = await Promise.all(
    subscriptionsQuery.rows.map(async (r) => {
      const largestOwners = await connection.getTokenLargestAccounts(
        new PublicKey(r.tokenmint)
      );
      const currentOwner = (
        await getAccount(
          connection,
          largestOwners.value[0].address,
          undefined,
          TOKEN_2022_PROGRAM_ID
        )
      ).owner.toString();

      const ownerQuery = await sql`
      SELECT * FROM users WHERE users.publicKey = ${currentOwner.toString()}
      `;

      return {
        id: r.id,
        tokenMint: r.tokenmint,
        lastPost: r.lastpost,
        tokenState: tokenStates.find((s) => s.tokenMint === r.tokenmint),
        currentOwner: {
          publicKey: ownerQuery.rows[0]?.publickey,
          username: ownerQuery.rows[0]?.username,
          lastLogin: ownerQuery.rows[0]?.lastlogin,
        },
      };
    })
  );

  return subscriptions;
}
export async function getSaloons({
  limit = 10,
  page = 0,
}: {
  collectionMint: string;
  limit: number;
  page: number;
}) {
  const query = await sql`
    SELECT * FROM 
    saloons
    JOIN users on users.publicKey = saloons.owner
    JOIN saloonMetadata as m ON m.collectionMint = saloons.collectionMint
    LIMIT ${limit} OFFSET ${limit * page}`;
  const connection = new Connection(
    (process.env.SOLANA_NETWORK === "devnet"
      ? process.env.HELIUS_RPC_DEVNET
      : process.env.HELIUS_RPC_MAINNET) +
      "?api-key=" +
      process.env.HELIUS_KEY
  );
  const configs = await connection.getMultipleAccountsInfo(
    query.rows.map((r) => getConfigKey(new PublicKey(r.collectionmint)))
  );
  const configDict = Object.fromEntries(
    configs.map((c) => {
      const decoded = CollectionConfig.decode(c.data).toJSON();
      return [decoded.collectionMint, decoded];
    })
  );
  const saloons: Saloon[] = query.rows.map((s) => ({
    id: s.id,
    collectionMint: s.collectionmint,
    owner: {
      publicKey: s.publickey,
      username: s.username,
      lastLogin: s.lastlogin,
    },
    taxMint: s.taxmint,
    authoritiesGroup: s.authoritiesgroup,
    config: configDict[s.collectionmint],
    metadata: s.metadata,
  }));

  return saloons;
}
