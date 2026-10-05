'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const hljs = require('highlight.js/lib/core');

// src/*.js are bare `function(hljs) {...}` expressions, not modules.
function load(name) {
  const source = fs.readFileSync(path.join(__dirname, '..', 'src', name), 'utf8');
  return new Function('return (' + source + ')')();
}

const turtle = load('turtle.js');
const sparql = load('sparql.js');

function highlight(code) {
  // A fresh instance per call, so a failed grammar compile in one test does
  // not leave a half-compiled language behind for the next one.
  const instance = hljs.newInstance();
  // Without this, a grammar whose regexes fail to compile silently yields
  // unhighlighted text instead of throwing.
  instance.debugMode();
  // sparql.js reuses modes from hljs.getLanguage('ttl').exports.
  instance.registerLanguage('turtle', turtle);
  instance.registerLanguage('sparql', sparql);
  return instance.highlight(code, { language: 'sparql' }).value;
}

test('modes reused from the Turtle exports are highlighted', () => {
  assert.strictEqual(
    highlight('SELECT * WHERE { _:b ex:p <http://ex.org/o>, "x"@en, \'y\'^^xsd:string, 1, 1.5, 1e3 }'),
    '<span class="hljs-keyword">SELECT</span> * <span class="hljs-keyword">WHERE</span> { ' +
    '<span class="hljs-template-variable">_:b</span> ' +
    '<span class="hljs-symbol">ex:p</span> ' +
    '<span class="hljs-literal">&lt;http://ex.org/o&gt;</span>, ' +
    '<span class="hljs-string">&quot;x&quot;</span><span class="hljs-type">@en</span>, ' +
    '<span class="hljs-string">&#x27;y&#x27;</span><span class="hljs-type">^^xsd:string</span>, ' +
    '<span class="hljs-number">1</span>, ' +
    '<span class="hljs-number">1.5</span>, ' +
    '<span class="hljs-number">1e3</span> }'
  );
});
