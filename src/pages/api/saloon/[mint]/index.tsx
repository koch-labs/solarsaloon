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
    const { limit, page, mint } = Object.assign(
      { limit: 20, page: 0 },
      request.query
    );
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
      getConfigKey(new PublicKey(mint)),
      ...subscriptionsQuery.rows.map((r) =>
        getTokenStateKey(new PublicKey(mint), new PublicKey(r.tokenmint))
      ),
    ]);
    const [configAccount, ...subsAccounts] = accounts;
    const config = CollectionConfig.decode(configAccount.data).toJSON();
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
      subscriptions,
    };

    return response.status(200).json({ saloon });
  } catch (error) {
    console.log(error);
    return response.status(500).json({ error });
  }
}
