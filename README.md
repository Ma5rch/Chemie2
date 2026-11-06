# Chemistry Explorer

Kostenloses Chemie-Nachschlagewerk mit Schwerpunkt Kohlenhydrate. Next.js 14 (App Router), TypeScript, Tailwind CSS. Läuft im Browser, gehostet auf Vercel Hobby, ohne Server und ohne kostenpflichtige Dienste (siehe `COSTS_AND_LICENSES.md`).

**Grundprinzip:** Chemische Richtigkeit geht vor. Die App unterscheidet zwischen Datenbankangaben (PubChem), berechneten Werten und Lehrbuchwissen und kennzeichnet Unsicherheit. Sie vergibt keine erfundenen Namen und keine Prozentwerte.

## Seiten und Funktionen

| Seite | Inhalt |
|---|---|
| `/` Suche | Eingabefeld für Name, Summenformel, SMILES und InChI mit automatischer Erkennung; PubChem-Abfrage; vier Identifikationszustände; Kandidaten bei Mehrdeutigkeit; Fischer- und Haworth-Ansicht mit α/β; Glykan-Analyse; Nachweisreaktionen; Favoriten und Verlauf |
| `/editor` Zeichnen | Ketcher als Zeichenfläche; Prüfung und Berechnung mit RDKit.js; PubChem-Abgleich mit Einstufung A (bekannt), B (Stereoisomer/Anomer), C (unbekannt, kein Name) |
| `/glycan` Glykane | Baukasten für Oligosaccharide mit Verzweigungen; berechnete Formel, Masse, Bindungen, reduzierende Enden; Schema-Darstellung; Hydrolyse-Simulation |
| `/tests` Tests | Neun Informationskarten mit Durchführung, Deutung und Sicherheitshinweisen; erwartete Ergebnisse je Molekül |
| `/identifikator` | Unbekannte Probe anhand eingetragener Beobachtungen eingrenzen; Widersprüche werden erkannt |
| `/vergleich` | Zwei oder drei Stoffe vergleichen, Unterschiede hervorgehoben |
| `/lernen` | Aufgaben zu neun Themen mit Erklärung, ohne KI; Lernfortschritt |
| `/favoriten` | Favoriten, Verlauf, Export und Import als JSON |
| `/mehr` | Zugang zu den Seiten, Hell/Dunkel/System |

Offlinefähig als Progressive Web App (nur im Produktionsbuild). Live-Abfragen bei PubChem funktionieren offline nicht und werden nie vorgetäuscht; Favoriten tragen eine Kopie der Datenbankangaben mit Datum.

## Aufbau

- `lib/detect.ts` Eingabeerkennung · `lib/pubchem.ts` PubChem-Anbindung (gedrosselt, zwischengespeichert)
- `lib/sugars.ts` Konfigurationsmodell der Monosaccharide · `lib/glycan.ts` Glykan-Modell (Bausteine und Bindungen)
- `lib/polymers.ts` natürliche Polymere · `lib/tests.ts`, `lib/profile.ts` Nachweisreaktionen und Zuordnung
- `lib/identify.ts` Identifikator · `lib/compare.ts` Vergleich · `lib/quiz.ts` Lernmodus
- `lib/rdkit.ts`, `lib/structure.ts` Strukturprüfung und Abgleich · `lib/store.ts` IndexedDB
- `public/sw.js` Service Worker · `tests/selftest.ts` Selbsttest

## Lokal starten

```bash
npm install
npm run selftest    # prüft die Rechen- und Wissenslogik ohne Browser
npm run build
npm start           # Produktionsmodus, nötig für den Offlinebetrieb
npm run dev         # Entwicklung (ohne Service Worker)
```

Hinweise: `.npmrc` setzt `legacy-peer-deps=true`, weil Ketcher React 18 benötigt (deshalb Next.js 14). Ein Postinstall-Skript kopiert RDKit nach `public/rdkit`.

## Deployment auf Vercel (Hobby, kostenlos)

1. Projekt in ein GitHub-Repository hochladen (`node_modules`, `.next` und `public/rdkit` sind in `.gitignore`).
2. Auf vercel.com mit dem Hobby-Plan anmelden, **keine Zahlungsmethode hinterlegen**, Repository importieren. Vercel erkennt Next.js; Umgebungsvariablen sind nicht nötig.
3. Deployen und die Adresse `https://<projekt>.vercel.app` öffnen.

Mit der Kommandozeile: `npm install -g vercel`, dann `vercel` und für die Produktion `vercel --prod`.

Der Hobby-Tarif ist laut Vercel nur für persönliche, nicht kommerzielle Nutzung gedacht. Details und Hinweise zum Vermeiden von Kosten stehen in `COSTS_AND_LICENSES.md`.

## Bekannte Lücken

Nicht umgesetzt oder nur teilweise:

- Sesselkonformation, 3D-Modell, Bild-Upload einer Strukturformel, eigene Ansicht „vereinfachte Strukturformel“
- Nur vier Zucker (Glucose, Galactose, Mannose, Fructose), nur D-Reihe; keine Pentosen, Aminozucker oder Uronsäuren; keine Furanosen der Aldohexosen und keine Fructopyranose
- Polysaccharide: Stärke, Amylose, Amylopektin, Glykogen, Cellulose als Information und Modellrechnung; keine gezeichnete Kette; Chitin, Dextran, Inulin, Pektin, Hemicellulosen und Hyaluronsäure fehlen
- Datenquellen: nur PubChem; ChEBI, GlyTouCan und GlyGen sowie die Formate WURCS und GlycoCT sind nicht angebunden. Die Wissensbasis der Oligosaccharide stammt aus Projektvorgabe und Lehrbuchwissen
- Glykane werden nicht in SMILES übersetzt und lassen sich nicht in Ketcher öffnen; glykosidische Bindungen entstehen im Baukasten, nicht im Zeichner
- Editor: „Originalstruktur anzeigen“, Strukturvarianten vergleichen, Stoffklasse, funktionelle Gruppen, generierter IUPAC-Name
- Sicherheit: GHS-Angaben nur für Resorcin belegt; sonst Text und Verweis auf das Sicherheitsdatenblatt; keine Piktogramm-Bilder; Bial-Karte ohne Online-Quelle
- Nicht verwendet: shadcn/ui
- Der gesamte Code wurde ohne Browser und ohne Build-Umgebung geschrieben. Die Rechenlogik ist per Selbsttest geprüft, Oberfläche, Ketcher-Einbindung, Service Worker, iPhone/iPad und Deployment müssen mit `TESTPLAN.md` geprüft werden.

## Datenquellen und Haftung

Datenbankangaben stammen von PubChem (NCBI/NLM). Berechnete Werte (RDKit.js, Baustein-Modell) und Lehrbuchwissen sind als solche gekennzeichnet. Die Versuchsbeschreibungen sind für den Unterricht unter Aufsicht einer Lehrkraft gedacht; maßgeblich sind immer Etikett, Sicherheitsdatenblatt und die Gefährdungsbeurteilung der Schule.
