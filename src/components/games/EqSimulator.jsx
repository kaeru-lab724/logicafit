import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  Send, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  Heart,
  Smile,
  ShieldAlert,
  Zap,
  ChevronLeft,
  Play
} from 'lucide-react';
import RecoveryGearSection from '../common/RecoveryGearSection';

// シナリオの対話分岐ツリー定義
const scenarios = [
  {
    id: 'haruto',
    name: 'ハルト（燃え尽き寸前の後輩）',
    avatar: '👨‍💻',
    initialEmotion: '不安・焦燥',
    initialEmotionColor: '#06b6d4',
    initialDesc: 'タスクの山と目標のプレッシャーに潰され、仕事の意義を見失っている若手社員。',
    tree: {
      t1: {
        text: '「最近、どんなにタスクをこなしても成果が出ている実感がなくて…。自分が何のために毎日残業して頑張っているのか見失いそうなんです。」',
        choices: [
          {
            text: '「自分の頑張りが形にならないと、無力感に襲われるし、モチベーションを見失いそうになるのも当然だよ。」',
            type: 'empathy',
            bias: 'none',
            trustChange: 20,
            nextEmotion: '安心・共感',
            nextEmotionColor: '#10b981',
            nextStep: 't2_empathy'
          },
          {
            text: '「業務目標の設定（KPI）に問題があるんじゃない？まずは自分の進捗をスプレッドシートに書き出してタスクの優先度を可視化してみて。」',
            type: 'logic',
            bias: 'reiwa',
            trustChange: -20,
            nextEmotion: '防衛・落胆',
            nextEmotionColor: '#ef4444',
            nextStep: 't2_logic'
          },
          {
            text: '「僕も入社3年目の時は同じように悩んだよ！でもとにかくがむしゃらにやれば、後から結果がついてくるから心配しないで！」',
            type: 'self',
            bias: 'showa',
            trustChange: -10,
            nextEmotion: '孤独・疎外感',
            nextEmotionColor: '#f59e0b',
            nextStep: 't2_self'
          }
        ]
      },
      t2_empathy: {
        text: '「そうなんです…ただタスクを消化するだけのマシーンになっているようで辛かったです。でも先輩が私のこの無力感を理解してくれて、少し息ができる気がします。」',
        choices: [
          {
            text: '「よく一人でそこまで耐えたね。今は可視化や分析は後回しにして、まずは辛かった気持ちを整理することから始めよう。」',
            type: 'empathy',
            bias: 'none',
            trustChange: 25,
            nextEmotion: '信頼・心を開く',
            nextEmotionColor: '#10b981',
            nextStep: 't3_success'
          },
          {
            text: '「気持ちが落ち着いたなら、早速仕事のやり方を見直そう。明日から優先順位を毎日僕に朝会で報告してもらえるかな？」',
            type: 'logic',
            bias: 'reiwa',
            trustChange: -15,
            nextEmotion: '圧迫感・防衛',
            nextEmotionColor: '#ef4444',
            nextStep: 't3_normal'
          }
        ]
      },
      t2_logic: {
        text: '「可視化ですか…。理屈ではそうすべきなのは分かりますが、今はその作業手順を考える気力すら沸かないんです。」',
        choices: [
          {
            text: '「そうだよね。タスク整理を考えること自体が、今のハルトくんにとっては大きな負担だよね。まずは手を止めて休おう。」',
            type: 'empathy',
            bias: 'none',
            trustChange: 20,
            nextEmotion: '安堵',
            nextEmotionColor: '#06b6d4',
            nextStep: 't3_normal'
          },
          {
            text: '「でもそれを避けていたら根本的な解決にならないよ。一時的な感情でタスク整理をサボれば、来週もっと苦しくなるぞ。」',
            type: 'logic',
            bias: 'showa',
            trustChange: -25,
            nextEmotion: '拒絶・フリーズ',
            nextEmotionColor: '#ef4444',
            nextStep: 't3_fail'
          }
        ]
      },
      t2_self: {
        text: '「先輩の時代と違って、今はタスクの量もスピードも倍以上なんです…。がむしゃらにやるだけでは乗り越えられない気がして…。」',
        choices: [
          {
            text: '「そうだよね、時代も環境も変わっているのに、過去の経験を押し付けるような言い方をして悪かった。今のハルトくんの負担は本当に大きいね。」',
            type: 'empathy',
            bias: 'none',
            trustChange: 25,
            nextEmotion: '安心・心を開く',
            nextEmotionColor: '#10b981',
            nextStep: 't3_normal'
          },
          {
            text: '「時代が違っても、ビジネスの基本は同じだよ。自分のキャパシティを超える前に周りにヘルプを出すスキルを磨かないと。」',
            type: 'logic',
            bias: 'reiwa',
            trustChange: -20,
            nextEmotion: 'フリーズ',
            nextEmotionColor: '#ef4444',
            nextStep: 't3_fail'
          }
        ]
      },
      t3_success: {
        text: '「ありがとうございます。少し先が見えてきました。タスクの調整について、これからどう動けばいいでしょうか…？」',
        choices: [
          {
            text: '「焦らずゆっくりで大丈夫だよ。まずは今のタスクの中で他人に振れるものがないか、私と一緒に精査していこう。」',
            type: 'empathy',
            bias: 'none',
            trustChange: 15,
            nextEmotion: '超信頼・安堵',
            nextEmotionColor: '#10b981',
            nextStep: 'finish'
          },
          {
            text: '「よし、じゃあ来週のタスク計画のミーティングを早速30分入れようか。自分でタスクリストを更新しておいてね。」',
            type: 'logic',
            bias: 'reiwa',
            trustChange: -10,
            nextEmotion: '疲弊・義務感',
            nextEmotionColor: '#f59e0b',
            nextStep: 'finish'
          }
        ]
      },
      t3_normal: {
        text: '「分かりました。なんとかできる範囲で、少しずつやってみます…。」',
        choices: [
          {
            text: '「無理はしなくていいからね。何かあったらタスクの途中でも、いつでも声をかけて。私たちがサポートするからね。」',
            type: 'empathy',
            bias: 'none',
            trustChange: 15,
            nextEmotion: '信頼',
            nextEmotionColor: '#10b981',
            nextStep: 'finish'
          },
          {
            text: '「うん、それがいいね。来週の月曜日に進捗を一度見せるようにしてください。」',
            type: 'logic',
            bias: 'reiwa',
            trustChange: -15,
            nextEmotion: '緊張・防衛',
            nextEmotionColor: '#f59e0b',
            nextStep: 'finish'
          }
        ]
      },
      t3_fail: {
        text: '「……すみません、これ以上は頭が回りません。少し一人にさせてください。」（相手の心が完全にフリーズしました）',
        choices: []
      }
    }
  },
  {
    id: 'satsuki',
    name: 'サツキ（仕事と育児の板挟みの同僚）',
    avatar: '👩‍⚕️',
    initialEmotion: '葛藤・罪悪感',
    initialEmotionColor: '#f59e0b',
    initialDesc: '子供の発熱による急な欠勤が重なり、職場への申し訳なさと母親としてのキャパシティ限界に悩むナース。',
    tree: {
      t1: {
        text: '「子供が熱を出してしまい、今週二度目の突発的な休みをいただくことになってしまって…。他のスタッフに本当に申し訳なくて、看護師としても母親としても中途半端な自分が嫌になります…。」',
        choices: [
          {
            text: '「お休みが重なると、周りへの申し訳なさで胸が張り裂けそうになるよね。子供も心配だし、どちらも中途半端だと自分を責めてしまうのは当然だよ。」',
            type: 'empathy',
            bias: 'none',
            trustChange: 25,
            nextEmotion: '安心・落涙',
            nextEmotionColor: '#10b981',
            nextStep: 't2_empathy'
          },
          {
            text: '「病児保育サービスに事前登録しておくといいよ。そういう緊急時の預け先をいくつか確保すれば、急な欠勤を減らせて自己嫌悪も防げるはず。」',
            type: 'logic',
            bias: 'reiwa',
            trustChange: -20,
            nextEmotion: '不信・防衛',
            nextEmotionColor: '#ef4444',
            nextStep: 't2_logic'
          },
          {
            text: '「大丈夫だよ！誰も怒ってないし、子供が小さいうちは熱を出すのが仕事みたいなものだから、気にしすぎだって！」',
            type: 'self',
            bias: 'showa',
            trustChange: -10,
            nextEmotion: '孤独・あきらめ',
            nextEmotionColor: '#f59e0b',
            nextStep: 't2_self'
          }
        ]
      },
      t2_empathy: {
        text: '「本当にその通りんです…。看病しながらも、職場のグループチャットの通知音に怯えてしまって、母親としてもナースとしても失格な気がして涙が止まらなくて…。」',
        choices: [
          {
            text: '「子供の看病をしながら仕事のことも気にしなきゃいけないなんて、どれほど心身ともに張り詰めた状態だったか。自分を責めないで、今は看病に専念してね。」',
            type: 'empathy',
            bias: 'none',
            trustChange: 25,
            nextEmotion: '信頼・安堵',
            nextEmotionColor: '#10b981',
            nextStep: 't3_success'
          },
          {
            text: '「それなら、看病している間はグループチャットの通知をオフにしたらいいよ。見なければ余計な罪悪感を抱えずに済むから合理的だよ。」',
            type: 'logic',
            bias: 'reiwa',
            trustChange: -15,
            nextEmotion: '防衛・距離感',
            nextEmotionColor: '#ef4444',
            nextStep: 't3_normal'
          }
        ]
      },
      t2_logic: {
        text: '「病児保育ですか…。もちろん登録は考えていますが、熱を出したばかりの子供を無理やり預けてまでシフトに入るべきなのか、その葛藤自体が苦しくて…。」',
        choices: [
          {
            text: '「そうだよね、システムの問題じゃないんだよね。熱で苦しむ我が子の側にいてあげたいという母親としての葛藤そのものが、辛くて苦しいんだよね。」',
            type: 'empathy',
            bias: 'none',
            trustChange: 25,
            nextEmotion: '安堵',
            nextEmotionColor: '#10b981',
            nextStep: 't3_normal'
          },
          {
            text: '「底知れぬ責任感は分かりますが、私たちがプロの看護師として働く以上、個人の感情論とシフト管理は切り離して考えないと、他のナースが燃え尽きてしまいますよ。」',
            type: 'logic',
            bias: 'showa',
            trustChange: -25,
            nextEmotion: '拒絶・フリーズ',
            nextEmotionColor: '#ef4444',
            nextStep: 't3_fail'
          }
        ]
      },
      t2_self: {
        text: '「気にしすぎと言われても、実際に私のシフトの穴埋めを他の誰かが夜勤明けでやっていると思うと、いたたまれなくて…。」',
        choices: [
          {
            text: '「そうだよね。お互い様と分かっていても、誰かに負担がいっている事実がある以上、辛いよね。あなたのその責任感の強さこそ、素晴らしいものだよ。」',
            type: 'empathy',
            bias: 'none',
            trustChange: 20,
            nextEmotion: '安心・心を開く',
            nextEmotionColor: '#10b981',
            nextStep: 't3_normal'
          },
          {
            text: '「それなら、復帰した後にその人に直接お礼のギフトでも渡したら？お互いに形として精算すれば、精神的にもスッキリするよ。」',
            type: 'logic',
            bias: 'reiwa',
            trustChange: -15,
            nextEmotion: '防衛',
            nextEmotionColor: '#ef4444',
            nextStep: 't3_fail'
          }
        ]
      },
      t3_success: {
        text: '「心がすーっと軽くなりました。そう言っていただけて、本当に救われます…。戻ったら、精一杯周りをカバーしますね。」',
        choices: [
          {
            text: '「カバーなんて気にしなくていいよ。サツキさんが休んだ分は私たちがチームで進めておくから、安心して子供の側にいてあげね。」',
            type: 'empathy',
            bias: 'none',
            trustChange: 15,
            nextEmotion: '超信頼・安堵',
            nextEmotionColor: '#10b981',
            nextStep: 'finish'
          },
          {
            text: '「ありがとう、戻ってきたら夜勤のシフトを少し調整して手伝ってもらえると助かるよ。頼りにしてるね！」',
            type: 'logic',
            bias: 'reiwa',
            trustChange: -10,
            nextEmotion: '緊張',
            nextEmotionColor: '#f59e0b',
            nextStep: 'finish'
          }
        ]
      },
      t3_normal: {
        text: '「分かりました。職場に戻った時に、また皆さんに謝罪して、できる範囲で頑張ります…。」',
        choices: [
          {
            text: '「謝罪なんていらないよ。子供の熱は誰のせいでもないんだから。サツキさんの復帰を心から歓迎するよ。」',
            type: 'empathy',
            bias: 'none',
            trustChange: 15,
            nextEmotion: '信頼',
            nextEmotionColor: '#10b981',
            nextStep: 'finish'
          },
          {
            text: '「うん、お詫びはちゃんとしておいた方が波風立たなくていいね。頑張ってね。」',
            type: 'logic',
            bias: 'showa',
            trustChange: -15,
            nextEmotion: '防衛',
            nextEmotionColor: '#f59e0b',
            nextStep: 'finish'
          }
        ]
      },
      t3_fail: {
        text: '「……すみません、今は仕事の話をする余裕がありません。失礼します。」（相手の心が完全にフリーズしました）',
        choices: []
      }
    }
  },
  {
    id: 'takashi',
    name: 'タカシ（他部署の頑固なリーダー）',
    avatar: '🧔',
    initialEmotion: '防衛・反発',
    initialEmotionColor: '#ef4444',
    initialDesc: '仕様変更に対して「聞いていない」「そっちの都合だ」とへそを曲げてしまった協力部署の責任者。',
    tree: {
      t1: {
        text: '「いきなり仕様変更だなんて、こっちのスケジュールや開発工数を無視しすぎじゃないですか？『聞いていない』し、完全にそっちの都合の押し付けですよ。今回は引き受けられません。」',
        choices: [
          {
            text: '「急な変更でタカシさんのチームの計画や工数を狂わせてしまって、本当に申し訳ありません。そりゃ反発したくなるのも当然です。」',
            type: 'empathy',
            bias: 'none',
            trustChange: 20,
            nextEmotion: '安心・不満緩和',
            nextEmotionColor: '#06b6d4',
            nextStep: 't2_empathy'
          },
          {
            text: '「ですが、この仕様変更はクライアントの要望で、リリース後に不具合が出るのを防ぐために不可欠なんです。リスケジュールはこちらで調整しますので、対応してください。」',
            type: 'logic',
            bias: 'reiwa',
            trustChange: -20,
            nextEmotion: '防衛・怒り',
            nextEmotionColor: '#ef4444',
            nextStep: 't2_logic'
          },
          {
            text: '「私だって板挟みで辛いんですよ！上の決定なので、私に言われてもどうしようもないんです。なんとか協力してもらえませんか？」',
            type: 'self',
            bias: 'showa',
            trustChange: -10,
            nextEmotion: '失望・疎外感',
            nextEmotionColor: '#f59e0b',
            nextStep: 't2_self'
          }
        ]
      },
      t2_empathy: {
        text: '「そうですよ、こちらの開発メンバーも今期ギリギリのスケジュールで動いているんです。謝られても工数は降ってこないんですよ。とはいえ、そこまで申し訳なさそうに言われると、こっちも頭ごなしに突っぱねるのも気が引けますが…」',
        choices: [
          {
            text: '「ありがとうございます。タカシさんのチームの負担を少しでも減らすため、仕様のうち削れる部分がないか、あるいは弊社の開発メンバーを一部アサインできないか、一緒に考えさせてください。」',
            type: 'empathy',
            bias: 'none',
            trustChange: 25,
            nextEmotion: '信頼・前向き',
            nextEmotionColor: '#10b981',
            nextStep: 't3_success'
          },
          {
            text: '「そうですね。では、今回の仕様変更で発生する追加工数の見積もりを明日までにスプレッドシートに出してもらえますか？それを見て判断します。」',
            type: 'logic',
            bias: 'reiwa',
            trustChange: -15,
            nextEmotion: '防衛・距離感',
            nextEmotionColor: '#f59e0b',
            nextStep: 't3_normal'
          }
        ]
      },
      t2_logic: {
        text: '「クライアントの要望なら何でも通ると思ったら大間違いですよ。事前のすり合わせを怠ったそちらのプロジェクト管理のミスを、なぜうちのメンバーの残業でカバーしなきゃいけないんですか？」',
        choices: [
          {
            text: '「おっしゃる通りです。私たちの管理不足、連絡不足が原因であり、タカシさんたちの計画を乱してしまったことは完全にこちらの過失です。本当にごめんなさい。」',
            type: 'empathy',
            bias: 'none',
            trustChange: 20,
            nextEmotion: '不満緩和',
            nextEmotionColor: '#06b6d4',
            nextStep: 't3_normal'
          },
          {
            text: '「管理ミスの責任は追及されても仕方ありませんが、今の段階で誰のせいかを議論してもプロダクトは完成しません。まずは対応方法について話し合いましょう。」',
            type: 'logic',
            bias: 'showa',
            trustChange: -25,
            nextEmotion: '拒絶・フリーズ',
            nextEmotionColor: '#ef4444',
            nextStep: 't3_fail'
          }
        ]
      },
      t2_self: {
        text: '「板挟みなのは分かりますが、だからといって実務を担当するこちらのメンバーにシワ寄せがいくのは納得がいきません。あなたの立場の辛さと、うちのチームの物理的限界は別の話です。」',
        choices: [
          {
            text: '「本当にその通りです。私の甘えでした。タカシさんのチームメンバーの方々への配慮が完全に欠けていました。本当に申し訳ありません。」',
            type: 'empathy',
            bias: 'none',
            trustChange: 20,
            nextEmotion: '安堵・和解',
            nextEmotionColor: '#10b981',
            nextStep: 't3_normal'
          },
          {
            text: '「ですが、会社としての目標を達成するためには、部署を超えて協力するしかないはずです。お互い歩み寄りましょう。」',
            type: 'logic',
            bias: 'showa',
            trustChange: -20,
            nextEmotion: 'フリーズ',
            nextEmotionColor: '#ef4444',
            nextStep: 't3_fail'
          }
        ]
      },
      t3_success: {
        text: '「そこまでこちらのチームの負担を考慮して、リソース調整の提案までしてくれるなら、こちらも何が何でもできないとは言えませんね。一部の仕様について調整案を出してみます。」',
        choices: [
          {
            text: '「本当にありがとうございます！タカシさんのご協力に感謝します。無理のない範囲で進められるよう、引き続き密に連携させてください。」',
            type: 'empathy',
            bias: 'none',
            trustChange: 15,
            nextEmotion: '超信頼・安堵',
            nextEmotionColor: '#10b981',
            nextStep: 'finish'
          },
          {
            text: '「助かります。では具体的な調整案を今日の18時までに送っていただけますか？すぐに社内調整に入ります。」',
            type: 'logic',
            bias: 'reiwa',
            trustChange: -10,
            nextEmotion: '義務感・疲弊',
            nextEmotionColor: '#f59e0b',
            nextStep: 'finish'
          }
        ]
      },
      t3_normal: {
        text: '「わかりました。今回の件、こちらのスケジュールも限界に近いですが、一部の優先度を下げることで対応可能か、一旦メンバーと相談してみます。」',
        choices: [
          {
            text: '「ありがとうございます。少しでも調整が難しそうであれば、いつでも私に言ってください。可能な限りサポートします。」',
            type: 'empathy',
            bias: 'none',
            trustChange: 15,
            nextEmotion: '信頼',
            nextEmotionColor: '#10b981',
            nextStep: 'finish'
          },
          {
            text: '「分かりました。では相談結果を明日の午前中までに教えてください。お待ちしています。」',
            type: 'logic',
            bias: 'reiwa',
            trustChange: -15,
            nextEmotion: '防衛・義務',
            nextEmotionColor: '#f59e0b',
            nextStep: 'finish'
          }
        ]
      },
      t3_fail: {
        text: '「これ以上何を言われても無理なものは無理です。この件は上のレイヤー同士で話を通してください。失礼します。」（相手の心が完全にフリーズしました）',
        choices: []
      }
    }
  },
  {
    id: 'client',
    name: 'クレーマー顧客（配送遅延に怒る取引先）',
    avatar: '😠',
    initialEmotion: '怒り・不信',
    initialEmotionColor: '#ef4444',
    initialDesc: '配送遅延によってイベント資材が届かず、大損失を被る可能性があると怒り狂う取引先担当者。',
    tree: {
      t1: {
        text: '「おたくの配送トラブルのせいで、明日の展示会イベントで配るパンフレットがまだ届いてないんですよ！これがなかったら大損害です！どう責任をとってくれるんですか！？」',
        choices: [
          {
            text: '「明日の大切なイベントの資料が届かないなんて、どれほど焦り、また怒りを感じていらっしゃるか…。当社のミスで多大なご不安を与えてしまい、本当に申し訳ありません。」',
            type: 'empathy',
            bias: 'none',
            trustChange: 25,
            nextEmotion: '安心・不満緩和',
            nextEmotionColor: '#06b6d4',
            nextStep: 't2_empathy'
          },
          {
            text: '「配送遅延の原因は運送会社のシステム障害によるもので、現在追跡番号で確認しております。到着予定時間がわかり次第すぐにご連絡します。」',
            type: 'logic',
            bias: 'reiwa',
            trustChange: -20,
            nextEmotion: '防衛・憤慨',
            nextEmotionColor: '#ef4444',
            nextStep: 't2_logic'
          },
          {
            text: '「このような遅延は契約書の免責事項に含まれておりますが、できる限りの対応はさせていただきます。まずは落ち着いてください。」',
            type: 'self',
            bias: 'showa',
            trustChange: -25,
            nextEmotion: '極度不信・断絶',
            nextEmotionColor: '#ef4444',
            nextStep: 't2_self'
          }
        ]
      },
      t2_empathy: {
        text: '「謝られても展示会は明日なんです！今更どうしようもないじゃないですか！うちの社長にもどう説明すればいいのか、頭が痛いですよ…」',
        choices: [
          {
            text: '「そうですよね…社内での立場も本当に苦しくなってしまいますよね。今から私が代替品を直接会場までお届けするか、現地で印刷する手配を取らせていただきます。」',
            type: 'empathy',
            bias: 'none',
            trustChange: 25,
            nextEmotion: '安堵・信頼の兆し',
            nextEmotionColor: '#10b981',
            nextStep: 't3_success'
          },
          {
            text: '「社長への説明資料として、今回の遅延に関する公式な経緯報告書を急ぎPDFで送付します。それでご説明いただけますでしょうか？」',
            type: 'logic',
            bias: 'reiwa',
            trustChange: -15,
            nextEmotion: '防衛・不満',
            nextEmotionColor: '#f59e0b',
            nextStep: 't3_normal'
          }
        ]
      },
      t2_logic: {
        text: '「運送会社のせいにするんですか！？私はおたくの会社を信用して発注したんですよ！そんな言い訳、こちらの社内では一切通用しません！」',
        choices: [
          {
            text: '「おっしゃる通りです。当社の管理体制および委託先選定の責任であり、言い訳の余地はございません。ご心配とご怒りはごもっともです。」',
            type: 'empathy',
            bias: 'none',
            trustChange: 20,
            nextEmotion: '怒り緩和',
            nextEmotionColor: '#06b6d4',
            nextStep: 't3_normal'
          },
          {
            text: '「しかし、天災による交通渋滞も重なっており、物理的に今すぐ届けることは不可能です。到着をお待ちいただくしかありません。」',
            type: 'logic',
            bias: 'reiwa',
            trustChange: -25,
            nextEmotion: '拒絶・フリーズ',
            nextEmotionColor: '#ef4444',
            nextStep: 't3_fail'
          }
        ]
      },
      t2_self: {
        text: '「落ち着いていられるわけがないでしょう！契約書がどうとか、おたくの保身の話なんて聞いていません！今すぐパンフレットを持ってきなさい！」',
        choices: [
          {
            text: '「大変失礼いたしました。お客様の窮地を目の前にして、冷酷な話をしてしまいました。深くお詫び申し上げます。今からお届けする方法を探します。」',
            type: 'empathy',
            bias: 'none',
            trustChange: 20,
            nextEmotion: '不満緩和',
            nextEmotionColor: '#06b6d4',
            nextStep: 't3_normal'
          },
          {
            text: '「物理的に距離が離れており、持参するのは不可能です。速達便で明日の朝一番に届くよう手配するのが最速の手段です。」',
            type: 'logic',
            bias: 'reiwa',
            trustChange: -20,
            nextEmotion: 'フリーズ',
            nextEmotionColor: '#ef4444',
            nextStep: 't3_fail'
          }
        ]
      },
      t3_success: {
        text: '「そこまで対応してくれるんですか…。直接持ってきてもらえるなら、なんとか明日の設営に間に合いそうです。こちらの焦りを受け止めてくれて感謝します。」',
        choices: [
          {
            text: '「とんでもございません。お客様の大切なイベントを成功させることが第一ですので、全力を尽くします。これから新幹線で現地に向かいます。」',
            type: 'empathy',
            bias: 'none',
            trustChange: 15,
            nextEmotion: '超信頼・安堵',
            nextEmotionColor: '#10b981',
            nextStep: 'finish'
          },
          {
            text: '「では、代替品の持参にかかる費用はこちらで負担します。到着は本日19時頃になりますので、現地でお待ちください。」',
            type: 'logic',
            bias: 'reiwa',
            trustChange: -10,
            nextEmotion: '実務的納得',
            nextEmotionColor: '#f59e0b',
            nextStep: 'finish'
          }
        ]
      },
      t3_normal: {
        text: '「わかりました。まずは経緯説明のメールを送ってください。それと、少しでも早く届くよう配送状況の監視を続けてください。」',
        choices: [
          {
            text: '「承知いたしました。お客様の不安が少しでも和らぐよう、1時間ごとに状況をメールと電話でご報告させていただきます。」',
            type: 'empathy',
            bias: 'none',
            trustChange: 15,
            nextEmotion: '信頼',
            nextEmotionColor: '#10b981',
            nextStep: 'finish'
          },
          {
            text: '「了解しました。では追跡情報が更新され次第、自動メールで通知が飛ぶように設定しておきます。」',
            type: 'logic',
            bias: 'reiwa',
            trustChange: -15,
            nextEmotion: '防衛・距離感',
            nextEmotionColor: '#f59e0b',
            nextStep: 'finish'
          }
        ]
      },
      t3_fail: {
        text: '「もう結構です！おたくの会社とは二度と取引しません！法的措置も含めて検討させていただきます！」（相手の心が完全にフリーズし、対話決裂しました）',
        choices: []
      }
    }
  },
  {
    id: 'mai',
    name: 'マイ（キャリアに悩む中堅メンバー）',
    avatar: '👩‍🎨',
    initialEmotion: '虚無・迷い',
    initialEmotionColor: '#06b6d4',
    initialDesc: '仕事のパフォーマンスは高いが、今後のキャリアや仕事の意義に悩み、燃え尽き気味になっているメンバー。',
    tree: {
      t1: {
        text: '「今の仕事、そつなくこなせているとは思うんです。でも、毎日同じことの繰り返しで、自分がこの先どう成長していきたいのか、何のために働いているのか分からなくなってしまって…」',
        choices: [
          {
            text: '「今の役割をしっかり果たしているからこそ、その先のキャリアに迷い、虚しさを感じるんだよね。先のことを真剣に考えている証拠だよ。」',
            type: 'empathy',
            bias: 'none',
            trustChange: 20,
            nextEmotion: '安心・心を開きかけ',
            nextEmotionColor: '#06b6d4',
            nextStep: 't2_empathy'
          },
          {
            text: '「中堅になるとそういう時期はあるよ。まずは自己分析ツールを使って強みを言語化し、5年後のキャリアプランシートを作ってみよう。」',
            type: 'logic',
            bias: 'reiwa',
            trustChange: -20,
            nextEmotion: '防衛・諦め',
            nextEmotionColor: '#ef4444',
            nextStep: 't2_logic'
          },
          {
            text: '「私なんてマイさんの年齢の時は、キャリアどころか明日の業務をこなすだけで精一杯だったよ！今のマイさんは十分に恵まれているよ。」',
            type: 'self',
            bias: 'showa',
            trustChange: -15,
            nextEmotion: '孤独・あきらめ',
            nextEmotionColor: '#f59e0b',
            nextStep: 't2_self'
          }
        ]
      },
      t2_empathy: {
        text: '「そう言っていただけると嬉しいです…。周りからは『順調だね』と言われるので、こんな贅沢な悩みを打ち明けるのが怖かったんです。でも、今のままだと自分がすり減っていく気がして…」',
        choices: [
          {
            text: '「順調に見える人ほど、孤独に一人で悩みを抱え込みやすいよね。焦って答えを出そうとせず、今は心がすり減っている原因を一緒に整理していこう。」',
            type: 'empathy',
            bias: 'none',
            trustChange: 25,
            nextEmotion: '信頼・安堵',
            nextEmotionColor: '#10b981',
            nextStep: 't3_success'
          },
          {
            text: '「心がすり減る原因を可視化するために、ストレス要因をスプレッドシートにリストアップしてみて。そこから対策を立てよう。」',
            type: 'logic',
            bias: 'reiwa',
            trustChange: -15,
            nextEmotion: '防衛・距離感',
            nextEmotionColor: '#f59e0b',
            nextStep: 't3_normal'
          }
        ]
      },
      t2_logic: {
        text: '「キャリアプランシートですか…。なんだかそれを見ても、今の自分のモヤモヤした感情がすべて義務的な目標に置き換えられるようで、余計に苦しくなりそうです。」',
        choices: [
          {
            text: '「そうだよね。今はタスクや目標を増やすべき時期じゃないよね。まずは目標設定を一旦忘れて、何がマイさんをモヤモヤさせているのか、気持ちを聞かせて。」',
            type: 'empathy',
            bias: 'none',
            trustChange: 20,
            nextEmotion: '安心・受容',
            nextEmotionColor: '#06b6d4',
            nextStep: 't3_normal'
          },
          {
            text: '「目標を明確にしなければ、今のモヤモヤから抜け出すための行動指針も決まりませんよ。まずは数字に落とし込みましょう。」',
            type: 'logic',
            bias: 'reiwa',
            trustChange: -25,
            nextEmotion: '拒絶・フリーズ',
            nextEmotionColor: '#ef4444',
            nextStep: 't3_fail'
          }
        ]
      },
      t2_self: {
        text: '「恵まれていると言われればそうかもしれませんね…。でも、だからこそ誰にも言えずに苦しかったんです。先輩に相談したのは間違いだったかもしれません。」',
        choices: [
          {
            text: '「本当に申し訳ない。マイさんの今のデリケートな悩みに、私の過去の基準を押し付けるような無神経な言い方をしてしまった。心から謝るよ。」',
            type: 'empathy',
            bias: 'none',
            trustChange: 25,
            nextEmotion: '不満緩和・信頼',
            nextEmotionColor: '#10b981',
            nextStep: 't3_normal'
          },
          {
            text: '「そんなつもりで言ったんじゃないんだけどな。悩むこと自体は否定しないから、もっと前向きに捉えてみてはどうかな？」',
            type: 'logic',
            bias: 'showa',
            trustChange: -20,
            nextEmotion: 'フリーズ',
            nextEmotionColor: '#ef4444',
            nextStep: 't3_fail'
          }
        ]
      },
      t3_success: {
        text: '「先輩の前でなら、飾らない本音を話せそうな気がします。少し心が軽くなりました。私の話を聞いてくれてありがとうございます。」',
        choices: [
          {
            text: '「こちらこそ、大切な悩みを話してくれてありがとう。答えを急ぐ必要はないから、これからも定期的にこうやって雑談しながら考えていこう。」',
            type: 'empathy',
            bias: 'none',
            trustChange: 15,
            nextEmotion: '超信頼・安堵',
            nextEmotionColor: '#10b981',
            nextStep: 'finish'
          },
          {
            text: '「良かったです。では、隔週で1on1のミーティングを入れましょう。そこでキャリアプランの進捗も追っていきますね。」',
            type: 'logic',
            bias: 'reiwa',
            trustChange: -10,
            nextEmotion: '緊張・防衛',
            nextEmotionColor: '#f59e0b',
            nextStep: 'finish'
          }
        ]
      },
      t3_normal: {
        text: '「わかりました。まずは自分の気持ちと向き合って、少しずつ整理してみます。また相談に乗っていただけると助かります。」',
        choices: [
          {
            text: '「いつでも大歓迎だよ。仕事の合間でもいつでも声をかけてね。マイさんのペースで進めばいいんだから。」',
            type: 'empathy',
            bias: 'none',
            trustChange: 15,
            nextEmotion: '信頼',
            nextEmotionColor: '#10b981',
            nextStep: 'finish'
          },
          {
            text: '「うん、自分で整理できたら、また1on1で内容を聞かせてください。アドバイスします。」',
            type: 'logic',
            bias: 'showa',
            trustChange: -15,
            nextEmotion: '防衛・緊張',
            nextEmotionColor: '#f59e0b',
            nextStep: 'finish'
          }
        ]
      },
      t3_fail: {
        text: '「……すみません、やはり自分だけで考えることにします。お時間いただきありがとうございました。」（相手の心が完全にフリーズしました）',
        choices: []
      }
    }
  },
  {
    id: 'miki',
    name: 'ミキ（完璧主義すぎるデザイナー）',
    avatar: '🎨',
    initialEmotion: '妥協への恐れ・こだわり',
    initialEmotionColor: '#f59e0b',
    initialDesc: 'クオリティと納期の板挟みに苦しむ完璧主義のデザイナー。',
    tree: {
      t1: {
        text: '「今回の新規アプリのデザイン、どうしても細かいUIのアニメーションや影の表現に納得がいかなくて…。でも納期は来週だし、このまま妥協して中途半端なものを世に出すくらいなら、提出を遅らせてでもクオリティを極めたいんです……」',
        choices: [
          {
            text: '「こだわりたい気持ち、すごくよく分かるよ。作り手として良いものを届けたいという責任感があるからこそ、妥協するのが怖いし、葛藤するんだよね。」',
            type: 'empathy',
            bias: 'none',
            trustChange: 20,
            nextEmotion: '安心・共感',
            nextEmotionColor: '#10b981',
            nextStep: 't2_empathy'
          },
          {
            text: '「仕事は納期を守るのが大前提だよ。クオリティを言い訳にして遅れるのはプロ失格。どこかで妥協点を見つけてスケジュール通りに提出して。」',
            type: 'logic',
            bias: 'reiwa',
            trustChange: -20,
            nextEmotion: '防衛・拒絶',
            nextEmotionColor: '#ef4444',
            nextStep: 't2_logic'
          },
          {
            text: '「僕たちの若い頃なんて、徹夜してでもクオリティと納期の両方を根性で間に合わせたもんだよ！迷っている時間があるなら手を動かそう！」',
            type: 'self',
            bias: 'showa',
            trustChange: -10,
            nextEmotion: '疎外感・迷い',
            nextEmotionColor: '#f59e0b',
            nextStep: 't2_self'
          }
        ]
      },
      t2_empathy: {
        text: '「そうなんです！ただの自己満足だと言われるかもしれませんが、ユーザーの体験を左右する重要なディテールだと思っていて…。妥協しろと言われるのが一番辛かったです。」',
        choices: [
          {
            text: '「いきなりクオリティを落とすんじゃなくて、どの部分が今回の本質的な価値なのか、そこを外さない形で現実的な着地点を一緒に探っていこう。」',
            type: 'empathy',
            bias: 'none',
            trustChange: 25,
            nextEmotion: '信頼・心を開く',
            nextEmotionColor: '#10b981',
            nextStep: 't3_success'
          },
          {
            text: '「気持ちを分かってもらえたなら、まずは仕様書通りに機能する最小限のモックを作ろう。それからブラッシュアップする時間を考えよう。」',
            type: 'logic',
            bias: 'reiwa',
            trustChange: -15,
            nextEmotion: '焦り・防衛',
            nextEmotionColor: '#ef4444',
            nextStep: 't3_normal'
          }
        ]
      },
      t2_logic: {
        text: '「プロ失格ですか……。スケジュールが大事なのはわかりますが、妥協した低品質なデザインを世に出すことも、プロダクトとユーザーに対する不誠実ではないでしょうか？」',
        choices: [
          {
            text: '「そうだよね。頭では納期優先と分かっていても、細部までこだわり抜いてこそ自分の仕事だというプライドがあるから、簡単に割り切れないんだよね。」',
            type: 'empathy',
            bias: 'none',
            trustChange: 20,
            nextEmotion: '安堵・対話意欲',
            nextEmotionColor: '#10b981',
            nextStep: 't3_normal'
          },
          {
            text: '「スケジュール遅延の影響範囲をわかってる？他部署のエンジニアの予定も全部狂うんだよ。言い訳をせず、今あるものをすぐ提出して。」',
            type: 'logic',
            bias: 'showa',
            trustChange: -25,
            nextEmotion: 'フリーズ・拒絶',
            nextEmotionColor: '#ef4444',
            nextStep: 't3_fail'
          }
        ]
      },
      t2_self: {
        text: '「徹夜ですか……。私の健康や働き方を無視して、昔のやり方を押し付けられても困ります。そういう根性論では根本的な解決になりません。」',
        choices: [
          {
            text: '「ごめん、根性論を押し付けるような言い方をしてしまったね。今の限られたリソースの中で、ミキさんがどれだけ最高の成果を出そうと葛藤しているか、もっと配慮すべきだった。」',
            type: 'empathy',
            bias: 'none',
            trustChange: 25,
            nextEmotion: '信頼・納得',
            nextEmotionColor: '#10b981',
            nextStep: 't3_normal'
          },
          {
            text: '「とにかく、今のやり方のままだと確実に遅延するよ。自分のこだわりは一旦脇に置いて、指示通りに効率重視で進めて。」',
            type: 'logic',
            bias: 'reiwa',
            trustChange: -20,
            nextEmotion: '拒絶',
            nextEmotionColor: '#ef4444',
            nextStep: 't3_fail'
          }
        ]
      },
      t3_success: {
        text: '「本質的な価値……そうですね。まずは最優先のユーザーフローに絞って磨き上げるのなら、納得して進められそうです。少し整理してみます。」',
        choices: [
          {
            text: '「うん、まずは今回のデザインで最もユーザーに伝えたいコアな体験だけに集中して、その他の装飾はフェーズ2に回すように調整しよう。クライアントへの交渉は僕がやるから任せて。」',
            type: 'empathy',
            bias: 'none',
            trustChange: 15,
            nextEmotion: '超信頼・安堵',
            nextEmotionColor: '#10b981',
            nextStep: 'finish'
          },
          {
            text: '「じゃあ、今日中にコア機能のデザインだけを仕上げて、残りの部分は明日中に進捗を見せてね。スケジュールをマイルストーンに落とし込もう。」',
            type: 'logic',
            bias: 'reiwa',
            trustChange: -10,
            nextEmotion: '緊張・プレッシャー',
            nextEmotionColor: '#f59e0b',
            nextStep: 'finish'
          }
        ]
      },
      t3_normal: {
        text: '「分かりました。少し悔しさは残りますが、今回はスケジュールを優先しつつ、できる範囲で調整してみます。」',
        choices: [
          {
            text: '「クオリティへの熱意があることは、チームにとって素晴らしい強みだよ。無理のない範囲で、まずはコアの部分を形にしてみよう。何かあればいつでもサポートするからね。」',
            type: 'empathy',
            bias: 'none',
            trustChange: 15,
            nextEmotion: '信頼・安心',
            nextEmotionColor: '#10b981',
            nextStep: 'finish'
          },
          {
            text: '「分かった。では次のチェックポイントを明日の朝イチに設定するね。そこまでの進捗をチームで確認しましょう。」',
            type: 'logic',
            bias: 'showa',
            trustChange: -15,
            nextEmotion: '緊張・防衛',
            nextEmotionColor: '#f59e0b',
            nextStep: 'finish'
          }
        ]
      },
      t3_fail: {
        text: '「……すみません、やはり自分だけで考えることにします。お時間いただきありがとうございました。」（相手の心が完全にフリーズしました）',
        choices: []
      }
    }
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

export default function EqSimulator({ onFinish, playSound, muted, toggleMute, onBack, onLogBug, reviewQuestionId, onFinishReview }) {
  // ゲーム進行用ステート
  const [gameStatus, setGameStatus] = useState('tutorial'); // 'tutorial' | 'select' | 'playing' | 'clear'
  const [selectedScenario, setSelectedScenario] = useState(null);
  
  // 対話状態
  const [trust, setTrust] = useState(50); // 初期信頼度 50%
  const [currentStepKey, setCurrentStepKey] = useState('t1'); // 't1', 't2_empathy' ...
  const [emotion, setEmotion] = useState('');
  const [emotionColor, setEmotionColor] = useState('');
  const [chatLog, setChatLog] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isAnswered, setIsAnswered] = useState(false);
  const [selectedChoiceIdx, setSelectedChoiceIdx] = useState(null);
  const [shuffledChoices, setShuffledChoices] = useState([]);

  // 診断用記録ステート
  const [selectedChoices, setSelectedChoices] = useState([]);

  // 画面エフェクト（正論ダメージ時のフリッカーノイズ）
  const [flickerActive, setFlickerActive] = useState(false);
  const [trustChangeNotify, setTrustChangeNotify] = useState(null); // { val: number, isUp: boolean }

  // 防衛シールド状態
  const [shieldActive, setShieldActive] = useState(false);
  const [shieldHp, setShieldHp] = useState(0); // 0 or 100
  const [shieldFlash, setShieldFlash] = useState(false); // 被シールドヒット時のフラッシュ用
  const [shieldBreak, setShieldBreak] = useState(false); // シールド解除時のアニメーション用

  const chatEndRef = useRef(null);

  // チャットスクロール
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatLog, isTyping]);

  // シナリオ開始
  const handleSelectScenario = (sc) => {
    playSound('click');
    setSelectedScenario(sc);
    setTrust(50);
    setCurrentStepKey('t1');
    setEmotion(sc.initialEmotion);
    setEmotionColor(sc.initialEmotionColor);
    setGameStatus('playing');
    setIsAnswered(false);
    setSelectedChoiceIdx(null);
    setSelectedChoices([]);
    setShieldActive(false);
    setShieldHp(0);
    setShieldFlash(false);
    setShieldBreak(false);

    // 最初のメッセージを受信
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setChatLog([
        {
          sender: 'them',
          speaker: sc.name.split('（')[0],
          text: sc.tree.t1.text,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }, 1200);
  };

  useEffect(() => {
    if (reviewQuestionId) {
      const found = scenarios.find(s => s.id === reviewQuestionId);
      if (found) {
        handleSelectScenario(found);
      }
    }
  }, [reviewQuestionId]);

  const currentStep = selectedScenario?.tree[currentStepKey];

  useEffect(() => {
    if (currentStep && currentStep.choices) {
      setShuffledChoices(shuffleArray(currentStep.choices));
    } else {
      setShuffledChoices([]);
    }
  }, [currentStepKey, selectedScenario]);

  // 回答決定
  const handleAnswer = (choiceIdx, choice) => {
    if (isAnswered || isTyping) return;
    playSound('click');
    setSelectedChoiceIdx(choiceIdx);
    setIsAnswered(true);
    setSelectedChoices(prev => [...prev, choice]);

    // 自分の発言をチャットログに追加
    setChatLog(prev => [
      ...prev,
      {
        sender: 'me',
        speaker: 'あなた',
        text: choice.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);

    // 信頼度の更新と防衛シールド判定
    const val = choice.trustChange;
    let actualTrustChange = val;
    let isUp = val > 0;
    let isBlocked = false;

    if (shieldActive) {
      if (choice.type === 'empathy') {
        // 共感回答によるシールド解除！
        setShieldBreak(true);
        setTimeout(() => setShieldBreak(false), 800);
        setShieldActive(false);
        setShieldHp(0);
      } else {
        // 非共感回答はシールドによって完全に防がれる
        actualTrustChange = 0;
        isBlocked = true;
        setShieldFlash(true);
        setTimeout(() => setShieldFlash(false), 450);

        // システム警告チャットをログに追加
        setTimeout(() => {
          setChatLog(prev => [
            ...prev,
            {
              sender: 'system',
              speaker: '防衛システム警報',
              text: '🛡️ 正論ブロック：あなたの理論的アドバイスは相手の防衛シールドに弾かれました。共感を示し、シールドを解除してください。',
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          ]);
        }, 500);
      }
    } else {
      // 大きな正論ダメージ（信頼度 -20以下）かつ非共感選択時にシールド展開！
      if (val <= -20 && choice.type !== 'empathy') {
        setShieldActive(true);
        setShieldHp(100);
        
        // システム警告チャットをログに追加
        setTimeout(() => {
          setChatLog(prev => [
            ...prev,
            {
              sender: 'system',
              speaker: '防衛システム警報',
              text: '🛡️ シールド起動：強い正論ダメージ（ロジハラ等）を検知。相手が心を閉ざし、防衛シールドを展開しました！',
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          ]);
        }, 500);
      }
    }

    if (actualTrustChange !== 0) {
      if (isUp) {
        setTimeout(() => playSound('correct'), 300);
      } else {
        setTimeout(() => playSound('incorrect'), 300);
        // 被正論ダメージのフリッカーノイズ演出発動
        setFlickerActive(true);
        setTimeout(() => setFlickerActive(false), 400);
      }

      setTrustChangeNotify({ val: Math.abs(actualTrustChange), isUp });
      setTimeout(() => setTrustChangeNotify(null), 1500);

      setTrust(prev => Math.min(100, Math.max(0, prev + actualTrustChange)));
      if (onLogBug && !reviewQuestionId && !isUp) {
        onLogBug('eqSimulator', selectedScenario.id, `対話エラー: ${choice.text} (信頼度変化: ${choice.trustChange})`);
      }
    } else if (isBlocked) {
      setTimeout(() => playSound('incorrect'), 300);
      setTrustChangeNotify({ val: 'SHIELD BLOCK', isUp: false });
      setTimeout(() => setTrustChangeNotify(null), 1500);
      if (onLogBug && !reviewQuestionId) {
        onLogBug('eqSimulator', selectedScenario.id, `対話エラー: ${choice.text} (防衛シールドブロック)`);
      }
    }

    // 感情ステートの更新
    // ブロックされた場合は相手の感情は「極度防衛（シールド展開中）」で維持する
    const nextEmotion = isBlocked ? '極度防衛（シールド展開中）' : choice.nextEmotion;
    const nextEmotionColor = isBlocked ? '#ef4444' : choice.nextEmotionColor;
    setEmotion(nextEmotion);
    setEmotionColor(nextEmotionColor);

    // 相手の反応をタイピング表示
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      
      const nextStepKey = choice.nextStep;

      // 次のステップが finish の場合は、ここで対話終了処理（結果画面へ）
      if (nextStepKey === 'finish') {
        setTimeout(() => {
          setGameStatus('clear');
        }, 1000);
        return;
      }

      setCurrentStepKey(nextStepKey);
      const nextStep = selectedScenario.tree[nextStepKey];

      if (!nextStep) {
        // セーフティ
        setGameStatus('clear');
        return;
      }

      // ブロックされた場合は、会話は先に進むが、テキストの先頭に防衛シールドのエフェクトを想起させる文脈を少し補正して表示
      setChatLog(prev => [
        ...prev,
        {
          sender: 'them',
          speaker: selectedScenario.name.split('（')[0],
          text: isBlocked ? `（耳を塞ぐように）「…言っていることは分かりますが、今はそんな理屈を受け入れる心の余裕がありません。」${nextStep.text}` : nextStep.text,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);

      // 対話終了判定（次の選択肢がない ＝ fail など）
      if (!nextStep.choices || nextStep.choices.length === 0) {
        setTimeout(() => {
          setGameStatus('clear');
        }, 2000);
      } else {
        setIsAnswered(false);
        setSelectedChoiceIdx(null);
      }

    }, 2000);
  };

  const handleFinishGame = () => {
    if (reviewQuestionId && onFinishReview) {
      onFinishReview('eqSimulator', reviewQuestionId);
    } else {
      onFinish(trust);
    }
  };

  const startTraining = () => {
    playSound('click');
    setGameStatus('select');
  };

  // 診断の集計ロジック
  const totalAnswers = selectedChoices.length;
  const empathyCount = selectedChoices.filter(c => c.type === 'empathy').length;
  const logicCount = selectedChoices.filter(c => c.type === 'logic').length;
  const selfCount = selectedChoices.filter(c => c.type === 'self').length;

  const showaCount = selectedChoices.filter(c => c.bias === 'showa').length;
  const reiwaCount = selectedChoices.filter(c => c.bias === 'reiwa').length;

  // 各スタイルの割合
  const empathyRate = totalAnswers > 0 ? Math.round((empathyCount / totalAnswers) * 100) : 0;
  const logicRate = totalAnswers > 0 ? Math.round((logicCount / totalAnswers) * 100) : 0;
  const selfRate = totalAnswers > 0 ? Math.round((selfCount / totalAnswers) * 100) : 0;

  // 脳内元号バイアスの割合
  const totalBiases = showaCount + reiwaCount;
  const showaRate = totalBiases > 0 ? Math.round((showaCount / totalBiases) * 100) : 50;
  const reiwaRate = totalBiases > 0 ? Math.round((reiwaCount / totalBiases) * 100) : 50;

  const getDiagnosis = () => {
    if (empathyRate >= 60) {
      return {
        title: "心のオアシス・傾聴マスター",
        desc: "相手の負の感情や葛藤を否定せず、100%肯定して寄り添える傾聴のスペシャリストです。精神的な防衛壁を完全に解きほぐし、深い心理的安全性を与えています。"
      };
    }
    if (logicRate >= 50) {
      return {
        title: "ロジック過剰な正論ハッカー",
        desc: "相手の悩みを論理的に解決しようとするあまり、アドバイスやKPI管理などの『正論』を突きつけてしまいがちです。対話においては理屈よりもまず感情のデバッグが必要です。"
      };
    }
    if (selfRate >= 50) {
      return {
        title: "武武伝語りの昭和おじさん脳",
        desc: "「自分の時代は〜」「気にしすぎだ」と、無意識のうちに自分の過去基準や精神論を相手に押し付けてしまう傾向があります。世代間認知バイアスによるすれ違いを引き起こしやすい状態です。"
      };
    }
    return {
      title: "バランス型コミュニケーター",
      desc: "共感と論理、自分語りを状況に合わせて使い分ける対話スタイルです。寄り添いと課題解決のバランスを意識して、さらに共感率を高めるとマスタークラスに到達します。"
    };
  };

  const diagnosis = getDiagnosis();

  return (
    <div className={`eq-wrapper ${flickerActive ? 'flicker-active' : ''}`} style={{ maxWidth: '750px', margin: '0 auto', padding: '0 16px' }}>
      
      {/* 画面ノイズ、信頼度通知のCSSスタイル */}
      <style>{`
        .eq-wrapper {
          transition: filter 0.1s ease;
        }
        .flicker-active {
          animation: noise-flicker 0.3s ease infinite;
        }
        .flicker-active::before {
          content: "";
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(239, 68, 68, 0.1);
          border: 4px solid #ef4444;
          z-index: 9999;
          pointer-events: none;
        }
        @keyframes noise-flicker {
          0%, 100% { filter: contrast(1.1) brightness(1); }
          50% { filter: contrast(1.4) brightness(0.9) blur(0.5px); }
        }
        .trust-bar-outer {
          height: 12px;
          border-radius: 6px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border-color);
          overflow: hidden;
          width: 100%;
          position: relative;
        }
        .trust-bar-inner {
          height: 100%;
          transition: width 0.6s cubic-bezier(0.25, 0.8, 0.25, 1);
        }
        .avatar-neon-ring {
          position: relative;
          width: 60px; height: 60px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #1e293b;
          border: 2px solid var(--border-color);
          transition: border-color 0.5s ease, box-shadow 0.5s ease;
          font-size: 28px;
        }
        body.light-theme .avatar-neon-ring {
          background: #ffffff;
        }
        .dot-blink {
          width: 6px; height: 6px;
          background: var(--text-muted);
          border-radius: 50%;
          display: inline-block;
          animation: dot-jump 1.4s infinite ease-in-out both;
        }
        .dot-blink:nth-child(2) { animation-delay: 0.2s; }
        .dot-blink:nth-child(3) { animation-delay: 0.4s; }
        @keyframes dot-jump {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1.2); opacity: 1; }
        }
        .notify-trust {
          position: absolute;
          font-family: var(--font-display);
          font-weight: 800;
          font-size: 14px;
          animation: trust-notify-float 1.5s ease forwards;
          z-index: 100;
          top: -20px;
          right: 0;
        }
        @keyframes trust-notify-float {
          0% { transform: translateY(0); opacity: 0; }
          20% { transform: translateY(-5px); opacity: 1; }
          100% { transform: translateY(-20px); opacity: 0; }
        }
        .shield-on {
          animation: shield-glow 2s infinite ease-in-out;
        }
        .shield-overlay {
          position: absolute;
          top: -5px; left: -5px; right: -5px; bottom: -5px;
          border-radius: 50%;
          border: 2px solid #ef4444;
          background: radial-gradient(circle, rgba(239, 68, 68, 0.05) 0%, rgba(239, 68, 68, 0.25) 100%);
          box-shadow: 0 0 20px rgba(239, 68, 68, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
          z-index: 10;
        }
        .shield-grid {
          position: absolute;
          width: 100%; height: 100%;
          border-radius: 50%;
          background-size: 8px 8px;
          background-image: 
            radial-gradient(circle, rgba(239, 68, 68, 0.3) 1px, transparent 1px);
          opacity: 0.8;
          animation: rotate-shield 10s linear infinite;
        }
        .shield-tag {
          position: absolute;
          bottom: -15px;
          left: 50%;
          transform: translateX(-50%);
          background: #ef4444;
          color: #ffffff;
          font-size: 8px;
          font-family: var(--font-display);
          font-weight: 900;
          padding: 1px 4px;
          border-radius: 3px;
          white-space: nowrap;
          box-shadow: 0 0 8px rgba(239, 68, 68, 0.8);
          animation: tag-pulse 1s infinite alternate;
        }
        .shield-flash-anim {
          animation: shield-flash 0.4s ease;
        }
        .shield-break-anim {
          animation: shield-break 0.8s ease forwards;
        }
        @keyframes shield-glow {
          0%, 100% { box-shadow: 0 0 12px rgba(239, 68, 68, 0.4); }
          50% { box-shadow: 0 0 22px rgba(239, 68, 68, 0.8); }
        }
        @keyframes rotate-shield {
          to { transform: rotate(360deg); }
        }
        @keyframes tag-pulse {
          from { opacity: 0.7; }
          to { opacity: 1; }
        }
        @keyframes shield-flash {
          0%, 100% { filter: brightness(1); }
          50% { filter: brightness(1.8) drop-shadow(0 0 15px #ef4444); }
        }
        @keyframes shield-break {
          0% { transform: scale(1); opacity: 1; filter: hue-rotate(0deg); }
          50% { transform: scale(1.1); opacity: 0.8; filter: hue-rotate(90deg); }
          100% { transform: scale(1.3); opacity: 0; filter: hue-rotate(180deg); }
        }
        .eq-chat-log {
          height: 300px;
          background: rgba(0, 0, 0, 0.25);
          border-radius: 12px;
          border: 1px solid var(--border-color);
          padding: 16px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 20px;
        }
        body.light-theme .eq-chat-log {
          background: rgba(15, 23, 42, 0.03);
        }
        .eq-msg-me {
          background: linear-gradient(135deg, var(--color-primary) 0%, #6d28d9 100%);
          color: #ffffff !important;
          box-shadow: 0 4px 10px rgba(139, 92, 246, 0.15);
        }
        .eq-msg-them {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid var(--border-color);
          color: var(--text-primary);
        }
        body.light-theme .eq-msg-them {
          background: #ffffff;
        }
        .eq-msg-system {
          background: rgba(239, 68, 68, 0.08);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #fca5a5;
        }
        body.light-theme .eq-msg-system {
          color: #b91c1c;
          background: rgba(239, 68, 68, 0.05);
        }
        .eq-msg-typing {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border-color);
        }
        body.light-theme .eq-msg-typing {
          background: #ffffff;
        }
        .eq-choice-btn {
          background: rgba(255, 255, 255, 0.01) !important;
          border: 1px solid var(--border-color) !important;
          color: var(--text-primary) !important;
        }
        body.light-theme .eq-choice-btn {
          background: rgba(15, 23, 42, 0.03) !important;
          border-color: rgba(15, 23, 42, 0.08) !important;
        }
      `}</style>

      {/* 1. チュートリアル */}
      {gameStatus === 'tutorial' && (
        <div className="glass-panel fade-in" style={{ padding: '32px', textAlign: 'left', borderLeft: '4px solid var(--color-primary)' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-primary)', fontSize: '22px', display: 'flex', alignItems: 'center', gap: '8px', marginTop: 0 }}>
            <MessageSquare size={24} />
            EQ・共感対話スタイル診断
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6', margin: '16px 0 24px 0' }}>
            正論ハラスメントや認知のすれ違い（世代間バイアス）を回避し、共感関係を築く対話シミュレーターです。<br />
            深い悩みや葛藤を抱える相手の心情を汲み取り、もっとも信頼関係（Trust）を構築できる言葉を選びましょう。
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
            <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <strong style={{ fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                🔬 診断モジュールの特徴:
              </strong>
              <ul style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px', paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li><strong>最後まで対話を完遂</strong>: 信頼度が低くても途中で打ち切る（ゲームオーバー）ことはなく、必ず3ターンの対話を最後まで進行させて結果を分析します。</li>
                <li><strong>対話パターンの可視化</strong>: あなたが選んだセリフから「共感」「論理（正論）」「自分語り」の比率を測定します。</li>
                <li><strong>脳内元号バイアス判定</strong>: 会話の中で無意識に用いている「昭和的ルール押し付け」や「令和的タイパ至上主義」の歪みを可視化します。</li>
              </ul>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            <button onClick={onBack} className="btn btn-secondary" style={{ flex: 1 }}>ラボに戻る</button>
            <button onClick={startTraining} className="btn btn-primary" style={{ flex: 2, background: 'linear-gradient(135deg, var(--color-primary) 0%, #7c3aed 100%)', boxShadow: '0 4px 15px var(--color-primary-glow)' }}>
              <Play size={16} style={{ marginRight: '6px' }} />
              対話を始める
            </button>
          </div>
        </div>
      )}

      {/* 2. シナリオ選択画面 */}
      {gameStatus === 'select' && (
        <div className="glass-panel fade-in" style={{ padding: '32px', textAlign: 'left' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', marginTop: 0, marginBottom: '20px' }}>
            対話する相手を選択してください
          </h3>

          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '20px', 
            marginBottom: '32px',
            maxHeight: '440px', 
            overflowY: 'auto',
            paddingRight: '8px'
          }}>
            {scenarios.map((sc) => (
              <div 
                key={sc.id}
                onClick={() => handleSelectScenario(sc)}
                className="glass-panel hover-lift"
                style={{
                  padding: '24px',
                  borderRadius: '16px',
                  border: '1px solid var(--border-color)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '20px',
                  background: 'var(--glass-bg)'
                }}
              >
                <div style={{ fontSize: '40px', background: 'rgba(255,255,255,0.03)', width: '70px', height: '70px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-color)' }}>
                  {sc.avatar}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ fontSize: '17px', fontWeight: 'bold', margin: 0 }}>{sc.name}</h4>
                    <span style={{ fontSize: '11px', color: sc.initialEmotionColor, border: `1px solid ${sc.initialEmotionColor}`, padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                      初期感情: {sc.initialEmotion}
                    </span>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '6px', margin: 0, lineHeight: '1.4' }}>
                    {sc.initialDesc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <button onClick={() => setGameStatus('tutorial')} className="btn btn-secondary" style={{ width: '100%' }}>戻る</button>
        </div>
      )}

      {/* 3. シミュレーションチャット画面 */}
      {gameStatus === 'playing' && selectedScenario && (
        <div className="glass-panel fade-in" style={{ padding: '20px', position: 'relative' }}>
          
          {/* チャットヘッダー */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ position: 'relative' }}>
                <div 
                  className={`avatar-neon-ring ${shieldActive ? 'shield-on' : ''} ${shieldFlash ? 'shield-flash-anim' : ''} ${shieldBreak ? 'shield-break-anim' : ''}`} 
                  style={{ 
                    borderColor: shieldActive ? '#ef4444' : emotionColor,
                    boxShadow: shieldActive ? '0 0 15px rgba(239, 68, 68, 0.7)' : `0 0 15px ${emotionColor}60`
                  }}
                >
                  {selectedScenario.avatar}
                </div>
                {shieldActive && (
                  <div className="shield-overlay">
                    <div className="shield-grid" />
                    <span className="shield-tag">SHIELD ACTIVE</span>
                  </div>
                )}
              </div>
              <div style={{ textAlign: 'left' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: 0 }}>
                  {selectedScenario.name.split('（')[0]}
                </h3>
                <span style={{ fontSize: '11px', color: emotionColor, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                  感情ステート: 【{emotion}】
                </span>
              </div>
            </div>

            {/* 信頼度ゲージ */}
            <div style={{ width: '180px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', position: 'relative' }}>
              
              {/* 信頼度通知ポップアップ */}
              {trustChangeNotify && (
                <span className="notify-trust" style={{ color: trustChangeNotify.val === 'SHIELD BLOCK' ? '#ef4444' : (trustChangeNotify.isUp ? 'var(--color-emerald)' : '#ef4444') }}>
                  {trustChangeNotify.val === 'SHIELD BLOCK' ? '🛡️ SHIELD BLOCKED' : (trustChangeNotify.isUp ? `+${trustChangeNotify.val}% Trust` : `-${trustChangeNotify.val}% Trust`)}
                </span>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11.5px', fontWeight: 'bold', color: trust >= 75 ? 'var(--color-emerald)' : trust <= 40 ? '#ef4444' : 'var(--text-primary)', marginBottom: '4px' }}>
                <Smile size={13} style={{ color: trust >= 75 ? 'var(--color-emerald)' : trust <= 40 ? '#ef4444' : 'var(--text-muted)' }} />
                同調信頼度: {trust}%
              </div>
              <div className="trust-bar-outer">
                <div 
                  className="trust-bar-inner" 
                  style={{ 
                    width: `${trust}%`,
                    background: trust >= 75 
                      ? 'linear-gradient(90deg, var(--color-emerald), #059669)' 
                      : trust <= 40 
                        ? 'linear-gradient(90deg, #ef4444, #b91c1c)' 
                        : 'linear-gradient(90deg, var(--color-primary), #7c3aed)'
                  }} 
                />
              </div>
            </div>
          </div>

          {/* メッセンジャーチャットログ */}
          <div className="eq-chat-log">
            {chatLog.map((msg, index) => {
              const isMe = msg.sender === 'me';
              const isSystem = msg.sender === 'system';
              return (
                <div 
                  key={index}
                  className="fade-in"
                  style={{
                    display: 'flex',
                    justifyContent: isSystem ? 'center' : (isMe ? 'flex-end' : 'flex-start'),
                    width: '100%'
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', maxWidth: isSystem ? '100%' : '80%', alignItems: isSystem ? 'center' : (isMe ? 'flex-end' : 'flex-start') }}>
                    {!isSystem && (
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '2px', padding: '0 4px' }}>
                        {msg.speaker}
                      </span>
                    )}
                    <div 
                      className={isSystem ? 'eq-msg-system' : (isMe ? 'eq-msg-me' : 'eq-msg-them')}
                      style={{
                        padding: isSystem ? '8px 16px' : '10px 14px',
                        borderRadius: isSystem ? '8px' : '14px',
                        borderTopLeftRadius: isSystem ? '8px' : (isMe ? '14px' : '2px'),
                        borderTopRightRadius: isSystem ? '8px' : (isMe ? '2px' : '14px'),
                        fontSize: isSystem ? '12px' : '13.5px',
                        lineHeight: '1.45',
                        textAlign: isSystem ? 'center' : 'left'
                      }}
                    >
                      {msg.text}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* 入力中... */}
            {isTyping && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }} className="fade-in">
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '2px' }}>
                    入力中...
                  </span>
                  <div className="eq-msg-typing" style={{ padding: '10px 16px', borderRadius: '12px', borderTopLeftRadius: '2px', display: 'flex', gap: '3px', alignItems: 'center' }}>
                    <span className="dot-blink" />
                    <span className="dot-blink" />
                    <span className="dot-blink" />
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* 下部選択肢 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {!isAnswered && !isTyping && shuffledChoices.map((choice, idx) => (
              <button
                key={idx}
                onClick={() => handleAnswer(idx, choice)}
                className="btn btn-secondary eq-choice-btn"
                style={{
                  padding: '12px 16px',
                  borderRadius: '10px',
                  textAlign: 'left',
                  fontSize: '13px',
                  lineHeight: '1.4',
                  transition: 'all 0.2s',
                  display: 'flex',
                  gap: '8px'
                }}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', fontSize: '11px', fontWeight: 'bold', color: 'var(--text-secondary)', flexShrink: 0 }}>
                  {String.fromCharCode(65 + idx)}
                </span>
                <span>{choice.text}</span>
              </button>
            ))}
          </div>

        </div>
      )}

      {/* 4. 診断結果画面 */}
      {gameStatus === 'clear' && selectedScenario && (
        <div className="glass-panel fade-in" style={{ padding: '40px 32px', textAlign: 'center', borderLeft: '4px solid var(--color-emerald)' }}>
          <CheckCircle2 size={64} style={{ color: 'var(--color-emerald)', marginBottom: '20px', margin: '0 auto' }} />
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', margin: '16px 0 12px 0' }}>
            対話スタイル診断 完了
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14.5px', marginBottom: '24px', lineHeight: '1.5' }}>
            {selectedScenario.name.split('（')[0]}との会話データから、あなたの対話の傾聴クオリティと脳内バイアスを抽出しました。
          </p>

          {/* 対話スタイル判定 */}
          <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px', marginBottom: '28px', textAlign: 'left' }}>
            <span style={{ fontSize: '11px', color: 'var(--color-primary)', fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase' }}>コミュニケーション診断結果</span>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', margin: '6px 0 10px 0', color: 'var(--text-primary)' }}>{diagnosis.title}</h3>
            <p style={{ fontSize: '13px', lineHeight: '1.6', color: 'var(--text-secondary)', margin: 0 }}>{diagnosis.desc}</p>
          </div>

          {/* スタイル比率スタッツ */}
          <div style={{ background: 'rgba(255, 255, 255, 0.01)', border: '1px solid var(--border-color)', padding: '20px', borderRadius: '12px', marginBottom: '28px', textAlign: 'left' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'bold', display: 'block', marginBottom: '12px' }}>対話アクション比率</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                  <span>共感・受容 (Empathy)</span>
                  <span style={{ fontWeight: 'bold', color: 'var(--color-emerald)' }}>{empathyRate}%</span>
                </div>
                <div className="trust-bar-outer" style={{ height: '6px' }}>
                  <div className="trust-bar-inner" style={{ width: `${empathyRate}%`, background: 'var(--color-emerald)' }} />
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                  <span>正論・分析 (Logic)</span>
                  <span style={{ fontWeight: 'bold', color: 'var(--color-cyan)' }}>{logicRate}%</span>
                </div>
                <div className="trust-bar-outer" style={{ height: '6px' }}>
                  <div className="trust-bar-inner" style={{ width: `${logicRate}%`, background: 'var(--color-cyan)' }} />
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                  <span>自分語り・過去基準 (Self)</span>
                  <span style={{ fontWeight: 'bold', color: 'var(--color-amber)' }}>{selfRate}%</span>
                </div>
                <div className="trust-bar-outer" style={{ height: '6px' }}>
                  <div className="trust-bar-inner" style={{ width: `${selfRate}%`, background: 'var(--color-amber)' }} />
                </div>
              </div>
            </div>
          </div>

          {/* 脳内元号バイアス比率 */}
          {totalBiases > 0 && (
            <div style={{ background: 'rgba(255, 255, 255, 0.01)', border: '1px solid var(--border-color)', padding: '20px', borderRadius: '12px', marginBottom: '32px', textAlign: 'left' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'bold', display: 'block', marginBottom: '12px' }}>脳内元号バイアス比率（非共感アクション時）</span>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: 'var(--color-amber)', width: '60px', textAlign: 'right' }}>昭和脳 {showaRate}%</span>
                <div className="trust-bar-outer" style={{ flex: 1, height: '8px', background: 'var(--color-rose)' }}>
                  <div className="trust-bar-inner" style={{ width: `${showaRate}%`, background: 'var(--color-amber)' }} />
                </div>
                <span style={{ fontSize: '11px', color: 'var(--color-rose)', width: '60px', textAlign: 'left' }}>{reiwaRate}% 令和脳</span>
              </div>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginTop: '8px', textAlign: 'center' }}>
                （昭和脳: 経験・精神論の押し付け / 令和脳: システム・タイパによる割り切り）
              </span>
            </div>
          )}

          <div style={{ display: 'flex', gap: '32px', justifyContent: 'center', marginBottom: '32px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>最終獲得信頼度</div>
              <div style={{ fontSize: '32px', fontFamily: 'var(--font-display)', fontWeight: 'bold', color: trust >= 75 ? 'var(--color-emerald)' : '#ef4444', marginTop: '4px' }}>
                {trust}%
              </div>
            </div>
            <div style={{ borderLeft: '1px solid var(--border-color)' }}></div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>対話総合評価</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--text-primary)', marginTop: '14px' }}>
                {trust >= 90 ? '🏆 EQマスター' : trust >= 70 ? '🎯 寄り添い上手' : '🔬 要バグデバッグ'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
            <button onClick={() => setGameStatus('select')} className="btn btn-secondary">別のシナリオへ</button>
            <button 
              onClick={handleFinishGame} 
              className="btn btn-primary" 
              style={{ 
                padding: '12px 32px',
                background: 'linear-gradient(135deg, var(--color-primary) 0%, #7c3aed 100%)', 
                boxShadow: '0 4px 15px var(--color-primary-glow)' 
              }}
            >
              結果を記録してラボに戻る
              <ArrowRight size={16} style={{ marginLeft: '6px' }} />
            </button>
          </div>

          {/* 推奨デバッガー装備 */}
          <RecoveryGearSection />
        </div>
      )}

    </div>
  );
}
