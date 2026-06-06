import React, { useState, useEffect } from 'react';
import { 
  Compass, 
  HelpCircle, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  Zap, 
  Lock,
  GitFork,
  Activity,
  Play
} from 'lucide-react';
import RecoveryGearSection from '../common/RecoveryGearSection';

// 上級ロジックツリー課題（ダンジョンステージ）
const dungeonStages = [
  {
    id: 'stage1',
    name: '売上低迷の森',
    theme: 'カフェの年間売上高の分解',
    goal: 'カフェの売上をMECEに分解して、売上向上の足がかりとせよ！',
    options: [
      { id: 'op1', text: '客数 × 客単価' },
      { id: 'op2', text: '新規顧客 ＋ リピート顧客' },
      { id: 'op3', text: '注文数 × 平均注文単価' },
      { id: 'op4', text: '午前中の売上 ＋ 午後の売上', errorType: 'leak' }, // 誤り（ダブりはないが、ビジネス課題特定には不十分）
      { id: 'op5', text: 'ドリンクの売上 ＋ フードの売上', errorType: 'duplicate' } // 誤り
    ],
    correctStructure: {
      slots: [
        { id: 'root', label: '第1階層：売上の基本公式', expectedText: '客数 × 客単価', hint: 'お店全体の売上を最もシンプルかつ網羅的に計算する「掛け算」の組み合わせは何か？' },
        { id: 'sub1', label: '「客数」のMECE分解', expectedText: '新規顧客 ＋ リピート顧客', hint: '「お店に来た顧客の人数」を、漏れも重複もなく２つのグループに分けるには？' },
        { id: 'sub2', label: '「客単価」のMECE分解', expectedText: '注文数 × 平均注文単価', hint: '「1人あたりが使った平均金額」を分解します。購入した「商品の個数」と「その平均価格」の掛け算は？' }
      ]
    },
    explanation: '売上の公式は「客数 × 客単価」にMECE分解できます。さらに、客数は「新規 ＋ リピート」、客単価は「注文数 × 平均単価」に細分化することで、顧客獲得コストの削減やクロスセルの提案といった、具体的なアクションプランに繋がるツリーが完成します。'
  },
  {
    id: 'stage2',
    name: '無駄コストの火山',
    theme: 'スマートフォン年間通信費の削減案',
    goal: 'スマホの通信コストをMECEに分解し、削減余地をデバッグせよ！',
    options: [
      { id: 'op6', text: '基本料金の引き下げ ＋ 通話・通信オプションの見直し' },
      { id: 'op7', text: '格安SIMへの乗り換え ＋ 契約プランの容量ダウン' },
      { id: 'op8', text: '不要な有料アプリの解約 ＋ 通話割引サービスの適用' },
      { id: 'op9', text: 'スマホの画面の明るさを下げる', errorType: 'leak' }, // 誤り（インフラ削減に直結しない、MECEではない）
      { id: 'op10', text: '携帯ショップに相談しに行く', errorType: 'duplicate' } // 誤り
    ],
    correctStructure: {
      slots: [
        { id: 'root', label: '第1階層：通信費用の二大要素', expectedText: '基本料金の引き下げ ＋ 通話・通信オプションの見直し', hint: '毎月固定でかかる「基本料金」と、使い方によって変動・追加される「通話・通信オプション」の２つに大別しましょう。' },
        { id: 'sub1', label: '「基本料金」の削減手段', expectedText: '格安SIMへの乗り換え ＋ 契約プランの容量ダウン', hint: '基本のプラン代そのものを安くする方法です。通信事業者の変更や、契約ギガ数を下げるアプローチは？' },
        { id: 'sub2', label: '「オプション・アプリ」の削減手段', expectedText: '不要な有料アプリの解約 ＋ 通話割引サービスの適用', hint: '付加サービスを削減する方法です。月額アプリの整理や、かけ放題などの通話サービス適用は？' }
      ]
    },
    explanation: 'スマートフォンの通信コストは、毎月一定の「基本料金」と、使い方による「通話・通信オプション（アプリ含む）」にMECE分解できます。それぞれ「回線変更や容量ダウン」「不要なサブスク解約や割引適用」に細分化して削減案を具体化します。'
  },
  {
    id: 'stage3',
    name: '残業超過の荒野',
    theme: '社員の残業時間削減アプローチ',
    goal: '残業時間を減らし、健康的な職場環境と生産性向上を両立させよ！',
    options: [
      { id: 'op11', text: '業務量の削減（やめる・減らす） ＋ 業務プロセスの効率化（自動化・仕組み化）' },
      { id: 'op12', text: '無駄な会議や定例報告の廃止 ＋ 資料作成の簡易化・テンプレート化' },
      { id: 'op13', text: 'AIツールの導入による自動書き起こし ＋ 社内手続きの電子承認化によるスピード向上' },
      { id: 'op14', text: '残業を禁止する強制ルールの設定', errorType: 'duplicate' }, // 誤り
      { id: 'op15', text: '全員で早く帰るように声を掛け合う', errorType: 'leak' } // 誤り
    ],
    correctStructure: {
      slots: [
        { id: 'root', label: '第1階層：残業削減の二大アプローチ', expectedText: '業務量の削減（やめる・減らす） ＋ 業務プロセスの効率化（自動化・仕組み化）', hint: '残業を減らすには、こなすべき「仕事の量そのものを減らす」か、「仕事を進めるスピードを速くする」かの2択になります。' }, // correction below: 'of' replaced by 'の'
        { id: 'sub1', label: '「業務量削減」の具体策', expectedText: '無駄な会議や定例報告の廃止 ＋ 資料作成の簡易化・テンプレート化', hint: 'やらなくても致命的ではない定例業務をやめたり、資料の手間を減らすアプローチはどちらですか？' },
        { id: 'sub2', label: '「プロセス効率化」の具体策', expectedText: 'AIツールの導入による自動書き起こし ＋ 社内手続きの電子承認化によるスピード向上', hint: 'ITツールや仕組みを使って、同じ量の仕事をより短時間で終わらせるためのアプローチはどちらですか？' }
      ]
    },
    explanation: '残業削減は、こなす「業務量の削減」と、進行を速める「業務プロセスの効率化」にMECE分解できます。業務量削減は無駄な会議や資料の廃止、効率化はAIや電子承認の導入へと具体化することで、実効性のある残業対策が構築できます。'
  },
  {
    id: 'stage4',
    name: '顧客獲得の迷宮',
    theme: '新規モバイルアプリのユーザー獲得経路',
    goal: 'アプリの新規DL数を増やすための獲得チャネルをMECEに分類せよ！',
    options: [
      { id: 'op16', text: 'オーガニック（自然流入）チャネルの強化 ＋ ペイド（有料広告）チャネルの最適化' },
      { id: 'op17', text: 'アプリストアのSEO（ASO）対策 ＋ 口コミ・紹介（バイラル）機能の向上' },
      { id: 'op18', text: 'SNS広告・動画広告の出稿 ＋ インフルエンサーPR・アフィリエイトの活用' },
      { id: 'op19', text: 'とにかく街頭でチラシを配る', errorType: 'leak' }, // 誤り
      { id: 'op20', text: 'アプリのアイコンの色をもっと目立つ赤にする', errorType: 'duplicate' } // 誤り
    ],
    correctStructure: {
      slots: [
        { id: 'root', label: '第1階層：広告費用の有無による分解', expectedText: 'オーガニック（自然流入）チャネルの強化 ＋ ペイド（有料広告）チャネルの最適化', hint: 'ユーザーの流入経路を、直接的な広告費用をかけない獲得と、費用をかけて強制的に露出する獲得の２つに分けましょう。' },
        { id: 'sub1', label: '「自然流入」の具体策', expectedText: 'アプリストアのSEO（ASO）対策 ＋ 口コミ・紹介（バイラル）機能の向上', hint: 'ストア内検索での露出アップや、既存ユーザーからの紹介など、自発的なダウンロードを促す施策は？' },
        { id: 'sub2', label: '「有料広告」の具体策', expectedText: 'SNS広告・動画広告の出稿 ＋ インフルエンサーPR・アフィリエイトの活用', hint: 'メディアへの出稿やインフルエンサーへの対価支払いなど、予算を投じてリードを即座に増やす施策は？' }
      ]
    },
    explanation: 'アプリのユーザー獲得チャネルは、広告費をかけない「オーガニック」と、広告費をかける「ペイド」にMECE分解できます。オーガニックはASOや口コミ紹介、ペイドはSNS広告やアフィリエイト活用へ細分化してアプローチを整理します。'
  },
  {
    id: 'stage5',
    name: '流出防止の氷山',
    theme: 'サブスクサービスの解約（チャーン）防止策',
    goal: 'ユーザーがサービスを解約する要因をMECEに分解し、対策を立てよ！',
    options: [
      { id: 'op21', text: 'プロダクト自体の不満解消（価値不足） ＋ サポートやフォロー体制の強化（顧客体験）' },
      { id: 'op22', text: '主要機能のUI/UX改善による操作性向上 ＋ 新規コンテンツ・アップデートの頻度増加' },
      { id: 'op23', text: 'オンボーディングガイドの充実化 ＋ 解約直前のユーザーへの特別オファー提示' },
      { id: 'op24', text: '解約ボタンを分かりにくい場所に隠す', errorType: 'duplicate' }, // 誤り
      { id: 'op25', text: '解約したユーザーにアンケートで怒りをぶつける', errorType: 'leak' } // 誤り
    ],
    correctStructure: {
      slots: [
        { id: 'root', label: '第1階層：解約防止の二大領域', expectedText: 'プロダクト自体の不満解消（価値不足） ＋ サポートやフォロー体制の強化（顧客体験）', hint: '解約の原因を、提供している「システムやサービス自体への不満」と、それ以外の「サポートや初期体験の不満」の２つに分けましょう。' },
        { id: 'sub1', label: '「プロダクト不満」への対策', expectedText: '主要機能のUI/UX改善による操作性向上 ＋ 新規コンテンツ・アップデートの頻度増加', hint: 'アプリの使い勝手そのものを良くしたり、新機能を追加することで、サービスの価値を直接的に高める方法は？' },
        { id: 'sub2', label: '「顧客体験・サポート不満」への対策', expectedText: 'オンボーディングガイドの充実化 ＋ 解約直前のユーザーへの特別オファー提示', hint: '初期ユーザーの使い方をサポートしたり、離脱しかけている人に寄り添った個別アプローチを取る方法は？' }
      ]
    },
    explanation: '解約防止策は、製品そのものの価値を高める「プロダクト不満の解消」と、顧客接点の質を高める「サポート・フォローの強化」にMECE分解できます。プロダクト改善はUI/UXやコンテンツ追加、サポート強化はガイド充実や離脱防止オファーへ細分化されます。'
  },
  {
    id: 'stage6',
    name: 'コスト削減の試練',
    theme: '小売店舗の年間運営費の削減',
    goal: '店舗の運営コストをMECEに分類し、インパクトの大きい節約ポイントを特定せよ！',
    options: [
      { id: 'op26', text: '毎月の売上に連動する変動費の節約 ＋ 売上に関わらず一定の固定費の引き下げ' },
      { id: 'op27', text: '仕入れルート見直しによる材料費削減 ＋ 節電・LED化による水道光熱費の抑制' },
      { id: 'op28', text: 'シフトの自動最適化による人件費適正化 ＋ テナント家賃の値下げ交渉・店舗面積の縮小' },
      { id: 'op29', text: '営業時間を極端に短くして電気代を浮かす', errorType: 'leak' }, // 誤り
      { id: 'op30', text: '文房具の購入を禁止する', errorType: 'duplicate' } // 誤り
    ],
    correctStructure: {
      slots: [
        { id: 'root', label: '第1階層：コストの発生性質による分解', expectedText: '毎月の売上に連動する変動費の節約 ＋ 売上に関わらず一定の固定費の引き下げ', hint: '店舗コストを、売上高や来客数に応じて増減するコストと、営業していなくても必ず発生する固定のコストの２つに分けましょう。' },
        { id: 'sub1', label: '「変動費」の節約アプローチ', expectedText: '仕入れルート見直しによる材料費削減 ＋ 節電・LED化による水道光熱費の抑制', hint: '売上や稼働に伴って発生する、材料費（売上原価）や水道光熱費の削減に該当するものは？' },
        { id: 'sub2', label: '「固定費」の削減アプローチ', expectedText: 'シフトの自動最適化による人件費適正化 ＋ テナント家賃の値下げ交渉・店舗面積の縮小', hint: '毎月ほぼ固定で支払う家賃や、スケジュール調整可能な基本人件費の削減に該当するものは？' }
      ]
    },
    explanation: '店舗コスト削減は、売上規模で変動する「変動費の削減」と、毎月一定でかかる「固定費の引き下げ」にMECE分解できます。変動費は材料費や光熱費の削減、固定費はシフト適正化（人件費）や家賃交渉へと細分化されます。'
  },
  {
    id: 'stage7',
    name: '発売準備の砦',
    theme: '新商品の発売準備タスクの構造化',
    goal: '新製品ローンチに必要なタスクをMECEに分解し、スケジュール漏れを防げ！',
    options: [
      { id: 'op31', text: '「製品そのものを売れる状態にする」プロダクト準備 ＋ 「製品の存在を世に知らせる」マーケティング・営業準備' },
      { id: 'op32', text: '最終クオリティ検査・製品パッケージ決定 ＋ マニュアル作成・知財商標の登録手続き' },
      { id: 'op33', text: '宣伝パンフレット・プレスリリース作成 ＋ 営業担当へのデモ実演・価格表・販促ツールの配布' },
      { id: 'op34', text: '新商品の名前を社内公募で決める', errorType: 'duplicate' },
      { id: 'op35', text: 'とりあえず知り合いの社長に買ってもらう', errorType: 'leak' }
    ],
    correctStructure: {
      slots: [
        { id: 'root', label: '第1階層：準備タスクの二大柱', expectedText: '「製品そのものを売れる状態にする」プロダクト準備 ＋ 「製品の存在を世に知らせる」マーケティング・営業準備', hint: '新製品を出す準備は、モノを完成させる「作る側のタスク」と、それを売るための「売る側のタスク」の２つに大別できます。' },
        { id: 'sub1', label: '「プロダクト準備」の具体タスク', expectedText: '最終クオリティ検査・製品パッケージ決定 ＋ マニュアル作成・知財商標の登録手続き', hint: '製品自体の品質保証、パッケージデザイン、説明書、そして法的な権利保護に関するタスクのセットは？' },
        { id: 'sub2', label: '「マーケティング・営業準備」の具体タスク', expectedText: '宣伝パンフレット・プレスリリース作成 ＋ 営業担当へのデモ実演・価格表・販促ツールの配布', hint: 'メディア向け広報や宣伝物の作成、さらに営業部隊が売るための資料・研修といったタスクのセットは？' }
      ]
    },
    explanation: '新製品ローンチ準備は、製品自体の完成や法的・付随ドキュメントを揃える「プロダクト準備」と、世間に広めて営業を促す「マーケティング・営業準備」にMECE分解できます。それぞれ「検品・マニュアル」「プロモーション・営業支援」へと具体化され、タスク漏れをなくします。'
  },
  {
    id: 'stage8',
    name: '時間捻出の山脈',
    theme: '社会人の英語学習時間（週10時間）の捻出',
    goal: '日々の時間の使い方をMECEに整理し、学習用スキマ時間を捻出せよ！',
    options: [
      { id: 'op36', text: '生活習慣の中にある「無駄な余暇・活動」の削減 ＋ 「既存のアクティブ時間」の有効利用・マルチタスク化' },
      { id: 'op37', text: 'SNSやスマホゲーム時間の制限 ＋ 夜更かし・ダラダラする習慣の改善' },
      { id: 'op38', text: '通勤電車内でのリスニング学習 ＋ 入浴中や家事中のすきま学習の定着' },
      { id: 'op39', text: 'とにかく睡眠時間を削る', errorType: 'leak' },
      { id: 'op40', text: '英語スクールに申し込む', errorType: 'duplicate' }
    ],
    correctStructure: {
      slots: [
        { id: 'root', label: '第1階層：時間の捻出アプローチ', expectedText: '生活習慣の中にある「無駄な余暇・活動」の削減 ＋ 「既存のアクティブ時間」の有効利用・マルチタスク化', hint: '時間を生み出すには、無駄な行動をやめて時間を「純増」させるか、移動や家事など他のことをしている時間を「学習に兼ねる」かの2つになります。' },
        { id: 'sub1', label: '「無駄の時間」の削減手段', expectedText: 'SNSやスマホゲーム時間の制限 ＋ 夜更かし・ダラダラする習慣の改善', hint: '時間を浪費している悪習慣をやめ、物理的な自由時間を増やすアプローチは？' },
        { id: 'sub2', label: '「既存時間」の有効活用手段', expectedText: '通勤電車内でのリスニング学習 ＋ 入浴中や家事中のすきま学習 of 定着', hint: '別の作業をしている時間を学習と掛け合わせ、時間を「兼務」させるアプローチは？' }
      ]
    },
    explanation: '英語学習時間の捻出は、無駄な娯楽を削って時間を生み出す「無駄の削減」と、通勤や家事の時間を学習にあてる「既存時間の有効活用」にMECE分解できます。それぞれ「スマホ制限・早寝早起き」「電車内や家事中のすきま学習」へと具体化され、無理なく週10時間の捻出を目指します。'
  }
];

const shuffleArray = (array) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

export default function TreeQuest({ onFinish, playSound, muted, toggleMute, onBack, onLogBug, reviewQuestionId, onFinishReview }) {
  // ゲーム進行用ステート
  const [gameStatus, setGameStatus] = useState('tutorial'); // 'tutorial' | 'playing' | 'clear'
  const [activeStages, setActiveStages] = useState([]);
  const [stageIdx, setStageIdx] = useState(0); // 0, 1, 2

  // パズル配置状態
  const [currentStage, setCurrentStage] = useState(null);
  const [placedItems, setPlacedItems] = useState({}); // slotId -> optionId
  const [selectedOptionId, setSelectedOptionId] = useState(null);

  // 判定エフェクト
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null); // 'success' | 'fail' | null
  const [activeHintSlot, setActiveHintSlot] = useState(null);

  // 診断用ステート
  const [stageScanCount, setStageScanCount] = useState(0); // 現在のステージのスキャン試行回数
  const [scanCounts, setScanCounts] = useState([]); // 各ステージのスキャン回数記録

  // 1. ステージの初期化
  const initializeStage = (idx, stagesList = activeStages) => {
    if (stagesList.length === 0 || idx >= stagesList.length) return;
    const stage = stagesList[idx];
    setCurrentStage({
      ...stage,
      options: shuffleArray(stage.options)
    });
    setPlacedItems({});
    setSelectedOptionId(null);
    setIsScanning(false);
    setScanResult(null);
    setActiveHintSlot(null);
    setStageScanCount(0);
  };

  useEffect(() => {
    let initialStages = [];
    if (reviewQuestionId) {
      const found = dungeonStages.find(s => s.id === reviewQuestionId);
      if (found) {
        initialStages = [found];
        setGameStatus('playing');
      }
    }
    if (initialStages.length === 0) {
      initialStages = shuffleArray(dungeonStages).slice(0, 3);
    }
    setActiveStages(initialStages);
  }, []);

  useEffect(() => {
    if (activeStages.length > 0) {
      initializeStage(stageIdx, activeStages);
    }
  }, [stageIdx, activeStages]);

  if (!currentStage) return null;

  // 2. ドラッグ＆ドロップおよび選択肢配置ハンドラー
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
    setScanResult(null); // Clear previous scan result
    setPlacedItems(prev => {
      const next = { ...prev };
      // 他のスロットから既存配置を除去
      Object.keys(next).forEach(k => {
        if (next[k] === optionId) delete next[k];
      });
      next[slotId] = optionId;
      return next;
    });
    setSelectedOptionId(null);
  };

  const handleSlotClick = (slotId) => {
    if (isScanning || scanResult === 'success') return;
    if (selectedOptionId) {
      placeOption(selectedOptionId, slotId);
    } else {
      if (placedItems[slotId]) {
        playSound('click');
        setScanResult(null); // Clear previous scan result
        setPlacedItems(prev => {
          const next = { ...prev };
          delete next[slotId];
          return next;
        });
      }
    }
  };

  const handleOptionClick = (optionId) => {
    if (isScanning || scanResult === 'success') return;
    playSound('click');
    setSelectedOptionId(prev => prev === optionId ? null : optionId);
  };

  // 3. MECE開通チェックの実行（レーザースキャナー演出）
  const handleCheck = () => {
    playSound('click');
    setIsScanning(true);
    setStageScanCount(prev => prev + 1);

    // 2秒間のスキャン演出のあとに合否判定
    setTimeout(() => {
      setIsScanning(false);
      
      let correctCount = 0;
      const totalSlots = currentStage.correctStructure.slots.length;

      currentStage.options.forEach(option => {
        const placedSlotId = Object.keys(placedItems).find(k => placedItems[k] === option.id);
        if (placedSlotId) {
          const slot = currentStage.correctStructure.slots.find(s => s.id === placedSlotId);
          if (slot && slot.expectedText === option.text) {
            correctCount++;
          }
        }
      });

      const isAllCorrect = correctCount === totalSlots;

      if (isAllCorrect) {
        playSound('correct');
        setScanResult('success');
      } else {
        playSound('incorrect');
        setScanResult('fail');
        if (onLogBug && !reviewQuestionId) {
          const wrongSlots = [];
          currentStage.correctStructure.slots.forEach(slot => {
            const placedOptionId = placedItems[slot.id];
            const placedOption = currentStage.options.find(o => o.id === placedOptionId);
            if (!placedOption || placedOption.text !== slot.expectedText) {
              wrongSlots.push(`${slot.id === 'root' ? '課題' : slot.id === 'left' ? '要素1' : '要素2'}: ${placedOption ? placedOption.text : '未配置'} (正解: ${slot.expectedText})`);
            }
          });
          onLogBug('treeQuest', currentStage.id, `スロット誤配置: ${wrongSlots.join(', ')}`, currentStage.theme);
        }
      }
    }, 2000);
  };

  // 4. 次のステージへ
  const handleNext = () => {
    playSound('click');
    setScanCounts(prev => [...prev, stageScanCount]);

    if (stageIdx < activeStages.length - 1) {
      setStageIdx(prev => prev + 1);
    } else {
      // 全ステージクリア！
      playSound('success');
      if (reviewQuestionId && onFinishReview) {
        onFinishReview('treeQuest', reviewQuestionId);
      } else {
        const nextScanCounts = [...scanCounts, stageScanCount];
        const nextAccuracy = nextScanCounts.length > 0 
          ? Math.round(nextScanCounts.reduce((sum, c) => sum + getStageAccuracy(c), 0) / nextScanCounts.length)
          : 100;
        onFinish(nextAccuracy, false);
        setGameStatus('clear');
      }
    }
  };

  // 5. ゲームリセット
  const handleReset = () => {
    setStageIdx(0);
    setScanCounts([]);
    setStageScanCount(0);
    let initialStages = [];
    if (reviewQuestionId) {
      const found = dungeonStages.find(s => s.id === reviewQuestionId);
      if (found) {
        initialStages = [found];
      }
    }
    if (initialStages.length === 0) {
      initialStages = shuffleArray(dungeonStages).slice(0, 3);
    }
    setActiveStages(initialStages);
    setGameStatus('playing');
  };

  // 各ステージのスキャン回数からデバッグ精度（%）を算出
  // 1回でクリア -> 100%, 2回 -> 80%, 3回 -> 60%, 4回以上 -> 40%
  const getStageAccuracy = (count) => {
    if (count <= 1) return 100;
    if (count === 2) return 80;
    if (count === 3) return 60;
    return 40;
  };

  // スロットのエラー状態（重複、漏れ、階層ズレ）を判定するロジック
  const getSlotError = (slotId) => {
    if (scanResult !== 'fail') return null;
    const placedId = placedItems[slotId];
    if (!placedId) return 'leak'; // 配置されていないスロットは「漏れ」

    const placedOption = currentStage.options.find(o => o.id === placedId);
    if (!placedOption) return 'leak';

    const expectedSlot = currentStage.correctStructure.slots.find(s => s.id === slotId);
    if (placedOption.text === expectedSlot.expectedText) return null; // 正解！

    // オプション自体に定義されたエラータイプを判定
    if (placedOption.errorType) {
      return placedOption.errorType;
    }

    // 正解の選択肢だが別のスロットに配置されている場合は「階層ズレ（mismatch）」
    const isCorrectForOtherSlot = currentStage.correctStructure.slots.some(s => s.expectedText === placedOption.text);
    if (isCorrectForOtherSlot) {
      return 'mismatch';
    }

    return 'leak'; // デフォルトは「漏れ」
  };

  // SVG接続線のクラス名を取得する
  const getPathClass = (slotId) => {
    if (isScanning) return 'scanning';
    if (scanResult === 'success') return 'connected';
    if (scanResult === 'fail') {
      const error = getSlotError(slotId);
      if (error === 'duplicate') return 'failed-duplicate';
      if (error === 'leak') return 'failed-leak';
      if (error === 'mismatch') return 'failed-mismatch';
      return 'failed';
    }
    return '';
  };

  // スロット用のエラー警告バッジをレンダリングする
  const renderSlotBadge = (slotId) => {
    const error = getSlotError(slotId);
    if (!error) return null;
    
    let badgeText = '';
    let badgeColor = '';
    
    if (error === 'duplicate') {
      badgeText = '⚠️ 重複エラー';
      badgeColor = '#ef4444';
    } else if (error === 'leak') {
      badgeText = '💧 漏れエラー';
      badgeColor = '#06b6d4';
    } else if (error === 'mismatch') {
      badgeText = '🔄 階層ズレ';
      badgeColor = '#a855f7';
    }
    
    return (
      <div style={{ fontSize: '10px', color: badgeColor, fontWeight: 'bold', marginTop: '4px', letterSpacing: '0.5px' }}>
        {badgeText}
      </div>
    );
  };

  // 3ステージの平均精度
  const currentScanCounts = gameStatus === 'clear' ? scanCounts : [...scanCounts, stageScanCount];
  const totalAccuracy = currentScanCounts.length > 0 
    ? Math.round(currentScanCounts.reduce((sum, c) => sum + getStageAccuracy(c), 0) / currentScanCounts.length)
    : 100;
  const totalScans = currentScanCounts.reduce((sum, c) => sum + c, 0);

  // 6. 結果のセーブ＆ラボに戻る
  const handleFinishGame = () => {
    if (reviewQuestionId && onFinishReview) {
      onFinishReview('treeQuest', reviewQuestionId);
    } else {
      onFinish(totalAccuracy);
    }
  };

  const startQuest = () => {
    playSound('click');
    setStageIdx(0);
    setScanCounts([]);
    setStageScanCount(0);
    let initialStages = [];
    if (reviewQuestionId) {
      const found = dungeonStages.find(s => s.id === reviewQuestionId);
      if (found) {
        initialStages = [found];
      }
    }
    if (initialStages.length === 0) {
      initialStages = shuffleArray(dungeonStages).slice(0, 3);
    }
    setActiveStages(initialStages);
    setGameStatus('playing');
  };

  return (
    <div className="dungeon-wrapper" style={{ maxWidth: '850px', margin: '0 auto', padding: '0 16px' }}>
      
      {/* ネオンラインやレーザースキャナーのローカルスタイル定義 */}
      <style>{`
        .dungeon-wrapper {
          position: relative;
        }
        .tree-lab {
          position: relative;
          background: radial-gradient(circle, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.95) 100%);
          border-radius: 16px;
          border: 1px solid var(--border-color);
          box-shadow: inset 0 0 40px rgba(0, 0, 0, 0.8);
          padding: 24px;
          min-height: 380px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          margin-bottom: 24px;
        }
        body.light-theme .tree-lab {
          background: radial-gradient(circle, rgba(248, 250, 252, 0.95) 0%, rgba(226, 232, 240, 0.98) 100%);
          box-shadow: inset 0 0 40px rgba(15, 23, 42, 0.04), 0 4px 20px rgba(0, 0, 0, 0.05);
        }
        .grid-overlay {
          position: absolute;
          width: 100%; height: 100%;
          background-size: 30px 30px;
          background-image: 
            linear-gradient(to right, rgba(255, 255, 255, 0.015) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.015) 1px, transparent 1px);
          top: 0; left: 0;
          z-index: 1;
        }
        body.light-theme .grid-overlay {
          background-image: 
            linear-gradient(to right, rgba(15, 23, 42, 0.02) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(15, 23, 42, 0.02) 1px, transparent 1px);
        }
        .slot-hint-tooltip {
          position: absolute;
          bottom: 80px;
          left: 10px;
          background: #0f172a;
          border: 1px solid var(--color-amber);
          border-radius: 8px;
          padding: 10px 14px;
          font-size: 11.5px;
          color: var(--text-primary);
          width: 220px;
          z-index: 200;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.7);
          line-height: 1.4;
        }
        body.light-theme .slot-hint-tooltip {
          background: #ffffff;
          color: #0f172a;
          box-shadow: 0 4px 20px rgba(15, 23, 42, 0.15);
        }
        
        /* レーザースキャナーアニメーション */
        .scanner-beam {
          position: absolute;
          left: 0;
          width: 100%;
          height: 4px;
          background: linear-gradient(90deg, transparent, #fff, var(--color-cyan), #fff, transparent);
          box-shadow: 0 0 20px var(--color-cyan), 0 0 40px var(--color-cyan);
          z-index: 10;
          pointer-events: none;
          animation: scan-move 2s ease-in-out forwards;
        }
        @keyframes scan-move {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }

        /* ネオンラインの結合パルス */
        .neon-line {
          stroke: var(--border-color);
          stroke-width: 2.5;
          fill: none;
          transition: stroke 0.5s ease;
        }
        .neon-line.scanning {
          stroke: var(--color-cyan);
          filter: drop-shadow(0 0 8px rgba(6, 182, 212, 0.9));
          stroke-dasharray: 12, 6;
          animation: pulse-flow 15s linear infinite;
        }
        .neon-line.connected {
          stroke: var(--color-amber);
          filter: drop-shadow(0 0 6px rgba(245, 158, 11, 0.8));
          stroke-dasharray: 8, 4;
          animation: pulse-flow 25s linear infinite;
        }
        .neon-line.failed {
          stroke: #ef4444;
          filter: drop-shadow(0 0 4px rgba(239, 68, 68, 0.8));
          animation: short-circuit 0.3s ease infinite;
        }
        .neon-line.failed-duplicate {
          stroke: #ef4444;
          filter: drop-shadow(0 0 8px rgba(239, 68, 68, 0.9));
          stroke-width: 3.5;
          animation: short-circuit 0.12s ease infinite;
        }
        .neon-line.failed-leak {
          stroke: #06b6d4;
          filter: drop-shadow(0 0 6px rgba(6, 182, 212, 0.6));
          stroke-dasharray: 4, 12;
          animation: leak-flow 1.2s linear infinite;
        }
        .neon-line.failed-mismatch {
          stroke: #a855f7;
          filter: drop-shadow(0 0 5px rgba(168, 85, 247, 0.6));
          stroke-dasharray: 10, 5;
          animation: mismatch-pulse 1.8s ease infinite;
        }
        @keyframes pulse-flow {
          to {
            stroke-dashoffset: -1000;
          }
        }
        @keyframes short-circuit {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        @keyframes leak-flow {
          to {
            stroke-dashoffset: 40;
          }
        }
        @keyframes mismatch-pulse {
          0%, 100% { opacity: 0.5; stroke-width: 2.2; }
          50% { opacity: 1; stroke-width: 3.5; }
        }

        /* マナ進捗バー */
        .mana-bar-outer {
          height: 12px;
          border-radius: 6px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border-color);
          overflow: hidden;
          width: 100%;
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.4);
        }
        .mana-bar-inner {
          height: 100%;
          transition: width 0.5s cubic-bezier(0.25, 0.8, 0.25, 1);
          background: linear-gradient(90deg, #f59e0b, #d97706);
          box-shadow: 0 0 8px rgba(245, 158, 11, 0.4);
        }
        .slot-box {
          border: 2px dashed var(--border-item-slot);
          background: var(--bg-item-slot);
          border-radius: 12px;
          min-height: 64px;
          width: 240px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
          padding: 10px 8px;
          text-align: center;
          z-index: 5;
        }
        .slot-box.placed {
          border: 2px solid var(--color-amber);
          background: rgba(245, 158, 11, 0.06);
          box-shadow: 0 0 12px rgba(245, 158, 11, 0.15);
        }
        .slot-box.success {
          border: 2px solid var(--color-emerald) !important;
          background: rgba(16, 185, 129, 0.08) !important;
          box-shadow: 0 0 15px rgba(16, 185, 129, 0.2) !important;
        }
        .slot-box.failed-node {
          border: 2px solid #ef4444 !important;
          background: rgba(239, 68, 68, 0.08) !important;
          box-shadow: 0 0 15px rgba(239, 68, 68, 0.2) !important;
        }
        .slot-box.failed-duplicate-node {
          border: 2px solid #ef4444 !important;
          background: rgba(239, 68, 68, 0.12) !important;
          box-shadow: 0 0 15px rgba(239, 68, 68, 0.3) !important;
          animation: node-shake 0.35s ease;
        }
        .slot-box.failed-leak-node {
          border: 2px dashed #06b6d4 !important;
          background: rgba(6, 182, 212, 0.08) !important;
          box-shadow: 0 0 15px rgba(6, 182, 212, 0.2) !important;
        }
        .slot-box.failed-mismatch-node {
          border: 2px solid #a855f7 !important;
          background: rgba(168, 85, 247, 0.08) !important;
          box-shadow: 0 0 15px rgba(168, 85, 247, 0.2) !important;
        }
        @keyframes node-shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-4px); }
          40%, 80% { transform: translateX(4px); }
        }
      `}</style>

      {/* 1. チュートリアル */}
      {gameStatus === 'tutorial' && (
        <div className="glass-panel fade-in" style={{ padding: '32px', textAlign: 'left', borderLeft: '4px solid var(--color-amber)' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-amber)', fontSize: '22px', display: 'flex', alignItems: 'center', gap: '8px', marginTop: 0 }}>
            <Compass size={24} />
            Tree Quest : ロジックツリー構造化診断
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6', margin: '16px 0 24px 0' }}>
            複雑な課題を「MECE（漏れなくダブりなく）」に分解・構造化し、認知の接続ルートを修復するデバッグモジュールです。<br />
            ゲートを開通するために、テーマを正しく整理するパーツを配置し、最小の修正回数でスキャン開通を成功させてください。
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
            <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <strong style={{ fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                🔬 診断ルール:
              </strong>
              <ul style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px', paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li><strong>構造を修復せよ</strong>: スロットにパーツを配置し、「MECEチェック」を実行して回路を繋ぎます。</li>
                <li><strong>ペナルティの廃止（何度でも再試行可能）</strong>: スキャンに失敗しても途中でゲームオーバーになることはありません。解説やヒントをヒントに、納得いくまで配置を修正できます。</li>
                <li><strong>デバッグ精度の測定</strong>: 各ステージを「何回のスキャンで開通できたか（修正回数）」によって、あなたの論理的構造化精度（デバッグ率）を診断します。</li>
              </ul>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            <button onClick={startQuest} className="btn btn-primary" style={{ width: '100%', background: 'linear-gradient(135deg, var(--color-amber) 0%, #d97706 100%)', boxShadow: '0 4px 15px var(--color-amber-glow)' }}>
              <Play size={16} style={{ marginRight: '6px' }} />
              スキャンを開始する
            </button>
          </div>
        </div>
      )}

      {/* 2. ゲームプレイ画面 */}
      {gameStatus === 'playing' && (
        <div className="glass-panel fade-in" style={{ padding: '24px', position: 'relative' }}>
          
          {/* 上部ヘッダー */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <span style={{ color: 'var(--color-amber)', fontWeight: 'bold', fontSize: '11px', letterSpacing: '1.5px', fontFamily: 'var(--font-display)' }}>
                STAGE {stageIdx + 1} / {activeStages.length}
              </span>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: '2px 0 0 0', color: 'var(--text-primary)' }}>
                Dungeon: {currentStage.name}
              </h2>
            </div>

            {/* スキャン試行回数の表示 */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', width: '150px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px', fontSize: '12px', fontWeight: 'bold', color: 'var(--color-amber)' }}>
                <Activity size={13} style={{ color: 'var(--color-amber)' }} />
                SCAN TRIAL: {stageScanCount}回
              </div>
              <div className="mana-bar-outer" style={{ height: '6px' }}>
                <div 
                  className="mana-bar-inner" 
                  style={{ 
                    width: `${Math.max(0, 100 - stageScanCount * 25)}%`,
                    background: 'linear-gradient(90deg, #f59e0b, #d97706)'
                  }} 
                />
              </div>
            </div>
          </div>

          <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', marginBottom: '20px', textAlign: 'left', lineHeight: '1.5' }}>
            <strong>大テーマ:</strong> {currentStage.goal}<br />
            <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>※パーツを各スロットにドラッグ、またはクリックで配置してください。</span>
          </p>

          {/* 3. ツリーラボ */}
          <div style={{ width: '100%', overflowX: 'auto', marginBottom: '24px' }}>
            <div className="tree-lab" style={{ width: '780px', height: '340px', position: 'relative', flexShrink: 0, margin: '0 auto', display: 'block', padding: 0 }}>
              <div className="grid-overlay" />
              
              {/* スキャンビーム */}
              {isScanning && <div className="scanner-beam" />}

              {/* SVG 接続用ネオンライン */}
              <svg 
                style={{ 
                  position: 'absolute', 
                  top: 0, left: 0, 
                  width: '100%', height: '100%', 
                  pointerEvents: 'none', 
                  zIndex: 2 
                }}
              >
                {/* Theme から Root への接続線 */}
                <path 
                  d="M 160 170 L 250 170"
                  className={`neon-line ${getPathClass('root')}`}
                />
                {/* Root から Sub1 への接続線 */}
                <path 
                  d="M 490 170 C 505 170, 505 80, 520 80"
                  className={`neon-line ${getPathClass('sub1')}`}
                />
                {/* Root から Sub2 への接続線 */}
                <path 
                  d="M 490 170 C 505 170, 505 260, 520 260"
                  className={`neon-line ${getPathClass('sub2')}`}
                />
              </svg>

              {/* 大テーマ (固定ノード) */}
              <div 
                style={{ 
                  position: 'absolute',
                  left: '20px',
                  top: '140px',
                  width: '140px',
                  height: '60px',
                  background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(245, 158, 11, 0.05) 100%)', 
                  border: '1px solid var(--color-amber)',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  fontWeight: 'bold',
                  color: 'var(--color-amber)',
                  fontSize: '13px',
                  boxShadow: '0 0 12px rgba(245, 158, 11, 0.15)',
                  textAlign: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  justifycontent: 'center',
                  boxSizing: 'border-box',
                  zIndex: 5
                }}
              >
                {currentStage.theme}
              </div>

              {/* 第1階層スロット (Root) */}
              <div style={{ position: 'absolute', left: '250px', top: '140px', width: '240px', height: '60px', zIndex: 5 }}>
                <div 
                  style={{ 
                    position: 'absolute', 
                    bottom: '64px', 
                    left: 0, 
                    width: '100%',
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    gap: '4px',
                    lineHeight: '1.2'
                  }}
                >
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'bold', textAlign: 'center' }}>
                    {currentStage.correctStructure.slots[0].label}
                  </span>
                  <button 
                    onClick={() => setActiveHintSlot(activeHintSlot === 'root' ? null : 'root')}
                    style={{ background: 'none', border: 'none', color: 'var(--color-amber)', cursor: 'pointer', display: 'flex', padding: 0 }}
                  >
                    <HelpCircle size={12} />
                  </button>
                </div>

                {activeHintSlot === 'root' && (
                  <div className="slot-hint-tooltip fade-in">
                    💡 {currentStage.correctStructure.slots[0].hint}
                  </div>
                )}

                <div 
                  onClick={() => handleSlotClick('root')}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDrop(e, 'root')}
                  className={`slot-box ${placedItems['root'] ? 'placed' : ''} ${scanResult === 'success' ? 'success' : scanResult === 'fail' ? `failed-${getSlotError('root')}-node` : ''}`}
                  style={{ width: '100%', height: '100%', boxSizing: 'border-box' }}
                >
                  {placedItems['root'] ? (
                    <>
                      <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>
                        {currentStage.options.find(o => o.id === placedItems['root'])?.text}
                      </span>
                      {renderSlotBadge('root')}
                    </>
                  ) : (
                    <>
                      <span style={{ color: 'var(--text-muted)', opacity: 0.6 }}>[配置してください]</span>
                      {renderSlotBadge('root')}
                    </>
                  )}
                </div>
              </div>

              {/* 第2階層スロット (Sub1 / Sub2) */}
              {/* Sub1 (上) */}
              <div style={{ position: 'absolute', left: '520px', top: '50px', width: '240px', height: '60px', zIndex: 5 }}>
                <div 
                  style={{ 
                    position: 'absolute', 
                    bottom: '64px', 
                    left: 0, 
                    width: '100%',
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    gap: '4px',
                    lineHeight: '1.2'
                  }}
                >
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'bold', textAlign: 'center' }}>
                    {currentStage.correctStructure.slots[1].label}
                  </span>
                  <button 
                    onClick={() => setActiveHintSlot(activeHintSlot === currentStage.correctStructure.slots[1].id ? null : currentStage.correctStructure.slots[1].id)}
                    style={{ background: 'none', border: 'none', color: 'var(--color-amber)', cursor: 'pointer', display: 'flex', padding: 0 }}
                  >
                    <HelpCircle size={12} />
                  </button>
                </div>

                {activeHintSlot === currentStage.correctStructure.slots[1].id && (
                  <div className="slot-hint-tooltip fade-in">
                    💡 {currentStage.correctStructure.slots[1].hint}
                  </div>
                )}

                <div 
                  onClick={() => handleSlotClick(currentStage.correctStructure.slots[1].id)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDrop(e, currentStage.correctStructure.slots[1].id)}
                  className={`slot-box ${placedItems[currentStage.correctStructure.slots[1].id] ? 'placed' : ''} ${scanResult === 'success' ? 'success' : scanResult === 'fail' ? `failed-${getSlotError(currentStage.correctStructure.slots[1].id)}-node` : ''}`}
                  style={{ width: '100%', height: '100%', boxSizing: 'border-box' }}
                >
                  {placedItems[currentStage.correctStructure.slots[1].id] ? (
                    <>
                      <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>
                        {currentStage.options.find(o => o.id === placedItems[currentStage.correctStructure.slots[1].id])?.text}
                      </span>
                      {renderSlotBadge(currentStage.correctStructure.slots[1].id)}
                    </>
                  ) : (
                    <>
                      <span style={{ color: 'var(--text-muted)', opacity: 0.6 }}>[配置してください]</span>
                      {renderSlotBadge(currentStage.correctStructure.slots[1].id)}
                    </>
                  )}
                </div>
              </div>

              {/* Sub2 (下) */}
              <div style={{ position: 'absolute', left: '520px', top: '230px', width: '240px', height: '60px', zIndex: 5 }}>
                <div 
                  style={{ 
                    position: 'absolute', 
                    bottom: '64px', 
                    left: 0, 
                    width: '100%',
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    gap: '4px',
                    lineHeight: '1.2'
                  }}
                >
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'bold', textAlign: 'center' }}>
                    {currentStage.correctStructure.slots[2].label}
                  </span>
                  <button 
                    onClick={() => setActiveHintSlot(activeHintSlot === currentStage.correctStructure.slots[2].id ? null : currentStage.correctStructure.slots[2].id)}
                    style={{ background: 'none', border: 'none', color: 'var(--color-amber)', cursor: 'pointer', display: 'flex', padding: 0 }}
                  >
                    <HelpCircle size={12} />
                  </button>
                </div>

                {activeHintSlot === currentStage.correctStructure.slots[2].id && (
                  <div className="slot-hint-tooltip fade-in">
                    💡 {currentStage.correctStructure.slots[2].hint}
                  </div>
                )}

                <div 
                  onClick={() => handleSlotClick(currentStage.correctStructure.slots[2].id)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDrop(e, currentStage.correctStructure.slots[2].id)}
                  className={`slot-box ${placedItems[currentStage.correctStructure.slots[2].id] ? 'placed' : ''} ${scanResult === 'success' ? 'success' : scanResult === 'fail' ? `failed-${getSlotError(currentStage.correctStructure.slots[2].id)}-node` : ''}`}
                  style={{ width: '100%', height: '100%', boxSizing: 'border-box' }}
                >
                  {placedItems[currentStage.correctStructure.slots[2].id] ? (
                    <>
                      <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>
                        {currentStage.options.find(o => o.id === placedItems[currentStage.correctStructure.slots[2].id])?.text}
                      </span>
                      {renderSlotBadge(currentStage.correctStructure.slots[2].id)}
                    </>
                  ) : (
                    <>
                      <span style={{ color: 'var(--text-muted)', opacity: 0.6 }}>[配置してください]</span>
                      {renderSlotBadge(currentStage.correctStructure.slots[2].id)}
                    </>
                  )}
                </div>
              </div>

            </div>
          </div>

          {/* 4. 選択肢パーツ */}
          {scanResult !== 'success' && !isScanning && (
            <div style={{ marginBottom: '24px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '10px', textAlign: 'left', fontWeight: 'bold' }}>
                開通ルートパーツ選択肢（クリックまたはドラッグでスロットへ配置）：
              </span>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
                {currentStage.options.map((option) => {
                  const isPlaced = Object.values(placedItems).includes(option.id);
                  const isSelected = selectedOptionId === option.id;

                  return (
                    <div
                       key={option.id}
                      draggable={!isPlaced}
                      onDragStart={(e) => handleDragStart(e, option.id)}
                      onClick={() => !isPlaced && handleOptionClick(option.id)}
                      style={{
                        padding: '10px 16px',
                        borderRadius: '10px',
                        background: isSelected ? 'var(--color-amber)' : 'var(--bg-draggable-item)',
                        border: `1px solid ${isSelected ? 'var(--color-amber)' : 'var(--border-color)'}`,
                        color: isSelected ? '#000000' : isPlaced ? 'var(--text-draggable-placed)' : 'var(--text-primary)',
                        cursor: isPlaced ? 'not-allowed' : 'grab',
                        opacity: isPlaced ? 0.35 : 1,
                        fontSize: '13px',
                        fontWeight: 'bold',
                        transition: 'all 0.2s',
                        boxShadow: isSelected ? '0 0 10px var(--color-amber-glow)' : 'none',
                        transform: isSelected ? 'scale(1.02)' : 'scale(1)'
                      }}
                    >
                      {option.text}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 解答フィードバック解説 */}
          {scanResult && !isScanning && (
            <div 
              style={{ 
                padding: '16px 20px', 
                borderRadius: '12px', 
                backgroundColor: scanResult === 'success' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                border: `1px solid ${scanResult === 'success' ? 'var(--color-emerald)' : '#ef4444'}`,
                marginBottom: '24px',
                textAlign: 'left',
                animation: 'fadeIn 0.3s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                {scanResult === 'success' ? (
                  <>
                    <CheckCircle2 style={{ color: 'var(--color-emerald)' }} />
                    <strong style={{ color: 'var(--color-emerald)', fontSize: '14.5px' }}>MECEチェック合格！開通しました</strong>
                  </>
                ) : (
                  <>
                    <XCircle style={{ color: '#ef4444' }} />
                    <strong style={{ color: '#ef4444', fontSize: '14.5px' }}>スキャン失敗：不開通（配置にモレや重複があります）</strong>
                  </>
                )}
              </div>
              <p style={{ fontSize: '13px', lineHeight: '1.5', color: 'var(--text-secondary)', margin: 0 }}>
                {currentStage.explanation}
              </p>
            </div>
          )}

          {/* 下部アクションバー */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              {scanResult !== 'success' && !isScanning && (
                <button 
                  onClick={() => {
                    setPlacedItems({});
                    setScanResult(null);
                  }} 
                  className="btn btn-secondary"
                  disabled={Object.keys(placedItems).length === 0}
                  style={{ 
                    padding: '8px 18px', 
                    fontSize: '13px',
                    opacity: Object.keys(placedItems).length === 0 ? 0.5 : 1,
                    cursor: Object.keys(placedItems).length === 0 ? 'not-allowed' : 'pointer'
                  }}
                >
                  リセット
                </button>
              )}
            </div>

            <div>
              {isScanning ? (
                <button className="btn btn-primary" disabled style={{ padding: '10px 24px', fontSize: '13.5px', background: 'var(--bg-draggable-item)', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                  <Activity size={14} className="pulse" style={{ marginRight: '6px' }} />
                  MECEスキャンを実行中...
                </button>
              ) : scanResult !== 'success' ? (
                <button 
                  onClick={handleCheck} 
                  className="btn btn-primary"
                  style={{ 
                    padding: '10px 24px', 
                    fontSize: '13.5px',
                    background: Object.keys(placedItems).length < currentStage.correctStructure.slots.length
                      ? 'var(--bg-inner-box)'
                      : 'linear-gradient(135deg, var(--color-amber) 0%, #d97706 100%)', 
                    border: Object.keys(placedItems).length < currentStage.correctStructure.slots.length
                      ? '1px solid var(--border-color)'
                      : 'none',
                    color: Object.keys(placedItems).length < currentStage.correctStructure.slots.length
                      ? 'var(--text-muted)'
                      : '#0a0b10',
                    boxShadow: Object.keys(placedItems).length < currentStage.correctStructure.slots.length
                      ? 'none'
                      : '0 4px 15px var(--color-amber-glow)',
                    cursor: Object.keys(placedItems).length < currentStage.correctStructure.slots.length
                      ? 'not-allowed'
                      : 'pointer'
                  }}
                  disabled={Object.keys(placedItems).length < currentStage.correctStructure.slots.length}
                >
                  <Activity size={14} style={{ marginRight: '6px' }} />
                  MECEチェック（開通）
                </button>
              ) : (
                <button 
                  onClick={handleNext} 
                  className="btn btn-primary" 
                  style={{ 
                    padding: '10px 24px', 
                    fontSize: '13.5px',
                    background: 'linear-gradient(135deg, var(--color-emerald) 0%, #059669 100%)', 
                    boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)' 
                  }}
                >
                  {stageIdx < activeStages.length - 1 ? '次のダンジョンへ' : '結果を見る'}
                  <ArrowRight size={14} style={{ marginLeft: '6px' }} />
                </button>
              )}
            </div>
          </div>

        </div>
      )}

      {/* 4. クエストクリア画面 */}
      {gameStatus === 'clear' && (
        <div className="glass-panel fade-in" style={{ padding: '40px 32px', textAlign: 'center', borderLeft: '4px solid var(--color-emerald)' }}>
          <CheckCircle2 size={64} style={{ color: 'var(--color-emerald)', marginBottom: '20px', margin: '0 auto' }} />
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', margin: '16px 0 12px 0' }}>
            ツリー構造化診断 完了
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14.5px', marginBottom: '32px' }}>
            すべてのスロットへMECEな階層ルートを通し、複雑な事業課題のダンジョンを見事に踏破しました！
          </p>

          <div style={{ display: 'flex', gap: '32px', justifyContent: 'center', marginBottom: '32px' }}>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>平均デバッグ構造化精度</div>
              <div style={{ fontSize: '28px', fontFamily: 'var(--font-display)', fontWeight: 'bold', color: 'var(--color-amber)', marginTop: '4px' }}>
                {totalAccuracy}%
              </div>
            </div>
            <div style={{ borderLeft: '1px solid var(--border-color)' }}></div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>スキャン（修正）試行総数</div>
              <div style={{ fontSize: '28px', fontFamily: 'var(--font-display)', fontWeight: 'bold', color: 'var(--color-emerald)', marginTop: '4px' }}>
                {totalScans} 回
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
            <button onClick={handleReset} className="btn btn-secondary">
              <RotateCcw size={16} style={{ marginRight: '6px' }} />
              もう一度挑戦
            </button>
          </div>

          {/* 推奨デバッガー装備 */}
          <RecoveryGearSection />
        </div>
      )}

    </div>
  );
}
