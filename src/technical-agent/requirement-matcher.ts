/** Coincidencias de palabras completas y exclusiones explícitas, sin servicios externos.
 * Es una heurística: las solicitudes ambiguas aún requieren validación humana.
 */
export function createRequirementMatcher(text: string) {
  const clauses = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .split(
      /[.!?;:\n]|\b(?:pero|aunque|sin embargo)\b|\by\s+(?=(?:si|con|quiero|necesito|requiero)\b)/,
    );

  return (...terms: string[]): boolean => {
    let included = false;
    for (const clause of clauses) {
      // Una exclusión tiene prioridad dentro de la misma cláusula/lista.
      let excluded = false;
      let found = false;
      for (const term of terms) {
        const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const pattern = new RegExp(`\\b${escaped}(?:s|es)?\\b`, 'g');
        for (const match of clause.matchAll(pattern)) {
          found = true;
          const prefix = clause
            .slice(0, match.index)
            .replace(/\bno\s+solo\b/g, '');
          if (
            /\b(?:no|sin|ni|tampoco|excluir|excluye|excluyendo)\b/.test(prefix)
          ) {
            excluded = true;
          }
        }
      }
      if (found) included = !excluded;
    }
    return included;
  };
}
