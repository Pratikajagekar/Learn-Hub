import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errMsg } from '../api';

const STARTERS = {
  python: 'name = input()\nprint(f"Hello, {name}!")',
  cpp: '#include <iostream>\nusing namespace std;\nint main() {\n    string name;\n    getline(cin, name);\n    cout << "Hello, " << name << "!" << endl;\n    return 0;\n}',
  java: 'import java.util.Scanner;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        String name = sc.nextLine();\n        System.out.println("Hello, " + name + "!");\n    }\n}',
  javascript: 'const fs = require("fs");\nconst name = fs.readFileSync(0, "utf8").trim();\nconsole.log(`Hello, ${name}!`);',
  c: '#include <stdio.h>\nint main(void) {\n    char name[100];\n    if (fgets(name, sizeof(name), stdin)) printf("Hello, %s", name);\n    return 0;\n}',
};
export default function CodingPractice() {
  const [language, setLanguage] = useState('python');
  const [sourceCode, setSourceCode] = useState(STARTERS.python);
  const [stdin, setStdin] = useState('LearnHub');
  const [output, setOutput] = useState(null);
  const [error, setError] = useState('');
  const [running, setRunning] = useState(false);
  const [editorNotice, setEditorNotice] = useState('Copying and pasting are disabled in this editor. Type your code manually.');
  const [tabSwitchWarning, setTabSwitchWarning] = useState(false);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [practiceClosed, setPracticeClosed] = useState(() => {
    try { return sessionStorage.getItem('learnhub-coding-practice-closed') === 'true'; }
    catch { return false; }
  });

  // Detect tab switches while coding practice is open. Browsers cannot fully
  // prevent switching tabs, so pause the practice screen and show a warning.
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        setTabSwitchCount(count => {
          const nextCount = count + 1;
          if (nextCount >= 4) {
            // Close this practice attempt after the fourth detected tab switch.
            // Keep the lock for this browser tab's session so refreshing cannot resume it.
            try { sessionStorage.setItem('learnhub-coding-practice-closed', 'true'); } catch { /* storage may be unavailable */ }
            setPracticeClosed(true);
            setTabSwitchWarning(false);
          } else {
            setTabSwitchWarning(true);
          }
          return nextCount;
        });
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);
  const changeLanguage = (value) => { setLanguage(value); setSourceCode(STARTERS[value]); setOutput(null); setError(''); setEditorNotice('Copying and pasting are disabled. Type your code manually.'); };
  const blockClipboard = (event) => {
    event.preventDefault();
    setEditorNotice('Clipboard actions are disabled for coding practice. Please type your code manually.');
  };
  const blockClipboardShortcuts = (event) => {
    const key = event.key.toLowerCase();
    const modifier = event.ctrlKey || event.metaKey;
    const clipboardShortcut = (modifier && ['v', 'c', 'x'].includes(key))
      || (event.shiftKey && key === 'insert')
      || (event.ctrlKey && key === 'insert');
    if (clipboardShortcut) {
      event.preventDefault();
      event.stopPropagation();
      setEditorNotice('Copy, cut and paste shortcuts are disabled. Please type your code manually.');
    }
  };
  const run = async () => {
    if (tabSwitchWarning) return;
    setRunning(true); setError(''); setOutput(null);
    try { const { data } = await api.post('/compiler/run', { language, sourceCode, stdin }); setOutput(data.data); }
    catch (e) { setError(errMsg(e)); }
    finally { setRunning(false); }
  };
  if (practiceClosed) {
    return <div className="mx-auto flex min-h-[60vh] max-w-2xl items-center justify-center px-4 py-10">
      <div className="card w-full space-y-4 p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-3xl" aria-hidden="true">⛔</div>
        <h1 className="text-2xl font-bold text-slate-900">Coding practice closed</h1>
        <p className="text-slate-600">You switched away from the Coding Practice tab more than three times. This practice attempt has been closed and cannot be resumed in this browser tab session.</p>
        <p className="text-sm text-slate-500">Detected tab switches: {tabSwitchCount || 4}</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link className="btn btn-primary" to="/courses">Back to courses</Link>
          <Link className="btn btn-outline" to="/">Go to dashboard</Link>
        </div>
      </div>
    </div>;
  }

  return <div className="mx-auto max-w-6xl space-y-5">
    {tabSwitchWarning && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 p-4" role="alertdialog" aria-modal="true" aria-labelledby="tab-switch-title" aria-describedby="tab-switch-description">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-2xl" aria-hidden="true">⚠️</div>
        <h2 id="tab-switch-title" className="text-xl font-bold text-slate-900">Tab switch detected</h2>
        <p id="tab-switch-description" className="mt-3 text-sm leading-6 text-slate-600">You left the Coding Practice tab. Please stay on this page. After more than three tab switches, this practice attempt will close and cannot be resumed.</p>
        <p className="mt-2 text-xs text-slate-500">Detected tab switches: {tabSwitchCount} of 3 allowed</p>
        <button type="button" className="btn btn-primary mt-5 w-full" autoFocus onClick={() => setTabSwitchWarning(false)}>I understand — continue practice</button>
      </div>
    </div>}
    <div><h1 className="text-3xl font-bold">Coding Practice</h1><p className="mt-2 text-slate-600">Write, run and debug code directly in LearnHub. Code executes in a separate Judge0 sandbox.</p></div>
    <div className="card space-y-4 p-4">
      <div className="flex flex-wrap items-center gap-3"><label className="text-sm font-semibold" htmlFor="language">Language</label><select id="language" className="input !w-auto" value={language} onChange={e => changeLanguage(e.target.value)}><option value="python">Python 3</option><option value="cpp">C++</option><option value="java">Java</option><option value="javascript">JavaScript (Node.js)</option><option value="c">C</option></select><button className="btn btn-primary ml-auto" onClick={run} disabled={running || tabSwitchWarning}>{running ? 'Running…' : '▶ Run Code'}</button></div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="label !mb-0" htmlFor="source">Source code</label>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn btn-outline btn-sm" onClick={() => { setSourceCode(STARTERS[language]); setOutput(null); setError(''); setEditorNotice('Starter code restored. Type your solution manually.'); }}>Reset code</button>
        </div>
      </div>
      {editorNotice && <p role="status" aria-live="polite" className="text-xs text-indigo-700">{editorNotice}</p>}
      <textarea id="source" spellCheck={false} autoCapitalize="off" autoComplete="off" autoCorrect="off" aria-label="Source code editor — typing only, clipboard disabled" aria-describedby="editor-policy" className="input min-h-[360px] resize-y !bg-slate-950 !text-green-100 font-mono text-sm leading-6" style={{ userSelect: 'text', WebkitUserSelect: 'text', cursor: 'text', whiteSpace: 'pre', tabSize: 4 }} value={sourceCode} onChange={e => { setSourceCode(e.target.value); setEditorNotice(''); }} onKeyDown={blockClipboardShortcuts} onPaste={blockClipboard} onCopy={blockClipboard} onCut={blockClipboard} onDrop={blockClipboard} onContextMenu={blockClipboard} />
      <p id="editor-policy" className="text-xs text-amber-700">Typing-only practice: clipboard shortcuts, context-menu clipboard actions, drag-and-drop, copying, cutting and pasting are disabled in this editor.</p>
      <div><label className="label" htmlFor="stdin">Standard input (stdin)</label><textarea id="stdin" className="input font-mono text-sm" rows={3} value={stdin} onChange={e => setStdin(e.target.value)} placeholder="Enter program input here" /></div>
    </div>
    <div className="card space-y-3 p-5"><h2 className="font-bold">Execution result</h2>{error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}{!output && !error && <p className="text-sm text-slate-500">Run your code to see output, compilation errors, or runtime status.</p>}{output && <><div className="flex flex-wrap gap-3 text-xs"><span className="rounded-full bg-slate-100 px-3 py-1 font-semibold">Status: {output.status}</span>{output.time && <span className="rounded-full bg-slate-100 px-3 py-1">Time: {output.time}s</span>}{output.memory && <span className="rounded-full bg-slate-100 px-3 py-1">Memory: {output.memory} KB</span>}</div>{output.stdout && <div><h3 className="mb-1 text-sm font-semibold">Output</h3><pre className="overflow-x-auto rounded-lg bg-slate-950 p-4 text-sm text-green-200">{output.stdout}</pre></div>}{output.compileOutput && <div><h3 className="mb-1 text-sm font-semibold">Compilation output</h3><pre className="overflow-x-auto rounded-lg bg-slate-950 p-4 text-sm text-red-200">{output.compileOutput}</pre></div>}{output.stderr && <div><h3 className="mb-1 text-sm font-semibold">Errors / stderr</h3><pre className="overflow-x-auto rounded-lg bg-slate-950 p-4 text-sm text-amber-200">{output.stderr}</pre></div>}{output.message && <p className="text-sm text-slate-600">{output.message}</p>}</>}</div>
    <p className="text-xs text-slate-500">Do not enter passwords, API keys, or other secrets in code. The compiler requires a reachable Judge0-compatible service; configure JUDGE0_URL and optional API credentials in the server environment for production.</p>
  </div>;
}
