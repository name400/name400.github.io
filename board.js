class Board {
    grid;
    constructor(ctx, ctxNext) {
      this.ctx = ctx;
      this.ctxNext = ctxNext;
      this.init();
    }
    
    init(){//캔버스 조정
      this.ctx.canvas.width = COLS * BLOCK_SIZE;
      this.ctx.canvas.height = ROWS * BLOCK_SIZE;
      
      this.ctx.scale(BLOCK_SIZE, BLOCK_SIZE);
    }

    reset() {//초기화
      this.grid = this.getEmptyBoard();
      this.piece = new Piece(this.ctx);
      this.piece.setStartingPosition();
      this.getNewPiece();
    }
    getNewPiece(){//다음에 나올 블록
      const {width,height} = this.ctxNext.canvas;
      this.next = new Piece(this.ctxNext);
      this.ctxNext.clearRect(0,0,width,height);
      this.next.draw();
    }
    
    getEmptyBoard() {//보드 초기화
      return Array.from(
        {length: ROWS}, () => Array(COLS).fill(0)
      );
    }
    valid(p) {//움직일 수 있는지 확인
      return p.shape.every((row, dy) => {
        return row.every((value, dx) => {
          let x = p.x + dx;
          let y = p.y + dy;
          return (
            this.isEmpty(value) ||
           (this.isInsideWalls(x,y) && this.notOccupied(x,y))
          );
        });
      });
    }
    notOccupied(x,y){
      return this.grid[y] && this.grid[y][x]===0;
    }
    isInsideWalls(x,y){//게임판 안에 있는지 확인
      return x>=0 && x<COLS && y <= ROWS;
    }
    isEmpty(value) {
      return value === 0;
    }
    rotate(p){//블록 회전
      let clone = JSON.parse(JSON.stringify(p));
      
      for(let y = 0; y < p.shape.length; ++y){
        for(let x = 0; x < y; ++x){
          [p.shape[x][y], p.shape[y][x]] = 
          [p.shape[y][x], p.shape[x][y]];
        }
      }

      p.shape.forEach(row => row.reverse());
      
      return clone;
    }
    draw(){//떨어지는 블록 그리기
      this.piece.draw();
      this.drawBoard();
    }

    drop(){ //애니메이션
      let p = moves[KEY.DOWN](this.piece);
      if(this.valid(p)){
        this.piece.move(p);
      }
      else{
        this.freeze();
        this.clearLines();
        if(this.piece.y===0){
          return false;
        }
        this.piece = this.next;
        this.piece.ctx = this.ctx;
        this.piece.setStartingPosition();
        this.getNewPiece();
      }
      return true;
    }
    freeze(){ //블록 고정
      this.piece.shape.forEach((row,y)=>{
        row.forEach((value,x)=>{
          if(value>0){
            this.grid[y+this.piece.y][x+this.piece.x] = value;
          }
        });
      });
    }
    drawBoard(){//고정된 블록 그리기
      this.grid.forEach((row,y)=>{
        row.forEach((value,x)=>{
          if(value>0){
            this.ctx.fillstyle = COLORS[value];
            this.ctx.fillRect(x,y,1,1);
          }
        });
      });
    }
    clearLines() { //줄 제거
      let lines = 0;
      this.grid.forEach((row, y) => {    
        if (row.every(value => value !== 0)) {
          lines++;
          this.grid.splice(y, 1); 
          this.grid.unshift(Array(COLS).fill(0));
        }  
      });  
      if (lines > 0) {
        account.score += this.getLineClearPoints(lines, this.level);  
        account.lines += lines;

        if(account.lines >= LINES_PER_LEVEL){
          account.level++;
          account.lines -= LINES_PER_LEVEL;
          time.level = LEVEL[account.level];
        }
      }
    }
    getLineClearPoints(lines,level){ //줄 제거 점수
      const lineClearPoints = 
        lines === 1
          ? POINTS.SINGLE
          :lines === 2
          ? POINTS.DOUBLE
          :lines === 3
          ? POINTS.TRIPLE
          :lines === 4
          ?POINTS.TETRIS
          : 0;
          return (account.level + 1) * lineClearPoints;
    }
}
