import React from 'react';
import { Sparkles, Lock } from 'lucide-react';

export default function BadgeModal({
  showBadgeModal,
  setShowBadgeModal,
  selectedBadgeIndex,
  badgeDetails,
  gameState,
  copiedBadgeIdx,
  setCopiedBadgeIdx,
  playSound,
  handleShareToX
}) {
  if (!showBadgeModal || selectedBadgeIndex === null) return null;

  const badge = badgeDetails[selectedBadgeIndex];
  const isUnlocked = gameState?.badges?.[selectedBadgeIndex];

  return (
    <div className="modal-overlay" onClick={() => setShowBadgeModal(false)}>
      <div 
        className="modal-content glass-panel badge-modal-content" 
        onClick={(e) => e.stopPropagation()}
        style={{ 
          boxShadow: isUnlocked 
            ? `0 20px 40px rgba(0, 0, 0, 0.55), 0 0 30px rgba(${badge.colorRgb}, 0.15)` 
            : '0 20px 40px rgba(0, 0, 0, 0.55)'
        }}
      >
        {/* Close Button */}
        <button 
          onClick={() => setShowBadgeModal(false)}
          className="badge-close-btn"
        >
          &times;
        </button>

        {/* Badge Icon */}
        <div 
          className={`badge-icon-box ${isUnlocked ? 'unlocked' : 'locked'}`}
          style={{ 
            border: isUnlocked ? `1px solid ${badge.color}` : '1px solid var(--border-color)',
            background: isUnlocked ? `rgba(${badge.colorRgb}, 0.08)` : 'rgba(255, 255, 255, 0.02)',
            boxShadow: isUnlocked ? `0 0 20px rgba(${badge.colorRgb}, 0.25)` : 'none',
            color: isUnlocked ? badge.color : 'var(--text-badge-locked)'
          }}
        >
          {isUnlocked ? <Sparkles size={36} /> : <Lock size={36} />}
        </div>

        {/* Badge Title */}
        <h2 className="badge-modal-title">
          {isUnlocked ? badge.title : '未確認の実績バッジ'}
        </h2>
        
        <span 
          className="badge-modal-tagline"
          style={{ 
            color: isUnlocked ? badge.color : 'var(--text-muted)', 
            background: isUnlocked ? `rgba(${badge.colorRgb}, 0.1)` : 'rgba(255,255,255,0.05)'
          }}
        >
          {isUnlocked ? badge.tagline : 'ロックされています'}
        </span>

        {/* Condition / How to Unlock */}
        <p className="badge-modal-condition">
          解放条件：<strong>{badge.desc}</strong>
        </p>

        {isUnlocked ? (
          /* Unlocked: Show Real-world meaning & Cheat Sheet phrase */
          <div className="badge-unlocked-details">
            {/* Real-world Benefit */}
            <div className="badge-benefit-box">
              <span className="badge-benefit-label" style={{ color: badge.color }}>
                💼 現実世界での効果・戦闘力：
              </span>
              <p className="badge-benefit-text">
                {badge.benefit}
              </p>
            </div>

            {/* Cheat Sheet copy card */}
            <div className="badge-cheat-sheet" style={{ border: `1px dashed ${badge.color}` }}>
              <span className="badge-cheat-sheet-label">
                💬 日常のコミュニケーションでそのまま使える特効薬ワード：
              </span>
              <p className="badge-cheat-sheet-text">
                {badge.template}
              </p>
              
              <div className="badge-action-buttons">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(badge.template);
                    playSound('correct');
                    setCopiedBadgeIdx(selectedBadgeIndex);
                    setTimeout(() => setCopiedBadgeIdx(null), 2000);
                  }}
                  className="btn btn-primary badge-copy-btn"
                  style={{
                    background: `linear-gradient(135deg, ${badge.color} 0%, var(--color-primary) 100%)`,
                    boxShadow: `0 4px 12px rgba(${badge.colorRgb}, 0.2)`
                  }}
                >
                  {copiedBadgeIdx === selectedBadgeIndex ? '✅ コピー完了！' : '📋 テンプレートをコピー'}
                </button>
                
                <button
                  onClick={() => {
                    const tweetText = `🏆 「LogiFit」で実績【${badge.title}】を獲得！\n「${badge.tagline}」スキルをマスターしました。\n👉 特効薬フレーズ：\n${badge.template}\n\n#LogiFit #思考デバッグ`;
                    handleShareToX(tweetText);
                  }}
                  className="btn btn-secondary badge-share-btn"
                >
                  𝕏 でシェアする
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Locked: Show shortcut to play the game */
          <div className="badge-locked-actions">
            <button
              onClick={() => {
                playSound('click');
                setShowBadgeModal(false);
                document.getElementById('training-menu')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="btn btn-primary badge-menu-link-btn"
            >
              🎯 トレーニングメニューに移動する
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
