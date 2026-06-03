import React from 'react';
import { BookOpen, Lock, Unlock } from 'lucide-react';

export default function BugLibrary({
  activeTab,
  librarySubTab,
  setLibrarySubTab,
  gameState,
  skillsData,
  diagnosticTypes,
  selectedBugId,
  setSelectedBugId,
  playSound,
  isMobile
}) {
  if (activeTab !== 'encyclopedia') return null;

  const unlockedCount = (gameState.unlockedTypes || ["balancedThinker"]).length;
  const totalBugs = Object.keys(diagnosticTypes).length;
  const unlockedSkillsCount = skillsData.filter(skill => (gameState.scores[skill.id] || 0) >= 80).length;

  return (
    <div className="library-container fade-in">
      <section className="library-section">
        {/* Title of 脳内図鑑 */}
        <div className="library-header">
          <h2 className="library-title">
            <BookOpen size={20} className="color-primary-icon" />
            脳内図鑑
          </h2>
          
          {/* Sub-tab Navigation */}
          <div className="library-tabs">
            <button
              onClick={() => { playSound('click'); setLibrarySubTab('bug'); }}
              className={`btn library-tab-btn ${librarySubTab === 'bug' ? 'active' : ''}`}
            >
              🐛 脳内バグ ({unlockedCount}/{totalBugs})
            </button>
            <button
              onClick={() => { playSound('click'); setLibrarySubTab('skill'); }}
              className={`btn library-tab-btn ${librarySubTab === 'skill' ? 'active' : ''}`}
            >
              💡 思考スキル ({unlockedSkillsCount}/{skillsData.length})
            </button>
          </div>
        </div>

        {librarySubTab === 'bug' ? (
          /* 脳内バグ図鑑のコンテンツ */
          <div className="fade-in">
            <p className="library-intro-text">
              診断や他人のスキャン、相性チェック（コード共有）によって見つかった思考バグのタイプがここに記録されます。
              他人のブレインコードを入力するか、他者スキャンを行うことで図鑑が埋まっていきます。
            </p>

            <div className="grid-training-responsive">
              {Object.values(diagnosticTypes).map((type) => {
                const isUnlocked = (gameState.unlockedTypes || ["balancedThinker"]).includes(type.id);
                const isSelected = selectedBugId === type.id;

                return (
                  <div 
                    key={type.id}
                    className={`glass-panel library-bug-card ${isUnlocked ? 'unlocked' : 'locked'} ${isSelected ? 'selected' : ''}`}
                    onClick={() => {
                      if (isUnlocked) {
                        playSound('click');
                        setSelectedBugId(isSelected ? null : type.id);
                      }
                    }}
                    style={{
                      borderLeft: isUnlocked ? `4px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-cyan)'}` : '4px solid var(--border-color)',
                    }}
                  >
                    <div className="library-bug-header">
                      <span className={`library-bug-emoji ${isUnlocked ? '' : 'grayscale'}`}>
                        {isUnlocked ? type.emoji : '🔒'}
                      </span>
                      <div>
                        <h3 className={`library-bug-name ${isUnlocked ? '' : 'text-muted'}`}>
                          {isUnlocked ? type.name : '未確認の脳内バグ (???)'}
                        </h3>
                        {isUnlocked && (
                          <p className="library-bug-tagline">
                            {type.tagline}
                          </p>
                        )}
                      </div>
                    </div>

                    <p className="library-bug-desc">
                      {isUnlocked 
                        ? (type.description.length > 80 && !isSelected ? `${type.description.slice(0, 80)}...` : type.description)
                        : '他人のスキャンやコード入力（相性チェック）を行うとアンロックされます。'
                      }
                    </p>

                    {/* アコーディオン詳細情報 */}
                    {isUnlocked && isSelected && (
                      <div 
                        className="library-bug-details fade-in"
                        onClick={(e) => e.stopPropagation()} // 親のクリックイベントを防ぐ
                      >
                        <div className="library-detail-block">
                          <span className="library-detail-label color-cyan">💼 仕事でのバグ</span>
                          <p className="library-detail-text">{type.workBug}</p>
                        </div>
                        <div className="library-detail-block">
                          <span className="library-detail-label color-rose">🏡 私生活でのバグ</span>
                          <p className="library-detail-text">{type.privateBug}</p>
                        </div>
                        <div className="library-detail-block">
                          <span className="library-detail-label color-amber">⚡ ふとした瞬間のクセ</span>
                          <p className="library-detail-text">{type.dailyHabit}</p>
                        </div>
                        <div className="library-detail-block torisetsu-block">
                          <span className="library-detail-label color-emerald block-label">📋 取扱説明書</span>
                          <span className="library-sub-label color-rose">● 地雷ポイント</span>
                          <p className="library-detail-text label-spacing">{type.torisetsu.jealousPoint}</p>
                          <span className="library-sub-label color-emerald">● デバッグコマンド</span>
                          <p className="library-detail-text">{type.torisetsu.debugSpell}</p>
                        </div>
                        {type.recommendedGame && (
                          <div className="library-detail-block recommended-block">
                            <span className="library-detail-label color-primary">🎯 推奨デバッグトレーニング</span>
                            <p className="library-detail-text">{type.recommendedReason}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* 思考スキル図鑑のコンテンツ */
          <div className="fade-in">
            <p className="library-intro-text">
              習得した思考スキルの概念と、それを日常生活や仕事でどう活用すべきかの実践的なアプローチを学べる解説書です。
              各スキルのトレーニングでベストスコア80%以上を獲得すると、解説ページがアンロックされます。
            </p>

            <div className="grid-skills-responsive">
              {skillsData.map((skill) => {
                const score = gameState.scores[skill.id] || 0;
                const isUnlocked = score >= 80;

                return (
                  <div 
                    key={skill.id}
                    className={`glass-panel skill-card ${isUnlocked ? 'unlocked' : 'locked'} dashboard-responsive-panel`}
                    style={{ 
                      borderLeftColor: isUnlocked ? 'var(--color-primary)' : 'var(--border-color)',
                      opacity: isUnlocked ? 1 : 0.6
                    }}
                  >
                    <div className="skill-card-header">
                      <div className="skill-card-title-group">
                        {isUnlocked ? (
                          <Unlock size={18} className="color-primary-icon" />
                        ) : (
                          <Lock size={18} className="text-muted-icon" />
                        )}
                        <h3 className={`skill-card-title ${isUnlocked ? '' : 'text-secondary'}`}>
                          {skill.name}
                        </h3>
                      </div>
                      <div className="skill-progress-group">
                        <div className="skill-progress-bar-bg">
                          <div 
                            className="skill-progress-bar-fill"
                            style={{ 
                              width: `${score}%`, 
                              background: isUnlocked ? 'var(--color-primary)' : 'var(--text-muted)'
                            }} 
                          />
                        </div>
                        <span className={`skill-progress-label ${isUnlocked ? 'unlocked' : 'locked'}`}>
                          {isUnlocked ? '習得完了' : `進捗 ${score}/80%`}
                        </span>
                      </div>
                    </div>

                    <p className="skill-card-desc">
                      {skill.desc}
                    </p>

                    {isUnlocked ? (
                      <div className="skill-application-box fade-in">
                        <strong className="skill-application-title">
                          💡 現実社会での具体的な活かし方:
                        </strong>
                        <div className="skill-application-grid">
                          <div>
                            <span className="skill-application-type">【仕事・学業】</span>
                            <p className="skill-application-desc">{skill.lifeApplication.work}</p>
                          </div>
                          <div>
                            <span className="skill-application-type">【プライベート】</span>
                            <p className="skill-application-desc">{skill.lifeApplication.private}</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="skill-locked-notice">
                        ※このスキルトレーニングで80%以上のベストスコアを獲得すると、解説書がアンロックされます。
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
