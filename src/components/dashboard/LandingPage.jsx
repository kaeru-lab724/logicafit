import React from 'react';
import { Sparkles, KeyRound } from 'lucide-react';

export default function LandingPage({
  showCTA,
  playSound,
  setActiveGame,
  handleRestoreSpell,
  spellInput,
  setSpellInput,
  spellError
}) {
  return (
    <div className="landing-container">
      {/* ① 新規向けHero（高インパクト・コピー） */}
      <div className={`glass-panel landing-hero ${showCTA ? 'hero-cta' : 'hero-no-cta'}`}>
        <div className="scan-bg-glow"></div>
        <div className="landing-badge-wrapper">
          <span className="game-badge landing-badge">
            🔬 COGNITIVE TRAINING SYSTEM
          </span>
        </div>
        <h1 className="text-glow landing-title">
          「なぜか話が噛み合わない…」<br />その脳内のクセ、スキャンしませんか？
        </h1>
        <p className="landing-desc">
          LogicaFit（ロジカフィット）は、思考スキャン診断であなたの考え方の偏りを可視化し、<br className="desktop-only" />
          ゲーム感覚で思考力を高め、頭の整理をサポートする総合思考トレーニングシステムです。
        </p>
        {showCTA && (
          <div className="landing-cta-wrapper">
            <button 
              onClick={() => { playSound('click'); setActiveGame('diagnostic'); }} 
              className="btn btn-primary landing-cta-btn"
            >
              <span>🧠 思考スキャン診断をはじめる</span>
            </button>
          </div>
        )}
      </div>

      {/* ② 脳内の「思考バグ」共感エリア (Pain Points) */}
      <div className="glass-panel landing-section-panel">
        <h2 className="landing-section-title">
          日常生活や仕事で、こんな「思考のクセ」ありませんか？
        </h2>
        <p className="landing-section-subtitle">
          私たちは無意識のうちに、自分特有の認知バイアス（思考の偏り）を身につけてしまっています。
        </p>
        
        <div className="landing-pain-grid">
          <div className="landing-pain-card">
            <span className="landing-pain-icon">💥</span>
            <h3 className="landing-pain-card-title">
              ロジハラ型（正論エラー）
            </h3>
            <p className="landing-pain-card-desc">
              「正しいこと（正論）」を言っているはずなのに、なぜか相手の反発を招いたり、人間関係をぎくしゃくさせてしまう偏り。
            </p>
          </div>

          <div className="landing-pain-card">
            <span className="landing-pain-icon">👴</span>
            <h3 className="landing-pain-card-title">
              昭和バイアス（過去基準エラー）
            </h3>
            <p className="landing-pain-card-desc">
              「自分の若い頃は〜」「普通は〜」と、無意識のうちに過去の精神論やマイルールを現在の環境に押し付けてしまう偏り。
            </p>
          </div>

          <div className="landing-pain-card">
            <span className="landing-pain-icon">📱</span>
            <h3 className="landing-pain-card-title">
              令和バイアス（効率過信エラー）
            </h3>
            <p className="landing-pain-card-desc">
              合理性やタイパ（時間対効果）を極端に重視するあまり、相手の感情を置いてけぼりにして対話を壊してしまう偏り。
            </p>
          </div>
        </div>
      </div>

      {/* ③ 得られるメリット (Benefits/Values) */}
      <div className="glass-panel landing-section-panel">
        <h2 className="landing-section-title">
          LogicaFitで鍛える「4つの思考・感情の軸」
        </h2>
        <p className="landing-section-subtitle">
          診断結果から思考力パラメーターをレーダーチャートで可視化。自分の特徴を見極め、各ルームで効果的なトレーニングを行います。
        </p>
        
        <div className="landing-features-grid">
          <div className="landing-feature-card">
            <div className="landing-feature-icon-wrapper color-cyan-bg">📊</div>
            <div>
              <h4 className="landing-feature-title">ロジカル思考（事実と結論の整理）</h4>
              <p className="landing-feature-desc">個人の「意見・解釈」と客観的な「事実」を正しく切り分け、飛躍のないクリアな筋道を組み立てる力。</p>
            </div>
          </div>

          <div className="landing-feature-card">
            <div className="landing-feature-icon-wrapper color-rose-bg">🔍</div>
            <div>
              <h4 className="landing-feature-title">クリティカル思考（バイアスと誤謬の検知）</h4>
              <p className="landing-feature-desc">相手の論点すり替えや、自分自身の無意識の歪みに素早く気づき、詭弁やヘリくつをスッキリ見抜く力。</p>
            </div>
          </div>

          <div className="landing-feature-card">
            <div className="landing-feature-icon-wrapper color-amber-bg">🌳</div>
            <div>
              <h4 className="landing-feature-title">ラディカル思考（本質的な課題のMECE分解）</h4>
              <p className="landing-feature-desc">複雑な重要問題を漏れなくダブりなく（MECE）因数分解し、真のボトルネックを見つけ出す構造化能力。</p>
            </div>
          </div>

          <div className="landing-feature-card">
            <div className="landing-feature-icon-wrapper color-primary-bg">🤝</div>
            <div>
              <h4 className="landing-feature-title">エモーショナル思考（共感と受容の傾聴）</h4>
              <p className="landing-feature-desc">正論で論破するのではなく、相手の感情に優しく寄り添うことで、深い信頼関係を築く力。</p>
            </div>
          </div>
        </div>
      </div>

      {/* ④ 3 STEP PLAY GUIDE CONTAINER */}
      <div className="glass-panel landing-section-panel text-center">
        <h2 className="landing-step-main-title">
          <Sparkles size={18} className="color-cyan-icon" />
          思考力を鍛えて整える 3 STEP
        </h2>
        <div className="landing-steps-container">
          {/* Step 1 */}
          <div className="landing-step-card">
            <div className="landing-step-badge step-1-badge">
              STEP 01
            </div>
            <h3 className="landing-step-title">
              🧠 思考をスキャンする
            </h3>
            <p className="landing-step-desc">
              「思考スキャン診断」を受け、あなたの思考の偏り（ロジカル、クリティカル、ラディカル、エモーショナル）を可視化します。
            </p>
          </div>

          {/* Step 2 */}
          <div className="landing-step-card">
            <div className="landing-step-badge step-2-badge">
              STEP 02
            </div>
            <h3 className="landing-step-title">
              🎯 弱点をトレーニングする
            </h3>
            <p className="landing-step-desc">
              診断で見つかった「思考のクセ（弱点）」を克服するトレーニングゲーム（事実vs意見、誤謬特定など）に挑戦します。
            </p>
          </div>

          {/* Step 3 */}
          <div className="landing-step-card">
            <div className="landing-step-badge step-3-badge">
              STEP 03
            </div>
            <h3 className="landing-step-title">
              🚀 思考力をアップデート
            </h3>
            <p className="landing-step-desc">
              トレーニングのベストスコアが蓄積され、パラメータ（レーダーチャート）とあなたの「進化クラス（肩書き）」が成長します。
            </p>
          </div>
        </div>
      </div>

      {/* Spell entry for returning users */}
      {showCTA && (
        <div className="landing-import-wrapper">
          <div className="glass-panel landing-import-panel">
            <h3 className="landing-import-title">
              <KeyRound size={16} className="color-primary-icon" />
              ブレインコードをインポートしてデータを復元
            </h3>
            <form onSubmit={handleRestoreSpell} className="landing-import-form">
              <input 
                type="text" 
                value={spellInput}
                onChange={(e) => setSpellInput(e.target.value)}
                placeholder="英数字12文字を入力"
                className="landing-import-input"
              />
              <button type="submit" className="btn btn-primary landing-import-submit-btn">
                インポート
              </button>
            </form>
            {spellError && <p className="landing-import-error">❌ {spellError}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
