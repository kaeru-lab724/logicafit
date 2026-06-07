import React, { useState, useEffect } from 'react';
import { 
  Terminal, 
  Cpu, 
  Layers, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  ShieldAlert,
  Play,
  ChevronLeft
} from 'lucide-react';
import RecoveryGearSection from '../common/RecoveryGearSection';

const shuffleArray = (array) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

const strategicDaily = [
  {
    id: 'st_d1',
    title: '健康維持 vs 自由時間',
    description: '仕事と趣味が忙しく、運動する時間がない。睡眠時間を削ると健康を害するが、運動のために趣味の時間を諦めたくない。',
    dilemma: '「趣味・自由時間の確保」 vs 「健康維持のための運動時間」',
    step1: {
      question: 'この状況における対立（ジレンマ）の本質的な構造は何か？',
      choices: [
        { text: '時間という有限なアセットを、趣味と運動のどちらに分配するかという「時間配分のトレードオフ」', isCorrect: true, feedback: '正解！限られた時間資源を異なる活動にどう配分するかという対立構造です。' },
        { text: '運動を始めると趣味への興味が失われてしまうという「モチベーションの対立」', isCorrect: false, feedback: '不正解。興味の問題ではなく、純粋な時間アセットの不足が問題です。' },
        { text: '趣味を諦めることで発生するストレスと、運動不足による肉体的ストレスの「ストレスの対立」', isCorrect: false, feedback: '不正解。精神的ストレスは結果であり、根本的なジレンマ構造は時間資源の奪い合いです。' }
      ]
    },
    step2: {
      question: 'この二律背反を解消し、両立させる「戦略パッチ（コンパイル解決）」はどれか？',
      choices: [
        { text: '通勤時間や日々の移動にHIITや階段昇降などの高強度運動を組み込み、日常タスクを運動化する（アクティブ・トランジット）', isCorrect: true, feedback: 'コンパイル成功！移動という必須プロセスに運動を統合することで、趣味の時間を削らずに運動量を確保できます。' },
        { text: '運動する日だけ趣味を半分に減らすか、週末にまとめて3時間運動する（時間を切り出す妥協案）', isCorrect: false, feedback: 'コンパイル失敗（妥協バグ）。趣味の時間を犠牲にするか、週末の余暇を圧迫するトレードオフのままです。' },
        { text: '来月からジムに通うことにして、今は現状維持のまま様子を見る（先送り・思考停止）', isCorrect: false, feedback: 'コンパイル失敗（放置バグ）。ジレンマが解決されず、問題が先送りされているだけです。' }
      ]
    }
  },
  {
    id: 'st_d2',
    title: '食費節約 vs 時短・健康',
    description: '食費を抑えるために自炊を徹底したいが、仕事が忙しく買い出しや調理の時間が取れない。外食やデリバリーに頼ると食費が跳ね上がり、カップ麺ばかりでは栄養が偏る。',
    dilemma: '「食費の抑制（経済性）」 vs 「自炊のための時間確保（時短・健康）」',
    step1: {
      question: 'この状況における対立（ジレンマ）の本質的な構造は何か？',
      choices: [
        { text: '支出を減らすための「労働時間の削減」と「余暇の増加」の対立', isCorrect: false, feedback: '不正解。労働時間を減らす話ではなく、食生活のコストと手間の対立です。' },
        { text: '自炊にかかる「調理時間コスト」と、外食等による「金銭的コスト」のトレードオフ', isCorrect: true, feedback: '正解！時間と金銭のどちらをコストとして差し出すかという対立構造です。' },
        { text: '健康的な食事と、ジャンクフードの美味しさの「嗜好の対立」', isCorrect: false, feedback: '不正解。嗜好の対立ではなく、健康・時間・費用のトリレンマ構造です。' }
      ]
    },
    step2: {
      question: 'この二律背反を解消し、両立させる「戦略パッチ（コンパイル解決）」はどれか？',
      choices: [
        { text: '安いけれど栄養の偏るカップ麺や値引き惣菜で済ませる（健康を犠牲にする）', isCorrect: false, feedback: 'コンパイル失敗（妥協バグ）。健康維持という目的を犠牲にしており、二律背反が解消されていません。' },
        { text: '週末に下処理済みの食材をまとめて冷凍し、平日は電気圧力鍋やワンパンで調理する半自動バルク調理（ミールプレップ）', isCorrect: true, feedback: 'コンパイル成功！調理プロセスをまとめて効率化（バッチ処理化）することで、時間と金銭コストの両方を削減します。' },
        { text: '平日は毎日デリバリーを頼み、その分他の娯楽費を極限まで削る（家計の圧迫）', isCorrect: false, feedback: 'コンパイル失敗（歪みバグ）。家計の別部分に負担を強いるだけで、食費と手間の問題は解決していません。' }
      ]
    }
  },
  {
    id: 'st_d3',
    title: '読書インプット量 vs 娯楽・リラックス',
    description: 'スキルアップのために毎月多くの本を読みたいが、疲れて帰宅した後は動画鑑賞やゲームをしてリラックスしたい。読書をはじめると頭が疲れてしまい、リラックスできない。',
    dilemma: '「自己投資（読書）の時間」 vs 「疲労回復・娯楽の時間」',
    step1: {
      question: 'この状況における対立（ジレンマ）の本質的な構造は何か？',
      choices: [
        { text: '読書による「脳の能動的疲労」と、動画等による「受動的リラックス」の相反', isCorrect: true, feedback: '正解！脳の処理負荷（能動vs受動）の相反によるエネルギー消費のコンフリクトです。' },
        { text: '本を買う「書籍購入費用」と、ゲーム等の「娯楽費用」の金銭的対立', isCorrect: false, feedback: '不正解。お金ではなく、帰宅後の脳のエネルギー（認知資源）の対立です。' },
        { text: 'ビジネス書と、小説・エンタメのどちらを選ぶかという「ジャンルの対立」', isCorrect: false, feedback: '不正解。読書自体の認知負荷とリラックスしたい欲求の対立です。' }
      ]
    },
    step2: {
      question: 'この二律背反を解消し、両立させる「戦略パッチ（コンパイル解決）」はどれか？',
      choices: [
        { text: '週末に予定を入れず、無理やり丸一日読書に充てる（リフレッシュ時間の消失）', isCorrect: false, feedback: 'コンパイル失敗（妥協バグ）。週末のリフレッシュ時間が奪われ、平日のパフォーマンス低下に繋がります。' },
        { text: 'いつかまとまった時間ができたら読もうと本を買いだめする（積読化）', isCorrect: false, feedback: 'コンパイル失敗（放置バグ）。行動を起こさず問題を先送りしています。' },
        { text: '通勤中や入浴中にオーディオブックを1.5倍速で聴き、娯楽として楽しむ「耳学」を取り入れる（インプットの受動的マルチタスク化）', isCorrect: true, feedback: 'コンパイル成功！受動的で耳だけが空いている時間を利用し、音声インプットとすることで脳の能動的疲労を避けながら学習できます。' }
      ]
    }
  },
  {
    id: 'st_d4',
    title: '部屋の整理整頓 vs 物を捨てる痛み',
    description: '部屋をスッキリ整理したいが、思い出の品や「いつか使うかもしれない物」が多すぎて捨てられない。無理に捨てると後悔しそうだが、このままでは部屋が手狭になる一方である。',
    dilemma: '「部屋の広さ・機能性の確保」 vs 「所有による精神的満足・未練の解消」',
    step1: {
      question: 'この状況における対立（ジレンマ）の本質的な構造は何か？',
      choices: [
        { text: '物の「処分コスト（手数料）」と、持ち続ける「保管コスト（家賃）」の対立', isCorrect: false, feedback: '不正解。物理的コストではなく、物の整理と所有欲・執着心の対立です。' },
        { text: '空間の「物理的容量（スペース）」と、不要物の「所有による心理的執着」の対立', isCorrect: true, feedback: '正解！限られた物理スペースと、物を手放す際の心理的痛み（未練）の対立です。' },
        { text: 'ゴミ出しの手間と、綺麗な部屋の快適さの「モチベーションの対立」', isCorrect: false, feedback: '不正解。手間が本質ではなく、捨てるべきか持ち続けるべきかの葛藤です。' }
      ]
    },
    step2: {
      question: 'この二律背反を解消し、両立させる「戦略パッチ（コンパイル解決）」はどれか？',
      choices: [
        { text: '段ボールに『一時保管箱：期限○月○日』と書き、迷う物をすべて入れて見えない場所に保管。半年間一度も開けなかったら中身を見ずに自動廃棄する『バッファ保管ルール』', isCorrect: true, feedback: 'コンパイル成功！「今捨てる」という即時判断を避け、期限というシステムによって心理的痛みを低減させつつ空間を確保します。' },
        { text: 'とりあえず棚やクローゼットの奥にギュウギュウに詰め込んで見えなくする（問題の不可視化）', isCorrect: false, feedback: 'コンパイル失敗（妥協バグ）。物理スペースは解消されず、ただ単に問題をクローゼットの奥へ先送りしただけです。' },
        { text: 'もっと広い部屋に引っ越して収納スペース自体を増やす（収納の拡張）', isCorrect: false, feedback: 'コンパイル失敗（拡大バグ）。根本的な所有癖を解決せずコストだけを増やしているため、いずれまた物で溢れます。' }
      ]
    }
  },
  {
    id: 'st_d5',
    title: '英語の学習継続 vs 家族との時間',
    description: '将来のキャリアのために英語の学習を毎日2時間確保したいが、そうするとパートナーや家族と過ごす時間が激減し、関係がギクシャクしてしまう。',
    dilemma: '「自己研鑽（英語学習）の時間」 vs 「大切な人とのコミュニケーション時間」',
    step1: {
      question: 'この状況における対立（ジレンマ）の本質的な構造は何か？',
      choices: [
        { text: '自分一人の「孤立した集中時間」と、他者との「協調・共有時間」のトレードオフ', isCorrect: true, feedback: '正解！孤独なインプットと他者との関係維持という、相反する時間的性質の対立です。' },
        { text: '教材購入にかかる「教育投資費」と、家族との「レジャー費用」の金銭的対立', isCorrect: false, feedback: '不正解。お金の対立ではなく、時間の性質と使い方の対立です。' },
        { text: '仕事での「キャリアアップ」と、私生活における「家庭の安定」の人生目標の対立', isCorrect: false, feedback: '不正解。目標自体は対立していませんが、その達成手段としての時間確保が競合しています。' }
      ]
    },
    step2: {
      question: 'この二律背反を解消し、両立させる「戦略パッチ（コンパイル解決）」はどれか？',
      choices: [
        { text: '学習時間を1時間に短縮し、お互いに中途半端な状態で妥協する（目標の引き下げ）', isCorrect: false, feedback: 'コンパイル失敗（妥協バグ）。学習目標も家族関係もどちらも十分に満たされず、じわじわと後退します。' },
        { text: '家族と一緒の趣味（映画鑑賞など）の時間を英語字幕・英語音声で行う、または日常会話の一部を英語で一緒に楽しむゲームにする（学習環境の共有・生活への統合）', isCorrect: true, feedback: 'コンパイル成功！英語学習を家族との共有体験に統合することで、対立していた時間を同一化します。' },
        { text: 'パートナーの寝静まった深夜に勉強し、自分の睡眠時間を削る（健康の切り売り）', isCorrect: false, feedback: 'コンパイル失敗（自虐バグ）。睡眠不足による健康被害や翌日の集中力低下という別の致命的なバグを引き起こします。' }
      ]
    }
  }
];

const strategicBusiness = [
  {
    id: 'st_b1',
    title: '開発のスピード vs コードの品質',
    description: 'スタートアップで競合より早く新機能をリリースしなければならないが、スピード重視で開発するとコードがスパゲッティ化し、将来の技術負債となって改修コストが跳ね上がる。',
    dilemma: '「新機能の市場最速投入（スピード）」 vs 「堅牢で保守しやすいコード設計（品質）」',
    step1: {
      question: 'この状況における対立（ジレンマ）の本質的な構造は何か？',
      choices: [
        { text: '短期的な「市場優位性の獲得（スピード）」と、長期的な「運用・保守の持続性（品質）」のトレードオフ', isCorrect: true, feedback: '正解！短期利益と長期持続性の時間軸のズレが生むクラシックなトレードオフ構造です。' },
        { text: '開発エンジニアの「スキル不足」と、経営陣の「無理な納期要求」の対立', isCorrect: false, feedback: '不正解。属人的な対立ではなく、スピードと品質の構造的トレードオフです。' },
        { text: '最新のフレームワーク導入と、古い安定技術のどちらを使うかという「技術選定の対立」', isCorrect: false, feedback: '不正解。技術選定自体が論点ではなく、リリース速度とコード品質の対立です。' }
      ]
    },
    step2: {
      question: 'この二律背反を解消し、両立させる「戦略パッチ（コンパイル解決）」はどれか？',
      choices: [
        { text: 'テストコードの作成を全面的にスキップし、とにかく力技で動くものをリリースする（品質の犠牲）', isCorrect: false, feedback: 'コンパイル失敗（負債バグ）。一時的にはリリースできますが、直後にバグが多発し、結果的に開発速度は大幅に低下します。' },
        { text: '品質基準を満たさない限りリリースは一切行わないと主張し、開発スケジュールを3ヶ月延期する（スピードの犠牲）', isCorrect: false, feedback: 'コンパイル失敗（機会損失バグ）。競合に市場を奪われ、会社自体の存続が危ぶまれる可能性があります。' },
        { text: '重要機能のみコア部分をテスト駆動（TDD）で固め、周辺UIはノーコードや生成AIによるモックで高速リリースし、市場検証後に自動リファクタリングを挟む（段階的アジャイルデリバリー）', isCorrect: true, feedback: 'コンパイル成功！コア（品質）と非コア（スピード）を分離し、段階的に投資することで両方を満たします。' }
      ]
    }
  },
  {
    id: 'st_b2',
    title: '厳格なセキュリティ vs 従業員の業務効率',
    description: '情報漏洩を防ぐために社内PCのセキュリティやアクセス権限を強化したいが、ルールを厳しくしすぎると申請手続きやVPNの接続に時間がかかり、日々の業務効率が著しく低下する。',
    dilemma: '「情報漏洩リスクの最小化（セキュリティ）」 vs 「申請や接続ストレスのない業務スピード（生産性）」',
    step1: {
      question: 'この状況における対立（ジレンマ）の本質的な構造は何か？',
      choices: [
        { text: '業務に必要な「情報アクセス権の拡大」と、安全管理のための「アクセス権の極小化」の対立', isCorrect: true, feedback: '正解！セキュリティのための障壁と、生産性のための摩擦ゼロのトレードオフ構造です。' },
        { text: 'セキュリティツールの「導入コスト」と、それによって得られる「保険的価値」の対立', isCorrect: false, feedback: '不正解。費用対効果ではなく、日々の運用負荷と安全性の対立です。' },
        { text: '外部ハッカーの「攻撃力」と、社内システム部門の「防御力」の技術的対立', isCorrect: false, feedback: '不正解。システム外の脅威との戦いではなく、社内の効率とルールの対立です。' }
      ]
    },
    step2: {
      question: 'この二律背反を解消し、両立させる「戦略パッチ（コンパイル解決）」はどれか？',
      choices: [
        { text: 'シングルサインオン（SSO）とゼロトラストネットワークを導入し、ユーザーのコンテキスト（端末情報・位置等）に基づきバックグラウンドで自動認証する『透明なセキュリティ』の構築', isCorrect: true, feedback: 'コンパイル成功！「監視や確認」を自動化・透明化することで、ユーザーに負担をかけずに堅牢なセキュリティを実現します。' },
        { text: '申請ルールはそのままに、承認フローを簡略化する（ルール無効化）', isCorrect: false, feedback: 'コンパイル失敗（形骸化バグ）。抜け道ができるだけで、セキュリティリスクが高まり本質的な解決になっていません。' },
        { text: 'セキュリティ対策の導入自体を延期し、全社員に『情報セキュリティの徹底』を呼びかける精神論のメールを送る（教育による解決）', isCorrect: false, feedback: 'コンパイル失敗（怠慢バグ）。システムによる制御を諦め、ヒューマンエラーによる漏洩リスクを残したままにしています。' }
      ]
    }
  },
  {
    id: 'st_b3',
    title: '広告費削減による利益確保 vs 売上成長のための集客',
    description: '今期の利益目標を達成するために広告費を削減したいが、広告出稿を止めるとWebサイトへの流入が減り、中長期的な売上成長がストップしてしまう。',
    dilemma: '「広告宣伝費の削減（短期の利益率改善）」 vs 「広告を通じた新規顧客の獲得（売上の拡大）」',
    step1: {
      question: 'この状況における対立（ジレンマ）の本質的な構造は何か？',
      choices: [
        { text: '経営層とマーケティング部門の「パワーバランスの対立」', isCorrect: false, feedback: '不正解。組織論ではなく、ファイナンス構造におけるキャッシュアウトの配分の対立です。' },
        { text: '短期の「コスト削減による利益率向上」と、中長期の「投資による売上ボリューム成長」の対立', isCorrect: true, feedback: '正解！短期利益（キャッシュ確保）と中長期投資（将来のキャッシュ獲得）の時間的な相反です。' },
        { text: '広告代理店の「マージン」と、自社の「純広告効果」の利益対立', isCorrect: false, feedback: '不正解。外部への支払い手数料の問題ではなく、戦略的な投資配分の対立です。' }
      ]
    },
    step2: {
      question: 'この二律背反を解消し、両立させる「戦略パッチ（コンパイル解決）」はどれか？',
      choices: [
        { text: '全広告の予算を一律で20%カットする（一律削減）', isCorrect: false, feedback: 'コンパイル失敗（妥協バグ）。成果が出ている優良な広告チャネルまで縮小してしまい、売上減少スピードが加速します。' },
        { text: '売上が下がるのは営業の気合が足りないからだとし、営業部門の行動ノルマを増やす（精神論）', isCorrect: false, feedback: 'コンパイル失敗（バグの擦り付け）。マーケティングの集客問題を営業のリソース不足にすり替えており、現場が崩壊します。' },
        { text: '広告出稿量を最適化（CPAの悪い媒体を停止）しつつ、既存顧客向けに有益なコンテンツ配信（オウンドメディア・メルマガ）を自動化し、リピート率と顧客生涯価値（LTV）を高める（アセット型集客への移行）', isCorrect: true, feedback: 'コンパイル成功！使い捨ての広告（フロー型）から、オウンドメディアやLTV向上（アセット型）へシフトし、低いコストで売上を維持・拡大します。' }
      ]
    }
  },
  {
    id: 'st_b4',
    title: '顧客の個別カスタマイズ vs サービスの標準化・スケール',
    description: 'BtoB向けSaaSサービスを運営しているが、大口顧客から個別カスタマイズの要望が絶えず、対応すると開発リソースが奪われ製品の標準機能のアップデート（スケール化）が滞る。断るとチャーン（解約）のリスクがある。',
    dilemma: '「大口顧客の獲得・解約防止（個別対応）」 vs 「開発効率とSaaSのスケール（製品の共通標準化）」',
    step1: {
      question: 'この状況における対立（ジレンマ）の本質的な構造は何か？',
      choices: [
        { text: '特定顧客向けの「個別最適化（ローカライズ）」と、市場全体向けの「全体最適化（標準化）」の衝突', isCorrect: true, feedback: '正解！個別要件を処理するコストと、共通機能としてスケールする効率の衝突です。' },
        { text: '営業担当者の「売上インセンティブ」と、エンジニアの「開発負荷」の対立', isCorrect: false, feedback: '不正解。職能間の利害対立は表面的なものであり、本質はプロダクトの拡張戦略の相反です。' },
        { text: '既存システムが古く、カスタマイズに耐えられないという「アーキテクチャの対立」', isCorrect: false, feedback: '不正解。アーキテクチャの問題ではなく、SaaSとしてのビジネスモデル的なジレンマです。' }
      ]
    },
    step2: {
      question: 'この二律背反を解消し、両立させる「戦略パッチ（コンパイル解決）」はどれか？',
      choices: [
        { text: '今回限りという条件付きで、ソースコードの中に個別顧客向けの特例コード（条件分岐）を埋め込んで納品する（その場しのぎ）', isCorrect: false, feedback: 'コンパイル失敗（スパゲッティバグ）。特例が重なることでコードが複雑化し、将来的に製品全体のアップデートが不可能な状態に陥ります。' },
        { text: '個別カスタマイズ要望を共通の『API連携用Webプラグイン』や『拡張アドオン用開発キット（SDK）』という形でプラットフォーム化し、外部パートナーや顧客自身でカスタマイズ可能にする（プラットフォーム化）', isCorrect: true, feedback: 'コンパイル成功！カスタマイズする権限と仕組みを顧客側に解放（デカップリング）することで、自社の開発リソースを標準機能に集中させつつ、個別要望を満たします。' },
        { text: 'カスタマイズ要望は一切受け付けないという断固たる拒絶姿勢を貫き、大口顧客の解約をただ受け入れる（完全標準化）', isCorrect: false, feedback: 'コンパイル失敗（硬直バグ）。顧客のニーズに応えられず、競合に顧客を奪われ売上が縮小します。' }
      ]
    }
  },
  {
    id: 'st_b5',
    title: 'メンバーへの業務委譲 vs クオリティコントロール',
    description: 'チームリーダーとして自身のボトルネックを解消するために業務をメンバーに任せたいが、メンバーのスキル不足によりアウトプットの品質が低く、結局自分で手戻り修正をする羽目になり二度手間になる。',
    dilemma: '「リーダーのボトルネック解消（業務の委譲）」 vs 「成果物のクオリティ保証（品質管理）」',
    step1: {
      question: 'この状況における対立（ジレンマ）の本質的な構造は何か？',
      choices: [
        { text: 'メンバーの「教育に必要な時間投資」と、短期で成果物を出す「即時実行」の衝突', isCorrect: true, feedback: '正解！メンバー育成（長期投資）と成果物のクオリティ（短期の要件）の相反です。' },
        { text: 'リーダーの「指示の細かさ」と、メンバーの「裁量の広さ」の管理スタイルの対立', isCorrect: false, feedback: '不正解。管理手法の問題ではなく、委譲によるスピード獲得と品質低下リスクの対立です。' },
        { text: 'メンバーの「能力の低さ」と、リーダーの「要求レベルの高さ」の能力ギャップ', isCorrect: false, feedback: '不正解。能力ギャップは状況要素であり、本質的なジレンマは委譲コストとコントロールコストの構造的対立です。' }
      ]
    },
    step2: {
      question: 'この二律背反を解消し、両立させる「戦略パッチ（コンパイル解決）」はどれか？',
      choices: [
        { text: '難しい仕事は結局自分でやり、簡単な単純作業だけをメンバーに任せる（リーダーが抱え込む）', isCorrect: false, feedback: 'コンパイル失敗（抱え込みバグ）。リーダーの過負荷が解消されず、メンバーも難易度の高い仕事に挑戦できないため成長が止まります。' },
        { text: 'タスクの手順をチェックリストとテンプレートに落とし込み、初期段階のレビュー（20%時点）と、非同期な作業ログ確認で早い段階で軌道修正する『マイルストーン型委譲システム』の構築', isCorrect: true, feedback: 'コンパイル成功！指示をツール・仕組み化し、レビューポイントを極小化（シフトレフト）することで、リーダーの時間を節約しながら手戻りを防ぎ品質を保証します。' },
        { text: '『あとはよろしく』と丸投げし、締め切り直前にひどいクオリティの成果物が出てきてから自分が徹夜で修正する（放置と自滅）', isCorrect: false, feedback: 'コンパイル失敗（丸投げバグ）。最悪の二度手間パターンであり、チームの士気低下とクオリティ崩壊を引き起こします。' }
      ]
    }
  }
];

export default function StrategicCompiler({ onFinish, playSound, muted, toggleMute, mode, onLogBug, reviewQuestionId, onFinishReview, onBack }) {
  const [showTutorial, setShowTutorial] = useState(true);
  const [showHelp, setShowHelp] = useState(reviewQuestionId ? true : false);
  const [scenarios, setScenarios] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  
  // 各ステップの状態
  const [step1Answer, setStep1Answer] = useState(null); // Selected choice index or null
  const [step1Correct, setStep1Correct] = useState(false);
  const [step1Feedback, setStep1Feedback] = useState('');
  const [step1Tries, setStep1Tries] = useState(0);

  const [step2Answer, setStep2Answer] = useState(null); // Selected choice index or null
  const [step2Correct, setStep2Correct] = useState(false);
  const [step2Feedback, setStep2Feedback] = useState('');
  const [step2Tries, setStep2Tries] = useState(0);

  const [totalScore, setTotalScore] = useState(0);
  const [completed, setCompleted] = useState(false);

  // 画面演出状態
  const [shakeActive, setShakeActive] = useState(false);
  const [glitchActive, setGlitchActive] = useState(false);

  const currentScenario = scenarios[currentIdx];

  const initializeCompiler = () => {
    const rawData = mode === 'business' ? strategicBusiness : strategicDaily;
    let finalized = [];

    if (reviewQuestionId) {
      const found = strategicDaily.find(q => q.id === reviewQuestionId) || 
                    strategicBusiness.find(q => q.id === reviewQuestionId);
      if (found) {
        finalized = [found];
        setShowTutorial(false);
      }
    }

    if (finalized.length === 0) {
      finalized = shuffleArray(rawData).slice(0, 5);
    }

    setScenarios(finalized);
    setCurrentIdx(0);
    resetStepStates();
    setTotalScore(0);
    setCompleted(false);
  };

  const resetStepStates = () => {
    setStep1Answer(null);
    setStep1Correct(false);
    setStep1Feedback('');
    setStep1Tries(0);
    setStep2Answer(null);
    setStep2Correct(false);
    setStep2Feedback('');
    setStep2Tries(0);
  };

  useEffect(() => {
    initializeCompiler();
  }, [mode]);

  if (scenarios.length === 0) {
    return null;
  }

  const handleStep1Answer = (choiceIdx) => {
    if (step1Correct) return;
    playSound('click');
    setStep1Answer(choiceIdx);
    const choice = currentScenario.step1.choices[choiceIdx];
    const isCorrect = choice.isCorrect;
    const tries = step1Tries + 1;
    setStep1Tries(tries);
    setStep1Feedback(choice.feedback);

    if (isCorrect) {
      playSound('correct');
      setStep1Correct(true);
      setGlitchActive(true);
      setTimeout(() => setGlitchActive(false), 600);
    } else {
      playSound('incorrect');
      setShakeActive(true);
      setTimeout(() => setShakeActive(false), 400);
      
      // log bug on second failure
      if (tries >= 2 && onLogBug && !reviewQuestionId) {
        onLogBug(
          'strategic', 
          currentScenario.id, 
          `対立構造特定失敗 (Scenario: ${currentScenario.title}) - 選択: "${choice.text}"`,
          currentScenario.description
        );
      }
    }
  };

  const handleStep2Answer = (choiceIdx) => {
    if (step2Correct) return;
    playSound('click');
    setStep2Answer(choiceIdx);
    const choice = currentScenario.step2.choices[choiceIdx];
    const isCorrect = choice.isCorrect;
    const tries = step2Tries + 1;
    setStep2Tries(tries);
    setStep2Feedback(choice.feedback);

    if (isCorrect) {
      playSound('correct');
      setStep2Correct(true);
      setGlitchActive(true);
      setTimeout(() => setGlitchActive(false), 600);

      // Score logic: 10 points max per scenario (5 points for Step 1, 5 points for Step 2)
      // Step 1 score: 5 points first try, 2.5 points second try, 0 points third try
      // Step 2 score: 5 points first try, 2.5 points second try, 0 points third try
      let sc1 = step1Tries === 1 ? 5 : step1Tries === 2 ? 2.5 : 0;
      let sc2 = tries === 1 ? 5 : tries === 2 ? 2.5 : 0;
      setTotalScore(prev => prev + sc1 + sc2);
    } else {
      playSound('incorrect');
      setShakeActive(true);
      setTimeout(() => setShakeActive(false), 400);

      // log bug on second failure
      if (tries >= 2 && onLogBug && !reviewQuestionId) {
        onLogBug(
          'strategic', 
          currentScenario.id, 
          `戦略パッチ適用失敗 (Scenario: ${currentScenario.title}) - 選択: "${choice.text}"`,
          currentScenario.description
        );
      }
    }
  };

  const handleNext = () => {
    playSound('click');
    if (currentIdx < scenarios.length - 1) {
      setCurrentIdx(prev => prev + 1);
      resetStepStates();
    } else {
      setCompleted(true);
      if (reviewQuestionId && onFinishReview) {
        onFinishReview('strategic', reviewQuestionId);
      } else {
        // Final score scaled from 0-50 to 0-100
        const finalScorePercent = Math.min(100, Math.max(0, Math.round((totalScore / (scenarios.length * 10) * 100))));
        onFinish('strategic', finalScorePercent, false);
        playSound('success');
      }
    }
  };

  const startCompiler = () => {
    playSound('click');
    setShowTutorial(false);
  };

  const handleReset = () => {
    playSound('click');
    initializeCompiler();
    setShowTutorial(true);
  };

  return (
    <div className={`game-container fade-in ${shakeActive ? 'incorrect-shake' : ''}`}>


      <div 
        className="glass-panel" 
        style={{ 
          padding: '24px', 
          position: 'relative',
          border: '1px solid rgba(99, 102, 241, 0.2)',
          boxShadow: glitchActive 
            ? '0 0 35px rgba(99, 102, 241, 0.6), inset 0 0 20px rgba(99, 102, 241, 0.2)' 
            : '0 8px 32px 0 rgba(0,0,0,0.5)'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <span style={{ color: '#6366f1', fontWeight: 'bold', fontSize: '13px', letterSpacing: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Cpu size={14} className="animate-pulse" /> STRATEGIC DEVIATION COMPILER v1.0.4
            </span>
            <h2 style={{ fontFamily: 'var(--font-display)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              戦略コンパイラー <span style={{ fontSize: '14px', padding: '2px 8px', borderRadius: '6px', background: 'rgba(99,102,241,0.15)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.3)' }}>{mode === 'business' ? '中級 / Business' : '初級 / Daily'}</span>
            </h2>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {!showTutorial && !completed && (
              <button 
                onClick={() => { playSound('click'); setShowHelp(prev => !prev); }}
                className="btn btn-secondary" 
                style={{ 
                  padding: '6px 12px', 
                  fontSize: '12px', 
                  borderRadius: '8px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '4px',
                  background: showHelp ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                  border: showHelp ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
                  color: showHelp ? '#a5b4fc' : 'var(--text-secondary)'
                }}
              >
                💡 {showHelp ? 'ヘルプを閉じる' : '遊び方'}
              </button>
            )}
            <button 
              onClick={toggleMute}
              className="btn btn-secondary" 
              style={{ padding: '8px', borderRadius: '50%' }}
              title={muted ? "消音解除" : "消音"}
            >
              {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            {!showTutorial && !completed && (
              <div className="score-badge" style={{ borderColor: '#6366f1', color: '#818cf8', background: 'rgba(99, 102, 241, 0.05)' }}>
                スロット: {currentIdx + 1} / {scenarios.length}
              </div>
            )}
          </div>
        </div>

        {/* Core screens */}
        {showTutorial ? (
          <div style={{ textAlign: 'left' }} className="fade-in">
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', color: '#818cf8', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Cpu size={18} /> 思考バグ「妥協・思考停止」をコンパイルせよ
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
              <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.15)' }}>
                <strong style={{ color: '#818cf8', fontSize: '15px' }}>🤖 二律背反（トレードオフ）の真の解消とは？</strong>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '6px', lineHeight: '1.5' }}>
                  対立する2つの選択肢（例：スピード vs 品質）を前にした時、単純な「中間での妥協」や「行動の先送り」は戦略的なバグです。<br />
                  優秀な戦略思考は、<strong>対立の本質（ジレンマ構造）</strong>を冷静に見抜き、両立を可能にする<strong>「最適化パッチ（解決策）」</strong>をコンパイル（適用）します。
                </p>
              </div>

              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '200px', padding: '14px', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', borderLeft: '3px solid #8b5cf6' }}>
                  <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-primary)' }}>Step 1: 対立構造の特定</div>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>現状における２つの相反する資源や目的の本質的な対立点を特定します。</p>
                </div>
                <div style={{ flex: 1, minWidth: '200px', padding: '14px', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', borderLeft: '3px solid #10b981' }}>
                  <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-primary)' }}>Step 2: 戦略パッチの適用</div>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>トレードオフを解消し、両目的を別のレイヤーで統合・両立するパッチを選択します。</p>
                </div>
              </div>
            </div>

            <button 
              onClick={startCompiler} 
              className="btn btn-primary" 
              style={{ 
                width: '100%', 
                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', 
                boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)',
                border: '1px solid rgba(99, 102, 241, 0.3)'
              }}
            >
              <Play size={16} style={{ marginRight: '6px' }} /> コンパイラーを初期化してトレーニング開始
            </button>
          </div>
        ) : !completed ? (
          <div>
            {/* 遊び方解説ヘルプカード */}
            {showHelp && (
              <div 
                className="fade-in"
                style={{
                  background: 'rgba(99, 102, 241, 0.06)',
                  border: '1px dashed rgba(99, 102, 241, 0.3)',
                  borderRadius: '12px',
                  padding: '16px',
                  marginBottom: '20px',
                  fontSize: '12.5px',
                  color: 'var(--text-secondary)',
                  lineHeight: '1.6',
                  textAlign: 'left',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#818cf8', fontWeight: 'bold', marginBottom: '8px', fontSize: '13.5px' }}>
                  <Cpu size={15} />
                  <span>💡 戦略コンパイラーの目的と進め方</span>
                </div>
                このトレーニングは、<strong>「やりたいこと」と「制約・相反する目的」の板挟み（トレードオフ）</strong>に対して、単にどちらかを犠牲にする「妥協」ではなく、仕組みやアプローチを変えて<strong>双方を両立させる「戦略的解決」</strong>を選択する思考訓練です。
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px', background: 'rgba(0, 0, 0, 0.2)', padding: '10px 14px', borderRadius: '8px' }}>
                  <div>
                    <span style={{ color: '#818cf8', fontWeight: 'bold' }}>STEP 01: 対立構造の特定</span>
                    <span style={{ display: 'block', fontSize: '11.5px', marginTop: '2px', color: 'var(--text-muted)' }}>
                      問題文（DESCRIPTION）を読み、２つの相反する資源や目的の本質的な対立点（ジレンマの根本構造）を特定します。
                    </span>
                  </div>
                  <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '6px' }}>
                    <span style={{ color: '#34d399', fontWeight: 'bold' }}>STEP 02: 戦略パッチの適用（コンパイル）</span>
                    <span style={{ display: 'block', fontSize: '11.5px', marginTop: '2px', color: 'var(--text-muted)' }}>
                      トレードオフを解消し、両目的を高いレベルで統合・両立する「最適なパッチ（解決手法）」を選択します。
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Scenario terminal header */}
            <div style={{ 
              background: 'rgba(0, 0, 0, 0.4)', 
              borderRadius: '12px', 
              padding: '16px', 
              border: '1px solid rgba(255, 255, 255, 0.05)',
              fontFamily: 'monospace',
              fontSize: '13px',
              color: '#a5b4fc',
              marginBottom: '20px',
              textAlign: 'left'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '6px', marginBottom: '8px', fontSize: '11px', color: 'var(--text-muted)' }}>
                <span>[MODULE_SOURCE: {currentScenario.id.toUpperCase()}]</span>
                <span>STATUS: READY</span>
              </div>
              <div style={{ color: 'var(--text-primary)', fontSize: '14px', lineHeight: '1.6', marginBottom: '10px' }}>
                <span style={{ color: '#818cf8', fontWeight: 'bold' }}>&gt; SCENARIO_DESCRIPTION:</span> {currentScenario.description}
              </div>
              <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '8px 12px', borderRadius: '6px', borderLeft: '3px solid #6366f1', color: '#c7d2fe' }}>
                <span style={{ fontWeight: 'bold' }}>⚡ DETECTED DILEMMA:</span> {currentScenario.dilemma}
              </div>
            </div>

            {/* STEP 1: Identify conflict */}
            <div style={{ textAlign: 'left', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <span style={{ 
                  background: step1Correct ? 'rgba(16, 185, 129, 0.2)' : 'rgba(99, 102, 241, 0.2)',
                  color: step1Correct ? '#34d399' : '#818cf8',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  fontFamily: 'monospace'
                }}>
                  STEP 01
                </span>
                <span style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                  {currentScenario.step1.question}
                </span>
              </div>

              {/* Choices for Step 1 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {currentScenario.step1.choices.map((choice, idx) => {
                  const isSelected = step1Answer === idx;
                  let btnBorder = 'rgba(255, 255, 255, 0.08)';
                  let btnBg = 'rgba(255, 255, 255, 0.02)';
                  let icon = null;

                  if (isSelected) {
                    if (choice.isCorrect) {
                      btnBorder = '#10b981';
                      btnBg = 'rgba(16, 185, 129, 0.08)';
                      icon = <CheckCircle2 size={16} style={{ color: '#10b981', flexShrink: 0 }} />;
                    } else {
                      btnBorder = '#ef4444';
                      btnBg = 'rgba(239, 68, 68, 0.08)';
                      icon = <XCircle size={16} style={{ color: '#ef4444', flexShrink: 0 }} />;
                    }
                  } else if (step1Correct && choice.isCorrect) {
                    btnBorder = 'rgba(16, 185, 129, 0.4)';
                    btnBg = 'rgba(16, 185, 129, 0.03)';
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleStep1Answer(idx)}
                      disabled={step1Correct}
                      className="btn"
                      style={{
                        justifyContent: 'flex-start',
                        textAlign: 'left',
                        padding: '14px 18px',
                        fontSize: '13.5px',
                        background: btnBg,
                        border: `1px solid ${btnBorder}`,
                        borderRadius: '10px',
                        color: isSelected && !choice.isCorrect ? 'var(--text-primary)' : 'var(--text-secondary)',
                        transition: 'all 0.2s',
                        cursor: step1Correct ? 'default' : 'pointer'
                      }}
                    >
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', width: '100%' }}>
                        <span style={{ fontFamily: 'monospace', color: step1Correct && choice.isCorrect ? '#10b981' : 'var(--text-muted)' }}>[A{idx+1}]</span>
                        <span style={{ flex: 1 }}>{choice.text}</span>
                        {icon}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Feedback Step 1 */}
              {step1Feedback && (
                <div 
                  className="fade-in"
                  style={{ 
                    marginTop: '12px', 
                    padding: '10px 14px', 
                    borderRadius: '8px', 
                    background: step1Correct ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.05)',
                    border: `1px solid ${step1Correct ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)'}`,
                    fontSize: '12.5px',
                    color: step1Correct ? '#34d399' : '#f87171',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <AlertTriangle size={15} style={{ flexShrink: 0 }} />
                  <span>{step1Feedback}</span>
                </div>
              )}
            </div>

            {/* STEP 2: Compile Strategical Patch */}
            {step1Correct && (
              <div style={{ textAlign: 'left', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '20px' }} className="fade-in">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <span style={{ 
                    background: step2Correct ? 'rgba(16, 185, 129, 0.2)' : 'rgba(99, 102, 241, 0.2)',
                    color: step2Correct ? '#34d399' : '#818cf8',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    fontFamily: 'monospace'
                  }}>
                    STEP 02
                  </span>
                  <span style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                    {currentScenario.step2.question}
                  </span>
                </div>

                {/* Choices for Step 2 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {currentScenario.step2.choices.map((choice, idx) => {
                    const isSelected = step2Answer === idx;
                    let btnBorder = 'rgba(255, 255, 255, 0.08)';
                    let btnBg = 'rgba(255, 255, 255, 0.02)';
                    let icon = null;

                    if (isSelected) {
                      if (choice.isCorrect) {
                        btnBorder = '#10b981';
                        btnBg = 'rgba(16, 185, 129, 0.08)';
                        icon = <CheckCircle2 size={16} style={{ color: '#10b981', flexShrink: 0 }} />;
                      } else {
                        btnBorder = '#ef4444';
                        btnBg = 'rgba(239, 68, 68, 0.08)';
                        icon = <XCircle size={16} style={{ color: '#ef4444', flexShrink: 0 }} />;
                      }
                    } else if (step2Correct && choice.isCorrect) {
                      btnBorder = 'rgba(16, 185, 129, 0.4)';
                      btnBg = 'rgba(16, 185, 129, 0.03)';
                    }

                    return (
                      <button
                        key={idx}
                        onClick={() => handleStep2Answer(idx)}
                        disabled={step2Correct}
                        className="btn"
                        style={{
                          justifyContent: 'flex-start',
                          textAlign: 'left',
                          padding: '14px 18px',
                          fontSize: '13.5px',
                          background: btnBg,
                          border: `1px solid ${btnBorder}`,
                          borderRadius: '10px',
                          color: isSelected && !choice.isCorrect ? 'var(--text-primary)' : 'var(--text-secondary)',
                          transition: 'all 0.2s',
                          cursor: step2Correct ? 'default' : 'pointer'
                        }}
                      >
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', width: '100%' }}>
                          <span style={{ fontFamily: 'monospace', color: step2Correct && choice.isCorrect ? '#10b981' : 'var(--text-muted)' }}>[P{idx+1}]</span>
                          <span style={{ flex: 1 }}>{choice.text}</span>
                          {icon}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Feedback Step 2 */}
                {step2Feedback && (
                  <div 
                    className="fade-in"
                    style={{ 
                      marginTop: '12px', 
                      padding: '12px 16px', 
                      borderRadius: '8px', 
                      background: step2Correct ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                      border: `1px solid ${step2Correct ? '#10b981' : '#ef4444'}`,
                      fontSize: '13px',
                      color: step2Correct ? '#10b981' : '#ef4444',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}
                  >
                    {step2Correct ? <CheckCircle2 size={16} style={{ flexShrink: 0 }} /> : <ShieldAlert size={16} style={{ flexShrink: 0 }} />}
                    <div style={{ flex: 1 }}>
                      <strong style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', marginBottom: '2px', letterSpacing: '1px' }}>
                        {step2Correct ? 'SYSTEM COMPILE SUCCESS' : 'STRATEGY EXCEPTION / COMPILER CRASH'}
                      </strong>
                      <span>{step2Feedback}</span>
                    </div>
                  </div>
                )}

                {/* Next button */}
                {step2Correct && (
                  <button
                    onClick={handleNext}
                    className="btn btn-primary fade-in"
                    style={{
                      width: '100%',
                      marginTop: '20px',
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                      border: '1px solid rgba(16, 185, 129, 0.3)'
                    }}
                  >
                    {currentIdx < scenarios.length - 1 ? '次のシステムスロットを解析する' : 'コンパイル完了結果を表示'} <ArrowRight size={16} />
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Completed View */
          <div style={{ textAlign: 'center' }} className="fade-in">
            <div style={{ margin: '24px 0' }}>
              <div style={{ 
                width: '80px', 
                height: '80px', 
                borderRadius: '50%', 
                background: 'rgba(99, 102, 241, 0.1)', 
                border: '2px solid #6366f1',
                boxShadow: '0 0 20px rgba(99, 102, 241, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px'
              }}>
                <Cpu size={36} style={{ color: '#818cf8' }} />
              </div>
              <h3 style={{ fontSize: '22px', fontWeight: '700', fontFamily: 'var(--font-display)', marginBottom: '8px' }}>
                トレーニング・コンパイル完了
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', maxWidth: '400px', margin: '0 auto 20px' }}>
                二律背反（トレードオフ）を乗り越え、両立を実現する戦略的な思考回路（パッチ）を完全に適用しました。
              </p>

              {/* Score Display */}
              <div 
                className="glass-panel" 
                style={{ 
                  maxWidth: '300px', 
                  margin: '0 auto 24px', 
                  padding: '20px',
                  background: 'rgba(99, 102, 241, 0.05)',
                  border: '1px solid rgba(99, 102, 241, 0.2)'
                }}
              >
                <div style={{ fontSize: '12px', color: '#818cf8', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase' }}>
                  STRATEGIC COMPILER SCORE
                </div>
                <div style={{ fontSize: '48px', fontWeight: '800', color: 'var(--text-primary)', fontFamily: 'var(--font-display)', marginTop: '4px' }}>
                  {Math.min(100, Math.max(0, Math.round((totalScore / (scenarios.length * 10) * 100))))}<span style={{ fontSize: '18px', fontWeight: '500', color: 'var(--text-muted)', marginLeft: '4px' }}>/ 100</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={handleReset} className="btn btn-secondary">
                <RotateCcw size={16} /> もう一度プレイ
              </button>
              <button
                onClick={() => {
                  playSound('click');
                  const finalPercent = Math.min(100, Math.max(0, Math.round((totalScore / (scenarios.length * 10) * 100))));
                  let rank = "【妥協バグ発生 ⚠️】二律背反を解消できていません！";
                  if (finalPercent === 100) rank = "【二律背反コンパイラー 🏆】";
                  else if (finalPercent >= 80) rank = "【対立を紐解く戦略アドバイザー 🎯】";
                  else if (finalPercent >= 60) rank = "【一般脳 🧠】デバッガー推奨";

                  const modeText = mode === 'business' ? 'ビジネス編' : '日常編・入門';
                  const text = `🎯 思考の筋トレ「LogicaFit」でトレーニング完了！\n種目：戦略コンパイラー (${modeText})\nスコア：${finalPercent}% (${(totalScore / 10).toFixed(1)} / ${scenarios.length} 問正解相当)\n評価：${rank}\n\nあなたは二律背反を解消する「戦略パッチ」を見つけられますか？\n#LogicaFit #ロジカフィット #戦略的思考`;
                  const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent('https://www.logicafit.site/')}`;
                  window.open(shareUrl, '_blank', 'noopener,noreferrer');
                }}
                className="btn btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                𝕏 でシェア
              </button>
              <button
                onClick={() => {
                  playSound('click');
                  const finalPercent = Math.min(100, Math.max(0, Math.round((totalScore / (scenarios.length * 10) * 100))));
                  let rank = "【妥協バグ発生 ⚠️】二律背反を解消できていません！";
                  if (finalPercent === 100) rank = "【二律背反コンパイラー 🏆】";
                  else if (finalPercent >= 80) rank = "【対立を紐解く戦略アドバイザー 🎯】";
                  else if (finalPercent >= 60) rank = "【一般脳 🧠】デバッガー推奨";

                  const modeText = mode === 'business' ? 'ビジネス編' : '日常編・入門';
                  const text = `🎯 思考の筋トレ「LogicaFit」でトレーニング完了！\n種目：戦略コンパイラー (${modeText})\nスコア：${finalPercent}% (${(totalScore / 10).toFixed(1)} / ${scenarios.length} 問正解相当)\n評価：${rank}\n\nあなたは二律背反を解消する「戦略パッチ」を見つけられますか？\n#LogicaFit #ロジカフィット #戦略的思考`;

                  navigator.clipboard.writeText(text).then(() => {
                    alert("診断結果テキストをクリップボードにコピーしました！\nFacebookの投稿画面にペースト（貼り付け）してシェアしてください。");
                    const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent('https://www.logicafit.site/')}`;
                    window.open(shareUrl, '_blank', 'noopener,noreferrer');
                  }).catch(() => {
                    const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent('https://www.logicafit.site/')}`;
                    window.open(shareUrl, '_blank', 'noopener,noreferrer');
                  });
                }}
                className="btn btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                Facebook
              </button>
              <button
                onClick={() => {
                  playSound('click');
                  const finalPercent = Math.min(100, Math.max(0, Math.round((totalScore / (scenarios.length * 10) * 100))));
                  let rank = "【妥協バグ発生 ⚠️】二律背反を解消できていません！";
                  if (finalPercent === 100) rank = "【二律背反コンパイラー 🏆】";
                  else if (finalPercent >= 80) rank = "【対立を紐解く戦略アドバイザー 🎯】";
                  else if (finalPercent >= 60) rank = "【一般脳 🧠】デバッガー推奨";

                  const modeText = mode === 'business' ? 'ビジネス編' : '日常編・入門';
                  const text = `🎯 思考の筋トレ「LogicaFit」でトレーニング完了！\n種目：戦略コンパイラー (${modeText})\nスコア：${finalPercent}% (${(totalScore / 10).toFixed(1)} / ${scenarios.length} 問正解相当)\n評価：${rank}\n\nあなたは二律背反を解消する「戦略パッチ」を見つけられますか？\nhttps://www.logicafit.site/ #LogicaFit`;

                  navigator.clipboard.writeText(text).then(() => {
                    alert("結果テキストをクリップボードにコピーしました！SlackやLINE、Discordなどで共有してください。");
                  });
                }}
                className="btn btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                結果をコピー
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Recovery Gear / Additional Widgets */}
      <div style={{ marginTop: '24px' }}>
        <RecoveryGearSection />
      </div>
    </div>
  );
}
