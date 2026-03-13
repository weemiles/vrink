# Research Playbook

This document explains how to move from "interesting market" to "fair probability I trust enough to paper trade."

## Core rule

Do not ask, "Which side is more likely?"  
Ask, "Where is my probability estimate different enough from the market price to survive costs, spread, and uncertainty?"

## Step 1: Resolution first

Before any analysis, confirm:

- the exact resolution wording,
- the final deciding source,
- the relevant deadline and timezone,
- any edge cases that could make the market settle differently than the headline suggests.

If the rules are ambiguous, skip the market.

## Step 2: Tradability second

Even a correct prediction can be a bad trade. Check:

- liquidity,
- spread,
- time left before resolution,
- whether you could realistically enter and exit without donating edge to the market.

If spread is wide or the market is thin, skip the market.

## Step 3: Build a base rate

Start with a neutral prior rather than jumping to a story.

Examples:

- elections: polling, forecast models, historical incumbency/base-rate adjustments
- sports: book odds, injuries, lineup confirmations, travel/fatigue spots
- crypto: implied vol, on-chain flows, calendar catalysts, exchange positioning
- macro/geopolitics: official announcements, scheduled events, primary-source statements

Your goal is to answer:

- What probability would I assign if I had to decide before today's news flow?

## Step 4: List the evidence that should move the prior

Split the evidence into:

- YES drivers
- NO drivers
- reasons the market might already know this
- reasons the market might be overreacting or underreacting

This is where most edge lives. If your thesis is only "the event seems likely," you probably do not have an edge.

## Step 5: Create a scenario tree

You do not need a perfect model. A simple weighted tree is enough:

- bullish scenario
- base scenario
- bearish scenario

Then estimate:

`fair_yes = sum(probability_of_scenario * yes_probability_inside_scenario)`

If your estimate only comes from a gut feeling, keep it out of `manual_signals.json`.

## Step 6: Add an entry plan

Research should produce both:

- a fair value
- a price discipline rule

Examples:

- "I think fair YES is 0.63, but I only want to buy below 0.58."
- "I think fair YES is 0.36, so I only want NO below 0.60."

This avoids chasing the market after the best price is gone.

## Step 7: Decide whether the market is even worth automating

Some markets should remain manual only.

Avoid automation when:

- rules are subtle,
- new clarifications could change interpretation,
- outcomes depend on vague language,
- outside data is unreliable or delayed,
- event timing is chaotic.

## What to put in `thesis.json`

- `fair_yes_probability`: your current fair estimate
- `confidence`: how strongly you trust the estimate
- `rationale`: 2-5 sentences on why the market is mispriced
- `sources`: the primary evidence you actually used
- `status`: keep `researching` until you want the bot to use it

## Good workflow in practice

1. Run `python3 -m polymarket_bot research --top 8`
2. Pick 1-3 markets only
3. Fill in each `brief.md` and `thesis.json`
4. Set the best ones to `ready`
5. Run `python3 -m polymarket_bot compile-signals`
6. Run `python3 -m polymarket_bot paper --once`
7. Review whether the bot's suggested trade still matches your intention

The strongest prediction-market bot is usually not the one that trades the most. It is the one that refuses weak markets quickly.
