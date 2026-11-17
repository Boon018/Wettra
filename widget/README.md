# Wettra Scriptable-Widget 0.2.0

Kleines Widget mit aktuellem Wetter; mittleres mit fünf kommenden Stunden; großes zusätzlich mit Tageswerten, stündlichen Regenmengen, Wind und UV-Maximum.
Keine API-Schlüssel, kein Backend, keine Anmeldung; Scriptable muss installiert sein.
Die PWA bleibt nutzbar; bestehende Daten werden nicht migriert. Das mittlere Layout 0.1.0 wurde vom Nutzer auf dem iPhone bestätigt. Neue Größen benötigen noch einen echten Gerätetest.

## Installation nur mit dem iPhone

1. Scriptable aus dem App Store installieren und öffnen.
2. [Installationsseite](https://boon018.github.io/Wettra/widget.html) öffnen und „Skript kopieren“ wählen.
3. Skripttext vollständig kopieren. In Scriptable mit **+** ein neues Skript erstellen, einfügen und **Wettra** nennen. Alternativ die heruntergeladene `.js`-Datei in Scriptable importieren, falls im Teilen-Menü angeboten.
4. Skript einmal ausführen. Es zeigt eine mittlere Vorschau für Graz.
5. Auf dem Homescreen ein mittleres **Scriptable**-Widget hinzufügen. Lange drücken → Widget bearbeiten → Skript **Wettra** auswählen.
6. In Wettra den gewünschten Ort wählen → Einstellungen → iPhone & iPad widget → Konfiguration kopieren. Unter „Parameter“ des Homescreen-Widgets einfügen. Alternativ funktioniert weiterhin dieses alte Format:

```json
{"name":"Graz","latitude":47.0707,"longitude":15.4395,"timezone":"Europe/Vienna"}
```

Jedes Widget kann einen anderen Parameter haben. Keine Koordinaten werden automatisch getrackt.
Ein Tipp öffnet den Widget-Ort in Wettra. Gespeicherter Standardort, letzter Ort und Favoriten werden nicht überschrieben. Die Standortparameter werden nach dem Öffnen aus der URL entfernt; ein erneutes Laden kehrt zum gespeicherten Startort zurück. Ob Browser oder installierte PWA geöffnet wird, entscheidet iOS.

Neue Parameter enthalten `version:1`, Standortdaten und `temperature` (`celsius`/`fahrenheit`), `wind` (`kmh`/`ms`/`mph`), `precipitation` (`mm`/`inch`). Physikalische Berechnungen und Regenregeln bleiben metrisch; Einheiten werden erst für die Anzeige umgerechnet.

**Update:** Den Inhalt des bestehenden Scriptable-Skripts ersetzen, Skriptname und Widget-Parameter beibehalten. Keine automatische Skriptaktualisierung. Manuelles Ausführen lädt sofort neu, ohne Widget-Parameter jedoch für den Standardort Graz. Die Homescreen-Aktualisierung bleibt iOS überlassen.

## Daten, Datenschutz und Grenzen

Aktuelles Modellwetter: Open-Meteo Best Match. Stündliche Kernvariablen: gleiche ICON/ECMWF/GFS-Gewichtung wie in der PWA. Wahrscheinlichkeit und Wettercode: Best Match. Dieselben Regen-Symbolregeln wie v1.2.6. Fehlende Werte erscheinen als Strich, nicht als 0. Aktuelle Niederschlagsmenge bezieht sich auf das aktuelle Modellintervall, nicht zwingend eine volle Stunde.

Zwei Prognosetage pro Abruf, vier parallele Anfragen, 30 Minuten Cache. iOS entscheidet über tatsächliche Aktualisierung; das Intervall ist nicht garantiert. Wetterdaten bleiben in Scriptables lokalem Library-Verzeichnis (nicht iCloud); der bisherige interne Ordnername „Alpenwetter“ bleibt zur Cache-Kompatibilität erhalten. Die APIs erhalten notwendige Koordinaten. Kein Zugriff auf den PWA-Speicher und keine automatische Synchronisierung. Bei Ausfall bleiben gespeicherte Daten mit Zeitstempel sichtbar. Abgelaufene aktuelle Werte werden nicht als aktuelles Wetter ausgegeben. Erststart ohne Internet zeigt einen Fehlerhinweis.

Wetterdaten: [Open-Meteo](https://open-meteo.com/) · [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), DWD/ECMWF/NOAA über Open-Meteo. Nichtkommerzieller Prototyp innerhalb der kostenlosen API-Nutzungsbedingungen. Skript: Wettra-Lizenz, siehe Repository-Lizenz. Kein automatischer Download/Ausführung fremden Update-Codes: Updates durch erneutes Einfügen/Importieren.

## Entwicklung und Tests

`npm run build:widget` erzeugt genau eine Datei `dist/wettra-widget.js`. Kein CDN, keine ES-Module zur Laufzeit. `npm run test:widget` prüft die erzeugte Datei mit simulierten Scriptable-APIs; das ist **kein echter iPhone-Test**.

Geräteabnahme: Vorschau → Homescreen → fünf kommende Stunden → zweiten Ort konfigurieren → Flugmodus mit vorhandenem Cache → App-Link antippen. Prüfen: keine abgeschnittenen Texte, Regenregel, gespeicherter Zeitstempel und Verhalten nach mehreren Stunden. 30-Minuten-Aktualisierung nicht als minutengenau voraussetzen.
