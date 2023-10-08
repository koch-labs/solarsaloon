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
    const { limit, page, creator, tags } = Object.assign(
      { limit: 20, page: 0 },
      request.query
    );
    const queryString = `
    SELECT * FROM 
    saloons
    JOIN users on users.publicKey = saloons.owner
    JOIN saloonMetadata as m USING (collectionMint)
    LEFT JOIN (
        SELECT collectionMint, COUNT(*) AS nSubscriptions FROM
        subscriptions
        GROUP BY collectionMint 
    ) AS countquery USING (collectionMint)
    ${creator || tags?.length > 0 ? "WHERE " : ""}
    ${creator ? `saloons.owner = $1` : ""}
    ${
      tags?.length > 0
        ? `${creator ? "AND saloons.tags @> ($2)" : "saloons.tags @> ($1)"}`
        : ""
    }
    LIMIT ${limit} OFFSET ${limit * page}`;
    const args = [
      creator as any,
      typeof tags === "string" ? tags.split(",") : (tags as string[]),
    ].filter(Boolean);
    const query = await sql.query(queryString, args);
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
      postCooldown: s.postcooldown,
      tags: s.tags,
      metadata: s.metadata,
      nSubscriptions: s.nsubscriptions,
    }));
    return response.status(200).json({
      saloons,
    });
  } catch (error) {
    console.log(error);
    return response.status(500).json({ error });
  }
}
