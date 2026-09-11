import {
  GitHubApiError,
  createGitHubRestClient,
  type GitHubClient,
  type GitHubCommit,
} from "./github";
import {
  buildEvidenceReference,
  createDemoVerificationResult,
  parseDeadline,
  parseEvidenceReference,
  validateEvidenceRequirement,
  type EvidenceRequirement,
  type VerificationResult,
} from "./evidenceShared";

export {
  EvidenceValidationError,
  UnsupportedEvidenceTypeError,
  buildEvidenceReference,
  createDemoVerificationResult,
  parseEvidenceReference,
  validateEvidenceRequirement,
} from "./evidenceShared";
export type {
  CommitOnBranchEvidence,
  EvidenceRequirement,
  EvidenceType,
  IssueClosedEvidence,
  PullRequestMergedEvidence,
  VerificationResult,
  VerificationStatus,
} from "./evidenceShared";

type VerificationOptions = {
  githubClient?: GitHubClient;
  checkedAt?: Date;
};

function checkedAtIso(options: VerificationOptions) {
  return (options.checkedAt ?? new Date()).toISOString();
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
  if (!timestamp) {
    return "missing_timestamp" as const;
  }

  const evidenceTime = Date.parse(timestamp);
  if (!Number.isFinite(evidenceTime)) {
    return "missing_timestamp" as const;
  }

  return deadline === undefined || evidenceTime <= deadline ? "on_time" : "late";
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

        const mergedAt = pullRequest.merged_at;
        const deadlineStatus = compareToDeadline(mergedAt, deadline);
        if (deadlineStatus === "missing_timestamp" || !mergedAt) {
          return result(requirement, options, {
            verified: false,
            status: "deadline_uncertain",
            reason: "Pull request exists but GitHub did not provide a reliable merge timestamp.",
            githubUrl: pullRequest.html_url,
          });
        }

        if (deadlineStatus === "late") {
          return result(requirement, options, {
            verified: false,
            status: "failed",
            reason: "Pull request was merged after the promise deadline.",
            githubUrl: pullRequest.html_url,
            githubTimestamp: mergedAt,
          });
        }

        return result(requirement, options, {
          verified: true,
          status: "verified",
          reason: "Pull request was merged on GitHub before the deadline.",
          githubUrl: pullRequest.html_url,
          githubTimestamp: mergedAt,
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

        if (issue.state !== "closed") {
          return result(requirement, options, {
            verified: false,
            status: "failed",
            reason: "Issue exists but is not closed.",
            githubUrl: issue.html_url,
          });
        }

        const closedAt = issue.closed_at;
        const deadlineStatus = compareToDeadline(closedAt, deadline);
        if (deadlineStatus === "missing_timestamp" || !closedAt) {
          return result(requirement, options, {
            verified: false,
            status: "deadline_uncertain",
            reason: "Issue is closed but GitHub did not provide a reliable close timestamp.",
            githubUrl: issue.html_url,
          });
        }

        if (deadlineStatus === "late") {
          return result(requirement, options, {
            verified: false,
            status: "failed",
            reason: "Issue was closed after the promise deadline.",
            githubUrl: issue.html_url,
            githubTimestamp: closedAt,
          });
        }

        return result(requirement, options, {
          verified: true,
          status: "verified",
          reason: "Issue was closed on GitHub before the deadline.",
          githubUrl: issue.html_url,
          githubTimestamp: closedAt,
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
