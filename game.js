
// =========================
// VARIABLES DEL JUEGO
// =========================

let teams = [
    {
        id: 1,
        name: "Equipo 1",
        score: 0
    },
    {
        id: 2,
        name: "Equipo 2",
        score: 0
    }
];

let currentRound = 0;
let revealedAnswers = [];
let roundPoints = 0;
let strikes = 0;
let roundAwarded = false;
let errorTimeout = null;

// =========================
// REFERENCIAS HTML
// =========================

const startBtn = document.getElementById("start-btn");
const backBtn = document.getElementById("back-btn");
const playBtn = document.getElementById("play-btn");

const team1Input = document.getElementById("team1-name");
const team2Input = document.getElementById("team2-name");

// =========================
// CAMBIO DE PANTALLAS
// =========================

function showScreen(screenId) {

    document.querySelectorAll(".screen").forEach(screen => {
        screen.classList.remove("active");
    });

    document.getElementById(screenId).classList.add("active");

    if (screenId === "game-screen") {

    playMusic();

} else {

    stopMusic();

}
}

// =========================
// CONFIGURACIÓN DE EQUIPOS
// =========================

function startGame() {

    teams[0].name = team1Input.value.trim() || "Equipo 1";
    teams[1].name = team2Input.value.trim() || "Equipo 2";

    teams[0].score = 0;
    teams[1].score = 0;

    currentRound = 0;
    revealedAnswers = [];
    roundPoints = 0;
    strikes = 0;
    roundAwarded = false;

    // Limpiar resaltado de ganadores anteriores

document.querySelectorAll(".score-card").forEach(card => {

    card.classList.remove("round-winner");

});

// Restaurar visibilidad de los controles

document.querySelector(".game-controls")
    .classList.remove("hidden-controls");

// Limpiar confeti anterior

document.getElementById("confetti-container")
    .innerHTML = "";

    renderBoard();
    showScreen("game-screen");
    saveGame();

    console.log("Equipos:", teams);
    console.log("Preguntas disponibles:", questions.length);
}

// =========================
// EVENTOS
// =========================

startBtn.addEventListener("click", () => {

    if (localStorage.getItem(SAVE_KEY)) {

        const confirmNewGame = confirm(
            "Ya existe una partida guardada.\n\n" +
            "¿Quieres iniciar una nueva partida?"
        );

        if (!confirmNewGame) {
            return;
        }

    }

    showScreen("setup-screen");

});

backBtn.addEventListener("click", () => {
    showScreen("start-screen");
});

playBtn.addEventListener("click", startGame);

[team1Input, team2Input].forEach(input => {

    input.addEventListener("keydown", event => {

        if (event.key === "Enter") {
            startGame();
        }

    });

});


// =========================
// GENERAR TABLERO
// =========================

function renderBoard() {

    const question = questions[currentRound];

    const board = document.getElementById("answers-board");

    board.innerHTML = "";

    // Actualizar información de la ronda

    document.getElementById("round-number").textContent =
        `Ronda ${currentRound + 1} de ${questions.length}`;

    const multiplierBadge =
    document.getElementById("round-multiplier");

multiplierBadge.textContent =
    `×${question.multiplier}`;

multiplierBadge.dataset.multiplier =
    question.multiplier;

    // Crear las casillas

    question.answers.forEach((answer, index) => {

        const card = document.createElement("button");

        card.type = "button";
        card.classList.add("answer-card");
        card.dataset.index = index;

        // Centrar la última respuesta si la cantidad es impar

        if (
            question.answers.length % 2 !== 0 &&
            index === question.answers.length - 1
        ) {
            card.classList.add("full-width");
        }

        const number = document.createElement("span");
        number.className = "answer-number";
        number.textContent = index + 1;

        const content = document.createElement("div");
        content.className = "answer-content";

        const text = document.createElement("span");
        text.className = "answer-text";
        text.textContent = answer.text;

        const points = document.createElement("span");
        points.className = "answer-points";
        points.textContent = answer.points;

        content.append(text, points);
        card.append(number, content);

        // Recuperar respuestas reveladas

        if (revealedAnswers.includes(index)) {
            card.classList.add("revealed");
            card.disabled = true;
        }

        // Evento para revelar la respuesta

        card.addEventListener("click", () => {
            revealAnswer(index);
        });

        board.appendChild(card);

    });

    updateScoreboard();
    updateStrikes();
    updateControls();
}

// =========================
// REVELAR RESPUESTA
// =========================

function revealAnswer(index) {

    const question = questions[currentRound];

    const answer = question.answers[index];

    // Evitar respuestas inexistentes o repetidas

    if (
        !answer ||
        revealedAnswers.includes(index) ||
        roundAwarded
    ) {
        return;
    }

    const card = document.querySelector(
        `.answer-card[data-index="${index}"]`
    );

    if (!card) {
        return;
    }

    // Registrar respuesta revelada

    revealedAnswers.push(index);

    // Sumar puntos con multiplicador

    // Sumar puntos únicamente si hay menos de 3 errores

   if (strikes < 3) {

    roundPoints += answer.points * question.multiplier;

    playSound("correct");

} else {

    playSound("reveal");

}

    // Mostrar respuesta

    card.classList.add("revealed");
    card.disabled = true;

    // Actualizar marcador

    updateScoreboard(true);
    updateControls();
    saveGame();
}

// =========================
// ACTUALIZAR MARCADORES
// =========================

function updateScoreboard(animate = false) {

    document.getElementById("team1-display")
        .textContent = teams[0].name;

    document.getElementById("team2-display")
        .textContent = teams[1].name;

    const scores = [

        {
            element: document.getElementById("team1-score"),
            value: teams[0].score
        },

        {
            element: document.getElementById("team2-score"),
            value: teams[1].score
        },

        {
            element: document.getElementById("round-score"),
            value: roundPoints
        }

    ];

    scores.forEach(score => {

        if (animate) {

            animateScore(score.element, score.value);

        } else {

            cancelAnimationFrame(
                score.element.scoreAnimation
            );

            score.element.textContent = score.value;

        }

    });

}

// =========================
// ACTUALIZAR ERRORES
// =========================

function updateStrikes() {

    document.querySelectorAll(".strike").forEach((strike, index) => {

        strike.classList.toggle("active", index < strikes);

    });
}

// =========================
// MARCAR ERROR
// =========================

function addStrike() {

    if (strikes >= 3 || roundAwarded) {
        return;
    }

    strikes++;

    updateStrikes();
    updateControls();
    showErrorAnimation();
    playSound("wrong");
    saveGame();
}

// =========================
// QUITAR ERROR
// =========================

function removeStrike() {

    if (strikes <= 0 || roundAwarded) {
        return;
    }

    strikes--;

    updateStrikes();
    updateControls();
    saveGame();
}

// =========================
// ANIMACIÓN DE ERROR
// =========================

function showErrorAnimation() {

    const overlay = document.getElementById("error-overlay");

    clearTimeout(errorTimeout);

    overlay.classList.remove("show");

    void overlay.offsetWidth;

    overlay.classList.add("show");

    errorTimeout = setTimeout(() => {

        overlay.classList.remove("show");

    }, 800);
}

// =========================
// OTORGAR PUNTOS
// =========================

function awardPoints(teamIndex) {

    const question = questions[currentRound];

    if (
        roundAwarded ||
        !teams[teamIndex] ||
        revealedAnswers.length !== question.answers.length
    ) {
        return;
    }

    teams[teamIndex].score += roundPoints;

    roundAwarded = true;

    updateScoreboard(true);

    // Bloquear todas las respuestas

    document.querySelectorAll(".answer-card").forEach(card => {

        card.disabled = true;

    });

    // Resaltar al equipo ganador

    const scoreCards = document.querySelectorAll(".score-card");

    scoreCards[teamIndex].classList.add("round-winner");

    updateControls();
    playSound("award");
    saveGame();
}

// =========================
// SIGUIENTE RONDA
// =========================

function nextRound() {

    if (!roundAwarded) {
        return;
    }

    // Comprobar si terminó el juego

    if (currentRound >= questions.length - 1) {

    showResults();

    return;
    }

    currentRound++;

    revealedAnswers = [];
    roundPoints = 0;
    strikes = 0;
    roundAwarded = false;

    document.querySelectorAll(".score-card").forEach(card => {

        card.classList.remove("round-winner");

    });

    renderBoard();

playRoundSound(
    questions[currentRound].multiplier
);

saveGame();
}

// =========================
// ACTUALIZAR CONTROLES
// =========================

function updateControls() {

    const awardTeam1Btn = document.getElementById("award-team1-btn");
    const awardTeam2Btn = document.getElementById("award-team2-btn");
    const strikeBtn = document.getElementById("strike-btn");
    const undoStrikeBtn = document.getElementById("undo-strike-btn");
    const nextRoundBtn = document.getElementById("next-round-btn");

    // Mostrar nombres personalizados

    awardTeam1Btn.textContent = `Puntos a ${teams[0].name}`;
    awardTeam2Btn.textContent = `Puntos a ${teams[1].name}`;

    // Habilitar y deshabilitar controles

    const allAnswersRevealed =
    revealedAnswers.length === questions[currentRound].answers.length;

    awardTeam1Btn.disabled = roundAwarded || !allAnswersRevealed;
    awardTeam2Btn.disabled = roundAwarded || !allAnswersRevealed;

    strikeBtn.disabled = strikes >= 3 || roundAwarded;

    undoStrikeBtn.disabled = strikes === 0 || roundAwarded;

    nextRoundBtn.disabled = !roundAwarded;

    // Cambiar texto en la última ronda

    nextRoundBtn.textContent =
        currentRound === questions.length - 1
            ? "Ver resultados →"
            : "Siguiente ronda →";
}

// =========================
// EVENTOS DE LOS CONTROLES
// =========================

document.getElementById("strike-btn")
    .addEventListener("click", addStrike);

document.getElementById("undo-strike-btn")
    .addEventListener("click", removeStrike);

document.getElementById("award-team1-btn")
    .addEventListener("click", () => awardPoints(0));

document.getElementById("award-team2-btn")
    .addEventListener("click", () => awardPoints(1));

document.getElementById("next-round-btn")
    .addEventListener("click", nextRound);

// =========================
// ATAJOS DE TECLADO
// =========================

document.addEventListener("keydown", event => {

    // Evitar atajos mientras se escribe

    if (
        event.target.tagName === "INPUT" ||
        event.target.tagName === "TEXTAREA" ||
        event.target.isContentEditable
    ) {
        return;
    }

    if (event.key.toLowerCase() === "m") {

    if (!event.repeat) {
        toggleMute();
    }

    return;

}

    // Evitar acciones repetidas al mantener una tecla

    if (event.repeat) {
        return;
    }

    // No interferir con atajos del navegador

    if (event.ctrlKey || event.altKey || event.metaKey) {
        return;
    }

    // Solo permitir atajos durante el juego

    const gameScreen = document.getElementById("game-screen");

    if (!gameScreen.classList.contains("active")) {
        return;
    }

    const key = event.key.toLowerCase();

    // Revelar respuestas del 1 al 8

    if (/^[1-8]$/.test(key)) {

        event.preventDefault();

        revealAnswer(Number(key) - 1);

        return;
    }

    // Controles del conductor

    switch (key) {

        case "x":
            addStrike();
            break;

        case "z":
            removeStrike();
            break;

        case "q":
            awardPoints(0);
            break;

        case "e":
            awardPoints(1);
            break;

        case "n":
            nextRound();
            break;

        case "h":
            toggleControls();
            break;
    }
});
// =========================
// VISIBILIDAD DE CONTROLES
// =========================

function toggleControls() {

    const controls = document.querySelector(".game-controls");

    controls.classList.toggle("hidden-controls");

    saveGame();
}

// =========================
// GUARDADO AUTOMÁTICO
// =========================

const SAVE_KEY = "100-idols-dijeron-save";

function saveGame() {

    const gameData = {

        teams: teams,
        currentRound: currentRound,
        revealedAnswers: revealedAnswers,
        roundPoints: roundPoints,
        strikes: strikes,
        roundAwarded: roundAwarded,

        controlsHidden: document
            .querySelector(".game-controls")
            .classList.contains("hidden-controls"),

        winnerTeamIndex: Array.from(
            document.querySelectorAll(".score-card")
        ).findIndex(card =>
            card.classList.contains("round-winner")
        )

    };

    localStorage.setItem(
        SAVE_KEY,
        JSON.stringify(gameData)
    );

}

// =========================
// RECUPERAR PARTIDA
// =========================

function loadGame() {

    const savedGame = localStorage.getItem(SAVE_KEY);

    if (!savedGame) {
        return;
    }

    try {

        const gameData = JSON.parse(savedGame);

        teams = gameData.teams;
        currentRound = gameData.currentRound;
        revealedAnswers = gameData.revealedAnswers;
        roundPoints = gameData.roundPoints;
        strikes = gameData.strikes;
        roundAwarded = gameData.roundAwarded;

        renderBoard();

        document.querySelector(".game-controls")
            .classList.toggle(
                "hidden-controls",
                gameData.controlsHidden === true
            );

        const scoreCards =
            document.querySelectorAll(".score-card");

        scoreCards.forEach(card => {
            card.classList.remove("round-winner");
        });

        if (roundAwarded) {

            document.querySelectorAll(".answer-card")
                .forEach(card => {
                    card.disabled = true;
                });

            if (scoreCards[gameData.winnerTeamIndex]) {

                scoreCards[gameData.winnerTeamIndex]
                    .classList.add("round-winner");

            }

        }

        showScreen("game-screen");

    } catch (error) {

        console.error("Error al recuperar la partida:", error);

        alert("No se pudo recuperar la partida guardada.");

    }

}

// =========================
// ELIMINAR PARTIDA GUARDADA
// =========================

function clearSavedGame() {

    localStorage.removeItem(SAVE_KEY);

    checkSavedGame();

}

// =========================
// COMPROBAR PARTIDA GUARDADA
// =========================

function checkSavedGame() {

    const continueBtn =
        document.getElementById("continue-btn");

    continueBtn.hidden =
        !localStorage.getItem(SAVE_KEY);

}

// =========================
// EVENTO CONTINUAR PARTIDA
// =========================

document.getElementById("continue-btn")
    .addEventListener("click", loadGame);

checkSavedGame();


// =========================
// RESULTADOS FINALES
// =========================

function showResults() {
    stopAllSounds();

    const team1 = teams[0];
    const team2 = teams[1];

    const winnerName = document.getElementById("winner-name");
    const trophy = document.getElementById("winner-trophy");
    const resultsTitle = document.querySelector(".results-title");

    const team1Card = document.getElementById("final-team1-card");
    const team2Card = document.getElementById("final-team2-card");

    // Mostrar nombres y puntuaciones

    document.getElementById("final-team1-name").textContent =
        team1.name;

    document.getElementById("final-team2-name").textContent =
        team2.name;

    document.getElementById("final-team1-score").textContent =
        team1.score;

    document.getElementById("final-team2-score").textContent =
        team2.score;

    // Limpiar resultados anteriores

    team1Card.classList.remove("winner");
    team2Card.classList.remove("winner");

    // Determinar ganador

    if (team1.score > team2.score) {

        resultsTitle.textContent = "¡Tenemos un ganador!";
        winnerName.textContent = team1.name;
        trophy.innerHTML = '<img src="assets/images/trophy.png" class="result-image" alt="Victoria">'

        team1Card.classList.add("winner");
        playSound("victory");

    } else if (team2.score > team1.score) {

        resultsTitle.textContent = "¡Tenemos un ganador!";
        winnerName.textContent = team2.name;
        trophy.innerHTML = '<img src="assets/images/trophy.png" class="result-image" alt="Victoria">'

        team2Card.classList.add("winner");
        playSound("victory");

    } else {

        resultsTitle.textContent = "¡El concurso ha terminado!";
        winnerName.textContent = "¡Empate!";
        trophy.innerHTML = '<img src="assets/images/tie.png" class="result-image" alt="Empate">'

        team1Card.classList.add("winner");
        team2Card.classList.add("winner");
        playSound("tie");

    }

    showScreen("results-screen");

    clearSavedGame();

    launchConfetti();
}


// =========================
// CONFETI
// =========================

function launchConfetti() {

    const container =
        document.getElementById("confetti-container");

    container.innerHTML = "";

    const colors = [
        "#A979A9",
        "#C69BC4",
        "#DFC3DF",
        "#CE92AD",
        "#FFD76A",
        "#FFFFFF",
        "#69436F"
    ];

    for (let i = 0; i < 150; i++) {

        const piece = document.createElement("div");

        piece.classList.add("confetti-piece");

        piece.style.left =
            Math.random() * 100 + "%";

        piece.style.backgroundColor =
            colors[Math.floor(Math.random() * colors.length)];

        piece.style.animationDuration =
            (Math.random() * 3 + 3) + "s";

        piece.style.animationDelay =
            Math.random() * 2 + "s";

        piece.style.setProperty(
            "--drift",
            (Math.random() * 300 - 150) + "px"
        );

        piece.style.borderRadius =
            Math.random() > 0.5 ? "50%" : "2px";

        piece.addEventListener("animationend", () => {

            piece.remove();

        }, { once: true });

        container.appendChild(piece);

    }

}

// =========================
// VOLVER AL INICIO
// =========================

document.getElementById("home-btn")
    .addEventListener("click", () => {

        stopAllSounds()

        document.getElementById("confetti-container")
            .innerHTML = "";

        showScreen("start-screen");

    });


// =========================
// DECORACIÓN DEL ESCENARIO
// =========================

function createStageSparkles() {

    const container =
        document.getElementById("stage-sparkles");

    container.innerHTML = "";

    const symbols = ["✦", "✧", "⋆", "✦"];

    for (let i = 0; i < 40; i++) {

        const sparkle = document.createElement("span");

        sparkle.classList.add("stage-sparkle");

        // Algunas estrellas serán doradas

        if (Math.random() < 0.25) {
            sparkle.classList.add("gold");
        }

        sparkle.textContent =
            symbols[Math.floor(
                Math.random() * symbols.length
            )];

        // Distribuir las estrellas en los laterales

        const leftSide = i % 2 === 0;

        const positionX = leftSide
            ? Math.random() * 23
            : 77 + Math.random() * 23;

        sparkle.style.left = positionX + "%";

        sparkle.style.top =
            Math.random() * 100 + "%";

        sparkle.style.fontSize =
            (Math.random() * 24 + 10) + "px";

        sparkle.style.setProperty(
            "--duration",
            (Math.random() * 4 + 3) + "s"
        );

        sparkle.style.setProperty(
            "--delay",
            (-Math.random() * 7) + "s"
        );

        container.appendChild(sparkle);

    }

}

createStageSparkles();

// =========================
// ANIMACIÓN DE PUNTUACIONES
// =========================

function animateScore(element, target) {

    cancelAnimationFrame(element.scoreAnimation);

    const start = Number(element.textContent) || 0;

    if (
        target <= start ||
        window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches
    ) {
        element.textContent = target;
        return;
    }

    const duration = 600;
    const startTime = performance.now();

    function update(currentTime) {

        const progress = Math.min(
            (currentTime - startTime) / duration,
            1
        );

        const easedProgress =
            1 - Math.pow(1 - progress, 3);

        element.textContent = Math.round(
            start + (target - start) * easedProgress
        );

        if (progress < 1) {

            element.scoreAnimation =
                requestAnimationFrame(update);

        } else {

            element.textContent = target;

        }

    }

    element.scoreAnimation =
        requestAnimationFrame(update);
}