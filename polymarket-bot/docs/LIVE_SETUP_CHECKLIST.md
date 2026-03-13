# Live Setup Checklist

Use this checklist while you handle the account side and the bot stays on your machine.

## What you need to do yourself

1. Create and verify your Polymarket account yourself.
2. Confirm your jurisdiction is allowed to use Polymarket.
3. Deposit trading collateral and gas into your own wallet setup.
4. Export the private key you intend to trade with.
5. Generate or obtain the L2 API credentials that Polymarket trading uses.
6. Put those values into your local `.env` file.

## What the bot can do for you now

- `python3 -m polymarket_bot validate-live`
- `python3 -m polymarket_bot dry-run-live --top 3 --focus world-politics --min-hours-to-close 12 --max-hours-to-close 720 --fetch-limit 400`
- `python3 -m polymarket_bot derive-api-creds`
- `python3 -m polymarket_bot paper --once --focus world-politics --min-hours-to-close 12 --max-hours-to-close 720 --fetch-limit 400`

## Meaning of the key `.env` fields

- `PRIVATE_KEY`: signer key used to authorize orders
- `FUNDER_ADDRESS`: often needed for custodial, proxy, or Magic/social wallet setups
- `POLY_API_KEY`: Polymarket L2 API key
- `POLY_PASSPHRASE`: passphrase paired with the L2 API key
- `POLY_API_SECRET`: secret paired with the L2 API key
- `ALLOW_LIVE_TRADING`: keep this `false` until you intentionally want live execution

## Safe rollout order

1. `validate-live`
2. `dry-run-live`
3. `derive-api-creds`
4. `paper --once`
5. `execute-live --confirm-live` with the smallest possible size only after the above all look correct

## Important rule

Never paste your private key or API secret into chat. Keep them only in your local `.env`.
