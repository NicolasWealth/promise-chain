export const evidenceService = {
  async verifyGitHubPullRequest(repository: string, pullRequest: number) {
    await new Promise((resolve) => setTimeout(resolve, 350));
    return { repository, pullRequest, verified: repository === "project-alpha/app" && pullRequest === 142, provider: "github" as const };
  },
};
