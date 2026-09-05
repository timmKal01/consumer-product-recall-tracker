import { log } from 'apify';

const BASE_URL = 'https://www.saferproducts.gov/RestWebServices/Recall';
const REQUEST_TIMEOUT_MS = 30_000;
const MAX_ATTEMPTS = 4;

function toDateOnly(date) {
    return date.toISOString().slice(0, 10);
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(url) {
    let lastError;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

        try {
            const res = await fetch(url, { headers: { Connection: 'close' }, signal: controller.signal });

            if (res.status === 429 || res.status >= 500) {
                const retryAfterHeader = Number(res.headers.get('retry-after'));
                const backoffMs = Number.isFinite(retryAfterHeader) && retryAfterHeader > 0
                    ? retryAfterHeader * 1000
                    : 2 ** attempt * 1000;

                if (attempt === MAX_ATTEMPTS) {
                    throw new Error(`CPSC API request failed after ${attempt} attempts: ${res.status} ${res.statusText}`);
                }
                log.warning(`CPSC API returned ${res.status}, retrying in ${backoffMs}ms (attempt ${attempt}/${MAX_ATTEMPTS})`);
                await sleep(backoffMs);
                continue;
            }

            if (!res.ok) {
                throw new Error(`CPSC API request failed: ${res.status} ${res.statusText}`);
            }

            return await res.json();
        } catch (err) {
            lastError = err;
            const isAbort = err.name === 'AbortError';
            if (attempt === MAX_ATTEMPTS) {
                throw new Error(`CPSC API request failed after ${attempt} attempts: ${isAbort ? 'timed out' : err.message}`);
            }
            const backoffMs = 2 ** attempt * 1000;
            log.warning(`CPSC API request ${isAbort ? 'timed out' : 'errored'} (${err.message}), retrying in ${backoffMs}ms (attempt ${attempt}/${MAX_ATTEMPTS})`);
            await sleep(backoffMs);
        } finally {
            clearTimeout(timeout);
        }
    }

    throw lastError;
}

function parseRecall(r) {
    return {
        recallId: r.RecallID,
        recallNumber: r.RecallNumber,
        title: r.Title,
        description: r.Description,
        recallDate: r.RecallDate,
        url: r.URL,
        products: (r.Products ?? []).map((p) => ({
            name: p.Name,
            model: p.Model,
            numberOfUnits: p.NumberOfUnits,
        })),
        hazards: (r.Hazards ?? []).map((h) => h.Name),
        remedies: (r.Remedies ?? []).map((rm) => rm.Name),
        injuries: (r.Injuries ?? []).map((i) => i.Name),
        manufacturers: (r.Manufacturers ?? []).map((m) => m.Name),
        importers: (r.Importers ?? []).map((m) => m.Name),
        distributors: (r.Distributors ?? []).map((m) => m.Name),
        retailers: (r.Retailers ?? []).map((m) => m.Name),
        manufacturerCountries: (r.ManufacturerCountries ?? []).map((c) => c.Country),
        consumerContact: r.ConsumerContact,
    };
}

export async function fetchRecalls({ keyword, hazard, manufacturer, startDate, maxResults }) {
    const url = new URL(BASE_URL);
    if (keyword) url.searchParams.set('RecallTitle', keyword);
    if (hazard) url.searchParams.set('HazardDescription', hazard);
    if (manufacturer) url.searchParams.set('Manufacturer', manufacturer);
    url.searchParams.set('RecallDateStart', toDateOnly(startDate));
    url.searchParams.set('RecallDateEnd', toDateOnly(new Date()));
    url.searchParams.set('format', 'json');

    const recalls = await fetchWithRetry(url);

    if (!Array.isArray(recalls)) {
        throw new Error(`CPSC API returned unexpected response shape: ${typeof recalls}`);
    }

    const parsed = [];
    for (const r of recalls) {
        try {
            parsed.push(parseRecall(r));
        } catch (err) {
            log.warning(`Skipping malformed recall record (RecallID=${r?.RecallID ?? 'unknown'}): ${err.message}`);
        }
    }

    return parsed
        .sort((a, b) => (b.recallDate ?? '').localeCompare(a.recallDate ?? ''))
        .slice(0, maxResults);
}
