-- create User
CREATE TABLE IF NOT EXISTS "User" 
(
  id INTEGER PRIMARY KEY,
  username TEXT NOT NULL,
  password TEXT NOT NULL
);

-- create UserHolding
CREATE TABLE IF NOT EXISTS "UserHolding" (
  id INTEGER PRIMARY KEY,
  userId TEXT NOT NULL,
  holding TEXT NOT NULL,
  noOfShares INTEGER NOT NULL,
  lastHoldingTime timestamp NOT NULL,
  createdAt timestamp NOT NULL,
  updatedAt timestamp NOT NULL
);

-- create UserHolding
CREATE TABLE "UserRegistry" (
  id INTEGER PRIMARY KEY,
  userId TEXT NOT NULL,
  walletaddress TEXT NOT NULL,
  isActive BOOL NOT NULL default false,
  createdAt timestamp NOT NULL,
  updatedAt timestamp NOT NULL
);