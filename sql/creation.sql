DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS saloons CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS saloonMetadata CASCADE;
DROP TABLE IF EXISTS subscriptionMetadata CASCADE;

CREATE TABLE users (
  publicKey TEXT PRIMARY KEY,
  username TEXT,
  lastLogin TIMESTAMP
);
CREATE TABLE saloons (
  collectionMint TEXT PRIMARY KEY,
  owner TEXT NOT NULL,
  authoritiesGroup TEXT NOT NULL,
  taxMint TEXT NOT NULL,
  postCooldown integer NOT NULL,
  tags TEXT[],
  CONSTRAINT fk_owner FOREIGN KEY (owner) REFERENCES users (publicKey) ON DELETE CASCADE
);
CREATE TABLE subscriptions (
  tokenMint TEXT PRIMARY KEY,
  collectionMint TEXT NOT NULL,
  lastPost TIMESTAMP,
  ownerChangedTimestamp TIMESTAMP,
  expirationTimestamp TIMESTAMP,
  currentPrice DOUBLE PRECISION,
  CONSTRAINT fk_saloon FOREIGN KEY (collectionMint) REFERENCES saloons (collectionMint) ON DELETE CASCADE
);
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
CREATE TABLE saloonMetadata (
  collectionMint TEXT PRIMARY KEY,
  metadata JSON NOT NULL,
  CONSTRAINT fk_saloon FOREIGN KEY (collectionMint) REFERENCES saloons (collectionMint) ON DELETE CASCADE
);
CREATE TABLE subscriptionMetadata (
  tokenMint TEXT PRIMARY KEY,
  metadata JSON NOT NULL,
  CONSTRAINT fk_subscription FOREIGN KEY (tokenMint) REFERENCES subscriptions (tokenMint) ON DELETE CASCADE
);
