import React, { useState, useEffect } from 'react';
import { 
  RotateCcw, 
  AlertCircle, 
  CheckCircle,
  Brain
} from 'lucide-react';

// 日本語の簡易認知バイアススキャン規則
const BIAS_RULES = [
  {
    id: 'allOrNothing',
    name: '白黒思考 (All-or-Nothing)',
    regex: /(絶対に|必ず|100%|完璧に|完全に|すべて|全部|一回も|一度も)/,
    description: '物事を白か黒か、成功か失敗かの両極端で捉えています。グラデーション（中庸）の可能性を探りましょう。'
  },
  {
    id: 'mindReading',
    name: '心の読みすぎ (Mind Reading)',
    regex: /(嫌われた|怒って|ムカついて|どうせ|冷たい|避けて|見下して|悪口)/,
    description: '客観的な証拠がないのに、他者が自分を悪く思っていると決めつけています。事実を確認しましょう。'
  },
  {
    id: 'overgeneralization',
    name: '過度の一般化 (Overgeneralization)',
    regex: /(いつも|いつも通り|毎回|どうせ|また|全員|誰も)/,
    description: 'たった一回の出来事を、すべての出来事や将来にわたって当てはめて考えています。単なる単発の出来事として切り分けましょう。'
  },
  {
    id: 'shouldStatements',
    name: 'すべき思考 (Should Statements)',
    regex: /(すべき|しなければ|ならない|絶対に〜なきゃ|義務|当たり前)/,
    description: '「〜すべきだ」と自分や他者に厳格なルールを課すことで、不要な焦りや怒りを生み出しています。「〜した方が望ましい」と言い換えてみましょう。'
  },
  {
    id: 'catastrophizing',
    name: '破滅化・悲観主義 (Catastrophizing)',
    regex: /(最悪だ|終わりだ|ダメだ|破滅だ|無理だ|二度と)/,
    description: '最悪のシナリオを予想し、それが必然的に起きると信じ込んでいます。現実的な確率を再評価しましょう。'
  }
];

const VIBE_DATA = {
  anxious: {
    label: 'モヤモヤ・不安',
    emoji: '🌀',
    themeColor: 'var(--color-cyan)',
    glowColor: 'rgba(6, 182, 212, 0.4)',
    question: '今、どんなことが起きそうで不安ですか？「もし〇〇になったら最悪だ」の〇〇の部分を書いてみてください。',
    placeholder: '例：明日の会議でのプレゼンで、頭が真っ白になって失敗し、みんなに無能だと思われるのが不安だ。',
    samples: [
      '明日の新規の打ち合わせで大失敗して、クライアントに呆れられ、このプロジェクトが破綻するかもしれないと不安だ。',
      '新しいタスクのやり方がいまいち分からず、質問するタイミングも逃してしまい、進捗が遅れて怒られる気がしてモヤモヤする。'
    ]
  },
  irritated: {
    label: 'イライラ・不満',
    emoji: '😤',
    themeColor: 'var(--color-rose)',
    glowColor: 'rgba(244, 63, 94, 0.4)',
    question: '誰の、どのような行動にイライラしましたか？言われたことや出来事をそのままここにぶちまけてみましょう。',
    placeholder: '例：先輩に「こんなことも分からないの？」と言われた。言い方が上から目線でイラついたし、自分を見下しているように感じた。',
    samples: [
      '今日頼んだ資料の作成について、後輩から何の連絡もなかった。社会人として毎回確認を入れるのは当たり前なのに、なぜやらないのか理解できなくてイライラする。',
      '会議中に自分の提案に対して「それは現実的じゃない」と一言で却下された。自分の努力やこれまでの準備を完全に無視されたように思えて腹が立った。'
    ]
  },
  sad: {
    label: '落ち込み・後悔',
    emoji: '🌧️',
    themeColor: '#818cf8',
    glowColor: 'rgba(129, 140, 248, 0.4)',
    question: '自分を責めてしまっていることや、後悔している出来事は？生の感情をそのまま書いてください。',
    placeholder: '例：今日中にやるべきタスクを半分も消化できなかった。自分は仕事が遅くて本当に能力がない人間だなと落ち込んでいる。',
    samples: [
      '今日の会話で、余計な一言を言ってしまった気がする。相手の反応がいつもより悪かった気がするし、自分のせいで嫌われたに違いない。',
      'また休日にダラダラと過ごして時間を無駄にしてしまった。自己管理が全くできないダメな人間だと、自分自身に失望している。'
    ]
  },
  rushed: {
    label: '焦り・義務感',
    emoji: '⏰',
    themeColor: 'var(--color-amber)',
    glowColor: 'rgba(245, 158, 11, 0.4)',
    question: '何に追われていますか？「〜しなければいけない」と思っていることを書き出してみましょう。',
    placeholder: '例：明日までにこの資料を100%完璧に仕上げなければいけない。すべて自分で調べてミスのないようにしないと破滅だ。',
    samples: [
      '今週中にあれもこれも終わらせなきゃいけない。絶対にすべての業務を一人で回しきらなければならないと、頭がパニックになっている。',
      '早くこの分野のスキルを完璧に身につけて、次のキャリアに進まなければいけないのに、全然勉強時間が取れなくて焦っている。'
    ]
  },
  flat: {
    label: '特にない（フラット）',
    emoji: '🍵',
    themeColor: '#10b981',
    glowColor: 'rgba(16, 185, 129, 0.4)',
    question: '今日一日の中で、少しだけ「めんどくさいな」「億惹だな」と感じた瞬間やノイズを思い出して書いてみてください。',
    placeholder: '例：メールの返信をするのがなんとなく億劫だった。どうせ返事をしてもまた議論が長引くだけだと思うとやる気が出ない。',
    samples: [
      '日報を書くのがいつもめんどくさくて後回しにしてしまう。誰もこんなログ読んでいないし、書くだけ時間の無駄ではないかと思ってしまう。',
      '今日のチーム朝礼で、みんなの発言を聞くのがなんとなく退屈だった。特に自分に関連する話でもないし、ただ時間が過ぎるのを待っていた。'
    ]
  }
};

export default function MindTuning({ onBack, playSound, onSaveLog }) {
  const [step, setStep] = useState('vibeSelect'); // 'vibeSelect' | 'writeRaw' | 'scanning' | 'refactor' | 'compiling' | 'success'
  const [selectedVibe, setSelectedVibe] = useState(null);
  const [rawText, setRawText] = useState('');
  const [detectedBiases, setDetectedBiases] = useState([]);
  const [refactoredText, setRefactoredText] = useState('');
  const [charLimitWarning, setCharLimitWarning] = useState(false);

  // 新規追加: クローズアウト演出・呼吸瞑想用の状態変数
  const [compileLogs, setCompileLogs] = useState([]);
  const [ramUsage, setRamUsage] = useState(92);
  const [breathingPhase, setBreathingPhase] = useState('吸う (Inhale)');
  const [stars] = useState(() => {
    return Array.from({ length: 45 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: Math.random() * 2 + 0.8,
      delay: `${Math.random() * 6}s`,
      duration: `${4 + Math.random() * 6}s`
    }));
  });

  // 呼吸の4秒サイクルを同期
  useEffect(() => {
    if (step === 'success') {
      const interval = setInterval(() => {
        setBreathingPhase(prev => prev === '吸う (Inhale)' ? '吐く (Exhale)' : '吸う (Inhale)');
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [step]);

  // Vibe選択時のハンドラ
  const handleSelectVibe = (key) => {
    playSound('click');
    setSelectedVibe(key);
    setRawText('');
    setStep('writeRaw');
  };

  // サンプルテキスト入力
  const handleLoadSample = (sample) => {
    playSound('click');
    setRawText(sample);
  };

  // Rawテキストの文字数制限ハンドラ (200文字制限)
  const handleTextChange = (e) => {
    const val = e.target.value;
    if (val.length <= 200) {
      setRawText(val);
      setCharLimitWarning(val.length >= 140);
      playSound('keyboard'); // タイピングASMRクリック音
    }
  };

  // テキストの簡易バイアス解析を実行
  const runBiasScan = () => {
    playSound('click');
    setStep('scanning');

    // スキャン演出のために1.8秒待つ
    setTimeout(() => {
      const foundBiases = [];
      BIAS_RULES.forEach(rule => {
        const match = rawText.match(rule.regex);
        if (match) {
          foundBiases.push({
            ruleId: rule.id,
            name: rule.name,
            matchedWord: match[0],
            description: rule.description
          });
        }
      });

      setDetectedBiases(foundBiases);
      setRefactoredText('');
      setStep('refactor');
      playSound('success');
    }, 1800);
  };

  // デバッグ完了 (保存とコンパイル - メモリ解放ゲージを経由)
  const handleCompile = () => {
    if (!refactoredText.trim()) return;

    playSound('click');
    setStep('compiling');
    setCompileLogs([]);
    setRamUsage(92);

    const logs = [
      '[OK] Initiating logic refactoring compiler...',
      '[OK] Purging cognitive bias vulnerabilities...',
      '[OK] Freezing System 1 emotional loop...',
      '[OK] Releasing working memory (RAM)...',
      '[SUCCESS] All components patched successfully.'
    ];

    logs.forEach((log, index) => {
      setTimeout(() => {
        setCompileLogs(prev => [...prev, log]);
        if (index === 0) setRamUsage(75);
        if (index === 1) setRamUsage(48);
        if (index === 2) setRamUsage(28);
        if (index === 3) setRamUsage(12);
        if (index === 4) {
          setRamUsage(6);
          playSound('success');
        }
      }, index * 550);
    });

    // 3.2秒後に成功（宇宙呼吸瞑想）画面に遷移
    setTimeout(() => {
      setStep('success');

      // 親コンポーネントにセーブデータを引き渡す
      if (onSaveLog) {
        onSaveLog({
          vibe: selectedVibe,
          rawText,
          refactoredText,
          biases: detectedBiases.map(b => b.name)
        });
      }
    }, 3200);
  };

  // テキスト中の該当バイアスワードを赤くハイライトして表示するヘルパー
  const renderHighlightedText = () => {
    if (detectedBiases.length === 0) return <span>{rawText}</span>;

    let text = rawText;
    const sortedMatches = [...detectedBiases].sort((a,b) => b.matchedWord.length - a.matchedWord.length);
    
    let regexParts = sortedMatches.map(m => escapeRegExp(m.matchedWord)).join('|');
    if (!regexParts) return <span>{rawText}</span>;
    
    let splitRegex = new RegExp(`(${regexParts})`, 'g');
    let textArray = text.split(splitRegex);

    return textArray.map((part, index) => {
      const matchedBias = detectedBiases.find(b => b.matchedWord === part);
      if (matchedBias) {
        return (
          <span 
            key={index} 
            style={{ 
              background: 'rgba(244, 63, 94, 0.25)', 
              color: '#f43f5e', 
              borderBottom: '2px dotted #f43f5e',
              padding: '0 4px',
              borderRadius: '3px',
              fontWeight: 'bold',
              cursor: 'help'
            }}
            title={matchedBias.description}
          >
            {part}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  const currentVibeInfo = VIBE_DATA[selectedVibe];

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px 16px', minHeight: '80vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      
      {/* 1. 感情選択フェーズ */}
      {step === 'vibeSelect' && (
        <div className="glass-panel fade-in" style={{ padding: '40px 32px', textAlign: 'center', background: 'var(--hero-bg)' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
            <span style={{ fontSize: '48px' }}>🧠</span>
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 'bold', color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
            本日の脳内デバッグ（思考調律）
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', lineHeight: '1.6', maxWidth: '520px', margin: '0 auto 32px auto' }}>
            日々の生活や仕事で生じるモヤモヤ（ノイズ）は、放置すると思考力（RAM）を圧迫します。
            今、あなたの脳内に最も近い「感情ノイズ」を選んでください。
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '450px', margin: '0 auto' }}>
            {Object.entries(VIBE_DATA).map(([key, info]) => (
              <button
                key={key}
                onClick={() => handleSelectVibe(key)}
                className="btn btn-secondary hover-lift mind-vibe-btn"
                style={{
                  padding: '16px 24px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  borderRadius: '12px',
                  borderLeft: `5px solid ${info.themeColor}`,
                  textAlign: 'left',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = `0 4px 20px ${info.glowColor}`;
                  e.currentTarget.style.borderColor = info.themeColor;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = '';
                }}
              >
                <span style={{ fontSize: '24px' }}>{info.emoji}</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{info.label}</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>思考デバッガーを起動します</span>
                </div>
              </button>
            ))}
          </div>

          <button 
            onClick={onBack} 
            className="btn btn-secondary" 
            style={{ marginTop: '32px', fontSize: '13px', padding: '10px 24px' }}
          >
            ← 戻る
          </button>
        </div>
      )}

      {/* 2. 感情書き出しフェーズ */}
      {step === 'writeRaw' && currentVibeInfo && (
        <div className="glass-panel fade-in" style={{ padding: '32px 24px', background: 'var(--hero-bg)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '24px' }}>{currentVibeInfo.emoji}</span>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>
                {currentVibeInfo.label}：本音の書き出し
              </h3>
            </div>
            <button 
              onClick={() => { playSound('click'); setStep('vibeSelect'); }}
              className="btn btn-secondary"
              style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '6px' }}
            >
              感情を選び直す
            </button>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.01)', border: '1px solid var(--border-color)', padding: '16px', borderRadius: '8px', marginBottom: '20px', textAlign: 'left' }}>
            <span style={{ fontSize: '11px', color: currentVibeInfo.themeColor, fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>カエル分析官からの問いかけ</span>
            <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>{currentVibeInfo.question}</p>
          </div>

          {/* テキスト入力欄 */}
          <div style={{ position: 'relative', marginBottom: '16px' }}>
            <textarea
              value={rawText}
              onChange={handleTextChange}
              placeholder={currentVibeInfo.placeholder}
              className="mind-textarea"
              style={{
                width: '100%',
                minHeight: '140px',
                border: `1px solid ${charLimitWarning ? 'var(--color-amber)' : 'var(--border-color)'}`,
                borderRadius: '8px',
                padding: '16px',
                fontSize: '14px',
                lineHeight: '1.6',
                outline: 'none',
                resize: 'none',
                fontFamily: 'inherit',
                transition: 'border-color 0.2s ease'
              }}
            />
            <div style={{ 
              position: 'absolute', 
              bottom: '12px', 
              right: '16px', 
              fontSize: '11.5px', 
              color: charLimitWarning ? 'var(--color-amber)' : 'var(--text-muted)',
              fontWeight: charLimitWarning ? 'bold' : 'normal'
            }}>
              {rawText.length} / 200 文字
            </div>
          </div>

          {charLimitWarning && (
            <p style={{ color: 'var(--color-amber)', fontSize: '11.5px', textAlign: 'left', margin: '-10px 0 16px 0', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <AlertCircle size={12} />
              <span>140文字程度が最も効率よくデバッグできます（最大200文字）。</span>
            </p>
          )}

          {/* サンプル入力 */}
          <div style={{ textAlign: 'left', marginBottom: '24px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>▼ 書くことに迷う場合の「愚痴サンプル」（クリックで自動入力されます）</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {currentVibeInfo.samples.map((sample, idx) => (
                <button
                  key={idx}
                  onClick={() => handleLoadSample(sample)}
                  style={{
                    background: 'rgba(255,255,255,0.01)',
                    border: '1px solid rgba(255,255,255,0.04)',
                    color: 'var(--text-secondary)',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    lineHeight: '1.4',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.01)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.04)';
                  }}
                >
                  {sample}
                </button>
              ))}
            </div>
          </div>

          {/* アクションボタン */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              onClick={() => { playSound('click'); setStep('vibeSelect'); }}
              className="btn btn-secondary" 
              style={{ flex: 0.5, fontSize: '13px' }}
            >
              キャンセル
            </button>
            <button 
              onClick={runBiasScan}
              disabled={rawText.trim().length === 0}
              className="btn btn-primary" 
              style={{ 
                flex: 1, 
                fontSize: '13.5px',
                background: currentVibeInfo.themeColor,
                boxShadow: `0 4px 12px ${currentVibeInfo.glowColor}`,
                opacity: rawText.trim().length === 0 ? 0.5 : 1
              }}
            >
              🔍 デバッグスキャンを開始
            </button>
          </div>
        </div>
      )}

      {/* 3. スキャン中フェーズ */}
      {step === 'scanning' && currentVibeInfo && (
        <div className="glass-panel fade-in" style={{ padding: '48px 32px', textAlign: 'center', background: 'var(--hero-bg)' }}>
          <div style={{ position: 'relative', width: '80px', height: '80px', margin: '0 auto 24px auto', display: 'flex', alignItems: 'center', justifySelf: 'center' }}>
            <Brain size={48} style={{ color: currentVibeInfo.themeColor, animation: 'pulse 1.5s infinite' }} />
            {/* スキャンビームアニメーション */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: currentVibeInfo.themeColor,
              borderRadius: '2px',
              boxShadow: `0 0 10px ${currentVibeInfo.themeColor}`,
              animation: 'scanner-beam-vertical 1.5s infinite ease-in-out'
            }} />
          </div>

          <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--text-primary)', margin: '0 0 16px 0' }}>
            思考ノイズスキャン中...
          </h3>

          <div style={{
            maxWidth: '380px',
            margin: '0 auto',
            background: 'rgba(10, 11, 16, 0.8)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            padding: '16px',
            fontFamily: 'monospace',
            fontSize: '11px',
            color: 'var(--text-muted)',
            textAlign: 'left',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}>
            <div>[INITIATING BRAIN SCAN]... OK</div>
            <div>[PARSING STRING TOKENS]... PROCESSING</div>
            <div>[COMPARING COGNITIVE BIAS SCHEMAS]... CHECKING</div>
            <div>[IDENTIFYING SYNTAX FAULTS]... SCANNING</div>
          </div>
        </div>
      )}

      {/* 4. リファクタリング（デバッグ）フェーズ */}
      {step === 'refactor' && currentVibeInfo && (
        <div className="glass-panel fade-in" style={{ padding: '32px 24px', background: 'var(--hero-bg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '12px' }}>
            <span style={{ fontSize: '24px' }}>🔬</span>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>
              思考のリファクタリング（脳内デバッグ）
            </h3>
          </div>

          {/* 前段階の文章とハイライト */}
          <div style={{ background: 'rgba(10, 11, 16, 0.5)', border: '1px solid rgba(255, 255, 255, 0.04)', padding: '16px', borderRadius: '8px', marginBottom: '20px', textAlign: 'left' }}>
            <span style={{ fontSize: '11px', color: '#f43f5e', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>🔴 スキャンされた思考（感情ノイズ）</span>
            <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
              {renderHighlightedText()}
            </p>
          </div>

          {/* 検知されたバグの説明 */}
          <div style={{ textAlign: 'left', marginBottom: '24px' }}>
            {detectedBiases.length > 0 ? (
              <>
                <span style={{ fontSize: '11px', color: 'var(--color-rose)', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>⚠️ 検出された認知バグ ({detectedBiases.length}件)</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {detectedBiases.map((bias, idx) => (
                    <div key={idx} style={{ background: 'rgba(244, 63, 94, 0.03)', border: '1px solid rgba(244, 63, 94, 0.1)', padding: '12px', borderRadius: '8px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                      <AlertCircle size={16} style={{ color: '#f43f5e', flexShrink: 0, marginTop: '2px' }} />
                      <div>
                        <span style={{ fontSize: '12.5px', fontWeight: 'bold', color: '#f43f5e' }}>
                          「{bias.matchedWord}」➡ {bias.name}
                        </span>
                        <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                          {bias.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ background: 'rgba(16, 185, 129, 0.03)', border: '1px solid rgba(16, 185, 129, 0.1)', padding: '12px', borderRadius: '8px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                <CheckCircle size={16} style={{ color: '#10b981' }} />
                <div>
                  <span style={{ fontSize: '12.5px', fontWeight: 'bold', color: '#10b981' }}>直接的な論理バグワードは未検出</span>
                  <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                    特定の極端なキーワードは検出されませんでしたが、不安やイライラの根本にある「客観的な事実」と「推論（感情）」を切り分けるための書き換えを行ってみましょう。
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* デバッグガイド */}
          <div style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.15)', padding: '16px', borderRadius: '8px', marginBottom: '20px', textAlign: 'left' }}>
            <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>💡 カエル分析官のデバッグガイド</span>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              感情や予測（〜に違いない、絶対に無理）を取り除き、**「今、目に見える客観的な事実」**と**「それに対する現実的な対策」**の形式で、文章を新しくリファクタリングしてタイピングしてください。
            </p>
            <div style={{ marginTop: '8px', fontSize: '11.5px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
              フォーマット例: 「【事実】〇〇。【対策/現実的な見解】〇〇。」
            </div>
          </div>

          {/* リファクタリング用入力エリア */}
          <div style={{ position: 'relative', marginBottom: '24px' }}>
            <textarea
              value={refactoredText}
              onChange={(e) => {
                if (e.target.value.length <= 200) {
                  setRefactoredText(e.target.value);
                  playSound('keyboard'); // タイピングASMRクリック音
                }
              }}
              placeholder="【事実】〇〇。【対策/現実的な見解】〇〇。"
              className="mind-textarea"
              style={{
                width: '100%',
                minHeight: '100px',
                borderRadius: '8px',
                padding: '16px',
                fontSize: '14px',
                lineHeight: '1.6',
                outline: 'none',
                resize: 'none',
                fontFamily: 'inherit'
              }}
            />
            <div style={{ 
              position: 'absolute', 
              bottom: '12px', 
              right: '16px', 
              fontSize: '11.5px', 
              color: 'var(--text-muted)'
            }}>
              {refactoredText.length} / 200 文字
            </div>
          </div>

          {/* アクションボタン */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              onClick={() => { playSound('click'); setStep('writeRaw'); }}
              className="btn btn-secondary" 
              style={{ flex: 0.4, fontSize: '13px' }}
            >
              書き直す
            </button>
            <button 
              onClick={handleCompile}
              disabled={!refactoredText.trim()}
              className="btn btn-primary" 
              style={{ 
                flex: 1, 
                fontSize: '13.5px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                opacity: !refactoredText.trim() ? 0.5 : 1
              }}
            >
              🚀 思考をコンパイル（デバッグ完了）
            </button>
          </div>
        </div>
      )}

      {/* 4.5. コンパイル中（メモリ解放）フェーズ */}
      {step === 'compiling' && currentVibeInfo && (
        <div className="glass-panel fade-in" style={{ padding: '40px 32px', textAlign: 'center', background: 'var(--hero-bg)' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
            <RotateCcw size={48} className="spin-slow" style={{ color: '#10b981' }} />
          </div>

          <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
            脳内メモリ（RAM）を解放中...
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '24px' }}>
            認知バグのパッチを適用し、ワーキングメモリ領域をクリーンアップしています。
          </p>

          {/* RAM空き容量メーター */}
          <div style={{ maxWidth: '400px', margin: '0 auto 24px auto', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', fontSize: '12px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>CPU使用率 / 脳内メモリ負荷</span>
              <span style={{ color: ramUsage > 50 ? '#f43f5e' : '#10b981', fontWeight: 'bold', fontFamily: 'monospace' }}>
                {ramUsage}%
              </span>
            </div>
            <div style={{
              width: '100%',
              height: '8px',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '4px',
              overflow: 'hidden',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <div style={{
                width: `${ramUsage}%`,
                height: '100%',
                background: ramUsage > 50 
                  ? 'linear-gradient(90deg, #f43f5e 0%, #e11d48 100%)' 
                  : 'linear-gradient(90deg, #10b981 0%, #34d399 100%)',
                boxShadow: ramUsage > 50 ? '0 0 10px rgba(244, 63, 94, 0.4)' : '0 0 10px rgba(16, 185, 129, 0.4)',
                borderRadius: '4px',
                transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
              }} />
            </div>
          </div>

          {/* コンソール風出力 */}
          <div style={{
            maxWidth: '400px',
            margin: '0 auto',
            background: 'rgba(10, 11, 16, 0.85)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            padding: '16px',
            fontFamily: 'monospace',
            fontSize: '11px',
            color: '#10b981',
            textAlign: 'left',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            minHeight: '120px'
          }}>
            {compileLogs.map((log, idx) => (
              <div key={idx} className="typewriter-log" style={{ opacity: 0, animation: 'fadeInLog 0.2s forwards' }}>
                {log}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. コンパイル成功 ＆ 宇宙呼吸瞑想フェーズ */}
      {step === 'success' && currentVibeInfo && (
        <div 
          className="glass-panel fade-in meditation-container" 
          style={{ 
            padding: '48px 32px', 
            textAlign: 'center', 
            background: 'radial-gradient(circle at center, #0b0f19 0%, #030508 100%)',
            border: '1px solid rgba(255, 255, 255, 0.02)',
            borderRadius: '24px',
            position: 'relative',
            overflow: 'hidden',
            minHeight: '520px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '24px'
          }}
        >
          {/* 星屑パーティクル背景 */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', zIndex: 0 }}>
            {stars.map(star => (
              <div 
                key={star.id} 
                className="floating-star"
                style={{
                  position: 'absolute',
                  left: star.left,
                  top: star.top,
                  width: `${star.size}px`,
                  height: `${star.size}px`,
                  background: '#fff',
                  borderRadius: '50%',
                  boxShadow: `0 0 ${star.size * 2}px #fff`,
                  animation: `float-star ${star.duration} linear infinite, pulse-star ${star.delay} ease-in-out infinite`
                }}
              />
            ))}
          </div>

          {/* コンテンツ本体 */}
          <div style={{ zIndex: 1, position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '28px', maxWidth: '600px' }}>
            
            <div>
              <span className="game-badge" style={{ background: 'rgba(6, 182, 212, 0.1)', border: '1px solid rgba(6, 182, 212, 0.2)', color: 'var(--color-cyan)', fontSize: '11px', fontWeight: 'bold', padding: '4px 12px', borderRadius: '12px' }}>
                🌌 MIND TUNING COMPLETE
              </span>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 'bold', color: '#fff', margin: '8px 0 0 0' }}>
                脳内デバッグ完了（RAM解放）
              </h2>
            </div>

            {/* 調律された美しい事実 */}
            <div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
                デバッグ済みの客観的思考
              </div>
              <p className="meditation-thought">
                「 {refactoredText} 」
              </p>
            </div>

            {/* 呼吸サークルガイド */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', margin: '8px 0' }}>
              <div className="breathing-ring-outer">
                <div className="breathing-ring">
                  <span className="breathing-text">{breathingPhase}</span>
                </div>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '12px', margin: 0, maxWidth: '340px', lineHeight: '1.5' }}>
                光の輪の大きさに合わせて、ゆっくりと深呼吸をしながら、今日デバッグした事実を見つめ直しましょう。
              </p>
            </div>

            {/* 完了して戻るボタン */}
            <button 
              onClick={onBack} 
              className="btn btn-primary hover-lift" 
              style={{ 
                fontSize: '13.5px', 
                padding: '12px 36px',
                background: 'linear-gradient(135deg, var(--color-cyan) 0%, var(--color-primary) 100%)',
                boxShadow: '0 4px 15px rgba(6, 182, 212, 0.3)',
                borderRadius: '12px',
                border: 'none',
                marginTop: '12px'
              }}
            >
              今日の調律をクローズして眠る
            </button>
          </div>
        </div>
      )}
      
      {/* 画面内CSS定義 */}
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.8; }
        }
        .mind-vibe-btn {
          border: 1px solid rgba(255, 255, 255, 0.05) !important;
          background: rgba(255, 255, 255, 0.01) !important;
        }
        body.light-theme .mind-vibe-btn {
          border-color: rgba(15, 23, 42, 0.08) !important;
          background: #ffffff !important;
        }
        .mind-textarea {
          background: rgba(10, 11, 16, 0.6) !important;
          color: #ffffff !important;
          border: 1px solid var(--border-color) !important;
        }
        body.light-theme .mind-textarea {
          background: #ffffff !important;
          color: var(--text-primary) !important;
          border: 1px solid rgba(15, 23, 42, 0.12) !important;
        }
        @keyframes scanner-beam-vertical {
          0%, 100% { top: 0%; }
          50% { top: 95%; }
        }
        .spin-slow {
          animation: spin 8s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes fadeInLog {
          to { opacity: 1; }
        }
        @keyframes float-star {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
          100% { transform: translateY(0px); }
        }
        @keyframes pulse-star {
          0%, 100% { opacity: 0.15; }
          50% { opacity: 0.85; }
        }
        @keyframes breathing-thought-glow {
          0%, 100% {
            text-shadow: 0 0 10px rgba(255, 255, 255, 0.2), 0 0 20px rgba(6, 182, 212, 0.1);
            color: #cbd5e1;
          }
          50% {
            text-shadow: 0 0 25px rgba(255, 255, 255, 0.6), 0 0 35px rgba(6, 182, 212, 0.35);
            color: #ffffff;
          }
        }
        .meditation-thought {
          font-size: 16px;
          font-weight: 500;
          color: #cbd5e1;
          line-height: 1.8;
          max-width: 520px;
          text-align: center;
          animation: breathing-thought-glow 8s ease-in-out infinite;
          margin: 0;
          padding: 14px 28px;
          background: rgba(255, 255, 255, 0.01);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.03);
          box-shadow: inset 0 0 12px rgba(255, 255, 255, 0.01);
        }
        .breathing-ring-outer {
          width: 160px;
          height: 160px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        @keyframes breathing-scale {
          0%, 100% {
            transform: scale(0.85);
            box-shadow: 0 0 15px rgba(6, 182, 212, 0.2);
            border-color: rgba(6, 182, 212, 0.4);
            background: rgba(6, 182, 212, 0.02);
          }
          50% {
            transform: scale(1.15);
            box-shadow: 0 0 40px rgba(6, 182, 212, 0.5);
            border-color: rgba(6, 182, 212, 0.8);
            background: rgba(6, 182, 212, 0.08);
          }
        }
        .breathing-ring {
          width: 120px;
          height: 120px;
          border: 2px solid rgba(6, 182, 212, 0.4);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: breathing-scale 8s ease-in-out infinite;
          transition: all 0.3s ease;
        }
        .breathing-text {
          font-size: 13px;
          font-weight: bold;
          color: var(--color-cyan);
          text-shadow: 0 0 8px rgba(6, 182, 212, 0.4);
          letter-spacing: 0.5px;
        }
      `}</style>
    </div>
  );
}
