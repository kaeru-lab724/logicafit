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
    setActiveTab(tabId);
  };

  // ボトムナビでアクティブにする項目の判定
  const isLobbyFlowActive = activeTab !== 'achievements';
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
        {activeTab !== 'home' && activeTab !== 'achievements' && activeTab !== undefined && (
          <div className="back-to-lobby-bar" style={{ marginBottom: '16px' }}>
            <button 
              onClick={() => { playSound('click'); setActiveTab('home'); }} 
              className="back-to-lobby-btn"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              <ChevronLeft size={16} />
              <span>← ロビーに戻る</span>
            </button>
          </div>
        )}
        
        {/* ========================================================
           HOME TAB: カルーセル・推奨ゲーム・調律起動
           ======================================================== */}
        {(activeTab === 'home' || activeTab === undefined) && (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* 総合ロビー / フロアガイド */}
            <div className="department-lobby-wrapper">
              <h2 className="department-lobby-title" style={{ fontSize: '20px' }}>🏬 総合ロビー / フロアガイド</h2>
              <p className="department-lobby-desc" style={{ fontSize: '12px', marginBottom: '16px' }}>
                各フロア（部屋）をタップして、思考力デバッグを開始しましょう。
              </p>
              
              <div className="tenants-grid" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* 1. トレーニングジム */}
                <div 
                  className="tenant-card gym-tenant"
                  onClick={() => { playSound('click'); setActiveTab('training'); }}
                  style={{ minHeight: 'auto', padding: '16px' }}
                >
                  <div className="tenant-card-header" style={{ marginBottom: '8px' }}>
                    <div className="tenant-icon-circle" style={{ width: '36px', height: '36px', fontSize: '18px' }}>🏋️</div>
                    <span className="tenant-tag" style={{ fontSize: '8px', padding: '2px 6px' }}>GYM</span>
                  </div>
                  <h3 className="tenant-title" style={{ fontSize: '15px' }}>思考力トレーニングジム</h3>
                  <p className="tenant-tagline" style={{ fontSize: '10.5px' }}>論理＆クリティカル筋トレ</p>
                  <p className="tenant-desc" style={{ fontSize: '11px', margin: '0 0 10px 0' }}>
                    事実と意見の選別や論理の妥当性検証など、思考力をゲーム感覚で鍛え直すジム。
                  </p>
                  <div className="tenant-footer" style={{ paddingTop: '8px' }}>
                    <span className="tenant-action-text" style={{ fontSize: '11.5px' }}>入店する <ChevronRight size={12} /></span>
                  </div>
                </div>

                {/* 2. 思考調律クリニック */}
                <div 
                  className="tenant-card tuning-tenant"
                  onClick={() => { playSound('click'); setActiveTab('bugNote'); }}
                  style={{ minHeight: 'auto', padding: '16px' }}
                >
                  <div className="tenant-card-header" style={{ marginBottom: '8px' }}>
                    <div className="tenant-icon-circle" style={{ width: '36px', height: '36px', fontSize: '18px' }}>🧠</div>
                    <span className="tenant-tag" style={{ fontSize: '8px', padding: '2px 6px' }}>CLINIC</span>
                  </div>
                  <h3 className="tenant-title" style={{ fontSize: '15px' }}>思考調律クリニック</h3>
                  <p className="tenant-tagline" style={{ fontSize: '10.5px' }}>脳内ノイズをデバッグ</p>
                  <p className="tenant-desc" style={{ fontSize: '11px', margin: '0 0 10px 0' }}>
                    日常のモヤモヤ（感情的なノイズ）を吐き出して認知バイアスを検知し客観コードへ調律。
                  </p>
                  <div className="tenant-footer" style={{ paddingTop: '8px' }}>
                    <span className="tenant-action-text" style={{ fontSize: '11.5px' }}>入店する <ChevronRight size={12} /></span>
                  </div>
                </div>

                {/* 3. 脳内レントゲン ＆ 摩擦研究所 */}
                <div 
                  className="tenant-card lab-tenant"
                  onClick={() => { playSound('click'); setActiveTab('diagnostics'); }}
                  style={{ minHeight: 'auto', padding: '16px' }}
                >
                  <div className="tenant-card-header" style={{ marginBottom: '8px' }}>
                    <div className="tenant-icon-circle" style={{ width: '36px', height: '36px', fontSize: '18px' }}>📊</div>
                    <span className="tenant-tag" style={{ fontSize: '8px', padding: '2px 6px' }}>LAB</span>
                  </div>
                  <h3 className="tenant-title" style={{ fontSize: '15px' }}>脳内レントゲン ＆ 摩擦研究所</h3>
                  <p className="tenant-tagline" style={{ fontSize: '10.5px' }}>思考コード ＆ 相性チェック</p>
                  <p className="tenant-desc" style={{ fontSize: '11px', margin: '0 0 10px 0' }}>
                    診断結果のスキャンマップ確認や他者のブレインコードとの摩擦係数を測定。
                  </p>
                  <div className="tenant-footer" style={{ paddingTop: '8px' }}>
                    <span className="tenant-action-text" style={{ fontSize: '11.5px' }}>入店する <ChevronRight size={12} /></span>
                  </div>
                </div>

                {/* 4. 脳内バグ博物館 */}
                <div 
                  className="tenant-card museum-tenant"
                  onClick={() => { playSound('click'); setActiveTab('encyclopedia'); setLibrarySubTab('bug'); }}
                  style={{ minHeight: 'auto', padding: '16px' }}
                >
                  <div className="tenant-card-header" style={{ marginBottom: '8px' }}>
                    <div className="tenant-icon-circle" style={{ width: '36px', height: '36px', fontSize: '18px' }}>📖</div>
                    <span className="tenant-tag" style={{ fontSize: '8px', padding: '2px 6px' }}>MUSEUM</span>
                  </div>
                  <h3 className="tenant-title" style={{ fontSize: '15px' }}>脳内バグ博物館</h3>
                  <p className="tenant-tagline" style={{ fontSize: '10.5px' }}>全30種のバグ図鑑</p>
                  <p className="tenant-desc" style={{ fontSize: '11px', margin: '0 0 10px 0' }}>
                    誰しも無意識に抱えている思考のバグ（認知バイアス）全30種を解説。
                  </p>
                  <div className="tenant-footer" style={{ paddingTop: '8px' }}>
                    <span className="tenant-action-text" style={{ fontSize: '11.5px' }}>入店する <ChevronRight size={12} /></span>
                  </div>
                </div>
              </div>
            </div>

            {/* ロビーの休憩スペース・ラウンジ */}
            <div className="lobby-lounge-card" style={{ marginTop: '10px' }}>
              <h3 className="lobby-lounge-title" style={{ fontSize: '13px' }}>☕ ロビーラウンジ（リラクゼーション ＆ 休憩スペース）</h3>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '0 0 12px 0', lineHeight: '1.4' }}>
                トレーニングの合間に休憩しましょう。環境音の調整や公式コラムを読めます。
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* 環境音・ASMR設定 */}
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
                      <span style={{ fontWeight: 'bold' }}>⌨️ タイピングASMR音</span>
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

                {/* カエル分析官 */}
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
            </div>

          </div>
        )}

        {/* ========================================================
           DIAGNOSTICS TAB
           ======================================================== */}
        {activeTab === 'diagnostics' && (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 'bold', margin: '0 0 10px 0' }}>📊 レントゲン結果 ＆ ブレインコード</h2>
            
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

          </div>
        )}

      </main>

      {/* ========================================================
         ③ ボトムナビゲーション (iOS風)
         ======================================================== */}
      <nav className="mobile-bottom-nav" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, height: '60px', background: 'rgba(15, 17, 23, 0.94)', backdropFilter: 'blur(12px)', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-around', alignItems: 'center', zIndex: 100, paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <button 
          onClick={() => handleNavClick('home')}
          style={{ background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: isLobbyFlowActive ? 'var(--color-cyan)' : 'var(--text-secondary)', cursor: 'pointer', flex: 1, height: '100%', justifyContent: 'center' }}
        >
          <Home size={20} />
          <span style={{ fontSize: '9px', fontWeight: 'bold' }}>🏬 ロビー</span>
        </button>
        <button 
          onClick={() => handleNavClick('achievements')}
          style={{ background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: isAchievementsActive ? 'var(--color-cyan)' : 'var(--text-secondary)', cursor: 'pointer', flex: 1, height: '100%', justifyContent: 'center' }}
        >
          <Award size={20} />
          <span style={{ fontSize: '9px', fontWeight: 'bold' }}>🏆 実績・設定</span>
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