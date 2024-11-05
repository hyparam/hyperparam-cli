import { ColumnData, parquetQuery } from "hyparquet";
import { compressors } from "hyparquet-compressors";
import type {
  ChunkMessage,
  ErrorMessage,
  ParquetReadWorkerOptions,
  ResultMessage,
} from "./types.ts";
import { asyncBufferFrom } from "./parquetWorkerClient.ts";

const postChunkMessage = ({ chunk, queryId }: ChunkMessage) => {
  self.postMessage({ chunk, queryId });
};
const postResultMessage = ({ result, queryId }: ResultMessage) => {
  self.postMessage({ result, queryId });
};
const postErrorMessage = ({ error, queryId }: ErrorMessage) => {
  self.postMessage({ error, queryId });
};

self.onmessage = async ({
  data,
}: {
  data: ParquetReadWorkerOptions & { queryId: number; chunks: boolean };
}) => {
  const {
    metadata,
    from,
    rowStart,
    rowEnd,
    orderBy,
    columns,
    queryId,
    chunks,
  } = data;
  const file = await asyncBufferFrom(from);
  const onChunk = chunks
    ? (chunk: ColumnData) => {
        postChunkMessage({ chunk, queryId });
      }
    : undefined;
  try {
    const result = await parquetQuery({
      metadata,
      file,
      rowStart,
      rowEnd,
      orderBy,
      columns,
      compressors,
      onChunk,
    });
    postResultMessage({ result, queryId });
  } catch (error) {
    postErrorMessage({ error: error as Error, queryId });
  }
};
