import { Decoder, Query } from "@envio-dev/hypersync-client";
import { getData } from "../query";
import { arbitrumClient } from "../clients";
import { addressToTopic, lower } from "../utils";

export async function execute() {
  const addresses = ["0xC570069E0CFdD85658F266a0E075cd9dae330561"].map(lower);
  const addressesTopic = addresses.map(addressToTopic);
  const TransferTopic = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

  const query = {
    fromBlock: 0,
    transactions: [{ from: addresses, to: addresses }],
    logs: [
      { topics: [[TransferTopic], [], addressesTopic, []] },
      { topics: [[TransferTopic], addressesTopic, [], []] },
    ],
  } as Query;

  await getData({
    name: "USERBASE_ERC20_TRANSFERS",
    query: query,
    client: arbitrumClient,
    onData: async ({ logs, transactionsByHash, blocksByNumber }) => {
      const decoder = Decoder.fromSignatures(["Transfer(address indexed from, address indexed to, uint amount)"]);
      const decodedLogs = await decoder.decodeLogs(logs);

      const transfers = logs.map((log, i) => {
        const decoded = decodedLogs[i];

        const txHash = log.transactionHash!;
        const blockNumber = log.blockNumber!;

        const from = decoded?.indexed[0].val;
        const to = decoded?.indexed[1].val;
        const amount = decoded?.body[0].val;

        const tx = transactionsByHash[txHash];
        const block = blocksByNumber[blockNumber];

        return {
          ts: block.timestamp,
          address: log.address,
          from: from,
          to: to,
          amount: amount,
          txHash: tx.hash,
        };
      });

      console.log(transfers);
    },
  });
}
