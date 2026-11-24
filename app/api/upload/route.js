import { s3 } from "@/lib/minio";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { getRequestHotelConfig } from "@/lib/requestHotelConfig";

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ error: "Não autenticado." }, { status: 401 });
    }

    const { MINIO_BUCKET: bucket } = await getRequestHotelConfig();
    const endpoint = process.env.MINIO_ENDPOINT?.replace(/\/+$/, "");
    if (!bucket || !endpoint) {
      return Response.json(
        { error: "O armazenamento de imagens não está configurado." },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!file) {
      return Response.json({ error: "No file" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const fileName = `${Date.now()}-${file.name}`;

    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: fileName,
        Body: buffer,
        ContentType: file.type,
      })
    );

    const url = `${endpoint}/${encodeURIComponent(bucket)}/${encodeURIComponent(fileName)}`;

    return Response.json({ url });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}