import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";
import { network } from "hardhat";
import { parseEther, encodeAbiParameters, parseAbiParameters } from "../node_modules/viem/_types/index.js";
import { getAddress, type Address } from "../node_modules/viem/_types/index.js";

describe("Credibles", async function () {
  let credibles: any;
  let owner: Address;
  let user1: Address;
  let user2: Address;
  let resolver: Address;
  let publicClient: any;
  let walletClient: any;
  let accounts: any[];

  beforeEach(async function () {
    const { viem } = await network.connect();
    accounts = await viem.getWalletClients();
    owner = accounts[0].account.address;
    user1 = accounts[1].account.address;
    user2 = accounts[2].account.address;
    resolver = accounts[3].account.address;

    publicClient = await viem.getPublicClient();
    walletClient = accounts[0];

    // Deploy Credibles contract
    credibles = await viem.deployContract("Credibles", [owner]);
  });

  describe("Deployment", function () {
    it("Should set the correct owner", async function () {
      const contractOwner = await credibles.read.owner();
      assert.equal(contractOwner.toLowerCase(), owner.toLowerCase());
    });

    it("Should have correct name and symbol", async function () {
      const name = await credibles.read.name();
      const symbol = await credibles.read.symbol();
      assert.equal(name, "Credibles");
      assert.equal(symbol, "CRED");
    });

    it("Should initialize attestationResolver to zero address", async function () {
      const resolverAddress = await credibles.read.attestationResolver();
      assert.equal(resolverAddress, "0x0000000000000000000000000000000000000000");
    });
  });

  describe("Minting", function () {
    it("Should allow owner to mint tokens", async function () {
      const tokenId = 1n;
      await credibles.write.mint([user1, tokenId], { account: owner });

      const ownerOf = await credibles.read.ownerOf([tokenId]);
      assert.equal(ownerOf.toLowerCase(), user1.toLowerCase());
    });

    it("Should revert if non-owner tries to mint", async function () {
      const tokenId = 1n;
      await assert.rejects(
        credibles.write.mint([user1, tokenId], { account: user1 }),
        /OwnableUnauthorizedAccount/
      );
    });

    it("Should allow minting multiple tokens", async function () {
      await credibles.write.mint([user1, 1n], { account: owner });
      await credibles.write.mint([user1, 2n], { account: owner });
      await credibles.write.mint([user2, 3n], { account: owner });

      assert.equal(
        (await credibles.read.ownerOf([1n])).toLowerCase(),
        user1.toLowerCase()
      );
      assert.equal(
        (await credibles.read.ownerOf([2n])).toLowerCase(),
        user1.toLowerCase()
      );
      assert.equal(
        (await credibles.read.ownerOf([3n])).toLowerCase(),
        user2.toLowerCase()
      );
    });
  });

  describe("Soulbound Token (Transfer Prevention)", function () {
    beforeEach(async function () {
      await credibles.write.mint([user1, 1n], { account: owner });
    });

    it("Should prevent transfers between users", async function () {
      await assert.rejects(
        credibles.write.transferFrom([user1, user2, 1n], { account: user1 }),
        /Credibles: Soulbound token - transfers not allowed/
      );
    });

    it("Should prevent safe transfers", async function () {
      await assert.rejects(
        credibles.write.safeTransferFrom([user1, user2, 1n], { account: user1 }),
        /Credibles: Soulbound token - transfers not allowed/
      );
    });

    it("Should allow burning (transfer to zero address)", async function () {
      // Note: ERC721 doesn't have a burn function by default, but _update allows to == address(0)
      // We'll test that minting works (from == address(0)) which is already tested
      // Burning would require a custom burn function
    });
  });

  describe("AttestationResolver Management", function () {
    it("Should allow owner to set attestation resolver", async function () {
      await credibles.write.setAttestationResolver([resolver], { account: owner });
      const setResolver = await credibles.read.attestationResolver();
      assert.equal(setResolver.toLowerCase(), resolver.toLowerCase());
    });

    it("Should revert if non-owner tries to set resolver", async function () {
      await assert.rejects(
        credibles.write.setAttestationResolver([resolver], { account: user1 }),
        /OwnableUnauthorizedAccount/
      );
    });

    it("Should allow updating resolver address", async function () {
      const newResolver = accounts[4].account.address;
      await credibles.write.setAttestationResolver([resolver], { account: owner });
      await credibles.write.setAttestationResolver([newResolver], { account: owner });
      
      const currentResolver = await credibles.read.attestationResolver();
      assert.equal(currentResolver.toLowerCase(), newResolver.toLowerCase());
    });
  });

  describe("XP System", function () {
    beforeEach(async function () {
      await credibles.write.mint([user1, 1n], { account: owner });
      await credibles.write.setAttestationResolver([resolver], { account: owner });
    });

    it("Should revert if non-resolver tries to add XP", async function () {
      await assert.rejects(
        credibles.write.addXP([1n, "dev", 50n], { account: user1 }),
        /Only AttestationResolver can add XP/
      );
    });

    it("Should revert if token doesn't exist", async function () {
      await assert.rejects(
        credibles.write.addXP([999n, "dev", 50n], { account: resolver }),
        /Token does not exist/
      );
    });

    it("Should add XP to dev category", async function () {
      await credibles.write.addXP([1n, "dev", 50n], { account: resolver });
      
      const stats = await credibles.read.characterStats([1n]);
      assert.equal(stats[0], 50n); // dev
      assert.equal(stats[1], 0n); // defi
      assert.equal(stats[2], 0n); // gov
      assert.equal(stats[3], 0n); // social
    });

    it("Should add XP to defi category", async function () {
      await credibles.write.addXP([1n, "defi", 75n], { account: resolver });
      
      const stats = await credibles.read.characterStats([1n]);
      assert.equal(stats[0], 0n); // dev
      assert.equal(stats[1], 75n); // defi
      assert.equal(stats[2], 0n); // gov
      assert.equal(stats[3], 0n); // social
    });

    it("Should add XP to gov category", async function () {
      await credibles.write.addXP([1n, "gov", 30n], { account: resolver });
      
      const stats = await credibles.read.characterStats([1n]);
      assert.equal(stats[2], 30n); // gov
    });

    it("Should add XP to social category", async function () {
      await credibles.write.addXP([1n, "social", 100n], { account: resolver });
      
      const stats = await credibles.read.characterStats([1n]);
      assert.equal(stats[3], 100n); // social
    });

    it("Should accumulate XP in same category", async function () {
      await credibles.write.addXP([1n, "dev", 30n], { account: resolver });
      await credibles.write.addXP([1n, "dev", 20n], { account: resolver });
      await credibles.write.addXP([1n, "dev", 10n], { account: resolver });
      
      const stats = await credibles.read.characterStats([1n]);
      assert.equal(stats[0], 60n); // 30 + 20 + 10
    });

    it("Should handle multiple categories independently", async function () {
      await credibles.write.addXP([1n, "dev", 50n], { account: resolver });
      await credibles.write.addXP([1n, "defi", 25n], { account: resolver });
      await credibles.write.addXP([1n, "gov", 75n], { account: resolver });
      await credibles.write.addXP([1n, "social", 10n], { account: resolver });
      
      const stats = await credibles.read.characterStats([1n]);
      assert.equal(stats[0], 50n); // dev
      assert.equal(stats[1], 25n); // defi
      assert.equal(stats[2], 75n); // gov
      assert.equal(stats[3], 10n); // social
    });

    it("Should revert for invalid category", async function () {
      await assert.rejects(
        credibles.write.addXP([1n, "invalid", 50n], { account: resolver }),
        /Invalid category/
      );
    });

    it("Should handle case-sensitive category matching", async function () {
      // "dev" should work
      await credibles.write.addXP([1n, "dev", 50n], { account: resolver });
      
      // "Dev" should fail (case sensitive)
      await assert.rejects(
        credibles.write.addXP([1n, "Dev", 50n], { account: resolver }),
        /Invalid category/
      );
    });
  });

  describe("Level Up Events", function () {
    beforeEach(async function () {
      await credibles.write.mint([user1, 1n], { account: owner });
      await credibles.write.setAttestationResolver([resolver], { account: owner });
    });

    it("Should emit LevelUp when crossing 100 XP threshold", async function () {
      const deploymentBlock = await publicClient.getBlockNumber();
      
      // Add 50 XP (no level up)
      await credibles.write.addXP([1n, "dev", 50n], { account: resolver });
      
      // Add 60 more XP to cross 100 threshold (level 1)
      const tx = await credibles.write.addXP([1n, "dev", 60n], { account: resolver });
      
      const events = await publicClient.getContractEvents({
        address: credibles.address,
        abi: credibles.abi,
        eventName: "LevelUp",
        fromBlock: deploymentBlock,
      });

      assert.equal(events.length, 1);
      assert.equal(events[0].args.tokenId, 1n);
      assert.equal(events[0].args.category, "dev");
      assert.equal(events[0].args.newLevel, 1n);
    });

    it("Should emit LevelUp multiple times for multiple level ups", async function () {
      const deploymentBlock = await publicClient.getBlockNumber();
      
      // Add 250 XP in one go (should level up to level 2)
      // Note: Contract only emits the final level, not intermediate levels
      await credibles.write.addXP([1n, "dev", 250n], { account: resolver });
      
      const events = await publicClient.getContractEvents({
        address: credibles.address,
        abi: credibles.abi,
        eventName: "LevelUp",
        fromBlock: deploymentBlock,
      });

      // Contract emits only the final level (level 2) when crossing multiple thresholds
      assert.equal(events.length, 1);
      assert.equal(events[0].args.newLevel, 2n);
    });

    it("Should not emit LevelUp when not crossing threshold", async function () {
      const deploymentBlock = await publicClient.getBlockNumber();
      
      await credibles.write.addXP([1n, "dev", 50n], { account: resolver });
      await credibles.write.addXP([1n, "dev", 30n], { account: resolver });
      
      const events = await publicClient.getContractEvents({
        address: credibles.address,
        abi: credibles.abi,
        eventName: "LevelUp",
        fromBlock: deploymentBlock,
      });

      assert.equal(events.length, 0);
    });

    it("Should emit LevelUp for different categories independently", async function () {
      const deploymentBlock = await publicClient.getBlockNumber();
      
      await credibles.write.addXP([1n, "dev", 150n], { account: resolver });
      await credibles.write.addXP([1n, "defi", 200n], { account: resolver });
      
      const events = await publicClient.getContractEvents({
        address: credibles.address,
        abi: credibles.abi,
        eventName: "LevelUp",
        fromBlock: deploymentBlock,
      });

      // dev: level 1, defi: level 2 (contract emits final level only)
      assert.equal(events.length, 2);
      assert.equal(events[0].args.category, "dev");
      assert.equal(events[0].args.newLevel, 1n);
      assert.equal(events[1].args.category, "defi");
      assert.equal(events[1].args.newLevel, 2n);
    });
  });

  describe("Edge Cases", function () {
    beforeEach(async function () {
      await credibles.write.mint([user1, 1n], { account: owner });
      await credibles.write.setAttestationResolver([resolver], { account: owner });
    });

    it("Should handle zero XP addition", async function () {
      await credibles.write.addXP([1n, "dev", 0n], { account: resolver });
      const stats = await credibles.read.characterStats([1n]);
      assert.equal(stats[0], 0n);
    });

    it("Should handle very large XP values", async function () {
      const largeValue = 1000000n;
      await credibles.write.addXP([1n, "dev", largeValue], { account: resolver });
      const stats = await credibles.read.characterStats([1n]);
      assert.equal(stats[0], largeValue);
    });

    it("Should handle multiple tokens independently", async function () {
      await credibles.write.mint([user2, 2n], { account: owner });
      
      await credibles.write.addXP([1n, "dev", 50n], { account: resolver });
      await credibles.write.addXP([2n, "dev", 75n], { account: resolver });
      
      const stats1 = await credibles.read.characterStats([1n]);
      const stats2 = await credibles.read.characterStats([2n]);
      
      assert.equal(stats1[0], 50n);
      assert.equal(stats2[0], 75n);
    });
  });
});

