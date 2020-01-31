const maxSvgWidth = 450,
      maxSvgHeight = 350;


const puzzle = {
  state: 'wizard',
};
// This holds the data given by the user
const params = {};

const getElem = id => document.getElementById(id);
const elemIds = [
  'wizard', 
  'wiz0', 'wordsInput', 
  'wiz1', 'widthInput', 'heightInput',
  'errorMessage', 'nextButton',
  'searchPuzzle', 'screen', 'wordList',
];
//const e = Object.fromEntries(elemIds.map(id => [id, getElem(id)]));
const e = {};
elemIds.forEach(id => {
  e[id] = getElem(id);
});


const show = elem => elem.style.display = 'block';
const hide = elem => elem.style.display = 'none';
const maxLen = words => Math.max(...words.map(w => w.length));
const range = n => Array(n).fill(0).map((z, i) => i);

const dirDeltas = {
  E:  { dx:  1, dy:  0 },
  SE: { dx:  1, dy:  1 },
  S:  { dx:  0, dy:  1 },
  SW: { dx: -1, dy:  1 },
  W:  { dx: -1, dy:  0 },
  NW: { dx: -1, dy: -1 },
  N:  { dx:  0, dy: -1 },
  NE: { dx:  1, dy: -1 },
};
const directions = Object.keys(dirDeltas);


// check whether or not a grid square is valid and empty
const squareEmpty = (ltrX, ltrY) =>
  ltrX >= 0 && ltrX < params.width &&
  ltrY >= 0 && ltrY < params.height &&
  puzzle.grid[ltrX][ltrY].letter === null;

// check whether or not the current word fits into the grid
// starting at the current square
const wordFits = pld => {
  const ltrElem = pld.curMouseElem;
  const x = ltrElem.getAttribute('data-x') - 0,
        y = ltrElem.getAttribute('data-y') - 0;
  const wordData = puzzle.wordData[pld.wordNum],
        word = wordData.word;
  const dx = dirDeltas[pld.direction].dx,
        dy = dirDeltas[pld.direction].dy;

  return word.split('').map((ltr, ltrNum) => {
    // which grid square will this letter be on?
    const ltrX = x + ltrNum * dx,
          ltrY = y + ltrNum * dy;
    return squareEmpty(ltrX, ltrY);
  }).every(e=>e);
};

const changePlacing = pld => {
  const ltrElem = pld.curMouseElem;
  const x = ltrElem.getAttribute('data-x') - 0,
        y = ltrElem.getAttribute('data-y') - 0;
  const wordData = puzzle.wordData[pld.wordNum],
        word = wordData.word;
  const dx = dirDeltas[pld.direction].dx,
        dy = dirDeltas[pld.direction].dy;

  //console.log(`  word is ${word}, direction: ${pld.direction}`);
  const fits = wordFits(pld);
  console.log('  ' + (fits ? 'fits!' : 'doesn\'t fit'));

  // style the letter elements appropriately
  wordData.ltrElems.forEach((ltrElem, ltrNum) => {
    const ltrX = x + ltrNum * dx;
    const ltrY = y + ltrNum * dy;
    ltrElem.attrs({
      x: 8 + puzzle.scale * ltrX,
      y: 26 + puzzle.scale * ltrY,
      fill: fits ? '#AAA' : '#AAA',
      stroke: fits ? 'black' : 'none',
      'stroke-width': fits ? '1px' : '0px',
    });
  });
};

// This handles mouse move events during the "placing" stage
const mouseMoveHandler = evt => {
  if (puzzle.state !== 'placing') return;

  const pld = puzzle.placingData;
  const target = evt.target;
  if (target === pld.curMouseElem) return;

  console.log(`mouse move event`);
  pld.curMouseElem = target;
  changePlacing(pld);
};

document.onwheel = evt => {
  if (puzzle.state !== 'placing') return;

  const pld = puzzle.placingData;
  const upDown = Math.sign(evt.deltaY);
  console.log(`mouse wheel ${upDown === 1 ? 'up' : 'down'} event`);
  const oldDirNum = directions.indexOf(pld.direction),
        newDirNum = (oldDirNum + upDown + 8) % 8;
  pld.direction = directions[newDirNum];
  changePlacing(pld);
};

const gridClickHandler = evt => {
  if (puzzle.state !== 'placing') return;
  const pld = puzzle.placingData;
  if (!wordFits(pld)) return;

}

// The main "create word search" function -- this must come
// before the wizard code.

const createSearch = () => {
  show(e.searchPuzzle);
  puzzle.state = 'waiting';
  const width = params.width,
        height = params.height;

  const scr = d3.select(e.screen);
  // determine the scale (pixels per letter)
  const hScale = maxSvgWidth / width;
  const vScale = maxSvgHeight / height;
  const scale = puzzle.scale = Math.min(hScale, vScale);
  console.log('scale: ', scale);

  const svgWidth = scale * width,
        svgHeight = scale * height;
  console.log(`svg width: ${svgWidth}, height: ${svgHeight}`);
  const svg = scr.append('svg').attrs({
    width: svgWidth,
    height: svgHeight,
  });
  puzzle.board = svg.append('rect').attrs({
    x: 0, y: 0,
    width: svgWidth, 
    height: svgHeight,
    fill: '#CCC',
  });

  puzzle.grid = range(width).map(x => {
    return range(height).map(y => {
      const rect = svg.append('rect').attrs({
        x: scale * x + 1,
        y: scale * y + 1,
        width: scale - 2,
        height: scale - 2,
        'stroke-width': '1px',
        'stroke': '#888',
        fill: '#DDD',
        'data-x': x,
        'data-y': y,
      });
      rect.node().addEventListener('mousemove', mouseMoveHandler);
      return {
        rect: rect,
        letter: null,
      };
    });
  });


  const wordList = d3.select(e.wordList);
  puzzle.wordData = params.words.map((word, wordNum) => {
    const span = wordList.append('span').attrs({
      id: `word-${wordNum}`,
      'class': 'word',
    }).text(word);
    const ltrElems = word.split('').map((ltr, ltrNum) => {
      return svg.append('text').attrs({
        //x: 8 + puzzle.scale * ltrNum,
        //y: 26 + puzzle.scale * ltrNum,
        x: -100, y: -100,
        'font-family': 'courier',
        'font-size': '30px',
        'font-weight': 'bold',
        fill: '#AAA',
      }).text(ltr);
    });
    const initPlacingData = () => {
      return {
        wordNum,
        direction: 'E',
        curMouseElem: null,
      };
    };
    span.node().addEventListener('click', () => {
      console.log(`click on word #${wordNum}`);
      if (puzzle.state === 'waiting') {
        puzzle.state = 'placing';
        puzzle.placingData = initPlacingData();
      }
      else if (puzzle.state === 'placing') {
        const oldWordNum = puzzle.placingData.wordNum;
        if (wordNum !== oldWordNum) {
          const oldWord = puzzle.wordData[oldWordNum];
          oldWord.ltrElems.forEach(ltrElem => {
            ltrElem.attrs({x: -100, y: -100})
          });
          puzzle.placingData = initPlacingData();
        }
      }
    });
    wordList.append('br');
    return {
      word,
      span,
      ltrElems,
    };
  });

};

// The "wizard" for user input

// This checks that a word is valid. A word is not valid if it
// contains any non-letters or its length is unreasonable
const invalidWord = w => w.match(/[^A-Z]/) || w.length >= 16;

// This is called if there's an error in the user's input
const userError = msg => {
  const em = d3.select(e.errorMessage);
  e.errorMessage.textContent = msg;
  em.styles({
    display: 'inline-block',
    opacity: 1,
  })
  em.transition().duration(4000)
    .style('opacity', 0)
    .on('end', () => em.style('display', 'none'));
};
var wizState = 'get words';
const wizNext = evt => {
  hide(e.errorMessage);
  if (wizState === 'get words') {
    params.words = e.wordsInput.value.split(/[\s,]+/)
      .filter(word => word !== '')
      .map(w => w.toLocaleUpperCase());
    console.log('words: ', params.words);
    if (params.words.some(invalidWord)) {
      userError('Some of your words are not valid! Please try again.');
    }
    else if (params.words.length < 2) {
      userError('You should give me at least two words!');
    }
    else {
      hide(e.wiz0);
      show(e.wiz1);
      wizState = 'get size';
    }
  }
  else if (wizState === 'get size') {
    params.width = parseInt(e.widthInput.value, 10);
    params.height = parseInt(e.heightInput.value, 10);
    const maxDim = Math.max(params.width, params.height);
    const maxWordLen = maxLen(params.words);
    if (maxWordLen > maxDim) {
      userError(`At least one dimension must be as big as your longest word (${maxWordLen} letters)`);
    }
    else {
      hide(e.wizard);
      wizState = 'done';
      createSearch();
    }
  }
  else {
    console.error('Whaa???');
  }
};

e.nextButton.addEventListener('click', wizNext);


// just for testing, skip the wizard:
const skipWiz = () => {
  hide(e.wizard);
  show(e.screen);
  Object.assign(params, {
    words: ['A', 'B', 'C', 'DEATH', 'YAY', 'BOOKY', 'ENSKCWNNCNJDJNDNASS'],
    width: 'blue',
    height: 100,
  });
  createSearch();
};
skipWiz();
