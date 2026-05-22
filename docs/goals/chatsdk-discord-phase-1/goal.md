# Chat SDK And Discord Phase 1

## Objective

Migrate Centaur phase 1 toward a Chat SDK-shaped durable chat surface and add Discord as a first-class onboarded platform alongside Slack, with enough Python-side protocol modeling to keep the API as the source of truth.

## Original Request

Explore the codebase and chat-sdk.dev, add whatever ignored Chat SDK reference is useful, prepare a GoalBuddy goal for migrating phase 1 to use Chat SDK for everything, and integrate end to end with Discord onboarding instead of only Slack, even if Python needs to reimplement Chat SDK concepts.

## Intake Summary

- Input shape: `specific`
- Audience: Centaur maintainers and operators onboarding chat platforms.
- Authority: `requested`
- Proof type: `test`
- Completion proof: local repo diff plus targeted tests or command output proving the new Discord configuration and Chat SDK-oriented API/contract code works without regressing Slack.
- Goal oracle: source-backed implementation plus local verification that exercises the added platform/configuration and any Chat SDK-shaped Python models.
- Likely misfire: only writing architecture notes or adding a vendored reference repo while leaving Slack-specific runtime assumptions unchanged.
- Blind spots considered: exact Chat SDK compatibility boundary, whether phase 1 needs UI package consumption or Python model parity first, Discord event auth and interaction semantics, local Kubernetes secret wiring, and avoiding production deploy-box testing.
- Existing plan facts: use the Chat SDK source/docs as the reference; add a gitignored local reference if helpful; Discord must be onboarded as a full-system platform, not a side tool; Python reimplementation of Chat SDK concepts may be required.

## Goal Oracle

The oracle for this goal is:

`A final board receipt maps code changes and verification output to: Chat SDK reference/onboarding exists, Centaur has a concrete phase-1 Chat SDK-shaped contract in the API/control-plane path, Discord configuration/onboarding is represented alongside Slack, and targeted local checks pass.`

The PM must keep comparing task receipts to this oracle. Planning, discovery, a passing tiny slice, or a clean-looking board is not enough. The goal finishes only when a final Judge/PM audit maps receipts and verification back to this oracle and records `full_outcome_complete: true`.

## Goal Kind

`specific`

## Current Tranche

Complete a local phase-1 vertical slice: ground the target in the real Centaur code and Chat SDK reference, add the smallest durable Python/API/configuration layer needed to model Chat SDK-style messages and platform onboarding, add Discord configuration surfaces beside Slack, and verify locally with tests or static checks available in this checkout.

## Non-Negotiable Constraints

- Follow the repo AGENTS.md: accept concurrent changes and do not revert unrelated work.
- Use local Kubernetes testing paths for E2E validation when a runtime stack is needed; do not touch the deploy box.
- Chat SDK means the Vercel Chat SDK; prefer source at `~/github/vercel/chat` when available and use docs as secondary reference.
- Keep Slack working while adding Discord as a first-class platform.
- Do not hardcode secrets; Discord tokens and signing/public keys must be environment or secret-manager backed.
- Keep implementation scoped to phase 1; record broader Chat SDK parity work as follow-up tasks instead of overbuilding.

## Stop Rule

Stop only when a final audit proves the full original owner outcome is complete.

Do not stop after planning, discovery, or Judge selection if a safe Worker task can be activated.

Do not stop after a single verified Worker package when the broader owner outcome still has safe local follow-up work. Advance the board to the next highest-leverage safe Worker package and continue unless a phase, risk, rejected-verification, ambiguity, or final-completion review is due.

## Slice Sizing

Safe means bounded, explicit, verified, and reversible. It does not mean tiny.

A good task is the largest safe useful slice.

For this tranche, prefer a vertical slice that changes real configuration, API/platform contract code, docs, and tests together over many disconnected helper-only changes.

## Canonical Board

Machine truth lives at:

`docs/goals/chatsdk-discord-phase-1/state.yaml`

If this charter and `state.yaml` disagree, `state.yaml` wins for task status, active task, receipts, verification freshness, and completion truth.

## Run Command

```text
/goal Follow docs/goals/chatsdk-discord-phase-1/goal.md.
```

## PM Loop

1. Read this charter.
2. Read `state.yaml`.
3. Work only on the active board task.
4. Write a compact task receipt before advancing.
5. Keep moving to the next safe local work package until the oracle is satisfied.
