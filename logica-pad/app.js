/* ==========================================================================
   LogicaPad - Application Logic (Compact Resident & Responsive Supported)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // State Management
  let items = loadStorage();
  let activeItemId = null;
  let currentFilter = 'all';

  // DOM Elements - Navigation & Sidebar
  const sidebar = document.getElementById('sidebar');
  const sidebarOverlay = document.getElementById('sidebar-overlay');
  const btnToggleSidebar = document.getElementById('btn-toggle-sidebar');
  const btnCloseSidebar = document.getElementById('btn-close-sidebar');
  const btnOpenSidebarEmpty = document.getElementById('btn-open-sidebar-empty');

  // DOM Elements - Main Workspace
  const quickInput = document.getElementById('quick-input');
  const itemList = document.getElementById('item-list');
  const emptyState = document.getElementById('empty-state');
  const workspace = document.getElementById('workspace');

  // Workspace Inputs & Tools
  const itemTitle = document.getElementById('item-title');
  const itemStatusTag = document.getElementById('item-status-tag');
  const modeButtons = document.querySelectorAll('.mode-btn');
  const modeViews = {
    action: document.getElementById('view-action'),
    logica: document.getElementById('view-logica')
  };

  // Content Inputs
  const inputCommonMemo = document.getElementById('input-common-memo');
  const inputFirstAction = document.getElementById('input-first-action');
  const inputActionMemo = document.getElementById('input-action-memo');
  
  // Logica Inputs
  const inputFact = document.getElementById('input-fact');
  const inputUnknown = document.getElementById('input-unknown');
  const inputIssue = document.getElementById('input-issue');
  const inputHypothesis = document.getElementById('input-hypothesis');
  const inputLogicaFirstAction = document.getElementById('input-logica-first-action');
  const inputScript = document.getElementById('input-script');

  // Preview & Buttons
  const onenotePreview = document.getElementById('onenote-preview');
  const btnCopyOnenote = document.getElementById('btn-copy-onenote');
  const btnCopyOnenoteBottom = document.getElementById('btn-copy-onenote-bottom');
  const btnCompleteToggle = document.getElementById('btn-complete-toggle');
  const btnDeleteItem = document.getElementById('btn-delete-item');
  const filterChips = document.querySelectorAll('.filter-chip');
  const btnThemeToggle = document.getElementById('btn-theme-toggle');
  const themeIcon = document.getElementById('theme-icon');

  // Initialize Lucide Icons
  if (window.lucide) {
    lucide.createIcons();
  }

  // --- Initial Setup ---
  renderItemList();
  setupTheme();

  // サンプルデータが無い場合の自動生成
  if (items.length === 0) {
    createSampleData();
  } else {
    selectItem(items[0].id);
  }

  // 初期ロード時、小画面なら確実にサイドバーを閉じる
  if (window.innerWidth <= 850) {
    closeSidebar();
  }

  // --- Sidebar Drawer Control ---
  function openSidebar() {
    sidebar.classList.add('open');
    sidebarOverlay.classList.add('show');
  }

  function closeSidebar() {
    sidebar.classList.remove('open');
    sidebarOverlay.classList.remove('show');
  }

  // リサイズ時の安全処理
  window.addEventListener('resize', () => {
    if (window.innerWidth > 851) {
      closeSidebar();
    }
  });

  btnToggleSidebar.addEventListener('click', openSidebar);
  if (btnCloseSidebar) btnCloseSidebar.addEventListener('click', closeSidebar);
  sidebarOverlay.addEventListener('click', closeSidebar);
  if (btnOpenSidebarEmpty) btnOpenSidebarEmpty.addEventListener('click', openSidebar);

  // --- Event Listeners ---

  // 1. クイック入力 (Enterで即時作成)
  quickInput.addEventListener('keydown', (e) => {
    // 日本語の漢字変換確定Enter（isComposing）の場合は送信しない！
    if (e.isComposing || e.keyCode === 229) {
      return;
    }

    if (e.key === 'Enter' && quickInput.value.trim() !== '') {
      const text = quickInput.value.trim();
      quickInput.value = '';

      const lines = text.split('\n');
      const title = lines[0].length > 20 ? lines[0].substring(0, 20) + '...' : lines[0];

      const newItem = {
        id: 'item_' + Date.now(),
        title: title,
        mode: 'none',
        status: 'active',
        createdAt: new Date().toISOString(),
        simpleContent: text,
        firstAction: '',
        actionMemo: '',
        fact: '',
        unknown: '',
        issue: '',
        hypothesis: '',
        script: ''
      };

      items.unshift(newItem);
      saveStorage();
      renderItemList();
      selectItem(newItem.id);
      closeSidebar(); // モバイル/スリム画面時に閉じる
      showToast('メモをキャプチャしました！');
    }
  });

  // 2. フィルタチップ切替
  filterChips.forEach(chip => {
    chip.addEventListener('click', () => {
      filterChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      currentFilter = chip.dataset.filter;
      renderItemList();
    });
  });

  // 3. アクション展開モード切替（思考の深化パイプライン）
  modeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const item = getActiveItem();
      if (!item) return;

      const newMode = btn.dataset.mode;
      item.mode = newMode;

      // ★ 思考の引き継ぎロジック
      // 1. メモから初動10秒への引き継ぎ
      if (newMode === 'action' && !item.firstAction && item.simpleContent) {
        const firstLine = item.simpleContent.trim().split('\n')[0];
        item.firstAction = firstLine.replace(/^[・\-\*]\s*/, '');
      }

      // 2. 初動10秒からLogica思考への引き継ぎ（既に入力されていれば相互同期）
      if (newMode === 'logica') {
        if (!item.firstAction && item.simpleContent) {
          const firstLine = item.simpleContent.trim().split('\n')[0];
          item.firstAction = firstLine.replace(/^[・\-\*]\s*/, '');
        }
      }

      saveStorage();
      updateModeUI(newMode);
      renderWorkspace(); // フォーム全体の表示を引き継ぎデータで再描画
      renderItemList();
      updatePreview();
    });
  });

  // 4. リアルタイム入力連動 (相互自動同期)
  const bindInput = (el, key) => {
    if (!el) return;
    el.addEventListener('input', () => {
      const item = getActiveItem();
      if (!item) return;
      item[key] = el.value;

      // 共通メモ更新時、タイトル自動設定
      if (key === 'simpleContent' && (!item.title || item.title === '新規メモ')) {
        const firstLine = el.value.trim().split('\n')[0];
        if (firstLine) item.title = firstLine.substring(0, 20);
        itemTitle.value = item.title;
      }

      // ★ 思考の相互連動: 初動10秒アクションの二方向完全同期
      if (key === 'firstAction') {
        if (inputFirstAction && el !== inputFirstAction) inputFirstAction.value = el.value;
        if (inputLogicaFirstAction && el !== inputLogicaFirstAction) inputLogicaFirstAction.value = el.value;
      }

      saveStorage();
      renderItemList();
      updatePreview();
    });
  };

  bindInput(itemTitle, 'title');
  bindInput(inputCommonMemo, 'simpleContent');
  bindInput(inputFirstAction, 'firstAction');
  bindInput(inputActionMemo, 'actionMemo');
  bindInput(inputFact, 'fact');
  bindInput(inputUnknown, 'unknown');
  bindInput(inputIssue, 'issue');
  bindInput(inputHypothesis, 'hypothesis');
  bindInput(inputLogicaFirstAction, 'firstAction');
  bindInput(inputScript, 'script');

  // 5. テキストコピー
  const copyFormattedText = () => {
    const item = getActiveItem();
    if (!item) return;

    const formattedText = generateOneNoteFormat(item);
    navigator.clipboard.writeText(formattedText).then(() => {
      showToast('成果物テキストをコピーしました！');
    }).catch(err => {
      console.error('Copy failed', err);
    });
  };

  btnCopyOnenote.addEventListener('click', copyFormattedText);
  btnCopyOnenoteBottom.addEventListener('click', copyFormattedText);

  // 6. 完了/未完了 トグル
  btnCompleteToggle.addEventListener('click', () => {
    const item = getActiveItem();
    if (!item) return;

    item.status = item.status === 'completed' ? 'active' : 'completed';
    saveStorage();
    renderWorkspace();
    renderItemList();
  });

  // 7. 削除
  btnDeleteItem.addEventListener('click', () => {
    if (!activeItemId) return;
    if (confirm('このメモを削除しますか？')) {
      items = items.filter(i => i.id !== activeItemId);
      activeItemId = null;
      saveStorage();
      renderWorkspace();
      renderItemList();
      showToast('削除しました');
    }
  });

  // 8. テーマ切替
  btnThemeToggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('logicapad_theme', next);
    updateThemeIcon(next);
  });

  // バックアップ・復元
  document.getElementById('btn-export-json').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(items, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LogicaPad_Backup_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
  });

  document.getElementById('btn-import-json').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target.result);
        if (Array.isArray(imported)) {
          items = imported;
          saveStorage();
          renderItemList();
          showToast('復元完了！');
        }
      } catch (err) {
        alert('無効なJSONファイルです');
      }
    };
    reader.readAsText(file);
  });

  // --- Core Functions ---

  function getActiveItem() {
    return items.find(i => i.id === activeItemId);
  }

  function selectItem(id) {
    activeItemId = id;
    renderWorkspace();
    renderItemList();
    if (window.innerWidth <= 850) {
      closeSidebar(); // スリム/モバイル時は自動で閉じる
    }
  }

  function renderItemList() {
    itemList.innerHTML = '';

    const filteredItems = items.filter(item => {
      if (currentFilter === 'quick') {
        // Notes: 'none' (メモのみ) または 'action' (初動10秒) で、完了していないメモ
        return (item.mode === 'none' || item.mode === 'action' || !item.mode) && item.status !== 'completed';
      }
      if (currentFilter === 'logica') {
        // Logical: 'logica' モードで、完了していないメモ
        return item.mode === 'logica' && item.status !== 'completed';
      }
      if (currentFilter === 'archive') {
        // Archive: 完了済みのメモ
        return item.status === 'completed';
      }
      // All: 完了していない全メモ
      return item.status !== 'completed';
    });

    if (filteredItems.length === 0) {
      itemList.innerHTML = `<li style="padding: 12px; text-align: center; color: var(--text-muted); font-size: 0.75rem;">メモはありません</li>`;
      return;
    }

    filteredItems.forEach(item => {
      const li = document.createElement('li');
      li.className = `item-card ${item.id === activeItemId ? 'active' : ''} ${item.status === 'completed' ? 'completed' : ''}`;
      
      let badgeLabel = '📝 Notes';
      let badgeClass = 'badge-simple';
      if (item.mode === 'action') { badgeLabel = '⚡️ Action'; badgeClass = 'badge-action'; }
      if (item.mode === 'logica') { badgeLabel = '🧠 Logical'; badgeClass = 'badge-logica'; }

      const snippet = item.simpleContent || item.firstAction || item.issue || '内容なし';
      
      // タイムスタンプ整形 (例: 7/30 15:49)
      let timeStr = '';
      if (item.createdAt) {
        const d = new Date(item.createdAt);
        if (!isNaN(d.getTime())) {
          const month = d.getMonth() + 1;
          const date = d.getDate();
          const hours = String(d.getHours()).padStart(2, '0');
          const minutes = String(d.getMinutes()).padStart(2, '0');
          timeStr = `${month}/${date} ${hours}:${minutes}`;
        }
      }

      li.innerHTML = `
        <div class="item-card-top">
          <span class="item-card-title">${escapeHtml(item.title || '無題のメモ')}</span>
          <span class="item-mode-badge ${badgeClass}">${badgeLabel}</span>
        </div>
        <div class="item-card-bottom">
          <span class="item-card-snippet">${escapeHtml(snippet)}</span>
          ${timeStr ? `<span class="item-card-time">${timeStr}</span>` : ''}
        </div>
      `;

      li.addEventListener('click', () => selectItem(item.id));
      itemList.appendChild(li);
    });
  }

  function renderWorkspace() {
    const item = getActiveItem();

    if (!item) {
      emptyState.style.display = 'flex';
      workspace.style.display = 'none';
      return;
    }

    emptyState.style.display = 'none';
    workspace.style.display = 'flex';

    itemTitle.value = item.title || '';
    if (item.status === 'completed') {
      itemStatusTag.textContent = '完了済み';
      itemStatusTag.style.backgroundColor = 'rgba(16, 185, 129, 0.2)';
      itemStatusTag.style.color = 'var(--accent-green)';
    } else {
      itemStatusTag.textContent = item.mode === 'logica' ? '思考展開中' : '進行中';
      itemStatusTag.style.backgroundColor = 'rgba(59, 130, 246, 0.15)';
      itemStatusTag.style.color = 'var(--accent-blue)';
    }

    inputCommonMemo.value = item.simpleContent || '';
    inputFirstAction.value = item.firstAction || '';
    inputActionMemo.value = item.actionMemo || '';

    inputFact.value = item.fact || '';
    inputUnknown.value = item.unknown || '';
    inputIssue.value = item.issue || '';
    inputHypothesis.value = item.hypothesis || '';
    inputLogicaFirstAction.value = item.firstAction || '';
    inputScript.value = item.script || '';

    updateModeUI(item.mode || 'none');
    updatePreview();
  }

  function updateModeUI(mode) {
    modeButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === mode);
    });

    Object.keys(modeViews).forEach(key => {
      if (modeViews[key]) {
        modeViews[key].style.display = key === mode ? 'block' : 'none';
      }
    });
  }

  function updatePreview() {
    const item = getActiveItem();
    if (!item) return;
    onenotePreview.textContent = generateOneNoteFormat(item);
  }

  function generateOneNoteFormat(item) {
    let dateStr = '';
    if (item.createdAt) {
      const d = new Date(item.createdAt);
      if (!isNaN(d.getTime())) {
        const month = d.getMonth() + 1;
        const date = d.getDate();
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        dateStr = `${month}/${date} ${hours}:${minutes}`;
      }
    }
    const headerTitle = item.title || '無題のメモ';
    let text = dateStr ? `【${headerTitle}  ${dateStr}】\n` : `【${headerTitle}】\n`;
    text += `----------------------------------------\n`;
    text += `■ RAW INPUT (思考の原案):\n${item.simpleContent || '（内容なし）'}\n\n`;

    // ルートA: 初動10秒アクションモード（Logicaまで進まない即行動ルート）
    if (item.mode === 'action') {
      text += `■ ⚡️ 10-SEC ACTION (初動10秒アクション):\n- [ ] ${item.firstAction || '未設定'}\n`;
      if (item.actionMemo) {
        text += `\n■ 補足メモ:\n${item.actionMemo}\n`;
      }
    } 
    // ルートB: Logica思考モード（本格論理・タスク創出ルート / 重複排除）
    else if (item.mode === 'logica') {
      text += `■ 🧠 LOGICA THINKING (思考ログ):\n`;
      text += `・【現状】 ${item.fact || '-'}\n`;
      if (item.unknown) text += `・【不明点】 ${item.unknown}\n`;
      text += `・【本当の問い】 ${item.issue || '-'}\n`;
      text += `・【アイデア・方針】 ${item.hypothesis || '-'}\n\n`;
      
      text += `■ 📋 GENERATED TASKS (生まれたタスク / 成果物):\n`;
      if (item.script) {
        const taskLines = item.script.split('\n').filter(line => line.trim() !== '');
        taskLines.forEach(line => {
          const cleanLine = line.replace(/^[・\-\*\d\.\s]+/, '');
          text += `- [ ] ${cleanLine}\n`;
        });
      } else {
        text += `- [ ] (成果物・タスク未入力)\n`;
      }
    }

    return text.trim();
  }

  function showToast(msg) {
    const toast = document.getElementById('toast');
    document.getElementById('toast-message').textContent = msg;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 2500);
  }

  function saveStorage() {
    localStorage.setItem('logicapad_items', JSON.stringify(items));
  }

  function loadStorage() {
    const data = localStorage.getItem('logicapad_items');
    return data ? JSON.parse(data) : [];
  }

  function setupTheme() {
    const saved = localStorage.getItem('logicapad_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', saved);
    updateThemeIcon(saved);
  }

  function updateThemeIcon(theme) {
    if (themeIcon) {
      themeIcon.setAttribute('data-lucide', theme === 'dark' ? 'sun' : 'moon');
      if (window.lucide) lucide.createIcons();
    }
  }

  function createSampleData() {
    items = [
      {
        id: 'sample_1',
        title: '今週末の買い物',
        mode: 'none',
        status: 'active',
        createdAt: new Date().toISOString(),
        simpleContent: '・米粉\n・小麦粉\n・オイスターソース\n・コーヒー豆',
        firstAction: '', actionMemo: '', fact: '', unknown: '', issue: '', hypothesis: '', script: ''
      },
      {
        id: 'sample_2',
        title: '新プロダクトの構想',
        mode: 'logica',
        status: 'active',
        createdAt: new Date().toISOString(),
        simpleContent: '誰でも思考を整理してタスク化できるLogicaAppのリリース計画。',
        firstAction: 'ノートを開いて必要な最小機能(MVP)を箇条書きにする',
        actionMemo: '',
        fact: '開発メンバーは1名。目標リリース日は今月末。',
        unknown: 'ユーザーが最も価値を感じるキー機能はどこか',
        issue: '最小限の機能(MVP)で、ユーザーが最も感動する要素は何か？',
        hypothesis: '「1秒でメモ」→「ワンタップで論理展開」のシームレスな体験に絞り込めば刺さる。',
        script: '【方針決定】コア機能だけに絞り込み、デザインの完成度を高めてリリースする。'
      }
    ];
    saveStorage();
    renderItemList();
    selectItem('sample_1');
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
});
