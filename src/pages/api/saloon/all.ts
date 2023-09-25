import { NextApiRequest, NextApiResponse } from "next";
import { sql } from "@vercel/postgres";
import { Saloon } from "../../../models/types";
import { Connection, PublicKey } from "@solana/web3.js";
import { CollectionConfig, getConfigKey } from "@koch-labs/rent-nft";

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse
) {
  try {
    const { limit, page } = Object.assign(
      { limit: 20, page: 0 },
      request.query
    );
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
        id: s.ownerid,
        lastLogin: s.lastlogin,
        publicKey: s.publickey,
      },
      taxMint: s.taxmint,
      authoritiesGroup: s.authoritiesgroup,
      config: configDict[s.collectionmint],
      metadata: s.metadata,
    }));
    return response.status(200).json({
      saloons,
    });
  } catch (error) {
    console.log(error);
    return response.status(500).json({ error });
  }
}
