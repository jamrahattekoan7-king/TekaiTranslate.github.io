const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { JSDOM } = require('jsdom');

const root = path.resolve(__dirname);
const indexHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const dom = new JSDOM(indexHtml, { runScripts: 'outside-only' });
const window = dom.window;
const sandbox = { window, console, setTimeout: window.setTimeout, clearTimeout: window.clearTimeout, fetch: async (url) => ({ ok: false, status: 404, json: async () => null }) };
vm.createContext(sandbox);
const files = ['dataLoader.js', 'translateService.js', 'voice.js', 'script.js'];
for (const file of files) {
  const code = fs.readFileSync(path.join(root, file), 'utf8');
  vm.runInContext(code, sandbox, { filename: file });
}

(async () => {
  console.log('dictionary hello', window.dictionary && window.dictionary['hello']);
  const out = await window.translateService.translate('hello', 'en', 'tk');
  console.log('translate result', out);
})();
