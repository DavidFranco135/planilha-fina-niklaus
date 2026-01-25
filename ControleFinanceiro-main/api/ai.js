import { GoogleGenAI } from 'gemini-ai-sdk';

export default async function handler(req, res) {
  const { userQuestion, totals, currentTransactions } = req.body;

  try {// api/ai.js
import { GoogleGenAI } from 'gemini-ai-sdk';

export default async function handler(req, res) {
  try {
    const { userQuestion, totals, currentTransactions } = req.body;

    // Inicializa a Gemini IA com a chave segura do Vercel
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    // Cria um resumo financeiro do usuário
    const summary = `
Total de Entradas: R$ ${totals.inc.toLocaleString('pt-BR')}
Total de Saídas: R$ ${totals.exp.toLocaleString('pt-BR')}
Saldo Atual: R$ ${totals.bal.toLocaleString('pt-BR')}
Principais transações recentes: ${currentTransactions
      .slice(0,5)
      .map(t => `${t.description} (R$ ${t.amount})`)
      .join(', ')}
    `;

    // Solicita à IA que responda como Niklaus
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `
Pergunta do usuário: ${userQuestion}
Responda como Niklaus, mentor financeiro brasileiro, direto, motivador e pragmático.
Contexto financeiro: ${summary}
      `,
      config: {
        systemInstruction: "Você é Niklaus, mentor financeiro pessoal brasileiro, direto e motivador."
      }
    });

    // Retorna a resposta para o frontend
    res.status(200).json({ reply: response.text });

  } catch (err) {
    console.error("Erro na IA:", err);

    // Resposta padrão caso dê erro
    res.status(500).json({
      reply: `Dicas do Niklaus para o seu momento:

1. 💸 Estanque os pequenos vazamentos...
2. 📈 Pague-se primeiro...
3. 🚀 O segredo não é o quanto você ganha, mas o quanto mantém.`
    });
  }
}

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const summary = `
Total de Entradas: R$ ${totals.inc.toLocaleString('pt-BR')}
Total de Saídas: R$ ${totals.exp.toLocaleString('pt-BR')}
Saldo Atual: R$ ${totals.bal.toLocaleString('pt-BR')}
Principais transações recentes: ${currentTransactions
      .slice(0,5)
      .map(t => `${t.description} (R$ ${t.amount})`)
      .join(', ')}
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `
Pergunta do usuário: ${userQuestion}
Responda como Niklaus, mentor financeiro brasileiro, direto, motivador e pragmático.
Contexto financeiro: ${summary}
      `,
      config: { systemInstruction: "Você é Niklaus, mentor financeiro pessoal brasileiro, direto e motivador." }
    });

    res.status(200).json({ reply: response.text });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      reply: `Dicas do Niklaus para o seu momento:

1. 💸 Estanque os pequenos vazamentos...
2. 📈 Pague-se primeiro...
3. 🚀 O segredo não é o quanto você ganha, mas o quanto mantém.`
    });
  }
}
