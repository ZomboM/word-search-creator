const range = n => Array(n).fill(0).map((z, i) => i);
const toInt = str => parseInt(str, 10);


const propMatch = (a, b) => prop =>
  (prop in a) && (prop in b) && a[prop] === b[prop];

// returns true if all of the properties of `a` equal the
// corresponding properties of `b`
const subsetMatch = (a, b) =>
  Object.keys(a).map(propMatch(a, b)).every(Boolean);

const addClass = (elem, cls) => elem.node().classList.add(cls);
const removeClass = (elem, cls) => {
  console.log('removeClass, elem: ', elem.node());
  elem.node().classList.remove(cls);
};
