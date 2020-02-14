// The wizard returns a Promise that resolves to a puzzle
// object

//const puzzle = {};

const wizard = () => new Promise((resolve, reject) => {
  // states:  `words`, `size`
  let state = 'words';
  const puzzle = {};
  const maxDim = 50;


  const elements = puzzle.elements = {};
  [ 'wizard', 
    'wpage0', 'wwords', 
    'wpage1', 'wwidth', 'wheight',
    'werror', 'wnext',
  ].forEach(elemId => {
    elements[elemId] = d3.select(document.getElementById(elemId));
  });


  const userError = msg => {
    const werror = elements.werror;
    werror.text(msg);
    werror.styles({
      display: 'inline-block',
      opacity: 1,
    })
    werror.transition().duration(5000)
      .style('opacity', 0)
      .on('end', () => werror.style('display', 'none'));
    return false;
  };

  const getWords = () => {
    const invalidWord = w => w.match(/[^A-Z]/) || w.length >= 16;

    const words = elements.wwords.node().value.split(/[\s,;]+/)
      .filter(word => word !== '')
      .map(w => w.toLocaleUpperCase());
    console.log('words: ', words);
    if (words.some(invalidWord)) {
      return userError('Some of your words are not valid! Please try again.');
    }
    if (words.length < 2) {
      return userError('You should give me at least two words!');
    }
    puzzle.words = words;
    return true;
  };

  const getSize = () => {
    const validDim = val => !isNaN(val) && val > 1 && val <= maxDim;
    const wtxt = elements.wwidth.node().value;
    const htxt = elements.wheight.node().value;
    console.log('wtxt: ', wtxt, ', htxt: ', htxt);
    const w = parseInt(wtxt, 10);
    const h = parseInt(htxt, 10);

    if (!validDim(w)) {
      userError('Invalid value for width' +
        (validDim(h) ? '' : ' and height') + '!');
      return false;
    }
    if (!validDim(h)) {
      userError('Invalid value for height!');
      return false;
    }
    console.log('w: ', w, ', h: ', h);

    const maxWordLen = Math.max(...puzzle.words.map(w => w.length));
    if (maxWordLen > Math.max(w, h)) {
      userError(`At least one dimension must be as big as your longest word (${maxWordLen} letters)`);
      return false;
    }
    puzzle.width = w;
    puzzle.height = h;
    return true;
  };

  elements.wnext.node().addEventListener('click', evt => {
    // Hide the error message
    elements.werror.style('display', 'none');

    if (state === 'words') {
      if (getWords()) {
        elements.wpage0.styles({display: 'none'});
        elements.wpage1.styles({display: 'block'});
        state = 'size';
      }
      return;
    }
    
    if (state === 'size') {
      if (getSize()) {
        elements.wizard.styles({display: 'none'});
        resolve(puzzle);
      }
      return;
    }
  });
});
