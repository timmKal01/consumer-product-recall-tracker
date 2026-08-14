# Consumer Product Recall Tracker — CPSC Recalls

Search recent U.S. Consumer Product Safety Commission (CPSC) recalls —
toys, furniture, appliances, electronics, and other everyday consumer
products (not food, drugs, medical devices, or vehicles, which have
their own regulators). Filter by keyword, hazard type, or
manufacturer/retailer/importer name.

Built for retailers, importers, resellers, and compliance/insurance
teams who need to know when a product in their supply chain — or a
competitor's — gets recalled.

## Input

```json
{
  "keyword": "stroller",
  "hazard": "",
  "manufacturer": "",
  "daysBack": 30,
  "maxResults": 25
}
```

| Field | Type | Description |
|---|---|---|
| `keyword` | string (optional) | Free-text search across the recall title and product description. |
| `hazard` | string (optional) | Free-text search across the described hazard (e.g. `"fire"`, `"choking"`, `"laceration"`). |
| `manufacturer` | string (optional) | Free-text search across manufacturer/importer/distributor names. |
| `daysBack` | number | How many days back from today to search, by recall publish date. Default `30`, max `365`. |
| `maxResults` | number | Max recalls to return, most recent first. Default `25`, max `100`. |

## Output

One record per recall:

```json
{
  "recallId": 10905,
  "recallNumber": "26670",
  "title": "A2batt Recalls EEMB Lithium Coin Battery Chargers Due to Risk of Serious Injury or Death from Battery Ingestion",
  "description": "This recall involves EEMB Lithium-ion Coin Battery Chargers with Rechargeable 2032 Batteries, model SKLC-0420-0040...",
  "recallDate": "2026-08-06T00:00:00",
  "url": "https://www.cpsc.gov/Recalls/2026/A2batt-Recalls-EEMB-Lithium-Coin-Battery-Chargers...",
  "products": [
    { "name": "EEMB Lithium-ion Coin Battery Chargers with Rechargeable 2032 Batteries", "model": "", "numberOfUnits": "About 4,930" }
  ],
  "hazards": ["The recalled battery chargers violate the mandatory standard for consumer products containing button cell or coin batteries..."],
  "remedies": ["Consumers should stop using the charger immediately, remove the batteries..."],
  "injuries": ["None reported"],
  "manufacturers": [],
  "importers": [],
  "distributors": ["EEMB USA, doing business as A2batt, Inc., of Redlands, California"],
  "retailers": ["Online at Amazon.com from August 2024 through March 2026 for about $14."],
  "manufacturerCountries": ["China"],
  "consumerContact": "A2batt by email at info@a2batt.com or online at www.eemb.com/Recall..."
}
```

A search with no matches in the requested window returns no items but
is still billed once for the search.

## How it works

Direct calls to the official [CPSC SaferProducts.gov REST
API](https://www.saferproducts.gov/RestWebServices/) — no proxy, no key,
no scraping. Public U.S. government data.

## Pricing note

Billed per **search**, not per recall returned — one charge whether the
search returns 0 recalls or 100.

## Related products

- [Product Recall Alert](https://github.com/timmKal01/product-recall-alert) — the FDA equivalent for drug, food, and medical device recalls
- [Vehicle Recall Tracker](https://github.com/timmKal01/vehicle-recall-tracker) — the NHTSA equivalent for vehicle safety recalls
