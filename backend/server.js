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
// ROTA PARA ENVIAR MENSAGEM DIRETA (ADMIN -> USUÁRIO)
// ========================
app.post("/enviar-mensagem", async (req, res) => {
  try {
    const { userId, mensagem } = req.body;

    if (!userId || !mensagem) {
      return res.status(400).json({ erro: "Faltando userId ou mensagem" });
    }

    // Criamos uma entrada na coleção de sugestões marcada como "direta" 
    // para que apareça no histórico do Admin e do Usuário
    const docRef = await db.collection("sugestoes").add({
      userId: userId,
      userName: "Niklaus (Direto)",
      message: `[MENSAGEM DO ADMIN]: ${mensagem}`,
      isDirect: true, // Diferencia de uma sugestão comum
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      respondido: true,
      reply: mensagem
    });

    // Também enviamos para a coleção de notificações/mensagens se houver
    await db.collection("mensagens").add({
      de: "admin",
      para: userId,
      mensagem,
      data: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ sucesso: true, id: docRef.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao enviar mensagem" });
  }
});

// ========================
// ROTA PARA LISTAR TODOS OS USUÁRIOS (PAINEL ADMIN)
// ========================
app.get("/usuarios", async (req, res) => {
  try {
    // Busca todos os usuários para o Dropdown do Admin
    const snapshot = await db.collection("users").get();
    const usuarios = snapshot.docs.map(doc => ({ 
      id: doc.id, 
      email: doc.data().email,
      appName: doc.data().appName || doc.data().displayName || "Usuário sem nome"
    }));
    res.json(usuarios);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao listar usuários" });
  }
});

// ========================
// ROTA PARA LISTAR TODO O HISTÓRICO (PAINEL ADMIN)
// ========================
app.get("/historico-geral", async (req, res) => {
  try {
    const snapshot = await db.collection("sugestoes")
      .orderBy("createdAt", "desc")
      .get();

    const historico = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(historico);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao buscar histórico" });
  }
});

// ========================
// ROTA PARA LISTAR SUGESTÕES PENDENTES
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
      return res.status(400).json({ erro: "Faltando dados" });
    }

    const sugRef = db.collection("sugestoes").doc(sugestaoId);
    const sugDoc = await sugRef.get();

    if (!sugDoc.exists) {
      return res.status(404).json({ erro: "Sugestão não encontrada" });
    }

    const userId = sugDoc.data().userId;

    // 1. Atualiza a sugestão com a resposta
    await sugRef.update({
      reply: resposta,
      respondido: true,
      respostaData: admin.firestore.FieldValue.serverTimestamp()
    });

    // 2. Cria notificação/mensagem para o usuário
    await db.collection("mensagens").add({
      de: "admin",
      para: userId,
      mensagem: resposta,
      data: admin.firestore.FieldValue.serverTimestamp(),
      lida: false
    });

    res.json({ sucesso: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao responder" });
  }
});

// ROTA TESTE
app.get("/", (req, res) => res.send("Servidor do Niklaus está Online! 🚀"));

// INICIA SERVIDOR
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));
