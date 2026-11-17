"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Topbar from "@/components/layout/Topbar";
import { LuImage, LuRefreshCw, LuUpload, LuX } from "react-icons/lu";

export default function AreasPage() {
  const [areas, setAreas] = useState([]);
  const [languages, setLanguages] = useState([]);

  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [form, setForm] = useState({
    area_name1: "",
    area_name2: "",
    area_name3: "",
    area_name4: "",
    area_name5: "",
  });

  // ✅ IMAGE STATE (FIXED)
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [existingImage, setExistingImage] = useState(null);
  const [showImageLibrary, setShowImageLibrary] = useState(false);
  const [imageLibrary, setImageLibrary] = useState([]);
  const [imageLibrarySearch, setImageLibrarySearch] = useState("");
  const [isLoadingImageLibrary, setIsLoadingImageLibrary] = useState(false);
  const [imageLibraryError, setImageLibraryError] = useState("");

  const filteredLibraryImages = imageLibrary.filter((image) =>
    (image.key.split("/").pop() || image.key)
      .toLowerCase()
      .includes(imageLibrarySearch.trim().toLowerCase())
  );

  function releaseImagePreview() {
    if (imagePreview?.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreview);
    }
  }

  function resetImageSelection() {
    releaseImagePreview();
    setImageFile(null);
    setImagePreview(null);
    setExistingImage(null);
    setShowImageLibrary(false);
    setImageLibrarySearch("");
  }

  function closeAreaModal() {
    resetImageSelection();
    setShowModal(false);
  }

  // ---------------- FETCH ----------------

  async function fetchAreas() {
    const res = await fetch("/api/areas");
    const data = await res.json();
    setAreas(data);
  }

  async function fetchLanguages() {
    const res = await fetch("/api/languages");
    const data = await res.json();

    const sorted = data.sort((a, b) => a.lang_order - b.lang_order);
    setLanguages(sorted);
  }

  useEffect(() => {
    fetchAreas();
    fetchLanguages();
  }, []);

  // ---------------- MODAL ----------------

  function openCreate() {
    setEditingId(null);
    resetImageSelection();

    setForm({
      area_name1: "",
      area_name2: "",
      area_name3: "",
      area_name4: "",
      area_name5: "",
    });

    setShowModal(true);
  }

  function openEdit(cat) {
    setEditingId(cat.area_id);
    resetImageSelection();

    setForm({
      area_name1: cat.area_name1 || "",
      area_name2: cat.area_name2 || "",
      area_name3: cat.area_name3 || "",
      area_name4: cat.area_name4 || "",
      area_name5: cat.area_name5 || "",
    });

    setImagePreview(cat.area_card_background || null);
    setExistingImage(cat.area_card_background || null);

    setShowModal(true);
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  // ---------------- IMAGE UPLOAD ----------------

  async function uploadImage(file) {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) throw new Error("Upload failed");

    const data = await response.json();
    return data.url;
  }

  async function openImageLibrary() {
    setShowImageLibrary(true);
    setIsLoadingImageLibrary(true);
    setImageLibraryError("");

    try {
      const response = await fetch("/api/images");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Não foi possível carregar o arquivo de imagens."
        );
      }

      setImageLibrary(data);
    } catch (error) {
      console.error(error);
      setImageLibraryError(
        error.message || "Não foi possível carregar o arquivo de imagens."
      );
    } finally {
      setIsLoadingImageLibrary(false);
    }
  }

  function selectLibraryImage(image) {
    releaseImagePreview();
    setImageFile(null);
    setImagePreview(image.url);
    setExistingImage(image.url);
    setShowImageLibrary(false);
  }

  function selectUploadedImage(file) {
    if (!file) return;

    if (file.size > 850 * 1024) {
      alert("A imagem não pode exceder 850 KB.");
      return;
    }

    releaseImagePreview();
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setExistingImage(null);
  }

  // ---------------- SAVE (CREATE + EDIT FIXED) ----------------

  async function handleSubmit(e) {
    e.preventDefault();
    setIsSaving(true);

    try {
      let imageUrl = existingImage;

      // upload only if new file selected
      if (imageFile instanceof File) {
        imageUrl = await uploadImage(imageFile);
      }

      const payload = {
        ...form,
        area_card_background: imageUrl,
      };

      const url = editingId
        ? `/api/areas/${editingId}`
        : "/api/areas";

      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Save failed");

      await fetchAreas();

      setShowModal(false);
      resetImageSelection();
    } catch (err) {
      console.error(err);
      alert("Error saving area");
    } finally {
      setIsSaving(false);
    }
  }

  async function remove(id) {
    try {
      setDeletingId(id);

      const response = await fetch(`/api/areas/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Delete failed");

      await fetchAreas();
    } catch (err) {
      console.error(err);
      alert("Error deleting area");
    } finally {
      setDeletingId(null);
    }
  }

  async function toggleVisible(cat) {
    await fetch(`/api/areas/${cat.area_id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        visible: !cat.visible,
      }),
    });

    fetchAreas();
  }

  // ---------------- FILTER ----------------

  const filtered = areas.filter((c) =>
    languages.some((lang) => {
      const field = `area_name${lang.lang_order}`;
      return (c[field] || "")
        .toLowerCase()
        .includes(search.toLowerCase());
    })
  );

  return (
    <div className="min-h-screen bg-gray-50">

      <div className="-mx-6 -mt-6">
        <Topbar title="Areas" />
      </div>

      {/* HEADER */}
      <div className="flex items-center justify-between my-6">

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Pesquisar areas..."
          className="h-11 w-80 border rounded-lg px-3"
        />

        <button
          onClick={openCreate}
          className="h-11 px-5 bg-red-500 text-white rounded-lg"
        >
          + Criar Area
        </button>

      </div>

      {/* TABLE (unchanged) */}
      <div className="bg-white border rounded-2xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-left text-gray-600">
            <tr>
              <th className="p-4">ID</th>

              {languages.map((lang) => (
                <th key={lang.lang_id} className="p-4">
                  {lang.lang_name}
                </th>
              ))}

              <th className="p-4">Visible</th>
              <th className="p-4 text-right">Ações</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((cat) => (
              <tr key={cat.area_id} className="border-t">
                <td className="p-4">{cat.area_id}</td>

                {languages.map((lang) => {
                  const field = `area_name${lang.lang_order}`;
                  return (
                    <td key={lang.lang_id} className="p-4">
                      {cat[field]}
                    </td>
                  );
                })}

                <td className="p-4">
                  <button
                    onClick={() => toggleVisible(cat)}
                    className="px-3 py-1 rounded-lg"
                  >
                    {cat.visible ? "Visível" : "Oculto"}
                  </button>
                </td>

                <td className="p-4 flex gap-2 justify-end">
                  <button
                    onClick={() => openEdit(cat)}
                    className="px-3 py-1 bg-gray-200 rounded-lg"
                  >
                    Editar
                  </button>

                  <button
                    onClick={() => remove(cat.area_id)}
                    disabled={deletingId === cat.area_id}
                    className={`px-3 py-1 rounded-lg ${deletingId === cat.area_id ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-red-500 text-white"}`}
                  >
                    {deletingId === cat.area_id ? "Eliminar" : "Eliminar"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

          <form
            onSubmit={handleSubmit}
            className="bg-white p-6 rounded-2xl w-[450px] max-h-[90vh] overflow-y-auto flex flex-col gap-3"
          >

            <h2 className="text-lg font-semibold">
              {editingId ? "Editar" : "Criar"}
            </h2>

            {languages.map((lang) => {
              const field = `area_name${lang.lang_order}`;

              return (
                <input
                  key={lang.lang_id}
                  name={field}
                  value={form[field] || ""}
                  onChange={handleChange}
                  className="h-10 border rounded-lg px-3"
                  placeholder={lang.lang_name}
                />
              );
            })}

            <div className="flex flex-col gap-3">
              <p className="text-sm font-medium text-gray-700">Imagem da área</p>
              <div className="flex flex-wrap gap-2">
                <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-gray-300 px-3 text-sm text-gray-700 transition hover:bg-gray-50">
                  <LuUpload aria-hidden="true" className="h-4 w-4" />
                  Carregar imagem
                  <input
                    type="file"
                    accept=".png,.jpg,.jpeg,.webp,image/*"
                    className="sr-only"
                    onChange={(event) => {
                      selectUploadedImage(event.target.files?.[0]);
                      event.target.value = "";
                    }}
                  />
                </label>
                <button
                  type="button"
                  onClick={openImageLibrary}
                  className="inline-flex h-10 items-center gap-2 rounded-lg border border-gray-300 px-3 text-sm text-gray-700 transition hover:bg-gray-50"
                >
                  <LuImage aria-hidden="true" className="h-4 w-4" />
                  Escolher do arquivo
                </button>
              </div>
              <p className="text-xs text-gray-500">
                PNG, JPG, JPEG ou WEBP. Upload até 850 KB.
              </p>

              {imagePreview && (
                <div className="relative overflow-hidden rounded-xl border bg-gray-50">
                  <Image
                    src={imagePreview}
                    alt="Pré-visualização da imagem da área"
                    width={800}
                    height={450}
                    unoptimized
                    className="h-48 w-full object-contain"
                  />
                  <button
                    type="button"
                    onClick={resetImageSelection}
                    aria-label="Remover imagem selecionada"
                    className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-red-600 text-white shadow-lg transition hover:bg-red-700"
                  >
                    ✕
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-3 py-2 text-xs text-white">
                    Imagem selecionada
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={closeAreaModal}
                disabled={isSaving}
                className={`px-4 py-2 rounded-lg ${isSaving ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-gray-200"}`}
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className={`px-4 py-2 rounded-lg ${isSaving ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-red-500 text-white"}`}
              >
                {isSaving ? "Guardar" : "Guardar"}
              </button>
            </div>

          </form>

        </div>
      )}

      {showImageLibrary && showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="area-image-library-title"
            className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            <header className="flex items-center justify-between gap-4 border-b border-gray-200 px-5 py-4">
              <div>
                <h2
                  id="area-image-library-title"
                  className="text-lg font-semibold text-gray-900"
                >
                  Escolher do arquivo de imagens
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Selecione a imagem que pretende usar nesta área.
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={openImageLibrary}
                  disabled={isLoadingImageLibrary}
                  aria-label="Atualizar arquivo de imagens"
                  className="rounded-lg p-2 text-gray-600 transition hover:bg-gray-100 disabled:opacity-50"
                >
                  <LuRefreshCw
                    aria-hidden="true"
                    className={`h-5 w-5 ${isLoadingImageLibrary ? "animate-spin" : ""}`}
                  />
                </button>
                <button
                  type="button"
                  onClick={() => setShowImageLibrary(false)}
                  aria-label="Fechar arquivo de imagens"
                  className="rounded-lg p-2 text-gray-600 transition hover:bg-gray-100"
                >
                  <LuX aria-hidden="true" className="h-5 w-5" />
                </button>
              </div>
            </header>

            <div className="min-h-0 overflow-y-auto p-5">
              <input
                type="search"
                value={imageLibrarySearch}
                onChange={(event) => setImageLibrarySearch(event.target.value)}
                placeholder="Pesquisar imagens..."
                className="mb-4 h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-red-500"
              />

              {imageLibraryError ? (
                <p role="alert" className="py-12 text-center text-sm text-red-600">
                  {imageLibraryError}
                </p>
              ) : isLoadingImageLibrary ? (
                <p className="py-12 text-center text-sm text-gray-500">
                  A carregar imagens...
                </p>
              ) : imageLibrary.length === 0 ? (
                <p className="py-12 text-center text-sm text-gray-500">
                  Não existem imagens no arquivo.
                </p>
              ) : filteredLibraryImages.length === 0 ? (
                <p className="py-12 text-center text-sm text-gray-500">
                  Nenhuma imagem corresponde à pesquisa.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                  {filteredLibraryImages.map((image) => (
                    <button
                      key={image.key}
                      type="button"
                      onClick={() => selectLibraryImage(image)}
                      title={image.key}
                      className="overflow-hidden rounded-lg border border-gray-200 bg-white text-left transition hover:border-red-400 hover:ring-2 hover:ring-red-100 focus:outline-none focus:ring-2 focus:ring-red-400"
                    >
                      <Image
                        src={image.url}
                        alt={image.key.split("/").pop() || image.key}
                        width={320}
                        height={220}
                        unoptimized
                        className="h-36 w-full bg-gray-50 object-contain"
                      />
                      <span className="block truncate border-t border-gray-100 px-3 py-2 text-sm text-gray-700">
                        {image.key.split("/").pop() || image.key}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      )}

    </div>
  );
}