import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const GRID_SIZE = 120;
const CELL_SIZE = 16; // pixels
const CANVAS_SIZE = GRID_SIZE * CELL_SIZE;
const CELL_RADIUS = 3; // Radius for rounded corners

// Pre-calculate neighbor offsets for performance
const NEIGHBOR_OFFSETS = [
  [-1, -1],
  [-1, 0],
  [-1, 1],
  [0, -1],
  [0, 1],
  [1, -1],
  [1, 0],
  [1, 1],
];

// Use Uint8Array for better memory efficiency
const createEmptyGrid = () => new Uint8Array(GRID_SIZE * GRID_SIZE);

// Optimized neighbor counting with bounds checking
const countNeighbors = (grid, x, y) => {
  let count = 0;
  for (const [dx, dy] of NEIGHBOR_OFFSETS) {
    const newX = x + dx;
    const newY = y + dy;
    if (newX >= 0 && newX < GRID_SIZE && newY >= 0 && newY < GRID_SIZE) {
      count += grid[newX * GRID_SIZE + newY];
    }
  }
  return count;
};

// Optimized next generation calculation with object pooling
const getNextGeneration = (currentGrid, nextGrid) => {
  for (let x = 0; x < GRID_SIZE; x++) {
    for (let y = 0; y < GRID_SIZE; y++) {
      const idx = x * GRID_SIZE + y;
      const neighbors = countNeighbors(currentGrid, x, y);
      const isAlive = currentGrid[idx];

      // Conway's rules
      nextGrid[idx] = (isAlive && (neighbors === 2 || neighbors === 3)) || (!isAlive && neighbors === 3) ? 1 : 0;
    }
  }
};

// Optimized canvas rendering
const renderGrid = (canvas, grid) => {
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  // Set color for alive cells
  ctx.fillStyle = "#00C767"; // Pinto green-2

  // Batch render alive cells
  for (let x = 0; x < GRID_SIZE; x++) {
    for (let y = 0; y < GRID_SIZE; y++) {
      if (grid[x * GRID_SIZE + y]) {
        const cellX = y * CELL_SIZE;
        const cellY = x * CELL_SIZE;
        const cellWidth = CELL_SIZE - 1;
        const cellHeight = CELL_SIZE - 1;

        ctx.beginPath();
        ctx.roundRect(cellX, cellY, cellWidth, cellHeight, CELL_RADIUS);
        ctx.fill();
      }
    }
  }
};

// Original preset patterns
const patterns = {
  tenCell: [
    [-3, 3],
    [-1, 3],
    [-1, 2],
    [1, 1],
    [1, 0],
    [1, -1],
    [3, 0],
    [3, -1],
    [3, -2],
    [4, -1],
  ],
  trafficCircle: [
    [-2, -23],
    [-1, -23],
    [4, -23],
    [5, -23],
    [-2, -22],
    [0, -22],
    [3, -22],
    [5, -22],
    [0, -21],
    [3, -21],
    [-1, -20],
    [0, -20],
    [3, -20],
    [4, -20],
    [-2, -19],
    [-1, -19],
    [0, -19],
    [3, -19],
    [4, -19],
    [5, -19],
    [0, -18],
    [3, -18],
    [8, -17],
    [7, -16],
    [9, -16],
    [10, -16],
    [11, -15],
    [3, -14],
    [7, -14],
    [10, -14],
    [12, -14],
    [3, -13],
    [9, -13],
    [12, -13],
    [3, -12],
    [10, -12],
    [11, -12],
    [-14, -11],
    [-13, -11],
    [-15, -10],
    [-12, -10],
    [-1, -10],
    [0, -10],
    [1, -10],
    [5, -10],
    [6, -10],
    [7, -10],
    [-16, -9],
    [-14, -9],
    [-12, -9],
    [-17, -8],
    [-16, -8],
    [-15, -8],
    [-13, -8],
    [3, -8],
    [-17, -7],
    [-16, -7],
    [-15, -7],
    [3, -7],
    [3, -6],
    [-11, -5],
    [-10, -5],
    [-9, -5],
    [-23, -4],
    [-22, -4],
    [-19, -4],
    [-2, -4],
    [-1, -4],
    [0, -4],
    [-23, -3],
    [-20, -3],
    [-19, -3],
    [-13, -3],
    [-7, -3],
    [-22, -2],
    [-21, -2],
    [-20, -2],
    [-19, -2],
    [-18, -2],
    [-13, -2],
    [-7, -2],
    [-4, -2],
    [2, -2],
    [20, -2],
    [23, -2],
    [24, -2],
    [-13, -1],
    [-7, -1],
    [-4, -1],
    [2, -1],
    [20, -1],
    [21, -1],
    [24, -1],
    [-4, 0],
    [2, 0],
    [10, 0],
    [11, 0],
    [12, 0],
    [19, 0],
    [20, 0],
    [21, 0],
    [22, 0],
    [23, 0],
    [-22, 1],
    [-21, 1],
    [-20, 1],
    [-19, 1],
    [-18, 1],
    [-11, 1],
    [-10, 1],
    [-9, 1],
    [-23, 2],
    [-20, 2],
    [-19, 2],
    [-2, 2],
    [-1, 2],
    [0, 2],
    [8, 2],
    [14, 2],
    [-23, 3],
    [-22, 3],
    [-19, 3],
    [8, 3],
    [14, 3],
    [19, 3],
    [20, 3],
    [21, 3],
    [22, 3],
    [23, 3],
    [8, 4],
    [14, 4],
    [20, 4],
    [21, 4],
    [24, 4],
    [20, 5],
    [23, 5],
    [24, 5],
    [10, 6],
    [11, 6],
    [12, 6],
    [16, 7],
    [17, 7],
    [15, 8],
    [16, 8],
    [17, 8],
    [14, 9],
    [16, 9],
    [17, 9],
    [13, 10],
    [15, 10],
    [-3, 11],
    [-2, 11],
    [-1, 11],
    [13, 11],
    [16, 11],
    [14, 12],
    [15, 12],
    [-10, 13],
    [-9, 13],
    [-4, 13],
    [-1, 13],
    [-11, 14],
    [-8, 14],
    [-11, 15],
    [-9, 15],
    [-7, 15],
    [-10, 16],
    [-7, 16],
    [-6, 17],
    [-9, 18],
    [-7, 18],
    [-2, 19],
    [1, 19],
    [-4, 20],
    [-3, 20],
    [-2, 20],
    [1, 20],
    [2, 20],
    [3, 20],
    [-3, 21],
    [-2, 21],
    [1, 21],
    [2, 21],
    [-2, 22],
    [1, 22],
    [-4, 23],
    [-2, 23],
    [1, 23],
    [3, 23],
    [-4, 24],
    [-3, 24],
    [2, 24],
    [3, 24],
  ],
  pufferfishCompanion: [
    [-5, -13],
    [3, -13],
    [-6, -12],
    [-5, -12],
    [-4, -12],
    [2, -12],
    [3, -12],
    [4, -12],
    [-7, -11],
    [-6, -11],
    [-3, -11],
    [1, -11],
    [4, -11],
    [5, -11],
    [-5, -10],
    [-4, -10],
    [-3, -10],
    [1, -10],
    [2, -10],
    [3, -10],
    [-4, -8],
    [2, -8],
    [-6, -7],
    [-3, -7],
    [1, -7],
    [4, -7],
    [-8, -6],
    [-2, -6],
    [0, -6],
    [6, -6],
    [-8, -5],
    [-7, -5],
    [-2, -5],
    [0, -5],
    [5, -5],
    [6, -5],
    [-2, -4],
    [0, -4],
    [-5, -3],
    [-3, -3],
    [1, -3],
    [3, -3],
    [-4, -2],
    [2, -2],
    [7, 2],
    [-4, 3],
    [-3, 3],
    [1, 3],
    [2, 3],
    [6, 3],
    [7, 3],
    [8, 3],
    [-4, 4],
    [-3, 4],
    [1, 4],
    [2, 4],
    [5, 4],
    [8, 4],
    [9, 4],
    [5, 5],
    [9, 5],
    [9, 6],
    [8, 7],
    [3, 8],
    [5, 8],
    [-4, 9],
    [-3, 9],
    [5, 9],
    [-4, 10],
    [-3, 10],
    [5, 11],
    [6, 11],
    [3, 12],
    [5, 12],
    [4, 13],
  ],
};

export default function GameOfLife({ startingPattern }) {
  const canvasRef = useRef(null);
  const [isRunning, setIsRunning] = useState(false);
  const [generation, setGeneration] = useState(0);
  const animationFrameRef = useRef(0);
  const lastTimeRef = useRef(0);

  // Use two grids for efficient double buffering
  const [currentGridIndex, setCurrentGridIndex] = useState(0);
  const grids = useMemo(() => [createEmptyGrid(), createEmptyGrid()], []);

  const speed = 100;

  // Memoized pattern setter
  const setPattern = useCallback(
    (newPattern) => {
      const pattern = patterns[newPattern];
      const startX = Math.floor(GRID_SIZE / 2) - 2;
      const startY = Math.floor(GRID_SIZE / 2) - 2;

      const grid = grids[currentGridIndex];
      grid.fill(0); // Clear grid

      pattern.forEach(([x, y]) => {
        const newX = startX + x;
        const newY = startY + y;
        if (newX >= 0 && newX < GRID_SIZE && newY >= 0 && newY < GRID_SIZE) {
          grid[newX * GRID_SIZE + newY] = 1;
        }
      });
    },
    [grids, currentGridIndex],
  );

  // Memoized reset function
  const resetGrid = useCallback(() => {
    setIsRunning(false);
    setGeneration(0);
    setPattern(startingPattern);
    if (canvasRef.current) {
      renderGrid(canvasRef.current, grids[currentGridIndex]);
    }
  }, [grids, currentGridIndex, setPattern, startingPattern]);

  // Optimized animation loop using requestAnimationFrame
  const animate = useCallback(
    (currentTime) => {
      if (currentTime - lastTimeRef.current >= speed) {
        const currentGrid = grids[currentGridIndex];
        const nextGrid = grids[1 - currentGridIndex];

        getNextGeneration(currentGrid, nextGrid);
        setCurrentGridIndex(1 - currentGridIndex);
        setGeneration((prev) => prev + 1);

        if (canvasRef.current) {
          renderGrid(canvasRef.current, nextGrid);
        }

        lastTimeRef.current = currentTime;
      }

      if (isRunning) {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    },
    [isRunning, speed, grids, currentGridIndex],
  );

  // Handle mouse interactions
  const handleMouseEnter = useCallback(() => {
    setIsRunning(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsRunning(false);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    resetGrid();
  }, [resetGrid]);

  // Initialize pattern on mount
  useEffect(() => {
    if (isRunning) return;
    setPattern(startingPattern);
    if (canvasRef.current) {
      renderGrid(canvasRef.current, grids[currentGridIndex]);
    }
  }, [setPattern, startingPattern, grids, currentGridIndex, isRunning]);

  // Handle animation
  useEffect(() => {
    if (isRunning) {
      lastTimeRef.current = performance.now();
      animationFrameRef.current = requestAnimationFrame(animate);
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isRunning, animate]);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_SIZE}
      height={CANVAS_SIZE}
      className="block -rotate-90 -scale-x-100"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        imageRendering: "crisp-edges",
      }}
    />
  );
}
