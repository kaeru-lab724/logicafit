import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, ArrowRight, RotateCcw, Volume2, VolumeX, HelpCircle, ShieldAlert } from 'lucide-react';
import RakutenWidget from '../common/RakutenWidget';
import RecoveryGearSection from '../common/RecoveryGearSection';

const shuffleArray = (array) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

// ゲーム理論のシナリオデータ
const strategicDaily = [
  {
    id: 'gt_d1',
    title: '家事の分担ジレンマ (Chore Prisoner\'s Dilemma)',
    description: '同居するパートナーと家事（掃除・洗濯）を分担したい。お互いに協力して家事をすれば、家は綺麗になり公平感もある（協力, 協力：利得 +3, +3）が、自分だけが協力して相手がサボると「不公平感」で疲弊する（協力, サボり：利得 0, +4）。双方がサボると家はゴミ屋敷になり最悪の環境になる（サボり, サボり：利得 +1, +1）。',
    dilemma: '「自分の負担軽減（サボり）」 vs 「快適な住環境（協力）」',
    matrix: {
      headers: ['パートナー：協力する', 'パートナー：サボる'],
      rows: [
        { label: 'あなた：協力する', cells: [{ you: 3, opp: 3, text: '快適＆公平' }, { you: 0, opp: 4, text: 'あなた疲弊' }] },
        { label: 'あなた：サボる', cells: [{ you: 4, opp: 0, text: 'あなた楽' }, { you: 1, opp: 1, text: 'ゴミ屋敷化' }] }
      ]
    },
    step1: {
      question: 'この利得表において、相手がどう動いても自分が選ぶべき最善の手（支配的戦略）に基づき、両者が行き着く「ナッシュ均衡点」はどこか？',
      choices: [
        { text: 'お互いに「サボる」（利得 あなた: +1 / パートナー: +1）', isCorrect: true, feedback: '正解！相手が協力するなら自分はサボる方が得（4＞3）。相手がサボるなら自分もサボる方が得（1＞0）。双方が自分の利益を優先した結果、(サボる, サボる)という不本意な均衡（囚人のジレンマ）に陥ります。' },
        { text: 'お互いに「協力する」（利得 あなた: +3 / パートナー: +3）', isCorrect: false, feedback: '不正解。お互いに協力した方が利得は高い（3＞1）ですが、相手が協力すると分かっている時に自分がサボるとさらに利得が高くなる（4＞3）ため、これはナッシュ均衡（裏切る動機がない状態）ではありません。' },
        { text: '自分は「サボる」、相手は「協力する」（利得 あなた: +4 / パートナー: 0）', isCorrect: false, feedback: '不正解。この状態のとき、相手（パートナー）は協力（0）からサボる（1）へ選択を変えることで利得を改善できるため、ナッシュ均衡（互いに選択を変えない安定点）ではありません。' }
      ]
    },
    step2: {
      question: 'この不本意な「お互いサボる」の悪循環（1, 1）を解消し、お互い協力するウィンウィン（3, 3）を安定して継続させるための「戦略パッチ」はどれか？',
      choices: [
        { text: '「曜日ごとの明確な家事担当表」を作成し、サボった場合は「お小遣い減額/ペナルティ」を課す相互のルール・監視契約を導入する', isCorrect: true, feedback: 'コンパイル成功！サボった場合にペナルティ（利得の減少）をシステム的に組み込むことで、「サボる」という支配的戦略を「協力する」に変容させ、ジレンマを解決します。' },
        { text: '自分がまず我慢して毎回率先して家事をやり、相手が自主的に気づいて協力してくれるのを待つ', isCorrect: false, feedback: 'コンパイル失敗（自己犠牲バグ）。相手にとって「サボる」状態が最も都合が良い（+4）ため、相手の良心に期待するだけではフリーライド（タダ乗り）が継続してしまいます。' },
        { text: '家事を一切やめて、外食や家事代行サービスにすべて切り替える', isCorrect: false, feedback: 'コンパイル失敗（回避バグ）。金銭的なコストが跳ね上がり、家計の別のジレンマを引き起こすため、本質的な課題の解決になっていません。' }
      ]
    }
  },
  {
    id: 'gt_d2',
    title: 'メッセージの返信タイミング (Reply Coordination Game)',
    description: '大切な友達と旅行の計画を立てるため連絡を取っている。お互いに「即返信する（クイック）」なら素早く計画が決まる（即, 即：利得 +4, +4）。しかし、片方だけが即返信しもう一方が「遅く返信する（スロー）」と、待つ側にストレスが溜まる（即, 遅：利得 -1, +2）。両者とも遅いと計画が決まらない（遅, 遅：利得 0, 0）。',
    dilemma: '「返信を待つストレスの回避」 vs 「即返信する手間の削減」',
    matrix: {
      headers: ['友達：即返信する', '友達：遅く返信する'],
      rows: [
        { label: 'あなた：即返信する', cells: [{ you: 4, opp: 4, text: '計画決定' }, { you: -1, opp: 2, text: 'あなた待つ' }] },
        { label: 'あなた：遅く返信する', cells: [{ you: 2, opp: -1, text: '相手待つ' }, { you: 0, opp: 0, text: '予定流れる' }] }
      ]
    },
    step1: {
      question: 'この利得表における「ナッシュ均衡点」（お互いが相手の出方に対して自分の選択を変える動機がない安定点）はどこか？',
      choices: [
        { text: '「両者が即返信する（4, 4）」と「両者が遅く返信する（0, 0）」の2点', isCorrect: true, feedback: '正解！相手が即返信するなら自分も即返信すべき（4＞2）であり、相手が遅く返信するなら自分も遅くして待つストレスを避ける（0＞-1）のが最適となるため、(即, 即)と(遅, 遅)の2つがナッシュ均衡になります。' },
        { text: '「両者が即返信する（4, 4）」の1点のみ', isCorrect: false, feedback: '不正解。(即, 即)は均衡点の一つですが、相手が遅く返信する場合に自分だけ即返信すると利得が-1に下がるため、自分も遅くする(0, 0)へ移動する動機が生じます。したがって(遅, 遅)も均衡点です。' },
        { text: '「自分は遅く、相手は即返信する（2, -1）」の1点のみ', isCorrect: false, feedback: '不正解。このとき相手は「遅く返信する」へ変更することで利得を-1から0へ向上できるため、この点は安定（均衡）しません。' }
      ]
    },
    step2: {
      question: 'お互いが「相手も遅いだろう」と様子見し、最悪の(遅, 遅：0, 0)の不活発な均衡に陥るのを防ぎ、(即, 即：4, 4)の快適なやり取りに移行させる「戦略パッチ」はどれか？',
      choices: [
        { text: '「急ぎの用事はスタンプ1つで了解とする」「確認した旨だけをまず送る」など、即時リアクションの心理的・時間的コストを下げる共通ルールを合意する', isCorrect: true, feedback: 'コンパイル成功！即返信のコスト（手間）を極小化することで、(即, 即)の均衡へ移行するハードルを下げ、活発なコミュニケーション回路を確立します。' },
        { text: '相手の返信が遅いことを強く非難し、ペナルティとして次回の旅行の役割分担を増やすと脅す', isCorrect: false, feedback: 'コンパイル失敗（敵対バグ）。相手にメッセージ返信そのものを嫌がらせ（コスト高）と感じさせ、メッセージチャネル自体を放棄するリスクを高めます。' },
        { text: '相手が遅く返信してきても、自分だけは常に即座に熱量の高い長文で返信し続ける', isCorrect: false, feedback: 'コンパイル失敗（消耗バグ）。一時的には持ちこたえますが、自分側の利得が低い（-1）状態が続くため、いずれモチベーションが限界に達して返信が途絶えます。' }
      ]
    }
  },
  {
    id: 'gt_d3',
    title: 'デートの行き先対立 (Battle of the Sexes)',
    description: 'パートナーと週末に出かけたい。自分は「カフェ（お気に入り）」に行きたい (+3, +1) が、相手は「バー」に行きたい (+1, +3)。別々に行くのはお互いにつまらない (0, 0) が、相手の希望に合わせてでも「一緒に行く」方がマシだと考えている (+2, +2)。',
    dilemma: '「自分の好みの優先」 vs 「一緒に行くことによる楽しさ」',
    matrix: {
      headers: ['パートナー：カフェ', 'パートナー：バー'],
      rows: [
        { label: 'あなた：カフェ', cells: [{ you: 3, opp: 1, text: 'カフェ同伴' }, { you: 0, opp: 0, text: 'すれ違い' }] },
        { label: 'あなた：バー', cells: [{ you: 0, opp: 0, text: 'すれ違い' }, { you: 1, opp: 3, text: 'バー同伴' }] }
      ]
    },
    step1: {
      question: 'この利得表における「ナッシュ均衡点」はどこか？',
      choices: [
        { text: '「二人ともカフェに行く（3, 1）」と「二人ともバーに行く（1, 3）」の2点', isCorrect: true, feedback: '正解！別々に行く（0, 0）よりは、相手の好みに合わせてでも一緒に行く方がマシ（相手がカフェなら自分もカフェ（3＞0）、相手がバーなら自分もバー（1＞0））なので、一緒に行く2点が均衡点です。' },
        { text: '「自分がカフェに行き、相手がバーに行く（0, 0）」の1点', isCorrect: false, feedback: '不正解。お互いが別々の場所に行く状態（0, 0）のとき、両者とも相手の場所に変更するだけで利得を向上できるため、安定点ではありません。' },
        { text: 'このゲームにはナッシュ均衡は存在しない', isCorrect: false, feedback: '不正解。両者が異なる好みを持ちながらも、協力（同伴）すること自体に価値を見出しているゲームでは、複数のナッシュ均衡が存在します。' }
      ]
    },
    step2: {
      question: 'お互いの主張が噛み合わず、最悪のすれ違い（0, 0）になるリスクを排除し、両者が納得して一緒に出かける（同伴）ための最もスマートな「戦略パッチ」はどれか？',
      choices: [
        { text: '「今週はカフェ、来週はバー」と交代で選ぶルールを作る、または「お互いがまだ行ったことのない新しいレストラン（カフェとバーの要素を持つ店）」を共同で探す', isCorrect: true, feedback: 'コンパイル成功！交代制による「繰り返しゲーム」化、あるいは第3の選択肢による利得表の再設計（リデザイン）により、不満の蓄積を防ぎながらすれ違いを回避します。' },
        { text: '「自分の方が日頃から苦労している」と主張し、相手がカフェに同行するよう粘り強く説得する', isCorrect: false, feedback: 'コンパイル失敗（パワーゲームバグ）。相手側の利得を無理やり下げる行為であり、一時的に従わせることはできても、中長期的な関係値（利得）を破壊します。' },
        { text: 'お互いに譲り合って妥協し、結局週末は出かけずに家で一人ずつ過ごすことにする', isCorrect: false, feedback: 'コンパイル失敗（妥協バグ）。結果的に利得（0, 0）のすれ違い状態を自ら選択しており、機会損失が生じています。' }
      ]
    }
  }
];

const strategicBusiness = [
  {
    id: 'gt_b1',
    title: '競合との価格競争 (Price War Dilemma)',
    description: '市場シェアを争う競合他社と自社。両社が「高価格を維持」すれば、高い利益率を確保できる（維持, 維持：利得 +5, +5）。しかし、自社だけが「値下げ」をすると、競合からシェアを奪い利益が跳ね上がる（値下げ, 維持：利得 +10, -2）。両社とも「値下げ」をすると、低い利益率で泥沼の消耗戦になる（値下げ, 値下げ：利得 +2, +2）。',
    dilemma: '「単独の値下げによるシェア独占」 vs 「共倒れの回避」',
    matrix: {
      headers: ['競合：高価格維持', '競合：値下げ'],
      rows: [
        { label: '自社：高価格維持', cells: [{ you: 5, opp: 5, text: '高利益共存' }, { you: -2, opp: 10, text: 'シェア奪還' }] },
        { label: '自社：値下げ', cells: [{ you: 10, opp: -2, text: '自社独占' }, { you: 2, opp: 2, text: '泥沼消耗戦' }] }
      ]
    },
    step1: {
      question: 'この市場において、両社とも「値下げ」を選ぶことが自身の支配的戦略となるとき、行き着く「ナッシュ均衡点」はどこか？',
      choices: [
        { text: '両社とも「値下げ」を選択する（利得 自社: +2 / 競合: +2）', isCorrect: true, feedback: '正解！相手が維持しようが値下げしようが、自社にとっては「値下げ」が最適（10＞5、2＞-2）となり、相手も同様です。結果、最も望ましい(維持, 維持: 5,5)ではなく、消耗戦(値下げ, 値下げ: 2,2)に陥ります。' },
        { text: '両社とも「高価格維持」を選択する（利得 自社: +5 / 競合: +5）', isCorrect: false, feedback: '不正解。双方が維持すれば利益は高い（5＞2）ですが、相手が維持しているとわかると値下げしたくなる（10＞5）ため、これは裏切りの動機が存在し、ナッシュ均衡ではありません。' },
        { text: '自社は「値下げ」、競合は「価格維持」を選択する（利得 自社: +10 / 競合: -2）', isCorrect: false, feedback: '不正解。競合にとって利得が-2と最悪であるため、高価格維持から「値下げ」へと戦略を変更して利得を+2に高める動機があります。よって均衡しません。' }
      ]
    },
    step2: {
      question: 'この不毛な「値下げ競争の泥沼（2, 2）」から脱却し、高い利益率（5, 5）を維持するための合法的な「戦略パッチ」はどれか？',
      choices: [
        { text: '他社が単純な値下げで追随できない「独自のブランド価値」「機能差」「手厚いサポート」を強化し、非価格競争（差別化）の別土俵へシフトする', isCorrect: true, feedback: 'コンパイル成功！マトリクス（利得表）そのものの評価軸を「価格のみ」から「価値」へと再設計することで、競合との囚人のジレンマゲーム自体から脱出して高利益を確保します。' },
        { text: '競合の経営幹部と裏でコンタクトを取り、お互いに価格を維持するよう紳士協定を結ぶ', isCorrect: false, feedback: 'コンパイル失敗（カルテル・違法バグ）。これは独占禁止法（不当な取引制限）に違反し、巨額の課徴金や刑事罰、ブランドイメージ墜落という致命的なシステムダウンを招きます。' },
        { text: '競合が体力を失って倒産するまで、赤字を覚悟して他社よりさらに極端な値下げを強行する', isCorrect: false, feedback: 'コンパイル失敗（消耗バグ）。自社も致命的なキャッシュアウト（利得マイナス）に陥り、共倒れのリスクを最大化するだけの悪手です。' }
      ]
    }
  },
  {
    id: 'gt_b2',
    title: '共同プロジェクトへの投資 (Free-Rider Dilemma)',
    description: '社内の2つの部署で進める共同開発プロジェクト。両部署が「リソースを全力投入する（投資）」と、プロジェクトは成功し高いリターンを分け合える（投資, 投資：利得 +6, +6）。しかし、片方だけが投資しもう一方が「サボる（タダ乗り）」と、サボった部署は負担ゼロで成果だけを得る（投資, サボり：利得 -1, +8）。両者サボると失敗し、損失が生じる（サボり, サボり：利得 0, 0）。',
    dilemma: '「自部署のリソース温存」 vs 「プロジェクト成功による利益」',
    matrix: {
      headers: ['他部署：全力投資', '他部署：サボる（タダ乗り）'],
      rows: [
        { label: '自部署：全力投資', cells: [{ you: 6, opp: 6, text: 'プロジェクト成功' }, { you: -1, opp: 8, text: '自部署の搾取' }] },
        { label: '自部署：サボる（タダ乗り）', cells: [{ you: 8, opp: -1, text: '他部署の搾取' }, { you: 0, opp: 0, text: 'プロジェクト崩壊' }] }
      ]
    },
    step1: {
      question: '各部署が自部署の負担を減らそうとタダ乗り（フリーライド）を画策するとき、導き出される「ナッシュ均衡点」はどこか？',
      choices: [
        { text: '両部署とも「サボる（フリーライド）」（利得 自部署: 0 / 他部署: 0）', isCorrect: true, feedback: '正解！相手が投資しようがサボろうが、自部署にとっては「サボる」方が利得が高くなる（8＞6、0＞-1）ため、双方がサボりを選択した(サボる, サボる: 0,0)がナッシュ均衡（プロジェクトの機能不全）になります。' },
        { text: '両部署とも「全力投資する」（利得 自部署: +6 / 他部署: +6）', isCorrect: false, feedback: '不正解。双方投資が望ましいですが、他部署が全力でやってくれるなら、自部署はサボることでさらに得（+8）を狙えるため、お互いに「サボる」インセンティブが働き、均衡しません。' },
        { text: '自部署が「サボり」、他部署が「投資する」（利得 自部署: +8 / 他部署: -1）', isCorrect: false, feedback: '不正解。搾取されている他部署は、投資からサボるに変更することで利得を-1から0へと改善できるため、この点は安定しません。' }
      ]
    },
    step2: {
      question: '相手のサボりを警戒してお互いにリソースを隠し、プロジェクトが破綻（0, 0）するのを防いで協力体制（6, 6）を確立するための「戦略パッチ」はどれか？',
      choices: [
        { text: 'タスク管理ツールで進捗を完全可視化し、Gitコミットや貢献度を定量的に測定して、成果報酬や社内評価に直結させる『評価インセンティブ』を設計する', isCorrect: true, feedback: 'コンパイル成功！サボった部署には評価が下がってリターンがゼロになるルールを敷くことで、「サボる」利得を低下させ、協力を唯一の合理的戦略に変容させます。' },
        { text: 'プロジェクトのキックオフ会議で「会社の未来のために全員がプロ意識を持って協力しよう」と情熱的に呼びかける', isCorrect: false, feedback: 'コンパイル失敗（精神論バグ）。ゲームの利得構造そのものが変わっていないため、個人の善意や責任感に依存するだけでは、時間の経過とともに結局タダ乗りが発生します。' },
        { text: '相手がサボっている疑いがあれば、即座にプロジェクト責任者に報告して公式な監査（ペナルティ）を請求する体制にする', isCorrect: false, feedback: 'コンパイル失敗（相互不信バグ）。監視と告発のコスト（オーバーヘッド）が跳ね上がり、チーム全体のコミュニケーションが硬直してプロジェクトが遅延します。' }
      ]
    }
  },
  {
    id: 'gt_b3',
    title: '新規参入と価格防衛 (Market Entry Deterrence)',
    description: '自社が独占する市場に、競合スタートアップが「参入」を検討している。スタートアップが参入し、自社が「戦闘（価格戦）」すると、両社とも大赤字になる（参入, 戦闘：スタートアップ -2, 自社 -5）。参入に対し自社が「協調（市場分割）」すると、適度な利益を分け合う（参入, 協調：利得 +3, +3）。参入しなければ、自社は独占利益を得る（未参入：スタートアップ 0, 自社 +8）。',
    dilemma: '「独占利益の防衛」 vs 「価格戦による赤字の回避」',
    matrix: {
      headers: ['自社：協調する（市場を分ける）', '自社：戦闘する（価格戦を仕掛ける）'],
      rows: [
        { label: 'スタートアップ：参入する', cells: [{ you: 3, opp: 3, text: '市場分割共存' }, { you: -2, opp: -5, text: '泥沼価格戦' }] },
        { label: 'スタートアップ：参入しない', cells: [{ you: 0, opp: 8, text: '自社独占' }, { you: 0, opp: 8, text: '自社独占' }] }
      ]
    },
    step1: {
      question: 'スタートアップが参入してきた場合、自社の合理的な判断（利得比較）を考慮したとき、この動的ゲームにおける「ナッシュ均衡点」はどこか？',
      choices: [
        { text: 'スタートアップが「参入」し、自社は「協調」を選択する（利得 3, 3）', isCorrect: true, feedback: '正解！もし参入された場合、自社は戦闘（-5）より協調（+3）を選ぶ方が合理的です。スタートアップは自社が協調することを見越して、「参入」を選択します（3＞0）。よって(参入, 協調)が均衡点になります。' },
        { text: 'スタートアップが「参入を見送り」、自社は「独占」を維持する（利得 0, 8）', isCorrect: false, feedback: '不正解。自社にとっては最良（+8）ですが、スタートアップにとって「参入すれば自社が協調して+3を得られる」と分かっているため、参入を見送る（0）という選択は安定せず、ナッシュ均衡になりません。' },
        { text: 'スタートアップが「参入」し、自社は「戦闘」する（利得 -2, -5）', isCorrect: false, feedback: '不正解。自社は戦闘（-5）から協調（+3）に変えることで大きく利得を改善できるため、このポイントは安定しません。' }
      ]
    },
    step2: {
      question: '自社にとって最も利益の高い「独占状態（0, 8）」を守るために、スタートアップに対し「参入したら絶対に戦闘を仕掛け、赤字にしてでも潰す」と信じ込ませて参入を阻止する（参入阻止）ための「戦略パッチ」はどれか？',
      choices: [
        { text: '「参入があった場合は自動的に価格対抗戦が開始される」予備生産設備や大規模マーケティング予算を事前に確定し、社外にコミットメント（公表）しておく', isCorrect: true, feedback: 'コンパイル成功！事前に「戦闘せざるを得ない（または戦闘時の自社のコストを下げる）設備投資」を行うことで、脅しに信頼性（Credibility）を与え、スタートアップに参入を断念（0）させます。' },
        { text: '自社のホームページで「我が社は新規参入に対して一切容赦せず、徹底的に戦います」という警告文を掲載する', isCorrect: false, feedback: 'コンパイル失敗（から脅しバグ）。実際の設備や予算の裏付けがない言葉だけの脅しは、参入されたら協調する方が得（+3＞-5）という合理性を見透かされ、無視されて参入されます。' },
        { text: 'スタートアップが実際に参入してきてから、経営陣同士で話し合いを行い、市場のシェアを半分買い取る打診をする', isCorrect: false, feedback: 'コンパイル失敗（事後対応バグ）。参入を防ぐ（8を維持する）ためのパッチになっておらず、参入を許して市場（利益）を分け合う（+3）結果になってしまいます。' }
      ]
    }
  }
];

export default function GameTheory({ onFinish, playSound, muted, toggleMute, mode, onLogBug, reviewQuestionId, onFinishReview, onBack }) {
  const [showTutorial, setShowTutorial] = useState(true);
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [step1Answer, setStep1Answer] = useState(null);
  const [step1Correct, setStep1Correct] = useState(false);
  const [step1Feedback, setStep1Feedback] = useState('');
  const [step1Tries, setStep1Tries] = useState(0);

  const [step2Answer, setStep2Answer] = useState(null);
  const [step2Correct, setStep2Correct] = useState(false);
  const [step2Feedback, setStep2Feedback] = useState('');
  const [step2Tries, setStep2Tries] = useState(0);

  const [score, setScore] = useState(0); // Max 30 points (10 points per scenario: Step1=5, Step2=5)
  const [completed, setCompleted] = useState(false);

  const initializeQuestions = () => {
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
      finalized = shuffleArray(rawData).slice(0, 3);
    }

    setQuestions(finalized);
    setCurrentIdx(0);
    resetStepStates();
    setScore(0);
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
    initializeQuestions();
  }, [mode]);

  if (questions.length === 0) {
    return null;
  }

  const currentTheme = questions[currentIdx];

  const handleStep1Answer = (choiceIdx) => {
    if (step1Correct) return;
    playSound('click');
    setStep1Answer(choiceIdx);
    const choice = currentTheme.step1.choices[choiceIdx];
    const isCorrect = choice.isCorrect;
    const tries = step1Tries + 1;
    setStep1Tries(tries);
    setStep1Feedback(choice.feedback);

    if (isCorrect) {
      playSound('correct');
      setStep1Correct(true);
    } else {
      playSound('incorrect');
      if (tries >= 2 && onLogBug && !reviewQuestionId) {
        onLogBug('gameTheory', currentTheme.id, `Step 1 均衡特定エラー: "${choice.text}"`, currentTheme.description);
      }
    }
  };

  const handleStep2Answer = (choiceIdx) => {
    if (step2Correct) return;
    playSound('click');
    setStep2Answer(choiceIdx);
    const choice = currentTheme.step2.choices[choiceIdx];
    const isCorrect = choice.isCorrect;
    const tries = step2Tries + 1;
    setStep2Tries(tries);
    setStep2Feedback(choice.feedback);

    if (isCorrect) {
      playSound('correct');
      setStep2Correct(true);

      // スコア計算: Step 1 (最大5点), Step 2 (最大5点)
      // 1回目の正解で5点、2回目で2.5点、3回目以降は0点
      const sc1 = step1Tries === 1 ? 5 : step1Tries === 2 ? 2.5 : 0;
      const sc2 = tries === 1 ? 5 : tries === 2 ? 2.5 : 0;
      setScore(prev => prev + sc1 + sc2);
    } else {
      playSound('incorrect');
      if (tries >= 2 && onLogBug && !reviewQuestionId) {
        onLogBug('gameTheory', currentTheme.id, `Step 2 戦略パッチ適用エラー: "${choice.text}"`, currentTheme.description);
      }
    }
  };

  const handleNext = () => {
    playSound('click');
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(prev => prev + 1);
      resetStepStates();
    } else {
      setCompleted(true);
      if (reviewQuestionId && onFinishReview) {
        onFinishReview('gameTheory', reviewQuestionId);
      } else {
        const finalPercent = Math.min(100, Math.max(0, Math.round((score / (questions.length * 10)) * 100)));
        onFinish('gameTheory', finalPercent, false);
        playSound('success');
      }
    }
  };

  const handleReset = () => {
    playSound('click');
    initializeQuestions();
    setShowTutorial(true);
  };

  const startTraining = () => {
    playSound('click');
    setShowTutorial(false);
  };

  return (
    <div className="game-container fade-in">


      <div className="glass-panel" style={{ padding: '24px', position: 'relative', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <span style={{ color: '#818cf8', fontWeight: 'bold', fontSize: '14px', letterSpacing: '1px' }}>
              TRAINING MODULE 06 [2nd]
            </span>
            <h2 style={{ fontFamily: 'var(--font-display)', marginTop: '4px' }}>ゲーム理論デバッガー</h2>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
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
                シナリオ: {currentIdx + 1} / {questions.length}
              </div>
            )}
          </div>
        </div>

        {showTutorial ? (
          <div style={{ textAlign: 'left' }} className="fade-in">
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', color: '#818cf8' }}>
              📖 30秒でわかる基本のき：ゲーム理論と利得表（マトリクス）
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
              <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.15)' }}>
                <strong style={{ color: '#818cf8', fontSize: '15px' }}>📌 ゲーム理論 とは？</strong>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '6px', lineHeight: '1.5' }}>
                  自分の利益（利得）が、自分の選択だけでなく<strong style={{ color: 'var(--text-primary)' }}>「相手の選択」によっても決定される状況</strong>において、お互いがどのような行動をとるかを数学的に分析する思考フレームワークです。
                </p>
              </div>

              <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)' }}>
                <strong style={{ color: 'var(--text-primary)', fontSize: '15px' }}>📌 ナッシュ均衡（安定点）とは？</strong>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '6px', lineHeight: '1.5' }}>
                  お互いが「相手の出方に対して、自分の選択をこれ以上変えるメリットがない」と判断した、<strong style={{ color: 'var(--text-primary)' }}>戦略が一致して動かない安定した状態</strong>のことです。
                  ※お互いの利得が一番高い「ウィンウィン」のポイントが、必ずしもナッシュ均衡になるとは限らない（＝囚人のジレンマ）のが特徴です。
                </p>
              </div>

              <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.01)', borderLeft: '3px solid #6366f1' }}>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                  💡 このトレーニングでは、2×2の「利得表」を正しく読み解き、安定する均衡点を見抜いた上で（Step 1）、対立や消耗戦を脱却して全体の利益を最大化する「戦略パッチ」を適用します（Step 2）！
                </p>
              </div>
            </div>

            <button onClick={startTraining} className="btn btn-primary" style={{ width: '100%', background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', boxShadow: '0 4px 15px rgba(99, 102, 241, 0.3)' }}>
              理解した！デバッガーを起動する
            </button>
          </div>
        ) : !completed ? (
          <div>
            {/* Scenario Terminal Description */}
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
              <div style={{ color: 'var(--text-primary)', fontSize: '14px', lineHeight: '1.6', marginBottom: '10px' }}>
                <span style={{ color: '#818cf8', fontWeight: 'bold' }}>&gt; DILEMMA_SCENARIO:</span> {currentTheme.description}
              </div>
              <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '8px 12px', borderRadius: '6px', borderLeft: '3px solid #6366f1', color: '#c7d2fe' }}>
                <span style={{ fontWeight: 'bold' }}>⚡ DETECTED DILEMMA:</span> {currentTheme.dilemma}
              </div>
            </div>

            {/* Payoff Matrix Display */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 'bold', textAlign: 'left' }}>
                📊 利得マトリクス (左: あなたのポイント / 右: 相手のポイント)
              </div>
              
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid rgba(255, 255, 255, 0.1)', fontSize: '13px', minWidth: '400px' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255, 255, 255, 0.02)' }}>
                      <th style={{ border: '1px solid rgba(255, 255, 255, 0.1)', padding: '12px' }}></th>
                      {currentTheme.matrix.headers.map((h, i) => (
                        <th key={i} style={{ border: '1px solid rgba(255, 255, 255, 0.1)', padding: '12px', color: '#818cf8', fontWeight: 'bold' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {currentTheme.matrix.rows.map((row, rowIdx) => (
                      <tr key={rowIdx}>
                        <td style={{ border: '1px solid rgba(255, 255, 255, 0.1)', padding: '12px', fontWeight: 'bold', background: 'rgba(255, 255, 255, 0.01)', width: '25%', textAlign: 'left' }}>
                          {row.label}
                        </td>
                        {row.cells.map((cell, cellIdx) => {
                          const isStep1AnsweredCorrectly = step1Correct;
                          const isNashSelected = (mode === 'business' 
                            ? (rowIdx === 1 && cellIdx === 1 && currentTheme.id !== 'gt_b3') || (rowIdx === 0 && cellIdx === 0 && currentTheme.id === 'gt_b3')
                            : (rowIdx === 1 && cellIdx === 1 && currentTheme.id === 'gt_d1') || (rowIdx === 0 && cellIdx === 0 && currentTheme.id === 'gt_d2') || (rowIdx === 1 && cellIdx === 1 && currentTheme.id === 'gt_d2') || (rowIdx === 0 && cellIdx === 0 && currentTheme.id === 'gt_d3') || (rowIdx === 1 && cellIdx === 1 && currentTheme.id === 'gt_d3')
                          );
                          const highlightCell = isStep1AnsweredCorrectly && isNashSelected;

                          return (
                            <td 
                              key={cellIdx} 
                              style={{ 
                                border: '1px solid rgba(255, 255, 255, 0.1)', 
                                padding: '12px',
                                background: highlightCell ? 'rgba(99, 102, 241, 0.15)' : 'none',
                                borderLeft: highlightCell ? '2px solid #6366f1' : '1px solid rgba(255, 255, 255, 0.1)',
                                borderRight: highlightCell ? '2px solid #6366f1' : '1px solid rgba(255, 255, 255, 0.1)',
                                transition: 'all 0.3s ease'
                              }}
                            >
                              <div style={{ fontWeight: 'bold', fontSize: '15px', color: highlightCell ? '#a5b4fc' : 'var(--text-primary)' }}>
                                あなた: {cell.you >= 0 ? `+${cell.you}` : cell.you} / 相手: {cell.opp >= 0 ? `+${cell.opp}` : cell.opp}
                              </div>
                              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                {cell.text}
                              </div>
                              {highlightCell && (
                                <div style={{ fontSize: '10px', color: '#818cf8', fontWeight: 'bold', marginTop: '4px' }}>
                                  [★ ナッシュ均衡]
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* STEP 1: Nash Equilibrium */}
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
                <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                  {currentTheme.step1.question}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {currentTheme.step1.choices.map((choice, idx) => {
                  const isSelected = step1Answer === idx;
                  let btnBorder = 'rgba(255, 255, 255, 0.08)';
                  let btnBg = 'rgba(255, 255, 255, 0.02)';
                  let statusIcon = null;

                  if (isSelected) {
                    if (choice.isCorrect) {
                      btnBorder = '#10b981';
                      btnBg = 'rgba(16, 185, 129, 0.08)';
                      statusIcon = <CheckCircle2 size={16} style={{ color: '#10b981', flexShrink: 0 }} />;
                    } else {
                      btnBorder = '#ef4444';
                      btnBg = 'rgba(239, 68, 68, 0.08)';
                      statusIcon = <XCircle size={16} style={{ color: '#ef4444', flexShrink: 0 }} />;
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
                        padding: '12px 16px',
                        fontSize: '13px',
                        background: btnBg,
                        border: `1px solid ${btnBorder}`,
                        borderRadius: '10px',
                        color: 'var(--text-secondary)',
                        cursor: step1Correct ? 'default' : 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', width: '100%' }}>
                        <span style={{ fontFamily: 'monospace', color: step1Correct && choice.isCorrect ? '#10b981' : 'var(--text-muted)' }}>[{idx+1}]</span>
                        <span style={{ flex: 1 }}>{choice.text}</span>
                        {statusIcon}
                      </div>
                    </button>
                  );
                })}
              </div>

              {step1Feedback && (
                <div style={{ 
                  marginTop: '12px', 
                  padding: '12px 16px', 
                  borderRadius: '8px', 
                  fontSize: '13px', 
                  lineHeight: '1.5',
                  background: step1Correct ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.05)',
                  borderLeft: `3px solid ${step1Correct ? '#10b981' : '#ef4444'}`,
                  color: 'var(--text-primary)'
                }}>
                  {step1Feedback}
                </div>
              )}
            </div>

            {/* STEP 2: Strategic Intervention Patch */}
            {step1Correct && (
              <div className="fade-in" style={{ textAlign: 'left', marginBottom: '24px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '20px' }}>
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
                  <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                    {currentTheme.step2.question}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {currentTheme.step2.choices.map((choice, idx) => {
                    const isSelected = step2Answer === idx;
                    let btnBorder = 'rgba(255, 255, 255, 0.08)';
                    let btnBg = 'rgba(255, 255, 255, 0.02)';
                    let statusIcon = null;

                    if (isSelected) {
                      if (choice.isCorrect) {
                        btnBorder = '#10b981';
                        btnBg = 'rgba(16, 185, 129, 0.08)';
                        statusIcon = <CheckCircle2 size={16} style={{ color: '#10b981', flexShrink: 0 }} />;
                      } else {
                        btnBorder = '#ef4444';
                        btnBg = 'rgba(239, 68, 68, 0.08)';
                        statusIcon = <XCircle size={16} style={{ color: '#ef4444', flexShrink: 0 }} />;
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
                          padding: '12px 16px',
                          fontSize: '13px',
                          background: btnBg,
                          border: `1px solid ${btnBorder}`,
                          borderRadius: '10px',
                          color: 'var(--text-secondary)',
                          cursor: step2Correct ? 'default' : 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', width: '100%' }}>
                          <span style={{ fontFamily: 'monospace', color: step2Correct && choice.isCorrect ? '#10b981' : 'var(--text-muted)' }}>[P{idx+1}]</span>
                          <span style={{ flex: 1 }}>{choice.text}</span>
                          {statusIcon}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {step2Feedback && (
                  <div style={{ 
                    marginTop: '12px', 
                    padding: '12px 16px', 
                    borderRadius: '8px', 
                    fontSize: '13px', 
                    lineHeight: '1.5',
                    background: step2Correct ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.05)',
                    borderLeft: `3px solid ${step2Correct ? '#10b981' : '#ef4444'}`,
                    color: 'var(--text-primary)'
                  }}>
                    {step2Correct ? '🔓 ' : '⚠️ '} {step2Feedback}
                  </div>
                )}
              </div>
            )}

            {/* Action Bar */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              {step2Correct && (
                <button 
                  onClick={handleNext} 
                  className="btn btn-primary" 
                  style={{ 
                    background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', 
                    boxShadow: '0 4px 15px rgba(99, 102, 241, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {currentIdx < questions.length - 1 ? '次のシナリオへ' : '結果を見る'}
                  <ArrowRight size={16} />
                </button>
              )}
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '32px 0' }} className="fade-in">
            <CheckCircle2 size={64} style={{ color: '#818cf8', marginBottom: '16px' }} />
            <h3 style={{ fontSize: '24px', fontFamily: 'var(--font-display)', marginBottom: '12px' }}>
              デバッグ完了！
            </h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', maxWidth: '480px', margin: '0 auto 24px auto' }}>
              対立する意思決定（ゲーム構造）を正しくモデル化し、損失を防ぐ戦略パッチをコンパイルする能力が活性化されました。
            </p>
            
            <div style={{ display: 'inline-flex', gap: '32px', marginBottom: '32px' }}>
              <div>
                <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>完了シナリオ</div>
                <div style={{ fontSize: '32px', fontFamily: 'var(--font-display)', fontWeight: 'bold', color: '#818cf8' }}>
                  {questions.length} / {questions.length}
                </div>
              </div>
              <div style={{ borderLeft: '1px solid var(--border-color)' }}></div>
              <div>
                <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>スコア</div>
                <div style={{ fontSize: '32px', fontFamily: 'var(--font-display)', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                  {Math.min(100, Math.max(0, Math.round((score / (questions.length * 10)) * 100)))}%
                </div>
              </div>
            </div>

            <RakutenWidget size="300x250" ts="1779836954537" />

            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '24px' }}>
              <button onClick={handleReset} className="btn btn-secondary">
                <RotateCcw size={16} />
                もう一度挑戦
              </button>
              <button
                onClick={() => {
                  playSound('click');
                  const finalPercent = Math.min(100, Math.max(0, Math.round((score / (questions.length * 10)) * 100)));
                  let rank = "【脳のフリーズを検知 ⚠️】要リハビリ！";
                  if (finalPercent === 100) rank = "【戦略デバッガー 🏆】";
                  else if (finalPercent >= 80) rank = "【優秀なネゴシエーター 🎯】";
                  else if (finalPercent >= 60) rank = "【一般脳 🧠】ジレンマに陥る可能性あり";

                  const modeText = mode === 'business' ? 'ビジネス編' : '日常編・入門';
                  const text = `🎯 思考の筋トレ「LogicaFit」でトレーニング完了！\n種目：ゲーム理論デバッガー (${modeText})\nスコア：${finalPercent}% \n評価：${rank}\n\nジレンマを解消し、お互いの最大利益を導き出せるか？\n#LogicaFit #ロジカフィット #ゲーム理論`;
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

      {/* Recovery Gear / Additional Widgets */}
      <div style={{ marginTop: '24px' }}>
        <RecoveryGearSection />
      </div>
    </div>
  );
}
