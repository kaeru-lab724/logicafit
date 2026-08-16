/**
 * LogicaImpact — Task & Impact Designer
 * Side-Panel Optimized / Zero-Server Client Script
 */

(function () {
  'use strict';

  // --- Constants & Storage Keys ---
  const STORAGE_KEY_GOALS = 'logica_impact_user_goals';
  const STORAGE_KEY_PROJECTS = 'logica_impact_projects';
  const STORAGE_KEY_THEME = 'logica_impact_theme';
  const DEFAULT_GOALS = [
    'CC部門の生産性向上（処理時間短縮・標準化）',
    '研修カリキュラム・スクリプトの型化による教育期間短縮',
    '業務プロセスの可視化と重大ミスの再発防止ゼロ化'
  ];
  const DEFAULT_PROJECTS = ['2026年新卒研修', 'CC運用改善', '社内ナレッジ刷新'];

  // --- State ---
  let userGoals = [];
  let userProjects = [];
  let selectedGoalIndices = [0]; // Multi-select array
  let currentTheme = 'dark';

  // --- DOM Elements ---
  const selectTheme = document.getElementById('select-theme');
  const goalPillsContainer = document.getElementById('goal-pills');
  const btnEditGoalsInline = document.getElementById('btn-edit-goals-inline');
  const inputProjectName = document.getElementById('input-project-name');
  const projectChipsContainer = document.getElementById('project-chips');
  const taskTitleInput = document.getElementById('input-task-title');
  const actionListContainer = document.getElementById('action-list');
  const btnAddAction = document.getElementById('btn-add-action');
  const inputPerspective = document.getElementById('input-perspective');
  const inputReviewDate = document.getElementById('input-review-date');
  const perspectiveTagsContainer = document.getElementById('perspective-tags');
  const quickDateChips = document.querySelectorAll('.date-chip');

  const btnCopyOneNote = document.getElementById('btn-copy-onenote');
  const btnCopyToDo = document.getElementById('btn-copy-todo');
  const btnClearAll = document.getElementById('btn-clear-all');

  // Navigation Tabs
  const navTabs = document.querySelectorAll('.nav-tab');
  const tabContents = document.querySelectorAll('.tab-content');

  // Review Prompt Elements
  const promptReviewTable = document.getElementById('prompt-review-table');
  const btnGenReviewPrompt = document.getElementById('btn-generate-review-prompt');
  const reviewPromptOutputSection = document.getElementById('review-prompt-output-section');
  const reviewPromptOutput = document.getElementById('review-prompt-output');
  const btnCopyReviewPrompt = document.getElementById('btn-copy-review-prompt');

  // Settings Modal
  const btnSettingsToggle = document.getElementById('btn-settings-toggle');
  const settingsModal = document.getElementById('settings-modal');
  const btnCloseModal = document.getElementById('btn-close-modal');
  const btnSaveGoals = document.getElementById('btn-save-goals');

  // Toast
  const toast = document.getElementById('toast');
  const toastMsg = document.getElementById('toast-msg');

  // --- Helper Functions ---
  function showToast(message) {
    toastMsg.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 2400);
  }

  function formatDate(d) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function setDateOffset(days) {
    const target = new Date();
    target.setDate(target.getDate() + days);
    inputReviewDate.value = formatDate(target);
  }

  // --- Theme Management ---
  function applyTheme(theme) {
    currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    if (selectTheme) {
      selectTheme.value = theme;
    }
    localStorage.setItem(STORAGE_KEY_THEME, theme);
  }

  function loadTheme() {
    const saved = localStorage.getItem(STORAGE_KEY_THEME) || 'dark';
    applyTheme(saved);
  }

  // --- Storage & Project Management ---
  function loadProjects() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_PROJECTS);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Normalize array of strings or objects
        userProjects = parsed.map(item => {
          if (typeof item === 'string') {
            return { name: item, visible: true };
          }
          return item;
        });
      } else {
        userProjects = DEFAULT_PROJECTS.map(name => ({ name, visible: true }));
      }
    } catch (e) {
      userProjects = DEFAULT_PROJECTS.map(name => ({ name, visible: true }));
    }
    renderProjectChips();
  }

  function saveProjectToHistory(projectName) {
    if (!projectName || !projectName.trim()) return;
    const name = projectName.trim();
    const existing = userProjects.find(p => p.name === name);
    if (existing) {
      existing.visible = true; // ensure visible
    } else {
      userProjects.unshift({ name, visible: true });
    }
    localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(userProjects));
    renderProjectChips();
  }

  function removeProjectFromHistory(projectName) {
    userProjects = userProjects.filter(p => p.name !== projectName);
    localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(userProjects));
    if (inputProjectName.value === projectName) {
      inputProjectName.value = '';
    }
    renderProjectChips();
    renderModalProjects();
    showToast(`「${projectName}」を削除しました`);
  }

  function renderProjectChips() {
    if (!projectChipsContainer) return;
    projectChipsContainer.innerHTML = '';

    // Update Datalist with all project names
    const datalist = document.getElementById('project-history-list');
    if (datalist) {
      datalist.innerHTML = '';
      userProjects.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.name;
        datalist.appendChild(opt);
      });
    }

    // Render all projects marked as visible (no limit)
    const visibleProjects = userProjects.filter(p => p.visible !== false);

    visibleProjects.forEach(p => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = `project-chip ${inputProjectName.value === p.name ? 'active' : ''}`;
      chip.textContent = p.name;
      chip.addEventListener('click', () => {
        if (inputProjectName.value === p.name) {
          inputProjectName.value = '';
        } else {
          inputProjectName.value = p.name;
        }
        renderProjectChips();
      });
      projectChipsContainer.appendChild(chip);
    });
  }

  function renderModalProjects() {
    const modalProjectList = document.getElementById('modal-project-list');
    if (!modalProjectList) return;
    modalProjectList.innerHTML = '';

    if (userProjects.length === 0) {
      modalProjectList.innerHTML = '<div style="font-size: 11px; color: var(--text-dim); padding: 4px;">登録された案件・PJはありません</div>';
      return;
    }

    userProjects.forEach(p => {
      const item = document.createElement('div');
      item.className = `modal-project-item ${p.visible === false ? 'hidden-proj' : ''}`;

      const label = document.createElement('label');
      label.className = 'modal-project-label';

      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = (p.visible !== false);
      cb.addEventListener('change', () => {
        p.visible = cb.checked;
        item.classList.toggle('hidden-proj', !cb.checked);
      });

      const span = document.createElement('span');
      span.textContent = p.name;

      label.appendChild(cb);
      label.appendChild(span);

      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'modal-project-del-btn';
      delBtn.innerHTML = '🗑️';
      delBtn.title = '削除';
      delBtn.addEventListener('click', () => {
        removeProjectFromHistory(p.name);
      });

      item.appendChild(label);
      item.appendChild(delBtn);
      modalProjectList.appendChild(item);
    });
  }

  // --- Storage & Goal Management ---
  function loadGoals() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_GOALS);
      if (stored) {
        userGoals = JSON.parse(stored);
      } else {
        userGoals = [...DEFAULT_GOALS];
      }
    } catch (e) {
      userGoals = [...DEFAULT_GOALS];
    }
    renderGoalPills();
  }

  function saveGoals(newGoals) {
    userGoals = newGoals.filter(g => g.trim().length > 0);
    if (userGoals.length === 0) {
      userGoals = [...DEFAULT_GOALS];
    }
    localStorage.setItem(STORAGE_KEY_GOALS, JSON.stringify(userGoals));
    selectedGoalIndices = selectedGoalIndices.filter(i => i < userGoals.length);
    if (selectedGoalIndices.length === 0) {
      selectedGoalIndices = [0];
    }
    renderGoalPills();
  }

  function renderGoalPills() {
    if (!goalPillsContainer) return;
    goalPillsContainer.innerHTML = '';

    userGoals.forEach((goalText, idx) => {
      const isSelected = selectedGoalIndices.includes(idx);
      const pill = document.createElement('button');
      pill.type = 'button';
      pill.className = `goal-pill ${isSelected ? 'active' : ''}`;
      pill.innerHTML = `
        <span class="goal-pill-dot"></span>
        <span>目標${idx + 1}: ${escapeHtml(goalText)}</span>
      `;
      pill.addEventListener('click', () => {
        // Toggle selection
        if (selectedGoalIndices.includes(idx)) {
          if (selectedGoalIndices.length > 1) {
            selectedGoalIndices = selectedGoalIndices.filter(i => i !== idx);
          }
        } else {
          selectedGoalIndices.push(idx);
        }
        renderGoalPills();
      });
      goalPillsContainer.appendChild(pill);
    });
  }

  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // --- Action List Handlers ---
  function createActionRow(value = '', focus = false) {
    const row = document.createElement('div');
    row.className = 'action-row';

    const indexSpan = document.createElement('span');
    indexSpan.className = 'action-index';

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'action-input';
    input.placeholder = 'アクション（Enterで次行）';
    input.value = value;
    input.autocomplete = 'off';

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'action-remove-btn';
    removeBtn.innerHTML = '&times;';
    removeBtn.title = '削除';

    removeBtn.addEventListener('click', () => {
      if (actionListContainer.children.length > 1) {
        row.remove();
        updateActionIndices();
      } else {
        input.value = '';
      }
    });

    // Keyboard navigation (Fixed for IME Japanese input)
    input.addEventListener('keydown', (e) => {
      // Ignore Enter if IME composition is active (converting Japanese text)
      if (e.isComposing || e.keyCode === 229) {
        return;
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        const nextRow = createActionRow('', true);
        row.after(nextRow);
        updateActionIndices();
      } else if (e.key === 'Backspace' && input.value === '') {
        if (actionListContainer.children.length > 1) {
          e.preventDefault();
          const prevRow = row.previousElementSibling || row.nextElementSibling;
          row.remove();
          updateActionIndices();
          if (prevRow) {
            const prevInput = prevRow.querySelector('.action-input');
            if (prevInput) prevInput.focus();
          }
        }
      }
    });

    row.appendChild(indexSpan);
    row.appendChild(input);
    row.appendChild(removeBtn);

    if (focus) {
      setTimeout(() => input.focus(), 10);
    }

    return row;
  }

  function updateActionIndices() {
    const rows = actionListContainer.querySelectorAll('.action-row');
    rows.forEach((row, i) => {
      const idxSpan = row.querySelector('.action-index');
      if (idxSpan) idxSpan.textContent = `${i + 1}.`;
    });
  }

  function initDefaultActions() {
    actionListContainer.innerHTML = '';
    actionListContainer.appendChild(createActionRow());
    actionListContainer.appendChild(createActionRow());
    updateActionIndices();
  }

  function getActions() {
    const inputs = actionListContainer.querySelectorAll('.action-input');
    const actions = [];
    inputs.forEach(input => {
      const val = input.value.trim();
      if (val) actions.push(val);
    });
    return actions;
  }

  // --- Quick Tags & Chips ---
  perspectiveTagsContainer.addEventListener('click', (e) => {
    const chip = e.target.closest('.tag-chip');
    if (!chip) return;
    const tagText = chip.getAttribute('data-tag');
    if (!tagText) return;

    let current = inputPerspective.value.trim();
    if (current.includes(tagText)) {
      // remove
      current = current.replace(new RegExp(`(^|,\\s*)${tagText}`, 'g'), '').replace(/^,\s*/, '');
    } else {
      // append
      current = current ? `${current}、${tagText}` : tagText;
    }
    inputPerspective.value = current;
  });

  quickDateChips.forEach(chip => {
    chip.addEventListener('click', () => {
      quickDateChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      const days = parseInt(chip.getAttribute('data-days'), 10);
      if (days === 0) {
        inputReviewDate.value = '';
      } else {
        setDateOffset(days);
      }
    });
  });

  inputReviewDate.addEventListener('change', () => {
    // When manually picked, clear chips active state
    quickDateChips.forEach(c => c.classList.remove('active'));
  });

  // --- Copy Actions ---
  async function copyOneNoteTable() {
    const rawTaskTitle = taskTitleInput.value.trim() || '（無題のタスク）';
    const projectName = inputProjectName.value.trim();
    if (projectName) {
      saveProjectToHistory(projectName);
    }
    const fullTaskTitle = projectName ? `【${projectName}】${rawTaskTitle}` : rawTaskTitle;

    const actions = getActions();
    const perspective = inputPerspective.value.trim() || (inputReviewDate.value ? '効果測定・改善確認' : '―');
    const reviewDate = inputReviewDate.value || '―';
    const today = formatDate(new Date());

    // Selected goals text formatted
    const selectedGoalsText = selectedGoalIndices
      .map(i => `目標${i + 1}: ${userGoals[i]}`)
      .join('<br>') || '未指定';

    // Format Actions list
    const actionListHtml = actions.length > 0
      ? `<ul style="margin: 0; padding-left: 18px;">${actions.map(a => `<li>${escapeHtml(a)}</li>`).join('')}</ul>`
      : '―';

    // Rich HTML Table for OneNote
    const htmlContent = `
      <table border="1" cellpadding="6" cellspacing="0" style="border-collapse: collapse; font-family: 'Segoe UI', Arial, sans-serif; font-size: 13px; color: #222; border: 1px solid #ccc; width: 100%;">
        <thead>
          <tr style="background-color: #f1f5f9; text-align: left;">
            <th style="padding: 8px; border: 1px solid #cbd5e1; width: 70px;">実行日</th>
            <th style="padding: 8px; border: 1px solid #cbd5e1;">タスク（実施内容）</th>
            <th style="padding: 8px; border: 1px solid #cbd5e1; width: 85px;">確認予定</th>
            <th style="padding: 8px; border: 1px solid #cbd5e1;">効果測定の観点</th>
            <th style="padding: 8px; border: 1px solid #cbd5e1; min-width: 150px; background-color: #fef3c7;">🎯 実際の結果・変化（事後追記）</th>
            <th style="padding: 8px; border: 1px solid #cbd5e1; width: 130px;">紐づく目標</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding: 8px; border: 1px solid #cbd5e1; vertical-align: top;">${today}</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1; vertical-align: top;">
              <strong>${escapeHtml(fullTaskTitle)}</strong>
              ${actionListHtml}
            </td>
            <td style="padding: 8px; border: 1px solid #cbd5e1; vertical-align: top; font-weight: bold; color: #2563eb;">${reviewDate}</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1; vertical-align: top;">${escapeHtml(perspective).replace(/\n/g, '<br>')}</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1; vertical-align: top; background-color: #fffbeb;"></td>
            <td style="padding: 8px; border: 1px solid #cbd5e1; vertical-align: top; font-size: 11px; color: #475569;">${selectedGoalsText}</td>
          </tr>
        </tbody>
      </table>
    `;

    // Plain Text fallback
    const plainGoals = selectedGoalIndices.map(i => `目標${i + 1}: ${userGoals[i]}`).join(', ');
    const plainActions = actions.map((a, i) => `  ${i + 1}. ${a}`).join('\n');
    const plainContent = `[${today}] ${fullTaskTitle}\n${plainActions}\n【確認予定: ${reviewDate}】\n【観点】${perspective}\n【紐づく目標】${plainGoals}\n【実際の結果】（後日記入）`;

    try {
      if (navigator.clipboard && window.ClipboardItem) {
        const blobHtml = new Blob([htmlContent], { type: 'text/html' });
        const blobPlain = new Blob([plainContent], { type: 'text/plain' });
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/html': blobHtml,
            'text/plain': blobPlain
          })
        ]);
      } else {
        await navigator.clipboard.writeText(plainContent);
      }
      showToast('OneNote用テーブルをコピーしました！');
    } catch (err) {
      console.error('Clipboard error:', err);
      showToast('⚠️ コピーに失敗しました');
    }
  }

  async function copyToDoText() {
    const rawTaskTitle = taskTitleInput.value.trim() || '（無題のタスク）';
    const projectName = inputProjectName.value.trim();
    if (projectName) {
      saveProjectToHistory(projectName);
    }
    const fullTaskTitle = projectName ? `【${projectName}】${rawTaskTitle}` : rawTaskTitle;

    const actions = getActions();
    const reviewDate = inputReviewDate.value || '―';

    let text = `${fullTaskTitle}\n`;
    actions.forEach(a => {
      text += ` [ ] ${a}\n`;
    });
    if (inputReviewDate.value) {
      text += ` [ ] ★事後確認（${reviewDate}）: ${inputPerspective.value.trim() || '効果測定'}`;
    }

    try {
      await navigator.clipboard.writeText(text);
      showToast('To Do用テキストをコピーしました！');
    } catch (err) {
      showToast('⚠️ コピーに失敗しました');
    }
  }

  function clearAllInputs() {
    if (confirm('入力内容をクリアしますか？')) {
      taskTitleInput.value = '';
      inputPerspective.value = '';
      initDefaultActions();
      setDateOffset(21);
      quickDateChips.forEach(c => c.classList.remove('active'));
      quickDateChips[3].classList.add('active'); // 3 weeks
      showToast('入力をクリアしました');
    }
  }

  // --- Tab Navigation ---
  navTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.getAttribute('data-tab');
      navTabs.forEach(t => t.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));

      tab.classList.add('active');
      const targetContent = document.getElementById(`tab-${target}`);
      if (targetContent) targetContent.classList.add('active');
    });
  });

  // --- Review Prompt Generator (Quarter End) ---
  if (btnGenReviewPrompt) {
    btnGenReviewPrompt.addEventListener('click', () => {
      const tableData = promptReviewTable.value.trim();
      if (!tableData) {
        alert('OneNoteの成果表を貼り付けてください');
        return;
      }

      const promptText = `あなたは優秀な人事評価面談のエキスパートです。
以下の【今期の実績データ（OneNoteの成果記録）】を元に、上長面談用の【自己評価シート（実績報告ドラフト）】を作成してください。

【今期の成果記録データ】
${tableData}

【出力要件】
1. 紐づく目標ごとに整理・構造化してください。
2. 各取り組みについて、STAR法（Situation: 課題背景, Task: 目標, Action: 実行した施策, Result: 測定された具体的成果・組織貢献）で簡潔かつ説得力のある文章に仕立ててください。
3. 最後に「今期の総括と組織への付加価値貢献」「次期に向けた改善提案」を添えてください。
4. 謙虚でありながら、客観的ファクト（数値や定着度）を強調したプロフェッショナルなトーンで作成してください。`;

      reviewPromptOutput.textContent = promptText;
      reviewPromptOutputSection.classList.remove('hidden');
    });
  }

  if (btnCopyReviewPrompt) {
    btnCopyReviewPrompt.addEventListener('click', async () => {
      await navigator.clipboard.writeText(reviewPromptOutput.textContent);
      showToast('業績評価プロンプトをコピーしました！');
    });
  }

  // --- Modal (Settings & Master Management) ---
  const btnEditProjectsInline = document.getElementById('btn-edit-projects-inline');
  const modalNewProjectInput = document.getElementById('modal-new-project-input');
  const btnModalAddProject = document.getElementById('btn-modal-add-project');
  const btnSaveSettings = document.getElementById('btn-save-settings');

  function openSettingsModal() {
    for (let i = 1; i <= 4; i++) {
      const input = document.getElementById(`goal-input-${i}`);
      if (input) {
        input.value = userGoals[i - 1] || '';
      }
    }
    renderModalProjects();
    if (settingsModal) settingsModal.classList.remove('hidden');
  }

  if (btnEditGoalsInline) {
    btnEditGoalsInline.addEventListener('click', openSettingsModal);
  }

  if (btnEditProjectsInline) {
    btnEditProjectsInline.addEventListener('click', openSettingsModal);
  }

  if (btnModalAddProject && modalNewProjectInput) {
    btnModalAddProject.addEventListener('click', () => {
      const val = modalNewProjectInput.value.trim();
      if (!val) return;
      if (!userProjects.some(p => p.name === val)) {
        userProjects.unshift({ name: val, visible: true });
        modalNewProjectInput.value = '';
        renderModalProjects();
      } else {
        alert('その案件・PJ名はすでに登録されています');
      }
    });
  }

  if (btnCloseModal && settingsModal) {
    btnCloseModal.addEventListener('click', () => {
      settingsModal.classList.add('hidden');
    });
  }

  if (settingsModal) {
    settingsModal.addEventListener('click', (e) => {
      if (e.target === settingsModal) {
        settingsModal.classList.add('hidden');
      }
    });
  }

  if (btnSaveSettings) {
    btnSaveSettings.addEventListener('click', () => {
      // Save Goals
      const newGoals = [];
      for (let i = 1; i <= 4; i++) {
        const input = document.getElementById(`goal-input-${i}`);
        if (input && input.value.trim()) {
          newGoals.push(input.value.trim());
        }
      }
      saveGoals(newGoals);

      // Save Projects
      localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(userProjects));
      renderProjectChips();

      if (settingsModal) settingsModal.classList.add('hidden');
      showToast('マスター設定を保存しました！');
    });
  }

  // --- Initialize ---
  function init() {
    loadTheme();
    loadProjects();
    loadGoals();
    initDefaultActions();
    setDateOffset(21); // Default +3 weeks

    if (selectTheme) {
      selectTheme.addEventListener('change', (e) => {
        applyTheme(e.target.value);
        showToast(`テーマを「${e.target.selectedOptions[0].text}」に変更しました`);
      });
    }

    if (btnAddAction) {
      btnAddAction.addEventListener('click', () => {
        const newRow = createActionRow('', true);
        actionListContainer.appendChild(newRow);
        updateActionIndices();
      });
    }

    btnCopyOneNote.addEventListener('click', copyOneNoteTable);
    btnCopyToDo.addEventListener('click', copyToDoText);
    btnClearAll.addEventListener('click', clearAllInputs);

    // Load Sample Button
    const btnLoadSample = document.getElementById('btn-load-sample');
    if (btnLoadSample) {
      btnLoadSample.addEventListener('click', () => {
        inputProjectName.value = '2026年新卒研修';
        renderProjectChips();

        taskTitleInput.value = '研修スクリプトの作成・型化';
        
        actionListContainer.innerHTML = '';
        const sampleActions = [
          'スキルマップを参照して必須スキルを抽出する',
          '時系列でカリキュラムを並べて過不足を洗い出す',
          'リーダー・上長へ報告して最終確定する'
        ];
        sampleActions.forEach(text => {
          actionListContainer.appendChild(createActionRow(text));
        });
        updateActionIndices();

        inputPerspective.value = 'スクリプト導入後の問い合わせ件数・保留時間の削減';
        setDateOffset(21);
        quickDateChips.forEach(c => c.classList.remove('active'));
        quickDateChips[3].classList.add('active'); // 3 weeks

        showToast('サンプルデータを入力しました！');
      });
    }
  }

  // Run on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
