import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Groq from "groq-sdk";
import kiwifyWebhook from './kiwify-webhook.js';
import admin from "firebase-admin";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ========================
// Inicializa Firebase Admin
// ========================
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)),
  });
}

const db = admin.firestore();

// ========================
// Inicializa Groq SDK
// ========================
const groq = new Groq({
  apiKey: process.env.GROQ_KEY,
});

// ========================
// ROTA AI NIKLAUS
// ========================
const temasPiadas = ["investimentos", "bancos", "boletos", "cartão de crédito", "cripto", "inflação", "aposentadoria"];

app.post("/gemini", async (req, res) => {
  try {
    const { mensagem, nomeUsuario } = req.body;
    const temaAleatorio = temasPiadas[Math.floor(Math.random() * temasPiadas.length)];

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `Você é Niklaus, mentor financeiro. Nome do usuário: ${nomeUsuario || 'Amigo'}. 
          Apresente-se, dê 3 dicas curtas com emojis e conte uma piada inédita sobre ${temaAleatorio}. 
          Seja direto e rápido.`
        },
        { role: "user", content: mensagem }
      ],
      model: "llama-3.1-8b-instant", 
      temperature: 0.9,
    });

    res.json({ resposta: completion.choices[0]?.message?.content });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Niklaus deu uma saidinha." });
  }
});

// ========================
// WEBHOOK KIWIFY
// ========================
app.post("/webhook-kiwify", kiwifyWebhook);

// ========================
// ROTA PARA ENVIAR MENSAGEM DO ADMIN
// ========================
app.post("/enviar-mensagem", async (req, res) => {
  try {
    const { userId, mensagem } = req.body;

    if (!userId || !mensagem) {
      return res.status(400).json({ erro: "Faltando userId ou mensagem" });
    }

    await db.collection("mensagens").add({
      de: "admin",
      para: userId,
      mensagem,
      data: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ sucesso: true, msg: "Mensagem enviada ao usuário!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao enviar mensagem" });
  }
});

// ========================
// ROTA PARA LISTAR USUÁRIOS (PAINEL ADMIN)
// ========================
app.get("/usuarios", async (req, res) => {
  try {
    const snapshot = await db.collection("users").get();
    const usuarios = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(usuarios);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao listar usuários" });
  }
});

// ========================
// ROTA PARA LISTAR SUGESTÕES (PAINEL ADMIN)
// ========================
app.get("/sugestoes", async (req, res) => {
  try {
    const snapshot = await db.collection("sugestoes")
      .orderBy("createdAt", "desc")
      .get();

    const sugestoes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(sugestoes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao listar sugestões" });
  }
});

// ========================
// ROTA PARA RESPONDER SUGESTÃO (ADMIN)
// ========================
app.post("/responder-sugestao", async (req, res) => {
  try {
    const { sugestaoId, resposta } = req.body;

    if (!sugestaoId || !resposta) {
      return res.status(400).json({ erro: "Faltando sugestaoId ou resposta" });
    }

    // Busca sugestão
    const sugRef = db.collection("sugestoes").doc(sugestaoId);
    const sugDoc = await sugRef.get();

    if (!sugDoc.exists) {
      return res.status(404).json({ erro: "Sugestão não encontrada" });
    }

    const sugestaoData = sugDoc.data();
    const userId = sugestaoData.userId;

    // 1️⃣ Salvar resposta na própria sugestão
    await sugRef.update({
      reply: resposta,
      respondido: true,
      respostaData: admin.firestore.FieldValue.serverTimestamp()
    });

    // 2️⃣ Salvar mensagem do admin para o usuário
    await db.collection("mensagens").add({
      de: "admin",
      para: userId,
      mensagem: resposta,
      data: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ sucesso: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao responder sugestão" });
  }
});
// POST /mensagem-para-usuario
app.post("/mensagem-para-usuario", async (req, res) => {
  try {
    const { userId, mensagem } = req.body;

    if (!userId || !mensagem) {
      return res.status(400).json({ erro: "Faltando userId ou mensagem" });
    }

    // Salva a mensagem para o usuário
    await db.collection("mensagens").add({
      de: "admin",
      para: userId,
      mensagem,
      data: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ sucesso: true, msg: "Mensagem enviada ao usuário!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao enviar mensagem" });
  }
});

// ========================
// ROTA TESTE
// ========================
app.get("/", (req, res) => res.send("Servidor do Niklaus está Online! 🚀"));

// ========================
// INICIA SERVIDOR
// ========================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));
