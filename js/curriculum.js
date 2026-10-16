// The course: units of lessons, each run by a generic exercise engine.
//
// Common lesson params:
//   keys:    { mode: 'major' | 'minor' | 'any', max: N } (keys with up to N
//            sharps/flats) or { list: ['C', 'G'], mode }
//   clefs:   which clefs to draw in
//   degrees: scale degrees relative to the tonic. '1'..'7', '8' (octave up);
//            '+' / '-' raise or lower against the key signature
//            ('+7' in minor = leading tone, '+4' in major = fi).
//   labels:  show syllables under the notes
(function (root) {
  'use strict';

  var MAJOR = ['1', '2', '3', '4', '5', '6', '7', '8'];
  var MINOR_NAT = ['1', '2', '3', '4', '5', '6', '7', '8'];
  var MINOR_ALL = ['1', '2', '3', '4', '5', '6', '+6', '7', '+7', '8'];
  var CHROM_UP = ['1', '+1', '2', '+2', '3', '4', '+4', '5', '+5', '6', '+6', '7', '8'];
  var CHROM_DOWN = ['8', '7', '-7', '6', '-6', '5', '-5', '4', '3', '-3', '2', '-2', '1'];
  var CHROMATIC = ['1', '+1', '-2', '2', '+2', '-3', '3', '4', '+4', '-5', '5', '+5', '-6', '6', '+6', '-7', '7'];

  var EAR_1 = ['m2', 'M2', 'm3', 'M3'];
  var EAR_2 = EAR_1.concat(['P4', 'P5', 'P8']);
  var EAR_3 = EAR_2.concat(['m6', 'M6', 'm7', 'M7']);
  var EAR_ALL = EAR_3.concat(['TT']);
  var SPELLED_1 = ['m2', 'M2', 'm3', 'M3', 'P4', 'P5', 'm6', 'M6', 'm7', 'M7', 'P8'];
  var SPELLED_ALL = SPELLED_1.concat(['A4', 'd5', 'A2', 'd7', 'A5', 'd4', 'A6', 'd3']);

  var UNITS = [
    {
      id: 'u1', title: 'Foundations', blurb: 'Do, mi, sol and the major scale in C, treble clef.',
      lessons: [
        { id: 'dms-meet', title: 'Meet do, mi, sol', engine: 'explore', keys: { list: ['C'] }, clefs: ['treble'], degrees: ['1', '3', '5', '8'] },
        { id: 'dms-read', title: 'Read do, mi, sol', engine: 'readSyllable', keys: { list: ['C'] }, clefs: ['treble'], degrees: ['1', '3', '5', '8'] },
        { id: 'dms-sing', title: 'Sing do, mi, sol', engine: 'sing', keys: { list: ['C'] }, clefs: ['treble'], degrees: ['1', '3', '5', '8'], labels: true },
        { id: 'dms-echo', title: 'Echo do-mi-sol patterns', engine: 'echo', keys: { list: ['C'] }, clefs: ['treble'], degrees: ['1', '3', '5', '8'], length: 3, leaps: true },
        { id: 'maj-meet', title: 'The major scale', engine: 'explore', keys: { list: ['C'] }, clefs: ['treble'], degrees: MAJOR },
        { id: 'maj-read', title: 'Read the major scale', engine: 'readSyllable', keys: { list: ['C'] }, clefs: ['treble'], degrees: MAJOR },
        { id: 'maj-sing', title: 'Sing scale degrees', engine: 'sing', keys: { list: ['C'] }, clefs: ['treble'], degrees: MAJOR },
        { id: 'maj-ear', title: 'Hear scale degrees', engine: 'earSyllable', keys: { list: ['C'] }, clefs: ['treble'], degrees: MAJOR },
        { id: 'maj-echo', title: 'Echo stepwise melodies', engine: 'echo', keys: { list: ['C'] }, clefs: ['treble'], degrees: MAJOR, length: 4 },
      ],
    },
    {
      id: 'u2', title: 'Keys & the Bass Clef', blurb: 'Movable do in every major key, in treble and bass clef.',
      lessons: [
        { id: 'ks-maj-4', title: 'Major key signatures (up to 4 ♯/♭)', engine: 'keySig', keys: { mode: 'major', max: 4 }, clefs: ['treble'] },
        { id: 'keys-read', title: 'Movable do in G, D, F, B♭', engine: 'readSyllable', keys: { list: ['G', 'D', 'F', 'Bb'] }, clefs: ['treble'], degrees: MAJOR },
        { id: 'bass-names', title: 'Bass clef note names', engine: 'readLetter', keys: { list: ['C'] }, clefs: ['bass'] },
        { id: 'bass-read', title: 'Movable do in bass clef', engine: 'readSyllable', keys: { mode: 'major', max: 3 }, clefs: ['bass'], degrees: MAJOR },
        { id: 'keys-sing', title: 'Sing in new keys', engine: 'sing', keys: { mode: 'major', max: 4 }, clefs: ['treble', 'bass'], degrees: MAJOR },
        { id: 'ks-maj-all', title: 'All 15 major key signatures', engine: 'keySig', keys: { mode: 'major', max: 7 }, clefs: ['treble', 'bass'] },
        { id: 'keys-ear', title: 'Hear degrees in any key', engine: 'earSyllable', keys: { mode: 'major', max: 7 }, clefs: ['treble', 'bass'], degrees: MAJOR },
        { id: 'ss-maj-step', title: 'Sight-sing: stepwise major', engine: 'sightSing', keys: { mode: 'major', max: 3 }, clefs: ['treble', 'bass'], degrees: MAJOR, length: 5 },
      ],
    },
    {
      id: 'u3', title: 'Intervals', blurb: 'Hear, read and sing every interval up to the octave.',
      lessons: [
        { id: 'ear-iv-1', title: 'Hear 2nds and 3rds', engine: 'earInterval', intervals: EAR_1, dirs: ['up'] },
        { id: 'ear-iv-2', title: 'Hear 4ths, 5ths, octaves', engine: 'earInterval', intervals: EAR_2, dirs: ['up'] },
        { id: 'ear-iv-3', title: 'Hear 6ths and 7ths', engine: 'earInterval', intervals: EAR_3, dirs: ['up'] },
        { id: 'ear-iv-4', title: 'All intervals, up and down', engine: 'earInterval', intervals: EAR_ALL, dirs: ['up', 'down'] },
        { id: 'ear-iv-5', title: 'Harmonic intervals', engine: 'earInterval', intervals: EAR_ALL, dirs: ['harmonic'] },
        { id: 'read-iv-1', title: 'Read intervals: P, M, m', engine: 'readInterval', intervals: SPELLED_1, clefs: ['treble', 'bass'] },
        { id: 'read-iv-2', title: 'Read augmented & diminished', engine: 'readInterval', intervals: SPELLED_ALL, clefs: ['treble', 'bass'] },
        { id: 'sing-iv-1', title: 'Sing intervals up: m2 to P5', engine: 'singInterval', intervals: ['m2', 'M2', 'm3', 'M3', 'P4', 'P5'], dirs: ['up'], clefs: ['treble', 'bass'] },
        { id: 'sing-iv-2', title: 'Sing intervals up & down', engine: 'singInterval', intervals: ['m2', 'M2', 'm3', 'M3', 'P4', 'P5', 'm6', 'M6', 'P8'], dirs: ['up', 'down'], clefs: ['treble', 'bass'] },
        { id: 'sing-iv-3', title: 'Sing 7ths and the tritone', engine: 'singInterval', intervals: ['m7', 'M7', 'A4', 'd5', 'm6', 'M6'], dirs: ['up', 'down'], clefs: ['treble', 'bass'] },
      ],
    },
    {
      id: 'u4', title: 'Minor', blurb: 'Natural, harmonic and melodic minor. Change do- or la-based minor in Settings.',
      lessons: [
        { id: 'min-meet', title: 'Natural minor', engine: 'explore', keys: { list: ['A', 'C', 'D', 'E'], mode: 'minor' }, clefs: ['treble'], degrees: MINOR_NAT },
        { id: 'ks-min', title: 'Minor key signatures', engine: 'keySig', keys: { mode: 'minor', max: 7 }, clefs: ['treble', 'bass'] },
        { id: 'min-read', title: 'Read in minor', engine: 'readSyllable', keys: { mode: 'minor', max: 3 }, clefs: ['treble', 'bass'], degrees: MINOR_NAT },
        { id: 'min-hm', title: 'Harmonic & melodic minor', engine: 'explore', keys: { list: ['A', 'C', 'D', 'E', 'G'], mode: 'minor' }, clefs: ['treble'], degrees: MINOR_ALL },
        { id: 'min-read-2', title: 'Read raised 6th and 7th', engine: 'readSyllable', keys: { mode: 'minor', max: 4 }, clefs: ['treble', 'bass'], degrees: MINOR_ALL },
        { id: 'min-sing', title: 'Sing in minor', engine: 'sing', keys: { mode: 'minor', max: 4 }, clefs: ['treble', 'bass'], degrees: MINOR_ALL },
        { id: 'min-ear', title: 'Hear degrees in minor', engine: 'earSyllable', keys: { mode: 'minor', max: 7 }, clefs: ['treble', 'bass'], degrees: MINOR_ALL },
        { id: 'min-echo', title: 'Echo minor melodies', engine: 'echo', keys: { mode: 'minor', max: 3 }, clefs: ['treble', 'bass'], degrees: MINOR_ALL, length: 5 },
      ],
    },
    {
      id: 'u5', title: 'Chromatic Solfège', blurb: 'Di ri fi si li going up; ra me se le te coming down.',
      lessons: [
        { id: 'chr-up', title: 'Raised: di, ri, fi, si, li', engine: 'explore', keys: { list: ['C', 'G', 'F'] }, clefs: ['treble'], degrees: CHROM_UP },
        { id: 'chr-down', title: 'Lowered: te, le, se, me, ra', engine: 'explore', keys: { list: ['C', 'G', 'F'] }, clefs: ['treble'], degrees: CHROM_DOWN },
        { id: 'chr-read', title: 'Read chromatic syllables', engine: 'readSyllable', keys: { mode: 'major', max: 3 }, clefs: ['treble', 'bass'], degrees: CHROMATIC },
        { id: 'chr-ear', title: 'Hear chromatic degrees', engine: 'earSyllable', keys: { mode: 'major', max: 4 }, clefs: ['treble', 'bass'], degrees: CHROMATIC },
        { id: 'chr-sing', title: 'Sing chromatic degrees', engine: 'sing', keys: { mode: 'major', max: 3 }, clefs: ['treble', 'bass'], degrees: CHROMATIC },
        { id: 'chr-ss', title: 'Sight-sing chromatic neighbors', engine: 'sightSing', keys: { mode: 'major', max: 3 }, clefs: ['treble', 'bass'], degrees: MAJOR, chromatic: true, length: 6 },
      ],
    },
    {
      id: 'u6', title: 'C Clefs', blurb: 'Alto and tenor clef, the clefs of violas, cellos, bassoons and trombones.',
      lessons: [
        { id: 'alto-names', title: 'Alto clef note names', engine: 'readLetter', keys: { list: ['C'] }, clefs: ['alto'] },
        { id: 'tenor-names', title: 'Tenor clef note names', engine: 'readLetter', keys: { list: ['C'] }, clefs: ['tenor'] },
        { id: 'c-read', title: 'Movable do in C clefs', engine: 'readSyllable', keys: { mode: 'major', max: 4 }, clefs: ['alto', 'tenor'], degrees: MAJOR },
        { id: 'ks-c', title: 'Key signatures in all four clefs', engine: 'keySig', keys: { mode: 'major', max: 7 }, clefs: ['treble', 'bass', 'alto', 'tenor'] },
        { id: 'all-names', title: 'Note names in any clef', engine: 'readLetter', keys: { mode: 'major', max: 7 }, clefs: ['treble', 'bass', 'alto', 'tenor'] },
      ],
    },
    {
      id: 'u7', title: 'Sight-Singing', blurb: 'Put it all together: real melodies in any key and clef.',
      lessons: [
        { id: 'ss-maj-leap', title: 'Major melodies with leaps', engine: 'sightSing', keys: { mode: 'major', max: 5 }, clefs: ['treble', 'bass'], degrees: MAJOR, leaps: true, length: 7 },
        { id: 'ss-min', title: 'Minor melodies', engine: 'sightSing', keys: { mode: 'minor', max: 4 }, clefs: ['treble', 'bass'], degrees: MINOR_ALL, leaps: true, length: 7 },
        { id: 'ss-chr', title: 'Chromatic melodies', engine: 'sightSing', keys: { mode: 'major', max: 5 }, clefs: ['treble', 'bass'], degrees: MAJOR, chromatic: true, leaps: true, length: 8 },
        { id: 'ss-any', title: 'Any key, any clef', engine: 'sightSing', keys: { mode: 'any', max: 7 }, clefs: ['treble', 'bass', 'alto', 'tenor'], degrees: MAJOR, chromatic: true, leaps: true, length: 8 },
        { id: 'echo-any', title: 'Dictation by ear: echo anything', engine: 'echo', keys: { mode: 'any', max: 7 }, clefs: ['treble', 'bass'], degrees: MAJOR, chromatic: true, leaps: true, length: 6 },
      ],
    },
  ];

  root.Curriculum = { UNITS: UNITS };
})(this);
