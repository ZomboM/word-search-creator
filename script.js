// The state of any given word in the word list is one of:
//   - unplaced
//   - offboard
//   - nofit
//   - fits
//   - placed

d3.select('#wizard').style('display', 'none');

const [puzzleDiv, boardDiv, wordsDiv] =
  ['puzzle', 'board', 'words'].map(id => d3.select('#' + id));
puzzleDiv.style('display', 'block');

const maxSvgWidth = 500,
      maxSvgHeight = 350;

const puzzle = {
  cols: 5,
  rows: 5,
  words: ['a', 'bed', 'cappy'],
};

const {cols, rows, words} = puzzle;

// determine the scale (pixels per box)
const hScale = maxSvgWidth / cols / 10,
      vScale = maxSvgHeight / rows / 10,
      scale = Math.min(hScale, vScale),
      svgWidth = 10 * scale * cols + 4,
      svgHeight = 10 * scale * rows + 4;

const svg = boardDiv.append('svg').attrs({
  width: svgWidth,
  height: svgHeight,
  viewBox: `-2 -2 ${svgWidth} ${svgHeight}`,
});
const board = svg.append('g').attr('transform', `scale(${scale})`);

const grid = range(cols).map(col =>
  range(rows).map(row => {
    const g = board.append('g').attr(
      'transform', `translate(${10*col} ${10*row})`);
    const box = g.append('rect').attrs({
      'id': 'box' + [col, row].join('-'),
      x: 0, y: 0,
      width: 10, height: 10,
      'stroke-width': '1px',
      'stroke': '#888',
      fill: '#DDD',
    });
    return {
      col, row,
      g, box,
      letter: null,
    };
  })
);

const validPos = (c, r) => c >= 0 && c < cols && r >= 0 && r < rows;

// checks whether or not a grid square is valid, and either is empty or has
// the desired letter
const goodSquare = (c, r, ltr) => {
  if (!validPos(c, r)) return false;
  const gridLtr = grid[c][r].letter;
  return gridLtr === null || gridLtr === ltr;
};



const directions = [
  [  1,  0 ],  // east
  [  1,  1 ],  // south-east
  [  0,  1 ],  // south
  [ -1,  1 ],  // south-west
  [ -1,  0 ],  // west
  [ -1, -1 ],  // north-west
  [  0, -1 ],  // north
  [  1, -1 ],  // north-east
];
const getPos = (col, row, dir) => n => {
  const [dc, dr] = directions[dir];
  return [col + n*dc, row + n*dr];
}


const states = ['unplaced', 'placing', 'placed'];
const setClass = (elem, state) => {
  states.forEach(s => {
    (s === state ? addClass : removeClass)(elem, s);
  })
};

const wordList = words.map((text, wordNum) => {
  const word = {
    text,
    wordNum,
    col: -1,
    row: -1,
    dir: 0,
    _state: 'unplaced',

    listSpan: wordsDiv.append('span')
      .attrs({
        'id': `word${wordNum}`,
        'class': 'word',
      })
      .text(text),

    get onBoard() {
      return this.col >= 0;
    },
    get ltrPos() {
      return this.onBoard ? getPos(this.col, this.row, this.dir) : null;
    },
    get fits() {
      if (this._state !== 'placing' || !this.onBoard) return false;
      const isBadLtr = (ltr, n) => {
        const [c, r] = this.ltrPos(n);
        return !goodSquare(c, r, ltr);
      };
      return this.text.split('').findIndex(isBadLtr) === -1;
    },

    get state() { return this._state; },
    set state(s) {
      if (s === this._state) return;
      setClass(this.listSpan, s);
      this.letters.forEach(letter => setClass(letter.elem, s));
      this._state = s;
    },
  };

  wordsDiv.append('br');

  word.letters = text.split('').map((ltr, ltrNum) => {
    const g = board.append('g').attr('transform', 'translate(0, 0)');
    const elem = g.append('text').attrs({
      x: 5, y: 6,
      'font-family': 'courier',
      'font-size': `10px`,
      'font-weight': 'bold',
      'text-anchor': 'middle',
      'alignment-baseline': 'middle',
      opacity: 0,
    });
    elem.text(ltr);
    return {
      word,
      ltr, ltrNum,
      g, elem,
    };
  });

  return word;
});



let placingWord = null;

const clearPlacingWord = () => {
  if (placingWord === null) return;
  placingWord.state = 'unplaced';
  placingWord = null;
};

const setPlacingWord = word => {
  if (word === placingWord) return;
  clearPlacingWord();
  Object.assign(word, {
    col: -1, row: -1, dir: 0,
  });
  word.state = 'placing';
  placingWord = word;
};

// call this after any change to col, row, or dir
const updatePlacing = () => {
  if (placingWord === null) return;
  const word = placingWord,
        {col, row, dir} = word;

  word.letters.forEach((letter, n) => {
    const [c, r] = word.onBoard ? word.ltrPos(n) : [-10, -10];
    letter.g.attr('transform', `translate(${10*c} ${10*r})`);
    letter.elem.attr('opacity',
      word.onBoard ? (word.fits ? 0.7 : 0.3) : 0);
  });
};

// Set col = -1 to move off board
const movePlacing = (col, row) => {
  if (placingWord === null) return;
  placingWord.col = col;
  placingWord.row = row;
  updatePlacing();
};
const turnPlacing = dir => {
  if (placingWord === null) return;
  placingWord.dir = dir;
  updatePlacing();
};


wordList.forEach(word => {
  word.listSpan.node().addEventListener('click', evt => {
    setPlacingWord(word);
  });
})

const mouseMoveHandler = evt => {
  if (placingWord === null) return;
  const boxId = evt.target.getAttribute('id');  // e.g. 'box4-7'
  const [c, r] = boxId.substr(3).split('-').map(toInt);
  movePlacing(c, r);
};
const gridClickHandler = evt => {

};
grid.forEach(row => row.forEach(sq => {
  sq.box.node().addEventListener('mousemove', mouseMoveHandler);
  sq.box.node().addEventListener('click', gridClickHandler);
}));

let wheelReady = true;   // throttle
document.onwheel = evt => {
  if (!wheelReady) return;
  const upDown = -Math.sign(evt.deltaY);
  //console.log(`mouse wheel ${upDown === 1 ? 'up' : 'down'} event`);
  turnPlacing((placingWord.dir + upDown + 8) % 8);

  wheelReady = false;
  setTimeout(() => wheelReady = true, 150);
};


setPlacingWord(wordList[0]);
