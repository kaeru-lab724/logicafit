import React, { useState, useEffect, useRef } from 'react';
import RakutenWidget from '../common/RakutenWidget';
import { 
  Heart, 
  ShieldAlert, 
  Timer, 
  ChevronRight, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Zap, 
  Play,
  ArrowRight,
  Flame,
  Award
} from 'lucide-react';

// ラボ専用：上級・高難度誤謬バトルデータ
const labQuestions = [
  {
    id: 'fh1',
    fallacyType: '大衆に訴える論証',
    scenario: '「このプロジェクト管理ツールを導入すべきです。業界の8割以上のベンチャーがこれを使って効率化に成功しているそうですよ！」',
    question: 'この主張に潜む論理エラー（誤謬）を特定せよ！',
    choices: [
      { text: '大衆に訴える論証（多数派が支持していることを根拠に、内容の妥当性を保証する）', isCorrect: true },
      { text: '新しさに訴える論証（新しいツールだから優れていると決めつける）', isCorrect: false },
      { text: '単一原因の誤謬（ツールの導入だけで効率化が進むと決めつける）', isCorrect: false },
      { text: '権威に訴える論証（偉い人が言っているから正しいと信じ込ませる）', isCorrect: false }
    ],
    explanation: '多数の企業が導入しているからといって、自社の規模や業務プロセスに適合しているとは限りません。「みんながやっているから良い」とするのは大衆に訴える論証です。',
    biasType: 'showa'
  },
  {
    id: 'fh2',
    fallacyType: '滑り坂論法',
    scenario: '「今日の進捗会議を1時間遅らせる？ダメだ！一回甘やかすとズルズル遅れ、プロジェクトが遅延し、クライアントの信頼を失い、最終的に契約破棄で倒産するぞ！」',
    question: 'この主張に潜む論理エラー（誤謬）を特定せよ！',
    choices: [
      { text: '滑り坂論法（根拠のない最悪のドミノ倒しシナリオへ飛躍して反論する）', isCorrect: true },
      { text: '誤った二分法（極端な２択だけを提示して脅す）', isCorrect: false },
      { text: 'ストローマン論法（相手の主張を勝手に過激なものに歪める）', isCorrect: false },
      { text: '無知に訴える論証（失敗の証拠がないから大丈夫だとする）', isCorrect: false }
    ],
    explanation: '「1時間遅らせる」ことから「倒産」まで、途中の因果関係の証拠がないまま破滅的シナリオを滑り落ちるように繋ぎ合わせて反論する「滑り坂論法」の誤謬です。',
    biasType: 'reiwa'
  },
  {
    id: 'fh3',
    fallacyType: '単一原因の誤謬',
    scenario: '「我が社の今季の売上が20%伸びたのは、間違いなく先月ロゴを刷新したからです！ロゴのデザイン変更こそがすべての勝因ですよ。」',
    question: 'この主張に潜む論理エラー（誤謬）を特定せよ！',
    choices: [
      { text: '単一原因の誤謬（多数の要因が絡み合う結果を、特定の1つの原因だけに帰属させる）', isCorrect: true },
      { text: '循環論証（結論と前提が同じ意味の繰り返しになっている）', isCorrect: false },
      { text: '相関と因果の混同（単に時期が重なっただけなのに因果関係があると誤認する）', isCorrect: false },
      { text: '早まった一般化（極端な一例からすべてを決めつける）', isCorrect: false }
    ],
    explanation: '売上の向上には市場動向や営業努力など多くの要因が絡むはずですが、ロゴの変更という単一の要因だけを絶対的な勝因にするのは「単一原因の誤謬」です。',
    biasType: 'reiwa'
  },
  {
    id: 'fh4',
    fallacyType: '二重基準 (特殊認可)',
    scenario: '「遅刻はチームの士気を下げるから厳禁だ。え？私が今日遅刻した？私はプロジェクトマネージャーとして夜遅くまで戦略を練っているんだから、例外的に許されるに決まっているよ。」',
    question: 'この主張に潜む論理エラー（誤謬）を特定せよ！',
    choices: [
      { text: '二重基準・特殊認可（妥当な根拠なしに、自分にだけ例外的なルール適用を求める）', isCorrect: true },
      { text: '対人論証・人身攻撃（相手のキャリアの浅さを攻撃する）', isCorrect: false },
      { text: 'ストローマン論法（遅刻の定義を歪めて解釈する）', isCorrect: false },
      { text: '感情に訴える論証（自分の苦労を煽って同情を引く）', isCorrect: false }
    ],
    explanation: '「遅刻厳禁」という全体ルールに対して、特段の合理的理由（事前承認など）なしに、自分の立場や状況を理由に「自分だけは特別」とする「二重基準（特殊認可）」の罠です。',
    biasType: 'showa'
  },
  {
    id: 'fh5',
    fallacyType: 'ストローマン論法',
    scenario: '「オフィスでの個人ゴミ箱を廃止し、ゴミを分別収集所にまとめる案はどうでしょう？」「えっ、社員の机の上をゴミだらけにして、最悪の不衛生な環境で働けと言うんですか！？」',
    question: 'この主張に潜む論理エラー（誤謬）を特定せよ！',
    choices: [
      { text: 'ストローマン論法（相手の主張を極端で非合理的なものに歪めて攻撃する）', isCorrect: true },
      { text: '対人論証・人身攻撃（提案者の性格や普段の清潔度を責める）', isCorrect: false },
      { text: '誤った二分法（ゴミを捨てるか、ゴミを机に放置するかの2択にする）', isCorrect: false },
      { text: '滑り坂論法（オフィスの不衛生から倒産へと繋げる）', isCorrect: false }
    ],
    explanation: '「個人ゴミ箱を廃止し集約する」という提案を、「机をゴミだらけにして不衛生にする」という極端に歪んだ形にすり替えて非難しています。これがストローマン論法です。',
    biasType: 'reiwa'
  },
  {
    id: 'fh6',
    fallacyType: 'お前だって論法',
    scenario: '「スケジュール通りにタスクを完了させてください。生産性管理が甘いです。」「鈴木さんだって先週の資料作成を1日遅らせてたじゃないですか！あなたに言われる筋合いはありません！」',
    question: 'この主張に潜む論理エラー（誤謬）を特定せよ！',
    choices: [
      { text: 'お前だって論法（相手の言行不一致や過去のミスを指摘し、主張自体の正しさをはぐらかす）', isCorrect: true },
      { text: '人身攻撃（相手の人格を著しく傷つける）', isCorrect: false },
      { text: '循環論証（同じ内容をグルグル言い換えている）', isCorrect: false },
      { text: '滑り坂論法（1回の遅れから破滅を導く）', isCorrect: false }
    ],
    explanation: '「スケジュールを遵守すべき」という正当な指摘に対し、「指摘するあなたも過去に遅れた」という矛盾を突くことで、指摘の本質から議論をそらそうとする「お前だって論法（Tu Quoque）」です。',
    biasType: 'showa'
  },
  {
    id: 'fh7',
    fallacyType: '循環論証',
    scenario: '「この業務自動化システムは我が社に絶対必要です。なぜなら、このシステムを導入することは、社内業務を自動化する上で極めて不可欠で必要だからです！」',
    question: 'この主張に潜む論理エラー（誤謬）を特定せよ！',
    choices: [
      { text: '循環論証（証明すべき結論を、別の表現に変えて前提として用いる）', isCorrect: true },
      { text: '相関と因果の混同（自動化の導入と業務効率の相関を誤解する）', isCorrect: false },
      { text: '単一原因の誤謬（自動化だけが不可欠だと思い込む）', isCorrect: false },
      { text: '権威に訴える論証（偉い人の必要論を借用する）', isCorrect: false }
    ],
    explanation: '「なぜ必要か」という具体的なメリットを答えず、「不可欠で必要だから必要だ」と同じ意味をグルグル繰り返しているだけで、論証が成立していない「循環論証」です。',
    biasType: 'reiwa'
  },
  {
    id: 'fh8',
    fallacyType: '誤った二分法',
    scenario: '「この新規事業にすぐ1億円を投資して実行するか、さもなければこのまま競合にシェアを奪われ、会社が倒産するのを座して待つか、どちらかだ！」',
    question: 'この主張に潜む論理エラー（誤謬）を特定せよ！',
    choices: [
      { text: '誤った二分法（実際には存在する他の中間的な選択肢を無視し、両極端な2択だけを迫る）', isCorrect: true },
      { text: '滑り坂論法（1億円の投資から成功へのプロセスを省く）', isCorrect: false },
      { text: '大衆に訴える論証（競合がやっているから自社もやるべきだとする）', isCorrect: false },
      { text: '単一原因の誤謬（倒産の原因をシェア低下だけに絞る）', isCorrect: false }
    ],
    explanation: '「投資額を削って段階導入する」「他事業の拡大で補填する」などの多様な選択肢を排除し、「投資か倒産か」の極端な2択のみを突きつける「誤った二分法」です。',
    biasType: 'reiwa'
  },
  {
    id: 'fh9',
    fallacyType: '新しさに訴える論証',
    scenario: '「最新のAI搭載システムですね！これが一番新しいバージョンなので、旧来のシステムより絶対に不具合が少なく、業務効率が格段に上がるはずです！」',
    question: 'この主張に潜む論理エラー（誤謬）を特定せよ！',
    choices: [
      { text: '新しさに訴える論証（「新しいもの＝優れている、正しい」と無根拠に仮定する）', isCorrect: true },
      { text: '相関と因果の混同（新しさ自体が効率化の原因であるとする）', isCorrect: false },
      { text: '無知に訴える論証（誰も失敗したことがないから大丈夫だとする）', isCorrect: false },
      { text: '大衆に訴える論証（流行りのAIだから優れているとする）', isCorrect: false }
    ],
    explanation: '最新のシステムは未検証のバグや導入コストを含んでいる場合があり、「新しければ常に良い」とは限りません。これが新しさに訴える誤謬です。',
    biasType: 'reiwa'
  },
  {
    id: 'fh10',
    fallacyType: '無知に訴える論証',
    scenario: '「この新しいマーケティング手法が失敗するという明確なデータや証拠はありません。したがって、この手法は100%成功し、我が社に大きな利益をもたらすでしょう！」',
    question: 'この主張に潜む論理エラー（誤謬）を特定せよ！',
    choices: [
      { text: '無知に訴える論証（「失敗が証明されていない」ことをもって、「成功する」ことの証明とする）', isCorrect: true },
      { text: '滑りやすい坂道（失敗がないから最高の成功へ進むとする）', isCorrect: false },
      { text: '循環論証（成功の証拠がないから成功とする）', isCorrect: false },
      { text: '感情に訴える論証（成功への熱望のみで論証する）', isCorrect: false }
    ],
    explanation: '失敗するという証拠がないことは、成功するという証拠にはなりません。証明されていないことを逆手に取って真実だと強弁する「無知に訴える論証」です。',
    biasType: 'reiwa'
  },
  {
    id: 'fh11',
    fallacyType: '人身攻撃 (対人論証)',
    scenario: '「鈴木さんのUI改善案は論理的には優れているように見えます。しかし、彼は最近別のプロジェクトで手痛い納期遅れを出したばかりですよ。そんな彼の提案を信用できますか？」',
    question: 'この主張に潜む論理エラー（誤謬）を特定せよ！',
    choices: [
      { text: '人身攻撃（提案者の過去の過失や性格を攻撃し、提案そのものの妥当性を否定する）', isCorrect: true },
      { text: '滑り坂論法（UI改善案を採用すると会社が潰れると脅す）', isCorrect: false },
      { text: 'ストローマン論法（鈴木さんの提案を過激なものに歪める）', isCorrect: false },
      { text: '権威に訴える論証（納期遅れという事実だけを根拠にする）', isCorrect: false }
    ],
    explanation: '提案内容自体のロジックではなく、提案者である鈴木さんの過去のミスを理由に提案を退けようとするのは「人身攻撃（対人論証）」の典型例です。',
    biasType: 'showa'
  },
  {
    id: 'fh12',
    fallacyType: 'チェリー・ピッキング',
    scenario: '「我が社の新サービスは顧客満足度が非常に高いです！アンケート結果のうち、『非常に満足』『満足』と答えた上位20%のユーザーの声だけを見れば、製品の素晴らしさは一目瞭然でしょう！」',
    question: 'この主張に潜む論理エラー（誤謬）を特定せよ！',
    choices: [
      { text: 'チェリー・ピッキング（全体データから、自分の主張に都合の良い一部のみを抽出する）', isCorrect: true },
      { text: '早まった一般化（数名の極端な声から全体を評価する）', isCorrect: false },
      { text: '循環論証（満足度が高いから素晴らしい製品だと言い換えているだけ）', isCorrect: false },
      { text: '単一原因の誤謬（製品の良さだけが満足度の要因だとする）', isCorrect: false }
    ],
    explanation: 'アンケート全体の傾向を無視し、自分に都合の良い「満足した上位層」のデータだけを取り出して結論を誘導するのは「チェリー・ピッキング」の誤謬です。',
    biasType: 'showa'
  },
  {
    id: 'fh13',
    fallacyType: '偽りの等価性',
    scenario: '「あの競合企業も過去にセキュリティ事故を起こしましたし、我が社が今回顧客データを少し紛失したのも同じようなものです。どちらの会社もセキュリティに課題があるという点で同罪ですよ。」',
    question: 'この主張に潜む論理エラー（誤謬）を特定せよ！',
    choices: [
      { text: '偽りの等価性（本質的な規模や過失の度合いが異なる２つの事象を、一部の類似点で同等に扱う）', isCorrect: true },
      { text: '誤った二分法（同罪か、無罪かの極端な２択にする）', isCorrect: false },
      { text: 'お前だって論法（競合がお前だって言っていると責任転嫁する）', isCorrect: false },
      { text: '滑り坂論法（データの紛失が倒産に繋がると脅す）', isCorrect: false }
    ],
    explanation: '事故の重要度、漏洩規模、企業責任の重さが全く異なるにもかかわらず、「どちらもセキュリティ事故を起こした」という共通点だけで不当に「同等」と見なす「偽りの等価性」の罠です。',
    biasType: 'showa'
  },
  {
    id: 'fh14',
    fallacyType: '感情に訴える論証',
    scenario: '「このプロジェクトをここで中止にするなんて絶対に認められません！この半年間、開発チームのメンバーが毎日終電まで残業し、血のにじむような努力を重ねてきた姿を、あなたは見捨てるのですか！？」',
    question: 'この主張に潜む論理エラー（誤謬）を特定せよ！',
    choices: [
      { text: '感情に訴える論証（論理的妥当性ではなく、苦労や同情、怒りなどの感情を煽って主張を通す）', isCorrect: true },
      { text: '滑り坂論法（プロジェクト中止による最悪のドミノ倒しを語る）', isCorrect: false },
      { text: '大衆に訴える論証（みんなが残業を反対しているからダメだとする）', isCorrect: false },
      { text: '二重基準・特殊認可（自分たちにだけ特別な評価を求める）', isCorrect: false }
    ],
    explanation: 'プロジェクト継続のビジネス合理性や収益性のロジックではなく、チームの「これまでの苦労」や「同情」を引くことで感情的に説得しようとする論理エラーです。',
    biasType: 'showa'
  },
  {
    id: 'fh15',
    fallacyType: '権威に訴える論証',
    scenario: '「この新しい暗号資産に投資すべきだよ。SNSでフォロワーが100万人以上いる高名な経済インフルエンサー of A氏が、YouTubeで『これは絶対に値上がりする次世代の技術だ』と大絶賛していたんだから間違いない！」',
    question: 'この主張に潜む論理エラー（誤謬）を特定せよ！',
    choices: [
      { text: '権威に訴える論証（客観的データではなく、有名人やインフルエンサーの発言のみを信用の根拠にする）', isCorrect: true },
      { text: '新しさに訴える論証（次世代の技術だから優れているとする）', isCorrect: false },
      { text: '無知に訴える論証（値下がりする証拠がないから値上がりするはずだとする）', isCorrect: false },
      { text: '大衆に訴える論証（フォロワー100万人がみんな買っているとする）', isCorrect: false }
    ],
    explanation: '客観的な市場分析や暗号資産自体の財務的・技術的な価値検証をせず、「有名インフルエンサーが推奨しているから正しい」と決めつける「権威に訴える論証」です。',
    biasType: 'showa'
  },
  {
    id: 'fh16',
    fallacyType: '相関と因果の混同',
    scenario: '「オフィスの観葉植物の数を増やしたところ、翌月の営業チームの成約数が前月比で15%アップしました！やはり緑が放つマイナスイオンには、社員の営業力を引き出す強力な効果がありますね！」',
    question: 'この主張に潜む論理エラー（誤謬）を特定せよ！',
    choices: [
      { text: '相関と因果の混同（単なる前後の関係や相関関係があるに過ぎない事象に、安易な因果関係を認める）', isCorrect: true },
      { text: '単一原因の誤謬（成約数アップの要因が植物だけだとする）', isCorrect: false },
      { text: '早まった一般化（一つのオフィスだけの例から全体を一般化する）', isCorrect: false },
      { text: '新しさに訴える論証（植物を置く新しい試みだから良いとする）', isCorrect: false }
    ],
    explanation: '「植物を置いた」時期と「成約数が増えた」時期が重なっただけ（または市場要因など別の変数がある）かもしれないのに、直接的な因果があると主張するのは「相関と因果の混同」です。',
    biasType: 'reiwa'
  },
  {
    id: 'fh17',
    fallacyType: '早まった一般化',
    scenario: '「昨日採用面接したA大学の学生は挨拶の声が小さく、態度も悪かった。やはりA大学の学生はマナーがなっておらず、我が社のカルチャーには絶対に合わないから全員不採用にすべきだ。」',
    question: 'この主張に潜む論理エラー（誤謬）を特定せよ！',
    choices: [
      { text: '早まった一般化（限定された少ないサンプルから、全体を規定する一般的な結論を導き出す）', isCorrect: true },
      { text: '誤った二分法（A大学の学生を採用するか、しないかの2択にする）', isCorrect: false },
      { text: '対人論証・人身攻撃（A大学そのものを不当に貶める）', isCorrect: false },
      { text: 'ストローマン論法（A大学のカリキュラムを歪めて解釈する）', isCorrect: false }
    ],
    explanation: 'わずか「1人」の面接者の態度から、A大学の「全学生」の性質を決めつける、典型的な「早まった一般化」の誤謬です。',
    biasType: 'reiwa'
  },
  {
    id: 'fh18',
    fallacyType: '誤った二分法',
    scenario: '「社員のモチベーションを上げる方法は2つに1つだ。基本給を一律で10%上げるか、さもなければ社員が完全にやる気を失って全員退職し、会社が崩壊するのを静観するかだ！」',
    question: 'この主張に潜む論理エラー（誤謬）を特定せよ！',
    choices: [
      { text: '誤った二分法（他にも存在する多様な選択肢を無視し、極端な２者択一を迫る）', isCorrect: true },
      { text: '滑り坂論法（基本給を上げないと会社が崩壊するという因果の連鎖）', isCorrect: false },
      { text: 'お前だって論法（経営陣だってモチベーションが低いじゃないかとする）', isCorrect: false },
      { text: '感情に訴える論証（崩壊する会社を見たくないという感情を利用する）', isCorrect: false }
    ],
    explanation: '「評価制度の見直し」「働き方の柔軟化」など、モチベーション向上には他にも無数の手段があるのにもかかわらず、「給与10%アップか倒産か」の極端な2択に絞る「誤った二分法」です。',
    biasType: 'reiwa'
  },
  {
    id: 'fh19',
    fallacyType: '合成の誤謬',
    scenario: '「我がチームのメンバーは全員、社内テストでトップ10%に入る優秀なエンジニアばかりだ。したがって、このメンバーで結成した新規開発プロジェクトチームは、必ず業界最高峰の優れた成果物を生み出せるはずだ！」',
    question: 'この主張に潜む論理エラー（誤謬）を特定せよ！',
    choices: [
      { text: '合成の誤謬（個別の要素が優秀だからといって、それらを統合した全体も優秀であると誤認する）', isCorrect: true },
      { text: '単一原因の誤謬（エンジニアの能力だけが成果物の勝因だとする）', isCorrect: false },
      { text: '早まった一般化（テストの結果からチーム全員を優秀だと決めつける）', isCorrect: false },
      { text: '権威に訴える論証（社内テストという指標のみを過信する）', isCorrect: false }
    ],
    explanation: '個々の技術力が高くても、チームワークや相性、役割の重複などによって組織としての効率が下がるケースがあります。「部分の正が全体の正になるとは限らない」のが「合成の誤謬」です。',
    biasType: 'showa'
  },
  {
    id: 'fh20',
    fallacyType: '分割の誤謬',
    scenario: '「我が社はフォーチュン500に選ばれる世界最高峰の超一流IT企業だ。したがって、新卒でこの会社に配属された佐藤くんも、初日から業界最高クラスの優秀な開発スキルを持っているに違いない。」',
    question: 'この主張に潜む論理エラー（誤謬）を特定せよ！',
    choices: [
      { text: '分割の誤謬（全体が優秀・特別であるからといって、その個々の構成要素も同様に優秀であると思い込む）', isCorrect: true },
      { text: '早まった一般化（世界一流の評価から佐藤くんを判断する）', isCorrect: false },
      { text: '権威に訴える論証（フォーチュン500というブランドを信じる）', isCorrect: false },
      { text: '新しさに訴える論証（新卒だから最新スキルを持っているとする）', isCorrect: false }
    ],
    explanation: '会社全体が一流だとしても、個々の配属されたばかりの新人までが初めから一流のスキルを持っているとは限りません。「全体の属性を部分の属性と混同する」のは「分割 of 誤謬」です。',
    biasType: 'showa'
  },
  {
    id: 'fh21',
    fallacyType: 'ギャンブラーの誤謬',
    scenario: '「この新しい広告クリエイティブは、過去10回連続でABテストに敗北し、成約率が目標を下回り続けました。確率的にも、次の11回目のテストでは必ず大ヒット（成約率急上昇）を記録するはずです！」',
    question: 'この主張に潜む論理エラー（誤謬）を特定せよ！',
    choices: [
      { text: 'ギャンブラーの誤謬（独立した確率事象で、過去のハズレが重なるほど次は当たりやすくなると錯覚する）', isCorrect: true },
      { text: '無知に訴える論証（次のクリエイティブが失敗する証拠がないとする）', isCorrect: false },
      { text: '相関と因果の混同（テスト回数とヒット率の相関を誤解する）', isCorrect: false },
      { text: '滑り坂論法（負け続けることで最悪のシナリオになると考える）', isCorrect: false }
    ],
    explanation: '個々のABテストは基本的に独立した試行であり、過去10回連続でダメだったからといって、11回目の成功率が自動的に上がることはありません。「確率の帳尻合わせ」を期待するのは「ギャンブラーの誤謬」です。',
    biasType: 'reiwa'
  },
  {
    id: 'fh22',
    fallacyType: 'テキサスの狙撃兵の誤謬',
    scenario: '「この新しい健康サプリを販売したところ、Aさんは血圧が下がり、Bさんは不眠が改善し、Cさんは腰痛が和らいだと言っています！どんな体の不調も劇的に改善する、万能のサプリメントであることが実証されました！」',
    question: 'この主張に潜む論理エラー（誤謬）を特定せよ！',
    choices: [
      { text: 'テキサスの狙撃兵の誤謬（ランダムなデータ群から、たまたま一致した結果だけを都合よく結びつけて因果とする）', isCorrect: true },
      { text: 'チェリー・ピッキング（サプリを飲んで改善しなかった人の声を無視する）', isCorrect: false },
      { text: '単一原因の誤謬（サプリだけで体調がすべて改善したとする）', isCorrect: false },
      { text: '早まった一般化（Aさん、Bさん、Cさんの3例から万能とする）', isCorrect: false }
    ],
    explanation: '多様な体験データの中から、たまたま起きた別々の改善例（血圧、不眠、腰痛など異なる事象）だけを無理やり抽出し、あたかも「万能」という統一の因果関係が証明されたかのように主張する論理エラーです。',
    biasType: 'showa'
  },
  {
    id: 'fh23',
    fallacyType: '伝統に訴える論証',
    scenario: '「我が社は創業以来50年間、ずっと紙の伝票と印鑑での承認フローで業務を回してきました。だから、このフローが最もミスが少なく安全であり、電子契約ツールを導入する必要はありません！」',
    question: 'この主張に潜む論理エラー（誤謬）を特定せよ！',
    choices: [
      { text: '伝統に訴える論証（「歴史がある」「昔から続いている」こと自体を、その正しさ・優位性の根拠にする）', isCorrect: true },
      { text: '新しさに訴える論証（電子ツールが新しいからダメだとする）', isCorrect: false },
      { text: '大衆に訴える論証（みんながこのフローを使っているとする）', isCorrect: false },
      { text: '循環論証（安全だから伝票を使い、伝票だから安全だとする）', isCorrect: false }
    ],
    explanation: '「50年間続いてきた」ということは、単に慣習であることを示しているに過ぎず、それが現代の基準で「最もミスが少なく安全」であることの合理的・客観的証明にはなりません。これが伝統に訴える論証です。',
    biasType: 'showa'
  },
  {
    id: 'fh24',
    fallacyType: '中庸への逃避 (折衷の誤謬)',
    scenario: '「マーケティング予算を巡って、A部長は『効果測定のために100%デジタル広告にすべきだ』と主張し、B部長は『認知拡大のために100%テレビCMにすべきだ』と言っています。間を取って50%ずつ予算を分けるのが、最も論理的で正しい判断ですね。」',
    question: 'この主張に潜む論理エラー（誤謬）を特定せよ！',
    choices: [
      { text: '中庸への逃避・折衷の誤謬（対立する２つの極端な主張があるとき、中間の妥協案が常に正しいと盲信する）', isCorrect: true },
      { text: '誤った二分法（デジタルかテレビかの２択しかないとする）', isCorrect: false },
      { text: '単一原因の誤謬（予算配分だけが広告成果の勝因だとする）', isCorrect: false },
      { text: '循環論証（中庸だから正しく、正しいから中庸だとする）', isCorrect: false }
    ],
    explanation: '対立する２つの極端なプランの論理的妥当性や費用対効果を全く検証せず、ただ単に「真ん中の50%ずつ」という折衷案を選択することが無条件で最適であると判断するのは「折衷の誤謬」です。',
    biasType: 'showa'
  },
  {
    id: 'fh25',
    fallacyType: '多義性の誤謬 (意味のすり替え)',
    scenario: '「『社会に役立つ素晴らしいアイデアは誰もが自由に共有すべきだ』とよく言われますよね。だから、競合他社が莫大な開発費を投じて取得したこの特許技術も、社会のために我が社が自由にコピーして使って良いはずです！」',
    question: 'この主張に潜む論理エラー（誤謬）を特定せよ！',
    choices: [
      { text: '多義性の誤謬（論旨の途中で、同一の単語の異なる意味をすり替えて論理を構築する）', isCorrect: true },
      { text: 'ストローマン論法（競合他社の主張を過激に歪めて解釈する）', isCorrect: false },
      { text: '二重基準（自分たちの特許技術は守るが他社のは奪う）', isCorrect: false },
      { text: '特殊認可（自分たちにだけ特許コピーを例外的に許す）', isCorrect: false }
    ],
    explanation: '「素晴らしいアイデアを（言葉や精神として）自由に共有・議論する」という意味から、「知的財産権（特許）を無断でコピーして商用利用する」という意味へ、「自由に共有・使用する」の意味を狡猾にすり替えています。',
    biasType: 'reiwa'
  },
  {
    id: 'fh26',
    fallacyType: '滑り坂論法 (目標設定)',
    scenario: '「今期の目標設定を少しでも妥協して下げると、社員は楽な方へ流され、次の期にはさらに目標を下げ、最終的に誰も仕事を真面目にしなくなり、我が社は数年以内に確実に倒産します！」',
    question: 'この主張に潜む論理エラー（誤謬）を特定せよ！',
    choices: [
      { text: '滑り坂論法（合理的な因果関係の証明なしに、小さな変化が最終的な大惨事へと直結すると主張する）', isCorrect: true },
      { text: '誤った二分法（妥協するか、倒産するかの2択にする）', isCorrect: false },
      { text: 'ストローマン論法（目標引き下げ案をサボりの推奨に歪める）', isCorrect: false },
      { text: '単一原因の誤謬（倒産の原因を目標引き下げだけに求める）', isCorrect: false }
    ],
    explanation: '「目標を少し下げる」ことから「確実に倒産する」までの極端な因果関係のドミノ倒しが、何の根拠もなく飛躍的に繋げられて相手を脅しています。これが滑り坂論法です。',
    biasType: 'reiwa'
  },
  {
    id: 'fh27',
    fallacyType: 'ストローマン論法 (AI活用)',
    scenario: '「営業部の鈴木さんが『営業資料の誤字脱字チェックをAIに任せて効率化しよう』と提案した。つまり彼は、人間は一切確認せず、誤字だらけの不正確な資料をクライアントに平気で送りつけてもいいと言っているわけだ！」',
    question: 'この主張に潜む論理エラー（誤謬）を特定せよ！',
    choices: [
      { text: 'ストローマン論法（相手の提案を極端で非合理的な形に勝手に歪め、攻撃しやすい標的にする）', isCorrect: true },
      { text: '人身攻撃（鈴木さんの人格や注意不足を非難する）', isCorrect: false },
      { text: 'お前だって論法（あなただって誤字が多いじゃないかとする）', isCorrect: false },
      { text: '二重基準（自分がAIを使うのは良いが、鈴木さんが使うのはダメとする）', isCorrect: false }
    ],
    explanation: '「AIで初期チェックをして効率化する」という提案を、「人間が確認せず誤字だらけの資料を送る」という不名誉で無責任な主張にすり替え、攻撃しやすくしています。これがストローマン論法です。',
    biasType: 'reiwa'
  },
  {
    id: 'fh28',
    fallacyType: '循環論証 (企画書)',
    scenario: '「鈴木さんの書く企画書は、常に論理的で素晴らしい出来栄えです。なぜそれが分かるかって？それは、彼の企画書には全く矛盾がなく、非常にロジカルで優れているからですよ！」',
    question: 'この主張に潜む論理エラー（誤謬）を特定せよ！',
    choices: [
      { text: '循環論証（証明すべき結論である「論理的で素晴らしい」を、別の表現で前提として使い回す）', isCorrect: true },
      { text: '権威に訴える論証（鈴木さんという人物の評価だけを信じる）', isCorrect: false },
      { text: '大衆に訴える論証（みんなが鈴木さんの企画書を褒めているとする）', isCorrect: false },
      { text: '相関と因果の混同（ロジカルさと出来栄えの相関を誤解する）', isCorrect: false }
    ],
    explanation: '「論理的で素晴らしい」という結論の根拠が、「矛盾がなくロジカルで優れている（＝同じ意味の言い換え）」になっており、主張の内容を実質的に何一つ証明していません。',
    biasType: 'reiwa'
  },
  {
    id: 'fh29',
    fallacyType: '無知に訴える論証 (安全評価)',
    scenario: '「このプロジェクトで発生したバグの原因が、新しく導入したフレームワークにあるという明確な証拠は見つかりませんでした。よって、このフレームワークは100%安全で無実であることが証明されました！」',
    question: 'この主張に潜む論理エラー（誤謬）を特定せよ！',
    choices: [
      { text: '無知に訴える論証（「バグの原因である証拠がない」ことを、「安全である」ことの証明とする）', isCorrect: true },
      { text: '新しさに訴える論証（新しく導入したフレームワークだから良いとする）', isCorrect: false },
      { text: 'ギャンブラーの誤謬（今回はバグの原因でなかったから次も大丈夫だとする）', isCorrect: false },
      { text: '特殊認可（フレームワークだけ例外的にバグ検証から除外する）', isCorrect: false }
    ],
    explanation: '「原因であると証明されていない」ことは、「原因ではない（安全である）」ことの積極的な証明にはなりません。未検証の不具合があるかもしれないため、「無知に訴える論証」に該当します。',
    biasType: 'reiwa'
  },
  {
    id: 'fh30',
    fallacyType: 'お前だって論法 (パスワード)',
    scenario: '「お客様、セキュリティパスワードは定期的に変更してください。そうしないとアカウントが乗っ取られますよ。」「そういうあなたこそ、自分のPCのログインパスワードを数ヶ月間も変更せずに使い回しているそうじゃないですか。あなたに言われる筋合いはありません！」',
    question: 'この主張に潜む論理エラー（誤謬）を特定せよ！',
    choices: [
      { text: 'お前だって論法（相手の言行不一致や落ち度を指摘することで、指摘そのものの正当性から議論をそらす）', isCorrect: true },
      { text: '人身攻撃（相手のセキュリティ意識の低さを責め立てる）', isCorrect: false },
      { text: '感情に訴える論証（パスワード変更の面倒さを感情的に訴える）', isCorrect: false },
      { text: 'ストローマン論法（パスワード定期変更のルールを歪める）', isCorrect: false }
    ],
    explanation: '「パスワードを変更すべき」というセキュリティ上の正しい指摘に対し、「指摘した本人もやっていない」という矛盾を突きつけることで、指摘自体の必要性から議論をそらそうとする「お前だって論法」です。',
    biasType: 'showa'
  },
  {
    id: 'fh31',
    fallacyType: '早まった一般化',
    scenario: '「最近の若手社員は、タイパ重視で指示されたことしかやらない。昨日入社したハルトくんも定時きっかりに帰ったし、今の世代は全員主体性が欠如しているな。」',
    question: 'この主張に潜む論理エラー（誤謬）を特定せよ！',
    choices: [
      { text: '早まった一般化（極めて少数の事例や限られたサンプルのみから、全体に共通する規則・性質であると結論づける）', isCorrect: true },
      { text: '単一原因の誤謬（若手が定時退社する理由を主体性欠如だけにする）', isCorrect: false },
      { text: '滑り坂論法（定時退社を繰り返すと会社が倒産すると脅す）', isCorrect: false },
      { text: '新しさに訴える論証（タイパ重視という新しい価値観が常に正しいとする）', isCorrect: false }
    ],
    explanation: '「昨日入社した1名の行動」という非常に限られたサンプルだけを根拠に、「最近の若手は全員主体性がない」と極端な全体論に一般化して結論づける「早まった一般化」の誤謬です。',
    biasType: 'showa'
  },
  {
    id: 'fh32',
    fallacyType: '対人論証 (人身攻撃)',
    scenario: '「Aさんが提案しているオフィスのペーパーレス化計画は却下すべきです。何しろ彼は過去に何度も経理処理の単純ミスをやらかしているような、だらしない人間ですからね。」',
    question: 'この主張に潜む論理エラー（誤謬）を特定せよ！',
    choices: [
      { text: '対人論証・人身攻撃（主張そのものの論理的な妥当性ではなく、主張している人物の性格や過去の欠点・経歴を攻撃する）', isCorrect: true },
      { text: 'ストローマン論法（ペーパーレス化計画の中身を極端に歪めて解釈する）', isCorrect: false },
      { text: '二重基準（Aさんにだけ厳しいルールを適用する）', isCorrect: false },
      { text: '無知に訴える論証（紙を使うのが安全である証拠がないとする）', isCorrect: false }
    ],
    explanation: '「ペーパーレス化計画の妥当性（コストや効果）」という提案内容自体を評価せず、「Aさんは経理処理でミスをする人物だ」という無関係な個人の過去の短所を理由に提案を否定する「対人論証（人身攻撃）」の典型例です。',
    biasType: 'showa'
  },
  {
    id: 'fh33',
    fallacyType: '誤った等価関係 (偽りのバランス)',
    scenario: '「タバコの健康被害を心配する人がいるけれど、世の中には自動車事故で死ぬ人だって毎年たくさんいるんだ。だから、タバコだけを有害視して排除しようとするのは間違っているよ。」',
    question: 'この主張に潜む論理エラー（誤謬）を特定せよ！',
    choices: [
      { text: '誤った等価関係（本質的な重要度やリスク、選択の自由度が全く異なる２つの事象を、不当に同列に扱って比較する）', isCorrect: true },
      { text: '滑り坂論法（タバコを排除すると車の利用も禁止されると飛躍する）', isCorrect: false },
      { text: 'お前だって論法（車のドライバーだって事故を起こすと反論する）', isCorrect: false },
      { text: '循環論証（事故もタバコも危険だからすべて危険だとする）', isCorrect: false }
    ],
    explanation: '移動の社会インフラとして不可欠な側面がある「自動車の事故リスク」と、個人の嗜好品であり防ぐことが比較的容易な「タバコの健康被害」という、性質も目的も異なる２つのリスクを不当に同列に並べて煙に巻こうとする「誤った等価関係（偽りのバランス）」です。',
    biasType: 'reiwa'
  },
  {
    id: 'fh34',
    fallacyType: 'チェリー・ピッキング',
    scenario: '「我が社の新サプリメントは科学的に効果が証明されています！モニター100名のうち、なんと3名が『肌の調子が劇的に良くなった』と回答しました。残りの97名のデータ？それは些細な個人差に過ぎません。」',
    question: 'この主張に潜む論理エラー（誤謬）を特定せよ！',
    choices: [
      { text: 'チェリー・ピッキング（自分の主張に都合の良い少数のデータだけを意図的に抽出し、都合の悪い大多数の反証データを無視する）', isCorrect: true },
      { text: '早まった一般化（3名のデータだけでサプリ全般の効果を一般化する）', isCorrect: false },
      { text: '単一原因の誤謬（肌が良くなった原因をサプリだけにする）', isCorrect: false },
      { text: '無知に訴える論証（残りの97名に悪影響がないから安全だとする）', isCorrect: false }
    ],
    explanation: '100名のうちわずか3名という都合の良い結果だけを大々的にアピールし、効果が見られなかった97名という不都合な大多数の事実を無視して効果を証明しようとする「チェリー・ピッキング（つまみ食い）」です。',
    biasType: 'reiwa'
  },
  {
    id: 'fh35',
    fallacyType: '伝統に訴える論証',
    scenario: '「会議のアジェンダは事前に印刷して紙で全員に配るべきだ。我が社は創業以来30年間ずっとこの方法で意思決定を行ってきたのだから、これが最も安全で正しいやり方に決まっている。」',
    question: 'この主張に潜む論理エラー（誤謬）を特定せよ！',
    choices: [
      { text: '伝統に訴える論証（「昔からずっと行われてきた」という歴史や慣習があることだけを根拠に、その正当性や最適性を主張する）', isCorrect: true },
      { text: '新しさに訴える論証（古いやり方は常に新しいやり方より優れているとする）', isCorrect: false },
      { text: '単一原因の誤謬（意思決定がうまくいくのは紙の資料だけが原因とする）', isCorrect: false },
      { text: '特殊認可（創業者の慣習だけを特別ルールとして優遇する）', isCorrect: false }
    ],
    explanation: '紙での配布が現代の業務効率において最適であるかどうかの合理的説明がなく、単に「30年間の歴史がある」という慣習のみを根拠に正しいと結論づける「伝統に訴える論証」の誤謬です。',
    biasType: 'showa'
  },
  {
    id: 'fh36',
    fallacyType: '合成の誤謬',
    scenario: '「今回のプロジェクトで、チームメンバー全員が自分のパートを究極に効率化して最速で終わらせれば、プロジェクト全体の開発スピードも自動的に史上最速になるはずです！」',
    question: 'この主張に潜む論理エラー（誤謬）を特定せよ！',
    choices: [
      { text: '合成の誤謬（部分（個人）にとって正しい・最適なことが、それらを合わせた全体（チーム）にとっても常に正しいと誤認する）', isCorrect: true },
      { text: '単一原因の誤謬（スピード向上だけの要因に固執する）', isCorrect: false },
      { text: '循環論証（個人のスピードが上がれば全体のスピードが上がると同義語を繰り返す）', isCorrect: false },
      { text: '誤った等価関係（個人のスピードと全体の結合テストを同列にする）', isCorrect: false }
    ],
    explanation: '各人が個人のパートを個別最適で勝手に終わらせると、後工程での結合エラーやコミュニケーション摩擦が発生し、全体としてはかえって遅延する可能性があります。「部分の最適 ＝ 全体の最適」と盲信する「合成の誤謬（Fallacy of Composition）」です。',
    biasType: 'reiwa'
  }
];

// デバッグ対象（思考バグ・コード）の定義
// デバッグ対象（思考バグ・コード）の定義
const bugTargets = [
  {
    name: 'ストローマン・バグ',
    emoji: '🔌',
    maxHp: 40,
    timeLimit: 20,
    dmgPerHit: 20,
    color: '#ec4899',
    glowColor: 'rgba(236, 72, 153, 0.4)',
    desc: '対話のねじ曲げやストローマン論法を頻発し、論点をすり替える狡猾な初期思考バグ・コード。'
  },
  {
    name: 'キベン・ブロック',
    emoji: '💾',
    maxHp: 60,
    timeLimit: 15,
    dmgPerHit: 20,
    color: '#f59e0b',
    glowColor: 'rgba(245, 158, 11, 0.4)',
    desc: '「前例がない」「みんなそうしている」という伝統や大衆心理の重厚な壁を形成する、強固な思考エラーブロック。'
  },
  {
    name: 'ゴビュード・コア',
    emoji: '🌀',
    maxHp: 80,
    timeLimit: 12,
    dmgPerHit: 20,
    color: '#ef4444',
    glowColor: 'rgba(239, 68, 68, 0.4)',
    desc: '滑り坂論法などの巨大な論理飛躍や感情論を引き起こす、システム中枢に巣食う最悪の誤謬バグコア。'
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

export default function FallacyHunter({ onFinish, playSound, muted, toggleMute, onBack, onLogBug, reviewQuestionId, onFinishReview }) {
  // ゲーム進行用ステート
  const [gameStatus, setGameStatus] = useState('tutorial'); // 'tutorial' | 'playing' | 'clear'
  const [wave, setWave] = useState(1); // 1, 2, 3 (モンスター/デバッグ対象の難易度レベル)
  const [monsterHp, setMonsterHp] = useState(100); // 難易度ビジュアル用進捗(2問正解で完了)

  // 問題管理 (1セッションあたり6問)
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedChoiceIdx, setSelectedChoiceIdx] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [totalCorrectAnswers, setTotalCorrectAnswers] = useState(0);

  // タイマー＆診断測定管理
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef(null);
  const startTimeRef = useRef(0);
  const [totalTimeSpent, setTotalTimeSpent] = useState(0); // 累計思考時間 (秒)
  const [showaStats, setShowaStats] = useState({ correct: 0, total: 0 });
  const [reiwaStats, setReiwaStats] = useState({ correct: 0, total: 0 });

  // アニメーション制御用フラグ
  const [screenEffect, setScreenEffect] = useState(null); // 'shake' | null
  const [damageNumber, setDamageNumber] = useState(null); // { val: number, target: 'monster' | 'player' }
  const [atkEffect, setAtkEffect] = useState(false);

  // 1. クイズの初期化
  const initializeGame = () => {
    const shuffled = shuffleArray(labQuestions);
    let finalized = [];
    if (reviewQuestionId) {
      const found = labQuestions.find(q => q.id === reviewQuestionId);
      if (found) {
        finalized = [{
          ...found,
          choices: shuffleArray(found.choices)
        }];
        setGameStatus('playing');
      }
    }
    if (finalized.length === 0) {
      const showaQs = shuffled.filter(q => q.biasType === 'showa').slice(0, 3);
      const reiwaQs = shuffled.filter(q => q.biasType === 'reiwa').slice(0, 3);
      finalized = shuffleArray([...showaQs, ...reiwaQs]).map(q => ({
        ...q,
        choices: shuffleArray(q.choices)
      }));
      setGameStatus('tutorial');
    }

    setQuestions(finalized);
    setWave(1);
    setMonsterHp(100);
    setCurrentQuestionIdx(0);
    setSelectedChoiceIdx(null);
    setIsAnswered(false);
    setCombo(0);
    setMaxCombo(0);
    setTotalCorrectAnswers(0);
    setTotalTimeSpent(0);
    setShowaStats({ correct: 0, total: 0 });
    setReiwaStats({ correct: 0, total: 0 });
    setElapsedTime(0);
    setScreenEffect(null);
    setDamageNumber(null);
    setAtkEffect(false);
  };

  useEffect(() => {
    initializeGame();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // 各問題の開始時にタイマーをセットし、開始時刻を記録
  useEffect(() => {
    if (gameStatus !== 'playing') return;
    
    // スキャン開始時間を記録
    startTimeRef.current = Date.now();
    
    if (isAnswered) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    setElapsedTime(0);

    timerRef.current = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameStatus, currentQuestionIdx, isAnswered]);

  const currentMonster = bugTargets[wave - 1] || bugTargets[0];
  const currentQuestion = questions[currentQuestionIdx];

  const triggerDamageNum = (val, target) => {
    setDamageNumber({ val, target });
    setTimeout(() => {
      setDamageNumber(null);
    }, 1200);
  };

  // 統計データの更新
  const updateStats = (bias, isCorrect) => {
    if (bias === 'showa') {
      setShowaStats(prev => ({
        correct: prev.correct + (isCorrect ? 1 : 0),
        total: prev.total + 1
      }));
    } else {
      setReiwaStats(prev => ({
        correct: prev.correct + (isCorrect ? 1 : 0),
        total: prev.total + 1
      }));
    }
  };

  // 5. 解答選択肢をクリック
  const handleAnswer = (choiceIdx) => {
    if (isAnswered || gameStatus !== 'playing') return;

    if (timerRef.current) clearInterval(timerRef.current);
    playSound('click');
    setSelectedChoiceIdx(choiceIdx);
    setIsAnswered(true);

    // 思考時間の計測
    const timeSpentSec = (Date.now() - startTimeRef.current) / 1000;
    setTotalTimeSpent(prev => prev + timeSpentSec);

    const isCorrect = currentQuestion.choices[choiceIdx].isCorrect;
    const bias = currentQuestion.biasType;
    updateStats(bias, isCorrect);

    if (isCorrect) {
      // 正解：デバッグ成功エフェクト
      playSound('correct');
      setCombo(prev => {
        const next = prev + 1;
        if (next > maxCombo) setMaxCombo(next);
        return next;
      });
      setTotalCorrectAnswers(prev => prev + 1);

      // スキャンレーザーエフェクト
      setAtkEffect(true);
      setTimeout(() => setAtkEffect(false), 600);
      triggerDamageNum('[DECRYPTED]', 'monster');

      // モンスターHP（デバッグ進捗）を減らす
      setMonsterHp(prev => Math.max(0, prev - 50));
    } else {
      // 不正解：警告
      playSound('incorrect');
      setCombo(0);
      setScreenEffect('shake');
      triggerDamageNum('[BIAS DETECTED]', 'player');
      setTimeout(() => setScreenEffect(null), 500);

      if (onLogBug && !reviewQuestionId) {
        onLogBug('fallacyHunter', currentQuestion.id, `あなたの選択: ${currentQuestion.choices[choiceIdx].text} (正解: ${currentQuestion.choices.find(c => c.isCorrect)?.text})`, currentQuestion.scenario);
      }
    }
  };

  // 6. 次の問題へ
  const handleNext = () => {
    if (!isAnswered) return;
    playSound('click');
    setSelectedChoiceIdx(null);
    setIsAnswered(false);

    // 2問ごとに難易度（対象）を切り替える
    // 6問中の進行具合から wave を判定
    const nextQuestionIdx = currentQuestionIdx + 1;
    if (nextQuestionIdx < questions.length) {
      setCurrentQuestionIdx(nextQuestionIdx);
      const nextWave = Math.floor(nextQuestionIdx / 2) + 1;
      if (nextWave !== wave) {
        setWave(nextWave);
        setMonsterHp(100);
      }
    } else {
      // 6問すべて終了。診断完了！
      playSound('success');
      if (reviewQuestionId && onFinishReview) {
        onFinishReview('fallacyHunter', reviewQuestionId);
      } else {
        const accuracyScore = Math.round((totalCorrectAnswers / questions.length) * 100);
        onFinish(accuracyScore, false);
        setGameStatus('clear');
      }
    }
  };

  // 8. リトライ処理
  const handleRetry = () => {
    initializeGame();
    setGameStatus('playing');
  };

  // 9. ゲーム結果の記録
  const handleFinishGame = () => {
    if (reviewQuestionId && onFinishReview) {
      onFinishReview('fallacyHunter', reviewQuestionId);
    } else {
      const accuracyScore = Math.round((totalCorrectAnswers / questions.length) * 100);
      onFinish(accuracyScore);
    }
  };

  const startDiagnostics = () => {
    playSound('click');
    setGameStatus('playing');
    startTimeRef.current = Date.now();
  };

  if (questions.length === 0 || !currentQuestion) {
    return null;
  }




  // 診断データ集計
  const showaDebRate = showaStats.total > 0 ? Math.round((showaStats.correct / showaStats.total) * 100) : 100;
  const reiwaDebRate = reiwaStats.total > 0 ? Math.round((reiwaStats.correct / reiwaStats.total) * 100) : 100;
  const avgScanTime = Math.round((totalTimeSpent / 6) * 10) / 10;

  const getDiagnosis = () => {
    if (showaDebRate >= 80 && reiwaDebRate >= 80) {
      return {
        title: "スーパークリーン・デバッガー",
        desc: "昭和の精神論バイアスも、令和のタイパ至上主義バイアスも完璧に見破るクリアな脳の持ち主です。極めてフラットで論理的な認知バランスを持っています。"
      };
    }
    if (showaDebRate < 50 && reiwaDebRate >= 80) {
      return {
        title: "令和偏重・精神論アレルギー脳",
        desc: "令和の合理的なルールや防衛姿勢は正しく理解できますが、昭和の『感情論』や『伝統への訴え』などのへりくつバグに引っかかりやすい傾向があります。"
      };
    }
    if (reiwaDebRate < 50 && showaDebRate >= 80) {
      return {
        title: "昭和偏重・タイパ過信脳",
        desc: "昭和的な経験主義や人情の歪みは冷静見破れますが、令和的な『タイパ至上主義』や『過剰防衛的なすり替え』などのモダンなへりくつバグをスルーしがちです。"
      };
    }
    return {
      title: "思考ノイズ蓄積脳",
      desc: "昭和・令和それぞれのバイアスが少しずつ脳内にノイズとして混入しています。物事をロジカルに整理する際、世代的なへりくつやバイアスに思考を惑わされやすい状態です。"
    };
  };

  const diagnosis = getDiagnosis();

  return (
    <div className={`lab-wrapper ${screenEffect === 'shake' ? 'shake-active' : ''}`} style={{ maxWidth: '800px', margin: '0 auto', padding: '0 16px' }}>
      
      {/* 画面エフェクト・キーフレーム定義のスタイルタグ */}
      <style>{`
        .lab-wrapper {
          transition: transform 0.1s ease;
        }
        .shake-active {
          animation: warning-glitch 0.4s ease-in-out;
          position: relative;
        }
        .shake-active::before {
          content: "";
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(245, 158, 11, 0.05);
          border: 2px solid #f59e0b;
          border-radius: 16px;
          z-index: 10;
          pointer-events: none;
          animation: warning-flash-ani 0.4s ease;
        }
        @keyframes warning-glitch {
          0%, 100% { transform: translate(0, 0); filter: brightness(1); }
          20% { transform: translate(-2px, 0); filter: brightness(1.2) contrast(1.1); }
          40% { transform: translate(2px, 0); }
          60% { transform: translate(-1px, 0); filter: brightness(0.9); }
          80% { transform: translate(1px, 0); }
        }
        @keyframes warning-flash-ani {
          0%, 100% { opacity: 0; }
          50% { opacity: 1; }
        }
        .monster-box {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 180px;
          border-radius: 16px;
          background: radial-gradient(circle, rgba(15, 23, 42, 0.85) 0%, rgba(20, 27, 41, 0.98) 100%);
          border: 1px solid var(--border-color);
          box-shadow: inset 0 0 30px rgba(0, 0, 0, 0.8), 0 0 20px rgba(16, 185, 129, 0.05);
          overflow: hidden;
        }
        body.light-theme .monster-box {
          background: radial-gradient(circle, rgba(248, 250, 252, 0.95) 0%, rgba(226, 232, 240, 0.98) 100%);
          box-shadow: inset 0 0 30px rgba(15, 23, 42, 0.04), 0 4px 20px rgba(0, 0, 0, 0.05);
        }
        .grid-bg {
          position: absolute;
          width: 100%; height: 100%;
          background-size: 20px 20px;
          background-image: 
            linear-gradient(to right, rgba(255, 255, 255, 0.02) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
          top: 0; left: 0;
          z-index: 1;
        }
        body.light-theme .grid-bg {
          background-image: 
            linear-gradient(to right, rgba(15, 23, 42, 0.02) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(15, 23, 42, 0.02) 1px, transparent 1px);
        }
        .monster-sprite {
          z-index: 2;
          transition: all 0.3s ease;
        }
        .float-ani {
          animation: monster-float 2.5s ease-in-out infinite;
        }
        @keyframes monster-float {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-8px) scale(1.03); }
        }
        .atk-slash {
          position: absolute;
          width: 100%; height: 100%;
          top: 0; left: 0;
          z-index: 5;
          pointer-events: none;
        }
        .slash-line {
          width: 100%;
          height: 3px;
          background: linear-gradient(90deg, transparent, #fff, var(--color-emerald), transparent);
          box-shadow: 0 0 15px var(--color-emerald);
          position: absolute;
          left: 0;
          animation: scan-animation 0.8s cubic-bezier(0.25, 0.8, 0.25, 1) forwards;
        }
        @keyframes scan-animation {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        .dmg-number {
          position: absolute;
          font-family: var(--font-display);
          font-weight: 800;
          font-size: 22px;
          text-shadow: 0 2px 10px rgba(0, 0, 0, 0.9);
          z-index: 10;
          letter-spacing: 1px;
          animation: dmg-float 1.2s cubic-bezier(0.25, 0.8, 0.25, 1) forwards;
        }
        @keyframes dmg-float {
          0% { transform: translateY(0) scale(0.8); opacity: 0; }
          20% { transform: translateY(-10px) scale(1.1); opacity: 1; }
          100% { transform: translateY(-30px) scale(1); opacity: 0; }
        }
        .hp-bar-outer {
          height: 10px;
          border-radius: 5px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border-color);
          overflow: hidden;
          width: 100%;
        }
        body.light-theme .hp-bar-outer {
          background: rgba(15, 23, 42, 0.06);
        }
        .hp-bar-inner {
          height: 100%;
          transition: width 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
        }
        .timer-bar-outer {
          height: 6px;
          border-radius: 3px;
          background: rgba(255, 255, 255, 0.05);
          overflow: hidden;
          width: 100%;
        }
        body.light-theme .timer-bar-outer {
          background: rgba(15, 23, 42, 0.06);
        }
        .timer-bar-inner {
          height: 100%;
          transition: width 1s linear, background-color 0.3s ease;
        }
        .scanning-pulse {
          animation: scan-pulse-ani 1.5s ease-in-out infinite alternate;
        }
        @keyframes scan-pulse-ani {
          0% { opacity: 0.3; }
          100% { opacity: 1; filter: brightness(1.2); }
        }
      `}</style>

      {/* 1. チュートリアル / 導入画面 */}
      {gameStatus === 'tutorial' && (
        <div className="glass-panel fade-in" style={{ padding: '32px', textAlign: 'left', borderLeft: '4px solid var(--color-rose)' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-rose)', fontSize: '22px', display: 'flex', alignItems: 'center', gap: '8px', marginTop: 0 }}>
            <Award size={24} />
            Fallacy Hunter : 脳内バイアス診断
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6', margin: '16px 0 24px 0' }}>
            日常会話やビジネスコードに潜む「論理エラー（へりくつ・詭弁バグ）」を検出（Detect）し、論理思考の偏りを暴き出す診断モジュールです。<br />
            提示された主張コードから、誤謬パターンを素早く見分けてデバッグコマンドを実行してください。
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
            <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <strong style={{ fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                🔬 診断プロセス:
              </strong>
              <ul style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px', paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li><strong>世代バイアスのスキャン</strong>: 出題される6つのバグ主張には、それぞれ「昭和脳（精神論や伝統）」または「令和脳（過度なタイパや自己防衛）」の歪みバイアスが隠されています。</li>
                <li><strong>レスポンスタイム測定</strong>: 各回答の決定にかかった時間を診断指標として正確に記録します（時間制限はありませんので、ご自身のペースで回答してください）。</li>
                <li><strong>診断シミュレーション</strong>: 不正解によるゲームオーバーはありません。詳細なデバッグ解説を確認しながら、ロジックの改善プロセスを進めてください。</li>
              </ul>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              {bugTargets.map((m, idx) => (
                <div key={idx} style={{ padding: '12px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.01)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                  <div style={{ fontSize: '28px', marginBottom: '4px' }}>{m.emoji}</div>
                  <div style={{ fontSize: '11px', fontWeight: 'bold' }}>{m.name}</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>汚染深度Lv.{idx + 1}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            <button onClick={startDiagnostics} className="btn btn-primary" style={{ width: '100%', background: 'linear-gradient(135deg, var(--color-rose) 0%, #e11d48 100%)', boxShadow: '0 4px 15px var(--color-rose-glow)' }}>
              <Play size={16} style={{ marginRight: '6px' }} />
              システムスキャナーを起動
            </button>
          </div>
        </div>
      )}

      {/* 2. 診断・スキャン画面 */}
      {gameStatus === 'playing' && (
        <div className="glass-panel fade-in" style={{ padding: '24px', position: 'relative' }}>
          
          {/* 上部：スキャンモニターのヘッダー */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <span style={{ color: 'var(--color-rose)', fontWeight: 'bold', fontSize: '11px', letterSpacing: '1px', fontFamily: 'var(--font-display)' }}>
                SCAN PROGRESS {currentQuestionIdx + 1} / 6
              </span>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: '2px 0 0 0', color: currentMonster.color }}>
                {currentMonster.name} をスキャン中...
              </h2>
            </div>
            
            {/* スキャン進行度 */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', width: '120px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                <Zap size={14} style={{ color: 'var(--color-rose)' }} />
                PROGRESS {currentQuestionIdx} / 6
              </div>
              <div className="hp-bar-outer">
                <div 
                  className="hp-bar-inner" 
                  style={{ 
                    width: `${(currentQuestionIdx / 6) * 100}%`, 
                    background: 'linear-gradient(90deg, var(--color-rose), #ec4899)' 
                  }} 
                />
              </div>
            </div>
          </div>

          {/* デバッグ進捗 & スキャンタイムリミット */}
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '16px' }}>
            {/* デバッグ完了への進捗 */}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                <span>ANALYSIS COMPLETE RATE</span>
                <span>{100 - monsterHp}%</span>
              </div>
              <div className="hp-bar-outer">
                <div 
                  className="hp-bar-inner" 
                  style={{ 
                    width: `${100 - monsterHp}%`, 
                    background: `linear-gradient(90deg, ${currentMonster.color}, var(--color-emerald))` 
                  }} 
                />
              </div>
            </div>

            {/* スキャンタイマー */}
            <div style={{ width: '120px', position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}><Timer size={10} /> SCAN TIME</span>
                <span style={{ color: 'var(--color-cyan)', fontWeight: 'bold' }}>{elapsedTime}s</span>
              </div>
              <div className="timer-bar-outer">
                <div 
                  className="timer-bar-inner scanning-pulse" 
                  style={{ 
                    width: '100%', 
                    backgroundColor: 'var(--color-cyan)',
                    boxShadow: '0 0 10px var(--color-cyan)'
                  }} 
                />
              </div>
            </div>
          </div>

          {/* 中部：スキャンモニター */}
          <div className="monster-box" style={{ marginBottom: '24px' }}>
            <div className="grid-bg" />
            
            {/* ポップアップ表示 */}
            {damageNumber && damageNumber.target === 'monster' && (
              <span className="dmg-number" style={{ color: 'var(--color-emerald)', textShadow: '0 0 15px rgba(16, 185, 129, 0.8)', left: '50%', top: '35%', transform: 'translateX(-50%)' }}>
                {damageNumber.val}
              </span>
            )}
            {damageNumber && damageNumber.target === 'player' && (
              <span className="dmg-number" style={{ color: '#f59e0b', textShadow: '0 0 15px rgba(245, 158, 11, 0.8)', left: '50%', top: '35%', transform: 'translateX(-50%)' }}>
                {damageNumber.val}
              </span>
            )}

            {/* スキャンレーザーエフェクト */}
            {atkEffect && (
              <div className="atk-slash">
                <div className="slash-line" />
              </div>
            )}

            {/* モンスターシンボル */}
            <div 
              className={`monster-sprite ${monsterHp > 0 ? 'float-ani' : ''}`}
              style={{
                fontSize: wave === 3 ? '84px' : '72px',
                filter: damageNumber && damageNumber.target === 'monster' ? 'brightness(1.5) drop-shadow(0 0 20px var(--color-emerald))' : `drop-shadow(0 0 24px ${currentMonster.color})`,
                transition: 'transform 0.1s ease, opacity 0.5s ease',
                opacity: monsterHp <= 0 ? 0.3 : 1,
                transform: damageNumber && damageNumber.target === 'monster' ? 'scale(1.05)' : 'scale(1)'
              }}
            >
              {currentMonster.emoji}
            </div>

            {/* 連続解読 */}
            {combo >= 2 && (
              <div style={{ position: 'absolute', left: '16px', top: '16px', background: 'rgba(16, 185, 129, 0.2)', border: '1px solid var(--color-emerald)', color: 'var(--color-emerald)', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', zIndex: 10 }}>
                <Zap size={12} fill="var(--color-emerald)" style={{ color: 'var(--color-emerald)' }} />
                {combo} DECRYPT STREAK
              </div>
            )}
          </div>

          {/* 吹き出し */}
          <div 
            style={{ 
              background: 'var(--bg-inner-box)', 
              borderRadius: '16px', 
              padding: '18px 24px', 
              marginBottom: '24px',
              border: `1px solid ${currentMonster.color}`,
              boxShadow: `0 0 15px ${currentMonster.glowColor}`,
              position: 'relative',
              textAlign: 'left'
            }}
          >
            <div style={{ position: 'absolute', top: '-10px', left: '30px', width: 0, height: 0, borderStyle: 'solid', borderWidth: '0 10px 10px 10px', borderColor: `transparent transparent ${currentMonster.color} transparent` }} />
            <span style={{ fontSize: '10px', color: currentMonster.color, fontWeight: 'bold', display: 'block', marginBottom: '6px', letterSpacing: '0.5px' }}>
              スキャン対象データ（属性: {currentQuestion.biasType === 'showa' ? '昭和バイアス' : '令和バイアス'}）：
            </span>
            <p style={{ fontSize: '14.5px', lineHeight: '1.6', color: 'var(--text-primary)', margin: 0, fontWeight: '500' }}>
              {currentQuestion.scenario}
            </p>
          </div>

          {/* 下部：デバッグコマンド */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '12.5px', color: 'var(--text-muted)', fontWeight: 'bold' }}>
                {currentQuestion.question}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {currentQuestion.choices.map((choice, idx) => {
                const isSelected = selectedChoiceIdx === idx;
                const showCorrect = isAnswered && choice.isCorrect;
                const showWrong = isAnswered && isSelected && !choice.isCorrect;

                let btnStyle = {
                  background: 'var(--bg-draggable-item)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-primary)'
                };

                if (isSelected && !isAnswered) {
                  btnStyle = {
                    background: 'rgba(244, 63, 94, 0.05)',
                    borderColor: 'var(--color-rose)',
                    color: 'var(--color-rose)'
                  };
                } else if (showCorrect) {
                  btnStyle = {
                    background: 'rgba(16, 185, 129, 0.1)',
                    borderColor: 'var(--color-emerald)',
                    color: 'var(--color-emerald)'
                  };
                } else if (showWrong) {
                  btnStyle = {
                    background: 'rgba(239, 68, 68, 0.1)',
                    borderColor: '#ef4444',
                    color: '#ef4444'
                  };
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleAnswer(idx)}
                    disabled={isAnswered}
                    className="btn"
                    style={{
                      ...btnStyle,
                      justifyContent: 'flex-start',
                      textAlign: 'left',
                      padding: '14px 18px',
                      borderRadius: '10px',
                      borderWidth: '1px',
                      borderStyle: 'solid',
                      transition: 'all 0.2s',
                      fontSize: '13.5px',
                      lineHeight: '1.4',
                      cursor: isAnswered ? 'default' : 'pointer',
                      opacity: isAnswered && !isSelected && !choice.isCorrect ? 0.4 : 1
                    }}
                  >
                    <span style={{ marginRight: '8px', fontWeight: 'bold', opacity: 0.6 }}>
                      {String.fromCharCode(65 + idx)}.
                    </span>
                    {choice.text}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 解説表示エリア */}
          {isAnswered && (
            <div 
              style={{ 
                padding: '16px 20px', 
                borderRadius: '12px', 
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-color)',
                marginBottom: '20px',
                textAlign: 'left',
                animation: 'fadeIn 0.3s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <span style={{ fontSize: '13px', fontWeight: 'bold', color: selectedChoiceIdx !== null && currentQuestion.choices[selectedChoiceIdx].isCorrect ? 'var(--color-emerald)' : '#f59e0b' }}>
                  {selectedChoiceIdx !== null && currentQuestion.choices[selectedChoiceIdx].isCorrect 
                    ? '🎯 スキャン成功（バイアス分離完了）' 
                    : '⚠️ デコード警告（バイアス検出）'
                  }
                </span>
                <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                  （該当誤謬: {currentQuestion.fallacyType}）
                </span>
              </div>
              <p style={{ fontSize: '13px', lineHeight: '1.5', color: 'var(--text-secondary)', margin: 0 }}>
                {currentQuestion.explanation}
              </p>
            </div>
          )}

          {/* 次へ進むアクション */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            {isAnswered && (
              <button onClick={handleNext} className="btn btn-primary" style={{ background: 'linear-gradient(135deg, var(--color-rose) 0%, #e11d48 100%)', boxShadow: '0 4px 15px var(--color-rose-glow)' }}>
                {currentQuestionIdx < 5 ? '次のノードへ' : '診断ログを出力'}
                <ChevronRight size={16} style={{ marginLeft: '4px' }} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* 3. 診断完了画面 */}
      {gameStatus === 'clear' && (
        <div className="glass-panel fade-in" style={{ padding: '40px 32px', textAlign: 'center', borderLeft: '4px solid var(--color-emerald)' }}>
          <Award size={64} style={{ color: 'var(--color-emerald)', marginBottom: '20px', margin: '0 auto' }} />
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', margin: '16px 0 12px 0' }}>
            SYSTEM DIAGNOSTICS COMPLETED
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14.5px', marginBottom: '24px' }}>
            全セグメントのスキャン及びバイアス検出処理が完了しました。診断データは以下の通りです。
          </p>

          {/* 診断タイトルと説明 */}
          <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px', marginBottom: '28px', textAlign: 'left' }}>
            <span style={{ fontSize: '11px', color: 'var(--color-emerald)', fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase' }}>脳内バイアス診断結果</span>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', margin: '6px 0 10px 0', color: 'var(--text-primary)' }}>{diagnosis.title}</h3>
            <p style={{ fontSize: '13px', lineHeight: '1.6', color: 'var(--text-secondary)', margin: 0 }}>{diagnosis.desc}</p>
          </div>

          {/* 診断詳細スタッツ */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '32px' }}>
            {/* 昭和脳バイアス検出率 */}
            <div style={{ background: 'rgba(255, 255, 255, 0.01)', border: '1px solid var(--border-color)', padding: '16px', borderRadius: '10px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>昭和脳 バイアス検出率</div>
              <div style={{ fontSize: '24px', fontFamily: 'var(--font-display)', fontWeight: 'bold', color: 'var(--color-amber)' }}>{showaDebRate}%</div>
              <div className="hp-bar-outer" style={{ marginTop: '8px', height: '6px' }}>
                <div className="hp-bar-inner" style={{ width: `${showaDebRate}%`, background: 'var(--color-amber)' }} />
              </div>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>（精神論・伝統バイアス）</span>
            </div>

            {/* 令和脳バイアス検出率 */}
            <div style={{ background: 'rgba(255, 255, 255, 0.01)', border: '1px solid var(--border-color)', padding: '16px', borderRadius: '10px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>令和脳 バイアス検出率</div>
              <div style={{ fontSize: '24px', fontFamily: 'var(--font-display)', fontWeight: 'bold', color: 'var(--color-rose)' }}>{reiwaDebRate}%</div>
              <div className="hp-bar-outer" style={{ marginTop: '8px', height: '6px' }}>
                <div className="hp-bar-inner" style={{ width: `${reiwaDebRate}%`, background: 'var(--color-rose)' }} />
              </div>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>（タイパ・過剰防衛バイアス）</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '32px', justifyContent: 'center', marginBottom: '32px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>平均応答レイテンシ</div>
              <div style={{ fontSize: '22px', fontFamily: 'var(--font-display)', fontWeight: 'bold', color: 'var(--color-cyan)', marginTop: '4px' }}>
                {avgScanTime} 秒 / セグメント
              </div>
            </div>
            <div style={{ borderLeft: '1px solid var(--border-color)' }}></div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>パッチ適用成功数</div>
              <div style={{ fontSize: '22px', fontFamily: 'var(--font-display)', fontWeight: 'bold', color: 'var(--color-emerald)', marginTop: '4px' }}>
                {totalCorrectAnswers} / {questions.length} ノード
              </div>
            </div>
          </div>

          <RakutenWidget />

          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '24px' }}>
            <button onClick={handleRetry} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <RotateCcw size={16} />
              もう一度スキャン
            </button>
            <button
              onClick={() => {
                if (playSound) playSound('click');
                const finalPercent = Math.round((totalCorrectAnswers / questions.length) * 100);
                let rank = "【一般脳 🧠】昭和・令和バイアスの影あり";
                if (finalPercent === 100) rank = "【詭弁デバッガー 🏆】バイアスゼロ・論理の守護者";
                else if (finalPercent >= 80) rank = "【冷静なアナリスト 🎯】バイアス検知率優秀";
                else if (finalPercent >= 60) rank = "【論理リハビリ中 ⚠️】";

                const text = `🎯 思考の筋トレ「LogicaFit」で診断完了！\n種目：詭弁ハンター（上級）\nスコア：${finalPercent}% (${totalCorrectAnswers} / ${questions.length} 問正解)\n判定：${diagnosis.title} (${rank})\n\nあなたは巧妙な詭弁や認知の歪みを見抜けますか？\n#LogicaFit #ロジカフィット #詭弁ハンター`;
                const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent('https://www.logicafit.site/')}`;
                window.open(shareUrl, '_blank', 'noopener,noreferrer');
              }}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              𝕏 でシェア
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
