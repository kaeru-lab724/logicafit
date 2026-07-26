/* ==========================================================================
   LogicaPad Application Logic (100% Pure Local - Triple Thinking Flow)
   ========================================================================== */

(function () {
  'use strict';

  const STORAGE_KEY = 'logicapad_items';
  const THEME_KEY = 'logicapad_theme';

  // 状態管理
  let items = [];
  let currentItemId = null;

  // DOM要素
  const itemList = document.getElementById('item-list');
  const btnNewItem = document.getElementById('btn-new-item');
  const emptyState = document.getElementById('empty-state');
  const workspace = document.getElementById('workspace');

  const itemTitle = document.getElementById('item-title');
  const itemStatus = document.getElementById('item-status');
  const inputRawTask = document.getElementById('input-raw-task');
  const inputFact = document.getElementById('input-fact');
  const inputUnknown = document.getElementById('input-unknown');
  const inputIssue = document.getElementById('input-issue');
  const inputHypothesis = document.getElementById('input-hypothesis');
  const inputFirstAction = document.getElementById('input-first-action');
  const inputScript = document.getElementById('input-script');
  const onenotePreview = document.getElementById('onenote-preview');

  const btnCopyOnenote = document.getElementById('btn-copy-onenote');
  const btnCompleteArchive = document.getElementById('btn-complete-archive');
  const btnDeleteItem = document.getElementById('btn-delete-item');
  const btnExportJson = document.getElementById('btn-export-json');
  const btnImportJson = document.getElementById('btn-import-json');
  const btnThemeToggle = document.getElementById('btn-theme-toggle');
  const themeIcon = document.getElementById('theme-icon');
  const toast = document.getElementById('toast');
  const toastMessage = document.getElementById('toast-message');

  // 初期化処理
  function init() {
    loadTheme();
    loadItems();
    setupEventListeners();

    if (items.length > 0) {
      selectItem(items[0].id);
    } else {
      createSampleItem();
    }
    refreshLucideIcons();
  }

  function refreshLucideIcons() {
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  function loadTheme() {
    const theme = localStorage.getItem(THEME_KEY) || 'dark';
    document.documentElement.setAttribute('data-theme', theme);
    updateThemeIcon(theme);
  }

  function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem(THEME_KEY, newTheme);
    updateThemeIcon(newTheme);
  }

  function updateThemeIcon(theme) {
    if (themeIcon) {
      themeIcon.setAttribute('data-lucide', theme === 'dark' ? 'sun' : 'moon');
      refreshLucideIcons();
    }
  }

  function saveItems() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }

  function loadItems() {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      try {
        items = JSON.parse(data);
      } catch (e) {
        console.error('Failed to parse items from localStorage', e);
        items = [];
      }
    }
  }

  function createSampleItem() {
    const sample = {
      id: generateId(),
      title: 'マニュアル5ページの記述修正',
      status: 'active',
      rawTask: 'マニュアルの5ページを最新の正解の情報に修正する。',
      fact: '5ページ目に旧仕様の記載が残っている。手元に新仕様のデータがある。',
      unknown: '修正後の記述フォーマットに指定があるか不明。関係者へのレビューが必要か不明。',
      issue: '5ページ目の旧記述Aを新仕様Bにそのまま書き換えるだけでよいか？',
      hypothesis: '新仕様Bの箇条書きに差し替えれば完了するはず。',
      firstAction: 'マニュアルのファイル（Word/PDF）を開く',
      script: '【修正完了メモ】\n・マニュアル5ページの旧記述Aを新仕様B（2026年最新版）へ書き換え完了。\n・関連部署への確認不要、作業完了。',
      updatedAt: new Date().toISOString()
    };
    items.unshift(sample);
    saveItems();
    renderItemList();
    selectItem(sample.id);
  }

  function generateId() {
    return 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
  }

  function addNewItem() {
    const newItem = {
      id: generateId(),
      title: '新規案件 ' + new Date().toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      status: 'active',
      rawTask: '',
      fact: '',
      unknown: '',
      issue: '',
      hypothesis: '',
      firstAction: '',
      script: '',
      updatedAt: new Date().toISOString()
    };
    items.unshift(newItem);
    saveItems();
    renderItemList();
    selectItem(newItem.id);
    itemTitle.focus();
  }

  function selectItem(id) {
    currentItemId = id;
    const item = items.find(i => i.id === id);
    if (!item) {
      showEmptyState();
      return;
    }

    itemTitle.value = item.title;
    inputRawTask.value = item.rawTask || '';
    inputFact.value = item.fact || '';
    inputUnknown.value = item.unknown || '';
    inputIssue.value = item.issue || '';
    inputHypothesis.value = item.hypothesis || '';
    inputFirstAction.value = item.firstAction || '';
    inputScript.value = item.script || '';

    updateStatusUI(item.status);
    renderItemList();
    updatePreview();

    emptyState.style.display = 'none';
    workspace.style.display = 'flex';
  }

  function showEmptyState() {
    currentItemId = null;
    workspace.style.display = 'none';
    emptyState.style.display = 'block';
  }

  function updateStatusUI(status) {
    if (status === 'completed') {
      itemStatus.textContent = '完了';
      itemStatus.className = 'status-pill status-completed';
      btnCompleteArchive.innerHTML = '<i data-lucide="rotate-ccw"></i> 未完了に戻す';
    } else {
      itemStatus.textContent = '進行中';
      itemStatus.className = 'status-pill status-active';
      btnCompleteArchive.innerHTML = '<i data-lucide="check-circle-2"></i> 完了・アーカイブ';
    }
    refreshLucideIcons();
  }

  function renderItemList() {
    itemList.innerHTML = '';
    items.forEach(item => {
      const li = document.createElement('li');
      li.className = `item-card ${item.id === currentItemId ? 'active' : ''}`;
      li.onclick = () => selectItem(item.id);

      const dateStr = new Date(item.updatedAt).toLocaleDateString('ja-JP', {
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      const isCompleted = item.status === 'completed';
      const badgeClass = isCompleted ? 'badge-completed' : 'badge-active';
      const badgeText = isCompleted ? '完了' : '進行中';

      li.innerHTML = `
        <div class="item-card-header">
          <span class="item-card-title">${escapeHtml(item.title || '無題の案件')}</span>
          <span class="item-card-badge ${badgeClass}">${badgeText}</span>
        </div>
        <div class="item-card-meta">
          <span>${dateStr}</span>
        </div>
      `;
      itemList.appendChild(li);
    });
  }

  function updateCurrentItem() {
    if (!currentItemId) return;
    const item = items.find(i => i.id === currentItemId);
    if (!item) return;

    item.title = itemTitle.value.trim() || '無題の案件';
    item.rawTask = inputRawTask.value;
    item.fact = inputFact.value;
    item.unknown = inputUnknown.value;
    item.issue = inputIssue.value;
    item.hypothesis = inputHypothesis.value;
    item.firstAction = inputFirstAction.value;
    item.script = inputScript.value;
    item.updatedAt = new Date().toISOString();

    saveItems();
    renderItemList();
    updatePreview();
  }

  function updatePreview() {
    const formattedText = generateOneNoteFormat();
    onenotePreview.textContent = formattedText;
  }

  function generateOneNoteFormat() {
    const title = itemTitle.value.trim() || '無題の案件';
    const rawTask = inputRawTask.value.trim() || '（記載なし）';
    const fact = inputFact.value.trim() || '（記載なし）';
    const unknown = inputUnknown.value.trim() || '（記載なし）';
    const issue = inputIssue.value.trim() || '（未設定）';
    const hypothesis = inputHypothesis.value.trim() || '（未設定）';
    const firstAction = inputFirstAction.value.trim() || '（未設定）';
    const script = inputScript.value.trim() || '（未設定）';
    const now = new Date().toLocaleString('ja-JP');

    return `📌 【トリプルシンキングメモ】${title}
記録日時: ${now}
----------------------------------------

■ START. テーマ・元のメモ
${rawTask}

----------------------------------------

■ STEP 1. 🔍 クリティカル思考① (ファクトベース)
・【確定事実・手元データ】
${fact}
・【不明な点・状況】
${unknown}

■ STEP 2. 🔍 クリティカル思考② (イシュー特定)
🎯 ${issue}

■ STEP 3. 💡 ラテラル思考 (仮説思考)
💡 【30点仮説】: ${hypothesis}
⚡ 【初動10秒】: ${firstAction}

■ STEP 4. ⚙️ ロジカル思考 (成果とまとめ)
${script}

----------------------------------------
(LogicaPad で作成・完全ローカル保管)`;
  }

  function copyToOneNote() {
    const formattedText = generateOneNoteFormat();
    navigator.clipboard.writeText(formattedText).then(() => {
      showToast('OneNote用にコピーしました！OneNoteで Ctrl+V してください');
    }).catch(err => {
      console.error('Copy failed', err);
      showToast('コピーに失敗しました', true);
    });
  }

  function toggleCompleteCurrentItem() {
    if (!currentItemId) return;
    const item = items.find(i => i.id === currentItemId);
    if (!item) return;

    if (item.status === 'active') {
      item.status = 'completed';
      copyToOneNote();
      showToast('完了にしました！OneNote用テキストもコピー済みです');
    } else {
      item.status = 'active';
      showToast('進行中に戻しました');
    }

    item.updatedAt = new Date().toISOString();
    saveItems();
    updateStatusUI(item.status);
    renderItemList();
  }

  function deleteCurrentItem() {
    if (!currentItemId) return;
    if (!confirm('この案件メモを削除してもよろしいですか？')) return;

    items = items.filter(i => i.id !== currentItemId);
    saveItems();

    if (items.length > 0) {
      selectItem(items[0].id);
    } else {
      showEmptyState();
    }
    renderItemList();
    showToast('案件を削除しました');
  }

  function exportJson() {
    const jsonStr = JSON.stringify(items, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logicapad_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('バックアップファイルを保存しました');
  }

  function importJson(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (evt) {
      try {
        const importedItems = JSON.parse(evt.target.result);
        if (Array.isArray(importedItems)) {
          items = importedItems;
          saveItems();
          renderItemList();
          if (items.length > 0) {
            selectItem(items[0].id);
          }
          showToast('バックアップから正常に復元しました');
        } else {
          alert('無効なファイル形式です。');
        }
      } catch (err) {
        alert('ファイルの読み込みに失敗しました。');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  function showToast(msg) {
    toastMessage.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  }

  function escapeHtml(str) {
    return str.replace(/[&<>"']/g, function (m) {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
      }[m];
    });
  }

  function setupEventListeners() {
    btnNewItem.addEventListener('click', addNewItem);

    itemTitle.addEventListener('input', updateCurrentItem);
    inputRawTask.addEventListener('input', updateCurrentItem);
    inputFact.addEventListener('input', updateCurrentItem);
    inputUnknown.addEventListener('input', updateCurrentItem);
    inputIssue.addEventListener('input', updateCurrentItem);
    inputHypothesis.addEventListener('input', updateCurrentItem);
    inputFirstAction.addEventListener('input', updateCurrentItem);
    inputScript.addEventListener('input', updateCurrentItem);

    btnCopyOnenote.addEventListener('click', copyToOneNote);
    btnCompleteArchive.addEventListener('click', toggleCompleteCurrentItem);
    btnDeleteItem.addEventListener('click', deleteCurrentItem);

    btnExportJson.addEventListener('click', exportJson);
    btnImportJson.addEventListener('change', importJson);
    btnThemeToggle.addEventListener('click', toggleTheme);
  }

  document.addEventListener('DOMContentLoaded', init);

})();
