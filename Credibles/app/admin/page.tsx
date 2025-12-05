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
  "function addAdmin(address admin) external",
  "function removeAdmin(address admin) external",
  "function pendingVerifications(address) view returns (string)",
  "function isVerifiedIssuer(address issuer) view returns (bool)",
  "function attestationResolver() view returns (address)",
  "function nextSkillPetId() view returns (uint256)",
  "event IssuerVerificationRequested(address indexed issuer, string domain)",
  "event IssuerVerified(address indexed issuer, string domain)",
]);

const ATTESTATION_NFT_ABI = parseAbi([
  "function owner() view returns (address)",
  "function admins(address) view returns (bool)",
  "function setCrediblesV2Contract(address _crediblesV2Contract) external",
  "function setAttestationResolver(address _attestationResolver) external",
  "function addAdmin(address admin) external",
  "function removeAdmin(address admin) external",
  "function crediblesV2Contract() view returns (address)",
  "function attestationResolver() view returns (address)",
  "function nextTokenId() view returns (uint256)",
  "event AttestationNFTMinted(address indexed recipient, address indexed issuer, uint256 indexed tokenId, string category, string title)",
]);

const ATTESTATION_RESOLVER_ABI = parseAbi([
  "function owner() view returns (address)",
  "function admins(address) view returns (bool)",
  "function setAttestationNFT(address _attestationNFT) external",
  "function addAdmin(address admin) external",
  "function removeAdmin(address admin) external",
  "function attestationNFT() view returns (address)",
  "function schemaUID() view returns (bytes32)",
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
  const attestationResolverAddress = (process.env.NEXT_PUBLIC_ATTESTATION_RESOLVER_CONTRACT_ADDRESS || 
    process.env.NEXT_PUBLIC_ATTESTATION_RESOLVER_ADDRESS) as `0x${string}`;

  // Check if user is owner on CrediblesV2
  const { data: crediblesV2Owner, isLoading: isLoadingCrediblesOwner } = useReadContract({
    address: crediblesV2Address,
    abi: CREDIBLES_V2_ABI,
    functionName: "owner",
    query: {
      enabled: !!crediblesV2Address && isConnected,
    },
  });

  // Check if user is admin on CrediblesV2
  const { data: isCrediblesAdminFromContract, isLoading: isLoadingCrediblesAdmin } = useReadContract({
    address: crediblesV2Address,
    abi: CREDIBLES_V2_ABI,
    functionName: "admins",
    args: address ? [address] : undefined,
    query: {
      enabled: !!crediblesV2Address && isConnected && !!address,
    },
  });

  // Check if user is owner on AttestationNFT
  const { data: attestationNFTOwner, isLoading: isLoadingAttestationNFTOwner } = useReadContract({
    address: attestationNFTAddress,
    abi: ATTESTATION_NFT_ABI,
    functionName: "owner",
    query: {
      enabled: !!attestationNFTAddress && isConnected,
    },
  });

  // Check if user is admin on AttestationNFT
  const { data: isAttestationNFTAdminFromContract, isLoading: isLoadingAttestationNFTAdmin } = useReadContract({
    address: attestationNFTAddress,
    abi: ATTESTATION_NFT_ABI,
    functionName: "admins",
    args: address ? [address] : undefined,
    query: {
      enabled: !!attestationNFTAddress && isConnected && !!address,
    },
  });

  // Check if user is owner on AttestationResolver
  const { data: resolverOwner, isLoading: isLoadingResolverOwner } = useReadContract({
    address: attestationResolverAddress,
    abi: ATTESTATION_RESOLVER_ABI,
    functionName: "owner",
    query: {
      enabled: !!attestationResolverAddress && isConnected,
    },
  });

  // Check if user is admin on AttestationResolver
  const { data: isResolverAdminFromContract, isLoading: isLoadingResolverAdmin } = useReadContract({
    address: attestationResolverAddress,
    abi: ATTESTATION_RESOLVER_ABI,
    functionName: "admins",
    args: address ? [address] : undefined,
    query: {
      enabled: !!attestationResolverAddress && isConnected && !!address,
    },
  });

  // User is admin if they are owner or admin on ANY of the contracts
  const isCrediblesOwner = isConnected && address && crediblesV2Owner && address.toLowerCase() === crediblesV2Owner.toLowerCase();
  const isCrediblesAdmin = isCrediblesOwner || (isConnected && address && isCrediblesAdminFromContract === true);
  
  const isAttestationNFTOwner = isConnected && address && attestationNFTOwner && address.toLowerCase() === attestationNFTOwner.toLowerCase();
  const isAttestationNFTAdmin = isAttestationNFTOwner || (isConnected && address && isAttestationNFTAdminFromContract === true);
  
  const isResolverOwner = isConnected && address && resolverOwner && address.toLowerCase() === resolverOwner.toLowerCase();
  const isResolverAdmin = isResolverOwner || (isConnected && address && isResolverAdminFromContract === true);

  const isAdmin = isCrediblesAdmin || isAttestationNFTAdmin || isResolverAdmin;
  const isLoadingAccess = isLoadingCrediblesOwner || isLoadingCrediblesAdmin || 
                          isLoadingAttestationNFTOwner || isLoadingAttestationNFTAdmin ||
                          isLoadingResolverOwner || isLoadingResolverAdmin;

  // Contract state reads - CrediblesV2
  const { data: crediblesAttestationResolver } = useReadContract({
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

  // Contract state reads - AttestationNFT
  const { data: attestationNFTCrediblesV2 } = useReadContract({
    address: attestationNFTAddress,
    abi: ATTESTATION_NFT_ABI,
    functionName: "crediblesV2Contract",
    query: {
      enabled: isAdmin && !!attestationNFTAddress,
    },
  });

  const { data: attestationNFTResolver } = useReadContract({
    address: attestationNFTAddress,
    abi: ATTESTATION_NFT_ABI,
    functionName: "attestationResolver",
    query: {
      enabled: isAdmin && !!attestationNFTAddress,
    },
  });

  const { data: nextAttestationTokenId } = useReadContract({
    address: attestationNFTAddress,
    abi: ATTESTATION_NFT_ABI,
    functionName: "nextTokenId",
    query: {
      enabled: isAdmin && !!attestationNFTAddress,
    },
  });

  // Contract state reads - AttestationResolver
  const { data: resolverAttestationNFT } = useReadContract({
    address: attestationResolverAddress,
    abi: ATTESTATION_RESOLVER_ABI,
    functionName: "attestationNFT",
    query: {
      enabled: isAdmin && !!attestationResolverAddress,
    },
  });

  const { data: schemaUID } = useReadContract({
    address: attestationResolverAddress,
    abi: ATTESTATION_RESOLVER_ABI,
    functionName: "schemaUID",
    query: {
      enabled: isAdmin && !!attestationResolverAddress,
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
  const [adminAddress, setAdminAddress] = useState("");
  const [adminContract, setAdminContract] = useState<"credibles" | "attestationNFT" | "resolver">("credibles");
  const [attestationNFTCrediblesAddress, setAttestationNFTCrediblesAddress] = useState("");
  const [attestationNFTResolverAddress, setAttestationNFTResolverAddress] = useState("");
  const [resolverAttestationNFTAddress, setResolverAttestationNFTAddress] = useState("");
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
      setAdminAddress("");
      setAttestationNFTCrediblesAddress("");
      setAttestationNFTResolverAddress("");
      setResolverAttestationNFTAddress("");
      // Reload events after a delay
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    }
  }, [isSuccess]);

  const handleVerifyIssuer = async (issuerAddress: string, domain: string) => {
    if (!isCrediblesAdmin || !crediblesV2Address) return;

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
    if (!isCrediblesAdmin || !crediblesV2Address || !verifyDomainInput) return;

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
    if (!isCrediblesAdmin || !crediblesV2Address || !resolverAddress) return;

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
    if (!isCrediblesAdmin || !crediblesV2Address || !verifyIssuerAddress || !verifyIssuerDomain) return;

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

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !adminAddress) return;

    if (!adminAddress.startsWith("0x") || adminAddress.length !== 42) {
      setError("Invalid admin address format");
      return;
    }

    setError(null);
    setSuccess(null);

    try {
      let contractAddress: `0x${string}`;
      let abi: any;
      
      if (adminContract === "credibles") {
        if (!isCrediblesAdmin) {
          setError("You don't have permission to manage CrediblesV2 admins");
          return;
        }
        contractAddress = crediblesV2Address;
        abi = CREDIBLES_V2_ABI;
      } else if (adminContract === "attestationNFT") {
        if (!isAttestationNFTAdmin) {
          setError("You don't have permission to manage AttestationNFT admins");
          return;
        }
        contractAddress = attestationNFTAddress;
        abi = ATTESTATION_NFT_ABI;
      } else {
        if (!isResolverAdmin) {
          setError("You don't have permission to manage AttestationResolver admins");
          return;
        }
        contractAddress = attestationResolverAddress;
        abi = ATTESTATION_RESOLVER_ABI;
      }

      writeContract({
        address: contractAddress,
        abi: abi,
        functionName: "addAdmin",
        args: [adminAddress as `0x${string}`],
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to add admin";
      setError(errorMessage);
    }
  };

  const handleRemoveAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !adminAddress) return;

    if (!adminAddress.startsWith("0x") || adminAddress.length !== 42) {
      setError("Invalid admin address format");
      return;
    }

    setError(null);
    setSuccess(null);

    try {
      let contractAddress: `0x${string}`;
      let abi: any;
      
      if (adminContract === "credibles") {
        if (!isCrediblesAdmin) {
          setError("You don't have permission to manage CrediblesV2 admins");
          return;
        }
        contractAddress = crediblesV2Address;
        abi = CREDIBLES_V2_ABI;
      } else if (adminContract === "attestationNFT") {
        if (!isAttestationNFTAdmin) {
          setError("You don't have permission to manage AttestationNFT admins");
          return;
        }
        contractAddress = attestationNFTAddress;
        abi = ATTESTATION_NFT_ABI;
      } else {
        if (!isResolverAdmin) {
          setError("You don't have permission to manage AttestationResolver admins");
          return;
        }
        contractAddress = attestationResolverAddress;
        abi = ATTESTATION_RESOLVER_ABI;
      }

      writeContract({
        address: contractAddress,
        abi: abi,
        functionName: "removeAdmin",
        args: [adminAddress as `0x${string}`],
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to remove admin";
      setError(errorMessage);
    }
  };

  const handleSetAttestationNFTCredibles = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAttestationNFTAdmin || !attestationNFTAddress || !attestationNFTCrediblesAddress) return;

    if (!attestationNFTCrediblesAddress.startsWith("0x") || attestationNFTCrediblesAddress.length !== 42) {
      setError("Invalid address format");
      return;
    }

    setError(null);
    setSuccess(null);

    try {
      writeContract({
        address: attestationNFTAddress,
        abi: ATTESTATION_NFT_ABI,
        functionName: "setCrediblesV2Contract",
        args: [attestationNFTCrediblesAddress as `0x${string}`],
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to set CrediblesV2 contract";
      setError(errorMessage);
    }
  };

  const handleSetAttestationNFTResolver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAttestationNFTAdmin || !attestationNFTAddress || !attestationNFTResolverAddress) return;

    if (!attestationNFTResolverAddress.startsWith("0x") || attestationNFTResolverAddress.length !== 42) {
      setError("Invalid address format");
      return;
    }

    setError(null);
    setSuccess(null);

    try {
      writeContract({
        address: attestationNFTAddress,
        abi: ATTESTATION_NFT_ABI,
        functionName: "setAttestationResolver",
        args: [attestationNFTResolverAddress as `0x${string}`],
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to set AttestationResolver";
      setError(errorMessage);
    }
  };

  const handleSetResolverAttestationNFT = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isResolverAdmin || !attestationResolverAddress || !resolverAttestationNFTAddress) return;

    if (!resolverAttestationNFTAddress.startsWith("0x") || resolverAttestationNFTAddress.length !== 42) {
      setError("Invalid address format");
      return;
    }

    setError(null);
    setSuccess(null);

    try {
      writeContract({
        address: attestationResolverAddress,
        abi: ATTESTATION_RESOLVER_ABI,
        functionName: "setAttestationNFT",
        args: [resolverAttestationNFTAddress as `0x${string}`],
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to set AttestationNFT";
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
            CrediblesV2 Owner: {crediblesV2Owner?.slice(0, 6)}...{crediblesV2Owner?.slice(-4)}
            <br />
            CrediblesV2 Admin: {isCrediblesAdmin === true ? "Yes" : "No"}
            <br />
            AttestationNFT Owner: {attestationNFTOwner?.slice(0, 6)}...{attestationNFTOwner?.slice(-4)}
            <br />
            AttestationNFT Admin: {isAttestationNFTAdmin === true ? "Yes" : "No"}
            <br />
            AttestationResolver Owner: {resolverOwner?.slice(0, 6)}...{resolverOwner?.slice(-4)}
            <br />
            AttestationResolver Admin: {isResolverAdmin === true ? "Yes" : "No"}
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
              <h3>CrediblesV2 Owner</h3>
              <p className={styles.address}>{crediblesV2Owner || "N/A"}</p>
            </div>
            <div className={styles.infoCard}>
              <h3>Your CrediblesV2 Role</h3>
              <p>{isCrediblesOwner ? "Owner" : isCrediblesAdmin ? "Admin" : "None"}</p>
            </div>
            <div className={styles.infoCard}>
              <h3>CrediblesV2 Resolver</h3>
              <p className={styles.address}>{crediblesAttestationResolver || "Not set"}</p>
            </div>
            <div className={styles.infoCard}>
              <h3>Next SkillPet ID</h3>
              <p>{nextSkillPetId?.toString() || "0"}</p>
            </div>
            <div className={styles.infoCard}>
              <h3>AttestationNFT Owner</h3>
              <p className={styles.address}>{attestationNFTOwner || "N/A"}</p>
            </div>
            <div className={styles.infoCard}>
              <h3>Your AttestationNFT Role</h3>
              <p>{isAttestationNFTOwner ? "Owner" : isAttestationNFTAdmin ? "Admin" : "None"}</p>
            </div>
            <div className={styles.infoCard}>
              <h3>AttestationNFT CrediblesV2</h3>
              <p className={styles.address}>{attestationNFTCrediblesV2 || "Not set"}</p>
            </div>
            <div className={styles.infoCard}>
              <h3>AttestationNFT Resolver</h3>
              <p className={styles.address}>{attestationNFTResolver || "Not set"}</p>
            </div>
            <div className={styles.infoCard}>
              <h3>Next Attestation Token ID</h3>
              <p>{nextAttestationTokenId?.toString() || "0"}</p>
            </div>
            <div className={styles.infoCard}>
              <h3>AttestationResolver Owner</h3>
              <p className={styles.address}>{resolverOwner || "N/A"}</p>
            </div>
            <div className={styles.infoCard}>
              <h3>Your Resolver Role</h3>
              <p>{isResolverOwner ? "Owner" : isResolverAdmin ? "Admin" : "None"}</p>
            </div>
            <div className={styles.infoCard}>
              <h3>Resolver AttestationNFT</h3>
              <p className={styles.address}>{resolverAttestationNFT || "Not set"}</p>
            </div>
            <div className={styles.infoCard}>
              <h3>Schema UID</h3>
              <p className={styles.address}>{schemaUID || "N/A"}</p>
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
              <h3>Set Attestation Resolver (CrediblesV2)</h3>
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
                    disabled={isPending || isConfirming || !isCrediblesAdmin}
                  />
                </div>
                <button
                  type="submit"
                  disabled={isPending || isConfirming || !isCrediblesAdmin}
                  className={styles.submitButton}
                >
                  {isPending || isConfirming ? "Processing..." : "Set Resolver"}
                </button>
              </form>
            </div>
          </div>
        </section>

        {/* Admin Management */}
        <section className={styles.section}>
          <h2>Admin Management</h2>
          <div className={styles.operationsGrid}>
            <div className={styles.operationCard}>
              <h3>Add/Remove Admin</h3>
              <form onSubmit={handleAddAdmin} className={styles.form}>
                <div className={styles.inputGroup}>
                  <label htmlFor="admin-contract">Contract</label>
                  <select
                    id="admin-contract"
                    value={adminContract}
                    onChange={(e) => setAdminContract(e.target.value as "credibles" | "attestationNFT" | "resolver")}
                    disabled={isPending || isConfirming}
                  >
                    <option value="credibles">CrediblesV2</option>
                    <option value="attestationNFT">AttestationNFT</option>
                    <option value="resolver">AttestationResolver</option>
                  </select>
                </div>
                <div className={styles.inputGroup}>
                  <label htmlFor="admin-address">Admin Address</label>
                  <input
                    id="admin-address"
                    type="text"
                    value={adminAddress}
                    onChange={(e) => setAdminAddress(e.target.value)}
                    placeholder="0x..."
                    required
                    disabled={isPending || isConfirming}
                  />
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    type="submit"
                    disabled={isPending || isConfirming}
                    className={styles.submitButton}
                  >
                    {isPending || isConfirming ? "Processing..." : "Add Admin"}
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveAdmin}
                    disabled={isPending || isConfirming}
                    className={styles.submitButton}
                    style={{ background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)" }}
                  >
                    {isPending || isConfirming ? "Processing..." : "Remove Admin"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </section>

        {/* AttestationNFT Management */}
        <section className={styles.section}>
          <h2>AttestationNFT Management</h2>
          <div className={styles.operationsGrid}>
            <div className={styles.operationCard}>
              <h3>Set CrediblesV2 Contract</h3>
              <form onSubmit={handleSetAttestationNFTCredibles} className={styles.form}>
                <div className={styles.inputGroup}>
                  <label htmlFor="attestation-nft-credibles">CrediblesV2 Address</label>
                  <input
                    id="attestation-nft-credibles"
                    type="text"
                    value={attestationNFTCrediblesAddress}
                    onChange={(e) => setAttestationNFTCrediblesAddress(e.target.value)}
                    placeholder="0x..."
                    required
                    disabled={isPending || isConfirming || !isAttestationNFTAdmin}
                  />
                </div>
                <button
                  type="submit"
                  disabled={isPending || isConfirming || !isAttestationNFTAdmin}
                  className={styles.submitButton}
                >
                  {isPending || isConfirming ? "Processing..." : "Set CrediblesV2"}
                </button>
              </form>
            </div>

            <div className={styles.operationCard}>
              <h3>Set AttestationResolver</h3>
              <form onSubmit={handleSetAttestationNFTResolver} className={styles.form}>
                <div className={styles.inputGroup}>
                  <label htmlFor="attestation-nft-resolver">Resolver Address</label>
                  <input
                    id="attestation-nft-resolver"
                    type="text"
                    value={attestationNFTResolverAddress}
                    onChange={(e) => setAttestationNFTResolverAddress(e.target.value)}
                    placeholder="0x..."
                    required
                    disabled={isPending || isConfirming || !isAttestationNFTAdmin}
                  />
                </div>
                <button
                  type="submit"
                  disabled={isPending || isConfirming || !isAttestationNFTAdmin}
                  className={styles.submitButton}
                >
                  {isPending || isConfirming ? "Processing..." : "Set Resolver"}
                </button>
              </form>
            </div>
          </div>
        </section>

        {/* AttestationResolver Management */}
        <section className={styles.section}>
          <h2>AttestationResolver Management</h2>
          <div className={styles.operationsGrid}>
            <div className={styles.operationCard}>
              <h3>Set AttestationNFT Contract</h3>
              <form onSubmit={handleSetResolverAttestationNFT} className={styles.form}>
                <div className={styles.inputGroup}>
                  <label htmlFor="resolver-attestation-nft">AttestationNFT Address</label>
                  <input
                    id="resolver-attestation-nft"
                    type="text"
                    value={resolverAttestationNFTAddress}
                    onChange={(e) => setResolverAttestationNFTAddress(e.target.value)}
                    placeholder="0x..."
                    required
                    disabled={isPending || isConfirming || !isResolverAdmin}
                  />
                </div>
                <button
                  type="submit"
                  disabled={isPending || isConfirming || !isResolverAdmin}
                  className={styles.submitButton}
                >
                  {isPending || isConfirming ? "Processing..." : "Set AttestationNFT"}
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

