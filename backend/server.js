import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

// Configuração do CORS para permitir seu frontend
app.use(cors());
app.use(express.json());

const GEMINI_KEY = process.env.GEMINI_KEY;

app.post("/gemini", async (req, res) => {
  try {
    const { mensagem } = req.body;

    if (!GEMINI_KEY) {
      return res.status(500).json({ erro: "Chave GEMINI_KEY não configurada no servidor." });
    }

    const promptText = `
Você é Niklaus, mentor financeiro brasileiro, direto, pragmático e experiente.
Gere 3 dicas financeiras estratégicas, objetivas e aplicáveis.
Use linguagem simples, tom encorajador e emojis moderados.
Responda somente em português.

Dados do usuário:
${mensagem}
    `;

    // ENDPOINT ATUALIZADO (Gemini 1.5 Flash)
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: promptText }]
          }
        ]
      })
    });

    const data = await response.json();

    // Verificação de erro vindo da API da Google
    if (data.error) {
      console.error("Erro API Google:", data.error);
      return res.status(500).json({ erro: data.error.message });
    }

    // Extração correta do texto na estrutura do Gemini 1.5
    const texto = data?.candidates?.[0]?.content?.parts?.[0]?.text || "⚠️ Niklaus não conseguiu processar os dados agora.";

    res.json({ resposta: texto });

  } catch (err) {
    console.error("Erro Servidor:", err);
    res.status(500).json({ erro: "Erro interno no servidor", detalhes: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor Niklaus rodando na porta ${PORT}`);
});
