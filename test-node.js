import * as fs from "fs";

// Read logic.ts
const logicCode = fs.readFileSync("./src/games/xiangqi/engine/logic.ts", "utf-8");
// To avoid ts-node issues, let's just create a mock in pure JS or compile logic.ts
