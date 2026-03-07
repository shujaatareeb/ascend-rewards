import fs from "fs";
import path from "path";

const catalogPath = path.join(process.cwd(), "src", "data", "catalog.json");

// 1 INR = 10 Ascend Credits
const AC_RATE = 10;

// Cache so we don't read file every time
let cachedItems = null;

export function getCatalogItems() {

  if (cachedItems) return cachedItems;

  try {

    const raw = fs.readFileSync(catalogPath, "utf8");
    const catalog = JSON.parse(raw);

    const items = [];
    let id = 1;

    for (const product of catalog.products) {

      for (const denomination of product.denominations) {

        const acCost = Math.round(denomination.discounted_price * AC_RATE);

        items.push({
          id: id++,
          game: product.game,
          denomination: denomination.amount,
          ac_cost: acCost,
          quantity: 0 // default quantity
        });

      }

    }

    cachedItems = items;

    console.log(`📦 Catalog loaded: ${items.length} items`);

    return items;

  } catch (err) {

    console.error("❌ Failed to load catalog:", err);
    return [];

  }

}
const raw = fs.readFileSync(catalogPath, "utf8");
const catalog = JSON.parse(raw);

console.log("Catalog products:", catalog.products.length);