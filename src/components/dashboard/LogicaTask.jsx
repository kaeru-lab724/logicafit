import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, CheckSquare, Square, Trash2, Play, Pause, Plus, X, 
  Download, Upload, Sliders, Clock, Activity, Target, ShieldAlert,
  ChevronRight, Volume2, VolumeX, RotateCcw, Sparkles, AlertCircle
} from 'lucide-react';

export default function LogicaTask({ onBack, playSound, isMobile }) {
  // --- Task Schema ---
  // id: string
  // text: string
  // impact: 'high' | 'low'
  // urgency: 'high' | 'low'
  // category: string
  // status: 'todo' | 'focusing' | 'done'
  // coreValue: string (70% definition)
  // polishValue: string (100% definition)
  // subtasks: Array<{ id, text, done }>
  // createdAt: number

  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem('logicatask_tasks');
    return saved ? JSON.parse(saved) : [];
  });

  // Form states
  const [newTaskText, setNewTaskText] = useState('');
  const [newImpact, setNewImpact] = useState('high');
  const [newUrgency, setNewUrgency] = useState('high');
  const [newCategory, setNewCategory] = useState('Work');
  const [newCoreValue, setNewCoreValue] = useState('');
  const [newPolishValue, setNewPolishValue] = useState('');

  // UI state
  const [activeSliceTask, setActiveSliceTask] = useState(null); // Task being edited/sliced in modal
  const [activeFocusTask, setActiveFocusTask] = useState(null); // Task in Pomodoro Focus Mode
  const [subtaskInput, setSubtaskInput] = useState('');
  const [importError, setImportError] = useState('');

  // Pomodoro states
  const [focusTimeLeft, setFocusTimeLeft] = useState(25 * 60);
  const [focusTimerRunning, setFocusTimerRunning] = useState(false);
  const [focusSessionType, setFocusSessionType] = useState('focus'); // 'focus' (25m) or 'break' (5m)
  const [focusBgm, setFocusBgm] = useState('none'); // 'none' | 'rain' | 'pad'
  
  // Audio Nodes Ref for Web Audio API Synth
  const audioContextRef = useRef(null);
  const rainNodeRef = useRef(null);
  const padNodesRef = useRef([]);

  const categories = ['Work', 'Private', 'Study', 'Health', 'Other'];

  // Save tasks on modification
  useEffect(() => {
    localStorage.setItem('logicatask_tasks', JSON.stringify(tasks));
  }, [tasks]);

  // Pomodoro Timer Effect
  useEffect(() => {
    let timerId = null;
    if (focusTimerRunning && focusTimeLeft > 0) {
      timerId = setInterval(() => {
        setFocusTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (focusTimerRunning && focusTimeLeft === 0) {
      setFocusTimerRunning(false);
      if (playSound) playSound('success');
      
      // Auto-toggle session type
      if (focusSessionType === 'focus') {
        alert('集中セッションが完了しました！5分間の休憩を取りましょう。');
        setFocusSessionType('break');
        setFocusTimeLeft(5 * 60);
      } else {
        alert('休憩が終了しました！集中を再開しましょう。');
        setFocusSessionType('focus');
        setFocusTimeLeft(25 * 60);
      }
    }
    return () => {
      if (timerId) clearInterval(timerId);
    };
  }, [focusTimerRunning, focusTimeLeft, focusSessionType, playSound]);

  // ASMR Sound Synthesizer Effects
  useEffect(() => {
    if (focusBgm === 'none') {
      stopASMR();
    } else {
      startASMR();
    }
    return () => stopASMR();
  }, [focusBgm]);

  // --- Web Audio API Synth Helpers ---
  const startASMR = () => {
    stopASMR();
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      if (focusBgm === 'rain') {
        // Generate Pink/Brown Noise for Rain sound simulation
        const bufferSize = 2 * ctx.sampleRate;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          // Brown noise approximation filter
          output[i] = (lastOut + (0.02 * white)) / 1.02;
          lastOut = output[i];
          output[i] *= 3.5; // Gain compensation
        }

        const noise = ctx.createBufferSource();
        noise.buffer = noiseBuffer;
        noise.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 800;

        const gain = ctx.createGain();
        gain.gain.value = 0.15;

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        noise.start(0);
        rainNodeRef.current = { source: noise, gain: gain };

      } else if (focusBgm === 'pad') {
        // Generate a Chill Pad Chord (Detuned saw/triangle waves with lowpass filter)
        const freqs = [130.81, 164.81, 196.00, 261.63]; // C3, E3, G3, C4
        const oscillators = [];

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 400;
        filter.Q.value = 1.0;

        const mainGain = ctx.createGain();
        mainGain.gain.value = 0.08;

        freqs.forEach(freq => {
          // Main oscillator
          const osc1 = ctx.createOscillator();
          osc1.type = 'triangle';
          osc1.frequency.value = freq;

          // Detuned companion oscillator
          const osc2 = ctx.createOscillator();
          osc2.type = 'sawtooth';
          osc2.frequency.value = freq + (Math.random() * 1.5 - 0.75);

          const oscGain = ctx.createGain();
          oscGain.gain.value = 0.5;

          osc1.connect(oscGain);
          osc2.connect(oscGain);
          oscGain.connect(filter);

          osc1.start(0);
          osc2.start(0);

          oscillators.push(osc1, osc2);
        });

        // Modulate filter frequency slowly to make pad feel "alive"
        const lfo = ctx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = 0.1; // 10 seconds sweep
        const lfoGain = ctx.createGain();
        lfoGain.gain.value = 150;

        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);
        lfo.start(0);

        filter.connect(mainGain);
        mainGain.connect(ctx.destination);

        padNodesRef.current = {
          oscillators: oscillators,
          lfo: lfo,
          filter: filter,
          gain: mainGain
        };
      }
    } catch (e) {
      console.error('Failed to initialize Audio Synth: ', e);
    }
  };

  const stopASMR = () => {
    if (rainNodeRef.current) {
      try {
        rainNodeRef.current.source.stop();
      } catch (e) {}
      rainNodeRef.current = null;
    }
    if (padNodesRef.current) {
      try {
        padNodesRef.current.oscillators.forEach(osc => osc.stop());
        padNodesRef.current.lfo.stop();
      } catch (e) {}
      padNodesRef.current = null;
    }
  };

  // --- Task Actions ---
  const handleAddTask = (e) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;

    if (playSound) playSound('click');

    const newTask = {
      id: 'task_' + Date.now(),
      text: newTaskText.trim(),
      impact: newImpact,
      urgency: newUrgency,
      category: newCategory,
      status: 'todo',
      coreValue: newCoreValue.trim(),
      polishValue: newPolishValue.trim(),
      subtasks: [],
      createdAt: Date.now()
    };

    setTasks(prev => [newTask, ...prev]);
    setNewTaskText('');
    setNewCoreValue('');
    setNewPolishValue('');
  };

  const handleDeleteTask = (id, e) => {
    if (e) e.stopPropagation();
    if (playSound) playSound('click');
    if (confirm('このタスクを削除しますか？')) {
      setTasks(prev => prev.filter(t => t.id !== id));
      if (activeSliceTask?.id === id) setActiveSliceTask(null);
      if (activeFocusTask?.id === id) handleExitFocus();
    }
  };

  const handleUpdateTaskStatus = (id, newStatus, e) => {
    if (e) e.stopPropagation();
    if (playSound) playSound('click');
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
    
    // Sync with active states
    if (activeSliceTask?.id === id) {
      setActiveSliceTask(prev => ({ ...prev, status: newStatus }));
    }
    if (activeFocusTask?.id === id) {
      setActiveFocusTask(prev => ({ ...prev, status: newStatus }));
    }
  };

  // --- Subtask Actions ---
  const handleAddSubtask = (e) => {
    e.preventDefault();
    if (!subtaskInput.trim() || !activeSliceTask) return;
    
    if (playSound) playSound('click');
    const newSub = {
      id: 'sub_' + Date.now() + Math.random(),
      text: subtaskInput.trim(),
      done: false
    };

    const updatedSubtasks = [...(activeSliceTask.subtasks || []), newSub];
    const updatedTask = { ...activeSliceTask, subtasks: updatedSubtasks };
    
    setTasks(prev => prev.map(t => t.id === activeSliceTask.id ? updatedTask : t));
    setActiveSliceTask(updatedTask);
    
    // Sync if focus is running on this task
    if (activeFocusTask?.id === activeSliceTask.id) {
      setActiveFocusTask(updatedTask);
    }
    
    setSubtaskInput('');
  };

  const handleToggleSubtask = (subId) => {
    if (!activeSliceTask) return;
    if (playSound) playSound('click');

    const updatedSubtasks = activeSliceTask.subtasks.map(s => 
      s.id === subId ? { ...s, done: !s.done } : s
    );
    const updatedTask = { ...activeSliceTask, subtasks: updatedSubtasks };

    setTasks(prev => prev.map(t => t.id === activeSliceTask.id ? updatedTask : t));
    setActiveSliceTask(updatedTask);

    if (activeFocusTask?.id === activeSliceTask.id) {
      setActiveFocusTask(updatedTask);
    }
  };

  const handleDeleteSubtask = (subId) => {
    if (!activeSliceTask) return;
    if (playSound) playSound('click');

    const updatedSubtasks = activeSliceTask.subtasks.filter(s => s.id !== subId);
    const updatedTask = { ...activeSliceTask, subtasks: updatedSubtasks };

    setTasks(prev => prev.map(t => t.id === activeSliceTask.id ? updatedTask : t));
    setActiveSliceTask(updatedTask);

    if (activeFocusTask?.id === activeSliceTask.id) {
      setActiveFocusTask(updatedTask);
    }
  };

  // --- Focus Mode Control ---
  const handleStartFocus = (task, e) => {
    if (e) e.stopPropagation();
    if (playSound) playSound('click');
    setActiveFocusTask(task);
    setFocusTimeLeft(25 * 60);
    setFocusSessionType('focus');
    setFocusTimerRunning(true);
  };

  const handleExitFocus = () => {
    if (playSound) playSound('click');
    setFocusTimerRunning(false);
    setActiveFocusTask(null);
    setFocusBgm('none');
  };

  // --- Backup Export/Import ---
  const handleExportData = () => {
    if (playSound) playSound('click');
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(tasks));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    downloadAnchor.setAttribute("download", `logicatask_backup_${dateStr}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportData = (e) => {
    setImportError('');
    const fileReader = new FileReader();
    const file = e.target.files[0];
    if (!file) return;

    fileReader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (Array.isArray(parsed)) {
          // Simple schema validation
          const isValid = parsed.every(t => t.id && t.text && t.status);
          if (isValid) {
            if (playSound) playSound('success');
            setTasks(parsed);
            alert('タスクデータを正常に復元しました！');
          } else {
            setImportError('ファイルのデータ構造が正しくありません。');
          }
        } else {
          setImportError('有効なバックアップファイルではありません。');
        }
      } catch (err) {
        setImportError('JSONファイルの解析に失敗しました。');
      }
    };
    fileReader.readAsText(file);
  };

  // Helper to filter tasks by Eisenhower Quadrant
  const getQuadrantTasks = (impact, urgency) => {
    return tasks.filter(t => t.impact === impact && t.urgency === urgency);
  };

  // Render timer text
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="game-container fade-in" style={{ width: '100%', maxWidth: '1200px', margin: '0 auto', boxSizing: 'border-box' }}>
      
      {/* Active Focus Overlay */}
      {activeFocusTask && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(10, 11, 16, 0.98)',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          boxSizing: 'border-box'
        }}>
          
          <div style={{ maxWidth: '600px', width: '100%', display: 'flex', flexDirection: 'column', gap: '28px', alignItems: 'center' }}>
            
            {/* Header / Exit */}
            <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--color-amber)', fontSize: '12px', fontWeight: 'bold', letterSpacing: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Activity size={14} className="animate-pulse" /> FOCUS ACTIVE
              </span>
              <button 
                onClick={handleExitFocus}
                className="btn btn-secondary"
                style={{ padding: '6px 12px', fontSize: '12.5px', borderRadius: '8px' }}
              >
                ← 集中を終了
              </button>
            </div>

            {/* Timer Visual */}
            <div style={{
              width: isMobile ? '220px' : '280px',
              height: isMobile ? '220px' : '280px',
              borderRadius: '50%',
              border: `6px solid ${focusSessionType === 'focus' ? 'var(--color-amber)' : 'var(--color-cyan)'}`,
              boxShadow: `0 0 30px ${focusSessionType === 'focus' ? 'var(--color-amber-glow)' : 'var(--color-cyan-glow)'}`,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              position: 'relative',
              background: 'rgba(255, 255, 255, 0.02)'
            }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '2px' }}>
                {focusSessionType === 'focus' ? '集中セッション' : '休憩'}
              </span>
              <h1 style={{ fontSize: isMobile ? '56px' : '72px', fontWeight: '800', fontFamily: 'var(--font-display)', margin: '8px 0', color: 'var(--text-primary)' }}>
                {formatTime(focusTimeLeft)}
              </h1>
              
              {/* Play / Pause / Reset controls */}
              <div style={{ display: 'flex', gap: '16px', marginTop: '10px' }}>
                <button 
                  onClick={() => { playSound('click'); setFocusTimerRunning(!focusTimerRunning); }}
                  style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}
                >
                  {focusTimerRunning ? <Pause size={20} /> : <Play size={20} />}
                </button>
                <button 
                  onClick={() => {
                    playSound('click');
                    setFocusTimerRunning(false);
                    setFocusTimeLeft(focusSessionType === 'focus' ? 25 * 60 : 5 * 60);
                  }}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  <RotateCcw size={20} />
                </button>
              </div>
            </div>

            {/* Sound Control Panel */}
            <div className="glass-panel" style={{ width: '100%', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', background: 'var(--bg-inner-box)' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 'bold', textAlign: 'left' }}>
                🎧 フォーカス環境音 (ASMR Synth)
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                {['none', 'rain', 'pad'].map((bg) => (
                  <button
                    key={bg}
                    onClick={() => { playSound('click'); setFocusBgm(bg); }}
                    className={`btn ${focusBgm === bg ? '' : 'btn-secondary'}`}
                    style={{
                      flex: 1,
                      padding: '8px',
                      fontSize: '12px',
                      borderRadius: '8px',
                      background: focusBgm === bg ? 'var(--color-amber)' : '',
                      border: focusBgm === bg ? 'none' : '',
                      color: focusBgm === bg ? '#000' : ''
                    }}
                  >
                    {bg === 'none' ? 'オフ' : bg === 'rain' ? '🌧️ 雨の音' : '🎧 チル和音'}
                  </button>
                ))}
              </div>
            </div>

            {/* Active Task detail */}
            <div style={{ width: '100%', textAlign: 'left' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'bold' }}>実行中のメインタスク</span>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '4px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                {activeFocusTask.text}
              </h2>
              
              {/* 70% Definition Alert */}
              {activeFocusTask.coreValue && (
                <div style={{
                  background: 'rgba(245, 158, 11, 0.05)',
                  border: '1px dashed rgba(245, 158, 11, 0.3)',
                  padding: '12px',
                  borderRadius: '10px',
                  fontSize: '12.5px',
                  color: 'var(--text-secondary)',
                  marginTop: '12px',
                  lineHeight: '1.5'
                }}>
                  🎯 **70%（本質価値）リリース基準**: {activeFocusTask.coreValue}
                </div>
              )}

              {/* Subtasks checklist inside Focus Mode */}
              <div style={{ marginTop: '20px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'bold' }}>サブタスクリスト (超細分化)</span>
                {activeFocusTask.subtasks && activeFocusTask.subtasks.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                    {activeFocusTask.subtasks.map(sub => (
                      <div 
                        key={sub.id}
                        onClick={() => {
                          // Allow checking subtask done in Focus mode as well
                          const updated = activeFocusTask.subtasks.map(s => s.id === sub.id ? { ...s, done: !s.done } : s);
                          const updatedTask = { ...activeFocusTask, subtasks: updated };
                          setTasks(prev => prev.map(t => t.id === activeFocusTask.id ? updatedTask : t));
                          setActiveFocusTask(updatedTask);
                          if (playSound) playSound('click');
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '10px 14px',
                          background: sub.done ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.04)',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          opacity: sub.done ? 0.5 : 1,
                          border: '1px solid var(--border-color)',
                          fontSize: '13px'
                        }}
                      >
                        {sub.done ? <CheckSquare size={16} style={{ color: 'var(--color-emerald)' }} /> : <Square size={16} />}
                        <span style={{ textDecoration: sub.done ? 'line-through' : 'none' }}>{sub.text}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ color: 'var(--text-muted)', fontSize: '12.5px', marginTop: '8px' }}>
                    細分化されたサブタスクはありません。タスク詳細画面から追加できます。
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Task Slicing / Details Modal */}
      {activeSliceTask && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(8px)',
          zIndex: 900,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '16px',
          boxSizing: 'border-box'
        }}>
          <div className="glass-panel" style={{
            maxWidth: '640px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '24px',
            background: 'var(--modal-bg)',
            border: '1px solid var(--modal-border)',
            borderRadius: '16px',
            boxShadow: 'var(--glass-shadow)',
            position: 'relative'
          }}>
            {/* Close Button */}
            <button 
              onClick={() => { playSound('click'); setActiveSliceTask(null); }}
              style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>

            {/* Task header */}
            <div style={{ marginBottom: '20px' }}>
              <span style={{ fontSize: '11px', color: 'var(--color-amber)', fontWeight: 'bold', letterSpacing: '1px' }}>
                TASK DECOMPOSER / SLICER
              </span>
              <h2 style={{ fontSize: '22px', fontWeight: 'bold', color: 'var(--text-primary)', marginTop: '4px' }}>
                {activeSliceTask.text}
              </h2>
              <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
                <span className="badge" style={{ background: 'rgba(255,255,255,0.03)', color: 'var(--text-secondary)', fontSize: '11px' }}>
                  📂 {activeSliceTask.category}
                </span>
                <span className="badge" style={{ 
                  background: activeSliceTask.impact === 'high' ? 'rgba(245,158,11,0.1)' : 'rgba(255,255,255,0.03)',
                  color: activeSliceTask.impact === 'high' ? 'var(--color-amber)' : 'var(--text-muted)',
                  fontSize: '11px'
                }}>
                  ★ {activeSliceTask.impact === 'high' ? '高価値' : '一般タスク'}
                </span>
                <span className="badge" style={{ 
                  background: activeSliceTask.urgency === 'high' ? 'rgba(244,63,94,0.1)' : 'rgba(255,255,255,0.03)',
                  color: activeSliceTask.urgency === 'high' ? '#f43f5e' : 'var(--text-muted)',
                  fontSize: '11px'
                }}>
                  ⏱ {activeSliceTask.urgency === 'high' ? '至急' : '予定'}
                </span>
              </div>
            </div>

            {/* Core vs Polish Definitions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px', paddingBottom: '20px', borderBottom: '1px solid var(--border-color)' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Target size={14} style={{ color: 'var(--color-amber)' }} /> 🎯 70% 本質価値の定義 (Core Value)
                </label>
                <input 
                  type="text" 
                  value={activeSliceTask.coreValue || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setTasks(prev => prev.map(t => t.id === activeSliceTask.id ? { ...t, coreValue: val } : t));
                    setActiveSliceTask(prev => ({ ...prev, coreValue: val }));
                  }}
                  placeholder="例: スライドに文字情報が過不足なく入っていること"
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--border-color)',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    color: '#fff',
                    marginTop: '4px',
                    fontSize: '13px'
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Sparkles size={14} style={{ color: 'var(--color-cyan)' }} /> ✨ 100% 装飾・こだわりの定義 (Polish - 後回し/捨てる項目)
                </label>
                <input 
                  type="text" 
                  value={activeSliceTask.polishValue || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setTasks(prev => prev.map(t => t.id === activeSliceTask.id ? { ...t, polishValue: val } : t));
                    setActiveSliceTask(prev => ({ ...prev, polishValue: val }));
                  }}
                  placeholder="例: イラストやアイコンの配置、フォントや色の微調整"
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--border-color)',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    color: '#fff',
                    marginTop: '4px',
                    fontSize: '13px'
                  }}
                />
              </div>
            </div>

            {/* Subtasks Section (Slicing) */}
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                🔪 タスク・スライサー <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 'normal' }}>(5分以内にできる粒度)</span>
              </h3>
              
              <form onSubmit={handleAddSubtask} style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <input 
                  type="text"
                  value={subtaskInput}
                  onChange={(e) => setSubtaskInput(e.target.value)}
                  placeholder="例: 関連するスプレッドシートを開く (5分以下)"
                  style={{
                    flex: 1,
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--border-color)',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '13px'
                  }}
                />
                <button 
                  type="submit" 
                  className="btn"
                  style={{ padding: '8px 16px', fontSize: '13px', background: 'var(--color-amber)', color: '#000', border: 'none', borderRadius: '8px' }}
                >
                  <Plus size={16} />
                </button>
              </form>

              {/* Subtask list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {activeSliceTask.subtasks && activeSliceTask.subtasks.length > 0 ? (
                  activeSliceTask.subtasks.map(sub => (
                    <div 
                      key={sub.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        opacity: sub.done ? 0.6 : 1
                      }}
                    >
                      <div 
                        onClick={() => handleToggleSubtask(sub.id)}
                        style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', flex: 1 }}
                      >
                        {sub.done ? <CheckSquare size={16} style={{ color: 'var(--color-emerald)' }} /> : <Square size={16} />}
                        <span style={{ textDecoration: sub.done ? 'line-through' : 'none', fontSize: '13.5px' }}>{sub.text}</span>
                      </div>
                      <button 
                        onClick={() => handleDeleteSubtask(sub.id)}
                        style={{ background: 'none', border: 'none', color: 'var(--color-rose)', cursor: 'pointer' }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))
                ) : (
                  <div style={{
                    textAlign: 'center',
                    padding: '24px',
                    border: '1px dashed var(--border-color)',
                    borderRadius: '8px',
                    color: 'var(--text-muted)',
                    fontSize: '13px'
                  }}>
                    タスクが細分化されていません。上記のフォームから、行動のハードルを下げる5分以内のアクションを追加しましょう。
                  </div>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ marginTop: '28px', paddingTop: '16px', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '12px' }}>
              <button 
                onClick={(e) => handleStartFocus(activeSliceTask, e)}
                className="btn"
                style={{
                  flex: 1,
                  padding: '10px',
                  background: 'var(--color-amber)',
                  color: '#000',
                  fontWeight: 'bold',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  border: 'none',
                  fontSize: '13.5px'
                }}
              >
                <Play size={16} /> このタスクで集中開始
              </button>
              <button 
                onClick={() => { playSound('click'); setActiveSliceTask(null); }}
                className="btn btn-secondary"
                style={{ flex: 1, padding: '10px', borderRadius: '10px', fontSize: '13.5px' }}
              >
                閉じる
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="glass-panel" style={{ padding: isMobile ? '20px' : '32px', border: '1px solid rgba(245, 158, 11, 0.2)', position: 'relative' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <span style={{ color: 'var(--color-amber)', fontWeight: 'bold', fontSize: '13px', letterSpacing: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Target size={14} /> LOGICATASK OPTIMIZER
            </span>
            <h2 style={{ fontFamily: 'var(--font-display)', marginTop: '4px', color: 'var(--text-primary)', fontSize: isMobile ? '22px' : '28px' }}>
              思考ハックタスク（LogicaTask）
            </h2>
          </div>
          
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button 
              onClick={handleExportData}
              className="btn btn-secondary"
              style={{ padding: '8px 12px', fontSize: '12.5px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}
              title="データをエクスポート"
            >
              <Download size={14} /> バックアップ
            </button>
            <label 
              className="btn btn-secondary"
              style={{ padding: '8px 12px', fontSize: '12.5px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
              title="データをインポート"
            >
              <Upload size={14} /> 復元
              <input type="file" onChange={handleImportData} accept=".json" style={{ display: 'none' }} />
            </label>
            <button 
              onClick={onBack} 
              className="btn btn-secondary"
              style={{ padding: '8px 16px', fontSize: '13px', borderRadius: '8px' }}
            >
              ← ポータルに戻る
            </button>
          </div>
        </div>

        {importError && (
          <div style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid var(--color-rose)', borderRadius: '8px', padding: '12px', color: 'var(--color-rose)', fontSize: '13px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} /> {importError}
          </div>
        )}

        {/* Task Form */}
        <form onSubmit={handleAddTask} className="glass-panel" style={{ padding: '20px', background: 'var(--bg-inner-box)', marginBottom: '32px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
            <Sliders size={16} style={{ color: 'var(--color-amber)' }} /> 新しいタスクを追加して脳をチューニングする
          </div>
          
          <div style={{ display: 'flex', gap: '12px', flexDirection: isMobile ? 'column' : 'row' }}>
            <input 
              type="text"
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              placeholder="何に取り組みますか？ (例: ブログ記事のプロット作成)"
              style={{
                flex: 2.5,
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-color)',
                padding: '10px 14px',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '13.5px'
              }}
            />
            
            <div style={{ display: 'flex', gap: '8px', flex: 1 }}>
              <select
                value={newImpact}
                onChange={(e) => setNewImpact(e.target.value)}
                style={{
                  flex: 1,
                  background: '#0e0f15',
                  border: '1px solid var(--border-color)',
                  padding: '10px',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '12.5px'
                }}
              >
                <option value="high">🌟 高価値 (成果大)</option>
                <option value="low">☕ 一般 (通常/雑用)</option>
              </select>

              <select
                value={newUrgency}
                onChange={(e) => setNewUrgency(e.target.value)}
                style={{
                  flex: 1,
                  background: '#0e0f15',
                  border: '1px solid var(--border-color)',
                  padding: '10px',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '12.5px'
                }}
              >
                <option value="high">🚨 至急 (今日明日)</option>
                <option value="low">📅 予定 (後でよい)</option>
              </select>
            </div>

            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              style={{
                flex: 0.5,
                background: '#0e0f15',
                border: '1px solid var(--border-color)',
                padding: '10px',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '12.5px'
              }}
            >
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>

          {/* Optional MVP Definitions for high focus */}
          {!isMobile && (
            <div style={{ display: 'flex', gap: '12px', background: 'rgba(0,0,0,0.1)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.02)' }}>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'bold' }}>🎯 70% 本質定義 (妥協基準)</span>
                <input 
                  type="text" 
                  value={newCoreValue}
                  onChange={(e) => setNewCoreValue(e.target.value)}
                  placeholder="例: 全体の骨子がテキストで完成していること"
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--border-color)',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    color: '#fff',
                    marginTop: '4px',
                    fontSize: '12px'
                  }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'bold' }}>✨ 100% 装飾定義 (捨てる項目)</span>
                <input 
                  type="text" 
                  value={newPolishValue}
                  onChange={(e) => setNewPolishValue(e.target.value)}
                  placeholder="例: フォントの微調整やデザインの完璧な装飾"
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--border-color)',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    color: '#fff',
                    marginTop: '4px',
                    fontSize: '12px'
                  }}
                />
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button 
              type="submit" 
              className="btn"
              style={{
                background: 'linear-gradient(135deg, var(--color-amber) 0%, #d97706 100%)',
                color: '#000',
                fontWeight: 'bold',
                padding: '10px 24px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '13.5px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Plus size={16} /> タスクを登録して分類する
            </button>
          </div>
        </form>

        {/* Eisenhower Matrix Grid */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Clock size={18} style={{ color: 'var(--color-amber)' }} />
            <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 'bold' }}>優先順位自動マトリクス (Eisenhower Matrix)</span>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
            gap: '20px',
            width: '100%'
          }}>
            
            {/* Quadrant I: Urgent & Important */}
            <div className="glass-panel" style={{
              background: 'rgba(244, 63, 94, 0.02)',
              border: '1px solid rgba(244, 63, 94, 0.15)',
              borderRadius: '16px',
              padding: '16px',
              textAlign: 'left'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid rgba(244,63,94,0.1)', paddingBottom: '8px' }}>
                <span style={{ color: '#f43f5e', fontWeight: 'bold', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldAlert size={14} /> 最優先 (Do First)
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>重要 × 至急</span>
              </div>
              {renderTaskList(getQuadrantTasks('high', 'high'))}
            </div>

            {/* Quadrant II: Important but Not Urgent */}
            <div className="glass-panel" style={{
              background: 'rgba(6, 182, 212, 0.02)',
              border: '1px solid rgba(6, 182, 212, 0.15)',
              borderRadius: '16px',
              padding: '16px',
              textAlign: 'left'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid rgba(6,182,212,0.1)', paddingBottom: '8px' }}>
                <span style={{ color: 'var(--color-cyan)', fontWeight: 'bold', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Target size={14} /> 計画・自己投資 (Schedule)
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>重要 × 予定</span>
              </div>
              {renderTaskList(getQuadrantTasks('high', 'low'))}
            </div>

            {/* Quadrant III: Urgent but Not Important */}
            <div className="glass-panel" style={{
              background: 'rgba(139, 92, 246, 0.02)',
              border: '1px solid rgba(139, 92, 246, 0.15)',
              borderRadius: '16px',
              padding: '16px',
              textAlign: 'left'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid rgba(139,92,246,0.1)', paddingBottom: '8px' }}>
                <span style={{ color: 'var(--color-primary)', fontWeight: 'bold', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clock size={14} /> 効率化/スキマ (Delegate/Batch)
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>一般 × 至急</span>
              </div>
              {renderTaskList(getQuadrantTasks('low', 'high'))}
            </div>

            {/* Quadrant IV: Not Urgent & Not Important */}
            <div className="glass-panel" style={{
              background: 'rgba(255, 255, 255, 0.01)',
              border: '1px solid var(--border-color)',
              borderRadius: '16px',
              padding: '16px',
              textAlign: 'left'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: 'bold', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Trash2 size={14} /> 整理/削減 (Eliminate)
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>一般 × 予定</span>
              </div>
              {renderTaskList(getQuadrantTasks('low', 'low'))}
            </div>

          </div>
        </div>

      </div>
    </div>
  );

  // Helper renderer for task items list inside Eisenhower quadrant
  function renderTaskList(quadrantTasks) {
    if (quadrantTasks.length === 0) {
      return (
        <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12.5px' }}>
          タスクはありません
        </div>
      );
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {quadrantTasks.map(task => {
          const completedSubs = (task.subtasks || []).filter(s => s.done).length;
          const totalSubs = (task.subtasks || []).length;
          const isDone = task.status === 'done';

          return (
            <div 
              key={task.id}
              onClick={() => { playSound('click'); setActiveSliceTask(task); }}
              className="glass-panel"
              style={{
                padding: '12px 14px',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid var(--border-color)',
                borderRadius: '10px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                opacity: isDone ? 0.5 : 1,
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.4)';
                e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-color)';
                e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
              }}
            >
              {/* Top row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                <span style={{ 
                  fontWeight: 'bold', 
                  fontSize: '13.5px', 
                  color: isDone ? 'var(--text-muted)' : 'var(--text-primary)',
                  textDecoration: isDone ? 'line-through' : 'none',
                  lineHeight: '1.4',
                  wordBreak: 'break-all'
                }}>
                  {task.text}
                </span>

                <div style={{ display: 'flex', gap: '8px', flexShrink: 0, alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
                  
                  {/* Status Toggle */}
                  <select
                    value={task.status}
                    onChange={(e) => handleUpdateTaskStatus(task.id, e.target.value)}
                    style={{
                      background: '#0e0f15',
                      border: '1px solid var(--border-color)',
                      padding: '3px 6px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      color: task.status === 'done' ? 'var(--text-muted)' : 'var(--color-amber)',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="todo">未着手</option>
                    <option value="focusing">集中中</option>
                    <option value="done">完了</option>
                  </select>

                  <button 
                    onClick={(e) => handleDeleteTask(task.id, e)}
                    style={{ background: 'none', border: 'none', color: 'var(--color-rose)', cursor: 'pointer', padding: '2px' }}
                    title="タスクを削除"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {/* Bottom Row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'var(--text-muted)' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{ background: 'rgba(255,255,255,0.03)', padding: '2px 6px', borderRadius: '4px' }}>
                    {task.category}
                  </span>
                  
                  {totalSubs > 0 && (
                    <span style={{ color: completedSubs === totalSubs ? 'var(--color-emerald)' : 'var(--color-amber)', fontWeight: 'bold' }}>
                      📋 {completedSubs}/{totalSubs}
                    </span>
                  )}

                  {task.coreValue && (
                    <span title={`70%基準: ${task.coreValue}`} style={{ color: 'var(--color-amber)' }}>
                      🎯 MVP定義あり
                    </span>
                  )}
                </div>

                {/* Focus Play Button */}
                <button
                  onClick={(e) => handleStartFocus(task, e)}
                  className="btn"
                  style={{
                    background: 'rgba(245, 158, 11, 0.15)',
                    border: '1px solid var(--color-amber)',
                    color: 'var(--color-amber)',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    fontSize: '10.5px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--color-amber)';
                    e.currentTarget.style.color = '#000';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(245, 158, 11, 0.15)';
                    e.currentTarget.style.color = 'var(--color-amber)';
                  }}
                >
                  <Play size={10} fill="currentColor" /> 集中開始
                </button>
              </div>

            </div>
          );
        })}
      </div>
    );
  }
}
