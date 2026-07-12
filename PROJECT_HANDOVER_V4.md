# Back to the Old Skool Archive — Version 4 Unified Build

## What changed
The main public pages now load one shared museum shell so the site no longer feels like several separate websites.

## Shared files
- `site-shell-v4.css`
- `site-shell-v4.js`

## Unified pages
- Home
- Flyers
- Events
- DJs & MCs
- Venues
- Promoters
- Tape Packs
- Search
- Stories
- Radio
- Artist profiles
- Event records
- Flyer records
- People archive

## Locked design rules
Every public page must keep:
- the same logo treatment
- the same black/yellow/white palette
- the same navigation behaviour
- the same typography hierarchy
- the same square-edged buttons and panels
- the same warehouse/museum atmosphere

Page-specific CSS can control content layout, but must not replace the shared header or visual identity.

## Next priorities
1. Reduce multiple artist/event/flyer databases to one canonical source.
2. Remove invalid imported records and merge aliases.
3. Repair remaining legacy links.
4. Move phase/test/recovery files out of the public root.
5. Deduplicate assets without deleting unique archive material.
6. Create a production-only deployment folder.
7. Add automated link and data checks before every GitHub Pages deploy.

## Test
Open:
- `index.html`
- `djs.html`
- `flyers.html`
- `events.html`
- `venues.html`
- `promoters.html`
- `packs.html`
- `search.html`
- `artist.html?id=grooverider`
- `flyer-record.html?id=flyer-056`

See `SITE_UNIFICATION_REPORT.json` for the audit.
