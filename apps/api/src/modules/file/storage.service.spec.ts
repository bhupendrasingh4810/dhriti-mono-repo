import { HeadBucketCommand, S3Client } from "@aws-sdk/client-s3";
import { StorageService } from "./storage.service";

describe("StorageService health check", () => {
  afterEach(() => jest.restoreAllMocks());
  it("uses a read-only bucket HEAD with the caller's abort signal", async () => {
    const send = jest.spyOn(S3Client.prototype, "send").mockImplementation(() => undefined);
    const storage = new StorageService({
      s3: {
        bucket: "health-test-bucket",
        region: "us-east-1",
        forcePathStyle: false,
        accessKeyId: "test-only",
        secretAccessKey: "test-only",
      },
    } as never);
    const controller = new AbortController();
    await storage.checkHealth(controller.signal);
    expect(send).toHaveBeenCalledWith(expect.any(HeadBucketCommand), { abortSignal: controller.signal });
    expect(send.mock.calls[0][0].input).toEqual({ Bucket: "health-test-bucket" });
    storage.onModuleDestroy();
  });
});
