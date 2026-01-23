import express from "express";
import cors from "cors";
import { GoogleGenAI } from "gemini-ai-sdk";

const app = express();
app.use(cors());
app.use(express.json());

// Pegando a chave da Gemini da variável de ambiente
const AI_KEY = process.env.GEMINI_API_KEY;

app.post("/ai", async (req, res) => {
  const { totals, currentTransactions, userQuestion } = req.body;

  try {
    const ai = new GoogleGenAI({ apiKey: AI_KEY });

    const summary = `
Resumo Financeiro do Usuário:
Total de Entradas: R$ ${totals.inc.toLocaleString('pt-BR')}
Total de Saídas: R$ ${totals.exp.toLocaleString('pt-BR')}
Saldo Atual: R$ ${totals.bal.toLocaleString('pt-BR')}
Principais transações recentes: ${currentTransactions
      .slice(0, 5)
      .map(t => `${t.description} (R$ ${t.amount})`)
      .join(', ')}
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Com base nesses dados financeiros, responda à seguinte pergunta de forma prática e motivadora: ${userQuestion}\n${summary}`,
      config: {
        systemInstruction: "Você é Niklaus, mentor financeiro brasileiro, direto e motivador. Use emojis e linguagem clara."
      }
    });

    res.json({ reply: response.text || "Dicas do Niklaus padrão (fallback)." });

  } catch (err) {
    console.error("Erro na IA:", err);
    res.json({ reply: `
Dicas do Niklaus padrão:

1. 💸 Estanque os pequenos vazamentos: revise assinaturas e gastos desnecessários.
2. 📈 Pague-se primeiro: reserve uma quantia da renda para sua reserva.
3. 🚀 O segredo não é quanto você ganha, mas quanto mantém e multiplica.
    `});
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Servidor rodando na porta ${port}`));
