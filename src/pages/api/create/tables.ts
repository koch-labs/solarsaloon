import { NextApiRequest, NextApiResponse } from "next";
import { sql } from "@vercel/postgres";

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse
) {
  try {
    let results = [];
    results.push(await sql`DROP TABLE IF EXISTS users CASCADE;`);
    results.push(await sql`DROP TABLE IF EXISTS saloons CASCADE;`);
    results.push(await sql`DROP TABLE IF EXISTS subscriptions CASCADE;`);
    results.push(await sql`DROP TABLE IF EXISTS posts CASCADE;`);
    results.push(
      await sql`
    CREATE TABLE users (
      id SERIAL PRIMARY KEY,
      publicKey TEXT NOT NULL,
      lastLogin TIMESTAMP
    );
    `
    );
    results.push(
      await sql`
    CREATE TABLE saloons (
      id SERIAL PRIMARY KEY,
      collectionMint TEXT UNIQUE NOT NULL,
      ownerId integer NOT NULL,
      authoritiesGroup TEXT NOT NULL,
      taxMint TEXT NOT NULL,
      postCooldown integer NOT NULL,
      CONSTRAINT fk_owner FOREIGN KEY (ownerId) REFERENCES users (id) ON DELETE CASCADE
    );
    `
    );
    results.push(
      await sql`
    CREATE TABLE subscriptions (
      id SERIAL PRIMARY KEY,
      tokenMint TEXT UNIQUE NOT NULL,
      saloonId integer NOT NULL,
      lastPost TIMESTAMP,
      ownerChangedTimestamp TIMESTAMP,
      CONSTRAINT fk_saloon FOREIGN KEY (saloonId) REFERENCES saloons (id) ON DELETE CASCADE
    );
    `
    );
    results.push(
      await sql`
    CREATE TABLE posts (
      id SERIAL PRIMARY KEY,
      creatorId integer NOT NULL,
      saloonId integer NOT NULL,
      content TEXT NOT NULL,
      draft boolean NOT NULL,
      creationTimestamp TIMESTAMP NOT NULL,
      CONSTRAINT fk_creator FOREIGN KEY (creatorId) REFERENCES users (id) ON DELETE CASCADE,
      CONSTRAINT fk_saloon FOREIGN KEY (saloonId) REFERENCES saloons (id) ON DELETE CASCADE
    );
    `
    );
    return response.status(200).json({ results });
  } catch (error) {
    console.log(error);
    return response.status(500).json({ error });
  }
}
