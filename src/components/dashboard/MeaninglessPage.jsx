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

  const handleConsumeEntropy = () => {
    if (playSound) playSound('click');
    setClickCount(prev => prev + 1);
    
    const nextEntropy = entropy + 5;
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
        `スイッチが押されました。(エントロピー +5%)`,
        `無駄な処理が実行されました。(クリック数: ${clickCount + 1}回)`,
        `貴重な時間がエントロピーに変換されました。`,
        `[SUCCESS] 虚無が順調に蓄積されています。`,
        `[STATUS] 特に結果は出ていません。順調です。`,
        `ボタンの接触確認：完全に物理的なクリックです。`,
        `エントロピー増加シグナルを受信しました。`
      ];
      const randomLog = logOptions[Math.floor(Math.random() * logOptions.length)];
      setLogs(prev => [
        ...prev,
        { time: new Date().toLocaleTimeString(), text: `[ACTION] ${randomLog}` }
      ].slice(-20));
    }
  };

  const handleReset = () => {
    if (playSound) playSound('click');
    setEntropy(0);
    setClickCount(0);
    setLogs([
      { time: new Date().toLocaleTimeString(), text: 'SYSTEM RESET: 虚無の調整室をリセットしました。' },
      { time: new Date().toLocaleTimeString(), text: 'STATUS: 再び何も起きない状態からスタートします。' }
    ]);
  };

  return (
    <div className="game-container fade-in" style={{ width: '100%', maxWidth: '960px', margin: '0 auto', boxSizing: 'border-box' }}>
      <div className="glass-panel" style={{ padding: isMobile ? '20px' : '32px', position: 'relative', border: '1px solid rgba(236, 72, 153, 0.2)' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <span style={{ color: '#f472b6', fontWeight: 'bold', fontSize: '13px', letterSpacing: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Infinity size={14} /> ABSOLUTE VOID CHAMBER
            </span>
            <h2 style={{ fontFamily: 'var(--font-display)', marginTop: '4px', color: 'var(--text-primary)', fontSize: isMobile ? '20px' : '24px' }}>
              虚無の調整室（Brain Noise）
            </h2>
          </div>
          <button 
            onClick={onBack} 
            className="btn btn-secondary"
            style={{ padding: '8px 16px', fontSize: '13px', borderRadius: '8px' }}
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
                Entropy Level
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
                <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginBottom: '2px' }}>無意味なクリック</div>
                <div style={{ fontWeight: 'bold', color: 'var(--text-primary)', fontSize: '16px' }}>{clickCount} 回</div>
              </div>
              <div style={{ borderLeft: '1px solid var(--border-color)' }}></div>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginBottom: '2px' }}>現在の虚無ステータス</div>
                <div style={{ fontWeight: 'bold', color: '#f472b6', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Activity size={14} /> 安定
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
            borderRadius: '16px'
          }}>
            <button
              onClick={handleConsumeEntropy}
              className="btn"
              style={{
                width: '100%',
                height: '76px',
                background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
                color: '#fff',
                fontSize: '16px',
                fontWeight: 'bold',
                borderRadius: '12px',
                border: 'none',
                boxShadow: '0 4px 20px rgba(236, 72, 153, 0.35)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.02)';
                e.currentTarget.style.boxShadow = '0 6px 25px rgba(236, 72, 153, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(236, 72, 153, 0.35)';
              }}
            >
              <Sparkles size={20} className="animate-pulse" />
              <span>エントロピーを消費する</span>
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
                fontSize: '13.5px'
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
            <span>Entropy Console v1.0.0</span>
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
