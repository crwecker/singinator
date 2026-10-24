// Reading for the course: one page per lesson of Murray's Essential
// Materials of Music Theory (Part I), in our own words, with examples the
// app voices and plays. Exercises point here with learn: 'page#section';
// LINKS sends a missed rule, non-chord tone or cadence to the section that
// covers it. Pure data; browser global (window.Learn) or Node module.
//
// Example specs (drawn by learn-view.js):
//   { key: 'G', chords: ['I', 'IV', 'V', 'I'], caption }        voiced by the app
//   { key: 'C', chords: [...], voices: [['C3', 'G3', 'E4', 'C5'], ...], mark: [[chord, voice], ...] }
//   { key: 'C', nct: 'SUS' }                                     a fresh example each time
//   end: soprano's last scale degree (0 = do); again: offer "Another one"
(function (root) {
  'use strict';

  var PAGES = [
    // ---------------- Unit III: Four-Voice Writing ----------------
    {
      id: 'chorale', book: 'Murray Unit III · Lesson 1 · pp. 21–23 · Exercises III.1 (pp. 107–110)',
      title: 'Four-Voice Chorale Style',
      intro: 'Bach’s chorale harmonizations are the model for writing in four parts: four singable melodies that, stacked up, make clear triads. Learn the handful of rules below and you can write (and hear) a correct progression in any key.',
      sections: [
        {
          id: 'members', title: 'Chord members and inversions',
          html: '<p>A <b>triad</b> is three notes stacked in 3rds. Each note has a name for the job it does in the chord, and those names stay the same however the notes are arranged:</p>' +
            '<ul><li>the <b>root</b> (R): the note the chord is built on and named after;</li>' +
            '<li>the <b>third</b> (3): a 3rd above the root. It decides whether the chord is major or minor;</li>' +
            '<li>the <b>fifth</b> (5): a 5th above the root;</li>' +
            '<li>a <b>seventh chord</b> adds a <b>seventh</b> (7) on top: a 7th above the root.</li></ul>' +
            '<p>In C major the I chord is C–E–G: C is the root, E the third, G the fifth. In four voices one member appears twice (it is <b>doubled</b>), and the notes can be in any order above the bass.</p>' +
            '<p>What matters is which member is in the <b>bass</b> (the lowest note):</p>' +
            '<table class="learn-table"><tr><th>In the bass</th><th>Position</th><th>Symbol</th><th>In C</th></tr>' +
            '<tr><td>root</td><td>root position</td><td>I</td><td>C in the bass</td></tr>' +
            '<tr><td>third</td><td>first inversion</td><td>I6</td><td>E in the bass</td></tr>' +
            '<tr><td>fifth</td><td>second inversion</td><td>I6/4</td><td>G in the bass</td></tr></table>' +
            '<p>In the examples, the letters beside each note show its chord member (R, 3, 5, 7). Use the switch at the top of the page to show solfège instead.</p>',
          examples: [{ key: 'C', chords: ['I', 'I6', 'I6/4'], voices: [['C3', 'G3', 'E4', 'C5'], ['E3', 'G3', 'C4', 'C5'], ['G2', 'G3', 'E4', 'C5']],
            caption: 'The same C major triad in root position, first inversion and second inversion', beat: 1.2 }],
        },
        {
          id: 'symbols', title: 'Reading chord symbols',
          html: '<p>A chord symbol such as <b>vii°6</b> packs four facts into a few characters:</p>' +
            '<table class="learn-table"><tr><th>Part</th><th>Means</th><th>Examples</th></tr>' +
            '<tr><td>The numeral</td><td>the scale degree of the chord’s <b>root</b>: I is built on do, ii on re, iii on mi, IV on fa, V on sol, vi on la, vii on ti</td><td>V = the chord on sol</td></tr>' +
            '<tr><td>Upper or lower case</td><td><b>Uppercase</b> is a <b>major</b> triad (major 3rd + perfect 5th). <b>Lowercase</b> is <b>minor</b> (minor 3rd + perfect 5th)</td><td>I, IV, V major; ii, iii, vi minor</td></tr>' +
            '<tr><td>° or +</td><td><b>°</b> is <b>diminished</b> (lowercase, minor 3rd + diminished 5th). <b>+</b> is <b>augmented</b> (uppercase, major 3rd + augmented 5th)</td><td>vii°, ii° in minor; III+</td></tr>' +
            '<tr><td>Figures after it</td><td>the <b>inversion</b>: which chord member is in the bass. No figure is root position</td><td>6 = third in the bass; 6/4 = fifth in the bass</td></tr></table>' +
            '<p>So <b>vii°6</b> reads: the chord built on ti (vii), diminished (°), with its third in the bass (6). In C major that is B–D–F with D in the bass.</p>' +
            '<p><b>Letter-name symbols.</b> Before you know the key, name a chord by its root’s letter. The workbook does this throughout, with the same case and figure conventions:</p>' +
            '<table class="learn-table"><tr><th>Symbol</th><th>Means</th><th>Notes</th></tr>' +
            '<tr><td>G</td><td>G major, root position</td><td>G–B–D, G in the bass</td></tr>' +
            '<tr><td>g</td><td>G minor, root position</td><td>G–B♭–D</td></tr>' +
            '<tr><td>G+</td><td>G augmented</td><td>G–B–D♯</td></tr>' +
            '<tr><td>g°</td><td>G diminished</td><td>G–B♭–D♭</td></tr>' +
            '<tr><td>F♯6</td><td>F♯ major, first inversion</td><td>F♯–A♯–C♯, A♯ in the bass</td></tr>' +
            '<tr><td>c6/4</td><td>C minor, second inversion</td><td>C–E♭–G, G in the bass</td></tr>' +
            '<tr><td>f♯°6</td><td>F♯ diminished, first inversion</td><td>F♯–A–C, A in the bass</td></tr></table>' +
            '<p>A Roman numeral adds the key: C6 is <b>IV6</b> in G, <b>I6</b> in C and <b>V6</b> in F. The letter says what the chord is; the numeral says what it does.</p>' +
            '<p>Seventh chords add a 7 and have their own inversion figures: <b>7</b> (root position), <b>6/5</b> (third in the bass), <b>4/3</b> (fifth in the bass), <b>4/2</b> (seventh in the bass). V7 is the dominant seventh: sol–ti–re–fa. See <a href="#" data-learn="sevenths#inversions">Seventh Chords</a>.</p>' +
            '<p>The figures come from <b>figured bass</b>: they are the intervals above the bass note. A first-inversion chord has a 6th above its bass (and a 3rd, so its full figure is 6/3, shortened to 6). Under every example on these pages is a line that spells out each symbol.</p>',
          examples: [{ key: 'C', chords: ['I', 'ii6', 'V7', 'vi', 'IV', 'vii°6', 'I'], caption: 'Read each symbol, then check the line below the staff', beat: 0.9 }],
        },
        {
          id: 'texture', title: 'Four voices, two staves',
          html: '<p>The four voices are <b>soprano, alto, tenor and bass</b> (SATB). In chorale style:</p>' +
            '<ul><li>every part is a <b>singable melody</b>, mostly steps, in a comfortable range;</li>' +
            '<li>the parts stay <b>independent</b>: they don’t cross, and no two of them move together in unisons, octaves or fifths;</li>' +
            '<li>almost every vertical sonority (the notes sounding at one moment) is a <b>triad</b> or a seventh chord;</li>' +
            '<li><b>cadences</b> mark the ends of phrases.</li></ul>' +
            '<p>We write it on a grand staff: soprano and alto share the treble staff, tenor and bass the bass staff. On each staff the upper voice has stems up and the lower voice stems down.</p>',
          examples: [{ key: 'G', chords: ['I', 'IV', 'V', 'I'], caption: 'I–IV–V–I in four parts' }],
        },
        {
          id: 'ranges', title: 'Voice ranges',
          html: '<table class="learn-table"><tr><th>Voice</th><th>Comfortable range</th></tr>' +
            '<tr><td>Soprano</td><td>C4 (middle C) to G5</td></tr>' +
            '<tr><td>Alto</td><td>G3 to D5</td></tr>' +
            '<tr><td>Tenor</td><td>C3 to G4</td></tr>' +
            '<tr><td>Bass</td><td>E2 to C4</td></tr></table>' +
            '<p>These are ranges for amateur singers. Stay inside them; the edges are for the occasional exception. In open score (one staff per voice) the tenor reads a treble clef with a small 8 under it, meaning it sounds an octave lower. On the grand staff it shares the bass staff with the bass.</p>' +
            '<p class="why"><b>Why:</b> outside these ranges real singers strain or can’t be heard, and a part that wanders out of its range usually crosses another voice too.</p>',
        },
        {
          id: 'doubling', title: 'Doubling',
          html: '<p>Four voices and three chord tones means one tone is <b>doubled</b>: two voices sing the same chord member, in unison or in different octaves. A <b>rule</b> is never broken; a <b>guideline</b> is what you do unless the musical context gives a good reason not to.</p>' +
            '<div class="rule"><b>Rule 1.</b> Never double a <b>tendency tone</b>. A tendency tone is a note with one place it wants to go next:' +
            '<ul><li>the <b>leading tone</b> (ti, or si in la-based minor) pulls up a half step to do;</li>' +
            '<li>the <b>7th of a seventh chord</b> (fa in V7) pulls down by step;</li>' +
            '<li>a <b>chromatically altered note</b> (one with an accidental outside the key) pulls the way it was altered: raised notes up, lowered notes down.</li></ul>' +
            '<p class="why"><b>Why:</b> if two voices have the same tendency tone, both must go to the same next note. That makes parallel octaves, or one voice has to break its tendency.</p></div>' +
            '<div class="rule"><b>Rule 2.</b> In a second-inversion (6/4) triad, double the <b>bass</b> (the chord’s fifth).' +
            '<p class="why"><b>Why:</b> the 6/4 is an unstable chord that leans on its bass note. Doubling the bass anchors it.</p></div>' +
            '<div class="rule guide"><b>Guideline 1.</b> In a root-position or first-inversion major or minor triad, double the <b>root</b> first, the <b>fifth</b> second, the <b>third</b> last.' +
            '<p class="why"><b>Why:</b> the root is the chord’s strongest note. The third is its color note: doubled, it sounds thick and over-bright, and in V it may be the leading tone.</p></div>' +
            '<div class="rule guide"><b>Guideline 2.</b> In a diminished triad (vii°, or ii° in minor), double the <b>third</b>. In vii° the root is the leading tone and the fifth is fa, so both are tendency tones; the third (re) is the only free note.' +
            '<p class="why"><b>Why:</b> doubling the root doubles the leading tone (Rule 1). Doubling the fifth stresses the dissonant diminished 5th.</p></div>' +
            '<p>The “find the error” exercises count the guidelines too: a doubled third in a root-position triad is marked wrong (except vi after V, in a deceptive cadence), and so is a diminished triad that doesn’t double its third.</p>' +
            '<div class="rule"><b>Every chord needs its third.</b> Leave it out and you can’t tell major from minor. The fifth is the one tone you may sometimes leave out (an <b>incomplete</b> chord, with the root tripled).</div>',
          examples: [
            { key: 'C', chords: ['I'], voices: [['C3', 'G3', 'E4', 'C5']], mark: [[0, 0], [0, 3]], caption: 'I with the root (do) doubled' },
            { key: 'C', chords: ['vii°6'], voices: [['D3', 'F3', 'B3', 'D4']], mark: [[0, 0], [0, 3]], caption: 'vii°6 with its third (re) doubled' },
            { key: 'C', chords: ['V'], voices: [['G2', 'B3', 'D4', 'B4']], mark: [[0, 1], [0, 3]], caption: 'Wrong: V with the leading tone (ti) doubled' },
          ],
        },
        {
          id: 'spacing', title: 'Spacing and crossing',
          html: '<p><b>Spacing</b> is the size of the gaps between neighboring voices. Space a chord like the <b>overtone series</b> (the faint higher pitches that sound inside every note): wider gaps at the bottom, closer at the top.</p>' +
            '<div class="rule"><b>Spacing rule 1.</b> No more than an <b>octave</b> between soprano and alto, or between alto and tenor. Tenor and bass may be farther apart.' +
            '<p class="why"><b>Why:</b> a wide hole between upper voices makes the chord sound like two separate groups instead of one blended sound.</p></div>' +
            '<div class="rule"><b>Spacing rule 2.</b> Don’t <b>cross</b> voices: from the top down, every chord reads soprano, alto, tenor, bass. Crossing means, for example, the alto singing higher than the soprano.' +
            '<p class="why"><b>Why:</b> listeners follow each voice by its place in the stack. When voices cross, the ear loses which line is which.</p></div>',
          examples: [{ key: 'C', chords: ['I', 'I'], voices: [['C3', 'G3', 'E4', 'C5'], ['C3', 'E3', 'G3', 'E5']], mark: [[1, 2], [1, 3]],
            caption: 'Good spacing, then a gap of more than an octave between alto and soprano' }],
        },
        {
          id: 'motion', title: 'Motion and parallels',
          html: '<p>Take any two voices as they move from one chord to the next. They move in one of four ways:</p>' +
            '<table class="learn-table"><tr><th>Motion</th><th>What the two voices do</th></tr>' +
            '<tr><td><b>Contrary</b></td><td>move in opposite directions</td></tr>' +
            '<tr><td><b>Oblique</b></td><td>one holds its note, the other moves</td></tr>' +
            '<tr><td><b>Similar</b></td><td>move in the same direction to a different interval</td></tr>' +
            '<tr><td><b>Parallel</b></td><td>move in the same direction and keep the same interval (a 5th to a 5th, say)</td></tr></table>' +
            '<ul><li>The soprano and bass are the voices you hear most, so move them in <b>contrary motion</b> as often as you can.</li>' +
            '<li>Parallel 3rds and 6ths are fine.</li></ul>' +
            '<div class="rule"><b>No parallel unisons, octaves or fifths</b> between any two voices. The <b>perfect intervals</b> (unison, 5th, octave) are the most blended. Two voices moving in them melt into one, and four parts become three.' +
            '<p class="why"><b>Why:</b> the style is built on four independent voices. Parallel perfect intervals hide one of them.</p></div>' +
            '<p>To check a connection, look at all six pairs: S–A, S–T, S–B, A–T, A–B, T–B.</p>',
          examples: [
            { key: 'C', chords: ['IV', 'V'], voices: [['F2', 'C3', 'A3', 'F4'], ['G2', 'D3', 'B3', 'G4']], mark: [[0, 0], [0, 1], [0, 3], [1, 0], [1, 1], [1, 3]],
              caption: 'Wrong: everyone moves up. Parallel 5ths (bass–tenor) and octaves (bass–soprano)' },
            { key: 'C', chords: ['IV', 'V'], voices: [['F2', 'A3', 'C4', 'F4'], ['G2', 'G3', 'B3', 'D4']],
              caption: 'Right: the upper voices move down against the rising bass' },
          ],
        },
        {
          id: 'melody', title: 'Writing each line',
          html: '<ul><li>Move <b>mostly by step</b>, with an occasional 3rd or 4th. Repeated notes are fine, especially in the alto and tenor.</li></ul>' +
            '<div class="rule"><b>No awkward leaps.</b> In the <b>upper three voices</b>, never leap more than a <b>5th</b>. The <b>bass</b> leaps more often: a 6th or an octave is fine, a <b>7th</b> is not.' +
            '<p class="why"><b>Why:</b> big leaps are hard to sing in tune and break the line into pieces. A 7th is especially hard to hear and sing.</p></div>' +
            '<div class="rule"><b>No augmented intervals</b> in a line. The common ones:' +
            '<ul><li>the <b>augmented 2nd</b> in harmonic minor, from the lowered 6th degree up to the raised 7th (le–ti with do-based minor, fa–si with la-based). It is three half steps, the size of a minor 3rd, but spelled as a 2nd;</li>' +
            '<li>the <b>augmented 4th</b> (a <b>tritone</b>: three whole steps), such as fa up to ti.</li></ul>' +
            '<p class="why"><b>Why:</b> augmented intervals are hard to sing and sound exotic in this style.</p></div>' +
            '<p>Sing each line on its own. If it’s awkward to sing, it’s awkward to hear.</p>',
        },
      ],
    },
    {
      id: 'connecting-1', book: 'Murray Unit III · Lesson 2 · pp. 24–25 · Exercises III.2 (pp. 111–114)',
      title: 'Connecting Chords I',
      intro: 'The aim is the smoothest voice leading in every part: each chord tone moves to the nearest note of the next chord. Start by seeing how the two chords are related.',
      sections: [
        {
          id: 'roots', title: 'Root relationships',
          html: '<p>Measure from <b>root to root</b>, not bass to bass. An inversion doesn’t change the relationship, and a 4th up is the same pitch class as a 5th down, so there are only three kinds:</p>' +
            '<table class="learn-table"><tr><th>Roots</th><th>Common tones</th><th>Example in C</th></tr>' +
            '<tr><td>4th / 5th apart</td><td>1</td><td>C–G (I–V): G is shared</td></tr>' +
            '<tr><td>3rd / 6th apart</td><td>2</td><td>C–A (I–vi): C and E are shared</td></tr>' +
            '<tr><td>2nd / 7th apart</td><td>none</td><td>F–G (IV–V)</td></tr></table>' +
            '<p>To find the relationship, name both roots (not the bass notes) and count the letters between them: C up to G is C-D-E-F-G, a 5th. D6 has F♯ in the bass, but its root is still D.</p>' +
            '<p class="why"><b>Why it matters:</b> the number of common tones tells you how much can stay put. Two shared notes nearly write the connection for you; none means every voice has to move, and that is where parallels hide.</p>',
          examples: [{ key: 'G', chords: ['I', 'V6', 'I', 'V'], caption: 'I–V6: the basses are a step apart, but the roots (G, D) are a 5th apart' }],
        },
        {
          id: 'common-tone', title: 'Keep the common tone',
          html: '<p>When the roots are a 4th or 5th apart:</p>' +
            '<ol><li><b>Hold the common tone</b> in the same voice.</li>' +
            '<li>Move the other two upper voices <b>by step</b> to the nearest chord tones.</li>' +
            '<li>If both chords are in root position, the bass leaps (a 4th or 5th) and everything else is a step or a held note. Double the root in both chords.</li></ol>' +
            '<div class="rule guide"><b>Guideline.</b> Move every voice the <b>shortest possible distance</b>: hold common tones, step to the rest. Only the bass should leap.' +
            '<p class="why"><b>Why:</b> small moves keep each line singable and the texture smooth, and they make parallels much less likely.</p></div>' +
            '<p>Sometimes the smoothest path doubles the fifth instead of the root. In the book’s Bach example, the D6 after G doubles its fifth so the alto can keep the common tone. Smooth lines can outweigh the first-choice doubling.</p>' +
            '<p><b>Writing a connection, step by step:</b></p>' +
            '<ol><li>Write both bass notes.</li><li>Find the common tone(s) and keep each in the same voice.</li>' +
            '<li>Move each remaining upper voice to the nearest note of the new chord.</li>' +
            '<li>Check the new chord: third present, good doubling, spacing, no crossing.</li>' +
            '<li>Check the motion: all six pairs of voices for parallel 5ths and octaves.</li></ol>',
          examples: [{ key: 'G', chords: ['I', 'IV', 'V', 'I'], caption: 'Common tones held; only the bass leaps' }],
        },
        {
          id: 'figured-bass', title: 'Reading figured bass',
          html: '<p>A figured bass gives you the bass line and numbers; you write the upper voices.</p>' +
            '<ul><li>Figures are <b>intervals above the bass</b>, not chord members or scale degrees. The key signature sets their quality.</li>' +
            '<li><b>No figure</b> means a root-position triad (5/3).</li>' +
            '<li><b>6</b> (short for 6/3) is a first-inversion triad; <b>6/4</b> is second inversion.</li>' +
            '<li>An accidental beside a figure raises or lowers that interval by a half step. A <b>slash</b> through a figure raises it.</li>' +
            '<li>An accidental <b>by itself</b> applies to the <b>3rd</b> above the bass. In minor, ♯ alone under V gives you the leading tone.</li>' +
            '<li>Accidentals in figures mean “raise” or “lower”, not always the literal sign: a ♮ on a note that is flat in the key signature raises it.</li></ul>' +
            '<p><b>Reading a figure, step by step.</b> Take the bass B with a 6 in C major. A 6th above B is G and a 3rd above is D, so the chord is G–B–D with B in the bass: G major in first inversion, <b>G6</b> (V6 in C). The same bass with no figure is B–D–F, <b>b°</b>.</p>' +
            '<table class="learn-table"><tr><th>Figure</th><th>Notes above the bass</th><th>Chord</th></tr>' +
            '<tr><td>(none) or 5/3</td><td>a 3rd and a 5th</td><td>root position: the bass is the root</td></tr>' +
            '<tr><td>6 (6/3)</td><td>a 3rd and a 6th</td><td>first inversion: the root is a 6th above the bass</td></tr>' +
            '<tr><td>6/4</td><td>a 4th and a 6th</td><td>second inversion: the root is a 4th above the bass</td></tr>' +
            '<tr><td>♯ (alone)</td><td>a raised 3rd and a 5th</td><td>root position with the 3rd raised</td></tr>' +
            '<tr><td>♯6</td><td>a 3rd and a raised 6th</td><td>first inversion with the 6th raised</td></tr></table>',
        },
      ],
    },
    {
      id: 'connecting-2', book: 'Murray Unit III · Lesson 3 · pp. 26–27 · Exercises III.3 (pp. 115–118)',
      title: 'Connecting Chords II',
      intro: 'Chords a 3rd apart share a lot. Chords a step apart share nothing, and that’s where parallel fifths and octaves hide.',
      sections: [
        {
          id: 'thirds', title: 'Roots a 3rd apart',
          html: '<p>Two common tones. Hold <b>both</b> in the same voices, and move the one remaining upper voice by step. In C, I to vi keeps C and E and moves G up to A; vi to IV keeps A and C and moves E up to F.</p>' +
            '<p class="why"><b>Why:</b> with two notes held, only one upper voice moves, and it moves by step. There is almost no way to make parallels, and the change sounds smooth because most of the sound stays.</p>',
          examples: [{ key: 'G', chords: ['I', 'vi', 'IV'], caption: 'I–vi–IV: two notes hold at each change' }],
        },
        {
          id: 'guideline', title: 'A guideline, not a rule',
          html: '<p>Keeping common tones is a <b>guideline</b>. When a chord is inverted you may not be able to keep one (the bass has to move), and sometimes a better doubling matters more than the smoothest path.</p>' +
            '<p>Take I6 to vi. You can move a voice off the common tone to double vi’s root, or hold everything and double vi’s third. Both are acceptable; choose by ear.</p>',
          examples: [{ key: 'G', chords: ['I6', 'vi'], caption: 'I6–vi' }],
        },
        {
          id: 'seconds', title: 'Roots a 2nd apart',
          html: '<p>No common tones, and every voice moving the same way is a recipe for parallels. With both chords in root position:</p>' +
            '<div class="rule">Move the <b>three upper voices in contrary motion to the bass</b>: bass up, upper voices down (or the reverse).' +
            '<p class="why"><b>Why:</b> the bass moves by step, say F to G. The voice doubling its root would follow it a step up, F to G, and make parallel octaves with the bass. The voice on its fifth would go C to D, parallel 5ths. Moving down against the bass prevents both.</p></div>' +
            '<p>With an inversion, full contrary motion isn’t always possible. Aim for the smoothest connection that avoids bad spacing, bad doubling and parallel perfect intervals.</p>' +
            '<div class="rule guide"><b>The escape: double the fifth.</b> If every way to double the root makes parallels, double the fifth instead.' +
            '<p class="why"><b>Why:</b> doubling the fifth is the second choice of doubling, but parallel 5ths and octaves are a rule. A weaker doubling beats a broken rule.</p></div>',
          examples: [
            { key: 'G', chords: ['IV', 'V6'], voices: [['C3', 'C4', 'G4', 'E5'], ['F#2', 'D4', 'A4', 'D5']], mark: [[0, 1], [0, 2], [1, 1], [1, 2]],
              caption: 'Wrong: parallel 5ths between tenor and alto' },
            { key: 'G', chords: ['IV', 'V6'], voices: [['C3', 'C4', 'G4', 'E5'], ['F#2', 'A3', 'A4', 'D5']],
              caption: 'Right: V6 doubles its fifth, and the parallels are gone' },
          ],
        },
        {
          id: 'checking', title: 'Checking your work',
          html: '<ol><li>Each chord: right notes? third present? good doubling? spacing within an octave on top? voices in order and in range?</li>' +
            '<li>Each connection: check all six pairs of voices for parallel 5ths and octaves.</li>' +
            '<li>Each line: mostly steps, no leaps over a 5th in the upper voices, no 7ths in the bass, no augmented intervals.</li>' +
            '<li>Sing every part.</li></ol>',
        },
      ],
    },

    // ---------------- Unit IV: Non-Chord Tones and Seventh Chords ----------------
    {
      id: 'nct-1', book: 'Murray Unit IV · Lesson 1 · pp. 29–30 · Exercises IV.1 (pp. 119–122)',
      title: 'Non-Chord Tones I',
      intro: 'Notes that aren’t in the chord decorate the surface of the music and make the lines more melodic and more rhythmic. Name them by their <b>contour</b>: how the note is approached and how it is left.',
      sections: [
        {
          id: 'what', title: 'What makes a non-chord tone',
          html: '<ul><li>A non-chord tone (NCT) usually sits <b>between two chord tones</b>, and the chord tone after it <b>resolves</b> the dissonance.</li>' +
            '<li>Most are approached and left by <b>step</b> (or by repeating a note). A note you leap to or from tends to sound like a chord tone, so leaps are rarer.</li>' +
            '<li>Most fall <b>off the beat</b> (unaccented). Accented NCTs, on the beat, are common too.</li>' +
            '<li>Deciding which notes belong to the chord is partly a matter of ear, and musicians sometimes disagree.</li></ul>' +
            '<p class="why"><b>Why composers use them:</b> chord tones alone make blocky, hymn-like lines. Non-chord tones fill the gaps between chord tones, so each voice becomes a real melody and the rhythm gets livelier.</p>',
        },
        {
          id: 'identify', title: 'Naming one, step by step',
          html: '<ol><li><b>Is it in the chord?</b> Spell the chord sounding with the note. If the note is one of its members, it is a chord tone, not an NCT.</li>' +
            '<li><b>How does the line get to it?</b> By step, by leap, or by repeating (holding) a note.</li>' +
            '<li><b>How does the line leave it?</b> By step, by leap, or by repeating a note.</li>' +
            '<li><b>Same direction or a turn?</b> In and out by step in one direction is a passing tone; out and back is a neighbor.</li>' +
            '<li><b>On the beat or off?</b> Most are off the beat. On the beat, say “accented” (an accented passing tone). An NCT held over from the last chord, on the beat, is a suspension.</li></ol>' +
            '<table class="learn-table"><tr><th>In</th><th>Out</th><th>Name</th></tr>' +
            '<tr><td>step</td><td>step, same direction</td><td>passing (p)</td></tr>' +
            '<tr><td>step</td><td>step back</td><td>neighbor (n)</td></tr>' +
            '<tr><td>step</td><td>repeated (the next chord catches up)</td><td>anticipation (ant)</td></tr>' +
            '<tr><td>leap</td><td>step, other direction</td><td>appoggiatura (app)</td></tr>' +
            '<tr><td>step</td><td>leap, other direction</td><td>escape tone (e)</td></tr>' +
            '<tr><td>held from the last chord</td><td>step down</td><td>suspension (s)</td></tr>' +
            '<tr><td>held from the last chord</td><td>step up</td><td>retardation (ret)</td></tr></table>',
        },
        {
          id: 'passing', title: 'Passing tone (p)',
          html: '<p>Step in, step on in the <b>same direction</b>. It fills the gap of a 3rd between two chord tones (mi–<b>fa</b>–sol). On the beat it’s an accented passing tone. Two in a row can fill a 4th (sol–<b>fa–mi</b>–re).</p>' +
            '<p class="why"><b>Don’t confuse it with:</b> a neighbor. If the line turns around after the note, it isn’t passing.</p>',
          examples: [{ key: 'C', nct: 'PT' }],
        },
        {
          id: 'neighbor', title: 'Neighbor tone (n)',
          html: '<p>Step away and <b>step back</b> to the same note (sol–<b>la</b>–sol, or sol–<b>fa</b>–sol). Upper and lower neighbors in a row, around one chord tone, are <b>double neighbors</b> (dn), also called changing tones.</p>' +
            '<p class="why"><b>Hear it as:</b> a decoration of one note. Take the neighbor away and the line just repeats.</p>',
          examples: [{ key: 'C', nct: 'NT' }],
        },
        {
          id: 'anticipation', title: 'Anticipation (ant)',
          html: '<p>A note of the <b>next</b> chord that arrives early. It is usually approached by step and then <b>repeated</b> when the chord catches up. It’s common in the soprano just before a cadence (re–<b>do</b>–do).</p>',
          examples: [{ key: 'C', nct: 'ANT' }],
        },
        {
          id: 'appoggiatura', title: 'Appoggiatura (app)',
          html: '<p><b>Leap in, step out</b> the other way. It is usually accented: a leap up to a dissonance that then steps down to the chord tone.</p>' +
            '<p class="why"><b>Why it’s rarer:</b> the ear tends to hear a note you leap to as a chord tone. An appoggiatura works because it lands on the beat and leans clearly into its resolution.</p>',
          examples: [{ key: 'C', nct: 'APP' }],
        },
        {
          id: 'escape', title: 'Escape tone (e)',
          html: '<p>The reverse of an appoggiatura: <b>step out, leap back</b> the other way. It is unaccented and rare, a dissonance left “dangling”.</p>',
          examples: [{ key: 'C', nct: 'ET' }],
        },
        {
          id: 'pedal', title: 'Pedal tone (ped)',
          html: '<p>A note, usually in the <b>bass</b>, that holds while the harmonies change above it. It becomes dissonant against some of them and doesn’t resolve in the usual way. The name comes from the organ’s pedals.</p>',
        },
        {
          id: 'labels', title: 'Labels to use',
          html: '<table class="learn-table"><tr><th>NCT</th><th>Label</th><th>In</th><th>Out</th></tr>' +
            '<tr><td>Passing tone</td><td>p</td><td>step</td><td>step, same direction</td></tr>' +
            '<tr><td>Neighbor tone</td><td>n</td><td>step</td><td>step back</td></tr>' +
            '<tr><td>Double neighbor</td><td>dn</td><td>step</td><td>by way of the other neighbor</td></tr>' +
            '<tr><td>Anticipation</td><td>ant</td><td>step (usually)</td><td>repeated</td></tr>' +
            '<tr><td>Appoggiatura</td><td>app</td><td>leap</td><td>step, other direction</td></tr>' +
            '<tr><td>Escape tone</td><td>e</td><td>step</td><td>leap, other direction</td></tr>' +
            '<tr><td>Pedal tone</td><td>ped</td><td>held</td><td>held</td></tr></table>' +
            '<p>In analysis, circle the non-chord tone and write its label beside it.</p>',
        },
      ],
    },
    {
      id: 'nct-2', book: 'Murray Unit IV · Lesson 2 · pp. 31–32 · Exercises IV.2 (pp. 123–126)',
      title: 'Non-Chord Tones II: Suspensions',
      intro: 'In an anticipation the note comes early. In a suspension it comes late: one voice holds on while the chord changes under it.',
      sections: [
        {
          id: 'suspension', title: 'The three parts',
          html: '<ol><li><b>Preparation</b>: a consonant chord tone in the first chord.</li>' +
            '<li><b>Suspension</b>: the same note, held or repeated into the next chord, where it is dissonant. It falls <b>on the beat</b>.</li>' +
            '<li><b>Resolution</b>: a step <b>down</b> to a chord tone, on a weaker part of the beat.</li></ol>' +
            '<p>All three must be in the <b>same voice</b>. Only the middle note is a non-chord tone, so it is the one you circle (s).</p>' +
            '<p class="why"><b>Why it’s expressive:</b> the dissonance lands on the strong beat, and the ear waits for it to resolve. An anticipation is a note that comes early; a suspension is a chord tone that comes late.</p>',
          examples: [{ key: 'C', nct: 'SUS' }],
        },
        {
          id: 'types', title: 'Naming suspensions by figures',
          html: '<p>A suspension is named by two intervals <b>above the bass</b>: the dissonance, then its resolution.</p>' +
            '<table class="learn-table"><tr><th>Type</th><th>What happens</th></tr>' +
            '<tr><td>4–3</td><td>a 4th above the bass falls to a 3rd</td></tr>' +
            '<tr><td>7–6</td><td>a 7th falls to a 6th (usually over a first-inversion chord)</td></tr>' +
            '<tr><td>9–8</td><td>a 9th falls to an octave (2–1 when it’s within the octave)</td></tr>' +
            '<tr><td>2–3</td><td>a suspension in the <b>bass</b>: the bass falls, so the interval above it grows from a 2nd to a 3rd</td></tr></table>' +
            '<p>Because figures measure from the bass, a 4–3 can resolve to the chord’s third (root position) or to its fifth (first inversion).</p>' +
            '<p><b>Naming one:</b> count from the bass up to the suspended note, then to its resolution. Reduce compound intervals to within the octave (an 11th counts as a 4th), except the 9–8, which keeps its 9 so you can tell it from a 2–1.</p>' +
            '<p class="why"><b>Why the 2–3 is always in the bass:</b> in every other type the upper voice falls and the interval shrinks (4 to 3, 7 to 6). When the bass falls, the interval above it grows, from a 2nd to a 3rd.</p>',
        },
        {
          id: 'doubling', title: 'Writing suspensions',
          html: '<ul><li>Don’t double the <b>note of resolution</b> in another voice. It weakens the resolution, and on the beat it clashes with the suspension. The exception is the 9–8, which by its nature resolves to the bass note’s octave.</li>' +
            '<li>Imagine the complete chord on the beat, even though one of its notes arrives late.</li>' +
            '<li>Suspension figures already show the inversion (7–6 means a 6 chord), so you don’t write a separate 6.</li></ul>',
        },
        {
          id: 'retardation', title: 'Retardation (ret)',
          html: '<p>A suspension that resolves <b>up</b> by step, often ti held over and rising to do. It is more common in the Classical era than in Bach.</p>',
          examples: [{ key: 'C', nct: 'RET' }],
        },
      ],
    },
    {
      id: 'sevenths', book: 'Murray Unit IV · Lesson 3 · pp. 33–34 · Exercises IV.3 (pp. 127–130)',
      title: 'Seventh Chords',
      intro: 'Stack one more 3rd on a triad and you get a seventh chord: four different notes, with a 7th from the root to the top.',
      sections: [
        {
          id: 'inversions', title: 'Inversions and figures',
          html: '<table class="learn-table"><tr><th>In the bass</th><th>Position</th><th>Full figures</th><th>Short</th></tr>' +
            '<tr><td>root</td><td>root position</td><td>7 5 3</td><td>7</td></tr>' +
            '<tr><td>3rd</td><td>first inversion</td><td>6 5 3</td><td>6/5</td></tr>' +
            '<tr><td>5th</td><td>second inversion</td><td>6 4 3</td><td>4/3</td></tr>' +
            '<tr><td>7th</td><td>third inversion</td><td>6 4 2</td><td>4/2</td></tr></table>' +
            '<p>Use “7” <b>only for root position</b>. An inverted seventh chord has no 7th above its bass.</p>' +
            '<p><b>Naming one, step by step:</b></p>' +
            '<ol><li>Rearrange the notes into a stack of 3rds. The bottom note of the stack is the <b>root</b>.</li>' +
            '<li>See which chord member is in the bass: root (7), third (6/5), fifth (4/3) or seventh (4/2).</li>' +
            '<li>Measure the 3rds of the stack to find the quality (below).</li></ol>' +
            '<p class="why"><b>Tip:</b> in an inverted seventh chord, look for the 2nd between two notes. The upper note of that 2nd is the root, and the lower note is the 7th.</p>',
          examples: [{ key: 'C', chords: ['V7', 'I', 'V6/5', 'I', 'V4/3', 'I', 'V4/2', 'I6'], caption: 'V7 in each position, each resolving to I', beat: 0.75 }],
        },
        {
          id: 'qualities', title: 'The five qualities',
          html: '<p>Quality is the triad’s quality plus the 7th’s. Learn them as stacks of thirds:</p>' +
            '<table class="learn-table"><tr><th>Name</th><th>Also called</th><th>Thirds, bottom up</th><th>On F</th></tr>' +
            '<tr><td>Major 7th</td><td>major–major</td><td>M3 m3 M3</td><td>FM7</td></tr>' +
            '<tr><td>Dominant 7th</td><td>major–minor</td><td>M3 m3 m3</td><td>F7</td></tr>' +
            '<tr><td>Minor 7th</td><td>minor–minor</td><td>m3 M3 m3</td><td>f7</td></tr>' +
            '<tr><td>Half-diminished 7th</td><td>diminished–minor</td><td>m3 m3 M3</td><td>fø7</td></tr>' +
            '<tr><td>Fully diminished 7th</td><td>diminished–diminished</td><td>m3 m3 m3</td><td>f°7</td></tr></table>' +
            '<p><b>Letter-name symbols</b> (the workbook’s key): <b>GM7</b> major 7th, <b>G7</b> dominant 7th, <b>g7</b> minor 7th, <b>gø7</b> half-diminished, <b>g°7</b> fully diminished. Upper or lower case gives the triad (major, or minor/diminished); the sign after it gives the 7th.</p>' +
            '<table class="learn-table"><tr><th></th><th>1</th><th>2</th><th>3</th><th>4</th><th>5</th><th>6</th><th>7</th></tr>' +
            '<tr><td>Major</td><td>IM7</td><td>ii7</td><td>iii7</td><td>IVM7</td><td>V7</td><td>vi7</td><td>viiø7</td></tr>' +
            '<tr><td>Minor</td><td>i7</td><td>iiø7</td><td>IIIM7</td><td>iv7</td><td>V7</td><td>VIM7</td><td>vii°7</td></tr></table>' +
            '<p>Only one chord in each key is a dominant 7th: <b>V7</b>. In minor it needs the raised leading tone, and so does vii°7.</p>' +
            '<p class="why"><b>Why spell by 3rds:</b> memorize which 3rds are major (four half steps) and minor (three), and you can build or name any chord without memorizing chords.</p>',
          examples: [{ key: 'C', labels: ['FM7', 'F7', 'f7', 'fø7', 'f°7'],
            voices: [['F2', 'A3', 'C4', 'E4'], ['F2', 'A3', 'C4', 'Eb4'], ['F2', 'Ab3', 'C4', 'Eb4'], ['F2', 'Ab3', 'Cb4', 'Eb4'], ['F2', 'Ab3', 'Cb4', 'Ebb4']],
            caption: 'The five qualities built on F', beat: 1.2 }],
        },
      ],
    },

    // ---------------- Unit V: Functional Harmony ----------------
    {
      id: 'sevenths-4v', book: 'Murray Unit V · Lesson 1 · pp. 35–36 · Exercises V.1 (pp. 131–134)',
      title: 'Writing Seventh Chords in Four Voices',
      intro: 'The 7th of a chord began life as a non-chord tone, and it still behaves like one: it comes in carefully and resolves <b>down by step</b>.',
      sections: [
        {
          id: 'approach', title: 'Approach and resolve the 7th',
          html: '<p>The <b>chordal 7th</b> is the note a 7th above the chord’s root (in V7, built on sol, it is fa). It is a dissonance: it clashes with the root, and the ear wants it to move.</p>' +
            '<div class="rule">Approach the chordal 7th by <b>step or by a held note</b>. Resolve it <b>down by step</b> into the next chord.' +
            '<p class="why"><b>Why:</b> a dissonance sounds intended when it is reached smoothly and settles to a consonance. Leaping to it, or moving it up, makes it sound like a wrong note.</p></div>' +
            '<p>In V7 the 7th is <b>fa</b>, and it falls to <b>mi</b>. Its approach usually imitates a non-chord tone:</p>' +
            '<ul><li><b>suspension</b>: the 7th is held over from the chord before;</li>' +
            '<li><b>passing</b>: it steps in from above (sol–fa–mi);</li>' +
            '<li><b>neighbor</b>: it steps up from its resolution note and back down;</li>' +
            '<li><b>appoggiatura</b>: it is leapt to, then resolves down (the least smooth; use sparingly).</li></ul>',
          examples: [
            { key: 'C', chords: ['I', 'ii6/5', 'V', 'I'], caption: 'Like a suspension: ii6/5’s 7th (do) is held from I, then steps down to ti' },
            { key: 'C', chords: ['V', 'V7', 'I'], voices: [['G2', 'B3', 'D4', 'G4'], ['G2', 'B3', 'D4', 'F4'], ['C3', 'C4', 'C4', 'E4']], mark: [[1, 3]],
              caption: 'Like a passing tone: sol–fa–mi in the soprano' },
            { key: 'C', chords: ['I', 'V4/3', 'I'], voices: [['C3', 'G3', 'E4', 'C5'], ['D3', 'G3', 'F4', 'B4'], ['C3', 'G3', 'E4', 'C5']], mark: [[1, 2]],
              caption: 'Like a neighbor: mi–fa–mi in the alto' },
            { key: 'C', chords: ['I6', 'V4/3', 'I'], voices: [['E3', 'C4', 'G4', 'C5'], ['D3', 'B3', 'G4', 'F5'], ['C3', 'C4', 'G4', 'E5']], mark: [[1, 3]],
              caption: 'Like an appoggiatura: the soprano leaps up to fa, then falls to mi' },
          ],
        },
        {
          id: 'doubling', title: 'Leaving out the fifth',
          html: '<p>A seventh chord already has four notes, so normally nothing is doubled. But:</p>' +
            '<ul><li>In <b>dominant, major and minor 7ths</b> you may <b>leave out the fifth and double the root</b>. Their fifth is a perfect 5th, already strong in the root’s overtones, so you hardly miss it.</li>' +
            '<li><b>Half- and fully diminished 7ths</b> need their (diminished) fifth: keep all four notes.</li>' +
            '<li>Never double the 7th or the leading tone.</li></ul>' +
            '<p class="why"><b>Why the fifth can go:</b> a perfect 5th is already strong in the root’s overtones, so the chord sounds nearly the same without it. A diminished 5th is not; leave it out and the chord loses its identity.</p>',
        },
        {
          id: 'tritone', title: 'Resolving the tritone in V7',
          html: '<p>The 3rd and 7th of V7 (<b>ti</b> and <b>fa</b>) form a tritone, the chord’s engine. Resolve it according to its spelling:</p>' +
            '<ul><li>a <b>diminished 5th</b> (ti below fa) resolves <b>inward</b> to a 3rd: ti–do, fa–mi;</li>' +
            '<li>an <b>augmented 4th</b> (fa below ti) resolves <b>outward</b> to a 6th.</li></ul>' +
            '<p class="why"><b>Why:</b> the tritone is what makes V7 restless. Each of its notes is a half step from a note of the tonic triad (ti–do, fa–mi), and moving both by that half step is what makes the resolution sound inevitable.</p>' +
            '<p>Root-position V7 to root-position I can’t resolve every tendency tone and keep complete chords, so one chord loses its fifth: either an incomplete V7 (root doubled) goes to a complete I, or a complete V7 goes to an incomplete I with a tripled root.</p>',
          examples: [
            { key: 'C', chords: ['V6/5', 'I'], voices: [['B2', 'G3', 'D4', 'F4'], ['C3', 'G3', 'C4', 'E4']], mark: [[0, 0], [0, 3], [1, 0], [1, 3]],
              caption: 'd5 (ti below fa) closes in to a 3rd (do–mi)' },
            { key: 'C', chords: ['V7', 'I'], voices: [['G2', 'F3', 'B3', 'D4'], ['C3', 'E3', 'C4', 'C4']], mark: [[0, 1], [0, 2], [1, 1], [1, 2]],
              caption: 'A4 (fa below ti) opens out to a 6th; I has a tripled root' },
          ],
        },
      ],
    },
    {
      id: 'function', book: 'Murray Unit V · Lesson 2 · pp. 37–39 · Exercises V.2 (pp. 135–138)',
      title: 'Harmonic Function and Roman Numerals',
      intro: 'A letter name says what a chord is. A Roman numeral says what it <b>does</b> in the key. C major is IV in G, I in C and V in F.',
      sections: [
        {
          id: 'numerals', title: 'Roman numerals',
          html: '<ul><li>The numeral is the scale degree of the chord’s <b>root</b>.</li>' +
            '<li><b>Uppercase</b> means major (or augmented: III+); <b>lowercase</b> means minor (or diminished: vii°).</li>' +
            '<li>Figures after the numeral show the inversion: IV6, V6/5.</li></ul>' +
            '<table class="learn-table"><tr><th>Degree</th><th>Name</th><th>Major</th><th>Minor</th></tr>' +
            '<tr><td>1</td><td>tonic</td><td>I</td><td>i</td></tr>' +
            '<tr><td>2</td><td>supertonic</td><td>ii</td><td>ii°</td></tr>' +
            '<tr><td>3</td><td>mediant</td><td>iii</td><td>III</td></tr>' +
            '<tr><td>4</td><td>subdominant</td><td>IV</td><td>iv</td></tr>' +
            '<tr><td>5</td><td>dominant</td><td>V</td><td>V</td></tr>' +
            '<tr><td>6</td><td>submediant</td><td>vi</td><td>VI</td></tr>' +
            '<tr><td>7</td><td>leading tone</td><td>vii°</td><td>vii°</td></tr></table>' +
            '<p class="why"><b>Why numerals:</b> a letter name (C6) says what a chord is. A numeral says what it does, and that stays the same in every key: V goes to I in C, in A♭ and in f♯ minor.</p>',
          examples: [{ key: 'G', chords: ['I', 'IV6', 'V', 'IV6', 'I', 'V', 'I'], caption: 'I–IV6–V–IV6–I–V–I' }],
        },
        {
          id: 'minor', title: 'Chords in minor',
          html: '<p>Minor borrows from two forms of the scale. The <b>dominant</b> and <b>leading-tone</b> chords use the raised 7th (the leading tone: <b>ti</b> with do-based minor, <b>si</b> with la-based), so V is major and vii° diminished. The <b>mediant</b> keeps the lowered 7th (the subtonic), so III is major.</p>',
          examples: [{ key: 'A minor', chords: ['I', 'III', 'VI', 'IV', 'vii°6', 'I', 'V', 'I'], caption: 'i–III–VI–iv–vii°6–i–V–i' }],
        },
        {
          id: 'many-keys', title: 'One chord, many keys',
          html: '<p>Every triad belongs to several keys, with a different numeral in each. In minor, use the usual qualities: <b>i, ii°, III, iv, V, VI, vii°</b>.</p>' +
            '<table class="learn-table"><tr><th>Chord</th><th>Its keys and numerals</th></tr>' +
            '<tr><td>d (D minor)</td><td>d: i · a: iv · C: ii · B♭: iii · F: vi</td></tr>' +
            '<tr><td>F (F major)</td><td>F: I · C: IV · B♭: V · d: III · b♭: V · a: VI</td></tr>' +
            '<tr><td>b° (B diminished)</td><td>C: vii° · a: ii° · c: vii°</td></tr></table>' +
            '<p><b>Finding them:</b> a major triad can be I, IV or V in a major key, and III, V or VI in a minor key. A minor triad can be ii, iii or vi in major, and i or iv in minor. A diminished triad is vii° in major, or ii° or vii° in minor. For each slot, count down from the root to find the tonic.</p>' +
            '<p class="why"><b>Why it matters:</b> this is how a chord can pivot from one key to another in a modulation, and how you work out the key of a passage from its chords.</p>',
        },
        {
          id: 'tendency', title: 'Stability and tendency',
          html: '<p>The <b>tonic</b> note (do) is the most stable pitch in a key, and the tonic triad (I) is the most stable chord. Its members, <b>do, mi and sol</b>, are the stable scale degrees: a melody can stop on them.</p>' +
            '<p>The other degrees are unstable. Each one <b>leans by step</b> toward the nearest stable note:</p>' +
            '<table class="learn-table"><tr><th>Unstable</th><th>Leans to</th><th>How strongly</th></tr>' +
            '<tr><td>ti (leading tone)</td><td>do, up a half step</td><td>very strong</td></tr>' +
            '<tr><td>fa</td><td>mi, down a half step</td><td>strong</td></tr>' +
            '<tr><td>la</td><td>sol, down a step</td><td>moderate</td></tr>' +
            '<tr><td>re</td><td>do (or mi)</td><td>moderate</td></tr></table>' +
            '<p>In minor, do-based syllables keep do as the tonic, with me and le in place of mi and la (le leans down to sol). With la-based syllables the tonic is la, so the stable notes are la, do and mi, and the leading tone is si.</p>' +
            '<p>A <b>tendency tone</b> is a note whose pull is strong enough that the style expects it to go there. In part writing these are:</p>' +
            '<ul><li>the <b>leading tone</b>, which goes up to do (in V, V7 and vii°);</li>' +
            '<li>the <b>7th of a seventh chord</b>, which goes down by step (fa to mi in V7);</li>' +
            '<li><b>chromatic notes</b>, which keep going the way their accidental pushed them (a raised note up, a lowered note down);</li>' +
            '<li>in a <b>Phrygian</b> cadence, the 6th degree in the bass, which goes down a half step to sol.</li></ul>' +
            '<p>That is why you never double one (two voices would have to move to the same note), and why the leading tone and the 7th have resolution rules. The half steps are the strongest pulls: ti–do and fa–mi.</p>' +
            '<p>Chords lean too. Harmony moves away from the tonic and back, through subdominant and dominant chords.</p>',
        },
        {
          id: 'root-motion', title: 'Progressive and retrogressive root motion',
          html: '<table class="learn-table"><tr><th>Progressive (forward)</th><th>Retrogressive (backward)</th></tr>' +
            '<tr><td>down a 5th / up a 4th: the strongest</td><td>up a 5th / down a 4th</td></tr>' +
            '<tr><td>up a 2nd</td><td>down a 2nd</td></tr>' +
            '<tr><td>down a 3rd</td><td>up a 3rd</td></tr></table>' +
            '<p>Retrogressive motion happens in real music, but it gives little sense of direction. Avoid it near the beginning and end of a phrase.</p>' +
            '<p class="why"><b>Why down a 5th is strongest:</b> the root of the first chord becomes the fifth of the next, so the first chord sounds like the second one’s dominant. V–I is the model; every falling 5th echoes it.</p>',
          examples: [{ key: 'G', chords: ['I', 'IV', 'vii°6', 'iii', 'vi', 'ii', 'V', 'I'], caption: 'Every root falls a 5th: the circle of fifths', beat: 0.75 }],
        },
        {
          id: 'categories', title: 'Function categories',
          html: '<table class="learn-table"><tr><th>Function</th><th>Chords</th><th>Tends to go</th></tr>' +
            '<tr><td><b>Tonic</b> (T)</td><td>I (i)</td><td>anywhere: the goal</td></tr>' +
            '<tr><td><b>Pre-dominant</b> (PD)</td><td>IV (iv), ii (ii°)</td><td>to dominant</td></tr>' +
            '<tr><td><b>Dominant</b> (D)</td><td>V, vii°</td><td>to tonic</td></tr>' +
            '<tr><td><b>Mediant</b></td><td>iii (III), vi (VI)</td><td>neutral, no strong pull</td></tr></table>' +
            '<p>A typical phrase: <b>T → PD → D → T</b>. (Elsewhere you’ll see vi called a tonic substitute, which is what it does in a deceptive cadence.)</p>',
          examples: [{ key: 'C', chords: ['I', 'ii6', 'V', 'I'], caption: 'T – PD – D – T' }],
        },
      ],
    },
    {
      id: 'cadences', book: 'Murray Unit V · Lesson 3 · pp. 40–42 · Exercises V.3 (pp. 139–142)',
      title: 'Harmonic Cadences',
      intro: 'A melody ends a phrase either <b>finally</b> (on do) or <b>non-finally</b> (anywhere else). The harmony under those last notes makes a <b>harmonic cadence</b>, named for the last two chords.',
      sections: [
        {
          id: 'melodic', title: 'Final and non-final',
          html: '<p>Sing the last two notes of a phrase’s melody. A <b>final</b> ending, such as re–do (2–1) or ti–do (7–1), sounds closed. A <b>non-final</b> ending, such as do–ti (8–7) or re–mi, leaves you waiting for more.</p>' +
            '<p>The harmony underneath makes the ending stronger or weaker. Re–do over V–I, with the bass going sol–do, is as final as music gets: the melody and the bass resolve together.</p>',
        },
        {
          id: 'authentic', title: 'Authentic: PA and IA',
          html: '<p>Dominant to tonic. It is a <b>perfect authentic</b> cadence (PA) only when all three are true:</p>' +
            '<ol><li>the chords are V (or V7) and I, <b>both in root position</b> (bass sol–do);</li>' +
            '<li>the soprano ends on <b>do</b>;</li>' +
            '<li>it’s V, not vii°.</li></ol>' +
            '<p>Anything else from dominant to tonic is an <b>imperfect authentic</b> cadence (IA): an inverted chord, vii° in place of V, or a soprano ending on mi or sol. In this app’s ear training an IA is V–I with the soprano on mi.</p>' +
            '<table class="learn-table"><tr><th>Chords</th><th>Soprano</th><th>Cadence</th></tr>' +
            '<tr><td>V – I</td><td>2–1 (re–do)</td><td>PA</td></tr>' +
            '<tr><td>V – i</td><td>7–8 (ti–do)</td><td>PA</td></tr>' +
            '<tr><td>V – I</td><td>5–3 (sol–mi)</td><td>IA: ends on mi</td></tr>' +
            '<tr><td>V – I</td><td>2–3 (re–mi)</td><td>IA: ends on mi</td></tr>' +
            '<tr><td>V6 – I</td><td>2–1</td><td>IA: V is inverted</td></tr>' +
            '<tr><td>vii°6 – I</td><td>any</td><td>IA: leading-tone chord</td></tr></table>' +
            '<p class="why"><b>Why the soprano matters:</b> the soprano is the line everyone hears. If it stops on mi or sol, the harmony has arrived home but the melody hasn’t.</p>',
          examples: [{ key: 'F', chords: ['I', 'IV', 'V', 'I'], end: 0, caption: 'PA: root position, soprano ends on do' },
            { key: 'F', chords: ['I', 'IV', 'V', 'I'], end: 2, caption: 'IA: the soprano ends on mi' }],
        },
        {
          id: 'half', title: 'Half (H)',
          html: '<p>The phrase stops on <b>V</b> (rarely V7). It’s usually approached from a pre-dominant, sometimes straight from I. It sounds like a comma, a question waiting for an answer.</p>',
          examples: [{ key: 'F', chords: ['I', 'vi', 'ii6', 'V'], caption: 'H: ending on V' }],
        },
        {
          id: 'phrygian', title: 'Phrygian half (Ph)',
          html: '<p>A special half cadence, in <b>minor only</b>: <b>iv6 – V</b>. The bass falls a half step from the 6th degree to the 5th (le–sol with do-based minor, fa–mi with la-based) while an upper voice, often the soprano, climbs a step from the 4th degree to the 5th (fa–sol, or re–mi). The name comes from the Phrygian mode’s half step at the bottom of the scale.</p>',
          examples: [{ key: 'F minor', chords: ['I', 'IV6', 'V'], caption: 'Ph: iv6–V, bass D♭–C' }],
        },
        {
          id: 'deceptive', title: 'Deceptive (D)',
          html: '<p>V sets up the tonic, then goes to <b>vi</b> (VI in minor). The bass steps up from sol to la where you expected do. The submediant shares two notes with the tonic, but its quality is the opposite (minor for major, major for minor), and that’s what makes it deceptive.</p>',
          examples: [{ key: 'F', chords: ['I', 'IV', 'V', 'vi'], caption: 'D in major: V–vi' },
            { key: 'C minor', chords: ['I', 'IV', 'V', 'VI'], caption: 'D in minor: V–VI with the third doubled' }],
        },
        {
          id: 'plagal', title: 'Plagal (Pl)',
          html: '<p><b>IV – I</b> (sometimes iv – i), the “Amen” at the end of a hymn. It’s rare, and it usually comes as a tag after an authentic cadence has already closed the piece.</p>',
          examples: [{ key: 'F', chords: ['I', 'V', 'I', 'IV', 'I'], caption: 'Authentic cadence, then the plagal “Amen”' }],
        },
        {
          id: 'identify', title: 'Naming a cadence, step by step',
          html: '<ol><li>Find the key, then put Roman numerals on the <b>last two chords</b>.</li>' +
            '<li>Ends on <b>V</b>? It is a <b>half</b> cadence (H). If it is iv6–V in minor, it is a <b>Phrygian</b> half (Ph).</li>' +
            '<li><b>V (or vii°) to I</b>? It is authentic. Both chords in root position, V not vii°, and the soprano on do: <b>PA</b>. Otherwise <b>IA</b>.</li>' +
            '<li><b>V to vi</b> (VI in minor)? <b>Deceptive</b> (D).</li>' +
            '<li><b>IV to I</b> (iv–i)? <b>Plagal</b> (Pl).</li></ol>' +
            '<p>The workbook’s abbreviations: <b>PA, IA, H, Ph, D, Pl</b>. The app’s ear-training buttons say PAC, IAC, HC and so on; they mean the same cadences.</p>',
        },
        {
          id: 'partwriting', title: 'Partwriting at the cadence',
          html: '<div class="rule"><b>Resolve the tendency tones at a cadence.</b> The leading tone goes up to do; the 7th of V7 goes down by step.' +
            '<p class="why"><b>Why:</b> the cadence is where the listener expects the pull to be answered. An unresolved leading tone in the soprano or bass is heard at once.</p></div>' +
            '<ul><li><b>V(7)–I:</b> the leading tone goes up to the tonic and the 7th goes down to the 3rd (in major, ti–do and fa–mi). With both chords in root position, one of them must leave out its fifth (see Unit V, Lesson 1). The other choice is to “frustrate” the leading tone: let it drop to sol. That is allowed <b>only in an inner voice</b>. In the soprano or bass, ti must go to do.</li>' +
            '<li><b>Phrygian:</b> the bass of iv6 (the 6th degree: le, or fa with la-based minor) is a tendency tone. Don’t double it; it can only go down to sol. Doubled, it leads to parallel octaves, an augmented 2nd or a tritone.</li>' +
            '<li><b>Deceptive in minor:</b> double the <b>third</b> of VI (the tonic note: do, or la with la-based minor). Otherwise you get parallels or an augmented 2nd from the 6th degree up to the leading tone.</li></ul>',
        },
      ],
    },
  ];

  // Terms that get a pop-up definition where they first appear in a
  // section. match: a case-insensitive pattern; see: where to read more.
  var TERMS = {
    triad: { match: 'triads?', def: 'Three notes stacked in 3rds: a root, a third above it and a fifth above it. C–E–G is the C major triad.', see: 'chorale#members' },
    root: { match: 'roots?', def: 'The note a chord is built on and named after. In C–E–G the root is C, wherever the C is placed.', see: 'chorale#members' },
    member: { match: 'chord members?|chord tones?', def: 'One of the notes that make up a chord: its root, third, fifth (and seventh). Any note not in the chord is a non-chord tone.', see: 'chorale#members' },
    rootpos: { match: 'root[- ]position', def: 'The root is in the bass. No figure after the Roman numeral: I, V, V7.', see: 'chorale#members' },
    inversion: { match: '(first|second|third)[- ]inversion|inversions?|inverted', def: 'Any position with a note other than the root in the bass. First inversion has the third in the bass (6), second inversion the fifth (6/4), and a seventh chord’s third inversion the seventh (4/2).', see: 'chorale#members' },
    sixfour: { match: '6/4 (chord|triad)s?|six-four', def: 'A triad in second inversion: the fifth is in the bass, so the upper notes are a 6th and a 4th above it. Double the bass.', see: 'chorale#doubling' },
    numeral: { match: 'Roman numerals?', def: 'Names a chord by the scale degree of its root (I on do, V on sol). Uppercase is major, lowercase minor, ° diminished, + augmented; figures after it show the inversion.', see: 'chorale#symbols' },
    figures: { match: 'figured bass|figures', def: 'Numbers that show the intervals above the bass note. After a Roman numeral they show the inversion: 6, 6/4, 7, 6/5, 4/3, 4/2.', see: 'connecting-1#figured-bass' },
    quality: { match: 'quality|qualities', def: 'The kind of chord, from the sizes of its 3rds and 5th: major, minor, diminished or augmented (and, for sevenths, the size of the 7th too).', see: 'chorale#symbols' },
    diminished: { match: 'diminished triads?', def: 'Two minor 3rds stacked, so the root and fifth are a diminished 5th (a tritone) apart. vii° in every key and ii° in minor. Double its third.', see: 'chorale#symbols' },
    doubling: { match: 'doubl(e|ed|es|ing)', def: 'Four voices but only three chord members, so two voices sing the same member (in unison or octaves). Which one you double matters.', see: 'chorale#doubling' },
    tendency: { match: 'tendency tones?', def: 'A note with one place it wants to go next: the leading tone up to do, a chord’s 7th down by step, a chromatic note in the direction of its accidental. Never double one.', see: 'function#tendency' },
    leading: { match: 'leading[- ]tones?', def: 'The 7th scale degree, a half step below the tonic: ti (si in la-based minor). It pulls up to do. In minor it needs an accidental to raise it.', see: 'function#tendency' },
    chromatic: { match: 'chromatic(ally)?( altered)?( notes?)?', def: 'A note outside the key signature, raised or lowered with an accidental (fi, si, te…). It tends to keep moving in the direction it was altered.', see: 'function#tendency' },
    seventh: { match: 'chordal 7th|7th of (a|the) seventh chord|7th of V7', def: 'The note a 7th above a seventh chord’s root (fa in V7). It is dissonant, so it is approached smoothly and resolves down by step.', see: 'sevenths-4v#approach' },
    seventhchord: { match: 'seventh chords?', def: 'A triad with one more 3rd on top: root, third, fifth and seventh. V7 (sol–ti–re–fa) is the most common.', see: 'sevenths#qualities' },
    degree: { match: 'scale degrees?|degrees?', def: 'A note’s position in the scale, numbered from the tonic: 1 (do), 2 (re), 3 (mi), 4 (fa), 5 (sol), 6 (la), 7 (ti).', see: 'function#numerals' },
    tonic: { match: 'tonic', def: 'The home note of the key (do), and the chord built on it (I). The most stable note and chord.', see: 'function#categories' },
    dominant: { match: 'dominant', def: 'The 5th scale degree (sol), and the chord built on it (V or V7). It pulls strongly back to the tonic.', see: 'function#categories' },
    subdominant: { match: 'subdominant', def: 'The 4th scale degree (fa), and the chord built on it (IV). It usually leads to the dominant.', see: 'function#categories' },
    predominant: { match: 'pre-?dominants?', def: 'A chord that leads to the dominant: IV (iv) or ii (ii°).', see: 'function#categories' },
    mediant: { match: 'submediant|mediant', def: 'The mediant is the 3rd scale degree and its chord (iii, or III in minor). The submediant is the 6th degree and its chord (vi, or VI).', see: 'function#numerals' },
    subtonic: { match: 'subtonic', def: 'The lowered 7th degree in natural minor, a whole step below the tonic (te with do-based minor, sol with la-based). It does not pull up the way the leading tone does.', see: 'function#minor' },
    motion: { match: '(contrary|oblique|similar|parallel) motion', def: 'How two voices move together: contrary (opposite directions), oblique (one holds), similar (same direction, new interval), parallel (same direction, same interval).', see: 'chorale#motion' },
    parallels: { match: 'parallel (5ths|fifths|octaves|unisons|perfect intervals)|parallels', def: 'Two voices moving in the same direction from one perfect 5th (or octave) to another. They make the voices sound like one, so they are not allowed.', see: 'chorale#motion' },
    perfect: { match: 'perfect intervals?', def: 'The unison, 4th, 5th and octave: the most blended intervals.', see: 'chorale#motion' },
    tritone: { match: 'tritones?', def: 'An interval of three whole steps: an augmented 4th (fa up to ti) or a diminished 5th (ti up to fa). The dissonance at the heart of V7.', see: 'sevenths-4v#tritone' },
    aug2: { match: 'augmented 2nds?', def: 'Three half steps spelled as a 2nd, like le–ti in harmonic minor. It sounds like a minor 3rd but is awkward to sing in this style.', see: 'chorale#melody' },
    harmonicminor: { match: 'harmonic minor', def: 'The natural minor scale with its 7th degree raised to make a leading tone. Its 6th and 7th degrees are an augmented 2nd apart.', see: 'function#minor' },
    spacing: { match: 'spacing', def: 'The gaps between neighboring voices. No more than an octave between soprano and alto, or alto and tenor.', see: 'chorale#spacing' },
    crossing: { match: 'cross(ed|ing)?( voices)?|voice crossing', def: 'A lower voice going above a higher one, like the alto above the soprano.', see: 'chorale#spacing' },
    commontone: { match: 'common tones?', def: 'A note that belongs to both of two neighboring chords. Usually you keep it in the same voice.', see: 'connecting-1#common-tone' },
    voiceleading: { match: 'voice leading|connection', def: 'How each voice moves from one chord to the next. Good voice leading keeps every line smooth and independent.', see: 'connecting-1#common-tone' },
    resolve: { match: 'resol(ve|ves|ved|ution|utions)', def: 'A dissonant or unstable note moving to the note it leans toward, usually by step.', see: 'function#tendency' },
    dissonance: { match: 'dissonan(ce|ces|t)', def: 'An interval or note that sounds tense and wants to move: 2nds, 7ths, the tritone, and the 4th above the bass.', see: 'nct-1#what' },
    cadence: { match: 'cadences?', def: 'The end of a phrase, named for its last two chords: authentic (V–I), half (ends on V), deceptive (V–vi), plagal (IV–I).', see: 'cadences#authentic' },
    phrase: { match: 'phrases?', def: 'A musical sentence: a unit of melody that ends with a cadence.', see: 'cadences#authentic' },
    nct: { match: 'non-chord tones?', def: 'A note that isn’t in the chord sounding with it, usually decorating a line between two chord tones.', see: 'nct-1#what' },
    accented: { match: '(un)?accented', def: 'Accented means on the beat; unaccented means off the beat, between beats.', see: 'nct-1#what' },
    overtone: { match: 'overtone series', def: 'The faint higher pitches inside every note (an octave, a 5th above that, then closer and closer). Their gaps get smaller going up.', see: 'chorale#spacing' },
    incomplete: { match: 'incomplete', def: 'A chord with its fifth left out (the root is doubled or tripled instead). The third must stay.', see: 'sevenths-4v#doubling' },
    satb: { match: 'SATB', def: 'Soprano, alto, tenor, bass: the four voices from top to bottom.', see: 'chorale#texture' },
  };

  // What a missed answer should send you to read.
  var LINKS = {
    rule: {
      range: 'chorale#ranges', spacing: 'chorale#spacing', crossing: 'chorale#spacing', noThird: 'chorale#doubling',
      ltDouble: 'chorale#doubling', par5: 'chorale#motion', par8: 'chorale#motion',
      dbl3: 'chorale#doubling', dimDouble: 'chorale#doubling', dbl64: 'chorale#doubling', leap: 'chorale#melody', augmented: 'chorale#melody', ltRes: 'cadences#partwriting', sevRes: 'sevenths-4v#approach',
    },
    nct: {
      PT: 'nct-1#passing', NT: 'nct-1#neighbor', ANT: 'nct-1#anticipation', APP: 'nct-1#appoggiatura', ET: 'nct-1#escape',
      SUS: 'nct-2#suspension', RET: 'nct-2#retardation',
    },
    cadence: {
      PAC: 'cadences#authentic', IAC: 'cadences#authentic', HC: 'cadences#half', Ph: 'cadences#phrygian', DC: 'cadences#deceptive', PC: 'cadences#plagal',
    },
  };

  // 'page' or 'page#section' -> { page, section } (section null for a page).
  function find(ref) {
    var parts = String(ref || '').split('#');
    var page = PAGES.filter(function (p) { return p.id === parts[0]; })[0];
    if (!page) return null;
    if (!parts[1]) return { page: page, section: null };
    var section = page.sections.filter(function (s) { return s.id === parts[1]; })[0];
    return section ? { page: page, section: section } : null;
  }

  var api = { PAGES: PAGES, LINKS: LINKS, TERMS: TERMS, find: find };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Learn = api;
})(this);
