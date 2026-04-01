function renderSidebar() {
  const list = document.getElementById('entry-list');
  const filtered = getFilteredEntries();

  document.getElementById('entry-count').textContent = `${filtered.length} entr${filtered.length === 1 ? 'y' : 'ies'}`;

  if (filtered.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <span>📭</span>
        No entries found
      </div>`;
    return;
  }

  list.innerHTML = filtered.map(e => `
    <div class="entry-item${activeEntry && activeEntry.filename === e.filename ? ' active' : ''}"
         data-filename="${e.filename}" onclick="selectEntry('${e.filename}')">
      <div class="entry-dot ${e.category}"></div>
      <div class="entry-info">
        <div class="entry-title">${escapeHtml(e.title)}</div>
        <div class="entry-meta">${e.category}${e.date ? ' · ' + e.date : ''}</div>
      </div>
    </div>
  `).join('');
}

function getFilteredEntries() {
  return entries.filter(e => {
    if (activeFilter !== 'all' && e.category !== activeFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return e.title.toLowerCase().includes(q) ||
        e.category.includes(q) ||
        e.tags.some(t => t.toLowerCase().includes(q));
    }
    return true;
  });
}

function selectEntry(filename) {
  const entry = entries.find(e => e.filename === filename);
  if (!entry) return;
  activeEntry = entry;
  renderSidebar();
  renderEntry(entry);

  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('mobile-overlay').classList.remove('open');
}

function renderEntry(entry) {
  const area = document.getElementById('content-area');
  const tagsHtml = entry.tags.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('');

  area.innerHTML = `
    <div class="entry-view">
      <div class="entry-view-header">
        <div class="entry-view-tags">
          <span class="category-badge ${entry.category}">${entry.category}</span>
          ${tagsHtml}
        </div>
        <h1>${escapeHtml(entry.title)}</h1>
        ${entry.date ? `<div class="entry-meta" style="margin-top:4px">Created ${entry.date}</div>` : ''}
      </div>
      <div class="markdown-body" id="markdown-body"></div>
    </div>
  `;

  document.getElementById('markdown-body').innerHTML = marked.parse(entry.body);
  document.getElementById('topbar-title').textContent = entry.title;
}

function showWelcome() {
  const area = document.getElementById('content-area');
  area.innerHTML = `
    <div class="welcome-screen">
      <div class="welcome-icon">📖</div>
      <h2>Welcome to your Glossary</h2>
      <p>Select an entry from the sidebar or create a new one. Your ideas, concepts, and projects live here.</p>
    </div>
  `;
  document.getElementById('topbar-title').textContent = 'Glossary';
}

function showContentLoading() {
  const area = document.getElementById('content-area');
  area.innerHTML = `<div class="loading"><div class="spinner"></div></div>`;
}
