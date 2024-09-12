import { Decoder, Query } from "@envio-dev/hypersync-client";
import { getData } from "../query";
import { arbitrumClient } from "../clients";

export async function execute() {
  const stEUR = "0x004626A008B1aCdC4c74ab51644093b155e59A23";

  const DepositTopic = "0xdcbc1c05240f31ff3ad067ef1ee35ce4997762752e3a095284754544f4c709d7";
  const WithdrawTopic = "0xfbde797d201c681b91056529119e0b02407c7bb96a4a2c75c01fc9667232c8db";

  const DepositSignature = "Deposit(address indexed caller, address indexed owner, uint256 assets, uint256 shares)";
  const WithdrawSignature =
    "Withdraw(address indexed caller, address indexed receiver, address indexed owner, uint256 assets, uint256 shares)";

  const query = {
    //fromBlock: 0,
    fromBlock: 252769351,
    logs: [
      { address: [stEUR], topics: [[DepositTopic]] },
      { address: [stEUR], topics: [[WithdrawTopic]] },
    ],
  } as Query;

  await getData({
    name: "STEUR_STRATEGY",
    query: query,
    client: arbitrumClient,
    onData: async ({ logs, metrics, blocksByNumber, transactionsByHash }) => {
      const decoder = Decoder.fromSignatures([DepositSignature, WithdrawSignature]);
      const decodedLogs = await decoder.decodeLogs(logs);

      const actions = logs.map((log, i) => {
        const decoded = decodedLogs[i];

        const txHash = log.transactionHash!;
        const blockNumber = log.blockNumber!;
        const block = blocksByNumber[blockNumber];
        const tx = transactionsByHash[txHash];

        if (log.topics[0] === DepositTopic) {
          return {
            type: "deposit",
            ts: block.timestamp,
            txHash: tx.hash,
            address: log.address,
            account: decoded?.indexed[1]?.val,
            depositAmount: decoded?.body[0]?.val,
            receiptAmount: decoded?.body[1]?.val,
          };
        }

        if (log.topics[0] === WithdrawTopic) {
          return {
            type: "withdraw",
            ts: block.timestamp,
            txHash: tx.hash,
            address: log.address,
            account: decoded?.indexed[2]?.val,
            withdrawAmount: decoded?.body[1]?.val,
            receiptAmount: decoded?.body[0]?.val,
          };
        }
      });

      console.log(actions);
    },
  });
}
