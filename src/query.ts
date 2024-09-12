import { byKey, sleep } from "./utils";

import {
  HypersyncClient,
  LogField,
  Query,
  BlockField,
  TransactionField,
  Log,
  Block,
  Transaction,
} from "@envio-dev/hypersync-client";

type Metrics = {
  name: string;
  archiveHeight: number | undefined;
  nextBlock: number;
  executionTime: number;
};

type Data = {
  metrics: Metrics;
  logs: Log[];
  blocksByNumber: Record<string, Block>;
  transactionsByHash: Record<string, Transaction>;
};

type GetEventsDataParams = {
  name: string;
  client: HypersyncClient;
  query: Partial<Query>;
  onData: (data: Data) => Promise<void>;
};

export async function getData(params: GetEventsDataParams) {
  const query = {
    ...params.query,
    fieldSelection: {
      block: [BlockField.Number, BlockField.Timestamp, BlockField.Hash],
      log: [
        LogField.BlockNumber,
        LogField.LogIndex,
        LogField.TransactionIndex,
        LogField.TransactionHash,
        LogField.Data,
        LogField.Address,
        LogField.Topic0,
        LogField.Topic1,
        LogField.Topic2,
        LogField.Topic3,
      ],
      transaction: [
        TransactionField.BlockNumber,
        TransactionField.TransactionIndex,
        TransactionField.Hash,
        TransactionField.From,
        TransactionField.To,
        TransactionField.Value,
        TransactionField.Input,
      ],
    },
  } as Query;

  while (true) {
    console.log(`Start fetching from block ${query.fromBlock} for ${params.name}`);
    const result = await params.client.get(query);

    const logs = result.data.logs;
    const blocksByNumber = byKey(result.data.blocks, "number");
    const transactionsByHash = byKey(result.data.transactions, "hash");

    const metrics = {
      name: params.name,
      archiveHeight: result.archiveHeight,
      nextBlock: result.nextBlock,
      executionTime: result.totalExecutionTime,
    };

    await params.onData({
      metrics,
      logs,
      blocksByNumber,
      transactionsByHash,
    });

    let height = result.archiveHeight || 0;

    while (height < result.nextBlock) {
      height = await params.client.getHeight();
      await sleep(1000);
    }

    query.fromBlock = result.nextBlock;
  }
}
