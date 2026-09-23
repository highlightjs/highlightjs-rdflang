/*
Language: Turtle
Author: Mark Ellis <mark.ellis@stardog.com>, Vladimir Alexiev <vladimir.alexiev@ontotext.com>
Category: common
Description: Terse RDF Triple Language for the semantic web
Website: https://www.w3.org/TR/turtle/
*/

function(hljs) {
  /*
   * Turtle 1.1 lexical grammar.
   *
   * Do not use case_insensitive here. Turtle has case-sensitive @base,
   * @prefix, a, true and false tokens, while the SPARQL-derived BASE and
   * PREFIX directives are case-insensitive.
   */

  var PN_CHARS_BASE =
    'A-Za-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF' +
    '\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F' +
    '\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD' +
    '\\u{10000}-\\u{EFFFF}';

  var PN_CHARS_U = PN_CHARS_BASE + '_';
  var PN_CHARS = '-' + PN_CHARS_U + '0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040';

  var HEX = '[0-9A-Fa-f]';
  var UCHAR = '(?:\\\\u' + HEX + '{4}|\\\\U' + HEX + '{8})';
  var ECHAR = '\\\\[tbnrf"\'\\\\]';

  // IRIREF ::= '<' ([^#x00-#x20<>"{}|^`\\] | UCHAR)* '>'
  var IRI_BODY_CHAR = '[^\\x00-\\x20<>"{}|^`\\\\]';
  var IRIREF = '<(?:' + IRI_BODY_CHAR + '|' + UCHAR + ')*>';

  var PERCENT = '%[0-9A-Fa-f]{2}';
  var PN_LOCAL_ESC = '\\\\[_~.!$&\'()*+,;=/?#@%-]';
  var PLX = '(?:' + PERCENT + '|' + PN_LOCAL_ESC + ')';

  // PN_PREFIX ::= PN_CHARS_BASE ((PN_CHARS | '.')* PN_CHARS)?
  var PN_PREFIX =
    '[' + PN_CHARS_BASE + '](?:[' + PN_CHARS + '.]*[' + PN_CHARS + '])?';

  // PNAME_NS ::= PN_PREFIX? ':'
  var PNAME_NS = '(?:' + PN_PREFIX + ')?:';

  // PN_LOCAL ::= (PN_CHARS_U | ':' | [0-9] | PLX)
  //              ((PN_CHARS | '.' | ':' | PLX)* (PN_CHARS | ':' | PLX))?
  var PN_LOCAL =
    '(?:[' + PN_CHARS_U + ':0-9]|' + PLX + ')' +
    '(?:[' + PN_CHARS + '.:]|' + PLX + ')*' +
    '(?:[' + PN_CHARS + ':]|' + PLX + ')?';

  var PNAME_LN = PNAME_NS + PN_LOCAL;
  var PNAME = PNAME_LN + '|' + PNAME_NS;

  // BLANK_NODE_LABEL ::= '_:' (PN_CHARS_U | [0-9])
  //                       ((PN_CHARS | '.')* PN_CHARS)?
  var BLANK_NODE_LABEL =
    '_:(?:[' + PN_CHARS_U + '0-9])(?:[' + PN_CHARS + '.]*[' + PN_CHARS + '])?';

  var PNAME_MODE = {
    className: 'symbol',
    begin: '(?:' + PNAME + ')(?![A-Za-z0-9_])',
    relevance: 0
  };

  var BLANK_NODE_MODE = {
    className: 'template-variable',
    begin: BLANK_NODE_LABEL,
    relevance: 5
  };

  var IRI_MODE = {
    className: 'literal',
    begin: IRIREF,
    relevance: 1
  };

  // Escape sequences are child modes so escaped quote characters do not
  // terminate short strings.
  var ESCAPE_MODE = {
    className: 'symbol',
    begin: '(?:' + UCHAR + '|' + ECHAR + ')',
    relevance: 0
  };

  var TRIPLE_APOS_STRING = {
    className: 'string',
    begin: /'''/,
    end: /'''/,
    contains: [ESCAPE_MODE],
    relevance: 0
  };

  var TRIPLE_QUOTE_STRING = {
    className: 'string',
    begin: /"""/,
    end: /"""/,
    contains: [ESCAPE_MODE],
    relevance: 0
  };

  var APOS_STRING = {
    className: 'string',
    begin: /'/,
    end: /'/,
    contains: [ESCAPE_MODE],
    relevance: 0
  };

  var QUOTE_STRING = {
    className: 'string',
    begin: /"/,
    end: /"/,
    contains: [ESCAPE_MODE],
    relevance: 0
  };

  var LANGTAG = {
    className: 'type',
    begin: /@[a-zA-Z]+(?:-[a-zA-Z0-9]+)*/,
    relevance: 0
  };

  var DATATYPE = {
    className: 'type',
    begin: '\\^\\^(?:' + IRIREF + '|' + PNAME + ')',
    relevance: 0
  };

  // Turtle numeric terminals. DOUBLE must precede DECIMAL and INTEGER.
  var EXPONENT = '[eE][+-]?[0-9]+';

  var DOUBLE = {
    className: 'number',
    begin: '[+-]?(?:[0-9]+\\.[0-9]*' + EXPONENT + '|\\.[0-9]+' +
      EXPONENT + '|[0-9]+' + EXPONENT + ')(?![A-Za-z0-9_.])',
    relevance: 0
  };

  var DECIMAL = {
    className: 'number',
    begin: '[+-]?(?:[0-9]*\\.[0-9]+)(?![A-Za-z0-9_.])',
    relevance: 0
  };

  var INTEGER = {
    className: 'number',
    begin: '[+-]?[0-9]+(?![A-Za-z0-9_.])',
    relevance: 0
  };

  var BOOLEAN = {
    className: 'literal',
    begin: /\b(?:true|false)\b/,
    relevance: 0
  };

  var RDF_TYPE = {
    className: 'built_in',
    begin: /\ba\b/,
    relevance: 0
  };

  // @base and @prefix are case-sensitive Turtle directives.
  var AT_PREFIX = {
    className: 'keyword',
    begin: /@prefix(?=\s)/,
    relevance: 10
  };

  var AT_BASE = {
    className: 'keyword',
    begin: /@base(?=\s)/,
    relevance: 10
  };

  // BASE and PREFIX are the SPARQL-derived Turtle directives and are
  // explicitly case-insensitive.
  var SPARQL_PREFIX = {
    className: 'keyword',
    begin: /PREFIX(?=\s)/i,
    relevance: 10
  };

  var SPARQL_BASE = {
    className: 'keyword',
    begin: /BASE(?=\s)/i,
    relevance: 10
  };

  var ANON = {
    className: 'punctuation',
    begin: /[\[\]]/,
    relevance: 0
  };

  var COLLECTION = {
    className: 'punctuation',
    begin: /[()]/,
    relevance: 0
  };

  var DELIMITER = {
    className: 'punctuation',
    begin: /[;,\.]/,
    relevance: 0
  };

  return {
    unicodeRegex: true,
    aliases: ['turtle', 'ttl', 'n3', 'ntriples'],

    contains: [
      // Comments must come before tokens containing '#'.
      hljs.HASH_COMMENT_MODE,

      // Directive modes precede LANGTAG because @prefix/@base are directives
      // when used in directive position.
      AT_PREFIX,
      AT_BASE,
      SPARQL_PREFIX,
      SPARQL_BASE,

      // Long strings must precede short strings.
      TRIPLE_APOS_STRING,
      TRIPLE_QUOTE_STRING,
      APOS_STRING,
      QUOTE_STRING,

      IRI_MODE,
      BLANK_NODE_MODE,
      DATATYPE,
      PNAME_MODE,
      LANGTAG,

      DOUBLE,
      DECIMAL,
      INTEGER,
      BOOLEAN,
      RDF_TYPE,

      ANON,
      COLLECTION,
      DELIMITER
    ],

    exports: {
      IRIREF: IRI_MODE,
      BLANK_NODE: BLANK_NODE_MODE,
      PNAME: PNAME_MODE,
      LANGTAG: LANGTAG,
      DATATYPE: DATATYPE,
      TRIPLE_APOS_STRING: TRIPLE_APOS_STRING,
      TRIPLE_QUOTE_STRING: TRIPLE_QUOTE_STRING,
      APOS_STRING: APOS_STRING,
      QUOTE_STRING: QUOTE_STRING,
      DOUBLE: DOUBLE,
      DECIMAL: DECIMAL,
      INTEGER: INTEGER
    }
  };
}
