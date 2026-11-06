'use strict';

// CloudFront Function（viewer-request, JavaScript runtime 2.0）: アクセスゲートと URL の書き換え。
// 下の3つの設定値は、デプロイ時に infra/scripts/render-app-template.mjs が
// app.yaml のパラメータ（GateEnabled / AllowedCidrs / BasicAuthHash）に置き換える。
// 関数コードは 10KB 以内。Fn::Sub に渡すため、ドル記号と波括弧の並びをコードに書かない。
// runtime 2.0 は ES5.1 と一部の ES6 以降だけに対応する。for...of・分割代入・スプレッド構文・クラスは使えない
// （Node のテストは通っても、CloudFront では SyntaxError になり全リクエストが 503 になる）。
const GATE_ENABLED = '__GATE_ENABLED__';
const ALLOWED_CIDRS = '__ALLOWED_CIDRS__';
const BASIC_AUTH_SHA256 = '__BASIC_AUTH_SHA256__';

const crypto = require('crypto');

function parseIPv4(text) {
  const parts = text.split('.');
  if (parts.length !== 4) return null;
  const bytes = [];
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (!/^\d{1,3}$/.test(part) || Number(part) > 255) return null;
    bytes.push(Number(part));
  }
  return bytes;
}

function parseIPv6(input) {
  let text = input;
  if (text.indexOf('.') !== -1) {
    // 末尾の IPv4 表記（::ffff:1.2.3.4）を16進2グループにする
    const cut = text.lastIndexOf(':');
    const v4 = parseIPv4(text.slice(cut + 1));
    if (!v4) return null;
    const high = ((v4[0] << 8) | v4[1]).toString(16);
    const low = ((v4[2] << 8) | v4[3]).toString(16);
    text = text.slice(0, cut + 1) + high + ':' + low;
  }
  const halves = text.split('::');
  if (halves.length > 2) return null;
  const head = halves[0] === '' ? [] : halves[0].split(':');
  const rest = halves.length === 2 && halves[1] !== '' ? halves[1].split(':') : [];
  const fill = 8 - head.length - rest.length;
  if (halves.length === 2 ? fill < 1 : fill !== 0) return null;
  const groups = head.concat(new Array(halves.length === 2 ? fill : 0).fill('0'), rest);
  const bytes = [];
  for (let i = 0; i < groups.length; i++) {
    const group = groups[i];
    if (!/^[0-9a-fA-F]{1,4}$/.test(group)) return null;
    const value = parseInt(group, 16);
    bytes.push(value >> 8, value & 255);
  }
  return bytes;
}

function parseAddress(text) {
  return text.indexOf(':') !== -1 ? parseIPv6(text) : parseIPv4(text);
}

function parseCidr(entry) {
  const slash = entry.indexOf('/');
  const address = parseAddress(slash === -1 ? entry : entry.slice(0, slash));
  if (!address) return null;
  const max = address.length * 8;
  let prefix = max;
  if (slash !== -1) {
    const text = entry.slice(slash + 1);
    if (!/^\d{1,3}$/.test(text) || Number(text) > max) return null;
    prefix = Number(text);
  }
  return { address: address, prefix: prefix };
}

// 形式が不正な要素は無視する（許可が増えることはない）
const CIDRS = ALLOWED_CIDRS.split(/[\s,]+/).filter(Boolean).map(parseCidr).filter(Boolean);

function inCidr(ip, cidr) {
  if (ip.length !== cidr.address.length) return false;
  let remaining = cidr.prefix;
  for (let i = 0; remaining > 0; i++, remaining -= 8) {
    const mask = remaining >= 8 ? 255 : (255 << (8 - remaining)) & 255;
    if ((ip[i] & mask) !== (cidr.address[i] & mask)) return false;
  }
  return true;
}

function isAllowedIp(text) {
  const ip = text ? parseAddress(text) : null;
  return ip !== null && CIDRS.some((cidr) => inCidr(ip, cidr));
}

// Authorization ヘッダーの値全体（「Basic xxxx」）の SHA-256 を比較する
function hasValidBasicAuth(headers) {
  const expected = BASIC_AUTH_SHA256.toLowerCase();
  const header = headers.authorization;
  if (!header || !/^[0-9a-f]{64}$/.test(expected)) return false;
  return crypto.createHash('sha256').update(header.value).digest('hex') === expected;
}

// 静的書き出しの URL 対応: /api/ 以外で拡張子のないパスに index.html を付ける
function rewriteUri(uri) {
  if (uri.startsWith('/api/')) return uri;
  if (uri.slice(uri.lastIndexOf('/') + 1).indexOf('.') !== -1) return uri;
  return uri.endsWith('/') ? uri + 'index.html' : uri + '/index.html';
}

function deny() {
  return {
    statusCode: 401,
    statusDescription: 'Unauthorized',
    headers: {
      'www-authenticate': { value: 'Basic realm="LoL Lab"' },
      'cache-control': { value: 'no-store' },
    },
  };
}

function handler(event) {
  const request = event.request;
  // 'false' のときだけ判定を省略する（未置換・想定外の値では拒否側に倒す）
  if (GATE_ENABLED !== 'false') {
    if (!isAllowedIp(event.viewer.ip) && !hasValidBasicAuth(request.headers)) {
      return deny();
    }
  }
  request.uri = rewriteUri(request.uri);
  return request;
}
