# Fair Value Guide

This document helps you turn raw research into a `fair_yes_probability` that is disciplined enough for `manual_signals.json`.

## Universal rule

Your fair value should come from a repeatable process, not from a vibe.

Good:

- "Three sportsbook lines imply 18-21%, I make it 24% after injury news."
- "Polling + endorsements + delegate path make this nomination chance closer to 11%."

Bad:

- "This feels underrated."
- "I saw people talking about it on social media."

## 1. Politics and elections

Best when:

- the market has a clear date,
- the resolution rules are specific,
- you can compare against polls, forecast models, betting markets, or delegate math.

Base-rate inputs:

- polling averages
- favorability / approval trend
- delegate or nomination path
- fundraising and endorsements
- ballot access / legal eligibility
- time remaining until the key contest

Simple process:

1. Start from the best outside baseline you can find.
2. Adjust up or down for things Polymarket may be overpricing or underpricing.
3. Write down the exact reason the market could be wrong.
4. If you cannot explain the mispricing in one paragraph, skip it.

Good first-market rule:

- prefer shorter-dated election or cabinet markets over 2028 longshots

## 2. Sports

Best when:

- you can compare against liquid sportsbook prices,
- the market resolves on a known schedule,
- the injury/news flow is easy to track.

Base-rate inputs:

- consensus bookmaker odds
- no-vig implied probability
- lineup / injury changes
- rest, travel, weather, motivation
- tournament path difficulty

Simple process:

1. Pull 2-5 sportsbook prices.
2. Convert them to no-vig probability.
3. Adjust only for information you believe is not fully priced yet.
4. Use that result as `fair_yes_probability`.

Good first-market rule:

- game-level or week-level markets are usually better than season-long outrights

## 3. Crypto and macro thresholds

Best when:

- the market is tied to a price level, policy decision, ETF flow, or on-chain event
- you can build a scenario distribution instead of guessing

Base-rate inputs:

- spot price and realized volatility
- options-implied distribution
- funding rates / positioning
- scheduled catalysts
- on-chain flows or official releases

Simple process:

1. Define the event window precisely.
2. Build 3-5 scenarios.
3. Assign probability to each scenario.
4. Estimate the YES probability inside each scenario.
5. Sum them into one fair value.

Example:

- 30% chance of bullish regime, YES inside regime = 70%
- 50% chance of neutral regime, YES inside regime = 40%
- 20% chance of bearish regime, YES inside regime = 15%
- fair YES = `0.30*0.70 + 0.50*0.40 + 0.20*0.15 = 0.44`

## 4. Novelty and celebrity longshots

Usually bad for a first bot.

These markets often have:

- poor priors,
- very wide spreads,
- story-driven narratives,
- low information quality,
- bad automation value.

Rule of thumb:

- if the market is mostly a meme, skip it

## How to choose a starting market family

For your first working loop, choose the family where you can answer all three:

1. What outside baseline should I trust?
2. What specific thing might Polymarket be mispricing?
3. What schedule or event will update my thesis soon?

If you cannot answer those quickly, it is not the right first market family.

## What to write into `thesis.json`

- `fair_yes_probability`: your current estimate
- `confidence`: how much you trust the estimate
- `rationale`: why the market is wrong, not just why the event might happen
- `sources`: the exact evidence used
- `status`: keep `researching` until the thesis is ready for automation
