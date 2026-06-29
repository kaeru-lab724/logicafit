import React, { useState, useEffect } from 'react';
import { CheckCircle2, ArrowRight, RotateCcw, Share2, ExternalLink, HelpCircle, Heart, Award, ArrowLeft } from 'lucide-react';
import { parentingData } from '../../data/parentingData';

export default function ParentingDialogue({ onFinish, playSound, muted, toggleMute, onFinishReview }) {
  const [gameState, setGameState] = useState('welcome'); // welcome | quiz | result
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [firstSelectedIdx, setFirstSelectedIdx] = useState(null); // 最初に選んだ回答
  const [isAnswered, setIsAnswered] = useState(false);
  const [answers, setAnswers] = useState([]); // ユーザーの選択履歴
  const [score, setScore] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleStart = () => {
    playSound('click');
    setGameState('quiz');
    setCurrentIdx(0);
    setSelectedIdx(null);
    setFirstSelectedIdx(null);
    setIsAnswered(false);
    setAnswers([]);
    setScore(0);
  };

  const handleSelect = (idx) => {
    playSound('click');
    
    // まだ未回答の場合
    if (firstSelectedIdx === null) {
      setFirstSelectedIdx(idx);
      setSelectedIdx(idx);
      setIsAnswered(true);
      
      const question = parentingData[currentIdx];
      const isCorrect = question.options[idx].isCorrect;
      if (isCorrect) {
        setScore(prev => prev + 1);
      }
      setAnswers(prev => [...prev, { questionId: question.id, selectedIdx: idx, isCorrect }]);
    } else {
      // 回答済みの場合は解説の切り替え表示のみ行う
      setSelectedIdx(idx);
    }
  };

  const handleNext = () => {
    playSound('click');
    if (currentIdx + 1 < parentingData.length) {
      setCurrentIdx(prev => prev + 1);
      setSelectedIdx(null);
      setFirstSelectedIdx(null);
      setIsAnswered(false);
    } else {
      setGameState('result');
      if (onFinish) {
        onFinish(score * 33); // スコアをパーセントに換算して親コンポーネントに通知
      }
    }
  };

  const handleShare = () => {
    playSound('click');
    const text = `【コトバの調律】で子育ての声かけを調律しました！\n今夜の実践ミッションは『${parentingData[0].recommendation.itemTitle}』を仕組みに取り入れることと声かけの工夫。\n#コトバの調律 #LogicaParenting\n`;
    const url = 'https://www.logicafit.site/?game=parentingDialogue';
    const xShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(xShareUrl, '_blank');
  };

  const currentQuestion = parentingData[currentIdx];

  // テーマカラー定義 (こそだて用の優しいトーン)
  const colors = {
    primary: '#e07a5f', // アプリコット
    secondary: '#81b29a', // セージグリーン
    lightBg: 'rgba(224, 122, 95, 0.05)',
    border: 'rgba(224, 122, 95, 0.2)',
    successBg: 'rgba(129, 178, 154, 0.1)',
    successBorder: 'rgba(129, 178, 154, 0.3)'
  };

  if (gameState === 'welcome') {
    return (
      <div style={{
        maxWidth: '520px',
        margin: '0 auto',
        padding: '24px 16px',
        color: 'var(--text-primary)',
        fontFamily: 'var(--font-display)',
        boxSizing: 'border-box',
        minHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '24px'
      }}>
        {/* Soft background glow */}
        <div style={{
          position: 'absolute',
          top: '20%',
          width: '280px',
          height: '280px',
          background: `radial-gradient(circle, ${colors.primary} 0%, transparent 70%)`,
          filter: 'blur(80px)',
          opacity: 0.08,
          pointerEvents: 'none',
          zIndex: 0
        }} />

        <div className="glass-panel" style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          padding: '32px 24px',
          borderRadius: '24px',
          background: 'rgba(255, 255, 255, 0.01)',
          border: '1px solid var(--border-color)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '20px',
            background: colors.lightBg,
            border: `1px solid ${colors.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: colors.primary,
            marginBottom: '8px'
          }}>
            <Heart size={32} />
          </div>

          <h2 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            letterSpacing: '-0.5px',
            margin: 0,
            color: 'var(--text-primary)'
          }}>
            こそだて言葉かけ調律
          </h2>

          <div style={{
            fontSize: '12px',
            fontWeight: 'bold',
            color: colors.secondary,
            letterSpacing: '2px',
            textTransform: 'uppercase',
            borderBottom: `1px solid ${colors.border}`,
            paddingBottom: '8px',
            width: '60%'
          }}>
            Parenting Dialogue
          </div>

          {/* Letter style welcome message from Satsuki */}
          <div style={{
            fontSize: '14px',
            lineHeight: '1.6',
            color: 'var(--text-secondary)',
            textAlign: 'left',
            background: 'rgba(255, 255, 255, 0.01)',
            borderLeft: `3px solid ${colors.primary}`,
            padding: '16px',
            borderRadius: '0 12px 12px 0',
            marginTop: '8px',
            width: '100%',
            boxSizing: 'border-box'
          }}>
            <p style={{ margin: '0 0 12px 0', fontWeight: 'bold' }}>パパ・ママへ、毎日本当にお疲れ様です。</p>
            <p style={{ margin: '0 0 12px 0' }}>
              忙しい毎日の中で、つい「〇〇しないと、〇〇するよ！」と怒って動かそうとしてしまうこと、ありますよね。イライラしてしまうのは、あなたが一生懸命な証拠です。
            </p>
            <p style={{ margin: 0 }}>
              コトバをほんの少し調律するだけで、子どもの行動とパパ・ママの気持ちがすっと軽くなります。一緒に「子どものこころの仕組み」をデバッグしてみませんか？
            </p>
          </div>

          <button
            onClick={handleStart}
            style={{
              width: '100%',
              padding: '16px',
              borderRadius: '12px',
              background: colors.primary,
              border: 'none',
              color: '#fff',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'transform 0.2s, box-shadow 0.2s',
              marginTop: '12px',
              boxShadow: `0 4px 15px rgba(224, 122, 95, 0.3)`
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = `0 6px 20px rgba(224, 122, 95, 0.4)`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = `0 4px 15px rgba(224, 122, 95, 0.3)`;
            }}
          >
            調律をはじめる
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    );
  }

  if (gameState === 'quiz') {
    return (
      <div style={{
        maxWidth: '520px',
        margin: '0 auto',
        padding: isMobile ? '16px 12px' : '24px 16px',
        color: 'var(--text-primary)',
        boxSizing: 'border-box',
        minHeight: '85vh',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        {/* Header/Progress */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0 8px'
        }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 'bold' }}>
            調律中 ({currentIdx + 1} / {parentingData.length})
          </span>
          {/* Progress Indicators */}
          <div style={{ display: 'flex', gap: '6px' }}>
            {parentingData.map((_, idx) => (
              <div
                key={idx}
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: idx === currentIdx 
                    ? colors.primary 
                    : (idx < currentIdx ? colors.secondary : 'rgba(255,255,255,0.1)'),
                  transition: 'background 0.3s'
                }}
              />
            ))}
          </div>
        </div>

        {/* Situation Card */}
        <div className="glass-panel" style={{
          padding: '24px 20px',
          borderRadius: '20px',
          background: 'rgba(255,255,255,0.01)',
          border: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              fontSize: '11px',
              fontWeight: 'bold',
              background: colors.lightBg,
              color: colors.primary,
              padding: '2px 8px',
              borderRadius: '6px',
              border: `1px solid ${colors.border}`
            }}>
              シチュエーション
            </span>
          </div>

          <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: 0, lineHeight: '1.5' }}>
            {currentQuestion.situation}
          </h3>

          <div style={{
            background: 'rgba(255, 75, 75, 0.03)',
            borderLeft: '3px solid #ff4b4b',
            padding: '12px 16px',
            borderRadius: '0 10px 10px 0',
            fontSize: '13.5px',
            color: 'var(--text-secondary)'
          }}>
            <div style={{ fontSize: '11px', color: '#ff4b4b', fontWeight: 'bold', marginBottom: '4px' }}>
              つい言ってしまうコトバ：
            </div>
            <strong>「{currentQuestion.ngPhrase}」</strong>
          </div>
        </div>

        {/* Options Selection */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          marginTop: '4px'
        }}>
          {currentQuestion.options.map((option, idx) => {
            const isSelected = selectedIdx === idx;
            const isFirstSelected = firstSelectedIdx === idx;
            let btnStyle = {
              width: '100%',
              padding: '16px 20px',
              borderRadius: '14px',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              textAlign: 'left',
              fontSize: '14.5px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              boxSizing: 'border-box'
            };

            if (isAnswered) {
              if (isSelected) {
                btnStyle.borderColor = colors.primary;
                btnStyle.background = 'rgba(224, 122, 95, 0.08)';
              }
              if (option.isCorrect) {
                btnStyle.background = colors.successBg;
                btnStyle.borderColor = isSelected ? colors.primary : colors.secondary;
              } else if (isFirstSelected && !option.isCorrect) {
                btnStyle.background = 'rgba(255, 75, 75, 0.05)';
                btnStyle.borderColor = isSelected ? colors.primary : 'rgba(255, 75, 75, 0.3)';
              }
            } else {
              btnStyle[':hover'] = {
                background: colors.lightBg,
                borderColor: colors.primary
              };
            }

            return (
              <button
                key={idx}
                onClick={() => handleSelect(idx)}
                style={btnStyle}
                className={!isAnswered ? "option-button-hover" : ""}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {isAnswered && option.isCorrect && (
                    <span style={{
                      fontSize: '10px',
                      fontWeight: 'bold',
                      background: colors.secondary,
                      color: '#fff',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      marginRight: '4px'
                    }}>調律</span>
                  )}
                  {isAnswered && isFirstSelected && !option.isCorrect && (
                    <span style={{
                      fontSize: '10px',
                      fontWeight: 'bold',
                      background: '#ff4b4b',
                      color: '#fff',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      marginRight: '4px'
                    }}>あなたの選択</span>
                  )}
                  <span>{option.text}</span>
                </div>
                {isAnswered && (
                  isSelected ? (
                    <span style={{ fontSize: '11px', color: colors.primary, fontWeight: 'bold' }}>解説表示中</span>
                  ) : (
                    option.isCorrect ? (
                      <CheckCircle2 size={16} style={{ color: colors.secondary, flexShrink: 0 }} />
                    ) : null
                  )
                )}
              </button>
            );
          })}
        </div>

        {/* Feedback & Evidence Area (Animate In) */}
        {isAnswered && (
          <div className="glass-panel animate-fade-in" style={{
            padding: '24px 20px',
            borderRadius: '20px',
            background: 'var(--hero-bg)',
            border: `1px solid ${colors.border}`,
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            marginTop: '8px'
          }}>
            {/* Feedback message */}
            <div style={{
              fontSize: '14px',
              lineHeight: '1.6',
              color: 'var(--text-primary)',
              borderBottom: '1px solid var(--border-color)',
              paddingBottom: '12px'
            }}>
              {currentQuestion.options[selectedIdx].feedback}
            </div>

            {/* Scientific Evidence */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <HelpCircle size={15} style={{ color: colors.primary }} />
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: colors.primary, letterSpacing: '1px' }}>
                  こころの仕組み（エビデンス）
                </span>
              </div>
              <p style={{ fontSize: '13px', lineHeight: '1.6', color: 'var(--text-secondary)', margin: 0 }}>
                {currentQuestion.evidence}
              </p>
            </div>

            {/* Tonight's Action Plan */}
            <div style={{
              background: colors.successBg,
              border: `1px dashed ${colors.secondary}`,
              padding: '16px',
              borderRadius: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <Heart size={15} style={{ color: colors.secondary }} />
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: colors.secondary }}>
                  今夜からできる1分アクション
                </span>
              </div>
              <p style={{ fontSize: '13px', lineHeight: '1.6', color: 'var(--text-primary)', margin: 0, fontWeight: '500' }}>
                {currentQuestion.actionPlan}
              </p>
            </div>

            {/* Affiliate Recommendation & Aetheria Link */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.01)',
              border: '1px solid var(--border-color)',
              padding: '16px',
              borderRadius: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'bold', marginBottom: '4px' }}>
                  仕組みで解決するお助けアイテム：
                </div>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: colors.primary }}>
                  {currentQuestion.recommendation.itemTitle}
                </div>
                <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: '1.5', margin: '4px 0 0 0' }}>
                  {currentQuestion.recommendation.description}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <a
                  href={currentQuestion.recommendation.aetheriaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    textDecoration: 'none',
                    textAlign: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px'
                  }}
                >
                  検証記事を見る
                  <ExternalLink size={12} />
                </a>
                <a
                  href={currentQuestion.recommendation.rakutenUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '8px',
                    background: colors.primary,
                    color: '#fff',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    textDecoration: 'none',
                    textAlign: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px'
                  }}
                >
                  楽天で見る
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>

            {/* Next Button */}
            <button
              onClick={handleNext}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '12px',
                background: colors.secondary,
                border: 'none',
                color: '#fff',
                fontSize: '14.5px',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginTop: '8px',
                transition: 'background 0.2s'
              }}
            >
              {currentIdx + 1 < parentingData.length ? '次のシチュエーションへ' : '結果を見る'}
              <ArrowRight size={16} />
            </button>
          </div>
        )}
      </div>
    );
  }

  if (gameState === 'result') {
    return (
      <div style={{
        maxWidth: '520px',
        margin: '0 auto',
        padding: '24px 16px',
        color: 'var(--text-primary)',
        boxSizing: 'border-box',
        minHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        {/* Result Card */}
        <div className="glass-panel" style={{
          padding: '32px 24px',
          borderRadius: '24px',
          background: 'rgba(255, 255, 255, 0.01)',
          border: '1px solid var(--border-color)',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: colors.successBg,
            border: `1px solid ${colors.secondary}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: colors.secondary
          }}>
            <Award size={32} />
          </div>

          <h2 style={{ fontSize: '22px', fontWeight: 'bold', margin: 0 }}>
            言葉かけの調律完了
          </h2>

          {/* Soft evaluation text */}
          <div style={{
            fontSize: '14px',
            color: 'var(--text-secondary)',
            lineHeight: '1.6',
            background: 'rgba(255, 255, 255, 0.01)',
            borderLeft: `3px solid ${colors.secondary}`,
            padding: '16px',
            borderRadius: '0 12px 12px 0',
            textAlign: 'left',
            width: '100%',
            boxSizing: 'border-box'
          }}>
            <p style={{ margin: '0 0 10px 0', fontWeight: 'bold', color: '#fff' }}>おつかれさまでした。</p>
            <p style={{ margin: 0 }}>
              今日このツールを開いて、子どものための言葉かけを一緒に考えたこと、その優しい眼差しこそが一番素晴らしい一歩です。完璧にできなくても大丈夫。10回のうち1回だけでも、思い出したときに試してみてくださいね。
            </p>
          </div>

          {/* Tonight's Action Sheet to screenshot */}
          <div style={{
            width: '100%',
            background: 'var(--hero-bg)',
            border: `1px solid ${colors.border}`,
            borderRadius: '16px',
            padding: '20px',
            textAlign: 'left',
            boxSizing: 'border-box'
          }}>
            <div style={{
              fontSize: '11px',
              fontWeight: 'bold',
              color: colors.primary,
              letterSpacing: '1px',
              marginBottom: '12px',
              textTransform: 'uppercase'
            }}>
              📌 今夜の実践アクション・メモ (スクショ用)
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {parentingData.map((q, idx) => (
                <div key={idx} style={{
                  borderLeft: `2px solid ${colors.secondary}`,
                  paddingLeft: '12px'
                }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'bold' }}>
                    {idx + 1}. {q.recommendation.itemTitle} ＆ 声かけ
                  </div>
                  <div style={{ fontSize: '12.5px', color: 'var(--text-primary)', marginTop: '4px', lineHeight: '1.4' }}>
                    「{q.actionPlan}」
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Buttons Area */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
            <button
              onClick={handleShare}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '12px',
                background: 'rgba(29, 161, 242, 0.1)',
                border: '1px solid rgba(29, 161, 242, 0.3)',
                color: '#1da1f2',
                fontSize: '14.5px',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <Share2 size={16} />
              Xで今夜の実践を宣言する
            </button>

            <button
              onClick={handleStart}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '12px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                fontSize: '14.5px',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <RotateCcw size={16} />
              もう一度挑戦する
            </button>

            {/* Exit Route to Portal */}
            <button
              onClick={onFinishReview}
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: '12px',
                background: colors.secondary,
                border: 'none',
                color: '#fff',
                fontSize: '15px',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginTop: '8px',
                boxShadow: '0 4px 12px rgba(129, 178, 154, 0.2)'
              }}
            >
              <ArrowLeft size={16} />
              Logica ポータルへ (他のツールも見る)
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
