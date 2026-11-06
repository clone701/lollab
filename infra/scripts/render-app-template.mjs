// app.yaml の FunctionCode に gate.js を埋め込み、デプロイ用のテンプレートを書き出す。
// 使い方: node render-app-template.mjs <app.yaml> <gate.js> <出力先>
// gate.js の設定値のプレースホルダーは、CloudFormation のパラメータ参照（Fn::Sub）に置き換える。
// 実際の値はスタックのパラメータが持つため、ここでは値を扱わない。
import { readFileSync, writeFileSync } from 'node:fs';

// gate.js のプレースホルダー → app.yaml のパラメータ名
const PLACEHOLDERS = {
  __GATE_ENABLED__: 'GateEnabled',
  __ALLOWED_CIDRS__: 'AllowedCidrs',
  __BASIC_AUTH_SHA256__: 'BasicAuthHash',
};
const TEMPLATE_MARKER = 'FunctionCode: __GATE_FUNCTION_CODE__';
// CloudFront Function のコードの上限は 10KB。パラメータの値（CIDR の並び）の分を残す
const MAX_SOURCE_BYTES = 8000;

function fail(message) {
  console.error(`render-app-template: ${message}`);
  process.exit(1);
}

const [templatePath, gatePath, outputPath] = process.argv.slice(2);
if (!templatePath || !gatePath || !outputPath) {
  fail('引数は <app.yaml> <gate.js> <出力先> の3つです');
}

const template = readFileSync(templatePath, 'utf8');
let code = readFileSync(gatePath, 'utf8');

if (template.split(TEMPLATE_MARKER).length !== 2) {
  fail(`${templatePath} に「${TEMPLATE_MARKER}」が1つだけ必要です`);
}
if (code.includes('${')) fail('gate.js に Fn::Sub と衝突する文字列があります');
if (Buffer.byteLength(code) > MAX_SOURCE_BYTES) {
  fail(`gate.js が ${MAX_SOURCE_BYTES} バイトを超えています`);
}

for (const [placeholder, parameter] of Object.entries(PLACEHOLDERS)) {
  if (code.split(placeholder).length !== 2) {
    fail(`gate.js に ${placeholder} が1つだけ必要です`);
  }
  code = code.replace(placeholder, '${' + parameter + '}');
}

// JSON の文字列は YAML のダブルクォート文字列としてそのまま読める
const rendered = template.replace(TEMPLATE_MARKER, () => `FunctionCode: !Sub ${JSON.stringify(code)}`);
writeFileSync(outputPath, rendered);
console.log(`rendered ${outputPath} (gate.js: ${Buffer.byteLength(code)} bytes)`);
