import React, { useState, useEffect } from 'react';
import { logicalValidityDaily, logicalValidityBusiness } from '../../data/questions';
import { CheckCircle2, XCircle, ArrowRight, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import RakutenWidget from '../common/RakutenWidget';

const shuffleArray = (array) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

export default function LogicalValidity({ onFinish, playSound, muted, toggleMute, mode, onLogBug, reviewQuestionId, onFinishReview }) {
  const [showTutorial, setShowTutorial] = useState(true);
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null); // true for Valid, false for Invalid
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [hasRetried, setHasRetried] = useState(false);

  const initializeQuestions = () => {
    const rawData = mode === 'business' ? logicalValidityBusiness : logicalValidityDaily;
    let finalized = [];
    if (reviewQuestionId) {
      const found = logicalValidityDaily.find(q => q.id === reviewQuestionId) || 
                    logicalValidityBusiness.find(q => q.id === reviewQuestionId);
      if (found) {
        finalized = [found];
        setShowTutorial(false);
      }
    }
    if (finalized.length === 0) {
      finalized = shuffleArray(rawData).slice(0, 5);
    }
    setQuestions(finalized);
    setCurrentIdx(0);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setScore(0);
    setCompleted(false);
    setHasRetried(false);
  };

  useEffect(() => {
    initializeQuestions();
  }, [mode]);

  if (questions.length === 0) {
    return null;
  }

  const currentQuestion = questions[currentIdx];

  const getMiniHint = () => {
    if (currentQuestion.isValid) {
      return "💡 ヒント: 「すべてのAはBである」「CはAである」から「CはBである」のように、前提がすべて正しいと仮定したとき、結論が『論理のルール』として100%絶対に正しくなる構造（または対偶などの正しい変形）になっていませんか？";
    } else {
      return "💡 ヒント: 前提が正しくても、結論に飛躍（「～とは限らない」別の原因がある可能性、前件否定・後件肯定などの勘違い）がありませんか？「もし～なら絶対に…と言えるか？」を疑ってみましょう。";
    }
  };

  const handleAnswer = (answer) => {
    if (isAnswered) return;
    playSound('click');
    setSelectedAnswer(answer);

    const isCorrect = answer === currentQuestion.isValid;
    if (isCorrect) {
      if (!hasRetried) {
        setScore(prev => prev + 1);
      } else {
        setScore(prev => prev + 0.5);
      }
      setIsAnswered(true);
      playSound('correct');
    } else {
      if (!hasRetried) {
        setHasRetried(true);
        playSound('incorrect');
      } else {
        setIsAnswered(true);
        playSound('incorrect');
        if (onLogBug && !reviewQuestionId) {
          onLogBug('logicalValidity', currentQuestion.id, `あなたの選択: ${answer ? '妥当' : '非妥当'} (正解: ${currentQuestion.isValid ? '妥当' : '非妥当'})`, currentQuestion.premise1 + ' ' + currentQuestion.premise2 + ' ' + currentQuestion.conclusion);
        }
      }
    }
  };

  const handleNext = () => {
    playSound('click');
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(prev => prev + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
      setHasRetried(false);
    } else {
      setCompleted(true);
      if (reviewQuestionId && onFinishReview) {
        onFinishReview('logicalValidity', reviewQuestionId);
      } else {
        const finalScore = Math.round((score / questions.length) * 100);
        onFinish('logicalValidity', finalScore, false);
        playSound('success');
      }
    }
  };

  const handleReset = () => {
    playSound('click');
    initializeQuestions();
    setShowTutorial(true);
  };

  const startTraining = () => {
    playSound('click');
    setShowTutorial(false);
  };

  return (
    <div className="game-container fade-in">
      <div className="glass-panel" style={{ padding: '24px', position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <span style={{ color: 'var(--color-emerald)', fontWeight: 'bold', fontSize: '14px', letterSpacing: '1px' }}>
              TRAINING MODULE 02
            </span>
            <h2 style={{ fontFamily: 'var(--font-display)', marginTop: '4px' }}>論理の妥当性 (Logical Validity)</h2>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button 
              onClick={toggleMute}
              className="btn btn-secondary" 
              style={{ padding: '8px', borderRadius: '50%' }}
              title={muted ? "消音解除" : "消音"}
            >
              {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            {!showTutorial && !completed && (
              <div className="score-badge" style={{ borderColor: 'var(--color-emerald)' }}>
                進捗: {currentIdx + 1} / {questions.length}
              </div>
            )}
          </div>
        </div>

        {showTutorial ? (
          <div style={{ textAlign: 'left' }} className="fade-in">
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', color: 'var(--color-emerald)' }}>
              📖 30秒でわかる基本のき：論理的に正しい（妥当）とは？
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
              <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
                <strong style={{ color: 'var(--color-emerald)', fontSize: '15px' }}>📌 論理が 妥当 (Valid) とは？</strong>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '6px', lineHeight: '1.5' }}>
                  前提がすべて正しいなら、結論も<strong>「論理のルール上、絶対に正しくなる」</strong>状態です。<br />
                  例：{mode === 'business'
                    ? '「すべての優良企業は法令遵守する」＋「A社は優良企業だ」➡「A社は法令遵守する」'
                    : '「人間は必ず酸素を必要とする」＋「ソクラテスは人間だ」➡「ソクラテスは酸素を必要とする」'}
                </p>
              </div>

              <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)' }}>
                <strong style={{ color: 'var(--text-primary)', fontSize: '15px' }}>📌 論理が 非妥当 (Invalid) とは？</strong>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '6px', lineHeight: '1.5' }}>
                  前提が正しくても、結論に<strong>「論理の飛躍や勘違い（誤謬）」</strong>がある状態です。<br />
                  例：{mode === 'business'
                    ? '「値下げをすると販売個数が増える」＋「今、販売個数が増えている」➡「値下げをした」（※バズるなど別の要因の可能性あり）'
                    : '「雨が降ると地面が濡れる」＋「今、地面が濡れている」➡「雨が降った」（※水を撒いたなど別の要因の可能性あり）'}
                </p>
              </div>

              <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.01)', borderLeft: '3px solid var(--color-emerald)' }}>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                  💡 前提の内容が現実的かどうかではなく、**「推論の形が崩れていないか」**をチェックします。よくある論理の落とし穴を見極める力を育てましょう！
                </p>
              </div>
            </div>

            <button onClick={startTraining} className="btn btn-primary" style={{ width: '100%', background: 'linear-gradient(135deg, var(--color-emerald) 0%, #059669 100%)', boxShadow: '0 4px 15px var(--color-emerald-glow)' }}>
              理解した！トレーニングを開始する
            </button>
          </div>
        ) : !completed ? (
          <div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '15px' }}>
              提示される前提から導き出される結論が、論理のルールに照らし合わせて**「妥当（常に正しい）」**か、あるいは**「非妥当（誤り・飛躍がある）」**かを判定してください。（※前提自体が現実的であるかどうかではなく、論理の構成が正しいかを判断します）
            </p>

            <div 
              style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '12px',
                marginBottom: '32px'
              }}
            >
              <div 
                className="glass-panel" 
                style={{ 
                  padding: '16px 20px', 
                  backgroundColor: 'var(--bg-quiz-statement)',
                  border: '1px solid var(--bg-quiz-statement-border)',
                  borderLeft: '4px solid var(--text-muted)'
                }}
              >
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 'bold', marginBottom: '4px' }}>前提 1</div>
                <div style={{ fontSize: '16px', fontWeight: '500' }}>{currentQuestion.premise1}</div>
              </div>

              <div 
                className="glass-panel" 
                style={{ 
                  padding: '16px 20px', 
                  backgroundColor: 'var(--bg-quiz-statement)',
                  border: '1px solid var(--bg-quiz-statement-border)',
                  borderLeft: '4px solid var(--text-muted)'
                }}
              >
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 'bold', marginBottom: '4px' }}>前提 2</div>
                <div style={{ fontSize: '16px', fontWeight: '500' }}>{currentQuestion.premise2}</div>
              </div>

              <div 
                className="glass-panel" 
                style={{ 
                  padding: '20px', 
                  backgroundColor: 'var(--bg-inner-box)',
                  border: '1px solid var(--border-color)',
                  borderLeft: '4px solid var(--color-emerald)',
                  boxShadow: 'inset 0 0 20px rgba(16, 185, 129, 0.02)'
                }}
              >
                <div style={{ fontSize: '12px', color: 'var(--color-emerald)', fontWeight: 'bold', marginBottom: '4px' }}>結論</div>
                <div style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)' }}>{currentQuestion.conclusion}</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginBottom: '32px' }}>
              <button 
                onClick={() => handleAnswer(true)}
                disabled={isAnswered || (hasRetried && selectedAnswer === true)}
                className="btn"
                style={{
                  flex: 1,
                  maxWidth: '200px',
                  height: '70px',
                  fontSize: '18px',
                  borderRadius: '16px',
                  background: selectedAnswer === true 
                    ? (isAnswered && currentQuestion.isValid ? 'var(--color-emerald)' : 'rgba(244, 63, 94, 0.15)') 
                    : 'rgba(16, 185, 129, 0.1)',
                  border: `1px solid ${selectedAnswer === true 
                    ? (isAnswered && currentQuestion.isValid ? 'var(--color-emerald)' : 'var(--color-rose)') 
                    : 'rgba(16, 185, 129, 0.3)'}`,
                  color: selectedAnswer === true 
                    ? (isAnswered && currentQuestion.isValid ? '#0a0b10' : 'var(--color-rose)') 
                    : 'var(--color-emerald)',
                  opacity: (isAnswered && selectedAnswer !== true) || (hasRetried && selectedAnswer === true) ? 0.5 : 1,
                  boxShadow: selectedAnswer === true && isAnswered && currentQuestion.isValid ? '0 0 15px var(--color-emerald-glow)' : 'none'
                }}
              >
                妥当 (Valid)
              </button>

              <button 
                onClick={() => handleAnswer(false)}
                disabled={isAnswered || (hasRetried && selectedAnswer === false)}
                className="btn"
                style={{
                  flex: 1,
                  maxWidth: '200px',
                  height: '70px',
                  fontSize: '18px',
                  borderRadius: '16px',
                  background: selectedAnswer === false 
                    ? (isAnswered && !currentQuestion.isValid ? 'var(--color-emerald)' : 'rgba(244, 63, 94, 0.15)') 
                    : 'rgba(16, 185, 129, 0.1)',
                  border: `1px solid ${selectedAnswer === false 
                    ? (isAnswered && !currentQuestion.isValid ? 'var(--color-emerald)' : 'var(--color-rose)') 
                    : 'rgba(16, 185, 129, 0.3)'}`,
                  color: selectedAnswer === false 
                    ? (isAnswered && !currentQuestion.isValid ? '#0a0b10' : 'var(--color-rose)') 
                    : 'var(--color-emerald)',
                  opacity: (isAnswered && selectedAnswer !== false) || (hasRetried && selectedAnswer === false) ? 0.5 : 1,
                  boxShadow: selectedAnswer === false && isAnswered && !currentQuestion.isValid ? '0 0 15px var(--color-emerald-glow)' : 'none'
                }}
              >
                非妥当 (Invalid)
              </button>
            </div>

            {hasRetried && !isAnswered && (
              <div 
                className="fade-in incorrect-shake"
                style={{ 
                  padding: '16px 20px', 
                  borderRadius: '12px', 
                  backgroundColor: 'rgba(244, 63, 94, 0.05)',
                  border: '1px solid rgba(244, 63, 94, 0.2)',
                  borderLeft: '4px solid var(--color-rose)',
                  marginBottom: '24px',
                  textAlign: 'left'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '18px' }}>🧠</span>
                  <strong style={{ color: 'var(--color-rose)', fontSize: '14px' }}>
                    シグナル：推論エラーを検知！もう一度だけ選択できます。
                  </strong>
                </div>
                <p style={{ fontSize: '14px', lineHeight: '1.5', color: 'var(--text-primary)', margin: 0 }}>
                  {getMiniHint()}
                </p>
              </div>
            )}

            {isAnswered && (
              <div 
                className={`fade-in ${selectedAnswer === currentQuestion.isValid ? 'correct-flash' : 'incorrect-shake'}`}
                style={{ 
                  padding: '20px', 
                  borderRadius: '12px', 
                  backgroundColor: selectedAnswer === currentQuestion.isValid ? 'rgba(16, 185, 129, 0.08)' : 'rgba(244, 63, 94, 0.08)',
                  border: `1px solid ${selectedAnswer === currentQuestion.isValid ? 'var(--color-emerald)' : 'var(--color-rose)'}`,
                  marginBottom: '24px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  {selectedAnswer === currentQuestion.isValid ? (
                    <CheckCircle2 style={{ color: 'var(--color-emerald)' }} />
                  ) : (
                    <XCircle style={{ color: 'var(--color-rose)' }} />
                  )}
                  <strong style={{ fontSize: '16px', color: selectedAnswer === currentQuestion.isValid ? 'var(--color-emerald)' : 'var(--color-rose)' }}>
                    {selectedAnswer === currentQuestion.isValid 
                      ? (hasRetried ? 'リカバリー成功！' : '正解！') 
                      : '不正解'}
                  </strong>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                    （正解: {currentQuestion.isValid ? '妥当' : '非妥当'} {hasRetried && ' | リトライで正解'}）
                  </span>
                </div>
                <p style={{ fontSize: '14px', lineHeight: '1.6', color: 'var(--text-primary)' }}>
                  {currentQuestion.explanation}
                </p>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              {isAnswered && (
                <button onClick={handleNext} className="btn btn-primary" style={{ background: 'linear-gradient(135deg, var(--color-emerald) 0%, #059669 100%)', boxShadow: '0 4px 15px var(--color-emerald-glow)' }}>
                  {currentIdx < questions.length - 1 ? '次の問題へ' : '結果を見る'}
                  <ArrowRight size={16} />
                </button>
              )}
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '32px 0' }} className="fade-in">
            <CheckCircle2 size={64} style={{ color: 'var(--color-emerald)', marginBottom: '16px' }} />
            <h3 style={{ fontSize: '24px', fontFamily: 'var(--font-display)', marginBottom: '12px' }}>
              トレーニング完了！
            </h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
              三段論法などの論理構造を正しく見分ける力が向上しました。
            </p>
            
            <div style={{ display: 'inline-flex', gap: '32px', marginBottom: '32px' }}>
              <div>
                <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>正解数</div>
                <div style={{ fontSize: '32px', fontFamily: 'var(--font-display)', fontWeight: 'bold', color: 'var(--color-emerald)' }}>
                  {score} / {questions.length}
                </div>
              </div>
              <div style={{ borderLeft: '1px solid var(--border-color)' }}></div>
              <div>
                <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>スコア</div>
                <div style={{ fontSize: '32px', fontFamily: 'var(--font-display)', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                  {Math.round((score / questions.length) * 100)}%
                </div>
              </div>
            </div>

            <RakutenWidget size="300x250" ts="1779836954537" />

            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={handleReset} className="btn btn-secondary">
                <RotateCcw size={16} />
                もう一度挑戦
              </button>
              <button
                onClick={() => {
                  playSound('click');
                  const finalPercent = Math.round((score / questions.length) * 100);
                  let rank = "【脳のフリーズを検知 ⚠️】要リハビリ！";
                  if (finalPercent === 100) rank = "【論理マスター 🏆】";
                  else if (finalPercent >= 80) rank = "【優秀なデバッガー 🎯】";
                  else if (finalPercent >= 60) rank = "【一般脳 🧠】デバッグの余地あり";

                  const modeText = mode === 'business' ? 'ビジネス編' : '日常編・入門';
                  const text = `🎯 思考の筋トレ「LogiFit」でトレーニング完了！\n種目：論理の妥当性 (${modeText})\nスコア：${finalPercent}% (${score} / ${questions.length} 問正解)\n評価：${rank}\n\n前提から導き出される結論の妥当性を見分けられますか？\n#LogiFit #ロジフィット #論理的思考`;
                  const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent('https://www.logifit.site/')}`;
                  window.open(shareUrl, '_blank', 'noopener,noreferrer');
                }}
                className="btn btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                𝕏 でシェア
              </button>
              <button onClick={() => onFinish('logicalValidity', Math.round((score / questions.length) * 100))} className="btn btn-primary" style={{ background: 'linear-gradient(135deg, var(--color-emerald) 0%, #059669 100%)', boxShadow: '0 4px 15px var(--color-emerald-glow)' }}>
                ← ダッシュボードに戻る
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
