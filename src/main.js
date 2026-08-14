import { Actor, log } from 'apify';
import { fetchRecalls } from './cpsc.js';

await Actor.init();

const input = (await Actor.getInput()) ?? {};
const { keyword, hazard, manufacturer, daysBack = 30, maxResults = 25 } = input;

/** Must match the event name configured in this Actor's pay-per-event pricing on Apify. */
const RECALL_SEARCH_EVENT = 'recall-search';

const startDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);

const recalls = await fetchRecalls({
    keyword,
    hazard,
    manufacturer,
    startDate,
    maxResults: Math.min(maxResults, 100),
});

for (const recall of recalls) {
    await Actor.pushData(recall);
}

await Actor.charge({ eventName: RECALL_SEARCH_EVENT });

log.info(`Pushed ${recalls.length} recall(s)`);

await Actor.exit();
