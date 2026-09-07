import type { Commitment } from "./mockData";

export type CreateCommitmentInput = Pick<
  Commitment,
  | "title"
  | "description"
  | "beneficiary"
  | "amount"
  | "token"
  | "deadline"
  | "condition"
  | "repository"
  | "pullRequest"
>;

export const blockchainService = {
  async createCommitment(input: CreateCommitmentInput) {
    await new Promise((resolve) => setTimeout(resolve, 650));
    return {
      commitmentId: "auth-142",
      transactionHash: "0xmockcreate9f4a…d12e",
      status: "demo-confirmed" as const,
      input,
    };
  },
  async getCommitment(id: string) {
    const { getCommitment } = await import("./mockData");
    return getCommitment(id);
  },
  async resolveCommitment(id: string) {
    await new Promise((resolve) => setTimeout(resolve, 450));
    return {
      commitmentId: id,
      transactionHash: "0xmockresolve4e21…8ab0",
      status: "demo-confirmed" as const,
    };
  },
  async getTransaction(hash: string) {
    return { hash, network: "Base (mock)", status: "confirmed", block: "18,422,091" };
  },
};
