import './style.css'


const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));

const out = $('#output');
const preview = $('#preview');
const STORAGE_KEY = 'web-code-editor-content';
const editor = $('#editor');

const saveBtn = $('#saveBtn');
const loadBtn = $('#loadBtn');
const openFileInput = $('#openFile');

saveBtn.addEventListener('click', () => {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(editor.value);
  const downloadAnchorNode = document.createElement('a');
  downloadAnchorNode.setAttribute("href", dataStr);
  downloadAnchorNode.setAttribute("download", "code.json");
  document.body.appendChild(downloadAnchorNode); // required for firefox
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
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
    const contents = e.target.result;
    editor.value = contents;
  };
  reader.readAsText(file);
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


$('#clearOut')?.addEventListener('click', clearLog);

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

