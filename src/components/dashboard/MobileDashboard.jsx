import React, { useState, useEffect } from 'react';
import { 
  Home,
  Award,
  BookOpen,
  Brain,
  Sparkles,
  HelpCircle,
  TrendingUp,
  Lock,
  Unlock,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Volume2,
  VolumeX,
  Sun,
  Moon
} from 'lucide-react';
import { decodeState, calculateFriction } from '../../data/spellHelper';
import { diagnosticTypes } from '../../data/diagnosticData';
import { useSound } from '../../hooks/useSound';
import RakutenWidget from '../common/RakutenWidget';

// 切り出したサブコンポーネントのインポート
import FrictionMatcher from './FrictionMatcher';
import BugLibrary from './BugLibrary';
import BadgeModal from './BadgeModal';

// 自動推奨ゲームのキー選定
const getRecommendedGameKey = (scores) => {
  const keys = ['factsOpinions', 'logicalValidity', 'logicTree', 'fallacy', 'empathyDialogue', 'hiddenAssumption', 'causalLoop', 'assertiveRewrite', 'strategic'];
  for (const key of keys) {
    if ((scores[key] || 0) === 0) {
      return key;
    }
  }
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

export default function MobileDashboard({
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
  onClearTuningToday,
  setMode,
  theme,
  setTheme,
  muted,
  toggleMute
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
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [selectedBadgeIndex, setSelectedBadgeIndex] = useState(null);
  const [copiedBadgeIdx, setCopiedBadgeIdx] = useState(null);
  const [isSoundOpen, setIsSoundOpen] = useState(false);
  const [isKaeruOpen, setIsKaeruOpen] = useState(false);
  
  // モバイルバグノートサブタブ ('note' or 'library')
  const [bugSubTab, setBugSubTab] = useState('note');

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

      if (onUnlockType && result && result.typeB) {
        onUnlockType(result.typeB);
      }
    } catch (err) {
      playSound('incorrect');
      setMatchError(err.message || '相手のブレインコードの解析に失敗しました。');
    }
  };

  const currentType = gameState.diagnosticTypeId 
    ? diagnosticTypes[gameState.diagnosticTypeId] 
    : (gameState.diagnosticType || null);

  // モバイル用のアクティブタブ切り替え
  const handleNavClick = (tabId) => {
    playSound('click');
    if (tabId === 'bugs') {
      // バグタブの場合は前回のサブタブに応じて設定
      setActiveTab(bugSubTab === 'note' ? 'bugNote' : 'encyclopedia');
    } else {
      setActiveTab(tabId);
    }
  };

  // ボトムナビでアクティブにする項目の判定
  const isHomeActive = activeTab === 'home' || activeTab === 'diagnostics';
  const isTrainingActive = activeTab === 'training';
  const isBugsActive = activeTab === 'bugNote' || activeTab === 'encyclopedia';
  const isAchievementsActive = activeTab === 'achievements';

  // 親の activeTab が変わったらサブタブ状態を同期
  useEffect(() => {
    if (activeTab === 'bugNote') {
      setBugSubTab('note');
    } else if (activeTab === 'encyclopedia') {
      setBugSubTab('library');
    }
  }, [activeTab]);

  return (
    <div className="mobile-dashboard-layout" style={{ paddingBottom: '70px', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* ========================================================
         ① スリムヘッダー
         ======================================================== */}
      <header className="mobile-app-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'rgba(10, 11, 16, 0.8)', backdropFilter: 'blur(10px)', borderBottom: '1px solid var(--border-color)', position: 'sticky', top: 0, zIndex: 90 }}>
        <div className="logo-group" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="logo-icon-bg" style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'linear-gradient(135deg, var(--color-cyan) 0%, var(--color-primary) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Brain size={16} style={{ color: '#fff' }} />
          </div>
          <span className="logo-text" style={{ fontSize: '16px', fontWeight: 'bold', letterSpacing: '0.5px' }}>LogiFit</span>
        </div>
        
        <div className="header-status-controls" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* レベル・XP */}
          <div className="header-lvl-badge" style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold' }}>
            <span style={{ color: 'var(--color-cyan)' }}>Lvl</span>
            <span style={{ background: 'var(--color-primary)', padding: '0 4px', borderRadius: '3px', color: '#fff' }}>{gameState.level}</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '9px', marginLeft: '2px' }}>({gameState.xp} XP)</span>
          </div>
          
          {/* ミュート切り替え */}
          <button 
            onClick={() => { playSound('click'); toggleMute(); }}
            className="header-ctrl-btn"
            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}
            title={muted ? "消音解除" : "ミュート"}
          >
            {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
        </div>
      </header>

      {/* ========================================================
         ② メインコンテンツ領域
         ======================================================== */}
      <main className="mobile-app-content" style={{ padding: '16px', flex: 1 }}>
        
        {/* ========================================================
           HOME TAB: カルーセル・推奨ゲーム・調律起動
           ======================================================== */}
        {(activeTab === 'home' || activeTab === undefined) && (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* カルーセル */}
            {(() => {
              const slides = [
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
                      <p className="carousel-slide-desc" style={{ fontSize: '12px', margin: '4px 0 8px 0', lineHeight: '1.4' }}>
                        {currentType?.description || charClass?.desc}
                      </p>
                      {currentType && (
                        <div className="accordion-wrapper">
                          <button
                            onClick={() => { playSound('click'); setShowBugDetails(!showBugDetails); }}
                            className="btn btn-secondary accordion-toggle-btn"
                            style={{
                              background: showBugDetails ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.01)',
                              fontSize: '11px',
                              padding: '6px 10px',
                              width: '100%',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}
                          >
                            <span>{showBugDetails ? '▼ 詳細を閉じる' : '▶ あなたの取扱説明書・脳内バグ'}</span>
                            <Sparkles size={12} className="color-cyan-icon" />
                          </button>

                          {showBugDetails && (
                            <div className="accordion-content fade-in" style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px', borderTop: '1px solid var(--border-color)', paddingTop: '8px' }}>
                              <div className="accordion-item-box">
                                <span className="accordion-item-label color-cyan" style={{ fontWeight: 'bold' }}>💼 工作でのバグ:</span>
                                <p className="accordion-item-text" style={{ margin: '2px 0 0 0' }}>{currentType?.workBug}</p>
                              </div>
                              <div className="accordion-item-box">
                                <span className="accordion-item-label color-rose" style={{ fontWeight: 'bold' }}>🏡 私生活でのバグ:</span>
                                <p className="accordion-item-text" style={{ margin: '2px 0 0 0' }}>{currentType?.privateBug}</p>
                              </div>
                              <div className="accordion-item-box">
                                <span className="accordion-item-label color-amber" style={{ fontWeight: 'bold' }}>⚡ ふとした瞬間のクセ:</span>
                                <p className="accordion-item-text" style={{ margin: '2px 0 0 0' }}>{currentType?.dailyHabit}</p>
                              </div>
                              <div className="accordion-item-box torisetsu-box" style={{ background: 'rgba(16, 185, 129, 0.02)', padding: '6px', borderRadius: '4px' }}>
                                <span className="accordion-item-label color-emerald block-label" style={{ fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>📋 取扱説明書:</span>
                                <span className="accordion-sub-label color-rose" style={{ fontSize: '10px' }}>● 地雷ポイント:</span>
                                <p className="accordion-item-text label-spacing" style={{ margin: '0 0 4px 0' }}>{currentType?.torisetsu?.jealousPoint}</p>
                                <span className="accordion-sub-label color-emerald" style={{ fontSize: '10px' }}>● デバッグコマンド:</span>
                                <p className="accordion-item-text" style={{ margin: 0 }}>{currentType?.torisetsu?.debugSpell}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  ),
                  actions: (
                    <div className="carousel-actions-row" style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        onClick={() => { 
                          playSound('click'); 
                          setActiveTab('training');
                        }} 
                        className="btn btn-primary primary-action-btn"
                        style={{
                          flex: 1,
                          fontSize: '11px',
                          padding: '8px 0',
                          background: isFullUnlocked 
                            ? 'linear-gradient(135deg, var(--color-primary) 0%, #7c3aed 100%)' 
                            : 'linear-gradient(135deg, var(--color-cyan) 0%, var(--color-primary) 100%)',
                          boxShadow: isFullUnlocked 
                            ? '0 4px 15px var(--color-primary-glow)' 
                            : '0 4px 15px rgba(6, 182, 212, 0.3)'
                        }}
                      >
                        🎯 {isFullUnlocked ? 'デバッグ再開' : '最初の練習へ'}
                      </button>
                      <button 
                        onClick={() => { playSound('click'); setActiveGame('diagnostic'); }} 
                        className="btn btn-secondary secondary-action-btn"
                        style={{ flex: 1, fontSize: '11px', padding: '8px 0' }}
                      >
                        再スキャン
                      </button>
                    </div>
                  )
                },
                {
                  badge: "LogiFitとは？",
                  badgeColor: "rgba(6, 182, 212, 0.05)",
                  badgeTextColor: "var(--color-cyan)",
                  badgeBorder: "rgba(6, 182, 212, 0.15)",
                  level: null,
                  icon: "🔬",
                  title: "認知バイアス思考ジム",
                  tagline: "アタマの偏りをデバッグする",
                  desc: (
                    <p className="carousel-slide-desc" style={{ fontSize: '12px', margin: '4px 0 8px 0', lineHeight: '1.4' }}>
                      LogiFitは、3分間の診断（思考レントゲン）であなたの認知の偏りを暴き、ゲーム感覚で思考力をデバッグ・強化するジムです。
                    </p>
                  ),
                  actions: (
                    <div className="carousel-actions-row" style={{ width: '100%' }}>
                      <button 
                        onClick={() => { playSound('click'); setShowIntroduction(!showIntroduction); }} 
                        className="btn btn-primary full-width-btn"
                        style={{
                          width: '100%',
                          fontSize: '11px',
                          padding: '8px 0',
                          background: 'linear-gradient(135deg, var(--color-cyan) 0%, var(--color-primary) 100%)'
                        }}
                      >
                        💡 {showIntroduction ? 'コンセプトを閉じる' : 'コンセプトを表示'}
                      </button>
                    </div>
                  )
                },
                {
                  badge: "システムアップデート",
                  badgeColor: "rgba(244, 63, 94, 0.05)",
                  badgeTextColor: "var(--color-rose)",
                  badgeBorder: "rgba(244, 63, 94, 0.15)",
                  level: null,
                  icon: "📢",
                  title: "「脳内デバッグ・ラボ」へ進化",
                  tagline: "HPや制限時間によるゲームオーバーを撤廃",
                  desc: (
                    <p className="carousel-slide-desc" style={{ fontSize: '12px', margin: '4px 0 8px 0', lineHeight: '1.4' }}>
                      HP・制限時間によるゲームオーバーをなくし、納得いくまで解説を読んで思考力を磨ける仕様になりました。
                    </p>
                  ),
                  actions: (
                    <div className="carousel-actions-row" style={{ display: 'flex', gap: '8px', width: '100%' }}>
                      <button 
                        onClick={() => { playSound('click'); setActiveTab('encyclopedia'); setLibrarySubTab('bug'); }} 
                        className="btn btn-secondary flex-btn"
                        style={{ flex: 1, fontSize: '11px', padding: '8px 0' }}
                      >
                        👾 脳内バグ図鑑を見る
                      </button>
                      <button 
                        onClick={() => { 
                          playSound('click'); 
                          setActiveSlide(0); 
                          setShowBugDetails(true); 
                        }} 
                        className="btn btn-secondary flex-btn"
                        style={{ flex: 1, fontSize: '11px', padding: '8px 0' }}
                      >
                        📖 取説を表示
                      </button>
                    </div>
                  )
                },
                {
                  badge: "思考調律",
                  badgeColor: "rgba(16, 185, 129, 0.05)",
                  badgeTextColor: "#10b981",
                  badgeBorder: "rgba(16, 185, 129, 0.15)",
                  level: null,
                  icon: "🧠",
                  title: "脳のメモリを解放する「思考調律」",
                  tagline: "モヤモヤ・イライラをデバッグする、3分の新習慣",
                  desc: (
                    <p className="carousel-slide-desc" style={{ fontSize: '12px', margin: '4px 0 8px 0', lineHeight: '1.4' }}>
                      日常生活のモヤモヤを書き出して認知の偏りを検出し、客観的な「事実ベース」に書き換えます。イライラが止まり「今やるべきこと」に集中できます。
                    </p>
                  ),
                  actions: (
                    <div className="carousel-actions-row" style={{ width: '100%' }}>
                      {(() => {
                        const todayStr = new Date().toLocaleDateString('sv');
                        const isTuningCompletedToday = gameState.lastTuningDate === todayStr;
                        return isTuningCompletedToday ? (
                          <div style={{ display: 'flex', gap: '6px', width: '100%' }}>
                            <button 
                              onClick={() => { 
                                playSound('click'); 
                                setActiveTab('achievements'); 
                                setTimeout(() => {
                                  document.getElementById('tuning-log-section')?.scrollIntoView({ behavior: 'smooth' });
                                }, 100);
                              }}
                              className="btn btn-secondary"
                              style={{ flex: 1, fontSize: '11px', padding: '8px 0' }}
                            >
                              ✅ 本日完了
                            </button>
                            <button 
                              onClick={() => { playSound('click'); setActiveGame('mindTuning'); }} 
                              className="btn btn-primary"
                              style={{ flex: 1, fontSize: '11px', padding: '8px 0' }}
                            >
                              🔄 再調律する
                            </button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => { playSound('click'); setActiveGame('mindTuning'); }} 
                            className="btn btn-primary full-width-btn"
                            style={{ 
                              width: '100%',
                              fontSize: '11px',
                              padding: '8px 0',
                              background: 'linear-gradient(135deg, var(--color-cyan) 0%, var(--color-primary) 100%)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '4px'
                            }}
                          >
                            <span>🧠 思考調律を起動</span>
                            <span className="xp-gold-badge" style={{ background: 'rgba(255,255,255,0.2)', padding: '1px 4px', borderRadius: '3px', fontSize: '9px' }}>+100 XP</span>
                          </button>
                        );
                      })()}
                    </div>
                  )
                }
              ];

              return (
                <div 
                  className="glass-panel carousel-panel-wrapper"
                  onMouseEnter={() => setIsHovered(true)}
                  onMouseLeave={() => setIsHovered(false)}
                  style={{
                    borderLeft: `4px solid ${
                      activeSlide === 0 
                        ? (isFullUnlocked ? 'var(--color-primary)' : 'var(--color-cyan)')
                        : (activeSlide === 1 ? 'var(--color-cyan)' : (activeSlide === 2 ? 'var(--color-rose)' : '#10b981'))
                    }`,
                    padding: '12px',
                    borderRadius: '12px'
                  }}
                >
                  <div key={activeSlide} className="fade-in">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span 
                        className="carousel-slide-badge"
                        style={{ 
                          color: slides[activeSlide].badgeTextColor, 
                          background: slides[activeSlide].badgeColor, 
                          border: `1px solid ${slides[activeSlide].badgeBorder}`,
                          fontSize: '10px',
                          padding: '2px 6px',
                          borderRadius: '4px'
                        }}
                      >
                        {slides[activeSlide].badge}
                      </span>
                      
                      <div className="carousel-indicators" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button onClick={() => { playSound('click'); setActiveSlide((prev) => (prev - 1 + slides.length) % slides.length); }} className="carousel-arrow-btn" style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', padding: '2px' }}><ChevronLeft size={14} /></button>
                        <div style={{ display: 'flex', gap: '3px' }}>
                          {slides.map((_, idx) => (
                            <div key={idx} className={`carousel-dot ${idx === activeSlide ? 'active' : ''}`} style={{ width: '4px', height: '4px', borderRadius: '50%', background: idx === activeSlide ? 'var(--color-cyan)' : 'rgba(255,255,255,0.2)' }} />
                          ))}
                        </div>
                        <button onClick={() => { playSound('click'); setActiveSlide((prev) => (prev + 1) % slides.length); }} className="carousel-arrow-btn" style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', padding: '2px' }}><ChevronRight size={14} /></button>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px', alignItems: 'center' }}>
                      <span style={{ fontSize: '24px' }}>{slides[activeSlide].icon}</span>
                      <div>
                        <h2 className="text-glow" style={{ fontSize: '15px', fontWeight: 'bold', margin: 0 }}>{slides[activeSlide].title}</h2>
                        <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '1px 0 0 0' }}>{slides[activeSlide].tagline}</p>
                      </div>
                    </div>

                    <div style={{ marginTop: '8px' }}>
                      {slides[activeSlide].desc}
                    </div>

                    <div style={{ marginTop: '10px' }}>
                      {slides[activeSlide].actions}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* コンセプト説明の全表示 (Show Concept Onboarding if toggled) */}
            {showIntroduction && (
              <div className="glass-panel fade-in" style={{ padding: '14px', borderRadius: '12px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 'bold', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={16} className="color-cyan-icon" />
                  認知の偏りをデバッグするとは？
                </h3>
                <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '1.5', margin: 0 }}>
                  人は誰しも自分だけの「思考のクセ（認知バイアス）」を持っています。それは仕事や人間関係で「なぜか話が噛み合わない」「イライラしてしまう」といった形で表れます。<br />
                  LogiFitはあなたの思考の歪み（バグ）を可視化し、それを修正（デバッグ）するための日常トレーニングを提供します。
                </p>
              </div>
            )}

            {/* クイックアクションエリア */}
            {(() => {
              const recGameKey = getRecommendedGameKey(gameState.scores);
              const recGameName = getGameName(recGameKey);
              const todayStr = new Date().toLocaleDateString('sv');
              const isTuningCompletedToday = gameState.lastTuningDate === todayStr;

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {/* 推奨トレーニング */}
                  <div 
                    className="glass-panel hover-lift"
                    onClick={() => { playSound('click'); setActiveGame(recGameKey); }}
                    style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderRadius: '12px' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyBox: 'center', background: 'var(--color-primary-soft)', justifyContent: 'center' }}>
                        <Award size={16} className="color-primary" />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span className="color-cyan" style={{ fontSize: '10px', fontWeight: 'bold' }}>🎯 推奨トレーニング再開</span>
                        <span style={{ fontSize: '12px', color: 'var(--text-primary)' }}>「{recGameName}」をプレイ</span>
                      </div>
                    </div>
                    <ChevronRight size={16} className="arrow-muted-icon" />
                  </div>

                  {/* 思考調律 */}
                  <div 
                    className={`glass-panel hover-lift ${!isTuningCompletedToday ? 'tuning-btn-glow' : ''}`}
                    onClick={() => { playSound('click'); setActiveGame('mindTuning'); }}
                    style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderRadius: '12px' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(16, 185, 129, 0.1)' }}>
                        <Brain size={16} className="color-emerald" />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span className="color-emerald" style={{ fontSize: '10px', fontWeight: 'bold' }}>🧠 デイリー調律ルーティン</span>
                        <span style={{ fontSize: '12px', color: 'var(--text-primary)' }}>
                          {isTuningCompletedToday ? '本日の調律は完了しました' : '本日の思考調律を起動'}
                        </span>
                      </div>
                    </div>
                    <ChevronRight size={16} className="arrow-muted-icon" />
                  </div>
                </div>
              );
            })()}

            {/* 簡易診断スキャン誘導（相性チェックや詳細パラメータ） */}
            <div className="glass-panel" style={{ padding: '12px', borderRadius: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  📊 レントゲン結果 ＆ コード
                </span>
                <button 
                  onClick={() => { playSound('click'); setActiveTab('diagnostics'); }}
                  className="btn btn-secondary"
                  style={{ fontSize: '10px', padding: '4px 8px' }}
                >
                  詳細・ブレインコード
                </button>
              </div>
              
              {/* コンパクトなレーダーチャート */}
              <div style={{ display: 'flex', justifyContent: 'center', width: '100%', maxWidth: '200px', margin: '0 auto' }}>
                <svg viewBox="0 0 320 300" style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
                  <polygon points="160,70 236.1,125.3 207,214.7 113,214.7 83.9,125.3" fill="none" stroke="var(--border-color)" strokeWidth="1" />
                  <polygon points="160,102 205.7,135.2 188.2,188.8 131.8,188.8 114.3,135.2" fill="none" stroke="var(--border-color)" strokeWidth="1" />
                  <line x1="160" y1="150" x2="160" y2="70" stroke="var(--border-color)" strokeDasharray="3,3" />
                  <line x1="160" y1="150" x2="236.1" y2="125.3" stroke="var(--border-color)" strokeDasharray="3,3" />
                  <line x1="160" y1="150" x2="207" y2="214.7" stroke="var(--border-color)" strokeDasharray="3,3" />
                  <line x1="160" y1="150" x2="113" y2="214.7" stroke="var(--border-color)" strokeDasharray="3,3" />
                  <line x1="160" y1="150" x2="83.9" y2="125.3" stroke="var(--border-color)" strokeDasharray="3,3" />
                  
                  <text x="160" y="52" textAnchor="middle" fill="var(--color-cyan)" fontSize="18" fontWeight="bold">事実</text>
                  <text x="255" y="125" textAnchor="start" fill="var(--color-emerald)" fontSize="18" fontWeight="bold">論理</text>
                  <text x="215" y="235" textAnchor="start" fill="#818cf8" fontSize="18" fontWeight="bold">戦略</text>
                  <text x="105" y="235" textAnchor="end" fill="var(--color-amber)" fontSize="18" fontWeight="bold">構造</text>
                  <text x="65" y="125" textAnchor="end" fill="var(--color-rose)" fontSize="18" fontWeight="bold">批判</text>

                  <polygon 
                    points={(() => {
                      const scale = 80 / 100;
                      const p1val = displayScores.factsOpinions || 0;
                      const p2val = displayScores.logicalValidity || 0;
                      const p3val = getStrategicScore();
                      const p4val = getRadicalScore();
                      const p5val = getCriticalScore();
                      return `${160},${150 - p1val * scale} ${160 + p2val * scale * 0.9511},${150 - p2val * scale * 0.3090} ${160 + p3val * scale * 0.5878},${150 + p3val * scale * 0.8090} ${160 - p4val * scale * 0.5878},${150 + p4val * scale * 0.8090} ${160 - p5val * scale * 0.9511},${150 - p5val * scale * 0.3090}`;
                    })()} 
                    fill="rgba(99, 102, 241, 0.25)" 
                    stroke="#6366f1" 
                    strokeWidth="2.5"
                  />
                </svg>
              </div>
            </div>
            
          </div>
        )}

        {/* ========================================================
           DIAGNOSTICS TAB
           ======================================================== */}
        {activeTab === 'diagnostics' && (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <button onClick={() => { playSound('click'); setActiveTab('home'); }} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px 0' }}>
                <ChevronLeft size={16} />
              </button>
              <h2 style={{ fontSize: '15px', fontWeight: 'bold', margin: 0 }}>📊 レントゲン結果 ＆ ブレインコード</h2>
            </div>
            
            <div className="glass-panel" style={{ padding: '12px', borderRadius: '12px', boxSizing: 'border-box' }}>
              <div style={{ display: 'flex', justifyContent: 'center', width: '100%', maxWidth: '240px', margin: '0 auto' }}>
                <svg viewBox="0 0 320 300" style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
                  <polygon points="160,70 236.1,125.3 207,214.7 113,214.7 83.9,125.3" fill="none" stroke="var(--border-color)" strokeWidth="1" />
                  <polygon points="160,102 205.7,135.2 188.2,188.8 131.8,188.8 114.3,135.2" fill="none" stroke="var(--border-color)" strokeWidth="1" />
                  <line x1="160" y1="150" x2="160" y2="70" stroke="var(--border-color)" strokeDasharray="3,3" />
                  <line x1="160" y1="150" x2="236.1" y2="125.3" stroke="var(--border-color)" strokeDasharray="3,3" />
                  <line x1="160" y1="150" x2="207" y2="214.7" stroke="var(--border-color)" strokeDasharray="3,3" />
                  <line x1="160" y1="150" x2="113" y2="214.7" stroke="var(--border-color)" strokeDasharray="3,3" />
                  <line x1="160" y1="150" x2="83.9" y2="125.3" stroke="var(--border-color)" strokeDasharray="3,3" />
                  
                  <text x="160" y="36" textAnchor="middle" fill="var(--color-cyan)" fontSize="13" fontWeight="bold">事実分析</text>
                  <text x="245" y="118" textAnchor="start" fill="var(--color-emerald)" fontSize="13" fontWeight="bold">演繹・推論</text>
                  <text x="215" y="245" textAnchor="start" fill="#818cf8" fontSize="13" fontWeight="bold">戦略思考</text>
                  <text x="105" y="245" textAnchor="end" fill="var(--color-amber)" fontSize="13" fontWeight="bold">構造化</text>
                  <text x="75" y="118" textAnchor="end" fill="var(--color-rose)" fontSize="13" fontWeight="bold">批判思考</text>

                  <polygon 
                    points={(() => {
                      const scale = 80 / 100;
                      const p1val = displayScores.factsOpinions || 0;
                      const p2val = displayScores.logicalValidity || 0;
                      const p3val = getStrategicScore();
                      const p4val = getRadicalScore();
                      const p5val = getCriticalScore();
                      return `${160},${150 - p1val * scale} ${160 + p2val * scale * 0.9511},${150 - p2val * scale * 0.3090} ${160 + p3val * scale * 0.5878},${150 + p3val * scale * 0.8090} ${160 - p4val * scale * 0.5878},${150 + p4val * scale * 0.8090} ${160 - p5val * scale * 0.9511},${150 - p5val * scale * 0.3090}`;
                    })()} 
                    fill="rgba(99, 102, 241, 0.25)" 
                    stroke="#6366f1" 
                    strokeWidth="2.5"
                  />
                </svg>
              </div>
              
              <div style={{ marginTop: '10px', boxSizing: 'border-box' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 'bold' }}>
                  <span className="color-primary" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Sparkles size={12} /> EQ共感対話力
                  </span>
                  <span>{getEmotionalScore()}%</span>
                </div>
                <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', marginTop: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${getEmotionalScore()}%`, height: '100%', background: 'var(--color-primary)' }} />
                </div>
              </div>
            </div>

            <FrictionMatcher 
              currentSpell={currentSpell}
              opponentSpell={opponentSpell}
              setOpponentSpell={setOpponentSpell}
              matchResult={matchResult}
              matchError={matchError}
              spellInput={spellInput}
              setSpellInput={setSpellInput}
              spellError={spellError}
              spellSuccess={spellSuccess}
              setSpellError={setSpellError}
              setSpellSuccess={setSpellSuccess}
              handleCheckFriction={handleCheckFriction}
              handleRestoreSpell={handleRestoreSpell}
              onCopyClick={onCopyClick}
              handleShareToX={handleShareToX}
            />
          </div>
        )}

        {/* ========================================================
           TRAINING TAB: トレーニングルーム
           ======================================================== */}
        {activeTab === 'training' && (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 'bold', margin: 0 }}>🏋️ 思考トレーニングルーム</h2>
            
            <div className="training-rooms-container" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {rooms.map(room => {
                const isRoomUnlocked = isFullUnlocked || (primaryDebugCategory === room.id);
                return (
                  <div 
                    key={room.id}
                    className={`glass-panel training-room-card ${isRoomUnlocked ? 'unlocked' : 'locked'}`}
                    style={{
                      borderLeft: `4px solid ${room.borderColor}`,
                      padding: '12px',
                      position: 'relative',
                      borderRadius: '12px'
                    }}
                  >
                    {!isRoomUnlocked && (
                      <div className="room-lock-overlay" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(10, 11, 16, 0.82)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', zIndex: 10, borderRadius: '12px', fontSize: '11px' }}>
                        <Lock size={12} />
                        <span>初回プレイクリアでアンロック</span>
                      </div>
                    )}

                    <div style={{ marginBottom: '10px' }}>
                      <h3 style={{ fontSize: '13px', fontWeight: 'bold', margin: 0, color: room.textColor }}>
                        {room.title}
                      </h3>
                      <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px', lineHeight: '1.3' }}>
                        {room.description}
                      </p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
                            className={`glass-panel ${isRoomUnlocked ? 'hover-lift' : ''}`}
                            style={{ 
                              cursor: isRoomUnlocked ? 'pointer' : 'not-allowed',
                              padding: '10px 12px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '4px',
                              border: '1px solid var(--border-color)',
                              borderRadius: '8px'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ color: room.textColor, fontSize: '9px', fontWeight: 'bold' }}>{game.moduleNum}</span>
                              {!isRoomUnlocked && <Lock size={10} className="text-muted-icon" />}
                            </div>
                            <h4 style={{ fontSize: '12px', fontWeight: 'bold', margin: 0 }}>{game.name}</h4>
                            <p style={{ fontSize: '10px', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.3' }}>{game.desc}</p>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: 'var(--text-muted)', marginTop: '2px' }}>
                              <span>難易度: {game.difficulty}</span>
                              <span style={{ color: room.textColor, fontWeight: 'bold' }}>ベスト: {score}%</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 特別ゲートへのアクセスバナー */}
            <div style={{ marginTop: '4px' }}>
              {gameState.level >= 5 ? (
                <div className="glass-panel" style={{ padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '12px' }}>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <span style={{ fontSize: '20px' }}>🔬</span>
                    <div>
                      <span style={{ fontSize: '8px', fontWeight: 'bold', color: 'var(--color-primary)', display: 'block' }}>UNLOCKED SPECIAL GATE</span>
                      <h3 style={{ fontSize: '12px', fontWeight: 'bold', margin: '1px 0 0 0' }}>脳内デバッグ・ラボへアクセス</h3>
                    </div>
                  </div>
                  <button onClick={() => { playSound('success'); setActiveGame('debugLab'); }} className="btn btn-primary" style={{ fontSize: '10px', padding: '6px 12px' }}>ラボへ</button>
                </div>
              ) : (
                <div className="glass-panel" style={{ padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '12px', opacity: 0.6 }}>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <span style={{ fontSize: '20px' }}>🔒</span>
                    <div>
                      <span style={{ fontSize: '8px', color: 'var(--text-muted)', display: 'block' }}>LOCKED GATE</span>
                      <h3 style={{ fontSize: '12px', fontWeight: 'bold', margin: '1px 0 0 0', color: 'var(--text-muted)' }}>脳内デバッグ・ラボ</h3>
                    </div>
                  </div>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Lvl 5で解放</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================
           BUGS TAB: 脳内バグ図鑑 ＆ 脳内バグノート
           ======================================================== */}
        {(activeTab === 'bugNote' || activeTab === 'encyclopedia') && (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* 上部サブタブ切り替え */}
            <div className="mobile-sub-tabs" style={{ display: 'flex', background: 'rgba(255,255,255,0.02)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <button 
                onClick={() => { playSound('click'); setBugSubTab('note'); setActiveTab('bugNote'); }} 
                className="sub-tab-btn"
                style={{ 
                  flex: 1, 
                  background: bugSubTab === 'note' ? 'var(--color-primary)' : 'none', 
                  color: bugSubTab === 'note' ? '#fff' : 'var(--text-secondary)',
                  border: 'none',
                  padding: '6px 0',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                🧠 バグノート ({(gameState.bugNote || []).filter(b => !b.solved).length})
              </button>
              <button 
                onClick={() => { playSound('click'); setBugSubTab('library'); setActiveTab('encyclopedia'); }} 
                className="sub-tab-btn"
                style={{ 
                  flex: 1, 
                  background: bugSubTab === 'library' ? 'var(--color-primary)' : 'none', 
                  color: bugSubTab === 'library' ? '#fff' : 'var(--text-secondary)',
                  border: 'none',
                  padding: '6px 0',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                📖 脳内バグ図鑑
              </button>
            </div>

            {/* バグノートコンテンツ */}
            {bugSubTab === 'note' && (
              <div className="fade-in">
                <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '1.4', margin: '0 0 10px 0' }}>
                  間違えた問題が自動記録されます。復習デバッグに正解すると <b>+50 XP</b>！
                </p>

                {(() => {
                  const bugs = gameState.bugNote || [];
                  const getCategoryStats = (gameId) => {
                    switch (gameId) {
                      case 'factsOpinions':
                      case 'logicalValidity':
                        return { name: 'ロジカル', color: 'var(--color-cyan)', room: 'logical' };
                      case 'fallacy':
                      case 'hiddenAssumption':
                      case 'fallacyHunter':
                        return { name: 'クリティカル', color: 'var(--color-rose)', room: 'critical' };
                      case 'logicTree':
                      case 'causalLoop':
                      case 'treeQuest':
                        return { name: 'ラディカル', color: 'var(--color-amber)', room: 'radical' };
                      case 'empathyDialogue':
                      case 'assertiveRewrite':
                      case 'eqSimulator':
                        return { name: 'エモーショナル', color: 'var(--color-primary)', room: 'emotional' };
                      default:
                        return { name: 'その他', color: 'var(--text-muted)', room: 'other' };
                    }
                  };

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
                    treeQuest: 'ツリー探索',
                    fallacyHunter: '誤謬スナイパー',
                    eqSimulator: 'EQシミュレーター'
                  };

                  const activeBugs = bugs.filter(b => !b.solved);
                  
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {activeBugs.length === 0 ? (
                        <div className="glass-panel text-center" style={{ padding: '20px', fontSize: '11px', color: 'var(--color-emerald)', fontWeight: 'bold', borderRadius: '12px' }}>
                          ✨ 素晴らしい！未解決のバグはありません。
                        </div>
                      ) : (
                        activeBugs.map((bug, index) => {
                          const cat = getCategoryStats(bug.gameId);
                          return (
                            <div key={index} className="glass-panel" style={{ borderLeft: `3px solid ${cat.color}`, padding: '10px', display: 'flex', flexDirection: 'column', gap: '6px', borderRadius: '8px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: 'var(--text-muted)' }}>
                                <span style={{ color: cat.color, fontWeight: 'bold' }}>{GAME_NAMES[bug.gameId] || bug.gameId}</span>
                                <span>検出: {bug.addedAt || '不明'}</span>
                              </div>
                              <div style={{ background: 'rgba(255,255,255,0.01)', padding: '6px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                                <p style={{ fontSize: '11px', margin: 0, lineHeight: '1.4' }}>{bug.question?.statement || bug.statement || '問題データが見つかりません。'}</p>
                              </div>
                              <button 
                                onClick={() => { playSound('click'); onStartReview(bug); }}
                                className="btn btn-primary"
                                style={{ alignSelf: 'flex-end', padding: '4px 10px', fontSize: '10px' }}
                              >
                                🛠️ デバッグ起動
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* バグ図鑑コンテンツ */}
            {bugSubTab === 'library' && (
              <div className="fade-in">
                <BugLibrary 
                  activeTab="encyclopedia"
                  librarySubTab={librarySubTab}
                  setLibrarySubTab={setLibrarySubTab}
                  gameState={gameState}
                  skillsData={skillsData}
                  diagnosticTypes={diagnosticTypes}
                  selectedBugId={selectedBugId}
                  setSelectedBugId={setSelectedBugId}
                  playSound={playSound}
                />
              </div>
            )}

          </div>
        )}

        {/* ========================================================
           ACHIEVEMENTS TAB: 実績・バッジ、思考調律履歴、環境音設定、カエル連携
           ======================================================== */}
        {activeTab === 'achievements' && (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* 実績バッジ */}
            <section style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <h2 style={{ fontSize: '14px', fontWeight: 'bold', margin: 0 }}>🏆 獲得実績バッジ</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {badgeDetails.map((badge, idx) => {
                  const isUnlocked = gameState.badges[idx];
                  return (
                    <div 
                      key={idx}
                      className={`glass-panel hover-lift ${isUnlocked ? 'unlocked' : 'locked'}`}
                      onClick={() => {
                        playSound('click');
                        setSelectedBadgeIndex(idx);
                        setShowBadgeModal(true);
                      }}
                      style={{
                        border: isUnlocked ? `1px solid ${badge.color}` : '1px solid var(--border-badge-locked)',
                        padding: '8px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        cursor: 'pointer',
                        borderRadius: '8px'
                      }}
                    >
                      <div style={{ 
                        color: isUnlocked ? badge.color : 'var(--text-badge-locked)',
                        background: isUnlocked ? `rgba(${badge.colorRgb}, 0.08)` : 'transparent',
                        width: '30px',
                        height: '30px',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        {isUnlocked ? <Sparkles size={14} /> : <HelpCircle size={14} />}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <h4 style={{ fontSize: '12px', fontWeight: 'bold', margin: 0, color: isUnlocked ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                          {isUnlocked ? badge.title : '未アンロック'}
                        </h4>
                        <p style={{ fontSize: '10px', color: 'var(--text-secondary)', margin: '1px 0 0 0' }}>{badge.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* 思考調律ログ履歴 */}
            <section id="tuning-log-section" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '14px', fontWeight: 'bold', margin: 0 }}>🧠 思考調律履歴</h2>
                <span style={{ fontSize: '10px', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px' }}>
                  調律: {(gameState.tuningHistory || []).length}回
                </span>
              </div>

              {(!gameState.tuningHistory || gameState.tuningHistory.length === 0) ? (
                <div className="glass-panel text-center" style={{ padding: '16px', fontSize: '11px', color: 'var(--text-muted)', borderRadius: '12px' }}>
                  🧠 思考調律の記録がありません。「思考調律」を実行しましょう。
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {gameState.tuningHistory.map((item, index) => (
                    <div key={index} className="glass-panel" style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: '6px', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', fontWeight: 'bold' }}>
                        <span style={{ color: 'var(--text-muted)' }}>📅 {item.date}</span>
                        {item.detectedBias && <span style={{ color: 'var(--color-cyan)' }}>🔍 {item.detectedBias}</span>}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ background: 'rgba(244, 63, 94, 0.02)', padding: '6px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                          <span style={{ fontSize: '8px', color: 'var(--color-rose)', fontWeight: 'bold' }}>主観</span>
                          <p style={{ fontSize: '11px', margin: '2px 0 0 0', lineHeight: '1.3' }}>{item.rawText}</p>
                        </div>
                        <div style={{ background: 'rgba(16, 185, 129, 0.02)', padding: '6px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                          <span style={{ fontSize: '8px', color: 'var(--color-emerald)', fontWeight: 'bold' }}>事実</span>
                          <p style={{ fontSize: '11px', margin: '2px 0 0 0', lineHeight: '1.3' }}>{item.tunedText}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* カード: 環境音・ASMR設定 (常時表示) */}
            <div className="glass-panel" style={{ borderRadius: '12px', padding: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px', color: 'var(--text-primary)' }}>
                <span>🎧</span>
                <span>環境音・ASMR設定</span>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '11px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontWeight: 'bold', color: 'var(--text-muted)', fontSize: '10px' }}>▼ バックグラウンド環境音</span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {[
                      { id: 'none', label: '🍵 静寂' },
                      { id: 'rain', label: '🌧️ 雨音' },
                      { id: 'cozy_pad', label: '🌀 思考' }
                    ].map(item => (
                      <button
                        key={item.id}
                        onClick={() => { playSound('click'); setBgmType(item.id); }}
                        className={`btn bgm-select-btn ${bgmType === item.id ? 'active' : ''}`}
                        style={{ padding: '4px 0', fontSize: '10px', flex: 1 }}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {bgmType !== 'none' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>音量</span>
                      <span>{Math.round(bgmVolume * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="0.8"
                      step="0.05"
                      value={bgmVolume}
                      onChange={(e) => setBgmVolume(parseFloat(e.target.value))}
                      style={{ width: '100%' }}
                    />
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: 'bold' }}>⌨️ タイピングASMR音</span>
                  </div>
                  <button
                    onClick={() => { playSound('click'); setKeyboardEnabled(!keyboardEnabled); }}
                    className={`btn ${keyboardEnabled ? 'active' : ''}`}
                    style={{ padding: '4px 10px', fontSize: '10px' }}
                  >
                    {keyboardEnabled ? 'ON' : 'OFF'}
                  </button>
                </div>
              </div>
            </div>

            {/* カード: カエル分析官公式連携ウィジェット (常時表示) */}
            <div className="glass-panel" style={{ borderRadius: '12px', padding: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px', color: 'var(--text-primary)' }}>
                <span>🐸</span>
                <span>公式連携：カエル分析官</span>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px' }}>
                <div style={{ width: '100%', height: '80px', borderRadius: '6px', overflow: 'hidden', background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)' }}>
                  <img 
                    src="/kaeru_analyst_eyecatch.jpg" 
                    alt="カエル分析官" 
                    onError={(e) => { e.target.style.display = 'none'; }}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
                
                <p style={{ color: 'var(--text-secondary)', margin: 0, lineHeight: '1.4' }}>
                  「カエル分析官」による、ロジックとエモを駆使した生存戦略エッセイとKindle書籍を公開中。
                </p>
                
                <div style={{ display: 'flex', gap: '6px' }}>
                  <a href="https://note.com/kaeru_lab" target="_blank" rel="noopener noreferrer" onClick={() => playSound('click')} className="btn btn-secondary" style={{ flex: 1, padding: '5px 0', textAlign: 'center', display: 'block', fontSize: '10px', textDecoration: 'none' }}>
                    📝 noteを読む
                  </a>
                  <a href="https://x.com/michellle_sato" target="_blank" rel="noopener noreferrer" onClick={() => playSound('click')} className="btn btn-secondary" style={{ flex: 1, padding: '5px 0', textAlign: 'center', display: 'block', fontSize: '10px', textDecoration: 'none' }}>
                    𝕏 をフォロー
                  </a>
                </div>
              </div>
            </div>

            {/* スポンサー広告 */}
            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px', borderRadius: '12px' }}>
              <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginBottom: '6px' }}>Sponsored Link</div>
              <RakutenWidget size="250x250" ts="1779836909524" />
            </div>

          </div>
        )}

      </main>

      {/* ========================================================
         ③ ボトムナビゲーション (iOS風)
         ======================================================== */}
      <nav className="mobile-bottom-nav" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, height: '60px', background: 'rgba(15, 17, 23, 0.94)', backdropFilter: 'blur(12px)', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-around', alignItems: 'center', zIndex: 100, paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <button 
          onClick={() => handleNavClick('home')}
          style={{ background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: isHomeActive ? 'var(--color-cyan)' : 'var(--text-secondary)', cursor: 'pointer', flex: 1, height: '100%', justifyContent: 'center' }}
        >
          <Home size={20} />
          <span style={{ fontSize: '9px', fontWeight: 'bold' }}>ホーム</span>
        </button>
        <button 
          onClick={() => handleNavClick('training')}
          style={{ background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: isTrainingActive ? 'var(--color-cyan)' : 'var(--text-secondary)', cursor: 'pointer', flex: 1, height: '100%', justifyContent: 'center' }}
        >
          <Brain size={20} />
          <span style={{ fontSize: '9px', fontWeight: 'bold' }}>練習ルーム</span>
        </button>
        <button 
          onClick={() => handleNavClick('bugs')}
          style={{ background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: isBugsActive ? 'var(--color-cyan)' : 'var(--text-secondary)', cursor: 'pointer', flex: 1, height: '100%', justifyContent: 'center' }}
        >
          <BookOpen size={20} />
          <span style={{ fontSize: '9px', fontWeight: 'bold' }}>脳内バグ</span>
        </button>
        <button 
          onClick={() => handleNavClick('achievements')}
          style={{ background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: isAchievementsActive ? 'var(--color-cyan)' : 'var(--text-secondary)', cursor: 'pointer', flex: 1, height: '100%', justifyContent: 'center' }}
        >
          <Award size={20} />
          <span style={{ fontSize: '9px', fontWeight: 'bold' }}>実績・設定</span>
        </button>
      </nav>

      {/* 実績バッジ詳細表示モーダル */}
      <BadgeModal 
        showBadgeModal={showBadgeModal}
        setShowBadgeModal={setShowBadgeModal}
        selectedBadgeIndex={selectedBadgeIndex}
        badgeDetails={badgeDetails}
        gameState={gameState}
        copiedBadgeIdx={copiedBadgeIdx}
        setCopiedBadgeIdx={setCopiedBadgeIdx}
        playSound={playSound}
        handleShareToX={handleShareToX}
      />

      {showToast && (
        <div className="copy-toast" style={{ position: 'fixed', bottom: '80px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(6, 182, 212, 0.9)', color: '#fff', padding: '8px 16px', borderRadius: '20px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px', zIndex: 110, boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
          <Sparkles size={12} />
          <span>ブレインコードをコピーしました！</span>
        </div>
      )}
    </div>
  );
}