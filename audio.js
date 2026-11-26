
// =========================
// CONFIGURACIÓN DE AUDIO
// =========================

let sfxVolume = 0.7;
let musicVolume = 0.15;
let audioMuted = false;

// =========================
// EFECTOS DE SONIDO
// =========================

const soundEffects = {

    correct: new Audio("assets/audio/sfx/correct.mp3"),

    wrong: new Audio("assets/audio/sfx/wrong.mp3"),

    reveal: new Audio("assets/audio/sfx/reveal.mp3"),

    award: new Audio("assets/audio/sfx/award.mp3"),

    nextRound: new Audio("assets/audio/sfx/next-round.mp3"),

    multiplier: new Audio("assets/audio/sfx/multiplier.mp3"),

    victory: new Audio("assets/audio/sfx/victory.mp3"),

    tie: new Audio("assets/audio/sfx/tie.mp3")

};

// Precargar los efectos

Object.values(soundEffects).forEach(sound => {

    sound.preload = "auto";
    sound.volume = sfxVolume;

});

// =========================
// REPRODUCIR EFECTOS
// =========================

function playSound(soundName) {

    const sound = soundEffects[soundName];

    if (!sound || audioMuted) {
        return;
    }

    sound.pause();
    sound.currentTime = 0;
    sound.volume = sfxVolume;

    sound.play().catch(error => {

        console.warn(
            "No se pudo reproducir el sonido:",
            soundName,
            error
        );

    });

}

// =========================
// DETENER EFECTOS
// =========================

function stopAllSounds() {

    Object.values(soundEffects).forEach(sound => {

        sound.pause();
        sound.currentTime = 0;

    });

}
// =========================
// SONIDOS DE RONDA
// =========================

function playRoundSound(multiplier) {

    if (multiplier > 1) {

        playSound("multiplier");

    } else {

        playSound("nextRound");

    }

}
// =========================
// MÚSICA AMBIENTAL
// =========================

const backgroundMusic = new Audio(
    "assets/audio/music/showtime.mp3"
);

backgroundMusic.loop = true;
backgroundMusic.volume = musicVolume;
backgroundMusic.preload = "auto";

// =========================
// REPRODUCIR MÚSICA
// =========================

function playMusic() {

    if (audioMuted) {
        return;
    }

    backgroundMusic.volume = musicVolume;

    backgroundMusic.play().catch(error => {

        console.warn(
            "No se pudo reproducir la música:",
            error
        );

    });

}

// =========================
// PAUSAR MÚSICA
// =========================

function pauseMusic() {

    backgroundMusic.pause();

}

// =========================
// DETENER MÚSICA
// =========================

function stopMusic() {

    backgroundMusic.pause();
    backgroundMusic.currentTime = 0;

}
// =========================
// CONTROLES DE AUDIO
// =========================

const musicVolumeInput =
    document.getElementById("music-volume");

const sfxVolumeInput =
    document.getElementById("sfx-volume");

const musicVolumeValue =
    document.getElementById("music-volume-value");

const sfxVolumeValue =
    document.getElementById("sfx-volume-value");

const muteBtn =
    document.getElementById("mute-btn");

// Volumen de música

musicVolumeInput.addEventListener("input", () => {

    musicVolume = Number(musicVolumeInput.value) / 100;

    backgroundMusic.volume = musicVolume;

    musicVolumeValue.textContent =
        musicVolumeInput.value + "%";

    saveAudioSettings();

});

// Volumen de efectos

sfxVolumeInput.addEventListener("input", () => {

    sfxVolume = Number(sfxVolumeInput.value) / 100;

    Object.values(soundEffects).forEach(sound => {

        sound.volume = sfxVolume;

    });

    sfxVolumeValue.textContent =
        sfxVolumeInput.value + "%";

    saveAudioSettings();

});
// =========================
// SILENCIAR AUDIO
// =========================

function toggleMute() {

    audioMuted = !audioMuted;

    applyMute();

    if (
        !audioMuted &&
        document.getElementById("game-screen")
            .classList.contains("active")
    ) {
        playMusic();
    }

    saveAudioSettings();

}

function applyMute() {

    backgroundMusic.muted = audioMuted;

    Object.values(soundEffects).forEach(sound => {

        sound.muted = audioMuted;

    });

    muteBtn.textContent = audioMuted
        ? "🔇 Activar audio (M)"
        : "🔊 Silenciar audio (M)";

    muteBtn.classList.toggle("muted", audioMuted);

}

muteBtn.addEventListener("click", toggleMute);
// =========================
// GUARDAR CONFIGURACIÓN
// =========================

function saveAudioSettings() {

    const settings = {
        musicVolume,
        sfxVolume,
        audioMuted
    };

    localStorage.setItem(
        "idollyAudioSettings",
        JSON.stringify(settings)
    );

}

// =========================
// RECUPERAR CONFIGURACIÓN
// =========================

function loadAudioSettings() {

    try {

        const savedSettings = localStorage.getItem(
            "idollyAudioSettings"
        );

        if (!savedSettings) return;

        const settings = JSON.parse(savedSettings);

        musicVolume = Math.min(
            1, Math.max(0, Number(settings.musicVolume ?? 0.15))
        );

        sfxVolume = Math.min(
            1, Math.max(0, Number(settings.sfxVolume ?? 0.7))
        );

        audioMuted = settings.audioMuted === true;

        if (!Number.isFinite(musicVolume)) musicVolume = 0.15;
        if (!Number.isFinite(sfxVolume)) sfxVolume = 0.7;

    } catch (error) {

        console.warn("Error al recuperar el audio:", error);

    }

}

function updateAudioControls() {

    musicVolumeInput.value = Math.round(musicVolume * 100);
    sfxVolumeInput.value = Math.round(sfxVolume * 100);

    musicVolumeValue.textContent =
        musicVolumeInput.value + "%";

    sfxVolumeValue.textContent =
        sfxVolumeInput.value + "%";

    backgroundMusic.volume = musicVolume;

    Object.values(soundEffects).forEach(sound => {

        sound.volume = sfxVolume;

    });

    applyMute();

}

loadAudioSettings();
updateAudioControls();