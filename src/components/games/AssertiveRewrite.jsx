import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, ArrowRight, RotateCcw, Volume2, VolumeX, Sparkles, MessageSquare, Undo2 } from 'lucide-react';
import RakutenWidget from '../common/RakutenWidget';

const SCENARIOS = {
  daily: [
    {
      id: 'daily_1',
      title: '友人からのドタキャンへの返答',
      originalText: '「またドタキャン？本当に信じられない。私の時間を何だと思ってるの？最低。」',
      correctType: 'aggressive', // aggressive, passive
      typeExplanation: '相手の行動に対する怒りをむき出しにし、相手の人格そのものを攻撃（「最低」など）する典型的な攻撃的（Aggressive）コミュニケーションです。これでは相手は防衛的になり、関係修復が難しくなります。',
      descBlocks: [
        { key: 'D', role: 'D (事実の客観的描写)', text: '「今月に入って、急な予定キャンセルがこれで3回目だね。」' },
        { key: 'E', role: 'E (感情・意見の表現)', text: '「準備をして楽しみに待っていたから、直前に断られて悲しい気持ちになったよ。」' },
        { key: 'S', role: 'S (具体的な提案・代案)', text: '「もし忙しいなら、来週の土曜日に時間を少し短縮して会うのはどうかな？」' },
        { key: 'C', role: 'C (合意による好結果の予測)', text: '「それならお互い無理なく喋れるし、私も予定が調整しやすくて助かるな。」' }
      ]
    },
    {
      id: 'daily_2',
      title: '家族への家事分担の不満',
      originalText: '「どうせ私だけが動けばいいんでしょ。いいよ、全部私がやっておくから。心配しないで。」',
      correctType: 'passive',
      typeExplanation: '自分の「しんどい」という本音を隠し、皮肉を言いつつ自己犠牲を引き受ける受動的・非主張的（Passive）コミュニケーションです。不満が内面に蓄積し、いつか爆発する原因になります。',
      descBlocks: [
        { key: 'D', role: 'D (事実の客観的描写)', text: '「最近、私が夕食の準備と皿洗いを一人で毎日担当しているね。」' },
        { key: 'E', role: 'E (感情・意見の表現)', text: '「仕事の後なので、一人で両方をこなすと体力的に少ししんどいなと感じているの。」' },
        { key: 'S', role: 'S (具体的な提案・代案)', text: '「もしよかったら、私が料理をする日に、お皿洗いか片付けを手伝ってくれない？」' },
        { key: 'C', role: 'C (合意による好結果の予測)', text: '「分担できれば早く終わるし、夜に二人でのんびり話す時間も増やせると思うんだ。」' }
      ]
    },
    {
      id: 'daily_3',
      title: 'しつこいセールスへのお断り',
      originalText: '「（もう諦めて）あ…じゃあ、説明だけでも聞きます…少しならいいです…」',
      correctType: 'passive',
      typeExplanation: '相手の強引さに負け、自分の本音（断りたい）を表明せずに要求を受け入れてしまう受動的（Passive）コミュニケーションです。相手に「押し切れば買わせられる」という誤ったシグナルを送ってしまいます。',
      descBlocks: [
        { key: 'D', role: 'D (事実の客観的描写)', text: '「本日ご提案いただいた製品ですが、私の現在の予算とニーズには合っていません。」' },
        { key: 'E', role: 'E (感情・意見の表現)', text: '「せっかくお時間を割いていただきましたが、今回はお引き受けできません。」' },
        { key: 'S', role: 'S (具体的な提案・代案)', text: '「ですので、今後の追加のご案内や資料送付は辞退させてください。」' },
        { key: 'C', role: 'C (合意による好結果の予測)', text: '「また将来必要になる機会があれば、こちらから改めて連絡させていただきます。」' }
      ]
    }
  ],
  business: [
    {
      id: 'business_1',
      title: '部下への提出期限遅れの指導',
      originalText: '「何回言ったら期限を守れるんだ！やる気がないならプロジェクトから外れてもらうぞ！」',
      correctType: 'aggressive',
      typeExplanation: '怒りの感情に任せて威圧し、相手を脅迫する攻撃的（Aggressive）コミュニケーションです。相手は恐怖心から萎縮し、ミスの報告を隠すなどの二次被害が生じやすくなります。',
      descBlocks: [
        { key: 'D', role: 'D (事実の客観的描写)', text: '「今回の報告書の提出が、当初約束していた期限から3時間遅れているようです。」' },
        { key: 'E', role: 'E (感情・意見の表現)', text: '「事前の遅延連絡がなかったので、他のメンバーの工程への影響を懸念していました。」' },
        { key: 'S', role: 'S (具体的な提案・代案)', text: '「今後は遅れそうな時点で、期限の2時間前までにチャットで状況を共有してもらえますか？」' },
        { key: 'C', role: 'C (合意による好結果の予測)', text: '「そうすれば事前に人員の調整ができ、プロジェクト全体の遅延を防ぐことができます。」' }
      ]
    },
    {
      id: 'business_2',
      title: '顧客からの無理な急ぎ仕様追加',
      originalText: '「分かりました…ご要望ですので何とか週末返上で作ります…大丈夫です。」',
      correctType: 'passive',
      typeExplanation: 'リソースの物理的な不可能性を伝えず、何でも引き受けてしまう受動的（Passive）な対応です。結果として過労や製品品質の致命的低下を招き、顧客側にも迷惑がかかるリスクを放置しています。',
      descBlocks: [
        { key: 'D', role: 'D (事実の客観的描写)', text: '「今回追加でご要望いただいた仕様変更は、現在の開発スケジュール枠外のものです。」' },
        { key: 'E', role: 'E (感情・意見の表現)', text: '「今から追加するとリリース日に間に合わないリスクがあり、品質の保証が困難になります。」' },
        { key: 'S', role: 'S (具体的な提案・代案)', text: '「今回は当初の予定通り公開し、この新仕様はフェーズ2で対応させていただけませんか？」' },
        { key: 'C', role: 'C (合意による好結果の予測)', text: '「そうしていただければ、現行機能のテストを完全に行い、安全に予定日に納品できます。」' }
      ]
    },
    {
      id: 'business_3',
      title: '直前すぎる仕事の依頼へのお断り',
      originalText: '「私の仕事を舐めてるんですか？こんな直前に振られてもできるわけないでしょう！」',
      correctType: 'aggressive',
      typeExplanation: '依頼のタイミングの悪さに対して被害者意識を持ち、相手を非難する攻撃的（Aggressive）コミュニケーションです。業務上の正当な主張であっても、言葉が敵対的になると協力を得られなくなります。',
      descBlocks: [
        { key: 'D', role: 'D (事実の客観的描写)', text: '「本日17時にご依頼いただいた資料作成ですが、現在別の緊急タスクを抱えています。」' },
        { key: 'E', role: 'E (感情・意見の表現)', text: '「今日の退勤時間（18時）までに、両方を高品質で完了させることは物理的に困難です。」' },
        { key: 'S', role: 'S (具体的な提案・代案)', text: '「もしよろしければ、明日の午前11時までの提出期限に変更していただけないでしょうか？」' },
        { key: 'C', role: 'C (合意による好結果の予測)', text: '「それならば、現在進行中の仕事にも悪影響を出さず、正確な資料を作成してお渡しできます。」' }
      ]
    }
  ]
};

const shuffleArray = (array) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

export default function AssertiveRewrite({ onFinish, playSound, muted, toggleMute, mode, onLogBug, reviewQuestionId, onFinishReview }) {
  const [showTutorial, setShowTutorial] = useState(!reviewQuestionId);
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [step, setStep] = useState(1); // 1: Analyze original bug, 2: Assemble DESC
  const [selectedType, setSelectedType] = useState(null);
  const [isStep1Solved, setIsStep1Solved] = useState(false);
  const [isStep1ForceSolved, setIsStep1ForceSolved] = useState(false);
  const [hasRetriedStep1, setHasRetriedStep1] = useState(false);

  // DESC Assembly States
  const [shuffledBlocks, setShuffledBlocks] = useState([]);
  const [assembledKeys, setAssembledKeys] = useState([]); // ['D', 'E', 'S', 'C'] in order of click
  const [isStep2Solved, setIsStep2Solved] = useState(false);
  const [isStep2ForceSolved, setIsStep2ForceSolved] = useState(false);
  const [hasRetriedStep2, setHasRetriedStep2] = useState(false);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);

  // Meters for UI (0 to 100)
  const [meters, setMeters] = useState({ aggressive: 30, passive: 30, assertive: 10 });

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
    setSelectedType(null);
    setIsStep1Solved(false);
    setIsStep1ForceSolved(false);
    setHasRetriedStep1(false);
    setAssembledKeys([]);
    setIsStep2Solved(false);
    setIsStep2ForceSolved(false);
    setHasRetriedStep2(false);
    setScore(0);
    setCompleted(false);
  };

  useEffect(() => {
    initializeQuestions();
  }, [mode]);

  useEffect(() => {
    if (questions.length > 0 && !completed) {
      const q = questions[currentIdx];
      // Shuffle the 4 DESC blocks
      setShuffledBlocks(shuffleArray(q.descBlocks));

      // Reset meters based on initial state
      if (q.correctType === 'aggressive') {
        setMeters({ aggressive: 85, passive: 5, assertive: 10 });
      } else {
        setMeters({ aggressive: 5, passive: 85, assertive: 10 });
      }
    }
  }, [currentIdx, questions, completed]);

  if (questions.length === 0) return null;

  const currentQ = questions[currentIdx];

  const handleStep1Answer = (type) => {
    if (isStep1Solved) return;
    playSound('click');
    setSelectedType(type);

    const isCorrect = type === currentQ.correctType;
    if (isCorrect) {
      setIsStep1Solved(true);
      playSound('correct');
      if (!hasRetriedStep1) {
        setScore(prev => prev + 0.5);
      } else {
        setScore(prev => prev + 0.25);
      }
      // Update meters to reflect identification
      setMeters(prev => ({
        ...prev,
        [type]: 40,
        assertive: 50
      }));
    } else {
      if (!hasRetriedStep1) {
        setHasRetriedStep1(true);
        playSound('incorrect');
      } else {
        setIsStep1Solved(true);
        setIsStep1ForceSolved(true);
        setSelectedType(currentQ.correctType); // Highlight correct type
        playSound('incorrect');
        if (onLogBug && !reviewQuestionId) {
          onLogBug('assertiveRewrite', currentQ.id, `Step 1の誤回答: 選択したタイプは正しくありません (正解: ${currentQ.correctType === 'aggressive' ? '攻撃的' : '受動的'})`, currentQ.originalText);
        }
      }
    }
  };

  const handleGoToStep2 = () => {
    playSound('click');
    setStep(2);
    setAssembledKeys([]);
    setSelectedType(null);
    setMeters(prev => ({ ...prev, assertive: 30 }));
  };

  const handleBlockClick = (key) => {
    if (isStep2Solved || assembledKeys.includes(key)) return;
    playSound('click');
    
    const newAssembled = [...assembledKeys, key];
    setAssembledKeys(newAssembled);

    // Dynamic assertive meter animation based on correct assembly sequence
    const expectedSequence = ['D', 'E', 'S', 'C'];
    const currentCorrectCount = newAssembled.filter((k, idx) => k === expectedSequence[idx]).length;
    setMeters(prev => ({
      ...prev,
      assertive: Math.max(prev.assertive, 30 + currentCorrectCount * 15),
      aggressive: Math.max(0, prev.aggressive - 20),
      passive: Math.max(0, prev.passive - 20)
    }));

    if (newAssembled.length === 4) {
      // Check sequence correctness
      const isSequenceCorrect = newAssembled.every((k, idx) => k === expectedSequence[idx]);
      if (isSequenceCorrect) {
        setIsStep2Solved(true);
        playSound('correct');
        setMeters({ aggressive: 0, passive: 0, assertive: 100 });
        if (!hasRetriedStep2) {
          setScore(prev => prev + 0.5);
        } else {
          setScore(prev => prev + 0.25);
        }
      } else {
        if (!hasRetriedStep2) {
          setHasRetriedStep2(true);
          playSound('incorrect');
          // Reset assembled keys to let them try again
          setTimeout(() => {
            setAssembledKeys([]);
            setMeters(prev => ({ ...prev, assertive: 30 }));
          }, 1200);
        } else {
          // Force solved even on 2nd fail but show correct order
          setIsStep2Solved(true);
          setIsStep2ForceSolved(true);
          playSound('incorrect');
          setAssembledKeys(['D', 'E', 'S', 'C']);
          setMeters({ aggressive: 0, passive: 0, assertive: 100 });
          if (onLogBug && !reviewQuestionId) {
            onLogBug('assertiveRewrite', currentQ.id, `Step 2の誤回答: DESCブロックの組み立て順序が違います。`, currentQ.originalText);
          }
        }
      }
    }
  };

  const handleUndoBlock = () => {
    if (isStep2Solved || assembledKeys.length === 0) return;
    playSound('click');
    setAssembledKeys(prev => prev.slice(0, -1));
  };

  const handleNext = () => {
    playSound('click');
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(prev => prev + 1);
      setStep(1);
      setSelectedType(null);
      setIsStep1Solved(false);
      setIsStep1ForceSolved(false);
      setHasRetriedStep1(false);
      setAssembledKeys([]);
      setIsStep2Solved(false);
      setIsStep2ForceSolved(false);
      setHasRetriedStep2(false);
    } else {
      setCompleted(true);
      if (reviewQuestionId && onFinishReview) {
        onFinishReview('assertiveRewrite', reviewQuestionId);
      } else {
        const finalScore = Math.round((score / questions.length) * 100);
        onFinish('assertiveRewrite', finalScore, false);
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
            <span style={{ color: 'var(--color-primary)', fontWeight: 'bold', fontSize: '14px', letterSpacing: '1px' }}>
              TRAINING MODULE 05 [2nd]
            </span>
            <h2 style={{ fontFamily: 'var(--font-display)', marginTop: '4px' }}>アサーティブ・リライター</h2>
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
              <div className="score-badge" style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}>
                対話: {currentIdx + 1} / {questions.length}
              </div>
            )}
          </div>
        </div>

        {showTutorial ? (
          /* Tutorial Screen */
          <div style={{ textAlign: 'left' }} className="fade-in">
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={20} /> 30秒解説：アサーティブ・リライトとは？
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '20px' }}>
              感情的に相手をねじ伏せる「攻撃的（アグレッシブ）」な話し方や、逆に本音を我慢して自分を抑え込む「受動的（パッシブ）」な話し方は、いずれも対話を破綻させます。<br />
              自分と相手を共に対等に尊重し、誠実に意見を交わす姿勢を<strong>アサーティブ（Assertive）</strong>と呼びます。これを作る強力なフレームワークが<strong>「DESC法」</strong>です。
            </p>
            <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(139, 92, 246, 0.05)', border: '1px solid rgba(139, 92, 246, 0.15)', marginBottom: '24px' }}>
              <span style={{ fontWeight: 'bold', color: 'var(--color-primary)', fontSize: '14px' }}>💬 DESC法の構成要素：</span>
              <ul style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px', paddingLeft: '20px', lineHeight: '1.8' }}>
                <li><strong>D (Describe)</strong>：状況や客観的な事実のみをありのままに描写する。</li>
                <li><strong>E (Express)</strong>：それに対する自分の主観的な気持ちや意見を伝える。</li>
                <li><strong>S (Suggest)</strong>：具体的な代案や、現実的で妥当な妥協案を提案する。</li>
                <li><strong>C (Consequence)</strong>：提案を協力して実行した際の良い結果を予測する。</li>
              </ul>
            </div>
            <button 
              onClick={() => setShowTutorial(false)}
              className="btn btn-primary"
              style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg, var(--color-primary) 0%, #7c3aed 100%)', border: 'none', boxShadow: '0 4px 15px var(--color-primary-glow)' }}
            >
              トレーニングを開始する
            </button>
          </div>
        ) : completed ? (
          /* Completion Screen */
          <div style={{ textAlign: 'center', padding: '40px 0' }} className="fade-in">
            <div style={{ display: 'inline-flex', background: 'rgba(139, 92, 246, 0.1)', padding: '20px', borderRadius: '50%', marginBottom: '24px' }}>
              <CheckCircle2 size={64} color="var(--color-primary)" />
            </div>
            <h3 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '8px' }}>トレーニング完了！</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' }}>
              攻撃性や受動性を脱却し、DESC法でアサーティブに主張を組み立てる表現力が身につきました。
            </p>
            <div style={{ background: 'var(--bg-inner-box)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '24px', maxWidth: '320px', margin: '0 auto 32px' }}>
              <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>スコア</span>
              <div style={{ fontSize: '48px', fontWeight: '800', color: 'var(--color-primary)', fontFamily: 'var(--font-display)', margin: '8px 0' }}>
                {Math.round((score / questions.length) * 100)}%
              </div>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                獲得XP: +{Math.round((score / questions.length) * 100) * 10} XP
              </span>
            </div>

            <RakutenWidget />

            <button 
              onClick={() => {
                if (reviewQuestionId && onFinishReview) {
                  onFinishReview('assertiveRewrite', reviewQuestionId);
                } else {
                  onFinish('assertiveRewrite', Math.round((score / questions.length) * 100), true);
                }
              }}
              className="btn btn-primary"
              style={{ width: '100%', maxWidth: '320px', padding: '14px', background: 'linear-gradient(135deg, var(--color-primary) 0%, #7c3aed 100%)', border: 'none' }}
            >
              ← ダッシュボードに戻る
            </button>
          </div>
        ) : (
          /* Game Screens */
          <div>
            {/* Tone Meters Panel */}
            <div style={{
              background: 'var(--bg-inner-box)',
              border: '1px solid var(--border-color)',
              borderRadius: '20px',
              padding: '16px 20px',
              marginBottom: '24px',
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-around',
              gap: '12px',
              alignItems: 'center'
            }}>
              {/* Aggressive Meter */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '11px', color: 'var(--color-rose)', fontWeight: 'bold' }}>攻撃的 (Aggressive)</span>
                <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${meters.aggressive}%`, background: 'var(--color-rose)', transition: 'width 0.4s' }} />
                </div>
              </div>
              {/* Passive Meter */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '11px', color: 'var(--color-cyan)', fontWeight: 'bold' }}>受動的 (Passive)</span>
                <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${meters.passive}%`, background: 'var(--color-cyan)', transition: 'width 0.4s' }} />
                </div>
              </div>
              {/* Assertive Meter */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '11px', color: 'var(--color-primary)', fontWeight: 'bold' }}>対等・協調 (Assertive)</span>
                <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${meters.assertive}%`, background: 'var(--color-primary)', transition: 'width 0.4s' }} />
                </div>
              </div>
            </div>

            {/* Step 1: Identify original communication bug */}
            {step === 1 && (
              <div className="fade-in">
                <div style={{ background: 'var(--bg-inner-box)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '20px', marginBottom: '24px', textAlign: 'left' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '4px' }}>
                    {currentQ.title}（バグ下書き）
                  </span>
                  <p style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--text-primary)', marginTop: '12px', lineHeight: '1.6', fontStyle: 'italic' }}>
                    {currentQ.originalText}
                  </p>
                </div>

                <h4 style={{ fontSize: '14.5px', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '16px', textAlign: 'left' }}>
                  ❓ この表現に潜むコミュニケーションの「バグの性質」はどれ？
                </h4>

                <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
                  <button
                    onClick={() => handleStep1Answer('aggressive')}
                    disabled={isStep1Solved}
                    className="btn"
                    style={{
                      flex: 1,
                      padding: '20px',
                      borderRadius: '16px',
                      border: `1px solid ${selectedType === 'aggressive' ? (isStep1Solved && currentQ.correctType === 'aggressive' ? 'var(--color-emerald)' : 'var(--color-rose)') : 'var(--border-color)'}`,
                      background: selectedType === 'aggressive' ? (isStep1Solved && currentQ.correctType === 'aggressive' ? 'rgba(16, 185, 129, 0.05)' : 'rgba(244, 63, 94, 0.05)') : 'rgba(255,255,255,0.01)',
                      color: 'var(--text-primary)',
                      cursor: isStep1Solved ? 'default' : 'pointer'
                    }}
                  >
                    <span style={{ display: 'block', fontSize: '16px', fontWeight: 'bold', color: 'var(--color-rose)', marginBottom: '6px' }}>💥 攻撃的 (Aggressive)</span>
                    <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>相手への非難、命令、勝ち負けを重視する態度</span>
                  </button>

                  <button
                    onClick={() => handleStep1Answer('passive')}
                    disabled={isStep1Solved}
                    className="btn"
                    style={{
                      flex: 1,
                      padding: '20px',
                      borderRadius: '16px',
                      border: `1px solid ${selectedType === 'passive' ? (isStep1Solved && currentQ.correctType === 'passive' ? 'var(--color-emerald)' : 'var(--color-rose)') : 'var(--border-color)'}`,
                      background: selectedType === 'passive' ? (isStep1Solved && currentQ.correctType === 'passive' ? 'rgba(16, 185, 129, 0.05)' : 'rgba(244, 63, 94, 0.05)') : 'rgba(255,255,255,0.01)',
                      color: 'var(--text-primary)',
                      cursor: isStep1Solved ? 'default' : 'pointer'
                    }}
                  >
                    <span style={{ display: 'block', fontSize: '16px', fontWeight: 'bold', color: 'var(--color-cyan)', marginBottom: '6px' }}>🛡 受動的 (Passive)</span>
                    <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>自分の本音の我慢、皮肉、自己犠牲的な引き受け</span>
                  </button>
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
                    💡 ヒント：元の発言が「相手を頭ごなしに責めている（最低！何回言ったら！）」なら攻撃的、「自分の本心を押し殺して皮肉や無理な同意をしている（どうせ私が、大丈夫です…）」なら受動的です。
                  </div>
                )}

                {isStep1Solved && (
                  <div className="fade-in">
                    <div style={{
                      padding: '16px',
                      borderRadius: '12px',
                      background: isStep1ForceSolved ? 'rgba(244, 63, 94, 0.05)' : 'rgba(255,255,255,0.03)',
                      border: isStep1ForceSolved ? '1px solid rgba(244, 63, 94, 0.15)' : '1px solid var(--border-color)',
                      color: 'var(--text-secondary)',
                      fontSize: '13px',
                      textAlign: 'left',
                      lineHeight: '1.6',
                      marginBottom: '20px'
                    }}>
                      <span style={{ fontWeight: 'bold', color: isStep1ForceSolved ? 'var(--color-rose)' : 'var(--color-primary)', display: 'block', marginBottom: '4px' }}>
                        {isStep1ForceSolved ? '⚠️ バグの診断（正解の表示）：' : '💡 バグの診断：'}
                      </span>
                      {currentQ.typeExplanation}
                    </div>

                    <button
                      onClick={handleGoToStep2}
                      className="btn btn-primary"
                      style={{
                        width: '100%',
                        padding: '14px',
                        background: 'linear-gradient(135deg, var(--color-primary) 0%, #7c3aed 100%)',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      アサーティブ表現（DESC法）へのコンパイルへ
                      <ArrowRight size={16} />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: DESC Block Assembly */}
            {step === 2 && (
              <div className="fade-in">
                {/* Bug draft display */}
                <div style={{
                  background: 'var(--bg-inner-box)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '16px',
                  padding: '12px 16px',
                  marginBottom: '20px',
                  textAlign: 'left',
                  fontSize: '12.5px',
                  color: 'var(--text-muted)'
                }}>
                  元テキスト（バグあり）: <span style={{ textDecoration: 'line-through' }}>{currentQ.originalText}</span>
                </div>

                {/* Compilation Output Area */}
                <div style={{
                  background: 'rgba(255,255,255,0.01)',
                  border: isStep2ForceSolved ? '2px solid var(--color-primary)' : (isStep2Solved ? '2px solid var(--color-emerald)' : '1px dashed var(--color-primary)'),
                  borderRadius: '16px',
                  padding: '20px',
                  marginBottom: '24px',
                  textAlign: 'left',
                  minHeight: '160px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  position: 'relative'
                }}>
                  <div style={{ position: 'absolute', top: '8px', right: '8px', fontSize: '11px', color: 'var(--color-primary)', fontWeight: 'bold' }}>
                    DESCコンパイラー出力
                  </div>

                  {assembledKeys.length === 0 ? (
                    <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', margin: 'auto', fontSize: '13px' }}>
                      下のパーツを選択して、D ➡ E ➡ S ➡ C の順に文章を組み立ててください
                    </span>
                  ) : (
                    assembledKeys.map((key, idx) => {
                      const block = currentQ.descBlocks.find(b => b.key === key);
                      const expectedKey = ['D', 'E', 'S', 'C'][idx];
                      const isCorrectSlot = key === expectedKey;

                      let textCol = 'var(--text-primary)';
                      let badgeBg = 'rgba(139, 92, 246, 0.1)';
                      let badgeText = 'var(--color-primary)';
                      if (isStep2ForceSolved) {
                        badgeBg = 'rgba(139, 92, 246, 0.15)';
                        badgeText = 'var(--color-primary)';
                      } else if (isStep2Solved) {
                        badgeBg = 'rgba(16, 185, 129, 0.1)';
                        badgeText = 'var(--color-emerald)';
                      } else if (!isCorrectSlot && assembledKeys.length === 4) {
                        badgeBg = 'rgba(244, 63, 94, 0.1)';
                        badgeText = 'var(--color-rose)';
                      }

                      return (
                        <div 
                          key={key} 
                          className="fade-in"
                          style={{
                            display: 'flex', 
                            gap: '12px', 
                            alignItems: 'flex-start',
                            padding: '6px 8px',
                            background: 'rgba(255,255,255,0.02)',
                            borderRadius: '8px'
                          }}
                        >
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            background: badgeBg,
                            color: badgeText,
                            whiteSpace: 'nowrap',
                            marginTop: '2px'
                          }}>
                            {block.role}
                          </span>
                          <span style={{ fontSize: '13px', color: textCol }}>{block.text}</span>
                        </div>
                      );
                    })
                  )}

                  {/* Undo Button */}
                  {assembledKeys.length > 0 && !isStep2Solved && (
                    <button
                      onClick={handleUndoBlock}
                      style={{
                        position: 'absolute',
                        bottom: '8px',
                        right: '8px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: 'none',
                        color: 'var(--text-muted)',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        transition: 'background 0.2s'
                      }}
                    >
                      <Undo2 size={12} />
                      1つ戻す
                    </button>
                  )}
                </div>

                {/* Assembly Source Blocks */}
                {!isStep2Solved && (
                  <div className="fade-in" style={{ textAlign: 'left' }}>
                    <h5 style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px', fontWeight: 'bold' }}>
                      パーツ一覧（クリックで追加）
                    </h5>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
                      {shuffledBlocks.map((block) => {
                        const isChosen = assembledKeys.includes(block.key);
                        return (
                          <button
                            key={block.key}
                            onClick={() => handleBlockClick(block.key)}
                            disabled={isChosen}
                            className="btn"
                            style={{
                              textAlign: 'left',
                              padding: '12px 16px',
                              borderRadius: '12px',
                              border: '1px solid var(--border-color)',
                              background: isChosen ? 'rgba(255,255,255,0.01)' : 'var(--bg-inner-box)',
                              color: isChosen ? 'var(--text-muted)' : 'var(--text-primary)',
                              fontSize: '13px',
                              lineHeight: '1.4',
                              opacity: isChosen ? 0.3 : 1,
                              cursor: isChosen ? 'default' : 'pointer',
                              transition: 'all 0.2s'
                            }}
                          >
                            {block.text}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

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
                    💡 ヒント：D（客観的な出来事・事実）➡ E（それによる自分の感情）➡ S（妥協案・解決策の提案）➡ C（合意による肯定的な未来の予測）の順に並べます。
                  </div>
                )}

                {isStep2Solved && (
                  <div className="fade-in">
                    <div style={{
                      padding: '16px',
                      borderRadius: '12px',
                      background: isStep2ForceSolved ? 'rgba(244, 63, 94, 0.05)' : 'rgba(16, 185, 129, 0.05)',
                      border: isStep2ForceSolved ? '1px solid rgba(244, 63, 94, 0.15)' : '1px solid rgba(16, 185, 129, 0.15)',
                      color: 'var(--text-secondary)',
                      fontSize: '13px',
                      textAlign: 'left',
                      lineHeight: '1.6',
                      marginBottom: '20px'
                    }}>
                      <span style={{ fontWeight: 'bold', color: isStep2ForceSolved ? 'var(--color-rose)' : 'var(--color-emerald)', display: 'block', marginBottom: '4px' }}>
                        {isStep2ForceSolved ? '⚠️ アサーティブ表現の正解例（デバッグ失敗）：' : '🎉 アサーティブ表現の完成！'}
                      </span>
                      客観的な事実（D）を伝え、自分の本音（E）を優しく明示し、相手への代替案（S）を提示して、協力した際の効果（C）を語ることで、相手に敵対心を与えずに要求を誠実に通すことができます。
                    </div>

                    <button
                      onClick={handleNext}
                      className="btn btn-primary"
                      style={{
                        width: '100%',
                        padding: '14px',
                        background: 'linear-gradient(135deg, var(--color-primary) 0%, #7c3aed 100%)',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      {currentIdx < questions.length - 1 ? '次の対話へ' : '結果を見る'}
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
