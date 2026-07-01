document.addEventListener("DOMContentLoaded", async () => {
  const tabs = document.querySelectorAll(".tab-btn");
  const tabContents = document.querySelectorAll(".tab-content");
  const settingsToggle = document.getElementById("settings-toggle");
  const settingsPane = document.getElementById("settings-pane");
  const hostInput = document.getElementById("host-input");
  const saveSettingsBtn = document.getElementById("save-settings");

  const noteTitleInput = document.getElementById("note-title");
  const noteContentInput = document.getElementById("note-content");
  const sendNoteBtn = document.getElementById("send-note-btn");

  const projTitleInput = document.getElementById("project-title");
  const projCategorySelect = document.getElementById("project-category");
  const projContentInput = document.getElementById("project-content");
  const sendProjBtn = document.getElementById("send-project-btn");

  const settings = await browser.storage.local.get({
    host: "https://jesse-rr.github.io"
  });
  hostInput.value = settings.host;

  const [activeTab] = await browser.tabs.query({ active: true, currentWindow: true });
  if (activeTab) {
    noteTitleInput.value = activeTab.title ? activeTab.title.substring(0, 30) : "New Note";
    noteContentInput.value = `Reference: ${activeTab.url}\n\n`;

    projTitleInput.value = activeTab.title ? activeTab.title.substring(0, 30) : "New Idea";
    projContentInput.value = `# Link\n[${activeTab.title}](${activeTab.url})\n\n`;
  }

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      tabContents.forEach(c => c.classList.add("hidden"));

      tab.classList.add("active");
      const target = tab.getAttribute("data-tab");
      document.getElementById(target).classList.remove("hidden");
    });
  });

  settingsToggle.addEventListener("click", () => {
    settingsPane.classList.toggle("hidden");
  });

  saveSettingsBtn.addEventListener("click", async () => {
    let hostValue = hostInput.value.trim();
    if (hostValue.endsWith("/")) {
      hostValue = hostValue.slice(0, -1);
    }
    await browser.storage.local.set({ host: hostValue });
    settingsPane.classList.add("hidden");
  });

  sendNoteBtn.addEventListener("click", async () => {
    const host = (await browser.storage.local.get("host")).host || "https://jesse-rr.github.io";
    const title = noteTitleInput.value.trim() || "New Note";
    const content = noteContentInput.value.trim();
    const url = `${host}/notes?action=new-note&title=${encodeURIComponent(title)}&content=${encodeURIComponent(content)}`;
    browser.tabs.create({ url });
  });

  sendProjBtn.addEventListener("click", async () => {
    const host = (await browser.storage.local.get("host")).host || "https://jesse-rr.github.io";
    const title = projTitleInput.value.trim() || "New Project";
    const category = projCategorySelect.value;
    const content = projContentInput.value.trim();
    const url = `${host}/projects?action=new-project&title=${encodeURIComponent(title)}&category=${category}&content=${encodeURIComponent(content)}`;
    browser.tabs.create({ url });
  });
});
