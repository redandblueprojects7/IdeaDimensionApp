import { createClient } from '@supabase/supabase-js';

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

function parseInteger(value, fallback = null) {
  if (value === undefined || value === null || value === '') return fallback;
  const parsed = Number.parseInt(String(value), 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function slugify(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
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

  const headers = rows[0].map((value) => value.trim());
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

  if (!response.ok) {
    const body = await response.text().catch(() => '(no body)');
    throw new Error(`Google Sheets export failed (${response.status}): ${body}`);
  }

  const text = await response.text();
  return parseCsv(text);
}

async function upsertInBatches(supabase, tableName, rows, onConflict, batchSize = 250) {
  let total = 0;

  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const { error } = await supabase
      .from(tableName)
      .upsert(batch, { onConflict });

    if (error) {
      throw new Error(`Supabase upsert failed for ${tableName}: ${error.message}`);
    }

    total += batch.length;
  }

  return total;
}

function buildEventRows(rawRows) {
  return rawRows
    .filter((row) => row.name && row.band && row.location && row.starts_at)
    .map((row, index) => {
      const sourceEventId = row.source_event_id || slugify(`${row.name}-${row.starts_at}-${index}`);

      return {
        name: row.name,
        band: row.band,
        location: row.location,
        starts_at: row.starts_at,
        image_url: row.image_url || null,
        description: row.description || null,
        ticket_url: row.ticket_url || null,
        is_published: parseBoolean(row.is_published, true),
        source: 'google_sheet',
        source_event_id: sourceEventId,
        source_url: row.ticket_url || null,
      };
    });
}

function buildArtistRows(rawRows) {
  return rawRows
    .filter((row) => row.name)
    .map((row, index) => {
      const sourceArtistId = row.source_artist_id || slugify(`${row.name}-${index}`);
      const members = row.members
        ? row.members
            .split(/[\n,]/)
            .map((item) => item.trim())
            .filter(Boolean)
        : [];

      return {
        name: row.name,
        members,
        logo_url: row.logo_url || null,
        image_url: row.image_url || null,
        description: row.description || '',
        external_url: row.external_url || null,
        external_label: row.external_label || null,
        sort_order: parseInteger(row.sort_order, null),
        is_published: parseBoolean(row.is_published, true),
        source: 'google_sheet',
        source_artist_id: sourceArtistId,
      };
    });
}

async function run() {
  const supabaseUrl = requiredEnv('SUPABASE_URL');
  const supabaseServiceRoleKey = requiredEnv('SUPABASE_SERVICE_ROLE_KEY');
  const spreadsheetId = requiredEnv('GOOGLE_SHEETS_SPREADSHEET_ID');
  const eventsGid = requiredEnv('GOOGLE_SHEETS_EVENTS_GID');
  const artistsGid = requiredEnv('GOOGLE_SHEETS_ARTISTS_GID');
  const pruneSheetRows = parseBoolean(optionalEnv('GOOGLE_SHEETS_PRUNE', 'false'), false);

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  console.log('Fetching rows from Google Sheets...');
  const [eventRawRows, artistRawRows] = await Promise.all([
    fetchSheetRows(spreadsheetId, eventsGid),
    fetchSheetRows(spreadsheetId, artistsGid),
  ]);

  const eventRows = buildEventRows(eventRawRows);
  const artistRows = buildArtistRows(artistRawRows);

  console.log(`Preparing to upsert ${eventRows.length} events and ${artistRows.length} artists...`);

  const eventCount = await upsertInBatches(supabase, 'events', eventRows, 'source,source_event_id');
  const artistCount = await upsertInBatches(supabase, 'artists', artistRows, 'source,source_artist_id');

  if (pruneSheetRows) {
    const eventSourceIds = eventRows.map((item) => item.source_event_id);
    const artistSourceIds = artistRows.map((item) => item.source_artist_id);

    if (eventSourceIds.length > 0) {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('source', 'google_sheet')
        .not('source_event_id', 'in', `(${eventSourceIds.map((value) => `"${value}"`).join(',')})`);
      if (error) throw new Error(`Failed to prune event rows: ${error.message}`);
    }

    if (artistSourceIds.length > 0) {
      const { error } = await supabase
        .from('artists')
        .delete()
        .eq('source', 'google_sheet')
        .not('source_artist_id', 'in', `(${artistSourceIds.map((value) => `"${value}"`).join(',')})`);
      if (error) throw new Error(`Failed to prune artist rows: ${error.message}`);
    }

    console.log('Pruned rows not present in latest Google Sheet snapshot.');
  }

  console.log(`Google Sheets sync complete. Upserted ${eventCount} events and ${artistCount} artists.`);
}

run().catch((error) => {
  console.error('sync-google-sheets failed:', error.message);
  process.exit(1);
});
