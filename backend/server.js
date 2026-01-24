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
      return res.status(500).json({ erro: "Chave GEMINI_KEY não encontrada no Render." });
    }

    // Prompt configurado para o Niklaus
    const payload = {
      contents: [{
        parts: [{ text: `Você é Niklaus, mentor financeiro. Responda em português: ${mensagem}` }]
      }]
    };

    // TENTATIVA 1: O formato mais aceito hoje (v1beta + gemini-1.5-flash)
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    // Se der erro 404, tentamos o modelo alternativo automaticamente
    if (data.error && data.error.code === 404) {
      console.log("Tentando modelo alternativo...");
      const altUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_KEY}`;
      const altRes = await fetch(altUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const altData = await altRes.json();
      
      if (altData.error) throw new Error(altData.error.message);
      
      const textoAlt = altData?.candidates?.[0]?.content?.parts?.[0]?.text;
      return res.json({ resposta: textoAlt });
    }

    if (data.error) {
      throw new Error(data.error.message);
    }

    const textoFinal = data?.candidates?.[0]?.content?.parts?.[0]?.text || "Niklaus está processando...";
    res.json({ resposta: textoFinal });

  } catch (err) {
    console.error("Erro Final:", err.message);
    res.status(500).json({ erro: "Erro na IA", detalhes: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Niklaus rodando na porta ${PORT}`));
