import fs from "fs";
import path from "path";

const catalogPath = path.join(process.cwd(), "src", "data", "catalog.json");

export function getCatalog() {
  const raw = fs.readFileSync(catalogPath, "utf8");
  return JSON.parse(raw);
}

export function getCatalogItems() {
  const catalog = getCatalog();

  const AC_RATE = 10;
  const items = [];

  for (const product of catalog.products) {
    for (const denom of product.denominations) {
      const acCost = Math.round(denom.discounted_price * AC_RATE);

      items.push({
        game: product.game,
        denomination: denom.amount,
        acCost,
      });
    }
  }

  return items;
}