import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import hardhat from "hardhat";

const { ethers } = hardhat;

const ONE_ETH = ethers.parseEther("1");
const TWO_ETH = ethers.parseEther("2");

async function deployFixture() {
  const [owner, creator, beneficiary, resolver, stranger, replacementResolver] =
    await ethers.getSigners();

  const contract = await ethers.deployContract("CommitChain", [resolver.address], owner);

  return {
    contract,
    owner,
    creator,
    beneficiary,
    resolver,
    stranger,
    replacementResolver,
  };
}

async function createCommitmentFixture() {
  const fixture = await deployFixture();
  const deadline = BigInt(await time.latest()) + 3_600n;

  const tx = await fixture.contract
    .connect(fixture.creator)
    .createCommitment(
      fixture.beneficiary.address,
      deadline,
      "Ship the first public beta",
      "github_pr",
      "https://github.com/example/repo/pull/123",
      { value: ONE_ETH },
    );
  const receipt = await tx.wait();

  return {
    ...fixture,
    deadline,
    receipt,
  };
}

describe("PromiseChain", function () {
  it("creates a commitment successfully", async function () {
    const { contract, creator, beneficiary, deadline, receipt } =
      await loadFixture(createCommitmentFixture);

    const commitment = await contract.getCommitment(1);

    expect(commitment.creator).to.equal(creator.address);
    expect(commitment.beneficiary).to.equal(beneficiary.address);
    expect(commitment.amount).to.equal(ONE_ETH);
    expect(commitment.deadline).to.equal(deadline);
    expect(commitment.description).to.equal("Ship the first public beta");
    expect(commitment.evidenceType).to.equal("github_pr");
    expect(commitment.evidenceReference).to.equal("https://github.com/example/repo/pull/123");
    expect(Number(commitment.status)).to.equal(0);
    expect(receipt).to.not.be.null;
  });

  it("rejects zero ETH", async function () {
    const { contract, creator, beneficiary } = await loadFixture(deployFixture);
    const deadline = BigInt(await time.latest()) + 3_600n;

    await expect(
      contract
        .connect(creator)
        .createCommitment(
          beneficiary.address,
          deadline,
          "Ship the first public beta",
          "github_pr",
          "https://github.com/example/repo/pull/123",
        ),
    ).to.be.revertedWithCustomError(contract, "ZeroAmount");
  });

  it("rejects invalid beneficiary", async function () {
    const { contract, creator } = await loadFixture(deployFixture);
    const deadline = BigInt(await time.latest()) + 3_600n;

    await expect(
      contract
        .connect(creator)
        .createCommitment(
          ethers.ZeroAddress,
          deadline,
          "Ship the first public beta",
          "github_pr",
          "https://github.com/example/repo/pull/123",
          { value: ONE_ETH },
        ),
    ).to.be.revertedWithCustomError(contract, "InvalidBeneficiary");
  });

  it("rejects invalid deadline", async function () {
    const { contract, creator, beneficiary } = await loadFixture(deployFixture);
    const pastDeadline = BigInt(await time.latest()) - 1n;

    await expect(
      contract
        .connect(creator)
        .createCommitment(
          beneficiary.address,
          pastDeadline,
          "Ship the first public beta",
          "github_pr",
          "https://github.com/example/repo/pull/123",
          { value: ONE_ETH },
        ),
    ).to.be.revertedWithCustomError(contract, "InvalidDeadline");
  });

  it("stores creator, beneficiary, amount, deadline, and description", async function () {
    const { contract, creator, beneficiary, deadline } = await loadFixture(createCommitmentFixture);

    const commitment = await contract.getCommitment(1);

    expect(commitment.creator).to.equal(creator.address);
    expect(commitment.beneficiary).to.equal(beneficiary.address);
    expect(commitment.amount).to.equal(ONE_ETH);
    expect(commitment.deadline).to.equal(deadline);
    expect(commitment.description).to.equal("Ship the first public beta");
  });

  it("emits CommitmentCreated", async function () {
    const { contract, creator, beneficiary } = await loadFixture(deployFixture);
    const deadline = BigInt(await time.latest()) + 3_600n;

    await expect(
      contract
        .connect(creator)
        .createCommitment(
          beneficiary.address,
          deadline,
          "Ship the first public beta",
          "github_pr",
          "https://github.com/example/repo/pull/123",
          { value: ONE_ETH },
        ),
    )
      .to.emit(contract, "CommitmentCreated")
      .withArgs(
        1n,
        creator.address,
        beneficiary.address,
        ONE_ETH,
        deadline,
        "Ship the first public beta",
        "github_pr",
        "https://github.com/example/repo/pull/123",
      );
  });

  it("lets the resolver submit evidence and blocks edits after resolution", async function () {
    const { contract, resolver } = await loadFixture(createCommitmentFixture);

    await expect(
      contract
        .connect(resolver)
        .submitEvidence(1, "github_pr", "https://github.com/example/repo/pull/123"),
    )
      .to.emit(contract, "EvidenceSubmitted")
      .withArgs(1n, "github_pr", "https://github.com/example/repo/pull/123");

    await contract.connect(resolver).resolveCommitment(1, true);

    await expect(
      contract
        .connect(resolver)
        .submitEvidence(1, "github_pr", "https://github.com/example/repo/pull/124"),
    ).to.be.revertedWithCustomError(contract, "CommitmentAlreadyResolved");
  });

  it("rejects unauthorized evidence submission and resolution", async function () {
    const { contract, stranger } = await loadFixture(createCommitmentFixture);

    await expect(
      contract
        .connect(stranger)
        .submitEvidence(1, "github_pr", "https://github.com/example/repo/pull/123"),
    ).to.be.revertedWithCustomError(contract, "UnauthorizedResolver");

    await expect(
      contract.connect(stranger).resolveCommitment(1, true),
    ).to.be.revertedWithCustomError(contract, "UnauthorizedResolver");
  });

  it("allows the resolver to mark success and sends ETH to the beneficiary", async function () {
    const { contract, resolver, beneficiary } = await loadFixture(createCommitmentFixture);

    await expect(contract.connect(resolver).resolveCommitment(1, true)).to.changeEtherBalances(
      [beneficiary, contract],
      [ONE_ETH, -ONE_ETH],
    );

    const commitment = await contract.getCommitment(1);
    expect(Number(commitment.status)).to.equal(2);
  });

  it("allows the resolver to mark failure and refunds the creator after the deadline", async function () {
    const { contract, resolver, creator } = await loadFixture(createCommitmentFixture);
    const commitment = await contract.getCommitment(1);
    await time.increaseTo(Number(commitment.deadline) + 1);

    await expect(contract.connect(resolver).resolveCommitment(1, false)).to.changeEtherBalances(
      [creator, contract],
      [ONE_ETH, -ONE_ETH],
    );

    const resolved = await contract.getCommitment(1);
    expect(Number(resolved.status)).to.equal(3);
  });

  it("rejects failure resolution before the deadline", async function () {
    const { contract, resolver } = await loadFixture(createCommitmentFixture);

    await expect(
      contract.connect(resolver).resolveCommitment(1, false),
    ).to.be.revertedWithCustomError(contract, "DeadlineNotReached");
  });

  it("prevents double resolution", async function () {
    const { contract, resolver } = await loadFixture(createCommitmentFixture);

    await contract.connect(resolver).resolveCommitment(1, true);

    await expect(
      contract.connect(resolver).resolveCommitment(1, true),
    ).to.be.revertedWithCustomError(contract, "CommitmentAlreadyResolved");
  });

  it("prevents direct ether transfers to the contract", async function () {
    const { contract, owner } = await loadFixture(createCommitmentFixture);

    await expect(
      owner.sendTransaction({
        to: await contract.getAddress(),
        value: TWO_ETH,
      }),
    ).to.be.reverted;
  });

  it("keeps multiple commitments independent", async function () {
    const { contract, creator, beneficiary, resolver, replacementResolver } =
      await loadFixture(deployFixture);
    const firstDeadline = BigInt(await time.latest()) + 3_600n;
    const secondDeadline = BigInt(await time.latest()) + 7_200n;

    await contract
      .connect(creator)
      .createCommitment(
        beneficiary.address,
        firstDeadline,
        "Ship the first public beta",
        "github_pr",
        "https://github.com/example/repo/pull/123",
        { value: ONE_ETH },
      );
    await contract
      .connect(creator)
      .createCommitment(
        replacementResolver.address,
        secondDeadline,
        "Launch the mobile beta",
        "github_pr",
        "https://github.com/example/repo/pull/456",
        { value: TWO_ETH },
      );

    await contract.connect(resolver).resolveCommitment(1, true);
    const secondCommitment = await contract.getCommitment(2);
    expect(Number(secondCommitment.status)).to.equal(0);

    await time.increaseTo(Number(secondDeadline) + 1);
    await contract.connect(resolver).resolveCommitment(2, false);

    const firstCommitment = await contract.getCommitment(1);
    const resolvedSecondCommitment = await contract.getCommitment(2);
    expect(Number(firstCommitment.status)).to.equal(2);
    expect(Number(resolvedSecondCommitment.status)).to.equal(3);
  });

  it("lets the owner update the resolver safely", async function () {
    const { contract, owner, replacementResolver, stranger } = await loadFixture(deployFixture);

    await expect(contract.connect(stranger).setResolver(replacementResolver.address)).to.be
      .reverted;
    await contract.connect(owner).setResolver(replacementResolver.address);

    expect(await contract.resolver()).to.equal(replacementResolver.address);
  });
});
