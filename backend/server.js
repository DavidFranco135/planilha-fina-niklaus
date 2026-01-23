import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const GEMINI_KEY = process.env.GEMINI_KEY;

app.post("/gemini", async (req, res) => {
  try {
    const { mensagem } = req.body;

    // Prompt Niklaus em português com emojis
    const promptText = `
Você é Niklaus, mentor financeiro brasileiro, direto, pragmático e experiente.
Gere 3 dicas financeiras estratégicas, objetivas e aplicáveis.
Use linguagem simples, tom encorajador e emojis moderados.
Responda somente em português.

Dados do usuário:
${mensagem}
    `;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1:generateMessage?key=${GEMINI_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: { text: promptText } // 👈 formato correto
        })
      }
    );

    const data = await response.json();
    console.log("Resposta bruta da Gemini:", JSON.stringify(data, null, 2));

    // Parse simples e seguro
    const texto = data?.output?.[0]?.content?.[0]?.text || "⚠️ IA não retornou texto válido";

    res.json({ resposta: texto });

  } catch (err) {
    console.error("Erro Gemini:", err);
    res.status(500).json({ erro: "Erro na IA", detalhes: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor IA Niklaus rodando na porta ${PORT}`);
});
