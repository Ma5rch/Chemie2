# Testplan (Abschnitt 19 der Vorgabe)

Legende: ✓ umgesetzt, △ teilweise, ✗ nicht umgesetzt. Die Spalte „Selbsttest“ zeigt, ob `npm run selftest` die Rechenlogik dazu prüft. Alles in der Spalte „Du prüfst“ muss im Browser, auf iPhone und iPad bzw. nach dem Deployment kontrolliert werden.

Vor dem Start: `npm install`, `npm run selftest`, `npm run build`, `npm start`.

| Nr. | Szenario | Stand | Selbsttest | Du prüfst |
|---|---|---|---|---|
| 1 | Glucose: alle Darstellungen | △ PubChem-2D, Fischer, Haworth α/β; keine Sesselform, kein 3D | Haworth | Suche „Glucose“, Anomer wechseln |
| 2 | Fructose als Ketose | ✓ Fischer (Ketose), Haworth Furanose; Pyranose fehlt | Haworth | Suche „Fructose“ |
| 3 | Galactose gegen Glucose | ✓ Fischer, Vergleich | Vergleich | /vergleich, „Glucose und Galactose“ |
| 4 | Saccharose mit Verknüpfung | ✓ Name, Schema, Bindung | Name | Suche „Saccharose“ |
| 5 | α-/β-Anomere | ✓ für Aldohexosen (Pyranose) und Fructose (Furanose) | ✓ | Umschalten ändert die Zeichnung |
| 6 | Maltose α-(1→4) | ✓ | ✓ | Suche „Maltose“ |
| 7 | Lactose β-(1→4) | ✓ | ✓ | Suche „Lactose“ |
| 8 | Raffinose | ✓ | ✓ | Suche „Raffinose“ |
| 9 | Stärke, Amylose gegen Amylopektin | ✓ Information und Modellrechnung, bewusst keine feste Kette | Vergleich | /vergleich |
| 10 | Glykogen mit Verzweigungen | △ Text und Modell, keine Zeichnung | – | Suche „Glykogen“ |
| 11 | Cellulose β-(1→4) | △ Text und Modell, keine Zeichnung | – | Suche „Cellulose“ |
| 12 | Zusammensetzung automatisch | ✓ für bekannte und gebaute Glykane | ✓ | /glycan |
| 13 | Bindungen erkennen | ✓ aus dem Modell, nicht aus beliebigen Strukturen | ✓ | /glycan |
| 14 | Reduzierende/nichtreduzierende Enden | ✓ | ✓ | Saccharose gegen Maltose |
| 15 | Hydrolyse simulieren | ✓ Oligosaccharide; Polymere nur als Formelmodell | ✓ Massenbilanz | Bindungen ankreuzen |
| 16 | OH-Gruppe hinzufügen | ✓ Ketcher, automatische Neuberechnung | – | /editor, Ethanol zu Ethylenglykol |
| 17 | OH-Gruppe entfernen | ✓ | – | /editor |
| 18 | Stereozentrum ändern, Isomer erkennen | △ Einstufung B über PubChem-Identitätssuche | – | /editor, Glucose öffnen, Keil umdrehen |
| 19 | Glykosidische Bindung erstellen | △ im Baukasten, nicht in Ketcher | ✓ | /glycan |
| 20 | Eigenes Oligosaccharid | ✓ | ✓ | 3 Glucosen α-(1→4) ergeben Maltotriose |
| 21 | Verzweigte Struktur | ✓ im Baukasten | ✓ | zwei Bausteine an dasselbe Ziel |
| 22 | Ungültige Struktur zurückweisen | ✓ RDKit, Baukasten-Validierung | ✓ | Fünfwertigen Kohlenstoff zeichnen |
| 23 | C6H12O6, mehrere Isomere | ✓ | ✓ Erkennung | Suche „C6H12O6“ |
| 24 | Struktur ohne Stereoinformation | ✓ Hinweis bei SMILES und im Editor | – | SMILES `OCC1OC(O)C(O)C(O)C1O` |
| 25 | Unbekannte Struktur, kein Name | ✓ Einstufung C | – | /editor, ungewöhnliche Struktur |
| 26 | Stärke: variable Polymerstruktur | ✓ | – | Suche „Stärke“ |
| 27 | Widersprüchliche Nachweise | ✓ | ✓ | /identifikator: Iod blauschwarz plus Molisch negativ |
| 28 | Fehlende Datenbankinformation | ✓ „nicht verfügbar“ | – | Verbindung trennen |
| 29 | iPhone | du | – | Layout, Editor mit Touch, untere Navigation |
| 30 | iPad | du | – | Hoch- und Querformat, obere Leiste |
| 31 | Lokaler Produktionsbuild | du | – | `npm run build` |
| 32 | Deployment auf Vercel | du | – | siehe README |
| 33 | Nach dem Deployment erneut testen | du | – | Szenarien 1–28 auf der Vercel-URL |
| 34 | Keine kostenpflichtigen Dienste | ✓ nach Konstruktion | – | Vercel-Konto: kein Upgrade, keine Zusatzprodukte |
| 35 | COSTS_AND_LICENSES.md vollständig | ✓ | – | `npm run licenses` |

## Zusätzlich prüfen

- Offline: Seiten einmal online öffnen, dann Flugmodus. Favoriten, Baukasten, Tests, Identifikator, Vergleich und Lernmodus sollen laufen; PubChem-Abfragen nicht.
- Export und Import: Favorit speichern, exportieren, Browserdaten löschen, importieren.
- Dunkelmodus: Systemeinstellung wechseln, dann „Mehr“, Hell und Dunkel.
- Installation: Teilen, „Zum Home-Bildschirm“.
