export type State = "eindeutig" | "wahrscheinlich" | "mehrdeutig" | "unbekannt";

export const STATE_TEXT: Record<State, string> = {
  eindeutig: "Molekül eindeutig identifiziert.",
  wahrscheinlich: "Molekül wahrscheinlich identifiziert. Einige Informationen sind noch nicht eindeutig bestätigt.",
  mehrdeutig: "Keine eindeutige Identifizierung möglich.",
  unbekannt: "Molekül konnte nicht eindeutig identifiziert werden.",
};
