# Notes

## Main data objects

```
e - references by id to DOM elements
```

```
puzzle
  .state - {wizard|waiting|placing}
  .board - describes the search board:
    .width - Number of columns in the puzzle
    .height - Number of rows
    .squares - array of arrays of objects, each having
      data about a square in the board:
      .c - coordinates (x, y) of this square
      .ltrData - reference to the ltrData object described 
        below, for the letter currently in grid square; or
        null if empty
      .rect - SVG rect element
    .inBounds(c) - returns true if coord c is in-bounds
    .squareEmpty(c) - true if c is in bounds and the
      corresponding square is empty
    .getSquare(c) - gets the square object at the coord;
      doesn't do range-checking
  .scale - pixels per square
  .fontSize - font size for the letters in the boxen
  .offset - offset (both x and y) for letters in the boxen

  .wordData - array of objects describing each word:
    .word - the word itself
    .span - the HTML element in the word list
    .ltrData - array of objects with data for each letter:
      .parent - the wordData object this belongs to
      .ltr - the actual letter
      .ltrNum - the letter number
      .textElem - the SVG text element
      .square - reference to the square object described
        above; or null, if this hasn't been placed

  .placingData - only valid when state == 'placing':
    .wordData - reference to the object described above, 
      for the specific word being placed
    .direction
    .square - the square in the grid that's currently
      pointed to by the mouse; this will have the first 
      letter of the word
    .wheelPrimed - used for throttling mouse wheel events
```



