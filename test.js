const { readFileSync } = require('fs');
const test = require('ava');

function compare(t, fixtureFilePath, expectedFilePath){
  return require('postcss')([ require('./index.js') ])
    .process(
      readFileSync(`./fixtures/${fixtureFilePath}`, 'utf8'),
      { from: fixtureFilePath }
    )
    .then(result => {
      const expected = result.css;
      const actual = readFileSync(`./expected/${expectedFilePath}`, 'utf8');
      t.is(expected, actual);
      t.is(result.warnings().length, 0);
    });
}

test('remap with find and replace', t => {
  return compare(t, 'find-replace.css', 'find-replace.css');
});

test('support regexp', t => {
  return compare(t, 'regexp.css', 'regexp.css');
});

test('support filter', t => {
  return compare(t, 'filter.css', 'filter.css');
});

test('support a list of filters', t => {
  return compare(t, 'filter-list.css', 'filter-list.css');
});

test('support a list of filters with regex', t => {
  return compare(t, 'filter-list-regex.css', 'filter-list-regex.css');
});
