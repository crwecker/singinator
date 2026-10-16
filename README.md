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

| # | Unit | Covers |
| --- | --- | --- |
| 1 | Foundations | do-mi-sol, then the major scale in C: explore, read, sing, hear, echo |
| 2 | Keys & the Bass Clef | All 15 major key signatures, movable do in any key, bass clef, stepwise sight-singing |
| 3 | Intervals | By ear (up, down, harmonic) and on the staff, including augmented and diminished; sung up and down; inversion; compound intervals |
| 4 | Chords | Triads and sevenths by ear and on the staff, with inversions; sung as arpeggios |
| 5 | Minor | Natural, harmonic and melodic minor, minor key signatures |
| 6 | Chromatic Solfège | di ri fi si li and ra me se le te |
| 7 | C Clefs | Alto and tenor clef, key signatures in all four clefs |
| 8 | Harmony & Cadences | Roman numerals with figured bass; cadences by ear (PAC, IAC, half, plagal, deceptive); harmonic dictation |
| 9 | Secondary Dominants & Modulation | V/x by eye and ear; tonicization; pivot-chord modulation to V, IV and the relative minor; modulating sight-singing that re-solmizes at the pivot |
| 10 | Modes | The seven church modes: explore, name from signature and final, by ear, sung, sight-sung |
| 11 | Beyond Major & Minor | Pentatonic, blues, whole-tone, octatonic, harmonic and melodic minor |
| 12 | Rhythm | Simple and compound meter (2/4–12/8, cut time), from quarters to sixteenths, rests, dots, ties and syncopation; tapped, heard and sung in time |
| 13 | Sight-Singing | Melodies with leaps, minor, chromaticism, any clef; rhythmic sight-singing |
| 14 | Melodic Dictation | Hear a melody, write it on the staff |
| 15 | Two-Part Singing | First-species counterpoint: sing one voice while the app sings the other |

A lesson counts as **mastered** after 8 correct answers in its last 10. Every lesson is open from the start, so advanced students can skip ahead. **Up next** points to the first lesson not yet mastered.

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
- **Counterpoint** (`counterpoint.js`): a cantus firmus generator and a depth-first counterpoint search under first-species rules.
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
| `js/pitch.js` | YIN pitch detection (pure) |
| `js/staff.js` | SVG staff: four clefs, key and time signatures, chords, rhythm, beams, ties |
| `js/sound.js` | Web Audio playback, metronome, microphone input |
| `js/curriculum.js` | The course, as data |
| `js/app.js` | Shared services: progress, settings, pitch meter and listener, microphone handling |
| `js/exercises*.js` | Exercise engines: core, harmony, scales and modes, modulation, rhythm, dictation, two-part |
| `js/main.js` | Navigation, course map, settings, dev panel |
