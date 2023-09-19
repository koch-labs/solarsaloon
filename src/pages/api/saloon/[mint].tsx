import { NextApiRequest, NextApiResponse } from "next";
import { sql } from "@vercel/postgres";
import jwt from "jsonwebtoken";
import { Saloon, Subscription, User } from "../../../models/types";
import { Connection, PublicKey } from "@solana/web3.js";
import { BidState, TokenState, getTokenStateKey } from "@koch-labs/rent-nft";

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse
) {
  try {
    const { limit, page, mint } = Object.assign(
      { limit: 20, page: 0 },
      request.query
    );

    const saloonQuery =
      await sql`SELECT * FROM users AS u JOIN saloons AS s ON s.ownerid = u.id WHERE collectionMint = ${
        mint as string
      }`;

    if (saloonQuery.rowCount === 0) {
      return response.status(404).json({
        message: `Found no saloon that had ${mint} as a collection mint`,
      });
    }

    const subscriptionsQuery =
      await sql`SELECT * FROM saloons JOIN subscriptions ON saloons.id = subscriptions.saloonId LIMIT ${limit} OFFSET ${
        limit * page
      };`;

    // Fetch token states for each subscription
    const connection = new Connection(
      (process.env.SOLANA_NETWORK === "devnet"
        ? process.env.HELIUS_RPC_DEVNET
        : process.env.HELIUS_RPC_MAINNET) +
        "?api-key=" +
        process.env.HELIUS_KEY
    );
    const subsAccounts = await connection.getMultipleAccountsInfo(
      subscriptionsQuery.rows.map((r) =>
        getTokenStateKey(new PublicKey(mint), new PublicKey(r.tokenmint))
      )
    );
    const tokenStates = subsAccounts.map((a) =>
      TokenState.decode(a.data).toJSON()
    );
    const subscriptions: Subscription[] = subscriptionsQuery.rows.map((r) => ({
      id: r.id,
      tokenMint: r.tokenmint,
      lastPost: r.lastpost,
      tokenState: tokenStates.find((s) => s.tokenMint === r.tokenmint),
    }));

    // Check if the querier owns any subscriptions
    const rawToken = request.headers.authorization.split("Bearer ")[1];
    const user = jwt.decode(rawToken) as User;
    if (user?.publicKey) {
      const balancesResponse = await fetch(
        `${
          process.env.SOLANA_NETWORK === "devnet"
            ? process.env.HELIUS_API_DEVNET
            : process.env.HELIUS_API_MAINNET
        }/v0/addresses/${user.publicKey}/balances?api-key=${
          process.env.HELIUS_KEY
        }`
      );
      const { tokens } = await balancesResponse.json();
      subscriptions.forEach((s) => {
        if (tokens.find((token) => token.mint === s.tokenMint)) {
          s.owner = user.publicKey;
        }
      });
    }

    const rawSaloon = saloonQuery.rows[0];
    const saloon: Saloon = {
      id: rawSaloon.id,
      owner: {
        id: rawSaloon.ownerid,
        publicKey: rawSaloon.publickey,
        lastLogin: rawSaloon.lastlogin,
      },
      collectionMint: rawSaloon.collectionmint,
      taxMint: rawSaloon.taxmint,
      authoritiesGroup: rawSaloon.authoritiesgroup,
      subscriptions,
    };

    return response.status(200).json({ saloon });
  } catch (error) {
    console.log(error);
    return response.status(500).json({ error });
  }
}
