function initializePuzzle(window) {
    const board = window.querySelector('#puzzleBoard');
    const movesEl = window.querySelector('#puzzleMoves');
    const timeEl = window.querySelector('#puzzleTime');
    const shuffleBtn = window.querySelector('#puzzleShuffle');
    const solveBtn = window.querySelector('#puzzleSolve');
    
    if (!board) return;
    
    const size = 4;
    let tiles = [];
    let moves = 0;
    let startTime = null;
    let timerInterval = null;
    
    function initBoard() {
        board.innerHTML = '';
        tiles = [];
        
        for (let i = 0; i < size * size; i++) {
            tiles.push(i);
        }
        
        renderBoard();
    }
    
    function renderBoard() {
        board.innerHTML = '';
        
        tiles.forEach((num, idx) => {
            const tile = document.createElement('div');
            tile.className = 'puzzle-tile';
            
            if (num === 0) {
                tile.classList.add('empty');
            } else {
                tile.textContent = num;
                tile.style.background = `linear-gradient(135deg, hsl(${num * 25}, 70%, 60%), hsl(${num * 25 + 20}, 70%, 50%))`;
                tile.addEventListener('click', () => moveTile(idx));
            }
            
            board.appendChild(tile);
        });
    }
    
    function moveTile(idx) {
        const emptyIdx = tiles.indexOf(0);
        const row = Math.floor(idx / size);
        const col = idx % size;
        const emptyRow = Math.floor(emptyIdx / size);
        const emptyCol = emptyIdx % size;
        
        const isAdjacent = (Math.abs(row - emptyRow) === 1 && col === emptyCol) ||
                          (Math.abs(col - emptyCol) === 1 && row === emptyRow);
        
        if (isAdjacent) {
            [tiles[idx], tiles[emptyIdx]] = [tiles[emptyIdx], tiles[idx]];
            moves++;
            if (movesEl) movesEl.textContent = moves;
            renderBoard();
            
            if (checkWin()) {
                setTimeout(() => {
                    alert(`🎉 Congratulations! You solved it in ${moves} moves and ${timeEl ? timeEl.textContent : '0s'}!`);
                    stopTimer();
                }, 100);
            }
        }
    }
    
    function shuffle() {
        moves = 0;
        if (movesEl) movesEl.textContent = '0';
        startTimer();
        
        for (let i = 0; i < 500; i++) {
            const emptyIdx = tiles.indexOf(0);
            const possibleMoves = [];
            const row = Math.floor(emptyIdx / size);
            const col = emptyIdx % size;
            
            if (row > 0) possibleMoves.push(emptyIdx - size);
            if (row < size - 1) possibleMoves.push(emptyIdx + size);
            if (col > 0) possibleMoves.push(emptyIdx - 1);
            if (col < size - 1) possibleMoves.push(emptyIdx + 1);
            
            const randomMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
            [tiles[emptyIdx], tiles[randomMove]] = [tiles[randomMove], tiles[emptyIdx]];
        }
        
        renderBoard();
    }
    
    function checkWin() {
        for (let i = 0; i < tiles.length - 1; i++) {
            if (tiles[i] !== i + 1) return false;
        }
        return tiles[tiles.length - 1] === 0;
    }
    
    function solve() {
        tiles = [];
        for (let i = 1; i < size * size; i++) {
            tiles.push(i);
        }
        tiles.push(0);
        renderBoard();
        stopTimer();
    }
    
    function startTimer() {
        stopTimer();
        startTime = Date.now();
        timerInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            if (timeEl) timeEl.textContent = `${elapsed}s`;
        }, 1000);
    }
    
    function stopTimer() {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
    }
    
    if (shuffleBtn) {
        shuffleBtn.addEventListener('click', shuffle);
    }
    
    if (solveBtn) {
        solveBtn.addEventListener('click', solve);
    }
    
    initBoard();
    shuffle();
}
