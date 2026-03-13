# Polymarket Research Bot

This project is a safe starting point for a Polymarket bot. It does **not** place live orders. Instead, it:

- fetches active Polymarket markets from the public Gamma API,
- reads best bid/ask quotes from the public CLOB order book,
- compares those prices against your own researched fair values,
- writes a ranked research report, and
- records paper trades when the edge and liquidity filters look good.

The goal is to help you build a disciplined workflow:

1. find liquid, tradable markets,
2. research them yourself,
3. encode your fair probabilities,
4. let the bot size and log paper trades,
5. only after that, wire in live execution.

## Why this version is paper-only

Prediction-market automation is mostly a risk-management problem. Going live before you have a repeatable research loop usually loses money for boring reasons like:

- ambiguous resolution rules,
- bad fills from wide spreads,
- low liquidity,
- overbetting one theme,
- using the wrong key or account setup.

This scaffold keeps live trading disabled on purpose.

## Project layout

```text
polymarket-bot/
  polymarket_bot/
    __main__.py
    app.py
    clob.py
    config.py
    env.py
    gamma.py
    http.py
    models.py
    paper.py
    report.py
    signals.py
    strategy.py
  reports/
  tests/
  .env.example
  manual_signals.example.json
```

## Quick start

1. Copy `.env.example` to `.env`.
2. Copy `manual_signals.example.json` to `manual_signals.json`.
3. Edit `manual_signals.json` with markets you have personally researched.
4. Run a market scan:

```bash
cd /Users/minwoo/Documents/New\ project/polymarket-bot
python3 -m polymarket_bot scan --top 15
```

5. Run one paper-trading cycle:

```bash
cd /Users/minwoo/Documents/New\ project/polymarket-bot
python3 -m polymarket_bot paper --once --top 15
```

Outputs are written into `reports/`:

- `latest_report.md`
- `latest_opportunities.json`
- `paper_orders.jsonl`
- `paper_state.json`

## How the strategy works

This version is intentionally conservative:

- ignores markets with low liquidity or low volume,
- ignores markets with wide spreads,
- ignores markets that are too close to resolution,
- only opens a paper trade when your fair value is better than the current ask by at least `MIN_EDGE_BPS`,
- sizes trades as a fraction of `BANKROLL_USD`.

It evaluates both sides:

- buy YES when `your_fair_yes - yes_ask` is large enough,
- buy NO when `(1 - your_fair_yes) - no_ask` is large enough.

## Funding and credentials

Do **not** give your Polymarket login code, private key, API secret, or account access to anyone, including me.

The right setup is:

1. Create your Polymarket account yourself.
2. Deposit funds into your own Polymarket wallet.
3. Keep your private key only on your machine.
4. Put secrets in a local `.env` file that is never committed.
5. Run the bot locally so it reads those secrets itself.

Important current Polymarket details from official docs:

- Trading collateral is **USDC.e on Polygon**.
- Deposits can come from several chains through the Bridge API and are converted to USDC.e on Polygon.
- If you signed up with email/Google, Polymarket says you may need to export your private key from Magic Link for automated trading.
- Trading endpoints use both L1 private-key auth and L2 API credentials.

Official references:

- [Quickstart](https://docs.polymarket.com/quickstart)
- [Gamma markets](https://docs.polymarket.com/developers/gamma-markets-api/get-markets)
- [Order book](https://docs.polymarket.com/trading/orderbook)
- [Authentication](https://docs.polymarket.com/api-reference/authentication)
- [Bridge overview](https://docs.polymarket.com/developers/misc-endpoints/bridge-overview)
- [How to deposit](https://help.polymarket.com/en/articles/13369887-how-to-deposit)
- [How to export my key](https://help.polymarket.com/en/articles/13364258-how-do-i-export-my-key)

## When you are ready for live trading

Do this only after a long paper-trading period.

1. Add `py-clob-client` locally.
2. Generate or derive your Polymarket L2 API credentials with your own private key.
3. Keep `PRIVATE_KEY`, `FUNDER_ADDRESS`, `POLY_API_KEY`, `POLY_PASSPHRASE`, and `POLY_API_SECRET` in `.env`.
4. Add an execution adapter that signs orders locally and posts them through the CLOB client.
5. Keep a hard kill switch and daily loss limit.

If you want, I can build that next step too, but I strongly recommend testing this paper version first.
