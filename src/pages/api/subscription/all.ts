import { NextApiRequest, NextApiResponse } from "next";
import { sql } from "@vercel/postgres";
import { TOKEN_2022_PROGRAM_ID, getAccount } from "@solana/spl-token";
import { Connection, PublicKey } from "@solana/web3.js";
import { Subscription } from "../../../models/types";
import { TokenState, getTokenStateKey } from "@koch-labs/rent-nft";

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse
) {
  const { limit, page, mint } = Object.assign(
    { limit: 20, page: 0 },
    request.query
  );
  const collectionMint = mint as string;
  try {
    const subscriptionsQuery = await sql`
    SELECT * FROM 
    subscriptionMetadata AS m
    FULL JOIN (
      SELECT * FROM 
      saloons AS sa
      JOIN subscriptions AS su
      USING (collectionMint)
    ) as s
    USING (tokenMint)
    WHERE s.collectionMint = ${collectionMint}
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
          ownerChangedTimestamp: r.ownerchangedtimestamp,
          expirationTimestamp: r.expirationtimestamp,
          metadata: r.metadata
            ? {
                image: r.metadata.image,
                name: r.metadata.name,
                description: r.metadata.description,
              }
            : undefined,
        };
      })
    );
    return response.status(200).json({ subscriptions });
  } catch (error) {
    console.log(error);
    return response.status(500).json({ error });
  }
}
