import { GoogleGenAI } from 'gemini-ai-sdk'; // ou SDK que você usa

export default async function handler(req, res) {
  const { userQuestion, totals, currentTransactions } = req.body;

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const summary = `
      Total de entradas: R$ ${totals.inc.toLocaleString('pt-BR')}
      Total de saídas: R$ ${totals.exp.toLocaleString('pt-BR')}
      Saldo atual: R$ ${totals.bal.toLocaleString('pt-BR')}
      Principais transações: ${currentTransactions.slice(0,5).map(t=>`${t.description} (R$ ${t.amount})`).join(', ')}
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `
        Usuário pergunta: ${userQuestion}
        Responda como Niklaus, mentor financeiro brasileiro, direto, motivador e pragmático. Use emojis.
        Contexto financeiro: ${summary}
      `,
      config: {
        systemInstruction: "Você é Niklaus, mentor financeiro pessoal brasileiro, direto e motivador."
      }
    });

    res.status(200).json({ reply: response.text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ reply: "Não consegui gerar a resposta, tente novamente." });
  }
}
