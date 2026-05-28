let audioCtx = null;
let rainNode = null;
let lofiInterval = null;
let activeSynthType = null;
let stormInterval = null;

// Helper to create white noise buffer for rain sounds
function createWhiteNoiseBuffer(ctx) {
  const bufferSize = 2 * ctx.sampleRate;
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const output = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    output[i] = Math.random() * 2 - 1;
  }
  return noiseBuffer;
}

// Helper to create pink noise buffer for ocean wave sweep
function createPinkNoiseBuffer(ctx) {
  const bufferSize = 2 * ctx.sampleRate;
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const output = noiseBuffer.getChannelData(0);
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.96900 * b2 + white * 0.1538520;
    b3 = 0.86650 * b3 + white * 0.3104856;
    b4 = 0.55000 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.0168980;
    output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
    output[i] *= 0.11; // estimate volume adjustment
    b6 = white * 0.115926;
  }
  return noiseBuffer;
}

export const startFocusSound = (type) => {
  try {
    // Initialize AudioContext
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    // Resume context if suspended
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    // Stop current sound first
    stopFocusSound();
    
    activeSynthType = type;
    if (type === 'silent' || !type) return;

    if (type === 'rain') {
      // 1. Synthesize Rain
      const noise = audioCtx.createBufferSource();
      noise.buffer = createWhiteNoiseBuffer(audioCtx);
      noise.loop = true;

      // Filter rain to sound muffled/natural
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, audioCtx.currentTime);

      const gain = audioCtx.createGain();
      gain.gain.setValueAtTime(0.18, audioCtx.currentTime);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(audioCtx.destination);
      
      noise.start();
      rainNode = { source: noise, gain: gain, filter: filter };

      // 2. Distant Thunder loop
      const playThunder = () => {
        if (activeSynthType !== 'rain') return;
        const rumbleOsc = audioCtx.createOscillator();
        const rumbleGain = audioCtx.createGain();
        const rumbleFilter = audioCtx.createBiquadFilter();

        rumbleOsc.type = 'sawtooth';
        rumbleOsc.frequency.setValueAtTime(35, audioCtx.currentTime);
        
        rumbleFilter.type = 'lowpass';
        rumbleFilter.frequency.setValueAtTime(45, audioCtx.currentTime);

        rumbleGain.gain.setValueAtTime(0.0, audioCtx.currentTime);
        rumbleGain.gain.linearRampToValueAtTime(0.15, audioCtx.currentTime + 1.5);
        rumbleGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 6.0);

        rumbleOsc.connect(rumbleFilter);
        rumbleFilter.connect(rumbleGain);
        rumbleGain.connect(audioCtx.destination);

        rumbleOsc.start();
        rumbleOsc.stop(audioCtx.currentTime + 6.5);
      };

      stormInterval = setInterval(() => {
        if (Math.random() > 0.4) {
          playThunder();
        }
      }, 15000); // potential thunder every 15s

    } else if (type === 'waves') {
      // Synthesize Ocean Waves
      const noise = audioCtx.createBufferSource();
      noise.buffer = createPinkNoiseBuffer(audioCtx);
      noise.loop = true;

      const filter = audioCtx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.Q.setValueAtTime(1.0, audioCtx.currentTime);

      const gain = audioCtx.createGain();
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(audioCtx.destination);
      
      noise.start();

      // Slow LFO to sweep filter frequency up and down (simulating wave wash)
      const lfo = audioCtx.createOscillator();
      lfo.frequency.setValueAtTime(0.08, audioCtx.currentTime); // once every 12.5 seconds
      
      const lfoGain = audioCtx.createGain();
      lfoGain.gain.setValueAtTime(350, audioCtx.currentTime); // sweep range: 450Hz +/- 350Hz

      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency); // modulate cutoff frequency

      lfo.start();

      rainNode = { 
        source: noise, 
        gain: gain, 
        lfo: lfo,
        lfoGain: lfoGain
      };

    } else if (type === 'lofi') {
      // Generative Chord progression: Slow triangle oscillator pads
      const chords = [
        [130.81, 164.81, 196.00, 246.94], // Cmaj7
        [146.83, 185.00, 220.00, 277.18], // Dmaj7
        [164.81, 196.00, 246.94, 293.66], // Em7
        [174.61, 220.00, 261.63, 329.63]  // Fmaj7
      ];

      let chordIdx = 0;

      const playPad = () => {
        if (activeSynthType !== 'lofi') return;
        const freqs = chords[chordIdx];
        chordIdx = (chordIdx + 1) % chords.length;

        const oscs = freqs.map(freq => {
          const osc = audioCtx.createOscillator();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
          return osc;
        });

        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(450, audioCtx.currentTime);

        const padGain = audioCtx.createGain();
        padGain.gain.setValueAtTime(0, audioCtx.currentTime);
        padGain.gain.linearRampToValueAtTime(0.08, audioCtx.currentTime + 2.0); // slow attack
        padGain.gain.setValueAtTime(0.08, audioCtx.currentTime + 6.0);
        padGain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 10.0); // long release

        oscs.forEach(osc => {
          osc.connect(filter);
        });
        filter.connect(padGain);
        padGain.connect(audioCtx.destination);

        oscs.forEach(osc => osc.start());
        oscs.forEach(osc => osc.stop(audioCtx.currentTime + 10.5));
      };

      playPad();
      lofiInterval = setInterval(playPad, 9500); // loop pads
    }
  } catch (e) {
    console.error("Web Audio Focus Synthesizer error:", e);
  }
};

export const stopFocusSound = () => {
  if (rainNode) {
    try {
      rainNode.source.stop();
      if (rainNode.lfo) rainNode.lfo.stop();
    } catch(e){}
    rainNode = null;
  }
  if (lofiInterval) {
    clearInterval(lofiInterval);
    lofiInterval = null;
  }
  if (stormInterval) {
    clearInterval(stormInterval);
    stormInterval = null;
  }
  activeSynthType = null;
};
