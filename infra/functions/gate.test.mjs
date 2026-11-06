// gate.js の単体テスト: node --test infra/functions/gate.test.mjs
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { describe, it } from 'node:test';

const SOURCE = readFileSync(new URL('./gate.js', import.meta.url), 'utf8');
const require = createRequire(import.meta.url);

const sha256 = (text) => createHash('sha256').update(text).digest('hex');
const HEADER = 'Basic dXNlcjpwYXNz';
const HASH = sha256(HEADER);

/** プレースホルダーを置き換えて gate.js を読み込み、handler を返す */
function load({ enabled = 'true', cidrs = '', hash = '' } = {}) {
  const code = SOURCE.replace('__GATE_ENABLED__', enabled)
    .replace('__ALLOWED_CIDRS__', cidrs)
    .replace('__BASIC_AUTH_SHA256__', hash);
  return new Function('require', `${code}\nreturn handler;`)(require);
}

function makeEvent(uri, ip, authorization) {
  const headers = authorization ? { authorization: { value: authorization } } : {};
  return { viewer: { ip }, request: { uri, method: 'GET', headers } };
}

const isDenied = (result) => result.statusCode === 401;

describe('設定値のプレースホルダー', () => {
  it('3つとも1回ずつ存在する', () => {
    for (const name of ['__GATE_ENABLED__', '__ALLOWED_CIDRS__', '__BASIC_AUTH_SHA256__']) {
      assert.equal(SOURCE.split(name).length - 1, 1, name);
    }
  });

  it('Fn::Sub を壊す文字列を含まず、サイズに余裕がある', () => {
    assert.ok(!SOURCE.includes('${'));
    assert.ok(Buffer.byteLength(SOURCE) < 8000, '10KB の上限に対して値の分の余裕を残す');
  });

  it('CloudFront Functions（runtime 2.0）が対応しない構文を使わない', () => {
    const code = SOURCE.replace(/^\s*\/\/.*$/gm, '');
    assert.ok(!/\bfor\s*\([^)]*\bof\b/.test(code), 'for...of');
    assert.ok(!/\.\.\.\s*[A-Za-z_[(]/.test(code.replace(/function\s*\w*\s*\([^)]*\)/g, '')), 'スプレッド構文');
    assert.ok(!/\b(const|let|var)\s*[[{]/.test(code), '分割代入');
    assert.ok(!/\bclass\s+\w/.test(code), 'class');
    assert.ok(!/\?\.|\?\?/.test(code), 'オプショナルチェーン・Null 合体');
  });

  it('置き換えないままでは全員拒否する', () => {
    const handler = load({
      enabled: '__GATE_ENABLED__',
      cidrs: '__ALLOWED_CIDRS__',
      hash: '__BASIC_AUTH_SHA256__',
    });
    assert.ok(isDenied(handler(makeEvent('/', '203.0.113.1'))));
  });
});

describe('IPv4 の許可', () => {
  const handler = load({ cidrs: '192.168.0.0/24,203.0.113.7,10.0.16.0/20' });
  const allowed = (ip) => !isDenied(handler(makeEvent('/', ip)));

  it('CIDR の先頭と末尾を許可し、境界の外を拒否する', () => {
    assert.ok(allowed('192.168.0.0'));
    assert.ok(allowed('192.168.0.255'));
    assert.ok(!allowed('192.168.1.0'));
    assert.ok(!allowed('192.167.255.255'));
  });

  it('プレフィックスなしは /32 として扱う', () => {
    assert.ok(allowed('203.0.113.7'));
    assert.ok(!allowed('203.0.113.8'));
    assert.ok(!allowed('203.0.113.6'));
  });

  it('8の倍数でないプレフィックス（/20）の境界', () => {
    assert.ok(allowed('10.0.16.0'));
    assert.ok(allowed('10.0.31.255'));
    assert.ok(!allowed('10.0.32.0'));
    assert.ok(!allowed('10.0.15.255'));
  });

  it('/0 は IPv4 をすべて許可するが IPv6 は許可しない', () => {
    const all = load({ cidrs: '0.0.0.0/0' });
    assert.ok(!isDenied(all(makeEvent('/', '198.51.100.9'))));
    assert.ok(isDenied(all(makeEvent('/', '2001:db8::1'))));
  });
});

describe('IPv6 の許可', () => {
  const handler = load({ cidrs: '2001:db8::/32, ::1/128, 2001:db8:abcd:1::/64, 64:ff9b::192.0.2.33' });
  const allowed = (ip) => !isDenied(handler(makeEvent('/', ip)));

  it('/32 の先頭と末尾を許可し、境界の外を拒否する', () => {
    assert.ok(allowed('2001:db8::'));
    assert.ok(allowed('2001:db8:ffff:ffff:ffff:ffff:ffff:ffff'));
    assert.ok(!allowed('2001:db9::'));
    assert.ok(!allowed('2001:db7:ffff:ffff:ffff:ffff:ffff:ffff'));
  });

  it('省略表記と大文字小文字の違いを同じアドレスとして扱う', () => {
    assert.ok(allowed('::1'));
    assert.ok(allowed('0:0:0:0:0:0:0:1'));
    assert.ok(!allowed('::2'));
    assert.ok(allowed('2001:DB8:0:0:0:0:0:5'));
  });

  it('/64 の境界', () => {
    assert.ok(allowed('2001:db8:abcd:1:ffff::1'));
    assert.ok(allowed('2001:db8:abcd:1::'));
    assert.ok(allowed('2001:db8:abcd:2::'), '/32 に含まれるため許可');
    const narrow = load({ cidrs: '2001:db8:abcd:1::/64' });
    assert.ok(isDenied(narrow(makeEvent('/', '2001:db8:abcd:2::'))));
    assert.ok(!isDenied(narrow(makeEvent('/', '2001:db8:abcd:1:ffff:ffff:ffff:ffff'))));
  });

  it('末尾が IPv4 表記のアドレスを扱える', () => {
    assert.ok(allowed('64:ff9b::192.0.2.33'));
    assert.ok(allowed('64:ff9b::c000:221'));
    assert.ok(!allowed('64:ff9b::192.0.2.34'));
  });

  it('IPv4 と IPv6 を取り違えない', () => {
    const v4Only = load({ cidrs: '192.168.0.0/16' });
    assert.ok(isDenied(v4Only(makeEvent('/', '::c0a8:1'))));
    const v6Only = load({ cidrs: '::/0' });
    assert.ok(isDenied(v6Only(makeEvent('/', '192.168.0.1'))));
    assert.ok(!isDenied(v6Only(makeEvent('/', '2001:db8::1'))));
  });
});

describe('不正な入力', () => {
  it('不正な CIDR の要素は無視し、有効な要素は使える', () => {
    const handler = load({ cidrs: 'abc, 1.2.3/24, 1.2.3.4/33, ::/129, 1:2:3/64, 10.0.0.0/8' });
    assert.ok(!isDenied(handler(makeEvent('/', '10.1.2.3'))));
    assert.ok(isDenied(handler(makeEvent('/', '1.2.3.4'))));
  });

  it('不正な viewer IP は拒否する', () => {
    const handler = load({ cidrs: '0.0.0.0/0' });
    for (const ip of ['', undefined, 'x', '1.2.3', '256.0.0.1', '1::2::3', ':::']) {
      assert.ok(isDenied(handler(makeEvent('/', ip))), String(ip));
    }
  });

  it('許可リストが空なら IP では通らない', () => {
    assert.ok(isDenied(load()(makeEvent('/', '203.0.113.1'))));
  });
});

describe('ベーシック認証', () => {
  const handler = load({ cidrs: '192.0.2.0/24', hash: HASH });

  it('Authorization ヘッダー全体のハッシュが一致すれば通す', () => {
    assert.ok(!isDenied(handler(makeEvent('/', '203.0.113.1', HEADER))));
  });

  it('設定のハッシュは大文字でもよい', () => {
    const upper = load({ hash: HASH.toUpperCase() });
    assert.ok(!isDenied(upper(makeEvent('/', '203.0.113.1', HEADER))));
  });

  it('パスワードが違う・ヘッダーがない・形式が違うときは拒否する', () => {
    assert.ok(isDenied(handler(makeEvent('/', '203.0.113.1', 'Basic d3Jvbmc6d3Jvbmc='))));
    assert.ok(isDenied(handler(makeEvent('/', '203.0.113.1'))));
    assert.ok(isDenied(handler(makeEvent('/', '203.0.113.1', 'dXNlcjpwYXNz'))));
    assert.ok(isDenied(handler(makeEvent('/', '203.0.113.1', HASH))));
  });

  it('ハッシュ未設定・不正な長さでは、どんなヘッダーも通さない', () => {
    for (const hash of ['', 'abc', sha256('').slice(0, 63)]) {
      const h = load({ hash });
      assert.ok(isDenied(h(makeEvent('/', '203.0.113.1', ''))));
      assert.ok(isDenied(h(makeEvent('/', '203.0.113.1', 'Basic '))));
      assert.ok(isDenied(h(makeEvent('/', '203.0.113.1', HEADER))));
    }
  });

  it('許可 IP ならヘッダーがなくても通す', () => {
    assert.ok(!isDenied(handler(makeEvent('/', '192.0.2.10'))));
  });
});

describe('拒否の応答', () => {
  it('401 と WWW-Authenticate を返す', () => {
    const result = load()(makeEvent('/', '203.0.113.1'));
    assert.equal(result.statusCode, 401);
    assert.equal(result.headers['www-authenticate'].value, 'Basic realm="LoL Lab"');
    assert.equal(result.request, undefined);
  });

  it('API のパスも同じく拒否する', () => {
    assert.ok(isDenied(load()(makeEvent('/api/summoner/x', '203.0.113.1'))));
  });
});

describe('無効化', () => {
  const handler = load({ enabled: 'false' });

  it('GATE_ENABLED が false なら判定を省略し、書き換えは行う', () => {
    const result = handler(makeEvent('/champion/Ahri', '203.0.113.1'));
    assert.equal(result.uri, '/champion/Ahri/index.html');
  });

  it('true や想定外の値では判定する', () => {
    for (const enabled of ['true', 'False', '', '0']) {
      assert.ok(isDenied(load({ enabled })(makeEvent('/', '203.0.113.1'))), enabled);
    }
  });
});

describe('URL の書き換え', () => {
  const handler = load({ enabled: 'false' });
  const rewrite = (uri) => handler(makeEvent(uri, '203.0.113.1')).uri;

  it('/ と末尾スラッシュのパスに index.html を付ける', () => {
    assert.equal(rewrite('/'), '/index.html');
    assert.equal(rewrite('/champion/Ahri/'), '/champion/Ahri/index.html');
  });

  it('末尾スラッシュなしで拡張子のないパスにも付ける', () => {
    assert.equal(rewrite('/champion/Ahri'), '/champion/Ahri/index.html');
    assert.equal(rewrite('/notes'), '/notes/index.html');
  });

  it('拡張子のあるパスは変えない', () => {
    for (const uri of ['/404.html', '/_next/static/chunks/a-1b2c.js', '/images/a.png', '/favicon.ico']) {
      assert.equal(rewrite(uri), uri);
    }
  });

  it('/api/ 配下は変えない', () => {
    for (const uri of ['/api/summoner/JP/x', '/api/', '/api/champion/Ahri']) {
      assert.equal(rewrite(uri), uri);
    }
  });

  it('ディレクトリ名にドットがあっても、最後の要素で判定する', () => {
    assert.equal(rewrite('/v1.2/page'), '/v1.2/page/index.html');
  });

  it('許可された場合もリクエストを書き換えて返す', () => {
    const allowed = load({ cidrs: '203.0.113.0/24' });
    const result = allowed(makeEvent('/champion/Ahri', '203.0.113.1'));
    assert.equal(result.uri, '/champion/Ahri/index.html');
    assert.equal(result.method, 'GET');
  });
});
