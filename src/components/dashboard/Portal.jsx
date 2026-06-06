import React from 'react';
import { Brain, BookOpen, Lock, Sparkles } from 'lucide-react';

export default function Portal({ onSelectView, playSound }) {
  const cards = [
    {
      id: 'logicafit',
      title: 'LogicaFit',
      subtitle: 'TRAINING & DIAGNOSTICS: 思考トレーニング＆論理診断',
      description: '考え方の偏りや推論のゆがみをチェックする13の思考トレーニング。クイズ形式で楽しみながら、自分の「思考力パラメーター」を可視化・診断できます。',
      icon: Sparkles,
      themeColor: '#10b981', // green
      glowColor: 'rgba(16, 185, 129, 0.25)',
      status: 'ACTIVE',
      actionText: 'トレーニング＆診断ルームへ'
    },
    {
      id: 'logijournal',
      title: 'LogiJournal',
      subtitle: 'MIND WRITING & TUNING: 思考の書き出し＆整理ノート',
      description: '頭の中のモヤモヤや悩み事をそのまま書き出し、客観的な事実と次のアクションにスッキリ整理するノート。心のバランスを整え、次の一歩をサポートします。',
      icon: BookOpen,
      themeColor: '#06b6d4', // cyan
      glowColor: 'rgba(6, 182, 212, 0.25)',
      status: 'ACTIVE',
      actionText: '整理ノートを開く'
    }
  ];

  const handleSelect = (id) => {
    if (id === 'research') return;
    playSound('click');
    onSelectView(id);
  };

  return (
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '48px 24px',
      minHeight: '85vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '32px'
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '16px' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          padding: '6px 16px',
          borderRadius: '20px',
          fontSize: '11px',
          letterSpacing: '2px',
          color: 'var(--text-muted)',
          marginBottom: '16px'
        }}>
          <Brain size={12} />
          <span>THOUGHT TRAINING & TUNING LAB</span>
        </div>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '32px',
          fontWeight: 'bold',
          color: 'var(--text-primary)',
          letterSpacing: '-0.5px',
          margin: '0 0 12px 0'
        }}>
          LogicaFit Portal
        </h1>
        <p style={{
          fontSize: '14px',
          color: 'var(--text-secondary)',
          maxWidth: '560px',
          margin: '0 auto',
          lineHeight: '1.6'
        }}>
          クイズ形式で考え方の偏りを鍛える「思考トレーニング＆診断（LogicaFit）」と、頭のモヤモヤを書き出してスッキリ整理する「思考整理ノート（LogiJournal）」。2つのアプローチで、あなたの思考の調律をサポートします。
        </p>
      </div>

      {/* Grid Layout */}
      <div className="portal-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '24px',
        width: '100%',
        maxWidth: '1080px',
        marginTop: '16px'
      }}>
        {cards.map((card) => {
          const IconComponent = card.icon;
          const isActive = card.status === 'ACTIVE';

          return (
            <div
              key={card.id}
              onClick={() => handleSelect(card.id)}
              className={`glass-panel portal-card ${isActive ? 'active-card' : 'locked-card'}`}
              style={{
                padding: '32px',
                borderRadius: '16px',
                background: 'var(--hero-bg)',
                border: '1px solid var(--border-color)',
                textAlign: 'left',
                cursor: isActive ? 'pointer' : 'not-allowed',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: '280px',
                position: 'relative',
                overflow: 'hidden',
                opacity: isActive ? 1 : 0.6
              }}
              onMouseEnter={(e) => {
                if (isActive) {
                  e.currentTarget.style.borderColor = card.themeColor;
                  e.currentTarget.style.boxShadow = `0 12px 30px ${card.glowColor}`;
                  e.currentTarget.style.transform = 'translateY(-4px)';
                }
              }}
              onMouseLeave={(e) => {
                if (isActive) {
                  e.currentTarget.style.borderColor = '';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.transform = 'none';
                }
              }}
            >
              {/* Card Glow Effect */}
              {isActive && (
                <div style={{
                  position: 'absolute',
                  top: '-50px',
                  right: '-50px',
                  width: '120px',
                  height: '120px',
                  background: card.themeColor,
                  filter: 'blur(60px)',
                  opacity: 0.15,
                  pointerEvents: 'none'
                }} />
              )}

              <div>
                {/* Header Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: isActive ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0.01)',
                    border: `1px solid ${isActive ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.03)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isActive ? card.themeColor : 'var(--text-muted)'
                  }}>
                    <IconComponent size={24} />
                  </div>
                  <span style={{
                    fontSize: '9px',
                    fontWeight: 'bold',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    background: isActive ? `rgba(${card.id === 'logicafit' ? '16, 185, 129' : '6, 182, 212'}, 0.1)` : 'rgba(255, 255, 255, 0.03)',
                    color: isActive ? card.themeColor : 'var(--text-muted)',
                    border: `1px solid ${isActive ? 'rgba(255, 255, 255, 0.05)' : 'transparent'}`,
                    letterSpacing: '1px'
                  }}>
                    {card.status}
                  </span>
                </div>

                {/* Info */}
                <h3 style={{
                  fontSize: '20px',
                  fontWeight: 'bold',
                  color: 'var(--text-primary)',
                  margin: '0 0 4px 0'
                }}>
                  {card.title}
                </h3>
                <span style={{
                  fontSize: '11px',
                  color: card.themeColor,
                  fontWeight: '600',
                  display: 'block',
                  marginBottom: '12px'
                }}>
                  {card.subtitle}
                </span>
                <p style={{
                  fontSize: '12.5px',
                  color: 'var(--text-secondary)',
                  lineHeight: '1.6',
                  margin: 0
                }}>
                  {card.description}
                </p>
              </div>

              {/* Action Button */}
              <div style={{ marginTop: '24px' }}>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                  borderBottom: `2px solid ${isActive ? card.themeColor : 'transparent'}`,
                  paddingBottom: '2px',
                  transition: 'all 0.2s ease'
                }}>
                  {card.actionText} →
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
