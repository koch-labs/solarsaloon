import { NextApiRequest, NextApiResponse } from "next";
import { sql } from "@vercel/postgres";
import jwt from "jsonwebtoken";
import { Saloon, Subscription, User } from "../../../../models/types";
import { Connection, PublicKey } from "@solana/web3.js";
import {
  BidState,
  CollectionConfig,
  TokenState,
  getConfigKey,
  getTokenStateKey,
} from "@koch-labs/rent-nft";
import { TOKEN_2022_PROGRAM_ID, getAccount } from "@solana/spl-token";

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse
) {
  try {
    const { mint } = request.query;
    const collectionMint = mint as string;

    const saloonQuery = await sql`
      SELECT * FROM
      users AS u
      JOIN saloons AS s ON s.owner = u.publicKey
      JOIN saloonMetadata AS m ON m.collectionMint = s.collectionMint
      WHERE s.collectionMint = ${collectionMint}`;

    if (saloonQuery.rowCount === 0) {
      return response.status(404).json({
        message: `Found no saloon that had ${collectionMint} as a collection mint`,
      });
    }

    // Fetch token states for each subscription
    const connection = new Connection(
      (process.env.SOLANA_NETWORK === "devnet"
        ? process.env.HELIUS_RPC_DEVNET
        : process.env.HELIUS_RPC_MAINNET) +
        "?api-key=" +
        process.env.HELIUS_KEY
    );
    const configAccount = await connection.getAccountInfo(
      getConfigKey(new PublicKey(mint))
    );
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
      postCooldown: rawSaloon.postcooldown,
      tags: rawSaloon.tags,
    };

    return response.status(200).json({ saloon });
  } catch (error) {
    console.log(error);
    return response.status(500).json({ error });
  }
}
