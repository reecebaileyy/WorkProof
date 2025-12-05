"use client";

import { useState, useEffect } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseAbi, parseAbiItem, createPublicClient, http, formatEther } from "viem";
import { baseSepolia } from "viem/chains";
import { Wallet } from "@coinbase/onchainkit/wallet";
import styles from "./page.module.css";

const CREDIBLES_V2_ABI = parseAbi([
  "function owner() view returns (address)",
  "function admins(address) view returns (bool)",
  "function verifyIssuer(address issuer, string memory emailDomain) external",
  "function verifyDomain(string memory emailDomain) external",
  "function setAttestationResolver(address _attestationResolver) external",
  "function pendingVerifications(address) view returns (string)",
  "function isVerifiedIssuer(address issuer) view returns (bool)",
  "function attestationResolver() view returns (address)",
  "function nextSkillPetId() view returns (uint256)",
  "event IssuerVerificationRequested(address indexed issuer, string domain)",
  "event IssuerVerified(address indexed issuer, string domain)",
]);

const ATTESTATION_NFT_ABI = parseAbi([
  "event AttestationNFTMinted(address indexed recipient, address indexed issuer, uint256 indexed tokenId, string category, string title)",
]);

interface PendingIssuer {
  address: string;
  domain: string;
  timestamp: number;
}

interface Attestation {
  recipient: string;
  issuer: string;
  tokenId: bigint;
  category: string;
  title: string;
  timestamp: number;
}

export default function AdminDashboard() {
  const { address, isConnected } = useAccount();
  const crediblesV2Address = (process.env.NEXT_PUBLIC_CREDIBLES_V2_CONTRACT_ADDRESS || 
    process.env.NEXT_PUBLIC_CREDIBLES_CONTRACT_ADDRESS) as `0x${string}`;
  const attestationNFTAddress = process.env.NEXT_PUBLIC_ATTESTATION_NFT_CONTRACT_ADDRESS as `0x${string}`;

  // Check if user is owner
  const { data: ownerAddress, isLoading: isLoadingOwner } = useReadContract({
    address: crediblesV2Address,
    abi: CREDIBLES_V2_ABI,
    functionName: "owner",
    query: {
      enabled: !!crediblesV2Address && isConnected,
    },
  });

  // Check if user is admin
  const { data: isAdminAddress, isLoading: isLoadingAdmin } = useReadContract({
    address: crediblesV2Address,
    abi: CREDIBLES_V2_ABI,
    functionName: "admins",
    args: address ? [address] : undefined,
    query: {
      enabled: !!crediblesV2Address && isConnected && !!address,
    },
  });

  const isOwner = isConnected && address && ownerAddress && address.toLowerCase() === ownerAddress.toLowerCase();
  const isAdmin = isOwner || (isConnected && address && isAdminAddress === true);
  const isLoadingAccess = isLoadingOwner || isLoadingAdmin;

  // Contract state reads
  const { data: attestationResolver } = useReadContract({
    address: crediblesV2Address,
    abi: CREDIBLES_V2_ABI,
    functionName: "attestationResolver",
    query: {
      enabled: isAdmin && !!crediblesV2Address,
    },
  });

  const { data: nextSkillPetId } = useReadContract({
    address: crediblesV2Address,
    abi: CREDIBLES_V2_ABI,
    functionName: "nextSkillPetId",
    query: {
      enabled: isAdmin && !!crediblesV2Address,
    },
  });

  // State for pending issuers and attestations
  const [pendingIssuers, setPendingIssuers] = useState<PendingIssuer[]>([]);
  const [attestations, setAttestations] = useState<Attestation[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);

  // Write contract hooks
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // State for write operations
  const [verifyIssuerAddress, setVerifyIssuerAddress] = useState("");
  const [verifyIssuerDomain, setVerifyIssuerDomain] = useState("");
  const [verifyDomainInput, setVerifyDomainInput] = useState("");
  const [resolverAddress, setResolverAddress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load events
  useEffect(() => {
    if (!isAdmin || !crediblesV2Address || !attestationNFTAddress) return;

    const loadEvents = async () => {
      setLoadingEvents(true);
      try {
        const publicClient = createPublicClient({
          chain: baseSepolia,
          transport: http(),
        });

        // Get contract creation block (approximate - you may want to store this)
        const currentBlock = await publicClient.getBlockNumber();
        const fromBlock = currentBlock - BigInt(10000); // Last ~10k blocks

        // Load pending issuer requests
        const issuerEventAbi = parseAbiItem("event IssuerVerificationRequested(address indexed issuer, string domain)");
        const issuerEvents = await publicClient.getLogs({
          address: crediblesV2Address,
          event: issuerEventAbi,
          fromBlock,
        });

        // Load verified issuers to filter out already verified
        const verifiedEventAbi = parseAbiItem("event IssuerVerified(address indexed issuer, string domain)");
        const verifiedEvents = await publicClient.getLogs({
          address: crediblesV2Address,
          event: verifiedEventAbi,
          fromBlock,
        });

        const verifiedAddresses = new Set(
          verifiedEvents.map((event: any) => event.args.issuer?.toLowerCase())
        );

        const pending: PendingIssuer[] = [];
        for (const event of issuerEvents) {
          const issuerAddress = event.args.issuer?.toLowerCase();
          if (issuerAddress && !verifiedAddresses.has(issuerAddress)) {
            // Check if still pending
            const pendingDomain = await publicClient.readContract({
              address: crediblesV2Address,
              abi: CREDIBLES_V2_ABI,
              functionName: "pendingVerifications",
              args: [event.args.issuer as `0x${string}`],
            });

            if (pendingDomain && pendingDomain.length > 0) {
              pending.push({
                address: event.args.issuer as string,
                domain: event.args.domain as string,
                timestamp: Number(event.blockNumber),
              });
            }
          }
        }

        setPendingIssuers(pending);

        // Load attestations
        const attestationEventAbi = parseAbiItem("event AttestationNFTMinted(address indexed recipient, address indexed issuer, uint256 indexed tokenId, string category, string title)");
        const attestationEvents = await publicClient.getLogs({
          address: attestationNFTAddress,
          event: attestationEventAbi,
          fromBlock,
        });

        const attestationsList: Attestation[] = attestationEvents.map((event: any) => ({
          recipient: event.args.recipient as string,
          issuer: event.args.issuer as string,
          tokenId: event.args.tokenId as bigint,
          category: event.args.category as string,
          title: event.args.title as string,
          timestamp: Number(event.blockNumber),
        }));

        setAttestations(attestationsList.reverse()); // Most recent first
      } catch (err) {
        console.error("Error loading events:", err);
      } finally {
        setLoadingEvents(false);
      }
    };

    loadEvents();
  }, [isAdmin, crediblesV2Address, attestationNFTAddress, isSuccess]);

  // Handle success
  useEffect(() => {
    if (isSuccess) {
      setSuccess("Transaction successful!");
      setError(null);
      // Reset forms
      setVerifyIssuerAddress("");
      setVerifyIssuerDomain("");
      setVerifyDomainInput("");
      setResolverAddress("");
      // Reload events after a delay
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    }
  }, [isSuccess]);

  const handleVerifyIssuer = async (issuerAddress: string, domain: string) => {
    if (!isAdmin || !crediblesV2Address) return;

    setError(null);
    setSuccess(null);

    try {
      writeContract({
        address: crediblesV2Address,
        abi: CREDIBLES_V2_ABI,
        functionName: "verifyIssuer",
        args: [issuerAddress as `0x${string}`, domain],
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to verify issuer";
      setError(errorMessage);
    }
  };

  const handleVerifyDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !crediblesV2Address || !verifyDomainInput) return;

    setError(null);
    setSuccess(null);

    try {
      writeContract({
        address: crediblesV2Address,
        abi: CREDIBLES_V2_ABI,
        functionName: "verifyDomain",
        args: [verifyDomainInput],
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to verify domain";
      setError(errorMessage);
    }
  };

  const handleSetResolver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !crediblesV2Address || !resolverAddress) return;

    if (!resolverAddress.startsWith("0x") || resolverAddress.length !== 42) {
      setError("Invalid address format");
      return;
    }

    setError(null);
    setSuccess(null);

    try {
      writeContract({
        address: crediblesV2Address,
        abi: CREDIBLES_V2_ABI,
        functionName: "setAttestationResolver",
        args: [resolverAddress as `0x${string}`],
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to set resolver";
      setError(errorMessage);
    }
  };

  const handleVerifyIssuerForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !crediblesV2Address || !verifyIssuerAddress || !verifyIssuerDomain) return;

    if (!verifyIssuerAddress.startsWith("0x") || verifyIssuerAddress.length !== 42) {
      setError("Invalid issuer address format");
      return;
    }

    setError(null);
    setSuccess(null);

    try {
      writeContract({
        address: crediblesV2Address,
        abi: CREDIBLES_V2_ABI,
        functionName: "verifyIssuer",
        args: [verifyIssuerAddress as `0x${string}`, verifyIssuerDomain],
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to verify issuer";
      setError(errorMessage);
    }
  };

  if (!isConnected) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Admin Dashboard</h1>
          <Wallet />
        </div>
        <div className={styles.accessDenied}>
          <h2>Access Denied</h2>
          <p>Please connect your wallet to access the admin dashboard.</p>
        </div>
      </div>
    );
  }

  if (isLoadingAccess) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Admin Dashboard</h1>
          <Wallet />
        </div>
        <div className={styles.loading}>Checking admin access...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Admin Dashboard</h1>
          <Wallet />
        </div>
        <div className={styles.accessDenied}>
          <h2>Access Denied</h2>
          <p>You are not authorized to access this dashboard. Only contract owners and admins can access this page.</p>
          <p className={styles.addressInfo}>
            Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
            <br />
            Owner: {ownerAddress?.slice(0, 6)}...{ownerAddress?.slice(-4)}
            <br />
            Admin Status: {isAdminAddress === true ? "Yes" : "No"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Admin Dashboard</h1>
        <Wallet />
      </div>

      <div className={styles.content}>
        {error && <div className={styles.error}>{error}</div>}
        {success && <div className={styles.success}>{success}</div>}

        {/* Contract Read Operations */}
        <section className={styles.section}>
          <h2>Contract State</h2>
          <div className={styles.infoGrid}>
            <div className={styles.infoCard}>
              <h3>Contract Owner</h3>
              <p className={styles.address}>{ownerAddress}</p>
            </div>
            <div className={styles.infoCard}>
              <h3>Your Role</h3>
              <p>{isOwner ? "Owner" : "Admin"}</p>
            </div>
            <div className={styles.infoCard}>
              <h3>Attestation Resolver</h3>
              <p className={styles.address}>{attestationResolver || "Not set"}</p>
            </div>
            <div className={styles.infoCard}>
              <h3>Next SkillPet ID</h3>
              <p>{nextSkillPetId?.toString() || "0"}</p>
            </div>
            <div className={styles.infoCard}>
              <h3>Pending Issuers</h3>
              <p>{pendingIssuers.length}</p>
            </div>
            <div className={styles.infoCard}>
              <h3>Total Attestations</h3>
              <p>{attestations.length}</p>
            </div>
          </div>
        </section>

        {/* Pending Issuer Approvals */}
        <section className={styles.section}>
          <h2>Pending Issuer Approvals</h2>
          {loadingEvents ? (
            <div className={styles.loading}>Loading pending requests...</div>
          ) : pendingIssuers.length === 0 ? (
            <p className={styles.empty}>No pending issuer verification requests.</p>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Issuer Address</th>
                    <th>Email Domain</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingIssuers.map((issuer, index) => (
                    <tr key={`${issuer.address}-${index}`}>
                      <td>
                        <a
                          href={`https://sepolia.basescan.org/address/${issuer.address}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.link}
                        >
                          {issuer.address.slice(0, 6)}...{issuer.address.slice(-4)}
                        </a>
                      </td>
                      <td>{issuer.domain}</td>
                      <td>
                        <button
                          onClick={() => handleVerifyIssuer(issuer.address, issuer.domain)}
                          disabled={isPending || isConfirming}
                          className={styles.approveButton}
                        >
                          {isPending || isConfirming ? "Processing..." : "Approve"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Attestations Table */}
        <section className={styles.section}>
          <h2>Attestations</h2>
          {loadingEvents ? (
            <div className={styles.loading}>Loading attestations...</div>
          ) : attestations.length === 0 ? (
            <p className={styles.empty}>No attestations found.</p>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Recipient</th>
                    <th>Issuer</th>
                    <th>Category</th>
                    <th>Title</th>
                    <th>Token ID</th>
                  </tr>
                </thead>
                <tbody>
                  {attestations.map((attestation, index) => (
                    <tr key={`${attestation.tokenId}-${index}`}>
                      <td>
                        <a
                          href={`https://sepolia.basescan.org/address/${attestation.recipient}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.link}
                        >
                          {attestation.recipient.slice(0, 6)}...{attestation.recipient.slice(-4)}
                        </a>
                      </td>
                      <td>
                        <a
                          href={`https://sepolia.basescan.org/address/${attestation.issuer}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.link}
                        >
                          {attestation.issuer.slice(0, 6)}...{attestation.issuer.slice(-4)}
                        </a>
                      </td>
                      <td>{attestation.category}</td>
                      <td>{attestation.title}</td>
                      <td>{attestation.tokenId.toString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Contract Write Operations */}
        <section className={styles.section}>
          <h2>Contract Operations</h2>
          <div className={styles.operationsGrid}>
            {/* Verify Issuer Form */}
            <div className={styles.operationCard}>
              <h3>Verify Issuer</h3>
              <form onSubmit={handleVerifyIssuerForm} className={styles.form}>
                <div className={styles.inputGroup}>
                  <label htmlFor="issuer-address">Issuer Address</label>
                  <input
                    id="issuer-address"
                    type="text"
                    value={verifyIssuerAddress}
                    onChange={(e) => setVerifyIssuerAddress(e.target.value)}
                    placeholder="0x..."
                    required
                    disabled={isPending || isConfirming}
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label htmlFor="issuer-domain">Email Domain</label>
                  <input
                    id="issuer-domain"
                    type="text"
                    value={verifyIssuerDomain}
                    onChange={(e) => setVerifyIssuerDomain(e.target.value)}
                    placeholder="company.com"
                    required
                    disabled={isPending || isConfirming}
                  />
                </div>
                <button
                  type="submit"
                  disabled={isPending || isConfirming}
                  className={styles.submitButton}
                >
                  {isPending || isConfirming ? "Processing..." : "Verify Issuer"}
                </button>
              </form>
            </div>

            {/* Verify Domain Form */}
            <div className={styles.operationCard}>
              <h3>Verify Domain</h3>
              <form onSubmit={handleVerifyDomain} className={styles.form}>
                <div className={styles.inputGroup}>
                  <label htmlFor="domain">Email Domain</label>
                  <input
                    id="domain"
                    type="text"
                    value={verifyDomainInput}
                    onChange={(e) => setVerifyDomainInput(e.target.value)}
                    placeholder="company.com"
                    required
                    disabled={isPending || isConfirming}
                  />
                </div>
                <button
                  type="submit"
                  disabled={isPending || isConfirming}
                  className={styles.submitButton}
                >
                  {isPending || isConfirming ? "Processing..." : "Verify Domain"}
                </button>
              </form>
            </div>

            {/* Set Resolver Form */}
            <div className={styles.operationCard}>
              <h3>Set Attestation Resolver</h3>
              <form onSubmit={handleSetResolver} className={styles.form}>
                <div className={styles.inputGroup}>
                  <label htmlFor="resolver">Resolver Address</label>
                  <input
                    id="resolver"
                    type="text"
                    value={resolverAddress}
                    onChange={(e) => setResolverAddress(e.target.value)}
                    placeholder="0x..."
                    required
                    disabled={isPending || isConfirming}
                  />
                </div>
                <button
                  type="submit"
                  disabled={isPending || isConfirming}
                  className={styles.submitButton}
                >
                  {isPending || isConfirming ? "Processing..." : "Set Resolver"}
                </button>
              </form>
            </div>
          </div>
        </section>

        {hash && (
          <div className={styles.txHash}>
            Transaction:{" "}
            <a
              href={`https://sepolia.basescan.org/tx/${hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.link}
            >
              {hash.slice(0, 10)}...{hash.slice(-8)}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

