import React, { useState, useEffect, useRef } from 'react';
import { HelpCircle, Terminal, RotateCcw, Sparkles, Infinity, Activity } from 'lucide-react';

export default function MeaninglessPage({ onBack, playSound }) {
  const [entropy, setEntropy] = useState(0);
  const [clickCount, setClickCount] = useState(0);
  const [logs, setLogs] = useState([
    { time: new Date().toLocaleTimeString(), text: 'SYSTEM INITIALIZED: 虚無エンジンを稼働しました。' },
    { time: new Date().toLocaleTimeString(), text: 'STATUS: 正常に何の意味もない状態を維持しています。' }
  ]);
  const [isMobile, setIsMobile] = useState(false);
  const terminalEndRef = useRef(null);

  // 虚無を加速させるための混沌ステート
  const [buttonOffset, setButtonOffset] = useState({ x: 0, y: 0 });
  const [btnText, setBtnText] = useState('エントロピーを消費する');
  const [isBlackout, setIsBlackout] = useState(false);
  const [blackoutOpacity, setBlackoutOpacity] = useState(1);
  const [stars, setStars] = useState([]);
  const [floatingEmojis, setFloatingEmojis] = useState([]);
  const [glitchStyle, setGlitchStyle] = useState({});
  const [scrambleActive, setScrambleActive] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  // Periodic random log generator
  useEffect(() => {
    const funnyMessages = [
      '特に何も起きていません。安心してください。',
      'カエル分析官がこちらを非常に冷ややかな目で見ています。',
      'エントロピーが増大中。無駄な処理が進行しています。',
      '警告: この画面をいくら凝視しても、論理思考力は1ミリも向上しません。',
      '朗報: あなたの人生の15秒が、極めて安全に消費されました！',
      'バックグラウンドで虚無をコンパイルしています...',
      'デバッグシグナル: 意味のある変数が見つかりません。',
      '宇宙の熱的死（熱死）に向けて、順調にエントロピーを消費しています。',
      '思考のストレッチ中（ただの待ち時間）。',
      '無意味な処理ループ：何もしていないのにPCファンが回る危険はありません。',
      'エントロピー消費中... 虚無があなたの精神を優しく包み込みます。'
    ];

    const interval = setInterval(() => {
      const randomMsg = funnyMessages[Math.floor(Math.random() * funnyMessages.length)];
      setLogs(prev => [
        ...prev,
        { time: new Date().toLocaleTimeString(), text: `[INFO] ${randomMsg}` }
      ].slice(-20)); // Keep last 20 logs
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  const teleportButton = () => {
    const rangeX = isMobile ? 80 : 180;
    const rangeY = isMobile ? 50 : 110;
    const newX = (Math.random() - 0.5) * rangeX * 2;
    const newY = (Math.random() - 0.5) * rangeY * 2;
    setButtonOffset({ x: newX, y: newY });
  };

  const handleMouseEnterButton = () => {
    // 35%の確率でマウスホバー時にボタンが逃げる
    if (Math.random() < 0.35) {
      teleportButton();
      setLogs(prev => [
        ...prev,
        { time: new Date().toLocaleTimeString(), text: '【EVADE】ボタンが接触を回避して瞬間移動しました。' }
      ].slice(-20));
    }
  };

  const spawnEmojis = () => {
    const emojis = ['🍄', '🌀', '🛸', '🐸', '🐟', '👾', '🧩', '💎', '💤', '👻', '🫧', '🕳️'];
    const newEmojis = Array.from({ length: 3 }).map((_, i) => ({
      id: Date.now() + i + Math.random(),
      x: Math.random() * 80 + 10,
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
      delay: Math.random() * 0.2
    }));
    setFloatingEmojis(prev => [...prev, ...newEmojis]);

    // 4秒後に自動消去
    setTimeout(() => {
      setFloatingEmojis(prev => prev.filter(e => !newEmojis.find(ne => ne.id === e.id)));
    }, 4000);
  };

  const startBlackout = () => {
    setIsBlackout(true);
    setBlackoutOpacity(1);
    
    // 点々の光（星）を生成
    const numStars = Math.floor(Math.random() * 40) + 30;
    const newStars = Array.from({ length: numStars }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      delay: Math.random() * 2.0,
      color: ['#f472b6', '#db2777', '#a78bfa', '#38bdf8', '#34d399', '#ffffff'][Math.floor(Math.random() * 6)]
    }));
    setStars(newStars);

    setLogs(prev => [
      ...prev,
      { time: new Date().toLocaleTimeString(), text: '【EVENT】エントロピーの特異点が発生。視界が極限まで収縮しています。' },
      { time: new Date().toLocaleTimeString(), text: '【SYSTEM】ブラックアウト... 静寂の中に微小な光が点生しています。' }
    ].slice(-20));

    // 2.5秒間暗闇を維持した後、2秒かけて徐々に元の画面が見えてくるようにする
    setTimeout(() => {
      let currentOpacity = 1;
      const interval = setInterval(() => {
        currentOpacity -= 0.05;
        if (currentOpacity <= 0) {
          clearInterval(interval);
          setIsBlackout(false);
          setStars([]);
        } else {
          setBlackoutOpacity(currentOpacity);
        }
      }, 100);
    }, 2500);
  };

  const handleConsumeEntropy = () => {
    if (playSound) playSound('click');
    setClickCount(prev => prev + 1);

    // 1. エモジ湧き
    spawnEmojis();

    // 2. ボタンの瞬間移動
    teleportButton();

    // 3. ランダムなボタンテキスト変更
    const texts = [
      'エントロピーを消費する',
      '無を生産する',
      '宇宙の熱的死を加速',
      '時間をドブに捨てる',
      '何もないボタン',
      'ただのスイッチ',
      '特に意味のないクリック',
      'カエル分析官の視線を感じる',
      '時空の歪みを検知',
      '何も起きない喜び',
      '虚無の極致',
      'クリックの墓場',
      'ボタンを追いかけて！',
      '逃げるボタン'
    ];
    setBtnText(texts[Math.floor(Math.random() * texts.length)]);

    // 4. ランダムグリッチ（約30%の確率）
    const randGlitch = Math.random();
    if (randGlitch < 0.1) {
      setGlitchStyle({ filter: 'invert(1) hue-rotate(180deg)', transition: 'none' });
      setTimeout(() => setGlitchStyle({}), 150);
    } else if (randGlitch < 0.2) {
      setGlitchStyle({ transform: 'rotate(1.5deg) scale(0.99)', filter: 'blur(2px)', transition: 'none' });
      setTimeout(() => setGlitchStyle({}), 250);
    } else if (randGlitch < 0.3) {
      setScrambleActive(true);
      setTimeout(() => setScrambleActive(false), 500);
    }

    // 5. ブラックアウトのトリガー (12%の確率、または特定のエントロピー段階)
    const nextEntropy = entropy + 5;
    const triggerBlackoutChance = Math.random() < 0.12 || nextEntropy === 40 || nextEntropy === 80;

    if (triggerBlackoutChance && !isBlackout) {
      setEntropy(nextEntropy >= 100 ? 0 : nextEntropy);
      startBlackout();
    } else {
      if (nextEntropy >= 100) {
        if (playSound) playSound('correct');
        setEntropy(0);
        setLogs(prev => [
          ...prev,
          { time: new Date().toLocaleTimeString(), text: '【CRITICAL】エントロピー容量が100%に到達！システムを強制初期化しました。' },
          { time: new Date().toLocaleTimeString(), text: '【SYSTEM】特に何も起きませんでした！すべては無に帰りました。' }
        ].slice(-20));
        alert('【エントロピー限界到達】特に何も起こりませんでした！メーターがリセットされます。');
      } else {
        setEntropy(nextEntropy);
        const logOptions = [
          `ボタンが瞬間移動しました。(座標シフト完了)`,
          `時間をエントロピーに等価交換しました。(効率: 0%)`,
          `宇宙のエントロピーが微増しました。`,
          `[INFO] 画面の傾きを検知しましたが無視されました。`,
          `[ACTION] 時間の切り売り(クリック数: ${clickCount + 1}回)`,
          `[SUCCESS] 完全に無駄な電力が消費されました。`,
          `警告: この行動に意味を見出そうとしないでください。`
        ];
        const randomLog = logOptions[Math.floor(Math.random() * logOptions.length)];
        setLogs(prev => [
          ...prev,
          { time: new Date().toLocaleTimeString(), text: `[ACTION] ${randomLog}` }
        ].slice(-20));
      }
    }
  };

  const handleReset = () => {
    if (playSound) playSound('click');
    setEntropy(0);
    setClickCount(0);
    setButtonOffset({ x: 0, y: 0 });
    setBtnText('エントロピーを消費する');
    setGlitchStyle({});
    setLogs([
      { time: new Date().toLocaleTimeString(), text: 'SYSTEM RESET: 虚無の調整室をリセットしました。' },
      { time: new Date().toLocaleTimeString(), text: 'STATUS: 再び何も起きない状態からスタートします。' }
    ]);
  };

  return (
    <div className="game-container fade-in" style={{ width: '100%', maxWidth: '960px', margin: '0 auto', boxSizing: 'border-box', ...glitchStyle }}>
      <style>{`
        @keyframes voidStarFadeIn {
          0% { opacity: 0; transform: scale(0.5); }
          50% { opacity: 1; transform: scale(1.2); }
          100% { opacity: 0.6; transform: scale(1); }
        }
        @keyframes emojiDriftUp {
          0% { transform: translateY(0) rotate(0deg) scale(0.5); opacity: 0; }
          15% { opacity: 1; }
          100% { transform: translateY(-350px) rotate(180deg) scale(1.2); opacity: 0; }
        }
      `}</style>

      <div className="glass-panel" style={{ padding: isMobile ? '20px' : '32px', position: 'relative', border: '1px solid rgba(236, 72, 153, 0.2)', overflow: 'hidden' }}>
        
        {/* Floating Emojis */}
        {floatingEmojis.map((e) => (
          <span
            key={e.id}
            style={{
              position: 'absolute',
              left: `${e.x}%`,
              bottom: '20px',
              fontSize: '28px',
              pointerEvents: 'none',
              zIndex: 60,
              animation: `emojiDriftUp 3s cubic-bezier(0.1, 0.8, 0.3, 1) forwards`,
              animationDelay: `${e.delay}s`
            }}
          >
            {e.emoji}
          </span>
        ))}

        {/* Blackout Overlay */}
        {isBlackout && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `rgba(9, 10, 15, ${blackoutOpacity})`,
            zIndex: 100,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            overflow: 'hidden',
            pointerEvents: 'auto',
            borderRadius: '16px'
          }}>
            {/* Stars */}
            {stars.map((star) => (
              <div
                key={star.id}
                style={{
                  position: 'absolute',
                  left: `${star.x}%`,
                  top: `${star.y}%`,
                  width: `${star.size}px`,
                  height: `${star.size}px`,
                  borderRadius: '50%',
                  background: star.color,
                  boxShadow: `0 0 8px ${star.color}`,
                  opacity: 0,
                  animation: `voidStarFadeIn 3s forwards`,
                  animationDelay: `${star.delay}s`
                }}
              />
            ))}
            
            <div style={{
              color: '#f472b6',
              fontFamily: 'var(--font-display)',
              fontSize: '14px',
              letterSpacing: '3px',
              opacity: blackoutOpacity,
              transition: 'opacity 0.3s ease',
              textAlign: 'center',
              padding: '20px'
            }}>
              <div className="animate-pulse" style={{ fontSize: '18px', marginBottom: '8px' }}>🌀 SINGULARITY</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>空間を再構成中...</div>
            </div>
          </div>
        )}

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <span style={{ color: '#f472b6', fontWeight: 'bold', fontSize: '13px', letterSpacing: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Infinity size={14} /> {scrambleActive ? 'Ø1Ø1_ÈÑT_CHAMBER' : 'ABSOLUTE VOID CHAMBER'}
            </span>
            <h2 style={{ fontFamily: 'var(--font-display)', marginTop: '4px', color: 'var(--text-primary)', fontSize: isMobile ? '20px' : '24px' }}>
              {scrambleActive ? '𝄜 𝄜 𝄜 (B®a1n N01se)' : '虚無の調整室（Brain Noise）'}
            </h2>
          </div>
          <button 
            onClick={onBack} 
            className="btn btn-secondary"
            style={{ padding: '8px 16px', fontSize: '13px', borderRadius: '8px', zIndex: 10 }}
          >
            ← ポータルに戻る
          </button>
        </div>

        {/* Description Panel */}
        <div style={{
          background: 'rgba(236, 72, 153, 0.03)',
          border: '1px dashed rgba(236, 72, 153, 0.2)',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '28px',
          textAlign: 'left',
          fontSize: '13.5px',
          color: 'var(--text-secondary)',
          lineHeight: '1.6'
        }}>
          💡 <strong>虚無の心得</strong>：
          この部屋には思考力を鍛えるクイズも、感情を整理するノートもありません。
          ただスイッチを押してエントロピー（虚無度）をため、あなたの貴重な時間を完璧に浪費するための部屋です。
          忙しい日常のノイズから離れ、何の意味もないクリックの美学をお楽しみください。
        </div>

        {/* Gauge & Button Block */}
        <div style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          gap: '24px',
          alignItems: 'stretch',
          marginBottom: '32px'
        }}>
          
          {/* Left Panel: Gauge and Metrics */}
          <div className="glass-panel" style={{
            flex: 1.2,
            padding: '24px',
            background: 'var(--bg-inner-box)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '20px',
            border: '1px solid var(--border-color)',
            borderRadius: '16px'
          }}>
            <div style={{ textAlign: 'center', width: '100%' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>
                {scrambleActive ? 'SYSTEM_DECAY' : 'Entropy Level'}
              </span>
              <div style={{ 
                fontSize: '48px', 
                fontFamily: 'var(--font-display)', 
                fontWeight: '800', 
                color: '#f472b6', 
                textShadow: '0 0 15px rgba(236,72,153,0.3)',
                margin: '8px 0'
              }}>
                {entropy}%
              </div>
            </div>

            {/* Progress Bar */}
            <div style={{
              width: '100%',
              height: '14px',
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '7px',
              border: '1px solid var(--border-color)',
              overflow: 'hidden',
              position: 'relative'
            }}>
              <div style={{
                height: '100%',
                width: `${entropy}%`,
                background: 'linear-gradient(90deg, #ec4899 0%, #f472b6 100%)',
                boxShadow: '0 0 10px rgba(236,72,153,0.5)',
                transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }} />
            </div>

            {/* Metrics */}
            <div style={{ display: 'flex', width: '100%', justifyContent: 'space-around', borderTop: '1px solid var(--border-color)', paddingTop: '16px', fontSize: '13px' }}>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginBottom: '2px' }}>{scrambleActive ? '無のカウント' : '無意味なクリック'}</div>
                <div style={{ fontWeight: 'bold', color: 'var(--text-primary)', fontSize: '16px' }}>{clickCount} 回</div>
              </div>
              <div style={{ borderLeft: '1px solid var(--border-color)' }}></div>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginBottom: '2px' }}>{scrambleActive ? 'シグナル途絶' : '現在の虚無ステータス'}</div>
                <div style={{ fontWeight: 'bold', color: '#f472b6', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Activity size={14} /> {scrambleActive ? '崩壊' : '安定'}
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel: Interactive Actions */}
          <div className="glass-panel" style={{
            flex: 1,
            padding: '24px',
            background: 'var(--bg-inner-box)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: '16px',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            position: 'relative',
            overflow: 'visible', // Allow button to offset outward
            minHeight: '180px'
          }}>
            <button
              onClick={handleConsumeEntropy}
              onMouseEnter={handleMouseEnterButton}
              className="btn"
              style={{
                width: '100%',
                height: '76px',
                background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
                color: '#fff',
                fontSize: '14px',
                fontWeight: 'bold',
                borderRadius: '12px',
                border: 'none',
                boxShadow: '0 4px 20px rgba(236, 72, 153, 0.35)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                transform: `translate(${buttonOffset.x}px, ${buttonOffset.y}px)`,
                transition: 'transform 0.08s cubic-bezier(0.1, 0.8, 0.3, 1), background 0.2s, box-shadow 0.2s',
                zIndex: 20
              }}
            >
              <Sparkles size={16} className="animate-pulse" />
              <span>{btnText}</span>
            </button>

            <button
              onClick={handleReset}
              className="btn btn-secondary"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontSize: '13.5px',
                zIndex: 10
              }}
            >
              <RotateCcw size={15} /> 虚無を初期化
            </button>
          </div>

        </div>

        {/* Pseudo Terminal Logger */}
        <div className="glass-panel" style={{
          background: '#090a0f',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          borderRadius: '12px',
          padding: '16px',
          fontFamily: 'var(--font-mono, monospace)',
          fontSize: '12px',
          color: '#34d399',
          textAlign: 'left',
          boxShadow: 'inset 0 0 20px rgba(0,0,0,0.8)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px', marginBottom: '10px', color: 'var(--text-muted)' }}>
            <Terminal size={14} />
            <span>Entropy Console v1.1.0 (Chaos Edition)</span>
          </div>

          <div style={{
            height: '140px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            boxSizing: 'border-box'
          }}>
            {logs.map((log, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', opacity: idx === logs.length - 1 ? 1 : 0.7 }}>
                <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>[{log.time}]</span>
                <span style={{ 
                  color: log.text.includes('【CRITICAL】') ? '#f43f5e' : 
                         log.text.includes('【EVADE】') ? '#f59e0b' :
                         log.text.includes('【EVENT】') ? '#a78bfa' :
                         log.text.includes('[ACTION]') ? '#60a5fa' : 
                         log.text.includes('[SUCCESS]') ? '#34d399' : '#34d399',
                  wordBreak: 'break-all'
                }}>
                  {log.text}
                </span>
              </div>
            ))}
            <div ref={terminalEndRef} />
          </div>
        </div>

      </div>
    </div>
  );
}
