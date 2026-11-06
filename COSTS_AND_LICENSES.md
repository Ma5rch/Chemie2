# Kosten und Lizenzen

Stand: 5. November 2026. **Gesamtkosten der Anwendung: 0,00 €.**

Die App benötigt keinen eigenen Server, keine API-Routen, keine Datenbank in der Cloud und keine API-Schlüssel. Alles Chemische wird im Browser berechnet, gespeichert wird in IndexedDB. Einzig PubChem wird live abgefragt.

## Dienste

| Name | Zweck | Lizenz / Bedingungen | Kosten | Limits und Hinweise |
|---|---|---|---|---|
| Vercel Hobby | Hosting und Deployment | Vercel-Nutzungsbedingungen | 0 € | Nur persönliche, nicht kommerzielle Nutzung (laut Vercel-Dokumentation). Wird ein Limit überschritten, wird die Funktion pausiert und erst nach ca. 30 Tagen wieder frei; es gibt dort keine Überschreitungsabrechnung. Konkrete Mengenangaben (z. B. 100 GB Datenübertragung, 1 Mio. Edge-Requests pro Monat) stammen aus Zusammenfassungen Dritter, Stand Sommer 2026; bitte unter vercel.com/pricing gegenprüfen. |
| PubChem PUG REST (NCBI/NLM) | Moleküldaten (Name, Formel, SMILES, InChI, 2D-Bild) | Öffentliche Daten, Nutzungsbedingungen der NCBI | 0 € | Kein API-Schlüssel. Höchstens 5 Anfragen pro Sekunde, 400 pro Minute und 300 Sekunden Rechenzeit pro Minute. Die App drosselt auf ca. 4 Anfragen pro Sekunde, speichert Antworten zwischen und versucht bei Überlast einmal erneut. Quelle bei Weiterverwendung nennen. |
| GitHub Free | Versionsverwaltung | GitHub-Bedingungen | 0 € | – |
| IndexedDB, Service Worker | Lokale Speicherung, Offlinebetrieb | Browser-Standards | 0 € | Speicherplatz vom Browser abhängig. Safari kann Daten nicht genutzter Webseiten nach einiger Zeit löschen; deshalb den Export (Seite Favoriten) nutzen. |

## Bibliotheken

Die Lizenzangaben entsprechen den Projektangaben der Bibliotheken. Vor einer Veröffentlichung bitte mit `npm run licenses` prüfen, auch die indirekten Abhängigkeiten.

| Name | Zweck | Lizenz | Kosten |
|---|---|---|---|
| Next.js 14 | Framework (App Router) | MIT | 0 € |
| React / React DOM 18 | Oberfläche | MIT | 0 € |
| TypeScript | Sprache | Apache-2.0 | 0 € |
| Tailwind CSS 3, PostCSS, Autoprefixer | Gestaltung | MIT | 0 € |
| RDKit.js (`@rdkit/rdkit`) | Strukturprüfung und Berechnung im Browser (WebAssembly) | BSD-3-Clause | 0 € |
| Ketcher (`ketcher-react`, `-core`, `-standalone`) | Struktur-Editor | Apache-2.0 | 0 € |
| styled-components | Abhängigkeit von Ketcher | MIT | 0 € |
| tsx (nur Entwicklung) | Selbsttest ausführen | MIT | 0 € |

Nicht verwendet: shadcn/ui (die Oberfläche besteht aus eigenen Tailwind-Komponenten), ChEBI, GlyTouCan, GlyGen, KEGG.

Die Symbole (Icons) wurden für dieses Projekt selbst erzeugt. Es werden keine externen Schriftarten geladen; verwendet wird die Systemschrift.

## So bleibt es kostenlos

- Beim Vercel-Konto keine Zahlungsmethode hinterlegen und nicht auf Pro oder Enterprise wechseln.
- Keine Vercel-Zusatzprodukte aktivieren (Analytics, Speed Insights, Blob, KV, Marketplace-Integrationen) und keine Spend-Management-Beträge einstellen.
- Keine eigenen Serverfunktionen oder API-Routen ergänzen, die Rechenzeit verbrauchen. Die App kommt ohne aus.
- Die App ist bewusst ohne Werbung, Bezahlfunktion und Kundenprojekte gedacht. Sobald sie kommerziell genutzt wird, ist der Hobby-Tarif laut Vercel nicht mehr zulässig.
- Die Auslieferung ist relativ datenintensiv (Ketcher und RDKit sind mehrere Megabyte groß). Bei sehr vielen Aufrufen könnte das Übertragungslimit erreicht werden; dann wird pausiert, es entstehen keine Kosten.
