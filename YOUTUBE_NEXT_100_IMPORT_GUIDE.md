# Phase 3.43 — Next 100 YouTube Videos

The site files already display mapped videos with thumbnails.

The batch importer retrieves the next 100 uploads from the channel using the
official YouTube Data API. It does not read comments.

## Run the import

macOS / Linux:

```bash
export YOUTUBE_API_KEY="YOUR_KEY"
python youtube-channel-batch-importer.py --limit 100
```

Windows PowerShell:

```powershell
$env:YOUTUBE_API_KEY="YOUR_KEY"
python youtube-channel-batch-importer.py --limit 100
```

## Generated files

- `youtube-archive-data.generated.js`
- `youtube-video-review.csv`
- `youtube-video-import-report.json`

Review the CSV, correct uncertain artist IDs, rename
`youtube-archive-data.generated.js` to `youtube-archive-data.js`, then upload it.

## Automatic checks

- Existing video IDs are not imported twice.
- Year is extracted only from 1988–2005.
- Artist aliases are matched conservatively.
- Videos missing a confident artist or year go to review.
- Comment tracklists are not used.
- The locked `djs.html` page is untouched.
