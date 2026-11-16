"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import {
  LuArchive,
  LuDownload,
  LuImage,
  LuRefreshCw,
  LuTrash2,
  LuUpload,
  LuX,
} from "react-icons/lu";
import Topbar from "@/components/layout/Topbar";

const MAX_IMAGE_SIZE = 850 * 1024;

function formatFileSize(size) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileExtension(key) {
  const fileName = key.split("/").pop() || "";
  const extensionIndex = fileName.lastIndexOf(".");
  return extensionIndex > 0 ? fileName.slice(extensionIndex).toLowerCase() : "";
}

export default function ImageLibraryPage() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [format, setFormat] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");
  const [isUploading, setIsUploading] = useState(false);
  const [deletingKey, setDeletingKey] = useState(null);
  const [actionError, setActionError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [selectedKeys, setSelectedKeys] = useState(() => new Set());
  const [bulkAction, setBulkAction] = useState(null);

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
      const availableKeys = new Set(data.map((image) => image.key));
      setSelectedKeys((currentKeys) =>
        new Set([...currentKeys].filter((key) => availableKeys.has(key)))
      );
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

  async function uploadImages(event) {
    const input = event.currentTarget;
    const files = Array.from(input.files || []);
    input.value = "";

    if (files.length === 0) return;

    const oversizedFile = files.find((file) => file.size > MAX_IMAGE_SIZE);
    if (oversizedFile) {
      setActionError(`A imagem "${oversizedFile.name}" excede 850 KB.`);
      setActionMessage("");
      return;
    }

    setIsUploading(true);
    setActionError("");
    setActionMessage("");

    let uploadedCount = 0;
    const failures = [];

    try {
      for (const file of files) {
        try {
          const formData = new FormData();
          formData.append("file", file);

          const response = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });
          const data = await response.json();

          if (!response.ok || !data.url) {
            throw new Error(data.error || "Falha no upload.");
          }

          uploadedCount += 1;
        } catch (uploadError) {
          failures.push(
            `${file.name}: ${uploadError.message || "Falha no upload."}`
          );
        }
      }

      if (uploadedCount > 0) {
        await loadImages();
      }

      if (failures.length > 0) {
        setActionError(
          `${uploadedCount} de ${files.length} imagens carregadas. ${failures.join(" ")}`
        );
      } else {
        setActionMessage(
          `${uploadedCount} ${uploadedCount === 1 ? "imagem carregada" : "imagens carregadas"} com sucesso.`
        );
      }
    } catch (uploadError) {
      console.error(uploadError);
      setActionError(uploadError.message || "Não foi possível carregar as imagens.");
    } finally {
      setIsUploading(false);
    }
  }

  async function deleteImage(image) {
    const fileName = image.key.split("/").pop() || image.key;
    if (
      !window.confirm(
        `Apagar a imagem "${fileName}"? O ficheiro deixará de estar disponível em qualquer página que o utilize.`
      )
    ) {
      return;
    }

    setDeletingKey(image.key);
    setActionError("");
    setActionMessage("");

    try {
      const response = await fetch("/api/images", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: image.key }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Não foi possível apagar a imagem.");
      }

      setImages((currentImages) =>
        currentImages.filter((currentImage) => currentImage.key !== image.key)
      );
      setSelectedKeys((currentKeys) => {
        const nextKeys = new Set(currentKeys);
        nextKeys.delete(image.key);
        return nextKeys;
      });
      setActionMessage(`A imagem "${fileName}" foi apagada.`);
    } catch (deleteError) {
      console.error(deleteError);
      setActionError(
        deleteError.message || "Não foi possível apagar a imagem."
      );
    } finally {
      setDeletingKey(null);
    }
  }

  function toggleImageSelection(key) {
    setSelectedKeys((currentKeys) => {
      const nextKeys = new Set(currentKeys);
      if (nextKeys.has(key)) {
        nextKeys.delete(key);
      } else {
        nextKeys.add(key);
      }
      return nextKeys;
    });
  }

  function toggleVisibleSelection(visibleKeys) {
    setSelectedKeys((currentKeys) => {
      const nextKeys = new Set(currentKeys);
      const allVisibleSelected = visibleKeys.every((key) =>
        nextKeys.has(key)
      );

      visibleKeys.forEach((key) => {
        if (allVisibleSelected) {
          nextKeys.delete(key);
        } else {
          nextKeys.add(key);
        }
      });
      return nextKeys;
    });
  }

  async function deleteSelectedImages() {
    const keys = [...selectedKeys];
    if (keys.length === 0) return;

    if (
      !window.confirm(
        `Apagar ${keys.length} imagens selecionadas? Os ficheiros deixarão de estar disponíveis em qualquer página que os utilize.`
      )
    ) {
      return;
    }

    setBulkAction("delete");
    setActionError("");
    setActionMessage("");

    try {
      const response = await fetch("/api/images", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keys }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Não foi possível apagar as imagens.");
      }

      const deletedKeys = new Set(data.deletedKeys || []);
      setImages((currentImages) =>
        currentImages.filter((image) => !deletedKeys.has(image.key))
      );
      setSelectedKeys((currentKeys) =>
        new Set([...currentKeys].filter((key) => !deletedKeys.has(key)))
      );

      if (data.failures?.length) {
        const failedNames = data.failures
          .slice(0, 5)
          .map(({ key }) => key.split("/").pop() || key)
          .join(", ");
        setActionError(
          `${deletedKeys.size} imagens apagadas; ${data.failures.length} falharam: ${failedNames}`
        );
      } else {
        setActionMessage(
          `${deletedKeys.size} ${deletedKeys.size === 1 ? "imagem apagada" : "imagens apagadas"} com sucesso.`
        );
      }
    } catch (deleteError) {
      console.error(deleteError);
      setActionError(
        deleteError.message || "Não foi possível apagar as imagens."
      );
    } finally {
      setBulkAction(null);
    }
  }

  async function downloadSelectedArchive() {
    const keys = [...selectedKeys];
    if (keys.length === 0) return;

    setBulkAction("download");
    setActionError("");
    setActionMessage("");

    try {
      const response = await fetch("/api/images/archive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keys }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Não foi possível criar o arquivo ZIP.");
      }

      const archive = await response.blob();
      const url = URL.createObjectURL(archive);
      const link = document.createElement("a");
      link.href = url;
      link.download = `imagens-${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setActionMessage(`${keys.length} imagens descarregadas em ZIP.`);
    } catch (downloadError) {
      console.error(downloadError);
      setActionError(
        downloadError.message || "Não foi possível descarregar as imagens."
      );
    } finally {
      setBulkAction(null);
    }
  }

  const formats = [...new Set(images.map((image) => getFileExtension(image.key)))].sort();
  const normalizedSearch = search.trim().toLowerCase();
  const filteredImages = images
    .filter((image) => {
      const fileName = image.key.split("/").pop() || image.key;
      const extension = getFileExtension(image.key) || "no-extension";

      return (
        fileName.toLowerCase().includes(normalizedSearch) &&
        (format === "all" || extension === format)
      );
    })
    .sort((a, b) => {
      if (sortOrder === "name") {
        return a.key.localeCompare(b.key, "pt", { sensitivity: "base" });
      }

      if (sortOrder === "size") {
        return b.size - a.size;
      }

      const aDate = a.lastModified ? new Date(a.lastModified).getTime() : 0;
      const bDate = b.lastModified ? new Date(b.lastModified).getTime() : 0;
      return sortOrder === "oldest" ? aDate - bDate : bDate - aDate;
    });
  const visibleKeys = filteredImages.map((image) => image.key);
  const allVisibleSelected =
    visibleKeys.length > 0 &&
    visibleKeys.every((key) => selectedKeys.has(key));
  const isBusy =
    isUploading || deletingKey !== null || bulkAction !== null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="-mx-6 -mt-6">
        <Topbar title="Arquivo de imagens" />
      </div>

      <div className="my-6 flex items-center justify-between gap-4">
        <p className="text-sm text-gray-600">
          {loading
            ? "A carregar imagens..."
            : `${filteredImages.length} de ${images.length} imagens`}
        </p>
        <div className="flex items-center gap-2">
          <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-medium text-white transition hover:bg-red-700 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60">
            <LuUpload aria-hidden="true" className="h-4 w-4" />
            {isUploading ? "A carregar..." : "Adicionar imagens"}
            <input
              type="file"
              multiple
              accept=".png,.jpg,.jpeg,.webp,image/*"
              disabled={isBusy}
              onChange={uploadImages}
              className="sr-only"
            />
          </label>
          <button
            type="button"
            onClick={loadImages}
            disabled={loading || isBusy}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <LuRefreshCw
              aria-hidden="true"
              className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
            />
            Atualizar
          </button>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {actionError && (
        <div
          role="alert"
          className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {actionError}
        </div>
      )}
      {actionMessage && (
        <div
          role="status"
          className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700"
        >
          {actionMessage}
        </div>
      )}

      {!loading &&
        !error &&
        (filteredImages.length > 0 || selectedKeys.size > 0) && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4">
            <div className="flex items-center gap-3 text-sm text-gray-700">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={allVisibleSelected}
                  disabled={visibleKeys.length === 0 || isBusy}
                  onChange={() => toggleVisibleSelection(visibleKeys)}
                  className="h-4 w-4 rounded border-gray-300 accent-red-600"
                />
                Selecionar resultados ({filteredImages.length})
              </label>
              <span className="text-gray-500">
                {selectedKeys.size} selecionadas
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={downloadSelectedArchive}
                disabled={selectedKeys.size === 0 || isBusy}
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-gray-300 px-3 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <LuArchive aria-hidden="true" className="h-4 w-4" />
                {bulkAction === "download" ? "A criar ZIP..." : "Descarregar ZIP"}
              </button>
              <button
                type="button"
                onClick={deleteSelectedImages}
                disabled={selectedKeys.size === 0 || isBusy}
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-red-600 px-3 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <LuTrash2 aria-hidden="true" className="h-4 w-4" />
                {bulkAction === "delete" ? "A apagar..." : "Apagar selecionadas"}
              </button>
              {selectedKeys.size > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedKeys(new Set())}
                  disabled={isBusy}
                  className="inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm text-gray-600 transition hover:bg-gray-100 disabled:opacity-50"
                >
                  <LuX aria-hidden="true" className="h-4 w-4" />
                  Limpar seleção
                </button>
              )}
            </div>
          </div>
        )}

      {!loading && !error && images.length > 0 && (
        <div className="mb-6 grid grid-cols-1 gap-3 rounded-xl border border-gray-200 bg-white p-4 sm:grid-cols-3">
          <label className="text-sm font-medium text-gray-700">
            Pesquisar por nome
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Ex.: fotografia"
              className="mt-1 h-10 w-full rounded-lg border border-gray-300 px-3 font-normal outline-none focus:border-red-500"
            />
          </label>

          <label className="text-sm font-medium text-gray-700">
            Formato
            <select
              value={format}
              onChange={(event) => setFormat(event.target.value)}
              className="mt-1 h-10 w-full rounded-lg border border-gray-300 bg-white px-3 font-normal outline-none focus:border-red-500"
            >
              <option value="all">Todos os formatos</option>
              {formats.map((extension) => (
                <option
                  key={extension || "no-extension"}
                  value={extension || "no-extension"}
                >
                  {extension ? extension.slice(1).toUpperCase() : "Sem extensão"}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm font-medium text-gray-700">
            Ordenar por
            <select
              value={sortOrder}
              onChange={(event) => setSortOrder(event.target.value)}
              className="mt-1 h-10 w-full rounded-lg border border-gray-300 bg-white px-3 font-normal outline-none focus:border-red-500"
            >
              <option value="newest">Mais recentes</option>
              <option value="oldest">Mais antigas</option>
              <option value="name">Nome (A-Z)</option>
              <option value="size">Maior tamanho</option>
            </select>
          </label>
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
      ) : !error && filteredImages.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white py-16 text-center">
          <p className="text-sm text-gray-600">
            Nenhuma imagem corresponde aos filtros selecionados.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setFormat("all");
              setSortOrder("newest");
            }}
            className="mt-3 text-sm font-medium text-red-600 hover:text-red-700"
          >
            Limpar filtros
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredImages.map((image) => (
            <article
              key={image.key}
              className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
            >
              <div className="relative">
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
                <label className="absolute left-3 top-3 flex cursor-pointer items-center rounded-md bg-white/95 p-2 shadow">
                  <input
                    type="checkbox"
                    checked={selectedKeys.has(image.key)}
                    disabled={isBusy}
                    onChange={() => toggleImageSelection(image.key)}
                    aria-label={`Selecionar ${image.key.split("/").pop() || image.key}`}
                    className="h-4 w-4 rounded border-gray-300 accent-red-600"
                  />
                </label>
              </div>
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
                <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                  <a
                    href={`/api/images/download?key=${encodeURIComponent(image.key)}`}
                    className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
                  >
                    <LuDownload aria-hidden="true" className="h-4 w-4" />
                    Descarregar
                  </a>
                  <button
                    type="button"
                    onClick={() => deleteImage(image)}
                    disabled={isBusy}
                    aria-label={`Apagar ${image.key.split("/").pop() || image.key}`}
                    className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <LuTrash2 aria-hidden="true" className="h-4 w-4" />
                    {deletingKey === image.key ? "A apagar..." : "Apagar"}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
