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

  // レイアウト崩壊・UI/UX破壊のためのステート群
  const [headerStyle, setHeaderStyle] = useState({});
  const [leftPanelStyle, setLeftPanelStyle] = useState({});
  const [rightPanelStyle, setRightPanelStyle] = useState({});
  const [terminalStyle, setTerminalStyle] = useState({});
  const [backButtonOffset, setBackButtonOffset] = useState({ x: 0, y: 0 });
  const [backButtonText, setBackButtonText] = useState('← ポータルに戻る');
  const [containerTransform, setContainerTransform] = useState('');
  const [cursorStyle, setCursorStyle] = useState('default');

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

  // メインボタンを画面全体の広範囲に瞬間移動させる（UI無視）
  const teleportButton = () => {
    // 画面全体（親の glass-panel のサイズ）を基準にするため、かなり広めの範囲でランダム座標を設定
    const rangeX = isMobile ? 130 : 380;
    const rangeY = isMobile ? 220 : 320;
    const newX = (Math.random() - 0.5) * rangeX * 2;
    const newY = (Math.random() - 0.5) * rangeY * 2;
    setButtonOffset({ x: newX, y: newY });
  };

  const handleMouseEnterButton = () => {
    // マウスホバー時に55%の超高確率で瞬間移動して逃げる
    if (Math.random() < 0.55) {
      teleportButton();
      setLogs(prev => [
        ...prev,
        { time: new Date().toLocaleTimeString(), text: '【EVADE】メインスイッチが高速で回避しました。' }
      ].slice(-20));
    }
  };

  // 戻るボタンを逃がすギミック（UXの破壊）
  const teleportBackButton = () => {
    const rangeX = isMobile ? 120 : 250;
    const rangeY = isMobile ? 60 : 130;
    const newX = (Math.random() - 0.5) * rangeX * 2;
    const newY = (Math.random() - 0.5) * rangeY * 2;
    setBackButtonOffset({ x: newX, y: newY });

    const responses = [
      '← 脱出不能',
      '← 戻れません',
      '← ポータルは消失しました',
      '← 虚無の果てへ',
      '← 諦めてください',
      '← SYSTEM ERROR',
      '← ここがあなたの家です',
      '← 留まりましょう',
      '← 不要なボタン'
    ];
    setBackButtonText(responses[Math.floor(Math.random() * responses.length)]);
  };

  const handleMouseEnterBack = () => {
    // 70%の確率で戻るボタンが逃げる
    if (Math.random() < 0.70) {
      teleportBackButton();
      setLogs(prev => [
        ...prev,
        { time: new Date().toLocaleTimeString(), text: '【EVADE】脱出ゲートが消失しました。' }
      ].slice(-20));
    }
  };

  const handleBackClick = () => {
    // クリックしても50%の確率で逃げるだけ
    if (Math.random() < 0.50) {
      teleportBackButton();
      setLogs(prev => [
        ...prev,
        { time: new Date().toLocaleTimeString(), text: '【EVADE】戻るボタンをクリック回避しました！' }
      ].slice(-20));
    } else {
      onBack();
    }
  };

  // 画面のレイアウト構成そのものを破壊する関数
  const randomizeLayout = () => {
    const randomTransform = (scaleRange = 0.15) => {
      const x = (Math.random() - 0.5) * 160;
      const y = (Math.random() - 0.5) * 160;
      const rot = (Math.random() - 0.5) * 45; // 最大45度回転
      const scale = 1 + (Math.random() - 0.5) * scaleRange;
      return {
        transform: `translate(${x}px, ${y}px) rotate(${rot}deg) scale(${scale})`,
        transition: 'transform 0.4s cubic-bezier(0.18, 0.89, 0.32, 1.28)',
        zIndex: Math.floor(Math.random() * 20),
        pointerEvents: Math.random() < 0.9 ? 'auto' : 'none' // 稀にクリックできなくする
      };
    };
    setHeaderStyle(randomTransform(0.2));
    setLeftPanelStyle(randomTransform(0.1));
    setRightPanelStyle(randomTransform(0.1));
    setTerminalStyle(randomTransform(0.1));
  };

  const spawnEmojis = () => {
    const emojis = ['🍄', '🌀', '🛸', '🐸', '🐟', '👾', '🧩', '💎', '💤', '👻', '🫧', '🕳️', '💀', '🤡', '🌪️'];
    const newEmojis = Array.from({ length: 4 }).map((_, i) => ({
      id: Date.now() + i + Math.random(),
      x: Math.random() * 90 + 5,
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
      delay: Math.random() * 0.3
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
    const numStars = Math.floor(Math.random() * 50) + 40;
    const newStars = Array.from({ length: numStars }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 1.5,
      delay: Math.random() * 2.0,
      color: ['#f472b6', '#db2777', '#a78bfa', '#38bdf8', '#34d399', '#ffffff', '#eab308'][Math.floor(Math.random() * 7)]
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

    // 3. レイアウト全体の崩壊・ランダムシャッフル
    randomizeLayout();

    // 4. マウスカーソルのUX破壊
    const cursors = ['wait', 'help', 'not-allowed', 'none', 'cell', 'crosshair', 'zoom-in', 'grab', 'default'];
    setCursorStyle(cursors[Math.floor(Math.random() * cursors.length)]);

    // 5. 画面全体のトランスフォーム（天地逆転、歪みなど）
    const transforms = [
      '',
      'rotate(180deg)',
      'skew(12deg, 12deg)',
      'scaleY(-1)',
      'scaleX(-1)',
      'rotate(90deg) scale(0.8)',
      'rotate(-90deg) scale(0.8)',
      'scale(0.9) translate(10px, 10px)'
    ];
    // 25%の確率で画面全体を歪ませる
    if (Math.random() < 0.25) {
      const selectedTsf = transforms[Math.floor(Math.random() * transforms.length)];
      setContainerTransform(selectedTsf);
      // 1.5秒後に元に戻す
      setTimeout(() => setContainerTransform(''), 1500);
    }

    // 6. ランダムなボタンテキスト変更
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
      '逃げるボタン',
      '押しても無駄',
      'UI/UXはゴミ箱へ',
      '崩壊するインターフェース'
    ];
    setBtnText(texts[Math.floor(Math.random() * texts.length)]);

    // 7. ランダムグリッチ（約40%の確率）
    const randGlitch = Math.random();
    if (randGlitch < 0.15) {
      setGlitchStyle({ filter: 'invert(1) hue-rotate(180deg)', transition: 'none' });
      setTimeout(() => setGlitchStyle({}), 150);
    } else if (randGlitch < 0.30) {
      setGlitchStyle({ transform: 'rotate(1.5deg) scale(0.99)', filter: 'blur(2px)', transition: 'none' });
      setTimeout(() => setGlitchStyle({}), 250);
    } else if (randGlitch < 0.45) {
      setScrambleActive(true);
      setTimeout(() => setScrambleActive(false), 600);
    }

    // 8. ブラックアウトのトリガー (15%の確率、または特定のエントロピー段階)
    const nextEntropy = entropy + 5;
    const triggerBlackoutChance = Math.random() < 0.15 || nextEntropy === 40 || nextEntropy === 80;

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
          `メインスイッチが次元跳躍しました。(座標リロケーション)`,
          `画面構成要素の相対座標がランダムにシフトしました。`,
          `カーソル属性が一時的に歪められました。`,
          `宇宙のエントロピーが劇的に増加しています。`,
          `[ACTION] システム崩壊プロセスの観察(クリック: ${clickCount + 1}回)`,
          `[SUCCESS] 完全に無駄な電磁エネルギーが発散されました。`,
          `警告: このページにおいてUX理論は通用しません。`
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
    setBackButtonOffset({ x: 0, y: 0 });
    setBackButtonText('← ポータルに戻る');
    setBtnText('エントロピーを消費する');
    setGlitchStyle({});
    setContainerTransform('');
    setCursorStyle('default');
    setHeaderStyle({});
    setLeftPanelStyle({});
    setRightPanelStyle({});
    setTerminalStyle({});
    setLogs([
      { time: new Date().toLocaleTimeString(), text: 'SYSTEM RESET: 虚無の調整室をリセットしました。' },
      { time: new Date().toLocaleTimeString(), text: 'STATUS: レイアウトおよびUI変数を初期状態に調律しました。' }
    ]);
  };

  return (
    <div className="game-container fade-in" style={{ width: '100%', maxWidth: '960px', margin: '0 auto', boxSizing: 'border-box', ...glitchStyle, transform: containerTransform, cursor: cursorStyle }}>
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

      <div className="glass-panel" style={{ padding: isMobile ? '20px' : '32px', position: 'relative', border: '1px solid rgba(236, 72, 153, 0.2)', overflow: 'hidden', minHeight: '500px' }}>
        
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

        {/* Floating Evasive Main Switch (Absolute Positioned over parent glass-panel) */}
        <button
          onClick={handleConsumeEntropy}
          onMouseEnter={handleMouseEnterButton}
          className="btn"
          style={{
            position: 'absolute',
            left: `calc(50% + ${buttonOffset.x}px)`,
            top: `calc(50% + ${buttonOffset.y}px)`,
            transform: 'translate(-50%, -50%)',
            width: isMobile ? '180px' : '240px',
            height: '76px',
            background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
            color: '#fff',
            fontSize: '13.5px',
            fontWeight: 'bold',
            borderRadius: '12px',
            border: 'none',
            boxShadow: '0 8px 32px rgba(236, 72, 153, 0.45)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            transition: 'left 0.08s cubic-bezier(0.1, 0.8, 0.3, 1), top 0.08s cubic-bezier(0.1, 0.8, 0.3, 1), background 0.2s, box-shadow 0.2s',
            zIndex: 90
          }}
        >
          <Sparkles size={16} className="animate-pulse" />
          <span>{btnText}</span>
        </button>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px', ...headerStyle }}>
          <div>
            <span style={{ color: '#f472b6', fontWeight: 'bold', fontSize: '13px', letterSpacing: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Infinity size={14} /> {scrambleActive ? 'Ø1Ø1_ÈÑT_CHAMBER' : 'ABSOLUTE VOID CHAMBER'}
            </span>
            <h2 style={{ fontFamily: 'var(--font-display)', marginTop: '4px', color: 'var(--text-primary)', fontSize: isMobile ? '20px' : '24px' }}>
              {scrambleActive ? '𝄜 𝄜 𝄜 (B®a1n N01se)' : '虚無の調整室（Brain Noise）'}
            </h2>
          </div>
          <button 
            onClick={handleBackClick} 
            onMouseEnter={handleMouseEnterBack}
            className="btn btn-secondary"
            style={{ 
              padding: '8px 16px', 
              fontSize: '13px', 
              borderRadius: '8px', 
              zIndex: 10,
              transform: `translate(${backButtonOffset.x}px, ${backButtonOffset.y}px)`,
              transition: 'transform 0.08s cubic-bezier(0.1, 0.8, 0.3, 1)',
              position: 'relative'
            }}
          >
            {backButtonText}
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
            borderRadius: '16px',
            ...leftPanelStyle
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
            overflow: 'visible',
            minHeight: '180px',
            ...rightPanelStyle
          }}>
            <div style={{ 
              color: 'var(--text-muted)', 
              fontSize: '11px', 
              textAlign: 'center', 
              margin: '12px 0', 
              border: '1px dashed rgba(236, 72, 153, 0.2)', 
              padding: '10px', 
              borderRadius: '8px',
              background: 'rgba(236, 72, 153, 0.02)',
              lineHeight: '1.4'
            }}>
              ⚠️ {scrambleActive ? 'SYS_OFFSET_ERROR' : '【警告】メインスイッチはエントロピー過多により空間浮遊しています。ボタンを追いかけてクリックしてください。'}
            </div>

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
          boxShadow: 'inset 0 0 20px rgba(0,0,0,0.8)',
          ...terminalStyle
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px', marginBottom: '10px', color: 'var(--text-muted)' }}>
            <Terminal size={14} />
            <span>Entropy Console v1.2.0 (UI/UX Destruction Edition)</span>
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
