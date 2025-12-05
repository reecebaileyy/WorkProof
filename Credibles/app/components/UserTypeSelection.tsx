"use client";

import styles from "./UserTypeSelection.module.css";

interface UserTypeSelectionProps {
  onSelectUserType: (type: "user" | "issuer") => void;
}

export default function UserTypeSelection({ onSelectUserType }: UserTypeSelectionProps) {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Welcome to Credibles</h1>
        <p className={styles.subtitle}>Choose how you want to use the platform</p>
      </div>

      <div className={styles.options}>
        <button
          className={styles.optionCard}
          onClick={() => onSelectUserType("user")}
        >
          <div className={styles.icon}>🎓</div>
          <h2>I want to showcase my skills</h2>
          <p>
            Create your living resume with a SkillPet NFT that evolves as you complete tasks and earn attestations.
          </p>
          <ul className={styles.features}>
            <li>Mint your SkillPet NFT</li>
            <li>Complete daily tasks to level up</li>
            <li>Collect attestation NFTs from verified issuers</li>
            <li>Build your on-chain resume</li>
          </ul>
        </button>

        <button
          className={styles.optionCard}
          onClick={() => onSelectUserType("issuer")}
        >
          <div className={styles.icon}>🏢</div>
          <h2>I am an issuer</h2>
          <p>
            Verify your company or school email to issue attestations and mint NFTs for users.
          </p>
          <ul className={styles.features}>
            <li>Verify with company/school email</li>
            <li>Create attestations for users</li>
            <li>Auto-mint NFTs to user wallets</li>
            <li>Track your issued attestations</li>
          </ul>
        </button>
      </div>
    </div>
  );
}

