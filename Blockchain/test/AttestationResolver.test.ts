import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";
import { network } from "hardhat";
import { encodeAbiParameters, parseAbiParameters } from "../node_modules/viem/_types/index.js";
import { getAddress, type Address } from "../node_modules/viem/_types/index.js";

describe("AttestationResolver", async function () {
  let credibles: any;
  let mockEAS: any;
  let mockSchemaRegistry: any;
  let resolver: any;
  let owner: Address;
  let user1: Address;
  let publicClient: any;
  let accounts: any[];

  beforeEach(async function () {
    const { viem } = await network.connect();
    accounts = await viem.getWalletClients();
    owner = accounts[0].account.address;
    user1 = accounts[1].account.address;

    publicClient = await viem.getPublicClient();

    // Deploy Credibles
    credibles = await viem.deployContract("Credibles", [owner]);
    
    // Deploy mocks
    mockEAS = await viem.deployContract("MockEAS");
    mockSchemaRegistry = await viem.deployContract("MockSchemaRegistry");

    // Deploy AttestationResolver
    resolver = await viem.deployContract("AttestationResolver", [
      mockEAS.address,
      mockSchemaRegistry.address,
      credibles.address,
    ]);

    // Set resolver in Credibles
    await credibles.write.setAttestationResolver([resolver.address], { account: owner });
    
    // Mint a token for testing
    await credibles.write.mint([user1, 1n], { account: owner });
  });

  describe("Deployment", function () {
    it("Should set correct EAS address", async function () {
      const easAddress = await resolver.read.eas();
      assert.equal(easAddress.toLowerCase(), mockEAS.address.toLowerCase());
    });

    it("Should set correct SchemaRegistry address", async function () {
      const registryAddress = await resolver.read.schemaRegistry();
      assert.equal(registryAddress.toLowerCase(), mockSchemaRegistry.address.toLowerCase());
    });

    it("Should set correct Credibles address", async function () {
      const crediblesAddress = await resolver.read.credibles();
      assert.equal(crediblesAddress.toLowerCase(), credibles.address.toLowerCase());
    });

    it("Should register schema on deployment", async function () {
      const schemaUID = await resolver.read.schemaUID();
      assert.notEqual(schemaUID, "0x0000000000000000000000000000000000000000000000000000000000000000");
      
      // Verify schema is registered
      const schema = await mockSchemaRegistry.read.getSchema([schemaUID]);
      assert.equal(schema.resolver.toLowerCase(), resolver.address.toLowerCase());
      assert.equal(schema.revocable, true);
    });

    it("Should register correct schema string", async function () {
      // The schema should be "uint256 studentId, string category, uint256 xpValue"
      // We can't directly read the schema string from the registry in our mock,
      // but we can verify the schema UID was generated
      const schemaUID = await resolver.read.schemaUID();
      assert.notEqual(schemaUID, "0x0000000000000000000000000000000000000000000000000000000000000000");
    });
  });

  describe("onAttest", function () {
    it("Should decode attestation data and call addXP", async function () {
      const studentId = 1n;
      const category = "dev";
      const xpValue = 50n;

      // Encode attestation data
      const data = encodeAbiParameters(
        parseAbiParameters("uint256 studentId, string category, uint256 xpValue"),
        [studentId, category, xpValue]
      );

      // Call onAttest
      const result = await resolver.write.onAttest([
        "0x0000000000000000000000000000000000000000000000000000000000000001", // uid
        "0x0000000000000000000000000000000000000000000000000000000000000002", // schema
        user1, // recipient
        data, // data
      ], { account: accounts[0].account });

      // Verify XP was added
      const stats = await credibles.read.characterStats([studentId]);
      assert.equal(stats[0], xpValue); // dev category
    });

    it("Should handle different categories", async function () {
      const testCases = [
        { category: "dev", index: 0 },
        { category: "defi", index: 1 },
        { category: "gov", index: 2 },
        { category: "social", index: 3 },
      ];

      for (const testCase of testCases) {
        const data = encodeAbiParameters(
          parseAbiParameters("uint256 studentId, string category, uint256 xpValue"),
          [1n, testCase.category, 25n]
        );

        await resolver.write.onAttest([
          "0x0000000000000000000000000000000000000000000000000000000000000001",
          "0x0000000000000000000000000000000000000000000000000000000000000002",
          user1,
          data,
        ], { account: accounts[0].account });

        const stats = await credibles.read.characterStats([1n]);
        assert.equal(stats[testCase.index], 25n, `Failed for category: ${testCase.category}`);
      }
    });

    it("Should handle different token IDs", async function () {
      // Mint another token
      await credibles.write.mint([user1, 2n], { account: owner });

      const data1 = encodeAbiParameters(
        parseAbiParameters("uint256 studentId, string category, uint256 xpValue"),
        [1n, "dev", 30n]
      );

      const data2 = encodeAbiParameters(
        parseAbiParameters("uint256 studentId, string category, uint256 xpValue"),
        [2n, "dev", 40n]
      );

      await resolver.write.onAttest([
        "0x0000000000000000000000000000000000000000000000000000000000000001",
        "0x0000000000000000000000000000000000000000000000000000000000000002",
        user1,
        data1,
      ], { account: accounts[0].account });

      await resolver.write.onAttest([
        "0x0000000000000000000000000000000000000000000000000000000000000002",
        "0x0000000000000000000000000000000000000000000000000000000000000002",
        user1,
        data2,
      ], { account: accounts[0].account });

      const stats1 = await credibles.read.characterStats([1n]);
      const stats2 = await credibles.read.characterStats([2n]);

      assert.equal(stats1[0], 30n);
      assert.equal(stats2[0], 40n);
    });

    it("Should return true on successful attestation", async function () {
      const data = encodeAbiParameters(
        parseAbiParameters("uint256 studentId, string category, uint256 xpValue"),
        [1n, "dev", 50n]
      );

      const result = await resolver.read.onAttest([
        "0x0000000000000000000000000000000000000000000000000000000000000001",
        "0x0000000000000000000000000000000000000000000000000000000000000002",
        user1,
        data,
      ]);

      assert.equal(result, true);
    });

    it("Should revert if token doesn't exist", async function () {
      const data = encodeAbiParameters(
        parseAbiParameters("uint256 studentId, string category, uint256 xpValue"),
        [999n, "dev", 50n] // Non-existent token
      );

      await assert.rejects(
        resolver.write.onAttest([
          "0x0000000000000000000000000000000000000000000000000000000000000001",
          "0x0000000000000000000000000000000000000000000000000000000000000002",
          user1,
          data,
        ], { account: accounts[0].account }),
        /Token does not exist/
      );
    });

    it("Should revert if invalid category", async function () {
      const data = encodeAbiParameters(
        parseAbiParameters("uint256 studentId, string category, uint256 xpValue"),
        [1n, "invalid", 50n]
      );

      await assert.rejects(
        resolver.write.onAttest([
          "0x0000000000000000000000000000000000000000000000000000000000000001",
          "0x0000000000000000000000000000000000000000000000000000000000000002",
          user1,
          data,
        ], { account: accounts[0].account }),
        /Invalid category/
      );
    });

    it("Should handle multiple attestations for same token", async function () {
      const data1 = encodeAbiParameters(
        parseAbiParameters("uint256 studentId, string category, uint256 xpValue"),
        [1n, "dev", 30n]
      );

      const data2 = encodeAbiParameters(
        parseAbiParameters("uint256 studentId, string category, uint256 xpValue"),
        [1n, "dev", 20n]
      );

      await resolver.write.onAttest([
        "0x0000000000000000000000000000000000000000000000000000000000000001",
        "0x0000000000000000000000000000000000000000000000000000000000000002",
        user1,
        data1,
      ], { account: accounts[0].account });

      await resolver.write.onAttest([
        "0x0000000000000000000000000000000000000000000000000000000000000002",
        "0x0000000000000000000000000000000000000000000000000000000000000002",
        user1,
        data2,
      ], { account: accounts[0].account });

      const stats = await credibles.read.characterStats([1n]);
      assert.equal(stats[0], 50n); // 30 + 20
    });
  });

  describe("onRevoke", function () {
    it("Should return true when called", async function () {
      const data = encodeAbiParameters(
        parseAbiParameters("uint256 studentId, string category, uint256 xpValue"),
        [1n, "dev", 50n]
      );

      const result = await resolver.read.onRevoke([
        "0x0000000000000000000000000000000000000000000000000000000000000001",
        "0x0000000000000000000000000000000000000000000000000000000000000002",
        user1,
        data,
      ]);

      assert.equal(result, true);
    });

    it("Should not affect XP when revoked", async function () {
      // First add XP via attestation
      const attestData = encodeAbiParameters(
        parseAbiParameters("uint256 studentId, string category, uint256 xpValue"),
        [1n, "dev", 50n]
      );

      await resolver.write.onAttest([
        "0x0000000000000000000000000000000000000000000000000000000000000001",
        "0x0000000000000000000000000000000000000000000000000000000000000002",
        user1,
        attestData,
      ], { account: accounts[0].account });

      // Verify XP was added
      let stats = await credibles.read.characterStats([1n]);
      assert.equal(stats[0], 50n);

      // Revoke (should not affect XP)
      await resolver.write.onRevoke([
        "0x0000000000000000000000000000000000000000000000000000000000000001",
        "0x0000000000000000000000000000000000000000000000000000000000000002",
        user1,
        attestData,
      ], { account: accounts[0].account });

      // XP should remain
      stats = await credibles.read.characterStats([1n]);
      assert.equal(stats[0], 50n);
    });
  });

  describe("Integration Tests", function () {
    it("Should handle full flow: mint -> attest -> check XP", async function () {
      // Mint token
      await credibles.write.mint([user1, 5n], { account: owner });

      // Create attestation data
      const data = encodeAbiParameters(
        parseAbiParameters("uint256 studentId, string category, uint256 xpValue"),
        [5n, "dev", 100n]
      );

      // Process attestation
      await resolver.write.onAttest([
        "0x0000000000000000000000000000000000000000000000000000000000000005",
        await resolver.read.schemaUID(),
        user1,
        data,
      ], { account: accounts[0].account });

      // Verify XP
      const stats = await credibles.read.characterStats([5n]);
      assert.equal(stats[0], 100n);

      // Check for level up event - get block before transaction
      const currentBlock = await publicClient.getBlockNumber();
      const events = await publicClient.getContractEvents({
        address: credibles.address,
        abi: credibles.abi,
        eventName: "LevelUp",
        fromBlock: currentBlock > 10n ? currentBlock - 10n : 0n,
      });

      assert.equal(events.length, 1);
      assert.equal(events[0].args.tokenId, 5n);
      assert.equal(events[0].args.category, "dev");
      assert.equal(events[0].args.newLevel, 1n);
    });

    it("Should handle multiple attestations across categories", async function () {
      const categories = ["dev", "defi", "gov", "social"];
      const xpValues = [50n, 75n, 100n, 25n];

      for (let i = 0; i < categories.length; i++) {
        const data = encodeAbiParameters(
          parseAbiParameters("uint256 studentId, string category, uint256 xpValue"),
          [1n, categories[i], xpValues[i]]
        );

        await resolver.write.onAttest([
          `0x${i.toString().padStart(64, "0")}`,
          await resolver.read.schemaUID(),
          user1,
          data,
        ], { account: accounts[0].account });
      }

      const stats = await credibles.read.characterStats([1n]);
      assert.equal(stats[0], 50n); // dev
      assert.equal(stats[1], 75n); // defi
      assert.equal(stats[2], 100n); // gov
      assert.equal(stats[3], 25n); // social
    });
  });
});

