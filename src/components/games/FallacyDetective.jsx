import React, { useState, useEffect } from 'react';
import { fallaciesDaily, fallaciesBusiness } from '../../data/questions';
import { CheckCircle2, XCircle, ArrowRight, RotateCcw, Volume2, VolumeX, ShieldAlert } from 'lucide-react';
import RakutenWidget from '../common/RakutenWidget';

const shuffleArray = (array) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

export default function FallacyDetective({ onFinish, playSound, muted, toggleMute, mode, onLogBug, reviewQuestionId, onFinishReview }) {
  const [showTutorial, setShowTutorial] = useState(true);
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedChoiceIdx, setSelectedChoiceIdx] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [hasRetried, setHasRetried] = useState(false);
  const [wrongChoices, setWrongChoices] = useState([]);

  const initializeQuestions = () => {
    const rawData = mode === 'business' ? fallaciesBusiness : fallaciesDaily;
    let finalized = [];
    if (reviewQuestionId) {
      const found = fallaciesDaily.find(q => q.id === reviewQuestionId) || 
                    fallaciesBusiness.find(q => q.id === reviewQuestionId);
      if (found) {
        finalized = [found];
        setShowTutorial(false);
      }
    }
    if (finalized.length === 0) {
      finalized = shuffleArray(rawData).slice(0, 4);
    }
    const mapped = finalized.map(q => ({
      ...q,
      choices: shuffleArray(q.choices)
    }));
    setQuestions(mapped);
    setCurrentIdx(0);
    setSelectedChoiceIdx(null);
    setIsAnswered(false);
    setScore(0);
    setCompleted(false);
    setHasRetried(false);
    setWrongChoices([]);
  };

  useEffect(() => {
    initializeQuestions();
  }, [mode]);

  if (questions.length === 0) {
    return null;
  }

  const currentQuestion = questions[currentIdx];

  const getMiniHint = () => {
    return "💡 ヒント: 会話のすれ違いや、相手の『極端な解釈』や『論点のすり替え』、あるいは『白黒の決めつけ』を疑ってみましょう。各選択肢の（）内の説明をもう一度よく読み、シナリオの発言内容と照らし合わせてみてください。";
  };

  const handleAnswer = (choiceIdx) => {
    if (isAnswered || wrongChoices.includes(choiceIdx)) return;
    playSound('click');
    setSelectedChoiceIdx(choiceIdx);

    const isCorrect = currentQuestion.choices[choiceIdx].isCorrect;
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
        setWrongChoices(prev => [...prev, choiceIdx]);
        playSound('incorrect');
      } else {
        setWrongChoices(prev => [...prev, choiceIdx]);
        setIsAnswered(true);
        playSound('incorrect');
        if (onLogBug && !reviewQuestionId) {
          onLogBug('fallacy', currentQuestion.id, `あなたの選択: ${currentQuestion.choices[choiceIdx].text} (正解: ${currentQuestion.choices.find(c => c.isCorrect)?.text})`, currentQuestion.scenario);
        }
      }
    }
  };

  const handleNext = () => {
    playSound('click');
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(prev => prev + 1);
      setSelectedChoiceIdx(null);
      setIsAnswered(false);
      setHasRetried(false);
      setWrongChoices([]);
    } else {
      setCompleted(true);
      if (reviewQuestionId && onFinishReview) {
        onFinishReview('fallacy', reviewQuestionId);
      } else {
        const finalScore = Math.round((score / questions.length) * 100);
        onFinish('fallacy', finalScore, false);
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

  // Convert scenario text to chat message UI
  const parseMessages = (scenarioText) => {
    return scenarioText.split('\n').map((line, idx) => {
      const parts = line.split('：');
      if (parts.length >= 2) {
        return {
          sender: parts[0],
          text: parts.slice(1).join('：'),
          isSelf: idx % 2 === 0
        };
      }
      return { sender: '', text: line, isSelf: false };
    });
  };

  const chatMessages = parseMessages(currentQuestion.scenario);

  return (
    <div className="game-container fade-in">
      <div className="glass-panel" style={{ padding: '24px', position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <span style={{ color: 'var(--color-rose)', fontWeight: 'bold', fontSize: '14px', letterSpacing: '1px' }}>
              TRAINING MODULE 04
            </span>
            <h2 style={{ fontFamily: 'var(--font-display)', marginTop: '4px' }}>論理的誤謬 (Fallacy Detective)</h2>
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
              <div className="score-badge" style={{ borderColor: 'var(--color-rose)' }}>
                進捗: {currentIdx + 1} / {questions.length}
              </div>
            )}
          </div>
        </div>

        {showTutorial ? (
          <div style={{ textAlign: 'left' }} className="fade-in">
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', color: 'var(--color-rose)' }}>
              📖 30秒でわかる基本のき：論理的誤謬（詭弁）とは？
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
              <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(244, 63, 94, 0.05)', border: '1px solid rgba(244, 63, 94, 0.15)' }}>
                <strong style={{ color: 'var(--color-rose)', fontSize: '15px' }}>📌 論理的誤謬 (Logical Fallacy) とは？</strong>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '6px', lineHeight: '1.5' }}>
                  一見正しそうに見えて、実は論理が破綻している<strong>「おかしな屁理屈や詭弁（論理エラー）」</strong>のことです。
                </p>
              </div>

              <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)' }}>
                <strong style={{ color: 'var(--text-primary)', fontSize: '15px' }}>📌 代表的なエラーパターン:</strong>
                <ul style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '6px', paddingLeft: '16px', lineHeight: '1.6' }}>
                  <li><strong>ストローマン論法</strong>: {mode === 'business' ? '「食堂の野菜メニューを増やしよう」➡「肉食を完全に禁止するのか」と歪める。' : '「少し野菜も食べよう」➡「今日からサラダしか食べるなと言うのか」と歪める。'}</li>
                  <li><strong>誤った二分法</strong>: {mode === 'business' ? '「プランを承認して実行するか、ハッキングされて倒産するか」と極端な2択だけを迫る。' : '「今週末一緒に遊園地に行くか、友達をやめて一生一人ぼっちで生きるか」と極端な2択を迫る。'}</li>
                  <li><strong>相関と因果の混同</strong>: {mode === 'business' ? '「チャット数が多いチームは達成率が高い」➡「チャット送信数を義務付ければ達成率が上がる」と誤認する。' : '「朝ヨガをする人は体重が軽い」➡「痩せたいなら毎朝ヨガを始めればよい」と誤認する。'}</li>
                </ul>
              </div>

              <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.01)', borderLeft: '3px solid var(--color-rose)' }}>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                  💡 日常の会話やSNS、プレゼンテーションには、こうした「論理の罠」が大量に潜んでいます。怪しい反論を見破る批判的思考力（クリティカルシンキング）を鍛えましょう！
                </p>
              </div>
            </div>

            <button onClick={startTraining} className="btn btn-primary" style={{ width: '100%', background: 'linear-gradient(135deg, var(--color-rose) 0%, #e11d48 100%)', boxShadow: '0 4px 15px var(--color-rose-glow)' }}>
              理解した！トレーニングを開始する
            </button>
          </div>
        ) : !completed ? (
          <div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '15px' }}>
              提示される議論（会話文や主張）を分析し、そこに潜む論理的誤謬（論証の破綻や詭弁のパターン）を見破ってください。
            </p>

            {/* Chat Box Scenario UI */}
            <div 
              style={{ 
                background: 'var(--bg-inner-box)', 
                borderRadius: '16px', 
                padding: '20px', 
                marginBottom: '28px',
                border: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                maxHeight: '300px',
                overflowY: 'auto'
              }}
            >
              {chatMessages.map((msg, idx) => (
                <div 
                  key={idx} 
                  style={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    alignItems: msg.isSelf ? 'flex-start' : 'flex-end',
                    width: '100%'
                  }}
                >
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px', padding: '0 4px' }}>
                    {msg.sender}
                  </div>
                  <div 
                    style={{ 
                      padding: '12px 16px', 
                      borderRadius: '16px', 
                      maxWidth: '85%', 
                      fontSize: '15px', 
                      lineHeight: '1.5',
                      background: msg.isSelf 
                        ? 'var(--bg-chat-msg-self)' 
                        : 'rgba(244, 63, 94, 0.08)',
                      border: msg.isSelf 
                        ? '1px solid var(--border-color)' 
                        : '1px solid rgba(244, 63, 94, 0.2)',
                      borderTopLeftRadius: msg.isSelf ? '4px' : '16px',
                      borderBottomRightRadius: msg.isSelf ? '16px' : '4px',
                      color: 'var(--text-primary)',
                      boxShadow: !msg.isSelf ? '0 0 15px rgba(244, 63, 94, 0.03)' : 'none'
                    }}
                  >
                    {!msg.isSelf && <ShieldAlert size={14} style={{ color: 'var(--color-rose)', marginRight: '6px', display: 'inline', verticalAlign: 'middle' }} />}
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginBottom: '28px' }}>
              <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: 'var(--text-primary)' }}>
                {currentQuestion.question}
              </h4>

              {/* Choices list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {currentQuestion.choices.map((choice, idx) => {
                  const isSelected = selectedChoiceIdx === idx;
                  const isWrongAttempt = wrongChoices.includes(idx);
                  const showCorrect = isAnswered && choice.isCorrect;
                  const showWrong = isAnswered && isSelected && !choice.isCorrect;

                  let cardStyle = {
                    background: 'var(--bg-draggable-item)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-primary)'
                  };

                  if (isWrongAttempt) {
                    cardStyle = {
                      background: 'rgba(244, 63, 94, 0.15)',
                      borderColor: 'var(--color-rose)',
                      color: 'var(--color-rose)'
                    };
                  } else if (isSelected && !isAnswered) {
                    cardStyle = {
                      background: 'rgba(244, 63, 94, 0.05)',
                      borderColor: 'var(--color-rose)',
                      color: 'var(--color-rose)'
                    };
                  } else if (showCorrect) {
                    cardStyle = {
                      background: 'rgba(16, 185, 129, 0.1)',
                      borderColor: 'var(--color-emerald)',
                      color: 'var(--color-emerald)'
                    };
                  } else if (showWrong) {
                    cardStyle = {
                      background: 'rgba(244, 63, 94, 0.1)',
                      borderColor: 'var(--color-rose)',
                      color: 'var(--color-rose)'
                    };
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleAnswer(idx)}
                      disabled={isAnswered || wrongChoices.includes(idx)}
                      className="btn"
                      style={{
                        ...cardStyle,
                        justifyContent: 'flex-start',
                        textAlign: 'left',
                        padding: '16px 20px',
                        borderRadius: '12px',
                        borderWidth: '1px',
                        borderStyle: 'solid',
                        transition: 'all 0.2s',
                        fontSize: '15px',
                        lineHeight: '1.4',
                        cursor: isAnswered ? 'default' : 'pointer',
                        opacity: (isAnswered && !isSelected && !choice.isCorrect) || wrongChoices.includes(idx) ? 0.5 : 1
                      }}
                    >
                      <span style={{ 
                        marginRight: '12px', 
                        fontWeight: 'bold',
                        opacity: 0.6
                      }}>
                        {String.fromCharCode(65 + idx)}.
                      </span>
                      {choice.text}
                    </button>
                  );
                })}
              </div>
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
                    シグナル：論理的誤謬を検出！別の選択肢を再選択できます。
                  </strong>
                </div>
                <p style={{ fontSize: '14px', lineHeight: '1.5', color: 'var(--text-primary)', margin: 0 }}>
                  {getMiniHint()}
                </p>
              </div>
            )}

            {isAnswered && (
              <div 
                className={`fade-in ${currentQuestion.choices[selectedChoiceIdx].isCorrect ? 'correct-flash' : 'incorrect-shake'}`}
                style={{ 
                  padding: '20px', 
                  borderRadius: '12px', 
                  backgroundColor: currentQuestion.choices[selectedChoiceIdx].isCorrect ? 'rgba(16, 185, 129, 0.08)' : 'rgba(244, 63, 94, 0.08)',
                  border: `1px solid ${currentQuestion.choices[selectedChoiceIdx].isCorrect ? 'var(--color-emerald)' : 'var(--color-rose)'}`,
                  marginBottom: '24px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  {currentQuestion.choices[selectedChoiceIdx].isCorrect ? (
                    <CheckCircle2 style={{ color: 'var(--color-emerald)' }} />
                  ) : (
                    <XCircle style={{ color: 'var(--color-rose)' }} />
                  )}
                  <strong style={{ fontSize: '16px', color: currentQuestion.choices[selectedChoiceIdx].isCorrect ? 'var(--color-emerald)' : 'var(--color-rose)' }}>
                    {currentQuestion.choices[selectedChoiceIdx].isCorrect 
                      ? (hasRetried ? 'リカバリー成功！' : '正解！') 
                      : '不正解'}
                  </strong>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                    （正解: {String.fromCharCode(65 + currentQuestion.choices.findIndex(c => c.isCorrect))} {hasRetried && ' | リトライで正解'}）
                  </span>
                </div>
                <p style={{ fontSize: '14px', lineHeight: '1.6', color: 'var(--text-primary)' }}>
                  {currentQuestion.explanation}
                </p>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              {isAnswered && (
                <button onClick={handleNext} className="btn btn-primary" style={{ background: 'linear-gradient(135deg, var(--color-rose) 0%, #e11d48 100%)', boxShadow: '0 4px 15px var(--color-rose-glow)' }}>
                  {currentIdx < questions.length - 1 ? '次の問題へ' : '結果を見る'}
                  <ArrowRight size={16} />
                </button>
              )}
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '32px 0' }} className="fade-in">
            <CheckCircle2 size={64} style={{ color: 'var(--color-rose)', marginBottom: '16px' }} />
            <h3 style={{ fontSize: '24px', fontFamily: 'var(--font-display)', marginBottom: '12px' }}>
              トレーニング完了！
            </h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
              日常の議論やプレゼンテーションで詭弁に惑わされない批判的思考力が向上しました。
            </p>
            
            <div style={{ display: 'inline-flex', gap: '32px', marginBottom: '32px' }}>
              <div>
                <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>正解数</div>
                <div style={{ fontSize: '32px', fontFamily: 'var(--font-display)', fontWeight: 'bold', color: 'var(--color-rose)' }}>
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
                  const text = `🎯 思考の筋トレ「LogicaFit」でトレーニング完了！\n種目：論理的誤謬の特定 (${modeText})\nスコア：${finalPercent}% (${score} / ${questions.length} 問正解)\n評価：${rank}\n\n議論やSNSの詭弁（誤謬）を見破る批判思考力を鍛えよう！\n#LogicaFit #ロジカフィット #論理的思考`;
                  const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent('https://www.logicafit.site/')}`;
                  window.open(shareUrl, '_blank', 'noopener,noreferrer');
                }}
                className="btn btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                𝕏 でシェア
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
                  const text = `🎯 思考の筋トレ「LogicaFit」でトレーニング完了！\n種目：論理的誤謬の特定 (${modeText})\nスコア：${finalPercent}% (${score} / ${questions.length} 問正解)\n評価：${rank}\n\n議論やSNSの詭弁（誤謬）を見破る批判思考力を鍛えよう！\n#LogicaFit #ロジカフィット #論理的思考`;

                  navigator.clipboard.writeText(text).then(() => {
                    alert("診断結果テキストをクリップボードにコピーしました！\nFacebookの投稿画面にペースト（貼り付け）してシェアしてください。");
                    const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent('https://www.logicafit.site/')}`;
                    window.open(shareUrl, '_blank', 'noopener,noreferrer');
                  }).catch(() => {
                    const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent('https://www.logicafit.site/')}`;
                    window.open(shareUrl, '_blank', 'noopener,noreferrer');
                  });
                }}
                className="btn btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                Facebook
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
                  const text = `🎯 思考の筋トレ「LogicaFit」でトレーニング完了！\n種目：論理的誤謬の特定 (${modeText})\nスコア：${finalPercent}% (${score} / ${questions.length} 問正解)\n評価：${rank}\n\n議論やSNSの詭弁（誤謬）を見破る批判思考力を鍛えよう！\nhttps://www.logicafit.site/ #LogicaFit`;

                  navigator.clipboard.writeText(text).then(() => {
                    alert("結果テキストをクリップボードにコピーしました！SlackやLINE、Discordなどで共有してください。");
                  });
                }}
                className="btn btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                結果をコピー
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
