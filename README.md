# Custom New Tab

Minimalistische Startseite als Chrome-Erweiterung. Ersetzt die Seite „Neuer Tab“ durch eine eigene Oberfläche mit Link-Gruppen, Icons und einem großen Logo, ähnlich der Google-Startseite in Chrome.

Ohne Build-Schritt, ohne Abhängigkeiten, ohne Tracking: reines HTML, CSS und JavaScript. Alle Daten bleiben lokal im Browser.

## Funktionen

- **Gruppen** mit beliebig vielen Links, jederzeit neue Gruppen anlegen
- **Icon für jeden Link:** automatisch das Icon der Webseite, per Bild-URL oder als eigene Bilddatei
- **Freie Anordnung:** Gruppen per Ziehen an beliebige Stellen legen, Links per Drag & Drop sortieren oder in andere Gruppen verschieben
- **Großes Logo** über den Gruppen (Datei auswählen, Strg+V oder Drag & Drop), Größe per Regler
- **Button für den Google KI-Modus** oben rechts
- **Export / Import** als JSON-Backup
- Heller und dunkler Modus folgen automatisch dem System

## Installation

1. Repository herunterladen oder klonen.
2. In Chrome `chrome://extensions` öffnen und oben rechts den **Entwicklermodus** einschalten.
3. Auf **„Entpackt laden“** klicken und den Ordner dieses Projekts wählen (den Ordner mit der `manifest.json`).
4. Optional: unter `chrome://settings/onStartup` die Option **„Seite ‚Neuer Tab‘ öffnen“** wählen, dann erscheint die Seite auch beim Chrome-Start.

Der Ordner muss an seinem Platz bleiben, solange die Erweiterung geladen ist.

## Benutzung

Oben rechts auf **✎ Bearbeiten** klicken:

| Aktion | So geht's |
| --- | --- |
| Gruppe anlegen | **+ Gruppe** |
| Gruppe verschieben | am Symbol **⋮⋮** ziehen |
| Gruppe umbenennen / löschen | Namen anklicken bzw. **×** |
| Link hinzufügen | **+ Link** in der Gruppe |
| Link ändern / löschen | Link anklicken |
| Link verschieben | per Drag & Drop, auch in andere Gruppen |
| Alle Gruppen neu ordnen | **⊞ Anordnen** |
| Logo einfügen | **🖼 Logo einfügen**, Strg+V oder Drag & Drop |
| Backup | **Export** / **Import** |

Mit **✓ Fertig** verlässt du den Bearbeitungsmodus.

## Daten

Links, Positionen und Logo liegen in `chrome.storage.local` der Erweiterung. Sie bleiben über Neustarts hinweg erhalten, werden zwischen offenen Tabs synchronisiert und verlassen deinen Rechner nicht. Die Icons der Webseiten lädt die Seite über den Favicon-Dienst von Google (`google.com/s2/favicons`). Wer das nicht möchte, gibt bei jedem Link ein eigenes Bild an.

Zum Sichern oder Umziehen auf einen anderen Rechner: **Export** im Bearbeitungsmodus, dort **Import** wählen.

## Dateien

| Datei | Inhalt |
| --- | --- |
| `manifest.json` | Erweiterungs-Definition (Manifest V3) |
| `startseite.html` | Oberfläche und Styles |
| `startseite.js` | Logik: Gruppen, Links, Speicherung, Logo |

## Hinweis

`startseite.js` kann auch ohne Erweiterung genutzt werden: `startseite.html` direkt im Browser öffnen. Dann speichert die Seite per `localStorage`. Der Chrome-Mechanismus „Neuer Tab“ funktioniert aber nur über die Erweiterung.
