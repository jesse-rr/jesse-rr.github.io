function parseEntry(filename, raw) {
  const fm = {};
  let body = raw;

  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (match) {
    const lines = match[1].split('\n');
    lines.forEach(line => {
      const idx = line.indexOf(':');
      if (idx === -1) return;
      const key = line.slice(0, idx).trim();
      let val = line.slice(idx + 1).trim();
      if (val.startsWith('[') && val.endsWith(']')) {
        val = val.slice(1, -1).split(',').map(s => s.trim().replace(/^["']|["']$/g, ''));
      }
      fm[key] = val;
    });
    body = match[2];
  }

  return {
    filename,
    title: fm.title || filenameToTitle(filename),
    category: (fm.category || 'concept').toLowerCase(),
    tags: Array.isArray(fm.tags) ? fm.tags : [],
    date: fm.date || '',
    body
  };
}

async function loadEntries() {
  showContentLoading();
  try {
    const resp = await fetch(`${ENTRIES_DIR}/index.json?_=${Date.now()}`);
    if (!resp.ok) throw new Error('Could not load manifest');
    const filenames = await resp.json();

    const loaded = await Promise.all(
      filenames.map(async (fname) => {
        try {
          const r = await fetch(`${ENTRIES_DIR}/${fname}?_=${Date.now()}`);
          if (!r.ok) return null;
          const raw = await r.text();
          return parseEntry(fname, raw);
        } catch { return null; }
      })
    );

    entries = loaded.filter(Boolean).sort((a, b) => a.title.localeCompare(b.title));
    renderSidebar();
    showWelcome();
  } catch (err) {
    console.error(err);
    showWelcome();
  }
}
