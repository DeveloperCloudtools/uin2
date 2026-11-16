import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { s3 } from "@/lib/minio";

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ error: "Não autenticado." }, { status: 401 });
    }

    const key = new URL(request.url).searchParams.get("key");
    if (!key) {
      return Response.json(
        { error: "Indique a imagem a descarregar." },
        { status: 400 }
      );
    }

    const bucket = process.env.MINIO_BUCKET;
    if (!bucket) {
      return Response.json(
        { error: "O armazenamento de imagens não está configurado." },
        { status: 500 }
      );
    }

    const object = await s3.send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      })
    );

    const fileName = key.split("/").pop() || "imagem";
    const encodedFileName = encodeURIComponent(fileName).replace(
      /[!'()*]/g,
      (character) =>
        `%${character.charCodeAt(0).toString(16).toUpperCase()}`
    );
    const headers = new Headers({
      "Content-Type": object.ContentType || "application/octet-stream",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodedFileName}`,
    });

    if (object.ContentLength != null) {
      headers.set("Content-Length", String(object.ContentLength));
    }

    return new Response(object.Body.transformToWebStream(), { headers });
  } catch (error) {
    if (
      error?.name === "NoSuchKey" ||
      error?.$metadata?.httpStatusCode === 404
    ) {
      return Response.json({ error: "A imagem não foi encontrada." }, { status: 404 });
    }

    console.error("IMAGE DOWNLOAD ERROR:", error);
    return Response.json(
      { error: "Não foi possível descarregar a imagem." },
      { status: 500 }
    );
  }
}
