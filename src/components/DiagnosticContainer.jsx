import React, { useState, useEffect } from "react";
import { diagnosticQuestions, determineDiagnosticType } from "../data/diagnosticData";
import { encodeState, decodeState, calculateFriction } from "../data/spellHelper";
import { KeyRound, Sparkles, Copy, Check } from "lucide-react";

export default function DiagnosticContainer({ onSelectGame, onSaveDiagnostic, myBrainCode, onUnlockType }) {
  const [step, setStep] = useState("start"); // start, quiz, analyzing, result
  const [targetType, setTargetType] = useState("self"); // self, spouse, boss, friend
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [scores, setScores] = useState({ L: 0, C: 0, R: 0, E: 0 });
  const [resultType, setResultType] = useState(null);
  const [scanMessageIndex, setScanMessageIndex] = useState(0);
  const [copiedCode, setCopiedCode] = useState(false);
  const [frictionResult, setFrictionResult] = useState(null);
  const [frictionError, setFrictionError] = useState("");
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [finalCalculatedScores, setFinalCalculatedScores] = useState(null);
  const [finalCalculatedType, setFinalCalculatedType] = useState(null);

  const scanMessages = [
    "🧠 脳内ログをスキャン中...",
    "🔍 前提バイアスのバグをチェック中...",
    "🌱 ロジックツリーの重複を検証中...",
    "⚡ 感情パルスのゆらぎを受信中...",
    "📄 思考パターンの診断書を書き出し中..."
  ];

  // Dynamic pronoun filter for 'Other Scanner' mode
  const getFilteredText = (text) => {
    if (targetType === "self") return text;
    
    const label = {
      spouse: "あの人（パートナー）",
      boss: "あの人（上司/部下）",
      friend: "あの人（友達）"
    }[targetType] || "あの人";

    return text
      .replace(/あなたの脳内での最初のリアクションは？/g, "あの人が最初に見せそうなリアクションは？")
      .replace(/あなたの対応は？/g, "あの人の対応は？")
      .replace(/あなたの脳内は？/g, "あの人の脳内はどうなっていそう？")
      .replace(/あなたならどう議論を進める？/g, "あの人ならどう議論を進めそう？")
      .replace(/あなたの行動は？/g, "あの人の行動は？")
      .replace(/あなたの反応は？/g, "あの人の反応は？")
      .replace(/あなたを劇的に変える/g, "あの人を劇的に変える")
      .replace(/どうする？/g, "あの人はどうする？")
      .replace(/私/g, label)
      .replace(/自分/g, label)
      .replace(/僕/g, label)
      .replace(/俺/g, label);
  };

  const getOpponentBrainCode = () => {
    if (!resultType) return "";
    
    const pL = getPercentage(scores.L);
    const pC = getPercentage(scores.C);
    const pR = getPercentage(scores.R);
    const pE = getPercentage(scores.E);

    const mockState = {
      level: 1,
      xp: 0,
      scores: {
        factsOpinions: pL,
        logicalValidity: pL,
        logicTree: pR,
        fallacy: pC,
        empathyDialogue: pE
      },
      badges: [false, false, false, false, false, false],
      diagnosticTypeId: resultType.id
    };

    return encodeState(mockState);
  };

  const handleCopyOpponentCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleDirectCheckFriction = () => {
    setFrictionError("");
    setFrictionResult(null);

    if (!myBrainCode) {
      setFrictionError("あなた自身のブレインコードが見つかりません。まずダッシュボードで診断を完了させてください。");
      return;
    }

    try {
      const codeOpponent = getOpponentBrainCode();
      const stateA = decodeState(myBrainCode);
      const stateB = decodeState(codeOpponent);
      const result = calculateFriction(stateA, stateB);
      setFrictionResult(result);
    } catch (err) {
      setFrictionError(err.message || "相性の計算に失敗しました。");
    }
  };

  // Effect for analyzing phase animation
  useEffect(() => {
    let interval;
    if (step === "analyzing" && finalCalculatedScores && finalCalculatedType) {
      interval = setInterval(() => {
        setScanMessageIndex((prev) => {
          if (prev >= scanMessages.length - 1) {
            clearInterval(interval);
            // Complete analysis animation, set pre-calculated results
            setScores(finalCalculatedScores);
            setResultType(finalCalculatedType);
            setStep("result");
            
            // 図鑑にタイプをアンロック追加
            if (onUnlockType) {
              onUnlockType(finalCalculatedType.id);
            }
            
            if (onSaveDiagnostic && targetType === "self") {
              onSaveDiagnostic(finalCalculatedScores, finalCalculatedType);
            }
            return prev;
          }
          return prev + 1;
        });
      }, 700);
    }
    return () => clearInterval(interval);
  }, [step, finalCalculatedScores, finalCalculatedType, targetType, onUnlockType, onSaveDiagnostic]);

  const shuffleArray = (array) => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  const handleStart = () => {
    const bizQs = diagnosticQuestions.filter(q => q.category === "business");
    const priQs = diagnosticQuestions.filter(q => q.category === "private");

    let subset = [];
    if (targetType === "boss") {
      subset = shuffleArray(bizQs).slice(0, 7);
    } else if (targetType === "spouse" || targetType === "friend") {
      subset = shuffleArray(priQs).slice(0, 7);
    } else {
      const selectedBiz = shuffleArray(bizQs).slice(0, 3);
      const selectedPri = shuffleArray(priQs).slice(0, 4);
      subset = shuffleArray([...selectedBiz, ...selectedPri]);
    }

    setSelectedQuestions(subset);
    setAnswers([]);
    setCurrentQuestionIndex(0);
    setScores({ L: 0, C: 0, R: 0, E: 0 });
    setStep("quiz");
  };

  const handleAnswer = (choice) => {
    const newAnswers = [...answers, choice.scores];
    setAnswers(newAnswers);

    if (currentQuestionIndex < selectedQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Calculate final scores synchronously upon the 7th (last) question to avoid React async state batching lag
      const total = { L: 0, C: 0, R: 0, E: 0 };
      newAnswers.forEach((ans) => {
        total.L += ans.L;
        total.C += ans.C;
        total.R += ans.R;
        total.E += ans.E;
      });
      
      const finalType = determineDiagnosticType(total);
      setFinalCalculatedScores(total);
      setFinalCalculatedType(finalType);

      // Move to analyzing
      setScanMessageIndex(0);
      setStep("analyzing");
    }
  };

  const calculateFinalScores = () => {
    const total = { L: 0, C: 0, R: 0, E: 0 };
    answers.forEach((ans) => {
      total.L += ans.L;
      total.C += ans.C;
      total.R += ans.R;
      total.E += ans.E;
    });
    return total;
  };

  const getPercentage = (score) => {
    // Max possible score for any parameter is 105 (7 questions * 15 points)
    return Math.round((score / 105) * 100);
  };

  const handleShare = () => {
    if (!resultType) return;

    const pL = getPercentage(scores.L);
    const pC = getPercentage(scores.C);
    const pR = getPercentage(scores.R);
    const pE = getPercentage(scores.E);

    const bar = (pct) => {
      const filled = Math.round(pct / 10);
      return "█".repeat(filled) + "░".repeat(10 - filled);
    };

    let shareText = "";
    if (targetType === "self") {
      shareText = `【LogiFit 思考スキャン診断】
私の愛すべき脳内バグは…
🧠 ${resultType.name} ${resultType.emoji}
～ ${resultType.tagline} ～

📊 思考力パラメーター：
・ロジカル　　　：${bar(pL)} ${pL}%
・クリティカル　：${bar(pC)} ${pC}%
・ラディカル　　：${bar(pR)} ${pR}%
・エモーショナル：${bar(pE)} ${pE}%

#LogiFit思考スキャン診断 #愛すべき脳内バグ #思考力パラメーター
https://www.logifit.site/`;
    } else {
      const targetLabel = {
        spouse: "パートナー",
        boss: "上司/部下",
        friend: "友達"
      }[targetType] || "あの人";

      let frictionSnippet = "";
      if (frictionResult) {
        frictionSnippet = `\n⚡ 私との「脳内摩擦係数」は【${frictionResult.friction}%】でした！\n関係性：【${frictionResult.pairName}】\n`;
      }

      shareText = `【LogiFit 他者脳内スキャン】
あの人の脳内バグをスキャンしました！
🧠 タイプ：${resultType.name} ${resultType.emoji}
～ ${resultType.tagline} ～
${frictionSnippet}
あの人の攻略トリセツと相性はこちら👇
#脳内摩擦係数 #取扱説明書 #思考力パラメーター #LogiFit
https://www.logifit.site/`;
    }

    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
    window.open(twitterUrl, "_blank");
  };

  // SVG Radar Chart Data calculation
  const centerX = 200;
  const centerY = 160;
  const maxRadius = 100;
  
  // Points based on score percentages (0-100)
  const getCoordinates = () => {
    const pL = getPercentage(scores.L);
    const pC = getPercentage(scores.C);
    const pR = getPercentage(scores.R);
    const pE = getPercentage(scores.E);

    // L: Up, C: Right, R: Down, E: Left
    return {
      logical: { x: centerX, y: centerY - (pL / 100) * maxRadius },
      critical: { x: centerX + (pC / 100) * maxRadius, y: centerY },
      radical: { x: centerX, y: centerY + (pR / 100) * maxRadius },
      emotional: { x: centerX - (pE / 100) * maxRadius, y: centerY }
    };
  };

  const coords = resultType ? getCoordinates() : null;
  const polygonPoints = coords 
    ? `${coords.logical.x},${coords.logical.y} ${coords.critical.x},${coords.critical.y} ${coords.radical.x},${coords.radical.y} ${coords.emotional.x},${coords.emotional.y}`
    : "";

  return (
    <div className="game-container fade-in">
      {/* START SCREEN */}
      {step === "start" && (
        <div className="glass-panel" style={{ padding: "40px", textAlign: "center", position: "relative", overflow: "hidden" }}>
          {/* Neon scan decorative effect */}
          <div className="scan-bg-glow"></div>
          
          <div style={{ marginBottom: "24px" }}>
            <span className="game-badge" style={{ background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.2)", color: "#10b981", padding: "6px 16px", borderRadius: "20px", fontSize: "14px", fontWeight: "bold" }}>
              NEW FEATURE
            </span>
          </div>

          <h1 className="text-glow" style={{ fontFamily: "var(--font-display)", fontSize: "36px", fontWeight: "800", marginBottom: "16px", color: "var(--text-primary)" }}>
            思考スキャン診断
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "16px", lineHeight: "1.6", maxWidth: "540px", margin: "0 auto 32px auto" }}>
            日常の判断や行動から、あなたの思考の「偏り（クセ）」をスキャンします。<br />
            事実分析、演繹・推論、戦略思考、構造化、批判思考のバランスを可視化し、あなたの思考タイプを診断！
          </p>

          {/* Brain SVG graphic with scan line effect */}
          <div style={{ position: "relative", width: "160px", height: "160px", margin: "0 auto 40px auto" }}>
            <svg viewBox="0 0 100 100" style={{ width: "100%", height: "100%" }}>
              <path 
                d="M 50 15 C 38 15, 30 23, 30 35 C 22 37, 18 45, 23 53 C 18 63, 23 73, 33 73 C 38 83, 48 85, 50 85 C 52 85, 62 83, 67 73 C 77 73, 82 63, 77 53 C 82 45, 78 37, 70 35 C 70 23, 62 15, 50 15 Z" 
                fill="none" 
                stroke="var(--color-cyan)" 
                strokeWidth="2" 
                strokeDasharray="4, 4"
                opacity="0.6"
              />
              <path 
                d="M 50 20 C 42 20, 35 25, 35 35 C 35 38, 32 40, 30 42 C 26 44, 25 50, 29 54 C 27 58, 28 64, 33 66 C 36 67, 38 70, 38 73 C 41 80, 48 80, 50 80 C 52 80, 59 80, 62 73 C 62 70, 64 67, 67 66 C 72 64, 73 58, 71 54 C 75 50, 74 44, 70 42 C 68 40, 65 38, 65 35 C 65 25, 58 20, 50 20 Z" 
                fill="rgba(6, 182, 212, 0.05)" 
                stroke="var(--color-primary)" 
                strokeWidth="2.5" 
              />
            </svg>
            <div className="scan-laser-line"></div>
          </div>

          {/* Target selector cards */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", maxWidth: "480px", margin: "0 auto 32px auto" }}>
            {[
              { id: "self", label: "自分をスキャン診断", emoji: "🧠" },
              { id: "spouse", label: "パートナーをスキャン", emoji: "💑" },
              { id: "boss", label: "上司/部下をスキャン", emoji: "👔" },
              { id: "friend", label: "友達をスキャン", emoji: "🎒" }
            ].map((t) => (
              <button
                key={t.id}
                className="btn"
                onClick={() => setTargetType(t.id)}
                style={{
                  padding: "16px 12px",
                  borderRadius: "12px",
                  fontSize: "14px",
                  fontWeight: "bold",
                  background: targetType === t.id ? "rgba(6, 182, 212, 0.15)" : "rgba(255,255,255,0.02)",
                  border: targetType === t.id ? "2px solid var(--color-cyan)" : "1px solid rgba(255,255,255,0.06)",
                  color: targetType === t.id ? "var(--color-cyan)" : "var(--text-secondary)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "8px",
                  cursor: "pointer",
                  transition: "all 0.2s ease"
                }}
              >
                <span style={{ fontSize: "24px" }}>{t.emoji}</span>
                {t.label}
              </button>
            ))}
          </div>

          <button className="btn btn-primary" onClick={handleStart} style={{ fontSize: "16px", padding: "14px 36px" }}>
            {targetType === "self" ? "思考スキャン診断をはじめる" : "あの人をスキャンする"}（全7問）
          </button>
        </div>
      )}

      {/* QUIZ STEP */}
      {step === "quiz" && (
        <div className="glass-panel" style={{ padding: "32px" }}>
          {/* Progress bar */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <span style={{ fontSize: "14px", color: "var(--text-muted)", fontWeight: "bold" }}>
              QUESTION {currentQuestionIndex + 1} OF 7
            </span>
            <span style={{ fontSize: "14px", color: "var(--color-primary)", fontWeight: "bold" }}>
              {Math.round(((currentQuestionIndex) / 7) * 100)}% Complete
            </span>
          </div>
          <div style={{ height: "6px", width: "100%", background: "var(--bg-inner-box)", borderRadius: "3px", marginBottom: "32px", overflow: "hidden" }}>
            <div 
              style={{ 
                height: "100%", 
                width: `${((currentQuestionIndex + 1) / 7) * 100}%`, 
                background: "linear-gradient(90deg, var(--color-cyan) 0%, var(--color-primary) 100%)", 
                borderRadius: "3px",
                transition: "width 0.3s ease" 
              }}
            />
          </div>

          {/* Scenario text */}
          <div style={{ background: "var(--bg-inner-box)", border: "1px solid var(--border-color)", padding: "24px", borderRadius: "12px", marginBottom: "28px" }}>
            <p style={{ fontSize: "18px", color: "var(--text-primary)", lineHeight: "1.6", fontWeight: "500" }}>
              {selectedQuestions[currentQuestionIndex] ? getFilteredText(selectedQuestions[currentQuestionIndex].scenario) : ""}
            </p>
          </div>

          {/* Choices list */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {selectedQuestions[currentQuestionIndex]?.choices.map((choice, idx) => (
              <button 
                key={idx} 
                className="btn btn-secondary" 
                onClick={() => handleAnswer(choice)}
                style={{ 
                  textAlign: "left", 
                  justifyContent: "flex-start", 
                  padding: "16px 20px", 
                  fontSize: "15px", 
                  lineHeight: "1.5",
                  borderRadius: "12px",
                  fontWeight: "normal"
                }}
              >
                <div style={{ display: "flex", gap: "12px", width: "100%" }}>
                  <span style={{ color: "var(--color-primary)", fontWeight: "bold" }}>
                    {String.fromCharCode(65 + idx)}.
                  </span>
                  <span style={{ color: "var(--text-primary)" }}>{getFilteredText(choice.text)}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ANALYZING STEP */}
      {step === "analyzing" && (
        <div className="glass-panel" style={{ padding: "60px 40px", textAlign: "center" }}>
          <div className="scanning-container" style={{ margin: "0 auto 32px auto", width: "80px", height: "80px", position: "relative" }}>
            <div className="scanning-spinner"></div>
          </div>
          <h2 style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)", fontSize: "20px", fontWeight: "bold" }}>
            {scanMessages[scanMessageIndex]}
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: "14px", marginTop: "12px" }}>
            あなたの回答から思考バランスを組み立てています...
          </p>
        </div>
      )}

      {/* RESULT SCREEN */}
      {step === "result" && resultType && (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Main Card */}
          <div className="glass-panel" style={{ padding: "40px" }}>
            <div style={{ textAlign: "center", marginBottom: "32px" }}>
              <div style={{ fontSize: "64px", marginBottom: "16px" }}>{resultType.emoji}</div>
              <span style={{ fontSize: "13px", color: "var(--color-cyan)", border: "1px solid var(--color-cyan-glow)", background: "rgba(6, 182, 212, 0.05)", padding: "4px 12px", borderRadius: "12px", textTransform: "uppercase", fontWeight: "bold", letterSpacing: "1px" }}>
                診断結果
              </span>
              <h2 className="text-glow" style={{ fontFamily: "var(--font-display)", fontSize: "32px", fontWeight: "800", marginTop: "12px", color: "var(--text-primary)" }}>
                {resultType.name}
              </h2>
              <p style={{ color: "var(--color-primary)", fontWeight: "bold", fontSize: "15px", marginTop: "4px" }}>
                {resultType.tagline}
              </p>
            </div>

            {/* 上部セクション：レーダーチャート（左）と概要解説文（右）の2カラム構成 */}
            <div className="diagnostic-main-section">
              {/* レーダーチャート */}
              <div className="diagnostic-chart-container">
                <svg viewBox="0 0 400 320" style={{ width: "100%", height: "100%", overflow: "visible" }}>
                  {/* Outer boundaries (hishigata) */}
                  {[25, 50, 75, 100].map((val) => {
                    const r = (val / 100) * maxRadius;
                    return (
                      <polygon 
                        key={val}
                        points={`${centerX},${centerY - r} ${centerX + r},${centerY} ${centerX},${centerY + r} ${centerX - r},${centerY}`}
                        fill="none"
                        stroke="rgba(255, 255, 255, 0.06)"
                        strokeWidth="1"
                      />
                    );
                  })}

                  {/* Cross Axes */}
                  <line x1={centerX} y1={centerY - maxRadius} x2={centerX} y2={centerY + maxRadius} stroke="rgba(255, 255, 255, 0.12)" strokeDasharray="3,3" />
                  <line x1={centerX - maxRadius} y1={centerY} x2={centerX + maxRadius} y2={centerY} stroke="rgba(255, 255, 255, 0.12)" strokeDasharray="3,3" />

                  {/* Axis labels */}
                  <text x={centerX} y={centerY - maxRadius - 12} textAnchor="middle" fill="#8b5cf6" fontSize="12" fontWeight="bold" fontFamily="var(--font-display)">ロジカル</text>
                  <text x={centerX + maxRadius + 10} y={centerY + 4} textAnchor="start" fill="#f43f5e" fontSize="12" fontWeight="bold" fontFamily="var(--font-display)">クリティカル</text>
                  <text x={centerX} y={centerY + maxRadius + 22} textAnchor="middle" fill="#f59e0b" fontSize="12" fontWeight="bold" fontFamily="var(--font-display)">ラディカル</text>
                  <text x={centerX - maxRadius - 10} y={centerY + 4} textAnchor="end" fill="#06b6d4" fontSize="12" fontWeight="bold" fontFamily="var(--font-display)">エモーショナル</text>

                  {/* The actual data shape */}
                  {coords && (
                    <>
                      <defs>
                        <radialGradient id="chartGrad" cx="50%" cy="50%" r="50%">
                          <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.1" />
                          <stop offset="100%" stopColor="#10b981" stopOpacity="0.4" />
                        </radialGradient>
                      </defs>
                      <polygon 
                        points={polygonPoints} 
                        fill="url(#chartGrad)" 
                        stroke="#10b981" 
                        strokeWidth="3" 
                        strokeLinejoin="round"
                        className="radar-poly-anim"
                      />
                      {/* Vertex circles */}
                      <circle cx={coords.logical.x} cy={coords.logical.y} r="5" fill="#8b5cf6" stroke="white" strokeWidth="1.5" />
                      <circle cx={coords.critical.x} cy={coords.critical.y} r="5" fill="#f43f5e" stroke="white" strokeWidth="1.5" />
                      <circle cx={coords.radical.x} cy={coords.radical.y} r="5" fill="#f59e0b" stroke="white" strokeWidth="1.5" />
                      <circle cx={coords.emotional.x} cy={coords.emotional.y} r="5" fill="#06b6d4" stroke="white" strokeWidth="1.5" />
                    </>
                  )}
                </svg>
              </div>

              {/* 右側：メイン説明文（フォント・行間をPCでより美しく） */}
              <div className="diagnostic-desc-container">
                <p style={{ fontSize: "16px", lineHeight: "1.8", color: "var(--text-secondary)", margin: 0, letterSpacing: "0.03em" }}>
                  {resultType.description}
                </p>
              </div>
            </div>

            {/* 中部セクション：3大バグ（横幅いっぱいに3列並列。文字が潰れず非常に読みやすい） */}
            <div className="diagnostic-traits-section">
              <h3 style={{ fontSize: "18px", color: "var(--text-primary)", fontWeight: "bold", marginBottom: "20px", textAlign: "left", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "10px" }}>
                🚫 {targetType === "self" ? "あなたの脳内に潜む3大バグ" : "あの人の脳内に潜む3大バグ"}
              </h3>
              <div className="diagnostic-traits-grid">
                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", padding: "24px", borderRadius: "14px", textAlign: "left" }}>
                  <h4 style={{ color: "var(--color-cyan)", fontSize: "15px", fontWeight: "bold", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                    💼 {targetType === "self" ? "仕事でのバグ" : "あの人の仕事でのバグ"}
                  </h4>
                  <p style={{ fontSize: "14px", lineHeight: "1.6", color: "var(--text-secondary)", margin: 0 }}>
                    {resultType.workBug}
                  </p>
                </div>
                
                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", padding: "24px", borderRadius: "14px", textAlign: "left" }}>
                  <h4 style={{ color: "#f43f5e", fontSize: "15px", fontWeight: "bold", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                    🏡 {targetType === "self" ? "私生活でのバグ" : "あの人の私生活でのバグ"}
                  </h4>
                  <p style={{ fontSize: "14px", lineHeight: "1.6", color: "var(--text-secondary)", margin: 0 }}>
                    {resultType.privateBug}
                  </p>
                </div>

                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", padding: "24px", borderRadius: "14px", textAlign: "left" }}>
                  <h4 style={{ color: "#f59e0b", fontSize: "15px", fontWeight: "bold", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                    ⚡ {targetType === "self" ? "ふとした瞬間のクセ" : "あの人のふとした瞬間のクセ"}
                  </h4>
                  <p style={{ fontSize: "14px", lineHeight: "1.6", color: "var(--text-secondary)", margin: 0 }}>
                    {resultType.dailyHabit}
                  </p>
                </div>
              </div>
            </div>

            {/* 下部セクション：取扱説明書（トリセツ） */}
            <div className="diagnostic-torisetsu-section">
              <div style={{ background: "rgba(16, 185, 129, 0.03)", border: "1px solid rgba(16, 185, 129, 0.15)", padding: "28px", borderRadius: "16px", textAlign: "left" }}>
                <h4 style={{ color: "#10b981", fontSize: "16px", fontWeight: "bold", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
                  📋 {targetType === "self" ? "あなたの取扱説明書" : "あの人の取扱説明書"}
                </h4>
                <div className="diagnostic-torisetsu-grid">
                  <div>
                    <span style={{ color: "#f43f5e", fontWeight: "bold", fontSize: "14px", display: "block", marginBottom: "6px" }}>● 地雷ポイント（フリーズワード）</span>
                    <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "13.5px", lineHeight: "1.6" }}>{resultType.torisetsu.jealousPoint}</p>
                  </div>
                  <div>
                    <span style={{ color: "#10b981", fontWeight: "bold", fontSize: "14px", display: "block", marginBottom: "6px" }}>● デバッグコマンド（対処法）</span>
                    <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "13.5px", lineHeight: "1.6" }}>{resultType.torisetsu.debugSpell}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 下部セクション：取扱説明書（トリセツ） */}
            <div className="diagnostic-torisetsu-section">
              <div style={{ background: "rgba(16, 185, 129, 0.03)", border: "1px solid rgba(16, 185, 129, 0.15)", padding: "28px", borderRadius: "16px", textAlign: "left" }}>
                <h4 style={{ color: "#10b981", fontSize: "16px", fontWeight: "bold", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
                  📋 {targetType === "self" ? "あなたの取扱説明書" : "あの人の取扱説明書"}
                </h4>
                <div className="diagnostic-torisetsu-grid">
                  <div>
                    <span style={{ color: "#f43f5e", fontWeight: "bold", fontSize: "14px", display: "block", marginBottom: "6px" }}>● 地雷ポイント（フリーズワード）</span>
                    <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "13.5px", lineHeight: "1.6" }}>{resultType.torisetsu.jealousPoint}</p>
                  </div>
                  <div>
                    <span style={{ color: "#10b981", fontWeight: "bold", fontSize: "14px", display: "block", marginBottom: "6px" }}>● デバッグコマンド（対処法）</span>
                    <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "13.5px", lineHeight: "1.6" }}>{resultType.torisetsu.debugSpell}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* あの人のブレインコード払い出し ＆ ダイレクト相性チェック (他者スキャン時のみ表示) */}
            {targetType !== "self" && (
              <div 
                style={{ 
                  display: "flex", 
                  flexDirection: "column", 
                  gap: "20px", 
                  marginTop: "20px" 
                }}
              >
                {/* 相手のブレインコード表示＆コピー */}
                <div 
                  className="glass-panel" 
                  style={{ 
                    padding: "24px", 
                    border: "1px solid var(--color-cyan-glow)", 
                    background: "rgba(6, 182, 212, 0.02)", 
                    textAlign: "left" 
                  }}
                >
                  <h4 style={{ fontSize: "15px", fontWeight: "bold", color: "var(--text-primary)", marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <KeyRound size={18} style={{ color: 'var(--color-cyan)' }} />
                    あの人のブレインコードが生成されました！
                  </h4>
                  <p style={{ color: "var(--text-secondary)", fontSize: "12.5px", lineHeight: "1.4", marginBottom: "16px" }}>
                    このコードをコピーして共有するか、トップページの相性チェッカーに入力して使用できます。
                  </p>
                  
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input 
                      type="text" 
                      readOnly 
                      value={getOpponentBrainCode()} 
                      style={{ 
                        flex: 1, 
                        background: 'rgba(255,255,255,0.02)', 
                        border: '1px solid var(--border-color)', 
                        borderRadius: '8px', 
                        padding: '10px 14px', 
                        color: 'var(--color-cyan)', 
                        fontFamily: 'var(--font-display)', 
                        fontSize: '15px', 
                        fontWeight: 'bold', 
                        outline: 'none',
                        letterSpacing: '1px'
                      }}
                    />
                    <button 
                      type="button" 
                      onClick={() => handleCopyOpponentCode(getOpponentBrainCode())}
                      className="btn btn-secondary" 
                      style={{ padding: '8px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', minWidth: '120px' }}
                    >
                      {copiedCode ? <Check size={14} style={{ color: "var(--color-emerald)" }} /> : <Copy size={14} />}
                      <span>{copiedCode ? "コピー完了" : "コードコピー"}</span>
                    </button>
                  </div>
                </div>

                {/* 自分とのダイレクト相性チェック */}
                <div 
                  className="glass-panel" 
                  style={{ 
                    padding: "24px", 
                    border: "1px solid var(--color-primary)", 
                    background: "rgba(139, 92, 246, 0.02)", 
                    textAlign: "left" 
                  }}
                >
                  <h4 style={{ fontSize: "15px", fontWeight: "bold", color: "var(--text-primary)", marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <Sparkles size={18} style={{ color: 'var(--color-primary)' }} />
                    あなたとの脳内摩擦（相性）を測定する
                  </h4>
                  <p style={{ color: "var(--text-secondary)", fontSize: "12.5px", lineHeight: "1.4", marginBottom: "16px" }}>
                    あなたのブレインコードと噛み合わせて、お互いの思考の摩擦係数をその場で即座に算出します。
                  </p>

                  {!frictionResult ? (
                    <button 
                      type="button" 
                      onClick={handleDirectCheckFriction}
                      className="btn btn-primary"
                      style={{ 
                        width: '100%', 
                        background: 'linear-gradient(135deg, var(--color-primary) 0%, #7c3aed 100%)', 
                        padding: '12px 0', 
                        fontSize: '14px', 
                        borderRadius: '8px' 
                      }}
                    >
                      ⚡ あなたとの摩擦係数をその場で測定する
                    </button>
                  ) : (
                    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(139, 92, 246, 0.15)', padding: '20px', borderRadius: '12px', animation: 'fadeIn 0.3s ease' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <span style={{ fontSize: '13px', color: 'var(--color-primary)', fontWeight: 'bold' }}>関係性：{frictionResult.pairName}</span>
                        <span style={{ fontSize: '20px', color: '#ff4d4d', fontWeight: 'bold', textShadow: '0 0 8px rgba(255, 77, 77, 0.4)' }}>
                          摩擦係数 {frictionResult.friction}%
                        </span>
                      </div>
                      
                      {/* Friction meter bar */}
                      <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden', marginBottom: '16px' }}>
                        <div 
                          style={{ 
                            height: '100%', 
                            width: `${frictionResult.friction}%`, 
                            background: 'linear-gradient(90deg, #10b981 0%, #ff9f0a 50%, #ff4d4d 100%)',
                            borderRadius: '4px',
                            transition: 'width 0.5s ease'
                          }}
                        />
                      </div>

                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6', margin: '0 0 16px 0' }}>
                        {frictionResult.description}
                      </p>

                      <div style={{ background: 'rgba(16, 185, 129, 0.03)', border: '1px solid rgba(16, 185, 129, 0.1)', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
                        <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>💡 二人のデバッグアドバイス</span>
                        <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{frictionResult.advice}</p>
                      </div>

                      <button 
                        type="button"
                        onClick={() => {
                          const targetLabel = {
                            spouse: "パートナー",
                            boss: "上司/部下",
                            friend: "友達"
                          }[targetType] || "あの人";

                          const text = `⚡ ${targetLabel}との「脳内摩擦係数」をスキャンしました！\n結果：【${frictionResult.pairName}】\n摩擦係数：【${frictionResult.friction}%】\n\n診断＆相性チェックはこちら👇\n#脳内摩擦係数 #思考スキャン診断 #ブレインコード #LogiFit`;
                          const appUrl = 'https://www.logifit.site/';
                          const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(appUrl)}`;
                          window.open(shareUrl, '_blank', 'noopener,noreferrer');
                        }}
                        className="btn btn-secondary"
                        style={{ width: '100%', fontSize: '13px', gap: '6px', background: 'white', color: 'black', fontWeight: 'bold' }}
                      >
                        𝕏 に相性結果をシェアする
                      </button>
                    </div>
                  )}

                  {frictionError && (
                    <p style={{ color: 'var(--color-rose)', fontSize: '12px', textAlign: 'center', margin: '12px 0 0 0' }}>
                      ❌ {frictionError}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Post on X Button */}
            <button 
              className="btn btn-primary" 
              onClick={handleShare}
              style={{ width: "100%", background: "white", color: "black", border: "1px solid transparent", boxShadow: "0 4px 15px rgba(255,255,255,0.1)", fontSize: "15px", gap: "8px", padding: "14px 20px", marginTop: "16px" }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              {targetType === "self" ? "診断結果をXにポストする" : "あの人のトリセツをXにポストする"}
            </button>
          </div>

          {/* 脳内デバッグロードマップ */}
          <div className="glass-panel" style={{ padding: "32px", border: "1px solid var(--color-cyan-glow)", background: "rgba(6, 182, 212, 0.01)" }}>
            <h3 style={{ fontSize: "18px", color: "var(--color-cyan)", fontWeight: "bold", marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
              🧠 脳内デバッグ・学習ロードマップ
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "13px", lineHeight: "1.5", marginBottom: "24px" }}>
              あなたの診断結果に基づいた推奨学習ルートです。まずはLogiFitで基礎を鍛え、さらに深めたい場合は専門特化アプリへ進みましょう。
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "20px", textAlign: "left" }}>
              {/* 1. ロジカル思考 */}
              <div style={{ borderLeft: "4px solid var(--color-cyan)", paddingLeft: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", flexWrap: "wrap", gap: "8px" }}>
                  <strong style={{ fontSize: "15px", color: "var(--text-primary)" }}>1. ロジカル思考（事実と論理の整理）</strong>
                  <span style={{ fontSize: "12px", color: "var(--text-secondary)", background: "var(--bg-inner-box)", padding: "2px 8px", borderRadius: "10px" }}>
                    スコア: {getPercentage(scores.L)}% {getPercentage(scores.L) < 40 && <span style={{ color: "#06b6d4", fontWeight: "bold" }}>⚠️ 要デバッグ</span>}
                  </span>
                </div>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <button className="btn btn-secondary" onClick={() => onSelectGame('factsOpinions')} style={{ padding: "8px 16px", fontSize: "12px", borderRadius: "8px" }}>
                    🎯 基礎：事実 vs 意見
                  </button>
                  <button className="btn btn-secondary" onClick={() => onSelectGame('logicalValidity')} style={{ padding: "8px 16px", fontSize: "12px", borderRadius: "8px" }}>
                    🎯 基礎：論理の妥当性
                  </button>
                </div>
              </div>

              {/* 2. クリティカル思考 */}
              <div style={{ borderLeft: "4px solid var(--color-rose)", paddingLeft: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", flexWrap: "wrap", gap: "8px" }}>
                  <strong style={{ fontSize: "15px", color: "var(--text-primary)" }}>2. クリティカル思考（前提とバイアスの検証）</strong>
                  <span style={{ fontSize: "12px", color: "var(--text-secondary)", background: "var(--bg-inner-box)", padding: "2px 8px", borderRadius: "10px" }}>
                    スコア: {getPercentage(scores.C)}% {getPercentage(scores.C) < 40 && <span style={{ color: "var(--color-rose)", fontWeight: "bold" }}>⚠️ 要デバッグ</span>}
                  </span>
                </div>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
                  <button className="btn btn-secondary" onClick={() => onSelectGame('fallacy')} style={{ padding: "8px 16px", fontSize: "12px", borderRadius: "8px" }}>
                    🎯 基礎：論理的誤謬の特定
                  </button>
                </div>
              </div>

              {/* 3. ラディカル思考 */}
              <div style={{ borderLeft: "4px solid var(--color-amber)", paddingLeft: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", flexWrap: "wrap", gap: "8px" }}>
                  <strong style={{ fontSize: "15px", color: "var(--text-primary)" }}>3. ラディカル思考（本質と目的の深掘り）</strong>
                  <span style={{ fontSize: "12px", color: "var(--text-secondary)", background: "var(--bg-inner-box)", padding: "2px 8px", borderRadius: "10px" }}>
                    スコア: {getPercentage(scores.R)}% {getPercentage(scores.R) < 40 && <span style={{ color: "var(--color-amber)", fontWeight: "bold" }}>⚠️ 要デバッグ</span>}
                  </span>
                </div>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
                  <button className="btn btn-secondary" onClick={() => onSelectGame('logicTree')} style={{ padding: "8px 16px", fontSize: "12px", borderRadius: "8px" }}>
                    🎯 基礎：ロジックツリー
                  </button>
                </div>
              </div>

              {/* 4. エモーショナル */}
              <div style={{ borderLeft: "4px solid var(--color-primary)", paddingLeft: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", flexWrap: "wrap", gap: "8px" }}>
                  <strong style={{ fontSize: "15px", color: "var(--text-primary)" }}>4. エモーショナル（直感と感情の調和）</strong>
                  <span style={{ fontSize: "12px", color: "var(--text-secondary)", background: "var(--bg-inner-box)", padding: "2px 8px", borderRadius: "10px" }}>
                    スコア: {getPercentage(scores.E)}% {getPercentage(scores.E) < 40 && <span style={{ color: "var(--color-primary)", fontWeight: "bold" }}>⚠️ 要デバッグ</span>}
                  </span>
                </div>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
                  <button className="btn btn-secondary" onClick={() => onSelectGame('empathyDialogue')} style={{ padding: "8px 16px", fontSize: "12px", borderRadius: "8px" }}>
                    🎯 基礎：共感対話トレーニング
                  </button>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginTop: "32px" }}>
              <button 
                className="btn btn-primary" 
                onClick={() => {
                  onSelectGame(resultType.recommendedGame);
                }}
                style={{ flex: 1, minWidth: "200px" }}
              >
                おすすめトレーニングを開始する
              </button>
              <button 
                className="btn btn-secondary" 
                onClick={() => onSelectGame(null)}
                style={{ flex: 0.5, minWidth: "120px" }}
              >
                ← ダッシュボードに戻る
              </button>
              <button 
                className="btn btn-secondary" 
                onClick={handleStart}
                style={{ flex: 0.5, minWidth: "120px" }}
              >
                もう一度診断する
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
