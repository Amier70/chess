const engine = new Worker(
  "https://cdn.jsdelivr.net/npm/stockfish@16.1.0/src/stockfish-nnue-16.1-single.js"
);

const game = new Chess();

engine.postMessage("uci");

engine.onmessage = function(event){

    const line = event.data;

    console.log(line);

    if(line.startsWith("bestmove")){

        const move = line.split(" ")[1];

        game.move({
            from: move.substring(0,2),
            to: move.substring(2,4),
            promotion:"q"
        });

        renderBoard();
    }

    if(line.includes("score cp")){

        let cp = line.match(/score cp (-?\d+)/);

        if(cp){
            document.getElementById("evaluation").innerText =
                (parseInt(cp[1])/100).toFixed(2);
        }
    }
};

function renderBoard(){

    const board = document.getElementById("board");

    board.innerHTML = "";

    const position = game.board();

    const pieces = {
        p:"♟",r:"♜",n:"♞",b:"♝",q:"♛",k:"♚",
        P:"♙",R:"♖",N:"♘",B:"♗",Q:"♕",K:"♔"
    };

    for(let r=0;r<8;r++){

        for(let c=0;c<8;c++){

            const square=document.createElement("div");

            square.className=
                "square "+
                ((r+c)%2===0?"light":"dark");

            const piece=position[r][c];

            if(piece){

                const symbol=
                    piece.color==="w"
                    ? piece.type.toUpperCase()
                    : piece.type;

                square.textContent=pieces[symbol];
            }

            board.appendChild(square);
        }
    }
}

function botMove(){

    engine.postMessage(
        "position fen " + game.fen()
    );

    const depth =
        document.getElementById("difficulty").value;

    engine.postMessage(
        "go depth " + depth
    );
}

document
.getElementById("newGame")
.onclick=()=>{

    game.reset();

    renderBoard();
};

renderBoard();
