import {
  DeleteObjectsCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { s3 } from "@/lib/minio";

export async function GET() {
  const bucket = process.env.MINIO_BUCKET;
  const endpoint = process.env.MINIO_ENDPOINT?.replace(/\/+$/, "");

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ error: "Não autenticado." }, { status: 401 });
    }

    if (!bucket || !endpoint) {
      return Response.json(
        { error: "O armazenamento de imagens não está configurado." },
        { status: 500 }
      );
    }

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

export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ error: "Não autenticado." }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const isBulkRequest = Array.isArray(body?.keys);
    const requestedKeys = isBulkRequest ? body.keys : [body?.key];

    if (
      requestedKeys.length === 0 ||
      requestedKeys.some((key) => typeof key !== "string" || key.length === 0)
    ) {
      return Response.json(
        { error: "Indique uma ou mais imagens válidas para apagar." },
        { status: 400 }
      );
    }

    const keys = [...new Set(requestedKeys)];
    const bucket = process.env.MINIO_BUCKET;
    if (!bucket) {
      return Response.json(
        { error: "O armazenamento de imagens não está configurado." },
        { status: 500 }
      );
    }

    const deletedKeys = [];
    const failures = [];

    for (let index = 0; index < keys.length; index += 1000) {
      const batch = keys.slice(index, index + 1000);

      try {
        const result = await s3.send(
          new DeleteObjectsCommand({
            Bucket: bucket,
            Delete: {
              Objects: batch.map((key) => ({ Key: key })),
              Quiet: false,
            },
          })
        );
        const errorsByKey = new Map(
          (result.Errors || []).map((error) => [
            error.Key,
            error.Message || error.Code || "Falha ao apagar.",
          ])
        );

        for (const key of batch) {
          const message = errorsByKey.get(key);
          if (message) {
            failures.push({ key, message });
          } else {
            deletedKeys.push(key);
          }
        }
      } catch (error) {
        console.error("IMAGE DELETE BATCH ERROR:", error);
        failures.push(
          ...batch.map((key) => ({
            key,
            message: "Não foi possível apagar a imagem.",
          }))
        );
      }
    }

    if (failures.length > 0) {
      return Response.json(
        { deletedKeys, failures },
        { status: isBulkRequest ? 207 : 500 }
      );
    }

    return Response.json({ deleted: true, deletedKeys });
  } catch (error) {
    console.error("IMAGE DELETE ERROR:", error);
    return Response.json(
      { error: "Não foi possível apagar a imagem." },
      { status: 500 }
    );
  }
}
