import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// Log requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// GET user data
app.get('/api/userdata/:userId?', async (req, res) => {
  const userId = req.params.userId || 'default';
  try {
    let data = await prisma.userData.findUnique({
      where: { id: userId }
    });

    // If no row exists, create and return a default template
    if (!data) {
      data = await prisma.userData.create({
        data: {
          id: userId,
          tasks: [],
          finances: [],
          currentDay: {},
          assets: [],
          savings: [],
          debts: [],
          history: [],
          chatHistory: [],
          userProfile: {
            name: 'User LifeOS',
            avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150&h=150',
            bio: 'Mengelola hidup lebih teratur dengan LifeOS ✨'
          }
        }
      });
    }

    res.json(data);
  } catch (error) {
    console.error("Error fetching user data via Prisma:", error);
    res.status(500).json({ error: "Failed to fetch user data", message: error.message });
  }
});

// POST/UPSERT user data
app.post('/api/userdata/:userId?', async (req, res) => {
  const userId = req.params.userId || 'default';
  const { tasks, finances, currentDay, assets, savings, debts, history, chatHistory, userProfile } = req.body;

  try {
    const data = await prisma.userData.upsert({
      where: { id: userId },
      update: {
        tasks: tasks || [],
        finances: finances || [],
        currentDay: currentDay || {},
        assets: assets || [],
        savings: savings || [],
        debts: debts || [],
        history: history || [],
        chatHistory: chatHistory || [],
        userProfile: userProfile || {}
      },
      create: {
        id: userId,
        tasks: tasks || [],
        finances: finances || [],
        currentDay: currentDay || {},
        assets: assets || [],
        savings: savings || [],
        debts: debts || [],
        history: history || [],
        chatHistory: chatHistory || [],
        userProfile: userProfile || {}
      }
    });

    res.json({ success: true, data });
  } catch (error) {
    console.error("Error upserting user data via Prisma:", error);
    res.status(500).json({ error: "Failed to save user data", message: error.message });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', framework: 'Prisma Client + Express' });
});

app.listen(PORT, () => {
  console.log(`🚀 Prisma backend listening on http://localhost:${PORT}`);
});
