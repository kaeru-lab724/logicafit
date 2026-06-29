import React, { useState, useEffect, useRef } from 'react';
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
  ChevronDown,
  Sliders,
  Volume2,
  VolumeX,
  Sun,
  Moon,
  Trash2,
  KeyRound,
  Copy,
  Download,
  Upload
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
import CyberConsole from '../common/CyberConsole';

// 自動推奨ゲームのキー選定
const getRecommendedGameKey = (scores) => {
  const keys = ['factsOpinions', 'logicalValidity', 'logicTree', 'fallacy', 'empathyDialogue', 'hiddenAssumption', 'causalLoop', 'assertiveRewrite', 'strategic', 'gameTheory', 'parentingDialogue'];
  
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
    hiddenAssumption: '隠れた前提の特定',
    causalLoop: '因果ループ',
    assertiveRewrite: 'アサーティブ',
    strategic: '戦略介入シミュレーター',
    gameTheory: 'ゲーム理論・戦略的選択',
    empathyDialogue: '共感対話',
    parentingDialogue: 'こそだて言葉かけ調律'
  };
  return names[key] || '';
};

export default function Dashboard({
  isNewUser,
  isFullUnlocked,
  gameState,
  activeScores,
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
  setMode,
  theme,
  setTheme,
  muted,
  toggleMute,
  handleExportData,
  handleImportData
}) {
  const fileInputRef = useRef(null);
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (handleImportData) {
          handleImportData(data);
        }
      } catch (err) {
        alert('不正なファイル形式です。JSONファイルを読み込んでください。');
      }
    };
    reader.readAsText(file);
  };

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
    const appUrl = 'https://www.logicafit.site/';
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
              
              {/* Cyber Console Terminal Status Ticker */}
              {(activeTab === 'home' || activeTab === 'achievements' || activeTab === 'training' || activeTab === 'bugNote' || activeTab === 'diagnostics' || activeTab === 'encyclopedia') && (
                <CyberConsole 
                  gameState={gameState}
                  activeScores={activeScores}
                  playSound={playSound}
                  setActiveGame={setActiveGame}
                  setActiveTab={setActiveTab}
                />
              )}

              {/* Tab Navigation Menu */}
              {(activeTab === 'home' || activeTab === 'achievements') && (
                <div className="dashboard-tab-navigation" id="training-menu">
                  {[
                    { id: 'home', label: '🧠 ダッシュボード' },
                    { id: 'achievements', label: '🏆 実績・設定' }
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
              )}

              {/* Tab Content Display Area */}
              <div className="dashboard-tab-content-panel">
                
                
                {/* 0. HOME TAB */}
                {activeTab === 'home' && (
                  <div className="fade-in">
                    <div className="department-lobby-wrapper">
                      <h2 className="department-lobby-title">🧠 ダッシュボード / DASHBOARD</h2>
                      <p className="department-lobby-desc">
                        LogicaFitシステムダッシュボード。各モジュールを起動し、論理思考のトレーニング、認知バイアスの調律・復習、思考力パラメーター分析、および思考クセのチェックを実行できます。
                      </p>
                      
                      <div className="tenants-grid">
                        {/* 1. 思考力トレーニング */}
                        <div 
                          className="tenant-card gym-tenant"
                          onClick={() => { playSound('click'); setActiveTab('training'); }}
                        >
                          <div className="tenant-card-header">
                            <div className="tenant-icon-circle">🏋️</div>
                            <span className="tenant-tag">MODULE 01</span>
                          </div>
                          <h3 className="tenant-title">思考力トレーニング</h3>
                          <p className="tenant-tagline">事実・推論・論理エラーの特定</p>
                          <p className="tenant-desc">
                            事実と意見の選別や論理的妥当性の検証など、クイズ形式のゲームで思考の基礎力を高めるトレーニングエリア。
                          </p>
                          <div className="tenant-footer">
                            <span className="tenant-action-text">セッション起動 <ChevronRight size={14} /></span>
                          </div>
                        </div>

                        {/* 2. 思考調律・復習 */}
                        <div 
                          className="tenant-card tuning-tenant"
                          onClick={() => { playSound('click'); setActiveTab('bugNote'); }}
                        >
                          <div className="tenant-card-header">
                            <div className="tenant-icon-circle">🧠</div>
                            <span className="tenant-tag">MODULE 02</span>
                          </div>
                          <h3 className="tenant-title">思考調律・復習</h3>
                          <p className="tenant-tagline">認知ノイズの除去 ＆ 弱点克服</p>
                          <p className="tenant-desc">
                            トレーニングで間違えた問題（弱点ポイント）の復習や、主観的バイアスを調整して客観的思考に整える調律を行います。
                          </p>
                          <div className="tenant-footer">
                            <span className="tenant-action-text">調律セッション起動 <ChevronRight size={14} /></span>
                          </div>
                        </div>

                        {/* 3. 思考パラメーター ＆ 相性診断 */}
                        <div 
                          className="tenant-card lab-tenant"
                          onClick={() => { playSound('click'); setActiveTab('diagnostics'); }}
                        >
                          <div className="tenant-card-header">
                            <div className="tenant-icon-circle">📊</div>
                            <span className="tenant-tag">MODULE 03</span>
                          </div>
                          <h3 className="tenant-title">思考パラメーター ＆ 相性診断</h3>
                          <p className="tenant-tagline">自己パラメータ分析 ＆ 相性摩擦チェック</p>
                          <p className="tenant-desc">
                            思考スキャン診断の結果から「思考力パラメーター」を可視化し、自分や他者のブレインコードを用いた相性チェックを行います。
                          </p>
                          <div className="tenant-footer">
                            <span className="tenant-action-text">ラボラトリーにアクセス <ChevronRight size={14} /></span>
                          </div>
                        </div>

                        {/* 4. 思考バグ図鑑 */}
                        <div 
                          className="tenant-card museum-tenant"
                          onClick={() => { playSound('click'); setActiveTab('encyclopedia'); setLibrarySubTab('bug'); }}
                        >
                          <div className="tenant-card-header">
                            <div className="tenant-icon-circle">📖</div>
                            <span className="tenant-tag">MODULE 04</span>
                          </div>
                          <h3 className="tenant-title">思考バグ図鑑</h3>
                          <p className="tenant-tagline">認知バイアスデータベース（全30種）</p>
                          <p className="tenant-desc">
                            人間が無意識に陥りやすい「思考のバグ（認知バイアス）」全30種を、具体的な事例や対策フレーズと共に体系的に解説。
                          </p>
                          <div className="tenant-footer">
                            <span className="tenant-action-text">データベースを表示 <ChevronRight size={14} /></span>
                          </div>
                        </div>
                      </div>
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
                                const score = (activeScores || {})[game.scoreKey] || 0;
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
                      📊 思考パラメーター ＆ 相性診断
                    </h2>
                    <p className="tab-intro-desc">
                      思考スキャン診断やトレーニングによって更新される、あなたの思考力パラメーターとブレインコード（思考の指紋）です。
                      他者のコードと照らし合わせて「思考の摩擦（相性）」をスキャンすることもできます。
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
                  mode={mode}
                  activeScores={activeScores}
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

                      {/* 思考調律（ジャーナリング）移行バナー */}
                      <div 
                        className="glass-panel"
                        style={{
                          padding: '20px',
                          background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.04) 0%, rgba(16, 185, 129, 0.02) 100%)',
                          border: '1px solid rgba(6, 182, 212, 0.15)',
                          borderRadius: '16px',
                          marginBottom: '24px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '12px',
                          position: 'relative',
                          overflow: 'hidden'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span className="game-badge" style={{ background: "rgba(6, 182, 212, 0.05)", border: "1px solid rgba(6, 182, 212, 0.15)", color: "var(--color-cyan)", padding: "4px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: "bold", letterSpacing: '0.5px' }}>
                            📢 お知らせ
                          </span>
                        </div>
                        <div>
                          <h3 style={{ fontSize: '15px', fontWeight: 'bold', margin: '0 0 6px 0', color: 'var(--text-primary)', textAlign: 'left' }}>
                            思考調律は「LogicaJournal（整理ノート）」へ移行しました
                          </h3>
                          <p style={{ color: 'var(--text-secondary)', fontSize: '12.5px', lineHeight: '1.5', margin: 0, textAlign: 'left' }}>
                            思考のモヤモヤを整理・デバッグする「思考調律」機能は、より高度なメタ認知分析が可能な専用ツール<b>「LogicaJournal（思考整理ノート）」</b>として一本化されました。
                            ジャーナリングや思考の整理を行いたい場合は、ポータル画面から「整理ノートを開く」を選択してください。
                          </p>
                        </div>
                      </div>

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
                            case 'parentingDialogue':
                              return { name: 'エモーショナル思考', color: 'var(--color-primary)', room: 'emotional' };
                            case 'strategic':
                            case 'gameTheory':
                              return { name: '戦略的思考', color: '#818cf8', room: 'strategic' };
                            default:
                              return { name: 'その他', color: 'var(--text-muted)', room: 'other' };
                          }
                        };

                        const categoryCounts = {
                          logical: { active: 0, total: 0, name: 'ロジカル思考', color: 'var(--color-cyan)' },
                          critical: { active: 0, total: 0, name: 'クリティカル思考', color: 'var(--color-rose)' },
                          radical: { active: 0, total: 0, name: 'ラディカル思考', color: 'var(--color-amber)' },
                          emotional: { active: 0, total: 0, name: 'エモーショナル思考', color: 'var(--color-primary)' },
                          strategic: { active: 0, total: 0, name: '戦略的思考', color: '#818cf8' }
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
                          parentingDialogue: 'こそだて言葉かけ調律',
                          hiddenAssumption: '前提のデバッグ',
                          causalLoop: '因果ループ',
                          assertiveRewrite: 'アサーティブ',
                          strategic: '戦略コンパイラー',
                          gameTheory: 'ゲーム理論デバッガー',
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

                      {/* 思考統計サマリー */}
                      <div className="glass-panel" style={{ padding: '16px', borderRadius: '12px', display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '20px', background: 'rgba(6, 182, 212, 0.03)', border: '1px solid rgba(6, 182, 212, 0.15)' }}>
                        <div style={{ textAlign: 'left' }}>
                          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>🧠 合計思考調律数</span>
                          <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--color-cyan)', marginTop: '4px' }}>
                            {(gameState.tuningLog || []).length} <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>回</span>
                          </div>
                        </div>
                        <div style={{ width: '1px', height: '30px', background: 'rgba(255,255,255,0.1)' }} />
                        <div style={{ textAlign: 'left' }}>
                          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>🏆 獲得実績バッジ</span>
                          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981', marginTop: '4px' }}>
                            {Object.values(gameState.badges || {}).filter(Boolean).length} <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>/ {badgeDetails.length}</span>
                          </div>
                        </div>
                      </div>

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

                    {/* Settings & Data Sync Section */}
                    <div style={{ borderTop: '1px dashed rgba(255,255,255,0.15)', margin: '24px 0' }} />

                    <section className="text-left" id="system-settings-section">
                      <div className="settings-header" style={{ marginBottom: '10px' }}>
                        <h2 className="tab-title" style={{ fontSize: '18px', fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Sliders size={20} className="color-primary-icon" style={{ color: 'var(--color-cyan)' }} />
                          システム設定・データ同期
                        </h2>
                      </div>
                      
                      <p className="tab-intro-desc">
                        アプリの基本表示設定、効果音の切替え、ブレインコードを用いた進行状況のバックアップ・復元、およびデータの初期化を行えます。
                      </p>

                      <div className="settings-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginTop: '16px' }}>
                        {/* 1. Basic Settings Panel */}
                        <div className="glass-panel" style={{ padding: '16px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)' }}>
                          <h3 style={{ fontSize: '13px', fontWeight: 'bold', margin: 0, borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            基本設定
                          </h3>
                          
                          {/* Theme Toggle */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>💡 カラーテーマ:</span>
                            <button
                              onClick={() => {
                                playSound('click');
                                setTheme(prev => prev === 'dark' ? 'light' : 'dark');
                              }}
                              className="btn btn-secondary"
                              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', padding: '6px 12px' }}
                            >
                              {theme === 'dark' ? <Moon size={12} /> : <Sun size={12} />}
                              <span>{theme === 'dark' ? 'ダークモード' : 'ライトモード'}</span>
                            </button>
                          </div>

                          {/* Mute Toggle */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>🔊 効果音 (SE):</span>
                            <button
                              onClick={() => {
                                playSound('click');
                                toggleMute();
                              }}
                              className="btn btn-secondary"
                              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', padding: '6px 12px' }}
                            >
                              {muted ? <VolumeX size={12} /> : <Volume2 size={12} />}
                              <span>{muted ? '消音中 (Muted)' : '有効 (ON)'}</span>
                            </button>
                          </div>

                          {/* Keyboard ASMR Toggle */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>⌨️ タイピング音 (ASMR):</span>
                            <button
                              onClick={() => {
                                playSound('click');
                                setKeyboardEnabled(!keyboardEnabled);
                              }}
                              className="btn btn-secondary"
                              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', padding: '6px 12px' }}
                            >
                              <span>{keyboardEnabled ? '有効 (ON)' : '無効 (OFF)'}</span>
                            </button>
                          </div>

                          {/* Environment BGM Selector */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>🎧 環境音 (BGM):</span>
                            <button
                              onClick={() => {
                                playSound('click');
                                const nextBgm = bgmType === 'none' ? 'rain' : bgmType === 'rain' ? 'cozy_pad' : 'none';
                                setBgmType(nextBgm);
                              }}
                              className="btn btn-secondary"
                              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', padding: '6px 12px' }}
                            >
                              <span>
                                {bgmType === 'none' ? 'オフ (None)' : 
                                 bgmType === 'rain' ? '雨の音 (Rain)' : 'チル和音 (Pad)'}
                              </span>
                            </button>
                          </div>
                        </div>

                        {/* 2. Data Backup & Sync Panel */}
                        <div className="glass-panel" style={{ padding: '16px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)' }}>
                          <h3 style={{ fontSize: '13px', fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: '6px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px' }}>
                            <KeyRound size={14} style={{ color: 'var(--color-cyan)' }} />
                            データ同期・バックアップ
                          </h3>
                          <p style={{ fontSize: '10px', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.4' }}>
                            他の端末へのデータ同期や、進行状況（レベル、バッジ、調律ログ等）の保管に使用します。
                          </p>

                          {/* Display Braincode */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>あなたの現在のブレインコード:</span>
                            <div 
                              onClick={() => handleCopySpell(currentSpell)}
                              className="backup-code-display"
                              style={{
                                background: 'rgba(0,0,0,0.3)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                padding: '8px 12px',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontFamily: 'monospace',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                borderLeft: '3px solid var(--color-cyan)'
                              }}
                              title="クリックしてコピー"
                            >
                              <span style={{ color: 'var(--color-cyan)', fontWeight: 'bold', letterSpacing: '0.5px' }}>{currentSpell}</span>
                              <Copy size={13} style={{ opacity: 0.6 }} />
                            </div>
                          </div>

                          {/* Input Spell form */}
                          <form 
                            onSubmit={(e) => {
                              e.preventDefault();
                              handleRestoreSpell(e);
                            }} 
                            style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}
                          >
                            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>コードを入力して復元・同期:</span>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <input 
                                type="text" 
                                value={spellInput}
                                onChange={(e) => {
                                  setSpellInput(e.target.value);
                                  if (setSpellError) setSpellError('');
                                  if (setSpellSuccess) setSpellSuccess(false);
                                }}
                                placeholder="ブレインコードを入力"
                                style={{
                                  flex: 1,
                                  background: 'rgba(0,0,0,0.35)',
                                  border: '1px solid rgba(255,255,255,0.15)',
                                  borderRadius: '6px',
                                  padding: '6px 10px',
                                  color: '#fff',
                                  fontSize: '11px',
                                  fontFamily: 'monospace'
                                }}
                              />
                              <button type="submit" className="btn btn-primary" style={{ padding: '6px 16px', fontSize: '11px' }}>
                                同期
                              </button>
                            </div>
                            {spellError && <p style={{ fontSize: '10px', color: 'var(--color-rose)', margin: '2px 0 0 0' }}>❌ {spellError}</p>}
                            {spellSuccess && <p style={{ fontSize: '10px', color: '#10b981', margin: '2px 0 0 0' }}>✨ コードが正常に同期されました！</p>}
                          </form>

                          {/* JSONファイルバックアップ */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '12px', marginTop: '6px' }}>
                            <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>JSONファイルバックアップ（完全保存）:</span>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button 
                                type="button" 
                                onClick={handleExportData} 
                                className="btn btn-secondary" 
                                style={{ flex: 1, padding: '8px', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                              >
                                <Download size={12} />
                                <span>エクスポート</span>
                              </button>
                              <button 
                                type="button" 
                                onClick={() => fileInputRef.current.click()} 
                                className="btn btn-secondary" 
                                style={{ flex: 1, padding: '8px', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                              >
                                <Upload size={12} />
                                <span>インポート</span>
                              </button>
                            </div>
                            <input 
                              type="file" 
                              ref={fileInputRef} 
                              onChange={handleFileChange} 
                              accept=".json" 
                              style={{ display: 'none' }} 
                            />
                          </div>
                        </div>

                        {/* 3. Danger Zone Panel */}
                        <div className="glass-panel" style={{ padding: '16px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(244, 63, 94, 0.2)' }}>
                          <h3 style={{ fontSize: '13px', fontWeight: 'bold', margin: 0, color: 'var(--color-rose)', borderBottom: '1px solid rgba(244, 63, 94, 0.1)', paddingBottom: '8px' }}>
                            データ初期化（危険操作）
                          </h3>
                          <p style={{ fontSize: '10px', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.4' }}>
                            ブラウザに保存されているすべての進行状況、スコア、獲得実績バッジ、調律ログ履歴を消去して初期状態に戻します。
                          </p>
                          <button
                            onClick={() => {
                              playSound('click');
                              if (window.confirm('本当にすべてのデータをリセットしますか？\nこの操作を実行すると、今までのスコアや獲得バッジ、調律ログが完全に削除され、復元できなくなります。')) {
                                localStorage.removeItem('logicafit_save_state');
                                window.location.reload();
                              }
                            }}
                            className="btn"
                            style={{
                              background: 'rgba(244, 63, 94, 0.08)',
                              border: '1px solid rgba(244, 63, 94, 0.3)',
                              color: 'var(--color-rose)',
                              fontSize: '11.5px',
                              padding: '8px 12px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontWeight: 'bold',
                              marginTop: 'auto',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                              transition: 'all 0.2s'
                            }}
                          >
                            <Trash2 size={12} />
                            進行状況を完全にリセットする
                          </button>
                        </div>
                      </div>
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
                
                {/* 思考力パラメーター (Radar Chart) - ホーム表示時のみ常時表示 */}
                {activeTab === 'home' && (
                  <div className="glass-panel radar-chart-panel" style={{ width: '100%', padding: '16px', boxSizing: 'border-box', borderRadius: '12px' }}>
                    <div className="radar-chart-title" style={{ fontSize: '14px', fontWeight: 'bold', textAlign: 'center', marginBottom: '10px' }}>
                      {isFullUnlocked ? '思考力パラメーター' : '思考力パラメーター'}
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
                )}

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
              activeScores={activeScores}
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
              handleExportData={handleExportData}
              handleImportData={handleImportData}
              setShowGuideModal={setShowGuideModal}
              badgeDetails={badgeDetails}
              skillsData={skillsData}
              onUnlockType={onUnlockType}
              onStartReview={onStartReview}
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
