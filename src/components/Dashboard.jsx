import React, { useState, useEffect } from 'react';
import { 
  Award, 
  Brain, 
  BookOpen, 
  Sparkles, 
  HelpCircle,
  TrendingUp,
  Copy,
  Lock,
  Unlock,
  KeyRound,
  Search,
  Sword,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import RakutenWidget from './common/RakutenWidget';
import { decodeState, calculateFriction } from '../data/spellHelper';
import { diagnosticTypes } from '../data/diagnosticData';
import { useSound } from '../hooks/useSound';
// 自動推奨ゲームのキー選定
const getRecommendedGameKey = (scores) => {
  const keys = ['factsOpinions', 'logicalValidity', 'logicTree', 'fallacy', 'empathyDialogue', 'hiddenAssumption', 'causalLoop', 'assertiveRewrite', 'strategic'];
  
  // 1. 未プレイ（0%）を優先
  for (const key of keys) {
    if ((scores[key] || 0) === 0) {
      return key;
    }
  }
  
  // 2. 100%未満で最もスコアが低いもの
  let minScore = 101;
  let recommendedKey = keys[0];
  let hasIncomplete = false;
  
  for (const key of keys) {
    const score = scores[key] || 0;
    if (score < 100) {
      hasIncomplete = true;
      if (score < minScore) {
        minScore = score;
        recommendedKey = key;
      }
    }
  }
  
  // 3. 全て100%の場合は最初のゲーム
  if (!hasIncomplete) {
    return 'factsOpinions';
  }
  
  return recommendedKey;
};

// ゲームキーから表示名へのマッピング
const getGameName = (key) => {
  const names = {
    factsOpinions: '事実 vs 意見',
    logicalValidity: '論理の妥当性',
    logicTree: 'ロジックツリー',
    fallacy: '論理的誤謬の特定',
    hiddenAssumption: '前提のデバッグ',
    causalLoop: '因果ループ',
    assertiveRewrite: 'アサーティブ',
    strategic: '戦略コンパイラー',
    empathyDialogue: '共感対話'
  };
  return names[key] || '';
};

export default function Dashboard({
  isNewUser,
  isFullUnlocked,
  gameState,
  charClass,
  playSound,
  setActiveGame,
  activeTab,
  setActiveTab,
  mode,
  displayScores,
  primaryDebugCategory,
  rooms,
  spellInput,
  setSpellInput,
  spellError,
  setSpellError,
  spellSuccess,
  setSpellSuccess,
  handleRestoreSpell,
  handleCopySpell,
  currentSpell,
  setShowGuideModal,
  badgeDetails,
  skillsData,
  onUnlockType,
  onStartReview,
  onClearTuningToday
}) {
  const [showToast, setShowToast] = useState(false);
  const [opponentSpell, setOpponentSpell] = useState('');
  const [matchResult, setMatchResult] = useState(null);
  const [matchError, setMatchError] = useState('');
  const [showBugDetails, setShowBugDetails] = useState(false);
  const [selectedBugId, setSelectedBugId] = useState(null);
  const [showIntroduction, setShowIntroduction] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [librarySubTab, setLibrarySubTab] = useState('bug'); // 'bug' or 'skill'
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [selectedBadgeIndex, setSelectedBadgeIndex] = useState(null);
  const [copiedBadgeIdx, setCopiedBadgeIdx] = useState(null);

  const { 
    bgmType, 
    setBgmType, 
    keyboardEnabled, 
    setKeyboardEnabled,
    bgmVolume,
    setBgmVolume 
  } = useSound();

  const getCriticalScore = () => {
    const f = displayScores.fallacy || 0;
    const ha = displayScores.hiddenAssumption !== undefined ? displayScores.hiddenAssumption : f;
    return Math.round((f + ha) / 2);
  };
  const getRadicalScore = () => {
    const lt = displayScores.logicTree || 0;
    const cl = displayScores.causalLoop !== undefined ? displayScores.causalLoop : lt;
    return Math.round((lt + cl) / 2);
  };
  const getEmotionalScore = () => {
    const ed = displayScores.empathyDialogue || 0;
    const ar = displayScores.assertiveRewrite !== undefined ? displayScores.assertiveRewrite : ed;
    return Math.round((ed + ar) / 2);
  };
  const getStrategicScore = () => {
    return displayScores.strategic !== undefined ? displayScores.strategic : 0;
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isHovered) return;
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % 4);
    }, 5500);
    return () => clearInterval(interval);
  }, [isHovered]);

  useEffect(() => {
    if (activeSlide !== 0) {
      setShowBugDetails(false);
    }
  }, [activeSlide]);

  const onCopyClick = () => {
    handleCopySpell(currentSpell);
    setShowToast(true);
    const timer = setTimeout(() => {
      setShowToast(false);
    }, 2500);
    return () => clearTimeout(timer);
  };

  const handleShareToX = (text) => {
    playSound('click');
    const appUrl = 'https://www.logifit.site/';
    const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(appUrl)}`;
    window.open(shareUrl, '_blank', 'noopener,noreferrer');
  };

  const handleCheckFriction = (e) => {
    e.preventDefault();
    setMatchError('');
    setMatchResult(null);

    if (!currentSpell) {
      setMatchError('まずあなた自身の診断を完了するか、ブレインコードを入力してください。');
      return;
    }

    try {
      const stateA = decodeState(currentSpell);
      const stateB = decodeState(opponentSpell);
      const result = calculateFriction(stateA, stateB);
      setMatchResult(result);
      playSound('success');

      // 相手のバグタイプをアンロック
      if (onUnlockType && result && result.typeB) {
        onUnlockType(result.typeB);
      }
    } catch (err) {
      playSound('incorrect');
      setMatchError(err.message || '相手のブレインコードの解析に失敗しました。');
    }
  };

  // Find detailed type data
  const currentType = gameState.diagnosticTypeId 
    ? diagnosticTypes[gameState.diagnosticTypeId] 
    : (gameState.diagnosticType || null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }} className="fade-in">
      {isNewUser ? (
        /* ========================================================
           ① 新規未受診フェーズ（診断ファースト誘導）
           ======================================================== */
        <LandingPage 
          showCTA={true}
          playSound={playSound}
          setActiveGame={setActiveGame}
          handleRestoreSpell={handleRestoreSpell}
          spellInput={spellInput}
          setSpellInput={setSpellInput}
          spellError={spellError}
        />
      ) : (
        /* ========================================================
           ② 診断完了後フェーズ（PC2カラム・ダッシュボードレイアウト）
           ======================================================== */
        <>

          {showIntroduction && (
            <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
              <LandingPage 
                showCTA={false}
                playSound={playSound}
                setActiveGame={setActiveGame}
              />
            </div>
          )}

          <div className="dashboard-grid-layout">
          
          {/* 左メインカラム（マイプロファイル ＆ タブナビゲーション・コンテンツ） */}
          <div className="dashboard-main-column">
            
            {/* Column 1: Your Brain Bug Card (Refactored to Autoplay Carousel) */}
            {(() => {
              const slides = [
                // Slide 1: My Profile
                {
                  badge: "あなたの愛すべき脳内バグ",
                  badgeColor: "var(--color-badge-bg)",
                  badgeTextColor: "var(--color-badge-text)",
                  badgeBorder: "var(--color-badge-border)",
                  level: gameState?.level ? `レベル ${gameState.level}` : '',
                  icon: currentType?.emoji || "🐸",
                  title: currentType?.name || charClass?.title,
                  tagline: currentType?.tagline || '思考のデバッグジムへようこそ',
                  desc: (
                    <>
                      <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '13.5px', marginBottom: '24px' }}>
                        {currentType?.description || charClass?.desc}
                      </p>
                      
                      {/* アコーディオン: 取扱説明書 (トリセツ) & 3大バグ */}
                      {currentType && (
                        <div style={{ marginBottom: '24px' }}>
                          <button
                            onClick={() => { playSound('click'); setShowBugDetails(!showBugDetails); }}
                            className="btn btn-secondary"
                            style={{
                              width: '100%',
                              padding: '10px 16px',
                              fontSize: '13px',
                              borderRadius: '8px',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              background: showBugDetails ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.01)',
                              border: '1px solid rgba(255,255,255,0.06)'
                            }}
                          >
                            <span>{showBugDetails ? '▼ 取扱説明書と脳内バグを閉じる' : '▶ あなたの取扱説明書と脳内バグを見る'}</span>
                            <Sparkles size={14} style={{ color: 'var(--color-cyan)' }} />
                          </button>

                          {showBugDetails && (
                            <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left', animation: 'fadeIn 0.3s ease' }}>
                              <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', padding: '14px', borderRadius: '8px' }}>
                                <span style={{ fontSize: '12px', color: 'var(--color-cyan)', fontWeight: 'bold' }}>💼 工作でのバグ</span>
                                <p style={{ margin: '4px 0 0 0', fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{currentType?.workBug}</p>
                              </div>
                              <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', padding: '14px', borderRadius: '8px' }}>
                                <span style={{ fontSize: '12px', color: '#f43f5e', fontWeight: 'bold' }}>🏡 私生活でのバグ</span>
                                <p style={{ margin: '4px 0 0 0', fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{currentType?.privateBug}</p>
                              </div>
                              <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', padding: '14px', borderRadius: '8px' }}>
                                <span style={{ fontSize: '12px', color: '#f59e0b', fontWeight: 'bold' }}>⚡ ふとした瞬間のクセ</span>
                                <p style={{ margin: '4px 0 0 0', fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{currentType?.dailyHabit}</p>
                              </div>
                              <div style={{ background: 'rgba(16, 185, 129, 0.03)', border: '1px solid rgba(16, 185, 129, 0.1)', padding: '14px', borderRadius: '8px' }}>
                                <span style={{ display: 'block', fontSize: '12px', color: '#10b981', fontWeight: 'bold', marginBottom: '8px' }}>📋 取扱説明書</span>
                                <span style={{ display: 'block', fontSize: '11px', color: '#f43f5e', fontWeight: 'bold' }}>● 地雷ポイント</span>
                                <p style={{ margin: '2px 0 8px 0', fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{currentType?.torisetsu?.jealousPoint}</p>
                                <span style={{ display: 'block', fontSize: '11px', color: '#10b981', fontWeight: 'bold' }}>● デバッグコマンド</span>
                                <p style={{ margin: '2px 0 0 0', fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{currentType?.torisetsu?.debugSpell}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  ),
                  actions: (
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                      <button 
                        onClick={() => { 
                          playSound('click'); 
                          document.getElementById('training-menu')?.scrollIntoView({ behavior: 'smooth' }); 
                        }} 
                        className="btn btn-primary"
                        style={{
                          flex: 1.2,
                          background: isFullUnlocked 
                            ? 'linear-gradient(135deg, var(--color-primary) 0%, #7c3aed 100%)' 
                            : 'linear-gradient(135deg, var(--color-cyan) 0%, var(--color-primary) 100%)',
                          boxShadow: isFullUnlocked 
                            ? '0 4px 15px var(--color-primary-glow)' 
                            : '0 4px 15px rgba(6, 182, 212, 0.3)',
                          fontSize: '13.5px',
                          padding: '10px 18px'
                        }}
                      >
                        🎯 {isFullUnlocked ? 'デバッグを再開する' : '最初の練習（デバッグ）へ'}
                      </button>
                      <button 
                        onClick={() => { playSound('click'); setActiveGame('diagnostic'); }} 
                        className="btn btn-secondary"
                        style={{ flex: 0.8, fontSize: '13px', padding: '10px 14px' }}
                      >
                        再スキャン/他者スキャン
                      </button>
                    </div>
                  )
                },
                // Slide 2: About LogiFit
                {
                  badge: "LogiFitとは？",
                  badgeColor: "rgba(6, 182, 212, 0.05)",
                  badgeTextColor: "var(--color-cyan)",
                  badgeBorder: "rgba(6, 182, 212, 0.15)",
                  level: null,
                  icon: "🔬",
                  title: "認知のバグを暴く思考ジム",
                  tagline: "なぜか話が噛み合わない…そのアタマの偏りをデバッグする",
                  desc: (
                    <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '13.5px', marginBottom: '24px' }}>
                      LogiFitは、3分間のレントゲン（思考診断）であなたの認知の偏りを暴き、4つの思考ルーム（ロジカル、クリティカル、ラディカル、エモーショナル）でゲーム感覚で思考力をデバッグ・強化するジムです。
                    </p>
                  ),
                  actions: (
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button 
                        onClick={() => { playSound('click'); setShowIntroduction(!showIntroduction); }} 
                        className="btn btn-primary"
                        style={{
                          flex: 1,
                          background: 'linear-gradient(135deg, var(--color-cyan) 0%, var(--color-primary) 100%)',
                          boxShadow: '0 4px 15px rgba(6, 182, 212, 0.3)',
                          fontSize: '13.5px',
                          padding: '10px 18px'
                        }}
                      >
                        💡 {showIntroduction ? 'コンセプト説明を閉じる' : 'コンセプト説明を全表示する'}
                      </button>
                    </div>
                  )
                },
                // Slide 3: Update Note
                {
                  badge: "システムアップデート",
                  badgeColor: "rgba(244, 63, 94, 0.05)",
                  badgeTextColor: "var(--color-rose)",
                  badgeBorder: "rgba(244, 63, 94, 0.15)",
                  level: null,
                  icon: "📢",
                  title: "「脳内デバッグ・ラボ」へ進化",
                  tagline: "HPや制限時間によるゲームオーバーを撤廃しました",
                  desc: (
                    <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '13.5px', marginBottom: '24px' }}>
                      『へりくつ魔獣討伐』を廃止し、本質的な思考デバッグへリニューアル！HP・制限時間によるゲームオーバーをなくし、納得いくまで解説を読んで思考力を磨ける仕様になりました。
                    </p>
                  ),
                  actions: (
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                      <button 
                        onClick={() => { playSound('click'); setActiveTab('encyclopedia'); setLibrarySubTab('bug'); }} 
                        className="btn btn-secondary"
                        style={{
                          flex: 1,
                          fontSize: '13.5px',
                          padding: '10px 18px'
                        }}
                      >
                        👾 脳内バグ図鑑を見る
                      </button>
                      <button 
                        onClick={() => { 
                          playSound('click'); 
                          setActiveSlide(0); 
                          setShowBugDetails(true); 
                        }} 
                        className="btn btn-secondary"
                        style={{
                          flex: 1,
                          fontSize: '13.5px',
                          padding: '10px 18px'
                        }}
                      >
                        📖 マイ取扱説明書を表示
                      </button>
                    </div>
                  )
                },
                // Slide 4: Daily Mind Tuning (思考調律) Onboarding
                {
                  badge: "デイリールーティン",
                  badgeColor: "rgba(16, 185, 129, 0.05)",
                  badgeTextColor: "#10b981",
                  badgeBorder: "rgba(16, 185, 129, 0.15)",
                  level: null,
                  icon: "🧠",
                  title: "脳のメモリを解放する「思考調律」",
                  tagline: "モヤモヤ・イライラをデバッグする、3分の新習慣",
                  desc: (
                    <div style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.5', marginBottom: '14px', textAlign: 'left' }}>
                      <p style={{ margin: '0 0 8px 0' }}>
                        日常生活や仕事でのモヤモヤ・イライラは脳のメモリ（RAM）を浪費し、集中力や判断力を低下させます。
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', background: 'rgba(255, 255, 255, 0.02)', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.04)' }}>
                        <div>
                          <span style={{ color: '#10b981', fontWeight: 'bold', fontSize: '11px' }}>👉 何をするの？</span>
                          <span style={{ display: 'block', fontSize: '12px', marginTop: '1px' }}>本音を書き出して脳内の「認知の偏り」を検出し、客観的な「事実ベース」に書き換えます。</span>
                        </div>
                        <div>
                          <span style={{ color: '#10b981', fontWeight: 'bold', fontSize: '11px' }}>👉 どうなるの？</span>
                          <span style={{ display: 'block', fontSize: '12px', marginTop: '1px' }}>感情的なループ思考が止まり、脳の処理能力が回復して「今やるべきこと」に集中できます。</span>
                        </div>
                      </div>
                    </div>
                  ),
                  actions: (
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                      {(() => {
                        const todayStr = new Date().toLocaleDateString('sv'); // YYYY-MM-DD
                        const isTuningCompletedToday = gameState.lastTuningDate === todayStr;
                        return isTuningCompletedToday ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                            <div style={{ display: 'flex', gap: '8px', width: '100%', flexWrap: 'wrap' }}>
                              <button 
                                onClick={() => { 
                                  playSound('click'); 
                                  setActiveTab('mindTuningLog'); 
                                  setTimeout(() => {
                                    document.getElementById('tuning-log-section')?.scrollIntoView({ behavior: 'smooth' });
                                  }, 100);
                                }}
                                className="btn btn-secondary"
                                style={{ 
                                  flex: 1.2, 
                                  fontSize: '12px', 
                                  padding: '10px 12px', 
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '4px',
                                  background: 'rgba(16, 185, 129, 0.1)',
                                  border: '1px solid rgba(16, 185, 129, 0.3)',
                                  color: '#10b981',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                <span>✅ 本日の調律完了 (履歴へ)</span>
                              </button>
                              <button 
                                onClick={() => { playSound('click'); setActiveGame('mindTuning'); }} 
                                className="btn btn-primary hover-lift"
                                style={{ 
                                  flex: 1, 
                                  fontSize: '12px', 
                                  padding: '10px 12px', 
                                  background: 'linear-gradient(135deg, var(--color-cyan) 0%, var(--color-primary) 100%)',
                                  boxShadow: '0 4px 15px rgba(6, 182, 212, 0.3)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '4px',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                <span>🔄 もう一度調律する</span>
                              </button>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
                              <button 
                                onClick={() => {
                                  playSound('click');
                                  if (onClearTuningToday) {
                                    onClearTuningToday();
                                  }
                                }}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: 'rgba(255, 255, 255, 0.35)',
                                  fontSize: '10.5px',
                                  cursor: 'pointer',
                                  textDecoration: 'underline',
                                  padding: '2px 0 0 0',
                                  transition: 'color 0.2s',
                                  outline: 'none'
                                }}
                                onMouseEnter={(e) => e.target.style.color = 'var(--color-cyan)'}
                                onMouseLeave={(e) => e.target.style.color = 'rgba(255, 255, 255, 0.35)'}
                              >
                                🧪 [デバッグ] 本日の調律完了状態を解除
                              </button>
                            </div>
                          </div>
                         ) : (
                          <button 
                            onClick={() => { playSound('click'); setActiveGame('mindTuning'); }} 
                            className="btn btn-primary hover-lift tuning-btn-glow"
                            style={{ 
                              flex: 1, 
                              fontSize: '13.5px', 
                              padding: '10px 18px', 
                              background: 'linear-gradient(135deg, var(--color-cyan) 0%, var(--color-primary) 100%)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px'
                            }}
                          >
                            <span>🧠 本日の思考調律を起動 (未)</span>
                            <span className="xp-gold-badge">+100 XP</span>
                          </button>
                        );
                      })()}
                    </div>
                  )
                }
              ];

              const isAccordionOpen = activeSlide === 0 && showBugDetails;

              return (
                <div 
                  className="glass-panel"
                  onMouseEnter={() => setIsHovered(true)}
                  onMouseLeave={() => setIsHovered(false)}
                  style={{
                    padding: isMobile ? '24px 16px' : '32px 24px',
                    borderLeft: `4px solid ${
                      activeSlide === 0 
                        ? (isFullUnlocked ? 'var(--color-primary)' : 'var(--color-cyan)')
                        : (activeSlide === 1 ? 'var(--color-cyan)' : (activeSlide === 2 ? 'var(--color-rose)' : '#10b981'))
                    }`,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    background: 'var(--hero-bg)',
                    position: 'relative',
                    minHeight: isMobile ? 'auto' : '370px',
                    height: (isAccordionOpen || activeSlide === 3 || isMobile) ? 'auto' : '370px',
                    overflow: 'visible',
                    transition: 'border-left-color 0.3s ease'
                  }}
                >
                  <div 
                    key={activeSlide} 
                    className="fade-in"
                    style={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      flexGrow: 1,
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                          <span style={{ 
                            fontSize: '11px', 
                            color: slides[activeSlide].badgeTextColor, 
                            fontWeight: 'bold', 
                            background: slides[activeSlide].badgeColor, 
                            padding: '4px 8px', 
                            borderRadius: '6px', 
                            border: `1px solid ${slides[activeSlide].badgeBorder}` 
                          }}>
                            {slides[activeSlide].badge}
                          </span>
                          {slides[activeSlide].level && (
                            <span style={{ fontSize: '11px', color: 'var(--color-cyan)', fontWeight: 'bold', background: 'rgba(6, 182, 212, 0.05)', padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--color-cyan-glow)' }}>
                              {slides[activeSlide].level}
                            </span>
                          )}
                        </div>

                        {/* Dot & Arrow Indicators */}
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <button
                            onClick={() => {
                              playSound('click');
                              setActiveSlide((prev) => (prev - 1 + slides.length) % slides.length);
                            }}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--text-muted)',
                              opacity: 0.5,
                              cursor: 'pointer',
                              padding: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: '4px',
                              transition: 'all 0.2s ease',
                            }}
                            onMouseEnter={(e) => { 
                              e.currentTarget.style.color = 'var(--color-cyan)'; 
                              e.currentTarget.style.opacity = '1';
                              e.currentTarget.style.background = 'var(--color-cyan-soft)'; 
                            }}
                            onMouseLeave={(e) => { 
                              e.currentTarget.style.color = 'var(--text-muted)'; 
                              e.currentTarget.style.opacity = '0.5';
                              e.currentTarget.style.background = 'transparent'; 
                            }}
                            title="前へ"
                          >
                            <ChevronLeft size={16} />
                          </button>

                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            {slides.map((_, idx) => (
                              <button
                                key={idx}
                                onClick={() => { playSound('click'); setActiveSlide(idx); }}
                                style={{
                                  width: '8px',
                                  height: '8px',
                                  borderRadius: '50%',
                                  background: idx === activeSlide ? 'var(--color-cyan)' : 'var(--text-muted)',
                                  opacity: idx === activeSlide ? 1 : 0.3,
                                  border: 'none',
                                  cursor: 'pointer',
                                  padding: 0,
                                  transition: 'all 0.3s ease'
                                }}
                                title={slides[idx].badge}
                              />
                            ))}
                          </div>

                          <button
                            onClick={() => {
                              playSound('click');
                              setActiveSlide((prev) => (prev + 1) % slides.length);
                            }}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--text-muted)',
                              opacity: 0.5,
                              cursor: 'pointer',
                              padding: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: '4px',
                              transition: 'all 0.2s ease',
                            }}
                            onMouseEnter={(e) => { 
                              e.currentTarget.style.color = 'var(--color-cyan)'; 
                              e.currentTarget.style.opacity = '1';
                              e.currentTarget.style.background = 'var(--color-cyan-soft)'; 
                            }}
                            onMouseLeave={(e) => { 
                              e.currentTarget.style.color = 'var(--text-muted)'; 
                              e.currentTarget.style.opacity = '0.5';
                              e.currentTarget.style.background = 'transparent'; 
                            }}
                            title="次へ"
                          >
                            <ChevronRight size={16} />
                          </button>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                        <span style={{ fontSize: '48px' }}>{slides[activeSlide].icon}</span>
                        <div>
                          <h2 className="text-glow" style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>
                            {slides[activeSlide].title}
                          </h2>
                          <p style={{ color: 'var(--color-primary)', fontWeight: 'bold', fontSize: '13px', margin: '2px 0 0 0' }}>
                            {slides[activeSlide].tagline}
                          </p>
                        </div>
                      </div>

                      {slides[activeSlide].desc}
                    </div>

                    <div>
                      {slides[activeSlide].actions}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Quick Actions Area */}
            {(() => {
              const recGameKey = getRecommendedGameKey(gameState.scores);
              const recGameName = getGameName(recGameKey);
              const todayStr = new Date().toLocaleDateString('sv');
              const isTuningCompletedToday = gameState.lastTuningDate === todayStr;

              return (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                  gap: '16px',
                  marginTop: '20px',
                  marginBottom: '8px'
                }}>
                  {/* Left: Recommended Game Action */}
                  <div 
                    className="glass-panel hover-lift"
                    onClick={() => {
                      playSound('click');
                      setActiveGame(recGameKey);
                    }}
                    style={{
                      padding: '16px 20px',
                      background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.08) 0%, rgba(139, 92, 246, 0.05) 100%)',
                      border: '1px solid rgba(6, 182, 212, 0.2)',
                      borderRadius: '16px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{
                        background: 'linear-gradient(135deg, var(--color-cyan) 0%, var(--color-primary) 100%)',
                        width: '42px',
                        height: '42px',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 0 10px rgba(6, 182, 212, 0.2)'
                      }}>
                        <Award size={20} color="#fff" />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--color-cyan)', fontWeight: 'bold', letterSpacing: '0.5px' }}>
                          🎯 推奨トレーニングを再開
                        </span>
                        <span style={{ fontSize: '14.5px', fontWeight: '800', color: 'var(--text-primary)' }}>
                          「{recGameName}」をプレイ
                        </span>
                      </div>
                    </div>
                    <ChevronRight size={18} style={{ color: 'var(--text-muted)', opacity: 0.7 }} />
                  </div>

                  {/* Right: Daily Mind Tuning Action */}
                  <div 
                    className={`glass-panel hover-lift ${!isTuningCompletedToday ? 'tuning-btn-glow' : ''}`}
                    onClick={() => {
                      playSound('click');
                      setActiveGame('mindTuning');
                    }}
                    style={{
                      padding: '16px 20px',
                      background: isTuningCompletedToday 
                        ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(6, 182, 212, 0.03) 100%)'
                        : 'linear-gradient(135deg, rgba(139, 92, 246, 0.12) 0%, rgba(244, 63, 94, 0.06) 100%)',
                      border: isTuningCompletedToday
                        ? '1px solid rgba(16, 185, 129, 0.2)'
                        : '1px solid rgba(139, 92, 246, 0.3)',
                      borderRadius: '16px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{
                        background: isTuningCompletedToday 
                          ? 'linear-gradient(135deg, #10b981 0%, var(--color-cyan) 100%)'
                          : 'linear-gradient(135deg, var(--color-primary) 0%, #7c3aed 100%)',
                        width: '42px',
                        height: '42px',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: isTuningCompletedToday 
                          ? '0 0 10px rgba(16, 185, 129, 0.2)'
                          : '0 0 12px rgba(139, 92, 246, 0.3)'
                      }}>
                        <Brain size={20} color="#fff" />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ 
                          fontSize: '11px', 
                          color: isTuningCompletedToday ? '#10b981' : 'var(--color-primary)', 
                          fontWeight: 'bold', 
                          letterSpacing: '0.5px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}>
                          🧠 本日の思考調律
                          {!isTuningCompletedToday && (
                            <span className="xp-gold-badge" style={{ fontSize: '9px', padding: '1px 4px' }}>+100 XP</span>
                          )}
                        </span>
                        <span style={{ fontSize: '14.5px', fontWeight: '800', color: 'var(--text-primary)' }}>
                          {isTuningCompletedToday ? '本日完了（再調律する）' : '思考調律を起動（未完了）'}
                        </span>
                      </div>
                    </div>
                    <ChevronRight size={18} style={{ color: 'var(--text-muted)', opacity: 0.7 }} />
                  </div>
                </div>
              );
            })()}

            {/* Tab Navigation */}
            <div 
              className="hide-scrollbar"
              style={{ 
                display: 'flex', 
                gap: '4px', 
                paddingLeft: '16px',
                paddingRight: '16px',
                width: '100%',
                maxWidth: '100%',
                boxSizing: 'border-box',
                zIndex: 2,
                position: 'relative',
                overflowX: 'auto',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                flexWrap: 'nowrap',
                WebkitOverflowScrolling: 'touch',
                marginTop: '24px'
              }}
            >
              {[
                { id: 'training', label: '🎯 トレーニングルーム', count: null },
                { id: 'bugNote', label: '🐛 脳内バグノート', count: (gameState.bugNote || []).filter(b => !b.solved).length },
                { id: 'mindTuningLog', label: '🧠 思考調律ログ', count: (gameState.tuningLog || []).length },
                { id: 'encyclopedia', label: '📖 脳内図鑑', count: `${(gameState.unlockedTypes || ["balancedThinker"]).length}/12` },
                { id: 'achievements', label: '🏆 獲得実績', count: gameState.badges.filter(Boolean).length }
              ].map(tab => {
                const isTabLocked = !isFullUnlocked && tab.id !== 'training' && tab.id !== 'encyclopedia' && tab.id !== 'bugNote' && tab.id !== 'mindTuningLog';
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => { 
                      if (isTabLocked) {
                        playSound('incorrect');
                        return;
                      }
                      playSound('click'); 
                      setActiveTab(tab.id); 
                    }}
                    className={`btn ${isActive ? 'btn-primary' : 'btn-secondary'}`}
                    style={{
                      padding: isActive ? '10px 20px 12px 20px' : '12px 20px',
                      borderTopLeftRadius: '12px',
                      borderTopRightRadius: '12px',
                      borderBottomLeftRadius: '0px',
                      borderBottomRightRadius: '0px',
                      fontSize: '13.5px',
                      fontWeight: 'bold',
                      background: isActive 
                        ? 'var(--glass-bg)' 
                        : 'rgba(255, 255, 255, 0.02)',
                      color: isActive ? 'var(--color-primary)' : 'var(--text-secondary)',
                      textShadow: isActive ? '0 0 8px var(--color-primary-glow)' : 'none',
                      border: '1px solid var(--border-color)',
                      borderTop: isActive ? '3px solid var(--color-primary)' : '1px solid var(--border-color)',
                      borderBottom: isActive ? '1px solid transparent' : '1px solid var(--border-color)',
                      boxShadow: isActive ? '0 -4px 12px rgba(139, 92, 246, 0.1)' : 'none',
                      marginBottom: '-1px',
                      zIndex: isActive ? 3 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: isTabLocked ? 'not-allowed' : 'pointer',
                      opacity: isTabLocked ? 0.5 : (isActive ? 1 : 0.65),
                      transition: 'all 0.15s ease-in-out',
                      whiteSpace: 'nowrap'
                    }}
                    title={isTabLocked ? "最初のゲームクリアで解放されます" : tab.label}
                  >
                    <span>{isTabLocked ? `🔒 ${tab.label}` : tab.label}</span>
                    {tab.count !== null && (
                      <span 
                        style={{ 
                          fontSize: '11px', 
                          background: isActive ? 'var(--color-primary-soft)' : 'rgba(255, 255, 255, 0.05)',
                          color: isActive ? 'var(--color-primary)' : 'var(--text-muted)',
                          padding: '2px 6px',
                          borderRadius: '6px',
                          marginLeft: '4px',
                          fontWeight: 'bold',
                          border: isActive ? '1px solid rgba(139, 92, 246, 0.15)' : 'none'
                        }}
                      >
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Tab Contents */}
            <div 
              className="glass-panel"
              style={{
                borderTopLeftRadius: '0px',
                borderTopRightRadius: '16px',
                borderBottomLeftRadius: '16px',
                borderBottomRightRadius: '16px',
                border: '1px solid var(--border-color)',
                background: 'var(--glass-bg)',
                padding: isMobile ? '16px 10px' : '32px 28px',
                position: 'relative',
                zIndex: 1,
                marginTop: '-1px'
              }}
            >
            {activeTab === 'training' && (
              <div className="fade-in" style={{ marginTop: '0px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <h2 id="training-menu" style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                    <TrendingUp size={20} style={{ color: 'var(--color-primary)' }} />
                    {isFullUnlocked 
                      ? (mode === 'daily' ? '思考トレーニングルーム（日常編・入門）' : '思考トレーニングルーム（ビジネス編）')
                      : 'シングルフォーカストレーニングルーム'
                    }
                  </h2>

                  <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.5', margin: '0' }}>
                    思考のクセ（弱点）を克服し、脳内OSをデバッグするためのトレーニングゲームです。
                    出題されるシチュエーションを元に、事実と意見の選別や論理の歪みを特定し、ベストスコア100%を目指して各部屋のクイズに挑戦しましょう。
                  </p>

                  {/* Unified Rooms View */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {rooms.map(room => {
                      const isRoomUnlocked = isFullUnlocked || (primaryDebugCategory === room.id);
                      return (
                        <div 
                          key={room.id}
                          className="glass-panel"
                          style={{
                            padding: isMobile ? '16px 12px' : '24px',
                            border: `1px solid var(--border-color)`,
                            borderLeft: `5px solid ${room.borderColor}`,
                            background: isRoomUnlocked ? 'var(--glass-bg)' : 'var(--bg-badge-locked)',
                            borderRadius: '16px',
                            opacity: isRoomUnlocked ? 1 : 0.45,
                            transition: 'all 0.3s ease',
                            position: 'relative'
                          }}
                        >
                          {/* Lock banner overlay for locked rooms */}
                          {!isRoomUnlocked && (
                            <div style={{
                              position: 'absolute',
                              top: '12px',
                              right: '16px',
                              background: 'rgba(10, 11, 16, 0.6)',
                              border: '1px solid var(--border-color)',
                              padding: '4px 10px',
                              borderRadius: '8px',
                              fontSize: '11px',
                              color: 'var(--text-muted)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              zIndex: 2
                            }}>
                              <Lock size={12} />
                              <span>初回プレイクリアでアンロック</span>
                            </div>
                          )}

                          {/* Room Header */}
                          <div style={{ marginBottom: '20px' }}>
                            <h3 style={{ 
                              fontSize: '18px', 
                              fontWeight: 'bold', 
                              color: isRoomUnlocked ? 'var(--text-primary)' : 'var(--text-secondary)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              margin: 0
                            }}>
                              {room.title}
                            </h3>
                            <p style={{ 
                              color: 'var(--text-muted)', 
                              fontSize: '12px', 
                              margin: '6px 0 0 0',
                              lineHeight: '1.4'
                            }}>
                              {room.description}
                            </p>
                          </div>

                          {/* Room Content (Games & Spinoffs) */}
                          <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))', 
                            gap: isMobile ? '12px' : '20px' 
                          }}>
                            {/* Active Games */}
                            {room.games.map(game => {
                              const score = gameState.scores[game.scoreKey] || 0;
                              return (
                                <div 
                                  key={game.id}
                                  onClick={() => {
                                    if (!isRoomUnlocked) {
                                      playSound('incorrect');
                                      return;
                                    }
                                    playSound('click');
                                    setActiveGame(game.id);
                                  }}
                                  className={`glass-panel ${isRoomUnlocked ? 'hover-lift' : ''} room-${room.id}`}
                                  style={{ 
                                    padding: isMobile ? '16px 12px' : '20px', 
                                    cursor: isRoomUnlocked ? 'pointer' : 'not-allowed',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '12px',
                                    transition: 'all 0.2s ease',
                                    position: 'relative'
                                  }}
                                >
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <div style={{ color: room.textColor, fontSize: '11px', fontWeight: 'bold', letterSpacing: '0.5px' }}>
                                      {game.moduleNum}
                                    </div>
                                    {!isRoomUnlocked && (
                                      <Lock size={12} style={{ color: 'var(--text-muted)' }} />
                                    )}
                                  </div>
                                  <h4 style={{ 
                                    fontSize: '16px', 
                                    fontWeight: 'bold', 
                                    marginBottom: '8px', 
                                    color: isRoomUnlocked ? 'var(--text-primary)' : 'var(--text-secondary)',
                                    margin: '0 0 8px 0'
                                  }}>
                                    {game.name}
                                  </h4>
                                  <p style={{ 
                                    color: 'var(--text-secondary)', 
                                    fontSize: '12px', 
                                    lineHeight: '1.5', 
                                    marginBottom: '16px',
                                    minHeight: '36px' 
                                  }}>
                                    {game.desc}
                                  </p>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
                                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>難易度: {game.difficulty}</span>
                                    <span style={{ fontSize: '12px', color: room.textColor, fontWeight: 'bold' }}>
                                      ベスト: {score}%
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                            {/* Spinoff Cards (Moved to Debug Lab) */}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* プロフェッショナル（上級）ステージへの扉バナー */}
                  <div style={{ marginTop: '32px' }}>
                    {gameState.level >= 5 ? (
                      /* アンロック状態 */
                      <div 
                        className="glass-panel lab-banner-active"
                        style={{
                           padding: '24px 32px',
                           background: 'linear-gradient(135deg, var(--color-primary-soft) 0%, var(--glass-bg) 100%)',
                           border: '1px solid var(--color-primary)',
                           borderLeft: '5px solid var(--color-primary)',
                           borderRadius: '16px',
                           display: 'flex',
                           justifyContent: 'space-between',
                           alignItems: 'center',
                           flexWrap: 'wrap',
                           gap: '20px',
                           boxShadow: 'var(--glass-shadow)',
                           position: 'relative',
                           overflow: 'hidden'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <span className="lab-gate-icon" style={{ fontSize: '32px', display: 'inline-block' }}>🔬</span>
                          <div style={{ textAlign: 'left' }}>
                            <span style={{ fontSize: '11px', color: 'var(--color-primary)', fontWeight: 'bold', letterSpacing: '1px' }}>
                              UNLOCKED SPECIAL GATE
                            </span>
                            <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--text-primary)', margin: '4px 0 0 0', fontFamily: 'var(--font-display)' }}>
                              脳内デバッグ・ラボへアクセス
                            </h3>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '12px', marginTop: '4px', margin: 0 }}>
                              応用診断モジュール『Fallacy Hunter』等のデバッグセッションが解放されました。
                            </p>
                          </div>
                        </div>
                        <button 
                          onClick={() => { playSound('success'); setActiveGame('debugLab'); }}
                          className="btn btn-primary lab-enter-btn" 
                          style={{ 
                            padding: '10px 24px', 
                            fontSize: '13px', 
                            background: 'linear-gradient(135deg, var(--color-primary) 0%, #7c3aed 100%)', 
                            boxShadow: '0 4px 12px var(--color-primary-glow)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            cursor: 'pointer',
                            borderRadius: '8px',
                            border: 'none',
                            fontWeight: 'bold',
                            color: '#ffffff'
                          }}
                        >
                          <span>ラボに入る</span>
                          <span className="arrow-icon" style={{ display: 'inline-block' }}>→</span>
                        </button>
                      </div>
                    ) : (
                      /* ロック状態 */
                      <div 
                        onClick={() => playSound('incorrect')}
                        className="glass-panel"
                        style={{
                          padding: '24px 32px',
                          background: 'var(--bg-badge-locked)',
                          border: '1px solid var(--border-color)',
                          borderLeft: '5px solid var(--border-color)',
                          borderRadius: '16px',
                          opacity: 0.5,
                          cursor: 'not-allowed',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: '20px'
                        }}
                        title="レベル5に到達すると解放されます"
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <span style={{ fontSize: '32px', filter: 'grayscale(100%)' }}>🔒</span>
                          <div style={{ textAlign: 'left' }}>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'bold', letterSpacing: '1px' }}>
                              LOCKED GATE
                            </span>
                            <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--text-secondary)', margin: '4px 0 0 0', fontFamily: 'var(--font-display)' }}>
                              脳内デバッグ・ラボ
                            </h3>
                            <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '4px', margin: 0 }}>
                              アンロック条件：レベル5に到達する（現在のレベル: {gameState.level}）
                            </p>
                          </div>
                        </div>
                        <div 
                          style={{ 
                            padding: '10px 20px', 
                            fontSize: '13px', 
                            background: 'var(--bg-inner-box)', 
                            border: '1px solid var(--border-color)', 
                            color: 'var(--text-muted)', 
                            borderRadius: '12px',
                            fontWeight: 'bold'
                          }}
                        >
                          ロック中
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'encyclopedia' && (
              <div className="fade-in" style={{ marginTop: '0px' }}>
                <section style={{ textAlign: 'left' }}>
                  {/* Title of 脳内図鑑 */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                      <BookOpen size={20} style={{ color: 'var(--color-primary)' }} />
                      脳内図鑑
                    </h2>
                    
                    {/* Sub-tab Navigation */}
                    <div style={{ display: 'inline-flex', padding: '4px', borderRadius: '12px', background: 'var(--bg-inner-box)', border: '1px solid var(--border-color)' }}>
                      <button
                        onClick={() => { playSound('click'); setLibrarySubTab('bug'); }}
                        className={`btn ${librarySubTab === 'bug' ? 'btn-primary' : 'btn-secondary'}`}
                        style={{
                          borderRadius: '8px',
                          padding: '6px 14px',
                          fontSize: '12.5px',
                          fontWeight: 'bold',
                          background: librarySubTab === 'bug' ? 'linear-gradient(135deg, var(--color-cyan) 0%, var(--color-primary) 100%)' : 'transparent',
                          color: librarySubTab === 'bug' ? '#fff' : 'var(--text-secondary)',
                          border: 'none',
                          boxShadow: librarySubTab === 'bug' ? '0 0 10px rgba(6, 182, 212, 0.3)' : 'none',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                        }}
                      >
                        🐛 脳内バグ ({ (gameState.unlockedTypes || ["balancedThinker"]).length }/12)
                      </button>
                      <button
                        onClick={() => { playSound('click'); setLibrarySubTab('skill'); }}
                        className={`btn ${librarySubTab === 'skill' ? 'btn-primary' : 'btn-secondary'}`}
                        style={{
                          borderRadius: '8px',
                          padding: '6px 14px',
                          fontSize: '12.5px',
                          fontWeight: 'bold',
                          background: librarySubTab === 'skill' ? 'linear-gradient(135deg, var(--color-cyan) 0%, var(--color-primary) 100%)' : 'transparent',
                          color: librarySubTab === 'skill' ? '#fff' : 'var(--text-secondary)',
                          border: 'none',
                          boxShadow: librarySubTab === 'skill' ? '0 0 10px rgba(6, 182, 212, 0.3)' : 'none',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                        }}
                      >
                        💡 思考スキル ({ skillsData.filter(skill => (gameState.scores[skill.id] || 0) >= 80).length }/{ skillsData.length })
                      </button>
                    </div>
                  </div>

                  {librarySubTab === 'bug' ? (
                    /* 脳内バグ図鑑のコンテンツ */
                    <div className="fade-in">
                      <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.5', marginBottom: '24px' }}>
                        診断や他人のスキャン、相性チェック（コード共有）によって見つかった思考バグのタイプがここに記録されます。
                        他人のブレインコードを入力するか、他者スキャンを行うことで図鑑が埋まっていきます。
                      </p>

                      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))', gap: isMobile ? '12px' : '20px' }}>
                        {Object.values(diagnosticTypes).map((type) => {
                          const isUnlocked = (gameState.unlockedTypes || ["balancedThinker"]).includes(type.id);
                          const isSelected = selectedBugId === type.id;

                          return (
                            <div 
                              key={type.id}
                              className="glass-panel"
                              style={{
                                padding: isMobile ? '16px 12px' : '20px',
                                background: isUnlocked 
                                  ? (isSelected ? 'rgba(139, 92, 246, 0.08)' : 'var(--glass-bg)')
                                  : 'var(--bg-badge-locked)',
                                border: `1px solid ${isUnlocked ? (isSelected ? 'var(--color-primary)' : 'var(--border-color)') : 'var(--border-color)'}`,
                                borderLeft: isUnlocked ? `4px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-cyan)'}` : '4px solid var(--border-color)',
                                opacity: isUnlocked ? 1 : 0.45,
                                borderRadius: '12px',
                                transition: 'all 0.3s ease',
                                cursor: isUnlocked ? 'pointer' : 'default'
                              }}
                              onClick={() => {
                                if (isUnlocked) {
                                  playSound('click');
                                  setSelectedBugId(isSelected ? null : type.id);
                                }
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                                <span style={{ fontSize: '32px', filter: isUnlocked ? 'none' : 'grayscale(100%) opacity(0.3)' }}>
                                  {isUnlocked ? type.emoji : '🔒'}
                                </span>
                                <div>
                                  <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: isUnlocked ? 'var(--text-primary)' : 'var(--text-muted)', margin: 0 }}>
                                    {isUnlocked ? type.name : '未確認の脳内バグ (???)'}
                                  </h3>
                                  {isUnlocked && (
                                    <p style={{ fontSize: '11px', color: 'var(--color-cyan)', fontWeight: 'bold', margin: '2px 0 0 0' }}>
                                      {type.tagline}
                                    </p>
                                  )}
                                </div>
                              </div>

                              <p style={{ color: 'var(--text-secondary)', fontSize: '12.5px', lineHeight: '1.6', margin: 0 }}>
                                {isUnlocked 
                                  ? (type.description.length > 80 && !isSelected ? `${type.description.slice(0, 80)}...` : type.description)
                                  : '他人のスキャンやコード入力（相性チェック）を行うとアンロックされます。'
                                }
                              </p>

                              {/* アコーディオン詳細情報 */}
                              {isUnlocked && isSelected && (
                                <div 
                                  className="fade-in"
                                  style={{ 
                                    marginTop: '16px', 
                                    paddingTop: '16px', 
                                    borderTop: '1px solid rgba(255,255,255,0.06)',
                                    display: 'flex', 
                                    flexDirection: 'column', 
                                    gap: '12px' 
                                  }}
                                  onClick={(e) => e.stopPropagation()} // 親のクリックイベントを防ぐ
                                >
                                  <div style={{ background: 'var(--bg-inner-box)', border: '1px solid var(--border-color)', padding: '10px 12px', borderRadius: '8px' }}>
                                    <span style={{ fontSize: '11px', color: 'var(--color-cyan)', fontWeight: 'bold' }}>💼 仕事でのバグ</span>
                                    <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>{type.workBug}</p>
                                  </div>
                                  <div style={{ background: 'var(--bg-inner-box)', border: '1px solid var(--border-color)', padding: '10px 12px', borderRadius: '8px' }}>
                                    <span style={{ fontSize: '11px', color: '#f43f5e', fontWeight: 'bold' }}>🏡 私生活でのバグ</span>
                                    <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>{type.privateBug}</p>
                                  </div>
                                  <div style={{ background: 'var(--bg-inner-box)', border: '1px solid var(--border-color)', padding: '10px 12px', borderRadius: '8px' }}>
                                    <span style={{ fontSize: '11px', color: '#f59e0b', fontWeight: 'bold' }}>⚡ ふとした瞬間のクセ</span>
                                    <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>{type.dailyHabit}</p>
                                  </div>
                                  <div style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid var(--border-color)', padding: '10px 12px', borderRadius: '8px' }}>
                                    <span style={{ display: 'block', fontSize: '11px', color: '#10b981', fontWeight: 'bold', marginBottom: '4px' }}>📋 取扱説明書</span>
                                    <span style={{ display: 'block', fontSize: '10px', color: '#f43f5e', fontWeight: 'bold' }}>● 地雷ポイント</span>
                                    <p style={{ margin: '2px 0 6px 0', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>{type.torisetsu.jealousPoint}</p>
                                    <span style={{ display: 'block', fontSize: '10px', color: '#10b981', fontWeight: 'bold' }}>● デバッグコマンド</span>
                                    <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>{type.torisetsu.debugSpell}</p>
                                  </div>
                                  {type.recommendedGame && (
                                    <div style={{ background: 'rgba(139, 92, 246, 0.05)', border: '1px solid var(--border-color)', padding: '10px 12px', borderRadius: '8px' }}>
                                      <span style={{ fontSize: '11px', color: 'var(--color-primary)', fontWeight: 'bold' }}>🎯 推奨デバッグトレーニング</span>
                                      <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>{type.recommendedReason}</p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    /* 思考スキル図鑑のコンテンツ */
                    <div className="fade-in">
                      <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.5', marginBottom: '20px' }}>
                        習得した思考スキルの概念と、それを日常生活や仕事でどう活用すべきかの実践的なアプローチを学べる解説書です。
                        各スキルのトレーニングでベストスコア80%以上を獲得すると、解説ページがアンロックされます。
                      </p>

                      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(320px, 1fr))", gap: isMobile ? "12px" : "20px" }}>
                        {skillsData.map((skill) => {
                          const score = gameState.scores[skill.id] || 0;
                          const isUnlocked = score >= 80;

                          return (
                            <div 
                              key={skill.id}
                              className={`glass-panel skill-card ${isUnlocked ? 'unlocked' : ''}`}
                              style={{ 
                                borderLeftColor: isUnlocked ? 'var(--color-primary)' : 'var(--border-color)',
                                opacity: isUnlocked ? 1 : 0.6
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '10px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  {isUnlocked ? (
                                    <Unlock size={18} style={{ color: 'var(--color-primary)' }} />
                                  ) : (
                                    <Lock size={18} style={{ color: 'var(--text-muted)' }} />
                                  )}
                                  <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: isUnlocked ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                                    {skill.name}
                                  </h3>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '220px' }}>
                                  <div style={{ flex: 1, height: '6px', background: 'var(--bg-inner-box)', borderRadius: '3px', overflow: 'hidden' }}>
                                    <div 
                                      style={{ 
                                        height: '100%', 
                                        width: `${score}%`, 
                                        background: isUnlocked ? 'var(--color-primary)' : 'var(--text-muted)',
                                        borderRadius: '3px'
                                      }} 
                                    />
                                  </div>
                                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: isUnlocked ? 'var(--color-primary)' : 'var(--text-muted)', width: '80px', textAlign: 'right' }}>
                                    {isUnlocked ? '習得完了' : `進捗 ${score}/80%`}
                                  </span>
                                </div>
                              </div>

                              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.5', marginBottom: '12px' }}>
                                {skill.desc}
                              </p>

                              {isUnlocked ? (
                                <div 
                                  className="fade-in"
                                  style={{ 
                                    background: 'rgba(139, 92, 246, 0.03)', 
                                    border: '1px solid rgba(139, 92, 246, 0.1)', 
                                    borderRadius: '8px', 
                                    padding: '12px 16px', 
                                    fontSize: '13px',
                                    lineHeight: '1.5'
                                  }}
                                >
                                  <strong style={{ color: 'var(--color-primary)', display: 'block', marginBottom: '6px' }}>
                                    💡 現実社会での具体的な活かし方:
                                  </strong>
                                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
                                    <div>
                                      <span style={{ color: 'var(--text-primary)', fontWeight: 'bold', fontSize: '12px' }}>【仕事・学業】</span>
                                      <p style={{ color: 'var(--text-secondary)', marginTop: '2px', fontSize: '12px' }}>{skill.lifeApplication.work}</p>
                                    </div>
                                    <div>
                                      <span style={{ color: 'var(--text-primary)', fontWeight: 'bold', fontSize: '12px' }}>【プライベート】</span>
                                      <p style={{ color: 'var(--text-secondary)', marginTop: '2px', fontSize: '12px' }}>{skill.lifeApplication.private}</p>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <p style={{ color: 'var(--text-muted)', fontSize: '11px', fontStyle: 'italic' }}>
                                  ※このスキルトレーニングで80%以上のベストスコアを獲得すると、解説書がアンロックされます。
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </section>
              </div>
            )}

            {activeTab === 'bugNote' && (
              <div className="fade-in" style={{ marginTop: '0px' }}>
                <section style={{ textAlign: 'left' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                      <Brain size={20} style={{ color: 'var(--color-cyan)' }} />
                      脳内バグノート
                    </h2>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)', background: 'var(--bg-inner-box)', border: '1px solid var(--border-color)', padding: '4px 12px', borderRadius: '12px', fontWeight: 'bold' }}>
                      未解決バグ: {(gameState.bugNote || []).filter(b => !b.solved).length} 件
                    </span>
                  </div>

                  <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.5', marginBottom: '24px' }}>
                    トレーニングゲームや診断で間違えた問題、または強制突破（Force Solve）した問題が、自動的に「脳内バグ」として記録されます。
                    各カードの「デバッグ起動」ボタンを押すと、その問題のみを対象とした1問限定のデバッグモード（復習）が始まります。
                    デバッグに成功すると <b>+50 XP</b> のボーナスを獲得できます！
                  </p>

                  {/* 累積スタッツ & 弱点分析 */}
                  {(() => {
                    const bugs = gameState.bugNote || [];
                    
                    const getCategoryStats = (gameId) => {
                      switch (gameId) {
                        case 'factsOpinions':
                        case 'logicalValidity':
                          return { name: 'ロジカル思考', color: 'var(--color-cyan)', room: 'logical' };
                        case 'fallacy':
                        case 'hiddenAssumption':
                        case 'fallacyHunter':
                          return { name: 'クリティカル思考', color: 'var(--color-rose)', room: 'critical' };
                        case 'logicTree':
                        case 'causalLoop':
                        case 'treeQuest':
                          return { name: 'ラディカル思考', color: 'var(--color-amber)', room: 'radical' };
                        case 'empathyDialogue':
                        case 'assertiveRewrite':
                        case 'eqSimulator':
                          return { name: 'エモーショナル思考', color: 'var(--color-primary)', room: 'emotional' };
                        default:
                          return { name: 'その他', color: 'var(--text-muted)', room: 'other' };
                      }
                    };

                    const categoryCounts = {
                      logical: { active: 0, total: 0, name: 'ロジカル思考', color: 'var(--color-cyan)' },
                      critical: { active: 0, total: 0, name: 'クリティカル思考', color: 'var(--color-rose)' },
                      radical: { active: 0, total: 0, name: 'ラディカル思考', color: 'var(--color-amber)' },
                      emotional: { active: 0, total: 0, name: 'エモーショナル思考', color: 'var(--color-primary)' }
                    };

                    bugs.forEach(b => {
                      const cat = getCategoryStats(b.gameId);
                      if (categoryCounts[cat.room]) {
                        categoryCounts[cat.room].total++;
                        if (!b.solved) {
                          categoryCounts[cat.room].active++;
                        }
                      }
                    });

                    const GAME_NAMES = {
                      factsOpinions: '事実 vs 意見',
                      logicalValidity: '論理の妥当性',
                      logicTree: 'ロジックツリー',
                      fallacy: '論理的誤謬の特定',
                      hiddenAssumption: '前提・隠れた仮定のデバッグ',
                      causalLoop: '因果ループ＆ボトルネック',
                      empathyDialogue: '共感対話トレーニング',
                      assertiveRewrite: 'アサーティブ・リライター',
                      fallacyHunter: 'Fallacy Hunter (ラボ)',
                      treeQuest: 'Tree Quest (ラボ)',
                      eqSimulator: 'EQ・共感対話シミュレーター'
                    };

                    if (bugs.length === 0) {
                      return (
                        <div className="glass-panel" style={{ padding: '32px', textAlign: 'center', background: 'var(--bg-inner-box)', border: '1px solid var(--border-color)', borderRadius: '16px' }}>
                          <span style={{ fontSize: '48px', display: 'block', marginBottom: '16px' }}>✨</span>
                          <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--text-primary)', margin: '0 0 8px 0' }}>脳内バグは検出されていません</h3>
                          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: 0, maxWidth: '480px', marginLeft: 'auto', marginRight: 'auto', lineHeight: '1.6' }}>
                            現在、すべての思考回路が正常に動作しています。トレーニングルームやラボのゲームで不正解になると、自動的にバグが検出されここに記録されます。
                          </p>
                        </div>
                      );
                    }

                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        {/* カテゴリー別集計バー */}
                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(180px, 1fr))', gap: isMobile ? '12px' : '16px' }}>
                          {Object.entries(categoryCounts).map(([key, value]) => {
                            const percent = value.total > 0 ? Math.round(((value.total - value.active) / value.total) * 100) : 100;
                            return (
                              <div key={key} className="glass-panel" style={{ padding: isMobile ? '12px' : '16px', background: 'var(--glass-bg)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                  <span style={{ fontSize: '13px', fontWeight: 'bold', color: value.color }}>{value.name}</span>
                                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>デバッグ率: {percent}%</span>
                                </div>
                                <div style={{ fontSize: '18px', fontWeight: '800', margin: '4px 0', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                                  {value.active} <span style={{ fontSize: '11px', fontWeight: 'normal', color: 'var(--text-muted)' }}>件未解決 / {value.total} 件検出</span>
                                </div>
                                <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden', marginTop: '8px' }}>
                                  <div style={{ height: '100%', background: value.color, width: `${percent}%`, borderRadius: '3px', transition: 'width 0.5s ease' }} />
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* バグ一覧リスト */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          <h3 style={{ fontSize: '15px', fontWeight: 'bold', margin: '8px 0 0 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>📋 デバッグ対象のバグ一覧</span>
                            <span style={{ fontSize: '11px', fontWeight: 'normal', color: 'var(--text-muted)' }}>(未解決バグを優先表示)</span>
                          </h3>
                          
                          {/* ソート: solved が false のものを上に、日付順（新しいものを上に） */}
                          {[...bugs].sort((a, b) => {
                            if (a.solved !== b.solved) {
                              return a.solved ? 1 : -1;
                            }
                            return b.timestamp - a.timestamp;
                          }).map(bug => {
                            const cat = getCategoryStats(bug.gameId);
                            const gameName = GAME_NAMES[bug.gameId] || bug.gameId;
                            const formattedTime = new Date(bug.timestamp).toLocaleString('ja-JP', {
                              year: 'numeric', month: '2-digit', day: '2-digit',
                              hour: '2-digit', minute: '2-digit'
                            });

                            return (
                              <div 
                                key={bug.id} 
                                className="glass-panel" 
                                style={{ 
                                  padding: isMobile ? '16px 12px' : '20px', 
                                  background: bug.solved ? 'rgba(255,255,255,0.01)' : 'var(--glass-bg)',
                                  border: bug.solved ? '1px solid rgba(255,255,255,0.05)' : `1px solid ${cat.color}`,
                                  borderLeft: `5px solid ${bug.solved ? 'var(--text-muted)' : cat.color}`,
                                  borderRadius: '12px',
                                  transition: 'all 0.3s ease',
                                  opacity: bug.solved ? 0.7 : 1
                                }}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                                  <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                      <span 
                                        style={{ 
                                          fontSize: '11px', 
                                          fontWeight: 'bold', 
                                          color: bug.solved ? 'var(--text-muted)' : cat.color,
                                          background: bug.solved ? 'rgba(255,255,255,0.05)' : `${cat.color}15`,
                                          padding: '2px 8px',
                                          borderRadius: '4px'
                                        }}
                                      >
                                        {cat.name}
                                      </span>
                                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                        検出日時: {formattedTime}
                                      </span>
                                    </div>
                                    <h4 style={{ fontSize: '16px', fontWeight: 'bold', margin: '8px 0 0 0', color: bug.solved ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                                      {gameName} <span style={{ fontSize: '12px', fontWeight: 'normal', color: 'var(--text-muted)' }}>(ID: {bug.questionId})</span>
                                    </h4>
                                  </div>

                                  <div>
                                    {bug.solved ? (
                                      <span style={{ fontSize: '11px', color: 'var(--color-emerald)', background: 'rgba(16,185,129,0.1)', padding: '4px 10px', borderRadius: '6px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                        ✅ デバッグ完了 (+50 XP)
                                      </span>
                                    ) : (
                                      <span style={{ fontSize: '11px', color: cat.color, background: `${cat.color}15`, padding: '4px 10px', borderRadius: '6px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                        👾 バグアクティブ
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* エラー詳細ターミナル */}
                                <div style={{ marginTop: '12px' }}>
                                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', fontFamily: 'monospace' }}>
                                    $ logifit-scanner --check-error
                                  </div>
                                  <div 
                                    style={{ 
                                      background: 'rgba(0,0,0,0.25)', 
                                      border: '1px solid var(--border-color)', 
                                      borderRadius: '8px', 
                                      padding: '12px', 
                                      fontFamily: 'monospace', 
                                      fontSize: '12px', 
                                      color: bug.solved ? 'var(--text-muted)' : 'var(--color-cyan)', 
                                      whiteSpace: 'pre-wrap',
                                      lineHeight: '1.5'
                                    }}
                                  >
                                    {bug.wrongAnswerDetails || '原因コード: スキャン失敗 / 判定タイムアウト'}
                                  </div>
                                </div>

                                {/* デバッグ起動ボタン */}
                                {!bug.solved && (
                                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                                    <button
                                      onClick={() => onStartReview(bug.gameId, bug.questionId)}
                                      className="btn btn-primary"
                                      style={{
                                        background: `linear-gradient(135deg, ${cat.color} 0%, #7c3aed 100%)`,
                                        boxShadow: `0 0 12px ${cat.color}35`,
                                        fontSize: '12.5px',
                                        padding: '8px 20px',
                                        borderRadius: '8px',
                                        border: 'none',
                                        fontWeight: 'bold',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                      }}
                                    >
                                      <span>⚡ デバッグ起動 (復習)</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                </section>
              </div>
            )}

            {activeTab === 'mindTuningLog' && (
              <div id="tuning-log-section" className="fade-in" style={{ marginTop: '0px' }}>
                <section style={{ textAlign: 'left' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                      <Brain size={20} style={{ color: 'var(--color-cyan)' }} />
                      脳内デバッグ・思考調律ログ
                    </h2>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)', background: 'var(--bg-inner-box)', border: '1px solid var(--border-color)', padding: '4px 12px', borderRadius: '12px', fontWeight: 'bold' }}>
                      調律回数: {(gameState.tuningLog || []).length} 回
                    </span>
                  </div>

                  <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.5', marginBottom: '24px' }}>
                    日々のイライラ、モヤモヤ、落ち込み等の感情ノイズをスキャンし、客観的「事実」ベースにリファクタリング（デバッグ）した履歴です。
                    過去7日分のデバッグ記録を遡って振り返ることができます。
                  </p>

                  {(!gameState.tuningLog || gameState.tuningLog.length === 0) ? (
                    <div className="glass-panel" style={{ padding: '32px', textAlign: 'center', background: 'var(--bg-inner-box)', border: '1px solid var(--border-color)', borderRadius: '16px' }}>
                      <span style={{ fontSize: '48px', display: 'block', marginBottom: '16px' }}>📝</span>
                      <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--text-primary)', margin: '0 0 8px 0' }}>調律ログはまだ記録されていません</h3>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: 0, maxWidth: '480px', marginLeft: 'auto', marginRight: 'auto', lineHeight: '1.6' }}>
                        プロファイルカード内の「本日の思考調律」から最初のジャーナリングデバッグを行うと、ここにBefore/Afterの対比ログが蓄積されていきます。
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      {gameState.tuningLog.map((log) => {
                        const formattedTime = new Date(log.timestamp).toLocaleDateString('ja-JP', {
                          year: 'numeric', month: '2-digit', day: '2-digit',
                          hour: '2-digit', minute: '2-digit'
                        });
                        const vibeIcons = {
                          anxious: '🌀',
                          irritated: '😤',
                          sad: '🌧️',
                          rushed: '⏰',
                          flat: '🍵'
                        };
                        const vibeLabels = {
                          anxious: 'モヤモヤ・不安',
                          irritated: 'イライラ・不満',
                          sad: '落ち込み・後悔',
                          rushed: '焦り・義務感',
                          flat: '特にない（フラット）'
                        };

                        return (
                          <div 
                            key={log.id} 
                            className="glass-panel" 
                            style={{ 
                              padding: '20px', 
                              background: 'var(--glass-bg)',
                              border: '1px solid var(--border-color)',
                              borderLeft: `5px solid ${log.vibe === 'anxious' ? 'var(--color-cyan)' : log.vibe === 'irritated' ? 'var(--color-rose)' : log.vibe === 'sad' ? '#818cf8' : log.vibe === 'rushed' ? 'var(--color-amber)' : '#10b981'}`,
                              borderRadius: '12px',
                              transition: 'all 0.3s ease'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '18px' }}>{vibeIcons[log.vibe] || '📝'}</span>
                                <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                                  {vibeLabels[log.vibe] || '思考調律'}
                                </span>
                                {log.biases && log.biases.map((bias, bIdx) => (
                                  <span 
                                    key={bIdx}
                                    style={{ 
                                      fontSize: '10px', 
                                      fontWeight: 'bold', 
                                      color: 'var(--color-rose)', 
                                      background: 'rgba(244, 63, 94, 0.08)',
                                      border: '1px solid rgba(244, 63, 94, 0.15)',
                                      padding: '1px 6px',
                                      borderRadius: '4px'
                                    }}
                                  >
                                    {bias}
                                  </span>
                                ))}
                              </div>
                              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                {formattedTime}
                              </span>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                              <div style={{ background: 'rgba(244, 63, 94, 0.02)', padding: '12px 14px', borderRadius: '8px', borderLeft: '3px solid #f43f5e' }}>
                                <span style={{ display: 'block', fontSize: '10.5px', color: '#f43f5e', fontWeight: 'bold', marginBottom: '4px' }}>🔴 デバッグ前 (生の本音)</span>
                                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5', fontStyle: 'italic' }}>
                                  「{log.rawText}」
                                </p>
                              </div>
                              <div style={{ background: 'rgba(16, 185, 129, 0.04)', padding: '12px 14px', borderRadius: '8px', borderLeft: '3px solid #10b981' }}>
                                <span style={{ display: 'block', fontSize: '10.5px', color: '#10b981', fontWeight: 'bold', marginBottom: '4px' }}>🟢 デバッグ後 (事実ベース)</span>
                                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-primary)', lineHeight: '1.5', fontWeight: '500' }}>
                                  「{log.refactoredText}」
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>
              </div>
            )}

            {activeTab === 'achievements' && (
              <div className="fade-in" style={{ marginTop: '0px' }}>
                {/* Achievements Section */}
                <section style={{ textAlign: 'left' }}>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', margin: '0' }}>
                    <Award size={20} style={{ color: 'var(--color-primary)' }} />
                    獲得バッジ・実績
                  </h2>

                  <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.5', margin: '12px 0 20px 0' }}>
                    日々の思考トレーニングの成果やレベルアップ、特定条件の達成に応じて授与される誇るべき実績称号（バッジ）の一覧です。
                    さらに高いスコアや多様なトレーニングの全制覇を目指して、すべてのバッジをアンロックしましょう！
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(auto-fill, minmax(130px, 1fr))' : 'repeat(auto-fill, minmax(220px, 1fr))', gap: isMobile ? '10px' : '16px' }}>
                    {badgeDetails.map((badge, idx) => {
                      const isUnlocked = gameState.badges[idx];
                      return (
                        <div 
                          key={idx}
                          className="glass-panel hover-lift"
                          onClick={() => {
                            playSound('click');
                            setSelectedBadgeIndex(idx);
                            setShowBadgeModal(true);
                          }}
                          style={{
                            padding: isMobile ? '10px' : '16px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '14px',
                            opacity: isUnlocked ? 1 : 0.4,
                            cursor: 'pointer',
                            background: isUnlocked 
                              ? 'var(--bg-badge-unlocked)' 
                              : 'var(--bg-badge-locked)',
                            border: isUnlocked ? `1px solid ${badge.color}` : '1px solid var(--border-badge-locked)',
                            boxShadow: isUnlocked 
                              ? `0 8px 24px rgba(0, 0, 0, 0.08), 0 0 15px rgba(${badge.colorRgb}, 0.08)` 
                              : 'none',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                          }}
                        >
                          <div 
                            style={{ 
                              color: isUnlocked ? badge.color : 'var(--text-badge-locked)',
                              background: isUnlocked ? `rgba(${badge.colorRgb}, 0.08)` : 'transparent',
                              padding: '10px',
                              borderRadius: '12px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            {isUnlocked ? <Sparkles size={24} /> : <HelpCircle size={24} />}
                          </div>
                          <div>
                            <h4 style={{ fontSize: '14px', fontWeight: 'bold', color: isUnlocked ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                              {isUnlocked ? badge.title : '未アンロック'}
                            </h4>
                            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: '1.3' }}>
                              {badge.desc}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              </div>
            )}
            </div>

          </div>

          {/* 右サイドカラム（レーダーチャート ＆ 摩擦チェッカー ＆ 同期・復元 ＆ 広告） */}
          <div className="dashboard-side-column">
            
            {/* ① 思考力パラメーター (Radar Chart Panel) */}
            <div 
              className="glass-panel"
              style={{
                padding: isMobile ? '20px 16px' : '24px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--glass-bg)',
                border: '1px solid var(--border-color)',
                borderRadius: '16px',
                width: '100%',
                maxWidth: '450px',
                margin: '0 auto'
              }}
            >
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                {isFullUnlocked ? '思考力パラメーター' : '診断結果スキャンマップ'}
              </div>
              <svg 
                viewBox="0 0 320 300" 
                width="100%" 
                height="auto" 
                style={{ maxWidth: '320px', overflow: 'visible' }}
              >
                {/* Background grid pentagons */}
                <polygon points="160,70 236.1,125.3 207,214.7 113,214.7 83.9,125.3" fill="none" stroke="var(--border-color)" strokeWidth="1" />
                <polygon points="160,102 205.7,135.2 188.2,188.8 131.8,188.8 114.3,135.2" fill="none" stroke="var(--border-color)" strokeWidth="1" />
                <polygon points="160,126 182.8,142.6 174.1,169.4 145.9,169.4 137.2,142.6" fill="none" stroke="var(--border-color)" strokeWidth="1" />

                {/* Grid axis lines */}
                <line x1="160" y1="150" x2="160" y2="70" stroke="var(--border-color)" strokeDasharray="3,3" />
                <line x1="160" y1="150" x2="236.1" y2="125.3" stroke="var(--border-color)" strokeDasharray="3,3" />
                <line x1="160" y1="150" x2="207" y2="214.7" stroke="var(--border-color)" strokeDasharray="3,3" />
                <line x1="160" y1="150" x2="113" y2="214.7" stroke="var(--border-color)" strokeDasharray="3,3" />
                <line x1="160" y1="150" x2="83.9" y2="125.3" stroke="var(--border-color)" strokeDasharray="3,3" />

                {/* Labels */}
                <text x="160" y="32" textAnchor="middle" fill="var(--color-cyan)" fontSize="11" fontWeight="bold">
                  事実分析 <tspan fill="var(--text-muted)" fontSize="9" fontWeight="normal">(FACT)</tspan>
                </text>
                <text x="245" y="118" textAnchor="start" fill="var(--color-emerald)" fontSize="11" fontWeight="bold">
                  演繹・推論
                  <tspan x="245" dy="14" fill="var(--text-muted)" fontSize="9" fontWeight="normal">(LOGIC)</tspan>
                </text>
                <text x="215" y="245" textAnchor="start" fill="#818cf8" fontSize="11" fontWeight="bold">
                  戦略思考
                  <tspan x="215" dy="14" fill="var(--text-muted)" fontSize="9" fontWeight="normal">(STRATEGY)</tspan>
                </text>
                <text x="105" y="245" textAnchor="end" fill="var(--color-amber)" fontSize="11" fontWeight="bold">
                  構造化
                  <tspan x="105" dy="14" fill="var(--text-muted)" fontSize="9" fontWeight="normal">(MECE)</tspan>
                </text>
                <text x="75" y="118" textAnchor="end" fill="var(--color-rose)" fontSize="11" fontWeight="bold">
                  批判思考
                  <tspan x="75" dy="14" fill="var(--text-muted)" fontSize="9" fontWeight="normal">(FALLACY)</tspan>
                </text>

                {/* Scores text values */}
                <text x="160" y="46" textAnchor="middle" fill="var(--text-secondary)" fontSize="10">{displayScores.factsOpinions}%</text>
                <text x="245" y="146" textAnchor="start" fill="var(--text-secondary)" fontSize="10">{displayScores.logicalValidity}%</text>
                <text x="215" y="273" textAnchor="start" fill="var(--text-secondary)" fontSize="10">{getStrategicScore()}%</text>
                <text x="105" y="273" textAnchor="end" fill="var(--text-secondary)" fontSize="10">{getRadicalScore()}%</text>
                <text x="75" y="146" textAnchor="end" fill="var(--text-secondary)" fontSize="10">{getCriticalScore()}%</text>

                <circle cx="160" cy="150" r="3" fill="var(--text-muted)" />

                {/* Interactive user scores polygon */}
                <polygon 
                  points={(() => {
                    const s1 = displayScores.factsOpinions || 10;
                    const s2 = displayScores.logicalValidity || 10;
                    const s3 = getStrategicScore() || 10;
                    const s4 = getRadicalScore() || 10;
                    const s5 = getCriticalScore() || 10;

                    const p1x = 160;
                    const p1y = 150 - 80 * (s1 / 100);
                    const p2x = 160 + 80 * (s2 / 100) * 0.9511;
                    const p2y = 150 - 80 * (s2 / 100) * 0.3090;
                    const p3x = 160 + 80 * (s3 / 100) * 0.5878;
                    const p3y = 150 + 80 * (s3 / 100) * 0.8090;
                    const p4x = 160 - 80 * (s4 / 100) * 0.5878;
                    const p4y = 150 + 80 * (s4 / 100) * 0.8090;
                    const p5x = 160 - 80 * (s5 / 100) * 0.9511;
                    const p5y = 150 - 80 * (s5 / 100) * 0.3090;

                    return `${p1x},${p1y} ${p2x},${p2y} ${p3x},${p3y} ${p4x},${p4y} ${p5x},${p5y}`;
                  })()} 
                  fill="rgba(99, 102, 241, 0.25)" 
                  stroke="#6366f1" 
                  strokeWidth="2.5"
                  style={{ transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)' }}
                />
                
                {displayScores.factsOpinions > 0 && <circle cx="160" cy={150 - 80 * (displayScores.factsOpinions / 100)} r="4" fill="var(--color-cyan)" />}
                {displayScores.logicalValidity > 0 && <circle cx={160 + 80 * (displayScores.logicalValidity / 100) * 0.9511} cy={150 - 80 * (displayScores.logicalValidity / 100) * 0.3090} r="4" fill="var(--color-emerald)" />}
                {getStrategicScore() > 0 && <circle cx={160 + 80 * (getStrategicScore() / 100) * 0.5878} cy={150 + 80 * (getStrategicScore() / 100) * 0.8090} r="4" fill="#6366f1" />}
                {getRadicalScore() > 0 && <circle cx={160 - 80 * (getRadicalScore() / 100) * 0.5878} cy={150 + 80 * (getRadicalScore() / 100) * 0.8090} r="4" fill="var(--color-amber)" />}
                {getCriticalScore() > 0 && <circle cx={160 - 80 * (getCriticalScore() / 100) * 0.9511} cy={150 - 80 * (getCriticalScore() / 100) * 0.3090} r="4" fill="var(--color-rose)" />}
              </svg>
              <div 
                style={{ 
                  width: '100%', 
                  marginTop: '20px', 
                  paddingTop: '16px', 
                  borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                  textAlign: 'left'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Sparkles size={14} />
                    EQ共感対話力
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                    {getEmotionalScore()}%
                  </span>
                </div>
                <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden', position: 'relative' }}>
                  <div 
                    style={{ 
                      height: '100%', 
                      width: `${getEmotionalScore()}%`, 
                      background: 'linear-gradient(90deg, var(--color-primary) 0%, #a78bfa 100%)',
                      borderRadius: '4px',
                      boxShadow: '0 0 8px var(--color-primary-glow)',
                      transition: 'all 0.5s ease'
                    }} 
                  />
                </div>
              </div>
            </div>

            {/* ② 環境音・ASMR設定 (Sound Environment Panel) */}
            <div 
              className="glass-panel"
              style={{
                padding: '24px',
                borderLeft: '4px solid #10b981',
                background: 'rgba(16, 185, 129, 0.01)',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                textAlign: 'left'
              }}
            >
              <div>
                <div style={{ marginBottom: '8px' }}>
                  <span className="game-badge" style={{ background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.2)", color: "#10b981", padding: "4px 12px", borderRadius: "12px", fontSize: "11px", fontWeight: "bold" }}>
                    🎧 COZY SOUND & ASMR
                  </span>
                </div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 'bold', color: 'var(--text-primary)', margin: '0 0 4px 0' }}>
                  環境音・タイピングASMR設定
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '12px', lineHeight: '1.4', margin: 0 }}>
                  思考に集中するためのBGMや、タイピング時の心地よい打鍵音をその場で合成・再生します。
                </p>
              </div>

              {/* BGM Selector */}
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>▼ バックグラウンド環境音</span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {[
                    { id: 'none', label: '🍵 静寂' },
                    { id: 'rain', label: '🌧️ 雨音' },
                    { id: 'cozy_pad', label: '🌀 思考パッド' }
                  ].map(item => (
                    <button
                      key={item.id}
                      onClick={() => { playSound('click'); setBgmType(item.id); }}
                      className="btn"
                      style={{
                        padding: '8px 4px',
                        fontSize: '11.5px',
                        borderRadius: '8px',
                        border: bgmType === item.id ? 'none' : '1px solid var(--border-color)',
                        background: bgmType === item.id ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'var(--bg-inner-box)',
                        color: bgmType === item.id ? '#fff' : 'var(--text-secondary)',
                        fontWeight: bgmType === item.id ? 'bold' : 'normal',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* BGM Volume Slider */}
              {bgmType !== 'none' && (
                <div style={{ transition: 'all 0.3s ease' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>BGM音量</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 'bold' }}>{Math.round(bgmVolume * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="0.8"
                    step="0.05"
                    value={bgmVolume}
                    onChange={(e) => setBgmVolume(parseFloat(e.target.value))}
                    style={{
                      width: '100%',
                      accentColor: '#10b981',
                      background: 'rgba(255,255,255,0.05)',
                      height: '4px',
                      borderRadius: '2px',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  />
                </div>
              )}

              {/* Keyboard ASMR Switch */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ fontSize: '12.5px', fontWeight: 'bold', color: 'var(--text-primary)' }}>⌨️ タイピングASMR音</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>キーを押した時に打鍵音を鳴らす</span>
                </div>
                <button
                  onClick={() => { playSound('click'); setKeyboardEnabled(!keyboardEnabled); }}
                  className="btn"
                  style={{
                    padding: '6px 12px',
                    fontSize: '11px',
                    borderRadius: '8px',
                    border: 'none',
                    background: keyboardEnabled ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-inner-box)',
                    color: keyboardEnabled ? '#10b981' : 'var(--text-muted)',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  {keyboardEnabled ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>

            {/* ③ 脳内摩擦係数（相性）チェック (Friction Coefficient Matcher) */}
            <div 
              className="glass-panel" 
              style={{  
                padding: '32px 24px', 
                borderLeft: '4px solid var(--color-cyan)',
                background: 'rgba(6, 182, 212, 0.01)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <div style={{ marginBottom: '16px' }}>
                  <span className="game-badge" style={{ background: "rgba(6, 182, 212, 0.1)", border: "1px solid rgba(6, 182, 212, 0.2)", color: "#06b6d4", padding: "4px 12px", borderRadius: "12px", fontSize: "11px", fontWeight: "bold" }}>
                    ⚡ BI-DIRECTIONAL FRICTION CHECKER
                  </span>
                </div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 'bold', color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
                  脳内摩擦係数（相性）チェック
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '12.5px', lineHeight: '1.5', marginBottom: '24px' }}>
                  あなたと相手の「ブレインコード」を噛み合わせ、思考ギアの摩擦係数（0〜100%）と取扱説明書を算出します。
                </p>

                <form onSubmit={handleCheckFriction} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                  {/* Your Spell Box */}
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>▼ あなたのブレインコード（コピーして相手に共有）</span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input 
                        type="text" 
                        readOnly 
                        value={currentSpell} 
                        style={{ flex: 1, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '8px 12px', color: 'var(--text-secondary)', fontSize: '12px', outline: 'none' }}
                      />
                      <button 
                        type="button" 
                        onClick={onCopyClick}
                        className="btn btn-secondary" 
                        style={{ padding: '8px 12px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        title="ブレインコードをコピー"
                      >
                        <Copy size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Opponent Spell Box */}
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-primary)', display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>▼ 相手のブレインコードを入力</span>
                    <input 
                      type="text" 
                      value={opponentSpell} 
                      onChange={(e) => setOpponentSpell(e.target.value)}
                      placeholder="相手の英数字12文字を入力"
                      style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '8px 12px', color: '#fff', fontSize: '12px', outline: 'none' }}
                    />
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ width: '100%', background: 'linear-gradient(135deg, var(--color-cyan) 0%, var(--color-primary) 100%)', padding: '10px 0', fontSize: '13.5px', borderRadius: '8px' }}>
                    ⚡ 摩擦係数を測定する
                  </button>
                </form>

                {matchError && <p style={{ color: 'var(--color-rose)', fontSize: '12px', textAlign: 'center', margin: '0 0 16px 0' }}>❌ {matchError}</p>}
              </div>

              {/* Match Result Display */}
              {matchResult && (
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(6, 182, 212, 0.15)', padding: '20px', borderRadius: '12px', animation: 'fadeIn 0.3s ease', textAlign: 'left' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--color-cyan)', fontWeight: 'bold' }}>計測結果：{matchResult.pairName}</span>
                    <span style={{ fontSize: '20px', color: '#ff4d4d', fontWeight: 'bold', textShadow: '0 0 8px rgba(255, 77, 77, 0.4)' }}>
                      摩擦係数 {matchResult.friction}%
                    </span>
                  </div>
                  
                  {/* Friction meter bar */}
                  <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden', marginBottom: '16px' }}>
                    <div 
                      style={{ 
                        height: '100%', 
                        width: `${matchResult.friction}%`, 
                        background: 'linear-gradient(90deg, #10b981 0%, #ff9f0a 50%, #ff4d4d 100%)',
                        borderRadius: '4px',
                        transition: 'width 0.5s ease'
                      }}
                    />
                  </div>

                  <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: '1.6', margin: '0 0 16px 0' }}>
                    {matchResult.description}
                  </p>

                  <div style={{ background: 'rgba(16, 185, 129, 0.03)', border: '1px solid rgba(16, 185, 129, 0.1)', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
                    <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>💡 二人のデバッグアドバイス</span>
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{matchResult.advice}</p>
                  </div>

                  <button 
                    onClick={() => handleShareToX(`⚡ 二人の「脳内摩擦係数」をスキャンしました！\n結果：【${matchResult.pairName}】\n激突度：【${matchResult.friction}%】\n\n診断＆相性チェックはこちら👇\n#脳内摩擦係数 #アたまのレントゲン #ブレインコード #LogiFit`)}
                    className="btn btn-secondary"
                    style={{ width: '100%', fontSize: '12px', gap: '6px', background: 'white', color: 'black', fontWeight: 'bold' }}
                  >
                    𝕏 に同期結果をシェアする
                  </button>
                </div>
              )}
            </div>

            {/* ③ ブレインコード（同期・復元）(Alphanumeric Brain Code Backup Box) */}
            <div className="glass-panel" style={{ padding: '20px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <KeyRound size={18} style={{ color: 'var(--color-primary)' }} />
                ブレインコード（同期・復元）
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '12px', lineHeight: '1.4', marginBottom: '16px' }}>
                データを他の端末と同期・復元できます（英数字12文字のコードです）。
                <span style={{ display: 'block', fontSize: '11px', color: 'var(--color-amber)', marginTop: '6px', fontWeight: '500' }}>
                  ⚠️ キャッシュクリアで学習データが消去されるため、コードを手元に保存しておくと安心です。
                </span>
              </p>
              <div 
                onClick={onCopyClick}
                style={{ 
                  background: 'rgba(0, 0, 0, 0.2)', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: '8px', 
                  padding: '10px 14px', 
                  fontFamily: 'var(--font-display)', 
                  fontSize: '16px', 
                  fontWeight: 'bold',
                  color: 'var(--color-primary)',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  userSelect: 'all',
                  transition: 'all 0.2s',
                  letterSpacing: '2px',
                  textShadow: '0 0 8px var(--color-primary-glow)'
                }}
                title="クリックしてコピー"
              >
                <span>{currentSpell}</span>
                <Copy size={14} style={{ opacity: 0.6 }} />
              </div>
              <form onSubmit={handleRestoreSpell} style={{ marginTop: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
                  コードを入力して復元・同期する:
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input 
                    type="text" 
                    value={spellInput}
                    onChange={(e) => {
                      setSpellInput(e.target.value);
                      if (setSpellError) setSpellError('');
                      if (setSpellSuccess) setSpellSuccess(false);
                    }}
                    placeholder="英数字12文字を入力"
                    style={{
                      flex: 1,
                      background: 'var(--bg-inner-box)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      color: 'var(--text-primary)',
                      outline: 'none',
                      fontSize: '13px'
                    }}
                  />
                  <button type="submit" className="btn btn-primary" style={{ padding: '8px 14px', borderRadius: '8px', fontSize: '13px' }}>
                    同期
                  </button>
                </div>
                {spellError && <p style={{ color: 'var(--color-rose)', fontSize: '11px', marginTop: '6px' }}>❌ {spellError}</p>}
                {spellSuccess && <p style={{ color: 'var(--color-emerald)', fontSize: '11px', marginTop: '6px' }}>✨ コードが正常に同期されました！</p>}
              </form>
            </div>

            {/* ⑤ カエル分析官 公式連携ウィジェット (Kaeru Analyst Official Widget) */}
            <div 
              className="glass-panel"
              style={{
                padding: '0',
                borderLeft: '4px solid var(--color-emerald)',
                background: 'rgba(16, 185, 129, 0.01)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
              }}
            >
              {/* アイキャッチ画像 */}
              <div style={{ width: '100%', height: '140px', overflow: 'hidden', position: 'relative' }}>
                <img 
                  src="/kaeru_analyst_eyecatch.jpg" 
                  alt="カエル分析官" 
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'cover'
                  }}
                  className="kaeru-widget-img"
                />
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  left: '12px',
                  background: 'rgba(10, 11, 16, 0.75)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  padding: '4px 10px',
                  borderRadius: '20px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  color: 'var(--color-emerald)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  backdropFilter: 'blur(4px)'
                }}>
                  <span>🐸 公式関連メディア</span>
                </div>
              </div>

              {/* コンテンツ部分 */}
              <div style={{ padding: '20px' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 'bold', color: 'var(--text-primary)', margin: '0 0 4px 0' }}>
                  カエル分析官
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '11px', margin: '0 0 12px 0' }}>
                  @michellle_sato | note.com/kaeru_lab
                </p>
                
                <p style={{ color: 'var(--text-secondary)', fontSize: '12.5px', lineHeight: '1.6', margin: '0 0 20px 0' }}>
                  「人は育てられるのに、自分の重要タスクで固まる。」<br />
                  27年のキャリアを持つ育成プロが、A4バインダー and 太ペンで『先送り』を徹底解剖。50歳からの自己育成ログを配信中。
                </p>

                {/* アクションボタン */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <a 
                    href="https://note.com/kaeru_lab" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    onClick={() => playSound('click')}
                    className="btn btn-secondary kaeru-btn-note"
                    style={{ 
                      fontSize: '12px', 
                      padding: '10px', 
                      borderRadius: '8px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      gap: '6px',
                      textDecoration: 'none',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border-color)',
                      background: 'rgba(255,255,255,0.02)'
                    }}
                  >
                    📝 noteを読む
                  </a>
                  <a 
                    href="https://x.com/michellle_sato" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    onClick={() => playSound('click')}
                    className="btn btn-secondary kaeru-btn-x"
                    style={{ 
                      fontSize: '12px', 
                      padding: '10px', 
                      borderRadius: '8px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      gap: '6px',
                      textDecoration: 'none',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border-color)',
                      background: 'rgba(255,255,255,0.02)'
                    }}
                  >
                    𝕏 をフォロー
                  </a>
                </div>
              </div>
            </div>

            {/* ④ スポンサー枠 (Sponsored Link) */}
            <div 
              className="glass-panel" 
              style={{ 
                padding: '16px', 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center',
                background: 'var(--glass-bg)',
                border: '1px solid var(--border-color)',
                borderRadius: '16px'
              }}
            >
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px', letterSpacing: '1px', textTransform: 'uppercase' }}>
                Sponsored Link
              </div>
              <RakutenWidget size="250x250" ts="1779836909524" />
            </div>

          </div>
        </div>
      </>)}
      {showBadgeModal && selectedBadgeIndex !== null && (() => {
        const badge = badgeDetails[selectedBadgeIndex];
        const isUnlocked = gameState.badges[selectedBadgeIndex];

        return (
          <div className="modal-overlay" onClick={() => setShowBadgeModal(false)}>
            <div 
              className="modal-content glass-panel" 
              onClick={(e) => e.stopPropagation()}
              style={{ 
                maxWidth: '520px', 
                padding: '32px',
                textAlign: 'center',
                boxShadow: isUnlocked 
                  ? `0 20px 40px rgba(0, 0, 0, 0.55), 0 0 30px rgba(${badge.colorRgb}, 0.15)` 
                  : '0 20px 40px rgba(0, 0, 0, 0.55)'
              }}
            >
              {/* Close Button */}
              <button 
                onClick={() => setShowBadgeModal(false)}
                style={{
                  position: 'absolute',
                  top: '20px',
                  right: '20px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: 'none',
                  color: 'var(--text-muted)',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  fontSize: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.2s'
                }}
              >
                &times;
              </button>

              {/* Badge Icon */}
              <div 
                style={{ 
                  background: isUnlocked ? `rgba(${badge.colorRgb}, 0.08)` : 'rgba(255, 255, 255, 0.02)',
                  border: isUnlocked ? `1px solid ${badge.color}` : '1px solid var(--border-color)',
                  width: '80px',
                  height: '80px',
                  borderRadius: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px',
                  boxShadow: isUnlocked ? `0 0 20px rgba(${badge.colorRgb}, 0.25)` : 'none',
                  color: isUnlocked ? badge.color : 'var(--text-badge-locked)'
                }}
              >
                {isUnlocked ? <Sparkles size={36} /> : <Lock size={36} />}
              </div>

              {/* Badge Title */}
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: '800', marginBottom: '6px', color: 'var(--text-primary)' }}>
                {isUnlocked ? badge.title : '未確認の実績バッジ'}
              </h2>
              
              <span style={{ 
                fontSize: '11px', 
                color: isUnlocked ? badge.color : 'var(--text-muted)', 
                background: isUnlocked ? `rgba(${badge.colorRgb}, 0.1)` : 'rgba(255,255,255,0.05)',
                padding: '4px 10px',
                borderRadius: '6px',
                fontWeight: 'bold',
                display: 'inline-block',
                marginBottom: '16px'
              }}>
                {isUnlocked ? badge.tagline : 'ロックされています'}
              </span>

              {/* Condition / How to Unlock */}
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.5', margin: '0 auto 24px', maxWidth: '400px' }}>
                解放条件：<strong>{badge.desc}</strong>
              </p>

              {isUnlocked ? (
                /* Unlocked: Show Real-world meaning & Cheat Sheet phrase */
                <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '16px', animation: 'fadeIn 0.3s ease' }}>
                  {/* Real-world Benefit */}
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '14px 16px', borderRadius: '10px' }}>
                    <span style={{ display: 'block', fontSize: '11.5px', color: badge.color, fontWeight: 'bold', marginBottom: '6px' }}>
                      💼 現実世界での効果・戦闘力：
                    </span>
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                      {badge.benefit}
                    </p>
                  </div>

                  {/* Cheat Sheet copy card */}
                  <div style={{ background: 'rgba(255,255,255,0.01)', border: `1px dashed ${badge.color}`, padding: '16px', borderRadius: '12px', position: 'relative' }}>
                    <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'bold', marginBottom: '8px' }}>
                      💬 日常のコミュニケーションでそのまま使える特効薬ワード：
                    </span>
                    <p style={{ margin: '0 0 16px 0', fontSize: '13.5px', color: 'var(--text-primary)', lineHeight: '1.6', fontWeight: 'bold', fontStyle: 'italic' }}>
                      {badge.template}
                    </p>
                    
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(badge.template);
                          playSound('correct');
                          setCopiedBadgeIdx(selectedBadgeIndex);
                          setTimeout(() => setCopiedBadgeIdx(null), 2000);
                        }}
                        className="btn btn-primary"
                        style={{
                          flex: 1.2,
                          padding: '10px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          background: `linear-gradient(135deg, ${badge.color} 0%, var(--color-primary) 100%)`,
                          border: 'none',
                          boxShadow: `0 4px 12px rgba(${badge.colorRgb}, 0.2)`
                        }}
                      >
                        {copiedBadgeIdx === selectedBadgeIndex ? '✅ コピー完了！' : '📋 テンプレートをコピー'}
                      </button>
                      
                      <button
                        onClick={() => {
                          const tweetText = `🏆 思考ジム「LogiFit」で実績【${badge.title}】を獲得！\n「${badge.tagline}」スキルをマスターしました。\n👉 特効薬フレーズ：\n${badge.template}\n\n#LogiFit #思考デバッグ`;
                          handleShareToX(tweetText);
                        }}
                        className="btn btn-secondary"
                        style={{
                          flex: 0.8,
                          padding: '10px',
                          fontSize: '12px',
                          border: '1px solid var(--border-color)',
                          background: 'rgba(255,255,255,0.03)'
                        }}
                      >
                        𝕏 でシェアする
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Locked: Show shortcut to play the game */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                  <button
                    onClick={() => {
                      playSound('click');
                      setShowBadgeModal(false);
                      document.getElementById('training-menu')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="btn btn-primary"
                    style={{
                      width: '100%',
                      padding: '12px',
                      fontSize: '13.5px',
                      background: 'var(--bg-inner-box)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-secondary)'
                    }}
                  >
                    🎯 トレーニングメニューに移動する
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {showToast && (
        <div className="copy-toast">
          <Sparkles size={16} style={{ color: 'var(--color-primary)' }} />
          <span>ブレインコードをクリップボードにコピーしました！</span>
        </div>
      )}
    </div>
  );
}

function LandingPage({
  showCTA,
  playSound,
  setActiveGame,
  handleRestoreSpell,
  spellInput,
  setSpellInput,
  spellError
}) {
  return (
    <>
      {/* ① 新規向けHero（高インパクト・コピー） */}
      <div 
        className="glass-panel"
        style={{
          padding: showCTA ? '56px 32px' : '40px 24px',
          textAlign: 'center',
          background: 'var(--hero-bg)',
          borderLeft: '4px solid var(--color-cyan)',
          position: 'relative',
          overflow: 'hidden',
          marginBottom: '16px'
        }}
      >
        <div className="scan-bg-glow"></div>
        <div style={{ marginBottom: "16px" }}>
          <span className="game-badge" style={{ background: "rgba(6, 182, 212, 0.1)", border: "1px solid rgba(6, 182, 212, 0.2)", color: "#06b6d4", padding: "6px 16px", borderRadius: "20px", fontSize: "14px", fontWeight: "bold", letterSpacing: '1px' }}>
            🔬 COGNITIVE DEBUG SYSTEM
          </span>
        </div>
        <h1 className="text-glow" style={{ fontFamily: 'var(--font-display)', fontWeight: '900', fontSize: showCTA ? '32px' : '26px', letterSpacing: '-0.5px', marginBottom: '18px', marginTop: 0, lineHeight: '1.35' }}>
          「なぜか話が噛み合わない…」<br />その脳内のバグ、スキャンしませんか？
        </h1>
        <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7', fontSize: showCTA ? '15px' : '13.5px', marginBottom: showCTA ? '36px' : '0px', maxWidth: '680px', margin: '0 auto' }}>
          LogiFit（ロジフィット）は、アタマのレントゲン（思考診断）であなたの認知の偏りを暴き、<br />
          ゲーム感覚で脳内OSをアップデートする総合思考トレーニングジムです。
        </p>
        {showCTA && (
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap', alignItems: 'center', marginTop: '36px' }}>
            <button 
              onClick={() => { playSound('click'); setActiveGame('diagnostic'); }} 
              className="btn btn-primary"
              style={{
                background: 'linear-gradient(135deg, var(--color-cyan) 0%, var(--color-primary) 100%)',
                boxShadow: '0 4px 20px rgba(6, 182, 212, 0.4)',
                fontSize: '16px',
                fontWeight: 'bold',
                padding: '16px 44px',
                borderRadius: '12px',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              <span>🧠 思考のレントゲン（診断）をはじめる</span>
            </button>
          </div>
        )}
      </div>

      {/* ② 脳内の「思考バグ」共感エリア (Pain Points) */}
      <div className="glass-panel" style={{ padding: '36px 28px', border: '1px solid var(--border-color)', borderRadius: '16px', marginBottom: '16px' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-primary)', textAlign: 'center' }}>
          日常生活や仕事で、こんな「思考バグ」ありませんか？
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', textAlign: 'center', marginBottom: '28px' }}>
          私たちは無意識のうちに、自分特有の認知バイアス（思考の偏り）をシステムに読み込んでしまっています。
        </p>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
          <div style={{ background: 'rgba(255, 255, 255, 0.01)', border: '1px solid var(--border-color)', padding: '24px 20px', borderRadius: '12px', textAlign: 'left' }}>
            <span style={{ fontSize: '32px', display: 'block', marginBottom: '12px' }}>💥</span>
            <h3 style={{ fontSize: '14.5px', fontWeight: 'bold', color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
              ロジハラ型（正論エラー）
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '12px', lineHeight: '1.6', margin: 0 }}>
              「正しいこと（正論）」を言っているはずなのに、なぜか相手の反発を招いたり、人間関係をフリーズさせてしまうバグ。
            </p>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.01)', border: '1px solid var(--border-color)', padding: '24px 20px', borderRadius: '12px', textAlign: 'left' }}>
            <span style={{ fontSize: '32px', display: 'block', marginBottom: '12px' }}>👴</span>
            <h3 style={{ fontSize: '14.5px', fontWeight: 'bold', color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
              昭和バイアス（過去基準エラー）
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '12px', lineHeight: '1.6', margin: 0 }}>
              「自分の若い頃は〜」「普通は〜」と、無意識のうちに過去の精神論やマイルールを現代の環境に押し付けてしまうバグ。
            </p>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.01)', border: '1px solid var(--border-color)', padding: '24px 20px', borderRadius: '12px', textAlign: 'left' }}>
            <span style={{ fontSize: '32px', display: 'block', marginBottom: '12px' }}>📱</span>
            <h3 style={{ fontSize: '14.5px', fontWeight: 'bold', color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
              令和バイアス（効率過信エラー）
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '12px', lineHeight: '1.6', margin: 0 }}>
              合理性やタイパ（時間対効果）を極端に重視するあまり、感情のプロセスを省いて冷たい印象を与え、対話を崩壊させるバグ。
            </p>
          </div>
        </div>
      </div>

      {/* ③ 得られるメリット (Benefits/Values) */}
      <div className="glass-panel" style={{ padding: '36px 28px', border: '1px solid var(--border-color)', borderRadius: '16px', marginBottom: '16px' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-primary)', textAlign: 'center' }}>
          LogiFitでデバッグする「4つの論理・感情回路」
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', textAlign: 'center', marginBottom: '28px' }}>
          診断結果からアタマの傾向をレーダー可視化。偏りを見極め、4つのルームでデバッグ学習を行います。
        </p>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', textAlign: 'left' }}>
          <div style={{ display: 'flex', gap: '16px', background: 'var(--bg-inner-box)', border: '1px solid var(--border-color)', padding: '20px', borderRadius: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', borderRadius: '10px', background: 'rgba(6, 182, 212, 0.1)', color: 'var(--color-cyan)', fontSize: '22px', flexShrink: 0 }}>📊</div>
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: 'bold', margin: '0 0 4px 0', color: 'var(--text-primary)' }}>ロジカル思考（事実と結論の整理）</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '12px', lineHeight: '1.5', margin: 0 }}>個人の「意見・解釈」と客観的な「事実」を正しく切り分け、飛躍のないクリアな筋道を組み立てる力。</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px', background: 'var(--bg-inner-box)', border: '1px solid var(--border-color)', padding: '20px', borderRadius: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', borderRadius: '10px', background: 'rgba(244, 63, 94, 0.1)', color: 'var(--color-rose)', fontSize: '22px', flexShrink: 0 }}>🔍</div>
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: 'bold', margin: '0 0 4px 0', color: 'var(--text-primary)' }}>クリティカル思考（バイアスと誤謬の検知）</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '12px', lineHeight: '1.5', margin: 0 }}>相手の論点すり替えや、自分自身の無意識の歪みに素早く気づき、詭弁やヘリくつを無効化する力。</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px', background: 'var(--bg-inner-box)', border: '1px solid var(--border-color)', padding: '20px', borderRadius: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.1)', color: 'var(--color-amber)', fontSize: '22px', flexShrink: 0 }}>🌳</div>
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: 'bold', margin: '0 0 4px 0', color: 'var(--text-primary)' }}>ラディカル思考（本質的な課題のMECE分解）</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '12px', lineHeight: '1.5', margin: 0 }}>複雑な重要問題を漏れなくダブりなく（MECE）因数分解し、真のボトルネックを見つけ出す構造化能力。</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px', background: 'var(--bg-inner-box)', border: '1px solid var(--border-color)', padding: '20px', borderRadius: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', borderRadius: '10px', background: 'rgba(139, 92, 246, 0.1)', color: 'var(--color-primary)', fontSize: '22px', flexShrink: 0 }}>🤝</div>
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: 'bold', margin: '0 0 4px 0', color: 'var(--text-primary)' }}>エモーショナル思考（共感と受容の傾聴）</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '12px', lineHeight: '1.5', margin: 0 }}>正論で論破するのではなく、相手の感情に優しく寄り添うことで、深い信頼のネットワークを築く力。</p>
            </div>
          </div>
        </div>
      </div>

      {/* ④ 3 STEP PLAY GUIDE CONTAINER */}
      <div 
        className="glass-panel"
        style={{
          padding: '32px 24px',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          textAlign: 'center',
          marginBottom: '16px'
        }}
      >
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 'bold', marginBottom: '24px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <Sparkles size={18} style={{ color: 'var(--color-cyan)' }} />
          脳内OSをアップデートする 3 STEP
        </h2>
        <div 
          style={{ 
            display: 'flex', 
            gap: '24px', 
            flexWrap: 'wrap',
            justifyContent: 'center',
            textAlign: 'left'
          }}
        >
          {/* Step 1 */}
          <div style={{ flex: '1 1 250px', background: 'var(--bg-inner-box)', border: '1px solid var(--border-color)', padding: '20px', borderRadius: '12px', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '-12px', left: '20px', background: 'linear-gradient(135deg, var(--color-cyan) 0%, #0891b2 100%)', color: 'var(--bg-dark)', fontSize: '10px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '4px' }}>
              STEP 01
            </div>
            <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginTop: '4px', marginBottom: '8px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              🧠 アタマをスキャンする
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '12px', lineHeight: '1.5', margin: 0 }}>
              「アタマのレントゲン（診断）」を受け、あなたの思考の偏り（ロジカル、クリティカル、ラディカル、エモーショナル）を暴きます。
            </p>
          </div>

          {/* Step 2 */}
          <div style={{ flex: '1 1 250px', background: 'var(--bg-inner-box)', border: '1px solid var(--border-color)', padding: '20px', borderRadius: '12px', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '-12px', left: '20px', background: 'linear-gradient(135deg, var(--color-primary) 0%, #7c3aed 100%)', color: '#fff', fontSize: '10px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '4px' }}>
              STEP 02
            </div>
            <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginTop: '4px', marginBottom: '8px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              🎯 弱点をデバッグする
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '12px', lineHeight: '1.5', margin: 0 }}>
              診断で見つかった「思考のバグ（弱点）」を克服するトレーニングゲーム（事実vs意見、誤謬特定など）に挑戦します。
            </p>
          </div>

          {/* Step 3 */}
          <div style={{ flex: '1 1 250px', background: 'var(--bg-inner-box)', border: '1px solid var(--border-color)', padding: '20px', borderRadius: '12px', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '-12px', left: '20px', background: 'linear-gradient(135deg, var(--color-emerald) 0%, #059669 100%)', color: '#fff', fontSize: '10px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '4px' }}>
              STEP 03
            </div>
            <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginTop: '4px', marginBottom: '8px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              🚀 脳内OSをアップデート
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '12px', lineHeight: '1.5', margin: 0 }}>
              トレーニングのベストスコアが蓄積され、パラメータ（レーダーチャート）とあなたの「進化クラス（肩書き）」が成長します。
            </p>
          </div>
        </div>
      </div>

      {/* Spell entry for returning users */}
      {showCTA && (
        <div style={{ maxWidth: '400px', margin: '32px auto 0 auto', width: '100%' }}>
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
              <KeyRound size={16} style={{ color: 'var(--color-primary)' }} />
              ブレインコードをインポートしてデータを復元
            </h3>
            <form onSubmit={handleRestoreSpell} style={{ display: 'flex', gap: '8px' }}>
              <input 
                type="text" 
                value={spellInput}
                onChange={(e) => setSpellInput(e.target.value)}
                placeholder="英数字12文字を入力"
                style={{
                  flex: 1,
                  background: 'var(--bg-inner-box)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  fontSize: '13px'
                }}
              />
              <button type="submit" className="btn btn-primary" style={{ padding: '8px 14px', borderRadius: '8px', fontSize: '13px' }}>
                インポート
              </button>
            </form>
            {spellError && <p style={{ color: 'var(--color-rose)', fontSize: '11px', marginTop: '6px', textAlign: 'center' }}>❌ {spellError}</p>}
          </div>
        </div>
      )}
    </>
  );
}
