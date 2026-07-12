
window.BTOS_ARCHIVE_ENGINE = (() => {
  const archive = window.BTOS_MASTER_ARCHIVE || {collections:{}};
  const relations = window.BTOS_MASTER_RELATIONS || {};
  const quality = window.BTOS_MASTER_QUALITY || [];

  const collection = name => archive.collections?.[name] || [];
  const get = (type, id) => collection(type).find(item => item.id === id) || null;
  const relatedIds = (type, id, targetType) =>
    relations[`${type}:${id}`]?.[targetType] || [];
  const related = (type, id, targetType) =>
    relatedIds(type, id, targetType).map(targetId => get(targetType, targetId)).filter(Boolean);

  const search = query => {
    const q = String(query || "").trim().toLowerCase();
    if (!q) return [];
    const results = [];
    for (const [type, records] of Object.entries(archive.collections || {})) {
      for (const record of records) {
        const haystack = JSON.stringify(record).toLowerCase();
        if (haystack.includes(q)) results.push({type, record});
      }
    }
    return results;
  };

  const issuesFor = (collectionName, id) =>
    quality.filter(item => item.collection === collectionName && item.id === id);

  return {archive, collection, get, relatedIds, related, search, issuesFor, quality};
})();
