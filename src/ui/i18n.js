import { settings } from "../app/state.js";

// Keep source templates in English and translate rendered text/labels at the
// presentation boundary. This keeps forecast/provider data language-neutral.
const pairs = [
  ["Main navigation", "Hauptnavigation"], ["Weather", "Wetter"],
  ["Hourly", "Stündlich"], ["History", "Rückblick"], ["Models", "Modelle"],
  ["Places", "Orte"], ["Settings", "Einstellungen"], ["Use my location", "Meinen Standort verwenden"],
  ["Refresh weather", "Wetter aktualisieren"], ["Opening your weather…", "Wetter wird geladen…"],
  ["Enable your location", "Standort freigeben"], ["Follow these steps, then tap Try location again.", "Folge diesen Schritten und tippe danach erneut auf Standort versuchen."],
  ["On iPhone or iPad", "Auf iPhone oder iPad"], ["Firefox on iOS", "Firefox unter iOS"],
  ["Try location again", "Standort erneut versuchen"], ["Use postcode instead", "Stattdessen Ort oder Postleitzahl suchen"],
  ["Open in browser ↗", "Im Browser öffnen ↗"], ["Location help", "Hilfe zum Standort"],
  ["The browser controls the permission prompt. If access is denied, Wettra cannot force a new prompt or change your settings.", "Der Browser steuert die Standortabfrage. Wenn du den Zugriff ablehnst, kann Wettra keine neue Abfrage erzwingen und deine Einstellungen nicht ändern."],
  ["Open the browser’s site permissions for this address and allow Location. Also check your device’s location privacy settings, then retry.", "Öffne die Website-Berechtigungen deines Browsers für diese Adresse und erlaube den Standortzugriff. Prüfe auch die Datenschutz-Einstellungen deines Geräts und versuche es erneut."],
  ["There is no supported direct iOS Settings link available to this web app. Open Settings manually. The browser link below opens a new window; if it stays inside the app, copy the address into Safari.", "Diese Web-App kann iOS-Einstellungen nicht direkt öffnen. Öffne die Einstellungen manuell. Der Browser-Link öffnet ein neues Fenster; falls er in der App bleibt, kopiere die Adresse nach Safari."],
  ["Android or desktop browser", "Android- oder Desktop-Browser"],
  ["Your places", "Deine Orte"], ["Town, postcode or lat, lon", "Ort, Postleitzahl oder Breitengrad, Längengrad"],
  ["Town, city or postcode", "Ort, Stadt oder Postleitzahl"], ["Location search", "Ortssuche"],
  ["Search locations", "Orte suchen"], ["Find", "Suchen"], ["Search", "Suche"],
  ["Saved places", "Gespeicherte Orte"], ["Saved locations", "Gespeicherte Orte"],
  ["Save place", "Ort speichern"], ["Save current", "Aktuellen Ort speichern"],
  ["Use my current location", "Meinen aktuellen Standort verwenden"], ["Use last selected", "Zuletzt ausgewählten Ort verwenden"],
  ["Last selected location", "Zuletzt ausgewählter Ort"], ["Startup location", "Startort"],
  ["Quick start · Austria", "Schnellwahl · Österreich"], ["Vienna", "Wien"], ["Today", "Heute"],
  ["Weather radar", "Wetterradar"], ["Load radar", "Radar laden"], ["Refresh", "Aktualisieren"],
  ["Loading…", "Wird geladen…"], ["Tap a day", "Tag antippen"], ["Details", "Details"],
  ["Next 24 hours", "Nächste 24 Stunden"], ["At a glance", "Auf einen Blick"],
  ["Current model / nearest hour", "Aktuelles Modell / nächste Stunde"],
  ["Rain chance", "Regenwahrscheinlichkeit"], ["This hour · Best Match", "Diese Stunde · Best Match"],
  ["Hourly precipitation", "Niederschlag pro Stunde"], ["Hourly accumulation", "Stundensumme"],
  ["Hour ending ", "Stunde bis "], ["Precipitation", "Niederschlag"], ["Humidity", "Luftfeuchtigkeit"],
  ["Wind speed", "Windgeschwindigkeit"], ["Wind", "Wind"], ["Gusts", "Böen"], ["Pressure", "Luftdruck"],
  ["Sea level", "Meereshöhe"], ["Cloud cover", "Bewölkung"], ["Visibility", "Sichtweite"],
  ["UV index", "UV-Index"], ["Nearest hour", "Nächste Stunde"], ["Sunrise", "Sonnenaufgang"],
  ["Sunset", "Sonnenuntergang"], ["Model spread", "Modellspanne"], ["temperature range", "Temperaturspanne"],
  ["Current model estimate · ", "Aktuelle Modellschätzung · "], ["Hourly consensus estimate", "Stündliche Konsensprognose"],
  ["Feels like", "Gefühlt"], ["Next hour", "Nächste Stunde"], ["Available", "Verfügbar"],
  ["Unavailable", "Nicht verfügbar"], ["Hour by hour", "Stunde für Stunde"], ["Local time", "Ortszeit"],
  ["Clear sky", "Klarer Himmel"], ["Mainly clear", "Überwiegend klar"], ["Mostly clear", "Überwiegend klar"],
  ["Partly cloudy", "Leicht bewölkt"], ["Overcast", "Bedeckt"], ["Fog", "Nebel"],
  ["Depositing rime fog", "Gefrierender Nebel"], ["Drizzle", "Nieselregen"],
  ["Freezing drizzle", "Gefrierender Nieselregen"], ["Rain", "Regen"], ["Freezing rain", "Gefrierender Regen"],
  ["Snow", "Schnee"], ["Snow grains", "Graupel"], ["Rain showers", "Regenschauer"],
  ["Snow showers", "Schneeschauer"], ["Thunderstorm", "Gewitter"],
  ["Thunderstorm with hail", "Gewitter mit Hagel"], ["Unknown", "Unbekannt"],
  ["Sky", "Himmel"], ["Rain %", "Regen %"], ["Precip. / h", "Niederschlag / h"],
  ["Rain / h", "Regen / h"], ["Snow cm", "Schnee cm"], ["RH %", "Luftf. %"], ["From", "Richtung"],
  ["Cloud %", "Wolken %"], ["Chart variable", "Diagrammwert"], ["Chart horizon", "Diagrammzeitraum"],
  ["Temperature / hour", "Temperatur / Stunde"], ["Temperature", "Temperatur"],
  ["Precipitation / hour", "Niederschlag / Stunde"], ["Rain chance", "Regenwahrscheinlichkeit"],
  ["Inspect hour", "Stunde auswählen"], ["Weather chart", "Wetterdiagramm"], ["hours", "Stunden"],
  ["A look back", "Wetterrückblick"], ["Historical date", "Historisches Datum"],
  ["Explore hourly weather since 1940.", "Stündliche Wetterdaten seit 1940 ansehen."],
  ["ERA5 reanalysis: reconstructed weather, not a station measurement. The latest seven days are excluded to allow for publication delay.", "ERA5-Reanalyse: rekonstruierte Wetterdaten, keine Stationsmessung. Die letzten sieben Tage fehlen wegen der Veröffentlichungsverzögerung."],
  ["High", "Höchstwert"], ["Low", "Tiefstwert"], ["This day in past years", "Dieser Tag in früheren Jahren"],
  ["Compare today with the same calendar day in the previous ten years.", "Vergleiche den heutigen Tag mit demselben Kalendertag der letzten zehn Jahre."],
  ["Compare 10 years", "10 Jahre vergleichen"], ["Behind the forecast", "Hinter der Prognose"],
  ["Regional detail. Global perspective.", "Regionale Details. Globale Perspektive."],
  ["Next 24 hours · temperature", "Nächste 24 Stunden · Temperatur"], ["Consensus", "Konsens"],
  ["How consensus works", "So entsteht die Konsensprognose"], ["Local forecast journal", "Lokales Prognosearchiv"],
  ["Evaluate mature forecasts", "Abgeschlossene Prognosen auswerten"],
  ["Make it yours", "Passe Wettra an"], ["Appearance", "Darstellung"], ["Follow iPhone", "Systemeinstellung folgen"],
  ["Light", "Hell"], ["Dark", "Dunkel"], ["Celsius · °C", "Celsius · °C"], ["Fahrenheit · °F", "Fahrenheit · °F"],
  ["Millimetres", "Millimeter"], ["Inches", "Zoll"], ["Refresh when app is open", "Aktualisierung bei geöffneter App"],
  ["Every 30 minutes", "Alle 30 Minuten"], ["Every hour", "Stündlich"], ["Every 3 hours", "Alle 3 Stunden"],
  ["On this device", "Auf diesem Gerät"], ["Check local cache", "Lokalen Cache prüfen"],
  ["Export local data", "Lokale Daten exportieren"], ["Clear weather cache", "Wettercache leeren"],
  ["Erase all app data", "Alle App-Daten löschen"], ["Sources & attribution", "Quellen & Namensnennung"],
  ["Complete source code", "Vollständiger Quellcode"], ["Download standalone HTML", "Eigenständige HTML-Datei laden"],
  ["Open official warning map ↗", "Offizielle Warnkarte öffnen ↗"],
  ["Offline · ", "Offline · "], ["Cached · ", "Zwischengespeichert · "], ["Updated ", "Aktualisiert "],
  ["No locations found. Try a nearby town.", "Keine Orte gefunden. Versuche einen Ort in der Nähe."],
  ["Search unavailable. Try a saved location.", "Suche nicht verfügbar. Verwende einen gespeicherten Ort."],
  ["Searching…", "Suche läuft…"], ["Coordinates must be latitude −90 to 90, longitude −180 to 180.", "Koordinaten müssen Breitengrad −90 bis 90 und Längengrad −180 bis 180 sein."],
  ["Local file: if GPS is unavailable, search above or choose a saved place.", "Lokale Datei: Falls GPS nicht verfügbar ist, suche oben oder wähle einen gespeicherten Ort."],
  ["Save places to switch between them quickly.", "Speichere Orte, um schnell zwischen ihnen zu wechseln."],
  ["Location is requested only when you tap the button. Coordinates are sent to weather providers to retrieve your weather.", "Der Standort wird nur auf Tastendruck abgefragt. Die Koordinaten werden zur Wetterabfrage an Wetterdienste übermittelt."],
  ["Places, settings, forecasts, historical queries and model scores stay in this browser. No analytics, advertising or app account. Weather providers receive requested coordinates and your IP address; location search receives your search text.", "Orte, Einstellungen, Prognosen, Rückblicke und Modellbewertungen bleiben in diesem Browser. Keine Analyse, Werbung oder App-Konten. Wetterdienste erhalten die angefragten Koordinaten und deine IP-Adresse; die Ortssuche erhält deinen Suchbegriff."],
  ["Cache holds eight locations and 40 historical queries. Browser storage can be evicted by iOS; export your journal if it matters to you. Private Browsing is temporary.", "Der Cache speichert bis zu acht Orte und 40 Rückblicke. iOS kann Browserdaten löschen; exportiere wichtige Prognoseverläufe. Privates Surfen speichert Daten nur vorübergehend."],
  ["GitHub Pages serves this public app. The app has no backend. Each browser keeps its own local data. Local files may have GPS or network restrictions; use the HTTPS app for the full map.", "Diese öffentliche App wird über GitHub Pages bereitgestellt. Sie hat kein Backend. Jeder Browser speichert seine Daten lokal. Lokale Dateien können GPS- oder Netzwerkbeschränkungen haben; die HTTPS-Version bietet alle Kartenfunktionen."],
  ["Forecast providers: DWD ICON, ECMWF IFS and NOAA GFS. Historical reanalysis: Copernicus / ECMWF ERA5, via Open-Meteo. Location names: GeoNames via Open-Meteo. Austrian postcode lookup: bundled ", "Prognosemodelle: DWD ICON, ECMWF IFS und NOAA GFS. Historische Reanalyse: Copernicus / ECMWF ERA5 über Open-Meteo. Ortsnamen: GeoNames über Open-Meteo. Österreichische Postleitzahlen: enthaltene "],
  ["postal data, CC BY 4.0 (22 October 2026); approximate locality coordinates.", "Postleitzahlendaten, CC BY 4.0 (22. Oktober 2026); ungefähre Koordinaten der Orte."],
  ["RainViewer radar, personal use; loaded only when requested.", "RainViewer-Radar zur persönlichen Nutzung; wird nur auf Anfrage geladen."],
  ["No background tracking or learning. Cached weather is available in this browser. To cache the app shell for offline reopening, ", "Kein Hintergrund-Tracking oder Lernen. Zwischengespeichertes Wetter ist in diesem Browser verfügbar. Um die App-Oberfläche für Offline-Aufrufe zu speichern, "],
  ["Fetching your forecast…", "Wetterprognose wird abgerufen…"], ["Choose a location or refresh to load weather.", "Wähle einen Ort oder aktualisiere, um das Wetter zu laden."],
  ["No hourly data in this period. Refresh when online.", "Keine Stundendaten für diesen Zeitraum. Aktualisiere, sobald du online bist."],
  ["No data for this variable", "Keine Daten für diesen Wert"], ["Radar could not load. The map is still usable; try again later. Existing frames may be old.", "Radar konnte nicht geladen werden. Die Karte bleibt nutzbar; versuche es später erneut. Vorhandene Bilder können veraltet sein."],
  ["Temperature & rainfall amount: consensus. Probability: Open-Meteo Best Match. Ordinary rain icons are replaced by sky conditions when precipitation is below 0.05 mm and chance below 40%.", "Temperatur und Niederschlagsmenge: Modellkonsens. Regenwahrscheinlichkeit: Open-Meteo Best Match. Bei weniger als 0,05 mm und unter 40 % Wahrscheinlichkeit werden normale Regensymbole durch den tatsächlichen Himmelszustand ersetzt."],
  ["Delete ", "Löschen: "], ["Erase all Wettra settings, locations, cached weather and local scores?", "Alle Wettra-Einstellungen, Orte, Wetterdaten und lokalen Bewertungen löschen?"],
  ["Weather cache cleared. Current screen stays available.", "Wettercache geleert. Die aktuelle Ansicht bleibt verfügbar."],
  ["Evaluation unavailable. Try later.", "Auswertung nicht verfügbar. Versuche es später erneut."],
  ["Saved forecast retained", "Gespeicherte Prognose bleibt verfügbar"], ["Device storage unavailable", "Gerätespeicher nicht verfügbar"],
  ["Installation & update instructions", "Installations- und Updateanleitung"], ["Download widget script", "Widget-Skript laden"],
  ["Copy widget configuration", "Widget-Konfiguration kopieren"], ["iPhone & iPad widget", "iPhone- & iPad-Widget"],
  ["Copy the selected text, then paste into the Scriptable widget Parameter field.", "Kopiere den markierten Text und füge ihn in Scriptable im Parameterfeld des Widgets ein."],
  ["Copied. Paste into the Scriptable widget Parameter field.", "Kopiert. Füge den Text im Parameterfeld des Scriptable-Widgets ein."],
  ["Open Wettra again when online.", "Öffne Wettra erneut, sobald du online bist."],
  ["Language", "Sprache"], ["Deutsch", "Deutsch"], ["English", "English"],
];

const de = new Map(pairs);
const en = new Map(pairs.map(([a, b]) => [b, a]));
const locale = () => settings.language === "en" ? "en" : "de";
function translate(value, lang = locale()) {
  let output = String(value);
  const entries = [...(lang === "de" ? de : en)].sort((a, b) => b[0].length - a[0].length);
  for (const [from, to] of entries) {
    const left = /^[A-Za-z0-9_]/.test(from) ? "(^|[^A-Za-z0-9_])" : "";
    const right = /[A-Za-z0-9_]$/.test(from) ? "(?![A-Za-z0-9_])" : "";
    const expression = new RegExp(left + from.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + right, "g");
    output = output.replace(expression, (...match) => left ? match[1] + to : to);
  }
  return output;
}
export function localizeDOM(root = document.body) {
  const lang = locale();
  if (document.documentElement) document.documentElement.lang = lang;
  if (!document.createTreeWalker || !root.querySelectorAll || typeof NodeFilter === "undefined") return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      return node.parentElement?.closest("script, style, textarea, code")
        ? NodeFilter.FILTER_REJECT
        : NodeFilter.FILTER_ACCEPT;
    },
  });
  while (walker.nextNode()) {
    const node = walker.currentNode;
    const value = translate(node.nodeValue, lang);
    if (value !== node.nodeValue) node.nodeValue = value;
  }
  for (const element of root.querySelectorAll("[aria-label], [placeholder], [title], [alt]"))
    for (const attr of ["aria-label", "placeholder", "title", "alt"])
      if (element.hasAttribute(attr)) element.setAttribute(attr, translate(element.getAttribute(attr), lang));
}
export function t(value) { return translate(value); }

let observer;
export function watchLocalization() {
  if (observer || !document.body) return;
  observer = new MutationObserver((changes) => {
    for (const change of changes) {
      for (const added of change.addedNodes) {
        if (added.nodeType === Node.ELEMENT_NODE) localizeDOM(added);
        else if (added.nodeType === Node.TEXT_NODE) added.nodeValue = translate(added.nodeValue);
      }
    }
  });
  observer.observe(document.body, { subtree: true, childList: true });
}
