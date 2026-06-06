import React, { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, Plus, Search, Download, Upload, Trash2, 
  AlertCircle, CheckCircle, Brain, Clock, Sparkles, 
  BarChart2, ArrowLeft, Check, Edit3, HelpCircle 
} from 'lucide-react';

const BIAS_RULES = [
  {
    id: 'allOrNothing',
    name: '白黒思考 (All-or-Nothing)',
    regex: /(絶対に|必ず|100%|完璧に|完全に|すべて|全部|一回も|一度も)/,
    description: '物事を極端な二者択一で捉えています。白黒の間にあるグラデーションを探してみましょう。'
  },
  {
    id: 'mindReading',
    name: '心の読みすぎ (Mind Reading)',
    regex: /(嫌われた|怒って|ムカついて|どうせ|冷たい|避けて|見下して|悪口|嫌い)/,
    description: '証拠がないのに、相手が自分を否定的に考えていると決めつけています。事実を確認しましょう。'
  },
  {
    id: 'overgeneralization',
    name: '過度の一般化 (Overgeneralization)',
    regex: /(いつも|いつも通り|毎回|どうせ|また|全員|誰も)/,
    description: '一度の出来事をすべての状況に当てはめています。今回の出来事と一般論を切り分けましょう。'
  },
  {
    id: 'shouldStatements',
    name: 'すべき思考 (Should Statements)',
    regex: /(すべき|しなければ|ならない|絶対に〜なきゃ|義務|当たり前)/,
    description: '厳格なルールを自分や他者に課して焦りを生んでいます。「〜の方が望ましい」と言い換えてみましょう。'
  },
  {
    id: 'catastrophizing',
    name: '破滅化・悲観主義 (Catastrophizing)',
    regex: /(最悪だ|終わりだ|ダメだ|破滅だ|無理だ|二度と)/,
    description: '最悪のシナリオが必ず起きると信じています。現実的な確率をもう一度冷静に見積もりましょう。'
  }
];

const VIBE_DATA = {
  anxious: { label: '思考ノイズ（不安・懸念）', emoji: '🌀', themeColor: '#06b6d4', glowColor: 'rgba(6, 182, 212, 0.3)', question: '今、どんな懸念がありますか？「もし〇〇になったら最悪だ」の〇〇を書き出してください。' },
  irritated: { label: '感情バイアス（怒り・不満）', emoji: '😤', themeColor: '#f43f5e', glowColor: 'rgba(244, 63, 94, 0.3)', question: '誰の、どんな行動に葛藤や抵抗を感じましたか？事実と言葉をそのままダンプしてください。' },
  sad: { label: '自己否定バイアス（後悔・反省）', emoji: '🌧️', themeColor: '#818cf8', glowColor: 'rgba(129, 140, 248, 0.3)', question: '自分を責めてしまっていることや、後悔していることは？頭の中の思考をそのまま記述してください。' },
  rushed: { label: '認知歪曲（焦り・義務感）', emoji: '⏰', themeColor: '#f59e0b', glowColor: 'rgba(245, 158, 11, 0.3)', question: '何に追われていますか？「〜しなければならない」と思っているルールを書き出してください。' },
  flat: { label: '低活性（億劫・思考フリーズ）', emoji: '🍵', themeColor: '#10b981', glowColor: 'rgba(16, 185, 129, 0.3)', question: '日常の中で、少しだけ「面倒だな」と感じた瞬間や思考が滞ったポイントを思い出して記述してください。' }
};

export default function LogiJournal({ gameState, onSaveLog, onUpdateLog, onExportData, onImportData, onBack, playSound, isMobile }) {
  const [activeTab, setActiveTab] = useState('workspace'); // 'workspace' | 'analytics'
  const [selectedEntryId, setSelectedEntryId] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // 作成用ウィザードステート
  const [wizardStep, setWizardStep] = useState('vibeSelect'); // 'vibeSelect' | 'writeRaw' | 'scanning' | 'refactor' | 'compiling'
  const [selectedVibe, setSelectedVibe] = useState(null);
  const [rawText, setRawText] = useState('');
  const [detectedBiases, setDetectedBiases] = useState([]);
  const [refactoredText, setRefactoredText] = useState('');
  
  // コンパイル＆デフラグ演出用
  const [compileLogs, setCompileLogs] = useState([]);
  const [ramUsage, setRamUsage] = useState(90);

  // 過去記事の再デバッグ・パッチフォームステート
  const [isReDebugging, setIsReDebugging] = useState(false);
  const [reDebugStatus, setReDebugStatus] = useState('patched'); // 'patched' | 'unresolved'
  const [reDebugNote, setReDebugNote] = useState('');

  // 140字要約ステート
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summaryText, setSummaryText] = useState('');

  const fileInputRef = useRef(null);

  // 履歴ログの取得
  const tuningLog = gameState.tuningLog || [];

  // デフォルトで最初の項目を選択（履歴がある場合）
  useEffect(() => {
    if (tuningLog.length > 0 && !selectedEntryId && !isCreating) {
      setSelectedEntryId(tuningLog[0].id);
    }
  }, [tuningLog, selectedEntryId, isCreating]);

  const selectedEntry = tuningLog.find(e => e.id === selectedEntryId);

  // 新規作成開始
  const handleStartCreate = () => {
    playSound('click');
    setIsCreating(true);
    setSelectedEntryId(null);
    setWizardStep('vibeSelect');
    setSelectedVibe(null);
    setRawText('');
    setRefactoredText('');
    setDetectedBiases([]);
  };

  // 感情選択
  const handleSelectVibe = (vibe) => {
    playSound('click');
    setSelectedVibe(vibe);
    setWizardStep('writeRaw');
  };

  // テキスト文字変化
  const handleTextChange = (e) => {
    const val = e.target.value;
    if (val.length <= 500) {
      setRawText(val);
      playSound('keyboard');
    }
  };

  // バイアススキャン開始
  const handleStartScan = () => {
    playSound('click');
    setWizardStep('scanning');

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
      setWizardStep('refactor');
      playSound('success');
    }, 1500);
  };

  // 思考の整理・実行開始
  const handleCompile = () => {
    if (!refactoredText.trim()) return;
    playSound('click');
    setWizardStep('compiling');
    setCompileLogs([]);
    setRamUsage(90);

    const logs = [
      '[OK] 思考整理ノートの解析を開始します...',
      '[OK] 感情のノイズや思い込みを特定中...',
      '[OK] 事実（Fact）と行動（Action）に整理中...',
      '[OK] 頭のモヤモヤをスッキリ解放中...',
      '[SUCCESS] 整理が完了しました。頭が軽くなりました！'
    ];

    logs.forEach((log, index) => {
      setTimeout(() => {
        setCompileLogs(prev => [...prev, log]);
        if (index === 0) setRamUsage(72);
        if (index === 1) setRamUsage(45);
        if (index === 2) setRamUsage(25);
        if (index === 3) setRamUsage(12);
        if (index === 4) {
          setRamUsage(5);
          playSound('success');
        }
      }, index * 500);
    });

    setTimeout(() => {
      const newEntry = {
        vibe: selectedVibe,
        rawText,
        refactoredText,
        biases: detectedBiases.map(b => b.name),
        status: 'unresolved', // デフォルトは未解決
        followUpNote: '',
        summary: ''
      };
      
      onSaveLog(newEntry);
      setIsCreating(false);
      // 新しいログが先頭に来るため、少し遅らせてIDを選択
      setTimeout(() => {
        if (tuningLog.length > 0) {
          setSelectedEntryId(tuningLog[0].id);
        }
      }, 100);
    }, 2800);
  };

  // 再デバッグ（進捗の更新）保存
  const handleSaveReDebug = () => {
    if (!selectedEntry) return;
    playSound('click');
    const updated = {
      ...selectedEntry,
      status: reDebugStatus,
      followUpNote: reDebugNote
    };
    onUpdateLog(updated);
    setIsReDebugging(false);
    setReDebugNote('');
  };

  // 140文字要約の保存
  const handleSaveSummary = () => {
    if (!selectedEntry || !summaryText.trim()) return;
    playSound('click');
    const updated = {
      ...selectedEntry,
      summary: summaryText
    };
    onUpdateLog(updated);
    setIsSummarizing(false);
    setSummaryText('');
  };

  // インポートトリガー
  const triggerImport = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        onImportData(data);
        playSound('success');
      } catch (err) {
        alert('不正なファイル形式です。JSONファイルを読み込んでください。');
      }
    };
    reader.readAsText(file);
  };

  // テキストのバイアス語句をハイライト
  const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const renderHighlightedText = (textStr) => {
    if (!textStr) return '';
    const activeBiases = [];
    BIAS_RULES.forEach(rule => {
      const match = textStr.match(rule.regex);
      if (match) {
        activeBiases.push({ matchedWord: match[0], description: rule.description });
      }
    });

    if (activeBiases.length === 0) return <span>{textStr}</span>;

    const sortedMatches = [...activeBiases].sort((a,b) => b.matchedWord.length - a.matchedWord.length);
    const regexParts = sortedMatches.map(m => escapeRegExp(m.matchedWord)).join('|');
    if (!regexParts) return <span>{textStr}</span>;

    const splitRegex = new RegExp(`(${regexParts})`, 'g');
    const textArray = textStr.split(splitRegex);

    return textArray.map((part, index) => {
      const matchObj = activeBiases.find(b => b.matchedWord === part);
      if (matchObj) {
        return (
          <span 
            key={index} 
            style={{ 
              background: 'rgba(244, 63, 94, 0.18)', 
              color: '#f43f5e', 
              borderBottom: '1.5px dotted #f43f5e',
              padding: '0 2px',
              borderRadius: '2px',
              fontWeight: 'bold',
              cursor: 'help'
            }}
            title={matchObj.description}
          >
            {part}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  // 検索フィルタリング
  const filteredLog = tuningLog.filter(entry => {
    const q = searchQuery.toLowerCase();
    return (
      entry.rawText.toLowerCase().includes(q) ||
      entry.refactoredText.toLowerCase().includes(q) ||
      (entry.summary && entry.summary.toLowerCase().includes(q))
    );
  });

  // 分析データ算出
  const totalEntries = tuningLog.length;
  const resolvedEntries = tuningLog.filter(e => e.status === 'patched').length;
  const biasCounts = {};
  tuningLog.forEach(e => {
    if (e.biases) {
      e.biases.forEach(b => {
        biasCounts[b] = (biasCounts[b] || 0) + 1;
      });
    }
  });

  return (
    <div className="fade-in" style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      minHeight: '80vh'
    }}>
      {/* Top Bar Navigation */}
      {/* Top Bar Navigation */}
      <div style={{ 
        display: 'flex', 
        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'space-between', 
        alignItems: isMobile ? 'stretch' : 'center', 
        borderBottom: '1px solid var(--border-color)', 
        paddingBottom: '16px',
        gap: isMobile ? '12px' : '0px'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: isMobile ? '4px' : '16px',
          width: isMobile ? '100%' : 'auto',
          justifyContent: isMobile ? 'space-between' : 'flex-start'
        }}>
          <button 
            onClick={onBack} 
            className="btn btn-secondary" 
            style={{ 
              padding: isMobile ? '6px 8px' : '8px 14px', 
              fontSize: isMobile ? '11px' : '12px',
              display: 'flex', 
              alignItems: 'center', 
              gap: isMobile ? '4px' : '6px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              background: 'rgba(255, 255, 255, 0.03)',
              color: 'var(--text-secondary)',
              transition: 'all 0.2s',
              cursor: 'pointer',
              flexShrink: 0,
              minWidth: 'max-content',
              whiteSpace: 'nowrap'
            }}
            onMouseEnter={(e) => {
              if (!isMobile) {
                e.currentTarget.style.borderColor = 'var(--color-cyan)';
                e.currentTarget.style.color = 'var(--text-primary)';
                e.currentTarget.style.background = 'rgba(6, 182, 212, 0.08)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isMobile) {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.color = 'var(--text-secondary)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
              }
            }}
          >
            <ArrowLeft size={isMobile ? 12 : 14} style={{ flexShrink: 0 }} />
            <span style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>ポータルへ戻る</span>
          </button>

          {!isMobile && <div style={{ width: '1px', height: '24px', background: 'rgba(255, 255, 255, 0.1)' }} />}

          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '4px' : '8px', flexShrink: 0 }}>
            <BookOpen size={isMobile ? 18 : 22} style={{ color: 'var(--color-cyan)', flexShrink: 0 }} />
            <h2 style={{ 
              fontSize: isMobile ? '16px' : '20px', 
              fontWeight: 'bold', 
              color: 'var(--text-primary)', 
              margin: 0, 
              fontFamily: 'var(--font-display)',
              whiteSpace: 'nowrap',
              flexShrink: 0
            }}>
              LogiJournal
            </h2>
          </div>
        </div>

        {/* Tab Selector */}
        <div style={{ 
          display: 'flex', 
          gap: '8px', 
          background: 'rgba(255, 255, 255, 0.02)', 
          padding: '4px', 
          borderRadius: '8px', 
          border: '1px solid var(--border-color)',
          width: isMobile ? '100%' : 'auto',
          boxSizing: 'border-box'
        }}>
          <button 
            onClick={() => { playSound('click'); setActiveTab('workspace'); }}
            style={{
              padding: isMobile ? '6px 10px' : '8px 16px', 
              borderRadius: '6px', 
              fontSize: isMobile ? '12px' : '13px', 
              border: 'none', 
              cursor: 'pointer',
              background: activeTab === 'workspace' ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
              color: activeTab === 'workspace' ? 'var(--color-cyan)' : 'var(--text-secondary)',
              fontWeight: activeTab === 'workspace' ? 'bold' : 'normal',
              transition: 'all 0.2s',
              flex: isMobile ? 1 : 'none',
              textAlign: 'center',
              whiteSpace: 'nowrap'
            }}
          >
            ワークスペース
          </button>
          <button 
            onClick={() => { playSound('click'); setActiveTab('analytics'); }}
            style={{
              padding: isMobile ? '6px 10px' : '8px 16px', 
              borderRadius: '6px', 
              fontSize: isMobile ? '12px' : '13px', 
              border: 'none', 
              cursor: 'pointer',
              background: activeTab === 'analytics' ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
              color: activeTab === 'analytics' ? 'var(--color-cyan)' : 'var(--text-secondary)',
              fontWeight: activeTab === 'analytics' ? 'bold' : 'normal',
              transition: 'all 0.2s',
              flex: isMobile ? 1 : 'none',
              textAlign: 'center',
              whiteSpace: 'nowrap'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: isMobile ? 'center' : 'flex-start' }}>
              <BarChart2 size={isMobile ? 13 : 15} style={{ flexShrink: 0 }} />
              <span style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>思考クセの分析</span>
            </div>
          </button>
        </div>
      </div>

      {/* Hidden file input for import */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept=".json" 
        style={{ display: 'none' }} 
      />

      {/* Active Tab Workspace */}
      {activeTab === 'workspace' && (
        <div className="journal-workspace-grid" style={{
          display: 'grid',
          gridTemplateColumns: '320px 1fr',
          gap: '24px',
          alignItems: 'start'
        }}>
          {/* Left Panel: History Sidebar */}
          <div className="glass-panel" style={{
            padding: '16px',
            borderRadius: '12px',
            background: 'var(--hero-bg)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            maxHeight: '72vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)', letterSpacing: '1px' }}>
                JOURNAL HISTORY
              </span>
              <button 
                onClick={handleStartCreate}
                className="btn btn-primary"
                style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--color-cyan)', border: 'none' }}
              >
                <Plus size={14} />
                <span>新規作成</span>
              </button>
            </div>

            {/* Search Input */}
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                placeholder="履歴を検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 30px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: 'rgba(0,0,0,0.15)',
                  fontSize: '12.5px',
                  outline: 'none',
                  color: 'var(--text-primary)'
                }}
              />
            </div>

            {/* History List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', minHeight: '280px' }}>
              {filteredLog.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '12.5px', padding: '40px 0' }}>
                  履歴がありません
                </div>
              ) : (
                filteredLog.map(entry => {
                  const info = VIBE_DATA[entry.vibe] || { emoji: '📝', themeColor: 'var(--color-cyan)' };
                  const isSelected = selectedEntryId === entry.id;
                  const dateStr = new Date(entry.timestamp).toLocaleDateString('ja-JP', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });

                  return (
                    <div
                      key={entry.id}
                      onClick={() => { playSound('click'); setSelectedEntryId(entry.id); setIsCreating(false); }}
                      style={{
                        padding: '12px',
                        borderRadius: '8px',
                        background: isSelected ? 'rgba(6, 182, 212, 0.08)' : 'rgba(255, 255, 255, 0.01)',
                        border: `1px solid ${isSelected ? 'var(--color-cyan)' : 'var(--border-color)'}`,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        textAlign: 'left'
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) e.currentTarget.style.borderColor = '';
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '16px' }}>{info.emoji}</span>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{dateStr}</span>
                        </div>
                        <span style={{
                          fontSize: '9px', fontWeight: 'bold', padding: '2px 6px', borderRadius: '4px',
                          background: entry.status === 'patched' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)',
                          color: entry.status === 'patched' ? '#10b981' : '#f43f5e'
                        }}>
                          {entry.status === 'patched' ? '整理完了' : '未整理'}
                        </span>
                      </div>
                      <p style={{
                        fontSize: '12px', color: 'var(--text-secondary)', margin: 0,
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                      }}>
                        {entry.refactoredText}
                      </p>
                    </div>
                  );
                })
              )}
            </div>

            {/* Import / Export utility block */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', display: 'flex', gap: '8px' }}>
              <button 
                onClick={onExportData}
                className="btn btn-secondary"
                style={{ flex: 1, padding: '8px', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
              >
                <Download size={12} />
                <span>エクスポート</span>
              </button>
              <button 
                onClick={triggerImport}
                className="btn btn-secondary"
                style={{ flex: 1, padding: '8px', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
              >
                <Upload size={12} />
                <span>インポート</span>
              </button>
            </div>
          </div>

          {/* Right Panel: Workspace Area */}
          <div className="workspace-main-panel">
            
            {/* A. 新規作成ウィザード */}
            {isCreating && (
              <div className="glass-panel fade-in" style={{ padding: '24px', borderRadius: '12px', background: 'var(--hero-bg)', border: '1px solid var(--border-color)' }}>
                
                {/* A-1. Vibe Selection */}
                {wizardStep === 'vibeSelect' && (
                  <div style={{ textAlign: 'center', padding: '20px 0' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '8px' }}>
                      検出する思考ノイズ（バイアス）を選択してください
                    </h3>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
                      現在、あなたの思考回路のフリーズ（負荷）を招いている主な要因はどれですか？
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '480px', margin: '0 auto' }}>
                      {Object.entries(VIBE_DATA).map(([key, info]) => (
                        <button
                          key={key}
                          onClick={() => handleSelectVibe(key)}
                          className="btn btn-secondary hover-lift"
                          style={{
                            padding: '16px 20px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'left',
                            borderLeft: `4px solid ${info.themeColor}`
                          }}
                        >
                          <span style={{ fontSize: '20px' }}>{info.emoji}</span>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{info.label}</span>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>思考整理シートを準備します</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* A-2. Write raw text */}
                {wizardStep === 'writeRaw' && selectedVibe && (
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>{VIBE_DATA[selectedVibe].emoji}</span>
                        <span>{VIBE_DATA[selectedVibe].label}：思考のダンプアウト</span>
                      </h3>
                      <button onClick={() => setWizardStep('vibeSelect')} className="btn btn-secondary" style={{ fontSize: '11px', padding: '4px 8px' }}>
                        やり直す
                      </button>
                    </div>

                    <div style={{ background: 'rgba(255, 255, 255, 0.01)', border: '1px solid var(--border-color)', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px' }}>
                      <span style={{ fontSize: '10px', color: VIBE_DATA[selectedVibe].themeColor, fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>
                        カエル分析官からのチューニング指令
                      </span>
                      <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                        {VIBE_DATA[selectedVibe].question}
                      </p>
                    </div>

                    <textarea
                      value={rawText}
                      onChange={handleTextChange}
                      placeholder={VIBE_DATA[selectedVibe].question}
                      style={{
                        width: '100%', minHeight: '160px', borderRadius: '8px', border: '1px solid var(--border-color)',
                        padding: '16px', fontSize: '13.5px', lineHeight: '1.6', color: 'var(--text-primary)',
                        background: 'rgba(0,0,0,0.15)', outline: 'none', resize: 'none', fontFamily: 'inherit',
                        marginBottom: '12px'
                      }}
                    />
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        ※ 140字程度（最大500字）の簡潔な記述が最適です
                      </span>
                      <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                        {rawText.length} / 500 文字
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button onClick={() => setIsCreating(false)} className="btn btn-secondary" style={{ flex: 0.3 }}>
                        戻る
                      </button>
                      <button 
                        onClick={handleStartScan}
                        disabled={!rawText.trim()}
                        className="btn btn-primary"
                        style={{ flex: 1, background: VIBE_DATA[selectedVibe].themeColor, border: 'none', boxShadow: `0 4px 12px ${VIBE_DATA[selectedVibe].glowColor}` }}
                      >
                        🔍 思考クセのチェックを実行
                      </button>
                    </div>
                  </div>
                )}

                {/* A-3. Scanning Animation */}
                {wizardStep === 'scanning' && selectedVibe && (
                  <div style={{ textAlign: 'center', padding: '40px 0' }}>
                    <Brain size={48} style={{ color: VIBE_DATA[selectedVibe].themeColor, animation: 'pulse 1.5s infinite', margin: '0 auto 16px' }} />
                    <h4 style={{ fontSize: '16px', color: 'var(--text-primary)', marginBottom: '8px' }}>
                      認知バイアスをスキャン中...
                    </h4>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      思考パターンから非論理的なルールを抽出しています
                    </p>
                  </div>
                )}

                {/* A-4. Refactor (Linter highlights and edit) */}
                {wizardStep === 'refactor' && selectedVibe && (
                  <div style={{ textAlign: 'left' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>🔬</span>
                      <span>思考のチェック & 整理</span>
                    </h3>

                    {/* Highlighted text output */}
                    <div style={{ background: 'rgba(10, 11, 16, 0.4)', border: '1px solid var(--border-color)', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
                      <span style={{ fontSize: '10px', color: '#f43f5e', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>
                        🔴 気づき：無意識の思考クセ（感情ノイズ）
                      </span>
                      <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                        {renderHighlightedText(rawText)}
                      </p>
                    </div>

                    {/* Detected bias boxes */}
                    {detectedBiases.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                        {detectedBiases.map((b, idx) => (
                          <div key={idx} style={{ background: 'rgba(244, 63, 94, 0.02)', border: '1px solid rgba(244, 63, 94, 0.08)', padding: '10px 12px', borderRadius: '6px', fontSize: '12px', display: 'flex', gap: '8px' }}>
                            <AlertCircle size={14} style={{ color: '#f43f5e', flexShrink: 0, marginTop: '2px' }} />
                            <div>
                              <strong style={{ color: '#f43f5e' }}>{b.name} (「{b.matchedWord}」)</strong>
                              <div style={{ color: 'var(--text-secondary)', marginTop: '2px', lineHeight: '1.4' }}>{b.description}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ background: 'rgba(16, 185, 129, 0.02)', border: '1px solid rgba(16, 185, 129, 0.08)', padding: '12px', borderRadius: '8px', fontSize: '12.5px', color: '#10b981', display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '20px' }}>
                        <CheckCircle size={16} />
                        <span>顕著な極端語（偏った表現）は検出されませんでした。</span>
                      </div>
                    )}

                    {/* Refactoring Guide */}
                    <div style={{ background: 'rgba(16, 185, 129, 0.03)', border: '1px solid rgba(16, 185, 129, 0.1)', padding: '14px', borderRadius: '8px', marginBottom: '16px' }}>
                      <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>
                        💡 客観的な視点で整理するためのガイド
                      </span>
                      <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                        感情論を一旦脇に置いて、**「客観的な事実（Fact）」**と**「これから取れる具体的な行動（Action）」**に整理して、以下に入力してみましょう。
                      </p>
                    </div>

                    <textarea
                      value={refactoredText}
                      onChange={(e) => { if (e.target.value.length <= 500) { setRefactoredText(e.target.value); playSound('keyboard'); } }}
                      placeholder="【事実】〇〇。【対策/現実的な見解】〇〇。"
                      style={{
                        width: '100%', minHeight: '100px', borderRadius: '8px', border: '1px solid var(--border-color)',
                        padding: '12px 16px', fontSize: '13.5px', color: 'var(--text-primary)',
                        background: 'rgba(0,0,0,0.15)', outline: 'none', resize: 'none', fontFamily: 'inherit',
                        marginBottom: '16px'
                      }}
                    />

                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button onClick={() => setWizardStep('writeRaw')} className="btn btn-secondary" style={{ flex: 0.3 }}>
                        戻る
                      </button>
                      <button 
                        onClick={handleCompile}
                        disabled={!refactoredText.trim()}
                        className="btn btn-primary"
                        style={{ flex: 1, background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', border: 'none', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)' }}
                      >
                        🚀 思考をスッキリ整理する
                      </button>
                    </div>
                  </div>
                )}

                {/* A-5. Compiling Animation */}
                {wizardStep === 'compiling' && (
                  <div style={{ textAlign: 'center', padding: '30px 0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '360px', margin: '0 auto 12px auto', fontSize: '12px' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>頭のモヤモヤ解消率</span>
                      <span style={{ color: '#10b981', fontWeight: 'bold' }}>{100 - ramUsage}%</span>
                    </div>
                    <div style={{ width: '360px', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', margin: '0 auto 24px auto', overflow: 'hidden' }}>
                      <div style={{ width: `${100 - ramUsage}%`, height: '100%', background: '#10b981', borderRadius: '3px', transition: 'width 0.3s' }} />
                    </div>
                    <div style={{
                      maxWidth: '360px', margin: '0 auto', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)',
                      padding: '12px', borderRadius: '6px', fontFamily: 'monospace', fontSize: '11px', color: '#10b981',
                      textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '4px', minHeight: '90px'
                    }}>
                      {compileLogs.map((log, idx) => <div key={idx}>{log}</div>)}
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* B. ログ詳細表示モード */}
            {selectedEntry && !isCreating && (
              <div className="glass-panel fade-in" style={{
                padding: '24px',
                borderRadius: '12px',
                background: 'var(--hero-bg)',
                border: '1px solid var(--border-color)',
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px'
              }}>
                {/* Meta details header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '20px' }}>{(VIBE_DATA[selectedEntry.vibe] || {}).emoji}</span>
                      <span style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                        {(VIBE_DATA[selectedEntry.vibe] || {}).label}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: 'var(--text-muted)' }}>
                      <Clock size={12} />
                      <span>{new Date(selectedEntry.timestamp).toLocaleString('ja-JP')}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span style={{
                      fontSize: '11px', fontWeight: 'bold', padding: '4px 10px', borderRadius: '6px',
                      background: selectedEntry.status === 'patched' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(244, 63, 94, 0.12)',
                      color: selectedEntry.status === 'patched' ? '#10b981' : '#f43f5e',
                      border: `1px solid ${selectedEntry.status === 'patched' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(244, 63, 94, 0.2)'}`
                    }}>
                      {selectedEntry.status === 'patched' ? '● 整理完了' : '▲ 未整理・観察中'}
                    </span>
                  </div>
                </div>

                {/* Raw vs Refactored Text views */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div style={{ background: 'rgba(244, 63, 94, 0.01)', border: '1px solid rgba(244, 63, 94, 0.08)', padding: '16px', borderRadius: '8px' }}>
                    <span style={{ fontSize: '11px', color: '#f43f5e', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>
                      🔴 整理前のモヤモヤ（無意識のクセ）
                    </span>
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                      {renderHighlightedText(selectedEntry.rawText)}
                    </p>
                  </div>

                  <div style={{ background: 'rgba(16, 185, 129, 0.01)', border: '1px solid rgba(16, 185, 129, 0.08)', padding: '16px', borderRadius: '8px' }}>
                    <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>
                      🟢 客観的な事実 ＆ 取るべき行動
                    </span>
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-primary)', lineHeight: '1.6' }}>
                      {selectedEntry.refactoredText}
                    </p>
                  </div>
                </div>

                {/* 140-char Summary (Gimmick) */}
                {selectedEntry.summary ? (
                  <div style={{ background: 'rgba(6, 182, 212, 0.03)', border: '1px solid rgba(6, 182, 212, 0.12)', padding: '16px', borderRadius: '8px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--color-cyan)', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>
                      ⚡ 140字の結晶化サマリー（思考の調律ポイント）
                    </span>
                    <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--text-primary)', lineHeight: '1.5', fontStyle: 'italic' }}>
                      「{selectedEntry.summary}」
                    </p>
                  </div>
                ) : (
                  !isSummarizing && (
                    <button 
                      onClick={() => { playSound('click'); setIsSummarizing(true); }}
                      className="btn btn-secondary"
                      style={{ padding: '8px 16px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', alignSelf: 'flex-start' }}
                    >
                      <Sparkles size={14} style={{ color: 'var(--color-cyan)' }} />
                      <span>140字でこの知見を要約・結晶化する (メタ認知クエスト)</span>
                    </button>
                  )
                )}

                {/* 140-char summary edit box */}
                {isSummarizing && (
                  <div style={{ background: 'rgba(6, 182, 212, 0.02)', border: '1px solid rgba(6, 182, 212, 0.1)', padding: '16px', borderRadius: '8px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--color-cyan)', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>
                      140文字で要約する
                    </span>
                    <input 
                      type="text" 
                      placeholder="例：会議で焦るのは事前準備の不足が『事実』。次回から前日にアジェンダを3点書き出す『対策』で解決。"
                      value={summaryText}
                      onChange={(e) => { if (e.target.value.length <= 140) setSummaryText(e.target.value); }}
                      style={{
                        width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)',
                        background: 'rgba(0,0,0,0.15)', color: 'var(--text-primary)', fontSize: '12.5px', outline: 'none',
                        marginBottom: '10px'
                      }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      <button onClick={() => setIsSummarizing(false)} className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '11px' }}>
                        キャンセル
                      </button>
                      <button 
                        onClick={handleSaveSummary} 
                        disabled={!summaryText.trim()}
                        className="btn btn-primary" 
                        style={{ padding: '4px 12px', fontSize: '11px', background: 'var(--color-cyan)', border: 'none' }}
                      >
                        保存
                      </button>
                    </div>
                  </div>
                )}

                {/* Follow up / Re-debug Notes */}
                {selectedEntry.followUpNote && (
                  <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', padding: '16px', borderRadius: '8px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>
                      📝 追記された経過ノート
                    </span>
                    <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                      {selectedEntry.followUpNote}
                    </p>
                  </div>
                )}

                {/* Re-debug Action triggers */}
                {!isReDebugging ? (
                  <button 
                    onClick={() => {
                      playSound('click');
                      setIsReDebugging(true);
                      setReDebugStatus(selectedEntry.status);
                      setReDebugNote(selectedEntry.followUpNote || '');
                    }}
                    className="btn btn-secondary"
                    style={{ padding: '8px 16px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', alignSelf: 'flex-start' }}
                  >
                    <Edit3 size={14} />
                    <span>状況の再検証 ＆ 振り返り</span>
                  </button>
                ) : (
                  <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', padding: '16px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>ステータス更新:</span>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', color: '#10b981', cursor: 'pointer' }}>
                        <input 
                          type="radio" 
                          name="redebug_status" 
                          value="patched" 
                          checked={reDebugStatus === 'patched'} 
                          onChange={() => setReDebugStatus('patched')} 
                        />
                        <span>整理完了（スッキリした）</span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', color: '#f43f5e', cursor: 'pointer' }}>
                        <input 
                          type="radio" 
                          name="redebug_status" 
                          value="unresolved" 
                          checked={reDebugStatus === 'unresolved'} 
                          onChange={() => setReDebugStatus('unresolved')} 
                        />
                        <span>未解決（まだモヤモヤする）</span>
                      </label>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>追記コメント（その後どう行動したかなど）：</span>
                      <input 
                        type="text" 
                        value={reDebugNote}
                        onChange={(e) => setReDebugNote(e.target.value)}
                        placeholder="例：実際にアジェンダを書き出して会議に出たところ、焦らずロジカルに進行できた。"
                        style={{
                          width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)',
                          background: 'rgba(0,0,0,0.15)', color: 'var(--text-primary)', fontSize: '12.5px', outline: 'none'
                        }}
                      />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      <button onClick={() => setIsReDebugging(false)} className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '11px' }}>
                        キャンセル
                      </button>
                      <button onClick={handleSaveReDebug} className="btn btn-primary" style={{ padding: '4px 12px', fontSize: '11px', background: 'var(--color-cyan)', border: 'none' }}>
                        適用
                      </button>
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* C. 履歴も選択肢もない時のプレースホルダー */}
            {tuningLog.length === 0 && !isCreating && (
              <div className="glass-panel" style={{ padding: '80px 40px', borderRadius: '12px', background: 'var(--hero-bg)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                <Brain size={48} style={{ color: 'var(--text-muted)', opacity: 0.5, margin: '0 auto 16px' }} />
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '8px' }}>
                  LogiJournal 思考整理ノートへようこそ
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto 24px' }}>
                  日常のモヤモヤを書き出して整理し、客観的な事実と次のアクションに整えるノートです。最初のログを作成してみましょう。
                </p>
                <button 
                  onClick={handleStartCreate}
                  className="btn btn-primary"
                  style={{ background: 'var(--color-cyan)', border: 'none', padding: '12px 24px', fontSize: '13.5px' }}
                >
                  最初のジャーナルを書く
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      {/* Active Tab Analytics */}
      {activeTab === 'analytics' && (
        <div className="glass-panel fade-in" style={{
          padding: '32px 24px',
          borderRadius: '12px',
          background: 'var(--hero-bg)',
          border: '1px solid var(--border-color)',
          textAlign: 'left'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart2 size={20} style={{ color: 'var(--color-cyan)' }} />
            <span>思考クセ分析スタッツ</span>
          </h3>
          <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
            これまでにLogiJournalで整理されたモヤモヤと、無意識の思考パターンを集計データです。
          </p>

          {/* Quick Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
            <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>総ログ数</div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--text-primary)', fontFamily: 'monospace' }}>{totalEntries}</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>整理完了率</div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#10b981', fontFamily: 'monospace' }}>
                {totalEntries > 0 ? Math.round((resolvedEntries / totalEntries) * 100) : 0}%
              </div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>未解決のモヤモヤ</div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#f43f5e', fontFamily: 'monospace' }}>{totalEntries - resolvedEntries}</div>
            </div>
          </div>

          {/* Bias Bar Charts */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div style={{ background: 'rgba(0,0,0,0.1)', border: '1px solid var(--border-color)', padding: '20px', borderRadius: '8px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                頻出する認知バイアス（偏りがちな思考パターン）
              </h4>
              
              {Object.keys(biasCounts).length === 0 ? (
                <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12.5px' }}>
                  データが集計されていません
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {Object.entries(biasCounts)
                    .sort((a,b) => b[1] - a[1])
                    .map(([biasName, count]) => {
                      const maxCount = Math.max(...Object.values(biasCounts));
                      const percentage = (count / maxCount) * 100;
                      return (
                        <div key={biasName}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>{biasName}</span>
                            <span style={{ color: 'var(--text-primary)', fontFamily: 'monospace', fontWeight: 'bold' }}>{count} 回</span>
                          </div>
                          <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: `${percentage}%`, height: '100%', background: 'var(--color-rose)', borderRadius: '3px' }} />
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            {/* Metacognitive Trainer Tip */}
            <div style={{ background: 'rgba(16, 185, 129, 0.02)', border: '1px solid rgba(16, 185, 129, 0.1)', padding: '20px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Brain style={{ color: '#10b981' }} size={20} />
                <h4 style={{ fontSize: '14px', fontWeight: 'bold', color: '#10b981', margin: 0 }}>
                  カエル分析官の思考調律アドバイス
                </h4>
              </div>
              
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6', margin: 0 }}>
                {totalEntries === 0 ? (
                  "まずは今日の終わりにLogiJournalでモヤモヤを書き出し、最初のデータを蓄積してください。思考の癖が見えてくることで、客観視が容易になります。"
                ) : Object.keys(biasCounts).length > 0 ? (
                  `現在、あなたのログからは「${Object.entries(biasCounts).sort((a,b) => b[1]-a[1])[0][0]}」の傾向が最も高く検出されています。このパターンが現れたときは、まず「その決めつけを証明する『客観的な証拠』が本当にそこにあるか？」と自分に問いかける習慣をつけてみましょう。`
                ) : (
                  "極端な偏りは未検出です。非常に良好な論理的バランスを維持できています。この調子で客観的な事実と主観を明確に切り分ける習慣を継続しましょう。"
                )}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
