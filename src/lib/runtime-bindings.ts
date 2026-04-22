type R2BucketLike = {
  put: (
    key: string,
    value: ArrayBuffer | ArrayBufferView | ReadableStream | string | Blob,
    options?: { httpMetadata?: { contentType?: string } },
  ) => Promise<unknown>
}

type WorkersAILike = {
  run: (model: string, input: unknown) => Promise<unknown>
}

let runtimeR2Bucket: R2BucketLike | null = null
let runtimeAI: WorkersAILike | null = null

export const setRuntimeR2Bucket = (bucket: unknown): void => {
  if (bucket && typeof (bucket as { put?: unknown }).put === 'function') {
    runtimeR2Bucket = bucket as R2BucketLike
  } else {
    runtimeR2Bucket = null
  }
}

export const getRuntimeR2Bucket = (): R2BucketLike | null => runtimeR2Bucket

export const setRuntimeAI = (ai: unknown): void => {
  if (ai && typeof (ai as { run?: unknown }).run === 'function') {
    runtimeAI = ai as WorkersAILike
  } else {
    runtimeAI = null
  }
}

export const getRuntimeAI = (): WorkersAILike | null => runtimeAI
