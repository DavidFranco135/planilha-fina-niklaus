import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Groq from "groq-sdk";
// IMPORTANTE: Importar o arquivo do webhook
import kiwifyWebhook from './kiwify-webhook.js'; 

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const groq = new Groq({
  apiKey: process.env.GROQ_KEY,
});

// --- ROTA DA IA NIKLAUS ---
app.post("/gemini", async (req, res) => {
  try {
    const { mensagem } = req.body;

    if (!process.env.GROQ_KEY) {
      return res.status(500).json({ erro: "Configuração do servidor incompleta." });
    }

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "Você é Niklaus, mentor financeiro brasileiro. Gere 3 dicas financeiras estratégicas. Use emojis interativos. Não faça perguntas. Sempre se apresente pelo nome Niklaus e use o nome da pessoa se disponível. Noo final conte uma piadas variadas."
        },
        { role: "user", content: mensagem }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
    });

    res.json({ resposta: completion.choices[0]?.message?.content });
    console.log("✅ Resposta enviada com sucesso pela Groq!");

  } catch (err) {
    console.error("❌ Erro na Groq:", err.message);
    res.status(500).json({ erro: "Niklaus está offline", detalhes: err.message });
  }
});

// --- ROTA DO WEBHOOK KIWIFY (A que estava faltando) ---
// No painel da Kiwify, a URL deve ser: https://controlefinanceiro-naip.onrender.com/webhook-kiwify
app.post("/webhook-kiwify", kiwifyWebhook);

app.get("/", (req, res) => res.send("Servidor do Niklaus está Online! 🚀"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));
