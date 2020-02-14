const maxSvgWidth = 500,
      maxSvgHeight = 350;

const debugData = {};

// Each word in the list is in one of three states:
// - unplaced
// - placed - tentatively displayed on the board
// - fixed - permanently on the board

makeSearch = puzzle => {
  // Initially, `puzzle` only has properties `width`, `height`, and `words`
  debugData.puzzle = puzzle;
  const {width, height} = puzzle;

  const container = d3.select('#board');
  // determine the scale (pixels per letter)
  const hScale = maxSvgWidth / width / 10;
  const vScale = maxSvgHeight / height / 10;
  const scale = puzzle.scale = Math.min(hScale, vScale);
  //console.log('scale: ', scale);

  const svg = puzzle.svg = container.append('svg').attrs({
    width: 10 * scale * width,
    height: 10 * scale * height,
  });

  const grid = puzzle.grid = range(width).map(col => 
    range(height).map(row => {
      const boxG = svg.append('g').attr(
        'transform', `scale(${scale}) translate(${10*col} ${10*row})`
      );
      const rect = boxG.append('rect').attrs({
        'id': 'box' + [col, row].join('.'),
        x: 0, y: 0,
        width: 10, height: 10,
        'stroke-width': '1px',
        'stroke': '#888',
        fill: '#DDD',
      });
      const ltrElem = boxG.append('text').attrs({
        'class': 'square',
        x: 5, y: 6,
        'font-family': 'courier',
        'font-size': `10px`,
        'font-weight': 'bold',
        'text-anchor': 'middle',
        'alignment-baseline': 'middle',
      });
      ltrElem.text('');
      return {
        col, row,
        boxG,
        rect,
        letter: null,
        ltrElem,
      };
    })
  );


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

  // check whether or not a grid square is valid and empty, or has the
  // given letter
  const squareGood = (col, row, ltr) => {
    if (col < 0 || col >= puzzle.width ||
      row < 0 || row >= puzzle.height) return false;
    const gridLtr = puzzle.grid[col][row].letter;
    return gridLtr === null || gridLtr === ltr;
  };

  // check whether or not the given word fits into the grid
  // starting at the given coord. This returns an object of two values:
  // - fits: `true` or `false`
  // - upper: one higher than the last fitting letter
  const textFits = (text, col, row, dir) => {
    const [dCol, dRow] = directions[dir];
    const firstBad = text.split('').findIndex((ltr, n) => {
      const c = col + n * dCol,
            r = row + n * dRow;
      return !squareGood(c, r, ltr);
    });
    return {
      fits: firstBad === -1,
      upper: firstBad === -1 ? text.length : firstBad,
    };
  };
  debugData.textFits = textFits;

  const wordListDiv = d3.select('#words');
  const wordList = puzzle.wordList = puzzle.words.map((text, n) => {
    const span = wordListDiv.append('span')
      .attrs({
        id: `word${n}`,
        'class': 'word',
      })
      .styles({
        'color': '#777',
      })
      .text(text);
    wordListDiv.append('br');
    return {
      n,
      text,
      span,
      col: null, row: null, dir: null,
      get isPlaced() { return this.col !== null; }
    };
  });


  const placingData = debugData.placingData = {
    word: null,
    placed: false,
    dir: 0,
  };

  // Sets the current word to be placed. This undoes any current placing,
  // but does not place the new word yet.
  const setWord = w => {
    const word = placingData.word;
    if (w === word) return;
    if (word !== null) word.span.node().classList.remove('placing');
    unplace();
    placingData.word = w;
    w.span.node().classList.add('placing');
  };

  // vvv  these do not check placing state
  const square = n => {
    const {col, row, dir} = placingData,
          [dCol, dRow] = directions[dir],
          c = col + n * dCol,
          r = row + n * dRow;
    return grid[c][r];
  };
  const squares = () => range(placingData.upper).map(square);
  // ^^^

  const unplace = () => {
    if (!placingData.placed) return;
    squares().forEach(sq => {
      sq.letter = null;
      sq.ltrElem.text('');
    });
    placingData.placed = false;
  };

  const fitWord = () => {
    const {word, col, row, dir} = placingData,
          text = word.text;
    Object.assign(placingData, textFits(text, col, row, dir))
  };

  place = () => {
    if (placingData.word === null) return;
    fitWord();
    const fits = placingData.fits;
    squares().forEach((sq, n) => {
      const ltr = placingData.word.text.charAt(n);
      sq.letter = ltr;
      sq.ltrElem
        .styles({
          fill: fits ? '#888' : '#AAA',
          stroke: fits ? 'black' : 'none',
          'stroke-width': fits ? '0.3px' : '0',
        })
        .text(ltr);
    });
    placingData.placed = true;
  };
  
  // This handles changes to col, row, and dir:
  const replace = props => {
    if (placingData.placed && subsetMatch(props, placingData)) return;
    unplace();
    Object.assign(placingData, props);
    place();
  };

  const setCoord = (c, r) => {
    replace({col: c, row: r});
  };

  const setDir = d => {
    replace({dir: d});
  };


  wordList.forEach(word => {
    word.span.node().addEventListener('click', evt => {
      setWord(word);
    });
  })
  setWord(wordList[0]);

  const mouseMoveHandler = evt => {
    if (placingData.word === null) return;
    const boxId = evt.target.getAttribute('id');  // e.g. 'box4.7'
    const [c, r] = boxId.substr(3).split('.').map(toInt);
    setCoord(c, r);
  };


  let wheelReady = true;   // throttle
  document.onwheel = evt => {
    if (!wheelReady) return;
    evt.preventDefault();
    const upDown = -Math.sign(evt.deltaY);
    //console.log(`mouse wheel ${upDown === 1 ? 'up' : 'down'} event`);
    const dir = (placingData.dir + upDown + 8) % 8;
    setDir(dir);
    wheelReady = false;
    setTimeout(() => wheelReady = true, 150);
  };

  const gridClickHandler = evt => {
    console.log('gridClickHandler');
    if (!placingData.placed || !placingData.fits) return;
    squares().forEach((sq, n) => {
      const ltr = placingData.word.text.charAt(n);
      sq.ltrElem.style('fill', 'black');
    });
    placingData.word = null;
    placingData.placed = false;
  };

  grid.forEach(row => row.forEach(square => {
    square.rect.node().addEventListener('mousemove', mouseMoveHandler);
    square.rect.node().addEventListener('click', gridClickHandler);
  }));


/*


const gridClickHandler = evt => {
  if (puzzle.state !== 'placing') return;
  const pld = puzzle.placingData;
  if (!wordFits(pld)) return;
  
}



  const wordList = d3.select(e.wordList);
  puzzle.wordData = puzzle.words.map((word, wordNum) => {
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
    const initPlacingData = () => {
      return {
        wordData,
        direction: 0,
        curElem: null,
        wheelPrimed: true,
      };
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
*/
};



/*
wizard().then(puzzle => {
});
*/

const skipWiz = () => {
  d3.select('#wizard').style('display', 'none');
  d3.select('#puzzle').style('display', 'block');
  makeSearch({
    words: ['abc', 'bed', 'cappy'],
    width: 5,
    height: 5,
  })
};
skipWiz();


