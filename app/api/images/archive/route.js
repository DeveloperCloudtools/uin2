import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getServerSession } from "next-auth";
import { Zip, ZipPassThrough } from "fflate";
import { authOptions } from "@/lib/auth-options";
import { s3 } from "@/lib/minio";
import { getRequestHotelConfig } from "@/lib/requestHotelConfig";

function getArchiveFileName(key, index) {
  const fileName = key
    .split("/")
    .pop()
    ?.replace(/[\\/:*?"<>|\u0000-\u001f]/g, "_");
  const safeName =
    fileName && fileName !== "." && fileName !== ".."
      ? fileName
      : `imagem-${index + 1}`;

  return `${String(index + 1).padStart(3, "0")}-${safeName}`;
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ error: "Não autenticado." }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    if (
      !Array.isArray(body?.keys) ||
      body.keys.length === 0 ||
      body.keys.some((key) => typeof key !== "string" || key.length === 0)
    ) {
      return Response.json(
        { error: "Selecione uma ou mais imagens para descarregar." },
        { status: 400 }
      );
    }

    const keys = [...new Set(body.keys)];
    const { MINIO_BUCKET: bucket } = await getRequestHotelConfig();
    if (!bucket) {
      return Response.json(
        { error: "O armazenamento de imagens não está configurado." },
        { status: 500 }
      );
    }

    let currentBody;
    let cancelled = false;
    let streamFinished = false;
    const archive = new ReadableStream({
      async start(controller) {
        const zip = new Zip((error, chunk, final) => {
          if (cancelled || streamFinished) return;
          if (error) {
            streamFinished = true;
            controller.error(error);
            return;
          }

          controller.enqueue(chunk);
          if (final) {
            streamFinished = true;
            controller.close();
          }
        });

        try {
          for (let index = 0; index < keys.length; index += 1) {
            if (cancelled) return;

            const object = await s3.send(
              new GetObjectCommand({
                Bucket: bucket,
                Key: keys[index],
              })
            );
            currentBody = object.Body;

            if (!currentBody) {
              throw new Error(`O objeto "${keys[index]}" não tem conteúdo.`);
            }

            const file = new ZipPassThrough(
              getArchiveFileName(keys[index], index)
            );
            zip.add(file);

            for await (const chunk of currentBody) {
              if (cancelled) return;
              file.push(
                chunk instanceof Uint8Array ? chunk : new Uint8Array(chunk)
              );
            }

            file.push(new Uint8Array(0), true);
            currentBody = null;
          }

          zip.end();
        } catch (error) {
          currentBody?.destroy?.();
          if (!cancelled && !streamFinished) {
            streamFinished = true;
            controller.error(error);
          }
        }
      },
      cancel() {
        cancelled = true;
        currentBody?.destroy?.();
      },
    });

    return new Response(archive, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="imagens-${new Date()
          .toISOString()
          .slice(0, 10)}.zip"`,
      },
    });
  } catch (error) {
    console.error("IMAGE ARCHIVE ERROR:", error);
    return Response.json(
      { error: "Não foi possível criar o arquivo ZIP das imagens." },
      { status: 500 }
    );
  }
}
