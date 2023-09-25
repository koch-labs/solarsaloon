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
    results.push(await sql`DROP TABLE IF EXISTS saloonMetadata CASCADE;`);
    results.push(await sql`DROP TABLE IF EXISTS subscriptionMetadata CASCADE;`);
    results.push(
      await sql`
    CREATE TABLE users (
      publicKey TEXT PRIMARY KEY,
      lastLogin TIMESTAMP
    );
    `
    );
    results.push(
      await sql`
    CREATE TABLE saloons (
      collectionMint TEXT PRIMARY KEY,
      owner TEXT NOT NULL,
      authoritiesGroup TEXT NOT NULL,
      taxMint TEXT NOT NULL,
      postCooldown integer NOT NULL,
      CONSTRAINT fk_owner FOREIGN KEY (owner) REFERENCES users (publicKey) ON DELETE CASCADE
    );
    `
    );
    results.push(
      await sql`
    CREATE TABLE subscriptions (
      tokenMint TEXT PRIMARY KEY,
      collectionMint TEXT NOT NULL,
      lastPost TIMESTAMP,
      ownerChangedTimestamp TIMESTAMP,
      CONSTRAINT fk_saloon FOREIGN KEY (collectionMint) REFERENCES saloons (collectionMint) ON DELETE CASCADE
    );
    `
    );
    results.push(
      await sql`
    CREATE TABLE posts (
      id SERIAL PRIMARY KEY,
      creator TEXT NOT NULL,
      collectionMint TEXT NOT NULL,
      content TEXT NOT NULL,
      draft boolean NOT NULL,
      creationTimestamp TIMESTAMP NOT NULL,
      CONSTRAINT fk_creator FOREIGN KEY (creator) REFERENCES users (publicKey) ON DELETE CASCADE,
      CONSTRAINT fk_saloon FOREIGN KEY (collectionMint) REFERENCES saloons (collectionMint) ON DELETE CASCADE
    );
    `
    );
    results.push(
      await sql`
    CREATE TABLE saloonMetadata (
      collectionMint TEXT PRIMARY KEY,
      metadata JSON NOT NULL,
      CONSTRAINT fk_saloon FOREIGN KEY (collectionMint) REFERENCES saloons (collectionMint) ON DELETE CASCADE
    );
    `
    );
    results.push(
      await sql`
    CREATE TABLE subscriptionMetadata (
      tokenMint TEXT PRIMARY KEY,
      metadata JSON NOT NULL,
      CONSTRAINT fk_subscription FOREIGN KEY (tokenMint) REFERENCES subscriptions (tokenMint) ON DELETE CASCADE
    );
    `
    );
    return response.status(200).json({ results });
  } catch (error) {
    console.log(error);
    return response.status(500).json({ error });
  }
}
