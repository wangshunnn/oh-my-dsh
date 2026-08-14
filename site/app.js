const PAGE_SIZE = 20;

const copy = {
  zh: {
    loading: "正在读取 Registry…", autoRefresh: "每 8 小时更新",
    searchLabel: "搜索插件", searchPlaceholder: "搜索插件、作者、标签或功能…",
    popular: "热门", latest: "最新", curated: "精选",
    kindLabel: "类型", categoryLabel: "分类", allKinds: "全部类型", allCategories: "全部分类",
    plugins: "插件", reset: "清除筛选", listView: "列表", cardView: "卡片", emptyTitle: "没有找到匹配的插件", emptyCopy: "试试更短的关键词，或清除筛选。", loadMore: "加载更多",
    disclaimer: "Bundle 检测仅说明结构可安装，不代表兼容性或安全审查。", statusGuide: "状态说明",
    collectionAll: "全部精选", noDescription: "暂无简介。", copyInstall: "复制安装命令", copied: "安装命令已复制", viewRepository: "查看仓库",
    registryMeta: (count, date) => `${count.toLocaleString()} 个社区项目 · 更新于 ${date}`,
    resultCount: (count) => `${count.toLocaleString()} 个结果`, remaining: (count) => `剩余 ${count.toLocaleString()}`,
    loadError: "Registry 暂时无法载入，请稍后刷新。",
  },
  en: {
    loading: "Reading the registry…", autoRefresh: "Updated every 8 hours",
    searchLabel: "Search plugins", searchPlaceholder: "Search plugins, authors, tags, or features…",
    popular: "Popular", latest: "Latest", curated: "Curated",
    kindLabel: "Kind", categoryLabel: "Category", allKinds: "All kinds", allCategories: "All categories",
    plugins: "Plugins", reset: "Clear filters", listView: "List", cardView: "Cards", emptyTitle: "No matching plugins", emptyCopy: "Try a shorter query or clear your filters.", loadMore: "Load more",
    disclaimer: "Bundle detection only confirms installable structure, not compatibility or security review.", statusGuide: "Status guide",
    collectionAll: "All curated", noDescription: "No description yet.", copyInstall: "Copy install", copied: "Install command copied", viewRepository: "View repository",
    registryMeta: (count, date) => `${count.toLocaleString()} community projects · Updated ${date}`,
    resultCount: (count) => `${count.toLocaleString()} results`, remaining: (count) => `${count.toLocaleString()} remaining`,
    loadError: "The registry could not be loaded. Please refresh shortly.",
  },
};

const labels = {
  kind: {
    plugin: ["插件", "Plugin"], bundle: ["套装", "Bundle"], skin: ["皮肤", "Skin"], client: ["客户端", "Client"],
    application: ["应用", "Application"], collection: ["集合", "Collection"], resource: ["资源", "Resource"], unknown: ["其他", "Other"],
  },
  status: {
    "manifest-detected": ["Bundle detected", "Bundle detected"], "legacy-manifest-detected": ["Legacy", "Legacy"],
    "structure-detected": ["发现结构", "Structure found"], unverified: ["未验证", "Unverified"], placeholder: ["占位仓库", "Placeholder"], archived: ["已归档", "Archived"],
  },
};

const allowedViews = new Set(["popular", "latest", "curated"]);
const allowedThemes = new Set(["light", "dark", "system"]);
const systemTheme = matchMedia("(prefers-color-scheme: dark)");
const params = new URLSearchParams(location.search);
const storedLanguage = localStorage.getItem("oh-my-dsh-lang");
const storedLayout = localStorage.getItem("oh-my-dsh-layout");
const storedTheme = localStorage.getItem("oh-my-dsh-theme");
const state = {
  plugins: [], collections: [], filtered: [], curatedIds: new Set(), visible: PAGE_SIZE,
  lang: storedLanguage === "en" ? "en" : "zh",
  view: allowedViews.has(params.get("view")) ? params.get("view") : "popular",
  collection: params.get("collection") || "", generatedAt: null,
  layout: storedLayout === "grid" ? "grid" : "list",
  theme: allowedThemes.has(storedTheme) ? storedTheme : "system",
};

const $ = (selector) => document.querySelector(selector);
const elements = {
  language: $("#languageSwitch"), theme: $("#themeSwitch"), themeColor: $("#themeColorMeta"), search: $("#searchInput"), tabs: $("#viewTabs"), kind: $("#kindFilter"), category: $("#categoryFilter"),
  collectionTabs: $("#collectionTabs"), registryMeta: $("#registryMeta"), count: $("#resultsCount"), reset: $("#resetFilters"),
  grid: $("#pluginGrid"), layoutToggle: $("#layoutToggle"), empty: $("#emptyState"), loadMore: $("#loadMoreButton"), loadMoreCount: $("#loadMoreCount"), toast: $("#toast"),
};

function t(key) { return copy[state.lang][key]; }
function localLabel(group, key) { const pair = labels[group][key]; return pair ? pair[state.lang === "zh" ? 0 : 1] : key; }
function titleCase(value) { return value.split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" "); }
function compactNumber(value) { return new Intl.NumberFormat(state.lang === "zh" ? "zh-CN" : "en", { notation: "compact", maximumFractionDigits: 1 }).format(value); }

function applyTheme() {
  const resolved = state.theme === "system" ? (systemTheme.matches ? "dark" : "light") : state.theme;
  document.documentElement.dataset.theme = resolved;
  document.documentElement.dataset.themePreference = state.theme;
  elements.themeColor.content = resolved === "dark" ? "#0a0a0a" : "#f9f8f8";
  elements.theme.setAttribute("aria-label", state.lang === "zh" ? "主题" : "Theme");
  const themeLabels = state.lang === "zh"
    ? { light: ["亮色模式", "亮色", "亮", "亮色"], system: ["跟随系统", "系统", "自动", "跟随系统"], dark: ["暗色模式", "暗色", "暗", "暗色"] }
    : { light: ["Light theme", "Light", "Light", "Light"], system: ["Use system theme", "System", "Auto", "System"], dark: ["Dark theme", "Dark", "Dark", "Dark"] };
  const activeTheme = themeLabels[state.theme];
  const trigger = elements.theme.querySelector(".preference-trigger");
  trigger.textContent = activeTheme[2];
  trigger.setAttribute("aria-label", `${state.lang === "zh" ? "当前主题" : "Current theme"}: ${activeTheme[1]}`);
  elements.theme.querySelectorAll("button[data-theme]").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.theme === state.theme));
    button.setAttribute("aria-label", themeLabels[button.dataset.theme][0]);
    button.title = themeLabels[button.dataset.theme][1];
    button.textContent = themeLabels[button.dataset.theme][3];
  });
}

function applyLanguage() {
  document.documentElement.lang = state.lang === "zh" ? "zh-CN" : "en";
  document.querySelectorAll("[data-i18n]").forEach((node) => { const value = t(node.dataset.i18n); if (typeof value === "string") node.textContent = value; });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((node) => { node.placeholder = t(node.dataset.i18nPlaceholder); });
  elements.language.setAttribute("aria-label", state.lang === "zh" ? "语言" : "Language");
  elements.language.querySelectorAll("button[data-lang]").forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.lang === state.lang)));
  const languageTrigger = elements.language.querySelector(".preference-trigger");
  languageTrigger.textContent = state.lang === "zh" ? "中" : "EN";
  languageTrigger.setAttribute("aria-label", state.lang === "zh" ? "当前语言：中文" : "Current language: English");
  applyTheme();
  if (state.plugins.length) {
    populateFilters(true); renderCollectionTabs(); updateRegistryMeta(); applyFilters({ updateUrl: false });
  }
}

function populateSelect(select, values, group, preserve = false) {
  const selected = preserve ? select.value : "";
  const first = select.options[0];
  select.replaceChildren(first);
  [...values].sort((a, b) => a.localeCompare(b)).forEach((value) => {
    const option = document.createElement("option"); option.value = value; option.textContent = group ? localLabel(group, value) : titleCase(value); select.append(option);
  });
  select.value = selected;
}

function populateFilters(preserve = false) {
  populateSelect(elements.kind, new Set(state.plugins.map((plugin) => plugin.kind)), "kind", preserve);
  populateSelect(elements.category, new Set(state.plugins.flatMap((plugin) => plugin.categories)), null, preserve);
}

function updateRegistryMeta() {
  const locale = state.lang === "zh" ? "zh-CN" : "en-US";
  const date = new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
  }).format(new Date(state.generatedAt));
  elements.registryMeta.textContent = t("registryMeta")(state.plugins.length, date);
}

function applyLayout() {
  elements.grid.classList.toggle("is-list", state.layout === "list");
  elements.layoutToggle.querySelectorAll("button").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.layout === state.layout));
  });
}

function renderCollectionTabs() {
  elements.collectionTabs.replaceChildren();
  const options = [{ slug: "", title: t("collectionAll") }, ...state.collections];
  if (!options.some((option) => option.slug === state.collection)) state.collection = "";
  options.forEach((collection) => {
    const button = document.createElement("button"); button.type = "button"; button.dataset.collection = collection.slug; button.textContent = collection.title;
    button.classList.toggle("is-active", collection.slug === state.collection);
    button.addEventListener("click", () => { state.collection = collection.slug; state.visible = PAGE_SIZE; renderCollectionTabs(); applyFilters(); });
    elements.collectionTabs.append(button);
  });
  elements.collectionTabs.hidden = state.view !== "curated";
}

function searchScore(plugin, query) {
  if (!query) return 0;
  const needle = query.toLocaleLowerCase();
  const id = plugin.id.toLocaleLowerCase();
  const name = plugin.name.toLocaleLowerCase();
  let score = 0;
  if (name === needle || id === needle) score += 100;
  if (name.startsWith(needle)) score += 50;
  if (name.includes(needle) || id.includes(needle)) score += 25;
  if ((plugin.description || "").toLocaleLowerCase().includes(needle)) score += 8;
  if ([...plugin.categories, ...plugin.topics].some((value) => value.toLocaleLowerCase().includes(needle))) score += 5;
  return score;
}

function pluginMatches(plugin, query) {
  if (!query) return true;
  return searchScore(plugin, query) > 0 || [plugin.owner, plugin.language].filter(Boolean).join(" ").toLocaleLowerCase().includes(query.toLocaleLowerCase());
}

function applyFilters({ updateUrl = true } = {}) {
  const query = elements.search.value.trim();
  let collectionIds = null;
  if (state.view === "curated") {
    if (state.collection) collectionIds = new Set(state.collections.find((item) => item.slug === state.collection)?.plugins || []);
    else collectionIds = state.curatedIds;
  }

  state.filtered = state.plugins.filter((plugin) =>
    pluginMatches(plugin, query) &&
    (!collectionIds || collectionIds.has(plugin.id)) &&
    (!elements.kind.value || plugin.kind === elements.kind.value) &&
    (!elements.category.value || plugin.categories.includes(elements.category.value))
  );

  state.filtered.sort((a, b) => {
    if (query) return searchScore(b, query) - searchScore(a, query) || b.metrics.stars - a.metrics.stars;
    if (state.view === "latest") return new Date(b.repositoryState.updatedAt || 0) - new Date(a.repositoryState.updatedAt || 0);
    return b.metrics.stars - a.metrics.stars || a.id.localeCompare(b.id);
  });

  elements.tabs.querySelectorAll("button").forEach((button) => button.classList.toggle("is-active", button.dataset.view === state.view));
  renderCollectionTabs();
  if (updateUrl) updateQueryParams();
  renderPlugins();
}

function updateQueryParams() {
  const next = new URLSearchParams();
  if (elements.search.value.trim()) next.set("q", elements.search.value.trim());
  if (state.view !== "popular") next.set("view", state.view);
  if (state.view === "curated" && state.collection) next.set("collection", state.collection);
  if (elements.kind.value) next.set("kind", elements.kind.value);
  if (elements.category.value) next.set("category", elements.category.value);
  history.replaceState(null, "", `${location.pathname}${next.size ? `?${next}` : ""}${location.hash}`);
}

function renderPlugins() {
  const shown = state.filtered.slice(0, state.visible);
  elements.grid.replaceChildren(); shown.forEach((plugin) => elements.grid.append(createPluginCard(plugin)));
  elements.grid.hidden = state.filtered.length === 0; elements.empty.hidden = state.filtered.length !== 0;
  elements.count.textContent = t("resultCount")(state.filtered.length);
  const remaining = state.filtered.length - shown.length;
  elements.loadMore.hidden = remaining <= 0; elements.loadMoreCount.textContent = remaining > 0 ? t("remaining")(remaining) : "";
  elements.reset.hidden = !hasActiveFilters();
}

function createPluginCard(plugin) {
  const card = $("#pluginCardTemplate").content.firstElementChild.cloneNode(true);
  card.querySelector(".kind-badge").textContent = localLabel("kind", plugin.kind);
  const status = card.querySelector(".status-badge");
  status.textContent = localLabel("status", plugin.verification.status);
  status.classList.add(plugin.verification.status === "manifest-detected" ? "is-manifest" : plugin.verification.status === "legacy-manifest-detected" ? "is-legacy" : plugin.verification.status === "structure-detected" ? "is-structure" : "is-neutral");
  card.querySelector(".external-link").href = plugin.url;
  card.querySelector(".plugin-owner").textContent = plugin.owner;
  const link = card.querySelector(".plugin-link"); link.href = plugin.url; link.textContent = plugin.name;
  card.querySelector(".plugin-description").textContent = plugin.description || t("noDescription");
  const tags = card.querySelector(".plugin-tags");
  (plugin.categories.length ? plugin.categories : ["other"]).slice(0, 3).forEach((category) => { const span = document.createElement("span"); span.textContent = titleCase(category); tags.append(span); });
  card.querySelector(".plugin-stars").textContent = compactNumber(plugin.metrics.stars);
  card.querySelector(".plugin-license").textContent = plugin.license.spdx || "—";
  card.querySelector(".plugin-language").textContent = plugin.language || "—";
  const action = card.querySelector(".card-action");
  if (plugin.install.available && plugin.install.command) {
    const button = document.createElement("button"); button.type = "button"; button.className = "install-command"; button.textContent = t("copyInstall");
    button.setAttribute("aria-label", `${t("copyInstall")}: ${plugin.install.command}`);
    button.addEventListener("click", () => copyInstall(plugin.install.command)); action.append(button);
  } else {
    const repo = document.createElement("a"); repo.className = "view-repository"; repo.href = plugin.url; repo.target = "_blank"; repo.rel = "noreferrer"; repo.textContent = t("viewRepository"); action.append(repo);
  }
  return card;
}

async function copyInstall(command) {
  try { await navigator.clipboard.writeText(command); showToast(t("copied")); }
  catch { showToast(command); }
}

let toastTimer;
function showToast(message) { elements.toast.textContent = message; elements.toast.classList.add("is-visible"); clearTimeout(toastTimer); toastTimer = setTimeout(() => elements.toast.classList.remove("is-visible"), 2100); }
function hasActiveFilters() { return Boolean(elements.search.value || state.view !== "popular" || elements.kind.value || elements.category.value); }
function resetFilters() {
  elements.search.value = ""; state.view = "popular"; state.collection = ""; elements.kind.value = ""; elements.category.value = ""; state.visible = PAGE_SIZE; applyFilters();
}

function restoreFilters() {
  elements.search.value = params.get("q") || "";
  elements.kind.value = params.get("kind") || "";
  elements.category.value = params.get("category") || "";
}

function closePreferenceMenus(except = null) {
  [elements.language, elements.theme].forEach((menu) => {
    if (menu === except) return;
    menu.classList.remove("is-open");
    menu.querySelector(".preference-trigger").setAttribute("aria-expanded", "false");
  });
}

function bindPreferenceMenu(menu) {
  const trigger = menu.querySelector(".preference-trigger");
  trigger.addEventListener("click", () => {
    const open = !menu.classList.contains("is-open");
    closePreferenceMenus(menu);
    menu.classList.toggle("is-open", open);
    trigger.setAttribute("aria-expanded", String(open));
  });
}

async function init() {
  applyLanguage();
  applyLayout();
  try {
    const [registryResponse, collectionsResponse] = await Promise.all([fetch("./data/plugins.json"), fetch("./data/collections.json")]);
    if (!registryResponse.ok || !collectionsResponse.ok) throw new Error("Data request failed");
    const registry = await registryResponse.json();
    state.plugins = registry.plugins; state.collections = await collectionsResponse.json(); state.generatedAt = registry.generatedAt;
    state.curatedIds = new Set(state.collections.flatMap((collection) => collection.plugins));
    populateFilters(); restoreFilters(); updateRegistryMeta(); renderCollectionTabs(); applyFilters({ updateUrl: false });
  } catch (error) {
    console.error(error); elements.registryMeta.textContent = t("loadError"); elements.grid.replaceChildren();
  }
}

elements.tabs.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-view]"); if (!button) return;
  state.view = button.dataset.view; state.collection = ""; state.visible = PAGE_SIZE; applyFilters();
});
elements.layoutToggle.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-layout]"); if (!button) return;
  state.layout = button.dataset.layout; localStorage.setItem("oh-my-dsh-layout", state.layout); applyLayout();
});
[elements.search, elements.kind, elements.category].forEach((element) => element.addEventListener("input", () => { state.visible = PAGE_SIZE; applyFilters(); }));
elements.reset.addEventListener("click", resetFilters);
elements.loadMore.addEventListener("click", () => { state.visible += PAGE_SIZE; renderPlugins(); });
elements.language.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-lang]"); if (!button) return;
  if (button.dataset.lang !== state.lang) { state.lang = button.dataset.lang; localStorage.setItem("oh-my-dsh-lang", state.lang); applyLanguage(); }
  closePreferenceMenus();
  button.blur();
});
elements.theme.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-theme]"); if (!button) return;
  if (button.dataset.theme !== state.theme) { state.theme = button.dataset.theme; localStorage.setItem("oh-my-dsh-theme", state.theme); applyTheme(); }
  closePreferenceMenus();
  button.blur();
});
bindPreferenceMenu(elements.language);
bindPreferenceMenu(elements.theme);
document.addEventListener("click", (event) => { if (!event.target.closest(".preference-menu")) closePreferenceMenus(); });
systemTheme.addEventListener("change", () => { if (state.theme === "system") applyTheme(); });
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closePreferenceMenus();
  if ((event.metaKey || event.ctrlKey) && event.key.toLocaleLowerCase() === "k") { event.preventDefault(); elements.search.focus(); }
});

init();
