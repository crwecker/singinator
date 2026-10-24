# Singinator

A course in solfège, sight-singing, ear training and music theory for high-school and college musicians. It starts with do-mi-sol and builds to modulating melodies, harmonic dictation and two-part singing. Students sing into the microphone, and the app listens until they match the pitch.

## Run it

The microphone only works on `localhost` or `https://`, so serve the folder; opening the file directly won't work:

```sh
python3 -m http.server 8000
# then open http://localhost:8000
```

There's no build step and there are no dependencies.

## The course

The units follow the order of a fundamentals-to-harmony theory course (Michael F. Murray's *Essential Materials of Music Theory*), with Singinator's own musicianship units at the end. On the home screen each unit names the Murray lesson(s) it covers, with text pages, and each lesson that mirrors a workbook set says which one (for example *Exercises III.1.3–4*).

| # | Unit | Covers |
| --- | --- | --- |
| | **Fundamentals I** | |
| 1 | Foundations | do-mi-sol, then the major scale in C: explore, read, sing, hear, echo; bass clef names |
| 2 | Intervals | By ear (up, down, harmonic) and on the staff, including augmented and diminished; sung up and down; inversion; compound intervals |
| 3 | Rhythm & Meter | Simple and compound meter (2/4–12/8, cut time), from quarters to sixteenths, rests, dots, ties and syncopation; tapped, heard and sung in time; add beams by the beat, and barlines |
| 4 | Melody & Phrase Structure | Authentic vs. half cadences in a melody; parallel, contrasting or no period, on the staff and by ear; singing the answering phrase |
| | **Fundamentals II** | |
| 5 | Major Keys | All 15 major key signatures, movable do in any key, stepwise sight-singing |
| 6 | Minor | Natural, harmonic and melodic minor, minor key signatures |
| 7 | C Clefs | Alto and tenor clef, key signatures in all four clefs |
| 8 | First-Species Counterpoint | Find the broken rule (parallels, dissonance, hidden 5ths/8ves, bad leaps); sing one voice while the app sings the other; write your own counterpoint over a cantus firmus |
| 9 | Triads & Inversions | Triad qualities and inversions by ear and on the staff; letter symbols (F♯6, c6/4, g°); build a triad from its root, third or fifth; sung as arpeggios |
| | **Four-Voice Writing** | |
| 10 | Chorale Style | Sing the soprano, alto, tenor or bass of a progression; find errors in one chord (range, spacing, crossing, doubling incl. 6/4 and diminished triads) and between chords (awkward leaps, augmented intervals, parallels), like Exercises III.1.3; which triad a bass and figure (6, 6/4) give; write a triad in four voices from its symbol |
| 11 | Connecting Chords I | Name the root relationship (5th, 3rd, 2nd); find errors in 4th/5th-related connections and with the leading tone; figured bass with ♯; write two-chord groups and realize a figured bass |
| 12 | Connecting Chords II | Find errors in 3rd- and 2nd-related connections, then any connection; sing any voice; write 3rd- and 2nd-related pairs |
| | **Non-Chord Tones & Seventh Chords** | |
| 13 | Non-Chord Tones I | Passing, neighbor, anticipation, appoggiatura, escape tone: on the staff, by ear, sung over the chords; write one into a chord pair |
| 14 | Non-Chord Tones II | Suspensions (4–3, 7–6, 9–8) and retardations; any non-chord tone; write a 4–3, 7–6, 9–8 or 2–3 suspension |
| 15 | Seventh Chords | Five qualities by ear and on the staff, with inversions; letter symbols (GM7, gø7, B♭4/3); build one from any member; sung as arpeggios |
| | **Functional Harmony** | |
| 16 | Sevenths in Four Voices | Find unresolved 7ths and leading tones in V7–I; sing a voice through V7; figured bass (7, 6/5, 4/3, 4/2); how a 7th is approached (suspension, passing, neighbor, appoggiatura); write seventh chords in four voices and realize figured basses with sevenths; write three-chord groups approaching the 7th like a given non-chord tone |
| 17 | Harmonic Function & Roman Numerals | Roman numerals with figured bass; progressive vs. retrogressive root motion; label tonic, predominant and dominant on the staff and by ear; write the triad for a numeral or function name in a key; find the key where a chord has a given numeral |
| 18 | Cadences | PAC, IAC, half, Phrygian half, plagal, deceptive by ear and from the score; write the cadence over a given soprano |
| | **Harmonic Function** | |
| 19 | Primary Triads & Sevenths | Partwriting review; I–IV–V dictation; V7, I7 and IV7 |
| 20 | The Submediant & Mediant | Harmonic dictation adding vi and iii, inversions, minor |
| | **Chromatic Harmony & Modulation** | |
| 21 | Chromatic Solfège | di ri fi si li and ra me se le te |
| 22 | Secondary Dominants | V/x by eye and ear; tonicization |
| 23 | Modulation to Closely Related Keys | Pivot-chord modulation to V, IV and the relative minor; modulating sight-singing that re-solmizes at the pivot |
| | **More Musicianship** | |
| 24 | Modes | The seven church modes: explore, name from signature and final, by ear, sung, sight-sung |
| 25 | Beyond Major & Minor | Pentatonic, blues, whole-tone, octatonic, harmonic and melodic minor |
| 26 | Sight-Singing | Melodies with leaps, minor, chromaticism, any clef; rhythmic sight-singing |
| 27 | Melodic Dictation | Hear a melody, write it on the staff |

### Reading (Learn pages)

Units 10–18 (Murray Units III–V) each open with a **Learn** page, written from the book's lessons in our own words. Each page has the book's page numbers and workbook exercises, its rules and guidelines, and four-part examples you can play. Every exercise in those units has a **Read:** link to the section it drills. After a wrong answer, a **Review** link goes to the exact rule you missed, such as parallel 5ths, suspensions or the Phrygian cadence, and **Back** returns to the exercise. Every rule has a short **Why** line. Terms like *tendency tone* or *first inversion* are underlined the first time they appear in a section; tap one for a definition and a link to where it's taught (`Learn.TERMS`). In the examples, a small label beside each note shows its chord member (R, 3, 5, 7), or its solfège syllable (switch at the top of the page). Under each example, a line spells out every chord symbol, for example *vii°6: diminished triad on ti, first inversion*. Chorale Style opens with **Chord members and inversions** and **Reading chord symbols**. The pages live in `js/learn.js`. The photos of the book they were written from are in `content/`, which is git-ignored and stays on your machine (the book is copyrighted).

A lesson counts as **mastered** after 8 correct answers in its last 10. Every lesson is open from the start, so advanced students can skip ahead. **Up next** points to the first lesson not yet mastered.

### Writing exercises

The **Write** lessons put a grand staff in front of you. Tap a staff to place the selected voice (S, A, T, B, or the counterpoint), then adjust it with ↑ ↓ and ♭ ♮ ♯ (or the arrow keys and b / n / #). Given notes are grey. **Check** grades by rule, not against one stored answer, in this order:
1. spelling (letter and accidental) and wrong notes;
2. the bass is the chord member the symbol or figure asks for;
3. complete chords (a triad may drop its fifth only with a tripled root; a dominant, major or minor seventh only with a doubled root; diminished sevenths never);
4. the part-writing rules: range, spacing, crossing, doubling, parallels, leaps, resolutions.

Guidelines (a doubled third, diminished-triad doubling) are pointed out but don't count as wrong. Counterpoint is graded with the first-species rules.

Non-chord tones and suspensions are written into a given chord pair: an unaccented one on the half beat between the chords, or an accented one (appoggiatura, accented passing tone, suspension) by changing a note of the second chord and resolving it on the half beat after. The grader names what you actually wrote (by how it's approached and left, and for suspensions by the figure over the bass), then checks it against the task, the key, augmented leaps, new parallels and the resolved chord. **Beams and barlines** are tapped in between notes and graded by the beat. `test/write-check.html` makes sure the app's own model answers (and right beamings) always pass, that answers the book allows pass, and that common mistakes fail.

## How it works

- **Spelling-aware theory** (`theory.js`):
  - Notes are stored as letter + accidental + octave, so F♯ and G♭ stay different notes. F♯ in C major is *fi*; G♭ is *se*.
  - Intervals (including compound) get their quality from the spelling.
  - Also covers chords, Roman numerals (harmonic-minor V and vii°), secondary dominants, the seven modes, and other scales.
- **Movable do.** **Settings → Minor & modes** chooses which syllable the tonic gets:
  - *Tonic is do* gives do-based minor and modes.
  - *Relative* gives la-based minor, re-based Dorian, sol-based Mixolydian, and so on.
- **Four-part harmony** (`harmony.js`):
  - Progressions follow tonic → predominant → dominant.
  - Voicings come from a dynamic-programming search with complete chords, no doubled leading tone or 7th, and no parallel 5ths or octaves.
  - The same engine plays the key-establishing cadence, with a characteristic progression for each mode.
- **Rhythm** (`rhythm.js`):
  - Rhythms are generated measure by measure from patterns introduced level by level.
  - Notation has beams grouped by beat (in 3s for compound meter), rests, dots, ties, and accidentals that reset at each barline.
  - Tap scoring measures a constant latency (Bluetooth, an early tapper) against the student's own median and removes it.
- **Counterpoint** (`counterpoint.js`): a cantus firmus generator and a depth-first counterpoint search under first-species rules. "Find the error" changes one note of a generated duet until it breaks exactly one rule.
- **Partwriting** (`partwriting.js`): a rule checker (range, spacing, crossing, missing third, doubling (leading tone, root-position thirds, diminished triads, 6/4 chords), parallel 5ths and octaves, awkward and augmented leaps, leading-tone and 7th resolution). The voice-leading search follows the same rules, so generated "no errors" examples really are clean. Error exercises rewrite the second chord of a clean connection until it breaks exactly the rule being asked about.
- **Non-chord tones** (`nct.js`): decorates the soprano of a voiced progression with one non-chord tone of a given type, checked to be a non-chord tone against the chord it sounds over.
- **Phrases** (`phrase.js`): phrases ending in authentic or half cadences, and periods (parallel, contrasting, or two phrases where the second cadence is no stronger).
- **Singing:**
  - Single notes match in any octave.
  - Intervals and melodies anchor to the octave of the first note sung, after which contour counts. **Start over** resets the octave.
  - Singing in time is scored per note by the median pitch inside its time window, skipping the first 30%.
  - Metronome clicks sit above the pitch detector's range.
- **Two-part singing:** the app's part is scheduled on the audio clock. Frames that match the app's own pitch, when that isn't the target, are ignored as speaker bleed. Headphones still work best.

## Microphone troubleshooting

The singing meter shows a **Mic** level bar and a microphone picker.

- **The bar never moves:** the browser is getting silence.
  - Check System Settings → Privacy & Security → Microphone.
  - Pick a different mic in the menu. The app skips virtual inputs like BlackHole and Steam Streaming Microphone automatically.
- **More detail:** add `?debug` to the URL to see the audio context state, the device, the input level and the detected pitch.

## Development

```sh
for t in test/*.test.js; do node $t; done
```

- `theory.test.js`: intervals, keys, syllables in every key and mode, clefs, chords, numerals, scales
- `harmony.test.js`: hundreds of generated progressions, cadences and modulations, re-checked against part-writing rules
- `rhythm.test.js`: measure filling in every meter and level, tap scoring with latency
- `counterpoint.test.js`: generated duets re-checked against first-species rules
- `writing.test.js`: the partwriting checker, one-error connections for every rule, every non-chord tone's approach and resolution, phrase cadences and period types
- `learn.test.js`: every Learn link and rule→section mapping resolves; the examples break rules only where the caption says so; Phrygian cadences; vii° in minor
- `pitch.test.js`: pitch detection from bass (82 Hz) to soprano (784 Hz), quiet and noisy voices

Visual checks:

- `test/staff-grid.html` (served) draws every key signature in all four clefs.
- `?chords=1` draws chord voicings.
- `?rhythm=1`…`?rhythm=4` draws generated rhythms in every meter.

`?dev` adds a panel that feeds a test tone in place of the mic. Use "= target" to sing the current note.

### Files

| File | What it does |
| --- | --- |
| `js/theory.js` | Notes, intervals, keys, modes, solfège, clefs, chords, scales (pure) |
| `js/harmony.js` | Roman-numeral chords, voice leading, progressions, cadences, modulation (pure) |
| `js/rhythm.js` | Meters, rhythm generation, tap scoring (pure) |
| `js/counterpoint.js` | First-species counterpoint (pure) |
| `js/partwriting.js` | Four-part rule checker and error exercises (pure) |
| `js/nct.js` | Non-chord tones in a soprano line (pure) |
| `js/phrase.js` | Phrases, cadences and periods (pure) |
| `js/pitch.js` | YIN pitch detection (pure) |
| `js/staff.js` | SVG staff: four clefs, key and time signatures, chords, rhythm, beams, ties |
| `js/sound.js` | Web Audio playback, metronome, microphone input |
| `js/curriculum.js` | The course, as data |
| `js/learn.js` | The Learn pages and what each missed answer links to, as data |
| `js/learn-view.js` | Draws a Learn page with playable examples |
| `js/app.js` | Shared services: progress, settings, pitch meter and listener, microphone handling |
| `js/exercises*.js` | Exercise engines: core, harmony, scales and modes, modulation, rhythm, dictation, two-part, writing (phrases, counterpoint errors, partwriting, non-chord tones), book (workbook-style drills: figured bass, chord symbols, building chords, numerals and keys, approaching 7ths, cadences from the score), compose (the four-part and counterpoint writer and its grader) |
| `js/main.js` | Navigation, course map, settings, dev panel |
