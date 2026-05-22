# Chat SDK Discord End To End Phase

## Objective

Prove Centaur's phase-1 Chat SDK-shaped Discord path end to end on the local stack, using the code and configuration added in `chatsdk-discord-phase-1`.

## Original Request

Proceed end to end with the full phase goal for migrating phase 1 toward Chat SDK for Centaur chat ingress and onboarding Discord alongside Slack.

## Intake Summary

- Input shape: `specific`
- Audience: Centaur maintainers and operators validating platform onboarding.
- Authority: `requested`
- Proof type: `runtime`
- Completion proof: local build, local Helm deploy, in-cluster API workflow request, Discord webhook signature/request proof, and recorded receipts.
- Goal oracle: every hop from Discord-shaped input to Centaur durable workflow and final delivery obligation is proven locally, or any missing prerequisite is recorded as an explicit environment blocker with the exact command and error.
- Likely misfire: reporting unit tests as full E2E or testing against the DigitalOcean/prod context despite the repo's local-first rule.
- Blind spots considered: current kube context may point at a remote cluster, Discord public key and bot token may be absent, and final Discord delivery needs either real credentials or a local fake Discord API endpoint.

## Goal Oracle

The oracle for this goal is:

`A final receipt proves the Chat SDK/Discord path through local Centaur runtime surfaces: images build, Helm deploys to a local Kubernetes context, the generic chat_thread_turn workflow accepts a Discord event and executes, and the Slackbot Discord webhook validates signatures and hands off to Centaur. If a local runtime prerequisite is absent, the receipt names the exact unavailable prerequisite and no production/deploy-box path is used.`

The goal finishes only when the receipt maps each required hop to either a passing command or a concrete blocker.

## Current Tranche

Use the existing phase-1 implementation and run the largest safe local proof available: local cluster readiness, affected image builds, Helm deploy, API workflow E2E, and Discord webhook proof.

## Non-Negotiable Constraints

- Use local Kubernetes only. Do not use the DigitalOcean deploy context as a substitute for E2E.
- Preserve unrelated work and accept concurrent changes.
- Do not hardcode real secrets. Test Discord signing may use an ephemeral local Ed25519 keypair.
- Keep Slack compatibility intact.
- Record exact commands and outputs for anything that blocks runtime proof.

## Canonical Board

Machine truth lives at:

`docs/goals/chatsdk-discord-e2e-phase/state.yaml`

If this charter and `state.yaml` disagree, `state.yaml` wins for task status, active task, receipts, verification freshness, and completion truth.

## Run Command

`/goal Follow docs/goals/chatsdk-discord-e2e-phase/goal.md.`

