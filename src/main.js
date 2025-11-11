let recordButtonEnabled = false;

function enableRecordButtonOnce() {
    if (!recordButtonEnabled) {
        const recordButton = document.getElementById('recordDownloadBtn');
        recordButton.disabled = false;
        recordButton.title = "Download je beat";
        recordButtonEnabled = true;
        console.log("🎧 Record button is nu actief");
    }
}

function pulseScrollbar() {
  const scrollbar = document.querySelector("body");
  scrollbar.style.setProperty('--scrollbar-color', getRandomColor());

  // update CSS variable die scrollbar kleurt
}

function getRandomColor() {
  const colors = ['#ff0055', '#00ffaa', '#6600ff', '#ffcc00'];
  return colors[Math.floor(Math.random() * colors.length)];
}

// Trigger op beat of interval
setInterval(pulseScrollbar, 600); // of synchroniseer met sequencer

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM is geladen. AudioContext state bij load:', Tone.context.state);

    const startButton = document.getElementById('homePageStartButton');
    const startScreen = document.getElementById('startScreen');
    const app = document.getElementById('app');
    

  startButton.addEventListener('click', async () => {
    await Tone.start(); // start AudioContext
    await Tone.loaded(); // wacht op alle buffers

    startScreen.style.display = 'none';
    app.style.display = 'flex';

    initSequencer(); // players worden hier pas aangemaakt
}); 
});

async function initSequencer() {

    const stepsContainer = document.querySelector('.steps');
    await Tone.loaded();
    const sampler = new Tone.Sampler({
        urls: {
            "C4": "C4.mp3",
            "D#4": "Ds4.mp3",
            "F#4": "Fs4.mp3",
            "A4": "A4.mp3",
            "C5": "C5.mp3"
        },
        release: 1.5,
        baseUrl: "https://tonejs.github.io/audio/salamander/"
        }).toDestination();

      await Tone.loaded();

    const melodyNotes = [
    "C6", "B5", "A5", "G5", "F5", "E5", "D5", "C5", 
    "B4", "A4", "G4", "F4", "E4", "D4", "C4"
    ];

    const melodyStepsContainer = document.querySelector('.melody-steps');
    let melodySteps = {};

    // Leegmaken voor de zekerheid
    melodyStepsContainer.innerHTML = '';

    melodyNotes.forEach(note => {
        melodySteps[note] = [];
        const row = document.createElement('div');
        row.classList.add('row');
        row.dataset.note = note;

        for (let i = 0; i < 32; i++) {
            const step = document.createElement('div');
            step.classList.add('step');
            step.dataset.index = i;
            step.dataset.instrument = 'melody';
            step.dataset.pad = melodyNotes.indexOf(note);
            step.addEventListener('click', () => {
                step.classList.toggle('active');
                step.classList.toggle('melody-note');
            });
            row.appendChild(step);
            melodySteps[note].push(step);
        }

        melodyStepsContainer.appendChild(row);
    });

    const pianoChords = {
  Am: ["A3", "C4", "E4"],
  G: ["G3", "B3", "D4"],
  F: ["F3", "A3", "C4"],
  D: ["D3", "F#3", "A3"],
  C: ["C3", "E3", "G3"]
};

const pianoChordStepsContainer = document.querySelector('.piano-chord-steps');
let pianoChordSteps = {};

pianoChordStepsContainer.innerHTML = '';

["Am", "G", "F", "D", "C"].forEach(chord => {
  pianoChordSteps[chord] = [];
  const row = document.createElement('div');
  row.classList.add('row');
  row.dataset.chord = chord;

  for (let i = 0; i < 32; i++) {
    const step = document.createElement('div');
    step.classList.add('step');
    step.dataset.index = i;
    step.dataset.instrument = 'chords';
    step.dataset.pad = ["Am", "G", "F", "D", "C"].indexOf(chord);
    step.addEventListener('click', () => {
      step.classList.toggle('active');
      step.classList.toggle('piano-chord');
    });
    row.appendChild(step);
    pianoChordSteps[chord].push(step);
  }

  pianoChordStepsContainer.appendChild(row);
});

    const bassNotes = ["G3", "D3", "C3", "A2", "E2"];
    const bassStepsContainer = document.querySelector('.bass-steps');
    let bassSteps = {};

bassStepsContainer.innerHTML = '';

bassNotes.forEach(note => {
    bassSteps[note] = [];
    const row = document.createElement('div');
    row.classList.add('row');
    row.dataset.note = note;

    for (let i = 0; i < 32; i++) {
        const step = document.createElement('div');
        step.classList.add('step');
        step.dataset.index = i;
        step.dataset.instrument = 'bass';
        step.dataset.pad = bassNotes.indexOf(note);
        step.addEventListener('click', () => {
            step.classList.toggle('active');
            step.classList.toggle('bass');
        });
        row.appendChild(step);
        bassSteps[note].push(step);
    }

    bassStepsContainer.appendChild(row);
});

    let isPlaying = false;
    let tempo = 120; // ✅ Standaard BPM op 120
    let instruments = {};
    let currentStep = 0;
    let animationFrame;
    let startTime;
    let totalWidth;
    let hasScheduledRepeat = false;
    let isPaused = false;

  const presets = {
  1: { 
    name: "Classic Beat",
    patterns: [
      { instrument: 'drums', pad: 0, indices: [3,5,7,9,11,13,15,17,19,21,23,25,27,29,31] }, // Snare
      { instrument: 'drums', pad: 1, indices: [0,7,15,23] }, // openhihat
      { instrument: 'drums', pad: 2, indices: [2,6,10,14,18,22,26,30] }, // hihat
      { instrument: 'drums', pad: 3, indices: [1,29,31] }, // cymbal
      { instrument: 'drums', pad: 4, indices: [3,4,7,8,11,12,15,16,19,20,23,24,27,28] }, // tom
      { instrument: 'drums', pad: 5, indices: [6,14,22,30] }, // kick
      { instrument: 'melody', pad: 7, indices: [15] },
      { instrument: 'melody', pad: 8, indices: [16,25] },
      { instrument: 'melody', pad: 9, indices: [19,22] },
      { instrument: 'melody', pad: 10, indices: [3,7,11,13,27] },
      { instrument: 'melody', pad: 12, indices: [1] },
      { instrument: 'melody', pad: 14, indices: [0] },
      { instrument: 'chords', pad: 1, indices: [11] },
      { instrument: 'chords', pad: 3, indices: [19] },
      { instrument: 'chords', pad: 4, indices: [3,27] }
    ]
  },
  2: {
    name: "Rap Beat",
    patterns: [
      { instrument: 'drums', pad: 0, indices: [4, 12, 20, 28] }, // Snare
      { instrument: 'drums', pad: 1, indices: [6, 14, 22, 30] }, // openhihat
      { instrument: 'drums', pad: 2, indices: [2, 10, 18, 26] }, // hihat
      { instrument: 'drums', pad: 4, indices: [0, 8, 16, 24] }, // tom
      { instrument: 'drums', pad: 5, indices: [3, 11, 19, 27] }, // kick
      { instrument: 'melody', pad: 2, indices: [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20] },
      { instrument: 'melody', pad: 3, indices: [22, 24, 26, 28, 30] },
      { instrument: 'melody', pad: 5, indices: [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30] },
      { instrument: 'melody', pad: 7, indices: [0, 2, 4, 6, 8, 10, 12, 14] },
      { instrument: 'melody', pad: 8, indices: [16, 18, 20, 22, 24, 26, 28, 30] }
    ]
  },
      3: {
    name: "Intro",
    patterns: [
        { instrument: 'drums', pad: 0, indices: [2] },
        { instrument: 'drums', pad: 1, indices: [5] },
        { instrument: 'drums', pad: 3, indices: [5] },
        { instrument: 'drums', pad: 4, indices: [1, 2] },
        { instrument: 'drums', pad: 5, indices: [1] }
      ]
}};

function clearAllSteps() {
    // Drums
    for (const sound in steps) {
        steps[sound].forEach(step => {
            step.classList.remove('active', sound);
        });
    }

    // Melody
    for (const note in melodySteps) {
        melodySteps[note].forEach(step => {
            step.classList.remove('active', 'melody-note');
        });
    }

    // Chords
    for (const chord in pianoChordSteps) {
        pianoChordSteps[chord].forEach(step => {
            step.classList.remove('active', 'piano-chord');
        });
    }

    // Bass
    for (const note in bassSteps) {
        bassSteps[note].forEach(step => {
            step.classList.remove('active', 'bass');
        });
    }
}

function activatePreset(presetId) {
  clearAllSteps();
  const preset = presets[presetId];
  
  if (!preset) return;

  preset.patterns.forEach(item => {
    item.indices.forEach(index => {
      const selector = `.step[data-instrument="${item.instrument}"][data-pad="${item.pad}"][data-index="${index}"]`;
      const step = document.querySelector(selector);
      if (step) {
  step.classList.add('active', 'preset'); // voeg preset class toe
  if (item.instrument === 'drums') {
    const drumTypes = ['snare', 'openhihat', 'hihat', 'cymbal', 'tom', 'kick'];
    step.classList.add(drumTypes[item.pad]);
  }
}
    });
  });
}

// Drum sounds
const drumSounds = ["snare", "openhihat", "hihat",  "cymbal", "tom", "kick" ];
stepsContainer.innerHTML = ''; // wis oude drumgrid
let steps = {};

drumSounds.forEach(sound => {
    steps[sound] = [];
    const row = document.createElement('div');
    row.classList.add('row');
    row.dataset.sound = sound;

    for (let i = 0; i < 32; i++) {
        const step = document.createElement('div');
        step.classList.add('step');
        step.dataset.index = i;
        step.dataset.instrument = 'drums';
        step.dataset.pad = drumSounds.indexOf(sound);
        step.dataset.sound = sound;

        step.addEventListener('click', () => {
            step.classList.toggle('active');
            step.classList.toggle(sound);
        });
        row.appendChild(step);
        steps[sound].push(step);

    }

    stepsContainer.appendChild(row);
});

// Create vertical line
const currentStepLine = document.createElement('div');
currentStepLine.classList.add('current-step');
const gridContainer = document.querySelector('.steps');
gridContainer.appendChild(currentStepLine);

// Verkrijg de hoogte van de all-steps-container, die alle rijen en grids bevat
const allStepsContainer = document.querySelector('.all-steps-container');
const allStepsContainerHeight = allStepsContainer.offsetHeight;

// Zet de hoogte van de verticale lijn gelijk aan de hoogte van de all-steps-container
currentStepLine.style.height = `${allStepsContainerHeight}px`;

    function animateStepLine(timestamp) {
    const now = Tone.Transport.seconds; // gebruik audio tijd
    const secondsPerStep = Tone.Time("11n").toSeconds(); // Stapduur gebaseerd op '11n'
    const measureDuration = secondsPerStep * 32;         // Duur van 1 loop van 32 stappen
    const progress = (now % measureDuration) / measureDuration;

    const stepElement = steps['kick'][0];
    const style = getComputedStyle(stepElement);
    const width = stepElement.offsetWidth;
    const gap = 5;
    const stepWidth = width + gap;
    totalWidth = stepWidth * 32;

    currentStepLine.style.left = `${progress * totalWidth}px`;
    animationFrame = requestAnimationFrame(animateStepLine);
}

    // ✅ Verplaats initInstruments buiten de event listener
    async function initInstruments() {
        const openHihatGain = new Tone.Gain(3.0).toDestination();
        const closedHihatGain = new Tone.Gain(2.5).toDestination();

        let loadPromises = [];

        function createSampler(name, options) {
            return new Promise(resolve => {
                instruments[name] = new Tone.Sampler({
                    ...options,
                    onload: () => resolve()
                }).toDestination();
            });
        }

        loadPromises.push(createSampler('kick', {
            urls: { C1: "public/samples/kick.wav" },
            envelope: { attack: 0.001, release: 0.7 }
        }));

        loadPromises.push(createSampler('snare', {
            urls: { C1: "public/samples/snare.wav" },
            envelope: { attack: 0.001, release: 0.2 }
        }));

        loadPromises.push(new Promise(resolve => {
        const sampler = new Tone.Sampler({
            urls: { C1: "public/samples/open_hi_hat.wav" },
            envelope: { attack: 0.001, release: 0.5 },
            onload: resolve // kan ook zo, makkelijker
        });
        sampler.connect(openHihatGain);
        instruments['openhihat'] = sampler;
        }));
     
        loadPromises.push(new Promise(resolve => {
        const sampler = new Tone.Sampler({
            urls: { C1: "public/samples/closed_hi_hat.wav" },
            envelope: { attack: 0.001, release: 0.2 },
            onload: resolve  // makkelijkste manier om te wachten tot geladen
        });
        sampler.connect(closedHihatGain);
        instruments['hihat'] = sampler;
        }));

            //  Cymbal
        loadPromises.push(createSampler('cymbal', {
            urls: { C1: "public/samples/cymbal.wav" },
            envelope: { attack: 0.001, release: 0.6 }
        }));

        //  Tom
        loadPromises.push(createSampler('tom', {
            urls: { C1: "public/samples/tom.wav" },
            envelope: { attack: 0.001, release: 0.3 }
        }));

        // Voor bass met chain:
        loadPromises.push(new Promise(resolve => {
            const bassFilter = new Tone.Filter({
                type: "lowpass",
                frequency: 1450,
                rolloff: -24,
                Q: 1
            });
            const bassCompressor = new Tone.Compressor({
                threshold: -20,
                ratio: 4,
                attack: 0.01,
                release: 0.5
            });

            instruments['bass'] = new Tone.Sampler({
                urls: {
                    "G2": "public/samples/bass_G2.wav",
                    "D3": "public/samples/bass_D3.wav",
                    "C3": "public/samples/bass_C3.wav",
                    "A2": "public/samples/bass_A2.wav",
                    "E2": "public/samples/bass_E2.wav",
                },
                release: 1.5,
                onload: resolve
            }).chain(bassFilter, bassCompressor, Tone.Destination);
        }));

        await Promise.all(loadPromises);
        console.log("Alle samples zijn volledig geladen!");
    }

    const startStopButton = document.getElementById('btnStart');

    startStopButton.addEventListener('click', async () => {
    if (Tone.context.state !== 'running') {
        await Tone.start();
    }

    if (Object.keys(instruments).length === 0) {
        await initInstruments();
    }

// Schedule playback pas 1x
if (!hasScheduledRepeat) {
    Tone.Transport.scheduleRepeat(time => {

// Verwijder 'playing' van vorige step
const previousStep = (currentStep - 1 + 32) % 32;
const previousSteps = document.querySelectorAll(`.step[data-index="${previousStep}"]`);
previousSteps.forEach(step => step.classList.remove('playing'));

// Voeg 'playing' toe aan huidige step
const currentSteps = document.querySelectorAll(`.step[data-index="${currentStep}"].active`);
currentSteps.forEach(step => step.classList.add('playing'));

        if (!isPlaying) return;

        for (const sound in steps) {
            const step = steps[sound][currentStep];
            if (step && step.classList.contains('active')) {
                if (instruments[sound]) {
    instruments[sound].triggerAttackRelease("C1", "8n", time);
    enableRecordButtonOnce();
        }
            }
        }

        for (const note in melodySteps) {
            const step = melodySteps[note][currentStep];
            if (step && step.classList.contains('active')) {
                sampler.triggerAttackRelease(note, '8n', time);
                enableRecordButtonOnce();
            }
        }

        for (const chord in pianoChordSteps) {
    const step = pianoChordSteps[chord][currentStep];
    if (step && step.classList.contains('active')) {
        const notes = pianoChords[chord];
        notes.forEach(note => {
            sampler.triggerAttackRelease(note, '2n', time); // langere akkoorden
            enableRecordButtonOnce();
        });
    }
}

        for (const note in bassSteps) {
    const step = bassSteps[note][currentStep];
    if (step && step.classList.contains('active')) {
        instruments['bass'].triggerAttackRelease(note, '8n', time);
        enableRecordButtonOnce();
    }
}

        currentStep = (currentStep + 1) % 32;
    }, '11n');
    hasScheduledRepeat = true;
}
        isPlaying = !isPlaying;

        if (isPlaying) {
            currentStep = 0;
            startTime = null;
            Tone.Transport.bpm.value = tempo;
            Tone.Transport.start();
            animationFrame = requestAnimationFrame(animateStepLine);
        } else {
            Tone.Transport.stop();
            cancelAnimationFrame(animationFrame);
        }
    });

let toneIsLoaded = false; // vlag om bij te houden of de audio al is geladen

document.getElementById('btnStart').addEventListener('click', async () => {
    const loadingAlert = document.getElementById('loading-alert');
    const btnStart = document.getElementById('btnStart');

    try {
        // Start AudioContext als nodig
        if (!Tone.context || Tone.context.state !== 'running') {
            await Tone.start();
        }

        // Alleen tonen als audio nog niet geladen is
        if (!toneIsLoaded) {
            loadingAlert.classList.remove('hidden');
            const startTime = Date.now();

            await Tone.loaded(); // wacht tot audio klaar is

            // Zorg dat melding minstens 1 seconde zichtbaar blijft
            const elapsed = Date.now() - startTime;
            const minDuration = 1000;
            if (elapsed < minDuration) {
                await new Promise(resolve => setTimeout(resolve, minDuration - elapsed));
            }

            loadingAlert.classList.add('hidden');
            toneIsLoaded = true; // audio is nu geladen, dit hoeft niet meer opnieuw
        }

        // Start de sequencer
        if (!isPlaying || isPaused) {
    isPaused = false;
    currentStep = 0;
    startTime = null;
    startStopButton.click();
    const btnPause = document.getElementById('btnPause');
    btnPause.innerHTML = '<i class="fas fa-pause icon-pause"></i> Pauze';
}
    } catch (err) {
        console.error("Fout bij starten:", err);
        loadingAlert.classList.add('hidden');
    }
});

// ✅ Definieer btnPause hier
const btnPause = document.getElementById('btnPause');

btnPause.addEventListener('click', () => {
    if (isPlaying && !isPaused) {
        // Zet op pauze
        isPaused = true;
        isPlaying = false;
        Tone.Transport.pause();
        cancelAnimationFrame(animationFrame);
        btnPause.innerHTML = '<i class="fas fa-play icon-pause"></i> Hervat'; // play icoon + Hervat
    } else if (isPaused) {
        // Hervat afspelen
        isPaused = false;
        isPlaying = true;

        // Herstart de Transport vanaf huidige positie
        Tone.Transport.start('+0.1'); // mini delay voor betere timing
        animationFrame = requestAnimationFrame(animateStepLine);
        btnPause.innerHTML = '<i class="fas fa-pause icon-pause"></i> Pauze'; // pauze icoon + Pauze
    }
    document.querySelectorAll('.step.playing').forEach(step => {
    step.classList.remove('playing');
});
});

document.getElementById('btnStop').addEventListener('click', () => {
    isPlaying = false;
    Tone.Transport.stop();
    cancelAnimationFrame(animationFrame);
    currentStep = 0;
    currentStepLine.style.left = '0px';
    startStopButton.innerHTML = '<i class="fas fa-play icon-start"></i> Start'; // play icoon + Start
    document.querySelectorAll('.step.playing').forEach(step => {
    step.classList.remove('playing');
});
});

document.getElementById('btnResetAll').addEventListener('click', () => {
    for (const sound in steps) {
        steps[sound].forEach(step => {
            step.classList.remove('active', sound);
        });
    }
    for (const note in melodySteps) {
        melodySteps[note].forEach(step => step.classList.remove('active', 'melody-note'));
    }
    for (const chord in pianoChordSteps) {
        pianoChordSteps[chord].forEach(step => step.classList.remove('active', 'piano-chord'));
    }
    for (const note in bassSteps) {
        bassSteps[note].forEach(step => step.classList.remove('active', 'bass'));
    }
    document.querySelector('.dropdown-preset-toggle').innerHTML = '<i class="fas fa-magic icon-preset"></i> Preset <i class="fas fa-caret-down"></i>';
    document.querySelectorAll('.step.preset').forEach(step => step.classList.remove('preset'));
    document.querySelectorAll('.step.playing').forEach(step => {
    step.classList.remove('playing');
});
});

document.querySelectorAll('.dropdown-preset-content a').forEach(item => {
  item.addEventListener('click', function(e) {
    e.preventDefault();
    const presetId = this.getAttribute('data-preset');
    activatePreset(presetId);
    
    // Update dropdown tekst naar geselecteerde preset
    document.querySelector('.dropdown-preset-toggle').innerHTML = 
      `<i class="fas fa-magic icon-preset"></i> ${presets[presetId].name} <i class="fas fa-caret-down"></i>`;
    
    // Markeer actieve preset
    document.querySelectorAll('.dropdown-preset-content a').forEach(el => {
      el.classList.remove('active');
    });
    this.classList.add('active');
  });
});

// BPM FUNCTIE
const bpmSlider = document.getElementById("bpmSlider");
const bpmValue = document.getElementById("bpmValue");

// Zet initiële waarden
bpmSlider.min = 60;
bpmSlider.max = 140;
bpmSlider.value = 100;
bpmValue.textContent = 100;
Tone.Transport.bpm.value = 100;

bpmSlider.addEventListener("input", () => {
  const newTempo = parseInt(bpmSlider.value);
  bpmValue.textContent = newTempo;
  tempo = newTempo; // ✅ Update de globale tempo variabele
  Tone.Transport.bpm.value = newTempo;
  document.querySelectorAll('.step.playing').forEach(step => {
  step.classList.remove('playing');
});

  if (isPlaying) {
    // Stop de sequencer
    Tone.Transport.stop();
    cancelAnimationFrame(animationFrame);

    // Reset step en start tijd
    currentStep = 0;
    startTime = null;

    // Start de sequencer opnieuw
    Tone.Transport.start();
    animationFrame = requestAnimationFrame(animateStepLine);
  }
});

// Volume aanpassen
const volumeSlider = document.getElementById('volumeSlider');
const volumeValue = document.getElementById('volumeValue');

function percentToDb(percent) {
    const gain = Math.pow(percent / 100, 2);
    const db = 20 * Math.log10(gain);
    return isFinite(db) ? db : -60;
}

volumeSlider.addEventListener('input', () => {
    const percent = parseInt(volumeSlider.value);
    volumeValue.textContent = percent + '%';
    const db = percentToDb(percent);
    Tone.Destination.volume.rampTo(db, 0.2);
});

// Zet initiele sliderwaarde en volume
volumeSlider.value = 100;
Tone.Destination.volume.value = percentToDb(100);
volumeValue.textContent = '100%';

// OPNEEM/DOWNLOAD FUNCTIE
const recorder = new Tone.Recorder();
Tone.Destination.connect(recorder); // alles wat hoorbaar is, gaat naar recorder

const loopCountSlider = document.getElementById('loopCount');
const loopValueDisplay = document.getElementById('loopValue');

function updateLoopDuration() {
    const loopCount = parseInt(loopCountSlider.value);
    const stepsPerLoop = 32;
    const stepDuration = Tone.Time('11n').toSeconds(); // pas aan naar jouw step setting (bijv. '11n')
    const loopDurationSeconds = stepDuration * stepsPerLoop * loopCount;

    const minutes = Math.floor(loopDurationSeconds / 60);
    const seconds = Math.round(loopDurationSeconds % 60).toString().padStart(2, '0');

    loopValueDisplay.textContent = `${loopCount} ${loopCount === 1 ? 'loop' : 'loops'}`;
}

loopCountSlider.addEventListener('input', updateLoopDuration);
updateLoopDuration(); // initial update

const recordButton = document.getElementById('recordDownloadBtn');
recordButton.disabled = true;
recordButton.title = "You can't record something you havent heard.";

recordButton.addEventListener('click', async () => {
    const loopCount = parseInt(loopCountSlider.value);
    const stepsPerLoop = 32;
    const stepDuration = Tone.Time('11n').toSeconds(); // of '11n' of wat jij gebruikt
    const totalDuration = stepsPerLoop * stepDuration * loopCount;

    const loadingAlert = document.getElementById('loading-alert');

    try {
        // Start audio context als nodig
        if (!Tone.context || Tone.context.state !== 'running') {
            await Tone.start();
        }

        // Als geluiden nog niet geladen zijn, toon alert en wacht
        if (!toneIsLoaded) {
            loadingAlert.classList.remove('hidden');
            const startTime = Date.now();

            await Tone.loaded();

            const elapsed = Date.now() - startTime;
            const minDuration = 1000;
            if (elapsed < minDuration) {
                await new Promise(resolve => setTimeout(resolve, minDuration - elapsed));
            }

            loadingAlert.classList.add('hidden');
            toneIsLoaded = true;
        }

        // Begin opnemen
        recorder.start();

        // Zet sequencer aan
        if (!isPlaying) {
            currentStep = 0;
            Tone.Transport.bpm.value = tempo;
            Tone.Transport.start();
            animationFrame = requestAnimationFrame(animateStepLine);
            isPlaying = true;
        }

        // Stop na ingestelde tijd + download WAV
        setTimeout(async () => {
            const recording = await recorder.stop();

            Tone.Transport.stop();
            cancelAnimationFrame(animationFrame);
            isPlaying = false;

            // 🔻 Verwijder alle 'playing' classes
            document.querySelectorAll('.step.playing').forEach(step => {
                step.classList.remove('playing');
            });

    // Download de beat
            const url = URL.createObjectURL(recording);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'mijn-beat.wav';
            a.click();
            URL.revokeObjectURL(url);
        }, totalDuration * 1000);

    } catch (err) {
        console.error("Fout bij opnemen:", err);
        loadingAlert.classList.add('hidden');
    }
});

}

 