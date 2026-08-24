export interface TemplateVariables {
  kundeVorname: string;
  kundeNachname: string;
  artikel: string;
  filiale: string;
  abholhinweis: string;
}

/** Replaces {{placeholder}} tokens in a template body/subject with the given
 * variables. Unknown placeholders are left untouched (visible in the
 * settings UI so staff notice a typo instead of silently losing text). */
export function renderTemplate(template: string, variables: TemplateVariables): string {
  return template.replace(/{{\s*(\w+)\s*}}/g, (match, key: string) => {
    if (key in variables) {
      return variables[key as keyof TemplateVariables];
    }
    return match;
  });
}
