import { useCallback, useState, useEffect } from 'react';

// モジュールスコープのシングルトン変数（グローバルな音声状態を同期）
let globalAudioCtx = null;
let rainNode = null;
let padInterval = null;
let padNodes = [];
let globalBgmVolumeNode = null;

// ローカルストレージおよびグローバル状態の初期化
let globalBgmType = localStorage.getItem('logicafit_bgm_type') || 'none';
let globalBgmVolume = parseFloat(localStorage.getItem('logicafit_bgm_volume') ?? '0.3');
let globalKeyboardEnabled = localStorage.getItem('logicafit_keyboard_enabled') !== 'false';
let globalMuted = localStorage.getItem('logicafit_muted') === 'true';

// 複数インスタンスのuseSound間で状態を同期するためのオブザーバー機構
let listeners = [];
const notifyAll = () => {
  const state = {
    muted: globalMuted,
    bgmType: globalBgmType,
    bgmVolume: globalBgmVolume,
    keyboardEnabled: globalKeyboardEnabled
  };
  listeners.forEach(listener => listener(state));
};

// AudioContextの初期化と自動レジューム
const ensureAudioContext = () => {
  try {
    if (!globalAudioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        console.log("useSound: Creating new AudioContext...");
        globalAudioCtx = new AudioContextClass();
        globalBgmVolumeNode = globalAudioCtx.createGain();
        globalBgmVolumeNode.gain.setValueAtTime(globalBgmVolume, globalAudioCtx.currentTime);
        globalBgmVolumeNode.connect(globalAudioCtx.destination);
        console.log("useSound: AudioContext and BGM Gain node successfully created.");
      } else {
        console.warn("useSound: Web Audio API is not supported in this browser.");
      }
    }
    if (globalAudioCtx && globalAudioCtx.state === 'suspended') {
      console.log("useSound: AudioContext is suspended. Attempting to resume...");
      globalAudioCtx.resume().then(() => {
        console.log("useSound: AudioContext successfully resumed. State:", globalAudioCtx.state);
      }).catch(err => {
        console.error("useSound: Failed to resume AudioContext:", err);
      });
    }
  } catch (e) {
    console.error("useSound: Error inside ensureAudioContext:", e);
  }
  return globalAudioCtx;
};

// シネマティック3バンド雨音シンセサイザー（低音のモヤモヤ・高音の不快感を完全解消）
const startRain = (ctx, targetNode) => {
  if (rainNode) return;
  console.log("useSound: Starting 3-band cinematic rain synthesizer...");
  
  try {
    // 高音質ピンクノイズバッファの作成（4秒ループ）
    const bufferSize = ctx.sampleRate * 4;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    // KelletのRefined法によるピンクノイズ生成
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      data[i] *= 0.11;
      b6 = white * 0.115926;
    }

    // 【層1】遠くの雨の心地よい温かみ（180Hzのバンドパスで「ゴー」音を防ぎつつ、深みだけを残す）
    const source1 = ctx.createBufferSource();
    source1.buffer = buffer;
    source1.loop = true;
    
    const bp1 = ctx.createBiquadFilter();
    bp1.type = 'bandpass';
    bp1.frequency.setValueAtTime(180, ctx.currentTime);
    bp1.Q.setValueAtTime(0.5, ctx.currentTime); // 適度な広さ
    
    const gain1 = ctx.createGain();
    gain1.gain.setValueAtTime(0.15, ctx.currentTime); // 非常に小さな音量で空気感のみ付与

    source1.connect(bp1);
    bp1.connect(gain1);
    gain1.connect(targetNode);

    // 【層2】雨音のメインボディ（450Hz〜1800Hzの中音域）
    const source2 = ctx.createBufferSource();
    source2.buffer = buffer;
    source2.loop = true;
    
    const hp2 = ctx.createBiquadFilter();
    hp2.type = 'highpass';
    hp2.frequency.setValueAtTime(450, ctx.currentTime); // 低周波のこもりを完全排除
    
    const lp2 = ctx.createBiquadFilter();
    lp2.type = 'lowpass';
    lp2.frequency.setValueAtTime(1800, ctx.currentTime); // 高域の不快なシャー音を完全カット
    
    const gain2 = ctx.createGain();
    gain2.gain.setValueAtTime(0.28, ctx.currentTime);

    source2.connect(hp2);
    hp2.connect(lp2);
    lp2.connect(gain2);
    gain2.connect(targetNode);

    // 【層3】木の葉や地面を濡らす、サラサラとした微細な雨のしぶき（2.2kHz〜5.0kHzの極高音域）
    const source3 = ctx.createBufferSource();
    source3.buffer = buffer;
    source3.loop = true;
    
    const hp3 = ctx.createBiquadFilter();
    hp3.type = 'highpass';
    hp3.frequency.setValueAtTime(2200, ctx.currentTime);

    const lp3 = ctx.createBiquadFilter();
    lp3.type = 'lowpass';
    lp3.frequency.setValueAtTime(5000, ctx.currentTime);
    
    const gain3 = ctx.createGain();
    gain3.gain.setValueAtTime(0.04, ctx.currentTime); // 非常に控えめな初期値

    source3.connect(hp3);
    hp3.connect(lp3);
    lp3.connect(gain3);
    gain3.connect(targetNode);

    // すべてのソースの再生を開始
    source1.start(0);
    source2.start(0);
    source3.start(0);

    // 【風によるしぶき変調】1000msごとに高音しぶきレイヤーをゆっくりゆらして風の質感を表現 (LFO)
    let lfoStep = 0;
    const lfoInterval = setInterval(() => {
      if (globalBgmType !== 'rain' || globalMuted) {
        clearInterval(lfoInterval);
        return;
      }
      try {
        const now = ctx.currentTime;
        // しぶきの音量を 0.02 から 0.07 の間でゆっくり波立たせる
        const modVolume = 0.045 + Math.sin(lfoStep) * 0.025;
        gain3.gain.linearRampToValueAtTime(modVolume, now + 0.9);

        // しぶきフィルターのカットオフ周波数を揺らすことで、雨粒が風で舞う様子を再現
        const modFreq = 2200 + Math.cos(lfoStep * 0.6) * 300;
        hp3.frequency.linearRampToValueAtTime(modFreq, now + 0.9);

        lfoStep += 0.25;
      } catch (e) {}
    }, 1000);

    rainNode = { 
      source1, source2, source3, 
      bp1, hp2, lp2, hp3, lp3, 
      gain1, gain2, gain3, 
      lfoInterval 
    };
    console.log("useSound: Cozy 3-band rain active.");
  } catch (err) {
    console.error("useSound: Failed to start rain sound:", err);
  }
};

const stopRain = () => {
  if (rainNode) {
    console.log("useSound: Stopping rain synthesizer...");
    try {
      if (rainNode.lfoInterval) {
        clearInterval(rainNode.lfoInterval);
      }
      rainNode.source1.stop();
      rainNode.source1.disconnect();
      rainNode.source2.stop();
      rainNode.source2.disconnect();
      rainNode.source3.stop();
      rainNode.source3.disconnect();
      rainNode.bp1.disconnect();
      rainNode.hp2.disconnect();
      rainNode.lp2.disconnect();
      rainNode.hp3.disconnect();
      rainNode.lp3.disconnect();
      rainNode.gain1.disconnect();
      rainNode.gain2.disconnect();
      rainNode.gain3.disconnect();
    } catch (e) {}
    rainNode = null;
  }
};

// 2. 脳内チューニングパッド（Lofiアンビエント和音）
const playPadChord = (ctx, targetNode, chordIdx) => {
  try {
    // チルで美しいメジャー/マイナー9thコード進行
    const progressions = [
      [130.81, 196.00, 246.94, 293.66, 329.63], // Cmaj9 (C3, G3, B3, D4, E4)
      [174.61, 220.00, 261.63, 329.63, 392.00], // Fmaj9 (F3, A3, C4, E4, G4)
      [110.00, 164.81, 196.00, 261.63, 493.88], // Am9   (A2, E3, G3, C4, B4)
      [98.00, 146.83, 246.94, 329.63, 440.00]   // G6/9  (G2, D3, B3, E4, A4)
    ];
    
    const freqs = progressions[chordIdx % progressions.length];
    console.log(`useSound: Synthesizing pad chord #${chordIdx % progressions.length} (${freqs.join(', ')} Hz)`);
    
    const chordGain = ctx.createGain();
    chordGain.connect(targetNode);
    
    const now = ctx.currentTime;
    chordGain.gain.setValueAtTime(0, now);
    chordGain.gain.linearRampToValueAtTime(0.035, now + 2.5); // ゆっくりアタック
    chordGain.gain.setValueAtTime(0.035, now + 4.5);
    chordGain.gain.exponentialRampToValueAtTime(0.0001, now + 8.5); // ゆっくり減衰
    
    const oscs = freqs.map(freq => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      // コーラスのような温もりを与えるデチューン
      osc.detune.setValueAtTime(Math.random() * 10 - 5, now);
      osc.connect(chordGain);
      osc.start(now);
      osc.stop(now + 9);
      return osc;
    });
    
    const padObj = { oscs, gain: chordGain };
    padNodes.push(padObj);
    
    setTimeout(() => {
      padNodes = padNodes.filter(p => p !== padObj);
    }, 9500);
  } catch (err) {
    console.error("useSound: Error playing pad chord:", err);
  }
};

const startPad = (ctx, targetNode) => {
  if (padInterval) return;
  console.log("useSound: Starting pad BGM...");
  
  let chordIdx = 0;
  playPadChord(ctx, targetNode, chordIdx++);
  
  // 7.5秒ごとに新しいコードをゆっくり重ねる
  padInterval = setInterval(() => {
    playPadChord(ctx, targetNode, chordIdx++);
  }, 7500);
};

const stopPad = () => {
  if (padInterval) {
    console.log("useSound: Stopping pad BGM...");
    clearInterval(padInterval);
    padInterval = null;
  }
  padNodes.forEach(p => {
    try {
      p.oscs.forEach(osc => {
        osc.stop();
        osc.disconnect();
      });
      p.gain.disconnect();
    } catch (e) {}
  });
  padNodes = [];
};

// バックグラウンドエンジンの再生切り替え
const applyBgmType = (type) => {
  console.log(`useSound: applyBgmType("${type}")`);
  const ctx = ensureAudioContext();
  if (!ctx || !globalBgmVolumeNode) return;

  stopRain();
  stopPad();

  if (globalMuted) {
    console.log("useSound: Audio is muted, skipping BGM execution.");
    return;
  }

  if (type === 'rain') {
    startRain(ctx, globalBgmVolumeNode);
  } else if (type === 'cozy_pad') {
    startPad(ctx, globalBgmVolumeNode);
  }
};

export function useSound() {
  const [localState, setLocalState] = useState({
    muted: globalMuted,
    bgmType: globalBgmType,
    bgmVolume: globalBgmVolume,
    keyboardEnabled: globalKeyboardEnabled
  });

  // 他のコンポーネントでの状態変化に追従して同期する
  useEffect(() => {
    listeners.push(setLocalState);
    return () => {
      listeners = listeners.filter(l => l !== setLocalState);
    };
  }, []);

  // マウント時にブラウザの音声制限を解除するためのジェスチャー検知を自動バインド
  useEffect(() => {
    const handleFirstGesture = () => {
      console.log("useSound: User gesture detected on window. Unlocking AudioContext...");
      const ctx = ensureAudioContext();
      if (ctx && globalBgmType !== 'none' && !globalMuted) {
        applyBgmType(globalBgmType);
      }
      window.removeEventListener('click', handleFirstGesture);
      window.removeEventListener('keydown', handleFirstGesture);
    };

    window.addEventListener('click', handleFirstGesture);
    window.addEventListener('keydown', handleFirstGesture);
    return () => {
      window.removeEventListener('click', handleFirstGesture);
      window.removeEventListener('keydown', handleFirstGesture);
    };
  }, []);

  const playSound = useCallback((type) => {
    if (globalMuted) return;

    try {
      const ctx = ensureAudioContext();
      if (!ctx) return;
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      console.log(`useSound: playSound("${type}") triggered at ${now.toFixed(2)}`);

      if (type === 'click') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
      } 
      else if (type === 'keyboard') {
        if (!globalKeyboardEnabled) return;
        
        // メカニカルキーボード of タイピングクリック音の合成
        const clickOsc = ctx.createOscillator();
        const noise = ctx.createBufferSource();
        const filter = ctx.createBiquadFilter();
        const clickGain = ctx.createGain();

        // 35msの短いノイズバーストを作成して、キースイッチの接触音にする
        const bufferSize = ctx.sampleRate * 0.035;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        noise.buffer = buffer;

        filter.type = 'highpass';
        filter.frequency.setValueAtTime(1300, now);

        clickOsc.type = 'triangle';
        const pitch = 260 + Math.random() * 120; // 毎回微妙にピッチを揺らしてリアルに
        clickOsc.frequency.setValueAtTime(pitch, now);
        clickOsc.frequency.exponentialRampToValueAtTime(70, now + 0.025);

        noise.connect(filter);
        filter.connect(clickGain);
        clickOsc.connect(clickGain);
        clickGain.connect(ctx.destination);

        clickGain.gain.setValueAtTime(0.03, now);
        clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

        noise.start(now);
        clickOsc.start(now);
        noise.stop(now + 0.03);
        clickOsc.stop(now + 0.03);
      }
      else if (type === 'correct') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
        osc.frequency.setValueAtTime(783.99, now + 0.16); // G5
        osc.frequency.setValueAtTime(1046.50, now + 0.24); // C6
        
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.setValueAtTime(0.12, now + 0.24);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        
        osc.start(now);
        osc.stop(now + 0.4);
      } 
      else if (type === 'incorrect') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.setValueAtTime(145, now + 0.1);
        
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.linearRampToValueAtTime(0.08, now + 0.2);
        gain.gain.exponentialRampToValueAtTime(0.005, now + 0.3);
        
        osc.start(now);
        osc.stop(now + 0.3);
      } 
      else if (type === 'success') {
        osc.type = 'sine';
        const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
        notes.forEach((freq, idx) => {
          osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        });
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.setValueAtTime(0.15, now + 0.32);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
        osc.start(now);
        osc.stop(now + 0.6);
      }
    } catch (e) {
      console.warn('Web Audio API play error:', e);
    }
  }, []);

  const toggleMute = useCallback(() => {
    const nextMuted = !globalMuted;
    globalMuted = nextMuted;
    localStorage.setItem('logicafit_muted', nextMuted ? 'true' : 'false');
    console.log(`useSound: Global mute toggled to: ${nextMuted}`);
    
    if (nextMuted) {
      stopRain();
      stopPad();
    } else {
      applyBgmType(globalBgmType);
    }
    notifyAll();
  }, []);

  // BGMタイプの切り替え
  const changeBgmType = useCallback((type) => {
    globalBgmType = type;
    localStorage.setItem('logicafit_bgm_type', type);
    console.log(`useSound: Global BGM type changed to: ${type}`);
    
    if (!globalMuted) {
      applyBgmType(type);
    }
    notifyAll();
  }, []);

  // BGM音量の変更
  const changeBgmVolume = useCallback((volume) => {
    globalBgmVolume = volume;
    localStorage.setItem('logicafit_bgm_volume', volume.toString());
    console.log(`useSound: Global BGM volume changed to: ${volume}`);

    ensureAudioContext();
    if (globalBgmVolumeNode && globalAudioCtx) {
      globalBgmVolumeNode.gain.setValueAtTime(volume, globalAudioCtx.currentTime);
    }
    notifyAll();
  }, []);

  // キーボードASMRの切り替え
  const changeKeyboardEnabled = useCallback((enabled) => {
    globalKeyboardEnabled = enabled;
    localStorage.setItem('logicafit_keyboard_enabled', enabled ? 'true' : 'false');
    console.log(`useSound: Global Keyboard ASMR toggled to: ${enabled}`);
    notifyAll();
  }, []);

  return { 
    playSound, 
    muted: localState.muted, 
    toggleMute, 
    bgmType: localState.bgmType, 
    setBgmType: changeBgmType,
    keyboardEnabled: localState.keyboardEnabled, 
    setKeyboardEnabled: changeKeyboardEnabled,
    bgmVolume: localState.bgmVolume,
    setBgmVolume: changeBgmVolume
  };
}
