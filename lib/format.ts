const SUB = "₀₁₂₃₄₅₆₇₈₉";
export const sub = (s: string) => s.replace(/\d/g, (d) => SUB[Number(d)]);
export const de = (n: number, digits = 3) => n.toFixed(digits).replace(".", ",");
