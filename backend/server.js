import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY, {
  apiVersion: "v1"
});

app.post("/ai", async (req, res) => {
  try {
    const { totals, currentTransactions, userQuestion } = req.body;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
Você é o Niklaus, um assistente financeiro inteligente.

Dados do usuário:
Totais: ${JSON.stringify(totals)}
Transações: ${JSON.stringify(currentTransactions)}

Pergunta:
${userQuestion}

Responda em português, de forma prática, clara e objetiva.
Dê dicas reais e aplicáveis.
`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();

    res.json({ reply: response });

  } catch (err) {
    console.error("Erro Gemini:", err);
    res.status(500).json({ reply: "Erro ao consultar a IA" });
  }
});
