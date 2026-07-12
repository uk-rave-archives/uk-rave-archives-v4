window.TAPE_ARCHIVE_CONFIG = {
  archiveIdentifier: "helter-skelter-tape-packs",
  metadataUrl: "https://archive.org/metadata/helter-skelter-tape-packs",
  detailsUrl: "https://archive.org/details/helter-skelter-tape-packs",
  downloadBase: "https://archive.org/download/helter-skelter-tape-packs/",
  artwork: "https://archive.org/services/img/helter-skelter-tape-packs"
};

window.TAPE_PACKS = [
  {
    id: "hs00-milwaukees",
    folderMatch: "(HS00) Helter Skelter - Milwaukees",
    title: "Helter Skelter — Milwaukees",
    promoter: "Helter Skelter",
    year: 1991,
    yearLabel: "1991",
    venue: "Milwaukees",
    genres: ["Breakbeat Hardcore", "Drum & Bass"],
    format: "Event tape pack",
    status: "playable",
    artwork: "https://archive.org/services/img/helter-skelter-tape-packs",
    source: "https://archive.org/details/helter-skelter-tape-packs/HS+1-36/(HS00)+Helter+Skelter+-+Milwaukees",
    summary: "Early Helter Skelter recordings from Milwaukees, grouped from the original Archive.org event folder.",
    seedTracks: [
      {
        title: "Grooverider (1991) — Side A",
        artist: "Grooverider",
        side: "A",
        file: "HS 1-36/(HS00) Helter Skelter - Milwaukees/Helter Skelter - Milwaukees - Grooverider (1991) (Side A).mp3"
      },
      {
        title: "Grooverider (1991) — Side B",
        artist: "Grooverider",
        side: "B",
        file: "HS 1-36/(HS00) Helter Skelter - Milwaukees/Helter Skelter - Milwaukees - Grooverider (1991) (Side B).mp3"
      }
    ]
  }
];

window.TAPE_ARCHIVE_YEARS = Array.from({length: 18}, (_, index) => 1988 + index);
