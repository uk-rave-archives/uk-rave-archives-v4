
window.BTOS_EVENTS = (window.BTOS_MASTER_ARCHIVE?.collections?.events || []).map(e => {
  const engine = window.BTOS_ARCHIVE_ENGINE;
  const promoter = e.promoterId ? engine.get("promoters", e.promoterId) : null;
  const venue = e.venueId ? engine.get("venues", e.venueId) : null;
  const radio = e.radioId ? engine.get("radio", e.radioId) : null;
  const videos = engine.related("events", e.id, "videos");
  const packs = engine.related("events", e.id, "tapePacks");
  const recordings = engine.related("events", e.id, "recordings");
  const artistIds = new Set();
  videos.forEach(v => (v.artistIds || []).forEach(id => artistIds.add(id)));
  packs.forEach(p => (p.artistIds || []).forEach(id => artistIds.add(id)));
  recordings.forEach(r => r.artistId && artistIds.add(r.artistId));
  return {
    id:e.id,
    name:e.name,
    date:e.date,
    year:e.year,
    promoter:promoter,
    venue:venue,
    radio:radio,
    artists:[...artistIds].map(id=>engine.get("artists",id)).filter(Boolean),
    videos,
    tapePacks:packs,
    audio:recordings
  };
});
