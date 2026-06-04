import React, { useState, useEffect } from 'react';
import { logicTreesDaily, logicTreesBusiness } from '../../data/questions';
import { CheckCircle2, XCircle, RotateCcw, Volume2, VolumeX, ArrowRight, HelpCircle } from 'lucide-react';
import RakutenWidget from '../common/RakutenWidget';

const shuffleArray = (array) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

export default function LogicTreeAssembler({ onFinish, playSound, muted, toggleMute, mode, onLogBug, reviewQuestionId, onFinishReview }) {
  const [showTutorial, setShowTutorial] = useState(true);
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [placedItems, setPlacedItems] = useState({}); // slotId -> optionId
  const [selectedOptionId, setSelectedOptionId] = useState(null); // For click-to-place mobile support
  const [isChecked, setIsChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [activeHintSlot, setActiveHintSlot] = useState(null); // 'root', 'sub1', 'sub2'

  const initializeQuestions = () => {
    const rawData = mode === 'business' ? logicTreesBusiness : logicTreesDaily;
    let finalized = [];
    if (reviewQuestionId) {
      const found = logicTreesDaily.find(q => q.id === reviewQuestionId) || 
                    logicTreesBusiness.find(q => q.id === reviewQuestionId);
      if (found) {
        finalized = [found];
        setShowTutorial(false);
      }
    }
    if (finalized.length === 0) {
      finalized = shuffleArray(rawData).slice(0, 2);
    }
    const mapped = finalized.map(q => ({
      ...q,
      options: shuffleArray(q.options) // パーツの並び順もシャッフルして固定順を防止
    }));
    setQuestions(mapped);
    setCurrentIdx(0);
    setPlacedItems({});
    setSelectedOptionId(null);
    setIsChecked(false);
    setIsCorrect(false);
    setScore(0);
    setCompleted(false);
    setActiveHintSlot(null);
  };

  useEffect(() => {
    initializeQuestions();
  }, [mode]);

  // Reset states when changing question
  useEffect(() => {
    setPlacedItems({});
    setSelectedOptionId(null);
    setIsChecked(false);
    setIsCorrect(false);
    setActiveHintSlot(null);
  }, [currentIdx]);

  if (questions.length === 0) {
    return null;
  }

  const currentTheme = questions[currentIdx];

  // Drag and Drop handlers
  const handleDragStart = (e, optionId) => {
    e.dataTransfer.setData('text/plain', optionId);
    playSound('click');
  };

  const handleDrop = (e, slotId) => {
    e.preventDefault();
    const optionId = e.dataTransfer.getData('text/plain');
    placeOption(optionId, slotId);
  };

  const placeOption = (optionId, slotId) => {
    playSound('click');
    setPlacedItems(prev => {
      const next = { ...prev };
      // Remove this option from other slots if it was placed elsewhere
      Object.keys(next).forEach(k => {
        if (next[k] === optionId) delete next[k];
      });
      next[slotId] = optionId;
      return next;
    });
    setSelectedOptionId(null);
  };

  const handleSlotClick = (slotId) => {
    if (isChecked) return;
    if (selectedOptionId) {
      placeOption(selectedOptionId, slotId);
    } else {
      // If a card is already in the slot, remove it
      if (placedItems[slotId]) {
        playSound('click');
        setPlacedItems(prev => {
          const next = { ...prev };
          delete next[slotId];
          return next;
        });
      }
    }
  };

  const handleOptionClick = (optionId) => {
    if (isChecked) return;
    playSound('click');
    setSelectedOptionId(prev => prev === optionId ? null : optionId);
  };

  const handleCheck = () => {
    playSound('click');
    let correctCount = 0;
    const totalSlots = currentTheme.correctStructure.slots.length;

    currentTheme.options.forEach(option => {
      // Find slot this option was placed in
      const placedSlotId = Object.keys(placedItems).find(k => placedItems[k] === option.id);
      if (placedSlotId) {
        const slot = currentTheme.correctStructure.slots.find(s => s.id === placedSlotId);
        if (slot && slot.expectedText === option.text) {
          correctCount++;
        }
      }
    });

    const isAllCorrect = correctCount === totalSlots;
    setIsCorrect(isAllCorrect);
    setIsChecked(true);

    if (isAllCorrect) {
      setScore(prev => prev + 1);
      playSound('correct');
    } else {
      playSound('incorrect');
      if (onLogBug && !reviewQuestionId) {
        const wrongList = currentTheme.correctStructure.slots.map(slot => {
          const placedOptId = placedItems[slot.id];
          const placedOpt = currentTheme.options.find(o => o.id === placedOptId);
          return `${slot.label}: [配置: ${placedOpt ? placedOpt.text : '未配置'} (正解: ${slot.expectedText})]`;
        }).join(', ');
        onLogBug('logicTree', currentTheme.id, `誤配置: ${wrongList}`, currentTheme.theme);
      }
    }
  };

  const handleNext = () => {
    playSound('click');
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(prev => prev + 1);
    } else {
      setCompleted(true);
      if (reviewQuestionId && onFinishReview) {
        onFinishReview('logicTree', reviewQuestionId);
      } else {
        const finalScore = Math.round((score / questions.length) * 100);
        onFinish('logicTree', finalScore, false);
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
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <span style={{ color: 'var(--color-amber)', fontWeight: 'bold', fontSize: '14px', letterSpacing: '1px' }}>
              TRAINING MODULE 03
            </span>
            <h2 style={{ fontFamily: 'var(--font-display)', marginTop: '4px' }}>ロジックツリー・アセンブラー</h2>
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
              <div className="score-badge" style={{ borderColor: 'var(--color-amber)' }}>
                進捗: {currentIdx + 1} / {questions.length}
              </div>
            )}
          </div>
        </div>

        {showTutorial ? (
          <div style={{ textAlign: 'left' }} className="fade-in">
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', color: 'var(--color-amber)' }}>
              📖 30秒でわかる基本のき：ロジックツリーとMECEとは？
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
              <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.15)' }}>
                <strong style={{ color: 'var(--color-amber)', fontSize: '15px' }}>📌 ロジックツリー とは？</strong>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '6px', lineHeight: '1.5' }}>
                  大きな問題やテーマを、細かく枝分かれさせて階層構造で整理する図です。<br />
                  複雑な問題を小さく分解することで、「どこに真の原因があるか」を特定しやすくなります。
                </p>
              </div>

              <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)' }}>
                <strong style={{ color: 'var(--text-primary)', fontSize: '15px' }}>📌 MECE（ミーシー）とは？</strong>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '6px', lineHeight: '1.5' }}>
                  Mutually Exclusive, Collectively Exhaustiveの略で、<strong>「漏れがなく、ダブりがない」</strong>状態のことです。<br />
                  例：{mode === 'business'
                    ? '「客数 × 客単価」 ➡ 売上を漏れなくダブりなく分解できている（MECEな状態）'
                    : '「トップス ＋ ボトムス」 ➡ 洋服を漏れなくダブりなく分解できている（MECEな状態）'}<br />
                  例：{mode === 'business'
                    ? '「若者の集客 ＋ 値引き ＋ SNS広告」 ➡ アイデアがごちゃ混ぜで、漏れも重複も多い（MECEではない状態）'
                    : '「お気に入りの服 ＋ 赤い服 ＋ 部屋着」 ➡ 分類基準がごちゃ混ぜで、漏れも重複も多い（MECEではない状態）'}
                </p>
              </div>

              <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.01)', borderLeft: '3px solid var(--color-amber)' }}>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                  💡 このトレーニングでは、テーマに沿ってパーツを正しいスロットにドラッグ＆ドロップ（またはタップ）して配置し、モレ・ダブりのないツリーを完成させます！
                </p>
              </div>
            </div>

            <button onClick={startTraining} className="btn btn-primary" style={{ width: '100%', background: 'linear-gradient(135deg, var(--color-amber) 0%, #d97706 100%)', boxShadow: '0 4px 15px var(--color-amber-glow)' }}>
              理解した！トレーニングを開始する
            </button>
          </div>
        ) : !completed ? (
          <div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '15px' }}>
              課題テーマを最も<strong>MECE（モレなくダブりなく）</strong>に構造化できるように、下部にあるパーツをロジックツリー의正しい位置（スロット）に配置してください。
              <br /><span style={{ fontSize: '12px', opacity: 0.8 }}>※スロット横の「❓」マークをクリックするとヒントが表示されます。</span>
            </p>

            {/* Tree Area */}
            <div 
              style={{ 
                background: 'var(--bg-inner-box)', 
                borderRadius: '16px', 
                padding: '24px', 
                marginBottom: '32px',
                border: '1px dashed var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '24px'
              }}
            >
              {/* Goal / Root Title */}
              <div 
                style={{ 
                  background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(245, 158, 11, 0.05) 100%)', 
                  border: '1px solid var(--color-amber)',
                  padding: '12px 24px',
                  borderRadius: '12px',
                  fontWeight: 'bold',
                  color: 'var(--color-amber)',
                  fontSize: '16px',
                  boxShadow: '0 0 10px rgba(245, 158, 11, 0.1)',
                  textAlign: 'center',
                  minWidth: '220px'
                }}
              >
                テーマ: {currentTheme.theme}
              </div>

              {/* Connector lines representation */}
              <div style={{ width: '100%', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                
                {/* Level 1 Slot: Root decomposition */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px', width: '100%', position: 'relative' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {currentTheme.correctStructure.slots[0].label}
                    </span>
                    <button 
                      onClick={() => setActiveHintSlot(activeHintSlot === 'root' ? null : 'root')}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--color-amber)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 0
                      }}
                      title="ヒントを見る"
                    >
                      <HelpCircle size={14} />
                    </button>
                  </div>

                  {activeHintSlot === 'root' && (
                    <div 
                      className="fade-in"
                      style={{
                        position: 'absolute',
                        bottom: '75px',
                        background: '#0f172a',
                        border: '1px solid var(--color-amber)',
                        borderRadius: '8px',
                        padding: '10px 14px',
                        fontSize: '12px',
                        color: 'var(--text-primary)',
                        maxWidth: '280px',
                        zIndex: 200,
                        boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
                        lineHeight: '1.4'
                      }}
                    >
                      💡 {currentTheme.correctStructure.slots[0].hint}
                    </div>
                  )}

                  <div 
                    onClick={() => handleSlotClick('root')}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleDrop(e, 'root')}
                    style={{
                      border: `2px dashed ${placedItems['root'] ? 'var(--color-amber)' : 'var(--border-item-slot)'}`,
                      background: placedItems['root'] ? 'rgba(245, 158, 11, 0.08)' : 'var(--bg-item-slot)',
                      minHeight: '60px',
                      width: '320px',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: isChecked ? 'default' : 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: placedItems['root'] ? '0 0 10px rgba(245, 158, 11, 0.15)' : 'none',
                      padding: '8px'
                    }}
                  >
                    {placedItems['root'] ? (
                      <div style={{ fontWeight: '600', color: 'var(--text-primary)', textAlign: 'center' }}>
                        {currentTheme.options.find(o => o.id === placedItems['root'])?.text}
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>ここにドロップ</span>
                    )}
                  </div>
                </div>

                {/* Sub Slots Container */}
                <div style={{ display: 'flex', gap: '32px', justifyContent: 'center', width: '100%', flexWrap: 'wrap' }}>
                  {currentTheme.correctStructure.slots.slice(1).map((slot) => (
                    <div key={slot.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '300px', position: 'relative' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          {slot.label}
                        </span>
                        <button 
                          onClick={() => setActiveHintSlot(activeHintSlot === slot.id ? null : slot.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--color-amber)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: 0
                          }}
                          title="ヒントを見る"
                        >
                          <HelpCircle size={14} />
                        </button>
                      </div>

                      {activeHintSlot === slot.id && (
                        <div 
                          className="fade-in"
                          style={{
                            position: 'absolute',
                            bottom: '75px',
                            background: '#0f172a',
                            border: '1px solid var(--color-amber)',
                            borderRadius: '8px',
                            padding: '10px 14px',
                            fontSize: '12px',
                            color: 'var(--text-primary)',
                            maxWidth: '280px',
                            zIndex: 200,
                            boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
                            lineHeight: '1.4'
                          }}
                        >
                          💡 {slot.hint}
                        </div>
                      )}

                      <div 
                        onClick={() => handleSlotClick(slot.id)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => handleDrop(e, slot.id)}
                        style={{
                          border: `2px dashed ${placedItems[slot.id] ? 'var(--color-amber)' : 'var(--border-item-slot)'}`,
                          background: placedItems[slot.id] ? 'rgba(245, 158, 11, 0.08)' : 'var(--bg-item-slot)',
                          minHeight: '60px',
                          width: '100%',
                          borderRadius: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: isChecked ? 'default' : 'pointer',
                          transition: 'all 0.2s',
                          boxShadow: placedItems[slot.id] ? '0 0 10px rgba(245, 158, 11, 0.15)' : 'none',
                          padding: '8px'
                        }}
                      >
                        {placedItems[slot.id] ? (
                          <div style={{ fontWeight: '600', color: 'var(--text-primary)', textAlign: 'center', fontSize: '14px' }}>
                            {currentTheme.options.find(o => o.id === placedItems[slot.id])?.text}
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>ここにドロップ</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            </div>

            {/* Draggable Options Area */}
            {!isChecked && (
              <div style={{ marginBottom: '32px' }}>
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '12px', fontWeight: '500' }}>
                  選択肢パーツ（クリックまたはドラッグしてツリーへ配置）:
                </div>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
                  {currentTheme.options.map((option) => {
                    const isPlaced = Object.values(placedItems).includes(option.id);
                    const isSelected = selectedOptionId === option.id;

                    return (
                      <div
                        key={option.id}
                        draggable={!isPlaced}
                        onDragStart={(e) => handleDragStart(e, option.id)}
                        onClick={() => !isPlaced && handleOptionClick(option.id)}
                        style={{
                          padding: '12px 18px',
                          borderRadius: '12px',
                          background: isSelected 
                            ? 'var(--color-amber)' 
                            : 'var(--bg-draggable-item)',
                          border: `1px solid ${isSelected ? 'var(--color-amber)' : isPlaced ? 'var(--border-draggable-placed)' : 'var(--border-color)'}`,
                          color: isSelected ? '#0a0b10' : isPlaced ? 'var(--text-draggable-placed)' : 'var(--text-primary)',
                          cursor: isPlaced ? 'not-allowed' : 'grab',
                          opacity: isPlaced ? 'var(--opacity-placed)' : 1,
                          fontSize: '14px',
                          fontWeight: '500',
                          transition: 'all 0.2s',
                          boxShadow: isSelected ? '0 0 12px var(--color-amber-glow)' : 'none',
                          transform: isSelected ? 'scale(1.03)' : 'scale(1)'
                        }}
                      >
                        {option.text}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Answer Checker Feedback */}
            {isChecked && (
              <div 
                className={`fade-in ${isCorrect ? 'correct-flash' : 'incorrect-shake'}`}
                style={{ 
                  padding: '20px', 
                  borderRadius: '12px', 
                  backgroundColor: isCorrect ? 'rgba(16, 185, 129, 0.08)' : 'rgba(244, 63, 94, 0.08)',
                  border: `1px solid ${isCorrect ? 'var(--color-emerald)' : 'var(--color-rose)'}`,
                  marginBottom: '24px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  {isCorrect ? (
                    <CheckCircle2 style={{ color: 'var(--color-emerald)' }} />
                  ) : (
                    <XCircle style={{ color: 'var(--color-rose)' }} />
                  )}
                  <strong style={{ fontSize: '16px', color: isCorrect ? 'var(--color-emerald)' : 'var(--color-rose)' }}>
                    {isCorrect ? 'MECEチェック合格！正解です。' : 'MECEチェック不合格：要素の過不足や配置の間違いがあります。'}
                  </strong>
                </div>
                <p style={{ fontSize: '14px', lineHeight: '1.6', color: 'var(--text-primary)' }}>
                  {currentTheme.explanation}
                </p>
              </div>
            )}

            {/* Action Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                {!isChecked && (
                  <button 
                    onClick={() => setPlacedItems({})} 
                    className="btn btn-secondary"
                    disabled={Object.keys(placedItems).length === 0}
                  >
                    リセット
                  </button>
                )}
              </div>
              <div>
                {!isChecked ? (
                  <button 
                    onClick={handleCheck} 
                    className="btn btn-primary"
                    style={{ background: 'linear-gradient(135deg, var(--color-amber) 0%, #d97706 100%)', boxShadow: '0 4px 15px var(--color-amber-glow)' }}
                    disabled={Object.keys(placedItems).length < currentTheme.correctStructure.slots.length}
                  >
                    MECEチェックを実行
                  </button>
                ) : (
                  <button 
                    onClick={handleNext} 
                    className="btn btn-primary" 
                    style={{ background: 'linear-gradient(135deg, var(--color-amber) 0%, #d97706 100%)', boxShadow: '0 4px 15px var(--color-amber-glow)' }}
                  >
                    {currentIdx < questions.length - 1 ? '次のテーマへ' : '結果を見る'}
                    <ArrowRight size={16} />
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '32px 0' }} className="fade-in">
            <CheckCircle2 size={64} style={{ color: 'var(--color-amber)', marginBottom: '16px' }} />
            <h3 style={{ fontSize: '24px', fontFamily: 'var(--font-display)', marginBottom: '12px' }}>
              トレーニング完了！
            </h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
              課題を重複なく、漏れなく論理的に整理する構造化能力が向上しました。
            </p>
            
            <div style={{ display: 'inline-flex', gap: '32px', marginBottom: '32px' }}>
              <div>
                <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>正解数</div>
                <div style={{ fontSize: '32px', fontFamily: 'var(--font-display)', fontWeight: 'bold', color: 'var(--color-amber)' }}>
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
                  const text = `🎯 思考の筋トレ「LogiFit」でトレーニング完了！\n種目：ロジックツリー (${modeText})\nスコア：${finalPercent}% (${score} / ${questions.length} 問正解)\n評価：${rank}\n\nモレなくダブりなく（MECE）構造化するスキルを鍛えよう！\n#LogiFit #ロジフィット #論理的思考`;
                  const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent('https://www.logifit.site/')}`;
                  window.open(shareUrl, '_blank', 'noopener,noreferrer');
                }}
                className="btn btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                𝕏 でシェア
              </button>
              <button onClick={() => onFinish('logicTree', Math.round((score / questions.length) * 100))} className="btn btn-primary" style={{ background: 'linear-gradient(135deg, var(--color-amber) 0%, #d97706 100%)', boxShadow: '0 4px 15px var(--color-amber-glow)' }}>
                ← ダッシュボードに戻る
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
