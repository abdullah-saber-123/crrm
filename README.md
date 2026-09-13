# Northfield & Co.

A small e-commerce storefront built with Next.js (App Router), TypeScript, and Tailwind CSS.

## Features

- Product catalog with category and pricing
- Product detail pages (statically generated per product)
- Cart with quantity editing, persisted to `localStorage`
- Demo checkout flow with an order summary and success page

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Notes

- Checkout is a UI demo only — no payment provider is integrated and no data is
  sent anywhere. Wire up a real payment provider (e.g. Stripe) in
  `src/app/checkout/page.tsx` before using this in production.
- Product data lives in `src/lib/products.ts`; replace with a real data
  source (CMS, database, or commerce API) as needed.
