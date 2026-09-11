export type GitHubRepository = {
  full_name: string;
  html_url: string;
};

export type GitHubPullRequest = {
  number: number;
  html_url: string;
  state: string;
  merged_at: string | null;
};

export type GitHubIssue = {
  number: number;
  html_url: string;
  state: string;
  closed_at: string | null;
  pull_request?: unknown;
};

export type GitHubCommit = {
  sha: string;
  html_url: string;
  commit?: {
    author?: {
      date?: string | null;
    } | null;
    committer?: {
      date?: string | null;
    } | null;
  } | null;
};

export type GitHubCompare = {
  status: "ahead" | "behind" | "diverged" | "identical";
  ahead_by: number;
  behind_by: number;
  html_url?: string;
};

export type GitHubClient = {
  getRepository(repository: string): Promise<GitHubRepository>;
  getPullRequest(repository: string, pullRequestNumber: number): Promise<GitHubPullRequest>;
  getIssue(repository: string, issueNumber: number): Promise<GitHubIssue>;
  getCommit(repository: string, commitSha: string): Promise<GitHubCommit>;
  compareCommits(repository: string, base: string, head: string): Promise<GitHubCompare>;
};

export class GitHubApiError extends Error {
  status: number;
  code: "not_found" | "rate_limited" | "forbidden" | "server_error" | "network" | "unknown";

  constructor(message: string, status: number, code: GitHubApiError["code"] = "unknown") {
    super(message);
    this.name = "GitHubApiError";
    this.status = status;
    this.code = code;
  }
}

type GitHubClientOptions = {
  fetchImpl?: typeof fetch;
  token?: string;
};

function classifyStatus(status: number): GitHubApiError["code"] {
  if (status === 404) {
    return "not_found";
  }
  if (status === 403 || status === 429) {
    return "rate_limited";
  }
  if (status >= 500) {
    return "server_error";
  }
  if (status >= 400) {
    return "forbidden";
  }
  return "unknown";
}

function assertRecord(value: unknown, context: string): Record<string, unknown> {
  if (!value || typeof value !== "object") {
    throw new GitHubApiError(`Malformed GitHub response for ${context}`, 502, "unknown");
  }
  return value as Record<string, unknown>;
}

export function createGitHubRestClient(options: GitHubClientOptions = {}): GitHubClient {
  const fetchImpl = options.fetchImpl ?? fetch;
  const baseUrl = "https://api.github.com";

  async function request<T>(path: string, context: string): Promise<T> {
    let response: Response;
    try {
      response = await fetchImpl(`${baseUrl}${path}`, {
        headers: {
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
          ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
        },
      });
    } catch (cause) {
      throw new GitHubApiError(
        cause instanceof Error ? cause.message : `Network failure while loading ${context}`,
        0,
        "network",
      );
    }

    if (!response.ok) {
      throw new GitHubApiError(
        `GitHub returned ${response.status} for ${context}`,
        response.status,
        classifyStatus(response.status),
      );
    }

    return (await response.json()) as T;
  }

  return {
    async getRepository(repository) {
      const data = assertRecord(
        await request<unknown>(`/repos/${repository}`, `repository ${repository}`),
        `repository ${repository}`,
      );
      if (typeof data["full_name"] !== "string" || typeof data["html_url"] !== "string") {
        throw new GitHubApiError(`Malformed repository response for ${repository}`, 502, "unknown");
      }
      return data as GitHubRepository;
    },

    async getPullRequest(repository, pullRequestNumber) {
      const data = assertRecord(
        await request<unknown>(
          `/repos/${repository}/pulls/${pullRequestNumber}`,
          `pull request ${repository}#${pullRequestNumber}`,
        ),
        `pull request ${repository}#${pullRequestNumber}`,
      );
      if (typeof data["html_url"] !== "string" || typeof data["state"] !== "string") {
        throw new GitHubApiError(
          `Malformed pull request response for ${repository}#${pullRequestNumber}`,
          502,
          "unknown",
        );
      }
      return data as GitHubPullRequest;
    },

    async getIssue(repository, issueNumber) {
      const data = assertRecord(
        await request<unknown>(
          `/repos/${repository}/issues/${issueNumber}`,
          `issue ${repository}#${issueNumber}`,
        ),
        `issue ${repository}#${issueNumber}`,
      );
      if (typeof data["html_url"] !== "string" || typeof data["state"] !== "string") {
        throw new GitHubApiError(
          `Malformed issue response for ${repository}#${issueNumber}`,
          502,
          "unknown",
        );
      }
      return data as GitHubIssue;
    },

    async getCommit(repository, commitSha) {
      const data = assertRecord(
        await request<unknown>(
          `/repos/${repository}/commits/${commitSha}`,
          `commit ${repository}@${commitSha}`,
        ),
        `commit ${repository}@${commitSha}`,
      );
      if (typeof data["sha"] !== "string" || typeof data["html_url"] !== "string") {
        throw new GitHubApiError(
          `Malformed commit response for ${repository}@${commitSha}`,
          502,
          "unknown",
        );
      }
      return data as GitHubCommit;
    },

    async compareCommits(repository, base, head) {
      const data = assertRecord(
        await request<unknown>(
          `/repos/${repository}/compare/${encodeURIComponent(base)}...${encodeURIComponent(head)}`,
          `compare ${repository} ${base}...${head}`,
        ),
        `compare ${repository} ${base}...${head}`,
      );
      if (typeof data["status"] !== "string") {
        throw new GitHubApiError(
          `Malformed compare response for ${repository} ${base}...${head}`,
          502,
          "unknown",
        );
      }
      return data as GitHubCompare;
    },
  };
}
