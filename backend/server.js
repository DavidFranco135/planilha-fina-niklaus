import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const GEMINI_KEY = process.env.GEMINI_KEY;

app.post("/gemini", async (req, res) => {
  try {
    const { mensagem } = req.body;

    // Prompt do Niklaus
    const promptText = `Você é Niklaus, mentor financeiro. Analise e dê 3 dicas curtas para: ${mensagem}`;

    // Esta é a URL e o MODELO com maior taxa de aceitação para chaves novas e antigas
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${GEMINI_KEY}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: promptText }]
        }]
      })
    });

    const data = await response.json();

    // Log para depuração no Render
    console.log("Status da Resposta:", response.status);

    if (data.error) {
      console.error("Erro detalhado Google:", data.error);
      return res.status(data.error.code || 500).json({ erro: data.error.message });
    }

    const textoFinal = data?.candidates?.[0]?.content?.parts?.[0]?.text || "Niklaus está meditando... tente novamente.";
    res.json({ resposta: textoFinal });

  } catch (err) {
    console.error("Erro no Catch:", err.message);
    res.status(500).json({ erro: "Erro de conexão", detalhes: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("🚀 Servidor Niklaus Pronto"));
