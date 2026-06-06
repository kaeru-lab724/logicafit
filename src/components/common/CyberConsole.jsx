import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Activity, AlertTriangle, Terminal } from 'lucide-react';

const GAME_NAMES = {
  factsOpinions: '事実 vs 意見',
  logicalValidity: '論理の妥当性',
  logicTree: 'ロジックツリー',
  fallacy: '論理的誤謬の特定',
  empathyDialogue: '共感対話',
  hiddenAssumption: '前提のデバッグ',
  causalLoop: '因果ループ',
  assertiveRewrite: 'アサーティブ',
  strategic: '戦略コンパイラー',
  gameTheory: 'ゲーム理論デバッガー',
  treeQuest: 'ツリー探索',
  fallacyHunter: '誤謬スナイパー',
  eqSimulator: 'EQシミュレーター'
};

const getRecommendedGameKey = (scores) => {
  const keys = ['factsOpinions', 'logicalValidity', 'logicTree', 'fallacy', 'empathyDialogue', 'hiddenAssumption', 'causalLoop', 'assertiveRewrite', 'strategic', 'gameTheory'];
  for (const key of keys) {
    if ((scores[key] || 0) === 0) return key;
  }
  let minScore = 101;
  let recommendedKey = keys[0];
  for (const key of keys) {
    const score = scores[key] || 0;
    if (score < 100 && score < minScore) {
      minScore = score;
      recommendedKey = key;
    }
  }
  return recommendedKey;
};

const getLogColor = (type) => {
  switch (type) {
    case 'cyan': return 'var(--color-cyan)';
    case 'emerald': return '#10b981';
    case 'warn': return 'var(--color-amber)';
    case 'rose':
    case 'error':
      return 'var(--color-rose)';
    case 'info':
    default:
      return 'rgba(255, 255, 255, 0.7)';
  }
};

export default function CyberConsole({ gameState, activeScores, playSound, setActiveGame, setActiveTab }) {
  const [logs, setLogs] = useState([]);
  const logsContainerRef = useRef(null);

  // Compute dynamic values
  const recGameKey = getRecommendedGameKey(activeScores || {});
  const recGameName = GAME_NAMES[recGameKey] || recGameKey;
  const activeBugsCount = (gameState.bugNote || []).filter(b => !b.solved).length;
  
  const todayStr = new Date().toLocaleDateString('sv');
  const isTuningCompletedToday = gameState.lastTuningDate === todayStr;
  const unlockedBadgesCount = (gameState.badges || []).filter(Boolean).length;

  // Initialize logs on mount (Boot sequence simulation)
  useEffect(() => {
    const now = new Date();
    const formatTime = (dt) => dt.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    setLogs([
      { id: 1, time: formatTime(new Date(now.getTime() - 8000)), text: '[SYS_BOOT] INITIALIZING COGNITIVE ENGINE v2.4...', type: 'info' },
      { id: 2, time: formatTime(new Date(now.getTime() - 5000)), text: '[SYS_BOOT] LOADING THOUGHT COMPILER SYMBOLS... [OK]', type: 'info' },
      { id: 3, time: formatTime(new Date(now.getTime() - 2000)), text: '[SYS_BOOT] CALIBRATING NEUROLOGICAL ROUTERS...', type: 'warn' },
      { id: 4, time: formatTime(now), text: '[SYS_BOOT] SYSTEM ONLINE. COGNITIVE TERMINAL CONNECTED.', type: 'emerald' }
    ]);
  }, []);

  // Set up periodic logs output
  useEffect(() => {
    const logPool = [
      // Concept logs
      { text: '[SYS_CONCEPT] 認知バイアスのバグをデバッグし、論理的思考力をブーストするシステム。', type: 'info' },
      { text: '[SYS_CONCEPT] 感情に流されず、客観的データに基づいた的確な意思決定を下すマインド・デバッガー。', type: 'info' },
      { text: '[SYS_CONCEPT] 日常の些細な「モヤモヤ」をロジカルに整理し、脳のメモリを解放します。', type: 'info' },

      // Directive logs (Dynamic based on states)
      { text: `[SYS_DIRECTIVE] 推奨アクション: 次の指令『${recGameName}』を実行し、論理パラメータを高めてください。`, type: 'cyan' },
      { 
        text: isTuningCompletedToday 
          ? '[SYS_DIRECTIVE] 思考調律: 本日分のジャーナリング完了。脳内キャッシュはクリーンです。' 
          : '[SYS_DIRECTIVE] 警告: 脳内メモリ負荷が高まっています。本日の「思考調律」を実行してください。', 
        type: isTuningCompletedToday ? 'emerald' : 'warn' 
      },
      { 
        text: activeBugsCount > 0 
          ? `[SYS_DIRECTIVE] 警告: ${activeBugsCount}件の未解決の思考バグがあります。「バグノート」で復習しましょう。` 
          : '[SYS_DIRECTIVE] システムスキャン: 検出された論理的バイアス・バグは 0 件です。良好。', 
        type: activeBugsCount > 0 ? 'rose' : 'emerald' 
      },

      // Kaeru HINTS (Emerald)
      { text: '[KAERU_HINT] カエル分析官：「事実」と「意見」を混同すると議論が空転するケロ。常に客観的な証拠を探すケロ！', type: 'emerald' },
      { text: '[KAERU_HINT] カエル分析官：論理展開に飛躍がないか？「風が吹けば桶屋が儲かる」的な思考に注意するケロ。', type: 'emerald' },
      { text: '[KAERU_HINT] カエル分析官：全体像を整理する時は「モレなく、ダブりなく（MECE）」が鉄則ケロ。ツリーで可視化しよう！', type: 'emerald' },
      { text: '[KAERU_HINT] カエル分析官：感情的になりそうな時は一歩引き、前提にどんな「隠れた思い込み」があるかデバッグするケロ。', type: 'emerald' },
      { text: '[KAERU_HINT] カエル分析官：相手の議論を歪めて攻撃する「ストローマン論法」など、日常に潜む論理的誤謬を見分けるケロ。', type: 'emerald' },

      // Satsuki LOGS (Rose)
      { text: '[SATSUKI_LOG] 皐月：看護の現場でも、患者さんの「痛い（主観）」と「バイタル測定値（客観）」の切り分けは超重要です！', type: 'rose' },
      { text: '[SATSUKI_LOG] 皐月：コミュニケーションでは、相手を責めず、自分も我慢しない「アサーティブ」な自己表現が摩擦を防ぎます。', type: 'rose' },
      { text: '[SATSUKI_LOG] 皐月：共感とは相手にただ同調することではなく、「なぜそう考えるのか」背景を理解しようとする姿勢のことです。', type: 'rose' },
      { text: '[SATSUKI_LOG] 皐月：頭がモヤモヤする時は、5分間「ジャーナリング（思考調律）」で書き出すだけで、驚くほどスッキリしますよ！', type: 'rose' }
    ];

    const interval = setInterval(() => {
      const randomLog = logPool[Math.floor(Math.random() * logPool.length)];
      const now = new Date();
      const timeStr = now.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      
      setLogs((prev) => {
        const nextId = prev.length > 0 ? prev[prev.length - 1].id + 1 : 1;
        return [...prev.slice(-14), { id: nextId, time: timeStr, text: randomLog.text, type: randomLog.type }];
      });
    }, 4000); // 4 seconds interval for comfortable reading of Japanese text

    return () => clearInterval(interval);
  }, [activeScores, isTuningCompletedToday, recGameName, activeBugsCount]);

  // Auto-scroll logic (scroll container directly to bottom safely)
  useEffect(() => {
    if (logsContainerRef.current) {
      logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div 
      className="glass-panel cyber-console-window"
      style={{
        display: 'flex',
        flexDirection: 'column',
        background: 'rgba(10, 11, 16, 0.85)',
        border: '1px solid rgba(6, 182, 212, 0.3)',
        borderRadius: '12px',
        boxShadow: '0 12px 30px rgba(0, 0, 0, 0.4), inset 0 0 20px rgba(6, 182, 212, 0.05)',
        fontFamily: 'monospace, var(--font-display)',
        overflow: 'hidden',
        width: '100%',
        boxSizing: 'border-box',
        transition: 'all 0.3s ease',
        position: 'relative'
      }}
    >
      <style>{`
        @keyframes terminalBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        .terminal-cursor {
          animation: terminalBlink 1.2s infinite;
          color: var(--color-cyan);
          font-weight: bold;
        }
        @keyframes radarScan {
          0% { top: -5%; }
          50% { top: 105%; }
          100% { top: -5%; }
        }
        .console-scanline {
          position: absolute;
          left: 0;
          width: 100%;
          height: 3px;
          background: linear-gradient(to bottom, transparent, rgba(6, 182, 212, 0.35), transparent);
          box-shadow: 0 0 10px rgba(6, 182, 212, 0.4);
          animation: radarScan 6s linear infinite;
          pointer-events: none;
          z-index: 10;
        }
        @keyframes pulseColor {
          0%, 100% { opacity: 0.4; transform: scale(0.9); }
          50% { opacity: 1; transform: scale(1.1); }
        }
        .pulse-beacon {
          animation: pulseColor 1.8s infinite ease-in-out;
          display: inline-block;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background-color: var(--color-cyan);
          box-shadow: 0 0 8px var(--color-cyan);
          flex-shrink: 0;
        }
        @keyframes consoleLineReveal {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .reveal-line-1 {
          animation: consoleLineReveal 0.4s ease-out forwards;
          animation-delay: 0.1s;
          opacity: 0;
        }
        .reveal-line-2 {
          animation: consoleLineReveal 0.4s ease-out forwards;
          animation-delay: 0.4s;
          opacity: 0;
        }
        .reveal-line-3 {
          animation: consoleLineReveal 0.4s ease-out forwards;
          animation-delay: 0.7s;
          opacity: 0;
        }
        @keyframes logLinePrint {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .log-line-item {
          animation: logLinePrint 0.25s ease-out forwards;
        }
        .cyber-log-container::-webkit-scrollbar {
          display: none;
        }
        .cyber-log-container {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .terminal-line {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 12px;
          border-radius: 6px;
          cursor: pointer;
          color: rgba(255, 255, 255, 0.8);
          font-size: 11.5px;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          white-space: nowrap;
          text-overflow: ellipsis;
          overflow: hidden;
          text-align: left;
          border: 1px solid transparent;
        }
        .terminal-line-text {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .terminal-prefix {
          color: var(--color-cyan);
          font-weight: bold;
          flex-shrink: 0;
        }
        .terminal-line-cyan:hover {
          background: rgba(6, 182, 212, 0.12);
          border-color: rgba(6, 182, 212, 0.3);
          color: var(--color-cyan);
          transform: translateX(4px);
        }
        .terminal-line-rose:hover {
          background: rgba(244, 63, 94, 0.12);
          border-color: rgba(244, 63, 94, 0.3);
          color: var(--color-rose);
          transform: translateX(4px);
        }
        .terminal-line-emerald:hover {
          background: rgba(16, 185, 129, 0.12);
          border-color: rgba(16, 185, 129, 0.3);
          color: #10b981;
          transform: translateX(4px);
        }
        .terminal-line-amber:hover {
          background: rgba(245, 158, 11, 0.12);
          border-color: rgba(245, 158, 11, 0.3);
          color: var(--color-amber);
          transform: translateX(4px);
        }
        .terminal-action-btn {
          font-size: 9px;
          font-weight: bold;
          padding: 2px 6px;
          border-radius: 4px;
          opacity: 0;
          transition: opacity 0.2s ease;
          flex-shrink: 0;
          margin-left: 10px;
        }
        .terminal-line:hover .terminal-action-btn {
          opacity: 1;
        }
        .cyber-console-window:hover {
          border-color: rgba(6, 182, 212, 0.5);
          box-shadow: 0 16px 40px rgba(6, 182, 212, 0.15);
        }
      `}</style>

      {/* Absolute Radar Scanline overlay */}
      <div className="console-scanline" />

      {/* Console Window Header Bar */}
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '6px 12px',
          background: 'rgba(20, 22, 30, 0.9)',
          borderBottom: '1px solid rgba(6, 182, 212, 0.2)',
          fontSize: '10px',
          color: 'var(--text-muted)',
          gap: '8px',
          position: 'relative',
          zIndex: 11
        }}
      >
        <div style={{ display: 'flex', gap: '5px', flexShrink: 0, alignItems: 'center' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ff5f56' }} />
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ffbd2e' }} />
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#27c93f' }} />
        </div>
        <span style={{ margin: '0 auto', fontSize: '9px', letterSpacing: '1px', fontWeight: 'bold', textShadow: '0 0 4px rgba(6, 182, 212, 0.4)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span className="pulse-beacon" />
          LOGIFIT COGNITIVE CONSOLE v2.4
        </span>
        <span style={{ width: '40px', flexShrink: 0 }} />
      </div>

      {/* Console Screen Body */}
      <div 
        style={{
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          position: 'relative',
          zIndex: 11
        }}
      >
        {/* Line 1: System Status (Achievements / Profile) */}
        <div 
          className="terminal-line terminal-line-cyan reveal-line-1"
          onClick={() => {
            playSound('click');
            setActiveTab('achievements');
          }}
        >
          <div className="terminal-line-text">
            <span className="terminal-prefix">&gt;_STATUS:</span>
            <Activity size={12} style={{ color: 'var(--color-cyan)', flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
              LEVEL {gameState.level} (XP: {gameState.xp}) // UNLOCKED BADGES: {unlockedBadgesCount} / 5
            </span>
          </div>
          <span className="terminal-action-btn" style={{ background: 'rgba(6, 182, 212, 0.15)', border: '1px solid rgba(6, 182, 212, 0.3)', color: 'var(--color-cyan)' }}>
            SETTINGS
          </span>
        </div>

        {/* Line 2: Diagnostic Scan (Bugs / Mind Tuning Alerts) */}
        {activeBugsCount > 0 ? (
          <div 
            className="terminal-line terminal-line-rose reveal-line-2"
            onClick={() => {
              playSound('click');
              setActiveTab('bugNote');
            }}
          >
            <div className="terminal-line-text">
              <span className="terminal-prefix">&gt;_SCAN:</span>
              <AlertTriangle size={12} style={{ color: 'var(--color-rose)', flexShrink: 0 }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                WARNING: {activeBugsCount} COGNITIVE BUG(S) DETECTED IN THOUGHT PROCESS.
              </span>
            </div>
            <span className="terminal-action-btn" style={{ background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.3)', color: 'var(--color-rose)' }}>
              DEBUG_NOW
            </span>
          </div>
        ) : (
          <div 
            className={isTuningCompletedToday ? "terminal-line terminal-line-emerald reveal-line-2" : "terminal-line terminal-line-amber reveal-line-2"}
            onClick={() => {
              playSound('click');
              setActiveTab('bugNote');
            }}
          >
            <div className="terminal-line-text">
              <span className="terminal-prefix">&gt;_SCAN:</span>
              {isTuningCompletedToday ? (
                <Terminal size={12} style={{ color: '#10b981', flexShrink: 0 }} />
              ) : (
                <AlertTriangle size={12} style={{ color: 'var(--color-amber)', flexShrink: 0 }} />
              )}
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {isTuningCompletedToday 
                  ? 'HEALTH: NO BIAS LEAKS DETECTED. RAM MEMORY FREED [OK]' 
                  : 'HEALTH: MEMORY LOAD HIGH. ACTION REQUIRED: RUN MIND TUNING'}
              </span>
            </div>
            <span 
              className="terminal-action-btn" 
              style={{ 
                background: isTuningCompletedToday ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)', 
                border: isTuningCompletedToday ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)', 
                color: isTuningCompletedToday ? '#10b981' : 'var(--color-amber)' 
              }}
            >
              {isTuningCompletedToday ? 'VIEW_LOG' : 'RUN_TUNING'}
            </span>
          </div>
        )}

        {/* Line 3: Directive / Recommended Action */}
        <div 
          className="terminal-line terminal-line-cyan reveal-line-3"
          onClick={() => {
            playSound('click');
            setActiveGame(recGameKey);
          }}
        >
          <div className="terminal-line-text">
            <span className="terminal-prefix">&gt;_COMMAND:</span>
            <Sparkles size={12} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
              NEXT DIRECTIVE: RUN "{recGameName.toUpperCase()}" <span className="terminal-cursor">_</span>
            </span>
          </div>
          <span className="terminal-action-btn" style={{ background: 'rgba(6, 182, 212, 0.15)', border: '1px solid rgba(6, 182, 212, 0.3)', color: 'var(--color-cyan)' }}>
            EXECUTE
          </span>
        </div>

        {/* Console divider line */}
        <div style={{ borderTop: '1px dashed rgba(6, 182, 212, 0.15)', margin: '4px 0' }} />

        {/* Live Terminal Output Feed */}
        <div 
          ref={logsContainerRef}
          className="cyber-log-container"
          style={{
            background: 'rgba(0, 0, 0, 0.45)',
            border: '1px solid rgba(6, 182, 212, 0.15)',
            borderRadius: '6px',
            padding: '8px 12px',
            height: '76px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            boxShadow: 'inset 0 2px 6px rgba(0, 0, 0, 0.5)',
            position: 'relative'
          }}
        >
          {logs.map((log) => (
            <div 
              key={log.id} 
              className="log-line-item"
              style={{ 
                display: 'flex', 
                gap: '8px', 
                lineHeight: '1.4', 
                fontSize: '10px',
                fontFamily: 'monospace'
              }}
            >
              <span style={{ color: 'rgba(6, 182, 212, 0.4)', flexShrink: 0 }}>[{log.time}]</span>
              <span style={{ color: getLogColor(log.type), whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {log.text}
              </span>
            </div>
          ))}
          
          {/* Cursor Prompt line at bottom */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '2px', fontSize: '10px', fontFamily: 'monospace' }}>
            <span style={{ color: 'var(--color-cyan)', opacity: 0.5 }}>guest@logifit:~$_</span>
            <span className="terminal-cursor" style={{ fontSize: '10px' }}>█</span>
          </div>
        </div>

      </div>
    </div>
  );
}
