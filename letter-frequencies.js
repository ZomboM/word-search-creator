/*
  This utility takes a list of letter-counts, or a sample text, and computes
  information about the set of letters. The returned object has the following
  properties. Note that uppercase forms of the letters are used througout.
    - totalCount: Total number of letter-occurances
    - letters: details about each letter:
        - count: number of times this letter appears
        - freq: as a percentage
        - rank: 0-based rank of this letter's frequency
        - percentile: the percentage of letter occurances that of letters that
          are as common as this letter (including this letter)
    - byRank: an array of the letters in rank-order
*/


const LetterFrequencies = (() => {
  const sortCompare = (a, b) => Math.sign(a - b);
  const comparer = extractor => (a, b) =>
    sortCompare(extractor(a), extractor(b));
  const sort = extractor => arr => [...arr].sort(comparer(extractor));
  const isUpperCaseLetter = l => l.length === 1 && l >= 'A' && l <= 'Z';
  const alphabet = Array(26).fill(null).map((z, i) => String.fromCharCode(i + 65));

  const fromCounts = counts => {
    if (!Object.keys(counts).every(isUpperCaseLetter))
      throw Error('All keys must be single uppercase letters');
    const getCount = ltr => ltr in counts ? counts[ltr] : 0;

    // This function sorts first by rank, and then alphabetical:
    const rankSorter = ltr => getCount(ltr) + (65 - ltr.charCodeAt(0)) / 26;

    const byRank = sort(rankSorter)(alphabet).reverse();
    const totalCount = byRank.reduce((sum, ltr) => sum + getCount(ltr), 0);

    const letters = {};
    byRank.reduce((freqSum, ltr, rank) => {
      const count = getCount(ltr),
            freq = 100 * count / totalCount,
            percentile = freqSum + freq;
      letters[ltr] = {
        count,
        freq: Math.round(freq * 100) / 100,
        rank,
        percentile,
      };
      return percentile;
    }, 0);

    return {
      letters,
      byRank,
      getRandom() {
        const r = 100 * Math.random();
        return byRank.find(ltr => letters[ltr].percentile >= r);
      },
    };
  };

  fromSampleText = sample => {
    const justLetters = sample.replace(/[^A-Z]+/g, '');
    const counts = {};
    justLetters.split('').forEach(ltr => {
      counts[ltr] = (ltr in counts ? counts[ltr] : 0) + 1;
    });
    return fromCounts(counts);
  };

  const englishCounts = {
    E: 21912,
    T: 16587,
    A: 14810,
    O: 14003,
    I: 13318,
    N: 12666,
    S: 11450,
    R: 10977,
    H: 10795,
    D: 7874,
    L: 7253,
    U: 5246,
    C: 4943,
    M: 4761,
    F: 4200,
    Y: 3853,
    W: 3819,
    G: 3693,
    P: 3316,
    B: 2715,
    V: 2019,
    K: 1257,
    X: 315,
    Q: 205,
    J: 188,
    Z: 128,
  };
  const english = fromCounts(englishCounts);
  const test = (data=english, ltr='A') => {
    const randoms = Array(100000).fill(0).map(data.getRandom).join(''),
          finder = new RegExp(ltr, 'g'),
          freq = randoms.match(finder).length / 1000;
    console.log('Generated random string: ' + randoms.substr(0, 100) + '...');
    console.log(`Frequency of "${ltr}": ${freq}%, ` +
      `should be close to ${data.letters[ltr].freq}%.`);
  };

  return {
    fromCounts,
    fromSampleText,
    englishCounts,
    english,
    test,
  };
})();
