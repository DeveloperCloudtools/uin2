"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Topbar from "@/components/layout/Topbar";
import { LuImage, LuRefreshCw, LuUpload, LuX } from "react-icons/lu";

export default function ItemsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [search, setSearch] = useState("");
  const [itemsError, setItemsError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [showImageLibrary, setShowImageLibrary] = useState(false);
  const [imageLibrary, setImageLibrary] = useState([]);
  const [imageLibrarySearch, setImageLibrarySearch] = useState("");
  const [isLoadingImageLibrary, setIsLoadingImageLibrary] = useState(false);
  const [imageLibraryError, setImageLibraryError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [activeTab, setActiveTab] = useState("base");
  const [showProductTypeError, setShowProductTypeError] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [form, setForm] = useState({
    item_name1: "",
    item_name2: "",
    item_name3: "",
    item_name4: "",
    item_name5: "",
    item_description1: "",
    item_description2: "",
    item_description3: "",
    item_description4: "",
    item_description5: "",
    item_image_url: "",
    item_type: "",
  });

  const [itemSubfamilyId, setItemSubfamilyId] = useState("");

  const filteredLibraryImages = imageLibrary.filter((image) =>
    (image.key.split("/").pop() || image.key)
      .toLowerCase()
      .includes(imageLibrarySearch.trim().toLowerCase())
  );

  async function fetchProducts() {
    const res = await fetch("/api/products");
    if (!res.ok) {
      throw new Error(`Falha ao carregar itens (${res.status})`);
    }

    const data = await res.json();
    setProducts(data);
    setItemsError("");
  }

  async function fetchCategories() {
    const res = await fetch("/api/productCategories");
    const data = await res.json();
    setCategories(data);
  }

  async function fetchLanguages() {
    const res = await fetch("/api/languages");
    const data = await res.json();
    const sorted = data.sort(
      (a, b) => (a.lang_order || 0) - (b.lang_order || 0)
    );
    setLanguages(sorted);
  }

  useEffect(() => {
    fetchProducts().catch((error) => {
      console.error(error);
      setItemsError(error.message || "Erro ao carregar itens.");
    });
    fetchCategories();
    fetchLanguages();
  }, []);

  function openCreate() {
    setEditingId(null);
    setActiveTab("base");
    setShowProductTypeError(false);
    setForm({
      item_name1: "",
      item_name2: "",
      item_name3: "",
      item_name4: "",
      item_name5: "",
      item_description1: "",
      item_description2: "",
      item_description3: "",
      item_description4: "",
      item_description5: "",
      item_image_url: "",
      item_type: "",
    });
    setItemSubfamilyId("");
    setShowModal(true);
  }

  function openEdit(product) {
    setEditingId(product.item_id);
    setActiveTab("base");
    setShowProductTypeError(false);

    setForm({
      item_name1: product.item_name1 || "",
      item_name2: product.item_name2 || "",
      item_name3: product.item_name3 || "",
      item_name4: product.item_name4 || "",
      item_name5: product.item_name5 || "",
      item_description1: product.item_description1 || "",
      item_description2: product.item_description2 || "",
      item_description3: product.item_description3 || "",
      item_description4: product.item_description4 || "",
      item_description5: product.item_description5 || "",
      item_image_url: product.item_image_url || "",
      item_type: product.item_type || "",
    });

    setItemSubfamilyId(
      product.item_cat_id ? String(product.item_cat_id) : ""
    );
    setShowModal(true);
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function uploadImage(file) {
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
        item_image_url: data.url,
      }));
    }
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
    setForm((previousForm) => ({
      ...previousForm,
      item_image_url: image.url,
    }));
    setShowImageLibrary(false);
  }

  function removeImage() {
    setForm((prev) => ({
      ...prev,
      item_image_url: "",
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.item_type) {
      setActiveTab("settings");
      setShowProductTypeError(true);
      return;
    }

    if (!form.item_name1) return;

    setIsSaving(true);

    const payload = {
      item_name1: form.item_name1,
      item_name2: form.item_name2,
      item_name3: form.item_name3,
      item_name4: form.item_name4,
      item_name5: form.item_name5,
      item_description1: form.item_description1,
      item_description2: form.item_description2,
      item_description3: form.item_description3,
      item_description4: form.item_description4,
      item_description5: form.item_description5,
      item_image_url: form.item_image_url,
      item_type: form.item_type,
      item_cat_id: itemSubfamilyId ? Number(itemSubfamilyId) : null,
    };

    try {
      if (!editingId) {
        await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch(`/api/products/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      setShowModal(false);
      setEditingId(null);
      fetchProducts();
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteProduct(id) {
    try {
      setDeletingId(id);

      const response = await fetch(`/api/products/${id}`, { method: "DELETE" });

      if (!response.ok) throw new Error("Delete failed");

      await fetchProducts();
    } catch (err) {
      console.error(err);
      alert("Erro ao eliminar item");
    } finally {
      setDeletingId(null);
    }
  }

  const filtered = products.filter((product) =>
    languages.some((lang) => {
      const field = `item_name${lang.lang_order}`;
      return (product[field] || "")
        .toLowerCase()
        .includes(search.toLowerCase());
    })
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="-mx-6 -mt-6">
        <Topbar title="Itens" />
      </div>

      {/* HEADER */}
      <div className="flex items-center justify-between my-6">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Pesquisar item..."
          className="h-11 w-72 border border-gray-300 rounded-lg px-3 focus:border-red-500 outline-none"
        />

        <button
          onClick={openCreate}
          disabled={showModal || isSaving}
          className={`h-11 px-5 rounded-lg ${showModal || isSaving ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-red-500 hover:bg-red-600 text-white"}`}
        >
          + Criar Item
        </button>
      </div>

      {/* TABLE */}
      <div className="w-full bg-white border border-gray-200 rounded-2xl shadow-md overflow-hidden">
        {itemsError && (
          <p role="alert" className="p-4 text-sm text-red-600">
            {itemsError}
          </p>
        )}
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-left text-gray-600">
            <tr>
              <th className="p-4">ID</th>

              {languages.length > 0 ? (
                languages.map((lang) => (
                  <th key={lang.lang_id} className="p-4">
                    {lang.lang_name}
                  </th>
                ))
              ) : (
                <th className="p-4">Nome</th>
              )}

              <th className="p-4">Categoria</th>
              <th className="p-4 text-right">Ações</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((product) => {
              const category = categories.find(
                (c) => c.item_subfamily_id === product.item_cat_id
              );

              return (
                <tr key={product.item_id} className="border-t border-gray-100">
                  <td className="p-4 text-gray-500">{product.item_id}</td>

                  {languages.length > 0 ? (
                    languages.map((lang) => {
                      const field = `item_name${lang.lang_order}`;
                      return (
                        <td
                          key={lang.lang_id}
                          className="p-4 font-medium text-gray-800"
                        >
                          {product[field] || "-"}
                        </td>
                      );
                    })
                  ) : (
                    <td className="p-4 font-medium text-gray-800">
                      {product.item_name1}
                    </td>
                  )}

                  <td className="p-4 text-gray-600">
                    {category?.category_name1 || "-"}
                  </td>

                  <td className="p-4 text-right flex justify-end gap-2">
                    <button
                      onClick={() => openEdit(product)}
                      className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm"
                    >
                      Editar
                    </button>

                    <button
                      onClick={() => deleteProduct(product.item_id)}
                      disabled={deletingId === product.item_id}
                      className={`px-3 py-1 rounded-lg text-sm ${deletingId === product.item_id ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-red-500 hover:bg-red-600 text-white"}`}
                    >
                      {deletingId === product.item_id ? "Eliminar" : "Eliminar"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b p-6">
              <h2 className="text-lg font-semibold">
                {editingId ? "Editar Item" : "Criar Item"}
              </h2>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                disabled={isSaving}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="border-b px-6">
              <div className="flex gap-6" role="tablist" aria-label="Secções do item">
                {[
                  ["base", "Nomes e descrições"],
                  ["settings", "Categoria, tipo e imagem"],
                ].map(([tab, label]) => (
                  <button
                    key={tab}
                    type="button"
                    role="tab"
                    id={`item-tab-${tab}`}
                    aria-controls="item-form"
                    aria-selected={activeTab === tab}
                    onClick={() => setActiveTab(tab)}
                    className={`border-b-2 px-1 py-3 text-sm font-medium transition ${
                      activeTab === tab
                        ? "border-red-500 text-red-600"
                        : "border-transparent text-gray-500 hover:text-gray-800"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-y-auto flex-1 p-6">
              <form
                id="item-form"
                role="tabpanel"
                aria-labelledby={`item-tab-${activeTab}`}
                noValidate
                onSubmit={handleSubmit}
                className="flex flex-col gap-6"
              >
                {activeTab === "base" ? (
                  <div>
                    <div>
                      <p className="text-sm font-semibold text-gray-600 mb-3">Nomes</p>
                      {languages.length > 0 ? (
                        languages.map((language) => {
                          const field = `item_name${language.lang_order}`;
                          return (
                            <input
                              key={language.lang_id}
                              name={field}
                              value={form[field] || ""}
                              onChange={handleChange}
                              placeholder={`Nome (${language.lang_name})`}
                              className="h-11 w-full border border-gray-300 rounded-lg px-3 focus:border-red-500 outline-none mb-2"
                            />
                          );
                        })
                      ) : (
                        <input
                          name="item_name1"
                          value={form.item_name1}
                          onChange={handleChange}
                          placeholder="Nome do item"
                          className="h-11 w-full border border-gray-300 rounded-lg px-3 focus:border-red-500 outline-none"
                        />
                      )}
                    </div>

                    <div className="mt-6">
                      <p className="text-sm font-semibold text-gray-600 mb-3">Descrições</p>
                      {languages.length > 0 ? (
                        languages.map((language) => {
                          const field = `item_description${language.lang_order}`;
                          return (
                            <textarea
                              key={language.lang_id}
                              name={field}
                              value={form[field] || ""}
                              onChange={handleChange}
                              placeholder={`Descrição (${language.lang_name})`}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-red-500 outline-none mb-2 resize-none"
                              rows="2"
                            />
                          );
                        })
                      ) : (
                        <textarea
                          name="item_description1"
                          value={form.item_description1 || ""}
                          onChange={handleChange}
                          placeholder="Descrição do item"
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-red-500 outline-none resize-none"
                          rows="2"
                        />
                      )}
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <p className="text-sm font-semibold text-gray-600 mb-3">Categoria</p>
                      <select
                        value={itemSubfamilyId}
                        onChange={(e) => setItemSubfamilyId(e.target.value)}
                        className="w-full h-11 border border-gray-300 rounded-lg px-3 bg-white focus:border-red-500 outline-none"
                      >
                        <option value="">Selecionar categoria</option>
                        {categories.map((cat) => (
                          <option key={cat.item_subfamily_id} value={cat.item_subfamily_id}>
                            {cat.category_name1}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-gray-600 mb-3">Tipo de item</p>
                      <select
                        name="item_type"
                        value={form.item_type}
                        onChange={(e) => {
                          handleChange(e);
                          if (e.target.value) setShowProductTypeError(false);
                        }}
                        aria-invalid={showProductTypeError}
                        aria-describedby={showProductTypeError ? "product-type-error" : undefined}
                        className={`w-full h-11 border rounded-lg px-3 bg-white outline-none ${showProductTypeError ? "border-red-500 focus:border-red-500" : "border-gray-300 focus:border-red-500"}`}
                      >
                        <option value="">Selecionar tipo</option>
                        <option value="Produto">Produto</option>
                        <option value="Serviço">Serviço</option>
                        <option value="Review">Review</option>
                        <option value="Informação">Informação</option>
                        <option value="Reserva de mesa">Reserva de mesa</option>
                        <option value="Marcador">Marcador</option>
                      </select>
                      {showProductTypeError && (
                        <p id="product-type-error" role="alert" className="mt-2 text-sm text-red-600">
                          Tipo de item é obrigatório.
                        </p>
                      )}
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-gray-600 mb-3">Imagem do Item</p>
                      <ImageUpload
                        value={form.item_image_url}
                        onUpload={uploadImage}
                        onRemove={removeImage}
                        onChooseFromLibrary={openImageLibrary}
                      />
                    </div>

                  </>
                )}
              </form>
            </div>

            <div className="border-t p-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                disabled={isSaving}
                className={`px-4 py-2 rounded-lg ${isSaving ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-gray-200 hover:bg-gray-300"}`}
              >
                Cancelar
              </button>
              <button
                type="submit"
                form="item-form"
                disabled={isSaving}
                className={`px-4 py-2 rounded-lg ${isSaving ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-red-500 hover:bg-red-600 text-white"}`}
              >
                {isSaving ? (editingId ? "Guardar" : "Criar") : editingId ? "Guardar" : "Criar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showImageLibrary && showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-image-library-title"
            className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            <header className="flex items-center justify-between gap-4 border-b border-gray-200 px-5 py-4">
              <div>
                <h2
                  id="product-image-library-title"
                  className="text-lg font-semibold text-gray-900"
                >
                  Escolher do arquivo de imagens
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Selecione a imagem que pretende usar neste item.
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

      {/* IMAGE UPLOAD COMPONENT */}
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
            alt="Pré-visualização da imagem do item"
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