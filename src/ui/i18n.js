import { settings } from "../app/state.js";
import en from "./messages.en.js";
import de from "./messages.de.js";

const catalogs = { en, de };
const legacyKeys = Object.keys(en).filter((key) => key.startsWith("legacy:"));
const legacyKeysByGermanText = new Map(legacyKeys.map((key) => [de[key], key]));
const legacyEntries = Object.fromEntries(
  ["de", "en"].map((language) => [
    language,
    legacyKeys
      .map((key) => ({
        from: language === "de" ? en[key] : de[key],
        to: catalogs[language][key],
      }))
      .filter(({ from, to }) => from && to && from !== to)
      .sort((a, b) => b.from.length - a.from.length),
  ]),
);

export const currentLanguage = () => (settings.language === "en" ? "en" : "de");

/** Translate a stable message key and interpolate its named parameters. */
export function t(key, params = {}) {
  const language = currentLanguage();
  const lookupKey = Object.prototype.hasOwnProperty.call(catalogs.en, key)
    ? key
    : (legacyKeysByGermanText.get(key) ?? `legacy:${key}`);
  const message =
    catalogs[language][lookupKey] ?? catalogs.en[lookupKey] ?? key;
  return message.replace(/\{([a-zA-Z0-9_]+)\}/g, (placeholder, name) =>
    Object.prototype.hasOwnProperty.call(params, name)
      ? String(params[name])
      : placeholder,
  );
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Transitional bridge for templates that have not yet moved to t(key).
// New UI and runtime messages should use explicit catalog keys directly.
function translateLegacy(value, language = currentLanguage()) {
  let output = String(value);
  for (const { from, to } of legacyEntries[language]) {
    const left = /^[A-Za-z0-9_]/.test(from) ? "(^|[^A-Za-z0-9_])" : "";
    const right = /[A-Za-z0-9_]$/.test(from) ? "(?![A-Za-z0-9_])" : "";
    const expression = new RegExp(left + escapeRegExp(from) + right, "g");
    output = output.replace(expression, (...match) =>
      left ? match[1] + to : to,
    );
  }
  return output;
}

export function localizeDOM(root = document.body) {
  const language = currentLanguage();
  if (document.documentElement) document.documentElement.lang = language;
  if (
    !document.createTreeWalker ||
    !root.querySelectorAll ||
    typeof NodeFilter === "undefined"
  )
    return;

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      return node.parentElement?.closest("script, style, textarea, code")
        ? NodeFilter.FILTER_REJECT
        : NodeFilter.FILTER_ACCEPT;
    },
  });
  while (walker.nextNode()) {
    const node = walker.currentNode;
    const value = translateLegacy(node.nodeValue, language);
    if (value !== node.nodeValue) node.nodeValue = value;
  }
  for (const element of root.querySelectorAll(
    "[aria-label], [placeholder], [title], [alt]",
  ))
    for (const attr of ["aria-label", "placeholder", "title", "alt"])
      if (element.hasAttribute(attr))
        element.setAttribute(
          attr,
          translateLegacy(element.getAttribute(attr), language),
        );
}

export function watchLocalization() {
  if (observer || !document.body) return;
  observer = new MutationObserver((changes) => {
    const language = currentLanguage();
    for (const change of changes)
      for (const added of change.addedNodes) {
        if (added.nodeType === Node.ELEMENT_NODE) localizeDOM(added);
        else if (added.nodeType === Node.TEXT_NODE)
          added.nodeValue = translateLegacy(added.nodeValue, language);
      }
  });
  observer.observe(document.body, { subtree: true, childList: true });
}

let observer;
