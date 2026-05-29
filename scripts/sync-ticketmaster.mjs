import { createClient } from '@supabase/supabase-js';

const API_BASE = 'https://app.ticketmaster.com/discovery/v2/events.json';

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optionalEnv(name, fallback = '') {
  return process.env[name] ?? fallback;
}

function parseBoolean(value, defaultValue = true) {
  if (value === undefined || value === null || value === '') return defaultValue;
  const normalized = String(value).trim().toLowerCase();
  if (['1', 'true', 'yes', 'y'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'n'].includes(normalized)) return false;
  return defaultValue;
}

function parseInteger(value, fallback) {
  if (value === undefined || value === null || value === '') return fallback;
  const parsed = Number.parseInt(String(value), 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        current += '"';
        i += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      continue;
    }

    if (char === ',') {
      row.push(current);
      current = '';
      continue;
    }

    if (char === '\n') {
      row.push(current);
      rows.push(row);
      row = [];
      current = '';
      continue;
    }

    if (char === '\r') {
      continue;
    }

    current += char;
  }

  if (current.length > 0 || row.length > 0) {
    row.push(current);
    rows.push(row);
  }

  if (rows.length === 0) return [];

  const headers = rows[0].map((value) => value.trim().toLowerCase());
  return rows.slice(1)
    .filter((values) => values.some((value) => String(value).trim() !== ''))
    .map((values) => {
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = (values[index] ?? '').trim();
      });
      return obj;
    });
}

async function fetchSheetRows(spreadsheetId, gid) {
  const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}`;
  const response = await fetch(url);
  const body = await response.text().catch(() => '(no body)');

  const looksLikeGoogleAuthPage =
    body.includes('Sign in to your Google Account') ||
    body.includes('Allow Google Sheets access to your necessary cookies') ||
    body.includes('<!DOCTYPE html>');

  if (!response.ok || looksLikeGoogleAuthPage) {
    if (looksLikeGoogleAuthPage) {
      throw new Error(
        [
          'Google Sheets export returned an auth page instead of CSV.',
          'Make sure the sheet is publicly readable (Share -> Anyone with the link -> Viewer),',
          'and/or File -> Share -> Publish to web for the required tabs.',
          `Spreadsheet ID: ${spreadsheetId}, GID: ${gid}`,
        ].join(' ')
      );
    }
    throw new Error(`Google Sheets export failed (${response.status}): ${body}`);
  }

  return parseCsv(body);
}

function extractKeywordsFromRows(rows) {
  const set = new Set();

  for (const row of rows) {
    const keyword = row.keyword || row.keywords || row.artist || row.name;
    if (!keyword) continue;

    const active = parseBoolean(row.is_active ?? row.active ?? row.enabled ?? row.is_enabled, true);
    if (!active) continue;

    const normalized = String(keyword).trim();
    if (normalized) set.add(normalized);
  }

  return Array.from(set);
}

async function resolveKeywords() {
  const spreadsheetId = optionalEnv('GOOGLE_SHEETS_SPREADSHEET_ID');
  const keywordsGid = optionalEnv('GOOGLE_SHEETS_TICKETMASTER_KEYWORDS_GID');

  if (spreadsheetId && keywordsGid) {
    const rows = await fetchSheetRows(spreadsheetId, keywordsGid);
    const keywords = extractKeywordsFromRows(rows);
    if (keywords.length === 0) {
      throw new Error('Keywords sheet is configured but no active keywords were found.');
    }
    console.log(`Loaded ${keywords.length} Ticketmaster keywords from Google Sheets.`);
    return keywords;
  }

  const ticketmasterKeywords = optionalEnv('TICKETMASTER_KEYWORDS');
  if (!ticketmasterKeywords) {
    throw new Error('Provide either TICKETMASTER_KEYWORDS or both GOOGLE_SHEETS_SPREADSHEET_ID and GOOGLE_SHEETS_TICKETMASTER_KEYWORDS_GID.');
  }

  return ticketmasterKeywords
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}

function buildLocation(event) {
  const venue = event?._embedded?.venues?.[0];
  if (!venue) return 'TBA';

  const parts = [venue.name, venue.city?.name, venue.country?.name].filter(Boolean);
  return parts.join(', ');
}

function resolveStartDate(event) {
  const start = event?.dates?.start;
  if (!start) return null;

  if (start.dateTime) return start.dateTime;

  if (start.localDate && start.localTime) {
    return `${start.localDate}T${start.localTime}Z`;
  }

  if (start.localDate) {
    return `${start.localDate}T20:00:00Z`;
  }

  return null;
}

function pickImage(event) {
  const images = event?.images ?? [];
  const exact = images.find((image) => image.ratio === '16_9' && image.width >= 1024);
  if (exact) return exact.url;
  if (images[0]) return images[0].url;
  return null;
}

function normalizeBand(event) {
  const attractions = event?._embedded?.attractions ?? [];
  if (attractions.length === 0) return event.name ?? 'Unknown Artist';
  return attractions.map((item) => item.name).filter(Boolean).join(' + ');
}

function mapTicketmasterEvent(event) {
  const startsAt = resolveStartDate(event);
  if (!event?.id || !event?.name || !startsAt) return null;

  return {
    name: event.name,
    band: normalizeBand(event),
    location: buildLocation(event),
    starts_at: startsAt,
    image_url: pickImage(event),
    description: event.info || event.pleaseNote || null,
    ticket_url: event.url || null,
    is_published: true,
    source: 'ticketmaster',
    source_event_id: event.id,
    source_url: event.url || null,
  };
}

async function fetchTicketmasterPage({
  apiKey,
  keyword,
  countryCode,
  page,
  size,
  startDateTime,
}) {
  const params = new URLSearchParams({
    apikey: apiKey,
    keyword,
    countryCode,
    page: String(page),
    size: String(size),
    sort: 'date,asc',
    startDateTime,
  });

  const response = await fetch(`${API_BASE}?${params.toString()}`);

  if (!response.ok) {
    const body = await response.text().catch(() => '(no body)');
    throw new Error(`Ticketmaster API failed (${response.status}): ${body}`);
  }

  return response.json();
}

async function run() {
  const supabaseUrl = requiredEnv('SUPABASE_URL');
  const supabaseServiceRoleKey = requiredEnv('SUPABASE_SERVICE_ROLE_KEY');
  const ticketmasterApiKey = requiredEnv('TICKETMASTER_API_KEY');

  const countryCode = optionalEnv('TICKETMASTER_COUNTRY_CODE', 'GB');
  const size = parseInteger(optionalEnv('TICKETMASTER_PAGE_SIZE', '100'), 100);
  const maxPages = parseInteger(optionalEnv('TICKETMASTER_MAX_PAGES', '2'), 2);
  const publishImportedRows = parseBoolean(optionalEnv('TICKETMASTER_IS_PUBLISHED', 'true'), true);
  const startDateTime = optionalEnv('TICKETMASTER_START_DATE_TIME', new Date().toISOString());

  const keywords = await resolveKeywords();

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const bySourceEventId = new Map();

  for (const keyword of keywords) {
    console.log(`Fetching Ticketmaster events for keyword: ${keyword}`);

    for (let page = 0; page < maxPages; page += 1) {
      const payload = await fetchTicketmasterPage({
        apiKey: ticketmasterApiKey,
        keyword,
        countryCode,
        page,
        size,
        startDateTime,
      });

      const items = payload?._embedded?.events ?? [];
      if (items.length === 0) {
        console.log(`No events returned for keyword=${keyword} page=${page}`);
        break;
      }

      for (const event of items) {
        const mapped = mapTicketmasterEvent(event);
        if (!mapped) continue;
        mapped.is_published = publishImportedRows;
        bySourceEventId.set(mapped.source_event_id, mapped);
      }

      const totalPages = payload?.page?.totalPages ?? 0;
      if (page + 1 >= totalPages) break;
    }
  }

  const rows = Array.from(bySourceEventId.values());
  if (rows.length === 0) {
    console.log('No Ticketmaster events found to import.');
    return;
  }

  console.log(`Upserting ${rows.length} Ticketmaster events...`);

  const { error } = await supabase
    .from('events')
    .upsert(rows, { onConflict: 'source,source_event_id' });

  if (error) {
    throw new Error(`Supabase upsert failed: ${error.message}`);
  }

  console.log(`Ticketmaster sync complete. Upserted ${rows.length} rows.`);
}

run().catch((error) => {
  console.error('sync-ticketmaster failed:', error.message);
  process.exit(1);
});
