import React, { useState, useEffect } from 'react';
import { useSound } from './hooks/useSound';
import { encodeState, decodeState } from './data/spellHelper';
import { 
  skillsData, 
  factsOpinionsDaily, 
  factsOpinionsBusiness, 
  logicalValidityDaily, 
  logicalValidityBusiness, 
  logicTreesDaily, 
  logicTreesBusiness, 
  fallaciesDaily, 
  fallaciesBusiness, 
  empathyDialoguesDaily, 
  empathyDialoguesBusiness 
} from './data/questions';
import FactsOpinions from './components/games/FactsOpinions';
import LogicalValidity from './components/games/LogicalValidity';
import LogicTreeAssembler from './components/games/LogicTreeAssembler';
import FallacyDetective from './components/games/FallacyDetective';
import EmpathyDialogue from './components/games/EmpathyDialogue';
import HiddenAssumption from './components/games/HiddenAssumption';
import CausalLoop from './components/games/CausalLoop';
import AssertiveRewrite from './components/games/AssertiveRewrite';
import FallacyHunter from './components/games/FallacyHunter';
import TreeQuest from './components/games/TreeQuest';
import EqSimulator from './components/games/EqSimulator';
import StrategicCompiler from './components/games/StrategicCompiler';
import GameTheory from './components/games/GameTheory';
import DiagnosticContainer from './components/DiagnosticContainer';
import HarassmentScanner from './components/HarassmentScanner';
import RakutenWidget from './components/common/RakutenWidget';
import Dashboard from './components/dashboard/Dashboard';
import DebugLab from './components/DebugLab';
import Portal from './components/dashboard/Portal';
import LogiJournal from './components/dashboard/LogiJournal';
import MeaninglessPage from './components/dashboard/MeaninglessPage';
import LogicaTask from './components/dashboard/LogicaTask';
import { 
  ArrowLeft,
  Award, 
  Brain, 
  BookOpen, 
  Sparkles, 
  ChevronRight, 
  Volume2, 
  VolumeX, 
  HelpCircle,
  TrendingUp,
  RotateCcw,
  Copy,
  Lock,
  Unlock,
  KeyRound,
  Sword,
  Search,
  Sun,
  Moon
} from 'lucide-react';

const DEFAULT_STATE = {
  level: 1,
  xp: 0,
  scores: {
    factsOpinions: 0,
    logicalValidity: 0,
    logicTree: 0,
    fallacy: 0,
    empathyDialogue: 0,
    hiddenAssumption: 0,
    causalLoop: 0,
    assertiveRewrite: 0,
    strategic: 0,
    gameTheory: 0
  },
  businessScores: {
    factsOpinions: 0,
    logicalValidity: 0,
    logicTree: 0,
    fallacy: 0,
    empathyDialogue: 0,
    hiddenAssumption: 0,
    causalLoop: 0,
    assertiveRewrite: 0,
    strategic: 0,
    gameTheory: 0
  },
  badges: [false, false, false, false, false],
  diagnosticScores: null,
  diagnosticType: null,
  diagnosticTypeId: "balancedThinker",
  unlockedTypes: ["balancedThinker"],
  bugNote: [],
  tuningLog: [],
  lastTuningDate: null
};

// クラス進化（肩書き）の判定
const getCharacterClass = (scores, level) => {
  const { 
    factsOpinions: fo, 
    logicalValidity: lv, 
    logicTree: lt, 
    fallacy: fa, 
    empathyDialogue: ed = 0,
    hiddenAssumption: ha = 0,
    causalLoop: cl = 0,
    assertiveRewrite: ar = 0,
    strategic: st = 0,
    gameTheory: gt = 0
  } = scores;
  const avg = (fo + lv + lt + fa + ed + ha + cl + ar + st + gt) / 10;
  
  if (avg === 0) return { title: '思考の初心者', desc: 'まだ思考の筋トレを始めていません。いずれかのトレーニングに挑戦しましょう！' };
  
  // 新しい最高称号：共感と論理の両立
  if (fo >= 80 && lv >= 80 && lt >= 80 && fa >= 80 && ed >= 80 && ha >= 80 && cl >= 80 && ar >= 80 && st >= 80 && gt >= 80) {
    return { title: 'ロジカル＆エモーショナル賢者 (超越者)', desc: '鋭い論理的分析力と、豊かな共感対話力を兼ね備えた、知性と感性のハイブリッド。対立を調和へ導きます。' };
  }
  if (avg >= 95) return { title: '超越した論理知性 (超人類)', desc: 'すべての論理領域で極限に達した、未来の思考者。隙のない完璧なロジックを展開します。' };
  if (fo >= 80 && lv >= 80 && lt >= 80 && fa >= 80) return { title: '万能 of ロジシャン', desc: '分析・推論・構造化・批判思考のすべてを高い水準で兼ね備えた、論理のオールラウンダー。' };
  
  // 特定分野が突出している場合
  const maxScore = Math.max(fo, lv, lt, fa, ed, st);
  if (maxScore >= 75) {
    if (maxScore === ed) return { title: '心に寄り添う共感のメンター', desc: '正論による論破ではなく、相手の感情に優しくチューナーを合わせ、深い信頼関係を築く対話の達人。' };
    if (maxScore === fo && fo >= maxScore - 5) return { title: 'データ主義 of ファクト探偵', desc: '主観や推測を排除し、冷徹な客観的「事実」のみを証拠として積み上げる分析のスペシャリスト。' };
    if (maxScore === lv && lv >= maxScore - 5) return { title: '論理の絶対守護者 (司法官)', desc: '寸の狂いもない三段論法と推論規則を駆使し、議論に正しい道筋を示すロジックの使い手。' };
    if (maxScore === lt && lt >= maxScore - 5) return { title: '思考の構造化アーキテクト', desc: '複雑に絡み合った課題をMECEに分解し、一目で全体像と原因を整理してしまう構造化の達人。' };
    if (maxScore === fa && fa >= maxScore - 5) return { title: '詭弁を見抜く論理の探偵', desc: '対話や文章の小さなほころび、ストローマン等の論理的誤謬を決して見逃さない批判思考の探偵。' };
    if (maxScore === st && st >= maxScore - 5) return { title: '対立を紐解く戦略アドバイザー', desc: 'ジレンマとトレードオフの構造を分析し、両立させる介入戦略を華麗に適用する戦略思考の達人。' };
  }
  
  if (level >= 5) return { title: '鍛え上げられた思考の兵士', desc: '日々の筋トレを継続し、思考の体力を身につけた実戦的な論理のプレイヤー。' };
  return { title: '論理思考の挑戦者', desc: '論理的思考力を鍛え始めたばかりの開拓者。日々のトレーニングが脳の回路を活性化させます。' };
};

// 自動推奨ゲームのキー選定
const getRecommendedGameKey = (scores) => {
  const keys = ['factsOpinions', 'logicalValidity', 'logicTree', 'fallacy', 'empathyDialogue', 'hiddenAssumption', 'causalLoop', 'assertiveRewrite', 'strategic', 'gameTheory'];
  
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
    strategic: '戦略的介入シミュレーター'
  };
  return names[key] || '';
};

// 過去に記録されたバグの文言不足を補うフォールバック関数
const getFallbackStatement = (gameId, questionId) => {
  const allQuestions = [
    ...(typeof factsOpinionsDaily !== 'undefined' ? factsOpinionsDaily : []),
    ...(typeof factsOpinionsBusiness !== 'undefined' ? factsOpinionsBusiness : []),
    ...(typeof logicalValidityDaily !== 'undefined' ? logicalValidityDaily : []),
    ...(typeof logicalValidityBusiness !== 'undefined' ? logicalValidityBusiness : []),
    ...(typeof logicTreesDaily !== 'undefined' ? logicTreesDaily : []),
    ...(typeof logicTreesBusiness !== 'undefined' ? logicTreesBusiness : []),
    ...(typeof fallaciesDaily !== 'undefined' ? fallaciesDaily : []),
    ...(typeof fallaciesBusiness !== 'undefined' ? fallaciesBusiness : []),
    ...(typeof empathyDialoguesDaily !== 'undefined' ? empathyDialoguesDaily : []),
    ...(typeof empathyDialoguesBusiness !== 'undefined' ? empathyDialoguesBusiness : [])
  ];
  const foundQ = allQuestions.find(q => q.id === questionId);
  if (foundQ) {
    if (foundQ.statement) return foundQ.statement;
    if (foundQ.theme) return foundQ.theme;
    if (foundQ.dialogue) return foundQ.dialogue;
    if (foundQ.situation) return foundQ.situation;
    if (foundQ.premise1) return `${foundQ.premise1} ${foundQ.premise2} ${foundQ.conclusion}`;
  }

  const localMap = {
    st_d1: '健康維持 vs 自由時間 (仕事と趣味が忙しく、運動する時間がない。)',
    st_d2: '食費節約 vs 時短・健康 (食費を抑えるために自炊を徹底したいが時間がない。)',
    st_d3: '読書インプット量 vs 娯楽・リラックス (自己投資のために本を読みたいが疲れてしまう。)',
    st_d4: '部屋の整理整頓 vs 物を捨てる痛み (思い出の品やいつか使うものが捨てられない。)',
    st_d5: '英語の学習継続 vs 家族との時間 (自己研鑽の時間と大切な人とのコミュニケーション時間。)',
    st_b1: '開発のスピード vs コードの品質 (新機能を最速投入したいが技術負債がたまる。)',
    st_b2: '厳格なセキュリティ vs 従業員の業務効率 (セキュリティを強化したいが業務効率が下がる。)',
    st_b3: '広告費削減による利益確保 vs 売上成長のための集客 (利益目標のために広告費を削りたいが集客が下がる。)',
    st_b4: '顧客の個別カスタマイズ vs サービスの標準化・スケール (大口顧客の要望対応と共通機能のアップデート。)',
    st_b5: 'メンバーへの業務委譲 vs クオリティコントロール (業務を任せたいが品質が低く手戻りになる。)',
    gt_d1: '家事の分担ジレンマ (パートナーと家事を協力するか、サボるかの囚人のジレンマ。)',
    gt_d2: '返信タイミング (友達への即返信と遅い返信における調整ゲーム。)',
    gt_d3: 'デートの行き先対立 (カフェに行きたい自分とバーに行きたい相手の行き先対立。)',
    gt_b1: '競合との価格競争 (競合他社との高価格維持か値下げ競争かの価格競争。)',
    gt_b2: '共同プロジェクトへの投資 (全力投資かタダ乗りするかのフリーライダー問題。)',
    gt_b3: '新規参入と価格防衛 (スタートアップの参入に対し価格戦で対抗するかの参入阻止。)'
  };
  return localMap[questionId] || 'バグ問題データ';
};

export default function App() {
  const { playSound, muted, toggleMute } = useSound();
  const [isGameCompleted, setIsGameCompleted] = useState(false);
  const [activeGame, _setActiveGame] = useState(null);
  
  const setActiveGame = (gameId) => {
    _setActiveGame(gameId);
    if (gameId !== null) {
      setIsGameCompleted(false);
    }
  };

  const [currentView, setCurrentView] = useState('portal');
  const [mode, setMode] = useState('daily');
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('logicafit_color_theme') || 'dark';
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const search = window.location.search;
    const hash = window.location.hash;
    const params = new URLSearchParams(search || (hash.includes('?') ? hash.substring(hash.indexOf('?')) : ''));
    if (params.get('mode') === 'scan' || params.has('scan')) {
      setActiveGame('harassmentScanner');
    }
  }, []);

  // 動的タイトル（ブラウザタブ）の切り替え
  useEffect(() => {
    let title = 'LogicaFit | 前提知識ゼロから始める論理的思考トレーニングジム';
    
    if (currentView === 'logijournal') {
      title = 'LogiJournal (思考整理ノート) | LogicaFit';
    } else if (currentView === 'meaningless') {
      title = '虚無の調整室 (Brain Noise) | LogicaFit';
    } else if (currentView === 'logicatask') {
      title = 'LogicaTask | LogicaFit';
    } else if (activeGame) {
      const gameNames = {
        factsOpinions: '事実と意見',
        logicalValidity: '論理的妥当性',
        logicTreeAssembler: 'ロジックツリー',
        fallacyHunter: '詭弁ハンター',
        empathyDialogue: 'エモーショナル思考',
        eqSimulator: '感情指数シミュレーター',
        causalLoop: '因果ループ図',
        assertiveRewrite: 'アサーティブ書き換え',
        hiddenAssumption: '隠れた前提',
        strategicCompiler: '戦略的コンパイラー',
        harassmentScanner: 'ハラスメントスキャナー',
        treeQuest: 'ツリークエスト',
        fallacyDetective: '論理的誤謬'
      };
      const gameName = gameNames[activeGame] || 'トレーニング中';
      title = `【特訓】${gameName} | LogicaFit`;
    }
    
    document.title = title;
  }, [currentView, activeGame]);

  useEffect(() => {
    if (window.gtag) {
      window.gtag('event', 'mode_change', {
        event_category: 'Settings',
        event_label: mode
      });
    }
    document.body.setAttribute('data-theme', mode);
  }, [mode]);

  useEffect(() => {
    if (window.gtag) {
      window.gtag('event', 'theme_change', {
        event_category: 'Settings',
        event_label: theme
      });
    }
    if (theme === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
    localStorage.setItem('logicafit_color_theme', theme);
  }, [theme]);
  
  // アプリ全体のステータス管理
  const [gameState, setGameState] = useState(() => {
    const saved = localStorage.getItem('logicafit_save_data');
    if (saved) {
      const parsed = JSON.parse(saved);
      // カレンダーが残っている場合はクリーンアップして返す
      if (parsed.calendar) {
        delete parsed.calendar;
        delete parsed.lastLogin;
      }

      let initialUnlocked = parsed.unlockedTypes || [];
      if (initialUnlocked.length === 0) {
        if (parsed.diagnosticTypeId) {
          initialUnlocked = [parsed.diagnosticTypeId];
        } else {
          initialUnlocked = ["balancedThinker"];
        }
      }

      return {
        ...DEFAULT_STATE,
        ...parsed,
        scores: {
          ...DEFAULT_STATE.scores,
          ...(parsed.scores || {})
        },
        businessScores: {
          ...DEFAULT_STATE.businessScores,
          ...(parsed.businessScores || {})
        },
        unlockedTypes: initialUnlocked,
        bugNote: (parsed.bugNote || []).map(bug => {
          let updatedBug = { ...bug };
          if (updatedBug.gameId === 'strategicCompiler') {
            updatedBug.gameId = 'strategic';
          }
          if (!updatedBug.addedAt && updatedBug.timestamp) {
            updatedBug.addedAt = new Date(updatedBug.timestamp).toLocaleDateString('sv');
          }
          if (!updatedBug.statement) {
            updatedBug.statement = getFallbackStatement(updatedBug.gameId, updatedBug.questionId);
          }
          return updatedBug;
        }),
        tuningLog: parsed.tuningLog || [],
        lastTuningDate: parsed.lastTuningDate || null
      };
    }
    
    // 古い形式のスコアデータがある場合のマイグレーション
    const oldScores = localStorage.getItem('logicafit_scores');
    if (oldScores) {
      const parsedScores = JSON.parse(oldScores);
      return {
        ...DEFAULT_STATE,
        scores: parsedScores,
        xp: Object.values(parsedScores).reduce((acc, curr) => acc + curr * 10, 0),
        level: Math.max(1, Math.floor(Object.values(parsedScores).reduce((acc, curr) => acc + curr * 10, 0) / 500) + 1)
      };
    }
    return DEFAULT_STATE;
  });

  // ブレインコード入力とエラー状態
  const [spellInput, setSpellInput] = useState('');
  const [spellError, setSpellError] = useState('');
  const [spellSuccess, setSpellSuccess] = useState(false);

  useEffect(() => {
    // 簡易スキャナー起動時はチュートリアルガイドの自動ポップアップを抑制
    if (activeGame === 'harassmentScanner') return;

    const seen = localStorage.getItem('logicafit_seen_guide');
    if (gameState.xp === 0 && !seen) {
      setShowGuideModal(true);
      localStorage.setItem('logicafit_seen_guide', 'true');
    }
  }, [gameState.xp, activeGame]);

  // Google Analytics ゲーム開始の計測
  useEffect(() => {
    if (activeGame && window.gtag) {
      window.gtag('event', 'game_start', {
        event_category: 'Game',
        event_label: activeGame,
        mode: mode
      });
    }
  }, [activeGame]);

  // Google Analytics ガイド表示の計測
  useEffect(() => {
    if (showGuideModal && window.gtag) {
      window.gtag('event', 'show_guide', {
        event_category: 'Engagement'
      });
    }
  }, [showGuideModal]);

  // 報酬ポップアップモーダル状態
  const [rewardModal, setRewardModal] = useState({
    show: false,
    type: 'level', // 'level' or 'badge'
    title: '',
    value: '',
    spell: ''
  });

  // レビュー・復習セッションの状態
  const [reviewQuestionId, setReviewQuestionId] = useState(null);

  // 脳内バグノートへの記録処理
  const handleLogBug = (gameId, questionId, wrongAnswerDetails, statement) => {
    setGameState(prev => {
      const bugNote = prev.bugNote || [];
      const existingBugIdx = bugNote.findIndex(b => b.gameId === gameId && b.questionId === questionId);
      
      const newBug = {
        id: `${gameId}_${questionId}_${Date.now()}`,
        gameId,
        questionId,
        mode,
        wrongAnswerDetails: wrongAnswerDetails || '',
        statement: statement || '',
        timestamp: Date.now(),
        addedAt: new Date().toLocaleDateString('sv'),
        solved: false
      };

      let updatedBugNote = [...bugNote];
      if (existingBugIdx !== -1) {
        // すでに存在する場合は未解決にリセットして更新
        updatedBugNote[existingBugIdx] = {
          ...updatedBugNote[existingBugIdx],
          wrongAnswerDetails: wrongAnswerDetails || '',
          statement: statement || updatedBugNote[existingBugIdx].statement || '',
          timestamp: Date.now(),
          addedAt: updatedBugNote[existingBugIdx].addedAt || new Date().toLocaleDateString('sv'),
          solved: false
        };
      } else {
        updatedBugNote.push(newBug);
      }

      const updatedState = {
        ...prev,
        bugNote: updatedBugNote
      };
      
      localStorage.setItem('logicafit_save_data', JSON.stringify(updatedState));
      return updatedState;
    });
  };

  // 思考調律ログの保存処理
  const handleSaveTuningLog = (logEntry) => {
    const todayStr = new Date().toLocaleDateString('sv'); // YYYY-MM-DD
    setGameState(prev => {
      const currentLog = prev.tuningLog || [];
      const newLog = [
        {
          id: 'mt_' + Date.now(),
          timestamp: Date.now(),
          ...logEntry
        },
        ...currentLog
      ].slice(0, 500); // 履歴保持数を500件に拡張

      // 思考調律完了でボーナス 100 XP
      const earnedXp = 100;
      const newXp = prev.xp + earnedXp;
      const newLevel = Math.floor(newXp / 500) + 1;
      const isLevelUp = newLevel > prev.level;

      const updatedState = {
        ...prev,
        tuningLog: newLog,
        lastTuningDate: todayStr,
        xp: newXp,
        level: newLevel
      };

      if (isLevelUp) {
        playSound('success');
      }

      localStorage.setItem('logicafit_save_data', JSON.stringify(updatedState));
      return updatedState;
    });
  };

  // 思考調律ログの追記・更新処理
  const handleUpdateTuningLog = (updatedEntry) => {
    setGameState(prev => {
      const newLog = (prev.tuningLog || []).map(entry => 
        entry.id === updatedEntry.id ? updatedEntry : entry
      );
      const updatedState = {
        ...prev,
        tuningLog: newLog
      };
      localStorage.setItem('logicafit_save_data', JSON.stringify(updatedState));
      return updatedState;
    });
  };

  // データのJSONエクスポート
  const handleExportData = () => {
    playSound('click');
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(gameState));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    downloadAnchor.setAttribute("download", `logicafit_backup_${dateStr}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // データのJSONインポート（マージ復元）
  const handleImportData = (importedState) => {
    setGameState(prev => {
      const mergedTuningLog = [
        ...(importedState.tuningLog || []),
        ...(prev.tuningLog || [])
      ];
      const seenIds = new Set();
      const uniqueTuningLog = [];
      mergedTuningLog.forEach(item => {
        const id = item.id || item.timestamp;
        if (id && !seenIds.has(id)) {
          seenIds.add(id);
          uniqueTuningLog.push(item);
        }
      });

      const mergedBugNote = [
        ...(importedState.bugNote || []),
        ...(prev.bugNote || [])
      ];
      const seenBugs = new Set();
      const uniqueBugNote = [];
      mergedBugNote.forEach(item => {
        const bugId = `${item.gameId}_${item.questionId}`;
        if (!seenBugs.has(bugId)) {
          seenBugs.add(bugId);
          uniqueBugNote.push(item);
        }
      });

      const mergedState = {
        ...prev,
        ...importedState,
        scores: { ...prev.scores, ...(importedState.scores || {}) },
        businessScores: { ...prev.businessScores, ...(importedState.businessScores || {}) },
        tuningLog: uniqueTuningLog,
        bugNote: uniqueBugNote,
        level: Math.max(prev.level, importedState.level || 1),
        xp: Math.max(prev.xp, importedState.xp || 0),
      };

      localStorage.setItem('logicafit_save_data', JSON.stringify(mergedState));
      return mergedState;
    });
  };



  // 復習デバッグ完了処理
  const handleFinishReview = (gameId, questionId) => {
    playSound('success');
    
    setGameState(prev => {
      const bugNote = prev.bugNote || [];
      const updatedBugNote = bugNote.map(bug => {
        if (bug.gameId === gameId && bug.questionId === questionId) {
          return { ...bug, solved: true, solvedAt: new Date().toLocaleDateString('sv') };
        }
        return bug;
      });

      // 復習デバッグ成功でボーナス 50 XP
      const earnedXp = 50;
      const newXp = prev.xp + earnedXp;
      
      const newLevel = Math.floor(newXp / 500) + 1;
      const isLevelUp = newLevel > prev.level;

      const updatedState = {
        ...prev,
        bugNote: updatedBugNote,
        xp: newXp,
        level: newLevel
      };

      localStorage.setItem('logicafit_save_data', JSON.stringify(updatedState));

      if (isLevelUp) {
        setTimeout(() => {
          playSound('success');
          const currentSpell = encodeState(updatedState);
          setRewardModal({
            show: true,
            type: 'level',
            title: 'レベルアップ！',
            value: `LEVEL ${newLevel}`,
            spell: currentSpell
          });
        }, 800);
      }

      return updatedState;
    });

    setActiveGame(null);
    setReviewQuestionId(null);
    setActiveTab('bugNote'); // ダッシュボードのバグノートタブに戻る
  };

  // ゲーム終了時のスコア・XP更新、レベルアップ・バッジ判定
  const handleGameFinish = (gameKey, score, shouldExit = true) => {
    playSound('click');
    
    setGameState(prev => {
      const isLabGame = ['fallacyHunter', 'treeQuest', 'eqSimulator'].includes(gameKey);
      const isBusiness = !isLabGame && mode === 'business';
      const prevScores = isBusiness ? (prev.businessScores || {}) : prev.scores;
      const prevBest = prevScores[gameKey] || 0;
      
      const newBest = Math.max(prevBest, score);
      const updatedScores = {
        ...prevScores,
        [gameKey]: newBest
      };

      const scoreDiff = Math.max(0, score - prevBest);
      const earnedXp = scoreDiff * 10;
      const newXp = prev.xp + earnedXp;
      
      const newLevel = Math.floor(newXp / 500) + 1;
      const isLevelUp = newLevel > prev.level;

      // 両方のモードを含めたベストスコアでバッジ判定を行う
      const mergedScores = {};
      const keys = ['factsOpinions', 'logicalValidity', 'logicTree', 'fallacy', 'empathyDialogue', 'hiddenAssumption', 'causalLoop', 'assertiveRewrite', 'strategic', 'gameTheory'];
      keys.forEach(k => {
        const dailyVal = isBusiness ? (prev.scores[k] || 0) : (k === gameKey ? newBest : (prev.scores[k] || 0));
        const bizVal = isBusiness ? (k === gameKey ? newBest : (prev.businessScores?.[k] || 0)) : (prev.businessScores?.[k] || 0);
        mergedScores[k] = Math.max(dailyVal, bizVal);
      });

      const newBadges = [
        mergedScores.factsOpinions >= 80,
        mergedScores.logicalValidity >= 80,
        mergedScores.logicTree >= 100,
        mergedScores.fallacy >= 80,
        Object.values(mergedScores).every(s => s > 0)
      ];

      const newlyUnlockedBadgeIdx = newBadges.findIndex((unlocked, idx) => unlocked && !prev.badges[idx]);
      const isBadgeUnlocked = newlyUnlockedBadgeIdx !== -1;

      // バッジ状態をマージして後退しないようにする
      const mergedBadges = prev.badges.map((b, idx) => b || newBadges[idx]);

      const updatedState = {
        ...prev,
        scores: isBusiness ? prev.scores : updatedScores,
        businessScores: isBusiness ? updatedScores : (prev.businessScores || {}),
        xp: newXp,
        level: newLevel,
        badges: mergedBadges
      };

      localStorage.setItem('logicafit_save_data', JSON.stringify(updatedState));

      // レベルアップまたはバッジ獲得時の報酬ポップアップ表示
      if (isLevelUp) {
        setTimeout(() => {
          playSound('success');
          const currentSpell = encodeState(updatedState);
          setRewardModal({
            show: true,
            type: 'level',
            title: 'レベルアップ！',
            value: `LEVEL ${newLevel}`,
            spell: currentSpell
          });
        }, 800);
      } else if (isBadgeUnlocked) {
        setTimeout(() => {
          playSound('success');
          const badgeNames = ['ファクト調査官', '冷徹なロジシャン', 'ツリーの巨匠', '論破マスター', '論理の求道者'];
          const currentSpell = encodeState(updatedState);
          setRewardModal({
            show: true,
            type: 'badge',
            title: '実績アンロック！',
            value: badgeNames[newlyUnlockedBadgeIdx],
            spell: currentSpell
          });
        }, 800);
      }

      // 初回クリア検知とアンロック演出トリガー
      const isFirstClear = prev.xp === 0 && newXp > 0 && prev.diagnosticScores !== null;
      if (isFirstClear) {
        setTimeout(() => {
          playSound('success');
          setShowUnlockModal(true);
        }, 800);
      }

      return updatedState;
    });

    if (window.gtag && !shouldExit) {
      window.gtag('event', 'game_clear', {
        event_category: 'Game',
        event_label: gameKey,
        score: score,
        mode: mode
      });
    }

    if (shouldExit) {
      setActiveGame(null);
      setIsGameCompleted(false);
    } else {
      setIsGameCompleted(true);
    }
  };

  // 脳内バグタイプのアンロック処理
  const handleUnlockType = (typeId) => {
    if (!typeId) return;
    setGameState(prev => {
      const currentUnlocked = prev.unlockedTypes || [];
      if (currentUnlocked.includes(typeId)) return prev;
      
      const updatedUnlocked = [...currentUnlocked, typeId];
      const updatedState = {
        ...prev,
        unlockedTypes: updatedUnlocked
      };
      localStorage.setItem('logicafit_save_data', JSON.stringify(updatedState));
      return updatedState;
    });
  };

  // ブレインコード復元処理
  const handleRestoreSpell = (e) => {
    e.preventDefault();
    setSpellError('');
    setSpellSuccess(false);

    try {
      playSound('click');
      const restoredState = decodeState(spellInput);

      const mergedUnlocked = Array.from(new Set([
        ...(gameState.unlockedTypes || []),
        ...(restoredState.unlockedTypes || []),
        restoredState.diagnosticTypeId
      ].filter(Boolean)));

      const normalizedState = {
        ...DEFAULT_STATE,
        ...restoredState,
        scores: {
          ...DEFAULT_STATE.scores,
          ...(restoredState.scores || {})
        },
        businessScores: {
          ...DEFAULT_STATE.businessScores,
          ...(restoredState.businessScores || {})
        },
        unlockedTypes: mergedUnlocked
      };

      setGameState(normalizedState);
      localStorage.setItem('logicafit_save_data', JSON.stringify(normalizedState));
      
      setSpellSuccess(true);
      setSpellInput('');
      playSound('correct');
    } catch (err) {
      playSound('incorrect');
      setSpellError(err.message || 'ブレインコードの解析に失敗しました。');
    }
  };

  const handleResetProgress = () => {
    if (window.confirm('これまでの学習データをすべてリセットしますか？')) {
      playSound('click');
      setGameState(DEFAULT_STATE);
      localStorage.setItem('logicafit_save_data', JSON.stringify(DEFAULT_STATE));
    }
  };

  const handleShareToX = (text) => {
    playSound('click');
    const appUrl = 'https://www.logicafit.site/';
    const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(appUrl)}`;
    window.open(shareUrl, '_blank', 'noopener,noreferrer');
  };

  const handleShareToFacebook = (text) => {
    playSound('click');
    navigator.clipboard.writeText(text).then(() => {
      alert("実績テキストをクリップボードにコピーしました！\nFacebookの投稿画面にペースト（貼り付け）してシェアしてください。");
      const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent('https://www.logicafit.site/')}`;
      window.open(shareUrl, '_blank', 'noopener,noreferrer');
    }).catch(() => {
      const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent('https://www.logicafit.site/')}`;
      window.open(shareUrl, '_blank', 'noopener,noreferrer');
    });
  };

  const handleCopyText = (text) => {
    playSound('click');
    navigator.clipboard.writeText(text).then(() => {
      alert("実績テキストをクリップボードにコピーしました！SlackやLINE、Discordなどで共有してください。");
    });
  };

  const handleCopySpell = (spellText) => {
    navigator.clipboard.writeText(spellText);
    playSound('click');
    alert('ブレインコードをクリップボードにコピーしました！');
  };

  // 診断結果の保存ハンドラー
  const handleSaveDiagnostic = (scores, type) => {
    playSound('success');
    setGameState(prev => {
      const currentUnlocked = prev.unlockedTypes || [];
      const updatedUnlocked = currentUnlocked.includes(type.id)
        ? currentUnlocked
        : [...currentUnlocked, type.id];
      const updatedState = {
        ...prev,
        diagnosticScores: scores,
        diagnosticType: type,
        diagnosticTypeId: type.id,
        unlockedTypes: updatedUnlocked
      };
      localStorage.setItem('logicafit_save_data', JSON.stringify(updatedState));
      return updatedState;
    });
  };

  const activeScores = mode === 'business'
    ? (gameState.businessScores || {})
    : (gameState.scores || {});

  const charClass = getCharacterClass(activeScores, gameState.level);
  const recGameKey = getRecommendedGameKey(activeScores);
  const isAllCompleted = Object.values(activeScores).every(s => s >= 100);
  
  // 診断結果がありかつXPが0なら未アンロック状態（シングルフォーカス）
  const isNewUser = gameState.diagnosticScores === null && gameState.xp === 0;
  const isFullUnlocked = gameState.xp > 0;
  
  const currentSpell = encodeState(gameState);
  const [activeTab, setActiveTab] = useState('home');

  // レーダーチャート用のスコア変換
  const displayScores = (gameState.xp > 0)
    ? activeScores
    : (gameState.diagnosticScores
        ? {
            factsOpinions: Math.round((gameState.diagnosticScores.L / 105) * 100),
            logicalValidity: Math.round((gameState.diagnosticScores.L / 105) * 100),
            logicTree: Math.round((gameState.diagnosticScores.R / 105) * 100),
            fallacy: Math.round((gameState.diagnosticScores.C / 105) * 100),
            empathyDialogue: Math.round((gameState.diagnosticScores.E / 105) * 100)
          }
        : {
            factsOpinions: 0,
            logicalValidity: 0,
            logicTree: 0,
            fallacy: 0,
            empathyDialogue: 0
          }
      );

  // 最もスコアの低かった部屋の特定
  let primaryDebugCategory = 'logical';
  if (gameState.diagnosticScores) {
    const { L, C, R, E = 0 } = gameState.diagnosticScores;
    const minVal = Math.min(L, C, R, E);
    if (minVal === L) {
      primaryDebugCategory = 'logical';
    } else if (minVal === C) {
      primaryDebugCategory = 'critical';
    } else if (minVal === R) {
      primaryDebugCategory = 'radical';
    } else {
      primaryDebugCategory = 'emotional';
    }
  }

  // 部屋とゲームデータの定義
  const rooms = [
    {
      id: 'logical',
      title: 'ロジカル思考ルーム',
      borderColor: 'var(--color-cyan)',
      textColor: 'var(--color-cyan)',
      badgeColor: 'rgba(6, 182, 212, 0.1)',
      description: '客観的な「事実」を整理し、破綻のない筋道を組み立てるトレーニング部屋。',
      games: [
        {
          id: 'factsOpinions',
          scoreKey: 'factsOpinions',
          moduleNum: 'MODULE 01',
          name: '事実 vs 意見',
          desc: mode === 'daily' 
            ? '身近な会話やニュースから主観的な「意見」と客観的な「事実」を切り分ける入門トレーニング。'
            : '提案書やデータ分析で、個人の「解釈」と客観的な「事実」を正しく選別する実戦トレーニング。',
          difficulty: mode === 'daily' ? '初級' : '中級'
        },
        {
          id: 'logicalValidity',
          scoreKey: 'logicalValidity',
          moduleNum: 'MODULE 02',
          name: '論理の妥当性',
          desc: mode === 'daily' 
            ? '日常の議論や会話のやり取りから、三段論法などの推論が正しい道筋を通っているかを検証。'
            : 'ビジネスの提案や主張に対して、前提から結論への論理展開に飛躍がないかを厳密にチェック。',
          difficulty: mode === 'daily' ? '初級' : '中級'
        }
      ]
    },
    {
      id: 'critical',
      title: 'クリティカル思考ルーム',
      borderColor: 'var(--color-rose)',
      textColor: 'var(--color-rose)',
      badgeColor: 'rgba(244, 63, 94, 0.1)',
      description: '前提やバイアスを疑い、屁理屈や議論の歪みを見抜くトレーニング部屋。',
      games: [
        {
          id: 'fallacy',
          scoreKey: 'fallacy',
          moduleNum: 'MODULE 03',
          name: '論理的誤謬の特定',
          desc: mode === 'daily' 
            ? '会話の中に潜む「ストローマン（藁人形論法）」や「対人攻撃」などのへりくつを検知・特定する。'
            : 'ビジネス交渉やメディアの主張に隠された論点のすり替えや、都合の良い相関関係の罠を見抜く。',
          difficulty: mode === 'daily' ? '初級' : '中級'
        },
        {
          id: 'hiddenAssumption',
          scoreKey: 'hiddenAssumption',
          moduleNum: 'MODULE 03 [2nd]',
          name: '前提・隠れた仮定のデバッグ',
          desc: mode === 'daily'
            ? '日常のSNSや会話に潜む「無意識の思い込みや前提」をスキャンし、健全な表現へデバッグする。'
            : 'ビジネスの意思決定や分析の裏にある「暗黙の仮定」を可視化し、現実的なロジックにリライトする。',
          difficulty: mode === 'daily' ? '初級' : '中級'
        }
      ]
    },
    {
      id: 'radical',
      title: 'ラディカル思考ルーム',
      borderColor: 'var(--color-amber)',
      textColor: 'var(--color-amber)',
      badgeColor: 'rgba(245, 158, 11, 0.1)',
      description: '課題の本質を見極め、MECEにモレなくダブりなく分解して根本原因を探るトレーニング部屋。',
      games: [
        {
          id: 'logicTree',
          scoreKey: 'logicTree',
          moduleNum: 'MODULE 04',
          name: 'ロジックツリー',
          desc: mode === 'daily' 
            ? '身近な課題（「健康を維持する」など）を要素に分解し、最適なアクションマップを作成する。'
            : '新規事業の売上低迷など、ビジネスの重要課題をMECEに分解し、真のボトルネックを特定する。',
          difficulty: mode === 'daily' ? '初級' : '中級'
        },
        {
          id: 'causalLoop',
          scoreKey: 'causalLoop',
          moduleNum: 'MODULE 04 [2nd]',
          name: '因果ループ＆ボトルネック',
          desc: mode === 'daily'
            ? '生活習慣や貯金問題などの「悪循環ループ」を特定し、ボトルネックに介入して安定化させる。'
            : '人材流出や広告費依存など、複雑なビジネス問題の悪循環を断ち切るレバレッジポイントを見抜く。',
          difficulty: mode === 'daily' ? '初級' : '中級'
        }
      ]
    },
    {
      id: 'emotional',
      title: 'エモーショナル思考ルーム',
      borderColor: 'var(--color-primary)',
      textColor: 'var(--color-primary)',
      badgeColor: 'rgba(139, 92, 246, 0.1)',
      description: '感情の機微を捉え、他者と共感しながら建設的な意思決定を行うための部屋。',
      games: [
        {
          id: 'empathyDialogue',
          scoreKey: 'empathyDialogue',
          moduleNum: 'MODULE 05',
          name: '共感対話トレーニング',
          desc: mode === 'daily'
            ? '日常の不満や悩みの相談に対し、正論で論破せず、感情に寄り添う返答を選ぶトレーニング。'
            : '職場の後輩や部下、同僚の相談に対して、信頼関係を築くアクティブリスニング（傾聴）を学ぶ。',
          difficulty: mode === 'daily' ? '初級' : '中級'
        },
        {
          id: 'assertiveRewrite',
          scoreKey: 'assertiveRewrite',
          moduleNum: 'MODULE 05 [2nd]',
          name: 'アサーティブ・リライター',
          desc: mode === 'daily'
            ? '友達や家族に対する攻撃的・受動的な会話を、DESC法を用いて誠実かつ対等な表現にリライトする。'
            : '部下への指導や顧客からの無理な要望への対応を、対立を避けて建設的に合意する表現にコンパイルする。',
          difficulty: mode === 'daily' ? '初級' : '中級'
        }
      ]
    },
    {
      id: 'strategic',
      title: '戦略的思考ルーム',
      borderColor: '#6366f1',
      textColor: '#818cf8',
      badgeColor: 'rgba(99, 102, 241, 0.1)',
      description: '二律背反（トレードオフ）を解消し、両立させる「戦略的介入パッチ」を適用する部屋。',
      games: [
        {
          id: 'strategic',
          scoreKey: 'strategic',
          moduleNum: 'MODULE 06',
          name: '戦略コンパイラー',
          desc: mode === 'daily'
            ? '日常の選択におけるジレンマを見抜き、二律背反を両立させる戦略パッチをコンパイルする。'
            : '開発、セキュリティ、集客等のビジネス上のトレードオフを解消し、両立させる最適パッチを適用する。',
          difficulty: mode === 'daily' ? '初級' : '中級'
        },
        {
          id: 'gameTheory',
          scoreKey: 'gameTheory',
          moduleNum: 'MODULE 06 [2nd]',
          name: 'ゲーム理論デバッガー',
          desc: mode === 'daily'
            ? '日常の利害対立や駆け引きにおける利得マトリクスを分析し、最も合理的な均衡点（戦略）を選択する。'
            : '価格競争や協調プロジェクトにおける競合の行動を予測し、社会的損失を防ぐナッシュ均衡と戦略を導く。',
          difficulty: mode === 'daily' ? '初級' : '中級'
        }
      ]
    }
  ];

  const badgeDetails = [
    { 
      title: 'ファクト調査官', 
      desc: '「事実 vs 意見」で80%以上', 
      color: 'var(--color-cyan)', 
      colorRgb: '6, 182, 212',
      tagline: '感情的な議論をファクトでいなす盾',
      benefit: '会議や問題発生時に、相手の主観的な思い込みや感情に惑わされず、客観的な「事実」のみを抽出して論点をクリアにできるようになります。',
      template: '「なるほど、それは非常に重要なご見解（意見）ですね。その見解をサポートする、客観的なデータ（事実）は何かございますでしょうか？」'
    },
    { 
      title: '冷徹なロジシャン', 
      desc: '「論理の妥当性」で80%以上', 
      color: 'var(--color-emerald)', 
      colorRgb: '16, 185, 129',
      tagline: '話のすり替えや矛盾を正すコンパス',
      benefit: '一見正しそうに見える主張の矛盾や論理の飛躍をすばやく見抜き、一貫性のある正しい議論へと論理展開をナビゲートできるようになります。',
      template: '「もし〇〇という前提が正しい場合、論理的な推論ルールとしては結論は▲▲になりますが、その認識で合っていますでしょうか？」'
    },
    { 
      title: 'ツリーの巨匠', 
      desc: '「ロジックツリー」で100%', 
      color: 'var(--color-amber)', 
      colorRgb: '245, 158, 11',
      tagline: '複雑な課題をMECEに切り分けるナイフ',
      benefit: '複雑に絡み合った課題をMECE（モレなくダブりなく）に分解し、ボトルネックがどこにあるかを特定した上で、次にやるべきアクションを可視化できます。',
      template: '「この複雑な課題は、一旦『現状のコスト維持』と『将来の投資リスク』の2つの軸に分けて整理すると、解決策が見えやすそうですがいかがでしょうか？」'
    },
    { 
      title: '詭弁デバッガー', 
      desc: '「論理的誤謬」で80%以上', 
      color: 'var(--color-rose)', 
      colorRgb: '244, 63, 94',
      tagline: 'マウンティングや屁理屈をいなすバリア',
      benefit: '対話や文章の中に潜む「ストローマン（藁人形論法）」や「対人論証」などの屁理屈をすばやく検知し、感情的にならずに本質的な論点へ話を戻せます。',
      template: '「そのお話も大切ですが、一度本筋に戻して、今回の本質である〇〇について集中して整理しませんか？」'
    },
    { 
      title: '万能思考調律師', 
      desc: 'すべてのトレーニングを体験', 
      color: 'var(--color-primary)', 
      colorRgb: '139, 92, 246',
      tagline: '対立を共感と論理で解決するマスターパッチ',
      benefit: 'ロジックで相手を論破して敵を作るのではなく、感情に寄り添う「共感」と「論理」を両立させ、プロジェクトの対立を穏やかに解消・リードできるようになります。',
      template: '「〇〇したいというお気持ちは本当によく分かります。ただ、今回は全体の利益のために、事実である▲▲をベースにしたベストな着地点を一緒に探せませんか？」'
    }
  ];

  return (
    <div className="app-container">
      {/* Header Navigation */}
      {currentView === 'logicafit' && (
      <header 
        className="glass-panel"
        style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? '12px' : '0px',
          justifyContent: 'space-between',
          alignItems: isMobile ? 'stretch' : 'center',
          padding: isMobile ? '12px 12px' : '16px 24px',
          marginTop: '24px',
          borderRadius: '16px',
          borderWidth: '1px',
          width: '100%',
          boxSizing: 'border-box'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: isMobile ? '100%' : 'auto', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '4px' : '16px', flexShrink: 0 }}>
            <button 
              onClick={() => {
                playSound('click');
                if (activeGame !== null) {
                  if (isGameCompleted) {
                    setActiveGame(null);
                    setIsGameCompleted(false);
                  } else {
                    const confirmExit = window.confirm("トレーニングを中断してダッシュボードに戻りますか？\n（現在の進捗状況はリセットされます）");
                    if (confirmExit) {
                      setActiveGame(null);
                      setIsGameCompleted(false);
                    }
                  }
                } else {
                  setActiveGame(null);
                  if (activeTab !== 'home' && activeTab !== 'achievements') {
                    setActiveTab('home');
                  } else {
                    setCurrentView('portal');
                  }
                }
              }}
              className="btn btn-secondary"
              style={{
                fontSize: isMobile ? '11px' : '12px',
                padding: isMobile ? '6px 8px' : '8px 14px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: isMobile ? '4px' : '6px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                background: 'rgba(255, 255, 255, 0.03)',
                color: 'var(--text-secondary)',
                transition: 'all 0.2s',
                cursor: 'pointer',
                flexShrink: 0,
                minWidth: 'max-content',
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={(e) => {
                if (!isMobile) {
                  e.currentTarget.style.borderColor = 'var(--color-primary)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                  e.currentTarget.style.background = 'rgba(139, 92, 246, 0.08)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isMobile) {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                }
              }}
            >
              <ArrowLeft size={isMobile ? 12 : 14} style={{ flexShrink: 0 }} />
              <span style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
                {(activeGame !== null || (activeTab !== 'home' && activeTab !== 'achievements')) ? 'ダッシュボードへ戻る' : 'ポータルへ戻る'}
              </span>
            </button>

            {!isMobile && <div style={{ width: '1px', height: '24px', background: 'rgba(255, 255, 255, 0.1)' }} />}

            <div 
              onClick={() => { playSound('click'); setActiveGame(null); }}
              style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '4px' : '10px', cursor: 'pointer', flexShrink: 0 }}
            >
              <div 
                style={{ 
                  background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-cyan) 100%)',
                  width: isMobile ? '24px' : '36px',
                  height: isMobile ? '24px' : '36px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 15px rgba(139, 92, 246, 0.4)',
                  flexShrink: 0
                }}
              >
                <Brain size={isMobile ? 14 : 20} color="#fff" />
              </div>
              <span 
                style={{ 
                  fontFamily: 'var(--font-display)', 
                  fontWeight: '800', 
                  fontSize: isMobile ? '15px' : '22px',
                  letterSpacing: '1px',
                  background: 'linear-gradient(135deg, var(--text-primary) 30%, var(--text-secondary) 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  whiteSpace: 'nowrap'
                }}
              >
                LogicaFit
              </span>
            </div>
          </div>

          {/* スマホ時のみ、ヘッダー上部の右側にテーマ切り替えと音量ボタンを配置 */}
          {isMobile && (
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flexShrink: 0 }}>
              <button 
                onClick={() => { playSound('click'); setTheme(prev => prev === 'dark' ? 'light' : 'dark'); }}
                className="btn btn-secondary" 
                style={{ padding: '6px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px' }}
                title={theme === 'dark' ? 'ライトモードに切り替え' : 'ダークモードに切り替え'}
              >
                {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
              </button>

              <button 
                onClick={toggleMute}
                className="btn btn-secondary" 
                style={{ padding: '6px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px' }}
              >
                {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
              </button>
            </div>
          )}
        </div>

        <div style={{ 
          display: 'flex', 
          gap: isMobile ? '10px' : '16px', 
          alignItems: 'center',
          justifyContent: isMobile ? 'space-between' : 'flex-end',
          width: isMobile ? '100%' : 'auto',
          flexWrap: 'wrap'
        }}>
          {/* Mode Switcher */}
          <div 
            className="glass-panel" 
            style={{ 
              display: 'inline-flex', 
              padding: '2px', 
              borderRadius: '20px', 
              background: 'rgba(255, 255, 255, 0.01)',
              border: '1px solid var(--border-color)',
              opacity: activeGame !== null ? 0.5 : 1,
              transition: 'opacity 0.3s'
            }}
          >
            <button
              onClick={() => { playSound('click'); setMode('daily'); }}
              disabled={activeGame !== null}
              className="btn"
              style={{
                borderRadius: '16px',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: 'bold',
                background: mode === 'daily' ? 'linear-gradient(135deg, var(--color-cyan) 0%, #0891b2 100%)' : 'transparent',
                border: 'none',
                color: mode === 'daily' ? '#fff' : 'var(--text-secondary)',
                boxShadow: mode === 'daily' ? '0 0 10px var(--color-cyan-glow)' : 'none',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                cursor: activeGame !== null ? 'not-allowed' : 'pointer',
                whiteSpace: 'nowrap'
              }}
              title={activeGame !== null ? "ゲーム中は切り替えられません" : "日常モード (入門)"}
            >
              🌿 入門
            </button>
            <button
              onClick={() => { playSound('click'); setMode('business'); }}
              disabled={activeGame !== null}
              className="btn"
              style={{
                borderRadius: '16px',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: 'bold',
                background: mode === 'business' ? 'linear-gradient(135deg, var(--color-primary) 0%, #7c3aed 100%)' : 'transparent',
                border: 'none',
                color: mode === 'business' ? '#fff' : 'var(--text-secondary)',
                boxShadow: mode === 'business' ? '0 0 10px var(--color-primary-glow)' : 'none',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                cursor: activeGame !== null ? 'not-allowed' : 'pointer',
                whiteSpace: 'nowrap'
              }}
              title={activeGame !== null ? "ゲーム中は切り替えられません" : "ビジネスモード (中級)"}
            >
              💼 中級
            </button>
          </div>

          {/* XP & Level */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Level</span>
            <div 
              style={{ 
                background: 'rgba(139, 92, 246, 0.15)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                color: 'var(--color-primary)',
                fontWeight: 'bold',
                padding: '4px 10px',
                borderRadius: '8px',
                fontFamily: 'var(--font-display)',
                whiteSpace: 'nowrap'
              }}
            >
              {gameState.level}
            </div>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', whiteSpace: 'nowrap' }}>
              ({gameState.xp} XP)
            </span>
          </div>

          {/* PC時のみ、右端にテーマ切り替えと音量ボタンを配置 */}
          {!isMobile && (
            <>
              <button 
                onClick={() => { playSound('click'); setTheme(prev => prev === 'dark' ? 'light' : 'dark'); }}
                className="btn btn-secondary" 
                style={{ padding: '8px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                title={theme === 'dark' ? 'ライトモードに切り替え' : 'ダークモードに切り替え'}
              >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              <button 
                onClick={toggleMute}
                className="btn btn-secondary" 
                style={{ padding: '8px', borderRadius: '50%' }}
              >
                {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
            </>
          )}
        </div>
      </header>
      )}

      {/* Main Container */}
      <main className="main-content">
        {currentView === 'portal' && (
          <Portal 
            onSelectView={(view) => {
              setActiveGame(null);
              setCurrentView(view);
            }} 
            playSound={playSound} 
          />
        )}

        {currentView === 'logijournal' && (
          <LogiJournal 
            gameState={gameState} 
            onSaveLog={handleSaveTuningLog} 
            onUpdateLog={handleUpdateTuningLog}
            onExportData={handleExportData}
            onImportData={handleImportData}
            onBack={() => setCurrentView('portal')} 
            playSound={playSound} 
            isMobile={isMobile}
            theme={theme}
            setTheme={setTheme}
            muted={muted}
            toggleMute={toggleMute}
          />
        )}

        {currentView === 'meaningless' && (
          <MeaninglessPage 
            onBack={() => setCurrentView('portal')}
            playSound={playSound}
          />
        )}

        {currentView === 'logicatask' && (
          <LogicaTask 
            onBack={() => setCurrentView('portal')}
            playSound={playSound}
            isMobile={isMobile}
          />
        )}

        {currentView === 'logicafit' && (
          <>
            {activeGame === 'factsOpinions' && (
          <FactsOpinions 
            onFinish={handleGameFinish} 
            playSound={playSound} 
            muted={muted} 
            toggleMute={toggleMute} 
            mode={mode}
            onLogBug={handleLogBug}
            reviewQuestionId={reviewQuestionId}
            onFinishReview={handleFinishReview}
          />
        )}
        {activeGame === 'logicalValidity' && (
          <LogicalValidity 
            onFinish={handleGameFinish} 
            playSound={playSound} 
            muted={muted} 
            toggleMute={toggleMute} 
            mode={mode}
            onLogBug={handleLogBug}
            reviewQuestionId={reviewQuestionId}
            onFinishReview={handleFinishReview}
          />
        )}
        {activeGame === 'logicTree' && (
          <LogicTreeAssembler 
            onFinish={handleGameFinish} 
            playSound={playSound} 
            muted={muted} 
            toggleMute={toggleMute} 
            mode={mode}
            onLogBug={handleLogBug}
            reviewQuestionId={reviewQuestionId}
            onFinishReview={handleFinishReview}
          />
        )}
        {activeGame === 'fallacy' && (
          <FallacyDetective 
            onFinish={handleGameFinish} 
            playSound={playSound} 
            muted={muted} 
            toggleMute={toggleMute} 
            mode={mode}
            onLogBug={handleLogBug}
            reviewQuestionId={reviewQuestionId}
            onFinishReview={handleFinishReview}
          />
        )}
        {activeGame === 'empathyDialogue' && (
          <EmpathyDialogue 
            onFinish={handleGameFinish} 
            playSound={playSound} 
            muted={muted} 
            toggleMute={toggleMute} 
            mode={mode}
            onLogBug={handleLogBug}
            reviewQuestionId={reviewQuestionId}
            onFinishReview={handleFinishReview}
          />
        )}
        {activeGame === 'hiddenAssumption' && (
          <HiddenAssumption 
            onFinish={handleGameFinish} 
            playSound={playSound} 
            muted={muted} 
            toggleMute={toggleMute} 
            mode={mode}
            onLogBug={handleLogBug}
            reviewQuestionId={reviewQuestionId}
            onFinishReview={handleFinishReview}
          />
        )}
        {activeGame === 'causalLoop' && (
          <CausalLoop 
            onFinish={handleGameFinish} 
            playSound={playSound} 
            muted={muted} 
            toggleMute={toggleMute} 
            mode={mode}
            onLogBug={handleLogBug}
            reviewQuestionId={reviewQuestionId}
            onFinishReview={handleFinishReview}
          />
        )}
        {activeGame === 'assertiveRewrite' && (
          <AssertiveRewrite 
            onFinish={handleGameFinish} 
            playSound={playSound} 
            muted={muted} 
            toggleMute={toggleMute} 
            mode={mode}
            onLogBug={handleLogBug}
            reviewQuestionId={reviewQuestionId}
            onFinishReview={handleFinishReview}
          />
        )}
        {activeGame === 'fallacyHunter' && (
          <FallacyHunter 
            onFinish={(score, shouldExit = true) => {
              handleGameFinish('fallacyHunter', score, shouldExit);
            }}
            playSound={playSound}
            muted={muted}
            toggleMute={toggleMute}
            onBack={() => setActiveGame(null)}
            onLogBug={handleLogBug}
            reviewQuestionId={reviewQuestionId}
            onFinishReview={handleFinishReview}
          />
        )}
        {activeGame === 'treeQuest' && (
          <TreeQuest 
            onFinish={(score, shouldExit = true) => {
              handleGameFinish('treeQuest', score, shouldExit);
            }}
            playSound={playSound}
            muted={muted}
            toggleMute={toggleMute}
            onBack={() => setActiveGame(null)}
            onLogBug={handleLogBug}
            reviewQuestionId={reviewQuestionId}
            onFinishReview={handleFinishReview}
          />
        )}
        {activeGame === 'eqSimulator' && (
          <EqSimulator 
            onFinish={(score, shouldExit = true) => {
              handleGameFinish('eqSimulator', score, shouldExit);
            }}
            playSound={playSound}
            muted={muted}
            toggleMute={toggleMute}
            onBack={() => setActiveGame(null)}
            onLogBug={handleLogBug}
            reviewQuestionId={reviewQuestionId}
            onFinishReview={handleFinishReview}
          />
        )}
        {(activeGame === 'strategic' || activeGame === 'strategicCompiler') && (
          <StrategicCompiler 
            onFinish={handleGameFinish}
            playSound={playSound}
            muted={muted}
            toggleMute={toggleMute}
            mode={mode}
            onLogBug={handleLogBug}
            reviewQuestionId={reviewQuestionId}
            onFinishReview={handleFinishReview}
          />
        )}
        {activeGame === 'gameTheory' && (
          <GameTheory 
            onFinish={handleGameFinish}
            playSound={playSound}
            muted={muted}
            toggleMute={toggleMute}
            mode={mode}
            onLogBug={handleLogBug}
            reviewQuestionId={reviewQuestionId}
            onFinishReview={handleFinishReview}
            onBack={() => setActiveGame(null)}
          />
        )}
        {activeGame === 'diagnostic' && (
          <DiagnosticContainer 
            onSelectGame={(gameKey) => {
              playSound('click');
              setActiveGame(gameKey);
            }} 
            onSaveDiagnostic={handleSaveDiagnostic}
            myBrainCode={currentSpell}
            onUnlockType={handleUnlockType}
          />
        )}
        {activeGame === 'harassmentScanner' && (
          <HarassmentScanner
            onSaveDiagnostic={handleSaveDiagnostic}
            onSelectGame={setActiveGame}
            playSound={playSound}
          />
        )}

        {activeGame === 'debugLab' && (
          <DebugLab 
            gameState={gameState}
            onFinish={handleGameFinish}
            playSound={playSound}
            onBack={() => { setActiveGame(null); setActiveTab('home'); }}
            muted={muted}
            toggleMute={toggleMute}
          />
        )}

        {/* Dashboard Home */}
        {activeGame === null && (
          <Dashboard
            isNewUser={isNewUser}
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
            onUnlockType={handleUnlockType}
            theme={theme}
            setTheme={setTheme}
            muted={muted}
            toggleMute={toggleMute}
            onStartReview={(gameId, questionId) => {
              playSound('click');
              let finalGameId = gameId;
              let finalQuestionId = questionId;
              if (gameId && typeof gameId === 'object') {
                finalGameId = gameId.gameId;
                finalQuestionId = gameId.questionId;
              }
              const mappedGameId = finalGameId === 'strategicCompiler' ? 'strategic' : finalGameId;
              setActiveGame(mappedGameId);
              setReviewQuestionId(finalQuestionId);
            }}
          />
        )}
          </>
        )}
      </main>

      {/* Rewards Popup Modal */}
      {rewardModal.show && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div 
              style={{ 
                background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-cyan) 100%)',
                width: '60px',
                height: '60px',
                borderRadius: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
                boxShadow: '0 0 20px var(--color-primary-glow)'
              }}
            >
              <Sparkles size={32} color="#fff" />
            </div>

            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: '800', marginBottom: '8px' }}>
              {rewardModal.title}
            </h2>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--color-primary)', margin: '8px 0 24px', textShadow: '0 0 10px var(--color-primary-glow)' }}>
              {rewardModal.value}
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.5', marginBottom: '16px' }}>
              データが「ブレインコード」に変換されました！コピーして大切に保管してください。
            </p>

            <div className="spell-box">
              <span>{rewardModal.spell}</span>
              <button 
                onClick={() => handleCopySpell(rewardModal.spell)}
                className="btn btn-secondary"
                style={{ padding: '6px', borderRadius: '8px', minWidth: 'auto', background: 'rgba(255,255,255,0.05)' }}
                title="コピー"
              >
                <Copy size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => handleShareToX(
                    rewardModal.type === 'level'
                      ? `✨ 思考の筋トレ「LogicaFit」でレベルアップ！\n【${rewardModal.value}】に到達しました！脳の回路が活性化中。\n\n#LogicaFit #ロジカフィット #論理的思考`
                      : `🏆 思考の筋トレ「LogicaFit」で実績アンロック！\n称号【${rewardModal.value}】を獲得しました！\n\n#LogicaFit #ロジカフィット #論理的思考`
                  )}
                  className="btn btn-secondary"
                  style={{ flex: '1 1 auto', minWidth: '100px', padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '13px' }}
                >
                  𝕏 でシェア
                </button>
                <button
                  onClick={() => handleShareToFacebook(
                    rewardModal.type === 'level'
                      ? `✨ 思考の筋トレ「LogicaFit」でレベルアップ！\n【${rewardModal.value}】に到達しました！脳の回路が活性化中。\n\n#LogicaFit #ロジカフィット #論理的思考`
                      : `🏆 思考の筋トレ「LogicaFit」で実績アンロック！\n称号【${rewardModal.value}】を獲得しました！\n\n#LogicaFit #ロジカフィット #論理的思考`
                  )}
                  className="btn btn-secondary"
                  style={{ flex: '1 1 auto', minWidth: '100px', padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '13px' }}
                >
                  Facebook
                </button>
                <button
                  onClick={() => handleCopyText(
                    rewardModal.type === 'level'
                      ? `✨ 思考の筋トレ「LogicaFit」でレベルアップ！\n【${rewardModal.value}】に到達しました！脳の回路が活性化中。\nhttps://www.logicafit.site/ #LogicaFit`
                      : `🏆 思考の筋トレ「LogicaFit」で実績アンロック！\n称号【${rewardModal.value}】を獲得しました！\nhttps://www.logicafit.site/ #LogicaFit`
                  )}
                  className="btn btn-secondary"
                  style={{ flex: '1 1 auto', minWidth: '120px', padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '13px' }}
                >
                  結果をコピー
                </button>
              </div>
              <button 
                onClick={() => setRewardModal(prev => ({ ...prev, show: false }))} 
                className="btn btn-primary" 
                style={{ width: '100%', padding: '12px', fontSize: '14px', marginTop: '4px' }}
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Guide Modal */}
      {showGuideModal && (
        <GuideModal isOpen={showGuideModal} onClose={() => setShowGuideModal(false)} />
      )}

      {/* Unlock Modal (🎉 すべての部屋が解放されました！ ) */}
      {showUnlockModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '480px', padding: '36px' }}>
            <div 
              style={{ 
                background: 'linear-gradient(135deg, var(--color-cyan) 0%, var(--color-primary) 100%)',
                width: '64px',
                height: '64px',
                borderRadius: '22px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
                boxShadow: '0 0 25px rgba(6, 182, 212, 0.5)',
                animation: 'pulse 2s infinite'
              }}
            >
              <Sparkles size={34} color="#fff" />
            </div>

            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: '800', marginBottom: '12px', color: 'var(--text-primary)' }}>
              🎉 思考ルーム全解放！
            </h2>
            
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6', marginBottom: '24px' }}>
              おめでとうございます！最初のトレーニングミッションをクリアし、脳内OSのデバッグ能力が証明されました。<br/>
              これで<strong>すべての思考ルーム（ロジカル、クリティカル、ラディカル、エモーショナル）</strong>と、図鑑・実績機能が完全に解放されました！
            </p>

            <button 
              onClick={() => {
                playSound('correct');
                setShowUnlockModal(false);
                setTimeout(() => {
                  document.getElementById('training-menu')?.scrollIntoView({ behavior: 'smooth' });
                }, 300);
              }} 
              className="btn btn-primary" 
              style={{ 
                width: '100%', 
                padding: '14px', 
                fontSize: '15px', 
                fontWeight: 'bold',
                background: 'linear-gradient(135deg, var(--color-cyan) 0%, var(--color-primary) 100%)',
                border: 'none',
                boxShadow: '0 4px 15px rgba(6, 182, 212, 0.4)'
              }}
            >
              思考ジムへ入室する
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer 
        style={{ 
          borderTop: '1px solid var(--border-color)', 
          padding: '24px 0', 
          color: 'var(--text-muted)', 
          fontSize: '13px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div>
          © 2026 kaeru-lab. All rights reserved.
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <span>思考のフィットネスで、揺るぎないロジックを。</span>
        </div>
      </footer>
    </div>
  );
}

function GuideModal({ isOpen, onClose }) {
  const [step, setStep] = useState(1);
  const totalSteps = 4;

  if (!isOpen) return null;

  const handleNext = () => {
    if (step < totalSteps) setStep(step + 1);
    else onClose();
  };

  const handlePrev = () => {
    if (step > 1) setStep(step - 1);
  };

  const stepsContent = [
    {
      title: "🌿 1. 難易度モードを選ぼう",
      description: "LogicaFitには『日常編（入門）』と『ビジネス編（中級）』の2つの難易度モードがあります。ヘッダー右上のトグルボタンでいつでも切り替えられます。初心者の方は、まず優しい『日常編』から始めるのがおすすめです！",
      icon: <Sparkles size={48} style={{ color: 'var(--color-cyan)' }} />
    },
    {
      title: "🎯 2. クイズで論理脳を鍛えよう",
      description: "『事実 vs 意見』『論理の妥当性』『ロジックツリー』『論理的誤謬の特定』の4つのトレーニングがあります。どれも1プレイ3分程度。問題の背景や日常会話から『論理 of バグ』を探し出すゲーム形式です。",
      icon: <Brain size={48} style={{ color: 'var(--color-primary)' }} />
    },
    {
      title: "📊 3. 思考力パラメータで強みを知ろう",
      description: "クイズを終えると、あなたの能力が『思考力パラメーター（レーダーチャート）』にリアルタイムで反映されます。弱い部分を繰り返しトレーニングして、バランスの良い『万能ロジシャン』を目指しましょう！",
      icon: <TrendingUp size={48} style={{ color: 'var(--color-emerald)' }} />
    },
    {
      title: "💾 4. ブレインコードで同期・保存",
      description: "獲得したレベルやXP、バッジ実績はブラウザに自動保存されます。他のPCやスマホでも同じレベルからプレイしたい時は、『ブレインコード（同期キー）』をコピーして入力すれば、いつでも同期・復元が可能です。",
      icon: <KeyRound size={48} style={{ color: 'var(--color-amber)' }} />
    }
  ];

  const current = stepsContent[step - 1];

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'rgba(10, 11, 16, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div 
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '520px',
          background: 'var(--modal-bg)',
          border: '1px solid var(--modal-border)',
          borderRadius: '24px',
          padding: '32px',
          textAlign: 'center',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.55), 0 0 30px rgba(139, 92, 246, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '24px',
          position: 'relative'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
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

        <div 
          style={{
            width: '90px',
            height: '90px',
            borderRadius: '24px',
            background: 'var(--bg-inner-box)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '8px'
          }}
        >
          {current.icon}
        </div>

        {/* Text Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
            {current.title}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6', margin: 0, textAlign: 'left', minHeight: '110px' }}>
            {current.description}
          </p>
        </div>

        {/* Progress Dots */}
        <div style={{ display: 'flex', gap: '8px', margin: '8px 0' }}>
          {Array.from({ length: totalSteps }).map((_, idx) => (
            <div 
              key={idx}
              style={{
                width: idx + 1 === step ? '24px' : '8px',
                height: '8px',
                borderRadius: '4px',
                background: idx + 1 === step ? 'var(--color-primary)' : 'rgba(255, 255, 255, 0.15)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            />
          ))}
        </div>

        {/* Navigation Buttons */}
        <div style={{ display: 'flex', gap: '12px', width: '100%', marginTop: '8px' }}>
          {step > 1 && (
            <button 
              onClick={handlePrev}
              className="btn btn-secondary"
              style={{ flex: 1, padding: '12px' }}
            >
              戻る
            </button>
          )}
          <button 
            onClick={handleNext}
            className="btn btn-primary"
            style={{
              flex: 2,
              padding: '12px',
              background: 'linear-gradient(135deg, var(--color-primary) 0%, #7c3aed 100%)',
              boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)'
            }}
          >
            {step === totalSteps ? 'はじめる！' : '次へ'}
          </button>
        </div>

      </div>
    </div>
  );
}
