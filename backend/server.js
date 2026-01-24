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

    if (!GEMINI_KEY) {
      return res.status(500).json({ erro: "Configuração ausente: GEMINI_KEY" });
    }

    // Estrutura de prompt para o Niklaus
    const promptText = `Você é o Niklaus, mentor financeiro. Analise estes dados e dê 3 dicas curtas: ${mensagem}`;

    // URL ALTERNATIVA (Versão v1 estável é mais garantida que a v1beta)
    // Se continuar a dar 404, mude "v1" para "v1beta" abaixo
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`;

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

    // Se a Google retornar erro (como o 404 que viste antes)
    if (data.error) {
      console.error("Erro reportado pela Google:", data.error);
      return res.status(data.error.code || 500).json({ 
        erro: data.error.message,
        codigo: data.error.code 
      });
    }

    // Extração segura do texto
    const textoFinal = data?.candidates?.[0]?.content?.parts?.[0]?.text || "Niklaus está a pensar... tente novamente.";
    
    res.json({ resposta: textoFinal });

  } catch (err) {
    console.error("Erro interno no servidor:", err);
    res.status(500).json({ erro: "Falha na comunicação com a IA" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Niklaus Online na porta ${PORT}`));
