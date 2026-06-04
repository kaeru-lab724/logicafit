import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, ArrowRight, RotateCcw, Volume2, VolumeX, Sparkles, HelpCircle, Eye } from 'lucide-react';
import RakutenWidget from '../common/RakutenWidget';

const QUESTIONS = {
  daily: [
    {
      id: 'daily_1',
      claim: '「彼はメッセージを送ってから2時間も返信がない。だから私のことが嫌いに違いない」',
      context: '日常の対人関係での思い込み',
      options: [
        { text: '相手が自分を好きなら、どんな状況でも必ず2時間以内に返信するはずだ', isCorrect: true },
        { text: 'メッセージを読んだらすぐに返信するのが人間の共通マナーである', isCorrect: false },
        { text: '2時間も返信がないのは、スマートフォンの電源が切れているからだ', isCorrect: false }
      ],
      bugExplanation: '相手が忙しい、スマートフォンの通知がオフになっている、返信内容を熟考しているなど、嫌悪以外の無数の可能性を無視し、「好意＝即時返信」という極端な仮定に依存しています。',
      rewriteOptions: [
        { text: '返信が2時間ないのは単に忙しいのかもしれないし、返答を考えている最中かもしれない。', isCorrect: true },
        { text: '返信が遅いのは失礼だから、二度とこちらからメッセージを送らないことにしよう。', isCorrect: false },
        { text: '相手に嫌われているかもしれないので、しつこく何度も送信して確かめるべきだ。', isCorrect: false }
      ]
    },
    {
      id: 'daily_2',
      claim: '「同僚が画面を見ながら深刻な表情をしている。絶対に私に怒っているんだ」',
      context: '表情からのマインドリーディング',
      options: [
        { text: '他人が深刻な表情をする主たる理由は、常に自分（発言者）に対する怒りである', isCorrect: true },
        { text: '仕事中に深刻な顔をすることは、社会人として慎むべき態度である', isCorrect: false },
        { text: '深刻な表情をしている人は、重大なニュースを読んでいるに違いない', isCorrect: false }
      ],
      bugExplanation: '「認知の個人化」と「マインドリーディング」のバグです。同僚がタスクに集中している、あるいはプライベートな悩みがあるなど、自分とは無関係な理由を排除しています。',
      rewriteOptions: [
        { text: '深刻な顔をしているが、難しい仕事に集中しているか、何か別の悩みを考えているのだろう。', isCorrect: true },
        { text: '私に怒っているようだから、機嫌が直るまで一切話しかけないようにしよう。', isCorrect: false },
        { text: '怒っている原因を聞き出すため、すぐに「私のせいで怒っていますか？」と問い詰めるべきだ。', isCorrect: false }
      ]
    },
    {
      id: 'daily_3',
      claim: '「ダイエット中なのにクッキーを1枚食べてしまった。もう台無しだからピザを丸ごと食べよう」',
      context: '極端な完璧主義（All-or-Nothing）',
      options: [
        { text: 'ダイエット計画は100%完璧でなければ意味がなく、1回の例外で効果は完全にゼロに戻る', isCorrect: true },
        { text: 'クッキー1枚とピザ1枚の摂取カロリーは、身体にとってほぼ同一である', isCorrect: false },
        { text: 'ピザを食べた方が、クッキーの誘惑に対するストレスを発散できる', isCorrect: false }
      ],
      bugExplanation: '白黒思考（全か無か思考）のバグです。クッキー1枚のカロリー影響はわずかですが、ピザを完食すれば大幅な超過となり、自ら計画を破壊することになります。',
      rewriteOptions: [
        { text: 'クッキーを1枚食べたが、全体の一部にすぎない。次の食事から再び健康的なメニューに戻そう。', isCorrect: true },
        { text: '一度ルールを破ったので、今日は好きなだけ食べて明日から断食すればチャラになる。', isCorrect: false },
        { text: '自分は意志が弱くてダイエットに向いていないので、計画自体をきっぱり諦めるべきだ。', isCorrect: false }
      ]
    },
    {
      id: 'daily_4',
      claim: '「この新しい掃除機は有名な芸能人がオススメしているから、絶対に最高品質のはずだ」',
      context: '権威・有名人への訴えかけ',
      options: [
        { text: '著名な有名人は、広告料に関係なく、技術的に最も優れた製品しか推奨しない', isCorrect: true },
        { text: '品質の良い掃除機は、テレビCMやネット広告を使わなくても自動的に売れる', isCorrect: false },
        { text: '有名人が使う掃除機と一般家庭で必要な掃除機のスペックは完全に同じである', isCorrect: false }
      ],
      bugExplanation: '権威への誤った訴えのバグです。宣伝活動（スポンサー契約）と客観的な製品品質は別物であることを無視しています。',
      rewriteOptions: [
        { text: '有名人が推薦しているが、実際のスペックや購入者の第三者レビューを比較して決めよう。', isCorrect: true },
        { text: '有名人が勧めるのだから間違いない。他の製品との比較は時間変更の無駄なので即決する。', isCorrect: false },
        { text: '広告に出ている製品は裏に陰謀があるので、一切信用せず無名の製品だけを買うべきだ。', isCorrect: false }
      ]
    },
    {
      id: 'daily_5',
      claim: '「友達みんなが新しいカフェに行っている。行かないと、私は輪から外されて孤独になる」',
      context: 'SNS依存とFOMO（取り残される恐怖）',
      options: [
        { text: '友人グループの1回のイベントに参加しないだけで、人間関係の絆は完全に崩壊する', isCorrect: true },
        { text: '孤独を避けるためには、自分の都合や体調を完全に犠牲にして合わせるべきだ', isCorrect: false },
        { text: 'そのカフェに行かない人は、友人たちから意図的に嫌われている', isCorrect: false }
      ],
      bugExplanation: '破滅化（カタストロファイジング）と過度の一般化のバグです。長期的な友情は、1回カフェに行くかどうかで崩れるほど脆弱ではありません。',
      rewriteOptions: [
        { text: '今回は都合が合わないので断るが、次の機会に参加すれば友人関係に何の問題もない。', isCorrect: true },
        { text: '仲間外れにされたくないので、借金をしてでも体調不良を押して参加するべきだ。', isCorrect: false },
        { text: '行くのをやめて、彼らが自分の悪口を言っているのではないかとSNSを監視し続けよう。', isCorrect: false }
      ]
    },
    {
      id: 'daily_6',
      claim: '「数学の小テストで悪い点数を取った。私は理系に向いておらず、受験も失敗する」',
      context: '局所的な結果からの過剰な悲観',
      options: [
        { text: '小テスト1回の結果は、個人の永続的な学習能力と将来の合否を100%決定づける', isCorrect: true },
        { text: '一度悪い点数を取った科目は、どれだけ勉強しても二度と成績が上がることはない', isCorrect: false },
        { text: '数学が得意な人は、人生のすべてのテストで一度も間違えたことがない', isCorrect: false }
      ],
      bugExplanation: '過度の一般化と固定観念（マインドセット）のバグです。小テストは現在の弱点を示すフィードバックにすぎず、将来の可能性を決定するものではありません。',
      rewriteOptions: [
        { text: '今回のテストで間違えた部分を復習し、次の試験で点数を伸ばせるように対策しよう。', isCorrect: true },
        { text: 'もう数学を勉強しても無駄なので、数学のない文系の進路にすぐ変更することにしよう。', isCorrect: false },
        { text: '悪い点数を隠すために、テスト用紙を親に見せずに捨てて忘れ去ることにしよう。', isCorrect: false }
      ]
    }
  ],
  business: [
    {
      id: 'business_1',
      claim: '「競合A社の新製品はデザインが美しく、大ヒットしている。我々もUIスタイルを模倣すれば売上が伸びるはずだ」',
      context: '単一要因への帰属（デザイン信仰）',
      options: [
        { text: '競合A社の製品が売れている要因は、UIデザインのみ（または主たる要因）である', isCorrect: true },
        { text: '他社のスタイルを真似る行為は、自社のブランド構築にとって最も効率的である', isCorrect: false },
        { text: '美しい製品デザインは、製品の基本機能やサポート品質を常に凌駕する', isCorrect: false }
      ],
      bugExplanation: '相関と因果の混同、または多要因の無視です。ヒットの裏には、マーケティング戦略、価格設定、営業網、既存顧客基盤など、デザイン以外の複合的要素があることを見落としています。',
      rewriteOptions: [
        { text: '競合のUIを調べるだけでなく、彼らの価格、宣伝、機能面での総合的な勝因を調査しよう。', isCorrect: true },
        { text: 'すぐに自社製品のUIを競合A社と同一に書き換え、他機能の開発は一旦停止させよう。', isCorrect: false },
        { text: '真似することは悪なので、競合とは真逆の最も複雑で使いにくいデザインを目指そう。', isCorrect: false }
      ]
    },
    {
      id: 'business_2',
      claim: '「営業メンバーを5名増員すれば、来四半期の売上は単純に2倍に拡大するはずだ」',
      context: 'リソースの線形スケール前提',
      options: [
        { text: '売上は営業人員数に完全比例し、市場の飽和や組織の教育コストによるオーバーヘッドは存在しない', isCorrect: true },
        { text: '新しく採用した営業は、入社初日からベテランと同じ成果を上げることができる', isCorrect: false },
        { text: '自社の製品需要は無限であり、営業メンバーの数だけ契約が取れる状態である', isCorrect: false }
      ],
      bugExplanation: '非現実的なスケール仮定のバグです。採用・育成期間、リード（見込み顧客）の供給限界、組織管理コストによる効率低下などのボトルネックを無視しています。',
      rewriteOptions: [
        { text: '増員によってアプローチできる市場規模と、立ち上がり期間を考慮して堅実な計画を立てよう。', isCorrect: true },
        { text: '売上が2倍になるはずなので、現在の営業ターゲット層に向けて全員に同じ架電をさせよう。', isCorrect: false },
        { text: '増員にはリスクしかないので、現在のギリギリの人員だけで目標を2倍にするべきだ。', isCorrect: false }
      ]
    },
    {
      id: 'business_3',
      claim: '「多くの顧客が価格が高いと不満を言っている。解約を防ぐために、すぐに全プランで一律値下げを実施すべきだ」',
      context: '価格弾力性と解約理由の誤認',
      options: [
        { text: '顧客が価格に不満を述べる原因は価格そのものにあり、機能やサポートの不足は無関係である', isCorrect: true },
        { text: '値下げを行えば、解約率はゼロになり、長期的な利益率は自動的に向上する', isCorrect: false },
        { text: '他社サービスとの差別化は不可能なので、価格のみで勝負するべきである', isCorrect: false }
      ],
      bugExplanation: '「価格への不満」は、多くの場合「提供価値が支払額に見合っていない」という価値実感（バリュー）の欠如を示しています。単に値下げすると、利益率だけが下がり、製品品質の改善資金が失われます。',
      rewriteOptions: [
        { text: '価格不満を言う顧客に対して、どの機能やサポートに価値を感じていないのかを調査しよう。', isCorrect: true },
        { text: '競合より1円でも安くするために、サポート窓口を廃止して限界まで値下げを行おう。', isCorrect: false },
        { text: '不満を言う顧客はクレーマーなので、値下げも改善もせず放置して切り捨てるべきだ。', isCorrect: false }
      ]
    },
    {
      id: 'business_4',
      claim: '「今月は社内の相談窓口にクレームが一件もなかった。従業員の満足度は非常に高い状態だ」',
      context: '沈黙の合意バイアス',
      options: [
        { text: '従業員は満足していない場合、必ず公式なクレーム窓口を通じて積極的に意見を発信する', isCorrect: true },
        { text: '満足度の高い組織では、業務改善や業務効率に関する提案も一切発生しない', isCorrect: false },
        { text: 'クレーム窓口が機能していないのは、担当者の対応が極めて優秀だからである', isCorrect: false }
      ],
      bugExplanation: '「不平がない＝満足している」というバグです。意見を言っても無駄だという諦め、報復への恐れ、あるいは転職活動への移行など、沈黙の裏にあるリスクを見逃しています。',
      rewriteOptions: [
        { text: '苦情がない理由を探るため、匿名アンケートや1on1で本音を拾い上げる機会を作ろう。', isCorrect: true },
        { text: '不満は完全にゼロなので、今後は人事制度のアップデートや社員ヒアリングを廃止しよう。', isCorrect: false },
        { text: '窓口にクレームを入れないようルール化し、書類上の「満足度100%」を維持し続けよう。', isCorrect: false }
      ]
    },
    {
      id: 'business_5',
      claim: '「生成AIツールは開発効率を10倍にする。エンジニアを9割削減しても同じアウトプットが可能だ」',
      context: '生産性指標の過度な単純化',
      options: [
        { text: 'エンジニアの主たる業務と付加価値は「コードの記述スピード」のみである', isCorrect: true },
        { text: '生成AIが書いたコードは100%バグがなく、人間のレビューや設計調整は不要である', isCorrect: false },
        { text: 'エンジニアが減れば、開発体制のコミュニケーションロスは自動的にゼロになる', isCorrect: false }
      ],
      bugExplanation: '業務の多面性を無視した単純化バグです。エンジニアリングの本質は、要件定義、システム設計、デバッグ、障害対応、運用、他部署連携であり、コード生成はその一部分にすぎません。',
      rewriteOptions: [
        { text: 'AI活用で空いた時間を設計や新規機能のブラッシュアップに充て、全体の質と速度を向上させよう。', isCorrect: true },
        { text: '予告なしにエンジニアの9割を解雇し、残った1割にAIを使って全員分のコードを書かせよう。', isCorrect: false },
        { text: 'AIはバグを出すので一切の利用を禁止し、これまで通りの手書き開発を厳守しよう。', isCorrect: false }
      ]
    },
    {
      id: 'business_6',
      claim: '「プロジェクトXは昨年大幅に遅延した。よって、あのプロジェクトマネージャーには二度と大型案件を任せるべきではない」',
      context: '根本的帰属誤謬（個人への責任集中）',
      options: [
        { text: 'プロジェクト遅延の唯一または決定的な要因は、常にプロジェクトマネージャー個人の能力不足である', isCorrect: true },
        { text: '一度遅延を経験したメンバーは、その後の案件でも必ず同じ遅延を繰り返す', isCorrect: false },
        { text: '他のメンバーや外部環境がどれほど変化しても、プロジェクト計画はマネジメント次第で遵守できる', isCorrect: false }
      ],
      bugExplanation: '外的要因（クライアント都合の仕様変更、突発的な人員離脱、技術的負債など）をすべて無視し、個人の責任に帰結させる「帰属のバグ」です。',
      rewriteOptions: [
        { text: '遅延の原因が外的要因なのか、マネジメント能力なのかをポストモータム（振り返り）で客観的に分析しよう。', isCorrect: true },
        { text: '他部署のマネージャーも同様に遅延したら全員降格処分にし、失敗者を徹底的に排除しよう。', isCorrect: false },
        { text: '遅延は不可抗力なので、PMの責任は一切問わず、今後はスケジュール自体を設定しないようにしよう。', isCorrect: false }
      ]
    }
  ]
};

const shuffleArray = (array) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

export default function HiddenAssumption({ onFinish, playSound, muted, toggleMute, mode, onLogBug, reviewQuestionId, onFinishReview }) {
  const [showTutorial, setShowTutorial] = useState(true);
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [step, setStep] = useState(1); // 1: Scan assumption, 2: Rewrite claim
  const [selectedOpt, setSelectedOpt] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanCompleted, setScanCompleted] = useState(false);
  const [isStep1Solved, setIsStep1Solved] = useState(false);
  const [isStep2Solved, setIsStep2Solved] = useState(false);
  const [hasRetriedStep1, setHasRetriedStep1] = useState(false);
  const [hasRetriedStep2, setHasRetriedStep2] = useState(false);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);

  const initializeQuestions = () => {
    const rawData = mode === 'business' ? QUESTIONS.business : QUESTIONS.daily;
    let finalized = [];
    if (reviewQuestionId) {
      const found = QUESTIONS.daily.find(q => q.id === reviewQuestionId) || 
                    QUESTIONS.business.find(q => q.id === reviewQuestionId);
      if (found) {
        finalized = [found];
        setShowTutorial(false);
        setScanCompleted(true);
      }
    }
    if (finalized.length === 0) {
      finalized = shuffleArray(rawData).slice(0, 5);
    }
    setQuestions(finalized);
    setCurrentIdx(0);
    setStep(1);
    setSelectedOpt(null);
    setIsScanning(false);
    if (!reviewQuestionId) {
      setScanCompleted(false);
    }
    setIsStep1Solved(false);
    setIsStep2Solved(false);
    setHasRetriedStep1(false);
    setHasRetriedStep2(false);
    setScore(0);
    setCompleted(false);
  };

  useEffect(() => {
    initializeQuestions();
  }, [mode]);

  if (questions.length === 0) return null;

  const currentQ = questions[currentIdx];

  const handleStartScan = () => {
    if (isScanning || scanCompleted) return;
    playSound('click');
    setIsScanning(true);
    // スキャン演出音またはクリック音
    setTimeout(() => {
      setIsScanning(false);
      setScanCompleted(true);
      playSound('correct');
    }, 1500);
  };

  const handleStep1Answer = (option, idx) => {
    if (isStep1Solved) return;
    playSound('click');
    setSelectedOpt(idx);

    if (option.isCorrect) {
      setIsStep1Solved(true);
      playSound('correct');
      if (!hasRetriedStep1) {
        setScore(prev => prev + 0.5); // 2ステップあるため、各ステップ0.5点（計1.0点）
      } else {
        setScore(prev => prev + 0.25); // リトライ成功時は半分
      }
    } else {
      if (!hasRetriedStep1) {
        setHasRetriedStep1(true);
        playSound('incorrect');
      } else {
        // 二段階誤答
        setIsStep1Solved(true);
        playSound('incorrect');
        if (onLogBug && !reviewQuestionId) {
          onLogBug('hiddenAssumption', currentQ.id, `Step 1の誤回答: ${option.text} (正解: ${currentQ.options.find(o => o.isCorrect)?.text})`, currentQ.claim);
        }
      }
    }
  };

  const handleGoToStep2 = () => {
    playSound('click');
    setStep(2);
    setSelectedOpt(null);
  };

  const handleStep2Answer = (option, idx) => {
    if (isStep2Solved) return;
    playSound('click');
    setSelectedOpt(idx);

    if (option.isCorrect) {
      setIsStep2Solved(true);
      playSound('correct');
      if (!hasRetriedStep2) {
        setScore(prev => prev + 0.5);
      } else {
        setScore(prev => prev + 0.25);
      }
    } else {
      if (!hasRetriedStep2) {
        setHasRetriedStep2(true);
        playSound('incorrect');
      } else {
        setIsStep2Solved(true);
        playSound('incorrect');
        if (onLogBug && !reviewQuestionId) {
          onLogBug('hiddenAssumption', currentQ.id, `Step 2の誤回答: ${option.text} (正解: ${currentQ.rewriteOptions.find(o => o.isCorrect)?.text})`, currentQ.claim);
        }
      }
    }
  };

  const handleNext = () => {
    playSound('click');
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(prev => prev + 1);
      setStep(1);
      setSelectedOpt(null);
      setScanCompleted(reviewQuestionId ? true : false);
      setIsStep1Solved(false);
      setIsStep2Solved(false);
      setHasRetriedStep1(false);
      setHasRetriedStep2(false);
    } else {
      setCompleted(true);
      if (reviewQuestionId && onFinishReview) {
        onFinishReview('hiddenAssumption', reviewQuestionId);
      } else {
        const finalScore = Math.round((score / questions.length) * 100);
        onFinish('hiddenAssumption', finalScore, false);
        playSound('success');
      }
    }
  };

  const currentProgressPercent = Math.round(((currentIdx + (step === 2 ? 0.5 : 0)) / questions.length) * 100);

  return (
    <div className="game-container fade-in">
      <div className="glass-panel" style={{ padding: '24px', position: 'relative' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <span style={{ color: 'var(--color-rose)', fontWeight: 'bold', fontSize: '14px', letterSpacing: '1px' }}>
              TRAINING MODULE 03 [2nd]
            </span>
            <h2 style={{ fontFamily: 'var(--font-display)', marginTop: '4px' }}>前提・隠れた仮定のデバッグ</h2>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button 
              onClick={toggleMute}
              className="btn btn-secondary" 
              style={{ padding: '8px', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            {!showTutorial && !completed && (
              <div className="score-badge" style={{ borderColor: 'var(--color-rose)', color: 'var(--color-rose)' }}>
                進捗: {currentIdx + 1} / {questions.length}
              </div>
            )}
          </div>
        </div>

        {showTutorial ? (
          /* Tutorial Screen */
          <div style={{ textAlign: 'left' }} className="fade-in">
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', color: 'var(--color-rose)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={20} /> 30秒解説：隠れた前提のデバッグとは？
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '20px' }}>
              あらゆるロジックや主張には、語り手が無意識に信じ込んでいる<strong>「隠れた仮定・前提（Hidden Assumption）」</strong>が潜んでいます。<br />
              一見正しそうに見える主張でも、この土台（前提）が歪んでいると、主張全体が「バグのある非論理」と化してしまいます。
            </p>
            <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(244, 63, 94, 0.05)', border: '1px solid rgba(244, 63, 94, 0.15)', marginBottom: '24px' }}>
              <span style={{ fontWeight: 'bold', color: 'var(--color-rose)', fontSize: '14px' }}>🔎 デバッグの流れ：</span>
              <ul style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px', paddingLeft: '20px', lineHeight: '1.8' }}>
                <li><strong>1. スキャン</strong>：主張の裏に隠された「暗黙の架け橋（仮定）」を見つけ出します。</li>
                <li><strong>2. デバッグ</strong>：その仮定の論理バグを特定し、より客観的で健全なロジックにリライトします。</li>
              </ul>
            </div>
            <button 
              onClick={() => setShowTutorial(false)}
              className="btn btn-primary"
              style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg, var(--color-rose) 0%, #be123c 100%)', border: 'none', boxShadow: '0 4px 15px var(--color-rose-glow)' }}
            >
              トレーニングを開始する
            </button>
          </div>
        ) : completed ? (
          /* Completion Screen */
          <div style={{ textAlign: 'center', padding: '40px 0' }} className="fade-in">
            <div style={{ display: 'inline-flex', background: 'rgba(244, 63, 94, 0.1)', padding: '20px', borderRadius: '50%', marginBottom: '24px' }}>
              <CheckCircle2 size={64} color="var(--color-rose)" />
            </div>
            <h3 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '8px' }}>トレーニング完了！</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' }}>
              主張の裏に隠されたバイアスと暗黙の前提を見破る「前提スキャナー」の訓練が完了しました。
            </p>
            <div style={{ background: 'var(--bg-inner-box)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '24px', maxWidth: '320px', margin: '0 auto 32px' }}>
              <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>スコア</span>
              <div style={{ fontSize: '48px', fontWeight: '800', color: 'var(--color-rose)', fontFamily: 'var(--font-display)', margin: '8px 0' }}>
                {Math.round((score / questions.length) * 100)}%
              </div>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                獲得XP: +{Math.round((score / questions.length) * 100) * 10} XP
              </span>
            </div>

            <RakutenWidget />

            <button 
              onClick={() => onFinish('hiddenAssumption', Math.round((score / questions.length) * 100), true)}
              className="btn btn-primary"
              style={{ width: '100%', maxWidth: '320px', padding: '14px', background: 'linear-gradient(135deg, var(--color-rose) 0%, #be123c 100%)', border: 'none' }}
            >
              ← ダッシュボードに戻る
            </button>
          </div>
        ) : (
          /* Game Screens */
          <div>
            {/* Progress Bar */}
            <div style={{ height: '4px', width: '100%', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', marginBottom: '24px', overflow: 'hidden' }}>
              <div 
                style={{ 
                  height: '100%', 
                  width: `${currentProgressPercent}%`, 
                  background: 'var(--color-rose)', 
                  transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)' 
                }} 
              />
            </div>

            {/* Step 1: Scan Assumption */}
            {step === 1 && (
              <div className="fade-in">
                <div style={{ background: 'var(--bg-inner-box)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '20px', marginBottom: '24px', textAlign: 'left' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '4px' }}>
                    {currentQ.context}
                  </span>
                  <p style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--text-primary)', marginTop: '12px', lineHeight: '1.6' }}>
                    {currentQ.claim}
                  </p>
                </div>

                {!scanCompleted ? (
                  /* Start scanning button */
                  <div style={{ textAlign: 'center', padding: '30px 0' }}>
                    {isScanning ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                        <div style={{
                          width: '60px',
                          height: '60px',
                          borderRadius: '50%',
                          border: '3px solid rgba(244, 63, 94, 0.2)',
                          borderTopColor: 'var(--color-rose)',
                          animation: 'spin 1s linear infinite'
                        }} />
                        <span style={{ fontSize: '14px', color: 'var(--color-rose)', fontWeight: 'bold', animation: 'pulse 1.5s infinite' }}>
                          隠れた大前提をスキャン中...
                        </span>
                      </div>
                    ) : (
                      <button 
                        onClick={handleStartScan}
                        className="btn btn-primary"
                        style={{
                          padding: '16px 36px',
                          background: 'rgba(244, 63, 94, 0.1)',
                          border: '2px solid var(--color-rose)',
                          color: 'var(--color-rose)',
                          fontWeight: 'bold',
                          borderRadius: '16px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '10px',
                          boxShadow: '0 0 15px rgba(244, 63, 94, 0.1)',
                          transition: 'all 0.3s'
                        }}
                      >
                        <Eye size={20} />
                        前提をスキャンする
                      </button>
                    )}
                  </div>
                ) : (
                  /* Render Scan Options */
                  <div className="fade-in">
                    <h4 style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '16px', textAlign: 'left' }}>
                      🔍 スキャン検出：この主張が拠って立つ「隠れた前提」はどれ？
                    </h4>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                      {currentQ.options.map((option, idx) => {
                        const isSelected = selectedOpt === idx;
                        const showCorrect = isStep1Solved && option.isCorrect;
                        const showIncorrect = isSelected && !option.isCorrect;
                        
                        let borderCol = 'var(--border-color)';
                        let bgCol = 'rgba(255,255,255,0.01)';
                        if (showCorrect) {
                          borderCol = 'var(--color-emerald)';
                          bgCol = 'rgba(16, 185, 129, 0.05)';
                        } else if (showIncorrect) {
                          borderCol = 'var(--color-rose)';
                          bgCol = 'rgba(244, 63, 94, 0.05)';
                        } else if (isSelected) {
                          borderCol = 'var(--color-rose)';
                        }

                        return (
                          <button
                            key={idx}
                            onClick={() => handleStep1Answer(option, idx)}
                            disabled={isStep1Solved}
                            className="btn"
                            style={{
                              textAlign: 'left',
                              padding: '16px',
                              borderRadius: '12px',
                              border: `1px solid ${borderCol}`,
                              background: bgCol,
                              color: 'var(--text-primary)',
                              fontSize: '13.5px',
                              lineHeight: '1.5',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              transition: 'all 0.2s',
                              cursor: isStep1Solved ? 'default' : 'pointer'
                            }}
                          >
                            <span>{option.text}</span>
                            {showCorrect && <CheckCircle2 size={18} color="var(--color-emerald)" />}
                            {showIncorrect && <XCircle size={18} color="var(--color-rose)" />}
                          </button>
                        );
                      })}
                    </div>

                    {/* Step 1 Retry Hint or Next Button */}
                    {hasRetriedStep1 && !isStep1Solved && (
                      <div style={{
                        padding: '12px 16px',
                        borderRadius: '12px',
                        background: 'rgba(244, 63, 94, 0.05)',
                        border: '1px solid rgba(244, 63, 94, 0.15)',
                        color: 'var(--color-rose)',
                        fontSize: '12.5px',
                        textAlign: 'left',
                        marginBottom: '20px'
                      }}>
                        💡 ヒント：元の主張が「○○だから、××だ」と決めつけている原因となる、直接の「思い込み（ルール）」を見つけましょう。
                      </div>
                    )}

                    {isStep1Solved && (
                      <button
                        onClick={handleGoToStep2}
                        className="btn btn-primary"
                        style={{
                          width: '100%',
                          padding: '14px',
                          background: 'linear-gradient(135deg, var(--color-rose) 0%, #be123c 100%)',
                          border: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px'
                        }}
                      >
                        次のデバッグステップへ
                        <ArrowRight size={16} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Debug and Rewrite */}
            {step === 2 && (
              <div className="fade-in">
                {/* Visual bug description box */}
                <div style={{ background: 'rgba(244, 63, 94, 0.05)', border: '1px solid rgba(244, 63, 94, 0.15)', borderRadius: '16px', padding: '20px', marginBottom: '24px', textAlign: 'left' }}>
                  <span style={{ fontSize: '11px', color: 'var(--color-rose)', fontWeight: 'bold' }}>
                    🚨 前提バグが検出されました：
                  </span>
                  <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', marginTop: '8px', lineHeight: '1.6' }}>
                    {currentQ.bugExplanation}
                  </p>
                </div>

                <h4 style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '16px', textAlign: 'left' }}>
                  🛠 記述のデバッグ：この前提を修正し、論理的に健全な主張にリライトする表現は？
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                  {currentQ.rewriteOptions.map((option, idx) => {
                    const isSelected = selectedOpt === idx;
                    const showCorrect = isStep2Solved && option.isCorrect;
                    const showIncorrect = isSelected && !option.isCorrect;

                    let borderCol = 'var(--border-color)';
                    let bgCol = 'rgba(255,255,255,0.01)';
                    if (showCorrect) {
                      borderCol = 'var(--color-emerald)';
                      bgCol = 'rgba(16, 185, 129, 0.05)';
                    } else if (showIncorrect) {
                      borderCol = 'var(--color-rose)';
                      bgCol = 'rgba(244, 63, 94, 0.05)';
                    } else if (isSelected) {
                      borderCol = 'var(--color-rose)';
                    }

                    return (
                      <button
                        key={idx}
                        onClick={() => handleStep2Answer(option, idx)}
                        disabled={isStep2Solved}
                        className="btn"
                        style={{
                          textAlign: 'left',
                          padding: '16px',
                          borderRadius: '12px',
                          border: `1px solid ${borderCol}`,
                          background: bgCol,
                          color: 'var(--text-primary)',
                          fontSize: '13.5px',
                          lineHeight: '1.5',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          transition: 'all 0.2s',
                          cursor: isStep2Solved ? 'default' : 'pointer'
                        }}
                      >
                        <span>{option.text}</span>
                        {showCorrect && <CheckCircle2 size={18} color="var(--color-emerald)" />}
                        {showIncorrect && <XCircle size={18} color="var(--color-rose)" />}
                      </button>
                    );
                  })}
                </div>

                {hasRetriedStep2 && !isStep2Solved && (
                  <div style={{
                    padding: '12px 16px',
                    borderRadius: '12px',
                    background: 'rgba(244, 63, 94, 0.05)',
                    border: '1px solid rgba(244, 63, 94, 0.15)',
                    color: 'var(--color-rose)',
                    fontSize: '12.5px',
                    textAlign: 'left',
                    marginBottom: '20px'
                  }}>
                    💡 ヒント：極端な二者択一や決めつけをやめ、客観的に検証（リサーチ）すべき項目を並べた、または他の可能性を残した表現を選びましょう。
                  </div>
                )}

                {isStep2Solved && (
                  <button
                    onClick={handleNext}
                    className="btn btn-primary"
                    style={{
                      width: '100%',
                      padding: '14px',
                      background: 'linear-gradient(135deg, var(--color-rose) 0%, #be123c 100%)',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    {currentIdx < questions.length - 1 ? '次の問題へ' : '結果を見る'}
                    <ArrowRight size={16} />
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
