const BASE_URL = 'https://www.saferproducts.gov/RestWebServices/Recall';

function toDateOnly(date) {
    return date.toISOString().slice(0, 10);
}

export async function fetchRecalls({ keyword, hazard, manufacturer, startDate, maxResults }) {
    const url = new URL(BASE_URL);
    if (keyword) url.searchParams.set('RecallTitle', keyword);
    if (hazard) url.searchParams.set('HazardDescription', hazard);
    if (manufacturer) url.searchParams.set('Manufacturer', manufacturer);
    url.searchParams.set('RecallDateStart', toDateOnly(startDate));
    url.searchParams.set('RecallDateEnd', toDateOnly(new Date()));
    url.searchParams.set('format', 'json');

    const res = await fetch(url, { headers: { Connection: 'close' } });
    if (!res.ok) {
        throw new Error(`CPSC API request failed: ${res.status} ${res.statusText}`);
    }
    const recalls = await res.json();

    return recalls
        .sort((a, b) => b.RecallDate.localeCompare(a.RecallDate))
        .slice(0, maxResults)
        .map((r) => ({
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
        }));
}
