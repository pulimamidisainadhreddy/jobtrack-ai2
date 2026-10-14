/** Node smoke checks. Run `npm install && npm run smoke`. Does not require a database. */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');
const root = path.join(__dirname, '..');
const source = p => fs.readFileSync(path.join(root, p), 'utf8');
function allTS(dir) {
  for (const f of fs.readdirSync(dir)) {
    const file = path.join(dir, f);
    if (fs.statSync(file).isDirectory()) allTS(file);
    else if (/\.tsx?$/.test(f)) {
      const syntax = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, f.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
      assert.equal(syntax.parseDiagnostics.length, 0, `Syntax error in ${file}`);
    }
  }
}
function loadModule(file) {
  const out = ts.transpileModule(source(file), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(out, { module, exports: module.exports, Date, URL, crypto: require('node:crypto').webcrypto, TextEncoder, Uint8Array, process }, { filename: file });
  return module.exports;
}
(async () => {
  allTS(path.join(root, 'src'));
  const { applicationData } = loadModule('src/lib/validation.ts');
  const a = applicationData({ companyName: ' Test GmbH ', jobTitle: ' Data Engineer ', jobLocation: ' Berlin ', status: 'Applied', jobUrl: 'javascript:alert(1)', interviewDates: ['2026-10-30'] });
  assert.equal(a.companyName, 'Test GmbH');
  assert.equal(a.jobTitle, 'Data Engineer');
  assert.equal(a.jobUrl, null);
  assert.equal(a.interviewDates.length, 1);
  assert.throws(() => applicationData({ jobTitle: 'Engineer' }), /required/);
  assert.throws(() => applicationData({ companyName: 'A', jobTitle: 'B', status: 'UNKNOWN' }), /Invalid status/);
  const { scoreDescription } = loadModule('src/lib/scoring.ts');
  const score = scoreDescription('Experience with Python, SQL and Kafka.', ['Python', 'SQL']);
  assert.equal(score.percentage, 67);
  assert.equal(score.missing.includes('kafka'), true);
  assert.equal(scoreDescription('No technologies mentioned.', ['Python']).percentage, null);
  const { parseCSV } = loadModule('src/lib/csv.ts');
  const csv = parseCSV('companyName,jobTitle,notes\n"ACME, Inc.","Engineer","line 1\nline ""two"""\n');
  assert.equal(csv.length, 2);
  assert.equal(csv[1][0], 'ACME, Inc.');
  assert.equal(csv[1][2], 'line 1\nline "two"');
  assert.throws(() => parseCSV('foo,"oops'), /unclosed/);
  const schema = source('prisma/schema.prisma');
  assert.match(schema, /model GoalSettings/);
  assert.match(schema, /model Application/);
  assert.match(source('src/proxy.ts'), /validSession/);
  assert.doesNotMatch(source('package.json'), /accept-data-loss/);
  console.log('PASS: TypeScript syntax, input validation, safe URLs, scoring, CSV and schema checks');
})().catch(e => { console.error(e); process.exitCode = 1; });
