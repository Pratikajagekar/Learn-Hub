import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';

const LANGUAGES = { python: 71, cpp: 54, java: 62, javascript: 63, c: 50 };
export const runCode = catchAsync(async (req, res) => {
  const { language = 'python', sourceCode, stdin = '' } = req.body;
  if (!Object.hasOwn(LANGUAGES, language)) throw new AppError('Supported languages: Python, C++, Java, JavaScript and C', 400);
  if (typeof sourceCode !== 'string' || !sourceCode.trim()) throw new AppError('Write some code before running it', 400);
  if (sourceCode.length > 20000 || String(stdin).length > 5000) throw new AppError('Code is limited to 20,000 characters and input to 5,000 characters', 413);
  const host = (process.env.JUDGE0_URL || 'https://ce.judge0.com').replace(/\/$/, '');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const headers = { 'Content-Type': 'application/json', Accept: 'application/json' };
    if (process.env.JUDGE0_API_KEY) headers['X-RapidAPI-Key'] = process.env.JUDGE0_API_KEY;
    if (process.env.JUDGE0_API_HOST) headers['X-RapidAPI-Host'] = process.env.JUDGE0_API_HOST;
    const response = await fetch(`${host}/submissions?base64_encoded=false&wait=true`, {
      method: 'POST', headers, signal: controller.signal,
      body: JSON.stringify({ language_id: LANGUAGES[language], source_code: sourceCode, stdin: String(stdin), cpu_time_limit: 3, wall_time_limit: 5, memory_limit: 128000 }),
    });
    if (!response.ok) throw new AppError(`Compiler service returned ${response.status}. Check JUDGE0_URL/API settings.`, 502);
    const result = await response.json();
    res.json({ status: 'success', data: { stdout: result.stdout || '', stderr: result.stderr || '', compileOutput: result.compile_output || '', message: result.message || '', status: result.status?.description || 'Unknown', time: result.time || null, memory: result.memory || null } });
  } catch (error) {
    if (error.name === 'AbortError') throw new AppError('The compiler service timed out. Please try again.', 504);
    throw error;
  } finally { clearTimeout(timer); }
});
