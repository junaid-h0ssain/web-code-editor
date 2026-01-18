import './style.css'


const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));

const out = $('#output');
const preview = $('#preview');
const STORAGE_KEY = 'web-code-editor-content';
const notes = $('#notes');

const saveBtn = $('#saveBtn');
const loadBtn = $('#loadBtn');
const openFileInput = $('#openFile');

saveBtn.addEventListener('click', () => {
  const payload = JSON.stringify(getEditorState(), null, 2);
  const blob = new Blob([payload], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const downloadAnchorNode = document.createElement('a');
  downloadAnchorNode.setAttribute('href', url);
  downloadAnchorNode.setAttribute('download', 'code.json');
  document.body.appendChild(downloadAnchorNode);
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
  URL.revokeObjectURL(url);
});

loadBtn.addEventListener('click', () => {
  openFileInput.click();
});

openFileInput.addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (!file) {
    return;
  }
  const reader = new FileReader();
  reader.onload = (e) => {
    const contents = String(e.target.result || '');
    try {
      const json = JSON.parse(contents);
      setEditorState(json);
      persistState();
      log('Loaded JSON file.', 'ok');
    } catch {
      htmlEditor.setValue(contents, -1);
      persistState();
      log('Loaded file as HTML.', 'warn');
    }
  };
  reader.readAsText(file);
  event.target.value = '';
});

const escapeHtml = s =>
  String(s).replace(/[&<>"]/g, c => ({

    '&':'&amp;',

    '<':'&lt;',

    '>':'&gt;',

    '"':'&quot;'
}[c]
));

function log(message, type='info') {

    // const color = type==='error' ? 'var(--err)' : type==='warn' ? 'var(--warn)' : 'var(--brand)';

    const time = new Date().toLocaleTimeString();
    const p = document.createElement('div');
    p.className = type;
    p.innerHTML = `[${time}] ${escapeHtml(message)}`;
    out.appendChild(p);
    out.scrollTop = out.scrollHeight;
}

function clearLog() {
  out.innerHTML = '';
}


$('#clearOutput')?.addEventListener('click', clearLog);

function makeEditor(id, mode) {
  const ed = ace.edit(id, {
    theme: "ace/theme/monokai",
    mode: `ace/mode/${mode}`,
    autoScrollEditorIntoView: true,
    maxLines: Infinity,
    tabSize: 2,
    useSoftTabs: true,
    showPrintMargin: false,
    wrap: true
  });
  ed.session.setUseWorker(false);
  return ed;
}

if (window.ace?.config) {
  window.ace.config.set(
    'basePath',
    'https://cdn.jsdelivr.net/npm/ace-builds@1.32.0/src-min-noconflict'
  );
}

const htmlEditor = makeEditor('htmlEditor', 'html');
const cssEditor = makeEditor('cssEditor', 'css');
const jsEditor = makeEditor('jsEditor', 'javascript');

const editors = {
  html: htmlEditor,
  css: cssEditor,
  js: jsEditor
};

function getEditorState() {
  return {
    html: htmlEditor.getValue(),
    css: cssEditor.getValue(),
    js: jsEditor.getValue(),
    notes: notes?.value || ''
  };
}

function setEditorState(state = {}) {
  if (typeof state.html === 'string') htmlEditor.setValue(state.html, -1);
  if (typeof state.css === 'string') cssEditor.setValue(state.css, -1);
  if (typeof state.js === 'string') jsEditor.setValue(state.js, -1);
  if (notes && typeof state.notes === 'string') notes.value = state.notes;
}

function persistState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(getEditorState()));
}

function restoreState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  try {
    setEditorState(JSON.parse(raw));
  } catch {
    // ignore invalid cache
  }
}

function setActiveTab(tab) {
  $$('#webTabs .tab').forEach(btn => {
    const active = btn.dataset.editor === tab;
    btn.classList.toggle('active', active);
    btn.setAttribute('tabindex', active ? '0' : '-1');
  });

  $$('#webEditors .editor-wrap').forEach(wrap => {
    const isActive = wrap.dataset.pane === tab;
    wrap.hidden = !isActive;
    if (isActive) {
      const ed = editors[tab];
      if (ed) {
        ed.resize(true);
        ed.focus();
      }
    }
  });
}

function buildPreviewDoc() {
  const { html, css, js } = getEditorState();
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>${css || ''}</style>
</head>
<body>
${html || ''}
<script>
(function(){
  const send = (type, args) => parent.postMessage({ source: 'web-preview', type, args }, '*');
  const original = { ...console };
  ['log','warn','error','info'].forEach(k => {
    console[k] = (...args) => {
      try { send(k, args); } catch {}
      original[k]?.(...args);
    };
  });
  window.addEventListener('error', e => send('error', [e.message]));
  window.addEventListener('unhandledrejection', e => send('error', [e.reason?.message || e.reason]));
})();
</script>
<script>
${js || ''}
</script>
</body>
</html>`;
}

function runPreview() {
  clearLog();
  preview.srcdoc = buildPreviewDoc();
  log('Preview updated.', 'ok');
}

window.addEventListener('message', (event) => {
  if (event?.data?.source !== 'web-preview') return;
  const { type, args } = event.data;
  const message = Array.isArray(args) ? args.map(String).join(' ') : String(args);
  log(message, type === 'error' ? 'err' : type === 'warn' ? 'warn' : 'info');
});

$('#runWeb')?.addEventListener('click', runPreview);
$('#openPreview')?.addEventListener('click', () => {
  const html = buildPreviewDoc();
  const win = window.open('', '_blank');
  if (!win) return;
  win.document.open();
  win.document.write(html);
  win.document.close();
});

$('#webTabs')?.addEventListener('click', (e) => {
  const btn = e.target.closest('.tab');
  if (!btn) return;
  setActiveTab(btn.dataset.editor);
});

['change', 'blur'].forEach(evt => {
  htmlEditor.on(evt, persistState);
  cssEditor.on(evt, persistState);
  jsEditor.on(evt, persistState);
});

notes?.addEventListener('input', persistState);
window.addEventListener('resize', () => {
  Object.values(editors).forEach(ed => ed.resize(true));
});

restoreState();
setActiveTab('html');
runPreview();

