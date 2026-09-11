import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { parseEvidenceReference, validateEvidenceRequirement } from "./evidenceShared";

const verifyEvidenceInputSchema = z.object({
  reference: z.string().trim().min(1).max(500),
  deadline: z.string().trim().min(1).max(100),
});

export const verifyEvidenceOnServer = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    const data = verifyEvidenceInputSchema.parse(input);
    validateEvidenceRequirement(parseEvidenceReference(data.reference, data.deadline));
    return data;
  })
  .handler(async ({ data }) => {
    const [{ env }, { verifyEvidenceReference }, { createGitHubRestClient }] = await Promise.all([
      import("node:process"),
      import("./evidence"),
      import("./github"),
    ]);
    const token = env["GITHUB_TOKEN"]?.trim();

    return verifyEvidenceReference(data.reference, data.deadline, {
      githubClient: createGitHubRestClient(token ? { token } : {}),
    });
  });
