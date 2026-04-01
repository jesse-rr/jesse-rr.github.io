let entries = [];
let activeEntry = null;
let activeFilter = 'all';
let searchQuery = '';

document.addEventListener('DOMContentLoaded', () => {
  loadEntries();
  bindUI();
});

function bindUI() {
  document.getElementById('search-input').addEventListener('input', (e) => {
    searchQuery = e.target.value;
    renderSidebar();
  });

  document.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      activeFilter = chip.dataset.cat;
      document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      renderSidebar();
    });
  });

  document.getElementById('btn-new-entry').addEventListener('click', openModal);
  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('modal-overlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeModal();
  });

  document.getElementById('entry-form').addEventListener('submit', handleCreateEntry);

  document.getElementById('hamburger')?.addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('open');
    document.getElementById('mobile-overlay').classList.toggle('open');
  });
  document.getElementById('mobile-overlay')?.addEventListener('click', () => {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('mobile-overlay').classList.remove('open');
  });

  const savedToken = localStorage.getItem('gh_token');
  updateTokenStatus(!!savedToken);

  document.getElementById('btn-save-token').addEventListener('click', () => {
    const val = document.getElementById('token-input').value.trim();
    if (val) {
      localStorage.setItem('gh_token', val);
      document.getElementById('token-input').value = '';
      updateTokenStatus(true);
      showToast('GitHub token saved', 'success');
    }
  });

  document.getElementById('btn-clear-token').addEventListener('click', () => {
    localStorage.removeItem('gh_token');
    updateTokenStatus(false);
    showToast('Token cleared', 'info');
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });
}

function updateTokenStatus(hasToken) {
  const status = document.getElementById('token-status');
  const clearBtn = document.getElementById('btn-clear-token');
  if (hasToken) {
    status.textContent = '✓ Token saved';
    status.className = 'token-status connected';
    clearBtn.style.display = 'inline-block';
  } else {
    status.textContent = 'No token — needed to create entries';
    status.className = 'token-status missing';
    clearBtn.style.display = 'none';
  }
}

function openModal() {
  document.getElementById('modal-overlay').classList.add('open');
  document.getElementById('entry-title-input').focus();
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('open');
}

async function handleCreateEntry(e) {
  e.preventDefault();

  const token = localStorage.getItem('gh_token');
  if (!token) {
    showToast('Please set your GitHub token first (sidebar bottom)', 'error');
    return;
  }

  const title = document.getElementById('entry-title-input').value.trim();
  const category = document.getElementById('entry-category-input').value;
  const tags = document.getElementById('entry-tags-input').value.trim();
  const body = document.getElementById('entry-body-input').value;

  if (!title) {
    showToast('Title is required', 'error');
    return;
  }

  const filename = titleToFilename(title);
  const tagList = tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [];
  const today = new Date().toISOString().split('T')[0];

  const frontMatter = [
    '---',
    `title: ${title}`,
    `category: ${category}`,
    `tags: [${tagList.join(', ')}]`,
    `date: ${today}`,
    '---',
    '',
    body || `# ${title}\n\nWrite your content here...`
  ].join('\n');

  const submitBtn = document.getElementById('btn-submit-entry');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Creating...';

  try {
    const manifestData = await ghGetFile(MANIFEST, token);
    const currentList = JSON.parse(atob(manifestData.content.replace(/\n/g, '')));

    if (currentList.includes(filename)) {
      showToast('An entry with that filename already exists', 'error');
      return;
    }

    await ghCreateFile(
      `${ENTRIES_DIR}/${filename}`,
      frontMatter,
      `Add entry: ${title}`,
      token
    );

    currentList.push(filename);
    currentList.sort();
    await ghUpdateFile(
      MANIFEST,
      JSON.stringify(currentList, null, 2) + '\n',
      `Update manifest: add ${filename}`,
      manifestData.sha,
      token
    );

    showToast(`"${title}" created successfully!`, 'success');
    closeModal();
    document.getElementById('entry-form').reset();

    await loadEntries();
    selectEntry(filename);
  } catch (err) {
    console.error(err);
    showToast(`Error: ${err.message}`, 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Create Entry';
  }
}
