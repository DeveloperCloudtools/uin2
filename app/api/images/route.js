import { ListObjectsV2Command } from "@aws-sdk/client-s3";
import { s3 } from "@/lib/minio";

export async function GET() {
  const bucket = process.env.MINIO_BUCKET;
  const endpoint = process.env.MINIO_ENDPOINT?.replace(/\/+$/, "");

  if (!bucket || !endpoint) {
    return Response.json(
      { error: "O armazenamento de imagens não está configurado." },
      { status: 500 }
    );
  }

  try {
    const objects = [];
    let continuationToken;

    do {
      const result = await s3.send(
        new ListObjectsV2Command({
          Bucket: bucket,
          ContinuationToken: continuationToken,
          MaxKeys: 1000,
        })
      );

      objects.push(
        ...(result.Contents || [])
          .filter((object) => object.Key)
          .map((object) => {
            const encodedKey = object.Key
              .split("/")
              .map(encodeURIComponent)
              .join("/");

            return {
              key: object.Key,
              url: `${endpoint}/${encodeURIComponent(bucket)}/${encodedKey}`,
              size: object.Size || 0,
              lastModified: object.LastModified || null,
            };
          })
      );

      if (result.IsTruncated && !result.NextContinuationToken) {
        throw new Error("O armazenamento não forneceu o token da próxima página.");
      }

      continuationToken = result.IsTruncated
        ? result.NextContinuationToken
        : undefined;
    } while (continuationToken);

    objects.sort(
      (a, b) => new Date(b.lastModified || 0) - new Date(a.lastModified || 0)
    );

    return Response.json(objects);
  } catch (error) {
    console.error("IMAGE LIST ERROR:", error);
    return Response.json(
      { error: "Não foi possível carregar as imagens armazenadas." },
      { status: 500 }
    );
  }
}
