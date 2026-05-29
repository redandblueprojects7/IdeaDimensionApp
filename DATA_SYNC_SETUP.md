# Data Sync Setup (Google Sheets + Ticketmaster)

This setup lets your client edit data in Google Sheets while the app continues to read from Supabase.

## 1) What to create in Google Sheets

Create one spreadsheet with two tabs.

### Tab A: `events`
Use this exact header row:

```csv
name,band,location,starts_at,image_url,description,ticket_url,is_published,source_event_id
```

Field notes:
- `name` (required): event title
- `band` (required): artist/band display text
- `location` (required): venue/city text
- `starts_at` (required): ISO datetime, example `2026-07-18T19:30:00Z`
- `image_url` (optional): full image URL
- `description` (optional)
- `ticket_url` (optional)
- `is_published` (optional): `true` or `false` (defaults to `true`)
- `source_event_id` (optional but recommended): stable ID so updates overwrite correctly

### Tab B: `artists`
Use this exact header row:

```csv
name,members,logo_url,image_url,description,external_url,external_label,sort_order,is_published,source_artist_id
```

Field notes:
- `name` (required)
- `members` (optional): comma-separated or newline-separated names
- `logo_url` (optional)
- `image_url` (optional)
- `description` (optional)
- `external_url` (optional)
- `external_label` (optional)
- `sort_order` (optional): integer (lower appears first)
- `is_published` (optional): `true` or `false` (defaults to `true`)
- `source_artist_id` (optional but recommended): stable ID for updates

### Tab C (optional): `ticketmaster_keywords`
Use this header row:

```csv
keyword,is_active
```

Field notes:
- `keyword` (required): artist/event search term used against Ticketmaster
- `is_active` (optional): `true` or `false` (defaults to `true`)

## 2) Publish the sheet for read access

1. In Google Sheets: `File -> Share -> Publish to web`
2. Publish the whole document as CSV.
3. Copy the spreadsheet ID from the URL:
   - `https://docs.google.com/spreadsheets/d/<SPREADSHEET_ID>/edit`
4. Get each tab `gid` from the URL when tab is open:
   - `.../edit#gid=<GID_VALUE>`

## 3) Database SQL to run in Supabase

Run these, in order, in Supabase SQL Editor:

1. `supabase-setup.sql` (if not already run)
2. `supabase-sync-setup.sql`

This adds:
- `artists` table
- source tracking fields on `events`
- indexes for feed upserts
- RLS read policies for published events/artists

## 4) Environment variables for sync scripts

These are server-side vars. Do not put service role key in app client env.

```bash
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
GOOGLE_SHEETS_SPREADSHEET_ID=
GOOGLE_SHEETS_EVENTS_GID=
GOOGLE_SHEETS_ARTISTS_GID=
GOOGLE_SHEETS_PRUNE=false
TICKETMASTER_API_KEY=
TICKETMASTER_KEYWORDS=idea dimension
TICKETMASTER_COUNTRY_CODE=GB
TICKETMASTER_PAGE_SIZE=100
TICKETMASTER_MAX_PAGES=2
TICKETMASTER_IS_PUBLISHED=true
```

## 5) Run sync jobs

### Google Sheets -> Supabase (events + artists)

```bash
npm run sync:sheets
```

### Ticketmaster -> Supabase (events)

```bash
npm run sync:ticketmaster
```

## 6) Suggested automation

Use GitHub Actions, cron, or a small server to run:
- `sync:sheets` every 5-10 minutes
- `sync:ticketmaster` every 30-60 minutes

### Recommended: GitHub Actions (already added)

Workflow file:
- [.github/workflows/data-sync.yml](.github/workflows/data-sync.yml)

Default schedule in that workflow:
- Google Sheets sync: every 10 minutes
- Ticketmaster sync: hourly (minute 17)

You can also run it manually from GitHub Actions with target:
- all
- sheets
- ticketmaster

### GitHub secrets to add

In GitHub: Settings -> Secrets and variables -> Actions -> New repository secret

Required for sheets sync:
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
- GOOGLE_SHEETS_SPREADSHEET_ID
- GOOGLE_SHEETS_EVENTS_GID
- GOOGLE_SHEETS_ARTISTS_GID

Optional for sheets sync:
- GOOGLE_SHEETS_PRUNE (true/false, default false)

Required for Ticketmaster sync:
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
- TICKETMASTER_API_KEY

Keyword source for Ticketmaster sync (choose one):
- Option A: `TICKETMASTER_KEYWORDS` secret (comma-separated list)
- Option B: `GOOGLE_SHEETS_SPREADSHEET_ID` + `GOOGLE_SHEETS_TICKETMASTER_KEYWORDS_GID`

Optional for Ticketmaster sync:
- TICKETMASTER_COUNTRY_CODE (default GB)
- TICKETMASTER_PAGE_SIZE (default 100)
- TICKETMASTER_MAX_PAGES (default 2)
- TICKETMASTER_IS_PUBLISHED (default true)
- TICKETMASTER_START_DATE_TIME (ISO datetime)

Optional for sheet-driven Ticketmaster keywords:
- GOOGLE_SHEETS_TICKETMASTER_KEYWORDS_GID

If an optional secret is not added in GitHub, the workflow passes an empty value and the script defaults are used.

## 6.1) Ticketmaster setup details

1. Create a Ticketmaster developer account and app
2. Get your Discovery API key (this is TICKETMASTER_API_KEY)
3. Decide your matching keywords (TICKETMASTER_KEYWORDS)
   - comma-separated, example: idea dimension,neon atlas,the violet transit
   - or store them in a `ticketmaster_keywords` tab and set `GOOGLE_SHEETS_TICKETMASTER_KEYWORDS_GID`
4. Choose country filter (TICKETMASTER_COUNTRY_CODE)
   - example: GB, US, CA
5. Start with conservative API usage:
   - TICKETMASTER_PAGE_SIZE=100
   - TICKETMASTER_MAX_PAGES=2

How matching works:
- The script queries Ticketmaster Discovery API per keyword
- Keywords are loaded from Google Sheets when `GOOGLE_SHEETS_SPREADSHEET_ID` and `GOOGLE_SHEETS_TICKETMASTER_KEYWORDS_GID` are set
- If those are not set, it falls back to `TICKETMASTER_KEYWORDS`
- It maps events into your events table
- Upsert key is (source, source_event_id)
- source is ticketmaster, source_event_id is Ticketmaster event id
- Re-runs update existing rows instead of creating duplicates

## 7) Data ownership model

Recommended source behavior:
- Manual entries in Supabase: `source = manual`
- Sheet-driven entries: `source = google_sheet`
- Ticketmaster entries: `source = ticketmaster`

The app reads all published rows from Supabase and stays unchanged.
