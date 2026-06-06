import React from 'react';
import { Copy } from 'lucide-react';

export default function FrictionMatcher({
  currentSpell,
  opponentSpell,
  setOpponentSpell,
  matchResult,
  matchError,
  handleCheckFriction,
  onCopyClick,
  handleShareToX
}) {
  return (
    <div className="matcher-container">
      {/* 脳内摩擦係数（相性）チェック (Friction Coefficient Matcher) */}
      <div className="glass-panel matcher-panel">
        <div>
          <div className="landing-badge-wrapper">
            <span className="game-badge matcher-badge">
              ⚡ BI-DIRECTIONAL FRICTION CHECKER
            </span>
          </div>
          <h2 className="matcher-title">
            脳内摩擦係数（相性）チェック
          </h2>
          <p className="matcher-desc">
            あなたと相手の「ブレインコード」を噛み合わせ、思考ギアの摩擦係数（0〜100%）と取扱説明書を算出します。
          </p>

          <form onSubmit={handleCheckFriction} className="matcher-form">
            {/* Your Spell Box */}
            <div className="matcher-field">
              <span className="matcher-label">▼ あなたのブレインコード（コピーして相手に共有）</span>
              <div className="matcher-input-group">
                <input 
                  type="text" 
                  readOnly 
                  value={currentSpell} 
                  className="matcher-input read-only"
                />
                <button 
                  type="button" 
                  onClick={onCopyClick}
                  className="btn btn-secondary matcher-copy-btn" 
                  title="ブレインコードをコピー"
                >
                  <Copy size={14} />
                </button>
              </div>
            </div>

            {/* Opponent Spell Box */}
            <div className="matcher-field">
              <span className="matcher-label focus-label">▼ 相手のブレインコードを入力</span>
              <input 
                type="text" 
                value={opponentSpell} 
                onChange={(e) => setOpponentSpell(e.target.value)}
                placeholder="相手のコードを入力"
                className="matcher-input"
              />
            </div>

            <button type="submit" className="btn btn-primary matcher-submit-btn">
              ⚡ 摩擦係数を測定する
            </button>
          </form>

          {matchError && <p className="matcher-error">❌ {matchError}</p>}
        </div>

        {/* Match Result Display */}
        {matchResult && (
          <div className="match-result-box">
            <div className="match-result-header">
              <span className="match-result-pair">計測結果：{matchResult.pairName}</span>
              <span className="match-result-friction">
                摩擦係数 {matchResult.friction}%
              </span>
            </div>
            
            {/* Friction meter bar */}
            <div className="friction-bar-container">
              <div 
                className="friction-bar-fill"
                style={{ width: `${matchResult.friction}%` }}
              />
            </div>

            <p className="match-result-desc">
              {matchResult.description}
            </p>

            <div className="match-result-advice-box">
              <span className="match-result-advice-label">💡 二人のデバッグアドバイス</span>
              <p className="match-result-advice-text">{matchResult.advice}</p>
            </div>

            <button 
              onClick={() => handleShareToX(`⚡ 二人の「脳内摩擦係数」をスキャンしました！\n結果：【${matchResult.pairName}】\n激突度：【${matchResult.friction}%】\n\n診断＆相性チェックはこちら👇\n#脳内摩擦係数 #思考スキャン診断 #ブレインコード #LogicaFit`)}
              className="btn btn-secondary match-share-btn"
            >
              𝕏 に同期結果をシェアする
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
