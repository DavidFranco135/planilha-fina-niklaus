import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Groq from "groq-sdk";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Inicializa a Groq com a chave do Render
const groq = new Groq({
  apiKey: process.env.GROQ_KEY,
});

app.post("/gemini", async (req, res) => {
  try {
    const { mensagem } = req.body;

    if (!process.env.GROQ_KEY) {
      console.error("ERRO: GROQ_KEY não encontrada nas variáveis de ambiente.");
      return res.status(500).json({ erro: "Configuração do servidor incompleta." });
    }

    // Chamada para a Groq
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "Você é Niklaus, mentor financeiro brasileiro, direto, pragmático e experiente. Gere 3 dicas financeiras estratégicas, objetivas e aplicáveis. Use linguagem simples, tom encorajador e emojis moderados. Responda apenas em português."
        },
        {
          role: "user",
          content: mensagem
        }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
    });

    const respostaTexto = completion.choices[0]?.message?.content || "Niklaus está refletindo... tente novamente.";
    
    console.log("✅ Resposta enviada com sucesso pela Groq!");
    res.json({ resposta: respostaTexto });

  } catch (err) {
    console.error("❌ Erro na Groq:", err.message);
    res.status(500).json({ 
      erro: "Niklaus está temporariamente offline", 
      detalhes: err.message 
    });
  }
});

// Rota de teste simples (acesse no navegador para ver se o server está vivo)
app.get("/", (req, res) => res.send("Servidor do Niklaus está Online! 🚀"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
