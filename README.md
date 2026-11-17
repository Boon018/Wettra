# Wettra 1.4.0

[Wettra öffnen](https://boon018.github.io/Wettra/) · [Eigenständige HTML-Datei](https://boon018.github.io/Wettra/standalone.html) · [Scriptable-Widget einrichten](https://boon018.github.io/Wettra/widget.html)

Wettra ist eine lokale, kontofreie Wetter-PWA für Österreich. Die Standardsprache ist Deutsch; in **Einstellungen → Sprache** kannst du auf Englisch wechseln. Standardort ist Graz. Vienna/Wien kann über die Ortswahl ausgewählt werden.

## Funktionen

- Aktuelles Wetter, stündliche und 16-tägige Prognose, Regenmengen pro Stunde und Wahrscheinlichkeiten.
- Konsens aus DWD ICON, ECMWF IFS und NOAA GFS; historische ERA5-Daten, Modellvergleich und lokale Prognoseauswertung.
- Ortssuche inklusive österreichischer Postleitzahlen, GPS auf unterstützten Browsern und Favoriten.
- GeoSphere-Warnungen und interaktive RainViewer-Radaransicht.
- Lokale Einstellungen, gespeicherte Orte und Wettercache; kein App-Backend, Konto, Tracking oder Analytics.
- Optionales Scriptable-Widget für iPhone und iPad. iOS steuert den tatsächlichen Widget-Aktualisierungszeitpunkt; Wettra fordert jeweils eine erneute Aktualisierung nach 30 Minuten an.

Jeder Browser und jedes Gerät speichert seine Daten separat. Wetter- und Ortsdienste erhalten die für die Anfrage nötigen Koordinaten bzw. Suchbegriffe. Der `alpen.v1.`-Speicherpräfix bleibt zur Kompatibilität mit bestehenden Installationen erhalten.

## Entwicklung und Tests

Node.js 22: `npm ci`, `npm run build`, `npm test`, `npm run check:artifact`, `npx playwright install --with-deps chromium webkit`, danach `npm run test:browser`. Die GitHub-Actions-Workflows installieren ihre Browser auf frischen GitHub-hosted Ubuntu-Runnern.

`src/` ist die maßgebliche Codebasis. `index.html`, `dist/` und das Widget-Skript sind generierte Ausgaben. Der Pages-Workflow testet und baut zuerst, veröffentlicht anschließend ausschließlich `dist/` und prüft die ausgelieferte Website.

## Veröffentlichungsadresse und Lizenz

GitHub Pages: <https://boon018.github.io/Wettra/>. Einmalig unter **Repository → Settings → Pages → Build and deployment → Source** „GitHub Actions“ auswählen. Danach veröffentlicht der Pages-Workflow nach jedem erfolgreichen Push auf `main`; der öffentliche Pfad bleibt `/Wettra/`.

Die Projektlizenz liegt in [LICENSE.md](LICENSE.md). Sie erlaubt kostenlose Nutzung, Änderung und kostenlose Weitergabe, untersagt aber den Verkauf ohne vorherige schriftliche Erlaubnis. Wetter- und Kartendaten unterliegen weiterhin ihren jeweiligen Drittanbieterbedingungen und Namensnennungspflichten.
