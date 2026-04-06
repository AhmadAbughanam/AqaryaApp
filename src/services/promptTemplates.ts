// Prompt template stubs for local LLM queries related to properties and investments.

export const PROPERTY_OVERVIEW_TEMPLATE =
  'Summarize this property in plain language with key risks and opportunities: {{input}}';

export const PROPERTY_COMPARISON_TEMPLATE =
  'Compare these properties for a first-time investor and explain trade-offs: {{input}}';

export const INVESTMENT_SIMULATION_TEMPLATE =
  'Given this investment scenario, explain expected outcomes and assumptions: {{input}}';

export const PORTFOLIO_EXPLANATION_TEMPLATE =
  'Explain this portfolio performance in simple terms and suggest next checks: {{input}}';

// Applies user input to a selected template.
export const applyTemplate = (template: string, input: string): string => {
  return template.replace('{{input}}', input.trim());
};
