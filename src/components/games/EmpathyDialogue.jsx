import React, { useState, useEffect, useRef } from 'react';
import { empathyDialoguesDaily, empathyDialoguesBusiness } from '../../data/questions';
import { CheckCircle2, XCircle, ArrowRight, RotateCcw, Volume2, VolumeX, MessageSquare, Send } from 'lucide-react';
import RakutenWidget from '../common/RakutenWidget';

const shuffleArray = (array) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

// 相手のリアクションメッセージ定義
const getReactionText = (scenarioType, isCorrect, speaker) => {
  if (isCorrect) {
    if (scenarioType === 'business') {
      return `「そう言っていただけて、本当に救われます…。${speaker ? speaker + 'として' : ''}一人で抱え込んでいたので、理解してもらえて心が軽くなりました。少し冷静になって、次のステップを考えられそうです。」`;
    } else {
      return `「そうなの、分かってくれて本当に嬉しい…。ただこの辛い気持ちを聴いてほしかっただけなんだ。話せて少しスッキリしたよ、ありがとう。」`;
    }
  } else {
    if (scenarioType === 'business') {
      return `「あ、いや…理屈はそうかもしれないですし、おっしゃる通りなんですけど…。今はそういう正論や指導をしてほしいわけじゃないんです。少し一方的なアドバイスに感じてしまいました…。」`;
    } else {
      return `「うーん、言いたいことは分かるし正しいんだけど…なんだか冷たいアドバイスに聞こえちゃうな。今はそういう解決策じゃなくて、ただ気持ちに寄り添ってほしかったんだ…。」`;
    }
  }
};

export default function EmpathyDialogue({ onFinish, playSound, muted, toggleMute, mode, onLogBug, reviewQuestionId, onFinishReview }) {
  const [showTutorial, setShowTutorial] = useState(!reviewQuestionId);
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedIdx, setSelectedIdx] = useState(null); // 0-3 index
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);
  
  // チャットログ表示用
  // { sender: 'them' | 'me' | 'system', text: string, animate: boolean, isCorrect?: boolean }
  const [chatLog, setChatLog] = useState([]);
  const [typing, setTyping] = useState(false);
  const chatEndRef = useRef(null);

  const initializeQuestions = () => {
    const rawData = mode === 'business' ? empathyDialoguesBusiness : empathyDialoguesDaily;
    let finalized = [];
    if (reviewQuestionId) {
      const found = empathyDialoguesDaily.find(q => q.id === reviewQuestionId) || 
                    empathyDialoguesBusiness.find(q => q.id === reviewQuestionId);
      if (found) {
        finalized = [{
          ...found,
          choices: shuffleArray(found.choices)
        }];
      }
    }
    if (finalized.length === 0) {
      const shuffled = shuffleArray(rawData).slice(0, 5);
      finalized = shuffled.map(q => ({
        ...q,
        choices: shuffleArray(q.choices)
      }));
    }
    setQuestions(finalized);
    setCurrentIdx(0);
    setSelectedIdx(null);
    setIsAnswered(false);
    setScore(0);
    setCompleted(false);
    setChatLog([]);
  };

  useEffect(() => {
    initializeQuestions();
  }, [mode]);

  useEffect(() => {
    if (questions.length > 0 && !showTutorial && chatLog.length === 0) {
      loadQuestion(0, questions);
    }
  }, [questions, showTutorial]);

  // チャットの自動スクロール
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatLog, typing]);

  // チュートリアル終了後、最初の質問をチャットに流す
  const startTraining = () => {
    playSound('click');
    setShowTutorial(false);
    const rawData = mode === 'business' ? empathyDialoguesBusiness : empathyDialoguesDaily;
    let finalized = [];
    if (reviewQuestionId) {
      const found = empathyDialoguesDaily.find(q => q.id === reviewQuestionId) || 
                    empathyDialoguesBusiness.find(q => q.id === reviewQuestionId);
      if (found) {
        finalized = [{
          ...found,
          choices: shuffleArray(found.choices)
        }];
      }
    }
    if (finalized.length === 0) {
      const shuffled = shuffleArray(rawData).slice(0, 5);
      finalized = shuffled.map(q => ({
        ...q,
        choices: shuffleArray(q.choices)
      }));
    }
    setQuestions(finalized);
    loadQuestion(0, finalized);
  };

  const loadQuestion = (idx, qList = questions) => {
    const activeList = qList.length > 0 ? qList : questions;
    if (activeList.length === 0) return;
    
    const question = activeList[idx];
    setTyping(true);
    
    // 話し手とセリフを切り分ける
    const match = question.scenario.match(/^([^：]+)：(.+)$/);
    const speaker = match ? match[1] : '対話相手';
    const text = match ? match[2] : question.scenario;
    const displayText = (text.startsWith('「') && text.endsWith('」')) ? text : `「${text}」`;

    setTimeout(() => {
      setTyping(false);
      setChatLog([
        {
          sender: 'them',
          speaker,
          text: displayText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }, 1000);
  };

  const handleAnswer = (choiceIdx, choice) => {
    if (isAnswered || typing) return;
    playSound('click');
    setSelectedIdx(choiceIdx);
    setIsAnswered(true);

    const question = questions[currentIdx];
    const isCorrect = choice.isCorrect;

    // 話し手とセリフを切り分ける
    const match = question.scenario.match(/^([^：]+)：/);
    const speaker = match ? match[1] : '';

    // 自分の発言をチャットに追加
    setChatLog(prev => [
      ...prev,
      {
        sender: 'me',
        speaker: 'あなた',
        text: choice.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);

    // 効果音とスコア更新
    if (isCorrect) {
      setScore(prev => prev + 1);
      setTimeout(() => playSound('correct'), 300);
    } else {
      setTimeout(() => playSound('incorrect'), 300);
      if (onLogBug && !reviewQuestionId) {
        onLogBug('empathyDialogue', question.id, `あなたの選択: ${choice.text} (正解: ${question.choices.find(c => c.isCorrect)?.text})`, question.scenario);
      }
    }

    // 相手のリアクションをタイピングで追加
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setChatLog(prev => [
        ...prev,
        {
          sender: 'them',
          speaker,
          text: getReactionText(mode, isCorrect, speaker),
          isCorrect,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }, 1500);
  };

  const handleNext = () => {
    playSound('click');
    if (currentIdx < questions.length - 1) {
      const nextIdx = currentIdx + 1;
      setCurrentIdx(nextIdx);
      setSelectedIdx(null);
      setIsAnswered(false);
      
      // 次の問題のチャット初期化
      loadQuestion(nextIdx);
    } else {
      setCompleted(true);
      if (reviewQuestionId && onFinishReview) {
        onFinishReview('empathyDialogue', reviewQuestionId);
      } else {
        const finalScore = Math.round((score / questions.length) * 100);
        onFinish('empathyDialogue', finalScore, false);
        playSound('success');
      }
    }
  };

  const handleReset = () => {
    playSound('click');
    initializeQuestions();
    setShowTutorial(true);
  };

  if (questions.length === 0) {
    return null;
  }

  const currentQuestion = questions[currentIdx];

  // スコアに応じた称号
  const getEmpathyTitle = (s) => {
    const finalScore = Math.round((s / questions.length) * 100);
    if (finalScore >= 100) return '共感の超越神 (EQマスター)';
    if (finalScore >= 80) return '寄り添いのスペシャリスト';
    if (finalScore >= 60) return '心優しい傾聴プレイヤー';
    if (finalScore >= 40) return '正論を抑えし修行僧';
    return '冷徹な正論サイコパス';
  };

  const shareText = `🎯 思考の筋トレ「LogicaFit」でトレーニング完了！\n種目：エモーショナル思考 (Empathy Dialogue)\nスコア：${Math.round((score / questions.length) * 100)}% (${score} / ${questions.length} 問正解)\n称号：【${getEmpathyTitle(score)}】\n\n正論で論破するのをやめ、心のチューナーを合わせよう！\n#LogicaFit #ロジカフィット #EQ`;

  return (
    <div className="game-container fade-in">
      <div className="glass-panel" style={{ padding: '24px', position: 'relative' }}>
        {/* ヘッダー */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <span style={{ color: 'var(--color-emerald)', fontWeight: 'bold', fontSize: '14px', letterSpacing: '1px' }}>
              TRAINING MODULE 05 (NEW)
            </span>
            <h2 style={{ fontFamily: 'var(--font-display)', marginTop: '4px' }}>エモーショナル思考 (Empathy Dialogue)</h2>
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

        {/* チュートリアル */}
        {showTutorial ? (
          <div style={{ textAlign: 'left' }} className="fade-in">
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', color: 'var(--color-emerald)' }}>
              💬 共感対話トレーニング：正しいだけの言葉は人を傷つける
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
              <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
                <strong style={{ color: 'var(--color-emerald)', fontSize: '15px' }}>📌 ロジックハラスメントを回避せよ</strong>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '6px', lineHeight: '1.5' }}>
                  対話相手が不安や不満、愚痴などの感情を吐露している場面では、<strong>「正論のアドバイス」や「原因分析」は逆効果</strong>になります。<br />
                  相手が本当に求めているのは解決策ではなく、「自分の気持ちを分かってもらうこと（共感と受容）」です。
                </p>
              </div>

              <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)' }}>
                <strong style={{ color: 'var(--text-primary)', fontSize: '15px' }}>📌 トレーニングの進め方</strong>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '6px', lineHeight: '1.5' }}>
                  チャット形式で対話が進みます。相手の悩める発言に対して、<strong>「最も共感力が高く、感情に寄り添った選択肢」</strong>を4択から選んでください。<br />
                  正論・批判・自分語りを避け、アクティブリスニング（傾聴）を心がけましょう。
                </p>
              </div>
            </div>

            <button onClick={startTraining} className="btn btn-primary" style={{ width: '100%', background: 'linear-gradient(135deg, var(--color-emerald) 0%, #059669 100%)', boxShadow: '0 4px 15px var(--color-emerald-glow)' }}>
              理解した！チャットを開始する
            </button>
          </div>
        ) : !completed ? (
          <div>
            {/* チャット風UIウィンドウ */}
            <div 
              style={{
                height: '320px',
                background: 'rgba(0, 0, 0, 0.2)',
                borderRadius: '16px',
                border: '1px solid var(--border-color)',
                padding: '16px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                marginBottom: '20px',
                scrollBehavior: 'smooth'
              }}
            >
              {chatLog.map((msg, index) => {
                const isMe = msg.sender === 'me';
                const isCorrectReaction = msg.isCorrect !== undefined ? msg.isCorrect : null;
                
                // アニメーション判定
                let animClass = '';
                if (isCorrectReaction !== null) {
                  animClass = isCorrectReaction ? 'correct-flash' : 'incorrect-shake';
                }

                return (
                  <div 
                    key={index} 
                    className={`fade-in ${animClass}`}
                    style={{
                      display: 'flex',
                      justifyContent: isMe ? 'flex-end' : 'flex-start',
                      width: '100%'
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '75%', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', padding: '0 4px' }}>
                        {msg.speaker}
                      </span>
                      <div 
                        style={{
                          padding: '12px 16px',
                          borderRadius: '16px',
                          borderTopLeftRadius: isMe ? '16px' : '4px',
                          borderTopRightRadius: isMe ? '4px' : '16px',
                          background: isMe 
                            ? 'linear-gradient(135deg, var(--color-emerald) 0%, #047857 100%)' 
                            : 'rgba(255, 255, 255, 0.05)',
                          border: isMe ? 'none' : '1px solid var(--border-color)',
                          color: 'var(--text-primary)',
                          fontSize: '14px',
                          lineHeight: '1.5',
                          textAlign: 'left',
                          boxShadow: isMe ? '0 4px 10px rgba(16, 185, 129, 0.15)' : 'none'
                        }}
                      >
                        {msg.text}
                      </div>
                      <span style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '2px', padding: '0 4px' }}>
                        {msg.timestamp}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* タイピングアニメーション */}
              {typing && (
                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                      入力中...
                    </span>
                    <div 
                      style={{
                        padding: '12px 20px',
                        borderRadius: '16px',
                        borderTopLeftRadius: '4px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid var(--border-color)',
                        display: 'flex',
                        gap: '4px',
                        alignItems: 'center'
                      }}
                    >
                      <span className="dot-blink" style={{ width: '6px', height: '6px', background: 'var(--text-muted)', borderRadius: '50%' }}></span>
                      <span className="dot-blink" style={{ width: '6px', height: '6px', background: 'var(--text-muted)', borderRadius: '50%', animationDelay: '0.2s' }}></span>
                      <span className="dot-blink" style={{ width: '6px', height: '6px', background: 'var(--text-muted)', borderRadius: '50%', animationDelay: '0.4s' }}></span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={chatEndRef} />
            </div>

            {/* 回答解説セクション */}
            {isAnswered && !typing && (
              <div 
                className="fade-in glass-panel" 
                style={{ 
                  padding: '16px', 
                  borderRadius: '12px',
                  marginBottom: '20px',
                  background: currentQuestion.choices[selectedIdx]?.isCorrect 
                    ? 'rgba(16, 185, 129, 0.05)' 
                    : 'rgba(239, 68, 68, 0.05)',
                  border: currentQuestion.choices[selectedIdx]?.isCorrect 
                    ? '1px solid rgba(16, 185, 129, 0.2)' 
                    : '1px solid rgba(239, 68, 68, 0.2)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  {currentQuestion.choices[selectedIdx]?.isCorrect ? (
                    <CheckCircle2 size={20} style={{ color: 'var(--color-emerald)' }} />
                  ) : (
                    <XCircle size={20} style={{ color: '#ef4444' }} />
                  )}
                  <span style={{ 
                    fontWeight: 'bold', 
                    color: currentQuestion.choices[selectedIdx]?.isCorrect ? 'var(--color-emerald)' : '#ef4444' 
                  }}>
                    {currentQuestion.choices[selectedIdx]?.isCorrect ? '正解 (共感大成功)' : '不正解 (ロジハラ・不適切発言)'}
                  </span>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', textAlign: 'left', lineHeight: '1.6' }}>
                  {currentQuestion.explanation}
                </p>
              </div>
            )}

            {/* 選択肢エリア */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {!isAnswered ? (
                currentQuestion.choices.map((choice, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAnswer(idx, choice)}
                    className="btn btn-secondary"
                    disabled={typing}
                    style={{
                      padding: '14px 18px',
                      borderRadius: '12px',
                      textAlign: 'left',
                      fontSize: '13.5px',
                      lineHeight: '1.4',
                      transition: 'all 0.2s',
                      opacity: typing ? 0.6 : 1,
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'rgba(255, 255, 255, 0.02)'
                    }}
                  >
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <span style={{ 
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '22px',
                        height: '22px',
                        borderRadius: '50%',
                        background: 'rgba(255, 255, 255, 0.08)',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        color: 'var(--text-secondary)',
                        flexShrink: 0
                      }}>
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span>{choice.text}</span>
                    </div>
                  </button>
                ))
              ) : (
                <button
                  onClick={handleNext}
                  className="btn btn-primary"
                  style={{
                    width: '100%',
                    padding: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    background: 'linear-gradient(135deg, var(--color-emerald) 0%, #059669 100%)',
                    boxShadow: '0 4px 15px var(--color-emerald-glow)'
                  }}
                >
                  {currentIdx < questions.length - 1 ? '次の会話へ進む' : '結果を見る'}
                  <ArrowRight size={18} />
                </button>
              )}
            </div>
          </div>
        ) : (
          /* クリア結果画面 */
          <div className="fade-in" style={{ textAlign: 'center', padding: '20px 0' }}>
            <h3 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px', color: 'var(--color-emerald)' }}>
              🎉 トレーニング完了！
            </h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
              あなたの共感力と傾聴姿勢が診断されました。
            </p>

            {/* スコア・称号サマリー */}
            <div 
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-color)',
                borderRadius: '16px',
                padding: '24px',
                maxWidth: '400px',
                margin: '0 auto 32px auto',
                boxShadow: 'inset 0 0 20px rgba(255, 255, 255, 0.01)'
              }}
            >
              <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>あなたのスコア</div>
              <div style={{ fontSize: '48px', fontWeight: 'bold', color: 'var(--color-emerald)', margin: '8px 0', fontFamily: 'var(--font-display)' }}>
                {Math.round((score / questions.length) * 100)}<span style={{ fontSize: '20px' }}>%</span>
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                正解数: {score} / {questions.length} 問
              </div>
              <div 
                style={{
                  borderTop: '1px solid var(--border-color)',
                  paddingTop: '16px',
                  marginTop: '16px'
                }}
              >
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>授与された称号</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                  🏆 {getEmpathyTitle(score)}
                </div>
              </div>
            </div>

            {/* 操作アクション */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '32px', flexWrap: 'wrap' }}>
              <button onClick={handleReset} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <RotateCcw size={16} />
                もう一度プレイ
              </button>
              
              <button
                onClick={() => {
                  playSound('click');
                  const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent('https://www.logicafit.site/')}`;
                  window.open(shareUrl, '_blank', 'noopener,noreferrer');
                }}
                className="btn btn-secondary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                𝕏 でシェア
              </button>
              <button
                onClick={() => {
                  playSound('click');
                  navigator.clipboard.writeText(shareText).then(() => {
                    alert("称号結果テキストをクリップボードにコピーしました！\nFacebookの投稿画面にペースト（貼り付け）してシェアしてください。");
                    const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent('https://www.logicafit.site/')}`;
                    window.open(shareUrl, '_blank', 'noopener,noreferrer');
                  }).catch(() => {
                    const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent('https://www.logicafit.site/')}`;
                    window.open(shareUrl, '_blank', 'noopener,noreferrer');
                  });
                }}
                className="btn btn-secondary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                Facebook
              </button>

            </div>

            {/* 広告ウィジェット */}
            <RakutenWidget size="300x160" ts="1716892518451" />
          </div>
        )}
      </div>
    </div>
  );
}
