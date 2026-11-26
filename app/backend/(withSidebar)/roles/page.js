"use client";

import { useEffect, useMemo, useState } from "react";
import Topbar from "@/components/layout/Topbar";
import { FaPencilAlt, FaTrashAlt} from "react-icons/fa";

const emptyForm = { userName: "", userDesc: "", permissionIds: [] };

async function getErrorMessage(response, fallback) {
  const result = await response.json().catch(() => null);
  return result?.error || fallback;
}

export default function RolesPage() {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function loadData() {
    const [rolesResponse, permissionsResponse] = await Promise.all([
      fetch("/api/roles"),
      fetch("/api/permissions"),
    ]);
    if (!rolesResponse.ok) {
      throw new Error(await getErrorMessage(rolesResponse, "Não foi possível carregar as roles."));
    }
    if (!permissionsResponse.ok) {
      throw new Error(await getErrorMessage(permissionsResponse, "Não foi possível carregar as permissões."));
    }
    const [roleData, permissionData] = await Promise.all([
      rolesResponse.json(),
      permissionsResponse.json(),
    ]);
    setRoles(roleData);
    setPermissions(permissionData);
  }

  useEffect(() => {
    loadData()
      .catch((loadError) => {
        console.error(loadError);
        setError(loadError.message);
      })
      .finally(() => setLoading(false));
  }, []);

  const permissionGroups = useMemo(
    () =>
      Object.groupBy
        ? Object.groupBy(permissions, (permission) => permission.module)
        : permissions.reduce((groups, permission) => {
            (groups[permission.module] ||= []).push(permission);
            return groups;
          }, {}),
    [permissions]
  );
  const filteredRoles = roles.filter((role) =>
    [role.userName, role.userDesc]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(search.trim().toLowerCase()))
  );

  function openCreate() {
    setEditingId(null);
    setForm({ ...emptyForm });
    setError("");
    setShowModal(true);
  }

  function openEdit(role) {
    setEditingId(role.userBOTypeID);
    setForm({
      userName: role.userName || "",
      userDesc: role.userDesc || "",
      permissionIds: role.permissions.map((permission) => permission.Id),
    });
    setError("");
    setShowModal(true);
  }

  function togglePermission(permissionId) {
    setForm((current) => ({
      ...current,
      permissionIds: current.permissionIds.includes(permissionId)
        ? current.permissionIds.filter((id) => id !== permissionId)
        : [...current.permissionIds, permissionId],
    }));
  }

  async function submitRole(event) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const response = await fetch(
        editingId ? `/api/roles/${editingId}` : "/api/roles",
        {
          method: editingId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        }
      );
      if (!response.ok) {
        throw new Error(await getErrorMessage(response, "Não foi possível guardar a role."));
      }
      await loadData();
      setShowModal(false);
    } catch (saveError) {
      console.error(saveError);
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteRole(role) {
    if (!window.confirm(`Eliminar a role "${role.userName}"?`)) return;
    setError("");
    try {
      const response = await fetch(`/api/roles/${role.userBOTypeID}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error(await getErrorMessage(response, "Não foi possível eliminar a role."));
      }
      await loadData();
    } catch (deleteError) {
      console.error(deleteError);
      setError(deleteError.message);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="-mx-6 -mt-6">
        <Topbar title="Roles BO" />
      </div>

      <div className="my-6 flex flex-wrap items-center justify-between gap-4">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Pesquisar role..."
          className="h-11 w-80 max-w-full rounded-lg border border-gray-300 px-3 outline-none focus:border-red-500"
        />
        <button
          type="button"
          onClick={openCreate}
          className="h-11 rounded-lg bg-red-500 px-5 text-white hover:bg-red-600"
        >
          + Criar role
        </button>
      </div>

      {error && !showModal && (
        <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-md">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-left text-gray-600">
            <tr>
              <th className="p-4">Role</th>
              <th className="p-4">Descrição</th>
              <th className="p-4">Utilizadores</th>
              <th className="p-4">Permissões</th>
              <th className="p-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="p-6 text-center text-gray-500">A carregar roles...</td></tr>
            ) : filteredRoles.length === 0 ? (
              <tr><td colSpan={5} className="p-6 text-center text-gray-500">Nenhuma role encontrada.</td></tr>
            ) : filteredRoles.map((role) => (
              <tr key={role.userBOTypeID} className="border-t border-gray-100">
                <td className="p-4 font-medium text-gray-900">{role.userName || "—"}</td>
                <td className="p-4 text-gray-600">{role.userDesc || "—"}</td>
                <td className="p-4">{role.userCount}</td>
                <td className="p-4">{role.permissions.length}</td>
                <td className="p-4">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => openEdit(role)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <FaPencilAlt size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteRole(role)}
                      disabled={role.userName?.toLowerCase() === "administrator" || role.userCount > 0}
                      className="rounded-lg bg-red-500 px-3 py-1 text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:bg-gray-300"
                    >
                      <FaTrashAlt size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="mb-4 text-lg font-semibold">
              {editingId ? "Editar role" : "Criar role"}
            </h2>
            <form onSubmit={submitRole} className="flex flex-col gap-4">
              <label className="flex flex-col gap-1 text-sm font-medium">
                Nome
                <input
                  value={form.userName}
                  onChange={(event) => setForm((current) => ({ ...current, userName: event.target.value }))}
                  maxLength={100}
                  required
                  className="h-11 rounded-lg border border-gray-300 px-3 font-normal"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm font-medium">
                Descrição
                <input
                  value={form.userDesc}
                  onChange={(event) => setForm((current) => ({ ...current, userDesc: event.target.value }))}
                  maxLength={255}
                  className="h-11 rounded-lg border border-gray-300 px-3 font-normal"
                />
              </label>

              <div>
                <h3 className="mb-2 text-sm font-semibold">Permissões fixas da role</h3>
                <div className="grid gap-3 md:grid-cols-2">
                  {Object.entries(permissionGroups).map(([module, group]) => (
                    <fieldset key={module} className="rounded-lg border border-gray-200 p-3">
                      <legend className="px-1 text-sm font-semibold">{module}</legend>
                      <div className="flex flex-col gap-2">
                        {group.map((permission) => (
                        <label key={permission.Id} className="flex items-center justify-between gap-3 text-sm">
  <span className="min-w-0">
    <span className="block font-medium">{permission.name}</span>
    <span className="text-xs text-gray-500">{permission.permission_key}</span>
  </span>

  <button
    type="button"
    role="switch"
    aria-checked={form.permissionIds.includes(permission.Id)}
    onClick={() => togglePermission(permission.Id)}
    className={`relative inline-flex h-4 w-7 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ${
      form.permissionIds.includes(permission.Id)
        ? "bg-red-500"
        : "bg-gray-300"
    }`}
  >
    <span
      className={`h-3 w-3 rounded-full bg-white shadow-sm transition-transform duration-200 ${
        form.permissionIds.includes(permission.Id)
          ? "translate-x-3.5"
          : "translate-x-0.5"
      }`}
    />
  </button>
</label>
                        ))}
                      </div>
                    </fieldset>
                  ))}
                </div>
              </div>

              {error && (
                <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </p>
              )}
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowModal(false)} disabled={saving} className="rounded-lg bg-gray-200 px-4 py-2">
                  Cancelar
                </button>
                <button type="submit" disabled={saving} className="rounded-lg bg-red-500 px-4 py-2 text-white disabled:bg-red-300">
                  {saving ? "A guardar..." : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
