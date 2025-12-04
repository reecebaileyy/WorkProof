export interface Stats {
  dev: bigint;
  defi: bigint;
  gov: bigint;
  social: bigint;
}

export interface Attestation {
  uid: string;
  schema: string;
  time: number;
  recipient: string;
  attester: string;
  data: string;
}

export interface Talent {
  name: string;
  level: number;
  category: string;
}

