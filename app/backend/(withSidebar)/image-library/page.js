"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { LuImage, LuRefreshCw } from "react-icons/lu";
import Topbar from "@/components/layout/Topbar";

function formatFileSize(size) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ImageLibraryPage() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadImages = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/images");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Não foi possível carregar as imagens.");
      }

      setImages(data);
    } catch (loadError) {
      console.error(loadError);
      setError(loadError.message || "Não foi possível carregar as imagens.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadImages();
  }, [loadImages]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="-mx-6 -mt-6">
        <Topbar title="Arquivo de imagens" />
      </div>

      <div className="my-6 flex items-center justify-between gap-4">
        <p className="text-sm text-gray-600">
          {images.length} {images.length === 1 ? "imagem armazenada" : "imagens armazenadas"}
        </p>
        <button
          type="button"
          onClick={loadImages}
          disabled={loading}
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <LuRefreshCw
            aria-hidden="true"
            className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
          />
          Atualizar
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {loading ? (
        <p className="py-12 text-center text-sm text-gray-500">
          A carregar imagens...
        </p>
      ) : !error && images.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white py-16 text-center">
          <LuImage aria-hidden="true" className="mx-auto h-10 w-10 text-gray-400" />
          <p className="mt-3 text-sm text-gray-600">
            Ainda não existem imagens armazenadas.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {images.map((image) => (
            <article
              key={image.key}
              className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
            >
              <a href={image.url} target="_blank" rel="noreferrer">
                <Image
                  src={image.url}
                  alt={image.key}
                  width={640}
                  height={480}
                  unoptimized
                  loading="lazy"
                  className="h-48 w-full bg-gray-100 object-contain"
                />
              </a>
              <div className="space-y-1 p-3">
                <p className="truncate text-sm font-medium text-gray-800" title={image.key}>
                  {image.key.split("/").pop()}
                </p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(image.size)}
                  {image.lastModified
                    ? ` · ${new Intl.DateTimeFormat("pt-PT", {
                        dateStyle: "short",
                        timeStyle: "short",
                      }).format(new Date(image.lastModified))}`
                    : ""}
                </p>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
