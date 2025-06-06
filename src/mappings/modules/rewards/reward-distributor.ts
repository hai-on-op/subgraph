import { BigInt, Bytes } from "@graphprotocol/graph-ts";
import {
  RewardDistributorMerkleRootUpdated,
  RewardDistributorRewardClaimed,
} from "../../../../generated/RewardDistributor/RewardDistributor";
import {
  RewardDistributor,
  MerkleRoot,
  Claim,
  RewardUser,
  TokenClaim,
} from "../../../../generated/schema";
import { log } from "@graphprotocol/graph-ts";

function getOrCreateRewardDistributor(address: Bytes): RewardDistributor {
  let distributor = RewardDistributor.load(address.toHexString());
  if (!distributor) {
    distributor = new RewardDistributor(address.toHexString());
    distributor.rewardSetter = Bytes.fromHexString(
      "0x0000000000000000000000000000000000000000"
    );
    distributor.save();
  }
  return distributor;
}


function getOrCreateUser(address: Bytes): RewardUser {
  let user = RewardUser.load(address.toHexString());
  if (!user) {
    user = new RewardUser(address.toHexString());
    user.save();
  }
  return user;
}

function getOrCreateTokenClaim(user: Bytes, token: Bytes): TokenClaim {
  const id = user.toHexString() + "-" + token.toHexString();
  let tokenClaim = TokenClaim.load(id);
  if (!tokenClaim) {
    tokenClaim = new TokenClaim(id);
    tokenClaim.user = user.toHexString();
    tokenClaim.token = token;
    tokenClaim.totalAmount = BigInt.fromI32(0);
    tokenClaim.claimCount = BigInt.fromI32(0);
    tokenClaim.save();
  }
  return tokenClaim;
}

export function handleMerkleRootsUpdated(event: RewardDistributorMerkleRootUpdated): void {
  const distributor = getOrCreateRewardDistributor(event.address);

  // Update merkle roots for each token
    const token = event.params._rewardToken;
    const root = event.params._merkleRoot;

    // Try to load existing merkle root
    let merkleRoot = MerkleRoot.load(token.toHexString());
    
    // If it doesn't exist, create a new one
    if (!merkleRoot) {
      merkleRoot = new MerkleRoot(token.toHexString());
      merkleRoot.distributor = distributor.id;
      merkleRoot.token = token;
    }

    // Update the root and timestamps
    merkleRoot.root = root;
    merkleRoot.updatedAt = event.block.timestamp;
    merkleRoot.updatedAtBlock = event.block.number;
    merkleRoot.updatedAtTransaction = event.transaction.hash;
    merkleRoot.save();
  
}

/*
export function handleRewardSetterUpdated(event: RewardSetterUpdated): void {
  log.debug("Reward setter updated to {}", [event.params.newSetter.toHexString()]);

  const distributor = getOrCreateRewardDistributor(event.address);
  distributor.rewardSetter = event.params.newSetter;
  distributor.save();
}*/

export function handleRewardsClaimed(event: RewardDistributorRewardClaimed): void {
  const distributor = getOrCreateRewardDistributor(event.address);
  const user = getOrCreateUser(event.params._account);
  const tokenClaim = getOrCreateTokenClaim(
    event.params._account,
    event.params._rewardToken
  );

  // Create new claim
  const claimId =
    event.params._account.toHexString() +
    "-" +
    event.params._rewardToken.toHexString() +
    "-" +
    event.block.timestamp.toString();

  const claim = new Claim(claimId);
  claim.distributor = distributor.id;
  claim.user = user.id;
  claim.token = event.params._rewardToken;
  claim.amount = event.params._wad;
  claim.claimedAt = event.block.timestamp;
  claim.claimedAtBlock = event.block.number;
  claim.claimedAtTransaction = event.transaction.hash;
  claim.save();

  // Update token claim totals
  tokenClaim.totalAmount = tokenClaim.totalAmount.plus(event.params._wad);
  tokenClaim.claimCount = tokenClaim.claimCount.plus(BigInt.fromI32(1));
  tokenClaim.save();
}
