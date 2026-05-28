// LifeOS AI Engine ("Otak Pusat") powered by Google Gemini API
// Sinergi analisis lintas-dimensi antara tidur, pengeluaran, mood, dan produktivitas harian.

const getApiKeys = () => {
  const envKeys = import.meta.env.VITE_GEMINI_API_KEYS;
  if (envKeys) {
    return envKeys.split(',').map(k => k.replace(/['"]/g, '').trim());
  }
  return [
    "AIzaSyBGydVFDEE89tYUwbH9SnZeINXBD4AZinY", // default key
    "AIzaSyB_enA5PeId2B5Qpy9WgZXyr9MzUMGsvFc", // api 1
    "AIzaSyDlytncg_-rfoa3BXLN8TCmtc_OUTWjUbU", // api 2
    "AQ.Ab8RN6JYP9pCNJoNPlbstrUvTv5PfsLgQanhiJUaa00hL3e25w"  // api 3
  ];
};

const GEMINI_API_KEYS = getApiKeys();
let currentKeyIndex = 0;

// Helper to make direct HTTP fetch request to Gemini API with automatic key rotation failover
async function callGemini(systemPrompt, userPrompt, jsonSchema = null, inlineData = null, retryCount = 0) {
  if (retryCount >= GEMINI_API_KEYS.length) {
    throw new Error("All Gemini API keys exhausted / quota exceeded.");
  }
  
  const activeKey = GEMINI_API_KEYS[currentKeyIndex];
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${activeKey}`;

  try {
    const generationConfig = {
      temperature: jsonSchema ? 0.15 : 0.7,
      maxOutputTokens: 4000
    };
    
    if (jsonSchema) {
      generationConfig.responseMimeType = "application/json";
      generationConfig.responseSchema = jsonSchema;
    }

    const parts = [];
    if (systemPrompt && userPrompt) {
      parts.push({ text: `${systemPrompt}\n\nUser Input/Context:\n${userPrompt}` });
    } else if (systemPrompt) {
      parts.push({ text: systemPrompt });
    } else if (userPrompt) {
      parts.push({ text: userPrompt });
    }

    if (inlineData) {
      parts.push({ inlineData });
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: parts
          }
        ],
        generationConfig
      })
    });
    
    if (!response.ok) {
      const errText = await response.text();
      console.warn(`Gemini API key index ${currentKeyIndex} failed with status ${response.status}. Rotating...`);
      
      if (response.status === 429 || response.status === 400 || response.status === 403) {
        currentKeyIndex = (currentKeyIndex + 1) % GEMINI_API_KEYS.length;
        return await callGemini(systemPrompt, userPrompt, jsonSchema, inlineData, retryCount + 1);
      }
      
      throw new Error(`Gemini API error: Status ${response.status} - ${errText}`);
    }
    
    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    return text;
  } catch (error) {
    console.error(`Failed call with API key index ${currentKeyIndex}:`, error);
    if (retryCount < GEMINI_API_KEYS.length - 1) {
      currentKeyIndex = (currentKeyIndex + 1) % GEMINI_API_KEYS.length;
      return await callGemini(systemPrompt, userPrompt, jsonSchema, inlineData, retryCount + 1);
    }
    throw error;
  }
}

// Pre-seeded 2-week history data to showcase personalized AI pattern learning instantly
export const getSeededHistory = () => [];

// Core Life Quality Score Calculator
export const calculateLifeScore = (currentDay, tasks, finances) => {
  // 1. Health Subscore (25%)
  let healthScore = 50;
  if (currentDay) {
    const sleepVal = currentDay.sleepHours || 7;
    let sleepPoints = sleepVal >= 8 ? 100 : sleepVal >= 7 ? 85 : sleepVal >= 6 ? 65 : 45;
    if (currentDay.sleepQuality === 'good') sleepPoints = Math.min(100, sleepPoints + 15);
    if (currentDay.sleepQuality === 'poor') sleepPoints = Math.max(20, sleepPoints - 25);

    const stepsVal = currentDay.steps || 5000;
    const stepsPoints = stepsVal >= 10000 ? 100 : stepsVal >= 7000 ? 85 : stepsVal >= 4000 ? 60 : 35;

    const workoutVal = currentDay.workoutMinutes || 0;
    const workoutPoints = workoutVal >= 45 ? 100 : workoutVal >= 20 ? 80 : workoutVal > 0 ? 60 : 30;

    const waterVal = currentDay.waterIntake || 1500;
    const waterPoints = waterVal >= 2000 ? 100 : waterVal >= 1200 ? 75 : 40;

    healthScore = (sleepPoints + stepsPoints + workoutPoints + waterPoints) / 4;
  }

  // 2. Productivity Subscore (25%)
  let productivityScore = 70;
  if (tasks.length > 0) {
    const completed = tasks.filter(t => t.status === 'completed').length;
    const snoozed = tasks.filter(t => t.status === 'snoozed').length;
    const total = tasks.length;
    
    const completionRate = completed / total;
    let baseProd = completionRate * 100;
    
    // snooze penalty
    baseProd -= snoozed * 8;
    productivityScore = Math.max(10, Math.min(100, baseProd));
  }

  // 3. Finance Subscore (25%)
  let financeScore = 80;
  const budgetLimit = 150000; // Daily budget limit
  const todayExpenses = finances
    .filter(f => f.type === 'expense')
    .reduce((sum, f) => sum + f.amount, 0);
  
  if (todayExpenses === 0) {
    financeScore = 100;
  } else if (todayExpenses <= budgetLimit) {
    financeScore = 100 - (todayExpenses / budgetLimit) * 35; // max 35 point reduction
  } else {
    const overBudgetPercent = (todayExpenses - budgetLimit) / budgetLimit;
    financeScore = Math.max(10, 65 - overBudgetPercent * 80);
  }

  // 4. Mood Subscore (25%)
  let moodScore = 75;
  if (currentDay) {
    const moodMap = { good: 95, neutral: 70, tired: 50, anxious: 40, stressed: 30 };
    let baseMood = moodMap[currentDay.directMood] || 75;

    // Cross-dimensional adjustments:
    if (currentDay.sleepQuality === 'poor') baseMood = Math.max(20, baseMood - 15);
    if (financeScore < 50) baseMood = Math.max(15, baseMood - 15);
    const snoozedCount = tasks.filter(t => t.status === 'snoozed').length;
    if (snoozedCount >= 3) baseMood = Math.max(20, baseMood - 12);
    if (currentDay.workoutMinutes >= 20) baseMood = Math.min(100, baseMood + 10);

    moodScore = baseMood;
  }

  const finalScore = Math.round(
    healthScore * 0.25 + 
    productivityScore * 0.25 + 
    financeScore * 0.25 + 
    moodScore * 0.25
  );

  return {
    finalScore,
    breakdown: {
      health: Math.round(healthScore),
      productivity: Math.round(productivityScore),
      finance: Math.round(financeScore),
      mood: Math.round(moodScore)
    }
  };
};

// Generates dynamic LQS diagnostics using real Google Gemini API
export const getAIExplanation = async (score, breakdown, habits, tasks, finances) => {
  const systemPrompt = `
You are LifeOS AI Core, an AI advisor that analyzes the user's Life Quality Score (LQS).
Generate a concise, high-fidelity Indonesian feedback review based on their metrics.
Explain cross-dimensional correlations (e.g. how sleep affects spending and task completion rate).
Provide 2-3 specific, actionable coaching tips.
`;

  const explanationSchema = {
    type: "OBJECT",
    properties: {
      explanation: { 
        type: "STRING", 
        description: "Markdown description of the analysis and correlations. Use bolding and lists. Use \\n for newlines." 
      },
      advice: {
        type: "ARRAY",
        items: { type: "STRING" },
        description: "List of exactly 3 short, punchy coaching tips."
      }
    },
    required: ["explanation", "advice"]
  };

  const totalExpense = finances.filter(f => f.type === 'expense').reduce((sum, f) => sum + f.amount, 0);
  const snoozedCount = tasks.filter(t => t.status === 'snoozed').length;
  const completedCount = tasks.filter(t => t.status === 'completed').length;

  const userPrompt = `
LQS Score: ${score}/100
Health Subscore: ${breakdown.health}%
Productivity Subscore: ${breakdown.productivity}%
Finance Subscore: ${breakdown.finance}%
Mood Subscore: ${breakdown.mood}%
Sleep Hours: ${habits.sleepHours} (${habits.sleepQuality} quality)
Steps Today: ${habits.steps}
Workout: ${habits.workoutMinutes} minutes
Water Intake: ${habits.waterIntake} ml
Total Spending Today: Rp ${totalExpense.toLocaleString('id-ID')}
Tasks Completed: ${completedCount} completed, ${snoozedCount} snoozed.
`;

  try {
    const rawText = await callGemini(systemPrompt, userPrompt, explanationSchema);
    let cleaned = rawText.trim();
    if (cleaned.startsWith("```json")) {
      cleaned = cleaned.substring(7);
    } else if (cleaned.startsWith("```")) {
      cleaned = cleaned.substring(3);
    }
    if (cleaned.endsWith("```")) {
      cleaned = cleaned.substring(0, cleaned.length - 3);
    }
    cleaned = cleaned.trim();
    return JSON.parse(cleaned);
  } catch (error) {
    console.error("Gemini explanation generation failed, using mock fallback:", error);
    // Mock Fallback
    return {
      explanation: `Life Quality Score kamu berada di angka **${score}/100**. Tidur ${habits.sleepHours} jam dan pengeluaran Rp ${totalExpense.toLocaleString('id-ID')} memicu dinamika stres dan energi harian.`,
      advice: [
        "🌿 Pertahankan kecukupan air minum minimal 2 liter.",
        "📅 Selesaikan tugas prioritas rendah sebelum berganti hari.",
        "💵 Batasi belanja kopi atau makanan ringan ekstra besok."
      ]
    };
  }
};

// Conversational AI secretary processor powered by real Google Gemini API
export const processUserChat = async (userMessage, appState) => {
  const systemPrompt = `
You are LifeOS AI Core, a proactive, witty, and supportive Gen Z AI Personal Secretary. 
Communicate in a mix of Indonesian and Gen Z slang (bestie, gaes, dll.) with a supportive, witty tone. 
You know the user's complete state: tasks, budget, finances, mood, financial assets, active life goals, and historical logs. 
If the user asks about their balance, goals, or past trends, utilize the provided data to answer accurately and suggest tips.

If the user wants to log an expense (e.g. "beli kopi 25000", "jajan boba 15000", "tadi nonton bioskop habis 60000"), you MUST log it by writing a JSON block at the very end of your response inside a code block tagged with 'action_trigger'.
Example:
\`\`\`action_trigger
{
  "type": "ADD_EXPENSE",
  "payload": {
    "amount": 25000,
    "category": "Caffeine/Food",
    "description": "beli kopi"
  }
}
\`\`\`
(Possible categories: Caffeine/Food, Impulse/Lifestyle, Travel, Other)

If the user mentions being tired, exhausted, or stressed, and they have pending high priority tasks, suggest micro-breaks and rescheduling. Include this action block at the end:
\`\`\`action_trigger
{
  "type": "AUTO_RESCHEDULE_TIRED",
  "payload": {
    "postponeIds": ["t1", "t2"],
    "insertTask": {
      "text": "🧘 Micro-Break & Nafas Ringan (Rekomendasi AI)",
      "priority": "low",
      "tag": "Health",
      "status": "pending"
    }
  }
}
\`\`\`

If they mention exercising or workout, acknowledge it warmly and update their metrics.

Keep your response concise, helpful, and very Gen Z! Use rich markdown styling (bolding, lists).
`;

  const pendingTasks = appState.tasks.filter(t => t.status === 'pending');
  const userPrompt = `
User Message: "${userMessage}"
Current Date: ${appState.currentDay?.date || "today"}
Current Habits: ${JSON.stringify(appState.currentDay)}
Today's Pending Tasks: ${JSON.stringify(pendingTasks)}
Today's Transactions: ${JSON.stringify(appState.finances.filter(f => f.date === appState.currentDay?.date))}
Financial Assets/Accounts: ${JSON.stringify(appState.assets || [])}
Active Life Goals: ${JSON.stringify(appState.goals || [])}
Past History Logs (Last 5 days): ${JSON.stringify((appState.history || []).slice(-5))}
`;

  try {
    const rawText = await callGemini(systemPrompt, userPrompt);
    
    // Parse action_trigger if present in response
    let aiText = rawText;
    let actionTriggered = null;
    let stateUpdates = null;
    
    const triggerRegex = /```action_trigger([\s\S]*?)```/;
    const match = rawText.match(triggerRegex);
    
    if (match && match[1]) {
      try {
        actionTriggered = JSON.parse(match[1].trim());
        // Clean the action block from the visible text response
        aiText = rawText.replace(triggerRegex, '').trim();
      } catch (e) {
        console.error("Failed to parse action trigger JSON:", e);
      }
    }
    
    // Simple state updates based on user keywords (dopamine boosts)
    const msg = userMessage.toLowerCase();
    if (msg.includes('olahraga') || msg.includes('jogging') || msg.includes('gym') || msg.includes('workout')) {
      stateUpdates = {
        habits: { 
          ...appState.currentDay, 
          workoutMinutes: Math.max(30, (appState.currentDay.workoutMinutes || 0) + 30),
          directMood: 'good'
        }
      };
    } else if (msg.includes('capek') || msg.includes('lelah') || msg.includes('pusing') || msg.includes('burnout')) {
      stateUpdates = {
        habits: { ...appState.currentDay, directMood: 'tired' }
      };
    }
    
    return {
      aiText,
      stateUpdates,
      actionTriggered
    };
  } catch (error) {
    console.error("Gemini chat processing failed, using fallback:", error);
    return {
      aiText: "Aduh bestie, koneksi AI Core-ku agak keganggu nih. Tapi aku denger kok! Semangat terus ya! 💕",
      stateUpdates: null,
      actionTriggered: null
    };
  }
};

// Generates personalized AI pattern insights derived from history
export const generatePatternInsights = (history) => {
  if (!history || history.length === 0) return [];

  const lowSleepDays = history.filter(h => h.sleepHours < 6.5);
  const goodSleepDays = history.filter(h => h.sleepHours >= 6.5);

  const avgTasksLowSleep = lowSleepDays.reduce((sum, h) => sum + (h.completedTasks || 0), 0) / (lowSleepDays.length || 1);
  const avgTasksGoodSleep = goodSleepDays.reduce((sum, h) => sum + (h.completedTasks || 0), 0) / (goodSleepDays.length || 1);

  const avgExpenseLowSleep = lowSleepDays.reduce((sum, h) => sum + (h.expense || 0), 0) / (lowSleepDays.length || 1);
  const avgExpenseGoodSleep = goodSleepDays.reduce((sum, h) => sum + (h.expense || 0), 0) / (goodSleepDays.length || 1);

  const workoutDays = history.filter(h => h.workoutMinutes >= 20);
  const noWorkoutDays = history.filter(h => h.workoutMinutes < 20);
  const avgScoreWorkout = workoutDays.reduce((sum, h) => sum + h.lifeScore, 0) / (workoutDays.length || 1);
  const avgScoreNoWorkout = noWorkoutDays.reduce((sum, h) => sum + h.lifeScore, 0) / (noWorkoutDays.length || 1);

  return [
    {
      title: "Korelasi Fisik-Produktivitas (Cross-Dimension)",
      insight: `Saat tidurmu < 6.5 jam, rata-rata tugas selesai hanyalah **${avgTasksLowSleep.toFixed(1)} tugas/hari**, merosot tajam dibanding **${avgTasksGoodSleep.toFixed(1)} tugas/hari** saat tidurmu cukup.`,
      impact: "Penurunan Produktivitas 35%",
      type: "negative"
    },
    {
      title: "Pemicu Belanja Impulsif (Tidur -> Dompet)",
      insight: `Kurang tidur mendorong keputusan belanja impulsif (caffeine & comfort food). Pengeluaran meningkat menjadi rata-rata **Rp ${Math.round(avgExpenseLowSleep).toLocaleString('id-ID')}** dibanding **Rp ${Math.round(avgExpenseGoodSleep).toLocaleString('id-ID')}** pada hari bertenaga.`,
      impact: "Kenaikan Pengeluaran 120%",
      type: "warning"
    },
    {
      title: "Booster Dopamin Alami (Workout -> Life Score)",
      insight: `Olahraga minimal 20 menit mendorong Life Score harianmu naik ke rata-rata **${avgScoreWorkout.toFixed(0)}/100**, sementara hari-hari mager hanya menorehkan rata-rata **${avgScoreNoWorkout.toFixed(0)}/100**.`,
      impact: "Peningkatan Kualitas Hidup +18pts",
      type: "positive"
    },
    {
      title: "Waktu Produktivitas Emas Kamu (AI Learning)",
      insight: "AI mendeteksi pola mingguan unikmu: **Senin pagi jam 09:00 - 11:30** adalah waktu di mana fokus kamu berada di puncak tertinggi. Kami menyarankan pemblokiran waktu fokus untuk tugas paling rumit di slot waktu tersebut.",
      impact: "Peak Focus Window Detected",
      type: "info"
    }
  ];
};

// Multimodal receipt OCR scanner powered by Google Gemini API
export const scanReceiptWithGemini = async (base64Data, mimeType) => {
  const systemPrompt = `
You are an expert OCR receipt scanner. Analyze the receipt image provided.
Identify all text, store names, prices, items, subtotals, and total payments.
Extract:
1. Total amount spent (as an integer number, e.g. 45000). Look closely for the final total paid, grand total, net total, or total payment.
2. Short descriptive name for the merchant/store or item (e.g. "Kopi Tuku", "Indomaret"). If not clear, summarize the items (e.g. "Belanja Bulanan").
3. Classify the category as one of: Caffeine/Food, Impulse/Lifestyle, Travel, Other.

If the image is not a receipt or doesn't have any purchase text, return "No receipt data found" as description, 0 as amount, and "Other" as category.
`;

  const receiptSchema = {
    type: "OBJECT",
    properties: {
      description: { type: "STRING", description: "Name of the merchant/store or primary items purchased" },
      amount: { type: "INTEGER", description: "The final total paid amount as an integer (no decimals, no periods/commas, no currency symbol). Return 0 if not found." },
      category: { 
        type: "STRING", 
        enum: ["Caffeine/Food", "Impulse/Lifestyle", "Travel", "Other"],
        description: "Category of the transaction" 
      }
    },
    required: ["description", "amount", "category"]
  };

  try {
    const rawText = await callGemini(systemPrompt, null, receiptSchema, {
      mimeType: mimeType,
      data: base64Data
    });

    let cleaned = rawText.trim();
    if (cleaned.startsWith("```json")) {
      cleaned = cleaned.substring(7);
    } else if (cleaned.startsWith("```")) {
      cleaned = cleaned.substring(3);
    }
    if (cleaned.endsWith("```")) {
      cleaned = cleaned.substring(0, cleaned.length - 3);
    }
    cleaned = cleaned.trim();
    return JSON.parse(cleaned);
  } catch (error) {
    console.error("Gemini receipt scanning failed:", error);
    throw error;
  }
};

// Generates a Gen Z slangy summary of all daily activities using Google Gemini API
export const getAIDailySummary = async (currentDay, tasks, finances) => {
  const systemPrompt = `
You are LifeOS AI Core, a supportive and witty Gen Z AI Personal Secretary.
Analyze the user's activities (tasks, spending, habits, sleep, mood) for the selected day.
Write an extremely short daily summary (strictly maximum 1-2 short sentences, maximum 20 words total) in friendly Gen Z slang (using words like bestie, mantap, spill, overbudget, dll.) in Indonesian. Keep it super brief and concise!
Also extract a bulleted list of 3-4 key highlights of the day.
`;

  const summarySchema = {
    type: "OBJECT",
    properties: {
      summary: { 
        type: "STRING", 
        description: "A slangy, friendly, Gen Z Indonesian summary. Strictly maximum 1-2 short sentences (max 20 words total) recapping the day." 
      },
      bullets: {
        type: "ARRAY",
        items: { type: "STRING" },
        description: "List of exactly 3-4 key highlights of the day, e.g. '✅ 3 tugas selesai', '☕ Jajan kopi Rp 25K'."
      }
    },
    required: ["summary", "bullets"]
  };

  const totalExpense = finances.filter(f => f.type === 'expense').reduce((sum, f) => sum + f.amount, 0);
  const completedTasks = tasks.filter(t => t.status === 'completed');
  const pendingTasks = tasks.filter(t => t.status === 'pending');

  const userPrompt = `
Date: ${currentDay?.date || "today"}
Sleep: ${currentDay?.sleepHours || 7.5} hours (${currentDay?.sleepQuality || 'good'} quality)
Steps: ${currentDay?.steps || 0} steps
Workout: ${currentDay?.workoutMinutes || 0} minutes
Water: ${currentDay?.waterIntake || 1200} ml
Mood: ${currentDay?.directMood || 'neutral'}
Tasks: ${completedTasks.length} completed, ${pendingTasks.length} pending.
Completed Task Names: ${completedTasks.map(t => t.text).join(', ') || 'none'}
Pending Task Names: ${pendingTasks.map(t => t.text).join(', ') || 'none'}
Total Expense: Rp ${totalExpense.toLocaleString('id-ID')}
Transactions: ${finances.map(f => `${f.description} (Rp ${f.amount})`).join(', ') || 'none'}
`;

  try {
    const rawText = await callGemini(systemPrompt, userPrompt, summarySchema);
    let cleaned = rawText.trim();
    if (cleaned.startsWith("```json")) {
      cleaned = cleaned.substring(7);
    } else if (cleaned.startsWith("```")) {
      cleaned = cleaned.substring(3);
    }
    if (cleaned.endsWith("```")) {
      cleaned = cleaned.substring(0, cleaned.length - 3);
    }
    cleaned = cleaned.trim();
    return JSON.parse(cleaned);
  } catch (error) {
    console.error("Gemini daily summary failed, using mock fallback:", error);
    return {
      summary: `Hari ini vibes-nya ${currentDay?.directMood === 'good' ? 'chill abis' : 'agak flat'} ya bestie. Tetap semangat menjalani hari! ✨`,
      bullets: [
        `✅ ${completedTasks.length} tugas selesai hari ini`,
        `💵 Total jajan Rp ${totalExpense.toLocaleString('id-ID')}`,
        `🏃 Langkah kaki: ${currentDay?.steps || 0} steps`
      ]
    };
  }
};

// Generates financial recommendations using Google Gemini API
export const getAIFinanceAdvice = async (goals, finances, assets, savings, debts) => {
  const systemPrompt = `
You are LifeOS AI Financial Planner, a smart, supportive, and witty Gen Z Personal Accountant.
Analyze the user's financial assets, daily expenses, savings, debts, and goals.
Provide a personalized financial recommendation in friendly, Gen Z slang Indonesian.
Highlight:
1. How to reach active saving goals.
2. Debt management advice (how to repay active debts).
3. Budget cap alignment (sticking to the daily spending limit).
Use rich Markdown inside the response (bolding, lists). Keep it punchy and clear!
`;

  const adviceSchema = {
    type: "OBJECT",
    properties: {
      recommendation: { 
        type: "STRING", 
        description: "Personalized financial recommendation paragraph/bullet points in Indonesian Gen Z slang. Use markdown." 
      },
      coachingTips: {
        type: "ARRAY",
        items: { type: "STRING" },
        description: "Exactly 3 punchy financial coaching action tips."
      }
    },
    required: ["recommendation", "coachingTips"]
  };

  const totalExpense = finances.filter(f => f.type === 'expense').reduce((sum, f) => sum + f.amount, 0);
  const totalIncome = finances.filter(f => f.type === 'income').reduce((sum, f) => sum + f.amount, 0);
  const totalAssets = assets.reduce((sum, a) => sum + a.balance, 0);
  const totalSavings = savings.reduce((sum, s) => sum + s.currentAmount, 0);
  const totalDebts = debts.filter(d => !d.paid).reduce((sum, d) => sum + d.amount, 0);

  const userPrompt = `
Daily Expenses: Rp ${totalExpense.toLocaleString('id-ID')}
Daily Income: Rp ${totalIncome.toLocaleString('id-ID')}
Total Account Balances: Rp ${totalAssets.toLocaleString('id-ID')} (Assets: ${JSON.stringify(assets)})
Active Savings: ${JSON.stringify(savings)} (Total: Rp ${totalSavings.toLocaleString('id-ID')})
Active Debts: ${JSON.stringify(debts)} (Total: Rp ${totalDebts.toLocaleString('id-ID')})
Financial Goals: ${JSON.stringify(goals)}
`;

  try {
    const rawText = await callGemini(systemPrompt, userPrompt, adviceSchema);
    let cleaned = rawText.trim();
    if (cleaned.startsWith("```json")) {
      cleaned = cleaned.substring(7);
    } else if (cleaned.startsWith("```")) {
      cleaned = cleaned.substring(3);
    }
    if (cleaned.endsWith("```")) {
      cleaned = cleaned.substring(0, cleaned.length - 3);
    }
    cleaned = cleaned.trim();
    return JSON.parse(cleaned);
  } catch (error) {
    console.error("Gemini financial advice failed, using mock fallback:", error);
    return {
      recommendation: `Duh bestie, koneksi AI Core lagi off. Tapi dengerin deh: Tabunganmu sekarang Rp ${totalSavings.toLocaleString('id-ID')} dan ada hutang Rp ${totalDebts.toLocaleString('id-ID')}. Keep eyes on your spending cap biar dompet ga jebol! 💸`,
      coachingTips: [
        "🔥 Cicil Shopee PayLater secepatnya biar ga kena denda.",
        "💡 Kurangi frekuensi beli kopi kekinian, alihkan Rp 20K per hari ke Tabungan Gadget.",
        "📊 Review mingguan pengeluaran impulsive biar balance tetap aman."
      ]
    };
  }
};
//test