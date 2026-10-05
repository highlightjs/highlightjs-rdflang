'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const hljs = require('highlight.js/lib/core');

// src/turtle.js is a bare `function(hljs) {...}` expression, not a module.
const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'turtle.js'), 'utf8');
const turtle = new Function('return (' + source + ')')();

function highlight(code) {
  // A fresh instance per call, so a failed grammar compile in one test does
  // not leave a half-compiled language behind for the next one.
  const instance = hljs.newInstance();
  // Without this, a grammar whose regexes fail to compile silently yields
  // unhighlighted text instead of throwing.
  instance.debugMode();
  instance.registerLanguage('turtle', turtle);
  return instance.highlight(code, { language: 'turtle' }).value;
}

const REST = ' <span class="hljs-built_in">a</span> ' +
  '<span class="hljs-symbol">ex:Thing</span> ' +
  '<span class="hljs-punctuation">.</span>';

// The PN_CHARS* ranges are written as '\\u00B7' etc., so the regex engine,
// not the JS string literal, has to turn them into code points.

test('PN_CHARS: middle dot (U+00B7) is part of a prefixed name', () => {
  assert.strictEqual(
    highlight('ex:foo·bar a ex:Thing .'),
    '<span class="hljs-symbol">ex:foo·bar</span>' + REST
  );
});

test('PN_CHARS: hyphen followed by middle dot is part of a prefixed name', () => {
  assert.strictEqual(
    highlight('ex:foo-·bar a ex:Thing .'),
    '<span class="hljs-symbol">ex:foo-·bar</span>' + REST
  );
});

test('PN_CHARS: middle dot is part of a blank node label', () => {
  assert.strictEqual(
    highlight('_:b·1 a ex:Thing .'),
    '<span class="hljs-template-variable">_:b·1</span>' + REST
  );
});

test('PN_CHARS_BASE: BMP letter (U+00E9) is part of a prefixed name', () => {
  assert.strictEqual(
    highlight('ex:café a ex:Thing .'),
    '<span class="hljs-symbol">ex:café</span>' + REST
  );
});

test('PN_CHARS_BASE: astral letter (U+1D538) is part of a prefixed name', () => {
  assert.strictEqual(
    highlight('ex:\u{1D538} a ex:Thing .'),
    '<span class="hljs-symbol">ex:\u{1D538}</span>' + REST
  );
});

test('PN_CHARS_BASE: U+00D7, between \\u00D6 and \\u00D8, ends a prefixed name', () => {
  assert.strictEqual(
    highlight('ex:a×b a ex:Thing .'),
    '<span class="hljs-symbol">ex:a</span>×b' + REST
  );
});
