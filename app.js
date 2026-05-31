const engine = new Worker(
  "https://cdn.jsdelivr.net/npm/stockfish@16.1.0/src/stockfish-nnue-16.1-single.js"
);

const game = new Chess();

const boardEl = document.getElementById("board");
const statusEl = document.getElementById("status");
const movesEl = document.getElementById("moves");
const difficultyEl = document.getElementById("difficulty");
const newGameBtn = document.getElementById("newGame");

let selectedSquare = null;
let legalMoves = [];
let botThinking = false;

const symbols = {
  wp: "♙",
  wr: "♖",
  wn: "♘",
  wb: "♗",
  wq: "♕",
  wk: "♔",
  bp: "♟",
  br: "♜",
  bn: "♞",
  bb: "♝",
  bq: "♛",
  bk: "♚"
};

engine.postMessage("uci");

engine.onmessage = function (event) {
  const line = event.data;

  if (line.startsWith("bestmove")) {
    const bestMove = line.split(" ")[1];

    if (bestMove && bestMove !== "(none)") {
      game.move({
        from: bestMove.substring(0, 2),
        to: bestMove.substring(2, 4),
        promotion: "q"
      });
    }

    botThinking = false;
    renderBoard();
    updateStatus();
    updateMoves();
  }
};

function renderBoard() {
  boardEl.innerHTML = "";

  const board = game.board();

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const square = document.createElement("div");
      const file = "abcdefgh"[c];
      const rank = 8 - r;
      const squareName = file + rank;

      square.className = "square " + ((r + c) % 2 === 0 ? "light" : "dark");

      if (selectedSquare === squareName) {
        square.classList.add("selected");
      }

      if (legalMoves.includes(squareName)) {
        square.classList.add("legal");
      }

      const piece = board[r][c];

      if (piece) {
        square.textContent = symbols[piece.color + piece.type];
      }

      square.onclick = () => handleClick(squareName);

      boardEl.appendChild(square);
    }
  }
}

function handleClick(squareName) {
  if (botThinking || game.game_over()) return;
  if (game.turn() !== "w") return;

  const piece = game.get(squareName);

  if (selectedSquare) {
    const move = game.move({
      from: selectedSquare,
      to: squareName,
      promotion: "q"
    });

    selectedSquare = null;
    legalMoves = [];

    if (move) {
      renderBoard();
      updateStatus();
      updateMoves();

      if (!game.game_over()) {
        setTimeout(botMove, 300);
      }

      return;
    }
  }

  if (piece && piece.color === "w") {
    selectedSquare = squareName;
    legalMoves = game
      .moves({ square: squareName, verbose: true })
      .map(move => move.to);
  } else {
    selectedSquare = null;
    legalMoves = [];
  }

  renderBoard();
}

function botMove() {
  botThinking = true;
  statusEl.textContent = "Stockfish denkt na...";

  engine.postMessage("position fen " + game.fen());
  engine.postMessage("go depth " + difficultyEl.value);
}

function updateStatus() {
  if (game.in_checkmate()) {
    statusEl.textContent =
      game.turn() === "w"
        ? "Schaakmat! Stockfish wint."
        : "Schaakmat! Jij wint.";
    return;
  }

  if (game.in_draw()) {
    statusEl.textContent = "Remise.";
    return;
  }

  if (game.in_check()) {
    statusEl.textContent =
      game.turn() === "w"
        ? "Wit is aan zet. Schaak!"
        : "Stockfish is aan zet. Schaak!";
    return;
  }

  statusEl.textContent =
    game.turn() === "w" ? "Wit is aan zet." : "Stockfish is aan zet.";
}

function updateMoves() {
  const history = game.history();

  if (history.length === 0) {
    movesEl.textContent = "Nog geen zetten.";
    return;
  }

  movesEl.innerHTML = history
    .map((move, index) => `${index + 1}. ${move}`)
    .join("<br>");
}

newGameBtn.onclick = function () {
  game.reset();
  selectedSquare = null;
  legalMoves = [];
  botThinking = false;
  renderBoard();
  updateStatus();
  updateMoves();
};

renderBoard();
updateStatus();
updateMoves();
