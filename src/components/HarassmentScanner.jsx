import React, { useState, useEffect, useRef } from 'react';
import { determineDiagnosticType } from '../data/diagnosticData';
import { 
  Sparkles, 
  Send, 
  RefreshCw, 
  Share2, 
  ArrowRight, 
  Brain, 
  User, 
  ShieldAlert,
  Flame,
  Coffee,
  HelpCircle
} from 'lucide-react';

const SCANNER_QUESTIONS = [
  {
    id: 1,
    scenario: "部下が「すみません、クライアントに提出する資料に重大な誤字がありました」と報告してきました。あなたの最初の言葉は？",
    choices: [
      {
        text: "「なぜダブルチェックしなかった？ 根本原因をなぜなぜ分析して、再発防止策を今日中にドキュメント化しなさい」",
        type: "L",
        scores: { L: 35, C: 0, R: 0, E: 0 },
        comment: "合理性で即座に正論を突きつけるデバッグ命令。"
      },
      {
        text: "「たるんでるんじゃない？ 最近の若手は緊張感が足りない。次は気合を入れて見直しなさい」",
        type: "S",
        scores: { L: 0, C: 15, R: 15, E: 0 },
        comment: "精神論と昔の基準で査定するヴィンテージ・バグ。"
      },
      {
        text: "「正直に報告してくれてありがとう。まずはクライアントへの謝罪と修正版の送付を最優先しよう。一緒にチェックするよ」",
        type: "E",
        scores: { L: 0, C: 0, R: 0, E: 35 },
        comment: "感情の安全を第一に考える共感のハグ。"
      },
      {
        text: "「あー、そうなんだ。まあ適当に修正して、いい感じに送っておいて」",
        type: "A",
        scores: { L: 5, C: 5, R: 5, E: 5 },
        comment: "思考のノイズを嫌い、その場の流れに委ねる野生アプローチ。"
      }
    ]
  },
  {
    id: 2,
    scenario: "パートナーから「今日、職場で理不尽なことで怒られて本当に落ち込んじゃって…」とLINEが来ました。あなたの返信は？",
    choices: [
      {
        text: "「それ、君の側にも何か原因があったんじゃない？ 相手の主張の矛盾を整理して対策（予防策）を打つべきだよ」",
        type: "L",
        scores: { L: 35, C: 0, R: 0, E: 0 },
        comment: "相談相手に逃げ道を与えない絶対零度の客観アドバイス。"
      },
      {
        text: "「社会に出れば理不尽なことばかりだよ。俺の若い頃なんてもっと酷かった。我慢も成長のうちさ」",
        type: "S",
        scores: { L: 0, C: 15, R: 15, E: 0 },
        comment: "自分語りと忍耐を求める生存バイアス型バグ。"
      },
      {
        text: "「それは本当に理不尽だね。一生懸命やってるのにそんな言われ方されたら、落ち込んで当然だよ。今日美味しいものでも食べよう」",
        type: "E",
        scores: { L: 0, C: 0, R: 0, E: 35 },
        comment: "正論を抜きにしてまず相手の味方になる共感シンクロ。"
      },
      {
        text: "「そっか、大変だったね（テレビやスマホを見ながら、スタンプを一つ返しておく）」",
        type: "A",
        scores: { L: 5, C: 5, R: 5, E: 5 },
        comment: "葛藤のエネルギーを使わず、脳内をスリープに保つスルー術。"
      }
    ]
  },
  {
    id: 3,
    scenario: "若手社員が「この毎朝15分の全員朝礼、無駄なので廃止しませんか？ チャット連絡で十分です」と提案してきました。どう思う？",
    choices: [
      {
        text: "「『無駄』は君の主観だ。廃止によって削減される時間と、失われるコミュニケーションの質を天秤にかけた定量的エビデンスを出して」",
        type: "L",
        scores: { L: 35, C: 0, R: 0, E: 0 },
        comment: "事実とエビデンスを要求するファクト武装。"
      },
      {
        text: "「朝礼は一日の士気を高めるための重要な儀式だよ。みんなで顔を合わせることに意味があるんだ」",
        type: "S",
        scores: { L: 0, C: 15, R: 15, E: 0 },
        comment: "伝統や全体の空気を盾にする同調バイアス。"
      },
      {
        text: "「確かに朝忙しい時は無駄に感じちゃうこともあるよね。どうすればみんなが有意義に思えるか、一度やり方を見直してみようか」",
        type: "E",
        scores: { L: 0, C: 0, R: 0, E: 35 },
        comment: "提案者の不満に寄り添い、関係を円滑にする対話アプローチ。"
      },
      {
        text: "「まあ廃止でも継続でも、みんながやりたいように決めていいよ（特にこだわりはない）」",
        type: "A",
        scores: { L: 5, C: 5, R: 5, E: 5 },
        comment: "思考メモリの節約を最優先する強運の傍観。"
      }
    ]
  },
  {
    id: 4,
    scenario: "友人が「最近、物価が高すぎて全然貯金ができなくて、将来がとにかく不安なんだよね…」と嘆いています。あなたの脳内リアクションは？",
    choices: [
      {
        text: "「まず家計の固定費をMECEにスキャンした？ 格安SIMへの移行やサブスク解約など、ボトルネックを潰せば毎月3万円は浮くよ」",
        type: "L",
        scores: { L: 35, C: 0, R: 0, E: 0 },
        comment: "感情の嘆きを、ボトルネック解消タスクへと強制変換するロジック。"
      },
      {
        text: "「収入を増やすために副業をするか、もっと物欲を抑えて節約に耐える忍耐力を持つしかない。不安なのは行動が足りないからだよ」",
        type: "S",
        scores: { L: 0, C: 15, R: 15, E: 0 },
        comment: "甘えを許さず、自己責任と自助努力を突きつけるインスペクター。"
      },
      {
        text: "「本当に最近何でも値上がりして不安になるよね。普通にスーパーで買い物してるだけでも貯金が減っていく感じ、焦るのよくわかる」",
        type: "E",
        scores: { L: 0, C: 0, R: 0, E: 35 },
        comment: "将来の不安と焦りをそのまま受け止め、温度を合わせるエンパス。"
      },
      {
        text: "「まあ日本が沈没するわけじゃないし、なんとかなるんじゃない？（それより週末の予定を考えよう）」",
        type: "A",
        scores: { L: 5, C: 5, R: 5, E: 5 },
        comment: "根拠のない楽観で難局をスルーする強運の持ち主。"
      }
    ]
  },
  {
    id: 5,
    scenario: "部下が「最近、自分の仕事が社会にどう役立っているか分からなくなり、モチベーションが出ません」と悩んでいます。あなたなら？",
    choices: [
      {
        text: "「モチベーションは外的要因に依存するものではなく自己管理するもの。君のキャリアにおける目標（KGI）と現業務（KPI）を再定義しなさい」",
        type: "L",
        scores: { L: 35, C: 0, R: 0, E: 0 },
        comment: "悩むこと自体を非合理とバッサリ斬るプロ意識の押し付け。"
      },
      {
        text: "「仕事があるだけでありがたいと思わなきゃ。働かざる者食うべからずだよ。贅沢な悩みだ」",
        type: "S",
        scores: { L: 0, C: 15, R: 15, E: 0 },
        comment: "生存の義務を振りかざし、若手の抽象的悩みを封殺する頑固オヤジ。"
      },
      {
        text: "「そういう時期ってあるよね。自分の頑張りが誰に届いているか見えなくなると、虚しくなるよね。少し過去の成果を一緒に振り返ろう」",
        type: "E",
        scores: { L: 0, C: 0, R: 0, E: 35 },
        comment: "やりがいの喪失に共感し、一緒に目的の根っこ（R）を探すメンター。"
      },
      {
        text: "「まあ、給料はちゃんともらえてるんだから、そこまで難しく考えなくてもいいんじゃない？」",
        type: "A",
        scores: { L: 5, C: 5, R: 5, E: 5 },
        comment: "余計な思考深掘りをシャットアウトする野生の調律。"
      }
    ]
  }
];

export default function HarassmentScanner({ onSaveDiagnostic, onSelectGame, playSound }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [diagnosticResult, setDiagnosticResult] = useState(null);
  
  // チャット演出用
  const [typing, setTyping] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // 最初の質問をタイピング風に表示
    setTyping(true);
    const timer = setTimeout(() => {
      setTyping(false);
    }, 800);
    return () => clearTimeout(timer);
  }, [currentIdx]);

  useEffect(() => {
    // チャットの最下部へ自動スクロール
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [answers, typing]);

  const handleSelectChoice = (choice) => {
    playSound('click');
    const newAnswers = [...answers, {
      questionId: SCANNER_QUESTIONS[currentIdx].id,
      scenario: SCANNER_QUESTIONS[currentIdx].scenario,
      selectedText: choice.text,
      scores: choice.scores,
      type: choice.type,
      comment: choice.comment
    }];
    setAnswers(newAnswers);

    if (currentIdx < SCANNER_QUESTIONS.length - 1) {
      // 次の質問へ
      setCurrentIdx(currentIdx + 1);
    } else {
      // 診断（スキャン）開始
      runScanProcess(newAnswers);
    }
  };

  const runScanProcess = (finalAnswers) => {
    setIsScanning(true);
    playSound('compile');
    
    // スキャン進行演出（0〜100%）
    let progress = 0;
    const interval = setInterval(() => {
      progress += 5;
      setScanProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        
        // 合計スコアの算出
        const totalScores = finalAnswers.reduce((acc, curr) => {
          return {
            L: acc.L + curr.scores.L,
            C: acc.C + curr.scores.C,
            R: acc.R + curr.scores.R,
            E: acc.E + curr.scores.E
          };
        }, { L: 0, C: 0, R: 0, E: 0 });

        // 12タイプ診断ロジックの実行
        // diagnosticData の determineDiagnosticType は { L, C, R, E } を受け取る
        const resultType = determineDiagnosticType(totalScores);
        
        // 独自パラメータの算出 (表示用)
        const lCount = finalAnswers.filter(a => a.type === 'L').length;
        const sCount = finalAnswers.filter(a => a.type === 'S').length;
        const eCount = finalAnswers.filter(a => a.type === 'E').length;
        const aCount = finalAnswers.filter(a => a.type === 'A').length;

        const rojihaDegree = Math.round((lCount / 5) * 100);
        const showaDegree = Math.round((sCount / 5) * 100);
        const empathyDegree = Math.round((eCount / 5) * 100);

        setDiagnosticResult({
          type: resultType,
          scores: totalScores,
          breakdown: {
            rojiha: rojihaDegree,
            showa: showaDegree,
            empathy: empathyDegree,
            apathy: Math.round((aCount / 5) * 100)
          }
        });
        setIsScanning(false);
        playSound('success');
      }
    }, 100);
  };

  const handleShareResult = () => {
    if (!diagnosticResult) return;
    playSound('click');
    
    const { type, breakdown } = diagnosticResult;
    
    // 文字数節約のため5段階メーターに変更
    const getBar = (pct) => {
      const filled = Math.round(pct / 20);
      return '■'.repeat(filled) + '□'.repeat(5 - filled);
    };

    const shareText = `【脳内摩擦スキャン】私のバグタイプは【${type.emoji}${type.name}】！\n\nロジハラ度：${breakdown.rojiha}% [${getBar(breakdown.rojiha)}]\n昭和バイアス：${breakdown.showa}% [${getBar(breakdown.showa)}]\n\n正論で人をフリーズさせているバグを検知。\n#LogiFit #脳内摩擦スキャナー\n`;
    
    const appUrl = 'https://www.logifit.site/?mode=scan';
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(appUrl)}`;
    window.open(twitterUrl, '_blank', 'noopener,noreferrer');
  };

  const handleApplyToMain = () => {
    if (!diagnosticResult) return;
    playSound('click');
    
    // 診断結果を親ステート (LocalStorage) に保存
    // LCREの点数を 105点満点 (LogiFitのフル診断スケール) に適正化してマッピング
    const scale = 1.4; // 簡易診断(最大約75点)からフル診断(最大105点)へのマージン調整
    const mappedScores = {
      L: Math.min(105, Math.round(diagnosticResult.scores.L * scale)),
      C: Math.min(105, Math.round(diagnosticResult.scores.C * scale)),
      R: Math.min(105, Math.round(diagnosticResult.scores.R * scale)),
      E: Math.min(105, Math.round(diagnosticResult.scores.E * scale))
    };
    
    onSaveDiagnostic(mappedScores, diagnosticResult.type);
    
    // XPを獲得した扱いにして本体ダッシュボードへ遷移 (gameState.xp > 0にして全アンロックへ)
    // これにより、簡易スキャナーから本体に入ったユーザーは「初回デバッグ開始(全解放)」状態へシームレスに移行する
    onSelectGame(null);
  };

  // チャット進行の描画
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '16px' }}>
      
      {/* HEADER */}
      <div 
        className="glass-panel" 
        style={{ 
          padding: '20px', 
          borderRadius: '16px', 
          marginBottom: '24px', 
          textAlign: 'center',
          borderLeft: '4px solid var(--color-primary)'
        }}
      >
        <h1 style={{ fontSize: '24px', fontWeight: '800', margin: '0 0 8px', fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <Brain style={{ color: 'var(--color-primary)' }} /> 脳内摩擦スキャナー
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: 0 }}>
          良かれと思って言った「正論」が、誰かをフリーズさせていませんか？ あなたの脳に潜むバグを30秒で透視します。
        </p>
      </div>

      {/* DIAGNOSTIC CONTAINER */}
      {!diagnosticResult && !isScanning && (
        <div className="glass-panel" style={{ borderRadius: '24px', padding: '24px', minHeight: '400px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          
          {/* Chat Window */}
          <div style={{ flex: 1, overflowY: 'auto', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {answers.map((ans, idx) => (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {/* 質問側 */}
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <div style={{ background: 'var(--bg-inner-box)', border: '1px solid var(--border-color)', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Brain size={16} style={{ color: 'var(--color-primary)' }} />
                  </div>
                  <div className="glass-panel" style={{ padding: '12px 16px', borderRadius: '4px 16px 16px 16px', maxWidth: '85%', fontSize: '14px', background: 'rgba(255,255,255,0.01)' }}>
                    <strong>Q{idx + 1}:</strong> {ans.scenario}
                  </div>
                </div>
                {/* 回答側 */}
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', justifyContent: 'flex-end' }}>
                  <div className="glass-panel" style={{ padding: '12px 16px', borderRadius: '16px 4px 16px 16px', maxWidth: '85%', fontSize: '14px', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', color: 'var(--text-primary)', textAlign: 'right' }}>
                    {ans.selectedText}
                  </div>
                  <div style={{ background: 'var(--color-primary-glow)', border: '1px solid var(--color-primary)', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <User size={16} style={{ color: '#fff' }} />
                  </div>
                </div>
              </div>
            ))}

            {/* 現在のアクティブな質問 */}
            {currentIdx < SCANNER_QUESTIONS.length && (
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <div style={{ background: 'var(--bg-inner-box)', border: '1px solid var(--border-color)', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Brain size={16} style={{ color: 'var(--color-primary)' }} />
                </div>
                {typing ? (
                  <div className="glass-panel" style={{ padding: '12px 16px', borderRadius: '4px 16px 16px 16px', display: 'flex', gap: '4px', alignItems: 'center' }}>
                    <span className="dot-pulse">入力中...</span>
                  </div>
                ) : (
                  <div className="glass-panel" style={{ padding: '12px 16px', borderRadius: '4px 16px 16px 16px', maxWidth: '85%', fontSize: '14px', borderLeft: '3px solid var(--color-primary)' }}>
                    <strong>Q{currentIdx + 1}:</strong> {SCANNER_QUESTIONS[currentIdx].scenario}
                  </div>
                )}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Choices selector */}
          {!typing && currentIdx < SCANNER_QUESTIONS.length && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {SCANNER_QUESTIONS[currentIdx].choices.map((choice, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectChoice(choice)}
                  className="btn btn-secondary"
                  style={{ 
                    textAlign: 'left', 
                    padding: '14px 20px', 
                    fontSize: '13px', 
                    lineHeight: '1.4',
                    borderRadius: '12px',
                    width: '100%',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-inner-box)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-primary)';
                    e.currentTarget.style.background = 'rgba(139, 92, 246, 0.03)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                    e.currentTarget.style.background = 'var(--bg-inner-box)';
                  }}
                >
                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '8px', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 'bold', fontSize: '12px', color: 'var(--text-muted)' }}>
                    {idx + 1}
                  </div>
                  <span>{choice.text}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SCANNING LOADING SCREEN */}
      {isScanning && (
        <div className="glass-panel" style={{ borderRadius: '24px', padding: '60px 24px', textAlign: 'center', minHeight: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '24px' }}>
          <div style={{ position: 'relative', width: '80px', height: '80px' }}>
            <div className="pulse-ring" style={{ position: 'absolute', width: '100%', height: '100%', borderRadius: '50%', border: '2px solid var(--color-primary)', animation: 'pulse 1.5s infinite' }}></div>
            <div style={{ position: 'absolute', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Brain size={40} className="spinning-icon" style={{ color: 'var(--color-primary)' }} />
            </div>
          </div>
          <div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: '800', margin: '0 0 8px' }}>
              脳内スキャン実行中...
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: 0 }}>
              思考データの矛盾、認知の歪み、昭和バイアスを計算しています。
            </p>
          </div>
          {/* Progress Bar */}
          <div style={{ width: '100%', maxWidth: '300px', height: '4px', background: 'var(--border-color)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ width: `${scanProgress}%`, height: '100%', background: 'linear-gradient(90deg, var(--color-primary) 0%, var(--color-cyan) 100%)', transition: 'width 0.1s ease-out' }}></div>
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 'bold', color: 'var(--color-cyan)', fontSize: '14px' }}>
            {scanProgress}%
          </span>
        </div>
      )}

      {/* DIAGNOSTIC RESULT SCREEN */}
      {diagnosticResult && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="glass-panel" style={{ borderRadius: '24px', padding: '32px', textAlign: 'center', position: 'relative', overflow: 'hidden', border: '1px solid var(--color-primary)' }}>
            
            {/* Background Light Effect */}
            <div style={{ position: 'absolute', top: '-10%', left: '50%', transform: 'translateX(-50%)', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, rgba(0,0,0,0) 70%)', pointerEvents: 'none' }} />

            <div style={{ fontSize: '64px', marginBottom: '16px' }}>{diagnosticResult.type.emoji}</div>
            <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '1.5px', background: 'rgba(139,92,246,0.08)', padding: '4px 12px', borderRadius: '20px', border: '1px solid rgba(139,92,246,0.15)' }}>
              診断結果
            </span>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: '800', margin: '12px 0 6px', background: 'linear-gradient(135deg, var(--text-primary) 30%, var(--color-primary) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {diagnosticResult.type.name}
            </h2>
            <p style={{ fontStyle: 'italic', color: 'var(--text-secondary)', fontSize: '14px', margin: '0 0 24px' }}>
              「{diagnosticResult.type.tagline}」
            </p>

            {/* BARS GRID */}
            <div style={{ background: 'var(--bg-inner-box)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '20px', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 'bold', margin: '0 0 4px', color: 'var(--text-primary)' }}>📊 スキャンデータ内訳</h4>
              
              {/* Bar 1: ロジハラ度 */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}><ShieldAlert size={14} style={{ color: 'var(--color-rose)' }} /> ロジハラ度 (正論度)</span>
                  <span style={{ fontWeight: 'bold', color: 'var(--color-rose)' }}>{diagnosticResult.breakdown.rojiha}%</span>
                </div>
                <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                  <div style={{ width: `${diagnosticResult.breakdown.rojiha}%`, height: '100%', background: 'var(--color-rose)' }}></div>
                </div>
              </div>

              {/* Bar 2: 昭和バイアス */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}><Flame size={14} style={{ color: 'var(--color-amber)' }} /> 昭和バイアス (精神論度)</span>
                  <span style={{ fontWeight: 'bold', color: 'var(--color-amber)' }}>{diagnosticResult.breakdown.showa}%</span>
                </div>
                <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                  <div style={{ width: `${diagnosticResult.breakdown.showa}%`, height: '100%', background: 'var(--color-amber)' }}></div>
                </div>
              </div>

              {/* Bar 3: 共感シンクロ */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}><Coffee size={14} style={{ color: 'var(--color-cyan)' }} /> 共感シンクロ率</span>
                  <span style={{ fontWeight: 'bold', color: 'var(--color-cyan)' }}>{diagnosticResult.breakdown.empathy}%</span>
                </div>
                <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                  <div style={{ width: `${diagnosticResult.breakdown.empathy}%`, height: '100%', background: 'var(--color-cyan)' }}></div>
                </div>
              </div>
            </div>

            {/* DESCRIPTION */}
            <div style={{ textAlign: 'left', fontSize: '14px', lineHeight: '1.6', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ background: 'rgba(255,255,255,0.01)', borderLeft: '3px solid var(--border-color)', padding: '12px 16px', borderRadius: '0 8px 8px 0' }}>
                {diagnosticResult.type.description}
              </div>
              
              <div className="glass-panel" style={{ padding: '16px', borderRadius: '12px', background: 'var(--bg-inner-box)' }}>
                <h4 style={{ margin: '0 0 8px', fontSize: '13px', fontWeight: 'bold', color: 'var(--color-rose)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  🚨 発生しやすい脳内バグ（副作用）
                </h4>
                <p style={{ margin: 0, fontSize: '13px' }}>
                  <strong>【仕事】</strong> {diagnosticResult.type.workBug}<br/>
                  <strong style={{ display: 'block', marginTop: '6px' }}>【私生活】</strong> {diagnosticResult.type.privateBug}
                </p>
              </div>
            </div>

            {/* BUTTONS */}
            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '12px', marginTop: '32px' }}>
              <button 
                onClick={handleShareResult}
                className="btn btn-secondary"
                style={{ flex: 1, padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '14px' }}
              >
                <Share2 size={16} /> 𝕏 で結果をシェアする
              </button>
              
              <button 
                onClick={handleApplyToMain}
                className="btn btn-primary"
                style={{ 
                  flex: 1, 
                  padding: '14px', 
                  fontSize: '14px', 
                  fontWeight: 'bold',
                  background: 'linear-gradient(135deg, var(--color-primary) 0%, #7c3aed 100%)',
                  boxShadow: '0 4px 15px var(--color-primary-glow)',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                このバグをデバッグする（リハビリ室へ） <ArrowRight size={16} />
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
