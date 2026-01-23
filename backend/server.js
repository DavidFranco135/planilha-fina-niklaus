import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const GEMINI_KEY = process.env.GEMINI_KEY; // variável ambiente no Render

app.post("/gemini", async (req, res) => {
  try {
    const { mensagem } = req.body;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `
Você é um assistente financeiro.
Dê sugestões claras, práticas e simples.

Dados do usuário:
${mensagem}
              `
            }]
          }]
        })
      }
    );

    const data = await response.json();
    const texto = data.candidates?.[0]?.content?.parts?.[0]?.text || "Sem resposta da IA";

    res.json({ resposta: texto });

  } catch (err) {
    res.status(500).json({ erro: "Erro na IA", detalhes: err.message });
  }
});

app.listen(3000, () => {
  console.log("Servidor IA rodando na porta 3000");
});
