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
        { id: 'iv-invert', title: 'Interval inversion', engine: 'invertInterval', intervals: ['m2', 'M2', 'm3', 'M3', 'P4', 'A4', 'P5', 'm6', 'M6', 'm7', 'M7', 'd5'] },
        { id: 'ear-iv-compound', title: 'Hear compound intervals (9ths\u201313ths)', engine: 'earInterval', intervals: ['m9', 'M9', 'm10', 'M10', 'P11', 'P12', 'm13', 'M13'], dirs: ['up', 'harmonic'] },
        { id: 'read-iv-compound', title: 'Read compound intervals', engine: 'readInterval', intervals: ['m9', 'M9', 'm10', 'M10', 'P11', 'A11', 'P12', 'm13', 'M13'], clefs: ['treble', 'bass'] },
      ],
    },
    {
      id: 'u-chords', title: 'Chords', blurb: 'Triads and seventh chords by ear, on the staff, and sung as arpeggios.',
      lessons: [
        { id: 'ch-ear-mm', title: 'Hear major vs. minor triads', engine: 'earChord', types: ['maj', 'min'] },
        { id: 'ch-ear-tri', title: 'Hear all four triads', engine: 'earChord', types: ['maj', 'min', 'dim', 'aug'] },
        { id: 'ch-read-tri', title: 'Read triad qualities', engine: 'readChord', types: ['maj', 'min', 'dim', 'aug'], clefs: ['treble', 'bass'] },
        { id: 'ch-sing-tri', title: 'Sing I, IV, V and vi', engine: 'singChord', keys: { mode: 'major', max: 3 }, clefs: ['treble', 'bass'], chords: ['I', 'IV', 'V', 'vi', 'ii'] },
        { id: 'ch-ear-inv', title: 'Hear triad inversions', engine: 'earChord', types: ['maj', 'min'], askInversion: true },
        { id: 'ch-read-inv', title: 'Read triads with inversions', engine: 'readChord', types: ['maj', 'min', 'dim'], inversions: true, clefs: ['treble', 'bass'] },
        { id: 'ch-ear-7', title: 'Hear seventh chords', engine: 'earChord', types: ['dom7', 'maj7', 'min7', 'hdim7', 'dim7'] },
        { id: 'ch-read-7', title: 'Read seventh chords', engine: 'readChord', types: ['dom7', 'maj7', 'min7', 'hdim7', 'dim7'], clefs: ['treble', 'bass'] },
        { id: 'ch-read-7-inv', title: 'Read sevenths with inversions', engine: 'readChord', types: ['dom7', 'min7', 'hdim7'], inversions: true, clefs: ['treble', 'bass'] },
        { id: 'ch-sing-7', title: 'Sing seventh-chord arpeggios', engine: 'singChord', keys: { mode: 'major', max: 4 }, clefs: ['treble', 'bass'], chords: ['V7', 'ii7', 'IV7', 'vii7', 'I7'] },
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
      id: 'u-harmony', title: 'Harmony & Cadences', blurb: 'Roman numerals, cadences, and writing down the chords you hear.',
      lessons: [
        { id: 'rn-read', title: 'Roman numerals: diatonic triads', engine: 'readNumeral', keys: { mode: 'major', max: 4 }, clefs: ['treble', 'bass'], chords: ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii\u00B0'] },
        { id: 'rn-read-inv', title: 'Roman numerals with inversions', engine: 'readNumeral', keys: { mode: 'major', max: 4 }, clefs: ['treble', 'bass'], chords: ['I', 'I6', 'I6/4', 'ii', 'ii6', 'IV', 'IV6', 'V', 'V6', 'V6/4', 'vi', 'vii\u00B06'] },
        { id: 'rn-read-7', title: 'Roman numerals: V7 and its inversions', engine: 'readNumeral', keys: { mode: 'major', max: 4 }, clefs: ['treble', 'bass'], chords: ['V7', 'V6/5', 'V4/3', 'V4/2', 'ii7', 'ii6/5'] },
        { id: 'rn-read-min', title: 'Roman numerals in minor', engine: 'readNumeral', keys: { mode: 'minor', max: 4 }, clefs: ['treble', 'bass'], chords: ['I', 'ii\u00B06', 'III', 'IV', 'V', 'V7', 'VI', 'vii\u00B0'] },
        { id: 'cad-ear-1', title: 'Hear cadences: authentic, half, plagal, deceptive', engine: 'earCadence', keys: { mode: 'major', max: 4 }, cadences: ['PAC', 'HC', 'PC', 'DC'] },
        { id: 'cad-ear-2', title: 'Perfect vs. imperfect authentic', engine: 'earCadence', keys: { mode: 'major', max: 4 }, cadences: ['PAC', 'IAC', 'HC', 'PC', 'DC'] },
        { id: 'cad-ear-min', title: 'Cadences in minor', engine: 'earCadence', keys: { mode: 'minor', max: 4 }, cadences: ['PAC', 'IAC', 'HC', 'PC', 'DC'] },
        { id: 'dict-1', title: 'Dictation: I, IV, V', engine: 'dictation', keys: { mode: 'major', max: 3 }, chords: ['I', 'IV', 'V'], length: 4 },
        { id: 'dict-2', title: 'Dictation: adding ii, vi and V7', engine: 'dictation', keys: { mode: 'major', max: 4 }, chords: ['I', 'ii', 'IV', 'V', 'V7', 'vi'], length: [4, 5] },
        { id: 'dict-3', title: 'Dictation with inversions', engine: 'dictation', keys: { mode: 'major', max: 4 }, chords: ['I', 'I6', 'ii6', 'IV', 'IV6', 'V', 'V6', 'V7', 'V6/5', 'V4/3', 'vi', 'I6/4', 'vii\u00B06'], length: [5, 6] },
        { id: 'dict-min', title: 'Dictation in minor', engine: 'dictation', keys: { mode: 'minor', max: 4 }, chords: ['I', 'ii6', 'IV', 'V', 'V7', 'vi', 'V6/5'], length: [4, 6] },
      ],
    },
    {
      id: 'u-chromatic-harmony', title: 'Secondary Dominants & Modulation', blurb: 'Borrowed dominants, tonicization, and changing key: re-solmize at the pivot.',
      lessons: [
        { id: 'sec-read', title: 'Read secondary dominants', engine: 'readNumeral', keys: { mode: 'major', max: 4 }, clefs: ['treble', 'bass'],
          chords: ['V', 'V7', 'V/V', 'V7/V', 'V/vi', 'V7/vi', 'V7/IV', 'V/ii', 'V7/ii'] },
        { id: 'sec-dict', title: 'Dictation with V/V and V7/IV', engine: 'dictation', keys: { mode: 'major', max: 3 }, chords: ['I', 'ii', 'IV', 'V', 'V7', 'vi', 'V/V', 'V7/V', 'V7/IV'], length: [5, 6] },
        { id: 'sec-dict-2', title: 'Dictation: all secondary dominants', engine: 'dictation', keys: { mode: 'major', max: 4 }, chords: ['I', 'ii', 'IV', 'V', 'V7', 'vi', 'V/V', 'V7/V', 'V7/IV', 'V/vi', 'V7/vi', 'V/ii', 'V7/ii'], length: [5, 6] },
        { id: 'sec-ss', title: 'Sing tonicizations (fi\u2013sol, te\u2013la)', engine: 'sightSing', keys: { mode: 'major', max: 3 }, clefs: ['treble', 'bass'], degrees: ['1', '2', '3', '4', '5', '6', '7', '8'], chromatic: true, length: 6 },
        { id: 'mod-ear', title: 'Hear modulations: V, IV, relative minor', engine: 'earModulation', keys: { mode: 'major', max: 4 }, targets: ['V', 'IV', 'vi', 'none'] },
        { id: 'mod-ss-V', title: 'Sight-sing: modulate to the dominant', engine: 'sightSingMod', keys: { mode: 'major', max: 3 }, clefs: ['treble', 'bass'], degrees: ['1', '2', '3', '4', '5', '6', '7', '8'], targets: ['V'] },
        { id: 'mod-ss-all', title: 'Sight-sing: V, IV or relative minor', engine: 'sightSingMod', keys: { mode: 'major', max: 4 }, clefs: ['treble', 'bass'], degrees: ['1', '2', '3', '4', '5', '6', '7', '8'], targets: ['V', 'IV', 'vi'], leaps: true },
      ],
    },
    {
      id: 'u-modes', title: 'Modes', blurb: 'The church modes: their colors, signatures and syllables.',
      lessons: [
        { id: 'mode-meet', title: 'Meet the modes', engine: 'exploreScale', tonic: 'C4', scales: ['ionian', 'dorian', 'phrygian', 'lydian', 'mixolydian', 'aeolian', 'locrian'],
          blurbs: { ionian: 'The major scale', dorian: 'Minor with a raised 6th', phrygian: 'Minor with a lowered 2nd', lydian: 'Major with a raised 4th',
            mixolydian: 'Major with a lowered 7th', aeolian: 'Natural minor', locrian: 'Lowered 2nd and 5th: a diminished tonic' } },
        { id: 'mode-syl', title: 'Modal syllables', engine: 'explore', keys: { list: ['D dorian', 'E phrygian', 'F lydian', 'G mixolydian', 'B locrian'] }, clefs: ['treble'], degrees: ['1', '2', '3', '4', '5', '6', '7', '8'] },
        { id: 'mode-final', title: 'Name the mode from signature + final', engine: 'modeFinal', modes: ['ionian', 'dorian', 'phrygian', 'lydian', 'mixolydian', 'aeolian', 'locrian'], max: 3, clefs: ['treble', 'bass'] },
        { id: 'mode-ear-1', title: 'Hear the modes: Dorian & Mixolydian', engine: 'earScale', scales: ['ionian', 'dorian', 'mixolydian', 'aeolian'], descending: true },
        { id: 'mode-ear-2', title: 'Hear all seven modes', engine: 'earScale', scales: ['ionian', 'dorian', 'phrygian', 'lydian', 'mixolydian', 'aeolian', 'locrian'], descending: true },
        { id: 'mode-read', title: 'Read modal syllables', engine: 'readSyllable', keys: { modes: ['dorian', 'phrygian', 'lydian', 'mixolydian'], max: 3 }, clefs: ['treble', 'bass'], degrees: ['1', '2', '3', '4', '5', '6', '7', '8'] },
        { id: 'mode-sing', title: 'Sing the modes', engine: 'singScale', scales: ['dorian', 'phrygian', 'lydian', 'mixolydian'], clefs: ['treble', 'bass'] },
        { id: 'mode-ss', title: 'Sight-sing modal melodies', engine: 'sightSing', keys: { modes: ['dorian', 'mixolydian', 'phrygian', 'lydian'], max: 3 }, clefs: ['treble', 'bass'], degrees: ['1', '2', '3', '4', '5', '6', '7', '8'], leaps: true, length: 6 },
      ],
    },
    {
      id: 'u-scales', title: 'Beyond Major & Minor', blurb: 'Pentatonic, blues, whole-tone, octatonic, and the three minors.',
      lessons: [
        { id: 'sc-meet', title: 'Meet the scales', engine: 'exploreScale', tonic: 'C4',
          scales: ['major pentatonic', 'minor pentatonic', 'blues', 'whole tone', 'octatonic (H-W)', 'octatonic (W-H)', 'harmonic minor', 'melodic minor'],
          blurbs: { 'major pentatonic': 'Do re mi sol la: no half steps', 'minor pentatonic': 'La do re mi sol', blues: 'Minor pentatonic plus the flat 5',
            'whole tone': 'Only whole steps: six notes, no tonic pull', 'octatonic (H-W)': 'Alternating half and whole steps: eight notes',
            'octatonic (W-H)': 'Alternating whole and half steps', 'harmonic minor': 'Natural minor with a raised 7th', 'melodic minor': 'Raised 6th and 7th going up' } },
        { id: 'sc-ear-min', title: 'Hear the three minors', engine: 'earScale', scales: ['major', 'minor', 'harmonic minor', 'melodic minor'] },
        { id: 'sc-ear', title: 'Hear pentatonic, blues, whole-tone, octatonic', engine: 'earScale', scales: ['major pentatonic', 'minor pentatonic', 'blues', 'whole tone', 'octatonic (H-W)'] },
        { id: 'sc-read', title: 'Read scales', engine: 'readScale', scales: ['major', 'minor', 'harmonic minor', 'melodic minor', 'major pentatonic', 'minor pentatonic', 'blues', 'whole tone', 'octatonic (H-W)'], clefs: ['treble', 'bass'] },
        { id: 'sc-sing', title: 'Sing pentatonic, blues and whole-tone', engine: 'singScale', scales: ['major pentatonic', 'minor pentatonic', 'blues', 'whole tone'], clefs: ['treble', 'bass'] },
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
