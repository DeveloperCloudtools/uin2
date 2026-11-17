"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Topbar from "@/components/layout/Topbar";
import Editor from "@/components/editor/page.js";
import { hasUnconfiguredProducts } from "@/components/editor/productContent";
import { QRCodeCanvas } from "qrcode.react";
import { IoQrCode } from "react-icons/io5";
import { LuImage, LuRefreshCw, LuUpload, LuX } from "react-icons/lu";

export default function SubmenusPage() {
  const [submenus, setSubmenus] = useState([]);
  const [menus, setMenus] = useState([]);
  const [outlets, setOutlets] = useState([]);
  const [languages, setLanguages] = useState([]);

  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [showContentModal, setShowContentModal] = useState(false);
  const [selectedSubmenu, setSelectedSubmenu] = useState(null);
  const [editorContent, setEditorContent] = useState(null);
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [isSavingContent, setIsSavingContent] = useState(false);
  const [contentError, setContentError] = useState("");
  const [qrSubmenu, setQrSubmenu] = useState(null);
  const [qrUrl, setQrUrl] = useState("");

  const [form, setForm] = useState({
    submenu_name1: "",
    submenu_name2: "",
    submenu_name3: "",
    submenu_name4: "",
    submenu_name5: "",
    menu_id: "",
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

  function closeSubmenuModal() {
    resetImageSelection();
    setShowModal(false);
  }

  // ---------------- FETCH ----------------

  async function fetchSubmenus() {
    const res = await fetch("/api/submenus");
    const data = await res.json();
    setSubmenus(data);
  }

  async function fetchMenus() {
    const res = await fetch("/api/menus");
    const data = await res.json();
    setMenus(data);
  }

  async function fetchOutlets() {
    const res = await fetch("/api/outlets");
    const data = await res.json();
    setOutlets(data);
  }

  async function fetchLanguages() {
    const res = await fetch("/api/languages");
    const data = await res.json();

    const sorted = data.sort((a, b) => a.lang_order - b.lang_order);
    setLanguages(sorted);
  }

  useEffect(() => {
    fetchSubmenus();
    fetchMenus();
    fetchOutlets();
    fetchLanguages();
  }, []);

  // ---------------- MODAL ----------------

  function openCreate() {
    setEditingId(null);
    resetImageSelection();

    setForm({
      submenu_name1: "",
      submenu_name2: "",
      submenu_name3: "",
      submenu_name4: "",
      submenu_name5: "",
      menu_id: "",
    });

    setShowModal(true);
  }

  function openEdit(submenu) {
    setEditingId(submenu.submenu_id);
    resetImageSelection();

    setForm({
      submenu_name1: submenu.submenu_name1 || "",
      submenu_name2: submenu.submenu_name2 || "",
      submenu_name3: submenu.submenu_name3 || "",
      submenu_name4: submenu.submenu_name4 || "",
      submenu_name5: submenu.submenu_name5 || "",
      menu_id: submenu.menu_id ? String(submenu.menu_id) : "",
    });

    setImagePreview(submenu.submenu_card_background || null);
    setExistingImage(submenu.submenu_card_background || null);

    setShowModal(true);
  }

  async function openContent(submenu) {
    setSelectedSubmenu(submenu);
    setEditorContent(null);
    setContentError("");
    setShowContentModal(true);
    setIsLoadingContent(true);

    try {
      const response = await fetch(
        `/api/submenu-content?submenu_id=${submenu.submenu_id}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao carregar conteúdo do submenu.");
      }

      setEditorContent(
        data.content
          ? { ...data.content, banner_url: data.banner_url || "" }
          : {
              editor: { type: "doc", content: [{ type: "paragraph" }] },
              selectedProducts: [],
              banner_url: data.banner_url || "",
            }
      );
    } catch (error) {
      console.error(error);
      setContentError(error.message || "Erro ao carregar conteúdo do submenu.");
    } finally {
      setIsLoadingContent(false);
    }
  }

  async function saveContent() {
    if (!selectedSubmenu || isSavingContent) return;

    if (hasUnconfiguredProducts(editorContent)) {
      alert("Abra o lápis vermelho de cada produto, configure-o e guarde antes de guardar o conteúdo.");
      return;
    }

    setIsSavingContent(true);
    try {
      const { banner_url, ...content } = editorContent || {};
      const response = await fetch("/api/submenu-content", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          submenu_id: selectedSubmenu.submenu_id,
          content: Object.keys(content).length ? content : null,
          banner_url: banner_url || "",
        }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erro ao guardar conteúdo do submenu.");
      }

      setShowContentModal(false);
    } catch (error) {
      console.error(error);
      alert(error.message || "Erro ao guardar conteúdo do submenu.");
    } finally {
      setIsSavingContent(false);
    }
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
        submenu_card_background: imageUrl,
        menu_id: form.menu_id ? Number(form.menu_id) : null,
      };

      const url = editingId
        ? `/api/submenus/${editingId}`
        : "/api/submenus";

      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Save failed");

      await fetchSubmenus();

      setShowModal(false);
      resetImageSelection();
    } catch (err) {
      console.error(err);
      alert("Error saving submenu");
    } finally {
      setIsSaving(false);
    }
  }

  async function remove(id) {
    try {
      setDeletingId(id);

      const response = await fetch(`/api/submenus/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Delete failed");

      await fetchSubmenus();
    } catch (err) {
      console.error(err);
      alert("Error deleting submenu");
    } finally {
      setDeletingId(null);
    }
  }

  async function toggleVisible(submenu) {
    await fetch(`/api/submenus/${submenu.submenu_id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        visible: !submenu.visible,
      }),
    });

    fetchSubmenus();
  }

  // ---------------- FILTER ----------------

  const filtered = submenus.filter((submenu) =>
    languages.some((lang) => {
      const field = `submenu_name${lang.lang_order}`;
      return (submenu[field] || "")
        .toLowerCase()
        .includes(search.toLowerCase());
    })
  );

  const menusWithSubmenus = menus.filter((menu) => menu.has_submenus === true);

  function getMenuName(menu) {
    return menu[`menu_name${languages[0]?.lang_order || 1}`] || menu.menu_name1 || `Menu ${menu.menu_id}`;
  }

  function getParentMenuName(menuId) {
    const menu = menus.find((item) => item.menu_id === menuId);
    return menu ? getMenuName(menu) : "-";
  }

  function openSubmenuQr(submenu) {
    const menu = menus.find(
      (item) => Number(item.menu_id) === Number(submenu.menu_id)
    );
    const outlet = outlets.find(
      (item) => Number(item.outlet_id) === Number(menu?.outlet_id)
    );
    const params = new URLSearchParams();

    if (outlet?.area_id != null) {
      params.set("area_id", outlet.area_id);
    }
    if (menu?.outlet_id != null) {
      params.set("outlet_id", menu.outlet_id);
    }
    if (submenu.menu_id != null) {
      params.set("menu_id", submenu.menu_id);
    }
    params.set("submenu_id", submenu.submenu_id);

    setQrSubmenu(submenu);
    setQrUrl(`${window.location.origin}/homepage?${params.toString()}`);
  }

  function downloadSubmenuQr() {
    const canvas = document.getElementById("submenu-qr-code");
    if (!(canvas instanceof HTMLCanvasElement)) return;

    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `submenu-${qrSubmenu?.submenu_id}-qrcode.png`;
    link.click();
  }

  return (
    <div className="min-h-screen bg-gray-50">

      <div className="-mx-6 -mt-6">
        <Topbar title="Submenus" />
      </div>

      {/* HEADER */}
      <div className="flex items-center justify-between my-6">

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Pesquisar submenus..."
          className="h-11 w-80 border rounded-lg px-3"
        />

        <button
          onClick={openCreate}
          className="h-11 px-5 bg-red-500 text-white rounded-lg"
        >
          + Criar Submenu
        </button>

      </div>

      {/* TABLE (unchanged) */}
      <div className="bg-white border rounded-2xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-left text-gray-600">
            <tr>
              <th className="p-4">ID</th>
              <th className="p-4">Menu</th>

              {languages.map((lang) => (
                <th key={lang.lang_id} className="p-4">
                  {lang.lang_name}
                </th>
              ))}

              <th className="p-4">Ativo</th>
              <th className="p-4 text-right">Ações</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((submenu) => (
              <tr key={submenu.submenu_id} className="border-t">
                <td className="p-4">{submenu.submenu_id}</td>
                <td className="p-4">{getParentMenuName(submenu.menu_id)}</td>

                {languages.map((lang) => {
                  const field = `submenu_name${lang.lang_order}`;
                  return (
                    <td key={lang.lang_id} className="p-4">
                      {submenu[field]}
                    </td>
                  );
                })}

                <td className="p-4">
                  <button
                    onClick={() => toggleVisible(submenu)}
                    className={`px-3 py-1 rounded-lg text-white ${
                      submenu.visible 
                        ? "bg-green-500 hover:bg-green-700" 
                        : "bg-red-600 hover:bg-red-700"
                    }`}
                  >
                    {submenu.visible ? "Sim" : "Não"}
                  </button>
                </td>

                <td className="p-4 flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => openSubmenuQr(submenu)}
                    className="px-3 py-1 bg-green-500 text-white rounded-lg"
                  >
                    <IoQrCode />
                  </button>

                  <button
                    type="button"
                    onClick={() => openContent(submenu)}
                    className="px-3 py-1 bg-blue-500 text-white rounded-lg"
                  >
                    Conteúdo
                  </button>

                  <button
                    onClick={() => openEdit(submenu)}
                    className="px-3 py-1 bg-gray-200 rounded-lg"
                  >
                    Editar
                  </button>

                  <button
                    onClick={() => remove(submenu.submenu_id)}
                    disabled={deletingId === submenu.submenu_id}
                    className={`px-3 py-1 rounded-lg ${deletingId === submenu.submenu_id ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-red-500 text-white"}`}
                  >
                    {deletingId === submenu.submenu_id ? "Eliminar" : "Eliminar"}
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
              const field = `submenu_name${lang.lang_order}`;

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

            <select
              name="menu_id"
              value={form.menu_id}
              onChange={handleChange}
              className="h-10 border rounded-lg px-3"
            >
              <option value="">Sem menu associado</option>
              {menusWithSubmenus.map((menu) => (
                <option key={menu.menu_id} value={menu.menu_id}>
                  {getMenuName(menu)}
                </option>
              ))}
            </select>

            <div className="flex flex-col gap-3">
              <p className="text-sm font-medium text-gray-700">
                Imagem do submenu
              </p>
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
                    alt="Pré-visualização da imagem do submenu"
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
                onClick={closeSubmenuModal}
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
            aria-labelledby="submenu-image-library-title"
            className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            <header className="flex items-center justify-between gap-4 border-b border-gray-200 px-5 py-4">
              <div>
                <h2
                  id="submenu-image-library-title"
                  className="text-lg font-semibold text-gray-900"
                >
                  Escolher do arquivo de imagens
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Selecione a imagem que pretende usar neste submenu.
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

      {/* CONTENT MODAL */}
      {showContentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="flex h-[85vh] w-[90vw] flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
            <h2 className="shrink-0 border-b border-gray-200 px-6 py-4 text-lg font-semibold">
              Conteúdo - {selectedSubmenu?.submenu_name1}
            </h2>

            <div className="min-h-0 flex-1 overflow-hidden">
              {isLoadingContent ? (
                <div className="flex h-full items-center justify-center text-gray-500">
                  A carregar conteúdo...
                </div>
              ) : contentError ? (
                <div className="flex h-full items-center justify-center text-red-600">
                  {contentError}
                </div>
              ) : (
                <Editor
                  value={editorContent}
                  onChange={setEditorContent}
                  outletId={
                    menus.find(
                      (menu) =>
                        Number(menu.menu_id) === Number(selectedSubmenu?.menu_id)
                    )?.outlet_id
                  }
                  previewTitle={
                    outlets.find(
                      (outlet) =>
                        Number(outlet.outlet_id) ===
                        Number(
                          menus.find(
                            (menu) =>
                              Number(menu.menu_id) ===
                              Number(selectedSubmenu?.menu_id)
                          )?.outlet_id
                        )
                    )?.outlet_name1 || "Menus"
                  }
                  previewItems={[
                    {
                      id: selectedSubmenu?.menu_id,
                      name:
                        menus.find(
                          (menu) =>
                            Number(menu.menu_id) ===
                            Number(selectedSubmenu?.menu_id)
                        )?.menu_name1 || "Menu",
                      active: false,
                    },
                    ...submenus
                      .filter(
                        (submenu) =>
                          Number(submenu.menu_id) ===
                          Number(selectedSubmenu?.menu_id)
                      )
                      .map((submenu) => ({
                        id: submenu.submenu_id,
                        name: submenu.submenu_name1 || "Submenu",
                        active:
                          Number(submenu.submenu_id) ===
                          Number(selectedSubmenu?.submenu_id),
                        nested: true,
                      })),
                  ]}
                />
              )}
            </div>

            <div className="flex shrink-0 justify-end gap-2 border-t border-gray-200 px-6 py-3">
              <button
                type="button"
                onClick={() => setShowContentModal(false)}
                className="rounded-lg border border-gray-300 bg-gray-100 px-5 py-2 text-sm text-gray-800 hover:bg-gray-200"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={saveContent}
                disabled={isLoadingContent || !!contentError || isSavingContent}
                className={`rounded-lg px-5 py-2 text-sm ${
                  isLoadingContent || contentError || isSavingContent
                    ? "cursor-not-allowed bg-gray-300 text-gray-500"
                    : "bg-red-700 text-white hover:bg-red-800"
                }`}
              >
                {isSavingContent ? "A guardar..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {qrSubmenu && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-xl">
            <h2 className="text-xl font-semibold">
              QR Code - {qrSubmenu.submenu_name1 || `Submenu ${qrSubmenu.submenu_id}`}
            </h2>

            <p className="mt-2 break-all text-sm text-gray-500">{qrUrl}</p>

            <div className="my-6 flex justify-center">
              <QRCodeCanvas
                id="submenu-qr-code"
                value={qrUrl}
                size={240}
                level="H"
                includeMargin
              />
            </div>

            <div className="flex justify-center gap-2">
              <button
                type="button"
                onClick={() => setQrSubmenu(null)}
                className="rounded-lg bg-gray-200 px-4 py-2"
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={downloadSubmenuQr}
                className="rounded-lg bg-red-500 px-4 py-2 text-white"
              >
                Descarregar QR
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}