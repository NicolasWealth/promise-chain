import {
  GitHubApiError,
  createGitHubRestClient,
  type GitHubClient,
  type GitHubCommit,
} from "./github";

export type EvidenceType = "PR_MERGED" | "ISSUE_CLOSED" | "COMMIT_ON_BRANCH";

export type PullRequestMergedEvidence = {
  evidenceType: "PR_MERGED";
  repository: string;
  pullRequestNumber: number;
  deadline?: string | number | Date;
};

export type IssueClosedEvidence = {
  evidenceType: "ISSUE_CLOSED";
  repository: string;
  issueNumber: number;
  deadline?: string | number | Date;
};

export type CommitOnBranchEvidence = {
  evidenceType: "COMMIT_ON_BRANCH";
  repository: string;
  commitSha: string;
  branch: string;
  deadline?: string | number | Date;
};

export type EvidenceRequirement =
  PullRequestMergedEvidence | IssueClosedEvidence | CommitOnBranchEvidence;

export type VerificationStatus =
  "verified" | "failed" | "not_found" | "error" | "unsupported" | "deadline_uncertain" | "demo";

export type VerificationResult = {
  verified: boolean;
  evidenceType: EvidenceType;
  repository: string;
  reference: string;
  checkedAt: string;
  reason: string;
  status: VerificationStatus;
  provider: "github" | "demo";
  githubUrl?: string;
  githubTimestamp?: string;
  errorCode?: string;
};

export class EvidenceValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EvidenceValidationError";
  }
}

export class UnsupportedEvidenceTypeError extends EvidenceValidationError {
  constructor(evidenceType: string) {
    super(`Unsupported evidence type: ${evidenceType}`);
    this.name = "UnsupportedEvidenceTypeError";
  }
}

type VerificationOptions = {
  githubClient?: GitHubClient;
  checkedAt?: Date;
};

const repositoryPattern = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
const shaPattern = /^[a-fA-F0-9]{7,40}$/;

function checkedAtIso(options: VerificationOptions) {
  return (options.checkedAt ?? new Date()).toISOString();
}

function parseDeadline(deadline: string | number | Date | undefined) {
  if (deadline === undefined) {
    return undefined;
  }

  const timestamp = deadline instanceof Date ? deadline.getTime() : Date.parse(String(deadline));
  if (!Number.isFinite(timestamp)) {
    throw new EvidenceValidationError("Deadline must be a valid date");
  }

  return timestamp;
}

function validateRepository(repository: string) {
  if (!repositoryPattern.test(repository)) {
    throw new EvidenceValidationError("Repository must use owner/repository format");
  }
}

function validatePositiveInteger(value: number, label: string) {
  if (!Number.isInteger(value) || value <= 0) {
    throw new EvidenceValidationError(`${label} must be a positive integer`);
  }
}

function validateCommitSha(commitSha: string) {
  if (!shaPattern.test(commitSha)) {
    throw new EvidenceValidationError("Commit SHA must be a 7 to 40 character hexadecimal value");
  }
}

function validateBranch(branch: string) {
  if (!branch.trim()) {
    throw new EvidenceValidationError("Branch name is required");
  }
}

export function validateEvidenceRequirement(requirement: EvidenceRequirement) {
  validateRepository(requirement.repository);

  switch (requirement.evidenceType) {
    case "PR_MERGED":
      validatePositiveInteger(requirement.pullRequestNumber, "Pull request number");
      break;
    case "ISSUE_CLOSED":
      validatePositiveInteger(requirement.issueNumber, "Issue number");
      break;
    case "COMMIT_ON_BRANCH":
      validateCommitSha(requirement.commitSha);
      validateBranch(requirement.branch);
      break;
    default:
      throw new UnsupportedEvidenceTypeError(
        (requirement as { evidenceType: string }).evidenceType,
      );
  }

  parseDeadline(requirement.deadline);
}

export function buildEvidenceReference(requirement: EvidenceRequirement) {
  validateEvidenceRequirement(requirement);

  switch (requirement.evidenceType) {
    case "PR_MERGED":
      return `github:pr:${requirement.repository}#${requirement.pullRequestNumber}`;
    case "ISSUE_CLOSED":
      return `github:issue:${requirement.repository}#${requirement.issueNumber}`;
    case "COMMIT_ON_BRANCH":
      return `github:commit:${requirement.repository}@${requirement.commitSha}:${requirement.branch}`;
  }
}

export function parseEvidenceReference(
  reference: string,
  deadline?: string | number | Date,
): EvidenceRequirement {
  const pullRequestMatch = reference.match(/^github:pr:([A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+)#(\d+)$/);
  if (pullRequestMatch) {
    const repository = pullRequestMatch[1];
    const pullRequestNumber = pullRequestMatch[2];
    if (!repository || !pullRequestNumber) {
      throw new EvidenceValidationError("Evidence reference is not a supported GitHub reference");
    }

    const requirement: PullRequestMergedEvidence = {
      evidenceType: "PR_MERGED",
      repository,
      pullRequestNumber: Number(pullRequestNumber),
    };
    return deadline === undefined ? requirement : { ...requirement, deadline };
  }

  const issueMatch = reference.match(/^github:issue:([A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+)#(\d+)$/);
  if (issueMatch) {
    const repository = issueMatch[1];
    const issueNumber = issueMatch[2];
    if (!repository || !issueNumber) {
      throw new EvidenceValidationError("Evidence reference is not a supported GitHub reference");
    }

    const requirement: IssueClosedEvidence = {
      evidenceType: "ISSUE_CLOSED",
      repository,
      issueNumber: Number(issueNumber),
    };
    return deadline === undefined ? requirement : { ...requirement, deadline };
  }

  const commitMatch = reference.match(
    /^github:commit:([A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+)@([a-fA-F0-9]{7,40}):(.+)$/,
  );
  if (commitMatch) {
    const repository = commitMatch[1];
    const commitSha = commitMatch[2];
    const branch = commitMatch[3];
    if (!repository || !commitSha || !branch) {
      throw new EvidenceValidationError("Evidence reference is not a supported GitHub reference");
    }

    const requirement: CommitOnBranchEvidence = {
      evidenceType: "COMMIT_ON_BRANCH",
      repository,
      commitSha,
      branch,
    };
    return deadline === undefined ? requirement : { ...requirement, deadline };
  }

  throw new EvidenceValidationError("Evidence reference is not a supported GitHub reference");
}

function result(
  requirement: EvidenceRequirement,
  options: VerificationOptions,
  data: Omit<
    VerificationResult,
    "evidenceType" | "repository" | "reference" | "checkedAt" | "provider"
  >,
): VerificationResult {
  return {
    evidenceType: requirement.evidenceType,
    repository: requirement.repository,
    reference: buildEvidenceReference(requirement),
    checkedAt: checkedAtIso(options),
    provider: "github",
    ...data,
  };
}

function compareToDeadline(timestamp: string | null | undefined, deadline: number | undefined) {
  if (deadline === undefined) {
    return "no_deadline" as const;
  }
  if (!timestamp) {
    return "missing_timestamp" as const;
  }

  const evidenceTime = Date.parse(timestamp);
  if (!Number.isFinite(evidenceTime)) {
    return "missing_timestamp" as const;
  }

  return evidenceTime <= deadline ? "on_time" : "late";
}

function apiErrorResult(
  requirement: EvidenceRequirement,
  options: VerificationOptions,
  error: unknown,
): VerificationResult {
  if (error instanceof GitHubApiError && error.code === "not_found") {
    return result(requirement, options, {
      verified: false,
      status: "not_found",
      reason: "GitHub could not find the requested repository or evidence.",
      errorCode: error.code,
    });
  }

  if (error instanceof GitHubApiError) {
    return result(requirement, options, {
      verified: false,
      status: "error",
      reason: error.message,
      errorCode: error.code,
    });
  }

  return result(requirement, options, {
    verified: false,
    status: "error",
    reason: error instanceof Error ? error.message : "GitHub verification failed.",
    errorCode: "unknown",
  });
}

function commitTimestamp(commit: GitHubCommit) {
  return commit.commit?.committer?.date ?? commit.commit?.author?.date ?? undefined;
}

export async function verifyEvidence(
  requirement: EvidenceRequirement,
  options: VerificationOptions = {},
): Promise<VerificationResult> {
  validateEvidenceRequirement(requirement);

  const githubClient = options.githubClient ?? createGitHubRestClient();
  const deadline = parseDeadline(requirement.deadline);

  try {
    await githubClient.getRepository(requirement.repository);

    switch (requirement.evidenceType) {
      case "PR_MERGED": {
        const pullRequest = await githubClient.getPullRequest(
          requirement.repository,
          requirement.pullRequestNumber,
        );

        if (!pullRequest.merged_at) {
          return result(requirement, options, {
            verified: false,
            status: "failed",
            reason: "Pull request exists but has not been merged.",
            githubUrl: pullRequest.html_url,
          });
        }

        const deadlineStatus = compareToDeadline(pullRequest.merged_at, deadline);
        if (deadlineStatus === "late") {
          return result(requirement, options, {
            verified: false,
            status: "failed",
            reason: "Pull request was merged after the promise deadline.",
            githubUrl: pullRequest.html_url,
            githubTimestamp: pullRequest.merged_at,
          });
        }

        return result(requirement, options, {
          verified: true,
          status: "verified",
          reason: "Pull request was merged on GitHub before the deadline.",
          githubUrl: pullRequest.html_url,
          githubTimestamp: pullRequest.merged_at,
        });
      }

      case "ISSUE_CLOSED": {
        const issue = await githubClient.getIssue(requirement.repository, requirement.issueNumber);

        if (issue.pull_request) {
          return result(requirement, options, {
            verified: false,
            status: "failed",
            reason: "GitHub reference points to a pull request, not an issue.",
            githubUrl: issue.html_url,
          });
        }

        if (issue.state !== "closed" || !issue.closed_at) {
          return result(requirement, options, {
            verified: false,
            status: "failed",
            reason: "Issue exists but is not closed.",
            githubUrl: issue.html_url,
          });
        }

        const deadlineStatus = compareToDeadline(issue.closed_at, deadline);
        if (deadlineStatus === "late") {
          return result(requirement, options, {
            verified: false,
            status: "failed",
            reason: "Issue was closed after the promise deadline.",
            githubUrl: issue.html_url,
            githubTimestamp: issue.closed_at,
          });
        }

        return result(requirement, options, {
          verified: true,
          status: "verified",
          reason: "Issue was closed on GitHub before the deadline.",
          githubUrl: issue.html_url,
          githubTimestamp: issue.closed_at,
        });
      }

      case "COMMIT_ON_BRANCH": {
        const commit = await githubClient.getCommit(requirement.repository, requirement.commitSha);
        const comparison = await githubClient.compareCommits(
          requirement.repository,
          requirement.commitSha,
          requirement.branch,
        );

        const reachable = comparison.status === "ahead" || comparison.status === "identical";
        if (!reachable) {
          return result(requirement, options, {
            verified: false,
            status: "failed",
            reason: "Commit exists but is not reachable from the specified branch.",
            githubUrl: commit.html_url,
          });
        }

        const timestamp = commitTimestamp(commit);
        const deadlineStatus = compareToDeadline(timestamp, deadline);
        if (deadlineStatus === "missing_timestamp") {
          return result(requirement, options, {
            verified: false,
            status: "deadline_uncertain",
            reason: "GitHub did not provide enough commit timestamp data to verify the deadline.",
            githubUrl: commit.html_url,
          });
        }

        if (deadlineStatus === "late") {
          return result(requirement, options, {
            verified: false,
            status: "failed",
            reason: "Commit timestamp is after the promise deadline.",
            githubUrl: commit.html_url,
            ...(timestamp ? { githubTimestamp: timestamp } : {}),
          });
        }

        return result(requirement, options, {
          verified: true,
          status: "verified",
          reason: "Commit is reachable from the branch and satisfies the deadline.",
          githubUrl: commit.html_url,
          ...(timestamp ? { githubTimestamp: timestamp } : {}),
        });
      }
    }
  } catch (error) {
    return apiErrorResult(requirement, options, error);
  }
}

export async function verifyEvidenceReference(
  reference: string,
  deadline?: string | number | Date,
  options: VerificationOptions = {},
) {
  return verifyEvidence(parseEvidenceReference(reference, deadline), options);
}

export function createDemoVerificationResult(commitment: {
  repository: string;
  condition: string;
  mergeStatus: string;
  mergeDate?: string;
}): VerificationResult {
  const verificationResult: VerificationResult = {
    verified: commitment.mergeStatus === "merged",
    evidenceType: "PR_MERGED",
    repository: commitment.repository,
    reference: commitment.condition,
    checkedAt: new Date().toISOString(),
    reason:
      commitment.mergeStatus === "merged"
        ? "Demo evidence from seeded data. This was not verified through GitHub."
        : "Demo evidence is not verified through GitHub.",
    status: "demo",
    provider: "demo",
  };
  if (commitment.mergeDate) {
    verificationResult.githubTimestamp = commitment.mergeDate;
  }
  return verificationResult;
}

export const evidenceService = {
  verifyEvidence,
  verifyEvidenceReference,
  buildEvidenceReference,
  parseEvidenceReference,
  createDemoVerificationResult,

  async verifyGitHubPullRequest(repository: string, pullRequest: number) {
    return verifyEvidence({
      evidenceType: "PR_MERGED",
      repository,
      pullRequestNumber: pullRequest,
    });
  },
};
