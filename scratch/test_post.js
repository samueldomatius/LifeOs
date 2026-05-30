async function test() {
  const userId = 'user_pd2gbuc4m9';
  const payload = {
    tasks: [{ id: '1', text: 'Test task from script', status: 'pending' }],
    finances: [],
    currentDay: {},
    assets: [],
    savings: [],
    debts: [],
    history: [],
    chatHistory: [],
    userProfile: { name: 'Samuel Domatius' }
  };

  try {
    const res = await fetch('http://localhost:5000/api/userdata/' + userId, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    console.log("Status:", res.status);
    const data = await res.json();
    console.log("Response:", data);
  } catch (err) {
    console.error("Error:", err);
  }
}

test();
