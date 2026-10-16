# Singinator

A course in solfège, sight-singing and ear training for high-school and college musicians. It starts with do-mi-sol and builds to chromatic melodies in any key and clef. Students sing into the microphone, and the app listens until they match the pitch.

## Run it

The microphone only works on `localhost` or `https://`, so serve the folder; opening the file directly won't work:

```sh
python3 -m http.server 8000
# then open http://localhost:8000
```

There's no build step and there are no dependencies.

## The course

| Unit | Covers |
| --- | --- |
| 1. Foundations | do-mi-sol, then the major scale in C: explore, read, sing, hear, echo |
| 2. Keys & the Bass Clef | Major key signatures (all 15), movable do in any key, bass clef, stepwise sight-singing |
| 3. Intervals | Hearing intervals (ascending, descending, harmonic), reading spelled intervals including augmented and diminished, singing intervals up and down |
| 4. Minor | Natural, harmonic and melodic minor, minor key signatures, singing and hearing in minor |
| 5. Chromatic Solfège | di ri fi si li and ra me se le te: reading, hearing, singing, chromatic passing tones |
| 6. C Clefs | Alto and tenor clef note names, movable do and key signatures in all four clefs |
| 7. Sight-Singing | Generated melodies with leaps, minor, chromaticism, in any key and clef |

A lesson counts as **mastered** after 8 correct answers in its last 10. Every lesson is open from the start, so advanced students can skip ahead. **Up next** points to the first lesson not yet mastered.

## How it works

- **Spelling-aware theory** (`js/theory.js`): notes are stored as letter + accidental + octave, so F♯ and G♭ stay different notes. F♯ in C major is *fi* and G♭ is *se*. Intervals get their quality from the spelling (C–G♯ is an A5, C–A♭ is an m6).
- **Movable do**, with a Settings choice between **do-based or la-based minor**.
- **Singing in your own octave:**
  - Single notes match in any octave.
  - Intervals and melodies anchor to the octave of the first note you sing. After that, contour counts: singing "up a 3rd" a 6th down doesn't pass.
- **Generated melodies** start on do, mi or sol and end on do.
  - In minor, they raise 6 and 7 when ascending to the tonic.
  - Raised chromatic syllables resolve up and lowered ones resolve down (fa–fi–sol, la–le–sol).
  - They avoid double accidentals, except where a minor key's raised 6th or 7th needs one (F𝄪 in G♯ minor, C𝄪 in D♯ minor, G𝄪 in A♯ minor).
- **Settings:**
  - Minor convention.
  - Pitch accuracy: ±50, ±35 or ±25 cents.
  - Whether a I–IV–V–I cadence plays before each question.
  - Reset progress.

## Microphone troubleshooting

The singing meter shows a **Mic** level bar and a microphone picker.

- **The bar never moves:** the browser is getting silence.
  - Check System Settings → Privacy & Security → Microphone.
  - Pick a different mic in the menu. The app automatically skips virtual inputs like BlackHole and Steam Streaming Microphone.
- **More detail:** add `?debug` to the URL to see the audio context state, the device name, the input level and the detected pitch.

## Development

```sh
node test/theory.test.js   # intervals, keys, syllables, clefs, key-signature positions
node test/pitch.test.js    # pitch detection, bass (82 Hz) to soprano (784 Hz), quiet/noisy voices
```

- `test/staff-grid.html` (served) draws every key signature in all four clefs for a visual check.
- `?dev` adds a panel that feeds a test tone in place of the mic. Use "= target" to sing the current note.

### Files

- `js/theory.js` — notes, intervals, keys, solfège, clefs (pure, Node-testable)
- `js/pitch.js` — YIN pitch detection (pure, Node-testable)
- `js/staff.js` — SVG staff: 4 clefs, key signatures, accidentals, ledger lines
- `js/sound.js` — Web Audio playback, microphone input
- `js/curriculum.js` — the course, as data
- `js/app.js` — shared services: progress, settings, pitch meter and listener, microphone handling
- `js/exercises.js` — exercise engines (explore, read, ear, sing, echo, sight-sing…)
- `js/main.js` — navigation, course map, settings, dev panel
