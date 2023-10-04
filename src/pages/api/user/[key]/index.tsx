import { NextApiRequest, NextApiResponse } from "next";
import { sql } from "@vercel/postgres";
import jwt from "jsonwebtoken";
import { Post, Saloon, Subscription, User } from "../../../../models/types";
import { Connection, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import {
  BidState,
  BidStateJSON,
  CollectionConfig,
  TokenState,
  getBidStateKey,
  getConfigKey,
  getTokenStateKey,
} from "@koch-labs/rent-nft";

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse
) {
  try {
    const { limit, page, key } = Object.assign(
      { limit: 20, page: 0 },
      request.query
    );

    const userQuery = await sql`
    SELECT * FROM users WHERE publicKey = ${key as string}
    ;`;

    const saloonsQuery = await sql`
    SELECT * FROM 
    users JOIN saloons ON users.publicKey = saloons.owner
    JOIN saloonMetadata ON saloons.collectionMint = saloonMetadata.collectionMint
    WHERE owner = ${key as string}
    LIMIT ${limit} OFFSET ${page}
    ;`;

    const user: User = {
      publicKey: userQuery.rows[0]?.publickey,
      username: userQuery.rows[0]?.username,
      lastLogin: userQuery.rows[0]?.lastlogin,
    };

    const connection = new Connection(
      (process.env.SOLANA_NETWORK === "devnet"
        ? process.env.HELIUS_RPC_DEVNET
        : process.env.HELIUS_RPC_MAINNET) +
        "?api-key=" +
        process.env.HELIUS_KEY
    );
    const configAccounts = await connection.getMultipleAccountsInfo(
      saloonsQuery.rows.map((r) =>
        getConfigKey(new PublicKey(r.collectionmint))
      )
    );
    const configs = Object.fromEntries(
      configAccounts.map((a) => {
        const decoded = CollectionConfig.decode(a.data).toJSON();
        return [decoded.collectionMint, decoded];
      })
    );
    const saloons: Saloon[] = saloonsQuery.rows.map((r) => {
      return {
        owner: user,
        collectionMint: r.collectionmint,
        taxMint: r.taxmint,
        authoritiesGroup: r.authoritiesgroup,
        config: configs[r.collectionmint],
        postCooldown: r.postcooldown,
        metadata: r.metadata,
      };
    });

    return response.status(200).json({
      user,
      saloons,
    });
  } catch (error) {
    console.log(error);
    return response.status(500).json({ error });
  }
}
