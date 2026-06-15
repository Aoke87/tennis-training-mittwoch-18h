# Tennis Training - Terminübersicht

Eine schlichte, statische Webseite, die den wöchentlichen Tennis-Trainingsplan (mittwochs 18:00-19:00 Uhr, Saison 2026) anzeigt. Pro Woche setzt eine von fünf Personen aus (max. 4 gleichzeitig). Zusätzlich lässt sich pro Person ein Kalender-Export (`.ics`) herunterladen.

## Funktionen

- Übersicht aller Termine als Tabelle mit Aussetz-Rotation und Spielern
- Statusbereich: heutiges Datum, nächster Termin (mit Countdown) und nächster Aussetzer
- Hervorhebung des nächsten Termins; vergangene Termine sind abgeschwächt
- Personenauswahl hebt die eigenen Aussetz-Termine hervor
- `.ics`-Download der eigenen Spieltermine (Zeitzone Europe/Berlin)

## Lokal öffnen

Da die Seite rein statisch ist, reicht ein Doppelklick auf `index.html`. Alternativ ein lokaler Server:

```bash
python -m http.server 8000
# danach http://127.0.0.1:8000 im Browser öffnen
```

## Deployment via GitHub Pages

1. Repository auf GitHub anlegen (z. B. `tennis-termine`).
2. Dieses Projekt pushen:

```bash
git remote add origin https://github.com/<dein-user>/<repo>.git
git branch -M main
git push -u origin main
```

3. Im Repository unter **Settings → Pages**:
   - **Source**: `Deploy from a branch`
   - **Branch**: `main` / `/ (root)`
   - Speichern.
4. Nach kurzer Zeit ist die Seite erreichbar unter:
   `https://<dein-user>.github.io/<repo>/`

Jeder weitere `git push` auf `main` aktualisiert die Seite automatisch.

> Die Datei `.nojekyll` sorgt dafür, dass GitHub Pages die Dateien unverändert ausliefert (kein Jekyll-Build).

## Daten anpassen

Alle Daten stehen oben in [`script.js`](script.js):

- `PLAYERS` - alle Spieler
- `SITOUT_ORDER` - Reihenfolge, wer aussetzt (zyklisch)
- `SEASON_START` / `SEASON_END` - erster und letzter Termin
- `START_HOUR` / `END_HOUR` - Uhrzeit

Für eine neue Saison einfach diese Konstanten ändern und neu pushen.
