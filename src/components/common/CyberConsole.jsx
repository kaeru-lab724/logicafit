import React, { useState, useEffect } from 'react';
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

export default function CyberConsole({ gameState, activeScores, playSound, setActiveGame, setActiveTab }) {
  const [msgIndex, setMsgIndex] = useState(0);
  const [fadeKey, setFadeKey] = useState(0);

  // Compute dynamic messages
  const recGameKey = getRecommendedGameKey(activeScores || {});
  const recGameName = GAME_NAMES[recGameKey] || recGameKey;
  const activeBugsCount = (gameState.bugNote || []).filter(b => !b.solved).length;
  
  const todayStr = new Date().toLocaleDateString('sv');
  const isTuningCompletedToday = gameState.lastTuningDate === todayStr;
  const unlockedBadgesCount = (gameState.badges || []).filter(Boolean).length;

  const messages = [
    {
      prefix: 'OS_STATUS',
      text: `LOGIFIT_OS v2.4.0: LEVEL ${gameState.level} / XP ${gameState.xp} [ESTABLISHED]`,
      action: null,
      icon: <Activity size={12} style={{ color: 'var(--color-cyan)' }} />
    },
    {
      prefix: 'OS_RECOMMEND',
      text: `推奨デバッグ: 「${recGameName}」をプレイしてスコアを最適化してください。`,
      action: () => {
        playSound('click');
        setActiveGame(recGameKey);
      },
      icon: <Sparkles size={12} style={{ color: 'var(--color-primary)' }} />
    },
    {
      prefix: 'OS_BUG_ALERT',
      text: activeBugsCount > 0 
        ? `警告: 未解決の思考バグが ${activeBugsCount} 件検出されています。デバッグを起動してください。`
        : `ステータス: 思考回路内の深刻なバグは現在検出されていません [CLEAN]`,
      action: () => {
        playSound('click');
        setActiveTab('bugNote');
      },
      icon: <AlertTriangle size={12} style={{ color: activeBugsCount > 0 ? 'var(--color-rose)' : '#10b981' }} />
    },
    {
      prefix: 'OS_MEMORY',
      text: isTuningCompletedToday
        ? `調律ログ: 脳内メモリ（RAM）調律完了。動作空き領域は十分に確保されています。`
        : `注意: 脳内メモリ負荷上昇。本日の「思考調律（ジャーナリング）」を起動してください。`,
      action: () => {
        playSound('click');
        setActiveTab('bugNote');
      },
      icon: <Terminal size={12} style={{ color: isTuningCompletedToday ? '#10b981' : 'var(--color-amber)' }} />
    },
    {
      prefix: 'OS_ARCHIVE',
      text: `実績データ: 現在 ${unlockedBadgesCount} / 5 個の思考バッジが活性化されています。`,
      action: () => {
        playSound('click');
        setActiveTab('achievements');
      },
      icon: <Activity size={12} style={{ color: 'var(--color-primary)' }} />
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % messages.length);
      setFadeKey((prev) => prev + 1);
    }, 4500);
    return () => clearInterval(timer);
  }, [messages.length]);

  const currentMsg = messages[msgIndex];

  return (
    <div 
      className="glass-panel cyber-console-bar hover-lift"
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '10px 14px',
        background: 'rgba(10, 11, 16, 0.7)',
        border: '1px solid rgba(6, 182, 212, 0.25)',
        borderLeft: '4px solid var(--color-cyan)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2), inset 0 0 10px rgba(6, 182, 212, 0.05)',
        borderRadius: '10px',
        fontSize: '12px',
        fontFamily: 'monospace, var(--font-display)',
        color: 'rgba(255, 255, 255, 0.85)',
        gap: '10px',
        cursor: currentMsg.action ? 'pointer' : 'default',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        minHeight: '38px',
        boxSizing: 'border-box',
        overflow: 'hidden',
        width: '100%'
      }}
      onClick={currentMsg.action || undefined}
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
          margin-left: 2px;
        }
        @keyframes consoleFadeIn {
          from { opacity: 0; transform: translateX(4px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .console-text-fade {
          animation: consoleFadeIn 0.4s ease-out forwards;
          display: flex;
          alignItems: center;
          gap: 8px;
          flex: 1;
          min-width: 0;
          white-space: nowrap;
          text-overflow: ellipsis;
          overflow: hidden;
        }
        .console-prefix {
          color: var(--color-cyan);
          font-weight: bold;
          margin-right: 4px;
        }
        .cyber-console-bar:hover {
          border-color: rgba(6, 182, 212, 0.5);
          box-shadow: 0 0 15px rgba(6, 182, 212, 0.15);
        }
      `}</style>

      {/* Terminal Prompt symbol */}
      <span style={{ color: 'var(--color-cyan)', fontWeight: 'bold', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
        &gt;
      </span>

      {/* Icon & Message Text */}
      <div key={fadeKey} className="console-text-fade">
        <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          {currentMsg.icon}
        </span>
        <span style={{ textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '11px', letterSpacing: '0.2px' }}>
          <span className="console-prefix">[{currentMsg.prefix}]</span>
          {currentMsg.text}
        </span>
      </div>

      {/* Blinking Prompt Cursor */}
      <span className="terminal-cursor" style={{ flexShrink: 0 }}>_</span>
      
      {currentMsg.action && (
        <span 
          style={{ 
            fontSize: '9px', 
            background: 'rgba(6, 182, 212, 0.15)', 
            border: '1px solid rgba(6, 182, 212, 0.3)', 
            color: 'var(--color-cyan)', 
            padding: '2px 6px', 
            borderRadius: '4px',
            marginLeft: 'auto',
            flexShrink: 0,
            transform: 'scale(0.9)'
          }}
        >
          EXECUTE
        </span>
      )}
    </div>
  );
}
