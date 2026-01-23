import express from "express";
import cors from "cors";
import admin from "firebase-admin";
import kiwifyWebhook from "./kiwify-webhook.js"; // seu webhook

const app = express();
app.use(cors());
app.use(express.json());

// Inicializa Firebase
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(
      JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    ),
  });
}

// Rota webhook do Kiwify
app.post("/kiwify-webhook", kiwifyHandler);

// Rota da IA (exemplo)
app.post("/ai", async (req, res) => {
  try {
    const { totals, currentTransactions, userQuestion } = req.body;
    
    // Aqui você chamaria a Gemini AI
    // Exemplo de resposta fixa por enquanto
    res.json({
      reply: "Olá! Aqui vão 3 dicas do Niklaus para suas finanças..."
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ reply: "Erro interno da IA" });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Backend rodando na porta ${PORT}`));
