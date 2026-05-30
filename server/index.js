import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

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

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// POST /api/auth/register
app.post('/api/auth/register', async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }
  try {
    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await prisma.userData.findFirst({
      where: { email: normalizedEmail }
    });
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered" });
    }

    const userId = 'user_' + Math.random().toString(36).substring(2, 15);
    const hashedPassword = hashPassword(password);

    const data = await prisma.userData.create({
      data: {
        id: userId,
        email: normalizedEmail,
        password: hashedPassword,
        tasks: [],
        finances: [],
        currentDay: {},
        assets: [],
        savings: [],
        debts: [],
        history: [],
        chatHistory: [],
        userProfile: {
          name: name || 'User LifeOS',
          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150&h=150',
          bio: 'Mengelola hidup lebih teratur dengan LifeOS ✨'
        }
      }
    });

    res.json({ success: true, userId, email: normalizedEmail, name: data.userProfile.name });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Failed to register user", message: error.message });
  }
});

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }
  try {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await prisma.userData.findFirst({
      where: { email: normalizedEmail }
    });
    if (!user) {
      return res.status(400).json({ error: "Email not found" });
    }

    const hashedPassword = hashPassword(password);
    if (user.password !== hashedPassword) {
      return res.status(400).json({ error: "Invalid password" });
    }

    res.json({
      success: true,
      userId: user.id,
      email: user.email,
      name: (user.userProfile && user.userProfile.name) || 'User LifeOS'
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Failed to login", message: error.message });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', framework: 'Prisma Client + Express' });
});

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🚀 Prisma backend listening on http://localhost:${PORT}`);
  });
}

export default app;
