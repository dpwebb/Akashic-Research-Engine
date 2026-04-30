import { promptTemplates } from '../../shared/promptTemplates.js';
import { guardrailRules } from '../../shared/taxonomy.js';
import { getOpenAIClient, getOpenAIModel } from './client.js';

type ResearchAssistantInput = {
  templateId: string;
  userInput: string;
};

export async function generateResearchAssistantOutput(input: ResearchAssistantInput) {
  const template = promptTemplates.find((item) => item.id === input.templateId);

  if (!template) {
    throw new Error(`Unknown assistant template: ${input.templateId}`);
  }

  const client = getOpenAIClient();
  const model = getOpenAIModel();

  const response = await client.responses.create({
    model,
    reasoning: { effort: 'low' },
    input: [
      {
        role: 'system',
        content: [
          'You are the Akashic Research Engine assistant.',
          'Maintain a third-person, evidence-aware research posture.',
          'Never present unverifiable Akashic Records claims as empirical fact.',
          'Never ridicule the subject.',
          'Separate documented history, source interpretation, subjective testimony, and speculation.',
          'Require citations for factual claims.',
          'Mark all generated theories and additions as SPECULATIVE.',
          `Guardrails: ${guardrailRules.join(' ')}`,
        ].join('\n'),
      },
      {
        role: 'user',
        content: [
          `Task: ${template.name}`,
          `Purpose: ${template.purpose}`,
          `Template: ${template.template}`,
          'User material:',
          input.userInput,
        ].join('\n\n'),
      },
    ],
  });

  return {
    templateId: template.id,
    model,
    output: response.output_text,
    speculative: template.id === 'realistic-addition' || /speculative/i.test(template.template),
  };
}
