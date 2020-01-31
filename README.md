# Notes

## Main data objects

```
e - references by id to DOM elements
```

```
puzzle
  .state - {wizard|waiting|placing}
  .board - SVG rect element covering the search board
  .width - Number of columns in the puzzle
  .height - Number of rows
  .scale - pixels per letter box
  .fontSize - font size for the letters in the boxen
  .offset - offset (both x and y) for letters in the boxen
  
  .wordData - array of objects describing each word:
    .word - the word itself
    .span - the HTML element in the word list
    .ltrData - array of objects with data for each letter:
      .parent - the wordData object this belongs to
      .ltr - the actual letter
      .textElem - the SVG text element
      .x - x-position in the search board, or null
      .y - y-position in the search board, or null

  .grid - Array of arrays of objects, representing squares
    in the search board:
    .ltrData - reference to the ltrData object described 
      above, for the letter in this grid square; or null 
      if empty
    .rect - SVG rect element

  .placingData - only valid when state == 'placing':
    .wordData - reference to the object described above, 
      for the specific word being placed
    .curSquare - the square in the grid that's currently
      pointed to by the mouse
```



