import React from 'react';
import { Sparkles, Activity, AlertTriangle, Terminal, ChevronRight } from 'lucide-react';

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

export default function CyberConsole({ gameState, activeScores, playSound, setActiveGame, setActiveTab }) {
  // Compute dynamic states
  const recGameKey = getRecommendedGameKey(activeScores || {});
  const recGameName = GAME_NAMES[recGameKey] || recGameKey;
  const activeBugsCount = (gameState.bugNote || []).filter(b => !b.solved).length;
  
  const todayStr = new Date().toLocaleDateString('sv');
  const isTuningCompletedToday = gameState.lastTuningDate === todayStr;
  const unlockedBadgesCount = (gameState.badges || []).filter(Boolean).length;

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
        transition: 'all 0.3s ease'
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
          gap: '8px'
        }}
      >
        <div style={{ display: 'flex', gap: '5px', flexShrink: 0 }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ff5f56' }} />
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ffbd2e' }} />
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#27c93f' }} />
        </div>
        <span style={{ margin: '0 auto', fontSize: '9px', letterSpacing: '1px', fontWeight: 'bold', textShadow: '0 0 4px rgba(6, 182, 212, 0.4)' }}>
          LOGIFIT COGNITIVE CONSOLE v2.4
        </span>
        <span style={{ width: '34px', flexShrink: 0 }} />
      </div>

      {/* Console Screen Body */}
      <div 
        style={{
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}
      >
        {/* Line 1: System Status (Achievements / Profile) */}
        <div 
          className="terminal-line terminal-line-cyan"
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
            className="terminal-line terminal-line-rose"
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
            className={isTuningCompletedToday ? "terminal-line terminal-line-emerald" : "terminal-line terminal-line-amber"}
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
          className="terminal-line terminal-line-cyan"
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
      </div>
    </div>
  );
}
