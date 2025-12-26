import type { FinancialSnapshot, ReportQuestion } from "../types/domain";

const geminiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;

export const canUseGemini = Boolean(geminiKey);

export const askGeminiQuestion = async (
  question: string,
  snapshot: FinancialSnapshot
): Promise<ReportQuestion> => {
  if (!canUseGemini) {
    throw new Error("Configure VITE_GEMINI_API_KEY para usar a análise com IA.");
  }

  const prompt = `
    Contexto financeiro JSON:
    ${JSON.stringify(snapshot)}

    Pergunta: ${question}

    Forneça uma resposta direta, em português, com sugestões práticas.
  `;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ]
      })
    }
  );

  if (!response.ok) {
    throw new Error("Falha ao consultar a API do Gemini.");
  }

  const data = await response.json();
  const answer =
    data?.candidates?.[0]?.content?.parts?.[0]?.text ??
    "Não foi possível gerar a resposta.";

  return {
    id: crypto.randomUUID(),
    pergunta: question,
    resposta: answer,
    criado_em: new Date().toISOString()
  };
};
