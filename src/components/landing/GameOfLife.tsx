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
  ctx.fillStyle = "#10b981"; // Green color

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
    [4, 1],
  ],

  trafficCircle: [
    [0, 21],
    [0, 22],
    [0, 27],
    [0, 28],
    [1, 21],
    [1, 23],
    [1, 26],
    [1, 28],
    [2, 23],
    [2, 26],
    [3, 22],
    [3, 23],
    [3, 26],
    [3, 27],
    [4, 21],
    [4, 22],
    [4, 23],
    [4, 26],
    [4, 27],
    [4, 28],
    [5, 23],
    [5, 26],
    [6, 31],
    [7, 30],
    [7, 32],
    [7, 33],
    [8, 34],
    [9, 26],
    [9, 30],
    [9, 33],
    [9, 35],
    [10, 26],
    [10, 32],
    [10, 35],
    [11, 26],
    [11, 33],
    [11, 34],
    [12, 9],
    [12, 10],
    [13, 8],
    [13, 11],
    [13, 22],
    [13, 23],
    [13, 24],
    [13, 28],
    [13, 29],
    [13, 30],
    [14, 7],
    [14, 9],
    [14, 11],
    [15, 6],
    [15, 7],
    [15, 8],
    [15, 10],
    [15, 30],
    [16, 6],
    [16, 7],
    [16, 8],
    [16, 30],
    [17, 26],
    [18, 12],
    [18, 13],
    [18, 14],
    [19, 0],
    [19, 1],
    [19, 4],
    [19, 25],
    [19, 26],
    [19, 27],
    [20, 0],
    [20, 3],
    [20, 4],
    [20, 11],
    [20, 17],
    [21, 1],
    [21, 2],
    [21, 3],
    [21, 4],
    [21, 5],
    [21, 11],
    [21, 17],
    [21, 20],
    [21, 26],
    [21, 41],
    [21, 44],
    [21, 45],
    [22, 10],
    [22, 16],
    [22, 19],
    [22, 25],
    [22, 40],
    [22, 41],
    [22, 44],
    [23, 19],
    [23, 25],
    [23, 33],
    [23, 34],
    [23, 35],
    [23, 40],
    [23, 41],
    [23, 42],
    [23, 43],
    [23, 44],
    [24, 1],
    [24, 2],
    [24, 3],
    [24, 4],
    [24, 5],
    [24, 12],
    [24, 13],
    [24, 14],
    [25, 0],
    [25, 3],
    [25, 4],
    [25, 25],
    [25, 26],
    [25, 27],
    [25, 35],
    [25, 41],
    [26, 0],
    [26, 1],
    [26, 4],
    [26, 31],
    [26, 37],
    [26, 43],
    [26, 44],
    [26, 45],
    [26, 46],
    [26, 47],
    [27, 31],
    [27, 37],
    [27, 43],
    [27, 44],
    [27, 47],
    [28, 39],
    [28, 42],
    [28, 43],
    [29, 33],
    [29, 34],
    [29, 35],
    [30, 39],
    [30, 40],
    [31, 38],
    [31, 39],
    [31, 40],
    [32, 37],
    [32, 39],
    [32, 40],
    [33, 36],
    [33, 38],
    [34, 20],
    [34, 21],
    [34, 22],
    [34, 37],
    [34, 40],
    [35, 37],
    [35, 38],
    [36, 13],
    [36, 14],
    [36, 19],
    [36, 22],
    [37, 12],
    [37, 15],
    [38, 12],
    [38, 14],
    [38, 16],
    [39, 13],
    [39, 16],
    [40, 17],
    [41, 14],
    [41, 16],
    [42, 21],
    [42, 24],
    [43, 19],
    [43, 20],
    [43, 21],
    [43, 24],
    [43, 25],
    [43, 26],
    [44, 20],
    [44, 21],
    [44, 24],
    [44, 25],
    [45, 21],
    [45, 24],
    [46, 19],
    [46, 21],
    [46, 24],
    [46, 26],
    [47, 19],
    [47, 20],
    [47, 25],
    [47, 26],
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
      className="block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        imageRendering: "crisp-edges",
      }}
    />
  );
}
