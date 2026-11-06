// Wissensdatenbank der Nachweisreaktionen (Schulniveau). Inhalte: Lehrbuchwissen,
// abgeglichen mit den in SOURCES genannten Übersichtsarbeiten. Keine Daten werden zur Laufzeit erfunden.
export type TestId = "god" | "seliwanoff" | "fehling" | "benedict" | "barfoed" | "iod" | "molisch" | "bial" | "hydrolyse";

export type TestCard = {
  id: TestId;
  name: string;
  purpose: string;
  scope: "Stoffgruppe" | "Molekül" | "Hilfsreaktion";
  scopeText: string;
  suitable: string;
  reagents: string;
  principle: string;
  procedure: string[];
  observation: string;
  colour: string;
  positive: string;
  negative: string;
  limits: string[];
  misreadings: string[];
  hazards: string[];
  ghs?: string;
  ppe: string;
  disposal: string;
  sources: string[];
};

export const SOURCES = {
  ruppersberg: {
    label: "Ruppersberg et al. (2022): Kohlenhydratnachweise im Chemieunterricht",
    url: "https://www.pedocs.de/volltexte/2024/28447/pdf/Ruppersberg_et_al_2022_Kohlenhydratnachweise.pdf",
  },
  rautenstrauch: {
    label: "Rautenstrauch et al. (2023): Die neue Molisch-Probe für den Unterricht",
    url: "https://www.pedocs.de/volltexte/2024/30102/pdf/Rautenstrauch_et_al_2023_Ein_sicherer_Kohlenhydrat-Nachweis.pdf",
  },
  seilnacht: { label: "Seilnacht: Gefährdungsbeurteilung Seliwanow-Probe", url: "https://www.seilnacht.com/versuche/ris_seli.pdf" },
  leybold: { label: "LD DIDACTIC: Seliwanoff’s test (Gefahrstoffangaben)", url: "https://www.leybold-shop.com/die-seliwanow-reaktion-lc5-2-3-3.html" },
};
const R = SOURCES.ruppersberg, M = SOURCES.rautenstrauch;
const link = (s: { label: string; url: string }) => `${s.label}|${s.url}`;

export const SDB_NOTE =
  "Maßgeblich sind immer Etikett und Sicherheitsdatenblatt der tatsächlich verwendeten Produkte sowie die Gefährdungsbeurteilung der Schule. Alle Versuche nur unter Aufsicht einer Lehrkraft.";
const PPE = "Schutzbrille, Schutzhandschuhe und Laborkittel tragen.";
const PLAN = "Entsorgung nach Vorgabe der Lehrkraft und der Gefährdungsbeurteilung der Schule.";

export const TESTS: TestCard[] = [
  {
    id: "god", name: "GOD-Test (Glucoseoxidase)",
    purpose: "Enzymatischer Nachweis von Glucose.",
    scope: "Molekül", scopeText: "Weist unter üblichen Bedingungen gezielt freie D-Glucose nach, nicht andere Zucker.",
    suitable: "Freie Glucose. Gebundene Glucose (z. B. in Saccharose oder Stärke) erst nach Hydrolyse.",
    reagents: "Glucoseoxidase (GOD), Peroxidase (POD) und ein Chromogen, meist als Teststreifen.",
    principle: "GOD oxidiert β-D-Glucose mit Sauerstoff zu Gluconolacton (Gluconsäure) und Wasserstoffperoxid. Die Peroxidase nutzt das Peroxid, um ein Chromogen zum Farbstoff zu oxidieren.",
    procedure: ["Teststreifen kurz in die Probelösung tauchen.", "Die vom Hersteller angegebene Zeit abwarten.", "Das Testfeld mit der Farbskala vergleichen."],
    observation: "Das Testfeld ändert seine Farbe.", colour: "Der Farbton hängt vom Testsystem ab; maßgeblich ist die Farbskala des Herstellers.",
    positive: "Freie Glucose ist in nachweisbarer Menge vorhanden.",
    negative: "Keine freie Glucose in nachweisbarer Menge, oder die Enzyme sind gehemmt oder verbraucht.",
    limits: ["Spezifisch für Glucose, sagt nichts über andere Zucker.", "Reduzierende Stoffe wie Ascorbinsäure können stören.", "Enzymaktivität hängt von Haltbarkeit, Temperatur und pH ab."],
    misreadings: ["Ein negatives Ergebnis bei Saccharose, Maltose oder Stärke heißt nicht, dass keine Glucose gebunden ist. Nach Hydrolyse wird der Test positiv."],
    hazards: ["Enzympräparate können beim Einatmen von Staub sensibilisieren. Teststreifen sind in der Regel unproblematisch."],
    ppe: PPE, disposal: PLAN, sources: [link(R)],
  },
  {
    id: "seliwanoff", name: "Seliwanoff-Probe",
    purpose: "Unterscheidung von Ketosen und Aldosen.",
    scope: "Stoffgruppe", scopeText: "Weist Ketosen nach, nicht gezielt Fructose. Auch Stoffe, die Fructose freisetzen, können reagieren.",
    suitable: "Ketosen wie Fructose. Saccharose und andere fructosehaltige Stoffe können durch Säurehydrolyse positiv werden.",
    reagents: "Resorcin (ethanolische Lösung, schulüblich ca. 5 %) und Salzsäure (schulüblich ca. 10 %).",
    principle: "Die heiße Säure dehydratisiert Ketosen schneller als Aldosen zu Hydroxymethylfurfural. Dieses kondensiert mit Resorcin zu einem roten Farbstoff.",
    procedure: ["Ein Reagenzglas ca. 2 cm hoch mit Salzsäure füllen.", "Resorcinlösung und eine kleine Probenmenge zugeben, umschütteln.", "Vorsichtig im Wasserbad erwärmen und die Zeit bis zur Färbung beobachten."],
    observation: "Bei Fructose tritt nach kurzer Zeit eine Rotfärbung auf. Aldosen reagieren erst bei längerem Erhitzen oder höherer Konzentration, wenn überhaupt.",
    colour: "Kirschrot (Ketosen).",
    positive: "Ein Ketose-Anteil ist wahrscheinlich, entweder frei oder durch Hydrolyse freigesetzt.",
    negative: "Keine schnelle Reaktion: Ketose unwahrscheinlich.",
    limits: ["Reaktionszeit, Temperatur und Konzentration entscheiden über das Ergebnis.", "Bei zu langem Erhitzen können auch Aldosen eine Färbung zeigen."],
    misreadings: ["Saccharose gibt ein positives Ergebnis, ohne selbst eine Ketose mit freier Ketogruppe zu sein. Die Säure spaltet sie vorher in Glucose und Fructose."],
    hazards: ["Resorcin reizt Haut, Schleimhäute und Atemwege, kann sensibilisieren und ist gewässergefährdend.", "Salzsäure ca. 10 %: Signalwort Achtung, reizend. Konzentrierte Salzsäure ist ätzend.", "Aus Umweltgründen die Probe erst nach anderen Nachweisen durchführen."],
    ghs: "Resorcin: GHS07, GHS09 (H302, H315, H319, H400).",
    ppe: PPE + " Möglichst unter Abzug oder bei guter Lüftung.", disposal: PLAN,
    sources: [link(R), link(SOURCES.seilnacht), link(SOURCES.leybold)],
  },
  {
    id: "fehling", name: "Fehling-Probe",
    purpose: "Nachweis reduzierender Zucker.",
    scope: "Stoffgruppe", scopeText: "Weist reduzierende Substanzen nach (Aldehyd- bzw. Halbacetalgruppe, auch Ketosen über Umlagerung), kein bestimmtes Molekül.",
    suitable: "Glucose, Fructose, Galactose, Maltose, Lactose. Saccharose normalerweise negativ.",
    reagents: "Fehling I (Kupfer(II)-sulfat-Lösung) und Fehling II (Kaliumnatriumtartrat in Natronlauge), frisch gemischt.",
    principle: "In alkalischer Lösung reduziert die Carbonylgruppe das Kupfer(II)-Tartrat-Komplex-Ion zu rotem Kupfer(I)-oxid; der Zucker wird oxidiert. Fructose reagiert, weil sich die Ketose unter alkalischen Bedingungen über ein Endiol zu Aldosen umlagert.",
    procedure: ["Fehling I und II zu gleichen Teilen mischen.", "Probelösung zugeben.", "Im Wasserbad erwärmen und beobachten."],
    observation: "Die tiefblaue Lösung trübt sich, es fällt ein Niederschlag aus.", colour: "Blau → gelb/orange → ziegelrot (Cu₂O).",
    positive: "Ein reduzierender Zucker oder eine andere reduzierende Substanz ist vorhanden.",
    negative: "Keine oder nur sehr wenige reduzierende Gruppen (z. B. Saccharose).",
    limits: ["Unterscheidet nicht zwischen Aldosen und Ketosen.", "Andere Reduktionsmittel (Aldehyde, Ascorbinsäure) reagieren ebenfalls.", "Bei Polysacchariden sind reduzierende Enden selten; das Ergebnis ist nicht mit dem eines freien Monosaccharids vergleichbar."],
    misreadings: ["Ein positives Ergebnis beweist nicht, dass Glucose vorliegt.", "Saccharose kann nach Hydrolyse (z. B. durch Säurespuren) positiv werden."],
    hazards: ["Fehling II (Natronlauge) ist ätzend.", "Kupferhaltige Lösungen sind gewässergefährdend."],
    ppe: PPE, disposal: "Kupferhaltige Abfälle getrennt sammeln. " + PLAN, sources: [link(R)],
  },
  {
    id: "benedict", name: "Benedict-Probe",
    purpose: "Nachweis reduzierender Zucker.",
    scope: "Stoffgruppe", scopeText: "Weist wie die Fehling-Probe reduzierende Substanzen nach, kein bestimmtes Molekül.",
    suitable: "Wie Fehling: reduzierende Mono- und Disaccharide. Saccharose normalerweise negativ.",
    reagents: "Kupfer(II)-sulfat, Natriumcitrat und Natriumcarbonat in einer Lösung.",
    principle: "Wie bei Fehling wird Cu²⁺ zu Cu₂O reduziert, hier in schwächer alkalischer (sodaalkalischer) Lösung mit Citrat als Komplexbildner.",
    procedure: ["Benedict-Reagenz mit Probelösung mischen.", "Im Wasserbad erhitzen.", "Farbe beobachten."],
    observation: "Die Farbe ändert sich stufenweise mit dem Zuckergehalt.", colour: "Blau → grün → gelb → orange → rotbraun, je nach Konzentration.",
    positive: "Reduzierende Substanz vorhanden; die Farbe gibt einen groben Hinweis auf die Menge.",
    negative: "Die Lösung bleibt blau: keine oder sehr wenige reduzierende Gruppen.",
    limits: ["Unterscheidet nicht zwischen Aldosen und Ketosen.", "Andere Reduktionsmittel stören.", "Das Reagenz ist weniger stark alkalisch als Fehling-Lösung und besser haltbar."],
    misreadings: ["Die Farbstufe ist nur ein grober Konzentrationshinweis, keine Messung."],
    hazards: ["Das Reagenz ist reizend. Kupferhaltige Lösungen sind gewässergefährdend."],
    ppe: PPE, disposal: "Kupferhaltige Abfälle getrennt sammeln. " + PLAN, sources: [link(R)],
  },
  {
    id: "barfoed", name: "Barfoed-Probe",
    purpose: "Unterscheidung von Monosacchariden und reduzierenden Disacchariden nach der Reaktionsgeschwindigkeit.",
    scope: "Stoffgruppe", scopeText: "Zeigt, ob ein reduzierender Zucker ein Monosaccharid ist (schnell) oder ein Disaccharid (verzögert).",
    suitable: "Reduzierende Monosaccharide (schnell positiv). Reduzierende Disaccharide reagieren verzögert.",
    reagents: "Kupfer(II)-acetat in Essigsäure.",
    principle: "In schwach saurer Lösung reduzieren nur Monosaccharide Cu²⁺ rasch zu Cu₂O. Reduzierende Disaccharide reagieren deutlich langsamer.",
    procedure: ["Barfoed-Reagenz und Probelösung mischen.", "Im siedenden Wasserbad erhitzen.", "Die Zeit bis zum Niederschlag genau festhalten."],
    observation: "Bei Monosacchariden bildet sich nach kurzer Zeit ein Niederschlag.", colour: "Ziegelroter Niederschlag (Cu₂O).",
    positive: "Schnelle Reaktion: reduzierendes Monosaccharid wahrscheinlich.",
    negative: "Keine schnelle Reaktion: kein Monosaccharid oder nicht reduzierend.",
    limits: ["Die Reaktionszeit muss streng eingehalten werden.", "Bei langem Kochen reagieren auch Disaccharide, teils durch Säurehydrolyse."],
    misreadings: ["Ein spätes positives Ergebnis ist kein Beleg für ein Monosaccharid."],
    hazards: ["Essigsäure reizt Haut und Augen. Kupferhaltige Lösungen sind gewässergefährdend."],
    ppe: PPE, disposal: "Kupferhaltige Abfälle getrennt sammeln. " + PLAN, sources: [link(R)],
  },
  {
    id: "iod", name: "Iod-Stärke-Reaktion",
    purpose: "Nachweis von Stärke bzw. amyloseartigen Helices.",
    scope: "Stoffgruppe", scopeText: "Weist ein Strukturmerkmal nach (helikale α-1,4-Glucanketten), nicht Kohlenhydrate allgemein.",
    suitable: "Amylosehaltige Stärke. Amylopektin und Glykogen reagieren schwächer und anders gefärbt.",
    reagents: "Iod-Kaliumiodid-Lösung (Lugol’sche Lösung), verdünnt.",
    principle: "Polyiodid-Ionen lagern sich in die Helix der Amylose ein und bilden einen blauschwarzen Einschlusskomplex.",
    procedure: ["Probe in Wasser lösen oder aufschlämmen.", "Einige Tropfen verdünnte Iod-Kaliumiodid-Lösung zugeben.", "Farbe beobachten, ggf. vor und nach Erwärmen."],
    observation: "Die gelbbraune Lösung färbt sich.", colour: "Blauschwarz (Amylose). Amylopektin und Glykogen eher rotviolett bis rotbraun.",
    positive: "Eine amyloseartige Struktur ist vorhanden.",
    negative: "Keine charakteristische Färbung: keine Amylose-Helix (z. B. Glucose, Fructose, Galactose, Saccharose, Cellulose).",
    limits: ["Die Färbung verschwindet beim Erwärmen und kehrt beim Abkühlen zurück.", "Sehr kurze Ketten bilden keine stabile Helix.", "Die Färbung hängt vom Amylosegehalt ab."],
    misreadings: ["Keine Blaufärbung heißt nicht, dass kein Polysaccharid vorliegt (Cellulose, Glykogen, Amylopektin)."],
    hazards: ["Iod ist gesundheitsschädlich und gewässergefährdend; verdünnte Lösungen sind deutlich weniger gefährlich."],
    ppe: PPE, disposal: PLAN, sources: [link(R)],
  },
  {
    id: "molisch", name: "Molisch-Probe",
    purpose: "Allgemeiner Nachweis von Kohlenhydraten.",
    scope: "Stoffgruppe", scopeText: "Weist Kohlenhydrate allgemein nach (auch nicht reduzierende und Polysaccharide), unterscheidet aber keine einzelnen Zucker.",
    suitable: "Mono-, Di-, Oligo- und Polysaccharide.",
    reagents: "α-Naphthol (ethanolisch) und konzentrierte Schwefelsäure. Für den Unterricht gibt es Varianten mit weniger gefährlichen Chemikalien (Rautenstrauch et al. 2023).",
    principle: "Konzentrierte Säure dehydratisiert Zucker zu Furfural (Pentosen) bzw. Hydroxymethylfurfural (Hexosen). Diese kondensieren mit α-Naphthol zu einem violetten Farbstoff.",
    procedure: ["Probelösung mit α-Naphthol-Lösung mischen.", "Konzentrierte Schwefelsäure vorsichtig unterschichten.", "An der Grenzfläche beobachten."],
    observation: "An der Phasengrenze bildet sich ein Ring.", colour: "Violetter bis rotvioletter Ring.",
    positive: "Ein Kohlenhydrat ist wahrscheinlich enthalten.",
    negative: "Kein Ring: Kohlenhydrat unwahrscheinlich (z. B. Polyalkohole).",
    limits: ["Nicht spezifisch: Weitere Stoffe, die Furfurale bilden, können reagieren.", "Sagt nichts über die Art des Zuckers."],
    misreadings: ["Positiv bedeutet nicht reduzierend und nicht Glucose."],
    hazards: ["Konzentrierte Schwefelsäure ist stark ätzend.", "α-Naphthol ist gesundheitsschädlich; deshalb gibt es Ersatzvarianten."],
    ppe: PPE + " Besonders sorgfältig mit konzentrierter Säure umgehen.", disposal: PLAN, sources: [link(M), link(R)],
  },
  {
    id: "bial", name: "Bial-Probe",
    purpose: "Nachweis von Pentosen.",
    scope: "Stoffgruppe", scopeText: "Weist Pentosen nach, nicht ein bestimmtes Molekül.",
    suitable: "Pentosen (z. B. Ribose). Die in dieser App enthaltenen Zucker sind Hexosen.",
    reagents: "Orcin und konzentrierte Salzsäure, mit Eisen(III)-Ionen.",
    principle: "Pentosen werden zu Furfural dehydratisiert, das mit Orcin in Gegenwart von Eisen(III) einen gefärbten Komplex bildet.",
    procedure: ["Probe mit Bial-Reagenz mischen.", "Vorsichtig erhitzen.", "Färbung beobachten."],
    observation: "Pentosen färben die Lösung.", colour: "Blaugrün (Pentosen).",
    positive: "Pentose wahrscheinlich.", negative: "Keine typische blaugrüne Färbung: Pentose unwahrscheinlich.",
    limits: ["Hexosen zeigen die typische blaugrüne Färbung nicht, können aber bei längerem Erhitzen andere Färbungen geben."],
    misreadings: ["Eine andere Färbung ist kein Pentosenachweis."],
    hazards: ["Konzentrierte Salzsäure ist ätzend. Das Reagenz nur mit Abzug und Schutzausrüstung verwenden."],
    ppe: PPE, disposal: PLAN, sources: [],
  },
  {
    id: "hydrolyse", name: "Hydrolyse-Nachweis",
    purpose: "Glykosidische Bindungen spalten und die freigesetzten Monosaccharide nachweisen.",
    scope: "Hilfsreaktion", scopeText: "Keine eigene Nachweisreaktion: Sie bereitet einen Stoff für andere Tests vor.",
    suitable: "Disaccharide, Oligosaccharide, Polysaccharide.",
    reagents: "Verdünnte Säure (z. B. Salzsäure) und Wärme oder Enzyme (z. B. Amylase, Lactase, Invertase).",
    principle: "Wasser spaltet die glykosidische Bindung. Jede gespaltene Bindung verbraucht ein Wasser und setzt zwei Zuckerreste frei.",
    procedure: ["Probe mit verdünnter Säure erhitzen oder Enzym einwirken lassen.", "Abkühlen und neutralisieren (für Fehling oder Benedict ist alkalisches Milieu nötig).", "Danach z. B. Fehling, Benedict oder GOD durchführen und mit dem Ergebnis vor der Hydrolyse vergleichen."],
    observation: "Ein vorher negativer Test (z. B. Fehling bei Saccharose) wird nach der Hydrolyse positiv.", colour: "Hängt vom anschließenden Test ab.",
    positive: "Es entstehen reduzierende Monosaccharide. Daraus lässt sich auf gebundene Zucker schließen.",
    negative: "Keine Veränderung: keine spaltbare Bindung oder unvollständige Hydrolyse.",
    limits: ["Stärke braucht deutlich längere Hydrolyse als Disaccharide, Cellulose noch härtere Bedingungen.", "Zu starkes Erhitzen mit Säure zersetzt Zucker (Braunfärbung)."],
    misreadings: ["Unvollständige Hydrolyse kann zu schwachen oder gemischten Ergebnissen führen.", "Ohne Neutralisation fällt Fehling oder Benedict falsch negativ aus."],
    hazards: ["Verdünnte Säure reizt Haut und Augen; die anschließende Neutralisation mit Lauge oder Soda ebenfalls."],
    ppe: PPE, disposal: PLAN, sources: [link(R)],
  },
];

export const TEST_BY_ID = Object.fromEntries(TESTS.map((t) => [t.id, t])) as Record<TestId, TestCard>;
