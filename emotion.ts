export function applyTone(text: string): string {
    // excited
    if (text.includes("!")) {
      return `(excited playful tone) ${text}`;
    }
  
    // curious / teasing
    if (text.includes("?")) {
      return `(curious teasing tone) ${text}`;
    }
  
    // soft / romantic
    if (text.includes("...")) {
      return `(soft gentle tone) ${text}`;
    }
  
    // normal
    return `(playful tone) ${text}`;
  }