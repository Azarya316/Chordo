// Bibliothèque d'accords de guitare (accordage standard EADGBe).
// positions: une case par corde, de la plus grave (Mi grave) à la plus aiguë (Mi aigu).
//   -1 = corde non jouée (x), 0 = corde à vide, n = case n.
// fingers: doigt utilisé par corde (0 = aucun), à titre indicatif.
// baseFret: première case affichée sur le diagramme.

const CHORDS = [
  {
    name: 'C',
    label: 'Do majeur',
    positions: [-1, 3, 2, 0, 1, 0],
    fingers: [0, 3, 2, 0, 1, 0],
    baseFret: 1,
  },
  {
    name: 'D',
    label: 'Ré majeur',
    positions: [-1, -1, 0, 2, 3, 2],
    fingers: [0, 0, 0, 1, 3, 2],
    baseFret: 1,
  },
  {
    name: 'E',
    label: 'Mi majeur',
    positions: [0, 2, 2, 1, 0, 0],
    fingers: [0, 2, 3, 1, 0, 0],
    baseFret: 1,
  },
  {
    name: 'G',
    label: 'Sol majeur',
    positions: [3, 2, 0, 0, 0, 3],
    fingers: [2, 1, 0, 0, 0, 3],
    baseFret: 1,
  },
  {
    name: 'A',
    label: 'La majeur',
    positions: [-1, 0, 2, 2, 2, 0],
    fingers: [0, 0, 1, 2, 3, 0],
    baseFret: 1,
  },
  {
    name: 'Am',
    label: 'La mineur',
    positions: [-1, 0, 2, 2, 1, 0],
    fingers: [0, 0, 2, 3, 1, 0],
    baseFret: 1,
  },
  {
    name: 'Em',
    label: 'Mi mineur',
    positions: [0, 2, 2, 0, 0, 0],
    fingers: [0, 2, 3, 0, 0, 0],
    baseFret: 1,
  },
  {
    name: 'Dm',
    label: 'Ré mineur',
    positions: [-1, -1, 0, 2, 3, 1],
    fingers: [0, 0, 0, 2, 3, 1],
    baseFret: 1,
  },
  {
    name: 'F',
    label: 'Fa majeur (barré)',
    positions: [1, 3, 3, 2, 1, 1],
    fingers: [1, 3, 4, 2, 1, 1],
    baseFret: 1,
  },
  {
    name: 'G7',
    label: 'Sol septième',
    positions: [3, 2, 0, 0, 0, 1],
    fingers: [3, 2, 0, 0, 0, 1],
    baseFret: 1,
  },
  {
    name: 'C7',
    label: 'Do septième',
    positions: [-1, 3, 2, 3, 1, 0],
    fingers: [0, 3, 2, 4, 1, 0],
    baseFret: 1,
  },
  {
    name: 'D7',
    label: 'Ré septième',
    positions: [-1, -1, 0, 2, 1, 2],
    fingers: [0, 0, 0, 2, 1, 3],
    baseFret: 1,
  },
  {
    name: 'A7',
    label: 'La septième',
    positions: [-1, 0, 2, 0, 2, 0],
    fingers: [0, 0, 2, 0, 3, 0],
    baseFret: 1,
  },
  {
    name: 'E7',
    label: 'Mi septième',
    positions: [0, 2, 0, 1, 0, 0],
    fingers: [0, 2, 0, 1, 0, 0],
    baseFret: 1,
  },
  {
    name: 'Cadd9',
    label: 'Do add9',
    positions: [-1, 3, 2, 0, 3, 3],
    fingers: [0, 2, 1, 0, 3, 4],
    baseFret: 1,
  },
  {
    name: 'Gsus4',
    label: 'Sol sus4',
    positions: [3, 3, 0, 0, 1, 3],
    fingers: [2, 3, 0, 0, 1, 4],
    baseFret: 1,
  },
];

// Notes des cordes à vide (Hz), du Mi grave au Mi aigu.
const STRING_TUNING = [
  { note: 'E2', freq: 82.41 },
  { note: 'A2', freq: 110.0 },
  { note: 'D3', freq: 146.83 },
  { note: 'G3', freq: 196.0 },
  { note: 'B3', freq: 246.94 },
  { note: 'E4', freq: 329.63 },
];

module.exports = { CHORDS, STRING_TUNING };
