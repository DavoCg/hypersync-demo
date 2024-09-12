import { execute as erc20_transfers_execute } from "./indexers/erc20_transfers";
import { execute as steur_strategy_execute } from "./indexers/steur_strategy";

async function main() {
  await Promise.all([
    //erc20_transfers_execute(),
    steur_strategy_execute(),
  ]);
}

main();
