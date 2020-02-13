# Notes

## Main data objects

```
e - references by id to DOM elements
```

```
params
  .words - array of words to search for
  .width - Number of columns in the puzzle
  .height - Number of rows
```

```
puzzle
  .state - {wizard|waiting|placing}
  .board - SVG rect element covering the search board
  .scale - pixels per letter box
  .fontSize - font size for the letters in the boxen
  .offset - offset (both x and y) for letters in the boxen
  .wordData - array of objects describing words to search for:
    .word - the word itself
    .span - the HTML element in the word list
    .ltrElems - array of SVG text elements, one for each letter

  .grid - Array of arrays of objects:
    .letter - letter in this grid square or null if empty
    .rect - SVG rect element
  .placingData - only valid when state == 'placing':
    .wordData - reference to the object described above, for
      the specific word being placed
    .
```



