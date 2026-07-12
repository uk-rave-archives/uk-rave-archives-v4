
window.BTOS_ARTISTS = (window.BTOS_MASTER_ARCHIVE?.collections?.artists || []).map(a => ({
  id: a.id,
  name: a.name,
  role: a.role,
  public: a.public,
  activeFrom: a.activeFrom,
  archiveTo: a.archiveTo,
  origin: a.origin,
  styles: a.styles || [],
  aliases: a.aliases || [],
  image: a.image,
  photoCredit: a.photoCredit,
  summary: a.summary,
  biography: a.biography || [],
  yearData: a.timeline || {},
  tapes: (window.BTOS_ARCHIVE_ENGINE?.related("artists", a.id, "tapePacks") || []).map(p => ({
    title: p.name,
    href: `packs.html?pack=${p.id}`
  })),
  flyers: [],
  events: (window.BTOS_ARCHIVE_ENGINE?.related("artists", a.id, "events") || []).map(e => ({
    title: e.name,
    href: `event.html?id=${e.id}`
  })),
  sources: a.sources || []
}));
