# Pathfinder

An interactive, black-and-white visualizer for three pathfinding algorithms: **BFS**, **DFS** and **A\***. Built with plain HTML, CSS and JavaScript. No libraries or installation needed.

## Files

| File | Purpose |
|---|---|
| `index.html` | Page structure (toolbar, canvas, stats, legend) |
| `style.css` | Black-and-white design, with automatic dark mode |
| `script.js` | Grid, algorithms and interactivity |

## How to Run

1. Keep all three files in the same folder.
2. Double-click `index.html` to open it in any modern browser (Chrome, Edge, Firefox, Safari).

Optional, for development:

```bash
python -m http.server
# then open http://localhost:8000
```

## How to Use

1. **Draw walls**: click or drag on the grid. Dragging over a wall erases it.
2. **Move the markers**: drag **S** (start) or **E** (end) to a new square.
3. **Choose an algorithm**: BFS, DFS or A*.
4. **Press Run** to watch the search.
5. Use **Reset path** to clear the search, **Random walls** to generate obstacles, **Clear all** to wipe the grid, and the **Speed** slider to control the animation.

### Colors

| Look | Meaning |
|---|---|
| Solid black | Wall |
| Dark gray | Frontier (waiting to be checked) |
| Light gray | Visited |
| Dots | Final path |
| Circle `S` / Square `E` | Start / End |

### Stats

- **Visited**: number of squares checked
- **Path length**: steps from S to E
- **Status**: Ready, Searching, Found or No path

## The Algorithms

| | BFS | DFS | A* |
|---|---|---|---|
| Data structure | Queue | Stack | Lowest `f = g + h` first |
| Shortest path | Yes | No | Yes |
| Squares checked | Many | Varies | Usually fewest |

- **BFS (Breadth-First Search)**: checks squares layer by layer, so the first time it reaches E is the shortest path.
- **DFS (Depth-First Search)**: goes as deep as possible, then backtracks. It finds a path, but often a long one.
- **A\* (A-Star)**: `g` is the steps taken so far and `h` is the estimated distance left (Manhattan distance). It always checks the lowest `g + h` next, so it moves toward the goal.

Movement is in 4 directions (up, down, left, right), and every step costs 1.

## Try This

Place a wall between S and E, then run all three algorithms and compare **Visited** and **Path length**. BFS and A* give the same path length, A* visits fewer squares, and DFS usually gives a longer path.

## Customizing

In `script.js`, change `COLS` and `ROWS` at the top to resize the grid. In `style.css`, edit the color variables in `:root` (`--bg`, `--ink`, `--g1`, `--g2`) to change the look.