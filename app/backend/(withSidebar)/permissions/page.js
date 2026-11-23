"use client";

import { useEffect, useState } from "react";
import Topbar from "@/components/layout/Topbar";

const emptyForm = {
  permission_key: "",
  name: "",
  module: "",
  description: "",
};

async function getErrorMessage(response, fallback) {
  const result = await response.json().catch(() => null);
  return result?.error || fallback;
}

export default function PermissionsPage() {
  const [permissions, setPermissions] = useState([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");

  async function fetchPermissions() {
    const response = await fetch("/api/permissions");
    if (!response.ok) {
      throw new Error(
        await getErrorMessage(response, "Não foi possível carregar as permissões.")
      );
    }
    setPermissions(await response.json());
  }

  useEffect(() => {
    fetchPermissions()
      .catch((loadError) => {
        console.error(loadError);
        setError(loadError.message);
      })
      .finally(() => setIsLoading(false));
  }, []);

  function openCreate() {
    setEditingId(null);
    setForm({ ...emptyForm });
    setError("");
    setShowModal(true);
  }

  function openEdit(permission) {
    setEditingId(permission.Id);
    setForm({
      permission_key: permission.permission_key,
      name: permission.name,
      module: permission.module,
      description: permission.description || "",
    });
    setError("");
    setShowModal(true);
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]:
        name === "permission_key"
          ? value.trim().toLowerCase()
          : value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSaving(true);
    setError("");

    try {
      const response = await fetch(
        editingId ? `/api/permissions/${editingId}` : "/api/permissions",
        {
          method: editingId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        }
      );

      if (!response.ok) {
        throw new Error(
          await getErrorMessage(response, "Não foi possível guardar a permissão.")
        );
      }

      await fetchPermissions();
      setShowModal(false);
    } catch (saveError) {
      console.error(saveError);
      setError(saveError.message);
    } finally {
      setIsSaving(false);
    }
  }

  async function removePermission(id) {
    if (!window.confirm("Tem a certeza de que pretende eliminar esta permissão?")) {
      return;
    }

    setDeletingId(id);
    setError("");

    try {
      const response = await fetch(`/api/permissions/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(
          await getErrorMessage(response, "Não foi possível eliminar a permissão.")
        );
      }

      await fetchPermissions();
    } catch (deleteError) {
      console.error(deleteError);
      setError(deleteError.message);
    } finally {
      setDeletingId(null);
    }
  }

  const normalizedSearch = search.trim().toLowerCase();
  const filteredPermissions = permissions.filter((permission) =>
    [
      permission.permission_key,
      permission.name,
      permission.module,
      permission.description,
    ]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(normalizedSearch))
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="-mx-6 -mt-6">
        <Topbar title="Permissões" />
      </div>

      <div className="my-6 flex items-center justify-between gap-4">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Pesquisar permissão..."
          className="h-11 w-80 max-w-full rounded-lg border border-gray-300 px-3 outline-none focus:border-red-500"
        />

        <button
          type="button"
          onClick={openCreate}
          className="h-11 shrink-0 rounded-lg bg-red-500 px-5 text-white hover:bg-red-600"
        >
          + Criar Permissão
        </button>
      </div>

      {error && !showModal && (
        <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="w-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-md">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-left text-gray-600">
            <tr>
              <th className="p-4">Chave</th>
              <th className="p-4">Nome</th>
              <th className="p-4">Módulo</th>
              <th className="p-4">Descrição</th>
              <th className="p-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="p-6 text-center text-gray-500">
                  A carregar permissões...
                </td>
              </tr>
            ) : filteredPermissions.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-6 text-center text-gray-500">
                  {search
                    ? "Nenhuma permissão encontrada."
                    : "Ainda não existem permissões."}
                </td>
              </tr>
            ) : (
              filteredPermissions.map((permission) => (
                <tr key={permission.Id} className="border-t border-gray-100">
                  <td className="p-4 font-mono text-xs font-medium text-gray-800">
                    {permission.permission_key}
                  </td>
                  <td className="p-4 font-medium text-gray-800">
                    {permission.name}
                  </td>
                  <td className="p-4">
                    <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700">
                      {permission.module}
                    </span>
                  </td>
                  <td className="max-w-md p-4 text-gray-600">
                    {permission.description || "—"}
                  </td>
                  <td className="flex justify-end gap-2 p-4">
                    <button
                      type="button"
                      onClick={() => openEdit(permission)}
                      className="rounded-lg bg-gray-200 px-3 py-1 text-sm hover:bg-gray-300"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => removePermission(permission.Id)}
                      disabled={deletingId === permission.Id}
                      className={`rounded-lg px-3 py-1 text-sm ${
                        deletingId === permission.Id
                          ? "cursor-not-allowed bg-gray-300 text-gray-500"
                          : "bg-red-500 text-white hover:bg-red-600"
                      }`}
                    >
                      {deletingId === permission.Id
                        ? "Eliminando..."
                        : "Eliminar"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="mb-4 text-lg font-semibold">
              {editingId ? "Editar Permissão" : "Criar Permissão"}
            </h2>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Chave
                </label>
                <input
                  name="permission_key"
                  value={form.permission_key}
                  onChange={handleChange}
                  placeholder="reservations.view"
                  maxLength={150}
                  required
                  className="h-11 w-full rounded-lg border border-gray-300 px-3 font-mono outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Nome
                </label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Ver reservas"
                  maxLength={150}
                  required
                  className="h-11 w-full rounded-lg border border-gray-300 px-3 outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Módulo
                </label>
                <input
                  name="module"
                  value={form.module}
                  onChange={handleChange}
                  placeholder="reservations"
                  maxLength={100}
                  required
                  className="h-11 w-full rounded-lg border border-gray-300 px-3 outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Descrição
                </label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Permite consultar reservas..."
                  maxLength={255}
                  rows={3}
                  className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-red-500"
                />
              </div>

              {error && (
                <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </p>
              )}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={isSaving}
                  className="rounded-lg bg-gray-200 px-4 py-2 hover:bg-gray-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className={`rounded-lg px-4 py-2 text-white ${
                    isSaving
                      ? "cursor-not-allowed bg-red-300"
                      : "bg-red-500 hover:bg-red-600"
                  }`}
                >
                  {isSaving ? "A guardar..." : editingId ? "Guardar" : "Criar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
