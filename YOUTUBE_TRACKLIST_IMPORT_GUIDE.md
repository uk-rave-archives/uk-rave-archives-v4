# Phase 3.41 — YouTube Comment Tracklist Import

The website integration is complete. The remaining step is to supply the
comments to the importer.

## Option A — Official YouTube Data API

1. Create a YouTube Data API v3 key in Google Cloud.
2. Put the extracted ZIP files in one folder.
3. Run:

```bash
export YOUTUBE_API_KEY="YOUR_KEY"
python youtube-comment-tracklist-importer.py
```

On Windows PowerShell:

```powershell
$env:YOUTUBE_API_KEY="YOUR_KEY"
python youtube-comment-tracklist-importer.py
```

## Option B — Offline comments export

Create `comments-export.json` in this form:

```json
{
  "PbtOJ9o22I8": [
    {
      "author": "Happy Hardcore Gems",
      "text": "Tracklist:\n0:00 Artist - Track [Label]\n4:31 Artist - Track"
    }
  ]
}
```

Then run:

```bash
python youtube-comment-tracklist-importer.py --comments-json comments-export.json
```

## Generated files

- `youtube-tracklists-data.js` — website data
- `youtube-tracklists-review.csv` — review uncertain spellings/matches
- `youtube-tracklists-report.json` — import totals and failures

## Publication safeguards

- Original comment text is not published.
- Only parsed track lines are displayed.
- A track appearance is separate from the DJ who performed the set.
- Unmatched or uncertain artists remain plain text until reviewed.
- Existing profile design is unchanged.
