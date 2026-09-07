# Commit & Deliver

Build a polished modern consumer SaaS web app called CommitChain.

CommitChain is an accountability platform for Web3 projects. Users create funded commitments with measurable success conditions. Funds are represented as escrowed assets. Commitments have deadlines, evidence, and public outcomes. The eventual blockchain implementation will run on Base, but for this MVP the blockchain and GitHub verification should use realistic mock data.

Product positioning

Primary message:

Make promises worth keeping.

Supporting message:

Commit funds. Set measurable outcomes. Build a public track record of delivering.

Do not present this as a generic crypto dashboard. It should feel like a premium modern SaaS product similar in visual quality and simplicity to Linear, Stripe, or Vercel.

Avoid crypto clichés such as excessive neon, glowing blockchain graphics, giant coins, futuristic backgrounds, or cluttered trading-dashboard layouts.

Technical requirements

Use:

React

TypeScript

Tailwind CSS

Component-based architecture

Client-side routing

Responsive design

Reusable UI components

Do not implement smart contracts yet.

Do not implement real wallet connection yet.

Do not implement real GitHub API integration yet.

Use mock data and clear service interfaces so real Wagmi/Viem, Base, Firebase, and GitHub integrations can replace the mocks later without restructuring the entire application.

Keep the code clean and easy to continue developing in a normal React/TypeScript environment.

Do not add unnecessary dependencies.

Pages

Create exactly these six primary pages:

1. Landing page

Hero:

Make promises worth keeping.

Supporting text:

Commit funds. Set measurable outcomes. Build a public track record of delivering.

Primary CTA:
Create a commitment

Secondary CTA:
Explore commitments

Include a simple visual explanation:

Create → Lock → Deliver → Verify → Resolve

Include a polished example commitment card showing:

Build authentication system

Active

$5,000 USDC

GitHub PR #142 merged

12 days remaining

progress indicator

Include a section explaining why CommitChain exists.

Include a public reputation example.

Finish with a strong CTA.

The landing page should look like a real startup product, not a hackathon template.

2. Dashboard

Header:

CommitChain logo/name

Dashboard

Commitments

Profile

Connect Wallet button

Dashboard summary cards:

Total commitments

Active

Completed

Failed

Funds committed

Commitment list with filters:

All

Active

Completed

Failed

Each commitment card should show:

Title

Status

Amount

Deadline

Success condition

Progress

Creator or beneficiary

View commitment action

Include a prominent:
+ Create commitment

button.

3. Create Commitment

Create a clean multi-section form.

Fields:

Commitment title

Description

Beneficiary wallet

Escrow amount

Token

Deadline

Evidence type

GitHub repository

Required pull request number

Evidence type should currently default to:
GitHub Pull Request

Show a preview card on the right on desktop.

Preview should update based on form values.

Final CTA:
Create commitment

Since blockchain is mocked, clicking the button should show a polished transaction confirmation state and then route to the commitment details page.

Do not pretend a real transaction happened.

Use a clear mock state such as:
Demo transaction confirmed

4. Commitment Details

This is the most important product page.

Display:

Commitment title

Status

Description

Escrow amount

Creator

Beneficiary

Deadline

Success condition

Evidence

Timeline

Transaction information

Create a strong visual status header.

For an active commitment:

ACTIVE

12 days remaining

Show the escrow amount prominently.

Evidence section:

Verification condition

GitHub PR #142 must be merged before September 20.

Show mocked GitHub evidence:

Repository

PR number

PR title

Author

Created date

Merge status

Merge date

Show:

Evidence verified

when appropriate.

Include transaction references as shortened mock hashes with explorer-style links.

Add a timeline:

Commitment created
↓
Funds locked
↓
Work submitted
↓
Evidence verified
↓
Funds released

Use a visually clear timeline component.

5. Resolution / Evidence

Create a dedicated resolution state that demonstrates the core product mechanism.

For a successful commitment show:

Commitment completed

The required GitHub evidence was submitted before the deadline.

Show:

Evidence

Verification result

Escrow amount

Resolution

Funds released

Completion timestamp

For a failed commitment show:

Commitment failed

The required condition was not satisfied before the deadline.

Show:

Deadline

Missing evidence

Resolution

Escrow outcome

Make both states visually polished.

Use mocked data.

6. Public Profile

Create a public project profile.

Example:

Project Alpha

Show:

Completion rate

Total commitments

Completed

Active

Failed

Total value committed

Create a reputation/history section showing previous commitments.

Example:

Build authentication system
Completed
$5,000 USDC

Launch mobile beta
Completed
$3,000 USDC

Publish security audit
Failed
$2,500 USDC

Make the profile feel like a verifiable professional track record rather than a social media profile.

Components

Build reusable components for:

Navbar

Wallet button

Commitment card

Status badge

Stat card

Progress indicator

Timeline

Evidence panel

Transaction row

Profile statistics

Empty states

Loading states

Confirmation modal

Form fields

Mock data

Create realistic mock commitments with a mixture of:

Active

Completed

Failed

Use realistic wallet addresses and transaction hashes.

Use USDC and ETH values.

Make the mock data consistent across dashboard, details, resolution, and profile pages.

Visual design

Use a light-first interface.

Prioritize:

clean typography

generous whitespace

subtle borders

restrained shadows

rounded cards

strong hierarchy

excellent spacing

responsive layouts

polished hover states

subtle transitions

Use a restrained neutral base with one distinctive brand accent.

Do not use excessive gradients.

Do not use excessive glassmorphism.

Do not use stock imagery.

Do not use illustrations of coins, chains, blocks, or generic crypto imagery.

The interface should feel credible enough to show to investors or enterprise users.

Responsive behavior

Desktop should feel spacious and structured.

Mobile should collapse navigation cleanly and stack dashboard cards and commitment information without losing hierarchy.

Ensure all major flows work on mobile.

Important architecture constraint

Keep blockchain interaction behind a service abstraction.

Create something similar to:

services/blockchain.ts

with mocked functions such as:

createCommitment

getCommitment

resolveCommitment

getTransaction

Create a separate evidence abstraction:

services/evidence.ts

with mocked GitHub verification functions.

This allows Antigravity to replace the mock services later with:

Wagmi

Viem

Base

Firebase

GitHub API

without rebuilding the UI.

Important scope constraint

Do NOT:

create a smart contract

configure Firebase

integrate real GitHub authentication

integrate real wallet transactions

create a token

create DAO governance

create an admin panel

create multi-chain functionality

create an oracle system

This task is strictly the polished frontend MVP and its mock application logic.

Make the finished application feel coherent from landing page through commitment creation, evidence verification, resolution, and public reputation.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
