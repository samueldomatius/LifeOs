import React, { useState, useEffect, useRef } from 'react';
import { 
  Compass, 
  CheckSquare, 
  Plus, 
  DollarSign, 
  Activity, 
  TrendingUp, 
  Moon, 
  Sun,
  X,
  Clock,
  ArrowDownRight,
  Sparkles,
  CreditCard,
  Target,
  Droplet,
  Bell,
  Video
} from 'lucide-react';

import Header from './components/Header';
import Dashboard from './components/Dashboard';
import CalendarWidget from './components/CalendarWidget';
import TasksManager from './components/TasksManager';
import FinanceManager from './components/FinanceManager';
import HabitsManager from './components/HabitsManager';
import InsightsManager from './components/InsightsManager';
import AiChatCompanion from './components/AiChatCompanion';
import AssetsManager from './components/AssetsManager';
import GoalsManager from './components/GoalsManager';
import ProfileManager from './components/ProfileManager';
import { startFocusSound, stopFocusSound } from './utils/focusSynth';

import { 
  calculateLifeScore, 
  getAIExplanation, 
  processUserChat, 
  generatePatternInsights, 
  getSeededHistory,
  getAIDailySummary,
  getAIFinanceAdvice
} from './utils/aiEngine';

// Default tasks mapped to March 2026 dates (matching calendar)
const INITIAL_TASKS = [
  { id: 't1', text: '🔥 Pitch Pitch Deck LifeOS (Tugas Berat)', priority: 'high', tag: 'Productivity', status: 'pending', snoozeCount: 0, dueDate: '2026-03-27', time: '09:30', link: 'https://meet.google.com/abc-defg-hij' },
  { id: 't2', text: '🏃 Jogging Sore & Workout 45 menit', priority: 'medium', tag: 'Health', status: 'pending', snoozeCount: 0, dueDate: '2026-03-27', time: '16:00', link: '' },
  { id: 't3', text: '💵 Catat Tagihan ShopeePayLater', priority: 'low', tag: 'Finance', status: 'pending', snoozeCount: 0, dueDate: '2026-03-27', time: '20:00', link: 'https://shopee.co.id' },
  { id: 't4', text: '📚 Membaca Paper AI Lintas Dimensi', priority: 'medium', tag: 'Growth', status: 'completed', snoozeCount: 0, dueDate: '2026-03-26', time: '14:00', link: 'https://arxiv.org' },
  // March 16 (Poor sleep mock tasks)
  { id: 't5', text: '🔥 Selesaikan Desain Pitch deck (Snoozed)', priority: 'high', tag: 'Productivity', status: 'snoozed', snoozeCount: 4, dueDate: '2026-03-16', time: '10:00', link: '' },
  { id: 't6', text: '🏃 Jogging Kardio 30 menit (Batal)', priority: 'medium', tag: 'Health', status: 'snoozed', snoozeCount: 3, dueDate: '2026-03-16', time: '17:00', link: '' },
  // March 23 (Peak day mock tasks)
  { id: 't7', text: '🔥 Final Coding React PWA', priority: 'high', tag: 'Productivity', status: 'completed', snoozeCount: 0, dueDate: '2026-03-23', time: '09:00', link: 'http://localhost:5173' },
  { id: 't8', text: '💪 Angkat Beban 45 Menit di Gym', priority: 'medium', tag: 'Health', status: 'completed', snoozeCount: 0, dueDate: '2026-03-23', time: '16:30', link: '' },
  { id: 't9', text: '💵 Setor Pemasukan Freelance', priority: 'medium', tag: 'Finance', status: 'completed', snoozeCount: 0, dueDate: '2026-03-23', time: '11:00', link: '' }
];

// Preloaded finances mapped to dates
const INITIAL_FINANCES = [
  { id: 'f1', type: 'expense', amount: 25000, category: 'Caffeine/Food', description: 'Es Kopi Tuku', timestamp: '14:20', date: '2026-03-27' },
  { id: 'f2', type: 'expense', amount: 15000, category: 'Caffeine/Food', description: 'Rujak Buah Segar', timestamp: '11:00', date: '2026-03-27' },
  { id: 'f3', type: 'income', amount: 500000, category: 'Freelance', description: 'Fee Review Desain UI', timestamp: '09:00', date: '2026-03-27' },
  { id: 'f4', type: 'expense', amount: 350000, category: 'Impulse/Lifestyle', description: 'Caffeine Rush & Fast Food Comfort', timestamp: '15:20', date: '2026-03-16' }
];

// Base initial fallback context parameters
const INITIAL_CURRENT_DAY = {
  sleepHours: 8.2,
  sleepQuality: 'good',
  steps: 6400,
  workoutMinutes: 45,
  waterIntake: 2200,
  directMood: 'good',
  date: '2026-03-27'
};

const formatMarkdownToHtml = (text) => {
  if (!text) return '';
  
  // Normalize double-escaped \n and real newlines
  let processed = text.replace(/\\n/g, '\n');
  
  // Convert headers (e.g. ### Header)
  processed = processed.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
  processed = processed.replace(/^## (.*?)$/gm, '<h2>$1</h2>');
  processed = processed.replace(/^# (.*?)$/gm, '<h1>$1</h1>');
  
  // Convert bold **text**
  processed = processed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  // Convert italic *text*
  processed = processed.replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  // Convert list bullets
  let lines = processed.split('\n');
  let inList = false;
  let htmlLines = lines.map(line => {
    const trimmed = line.trim();
    if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
      const content = trimmed.substring(2);
      let prefix = '';
      if (!inList) {
        inList = true;
        prefix = '<ul style="margin-left: 1.2rem; margin-top: 0.4rem; margin-bottom: 0.4rem; list-style-type: disc;">';
      }
      return `${prefix}<li style="margin-bottom: 0.25rem; font-size: 0.8rem; color: var(--text-secondary);">${content}</li>`;
    } else {
      let prefix = '';
      if (inList) {
        inList = false;
        prefix = '</ul>';
      }
      return prefix + (trimmed ? `<p style="margin-bottom: 0.5rem; font-size: 0.8rem; line-height: 1.45; color: var(--text-secondary);">${trimmed}</p>` : '');
    }
  });
  
  if (inList) {
    htmlLines.push('</ul>');
  }
  
  return htmlLines.join('');
};

export default function App() {
  // --- State Stores ---
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem('lifeos_theme');
      return saved ? saved : 'light-theme';
    } catch(e) {
      return 'light-theme';
    }
  });

  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('lifeos_history');
      if (saved && saved !== 'undefined') {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const valid = parsed.filter(item => item && typeof item === 'object' && item.date && item.sleepHours !== undefined);
          if (valid.length > 0) return valid;
        }
      }
    } catch(e) {}
    
    const seeded = getSeededHistory();
    return seeded.map((s, idx) => {
      const dayNum = 14 + idx;
      return { ...s, date: `2026-03-${dayNum.toString().padStart(2, '0')}` };
    });
  });

  const [assets, setAssets] = useState(() => {
    try {
      const saved = localStorage.getItem('lifeos_assets');
      if (saved && saved !== 'undefined') {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch(e) {}
    return [
      { id: 'gopay', name: 'GoPay', balance: 150000 },
      { id: 'dana', name: 'Dana Wallet', balance: 75000 },
      { id: 'bca', name: 'Bank BCA', balance: 1200000 },
      { id: 'cash', name: 'Uang Tunai (Cash)', balance: 50000 }
    ];
  });

  const [goals, setGoals] = useState(() => {
    try {
      const saved = localStorage.getItem('lifeos_goals');
      if (saved && saved !== 'undefined') {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch(e) {}
    return [
      { id: 'goal_spend', name: 'Limit Belanja Harian', type: 'spend_cap', targetValue: 150000 },
      { id: 'goal_steps', name: 'Target Langkah Kaki', type: 'steps', targetValue: 8000 },
      { id: 'goal_tasks', name: 'Selesaikan Tugas Harian', type: 'tasks', targetValue: 3 }
    ];
  });

  const [savings, setSavings] = useState(() => {
    try {
      const saved = localStorage.getItem('lifeos_savings');
      if (saved && saved !== 'undefined') return JSON.parse(saved);
    } catch(e) {}
    return [
      { id: 's1', name: 'Tabungan Gadget Baru', currentAmount: 1200000, targetAmount: 5000000 },
      { id: 's2', name: 'Dana Darurat', currentAmount: 3000000, targetAmount: 10000000 }
    ];
  });

  const [debts, setDebts] = useState(() => {
    try {
      const saved = localStorage.getItem('lifeos_debts');
      if (saved && saved !== 'undefined') return JSON.parse(saved);
    } catch(e) {}
    return [
      { id: 'd1', name: 'Shopee PayLater', amount: 350000, dueDate: '2026-03-31', paid: false },
      { id: 'd2', name: 'Pinjam Teman (Rian)', amount: 150000, dueDate: '2026-04-10', paid: false }
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem('lifeos_savings', JSON.stringify(savings));
    } catch(e){}
  }, [savings]);

  useEffect(() => {
    try {
      localStorage.setItem('lifeos_debts', JSON.stringify(debts));
    } catch(e){}
  }, [debts]);

  const [userProfile, setUserProfile] = useState(() => {
    try {
      const saved = localStorage.getItem('lifeos_user_profile');
      if (saved && saved !== 'undefined') return JSON.parse(saved);
    } catch(e) {}
    return {
      name: 'Anya Bestie',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150&h=150',
      bio: 'Living my best life in 2026 💅✨'
    };
  });

  useEffect(() => {
    try {
      localStorage.setItem('lifeos_user_profile', JSON.stringify(userProfile));
    } catch(e){}
  }, [userProfile]);

  const [focusTask, setFocusTask] = useState(null);
  const [txnAssetId, setTxnAssetId] = useState('cash');

  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  });

  const [selectedDayIndex, setSelectedDayIndex] = useState(null);

  const [currentDay, setCurrentDay] = useState(() => {
    try {
      const saved = localStorage.getItem('lifeos_current_day');
      if (saved && saved !== 'undefined') {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && parsed.sleepHours !== undefined) return parsed;
      }
    } catch(e) {}
    return INITIAL_CURRENT_DAY;
  });

  const [tasks, setTasks] = useState(() => {
    try {
      const saved = localStorage.getItem('lifeos_tasks');
      if (saved && saved !== 'undefined') {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const valid = parsed.filter(t => t && typeof t === 'object' && t.id && t.text && t.status);
          if (valid.length > 0) return valid;
        }
      }
    } catch(e) {}
    return INITIAL_TASKS;
  });

  const [finances, setFinances] = useState(() => {
    try {
      const saved = localStorage.getItem('lifeos_finances');
      if (saved && saved !== 'undefined') {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const valid = parsed.filter(f => f && typeof f === 'object' && f.id && f.amount !== undefined);
          if (valid.length > 0) return valid;
        }
      }
    } catch(e) {}
    return INITIAL_FINANCES;
  });

  const [chatHistory, setChatHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('lifeos_chat_history');
      if (saved && saved !== 'undefined') {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const valid = parsed.filter(c => c && typeof c === 'object' && c.sender && c.text);
          if (valid.length > 0) return valid;
        }
      }
    } catch(e) {}
    return [
      {
        id: 'msg_welcome',
        sender: 'ai',
        text: 'Halo! Aku **LifeOS AI Core**, sekretaris pribadi berbasis AI-mu. 🌌\n\nAku mendeteksi tidurmu semalam cukup baik (**8.2 jam, Kualitas: Baik**). Kondisi energimu stabil! Prioritas tugas hari ini aman.\n\nAda yang mau kamu ceritakan tentang mood atau rencana jajanmu hari ini? Ketik saja, biar aku log dan selaraskan jadwalmu otomatis!',
        timestamp: '15:55'
      }
    ];
  });

  // --- UI Screen View Controller ---
  const [activeScreen, setActiveScreen] = useState('dashboard');
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [showAiDiagnosisModal, setShowAiDiagnosisModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);

  // Focus Timer States
  const [timerTime, setTimerTime] = useState(1500); 
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerType, setTimerType] = useState('focus'); 
  const [ambientSound, setAmbientSound] = useState('rain'); 

  // Input states
  const [chatInput, setChatInput] = useState('');
  const [taskText, setTaskText] = useState('');
  const [taskPriority, setTaskPriority] = useState('medium');
  const [taskTag, setTaskTag] = useState('Productivity');
  const [taskTime, setTaskTime] = useState('');
  const [taskLink, setTaskLink] = useState('');
  const [isQuotaExceeded, setIsQuotaExceeded] = useState(false);
  const [currentTimeState, setCurrentTimeState] = useState(new Date());

  useEffect(() => {
    const clockTimer = setInterval(() => {
      setCurrentTimeState(new Date());
    }, 30000);
    return () => clearInterval(clockTimer);
  }, []);
  const [dailySummary, setDailySummary] = useState({
    summary: 'AI sedang menganalisis kegiatan hari ini... 🧠',
    bullets: ['Mengevaluasi agenda...']
  });

  const [txnDesc, setTxnDesc] = useState('');
  const [txnAmount, setTxnAmount] = useState('');
  const [txnType, setTxnType] = useState('expense');
  const [txnCategory, setTxnCategory] = useState('Caffeine/Food');

  const chatBottomRef = useRef(null);
  const timerIntervalRef = useRef(null);

  // --- Calculations derived from selections ---
  const filteredTasks = tasks.filter(t => t.dueDate === selectedDate);
  const filteredFinances = finances.filter(f => f.date === selectedDate);

  const lifeScoreObj = calculateLifeScore(currentDay, filteredTasks, filteredFinances);
  const { finalScore, breakdown } = lifeScoreObj;

  const [aiExplanation, setAiExplanation] = useState({
    explanation: 'AI Core sedang memproses LQS hari ini... 🧠',
    advice: ['Mengevaluasi kondisi harian...']
  });

  // --- Sync to LocalStorage ---
  useEffect(() => {
    try {
      localStorage.setItem('lifeos_theme', theme);
    } catch(e){}
  }, [theme]);

  useEffect(() => {
    try {
      localStorage.setItem('lifeos_tasks', JSON.stringify(tasks));
    } catch(e){}
  }, [tasks]);

  useEffect(() => {
    try {
      localStorage.setItem('lifeos_finances', JSON.stringify(finances));
    } catch(e){}
  }, [finances]);

  useEffect(() => {
    try {
      localStorage.setItem('lifeos_current_day', JSON.stringify(currentDay));
    } catch(e){}
  }, [currentDay]);

  useEffect(() => {
    try {
      localStorage.setItem('lifeos_chat_history', JSON.stringify(chatHistory));
    } catch(e){}
  }, [chatHistory]);

  useEffect(() => {
    try {
      localStorage.setItem('lifeos_history', JSON.stringify(history));
    } catch(e){}
  }, [history]);

  useEffect(() => {
    try {
      localStorage.setItem('lifeos_assets', JSON.stringify(assets));
    } catch(e){}
  }, [assets]);

  useEffect(() => {
    try {
      localStorage.setItem('lifeos_goals', JSON.stringify(goals));
    } catch(e){}
  }, [goals]);

  // Audio synthesis trigger based on focus timer state
  useEffect(() => {
    if (timerRunning && ambientSound && ambientSound !== 'silent') {
      startFocusSound(ambientSound);
    } else {
      stopFocusSound();
    }
    return () => {
      stopFocusSound();
    };
  }, [timerRunning, ambientSound]);

  // Dynamically initialize selectedDate in history if not present
  useEffect(() => {
    let existingIndex = history.findIndex(h => h.date === selectedDate);
    if (existingIndex === -1) {
      const newDayObj = {
        date: selectedDate,
        sleepHours: 7.5,
        sleepQuality: 'good',
        steps: 5000,
        workoutMinutes: 0,
        waterIntake: 1200,
        directMood: 'neutral',
        completedTasks: 0,
        snoozedTasks: 0,
        expense: 0,
        income: 0,
        lifeScore: 70
      };
      const updatedHistory = [...history, newDayObj];
      setHistory(updatedHistory);
      setSelectedDayIndex(updatedHistory.length - 1);
    } else {
      setSelectedDayIndex(existingIndex);
    }
  }, [selectedDate]);

  // Dynamic AI daily summary generator
  useEffect(() => {
    let active = true;
    const fetchSummary = async () => {
      try {
        const result = await getAIDailySummary(currentDay, filteredTasks, filteredFinances);
        if (active) {
          setDailySummary(result);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchSummary();
    return () => { active = false; };
  }, [selectedDate]);

  useEffect(() => {
    if (selectedDayIndex !== null && selectedDayIndex >= 0 && selectedDayIndex < history.length) {
      const todayExpense = filteredFinances
        .filter(f => f.type === 'expense')
        .reduce((sum, f) => sum + f.amount, 0);
      const todayIncome = filteredFinances
        .filter(f => f.type === 'income')
        .reduce((sum, f) => sum + f.amount, 0);
      const completed = filteredTasks.filter(t => t.status === 'completed').length;
      const snoozed = filteredTasks.filter(t => t.status === 'snoozed').length;

      const currentHist = history[selectedDayIndex];
      const hasChanged = 
        currentHist.sleepHours !== currentDay.sleepHours ||
        currentHist.sleepQuality !== currentDay.sleepQuality ||
        currentHist.steps !== currentDay.steps ||
        currentHist.workoutMinutes !== currentDay.workoutMinutes ||
        currentHist.waterIntake !== currentDay.waterIntake ||
        currentHist.directMood !== currentDay.directMood ||
        currentHist.completedTasks !== completed ||
        currentHist.snoozedTasks !== snoozed ||
        currentHist.expense !== todayExpense ||
        currentHist.income !== todayIncome ||
        currentHist.lifeScore !== finalScore;

      if (hasChanged) {
        setHistory(prev => prev.map((item, idx) => {
          if (idx === selectedDayIndex) {
            return {
              ...item,
              sleepHours: currentDay.sleepHours,
              sleepQuality: currentDay.sleepQuality,
              steps: currentDay.steps,
              workoutMinutes: currentDay.workoutMinutes,
              waterIntake: currentDay.waterIntake,
              directMood: currentDay.directMood,
              completedTasks: completed,
              snoozedTasks: snoozed,
              expense: todayExpense,
              income: todayIncome,
              lifeScore: finalScore
            };
          }
          return item;
        }));
      }
    }
  }, [currentDay, tasks, finances, finalScore, selectedDayIndex]);

  useEffect(() => {
    if (timerRunning) {
      timerIntervalRef.current = setInterval(() => {
        setTimerTime(prev => {
          if (prev <= 1) {
            setTimerRunning(false);
            clearInterval(timerIntervalRef.current);
            alert("⏰ Waktu Fokus Selesai! Saatnya istirahat sejenak, bestie.");
            return 1500;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [timerRunning]);

  useEffect(() => {
    let active = true;
    const fetchExplanation = async () => {
      try {
        const result = await getAIExplanation(finalScore, breakdown, currentDay, filteredTasks, filteredFinances);
        if (active) {
          setAiExplanation(result);
        }
      } catch (e) {
        console.error(e);
        if (e.toString().includes('429') || e.toString().includes('Quota') || e.toString().includes('RESOURCE_EXHAUSTED')) {
          setIsQuotaExceeded(true);
        }
      }
    };
    fetchExplanation();
    return () => { active = false; };
  }, [selectedDate]);
  
  const insightsList = generatePatternInsights(history);

  // Gamified streak calculations
  const isStreakActive = filteredTasks.length > 0 && filteredTasks.every(t => t.status === 'completed');
  const getStreakCount = () => {
    let streak = 0;
    let currentDateObj = new Date(selectedDate);
    for (let i = 0; i < 30; i++) {
      const year = currentDateObj.getFullYear();
      const month = (currentDateObj.getMonth() + 1).toString().padStart(2, '0');
      const day = currentDateObj.getDate().toString().padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      const dayTasks = tasks.filter(t => t.dueDate === dateStr);
      if (dayTasks.length > 0) {
        const allCompleted = dayTasks.every(t => t.status === 'completed');
        if (allCompleted) {
          streak++;
        } else {
          break; // streak broke
        }
      } else {
        const histDay = history.find(h => h.date === dateStr);
        if (histDay) {
          const completedCount = histDay.completedTasks || 0;
          const snoozedCount = histDay.snoozedTasks || 0;
          if (completedCount > 0 && snoozedCount === 0) {
            streak++;
          } else if (completedCount > 0 || snoozedCount > 0) {
            break; // streak broke
          }
        }
      }
      currentDateObj.setDate(currentDateObj.getDate() - 1);
    }
    return streak;
  };
  const streakCount = getStreakCount();

  // --- Calendar Day Navigator ---
  const handleSelectCalendarDay = (isSeededRange, index, dayNum, dateStr) => {
    setSelectedDate(dateStr);

    let existingIndex = history.findIndex(h => h.date === dateStr);
    let updatedHistory = [...history];

    if (existingIndex === -1) {
      const newDayObj = {
        date: dateStr,
        sleepHours: 7.5,
        sleepQuality: 'good',
        steps: 5000,
        workoutMinutes: 0,
        waterIntake: 1200,
        directMood: 'neutral',
        completedTasks: 0,
        snoozedTasks: 0,
        expense: 0,
        income: 0,
        lifeScore: 70
      };
      updatedHistory.push(newDayObj);
      existingIndex = updatedHistory.length - 1;
      setHistory(updatedHistory);
    }

    setSelectedDayIndex(existingIndex);
    const dayData = updatedHistory[existingIndex];

    setCurrentDay({
      sleepHours: dayData.sleepHours || 7.5,
      sleepQuality: dayData.sleepQuality || 'good',
      steps: dayData.steps || 5000,
      workoutMinutes: dayData.workoutMinutes || 0,
      waterIntake: dayData.waterIntake || 1200,
      directMood: dayData.directMood || 'neutral',
      date: dateStr
    });

    if (isSeededRange && dayData.expense > 0) {
      const hasTxn = finances.some(f => f.date === dateStr);
      if (!hasTxn) {
        const mockTxn = {
          id: `txn_seed_${existingIndex}_${Date.now()}`,
          type: 'expense',
          amount: dayData.expense,
          category: 'Caffeine/Food',
          description: dayData.expense > 150000 ? 'Impulse Shopping Comfort' : 'Es Kopi & Jajanan Sore',
          timestamp: '16:00',
          date: dateStr
        };
        setFinances(prev => [mockTxn, ...prev]);
      }
    }

    if (isSeededRange) {
      setChatHistory(prev => [
        ...prev,
        {
          id: `ai_date_load_${Date.now()}`,
          sender: 'ai',
          text: `📅 **AI memuat data log tanggal ${dayNum} Maret 2026**: \n\nSkor kualitas hidup Anda hari ini adalah **${dayData.lifeScore}/100**.\n\n*Pola Lintas-Dimensi:* ${dayData.sleepHours < 6.2 ? 'Tidur pendek memicu penurunan fokus produktivitas (-30%) & impulsitas jajan.' : 'Istirahat cukup & olahraga meningkatkan momentum fokus Anda!'}`,
          timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  };

  // --- Task Manager CRUD ---
  const handleAddTask = (e) => {
    e.preventDefault();
    if (!taskText.trim()) return;

    const newTask = {
      id: `task_${Date.now()}`,
      text: taskText,
      priority: taskPriority,
      tag: taskTag,
      status: 'pending',
      snoozeCount: 0,
      dueDate: selectedDate,
      time: taskTime || '',
      link: taskLink || ''
    };

    setTasks([...tasks, newTask]);
    setTaskText('');
    setTaskTime('');
    setTaskLink('');
  };

  const toggleTaskStatus = (id) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, status: t.status === 'completed' ? 'pending' : 'completed' } : t));
  };

  const handleDeleteTask = (id) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const handleUpdateTask = (id, updatedFields) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, ...updatedFields } : t));
  };

  const handleSnoozeTask = (id) => {
    setTasks(tasks.map(t => {
      if (t.id === id) {
        const nextSnoozeCount = (t.snoozeCount || 0) + 1;
        if (nextSnoozeCount === 3) {
          setTimeout(() => {
            setAiChatOpen(true);
            setChatHistory(prev => [
              ...prev,
              {
                id: `ai_snooze_guilt_${Date.now()}`,
                sender: 'ai',
                text: `⚠️ **Productivity Guilt Alert!** \n\nKamu sudah tunda **"${t.text}"** 3 kali. \n\nAku mendeteksi burnout mental. Biar enteng, aku menyarankan kita **pecah tugas ini jadi 2 slot kerja kecil realistis** atau tunda total ke besok pagi. Setuju?`,
                timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
                suggestedAction: {
                  type: 'RESOLVE_BURNOUT_SNOOZE',
                  payload: { taskId: t.id, taskText: t.text }
                }
              }
            ]);
          }, 300);
        }
        return { ...t, status: 'snoozed', snoozeCount: nextSnoozeCount };
      }
      return t;
    }));
  };

  // --- Assets Handlers ---
  const handleAddAsset = (name, balance) => {
    const newAsset = {
      id: `asset_${Date.now()}`,
      name,
      balance
    };
    setAssets([...assets, newAsset]);
  };

  const handleUpdateAssetBalance = (id, balance) => {
    setAssets(prev => prev.map(a => a.id === id ? { ...a, balance } : a));
  };

  const handleDeleteAsset = (id) => {
    setAssets(prev => prev.filter(a => a.id !== id));
  };

  // --- Goals Handlers ---
  const handleAddGoal = (name, type, targetValue) => {
    const newGoal = {
      id: `goal_${Date.now()}`,
      name,
      type,
      targetValue
    };
    setGoals([...goals, newGoal]);
  };

  const handleDeleteGoal = (id) => {
    setGoals(prev => prev.filter(g => g.id !== id));
  };

  // --- Finance CRUD ---
  const handleAddTransaction = (e) => {
    e.preventDefault();
    if (!txnDesc.trim() || !txnAmount) return;

    const amountNum = parseFloat(txnAmount);
    if (isNaN(amountNum) || amountNum <= 0) return;

    const newTxn = {
      id: `txn_${Date.now()}`,
      type: txnType,
      amount: amountNum,
      category: txnCategory,
      description: txnDesc,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      date: selectedDate,
      assetId: txnAssetId
    };

    setFinances([newTxn, ...finances]);

    // Update asset balance
    setAssets(prev => prev.map(a => {
      if (a.id === txnAssetId) {
        return {
          ...a,
          balance: txnType === 'income' ? a.balance + amountNum : a.balance - amountNum
        };
      }
      return a;
    }));

    setTxnDesc('');
    setTxnAmount('');
  };

  const handleDeleteTransaction = (id) => {
    const txn = finances.find(f => f.id === id);
    if (!txn) return;
    
    // Revert asset balance
    setAssets(prev => prev.map(a => {
      if (a.id === txn.assetId) {
        return {
          ...a,
          balance: txn.type === 'income' ? a.balance - txn.amount : a.balance + txn.amount
        };
      }
      return a;
    }));
    
    setFinances(finances.filter(f => f.id !== id));
  };

  const handleUpdateTransaction = (id, updatedFields) => {
    const originalTxn = finances.find(f => f.id === id);
    if (!originalTxn) return;
    
    // Let's revert original asset balance impact, then apply new balance impact
    setAssets(prev => prev.map(a => {
      let balance = a.balance;
      
      // Revert old impact if matching assetId
      if (a.id === originalTxn.assetId) {
        balance = originalTxn.type === 'income' ? balance - originalTxn.amount : balance + originalTxn.amount;
      }
      
      // Apply new impact if matching new assetId
      const newAssetId = updatedFields.assetId !== undefined ? updatedFields.assetId : originalTxn.assetId;
      const newType = updatedFields.type !== undefined ? updatedFields.type : originalTxn.type;
      const newAmount = updatedFields.amount !== undefined ? parseFloat(updatedFields.amount) : originalTxn.amount;
      
      if (a.id === newAssetId) {
        balance = newType === 'income' ? balance + newAmount : balance - newAmount;
      }
      
      return { ...a, balance };
    }));
    
    setFinances(finances.map(f => f.id === id ? { ...f, ...updatedFields } : f));
  };

  const handleAddDirectTransaction = (desc, amount, type, category, assetId) => {
    const targetAssetId = assetId || (assets && assets.length > 0 ? assets[0].id : 'cash');
    const newTxn = {
      id: `txn_${Date.now()}`,
      type,
      amount,
      category,
      description: desc,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      date: selectedDate,
      assetId: targetAssetId
    };
    setFinances(prev => [newTxn, ...prev]);

    // Update asset balance
    setAssets(prev => prev.map(a => {
      if (a.id === targetAssetId) {
        return {
          ...a,
          balance: type === 'income' ? a.balance + amount : a.balance - amount
        };
      }
      return a;
    }));
  };

  // --- Accept AI Action ---
  const handleAcceptAIAction = (action) => {
    if (action.type === 'AUTO_RESCHEDULE_TIRED') {
      const { postponeIds, insertTask } = action.payload;
      setTasks(prev => prev.map(t => postponeIds.includes(t.id) ? { ...t, status: 'snoozed', snoozeCount: (t.snoozeCount || 0) + 1 } : t));
      const newRelax = {
        id: `task_${Date.now()}`,
        text: insertTask.text,
        priority: insertTask.priority,
        tag: insertTask.tag,
        status: insertTask.status,
        snoozeCount: 0,
        dueDate: selectedDate
      };
      setTasks(prev => [...prev, newRelax]);
    } else if (action.type === 'RESOLVE_BURNOUT_SNOOZE') {
      const { taskId, taskText } = action.payload;
      setTasks(prev => {
        const filtered = prev.filter(t => t.id !== taskId);
        const sub1 = {
          id: `task_sub1_${Date.now()}`,
          text: `🌱 (Pecahan AI Part 1) Buka & Draft Ringkasan: ${taskText.replace(/🔥|🏃|💵|📚/, '')}`,
          priority: 'low',
          tag: 'Productivity',
          status: 'pending',
          snoozeCount: 0,
          dueDate: selectedDate
        };
        const sub2 = {
          id: `task_sub2_${Date.now()}`,
          text: `🌱 (Pecahan AI Part 2) Kerjakan 1 Bagian Kecil: ${taskText.replace(/🔥|🏃|💵|📚/, '')}`,
          priority: 'medium',
          tag: 'Productivity',
          status: 'pending',
          snoozeCount: 0,
          dueDate: selectedDate
        };
        return [...filtered, sub1, sub2];
      });
    }
    setChatHistory(prev => prev.map(c => c.suggestedAction?.type === action.type ? { ...c, suggestedAction: null } : c));
  };

  // --- Send Chat Message ---
  const handleSendChatMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: chatInput,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    };

    setChatHistory(prev => [...prev, userMsg]);
    const inputMsg = chatInput;
    setChatInput('');

    // Add typing placeholder
    const typingId = `ai_typing_${Date.now()}`;
    setChatHistory(prev => [...prev, {
      id: typingId,
      sender: 'ai',
      text: 'AI Core sedang mengetik... ⚡',
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    }]);

    const currentAppState = { tasks, currentDay, finances, assets, goals, history };

    try {
      const response = await processUserChat(inputMsg, currentAppState);
      const { aiText, stateUpdates, actionTriggered } = response;

      if (stateUpdates && stateUpdates.habits) {
        setCurrentDay(stateUpdates.habits);
      }

      setChatHistory(prev => {
        const filtered = prev.filter(c => c.id !== typingId);
        return [...filtered, {
          id: `ai_${Date.now()}`,
          sender: 'ai',
          text: aiText,
          timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
          suggestedAction: actionTriggered
        }];
      });

      if (actionTriggered && actionTriggered.type === 'ADD_EXPENSE') {
        const { amount, category, description } = actionTriggered.payload;
        const targetAssetId = assets && assets.length > 0 ? assets[0].id : 'cash';
        const newTxn = {
          id: `txn_${Date.now()}`,
          type: 'expense',
          amount,
          category,
          description,
          timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
          date: selectedDate,
          assetId: targetAssetId
        };
        setFinances(prev => [newTxn, ...prev]);
        setAssets(prev => prev.map(a => {
          if (a.id === targetAssetId) {
            return { ...a, balance: a.balance - amount };
          }
          return a;
        }));
      }
    } catch (err) {
      console.error(err);
      if (err.toString().includes('429') || err.toString().includes('Quota') || err.toString().includes('RESOURCE_EXHAUSTED')) {
        setIsQuotaExceeded(true);
      }
      setChatHistory(prev => {
        const filtered = prev.filter(c => c.id !== typingId);
        return [...filtered, {
          id: `ai_error_${Date.now()}`,
          sender: 'ai',
          text: err.toString().includes('429')
            ? 'Aduh bestie, kuota harian Gemini-ku habis nih (Limit 20/hari). Coba ganti API key atau tunggu besok ya! 😢'
            : 'Maaf bestie, AI Core sedang mengalami gangguan koneksi. Coba tanyakan lagi ya! 😢',
          timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
        }];
      });
    }
  };

  // Styling helper variable getters
  const getGlowColor = (score) => {
    if (score >= 80) return 'var(--accent-volt)';
    if (score >= 50) return 'var(--accent-orange)';
    return 'var(--accent-coral)';
  };

  const getGlowClass = (score) => {
    if (score >= 80) return 'var(--accent-volt-glow)';
    if (score >= 50) return 'var(--accent-orange-glow)';
    return 'var(--accent-coral-glow)';
  };

  const formatDateHeader = (dateStr) => {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
      const mIdx = parseInt(parts[1], 10) - 1;
      return `${parseInt(parts[2], 10)} ${months[mIdx] || 'Maret'} ${parts[0]}`;
    }
    return dateStr;
  };

  // Toggle Theme Function
  const toggleTheme = () => {
    setTheme(prev => prev === 'light-theme' ? 'dark-theme' : 'light-theme');
  };

  // Timer controls toggles
  const handleUpdateSpendCap = (newLimit) => {
    setGoals(prev => {
      const hasLimit = prev.some(g => g.type === 'spend_cap');
      if (hasLimit) {
        return prev.map(g => g.type === 'spend_cap' ? { ...g, targetValue: newLimit } : g);
      } else {
        return [...prev, { id: 'goal_spend', name: 'Limit Belanja Harian', type: 'spend_cap', targetValue: newLimit }];
      }
    });
  };

  const toggleTimer = () => setTimerRunning(!timerRunning);
  const resetTimer = () => {
    setTimerRunning(false);
    setTimerTime(1500);
  };

  return (
    <div className={`app-viewport theme-transition ${theme}`}>
      <div className="phone-screen theme-transition">
        
        {/* Navigation Header Component */}
        <Header 
          theme={theme}
          toggleTheme={toggleTheme}
          onOpenDiagnosis={() => setShowAiDiagnosisModal(true)}
          onOpenNotifications={() => setShowNotificationModal(true)}
          streakCount={streakCount}
          isStreakActive={isStreakActive}
          userProfile={userProfile}
          onOpenProfile={() => { setActiveScreen('profile'); setAiChatOpen(false); }}
        />

        {/* Friendly greeting */}
        <section className="welcome-coach-bar" onClick={() => { setActiveScreen('profile'); setAiChatOpen(false); }} style={{ cursor: 'pointer' }}>
          <img 
            src={userProfile.avatar} 
            alt="User" 
            style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent-volt)' }}
          />
          <div className="welcome-text-group">
            <h2 className="welcome-title">Halo, {userProfile.name}! ✨</h2>
            <span className="welcome-subtitle" style={{ fontSize: '0.72rem', color: 'var(--accent-purple)', fontWeight: 600, display: 'block', marginTop: '3px' }}>
              🧠 Kesimpulan AI: {dailySummary?.summary || 'Menganalisis aktivitas hari ini... ⚡'}
            </span>
          </div>
        </section>

        {/* Dynamic Task Time Reminder */}
        {(() => {
          const currentHour = currentTimeState.getHours();
          
          // Filter active tasks today that have a time set
          const todayActiveTasksWithTime = tasks.filter(t => 
            t.dueDate === selectedDate && 
            t.status === 'pending' && 
            t.time
          );

          if (todayActiveTasksWithTime.length === 0) return null;

          // Find tasks that match the current hour
          const currentHourTasks = todayActiveTasksWithTime.filter(t => {
            const [h] = t.time.split(':').map(Number);
            return h === currentHour;
          });

          // Sort other tasks chronologically
          const upcomingTasks = todayActiveTasksWithTime.filter(t => {
            const [h] = t.time.split(':').map(Number);
            return h !== currentHour;
          }).sort((a, b) => a.time.localeCompare(b.time));

          return (
            <section className="dashboard-time-reminder" style={{ margin: '0 1rem 0.5rem 1rem' }}>
              {currentHourTasks.length > 0 ? (
                <div className="glass-panel" style={{
                  border: '1px solid var(--accent-volt-dark)',
                  background: 'linear-gradient(135deg, rgba(187, 238, 0, 0.1), rgba(192, 132, 252, 0.05))',
                  boxShadow: '0 8px 32px rgba(187, 238, 0, 0.15)',
                  padding: '1rem',
                  borderRadius: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.65rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className="live-pulse" style={{ width: '8px', height: '8px', background: 'var(--accent-volt)', borderRadius: '50%', display: 'inline-block' }}></span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--accent-volt-dark)', letterSpacing: '0.5px' }}>
                        TUGAS JAM SEKARANG
                      </span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      Pukul {currentTimeState.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {currentHourTasks.map(t => (
                    <div key={t.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                        <div>
                          <div style={{ fontWeight: 'bold', fontSize: '0.95rem', color: '#fff' }}>{t.text}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={10} /> Terjadwal pukul {t.time} • Prio: <span style={{ color: t.priority === 'high' ? 'var(--accent-coral)' : 'var(--accent-orange)' }}>{t.priority.toUpperCase()}</span>
                          </div>
                        </div>
                        <button 
                          onClick={() => toggleTaskStatus(t.id)}
                          style={{
                            background: 'var(--accent-volt)',
                            color: '#000',
                            border: 'none',
                            padding: '0.35rem 0.75rem',
                            borderRadius: '10px',
                            fontSize: '0.75rem',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                        >
                          Selesai
                        </button>
                      </div>
                      {t.link && (
                        <a 
                          href={t.link} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          style={{
                            background: 'rgba(34, 211, 238, 0.15)',
                            color: 'var(--accent-cyan)',
                            border: '1px solid rgba(34, 211, 238, 0.3)',
                            padding: '0.45rem',
                            borderRadius: '10px',
                            fontSize: '0.75rem',
                            fontWeight: 'bold',
                            textDecoration: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px'
                          }}
                        >
                          <Video size={14} /> Gabung Rapat / Buka Tautan Kerja
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="glass-panel volt-card" style={{
                  padding: '0.9rem 1.1rem',
                  borderRadius: '20px',
                  background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.12), rgba(34, 211, 238, 0.05))',
                  border: '1px solid rgba(139, 92, 246, 0.25)',
                  boxShadow: '0 8px 32px rgba(139, 92, 246, 0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Bell size={12} color="var(--accent-purple)" />
                      <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--accent-purple)', letterSpacing: '0.5px' }}>
                        PENGINGAT TUGAS BERIKUTNYA
                      </span>
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      Mendatang hari ini
                    </span>
                  </div>
                  {upcomingTasks.slice(0, 1).map(t => (
                    <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <span style={{
                          background: 'rgba(192, 132, 252, 0.15)',
                          color: 'var(--accent-purple)',
                          padding: '0.15rem 0.35rem',
                          borderRadius: '6px',
                          fontSize: '0.7rem',
                          fontWeight: 'bold',
                          marginRight: '6px'
                        }}>
                          {t.time}
                        </span>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>
                          {t.text}
                        </span>
                      </div>
                      {t.link && (
                        <a 
                          href={t.link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{
                            fontSize: '0.75rem',
                            color: 'var(--accent-cyan)',
                            textDecoration: 'none',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '2px'
                          }}
                        >
                          Rapat <Video size={10} />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          );
        })()}

        {/* Shortcut Menu Grid */}
        <section className="menu-grid-container">
          <div className="section-label-row">
            <span className="section-title-label">Menu Utama</span>
            <button className="section-subtitle-btn" onClick={() => setActiveScreen('dashboard')}>Dashboard</button>
          </div>
          
          <div className="glass-panel volt-card menu-shortcuts-grid">
            <button className="shortcut-item-btn" onClick={() => setActiveScreen('tasks')}>
              <div className={`shortcut-circle-icon ${activeScreen === 'tasks' ? 'active' : ''}`}><CheckSquare size={20} /></div>
              <span className="shortcut-label-text">Tugas</span>
            </button>
            <button className="shortcut-item-btn" onClick={() => setActiveScreen('finance')}>
              <div className={`shortcut-circle-icon ${activeScreen === 'finance' ? 'active' : ''}`}><DollarSign size={20} /></div>
              <span className="shortcut-label-text">Keuangan</span>
            </button>
            <button className="shortcut-item-btn" onClick={() => setActiveScreen('habits')}>
              <div className={`shortcut-circle-icon ${activeScreen === 'habits' ? 'active' : ''}`}><Activity size={20} /></div>
              <span className="shortcut-label-text">Habits</span>
            </button>
            <button className="shortcut-item-btn" onClick={() => setActiveScreen('insights')}>
              <div className={`shortcut-circle-icon ${activeScreen === 'insights' ? 'active' : ''}`}><TrendingUp size={20} /></div>
              <span className="shortcut-label-text">Laporan</span>
            </button>
            <button className="shortcut-item-btn" onClick={() => setAiChatOpen(true)}>
              <div className="shortcut-circle-icon"><Sparkles size={20} /></div>
              <span className="shortcut-label-text">AI Advisor</span>
            </button>
            <button className="shortcut-item-btn" onClick={() => setActiveScreen('assets')}>
              <div className={`shortcut-circle-icon ${activeScreen === 'assets' ? 'active' : ''}`}><CreditCard size={18} /></div>
              <span className="shortcut-label-text">Aset</span>
            </button>
            <button className="shortcut-item-btn" onClick={() => setActiveScreen('goals')}>
              <div className={`shortcut-circle-icon ${activeScreen === 'goals' ? 'active' : ''}`}><Target size={18} /></div>
              <span className="shortcut-label-text">Goals</span>
            </button>
          </div>
        </section>

        {/* Dashboard index */}
        <Dashboard 
          finalScore={finalScore}
          breakdown={breakdown}
          aiExplanation={aiExplanation}
          getGlowColor={getGlowColor}
          getGlowClass={getGlowClass}
          isQuotaExceeded={isQuotaExceeded}
        />

        {/* Calendar Widget */}
        <CalendarWidget 
          history={history}
          selectedDate={selectedDate}
          tasks={tasks}
          handleSelectCalendarDay={handleSelectCalendarDay}
        />

        {/* Demand Sliders summary */}
        <section className="upcoming-habits-scroll-box">
          <div className="section-label-row">
            <span className="section-title-label" style={{ color: '#fff' }}>Tagihan & Tuntutan Hari Ini</span>
            <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', fontWeight: 'bold' }}>SWIPE HORIZONTAL</span>
          </div>
          <div className="upcoming-horizontal-flex">
            <div className="upcoming-subcard">
              <div className="subcard-title-row"><Moon size={10} color="var(--accent-volt)" /><span>Tidur Semalam</span></div>
              <span className="subcard-primary-label">{currentDay ? currentDay.sleepHours : 7.5} Jam</span>
              <span className="subcard-secondary-label">Kualitas: {currentDay ? currentDay.sleepQuality : 'good'}</span>
            </div>
            <div className="upcoming-subcard">
              <div className="subcard-title-row"><Activity size={10} color="var(--accent-volt)" /><span>Langkah/Latihan</span></div>
              <span className="subcard-primary-label">{currentDay ? currentDay.steps : 5000} Steps</span>
              <span className="subcard-action-value">{currentDay ? currentDay.workoutMinutes : 0} Min Workout</span>
            </div>
            <div className="upcoming-subcard">
              <div className="subcard-title-row"><Droplet size={10} color="var(--accent-volt)" /><span>Hidrasi Air</span></div>
              <span className="subcard-primary-label">{currentDay ? currentDay.waterIntake : 1200} ml</span>
              <span className="subcard-secondary-label">Daily Target</span>
            </div>
          </div>
        </section>

        {/* Selected Date Task List */}
        <section className="recent-activity-ledger">
          <div className="section-label-row">
            <span className="section-title-label">Event Tugas: {formatDateHeader(selectedDate)}</span>
            <button className="section-subtitle-btn" onClick={() => setActiveScreen('tasks')}>Kelola Semua</button>
          </div>
          {filteredTasks.map(t => (
            <div className="recent-row-item" key={t.id} style={{ opacity: t.status === 'completed' ? 0.6 : 1 }}>
              <div className="row-item-left">
                <div 
                  style={{ width: '18px', height: '18px', border: '2px solid var(--text-secondary)', borderRadius: '6px', background: t.status === 'completed' ? 'var(--accent-volt-dark)' : 'none', cursor: 'pointer' }}
                  onClick={() => toggleTaskStatus(t.id)}
                />
                <div className="row-item-text-stack">
                  <span className="row-item-title" style={{ textDecoration: t.status === 'completed' ? 'line-through' : 'none' }}>{t.text}</span>
                  <span className="row-item-meta">{t.tag} • Priority: {t.priority}</span>
                </div>
              </div>
              {t.status !== 'completed' && (
                <button className="shortcut-circle-icon" style={{ width: '28px', height: '28px', background: 'none', border: 'none' }} onClick={() => handleSnoozeTask(t.id)}><Clock size={12} /></button>
              )}
            </div>
          ))}
          {filteredTasks.length === 0 && (
            <p style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              Belum ada event tugas terdaftar hari ini.
            </p>
          )}

          {/* Section Separator for Finances */}
          <div className="section-label-row" style={{ marginTop: '1.5rem', borderTop: '1px dashed var(--card-border)', paddingTop: '1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <span className="section-title-label">💸 Pengeluaran Hari Ini</span>
            <button className="section-subtitle-btn" onClick={() => setActiveScreen('finance')}>Kelola Semua</button>
          </div>

          {/* Expenses */}
          {filteredFinances.map(f => (
            <div className="recent-row-item" key={f.id}>
              <div className="row-item-left">
                <div className="row-item-circle-icon"><ArrowDownRight size={14} color="var(--accent-coral)" /></div>
                <div className="row-item-text-stack">
                  <span className="row-item-title">{f.description}</span>
                  <span className="row-item-meta">{f.category} • {f.timestamp}</span>
                </div>
              </div>
              <span className="row-item-value-badge negative">-Rp {f.amount.toLocaleString('id-ID')}</span>
            </div>
          ))}
        </section>

      </div>

      {/* Floating Capsule Navbar */}
      <nav className="floating-capsule-navbar theme-transition">
        <button className={`capsule-nav-btn ${activeScreen === 'dashboard' ? 'active' : ''}`} onClick={() => { setActiveScreen('dashboard'); setAiChatOpen(false); }}><Compass size={22} /></button>
        <button className={`capsule-nav-btn ${activeScreen === 'tasks' ? 'active' : ''}`} onClick={() => { setActiveScreen('tasks'); setAiChatOpen(false); }}><CheckSquare size={22} /></button>
        <button className="phone-notch-pill-btn" onClick={() => setAiChatOpen(true)}><Plus size={26} /></button>
        <button className={`capsule-nav-btn ${activeScreen === 'finance' ? 'active' : ''}`} onClick={() => { setActiveScreen('finance'); setAiChatOpen(false); }}><DollarSign size={22} /></button>
        <button className={`capsule-nav-btn ${activeScreen === 'habits' ? 'active' : ''}`} onClick={() => { setActiveScreen('habits'); setAiChatOpen(false); }}><Activity size={22} /></button>
      </nav>

      {/* Overlays Panels */}
      {activeScreen === 'tasks' && (
        <TasksManager 
          filteredTasks={filteredTasks}
          selectedDate={selectedDate}
          taskText={taskText}
          setTaskText={setTaskText}
          taskPriority={taskPriority}
          setTaskPriority={setTaskPriority}
          taskTag={taskTag}
          setTaskTag={setTaskTag}
          taskTime={taskTime}
          setTaskTime={setTaskTime}
          taskLink={taskLink}
          setTaskLink={setTaskLink}
          handleAddTask={handleAddTask}
          toggleTaskStatus={toggleTaskStatus}
          handleSnoozeTask={handleSnoozeTask}
          onDeleteTask={handleDeleteTask}
          onUpdateTask={handleUpdateTask}
          timerTime={timerTime}
          timerRunning={timerRunning}
          toggleTimer={toggleTimer}
          resetTimer={resetTimer}
          ambientSound={ambientSound}
          setAmbientSound={setAmbientSound}
          formatDateHeader={formatDateHeader}
          onSelectFocusTask={(t) => {
            setFocusTask(t);
            setTimerTime(1500); // 25 min focus limit
            setTimerRunning(true);
          }}
          focusTask={focusTask}
          dailySummary={dailySummary}
        />
      )}

      {activeScreen === 'finance' && (
        <FinanceManager 
          filteredFinances={filteredFinances}
          selectedDate={selectedDate}
          txnDesc={txnDesc}
          setTxnDesc={setTxnDesc}
          txnAmount={txnAmount}
          setTxnAmount={setTxnAmount}
          txnType={txnType}
          setTxnType={setTxnType}
          txnCategory={txnCategory}
          setTxnCategory={setTxnCategory}
          txnAssetId={txnAssetId}
          setTxnAssetId={setTxnAssetId}
          handleAddTransaction={handleAddTransaction}
          onAddDirectTransaction={handleAddDirectTransaction}
          onDeleteTransaction={handleDeleteTransaction}
          onUpdateTransaction={handleUpdateTransaction}
          history={history}
          formatDateHeader={formatDateHeader}
          assets={assets}
          goals={goals}
          savings={savings}
          setSavings={setSavings}
          debts={debts}
          setDebts={setDebts}
          onUpdateSpendCap={handleUpdateSpendCap}
          finances={finances}
        />
      )}

      {activeScreen === 'assets' && (
        <AssetsManager 
          assets={assets}
          onAddAsset={handleAddAsset}
          onUpdateAssetBalance={handleUpdateAssetBalance}
          onDeleteAsset={handleDeleteAsset}
          finances={finances}
        />
      )}

      {activeScreen === 'goals' && (
        <GoalsManager 
          goals={goals}
          onAddGoal={handleAddGoal}
          onDeleteGoal={handleDeleteGoal}
          currentDay={currentDay}
          filteredTasks={filteredTasks}
          filteredFinances={filteredFinances}
          assets={assets}
        />
      )}

      {activeScreen === 'habits' && (
        <HabitsManager 
          currentDay={currentDay}
          setCurrentDay={setCurrentDay}
          selectedDate={selectedDate}
          formatDateHeader={formatDateHeader}
        />
      )}

      {activeScreen === 'insights' && (
        <InsightsManager insightsList={insightsList} />
      )}

      {activeScreen === 'profile' && (
        <ProfileManager 
          userProfile={userProfile}
          onUpdateProfile={setUserProfile}
          tasks={tasks}
          streakCount={streakCount}
          isStreakActive={isStreakActive}
          selectedDate={selectedDate}
          onUpdateTask={handleUpdateTask}
          onDeleteTask={handleDeleteTask}
        />
      )}

      {/* AI Assessment modal */}
      {showAiDiagnosisModal && (
        <div className="subpanel-overlay">
          <div className="subpanel-header">
            <span className="subpanel-title">🧠 AI Core Assessment</span>
            <button className="circular-utility-btn" onClick={() => setShowAiDiagnosisModal(false)}><X size={16} /></button>
          </div>
          <div className="ai-diagnosis-card">
            <h3>LQS Diagnostics: {finalScore}/100</h3>
            <br />
            <div dangerouslySetInnerHTML={{ __html: formatMarkdownToHtml(aiExplanation.explanation) }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
            <span style={{ fontWeight: 'bold', fontSize: '0.8rem' }}>AI Recommendations:</span>
            {aiExplanation.advice.map((adv, idx) => (
              <div key={idx} style={{ background: 'var(--bg-pill)', borderLeft: '4px solid var(--accent-volt-dark)', padding: '0.6rem 0.85rem', borderRadius: '12px', fontSize: '0.75rem' }}>
                {adv}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notification Modal alert */}
      {showNotificationModal && (
        <div className="subpanel-overlay">
          <div className="subpanel-header">
            <span className="subpanel-title">🔔 Smart Notifications</span>
            <button className="circular-utility-btn" onClick={() => setShowNotificationModal(false)}><X size={16} /></button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {filteredTasks.filter(t => t.status === 'snoozed').length >= 3 && (
              <div className="recent-row-item" style={{ borderLeft: '4px solid var(--accent-coral)' }}>
                <div className="row-item-text-stack">
                  <span style={{ fontWeight: 'bold', fontSize: '0.8rem', color: 'var(--accent-coral)' }}>Burnout Warning</span>
                  <span style={{ fontSize: '0.7rem' }}>Anda telah menunda tugas 3x. Pecah tugas segera!</span>
                </div>
              </div>
            )}
            {filteredFinances.reduce((sum, f) => sum + f.amount, 0) > 150000 && (
              <div className="recent-row-item" style={{ borderLeft: '4px solid var(--accent-coral)' }}>
                <div className="row-item-text-stack">
                  <span style={{ fontWeight: 'bold', fontSize: '0.8rem', color: 'var(--accent-coral)' }}>Budget Overrun</span>
                  <span style={{ fontSize: '0.7rem' }}>Pengeluaran melampaui limit Rp150K.</span>
                </div>
              </div>
            )}
            <div className="recent-row-item" style={{ borderLeft: '4px solid var(--accent-volt-dark)' }}>
              <div className="row-item-text-stack">
                <span style={{ fontWeight: 'bold', fontSize: '0.8rem', color: 'var(--accent-volt-dark)' }}>AI Learning Sync</span>
                <span style={{ fontSize: '0.7rem' }}>Model personal terupdate.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Slide up AI Chat Advisor */}
      <AiChatCompanion 
        aiChatOpen={aiChatOpen}
        setAiChatOpen={setAiChatOpen}
        chatHistory={chatHistory}
        chatInput={chatInput}
        setChatInput={setChatInput}
        handleSendChatMessage={handleSendChatMessage}
        handleAcceptAIAction={handleAcceptAIAction}
        chatBottomRef={chatBottomRef}
        isQuotaExceeded={isQuotaExceeded}
      />

    </div>
  );
}
