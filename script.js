const maxSvgWidth = 500,
      maxSvgHeight = 350;

const range = n => Array(n).fill(0).map((z, i) => i);


const puzzle = {
  state: 'wizard',
};

const board = puzzle.board = {
  width: 10,
  height: 10,
  squares: null;
  inBounds(c) {
    return c.x >= 0 && c.x < this.width &&
           c.y >= 0 && c.y < this.height;
  },
  squareEmpty(c) {
    return this.inBounds(c) && 
      this.squares[c.x][c.y].letter === null;
  },
  getSquare(c) {
    return this.squares[c.x][c.y];
  },
};


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

const show = elem => {
  const disp = elem.attr('data-display') || 'block';
  elem.style.display = disp;
};
const hide = elem => {
  elem.attr('data-display', elem.style.display);
  elem.style.display = 'none';
};

const dirDeltas = [
  { x:  1, y:  0 },  // east
  { x:  1, y:  1 },  // south-east
  { x:  0, y:  1 },  // south
  { x: -1, y:  1 },  // south-west
  { x: -1, y:  0 },  // west
  { x: -1, y: -1 },  // north-west
  { x:  0, y: -1 },  // north
  { x:  1, y: -1 },  // north-east
];

const placingData = puzzle.placingData = {
  wordData: null,
  direction: 0,
  startSquare: null,
  wheelPrimed: true,
  dirDelta() {
    return dirDeltas[this.direction];
  },
  nextCoord(c) {
    const dd = this.dirDelta();
    return {
      x: c.x + dd.x,
      y: c.y + dd.y,
    };
  },
  // Places the letters on the grid squares, and styles
  // them accordingly
  place() {
    const startAcc = {
      fitsSoFar: true,
      square: this.startSquare,
    };
    this.wordData.ltrData.reduce((acc, ltrD) => {
      if (acc.fitsSoFar) {
        const c = this.nextCoord(acc.square.c);
        const fitsSoFar = board.squareEmpty(c);

          return {
            fitsSoFar: false,
            square: null,
          }
        }


        }
        return {
          fits,
          square: fits ?
        };
      }
    }, { fits: true,});
  },
};

// check whether or not the current word fits into the grid
// starting at the current square
const wordFits = pld => {
  const {dx, dy} = directions[pld.direction];

  return word.split('').map((ltr, ltrNum) => {
    // which grid square will this letter be on?
    const ltrX = x + ltrNum * dx,
          ltrY = y + ltrNum * dy;
    return squareEmpty(ltrX, ltrY);
  }).every(e=>e);
};

const changePlacing = pld => {
  const ltrElem = pld.curElem;
  const x = ltrElem.getAttribute('data-x') - 0,
        y = ltrElem.getAttribute('data-y') - 0;
  const wordData = pld.wordData,
        word = wordData.word;
  const {dx, dy} = directions[pld.direction];

  //console.log(`  word is ${word}, direction: ${pld.direction}`);
  const fits = wordFits(pld);
  //console.log('  ' + (fits ? 'fits!' : 'doesn\'t fit'));

  // style the letter elements appropriately
  wordData.ltrElems.forEach((ltrElem, ltrNum) => {
    const ltrX = x + ltrNum * dx,
          ltrY = y + ltrNum * dy,
          scale = puzzle.scale,
          offset = puzzle.offset;
    ltrElem.attrs({
      x: scale * ltrX + offset,
      y: scale * ltrY + offset,
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
  if (target === pld.curElem) return;

  //console.log(`mouse move event`);
  pld.curElem = target;
  changePlacing(pld);
};

document.onwheel = evt => {
  if (puzzle.state !== 'placing') return;
  const pld = puzzle.placingData;
  if (!pld.wheelPrimed) return;

  const upDown = -Math.sign(evt.deltaY);
  //console.log(`mouse wheel ${upDown === 1 ? 'up' : 'down'} event`);
  pld.direction = (pld.direction + upDown + 8) % 8;
  changePlacing(pld);
  pld.wheelPrimed = false;
  setTimeout(() => pld.wheelPrimed = true, 150);
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
  puzzle.fontSize = Math.floor(puzzle.scale * 6 / 7);
  puzzle.offset = Math.floor(puzzle.scale / 2);

  //console.log('scale: ', scale);

  const svgWidth = scale * width,
        svgHeight = scale * height;
  //console.log(`svg width: ${svgWidth}, height: ${svgHeight}`);
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
    const wordData = {
      word,
      span: wordList.append('span').attrs({
        id: `word-${wordNum}`,
        'class': 'word',
      }).text(word),
      ltrElems: word.split('').map((ltr, ltrNum) => {
        return svg.append('text').attrs({
          //x: 8 + puzzle.scale * ltrNum,
          //y: 26 + puzzle.scale * ltrNum,
          x: -100, y: -100,
          'font-family': 'courier',
          'font-size': `${puzzle.fontSize}px`,
          'font-weight': 'bold',
          fill: '#AAA',
          'text-anchor': 'middle',
          'alignment-baseline': 'middle',
        }).text(ltr);
      }),
    };
    wordData.span.node().addEventListener('click', () => {
      console.log(`click on word "${word}"`);
      if (puzzle.state === 'waiting') {
        puzzle.state = 'placing';
        puzzle.placingData = initPlacingData();
      }
      else if (puzzle.state === 'placing') {
        const oldWordData = puzzle.placingData.wordData;
        if (word !== oldWordData.word) {
          oldWordData.ltrElems.forEach(ltrElem => {
            ltrElem.attrs({x: -100, y: -100})
          });
          puzzle.placingData = initPlacingData();
        }
      }
    });
    wordList.append('br');
    return wordData;
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
    words: ['A', 'B', 'C', 'DEATH', 'YAY', 'BOOK', 'INSANITY','IMPOSSIBILITY'],
    width: 10,
    height: 20,
  });
  createSearch();
};
skipWiz();
