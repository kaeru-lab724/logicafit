import React, { useState, useEffect } from 'react';
import { 
  Award, 
  Brain, 
  BookOpen, 
  Sparkles, 
  HelpCircle,
  TrendingUp,
  Lock,
  Unlock,
  ChevronLeft,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import RakutenWidget from '../common/RakutenWidget';
import { decodeState, calculateFriction } from '../../data/spellHelper';
import { diagnosticTypes } from '../../data/diagnosticData';
import { useSound } from '../../hooks/useSound';

// 切り出したサブコンポーネントのインポート
import LandingPage from './LandingPage';
import FrictionMatcher from './FrictionMatcher';
import BugLibrary from './BugLibrary';
import BadgeModal from './BadgeModal';
import MobileDashboard from './MobileDashboard';

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
    <div className="dashboard-root-wrapper fade-in">
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
           ② 診断完了後フェーズ（完全1カラム・レスポンシブダッシュボード）
           ======================================================= */
        <>
          {/* PC用レイアウト (幅768px以上で表示) */}
          <div className="pc-only-layout">
          {showIntroduction && (
            <div className="introduction-wrapper fade-in">
              <LandingPage 
                showCTA={false}
                playSound={playSound}
                setActiveGame={setActiveGame}
              />
            </div>
          )}

          <div className="dashboard-grid-layout" style={{ display: 'flex', flexDirection: 'row', gap: '24px', maxWidth: '1200px', margin: '0 auto', alignItems: 'flex-start' }}>
          
            {/* メインカラム（全情報を中央寄せ1カラムに統合） */}
            <div className="dashboard-main-column" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px', minWidth: 0 }}>
              
              {/* Tab Navigation Menu */}
              <div className="dashboard-tab-navigation" id="training-menu">
                {[
                  { id: 'home', label: '🏠 ホーム' },
                  { id: 'training', label: '🏋️ 思考練習' },
                  { id: 'diagnostics', label: '📊 レントゲン結果 ＆ コード' },
                  { id: 'bugNote', label: '🧠 バグノート' },
                  { id: 'encyclopedia', label: '📖 バグ図鑑' },
                  { id: 'achievements', label: '🏆 実績' }
                ].map(tab => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => { playSound('click'); setActiveTab(tab.id); }}
                      className={`tab-btn ${isActive ? 'active-tab' : 'inactive-tab'}`}
                      style={{
                        borderColor: isActive ? 'var(--color-primary)' : 'transparent',
                        color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)'
                      }}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Tab Content Display Area */}
              <div className="dashboard-tab-content-panel">
                
                {/* 0. HOME TAB */}
                {activeTab === 'home' && (
                  <div className="fade-in home-tab-columns-wrapper" style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
                    
                    {/* 左メインカラム：プロフィールカルーセル ＆ クイックアクション */}
                    <div className="home-left-column" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px', minWidth: 0 }}>

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
                        <p className="carousel-slide-desc">
                          {currentType?.description || charClass?.desc}
                        </p>
                        
                        {/* アコーディオン: 取扱説明書 (トリセツ) & 3大バグ */}
                        {currentType && (
                          <div className="accordion-wrapper">
                            <button
                              onClick={() => { playSound('click'); setShowBugDetails(!showBugDetails); }}
                              className="btn btn-secondary accordion-toggle-btn"
                              style={{
                                background: showBugDetails ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.01)'
                              }}
                            >
                              <span>{showBugDetails ? '▼ 取扱説明書と脳内バグを閉じる' : '▶ あなたの取扱説明書と脳内バグを見る'}</span>
                              <Sparkles size={14} className="color-cyan-icon" />
                            </button>

                            {showBugDetails && (
                              <div className="accordion-content fade-in">
                                <div className="accordion-item-box">
                                  <span className="accordion-item-label color-cyan">💼 工作でのバグ</span>
                                  <p className="accordion-item-text">{currentType?.workBug}</p>
                                </div>
                                <div className="accordion-item-box">
                                  <span className="accordion-item-label color-rose">🏡 私生活でのバグ</span>
                                  <p className="accordion-item-text">{currentType?.privateBug}</p>
                                </div>
                                <div className="accordion-item-box">
                                  <span className="accordion-item-label color-amber">⚡ ふとした瞬間のクセ</span>
                                  <p className="accordion-item-text">{currentType?.dailyHabit}</p>
                                </div>
                                <div className="accordion-item-box torisetsu-box">
                                  <span className="accordion-item-label color-emerald block-label">📋 取扱説明書</span>
                                  <span className="accordion-sub-label color-rose">● 地雷ポイント</span>
                                  <p className="accordion-item-text label-spacing">{currentType?.torisetsu?.jealousPoint}</p>
                                  <span className="accordion-sub-label color-emerald">● デバッグコマンド</span>
                                  <p className="accordion-item-text">{currentType?.torisetsu?.debugSpell}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    ),
                    actions: (
                      <div className="carousel-actions-row">
                        <button 
                          onClick={() => { 
                            playSound('click'); 
                            document.getElementById('training-menu')?.scrollIntoView({ behavior: 'smooth' }); 
                          }} 
                          className="btn btn-primary primary-action-btn"
                          style={{
                            background: isFullUnlocked 
                              ? 'linear-gradient(135deg, var(--color-primary) 0%, #7c3aed 100%)' 
                              : 'linear-gradient(135deg, var(--color-cyan) 0%, var(--color-primary) 100%)',
                            boxShadow: isFullUnlocked 
                              ? '0 4px 15px var(--color-primary-glow)' 
                              : '0 4px 15px rgba(6, 182, 212, 0.3)'
                          }}
                        >
                          🎯 {isFullUnlocked ? 'デバッグを再開する' : '最初の練習（デバッグ）へ'}
                        </button>
                        <button 
                          onClick={() => { playSound('click'); setActiveGame('diagnostic'); }} 
                          className="btn btn-secondary secondary-action-btn"
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
                      <p className="carousel-slide-desc">
                        LogiFitは、3分間のレントゲン（思考診断）であなたの認知の偏りを暴き、4つの思考ルーム（ロジカル、クリティカル、ラディカル、エモーショナル）でゲーム感覚で思考力をデバッグ・強化するジムです。
                      </p>
                    ),
                    actions: (
                      <div className="carousel-actions-row">
                        <button 
                          onClick={() => { playSound('click'); setShowIntroduction(!showIntroduction); }} 
                          className="btn btn-primary full-width-btn"
                          style={{
                            background: 'linear-gradient(135deg, var(--color-cyan) 0%, var(--color-primary) 100%)',
                            boxShadow: '0 4px 15px rgba(6, 182, 212, 0.3)'
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
                      <p className="carousel-slide-desc">
                        『へりくつ魔獣討伐』を廃止し、本質的な思考デバッグへリニューアル！HP・制限時間によるゲームオーバーをなくし、納得いくまで解説を読んで思考力を磨ける仕様になりました。
                      </p>
                    ),
                    actions: (
                      <div className="carousel-actions-row">
                        <button 
                          onClick={() => { playSound('click'); setActiveTab('encyclopedia'); setLibrarySubTab('bug'); }} 
                          className="btn btn-secondary flex-btn"
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
                        >
                          📖 マイ取扱説明書を表示
                        </button>
                      </div>
                    )
                  },
                  // Slide 4: Daily Mind Tuning (思考調律) Onboarding
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
                      <div className="carousel-slide-desc text-left">
                        <p style={{ margin: '0 0 8px 0' }}>
                          日常生活や仕事でのモヤモヤ・イライラは脳のメモリ（RAM）を浪費し、集中力や判断力を低下させます。
                        </p>
                        <div className="tuning-mini-onboarding">
                          <div>
                            <span className="onboarding-heading-green">👉 何をするの？</span>
                            <span className="onboarding-text-body">本音を書き出して脳内の「認知の偏り」を検出し、客観的な「事実ベース」に書き換えます。</span>
                          </div>
                          <div style={{ marginTop: '4px' }}>
                            <span className="onboarding-heading-green">👉 どうなるの？</span>
                            <span className="onboarding-text-body">感情的なループ思考が止まり、脳の処理能力が回復して「今やるべきこと」に集中できます。</span>
                          </div>
                        </div>
                      </div>
                    ),
                    actions: (
                      <div className="carousel-actions-row">
                        {(() => {
                          const todayStr = new Date().toLocaleDateString('sv'); // YYYY-MM-DD
                          const isTuningCompletedToday = gameState.lastTuningDate === todayStr;
                          return isTuningCompletedToday ? (
                            <div className="tuning-completed-actions" style={{ width: '100%' }}>
                              <div className="tuning-buttons-group" style={{ display: 'flex', gap: '8px', width: '100%' }}>
                                <button 
                                  onClick={() => { 
                                    playSound('click'); 
                                    setActiveTab('achievements'); 
                                    setTimeout(() => {
                                      document.getElementById('tuning-log-section')?.scrollIntoView({ behavior: 'smooth' });
                                    }, 100);
                                  }}
                                  className="btn btn-secondary tuning-history-link-btn"
                                  style={{ flex: 1 }}
                                >
                                  <span>✅ 本日完了 (履歴へ)</span>
                                </button>
                                <button 
                                  onClick={() => { playSound('click'); setActiveGame('mindTuning'); }} 
                                  className="btn btn-primary tuning-redo-btn"
                                  style={{ flex: 1 }}
                                >
                                  <span>🔄 もう一度調律する</span>
                                </button>
                              </div>
                              {onClearTuningToday && (
                                <div className="tuning-reset-debug-wrapper" style={{ marginTop: '8px', textAlign: 'center' }}>
                                  <button 
                                    onClick={() => {
                                      playSound('click');
                                      onClearTuningToday();
                                    }}
                                    className="tuning-debug-clear-btn"
                                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '10px', cursor: 'pointer' }}
                                  >
                                    🧪 [デバッグ] 本日の調律完了状態を解除
                                  </button>
                                </div>
                              )}
                            </div>
                           ) : (
                            <button 
                              onClick={() => { playSound('click'); setActiveGame('mindTuning'); }} 
                              className="btn btn-primary hover-lift tuning-btn-glow full-width-btn"
                              style={{ 
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
                    className="glass-panel carousel-panel-wrapper"
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                    style={{
                      borderLeft: `4px solid ${
                        activeSlide === 0 
                          ? (isFullUnlocked ? 'var(--color-primary)' : 'var(--color-cyan)')
                          : (activeSlide === 1 ? 'var(--color-cyan)' : (activeSlide === 2 ? 'var(--color-rose)' : '#10b981'))
                      }`,
                      minHeight: 'auto',
                      height: 'auto'
                    }}
                  >
                    <div 
                      key={activeSlide} 
                      className="fade-in carousel-slide-container"
                      style={{ display: 'flex', flexDirection: 'row', gap: '24px', alignItems: 'stretch' }}
                    >
                      {/* Left Column: Text & Buttons */}
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: 0 }}>
                        <div>
                          <div className="carousel-slide-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div className="carousel-badge-group">
                              <span 
                                className="carousel-slide-badge"
                                style={{ 
                                  color: slides[activeSlide].badgeTextColor, 
                                  background: slides[activeSlide].badgeColor, 
                                  border: `1px solid ${slides[activeSlide].badgeBorder}` 
                                }}
                              >
                                {slides[activeSlide].badge}
                              </span>
                              {slides[activeSlide].level && (
                                <span className="carousel-slide-level" style={{ marginLeft: '8px' }}>
                                  {slides[activeSlide].level}
                                </span>
                              )}
                            </div>

                            {/* Dot & Arrow Indicators */}
                            <div className="carousel-indicators-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <button
                                onClick={() => {
                                  playSound('click');
                                  setActiveSlide((prev) => (prev - 1 + slides.length) % slides.length);
                                }}
                                className="carousel-arrow-btn"
                                title="前へ"
                              >
                                <ChevronLeft size={16} />
                              </button>

                              <div className="carousel-dots-group" style={{ display: 'flex', gap: '4px' }}>
                                {slides.map((_, idx) => (
                                  <button
                                    key={idx}
                                    onClick={() => { playSound('click'); setActiveSlide(idx); }}
                                    className={`carousel-dot-btn ${idx === activeSlide ? 'active' : ''}`}
                                    title={slides[idx].badge}
                                  />
                                ))}
                              </div>

                              <button
                                onClick={() => {
                                  playSound('click');
                                  setActiveSlide((prev) => (prev + 1) % slides.length);
                                }}
                                className="carousel-arrow-btn"
                                title="次へ"
                              >
                                <ChevronRight size={16} />
                              </button>
                            </div>
                          </div>

                          <div className="carousel-title-row" style={{ display: 'flex', gap: '12px', marginTop: '16px', alignItems: 'center' }}>
                            <div>
                              <h2 className="text-glow carousel-slide-title" style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>
                                {slides[activeSlide].title}
                              </h2>
                              <p className="carousel-slide-tagline" style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                                {slides[activeSlide].tagline}
                              </p>
                            </div>
                          </div>

                          <div style={{ marginTop: '12px' }}>
                            {slides[activeSlide].desc}
                          </div>
                        </div>

                        <div className="carousel-actions-wrapper" style={{ marginTop: '20px' }}>
                          {slides[activeSlide].actions}
                        </div>
                      </div>

                      {/* Right Column: Visual theme illustration */}
                      <div className="carousel-visual-column" style={{ width: '130px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div className="carousel-emoji-glowing-circle" style={{
                          width: '100px',
                          height: '100px',
                          borderRadius: '50%',
                          background: slides[activeSlide].badgeColor || 'rgba(255,255,255,0.02)',
                          border: `1px solid ${slides[activeSlide].badgeBorder || 'var(--border-color)'}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '44px',
                          boxShadow: `0 0 25px ${slides[activeSlide].badgeBorder ? slides[activeSlide].badgeBorder.replace('0.15', '0.45').replace('0.2', '0.45') : 'rgba(255,255,255,0.1)'}`,
                          animation: 'pulse-scale 3s infinite ease-in-out'
                        }}>
                          {slides[activeSlide].icon}
                        </div>
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
                  <div className="quick-actions-row" style={{ display: 'flex', flexDirection: 'row', gap: '16px', width: '100%', boxSizing: 'border-box' }}>
                    {/* Recommended Game Action Card */}
                    <div 
                      className="glass-panel hover-lift quick-action-card recom-card"
                      onClick={() => {
                        playSound('click');
                        setActiveGame(recGameKey);
                      }}
                      style={{ 
                        cursor: 'pointer', 
                        flex: 1, 
                        display: 'flex', 
                        flexDirection: 'column', 
                        justifyContent: 'space-between', 
                        padding: '20px', 
                        minHeight: '140px',
                        borderLeft: '4px solid var(--color-cyan)',
                        boxSizing: 'border-box'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                          <div className="quick-action-icon-bg cyan-primary-bg" style={{ width: '36px', height: '36px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-primary-soft)' }}>
                            <Award size={18} className="color-primary" />
                          </div>
                          <span style={{ fontSize: '9px', fontWeight: 'bold', color: 'var(--color-cyan)', background: 'rgba(6, 182, 212, 0.05)', padding: '2px 8px', borderRadius: '12px', border: '1px solid rgba(6, 182, 212, 0.15)' }}>RECOMMENDED</span>
                        </div>
                        <h3 style={{ fontSize: '14.5px', fontWeight: 'bold', margin: '0 0 6px 0', color: 'var(--text-primary)' }}>思考練習を再開する</h3>
                        <p style={{ fontSize: '11.5px', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.4' }}>
                          現在のパラメータに基づき、「{recGameName}」の練習を推奨します。
                        </p>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
                        <span style={{ fontSize: '12px', color: 'var(--color-cyan)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          「{recGameName}」をプレイする
                        </span>
                        <ChevronRight size={16} className="color-cyan" />
                      </div>
                    </div>

                    {/* Daily Tuning Action Card */}
                    <div 
                      className={`glass-panel hover-lift quick-action-card tuning-card ${!isTuningCompletedToday ? 'tuning-btn-glow' : ''}`}
                      onClick={() => {
                        playSound('click');
                        setActiveGame('mindTuning');
                      }}
                      style={{ 
                        cursor: 'pointer', 
                        flex: 1, 
                        display: 'flex', 
                        flexDirection: 'column', 
                        justifyContent: 'space-between', 
                        padding: '20px', 
                        minHeight: '140px',
                        borderLeft: '4px solid #10b981',
                        boxSizing: 'border-box'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                          <div className="quick-action-icon-bg emerald-bg" style={{ width: '36px', height: '36px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(16, 185, 129, 0.1)' }}>
                            <Brain size={18} className="color-emerald" />
                          </div>
                          <span style={{ 
                            fontSize: '9px', 
                            fontWeight: 'bold', 
                            color: '#10b981', 
                            background: 'rgba(16, 185, 129, 0.05)', 
                            padding: '2px 8px', 
                            borderRadius: '12px', 
                            border: '1px solid rgba(16, 185, 129, 0.15)' 
                          }}>
                            {isTuningCompletedToday ? 'COMPLETED' : 'DAILY TUNING'}
                          </span>
                        </div>
                        <h3 style={{ fontSize: '14.5px', fontWeight: 'bold', margin: '0 0 6px 0', color: 'var(--text-primary)' }}>デイリー調律ルーティン</h3>
                        <p style={{ fontSize: '11.5px', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.4' }}>
                          思考の偏りをデバッグするための日常調律シナリオクイズ。
                        </p>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
                        <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {isTuningCompletedToday ? '本日の調律は完了しました' : '本日の思考調律を起動'}
                        </span>
                        <ChevronRight size={16} className="color-emerald" />
                      </div>
                    </div>
                  </div>
                );
              })()}



                    </div>

                    {/* 右パラメーターカラム：レーダーチャート ＆ 相性スキャン */}
                    <div className="home-right-column" style={{ width: '400px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                            {/* 思考力パラメーター (Radar Chart) */}
                      <div className="glass-panel radar-chart-panel" style={{ width: '100%', maxWidth: '450px', margin: '0 auto 10px auto', padding: '16px', boxSizing: 'border-box' }}>
                        <div className="radar-chart-title" style={{ fontSize: '14px', fontWeight: 'bold', textAlign: 'center', marginBottom: '10px' }}>
                          {isFullUnlocked ? '思考力パラメーター' : '診断結果スキャンマップ'}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'center', width: '100%', maxWidth: '280px', margin: '0 auto' }}>
                          <svg 
                            viewBox="0 0 320 300" 
                            style={{ width: '100%', height: 'auto', maxWidth: '100%', overflow: 'visible' }}
                            className="radar-chart-svg"
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

                            {/* The radar chart dynamic polygon */}
                            <polygon 
                              className="radar-poly-anim"
                              points={(() => {
                                const scale = 80 / 100;
                                
                                const p1val = displayScores.factsOpinions || 0;
                                const p2val = displayScores.logicalValidity || 0;
                                const p3val = getStrategicScore();
                                const p4val = getRadicalScore();
                                const p5val = getCriticalScore();

                                const p1x = 160;
                                const p1y = 150 - p1val * scale;

                                const p2x = 160 + p2val * scale * 0.9511;
                                const p2y = 150 - p2val * scale * 0.3090;

                                const p3x = 160 + p3val * scale * 0.5878;
                                const p3y = 150 + p3val * scale * 0.8090;

                                const p4x = 160 - p4val * scale * 0.5878;
                                const p4y = 150 + p4val * scale * 0.8090;

                                const p5x = 160 - p5val * scale * 0.9511;
                                const p5y = 150 - p5val * scale * 0.3090;

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
                        </div>
                        <div className="radar-eq-bar-group" style={{ marginTop: '15px', width: '100%', boxSizing: 'border-box' }}>
                          <div className="eq-bar-header" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 'bold' }}>
                            <span className="eq-label color-primary" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Sparkles size={14} />
                              EQ共感対話力
                            </span>
                            <span className="eq-value">
                              {getEmotionalScore()}%
                            </span>
                          </div>
                          <div className="eq-bar-container" style={{ width: '100%', height: '5px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', marginTop: '6px', overflow: 'hidden' }}>
                            <div 
                              className="eq-bar-fill"
                              style={{ width: `${getEmotionalScore()}%`, height: '100%', background: 'var(--color-primary)' }} 
                            />
                          </div>
                        </div>
                      </div>

                      {/* 脳内摩擦係数（相性）チェック ＆ ブレインコード */}
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

                  </div>
                )}
                
                {/* 1. TRAINING MENU TAB */}
                {activeTab === 'training' && (
                  <div className="fade-in">
                    <h2 className="tab-title" style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 10px 0' }}>
                      {isFullUnlocked 
                        ? (mode === 'daily' ? '思考トレーニングルーム（日常編・入門）' : '思考トレーニングルーム（ビジネス編）')
                        : 'シングルフォーカストレーニングルーム'
                      }
                    </h2>

                    <p className="tab-intro-desc">
                      思考のクセ（弱点）を克服し、脳内OSをデバッグするためのトレーニングゲームです。
                      出題されるシチュエーションを元に、事実と意見の選別や論理の歪みを特定し、ベストスコア100%を目指して各部屋のクイズに挑戦しましょう。
                    </p>

                    {/* Unified Rooms View */}
                    <div className="training-rooms-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      {rooms.map(room => {
                        const isRoomUnlocked = isFullUnlocked || (primaryDebugCategory === room.id);
                        return (
                          <div 
                            key={room.id}
                            className={`glass-panel training-room-card ${isRoomUnlocked ? 'unlocked' : 'locked'}`}
                            style={{
                              borderLeft: `5px solid ${room.borderColor}`,
                              padding: '16px',
                              position: 'relative'
                            }}
                          >
                            {/* Lock banner overlay for locked rooms */}
                            {!isRoomUnlocked && (
                              <div className="room-lock-overlay" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(10, 11, 16, 0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', zIndex: 10, borderRadius: '8px' }}>
                                <Lock size={14} />
                                <span>初回プレイクリアでアンロック</span>
                              </div>
                            )}

                            {/* Room Header */}
                            <div className="room-header-section" style={{ marginBottom: '16px' }}>
                              <h3 className="room-title-text" style={{ fontSize: '16px', fontWeight: 'bold', margin: 0, color: room.textColor }}>
                                {room.title}
                              </h3>
                              <p className="room-desc-text" style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                {room.description}
                              </p>
                            </div>

                            {/* Room Content (Games & Spinoffs) */}
                            <div className="grid-training-responsive" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
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
                                    className={`glass-panel training-game-card ${isRoomUnlocked ? 'hover-lift' : ''}`}
                                    style={{ 
                                      cursor: isRoomUnlocked ? 'pointer' : 'not-allowed',
                                      padding: '12px 16px',
                                      display: 'flex',
                                      flexDirection: 'column',
                                      gap: '6px',
                                      border: '1px solid var(--border-color)'
                                    }}
                                  >
                                    <div className="game-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <div className="game-module-num" style={{ color: room.textColor, fontSize: '10px', fontWeight: 'bold' }}>
                                        {game.moduleNum}
                                      </div>
                                      {!isRoomUnlocked && (
                                        <Lock size={12} className="text-muted-icon" />
                                      )}
                                    </div>
                                    <h4 className="game-card-title" style={{ fontSize: '14px', fontWeight: 'bold', margin: 0 }}>
                                      {game.name}
                                    </h4>
                                    <p className="game-card-desc" style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0 }}>
                                      {game.desc}
                                    </p>
                                    <div className="game-card-footer" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                      <span className="game-difficulty">難易度: {game.difficulty}</span>
                                      <span className="game-best-score" style={{ color: room.textColor, fontWeight: 'bold' }}>
                                        ベスト: {score}%
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* プロフェッショナル（上級）ステージへの扉バナー */}
                    <div className="lab-banner-wrapper" style={{ marginTop: '20px' }}>
                      {gameState.level >= 5 ? (
                        /* アンロック状態 */
                        <div className="glass-panel lab-banner-active" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div className="lab-banner-content" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <span className="lab-gate-icon" style={{ fontSize: '24px' }}>🔬</span>
                            <div className="lab-banner-text">
                              <span className="lab-badge-label" style={{ fontSize: '9px', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                                UNLOCKED SPECIAL GATE
                              </span>
                              <h3 className="lab-title-text" style={{ fontSize: '14px', fontWeight: 'bold', margin: '2px 0 0 0' }}>
                                脳内デバッグ・ラボへアクセス
                              </h3>
                              <p className="lab-desc-text" style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                                応用診断モジュール『Fallacy Hunter』等のデバッグセッションが解放されました。
                              </p>
                            </div>
                          </div>
                          <button 
                            onClick={() => { playSound('success'); setActiveGame('debugLab'); }}
                            className="btn btn-primary lab-enter-btn"
                          >
                            <span>ラボに入る</span>
                            <span className="arrow-icon">→</span>
                          </button>
                        </div>
                      ) : (
                        /* ロック状態 */
                        <div 
                          onClick={() => playSound('incorrect')}
                          className="glass-panel lab-banner-locked"
                          style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'not-allowed', opacity: 0.7 }}
                        >
                          <div className="lab-banner-content" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <span className="locked-gate-icon" style={{ fontSize: '24px' }}>🔒</span>
                            <div className="lab-banner-text">
                              <span className="lab-badge-label-locked" style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
                                LOCKED GATE
                              </span>
                              <h3 className="lab-title-text-locked" style={{ fontSize: '14px', fontWeight: 'bold', margin: '2px 0 0 0', color: 'var(--text-muted)' }}>
                                脳内デバッグ・ラボ
                              </h3>
                              <p className="lab-desc-text-locked" style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                                アンロック条件：レベル5に到達する（現在のレベル: {gameState.level}）
                              </p>
                            </div>
                          </div>
                          <div className="lab-locked-badge" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            ロック中
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 2. DIAGNOSTICS TAB */}
                {activeTab === 'diagnostics' && (
                  <div className="fade-in diagnostics-tab-container">
                    <h2 className="tab-title" style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 10px 0' }}>
                      📊 レントゲン結果 ＆ ブレインコード
                    </h2>
                    <p className="tab-intro-desc">
                      思考レントゲン診断によって検出された、あなたの脳内パラメータとブレインコード（思考の指紋）です。
                      他者のコードと照らし合わせて「思考の摩擦」をスキャンすることもできます。
                    </p>
                    
                    <div className="diagnostics-grid-layout" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      {/* 思考力パラメーター (Radar Chart) */}
                      <div className="glass-panel radar-chart-panel" style={{ width: '100%', maxWidth: '450px', margin: '0 auto 10px auto', padding: '16px', boxSizing: 'border-box' }}>
                        <div className="radar-chart-title" style={{ fontSize: '14px', fontWeight: 'bold', textAlign: 'center', marginBottom: '10px' }}>
                          {isFullUnlocked ? '思考力パラメーター' : '診断結果スキャンマップ'}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'center', width: '100%', maxWidth: '280px', margin: '0 auto' }}>
                          <svg 
                            viewBox="0 0 320 300" 
                            style={{ width: '100%', height: 'auto', maxWidth: '100%', overflow: 'visible' }}
                            className="radar-chart-svg"
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

                            {/* The radar chart dynamic polygon */}
                            <polygon 
                              className="radar-poly-anim"
                              points={(() => {
                                const scale = 80 / 100;
                                
                                const p1val = displayScores.factsOpinions || 0;
                                const p2val = displayScores.logicalValidity || 0;
                                const p3val = getStrategicScore();
                                const p4val = getRadicalScore();
                                const p5val = getCriticalScore();

                                const p1x = 160;
                                const p1y = 150 - p1val * scale;

                                const p2x = 160 + p2val * scale * 0.9511;
                                const p2y = 150 - p2val * scale * 0.3090;

                                const p3x = 160 + p3val * scale * 0.5878;
                                const p3y = 150 + p3val * scale * 0.8090;

                                const p4x = 160 - p4val * scale * 0.5878;
                                const p4y = 150 + p4val * scale * 0.8090;

                                const p5x = 160 - p5val * scale * 0.9511;
                                const p5y = 150 - p5val * scale * 0.3090;

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
                        </div>
                        <div className="radar-eq-bar-group" style={{ marginTop: '15px', width: '100%', boxSizing: 'border-box' }}>
                          <div className="eq-bar-header" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 'bold' }}>
                            <span className="eq-label color-primary" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Sparkles size={14} />
                              EQ共感対話力
                            </span>
                            <span className="eq-value">
                              {getEmotionalScore()}%
                            </span>
                          </div>
                          <div className="eq-bar-container" style={{ width: '100%', height: '5px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', marginTop: '6px', overflow: 'hidden' }}>
                            <div 
                              className="eq-bar-fill"
                              style={{ width: `${getEmotionalScore()}%`, height: '100%', background: 'var(--color-primary)' }} 
                            />
                          </div>
                        </div>
                      </div>

                      {/* 脳内摩擦係数（相性）チェック ＆ ブレインコード */}
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
                  </div>
                )}

                {/* 3. BUG LIBRARY TAB */}
                <BugLibrary 
                  activeTab={activeTab}
                  librarySubTab={librarySubTab}
                  setLibrarySubTab={setLibrarySubTab}
                  gameState={gameState}
                  skillsData={skillsData}
                  diagnosticTypes={diagnosticTypes}
                  selectedBugId={selectedBugId}
                  setSelectedBugId={setSelectedBugId}
                  playSound={playSound}
                />

                {/* 4. BUG NOTE TAB */}
                {activeTab === 'bugNote' && (
                  <div className="fade-in">
                    <section className="text-left">
                      <div className="bug-note-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <h2 className="bug-note-title" style={{ fontSize: '18px', fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Brain size={20} className="color-cyan-icon" />
                          脳内バグノート
                        </h2>
                        <span className="bug-note-active-count" style={{ fontSize: '11px', background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '6px' }}>
                          未解決バグ: {(gameState.bugNote || []).filter(b => !b.solved).length} 件
                        </span>
                      </div>

                      <p className="bug-note-desc">
                        トレーニングで間違えた問題が、自動的に「脳内バグ」として記録されます。
                        「デバッグ起動」ボタンから復習モードに挑戦し、正解すると <b>+50 XP</b> 獲得！
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
                        const solvedBugs = bugs.filter(b => b.solved);

                        return (
                          <div className="bug-note-content-area" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div className="grid-summary-responsive" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                              {Object.values(categoryCounts).map(cat => (
                                <div key={cat.name} className="glass-panel bug-stat-card" style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px' }}>
                                  <span className="bug-stat-title" style={{ color: cat.color, fontSize: '12px', fontWeight: 'bold' }}>{cat.name}</span>
                                  <div className="bug-stat-nums" style={{ fontSize: '12px' }}>
                                    <span className="active-num" style={{ fontWeight: 'bold' }}>{cat.active}</span>
                                    <span className="total-num" style={{ color: 'var(--text-muted)' }}> / 全 {cat.total} 件</span>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* 未解決のバグ一覧 */}
                            <h3 className="section-sub-title" style={{ fontSize: '13px', fontWeight: 'bold', margin: '10px 0 0 0' }}>📌 未解決の脳内バグ (要デバッグ)</h3>
                            {activeBugs.length === 0 ? (
                              <div className="glass-panel empty-bugs-notice text-center" style={{ padding: '16px', fontSize: '12px', color: 'var(--color-emerald)', fontWeight: 'bold' }}>
                                ✨ 素晴らしい！現在、未解決のバグはありません。
                              </div>
                            ) : (
                              <div className="bugs-list-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {activeBugs.map((bug, index) => {
                                  const cat = getCategoryStats(bug.gameId);
                                  return (
                                    <div key={index} className="glass-panel bug-item-row" style={{ borderLeft: `4px solid ${cat.color}`, padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                      <div className="bug-item-meta" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)' }}>
                                        <span className="bug-game-badge" style={{ color: cat.color, fontWeight: 'bold' }}>
                                          {GAME_NAMES[bug.gameId] || bug.gameId}
                                        </span>
                                        <span className="bug-registered-date">
                                          検出: {bug.addedAt || '不明'}
                                        </span>
                                      </div>
                                      <div className="bug-statement-box" style={{ background: 'rgba(255,255,255,0.01)', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                                        <p className="bug-statement-text" style={{ fontSize: '12px', margin: 0, lineHeight: '1.4' }}>{bug.question?.statement || bug.statement || '問題データが見つかりません。'}</p>
                                      </div>
                                      <button 
                                        onClick={() => {
                                          playSound('click');
                                          onStartReview(bug);
                                        }}
                                        className="btn btn-primary bug-debug-trigger-btn"
                                        style={{ alignSelf: 'flex-end', padding: '6px 12px', fontSize: '11px' }}
                                      >
                                        🛠️ デバッグを起動
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {/* 解決済みのバグ一覧 (履歴) */}
                            {solvedBugs.length > 0 && (
                              <div className="solved-bugs-area" style={{ marginTop: '10px' }}>
                                <h3 className="section-sub-title text-muted" style={{ fontSize: '13px', fontWeight: 'bold', margin: '0 0 10px 0', color: 'var(--text-muted)' }}>✅ 解決済みのバグ (ログ履歴)</h3>
                                <div className="bugs-list-wrapper solved-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px', opacity: 0.7 }}>
                                  {solvedBugs.map((bug, index) => {
                                    const cat = getCategoryStats(bug.gameId);
                                    return (
                                      <div key={index} className="glass-panel bug-item-row solved" style={{ borderLeft: '4px solid #10b981', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        <div className="bug-item-meta" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)' }}>
                                          <span className="bug-game-badge solved-badge" style={{ color: '#10b981', fontWeight: 'bold' }}>
                                            {GAME_NAMES[bug.gameId] || bug.gameId} (解決済み)
                                          </span>
                                          <span className="bug-registered-date">
                                            デバッグ完了: {bug.solvedAt || '完了'}
                                          </span>
                                        </div>
                                        <div className="bug-statement-box" style={{ background: 'rgba(255,255,255,0.01)', padding: '6px 8px', borderRadius: '4px' }}>
                                          <p className="bug-statement-text line-through" style={{ fontSize: '11px', margin: 0, textDecoration: 'line-through' }}>{bug.question?.statement || bug.statement}</p>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </section>
                  </div>
                )}

                {/* 5. ACHIEVEMENTS & TUNING LOG TAB */}
                {activeTab === 'achievements' && (
                  <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                    {/* Achievements Section */}
                    <section className="text-left">
                      <h2 className="tab-title" style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 10px 0' }}>
                        獲得バッジ・実績
                      </h2>

                      <p className="tab-intro-desc">
                        思考トレーニングの成果やレベルアップ、特定条件の達成に応じて授与される称号（バッジ）です。タップすると現実世界の効能やコピペ用特効薬フレーズを確認できます。
                      </p>

                      <div className="grid-badges-responsive" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {badgeDetails.map((badge, idx) => {
                          const isUnlocked = gameState.badges[idx];
                          return (
                            <div 
                              key={idx}
                              className={`glass-panel hover-lift badge-card ${isUnlocked ? 'unlocked' : 'locked'}`}
                              onClick={() => {
                                playSound('click');
                                setSelectedBadgeIndex(idx);
                                setShowBadgeModal(true);
                              }}
                              style={{
                                border: isUnlocked ? `1px solid ${badge.color}` : '1px solid var(--border-badge-locked)',
                                boxShadow: isUnlocked 
                                  ? `0 8px 24px rgba(0, 0, 0, 0.08), 0 0 15px rgba(${badge.colorRgb}, 0.08)` 
                                  : 'none',
                                padding: '10px 12px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                cursor: 'pointer'
                              }}
                            >
                              <div 
                                className="badge-card-icon"
                                style={{ 
                                  color: isUnlocked ? badge.color : 'var(--text-badge-locked)',
                                  background: isUnlocked ? `rgba(${badge.colorRgb}, 0.08)` : 'transparent',
                                  width: '36px',
                                  height: '36px',
                                  borderRadius: '8px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0
                                }}
                              >
                                {isUnlocked ? <Sparkles size={18} /> : <HelpCircle size={18} />}
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <h4 className={`badge-card-title ${isUnlocked ? '' : 'text-muted'}`} style={{ fontSize: '13px', fontWeight: 'bold', margin: 0 }}>
                                  {isUnlocked ? badge.title : '未アンロック'}
                                </h4>
                                <p className="badge-card-desc" style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                                  {badge.desc}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </section>

                    {/* Mind Tuning Log Section */}
                    <section className="text-left" id="tuning-log-section">
                      <div className="tuning-log-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <h2 className="tuning-log-title" style={{ fontSize: '18px', fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <TrendingUp size={20} className="color-primary-icon" />
                          思考調律 (Mind Tuning) ログ履歴
                        </h2>
                        <span className="tuning-log-badge" style={{ fontSize: '11px', background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '6px' }}>
                          合計調律: {(gameState.tuningHistory || []).length} 回
                        </span>
                      </div>

                      <p className="tuning-log-desc">
                        日々のモヤモヤ（本音・主観）を吐き出し、認知バイアスをデバッグして客観的事実に書き換えたログ一覧です。
                      </p>

                      {(!gameState.tuningHistory || gameState.tuningHistory.length === 0) ? (
                        <div className="glass-panel empty-tuning-notice text-center" style={{ padding: '20px', fontSize: '12px', color: 'var(--text-muted)' }}>
                          🧠 まだ思考調律の記録がありません。「思考調律」モジュールを実行して、脳のメモリを解放しましょう。
                        </div>
                      ) : (
                        <div className="tuning-logs-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          {gameState.tuningHistory.map((item, index) => (
                            <div key={index} className="glass-panel tuning-log-item" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <div className="tuning-log-meta" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: 'bold' }}>
                                <span className="tuning-log-date" style={{ color: 'var(--text-muted)' }}>📅 調律日: {item.date}</span>
                                {item.detectedBias && (
                                  <span className="tuning-bias-type-badge" style={{ color: 'var(--color-cyan)' }}>
                                    🔍 検出バイアス: {item.detectedBias}
                                  </span>
                                )}
                              </div>
                              <div className="tuning-log-comparison-grid" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <div className="tuning-log-box raw-box" style={{ background: 'rgba(244, 63, 94, 0.02)', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                                  <span className="tuning-box-label color-rose" style={{ fontSize: '10px', fontWeight: 'bold' }}>▼ 脳内のノイズ（主観・本音）</span>
                                  <p className="tuning-log-text" style={{ fontSize: '12px', margin: '4px 0 0 0', lineHeight: '1.4' }}>{item.rawText}</p>
                                </div>
                                <div className="tuning-log-box tuned-box" style={{ background: 'rgba(16, 185, 129, 0.02)', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                                  <span className="tuning-box-label color-emerald" style={{ fontSize: '10px', fontWeight: 'bold' }}>▼ 調律後のコード（客観・事実）</span>
                                  <p className="tuning-log-text" style={{ fontSize: '12px', margin: '4px 0 0 0', lineHeight: '1.4' }}>{item.tunedText}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </section>
                  </div>
                )}
                
              </div>

              {/* ========================================================
                 ③ フッターアコーディオンセクション (タブの外側最下部)
                 ======================================================== */}
              
              
            </div>
              {/* 右サイドバーカラム (PC専用) */}
              <div className="dashboard-sidebar-column" style={{ width: '320px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* カード 1: 環境音・ASMR設定 (常時表示) */}
                <div className="glass-panel" style={{ borderRadius: '12px', padding: '16px' }}>
                  <div className="sidebar-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 'bold', marginBottom: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', color: 'var(--text-primary)' }}>
                    <span>🎧</span>
                    <span>環境音・ASMR設定</span>
                  </div>
                  
                  <div className="sound-settings-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '12px' }}>
                    <p className="sound-desc" style={{ color: 'var(--text-secondary)', margin: 0, lineHeight: '1.4' }}>
                      思考に集中するためのBGMや、タイピング時の心地よい打鍵音をその場で合成・再生します。
                    </p>
                    
                    {/* BGM Selector */}
                    <div className="sound-selector-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <span className="sound-selector-label" style={{ fontWeight: 'bold', fontSize: '11px', color: 'var(--text-muted)' }}>▼ バックグラウンド環境音</span>
                      <div className="sound-selector-buttons" style={{ display: 'flex', gap: '8px' }}>
                        {[
                          { id: 'none', label: '🍵 静寂' },
                          { id: 'rain', label: '🌧️ 雨音' },
                          { id: 'cozy_pad', label: '🌀 思考パッド' }
                        ].map(item => (
                          <button
                            key={item.id}
                            onClick={() => { playSound('click'); setBgmType(item.id); }}
                            className={`btn bgm-select-btn ${bgmType === item.id ? 'active' : ''}`}
                            style={{ padding: '6px 12px', fontSize: '11px', flex: 1 }}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* BGM Volume Slider */}
                    {bgmType !== 'none' && (
                      <div className="sound-volume-slider-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div className="sound-volume-header" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                          <span className="volume-label">BGM音量</span>
                          <span className="volume-value">{Math.round(bgmVolume * 100)}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="0.8"
                          step="0.05"
                          value={bgmVolume}
                          onChange={(e) => setBgmVolume(parseFloat(e.target.value))}
                          className="sound-volume-range"
                          style={{ width: '100%' }}
                        />
                      </div>
                    )}

                    {/* Keyboard ASMR Switch */}
                    <div className="asmr-switch-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid var(--border-color)' }}>
                      <div className="asmr-switch-text" style={{ display: 'flex', flexDirection: 'column' }}>
                        <span className="asmr-label" style={{ fontWeight: 'bold' }}>⌨️ タイピングASMR音</span>
                        <span className="asmr-sub-label" style={{ fontSize: '10px', color: 'var(--text-muted)' }}>打鍵音を有効化</span>
                      </div>
                      <button
                        onClick={() => { playSound('click'); setKeyboardEnabled(!keyboardEnabled); }}
                        className={`btn asmr-toggle-btn ${keyboardEnabled ? 'active' : ''}`}
                        style={{ padding: '6px 12px', fontSize: '11px' }}
                      >
                        {keyboardEnabled ? 'ON' : 'OFF'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* カード 2: 公式連携：カエル分析官 (常時表示) */}
                <div className="glass-panel" style={{ borderRadius: '12px', padding: '16px' }}>
                  <div className="sidebar-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 'bold', marginBottom: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', color: 'var(--text-primary)' }}>
                    <span>🐸</span>
                    <span>公式連携：カエル分析官</span>
                  </div>
                  
                  <div className="kaeru-widget-body" style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px' }}>
                    <div className="kaeru-widget-image-container" style={{ width: '100%', height: '100px', borderRadius: '8px', overflow: 'hidden', position: 'relative', background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)' }}>
                      <img 
                        src="/kaeru_analyst_eyecatch.jpg" 
                        alt="カエル分析官" 
                        className="kaeru-widget-img"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                    
                    <p className="kaeru-widget-desc" style={{ color: 'var(--text-secondary)', margin: 0, lineHeight: '1.4' }}>
                      「カエル分析官」による、ロジックとエモを駆使した生存戦略エッセイとKindle書籍を公開中。
                    </p>
                    
                    <div className="kaeru-widget-buttons" style={{ display: 'flex', gap: '8px' }}>
                      <a 
                        href="https://note.com/kaeru_lab" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        onClick={() => playSound('click')}
                        className="btn btn-secondary kaeru-btn-note"
                        style={{ flex: 1, padding: '6px 0', textAlign: 'center', display: 'block', fontSize: '11px', textDecoration: 'none' }}
                      >
                        📝 noteを読む
                      </a>
                      <a 
                        href="https://x.com/michellle_sato" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        onClick={() => playSound('click')}
                        className="btn btn-secondary kaeru-btn-x"
                        style={{ flex: 1, padding: '6px 0', textAlign: 'center', display: 'block', fontSize: '11px', textDecoration: 'none' }}
                      >
                        𝕏 をフォロー
                      </a>
                    </div>
                  </div>
                </div>

                {/* 常時表示：スポンサー広告 */}
                <div className="glass-panel sponsor-panel" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px', borderRadius: '12px' }}>
                  <div className="sponsor-label" style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                    Sponsored Link
                  </div>
                  <RakutenWidget size="250x250" ts="1779836909524" />
                </div>
              </div>
              </div>

          </div>

          {/* モバイル用レイアウト (幅767px以下で表示) */}
          <div className="mobile-only-layout">
            <MobileDashboard 
              isFullUnlocked={isFullUnlocked}
              gameState={gameState}
              charClass={charClass}
              playSound={playSound}
              setActiveGame={setActiveGame}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              mode={mode}
              displayScores={displayScores}
              primaryDebugCategory={primaryDebugCategory}
              rooms={rooms}
              spellInput={spellInput}
              setSpellInput={setSpellInput}
              spellError={spellError}
              setSpellError={setSpellError}
              spellSuccess={spellSuccess}
              setSpellSuccess={setSpellSuccess}
              handleRestoreSpell={handleRestoreSpell}
              handleCopySpell={handleCopySpell}
              currentSpell={currentSpell}
              setShowGuideModal={setShowGuideModal}
              badgeDetails={badgeDetails}
              skillsData={skillsData}
              onUnlockType={onUnlockType}
              onStartReview={onStartReview}
              onClearTuningToday={onClearTuningToday}
              setMode={setMode}
              theme={theme}
              setTheme={setTheme}
              muted={muted}
              toggleMute={toggleMute}
 />
          </div>

        </>
      )}

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
        <div className="copy-toast">
          <Sparkles size={16} className="color-primary-icon" />
          <span>ブレインコードをクリップボードにコピーしました！</span>
        </div>
      )}
    </div>
  );
}
