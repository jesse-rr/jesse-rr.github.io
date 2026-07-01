browser.contextMenus.create({
  id: "send-to-notes",
  title: "Send to Notes",
  contexts: ["selection"]
});

browser.contextMenus.create({
  id: "send-to-projects",
  title: "Send to Projects",
  contexts: ["page", "link"]
});

browser.contextMenus.onClicked.addListener(async (info, tab) => {
  const settings = await browser.storage.local.get({
    host: "https://jesse-rr.github.io"
  });
  const host = settings.host;

  if (info.menuItemId === "send-to-notes") {
    const text = info.selectionText || "";
    const title = tab.title ? tab.title.substring(0, 30) : "New Selection";
    const targetUrl = `${host}/notes?action=new-note&title=${encodeURIComponent(title)}&content=${encodeURIComponent(text)}`;
    browser.tabs.create({ url: targetUrl });
  } else if (info.menuItemId === "send-to-projects") {
    const pageUrl = info.linkUrl || info.pageUrl || tab.url || "";
    const pageTitle = tab.title || "New Project Reference";
    const content = `# Reference\n\nLink: [${pageTitle}](${pageUrl})\n\nCreated from extension.`;
    const targetUrl = `${host}/projects?action=new-project&title=${encodeURIComponent(pageTitle.substring(0, 40))}&content=${encodeURIComponent(content)}`;
    browser.tabs.create({ url: targetUrl });
  }
});
