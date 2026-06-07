---
title: "Reactアプリに「楽天アフィリエイト」と「𝕏自動シェア」を10分で組み込み、マネタイズの土台を作った方法"
emoji: "💰"
type: "tech"
topics: ["react", "affiliate", "個人開発", "marketing", "web"]
published: true
---

## ■ はじめに：PVはある、機能もある。だが「売上」はない。

前回の記事では、50代コールセンター管理職の私が、AI部下（Antigravity）にコキ使われながら論理的思考トレーニングツール「[LogicaFit](https://www.logicafit.site/)」を爆速で開発・リリースした過程を書いた。

おかげさまで多くの反響をいただいた。だが、ある深刻な事実に気づく。

**「PVはあるのに、売上が1円もない」**

当たり前だ。課金機能もなければ広告もない。完全無料でログインも不要なLocalStorage完結型SPAなのだから。
だが、このままだとドメイン代（年額数千円）で赤字である。お小遣い制の50代会社員にとって、これは死活問題だ。

「よし、マネタイズの土台を作ろう」

そう決意した私に、AI部下は冷徹に言った。
「AdSenseの審査を待つのは時間の無駄です。静的SPAなら、**楽天アフィリエイトの推薦枠**と、ユーザーが勝手に広めてくれる**𝕏（旧Twitter）のバイラルループ**を今すぐ仕込みましょう。10分で終わります」

今回は、React（Vite）アプリでアフィリエイトと𝕏シェアを「手抜きかつエレガント」に実装した技術的なTIPSを共有する。

---

## ■ TIPS 1：Reactで楽天アフィリエイトウィジェットを動かす「srcDoc」ハック

通常、楽天アフィリエイトのウィジェットコードは、以下のような生の `<script>` タグの塊として提供される。

```html
<script type="text/javascript">
  rakuten_design="slide";
  rakuten_affiliateId="あなたのID";
  // ...省略
</script>
<script type="text/javascript" src="https://xml.affiliate.rakuten.co.jp/..."></script>
```

これをそのままReactのJSXに貼り付けても動かない。Reactのコンポーネントマウント時にはスクリプトタグが評価されないためだ。
`dangerouslySetInnerHTML` や動的な `document.createElement('script')` を使う方法もあるが、外部スクリプトの実行タイミングやスタイル汚染が非常に面倒である。

そこで、AI部下が提案してきたのが**「`iframe` の `srcDoc` 属性」にHTMLごと流し込むハック**だ。

### 実装したReactコンポーネント

```jsx
import React from 'react';

export default function RakutenWidget({ size = '300x160', ts = '1716892518451' }) {
  const [width, height] = size.split('x');

  // iframe内で動かす自己完結したHTML
  const iframeHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { 
          margin: 0; 
          padding: 0; 
          overflow: hidden; 
          background: transparent; 
          display: flex;
          justify-content: center;
          align-items: center;
        }
      </style>
    </head>
    <body>
      <script type="text/javascript">
        rakuten_design="slide";
        rakuten_affiliateId="あなたの楽天アフィリエイトID";
        rakuten_items="ctsmatch"; // 閲覧履歴やコンテンツにマッチする商品を自動表示
        rakuten_genreId="0";
        rakuten_size="${size}";
        rakuten_target="_blank";
        rakuten_theme="gray";
        rakuten_border="off";
        rakuten_auto_mode="on";
        rakuten_genre_title="off";
        rakuten_recommend="on";
        rakuten_ts="${ts}";
      </script>
      <script type="text/javascript" src="https://xml.affiliate.rakuten.co.jp/widget/js/rakuten_widget.js?20230106"></script>
    </body>
    </html>
  `.trim();

  return (
    <div style={{ display: 'flex', justifyContent: 'center', margin: '24px 0', width: '100%' }}>
      <div style={{
        display: 'inline-block',
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        padding: '8px',
        maxWidth: '100%',
        boxSizing: 'border-box'
      }}>
        <iframe
          title={`rakuten-widget-${size}`}
          srcDoc={iframeHtml}
          width={width}
          height={height}
          style={{ border: 'none', background: 'transparent', maxWidth: '100%' }}
          scrolling="no"
        />
      </div>
    </div>
  );
}
```

### なぜこの実装が良いのか？
1. **安全なサンドボックス化**: 外部広告スクリプトがReactのVirtual DOMやCSSグローバルスタイルと衝突しない。
2. **高速マウント**: ページ遷移時にAdウィジェットがチラつくことなく、iframeのsrcDocとして一瞬で表示される。
3. **レスポンシブ対応**: 親コンポーネント側で `maxWidth: 100%` を効かせているため、スマートフォンなどの狭い画面でもウィジェットがはみ出さない。

これをトレーニングクリア結果画面（ユーザーの満足度や感情が最も高まる瞬間）の直下に `<RakutenWidget />` と差し込むだけで、マネタイズの窓口が開通する。

---

## ■ TIPS 2：思わずポストしたくなる「自虐と自慢のギャップ」𝕏シェア機能

アフィリエイトリンクを置くだけでは誰も来ない。ユーザーが自発的に宣伝してくれるバイラルループが必須だ。
「クリアしました！」という平凡なメッセージでは𝕏のタイムラインでスルーされる。

人間がSNSでシェアしたくなる動機は、突き詰めると以下の2つしかない。
1. **自慢**: 「私はこんなに優秀です」と承認欲求を満たしたい。
2. **自虐**: 「こんなバカなミスをした」と笑いや共感を取りたい。

そこで、ゲームのクリアスコア（正解率や最終ステータス）に応じて、生成するシェアテキストを動的に3分岐させた。

### 動的テキスト生成と𝕏シェアロジック

```javascript
const handleShareToX = (score, totalQuestions, diagnosisTitle) => {
  const finalPercent = Math.round((score / totalQuestions) * 100);
  
  let rank = "";
  let description = "";

  // スコアに応じた「自慢」と「自虐」の判定
  if (finalPercent === 100) {
    rank = "【論理マスター 🏆】";
    description = "すべての思考バイアスを見抜き、カエル分析官から最高難度のバッジを授与されました！";
  } else if (finalPercent >= 80) {
    rank = "【冷静なアナリスト 🎯】";
    description = "高い論理的思考力を証明しましたが、まだわずかに認知の隙があるようです。";
  } else {
    rank = "【一般脳（要リハビリ） ⚠️】";
    description = "巧妙な詭弁と認知バイアスに脳がフリーズ！脳内デバッグの継続を強く推奨します。";
  }

  // ポスト本文の作成
  const text = `🎯 思考の筋トレ「LogicaFit」で診断完了！
種目：詭弁ハンター（上級）
スコア：${finalPercent}% (${score} / ${totalQuestions} 問正解)
判定：${diagnosisTitle} ${rank}

${description}
あなたは巧妙な認知の歪みを見抜けますか？

#LogicaFit #ロジカフィット #個人開発`;

  // 𝕏インテント用のURLを構築して新規タブで開く
  const appUrl = 'https://www.logicafit.site/';
  const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(appUrl)}`;
  window.open(shareUrl, '_blank', 'noopener,noreferrer');
};
```

### こだわったポイント
* **改行の活用**: 𝕏のタイムラインで文字が潰れて見づらくならないよう、適度に `\n` で改行を入れて視認性を確保。
* **URLの分離パラメータ**: `text` 内にURLをベタ書きするのではなく、`url` パラメータとしてアプリのアドレスを渡すことで、𝕏上でOGP（リンクプレビュー画像）が正しくカード形式で大きく表示されるようにしている。

---

## ■ まとめ：個人開発者は「作ること」と同じくらい「繋ぐこと」に注力すべき

今回のアフィリエイト推薦と𝕏シェアボタンの統合は、全13ゲーム（ラボゲーム含む）への展開を含めても、AI部下とのペアプロで本当に10分程度で実装が完了した。

個人開発（特にSPA）を始めると、つい「バックエンドはどうしよう」「認証機能はAuth0にするか」といった重厚長大なインフラの構築に目が向きがちだ。
しかし、お小遣い稼ぎや生存戦略としての個人開発であれば、

1. **データ保存は LocalStorage で割り切る**
2. **アフィリエイトは `iframe srcDoc` でサクッと貼る**
3. **集客は𝕏インテントのパラメータ設計に命をかける**

これだけの「手抜き」で、十分に機能するビジネスの土台は立ち上がる。

私が老眼鏡の位置を調整し終えたときには、AI部下はすでにこれらのコードをGitHubへコミットし、Vercel経由でのデプロイ（本番公開）まで完了させていた。

「オーナー、これでドメイン代の赤字は回避できる算段です。次はさらにユーザーがのめり込む機能を追加しましょう」

そう告げるAI部下の顔は（画面のターミナル越しだが）一切の妥協を許さない光を放っていた。
50代会社員の脳内デバッグと、ツールを通じたリハビリの日々は、まだまだ終わる気配がない。

*   **今回実装したアフィリエイト＆シェア機能を体験できる場所**: [LogicaFit｜論理的思考のフィットネス](https://www.logicafit.site/)
