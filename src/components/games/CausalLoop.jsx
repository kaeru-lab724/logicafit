import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, ArrowRight, RotateCcw, Volume2, VolumeX, Sparkles, AlertTriangle } from 'lucide-react';
import RakutenWidget from '../common/RakutenWidget';

const SCENARIOS = {
  daily: [
    {
      id: 'daily_1',
      title: '貯金ゼロの悪循環',
      nodes: [
        { id: 0, label: '貯金が少ない', x: 200, y: 80 },
        { id: 1, label: '将来への不安', x: 340, y: 170 },
        { id: 2, label: 'ストレス発散の衝動買い', x: 270, y: 280 },
        { id: 3, label: '出費が増加', x: 130, y: 220 }
      ],
      step1Question: '「将来への不安」は「ストレス発散の衝動買い」を？',
      step1Options: [
        { text: '増大させる (＋)', isCorrect: true },
        { text: '減少させる (－)', isCorrect: false }
      ],
      step2Question: 'この悪循環を断ち切るための最も効果的な介入策（ボトルネックパッチ）は？',
      step2Options: [
        { text: '自動先取り貯金を導入し、使えるお金を物理的に制限する', isCorrect: true },
        { text: 'クレジットカードの利用限度額を上げて支払いを先延ばしにする', isCorrect: false },
        { text: 'より高い利回りを目指し、怪しい投資セミナーに参加する', isCorrect: false }
      ],
      explanation: '「不安」から生じる感情的支出をシステム的に遮断する（給与口座から自動で先取り貯金に回す）ことで、「衝動買い」の元手を物理的にゼロにし、悪循環を強制停止します。'
    },
    {
      id: 'daily_2',
      title: '慢性的な睡眠不足',
      nodes: [
        { id: 0, label: '睡眠不足', x: 200, y: 80 },
        { id: 1, label: '日中の集中力低下', x: 340, y: 170 },
        { id: 2, label: 'ミスによる残業', x: 270, y: 280 },
        { id: 3, label: '帰宅時間の遅延', x: 130, y: 220 }
      ],
      step1Question: '「日中の集中力低下」は「ミスによる残業」を？',
      step1Options: [
        { text: '増大させる (＋)', isCorrect: true },
        { text: '減少させる (－)', isCorrect: false }
      ],
      step2Question: 'この悪循環を断ち切る最も効果的な介入策（ボトルネックパッチ）は？',
      step2Options: [
        { text: '仕事が残っていても特定の時刻（例: 20時）に強制退勤するルールを作る', isCorrect: true },
        { text: 'カフェイン飲料の摂取量を増やして、無理やり覚醒状態を維持する', isCorrect: false },
        { text: '残業時間を削減するために、仕事のタイピング速度を上げる練習をする', isCorrect: false }
      ],
      explanation: '「残業による遅延」が次の「睡眠不足」を生む決定的なボトルネックです。強制退勤ルールによって睡眠時間を確保し、翌日の集中力を回復させることでミスそのものを減らします。'
    },
    {
      id: 'daily_3',
      title: '運動不足と疲労のループ',
      nodes: [
        { id: 0, label: '運動不足', x: 200, y: 80 },
        { id: 1, label: '体力の低下', x: 340, y: 170 },
        { id: 2, label: '疲れやすさの増大', x: 270, y: 280 },
        { id: 3, label: '動く気力の減退', x: 130, y: 220 }
      ],
      step1Question: '「体力の低下」は「疲れやすさの増大」を？',
      step1Options: [
        { text: '増大させる (＋)', isCorrect: true },
        { text: '減少させる (－)', isCorrect: false }
      ],
      step2Question: 'この悪循環を断切る最も効果的な介入策（ボトルネックパッチ）は？',
      step2Options: [
        { text: '「毎日5分だけ散歩する」など極小のハードルで運動を開始する', isCorrect: true },
        { text: '疲労回復サプリメントを大量に買い込み、運動の代わりに服用する', isCorrect: false },
        { text: '体力が戻るまで、数ヶ月間ベッドから動かないように生活する', isCorrect: false }
      ],
      explanation: '「動く気力がない」状態で大きな運動を計画すると失敗します。「5分だけ歩く」といった心理的・肉体的負荷の極めて低い習慣から介入し、少しずつ体力を戻して良循環へと切り替えます。'
    }
  ],
  business: [
    {
      id: 'business_1',
      title: '人材流出の悪循環',
      nodes: [
        { id: 0, label: '離職者が増加', x: 200, y: 80 },
        { id: 1, label: '残された社員の負担増', x: 340, y: 170 },
        { id: 2, label: 'ストレス・過労の増大', x: 270, y: 280 },
        { id: 3, label: '組織への信頼低下', x: 130, y: 220 }
      ],
      step1Question: '「残された社員の負担増」は「ストレス・過労」を？',
      step1Options: [
        { text: '増大させる (＋)', isCorrect: true },
        { text: '減少させる (－)', isCorrect: false }
      ],
      step2Question: 'この悪循環を断ち切るための最も効果的な介入策は？',
      step2Options: [
        { text: '一時的に業務スコープを縮小し、社員の残業上限を厳格化する', isCorrect: true },
        { text: '残された社員へ一時的な「穴埋め手当（少額一時金）」を支給する', isCorrect: false },
        { text: '離職手続きをオンライン化し、退職時の負荷を削減する', isCorrect: false }
      ],
      explanation: '「負担増加による過労」が次の離職を生む主因です。業務量（プロジェクトのスコープ）そのものを強制的に削減し、残された組織の健全性を防衛することが崩壊を止める唯一の道です。'
    },
    {
      id: 'business_2',
      title: '広告費依存の罠',
      nodes: [
        { id: 0, label: '自然流入の減少', x: 200, y: 80 },
        { id: 1, label: '広告出稿費の増加', x: 340, y: 160 },
        { id: 2, label: '製品開発投資の削減', x: 300, y: 260 },
        { id: 3, label: '製品品質の相対的低下', x: 140, y: 220 }
      ],
      step1Question: '「広告出稿費の増加」は「製品開発投資」を？',
      step1Options: [
        { text: '増大させる (＋)', isCorrect: false },
        { text: '減少（削減）させる (－)', isCorrect: true }
      ],
      step2Question: 'この悪循環（広告依存）から脱却するための最も効果的な介入策は？',
      step2Options: [
        { text: '広告費に予算枠を設け、浮いた資金をコア製品の改善に強制投資する', isCorrect: true },
        { text: 'さらに広告の配信面を増やし、認知度の獲得でゴリ押す', isCorrect: false },
        { text: '広告代理店を変更し、よりキャッチーなキャッチコピーを作る', isCorrect: false }
      ],
      explanation: '広告費のために「プロダクト改善費」が削られ、さらに製品が劣化する悪循環です。広告予算を意図的にロックし、製品力（自然流入の源泉）の回復に資金をバイパスする必要があります。'
    },
    {
      id: 'business_3',
      title: '技術的負債と手戻りのループ',
      nodes: [
        { id: 0, label: 'スケジュールの逼迫', x: 200, y: 80 },
        { id: 1, label: '設計・テストの省略', x: 340, y: 160 },
        { id: 2, label: 'バグ・負債の蓄積', x: 300, y: 260 },
        { id: 3, label: '手戻り作業の増加', x: 140, y: 220 }
      ],
      step1Question: '「バグ・負債の蓄積」は「手戻り作業」を？',
      step1Options: [
        { text: '増大させる (＋)', isCorrect: true },
        { text: '減少させる (－)', isCorrect: false }
      ],
      step2Question: 'この開発崩壊ループを安定化させる最も効果的な介入策は？',
      step2Options: [
        { text: '自動テストを導入し、手戻りを自動検知して負債の蓄積を早期防御する', isCorrect: true },
        { text: 'スケジュールを死守するため、全エンジニアの深夜残業を許可する', isCorrect: false },
        { text: 'バグ報告の受付チャネルを一時的に閉鎖して開発を優先する', isCorrect: false }
      ],
      explanation: '「手動によるバグ修正と手戻り」がさらなる逼迫を生みます。自動化テストを組み込むことで、バグを早期発見・予防する防波堤を作り、手戻りにかかる開発リソースを激減させます。'
    }
  ]
};

export default function CausalLoop({ onFinish, playSound, muted, toggleMute, mode, onLogBug, reviewQuestionId, onFinishReview }) {
  const [showTutorial, setShowTutorial] = useState(true);
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [step, setStep] = useState(1); // 1: Polarity, 2: Leverage Point
  const [selectedOpt, setSelectedOpt] = useState(null);
  const [isStep1Solved, setIsStep1Solved] = useState(false);
  const [isStep2Solved, setIsStep2Solved] = useState(false);
  const [hasRetriedStep1, setHasRetriedStep1] = useState(false);
  const [hasRetriedStep2, setHasRetriedStep2] = useState(false);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);

  const initializeQuestions = () => {
    const rawData = mode === 'business' ? SCENARIOS.business : SCENARIOS.daily;
    let finalized = [];
    if (reviewQuestionId) {
      const found = SCENARIOS.daily.find(q => q.id === reviewQuestionId) || 
                    SCENARIOS.business.find(q => q.id === reviewQuestionId);
      if (found) {
        finalized = [found];
        setShowTutorial(false);
      }
    }
    if (finalized.length === 0) {
      finalized = [...rawData].sort(() => 0.5 - Math.random()).slice(0, 3);
    }
    setQuestions(finalized);
    setCurrentIdx(0);
    setStep(1);
    setSelectedOpt(null);
    setIsStep1Solved(false);
    setIsStep2Solved(false);
    setHasRetriedStep1(false);
    setHasRetriedStep2(false);
    setScore(0);
    setCompleted(false);
  };

  useEffect(() => {
    initializeQuestions();
  }, [mode]);

  if (questions.length === 0) return null;

  const currentQ = questions[currentIdx];
  const isStep2Correct = selectedOpt !== null && currentQ.step2Options && currentQ.step2Options[selectedOpt] ? currentQ.step2Options[selectedOpt].isCorrect : false;

  const handleStep1Answer = (option, idx) => {
    if (isStep1Solved) return;
    playSound('click');
    setSelectedOpt(idx);

    if (option.isCorrect) {
      setIsStep1Solved(true);
      playSound('correct');
      if (!hasRetriedStep1) {
        setScore(prev => prev + 0.5);
      } else {
        setScore(prev => prev + 0.25);
      }
    } else {
      if (!hasRetriedStep1) {
        setHasRetriedStep1(true);
        playSound('incorrect');
      } else {
        setIsStep1Solved(true);
        playSound('incorrect');
        if (onLogBug && !reviewQuestionId) {
          onLogBug('causalLoop', currentQ.id, `Step 1の誤回答: ${option.text} (正解: ${currentQ.step1Options.find(o => o.isCorrect)?.text})`);
        }
      }
    }
  };

  const handleGoToStep2 = () => {
    playSound('click');
    setStep(2);
    setSelectedOpt(null);
  };

  const handleStep2Answer = (option, idx) => {
    if (isStep2Solved) return;
    playSound('click');
    setSelectedOpt(idx);

    if (option.isCorrect) {
      setIsStep2Solved(true);
      playSound('correct');
      if (!hasRetriedStep2) {
        setScore(prev => prev + 0.5);
      } else {
        setScore(prev => prev + 0.25);
      }
    } else {
      if (!hasRetriedStep2) {
        setHasRetriedStep2(true);
        playSound('incorrect');
      } else {
        setIsStep2Solved(true);
        playSound('incorrect');
        if (onLogBug && !reviewQuestionId) {
          onLogBug('causalLoop', currentQ.id, `Step 2の誤回答: ${option.text} (正解: ${currentQ.step2Options.find(o => o.isCorrect)?.text})`);
        }
      }
    }
  };

  const handleNext = () => {
    playSound('click');
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(prev => prev + 1);
      setStep(1);
      setSelectedOpt(null);
      setIsStep1Solved(false);
      setIsStep2Solved(false);
      setHasRetriedStep1(false);
      setHasRetriedStep2(false);
    } else {
      setCompleted(true);
      if (reviewQuestionId && onFinishReview) {
        onFinishReview('causalLoop', reviewQuestionId);
      } else {
        const finalScore = Math.round((score / questions.length) * 100);
        onFinish('causalLoop', finalScore, false);
        playSound('success');
      }
    }
  };

  return (
    <div className="game-container fade-in">
      <div className="glass-panel" style={{ padding: '24px', position: 'relative' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <span style={{ color: 'var(--color-amber)', fontWeight: 'bold', fontSize: '14px', letterSpacing: '1px' }}>
              TRAINING MODULE 04 [2nd]
            </span>
            <h2 style={{ fontFamily: 'var(--font-display)', marginTop: '4px' }}>因果ループ＆ボトルネックデバッガー</h2>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button 
              onClick={toggleMute}
              className="btn btn-secondary" 
              style={{ padding: '8px', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            {!showTutorial && !completed && (
              <div className="score-badge" style={{ borderColor: 'var(--color-amber)', color: 'var(--color-amber)' }}>
                ループ: {currentIdx + 1} / {questions.length}
              </div>
            )}
          </div>
        </div>

        {showTutorial ? (
          /* Tutorial Screen */
          <div style={{ textAlign: 'left' }} className="fade-in">
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', color: 'var(--color-amber)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={20} /> 30秒解説：因果ループとボトルネックとは？
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '20px' }}>
              世の中のトラブルの多くは、原因と結果が一周して元に戻ってくる<strong>「因果ループ（フィードバックループ）」</strong>を形成し、悪循環となって加速しています。<br />
              これを解決するには、単に要素に分けるだけでなく、<strong>「悪循環を断ち切れるレバレッジポイント（ボトルネック）」</strong>に正しい介入策（パッチ）を当てる必要があります。
            </p>
            <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.15)', marginBottom: '24px' }}>
              <span style={{ fontWeight: 'bold', color: 'var(--color-amber)', fontSize: '14px' }}>⚙️ ゲームの進め方：</span>
              <ul style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px', paddingLeft: '20px', lineHeight: '1.8' }}>
                <li><strong>1. 極性の特定</strong>：ループ内の2つの要因が「増大させる(＋)」か「減少させる(－)」かの関係性を見極めます。</li>
                <li><strong>2. ボトルネックの遮断</strong>：ループを破壊して健全な循環へ導く、最も効果的な解決策を選択します。</li>
              </ul>
            </div>
            <button 
              onClick={() => setShowTutorial(false)}
              className="btn btn-primary"
              style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg, var(--color-amber) 0%, #d97706 100%)', border: 'none', boxShadow: '0 4px 15px var(--color-amber-glow)' }}
            >
              トレーニングを開始する
            </button>
          </div>
        ) : completed ? (
          /* Completion Screen */
          <div style={{ textAlign: 'center', padding: '40px 0' }} className="fade-in">
            <div style={{ display: 'inline-flex', background: 'rgba(245, 158, 11, 0.1)', padding: '20px', borderRadius: '50%', marginBottom: '24px' }}>
              <CheckCircle2 size={64} color="var(--color-amber)" />
            </div>
            <h3 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '8px' }}>すべての悪循環のデバッグ完了！</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' }}>
              因果の流れを読み解き、真のボトルネックに介入するシステム的アプローチが身につきました。
            </p>
            <div style={{ background: 'var(--bg-inner-box)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '24px', maxWidth: '320px', margin: '0 auto 32px' }}>
              <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>スコア</span>
              <div style={{ fontSize: '48px', fontWeight: '800', color: 'var(--color-amber)', fontFamily: 'var(--font-display)', margin: '8px 0' }}>
                {Math.round((score / questions.length) * 100)}%
              </div>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                獲得XP: +{Math.round((score / questions.length) * 100) * 10} XP
              </span>
            </div>

            <RakutenWidget />

            <button 
              onClick={() => onFinish('causalLoop', Math.round((score / questions.length) * 100), true)}
              className="btn btn-primary"
              style={{ width: '100%', maxWidth: '320px', padding: '14px', background: 'linear-gradient(135deg, var(--color-amber) 0%, #d97706 100%)', border: 'none' }}
            >
              ← ダッシュボードに戻る
            </button>
          </div>
        ) : (
          /* Game Screens */
          <div>
            {/* Vicious Loop Graphic Board */}
            <div style={{
              background: 'var(--bg-inner-box)',
              border: '1px solid var(--border-color)',
              borderRadius: '20px',
              padding: '20px',
              marginBottom: '24px',
              position: 'relative',
              height: '340px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden'
            }}>
              {/* Loop status text */}
              <div style={{
                position: 'absolute',
                top: '16px',
                left: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px',
                color: isStep2Solved ? 'var(--color-emerald)' : 'var(--color-amber)',
                fontWeight: 'bold'
              }}>
                {isStep2Solved ? (
                  <>
                    <CheckCircle2 size={16} />
                    <span>SYSTEM STABILIZED [良循環へ移行]</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle size={16} className="pulse" />
                    <span>VICIOUS CYCLE DETECTED [悪循環発生中]</span>
                  </>
                )}
              </div>

              {/* SVG loop connections and nodes */}
              <svg 
                style={{ 
                  width: '460px', 
                  height: '340px',
                  animation: !isStep2Solved ? 'shake-slow 4s infinite linear' : 'none'
                }}
              >
                {/* Connections (arrows) */}
                <g>
                  {/* Node 0 -> Node 1 */}
                  <path 
                    d="M 230 100 Q 320 100 330 145" 
                    fill="none" 
                    stroke={isStep2Solved ? 'var(--color-emerald)' : 'var(--color-amber)'} 
                    strokeWidth="3"
                    strokeDasharray={!isStep2Solved ? '5 5' : 'none'}
                    className={isStep2Solved ? 'neon-pulse-line' : 'vicious-flow'}
                  />
                  {/* Node 1 -> Node 2 */}
                  <path 
                    d="M 320 200 Q 310 270 280 270" 
                    fill="none" 
                    stroke={isStep2Solved ? 'var(--color-emerald)' : 'var(--color-amber)'} 
                    strokeWidth="3"
                    strokeDasharray={!isStep2Solved ? '5 5' : 'none'}
                  />
                  {/* Node 2 -> Node 3 */}
                  <path 
                    d="M 230 280 Q 150 280 140 240" 
                    fill="none" 
                    stroke={isStep2Solved ? 'var(--color-emerald)' : 'var(--color-amber)'} 
                    strokeWidth="3"
                    strokeDasharray={!isStep2Solved ? '5 5' : 'none'}
                  />
                  {/* Node 3 -> Node 0 */}
                  <path 
                    d="M 150 190 Q 160 100 200 95" 
                    fill="none" 
                    stroke={isStep2Solved ? 'var(--color-emerald)' : 'var(--color-amber)'} 
                    strokeWidth="3"
                    strokeDasharray={!isStep2Solved ? '5 5' : 'none'}
                  />
                </g>

                {/* Nodes */}
                {currentQ.nodes.map((n, idx) => {
                  let textCol = 'var(--text-primary)';
                  let bgCol = 'var(--bg-inner-box)';
                  let borderCol = 'var(--border-color)';

                  if (isStep2Solved) {
                    borderCol = 'var(--color-emerald)';
                    bgCol = 'rgba(16, 185, 129, 0.1)';
                  } else {
                    borderCol = 'rgba(245, 158, 11, 0.4)';
                  }

                  return (
                    <g key={n.id} transform={`translate(${n.x - 70}, ${n.y - 25})`}>
                      <rect 
                        width="140" 
                        height="44" 
                        rx="12" 
                        fill={bgCol} 
                        stroke={borderCol} 
                        strokeWidth="1.5"
                        style={{ filter: isStep2Solved ? 'drop-shadow(0 0 5px rgba(16, 185, 129, 0.2))' : 'none', transition: 'all 0.5s' }}
                      />
                      <text 
                        x="70" 
                        y="26" 
                        textAnchor="middle" 
                        fill={textCol} 
                        fontSize="11.5" 
                        fontWeight="bold"
                      >
                        {n.label}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Step 1: Polarity checking */}
            {step === 1 && (
              <div className="fade-in">
                <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '16px 20px', marginBottom: '24px', textAlign: 'left' }}>
                  <h4 style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                    {currentQ.step1Question}
                  </h4>
                </div>

                <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
                  {currentQ.step1Options.map((option, idx) => {
                    const isSelected = selectedOpt === idx;
                    const showCorrect = isStep1Solved && option.isCorrect;
                    const showIncorrect = isSelected && !option.isCorrect;

                    let borderCol = 'var(--border-color)';
                    let bgCol = 'rgba(255, 255, 255, 0.01)';
                    if (showCorrect) {
                      borderCol = 'var(--color-emerald)';
                      bgCol = 'rgba(16, 185, 129, 0.05)';
                    } else if (showIncorrect) {
                      borderCol = 'var(--color-rose)';
                      bgCol = 'rgba(244, 63, 94, 0.05)';
                    } else if (isSelected) {
                      borderCol = 'var(--color-amber)';
                    }

                    return (
                      <button
                        key={idx}
                        onClick={() => handleStep1Answer(option, idx)}
                        disabled={isStep1Solved}
                        className="btn"
                        style={{
                          flex: 1,
                          padding: '16px',
                          borderRadius: '12px',
                          border: `1px solid ${borderCol}`,
                          background: bgCol,
                          color: 'var(--text-primary)',
                          fontWeight: 'bold',
                          fontSize: '14px',
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          gap: '8px',
                          cursor: isStep1Solved ? 'default' : 'pointer'
                        }}
                      >
                        {option.text}
                        {showCorrect && <CheckCircle2 size={16} color="var(--color-emerald)" />}
                        {showIncorrect && <XCircle size={16} color="var(--color-rose)" />}
                      </button>
                    );
                  })}
                </div>

                {hasRetriedStep1 && !isStep1Solved && (
                  <div style={{
                    padding: '12px 16px',
                    borderRadius: '12px',
                    background: 'rgba(244, 63, 94, 0.05)',
                    border: '1px solid rgba(244, 63, 94, 0.15)',
                    color: 'var(--color-rose)',
                    fontSize: '12.5px',
                    textAlign: 'left',
                    marginBottom: '20px'
                  }}>
                    💡 ヒント：片方の値が増えた時に、もう片方の値も同じように「増える」関係なら「増大させる(＋)」、「減る」関係なら「減少させる(－)」です。
                  </div>
                )}

                {isStep1Solved && (
                  <button
                    onClick={handleGoToStep2}
                    className="btn btn-primary"
                    style={{
                      width: '100%',
                      padding: '14px',
                      background: 'linear-gradient(135deg, var(--color-amber) 0%, #d97706 100%)',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    ボトルネック（介入策）の特定へ
                    <ArrowRight size={16} />
                  </button>
                )}
              </div>
            )}

            {/* Step 2: Leverage Point Debugging */}
            {step === 2 && (
              <div className="fade-in">
                <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '16px 20px', marginBottom: '20px', textAlign: 'left' }}>
                  <h4 style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                    {currentQ.step2Question}
                  </h4>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                  {currentQ.step2Options.map((option, idx) => {
                    const isSelected = selectedOpt === idx;
                    const showCorrect = isStep2Solved && option.isCorrect;
                    const showIncorrect = isSelected && !option.isCorrect;

                    let borderCol = 'var(--border-color)';
                    let bgCol = 'rgba(255, 255, 255, 0.01)';
                    if (showCorrect) {
                      borderCol = 'var(--color-emerald)';
                      bgCol = 'rgba(16, 185, 129, 0.05)';
                    } else if (showIncorrect) {
                      borderCol = 'var(--color-rose)';
                      bgCol = 'rgba(244, 63, 94, 0.05)';
                    } else if (isSelected) {
                      borderCol = 'var(--color-amber)';
                    }

                    return (
                      <button
                        key={idx}
                        onClick={() => handleStep2Answer(option, idx)}
                        disabled={isStep2Solved}
                        className="btn"
                        style={{
                          textAlign: 'left',
                          padding: '16px',
                          borderRadius: '12px',
                          border: `1px solid ${borderCol}`,
                          background: bgCol,
                          color: 'var(--text-primary)',
                          fontSize: '13.5px',
                          lineHeight: '1.5',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          cursor: isStep2Solved ? 'default' : 'pointer'
                        }}
                      >
                        <span>{option.text}</span>
                        {showCorrect && <CheckCircle2 size={18} color="var(--color-emerald)" />}
                        {showIncorrect && <XCircle size={18} color="var(--color-rose)" />}
                      </button>
                    );
                  })}
                </div>

                {hasRetriedStep2 && !isStep2Solved && (
                  <div style={{
                    padding: '12px 16px',
                    borderRadius: '12px',
                    background: 'rgba(244, 63, 94, 0.05)',
                    border: '1px solid rgba(244, 63, 94, 0.15)',
                    color: 'var(--color-rose)',
                    fontSize: '12.5px',
                    textAlign: 'left',
                    marginBottom: '20px'
                  }}>
                    💡 ヒント：対処療法（単なる支払先延ばしや時間引き伸ばし）ではなく、悪循環に「物理的な制限」や「根本のバッファ」を加える選択肢を選びましょう。
                  </div>
                )}

                {isStep2Solved && (
                  <div className="fade-in">
                    {/* Patch output explanation */}
                    <div style={{
                      padding: '16px',
                      borderRadius: '12px',
                      background: isStep2Correct ? 'rgba(16, 185, 129, 0.05)' : 'rgba(244, 63, 94, 0.05)',
                      border: isStep2Correct ? '1px solid rgba(16, 185, 129, 0.15)' : '1px solid rgba(244, 63, 94, 0.15)',
                      color: 'var(--text-secondary)',
                      fontSize: '13px',
                      textAlign: 'left',
                      lineHeight: '1.6',
                      marginBottom: '20px'
                    }}>
                      <span style={{ fontWeight: 'bold', color: isStep2Correct ? 'var(--color-emerald)' : 'var(--color-rose)', display: 'block', marginBottom: '4px' }}>
                        {isStep2Correct ? '🎉 パッチ適用成功の解説：' : '⚠️ パッチ適用失敗（正解の介入策）：'}
                      </span>
                      {currentQ.explanation}
                    </div>

                    <button
                      onClick={handleNext}
                      className="btn btn-primary"
                      style={{
                        width: '100%',
                        padding: '14px',
                        background: 'linear-gradient(135deg, var(--color-amber) 0%, #d97706 100%)',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      {currentIdx < questions.length - 1 ? '次のループへ' : '結果を見る'}
                      <ArrowRight size={16} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
