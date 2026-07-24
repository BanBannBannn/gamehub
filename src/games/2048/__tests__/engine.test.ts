import { describe, expect, it } from "vitest";
import {
  canMove,
  collapseLeft,
  createEmptyGrid,
  emptyCells,
  hasWon,
  highestTile,
  move,
  spawnRandom,
} from "../engine/logic";
import { Grid } from "../engine/types";

describe("2048 engine — collapseLeft", () => {
  it("dồn số về trái", () => {
    expect(collapseLeft([0, 2, 0, 2]).line).toEqual([4, 0, 0, 0]);
  });
  it("gộp 2 ô bằng nhau đúng 1 lần, cộng điểm", () => {
    const r = collapseLeft([2, 2, 2, 2]);
    expect(r.line).toEqual([4, 4, 0, 0]);
    expect(r.gained).toBe(8);
  });
  it("không gộp chuỗi 3 thành 1", () => {
    expect(collapseLeft([4, 4, 4, 0]).line).toEqual([8, 4, 0, 0]);
  });
  it("không gộp 2 giá trị khác nhau", () => {
    expect(collapseLeft([2, 4, 8, 0]).line).toEqual([2, 4, 8, 0]);
  });
});

describe("2048 engine — move theo hướng", () => {
  const g: Grid = [
    [2, 2, 0, 0],
    [0, 0, 0, 0],
    [4, 0, 4, 0],
    [0, 0, 0, 0],
  ];

  it("sang trái gộp đúng và báo moved", () => {
    const r = move(g, "left");
    expect(r.grid[0]).toEqual([4, 0, 0, 0]);
    expect(r.grid[2]).toEqual([8, 0, 0, 0]);
    expect(r.moved).toBe(true);
    expect(r.gained).toBe(12);
  });

  it("sang phải dồn về phải", () => {
    const r = move(g, "right");
    expect(r.grid[0]).toEqual([0, 0, 0, 4]);
    expect(r.grid[2]).toEqual([0, 0, 0, 8]);
  });

  it("nước đi không đổi gì thì moved = false", () => {
    const stable: Grid = [
      [2, 4, 8, 16],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];
    expect(move(stable, "left").moved).toBe(false);
  });

  it("lên/xuống gộp theo cột", () => {
    const col: Grid = [
      [2, 0, 0, 0],
      [2, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];
    expect(move(col, "up").grid[0][0]).toBe(4);
    expect(move(col, "down").grid[3][0]).toBe(4);
  });
});

describe("2048 engine — trạng thái", () => {
  it("hasWon khi có ô >= 2048", () => {
    const g = createEmptyGrid();
    g[0][0] = 2048;
    expect(hasWon(g)).toBe(true);
    expect(hasWon(createEmptyGrid())).toBe(false);
  });

  it("canMove: lưới đầy không còn cặp kề bằng nhau = thua", () => {
    const full: Grid = [
      [2, 4, 2, 4],
      [4, 2, 4, 2],
      [2, 4, 2, 4],
      [4, 2, 4, 2],
    ];
    expect(canMove(full)).toBe(false);
  });

  it("canMove: còn ô trống thì đi được", () => {
    const g = createEmptyGrid();
    expect(canMove(g)).toBe(true);
  });

  it("spawnRandom thêm đúng 1 ô vào ô trống", () => {
    const g = createEmptyGrid();
    const after = spawnRandom(g, () => 0); // rng=0 → ô đầu tiên, giá trị 2
    expect(emptyCells(after).length).toBe(15);
    expect(after[0][0]).toBe(2);
  });

  it("highestTile trả ô lớn nhất", () => {
    const g = createEmptyGrid();
    g[1][1] = 128;
    expect(highestTile(g)).toBe(128);
  });
});
