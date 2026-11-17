"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Topbar from "@/components/layout/Topbar";
import { LuImage, LuRefreshCw, LuUpload, LuX } from "react-icons/lu";

export default function PersonalizePage() {
  const [form, setForm] = useState({
    page_model: 1,
    primary_color: "#ef4444",
    secondary_color: "#000000",
    background_color: "#ffffff",
    foreground_color: "#000000",
    card_colors: [],
    background_image: "",
    logo: "",
    bar_text: "", 
    bar_text_details: "",
    icon_color: "#000000",
    card_text_font: "Arial",
    card_text_color: "#000000",
    card_text_size: "16",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showImageLibrary, setShowImageLibrary] = useState(false);
  const [imageLibraryField, setImageLibraryField] = useState(null);
  const [imageLibrary, setImageLibrary] = useState([]);
  const [imageLibrarySearch, setImageLibrarySearch] = useState("");
  const [isLoadingImageLibrary, setIsLoadingImageLibrary] = useState(false);
  const [imageLibraryError, setImageLibraryError] = useState("");

  const filteredLibraryImages = imageLibrary.filter((image) =>
    (image.key.split("/").pop() || image.key)
      .toLowerCase()
      .includes(imageLibrarySearch.trim().toLowerCase())
  );

  // ---------------- FETCH ----------------

  async function fetchData() {
    const res = await fetch("/api/personalize");
    const data = await res.json();

    if (data) {
      setForm({
        page_model: Number(data.page_model ?? 1),
        primary_color: data.primary_color || "#ef4444",
        secondary_color: data.secondary_color || "#000000",
        background_color: data.background_color || "#ffffff",
        foreground_color: data.foreground_color || "#000000",
        card_colors: data.card_colors || [],
        background_image: data.background_image || "",
        logo: data.logo || "",
        bar_text: data.bar_text || "",
        bar_text_details: data.bar_text_details || "",
        icon_color: data.icon_color || "#000000",
        card_text_font: data.card_text_font || "Arial",
        card_text_color: data.card_text_color || "#000000",
        card_text_size: data.card_text_size || "16",
      });
    }

    setLoading(false);
  }

  useEffect(() => {
    fetchData();
  }, []);

  // ---------------- HANDLERS ----------------

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: name === "page_model" ? Number(value) : value,
    }));
  }

  function handleCardColorChange(index, value) {
    const updated = [...form.card_colors];
    updated[index] = value;
    setForm({ ...form, card_colors: updated });
  }

  function addCardColor() {
    setForm({
      ...form,
      card_colors: [...form.card_colors, "#ffffff"],
    });
  }

  function removeCardColor(index) {
    const updated = form.card_colors.filter((_, i) => i !== index);
    setForm({ ...form, card_colors: updated });
  }

  function removeImage(field) {
    setForm((prev) => ({
      ...prev,
      [field]: "",
    }));
  }

  async function uploadImage(file, field) {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    if (data.url) {
      setForm((prev) => ({
        ...prev,
        [field]: data.url,
      }));
    }
  }

  async function openImageLibrary(field) {
    setImageLibraryField(field);
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
    if (!imageLibraryField) return;

    setForm((previousForm) => ({
      ...previousForm,
      [imageLibraryField]: image.url,
    }));
    setShowImageLibrary(false);
    setImageLibraryField(null);
  }

  // ---------------- SAVE ----------------

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);

    let payload = {
      ...form,
      page_model: Number(form.page_model),
    };

    if (payload.page_model === 1) {
      payload.card_colors = [];
    }

    if (payload.page_model === 2) {
      payload.background_image = null;
    }

    await fetch("/api/personalize", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    setSaving(false);
    alert("Guardado com sucesso!");
  }

  if (loading) {
    return <div className="p-6">A carregar...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="-mx-6 -mt-6">
      <Topbar title="Personalização" />
      </div>

      <div className="p-6 max-w-4xl mx-auto">
        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded-2xl shadow flex flex-col gap-6"
        >

          {/* PAGE MODEL */}
          <Section title="Layout">
            <select
              name="page_model"
              value={String(form.page_model)}
              onChange={handleChange}
              className="input"
            >
              <option value="1">Lista</option>
              <option value="2">Galeria</option>
            </select>
          </Section>

          {/* COLORS */}
          <Section title="Cores">
            <div className="grid grid-cols-2 gap-4">
              {[
                ["primary_color", "Primária"],
                ["secondary_color", "Secundária"],
                ["background_color", "Background"],
                ["foreground_color", "Texto"],
                ["icon_color", "Ícones"],
              ].map(([key, label]) => (
                <div key={key}>
                  <label className="label">{label}</label>

                  <input
                    type="color"
                    name={key}
                    value={form[key] || "#000000"}
                    onChange={handleChange}
                    className="color-input"
                  />
                </div>
              ))}
            </div>
          </Section>
          <Section title="Barra de navegação">
            <div className="grid grid-cols-2 gap-4">
              <div>
             <label className="label">Texto da Barra</label>
              <input
                type="text"
                name="bar_text"
                value={form.bar_text}
                onChange={handleChange}
                placeholder="Nome do hotel ou mensagem personalizada"
                className="input"
                />
              </div>
              <div>
                <label className="label">Detalhes da barra</label>
                <input
                  type="text"
                  name="bar_text_details"
                  value={form.bar_text_details}
                  onChange={handleChange}
                  placeholder="Nome do hotel ou mensagem personalizada"
                  className="input"
                  />
              </div>
            </div>
            </Section>

<Section title="Detalhes da Barra">
</Section>

          {/* GALLERY TEXT SETTINGS */}
          {form.page_model === 2 && (
            <Section title="Texto dos Cards">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <label className="label">Fonte do Texto</label>
                  <select
                    name="card_text_font"
                    value={form.card_text_font}
                    onChange={handleChange}
                    className="input"
                  >
                    <option value="Arial">Arial</option>
                    <option value="Helvetica">Helvetica</option>
                    <option value="Verdana">Verdana</option>
                    <option value="Tahoma">Tahoma</option>
                    <option value="Georgia">Georgia</option>
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Courier New">Courier New</option>
                    <option value="Lucida Grande">Lucida Grande</option>
                    <option value="Trebuchet MS">Trebuchet MS</option>
                    <option value="Palatino Linotype">Palatino Linotype</option>
                    <option value="Garamond">Garamond</option>
                    <option value="Brush Script MT, cursive">Brush Script MT</option>
                    <option value="Lucida Handwriting, cursive">Lucida Handwriting</option>
                    <option value="Segoe Script, cursive">Segoe Script</option>
                    <option value="Segoe Print, cursive">Segoe Print</option>
                    <option value="Freestyle Script, cursive">Freestyle Script</option>
                    <option value="Bradley Hand, cursive">Bradley Hand</option>
                    <option value="Kristen ITC, cursive">Kristen ITC</option>
                    <option value="Great Vibes, cursive">Great Vibes</option>
                    <option value="Pacifico, cursive">Pacifico</option>
                    <option value="Dancing Script, cursive">Dancing Script</option>
                    <option value="Impact, sans-serif">Impact</option>
                    <option value="Comic Sans MS">Comic Sans MS</option>
                    <option value="Segoe UI">Segoe UI</option>
                    <option value="Oswald, sans-serif">Oswald</option>
                    <option value="Lobster, cursive">Lobster</option>
                    <option value="Montserrat, sans-serif">Montserrat</option>
                    <option value="Poppins, sans-serif">Poppins</option>
                    <option value="Playfair Display, serif">Playfair Display</option>
                    <option value="Raleway, sans-serif">Raleway</option>
                    <option value="Merriweather, serif">Merriweather</option>
                    <option value="Roboto, sans-serif">Roboto</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="label">Cor do Texto</label>
                  <input
                    type="color"
                    name="card_text_color"
                    value={form.card_text_color || "#000000"}
                    onChange={handleChange}
                    className="color-input"
                  />
                </div>

                <div className="space-y-2">
                  <label className="label">Tamanho do Texto</label>
                  <input
                    type="number"
                    name="card_text_size"
                    value={form.card_text_size}
                    onChange={handleChange}
                    min="10"
                    max="70"
                    className="input"
                  />
                </div>
              </div>
            </Section>
          )}

          {/* CARD COLORS */}
          {form.page_model === 2 && (
            <Section title="Cores dos Cards">
              <div className="flex flex-wrap gap-3">
                {form.card_colors.map((color, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="color"
                      value={color}
                      onChange={(e) =>
                        handleCardColorChange(i, e.target.value)
                      }
                      className="color-small"
                    />

                    <button
                      type="button"
                      onClick={() => removeCardColor(i)}
                      className="text-xs text-red-500 hover:underline"
                    >
                      remover
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={addCardColor}
                className="btn-secondary mt-3"
              >
                + Adicionar cor
              </button>
            </Section>
          )}

          {/* BACKGROUND */}
          {form.page_model === 1 && (
            <Section title="Imagem de Fundo">
              <ImageUpload
                value={form.background_image}
                onUpload={(file) =>
                  uploadImage(file, "background_image")
                }
                onRemove={() => removeImage("background_image")}
                onChooseFromLibrary={() =>
                  openImageLibrary("background_image")
                }
              />
            </Section>
          )}

          {/* LOGO */}
          <Section title="Logo">
            <ImageUpload
              value={form.logo}
              onUpload={(file) => uploadImage(file, "logo")}
              onRemove={() => removeImage("logo")}
              onChooseFromLibrary={() => openImageLibrary("logo")}
            />
          </Section>

          {/* SAVE */}
          <button
            disabled={saving}
            className="btn-primary"
            style={{ background: form.primary_color }}
          >
            {saving ? "A guardar..." : "Guardar alterações"}
          </button>

        </form>
      </div>

      {showImageLibrary && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="personalize-image-library-title"
            className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            <header className="flex items-center justify-between gap-4 border-b border-gray-200 px-5 py-4">
              <div>
                <h2
                  id="personalize-image-library-title"
                  className="text-lg font-semibold text-gray-900"
                >
                  Escolher do arquivo de imagens
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Selecione a imagem para{" "}
                  {imageLibraryField === "logo" ? "o logótipo" : "o fundo"}.
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => openImageLibrary(imageLibraryField)}
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
                  onClick={() => {
                    setShowImageLibrary(false);
                    setImageLibraryField(null);
                  }}
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

/* ---------------- COMPONENTS ---------------- */

function Section({ title, children }) {
  return (
    <div className="flex flex-col gap-3 border-b pb-4">
      <h2 className="text-sm font-semibold text-gray-600">
        {title}
      </h2>
      {children}
    </div>
  );
}

function ImageUpload({ value, onUpload, onRemove, onChooseFromLibrary }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-gray-300 px-3 text-sm text-gray-700 transition hover:bg-gray-50">
          <LuUpload aria-hidden="true" className="h-4 w-4" />
          Carregar imagem
          <input
            type="file"
            accept=".png,.jpg,.jpeg,.webp,image/*"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;

              if (file.size > 850 * 1024) {
                alert("A imagem não pode exceder 850 KB.");
                event.target.value = "";
                return;
              }

              onUpload(file);
              event.target.value = "";
            }}
          />
        </label>
        <button
          type="button"
          onClick={onChooseFromLibrary}
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-gray-300 px-3 text-sm text-gray-700 transition hover:bg-gray-50"
        >
          <LuImage aria-hidden="true" className="h-4 w-4" />
          Escolher do arquivo
        </button>
      </div>
      <p className="text-xs text-gray-500">
        PNG, JPG, JPEG ou WEBP. Upload até 850 KB.
      </p>

      {value && (
        <div
          className="
            relative
            overflow-hidden
            rounded-2xl
            border
            bg-gray-50
            w-fit
          "
        >
          <Image
            src={value}
            alt="Pré-visualização da imagem"
            width={400}
            height={240}
            unoptimized
            className="
              max-h-48
              min-w-[250px]
              object-contain
            "
          />

          <button
            type="button"
            onClick={onRemove}
            className="
              absolute top-3 right-3
              h-8 w-8
              rounded-full
              bg-red-600
              text-white
              shadow-lg
              hover:bg-red-700
              transition
              flex items-center justify-center
            "
          >
            ✕
          </button>

          <div
            className="
              absolute bottom-0 left-0 right-0
              bg-black/50
              text-white
              text-xs
              px-3 py-2
            "
          >
            Imagem carregada
          </div>
        </div>
      )}

    </div>
  );
}