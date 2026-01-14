import './style.css'


const $ = selector => document.querySelector(selector);
const $$ = selector => Array.from(document.querySelectorAll(selector));

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

    const time = new Date().toLocaleTimeString();
  const p = document.createElement('p');
  p.className = type;
  p.innerHTML = `[${time}] ${escapeHtml(message)}`;
  out.appendChild(p);
  out.scrollTop = out.scrollHeight;
}

function clearLog() {
  out.innerHTML = '';
}


$('#clearOut')?.addEventListener('click', clearLog);