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

  // Two-chord connections for the partwriting lessons.
  var PW_TRIADS = [['I', 'IV'], ['I', 'V'], ['IV', 'V'], ['V', 'I'], ['ii', 'V'], ['I', 'vi'], ['vi', 'ii'], ['IV', 'I'],
    ['V', 'vi'], ['vi', 'IV'], ['I6', 'IV'], ['ii6', 'V']];
  var PW_DOMINANT = [['V', 'I'], ['V6', 'I'], ['vii\u00B06', 'I'], ['V', 'vi'], ['V', 'I6']];
  var PW_SEVENTHS = [['V7', 'I'], ['V7', 'vi'], ['ii7', 'V'], ['V6/5', 'I'], ['V4/3', 'I'], ['V4/2', 'I6'], ['ii6/5', 'V']];
  // with 6/4 and diminished chords, for the doubling rules
  var PW_DOUBLING = PW_TRIADS.concat([['IV', 'I6/4'], ['I6/4', 'V'], ['ii6', 'I6/4'], ['vii\u00B06', 'I'], ['I', 'vii\u00B06'], ['V', 'I'], ['ii6', 'V']]);
  // minor-key connections where le-ti and fa-ti are easy to stumble into
  var PW_LINES = [['I', 'IV'], ['I', 'V'], ['IV', 'V'], ['V', 'I'], ['VI', 'V'], ['VI', 'IV'], ['I', 'VI'], ['V', 'VI'], ['IV', 'I'], ['ii\u00B06', 'V']];
  // grouped by root relationship (Connecting Chords I and II)
  var PW_FIFTHS = [['I', 'IV'], ['I', 'V'], ['IV', 'I'], ['V', 'I'], ['ii', 'V'], ['vi', 'ii'], ['iii', 'vi'], ['I', 'V6'], ['I6', 'IV'], ['ii6', 'V']];
  var PW_THIRDS = [['I', 'vi'], ['vi', 'IV'], ['IV', 'ii'], ['I', 'iii'], ['iii', 'I'], ['I6', 'vi'], ['vi', 'IV6']];
  var PW_SECONDS = [['IV', 'V'], ['V', 'vi'], ['I', 'ii'], ['vi', 'V'], ['IV6', 'V'], ['IV', 'V6']];
  var NCT_ALL = ['PT', 'NT', 'ANT', 'ET', 'APP', 'SUS', 'RET'];

  // Units follow the order of a fundamentals-to-harmony theory course;
  // section names the larger part each unit belongs to.
  var UNITS = [
    {
      id: 'u1', section: 'Fundamentals I', title: 'Foundations', blurb: 'Do, mi, sol and the major scale in C; reading treble and bass clef.',
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
        { id: 'bass-names', title: 'Bass clef note names', engine: 'readLetter', keys: { list: ['C'] }, clefs: ['bass'] },
      ],
    },
    {
      id: 'u3', section: 'Fundamentals I', title: 'Intervals', blurb: 'Hear, read and sing every interval, then inversions and compound intervals.',
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
      id: 'u-rhythm', section: 'Fundamentals I', title: 'Rhythm & Meter', blurb: 'Meter, note values, rests, ties and syncopation: tap them, hear them, then sing in time.',
      lessons: [
        { id: 'rh-tap-1', title: 'Tap quarters, halves and wholes', engine: 'tapRhythm', time: ['4/4'], level: 1, measures: 2, bpm: 80 },
        { id: 'rh-tap-2', title: 'Eighth notes and quarter rests', engine: 'tapRhythm', time: ['2/4', '3/4', '4/4'], level: 2, measures: 2, bpm: 76 },
        { id: 'rh-ear-1', title: 'Which rhythm did you hear?', engine: 'earRhythm', time: ['3/4', '4/4'], level: 2, measures: 1, bpm: 84 },
        { id: 'rh-tap-3', title: 'Dotted rhythms, ties and syncopation', engine: 'tapRhythm', time: ['2/4', '3/4', '4/4'], level: 3, measures: 2, bpm: 72 },
        { id: 'rh-tap-cut', title: 'Cut time', engine: 'tapRhythm', time: ['2/2'], level: 3, measures: 2, bpm: 60 },
        { id: 'rh-tap-68', title: 'Compound meter: 6/8 and 9/8', engine: 'tapRhythm', time: ['6/8', '9/8'], level: 2, measures: 2, bpm: 56 },
        { id: 'rh-tap-4', title: 'Sixteenth notes', engine: 'tapRhythm', time: ['2/4', '4/4'], level: 4, measures: 2, bpm: 66 },
        { id: 'rh-tap-c4', title: 'Compound sixteenths and 12/8', engine: 'tapRhythm', time: ['6/8', '12/8'], level: 4, measures: 1, bpm: 52 },
        { id: 'rh-ear-2', title: 'Rhythmic dictation: dotted, 16ths, 6/8', engine: 'earRhythm', time: ['2/4', '4/4', '6/8'], level: 4, measures: 1, bpm: 72, choices: 4 },
        { id: 'rh-sing-1', title: 'Sing in time: simple rhythms', engine: 'singRhythm', keys: { mode: 'major', max: 2 }, clefs: ['treble', 'bass'], degrees: ['1', '2', '3', '4', '5', '6', '7', '8'], time: ['4/4', '3/4'], level: 1, measures: 2, bpm: 72 },
        { id: 'rh-sing-2', title: 'Sing in time: eighths and rests', engine: 'singRhythm', keys: { mode: 'major', max: 3 }, clefs: ['treble', 'bass'], degrees: ['1', '2', '3', '4', '5', '6', '7', '8'], time: ['2/4', '3/4', '4/4'], level: 2, measures: 2, bpm: 72 },
        { id: 'rh-sing-68', title: 'Sing in time: 6/8', engine: 'singRhythm', keys: { mode: 'major', max: 3 }, clefs: ['treble', 'bass'], degrees: ['1', '2', '3', '4', '5', '6', '7', '8'], time: ['6/8'], level: 2, measures: 2, bpm: 50 },
      ],
    },
    {
      id: 'u-phrase', section: 'Fundamentals I', title: 'Melody & Phrase Structure', blurb: 'Phrases end in cadences; a weaker cadence answered by a stronger one makes a period.',
      lessons: [
        { id: 'ph-ear-cad', title: 'Hear the cadence: authentic or half', engine: 'earPhrase', keys: { mode: 'major', max: 3 }, clefs: ['treble', 'bass'] },
        { id: 'ph-read-period', title: 'Parallel, contrasting, or not a period', engine: 'readPeriod', keys: { mode: 'major', max: 3 }, clefs: ['treble', 'bass'] },
        { id: 'ph-ear-period', title: 'Hear periods', engine: 'earPeriod', keys: { mode: 'major', max: 4 }, clefs: ['treble', 'bass'] },
        { id: 'ph-sing-answer', title: 'Sing the answering phrase', engine: 'singConsequent', keys: { mode: 'major', max: 3 }, clefs: ['treble', 'bass'] },
      ],
    },
    {
      id: 'u2', section: 'Fundamentals II', title: 'Major Keys', blurb: 'All 15 major key signatures and movable do in every key.',
      lessons: [
        { id: 'ks-maj-4', title: 'Major key signatures (up to 4 ♯/♭)', engine: 'keySig', keys: { mode: 'major', max: 4 }, clefs: ['treble'] },
        { id: 'keys-read', title: 'Movable do in G, D, F, B♭', engine: 'readSyllable', keys: { list: ['G', 'D', 'F', 'Bb'] }, clefs: ['treble'], degrees: MAJOR },
        { id: 'bass-read', title: 'Movable do in bass clef', engine: 'readSyllable', keys: { mode: 'major', max: 3 }, clefs: ['bass'], degrees: MAJOR },
        { id: 'keys-sing', title: 'Sing in new keys', engine: 'sing', keys: { mode: 'major', max: 4 }, clefs: ['treble', 'bass'], degrees: MAJOR },
        { id: 'ks-maj-all', title: 'All 15 major key signatures', engine: 'keySig', keys: { mode: 'major', max: 7 }, clefs: ['treble', 'bass'] },
        { id: 'keys-ear', title: 'Hear degrees in any key', engine: 'earSyllable', keys: { mode: 'major', max: 7 }, clefs: ['treble', 'bass'], degrees: MAJOR },
        { id: 'ss-maj-step', title: 'Sight-sing: stepwise major', engine: 'sightSing', keys: { mode: 'major', max: 3 }, clefs: ['treble', 'bass'], degrees: MAJOR, length: 5 },
      ],
    },
    {
      id: 'u4', section: 'Fundamentals II', title: 'Minor', blurb: 'Natural, harmonic and melodic minor. Change do- or la-based minor in Settings.',
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
      id: 'u6', section: 'Fundamentals II', title: 'C Clefs', blurb: 'Alto and tenor clef, the clefs of violas, cellos, bassoons and trombones.',
      lessons: [
        { id: 'alto-names', title: 'Alto clef note names', engine: 'readLetter', keys: { list: ['C'] }, clefs: ['alto'] },
        { id: 'tenor-names', title: 'Tenor clef note names', engine: 'readLetter', keys: { list: ['C'] }, clefs: ['tenor'] },
        { id: 'c-read', title: 'Movable do in C clefs', engine: 'readSyllable', keys: { mode: 'major', max: 4 }, clefs: ['alto', 'tenor'], degrees: MAJOR },
        { id: 'ks-c', title: 'Key signatures in all four clefs', engine: 'keySig', keys: { mode: 'major', max: 7 }, clefs: ['treble', 'bass', 'alto', 'tenor'] },
        { id: 'all-names', title: 'Note names in any clef', engine: 'readLetter', keys: { mode: 'major', max: 7 }, clefs: ['treble', 'bass', 'alto', 'tenor'] },
      ],
    },
    {
      id: 'u-counterpoint', section: 'Fundamentals II', title: 'First-Species Counterpoint', blurb: 'Note against note: find the broken rule, then sing one voice while the app sings the other. Headphones help.',
      lessons: [
        { id: 'cp-err-1', title: 'Find the error: parallels and dissonance', engine: 'cpError', keys: { mode: 'major', max: 2 }, rules: ['parallel', 'dissonance'], length: 7 },
        { id: 'cp-err-2', title: 'Find the error: hidden 5ths and bad leaps too', engine: 'cpError', keys: { mode: 'major', max: 4 }, rules: ['parallel', 'dissonance', 'hidden', 'leap'], length: 8 },
        { id: 'tp-cp-above', title: 'Sing a counterpoint above the cantus', engine: 'twoPart', keys: { mode: 'major', max: 2 }, part: 'upper', cantus: 'lower', length: 6, bpm: 50 },
        { id: 'tp-cf-below', title: 'Sing the cantus under a counterpoint', engine: 'twoPart', keys: { mode: 'major', max: 2 }, part: 'lower', cantus: 'lower', length: 6, bpm: 50 },
        { id: 'tp-cp-below', title: 'Sing a counterpoint below the cantus', engine: 'twoPart', keys: { mode: 'major', max: 3 }, part: 'lower', cantus: 'upper', length: 7, bpm: 54 },
        { id: 'tp-either', title: 'Either part, any key', engine: 'twoPart', keys: { mode: 'major', max: 5 }, length: 8, bpm: 58 },
      ],
    },
    {
      id: 'u-chords', section: 'Fundamentals II', title: 'Triads & Inversions', blurb: 'Major, minor, diminished and augmented triads by ear, on the staff, and sung.',
      lessons: [
        { id: 'ch-ear-mm', title: 'Hear major vs. minor triads', engine: 'earChord', types: ['maj', 'min'] },
        { id: 'ch-ear-tri', title: 'Hear all four triads', engine: 'earChord', types: ['maj', 'min', 'dim', 'aug'] },
        { id: 'ch-read-tri', title: 'Read triad qualities', engine: 'readChord', types: ['maj', 'min', 'dim', 'aug'], clefs: ['treble', 'bass'] },
        { id: 'ch-sing-tri', title: 'Sing I, IV, V and vi', engine: 'singChord', keys: { mode: 'major', max: 3 }, clefs: ['treble', 'bass'], chords: ['I', 'IV', 'V', 'vi', 'ii'] },
        { id: 'ch-ear-inv', title: 'Hear triad inversions', engine: 'earChord', types: ['maj', 'min'], askInversion: true },
        { id: 'ch-read-inv', title: 'Read triads with inversions', engine: 'readChord', types: ['maj', 'min', 'dim'], inversions: true, clefs: ['treble', 'bass'] },
      ],
    },
    {
      id: 'u-chorale', section: 'Four-Voice Writing', title: 'Chorale Style', blurb: 'Four voices in their ranges, spaced and doubled the classroom way. Sing each line.',
      lessons: [
        { id: 'learn-chorale', title: 'Four-voice chorale style', engine: 'learn', page: 'chorale' },
        { id: 'pw-sing-s', title: 'Sing the soprano', engine: 'singVoice', keys: { mode: 'major', max: 3 }, voice: 'soprano', chords: ['I', 'IV', 'V'], length: 4, learn: 'chorale#melody' },
        { id: 'pw-sing-b', title: 'Sing the bass', engine: 'singVoice', keys: { mode: 'major', max: 3 }, voice: 'bass', chords: ['I', 'IV', 'V'], length: 4, learn: 'chorale#melody' },
        { id: 'pw-spot-1', title: 'Find the error: range, spacing, doubling', engine: 'spotError', keys: { mode: 'major', max: 3 }, rules: ['range', 'spacing', 'noThird', 'ltDouble'], pairs: PW_TRIADS, learn: 'chorale#doubling' },
        { id: 'pw-spot-chord', title: 'Find the error in one chord: doubling, spacing, crossing', engine: 'spotError', keys: { mode: 'major', max: 4 },
          rules: ['noThird', 'crossing', 'spacing', 'range', 'dbl3', 'dimDouble', 'dbl64', 'ltDouble'], pairs: PW_DOUBLING, learn: 'chorale#doubling' },
        { id: 'pw-spot-lines', title: 'Find the error: awkward leaps and parallels (minor)', engine: 'spotError', keys: { mode: 'minor', max: 4 },
          rules: ['leap', 'augmented', 'par5', 'par8', 'spacing', 'crossing'], pairs: PW_LINES, learn: 'chorale#melody' },
        { id: 'pw-spot-par', title: 'Find the error: parallel 5ths and octaves', engine: 'spotError', keys: { mode: 'major', max: 3 }, rules: ['par5', 'par8'], pairs: PW_TRIADS, learn: 'chorale#motion' },
        { id: 'pw-sing-a', title: 'Sing the alto', engine: 'singVoice', keys: { mode: 'major', max: 3 }, voice: 'alto', chords: ['I', 'IV', 'V'], length: 4, learn: 'chorale#texture' },
        { id: 'pw-sing-t', title: 'Sing the tenor', engine: 'singVoice', keys: { mode: 'major', max: 3 }, voice: 'tenor', chords: ['I', 'IV', 'V'], length: 4, learn: 'chorale#texture' },
      ],
    },
    {
      id: 'u-connect', section: 'Four-Voice Writing', title: 'Connecting Chords I', blurb: 'Roots a 4th or 5th apart: hold the common tone, step to the rest.',
      lessons: [
        { id: 'learn-connect-1', title: 'Connecting chords I', engine: 'learn', page: 'connecting-1' },
        { id: 'rr-read', title: 'Root relationships: 5th, 3rd or 2nd?', engine: 'rootMotion', ask: 'relation', keys: { mode: 'major', max: 3 }, chords: ['I', 'I6', 'ii', 'iii', 'IV', 'IV6', 'V', 'V6', 'vi'], learn: 'connecting-1#roots' },
        { id: 'pw-spot-45', title: 'Find the error: 4th- and 5th-related chords', engine: 'spotError', keys: { mode: 'major', max: 3 }, rules: ['range', 'spacing', 'noThird', 'par5', 'par8'], pairs: PW_FIFTHS, learn: 'connecting-1#common-tone' },
        { id: 'pw-spot-lt', title: 'Find the error: the leading tone', engine: 'spotError', keys: { mode: 'major', max: 4 }, rules: ['ltRes', 'ltDouble'], pairs: PW_DOMINANT, learn: 'chorale#doubling' },
      ],
    },
    {
      id: 'u-connect2', section: 'Four-Voice Writing', title: 'Connecting Chords II', blurb: 'Roots a 3rd apart share two notes; roots a step apart share none.',
      lessons: [
        { id: 'learn-connect-2', title: 'Connecting chords II', engine: 'learn', page: 'connecting-2' },
        { id: 'pw-spot-36', title: 'Find the error: 3rd-related chords', engine: 'spotError', keys: { mode: 'major', max: 4 }, rules: ['range', 'spacing', 'noThird', 'par5', 'par8'], pairs: PW_THIRDS, learn: 'connecting-2#thirds' },
        { id: 'pw-spot-27', title: 'Find the error: chords a step apart', engine: 'spotError', keys: { mode: 'major', max: 4 }, rules: ['par5', 'par8', 'spacing', 'ltDouble'], pairs: PW_SECONDS, learn: 'connecting-2#seconds' },
        { id: 'pw-spot-2', title: 'Find the error: all the rules so far', engine: 'spotError', keys: { mode: 'major', max: 4 }, rules: ['range', 'spacing', 'noThird', 'ltDouble', 'par5', 'par8', 'ltRes'], pairs: PW_TRIADS.concat(PW_DOMINANT), learn: 'connecting-2#checking' },
        { id: 'pw-sing-any', title: 'Sing any voice: I, ii, IV, V, vi', engine: 'singVoice', keys: { mode: 'major', max: 4 }, voice: 'any', chords: ['I', 'I6', 'ii', 'ii6', 'IV', 'V', 'vi'], length: 5, learn: 'connecting-2#thirds' },
      ],
    },
    {
      id: 'u-nct', section: 'Non-Chord Tones & Seventh Chords', title: 'Non-Chord Tones I', blurb: 'Passing and neighbor tones, anticipations, appoggiaturas and escape tones.',
      lessons: [
        { id: 'learn-nct-1', title: 'Non-chord tones I', engine: 'learn', page: 'nct-1' },
        { id: 'nct-read-1', title: 'Passing, neighbor, anticipation', engine: 'readNCT', keys: { mode: 'major', max: 3 }, types: ['PT', 'NT', 'ANT'], learn: 'nct-1#labels' },
        { id: 'nct-ear-1', title: 'Hear passing, neighbor, anticipation', engine: 'earNCT', keys: { mode: 'major', max: 3 }, types: ['PT', 'NT', 'ANT'], learn: 'nct-1#labels' },
        { id: 'nct-sing-1', title: 'Sing passing and neighbor tones', engine: 'singNCT', keys: { mode: 'major', max: 3 }, types: ['PT', 'NT'], learn: 'nct-1#passing' },
        { id: 'nct-read-2', title: 'Add appoggiaturas and escape tones', engine: 'readNCT', keys: { mode: 'major', max: 4 }, types: ['PT', 'NT', 'ANT', 'APP', 'ET'], learn: 'nct-1#labels' },
        { id: 'nct-ear-app', title: 'Hear appoggiaturas and escape tones', engine: 'earNCT', keys: { mode: 'major', max: 4 }, types: ['PT', 'NT', 'ANT', 'APP', 'ET'], learn: 'nct-1#labels' },
      ],
    },
    {
      id: 'u-nct2', section: 'Non-Chord Tones & Seventh Chords', title: 'Non-Chord Tones II', blurb: 'Suspensions (4–3, 7–6, 9–8) and retardations: the note that arrives late.',
      lessons: [
        { id: 'learn-nct-2', title: 'Non-chord tones II: suspensions', engine: 'learn', page: 'nct-2' },
        { id: 'nct-read-sus', title: 'Suspension or retardation?', engine: 'readNCT', keys: { mode: 'major', max: 4 }, types: ['SUS', 'RET', 'APP', 'ANT'], learn: 'nct-2#suspension' },
        { id: 'nct-ear-sus', title: 'Hear suspensions and retardations', engine: 'earNCT', keys: { mode: 'major', max: 4 }, types: ['SUS', 'RET', 'APP', 'ANT'], learn: 'nct-2#suspension' },
        { id: 'nct-sing-2', title: 'Sing suspensions and retardations', engine: 'singNCT', keys: { mode: 'major', max: 4 }, types: ['SUS', 'RET'], learn: 'nct-2#suspension' },
        { id: 'nct-read-all', title: 'Name any non-chord tone', engine: 'readNCT', keys: { mode: 'major', max: 5 }, types: NCT_ALL, learn: 'nct-1#labels' },
        { id: 'nct-ear-2', title: 'Hear any non-chord tone', engine: 'earNCT', keys: { mode: 'major', max: 4 }, types: NCT_ALL, learn: 'nct-1#labels' },
      ],
    },
    {
      id: 'u-sevenths', section: 'Non-Chord Tones & Seventh Chords', title: 'Seventh Chords', blurb: 'Five seventh-chord qualities by ear, on the staff, and sung.',
      lessons: [
        { id: 'learn-sevenths', title: 'Seventh chords', engine: 'learn', page: 'sevenths' },
        { id: 'ch-ear-7', title: 'Hear seventh chords', engine: 'earChord', types: ['dom7', 'maj7', 'min7', 'hdim7', 'dim7'], learn: 'sevenths#qualities' },
        { id: 'ch-read-7', title: 'Read seventh chords', engine: 'readChord', types: ['dom7', 'maj7', 'min7', 'hdim7', 'dim7'], clefs: ['treble', 'bass'], learn: 'sevenths#qualities' },
        { id: 'ch-read-7-inv', title: 'Read sevenths with inversions', engine: 'readChord', types: ['dom7', 'min7', 'hdim7'], inversions: true, clefs: ['treble', 'bass'], learn: 'sevenths#inversions' },
        { id: 'ch-sing-7', title: 'Sing seventh-chord arpeggios', engine: 'singChord', keys: { mode: 'major', max: 4 }, clefs: ['treble', 'bass'], chords: ['V7', 'ii7', 'IV7', 'vii7', 'I7'], learn: 'sevenths#qualities' },
      ],
    },
    {
      id: 'u-sev4', section: 'Functional Harmony', title: 'Sevenths in Four Voices', blurb: 'The 7th steps down; the leading tone steps up.',
      lessons: [
        { id: 'learn-sevenths-4v', title: 'Writing seventh chords in four voices', engine: 'learn', page: 'sevenths-4v' },
        { id: 'pw-spot-7', title: 'Find the error: resolving V7', engine: 'spotError', keys: { mode: 'major', max: 4 }, rules: ['sevRes', 'ltRes', 'par5', 'par8'], pairs: PW_SEVENTHS, learn: 'sevenths-4v#approach' },
        { id: 'pw-sing-7', title: 'Sing a voice through V7 to I', engine: 'singVoice', keys: { mode: 'major', max: 4 }, voice: 'any', chords: ['I', 'ii', 'ii6', 'IV', 'V7', 'V6/5'], length: 4, learn: 'sevenths-4v#tritone' },
      ],
    },
    {
      id: 'u-harmony', section: 'Functional Harmony', title: 'Harmonic Function & Roman Numerals', blurb: 'Tonic, predominant, dominant: what each chord does, and how to label it.',
      lessons: [
        { id: 'learn-function', title: 'Harmonic function and Roman numerals', engine: 'learn', page: 'function' },
        { id: 'rn-read', title: 'Roman numerals: diatonic triads', engine: 'readNumeral', keys: { mode: 'major', max: 4 }, clefs: ['treble', 'bass'], chords: ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'], learn: 'function#numerals' },
        { id: 'rn-read-inv', title: 'Roman numerals with inversions', engine: 'readNumeral', keys: { mode: 'major', max: 4 }, clefs: ['treble', 'bass'], chords: ['I', 'I6', 'I6/4', 'ii', 'ii6', 'IV', 'IV6', 'V', 'V6', 'V6/4', 'vi', 'vii°6'], learn: 'function#numerals' },
        { id: 'rn-read-7', title: 'Roman numerals: V7 and its inversions', engine: 'readNumeral', keys: { mode: 'major', max: 4 }, clefs: ['treble', 'bass'], chords: ['V7', 'V6/5', 'V4/3', 'V4/2', 'ii7', 'ii6/5'], learn: 'sevenths#inversions' },
        { id: 'rn-read-min', title: 'Roman numerals in minor', engine: 'readNumeral', keys: { mode: 'minor', max: 4 }, clefs: ['treble', 'bass'], chords: ['I', 'ii°6', 'III', 'IV', 'V', 'V7', 'VI', 'vii°'], learn: 'function#minor' },
        { id: 'rm-motion', title: 'Progressive or retrogressive?', engine: 'rootMotion', ask: 'motion', keys: { mode: 'major', max: 4 }, chords: ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°6'], learn: 'function#root-motion' },
        { id: 'fn-read', title: 'Tonic, predominant or dominant?', engine: 'readNumeral', askFunction: true, keys: { mode: 'major', max: 3 }, clefs: ['treble', 'bass'], chords: ['I', 'I6', 'ii', 'ii6', 'IV', 'IV6', 'V', 'V6', 'V7', 'vii°6'], learn: 'function#categories' },
        { id: 'fn-dict', title: 'Hear the functions: T, PD, D', engine: 'dictation', functions: true, keys: { mode: 'major', max: 3 }, chords: ['I', 'I6', 'ii', 'ii6', 'IV', 'V', 'V7', 'I6/4'], length: [4, 6], learn: 'function#categories' },
      ],
    },
    {
      id: 'u-cadences', section: 'Functional Harmony', title: 'Cadences', blurb: 'Authentic, half, Phrygian, plagal and deceptive cadences by ear.',
      lessons: [
        { id: 'learn-cadences', title: 'Harmonic cadences', engine: 'learn', page: 'cadences' },
        { id: 'cad-ear-1', title: 'Hear cadences: authentic, half, plagal, deceptive', engine: 'earCadence', keys: { mode: 'major', max: 4 }, cadences: ['PAC', 'HC', 'PC', 'DC'], learn: 'cadences' },
        { id: 'cad-ear-2', title: 'Perfect vs. imperfect authentic', engine: 'earCadence', keys: { mode: 'major', max: 4 }, cadences: ['PAC', 'IAC', 'HC', 'PC', 'DC'], learn: 'cadences#authentic' },
        { id: 'cad-ear-ph', title: 'Half or Phrygian half?', engine: 'earCadence', keys: { mode: 'minor', max: 4 }, cadences: ['HC', 'Ph', 'PAC', 'DC'], learn: 'cadences#phrygian' },
        { id: 'cad-ear-min', title: 'Cadences in minor', engine: 'earCadence', keys: { mode: 'minor', max: 4 }, cadences: ['PAC', 'IAC', 'HC', 'Ph', 'PC', 'DC'], learn: 'cadences' },
      ],
    },
    {
      id: 'u-primary', section: 'Harmonic Function', title: 'Primary Triads & Sevenths', blurb: 'I, IV and V, the dominant seventh, and the tonic and subdominant sevenths.',
      lessons: [
        { id: 'pw-review', title: 'Partwriting review: find the error', engine: 'spotError', keys: { mode: 'major', max: 5 }, rules: ['range', 'spacing', 'noThird', 'ltDouble', 'par5', 'par8', 'ltRes', 'sevRes'], pairs: PW_TRIADS.concat(PW_DOMINANT, PW_SEVENTHS) },
        { id: 'dict-1', title: 'Dictation: I, IV, V', engine: 'dictation', keys: { mode: 'major', max: 3 }, chords: ['I', 'IV', 'V'], length: 4 },
        { id: 'rn-read-pri7', title: 'Read V7, I7 and IV7', engine: 'readNumeral', keys: { mode: 'major', max: 4 }, clefs: ['treble', 'bass'], chords: ['I', 'IV', 'V', 'V7', 'I7', 'IV7', 'V6/5'] },
      ],
    },
    {
      id: 'u-mediant', section: 'Harmonic Function', title: 'The Submediant & Mediant', blurb: 'Adding vi and iii to the progression.',
      lessons: [
        { id: 'dict-2', title: 'Dictation: adding ii, vi and V7', engine: 'dictation', keys: { mode: 'major', max: 4 }, chords: ['I', 'ii', 'IV', 'V', 'V7', 'vi'], length: [4, 5] },
        { id: 'dict-36', title: 'Dictation with iii and vi', engine: 'dictation', keys: { mode: 'major', max: 4 }, chords: ['I', 'ii', 'iii', 'IV', 'V', 'V7', 'vi'], length: [5, 6] },
        { id: 'dict-3', title: 'Dictation with inversions', engine: 'dictation', keys: { mode: 'major', max: 4 }, chords: ['I', 'I6', 'ii6', 'IV', 'IV6', 'V', 'V6', 'V7', 'V6/5', 'V4/3', 'vi', 'I6/4', 'vii\u00B06'], length: [5, 6] },
        { id: 'dict-min', title: 'Dictation in minor', engine: 'dictation', keys: { mode: 'minor', max: 4 }, chords: ['I', 'ii6', 'IV', 'V', 'V7', 'vi', 'V6/5'], length: [4, 6] },
      ],
    },
    {
      id: 'u5', section: 'Chromatic Harmony & Modulation', title: 'Chromatic Solfège', blurb: 'Di ri fi si li going up; ra me se le te coming down.',
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
      id: 'u-chromatic-harmony', section: 'Chromatic Harmony & Modulation', title: 'Secondary Dominants', blurb: 'Borrowed dominants and tonicization: fi goes to sol, te goes to la.',
      lessons: [
        { id: 'sec-read', title: 'Read secondary dominants', engine: 'readNumeral', keys: { mode: 'major', max: 4 }, clefs: ['treble', 'bass'],
          chords: ['V', 'V7', 'V/V', 'V7/V', 'V/vi', 'V7/vi', 'V7/IV', 'V/ii', 'V7/ii'] },
        { id: 'sec-dict', title: 'Dictation with V/V and V7/IV', engine: 'dictation', keys: { mode: 'major', max: 3 }, chords: ['I', 'ii', 'IV', 'V', 'V7', 'vi', 'V/V', 'V7/V', 'V7/IV'], length: [5, 6] },
        { id: 'sec-dict-2', title: 'Dictation: all secondary dominants', engine: 'dictation', keys: { mode: 'major', max: 4 }, chords: ['I', 'ii', 'IV', 'V', 'V7', 'vi', 'V/V', 'V7/V', 'V7/IV', 'V/vi', 'V7/vi', 'V/ii', 'V7/ii'], length: [5, 6] },
        { id: 'sec-ss', title: 'Sing tonicizations (fi\u2013sol, te\u2013la)', engine: 'sightSing', keys: { mode: 'major', max: 3 }, clefs: ['treble', 'bass'], degrees: ['1', '2', '3', '4', '5', '6', '7', '8'], chromatic: true, length: 6 },
      ],
    },
    {
      id: 'u-modulation', section: 'Chromatic Harmony & Modulation', title: 'Modulation to Closely Related Keys', blurb: 'Pivot chords, and re-solmizing at the pivot.',
      lessons: [
        { id: 'mod-ear', title: 'Hear modulations: V, IV, relative minor', engine: 'earModulation', keys: { mode: 'major', max: 4 }, targets: ['V', 'IV', 'vi', 'none'] },
        { id: 'mod-ss-V', title: 'Sight-sing: modulate to the dominant', engine: 'sightSingMod', keys: { mode: 'major', max: 3 }, clefs: ['treble', 'bass'], degrees: ['1', '2', '3', '4', '5', '6', '7', '8'], targets: ['V'] },
        { id: 'mod-ss-all', title: 'Sight-sing: V, IV or relative minor', engine: 'sightSingMod', keys: { mode: 'major', max: 4 }, clefs: ['treble', 'bass'], degrees: ['1', '2', '3', '4', '5', '6', '7', '8'], targets: ['V', 'IV', 'vi'], leaps: true },
      ],
    },
    {
      id: 'u-modes', section: 'More Musicianship', title: 'Modes', blurb: 'The church modes: their colors, signatures and syllables.',
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
      id: 'u-scales', section: 'More Musicianship', title: 'Beyond Major & Minor', blurb: 'Pentatonic, blues, whole-tone, octatonic, and the three minors.',
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
      id: 'u7', section: 'More Musicianship', title: 'Sight-Singing', blurb: 'Put it all together: real melodies in any key and clef.',
      lessons: [
        { id: 'ss-maj-leap', title: 'Major melodies with leaps', engine: 'sightSing', keys: { mode: 'major', max: 5 }, clefs: ['treble', 'bass'], degrees: MAJOR, leaps: true, length: 7 },
        { id: 'ss-min', title: 'Minor melodies', engine: 'sightSing', keys: { mode: 'minor', max: 4 }, clefs: ['treble', 'bass'], degrees: MINOR_ALL, leaps: true, length: 7 },
        { id: 'ss-chr', title: 'Chromatic melodies', engine: 'sightSing', keys: { mode: 'major', max: 5 }, clefs: ['treble', 'bass'], degrees: MAJOR, chromatic: true, leaps: true, length: 8 },
        { id: 'ss-any', title: 'Any key, any clef', engine: 'sightSing', keys: { mode: 'any', max: 7 }, clefs: ['treble', 'bass', 'alto', 'tenor'], degrees: MAJOR, chromatic: true, leaps: true, length: 8 },
        { id: 'ss-rhythm-maj', title: 'Rhythmic sight-singing: dotted and syncopated', engine: 'singRhythm', keys: { mode: 'major', max: 5 }, clefs: ['treble', 'bass', 'alto', 'tenor'], degrees: ['1', '2', '3', '4', '5', '6', '7', '8'], leaps: true, time: ['2/4', '3/4', '4/4'], level: 3, measures: 3, bpm: 72 },
        { id: 'ss-rhythm-min', title: 'Rhythmic sight-singing in minor', engine: 'singRhythm', keys: { mode: 'minor', max: 4 }, clefs: ['treble', 'bass'], degrees: ['1', '2', '3', '4', '5', '6', '+6', '7', '+7', '8'], leaps: true, time: ['3/4', '4/4', '6/8'], level: 3, measures: 3, bpm: 66 },
        { id: 'echo-any', title: 'Dictation by ear: echo anything', engine: 'echo', keys: { mode: 'any', max: 7 }, clefs: ['treble', 'bass'], degrees: MAJOR, chromatic: true, leaps: true, length: 6 },
      ],
    },
    {
      id: 'u-dictation', section: 'More Musicianship', title: 'Melodic Dictation', blurb: 'Hear a melody, write it down: the first note is given.',
      lessons: [
        { id: 'md-dms', title: 'Do, mi, sol patterns', engine: 'melodicDictation', keys: { list: ['C', 'G', 'F'] }, clefs: ['treble'], degrees: ['1', '3', '5', '8'], length: 4, leaps: true },
        { id: 'md-step', title: 'Stepwise major melodies', engine: 'melodicDictation', keys: { mode: 'major', max: 3 }, clefs: ['treble', 'bass'], degrees: ['1', '2', '3', '4', '5', '6', '7', '8'], length: 5 },
        { id: 'md-leap', title: 'Major melodies with leaps', engine: 'melodicDictation', keys: { mode: 'major', max: 4 }, clefs: ['treble', 'bass'], degrees: ['1', '2', '3', '4', '5', '6', '7', '8'], length: 6, leaps: true },
        { id: 'md-minor', title: 'Minor melodies', engine: 'melodicDictation', keys: { mode: 'minor', max: 4 }, clefs: ['treble', 'bass'], degrees: ['1', '2', '3', '4', '5', '6', '+6', '7', '+7', '8'], length: 6, leaps: true },
        { id: 'md-chrom', title: 'Chromatic melodies', engine: 'melodicDictation', keys: { mode: 'major', max: 4 }, clefs: ['treble', 'bass'], degrees: ['1', '2', '3', '4', '5', '6', '7', '8'], chromatic: true, length: 6, leaps: true },
        { id: 'md-clefs', title: 'Any key, any clef', engine: 'melodicDictation', keys: { mode: 'any', max: 6 }, clefs: ['treble', 'bass', 'alto', 'tenor'], degrees: ['1', '2', '3', '4', '5', '6', '7', '8'], chromatic: true, length: 7, leaps: true },
      ],
    },
  ];

  root.Curriculum = { UNITS: UNITS };
})(this);
