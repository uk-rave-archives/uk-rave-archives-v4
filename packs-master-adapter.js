
window.BTOS_TAPE_PACKS = (window.BTOS_MASTER_ARCHIVE?.collections?.tapePacks || []).map(p => {
  const engine = window.BTOS_ARCHIVE_ENGINE;
  const artistRecords = (p.artistIds || []).map(id => engine.get("artists", id)).filter(Boolean);
  const recordings = engine.related("tapePacks", p.id, "recordings");
  const videos = engine.related("tapePacks", p.id, "videos");
  const promoter = p.promoterId ? engine.get("promoters", p.promoterId) : null;
  const event = p.eventId ? engine.get("events", p.eventId) : null;
  const venue = p.venueId ? engine.get("venues", p.venueId) : null;
  return {
    id: p.id,
    name: p.name,
    series: p.series,
    year: p.year,
    type: p.format,
    status: p.status,
    cover: p.cover,
    coverFallbacks: p.coverFallbacks || [],
    coverCredit: p.coverCredit,
    artists: artistRecords.map(a => ({id:a.id,name:a.name})),
    promoter: promoter ? {id:promoter.id,name:promoter.name,href:`promoters.html?promoter=${promoter.id}`} : null,
    event: event ? {id:event.id,name:event.name,href:`event.html?id=${event.id}`} : null,
    venue: venue ? {id:venue.id,name:venue.name,href:`venues.html?venue=${venue.id}`} : null,
    audio: recordings.map(r => ({
      id:r.id,title:r.title,artistId:r.artistId,
      artist:engine.get("artists",r.artistId)?.name || "",
      side:r.side,src:r.audioUrl,source:r.source,sourceHref:r.sourceHref
    })),
    videos: videos.map(v => ({
      id:v.id,title:v.title,year:v.year,type:v.videoType,artists:v.artistIds || [],
      url:v.url,thumbnail:v.thumbnail,thumbnailFallbacks:v.thumbnailFallbacks || [],
      sourceCredit:v.sourceCredit
    })),
    sources: p.sourceLinks || []
  };
});
window.BTOS_ARTISTS = (window.BTOS_MASTER_ARCHIVE?.collections?.artists || []);
