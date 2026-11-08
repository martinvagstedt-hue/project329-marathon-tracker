# Project 3:29 – Marathon Tracker

En enkel, fristående mobilapp/PWA för träningsschemat mot Stockholm Marathon 2027.

## Innehåll

- Start måndag 9 november 2026. Söndag 8 november: frivilligt lätt löpbandspass 20–30 min.
- 29 kalenderveckor, alltid måndag–söndag; lopp 29 maj 2027.
- Vecka 1–4 har fastställda dag-för-dag-pass: 30 / 33 / 36 / 28 km, med två hemmaprehabpass per vecka.
- Vecka 5–29 visar **preliminära volymmål**, men dagspassen låses inte fast förrän efter veckocheck och godkänd återhämtning.
- Passlogg: genomfört/överhoppat, faktisk distans, upplevd ansträngning och anteckningar.
- Bocka av prehab-övningar separat.
- Söndagsrapport: sömn, smärta, total ansträngning och anteckningar; kopiera hela texten till ChatGPT.
- Redigera dagspass och förhandsgranska uppdateringar av nästa veckas dagsschema efter veckocheck.
- Exportera/importera lokala JSON-backuper. Ingen server, inget konto, inga API-nycklar.

## Testa lokalt på datorn

Kör följande i projektmappen och öppna `http://localhost:8080`. Kommandot ger service workern rätt JavaScript-innehållstyp även på Windows.

```powershell
python -c "from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer; SimpleHTTPRequestHandler.extensions_map['.js']='text/javascript'; ThreadingHTTPServer(('127.0.0.1',8080),SimpleHTTPRequestHandler).serve_forever()"
```

## Publicera och installera på mobil

På GitHub Pages väljer du **Settings → Pages → Deploy from a branch** och publicerar grenens rot (`/`). Mappen innehåller alla statiska filer som behövs. Vid ändringar i appens filer uppdaterar du cacheversionen i `sw.js` före publicering. När en ny version har hämtats aktiveras den efter att de gamla appfönstren och flikarna har stängts.

- **iPhone** · Öppna HTTPS-adressen i Safari. Välj Dela → Lägg till på hemskärmen och slå på Öppna som webbapp om valet visas. [Apple Support](https://support.apple.com/sv-se/guide/iphone/iphea86e5236/ios)
- **Android** · Öppna HTTPS-adressen i Chrome. Välj ⋮ → Installera app eller Lägg till på startskärmen. [Google Chrome Hjälp](https://support.google.com/chrome/answer/9658361?co=GENIE.Platform%3DAndroid&hl=sv)
- Öppna appen från hemskärmen medan du har internet och kontrollera att **Mer** visar **Redo för offline på den här enheten**.
- Träningsdata lagras lokalt för webbadressen och den aktuella webbläsaren eller installationen. Använd **Mer → Exportera backup** och **Importera backup** för att flytta data till en ny adress, mobil eller installation.

## Importera nästa veckas plan (JSON)

1. Fyll i belastning, sömn och smärta under **Veckocheck** för veckan före den nya planen. Spara och kopiera rapporten till ChatGPT.
2. Välj **Importera plan för vecka …** under veckochecken eller öppna **Mer**. Klistra in JSON-svaret eller välj en JSON-fil.
3. Förhandsgranska passen och veckans planerade kilometer före och efter. Spara planen när du vill använda den.

```json
{
  "week": 5,
  "days": [
    {"date": "2026-12-07", "title": "Prehab A", "km": 0, "kind": "prehab", "description": "20–25 min hemma"},
    {"date": "2026-12-08", "title": "Lugn distans", "km": 7, "kind": "easy", "description": "Prattempo"}
  ]
}
```

`kind` kan vara `easy`, `recovery`, `quality`, `long`, `prehab`, `rest` eller `race`. Ange 1–7 unika datum i veckan. Importen uppdaterar planerade pass för de datum som anges och skyddar passerade eller redan loggade dagar. Volymen ändras när du sparar en planändring. Manuell ökning av kilometer för ett kommande pass från och med vecka 2 kräver också föregående veckas sparade veckocheck.
