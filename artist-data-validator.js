
(function () {
  const records = window.BTOS_ARTISTS || [];
  const ids = new Set();
  const errors = [];
  records.forEach((artist, index) => {
    const label = artist.id || `record ${index + 1}`;
    if (!artist.id) errors.push(`${label}: missing id`);
    if (ids.has(artist.id)) errors.push(`${label}: duplicate id`);
    ids.add(artist.id);
    if (artist.public) {
      ["name","role","image","photoCredit","summary"].forEach(field => {
        if (!artist[field]) errors.push(`${label}: public record missing ${field}`);
      });
      if (!Array.isArray(artist.biography) || artist.biography.length === 0) {
        errors.push(`${label}: public record missing biography`);
      }
    }
  });
  window.BTOS_ARTIST_VALIDATION = {
    total: records.length,
    public: records.filter(a => a.public).length,
    staged: records.filter(a => !a.public).length,
    errors
  };
})();
