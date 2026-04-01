async function ghGetFile(path, token) {
  const resp = await fetch(
    `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}?ref=${BRANCH}`,
    { headers: { Authorization: `token ${token}`, Accept: 'application/vnd.github.v3+json' } }
  );
  if (!resp.ok) throw new Error(`Failed to get ${path}: ${resp.status}`);
  return resp.json();
}

async function ghCreateFile(path, content, message, token) {
  const resp = await fetch(
    `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message,
        content: btoa(unescape(encodeURIComponent(content))),
        branch: BRANCH
      })
    }
  );
  if (!resp.ok) {
    const err = await resp.json();
    throw new Error(err.message || `Failed to create ${path}`);
  }
  return resp.json();
}

async function ghUpdateFile(path, content, message, sha, token) {
  const resp = await fetch(
    `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message,
        content: btoa(unescape(encodeURIComponent(content))),
        sha,
        branch: BRANCH
      })
    }
  );
  if (!resp.ok) {
    const err = await resp.json();
    throw new Error(err.message || `Failed to update ${path}`);
  }
  return resp.json();
}
