"use client";

import { useEffect, useMemo, useState } from "react";
import Topbar from "@/components/layout/Topbar";
import { FaPencilAlt } from "react-icons/fa";
import { FaCheck } from "react-icons/fa";
import { MdClose } from "react-icons/md";

async function getErrorMessage(response, fallback) {
  const result = await response.json().catch(() => null);
  return result?.error || fallback;
}

function formatDate(value) {
  return value ? new Date(value).toLocaleString("pt-PT") : "—";
}

export default function UsersBOPage() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [selectedUser, setSelectedUser] = useState(null);
  const [form, setForm] = useState({
  active: true,
  user_type_id: "",
  expired_at: "",
  permissions: [],
});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function loadData() {
    const [usersResponse, rolesResponse, permissionsResponse] = await Promise.all([
      fetch("/api/users/bo"),
      fetch("/api/roles"),
      fetch("/api/permissions"),
    ]);
    if (!usersResponse.ok) {
      throw new Error(await getErrorMessage(usersResponse, "Não foi possível carregar utilizadores BO."));
    }
    if (!rolesResponse.ok) {
      throw new Error(await getErrorMessage(rolesResponse, "Não foi possível carregar roles."));
    }
    if (!permissionsResponse.ok) {
      throw new Error(await getErrorMessage(permissionsResponse, "Não foi possível carregar permissões."));
    }
    const [userData, roleData, permissionData] = await Promise.all([
      usersResponse.json(),
      rolesResponse.json(),
      permissionsResponse.json(),
    ]);
    setUsers(userData);
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
      permissions.reduce((groups, permission) => {
        (groups[permission.module] ||= []).push(permission);
        return groups;
      }, {}),
    [permissions]
  );
  const filteredUsers = users.filter((user) => {
    if (status === "active" && !user.active) return false;
    if (status === "inactive" && user.active) return false;
    const query = search.trim().toLowerCase();
    return (
      !query ||
      [user.username, user.role?.userName, String(user.user_id)]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query))
    );
  });
  const selectedRole = roles.find(
    (role) => role.userBOTypeID === Number(form.user_type_id)
  );
  const rolePermissionIds = new Set(
    selectedRole?.permissions.map((permission) => permission.Id) || []
  );
  const overridesById = new Map(
    form.permissions.map((permission) => [
      permission.permission_id,
      permission.effect,
    ])
  );

function editUser(user) {
  setSelectedUser(user);
  setForm({
    active: user.active,
    user_type_id: user.user_type_id == null
      ? ""
      : String(user.user_type_id),
    expired_at: user.expired_at
      ? new Date(user.expired_at).toISOString().slice(0, 10)
      : "",
    permissions: user.permissions.map(({ permission_id, effect }) => ({
      permission_id,
      effect,
    })),
  });
  setError("");
}

  function changeOverride(permissionId, effect) {
    setForm((current) => ({
      ...current,
      permissions: [
        ...current.permissions.filter(
          (permission) => permission.permission_id !== permissionId
        ),
        ...(effect === "INHERIT" ? [] : [{ permission_id: permissionId, effect }]),
      ],
    }));
  }

  async function saveUser(event) {
    event.preventDefault();
    if (!selectedUser) return;
    setSaving(true);
    setError("");

    try {
      const response = await fetch(`/api/users/bo/${selectedUser.user_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
  active: form.active,
  user_type_id: form.user_type_id === ""
    ? null
    : Number(form.user_type_id),
  expired_at: form.expired_at || null,
  permissions: form.permissions,
}),
      });
      if (!response.ok) {
        throw new Error(await getErrorMessage(response, "Não foi possível guardar o utilizador."));
      }
      await loadData();
      setSelectedUser(null);
    } catch (saveError) {
      console.error(saveError);
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="-mx-6 -mt-6">
        <Topbar title="Utilizadores BO" />
      </div>

      <div className="my-6 flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Pesquisar nome, role ou ID..."
          className="h-11 min-w-64 flex-1 rounded-lg border border-gray-300 px-3 outline-none focus:border-red-500"
        />
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="h-11 rounded-lg border border-gray-300 bg-white px-3"
          aria-label="Filtrar por estado"
        >
          <option value="all">Todos os estados</option>
          <option value="active">Ativos</option>
          <option value="inactive">Inativos</option>
        </select>
      </div>

      {error && !selectedUser && (
        <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>
      )}

      <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-md">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-left text-gray-600">
            <tr>
              <th className="p-4">Utilizador</th>
              <th className="p-4">Role</th>
              <th className="p-4">Estado</th>
              <th className="p-4">Último acesso</th>
              <th className="p-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="p-6 text-center text-gray-500">A carregar utilizadores BO...</td></tr>
            ) : filteredUsers.length === 0 ? (
              <tr><td colSpan={5} className="p-6 text-center text-gray-500">Nenhum utilizador encontrado.</td></tr>
            ) : filteredUsers.map((user) => (
              <tr key={user.user_id} className="border-t border-gray-100">
                <td className="p-4">
                  <span className="block font-medium text-gray-900">{user.username}</span>
                  <span className="text-xs text-gray-500">ID {user.user_id}</span>
                </td>
                <td className="p-4">{user.role?.userName || "Sem role"}</td>
                <td className="p-4">
                 <span
  className={`inline-flex items-center justify-center rounded-md px-2 py-1 shadow-md ${
    user.active
      ? "bg-green-100 text-green-700 shadow-green-300/60"
      : "bg-red-100 text-red-700 shadow-red-300/60"
  }`}
>
  {user.active ? (
    <FaCheck className="h-3 w-3" />
  ) : (
    <MdClose className="h-3 w-3" />
  )}
</span>
                </td>
                <td className="p-4 text-gray-600">{formatDate(user.last_login)}</td>
                <td className="p-4 text-right">
                  <button
                    type="button"
                    onClick={() => editUser(user)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <FaPencilAlt size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="mb-4 text-lg font-semibold">
              Editar {selectedUser.username}
            </h2>
            <form onSubmit={saveUser} className="flex flex-col gap-5">
<div className="grid gap-4 md:grid-cols-3">
  <label className="flex flex-col gap-1 text-sm font-medium">
    Role
    <select
      value={form.user_type_id}
      onChange={(event) =>
        setForm((current) => ({
          ...current,
          user_type_id: event.target.value,
        }))
      }
      className="h-11 rounded-lg border border-gray-300 bg-white px-3 font-normal"
    >
      <option value="">Sem role</option>
      {roles.map((role) => (
        <option key={role.userBOTypeID} value={role.userBOTypeID}>
          {role.userName}
        </option>
      ))}
    </select>
  </label>

  <label className="flex flex-col gap-1 text-sm font-medium">
    Data de expiração
    <input
      type="date"
      value={form.expired_at}
      onChange={(event) =>
        setForm((current) => ({
          ...current,
          expired_at: event.target.value,
        }))
      }
      className="h-11 rounded-lg border border-gray-300 bg-white px-3 font-normal"
    />
    <span className="text-xs font-normal text-gray-500">
      Deixe vazio para não definir uma data de expiração.
    </span>
  </label>

  <div className="flex justify-end items-start">
    <label className="flex items-center gap-2 text-sm font-medium">
      <input
        type="checkbox"
        checked={form.active}
        onChange={(event) =>
          setForm((current) => ({
            ...current,
            active: event.target.checked,
          }))
        }
        className="accent-red-500"
      />
      Utilizador ativo
    </label>
  </div>
</div>

            <div>
  <h3 className="mb-1 text-sm font-semibold">
    Permissões do utilizador
  </h3>

  <p className="mb-3 text-xs text-gray-500">
    As permissões são determinadas pela role atribuída ao utilizador.
  </p>

  <div className="grid gap-3 md:grid-cols-2">
    {Object.entries(permissionGroups).map(([module, group]) => (
      <fieldset
        key={module}
        className="rounded-lg border border-gray-200 p-3"
      >
        <legend className="px-1 text-sm font-semibold">
          {module}
        </legend>

        <div className="flex flex-col gap-3">
          {group.map((permission) => {
            const enabled = selectedRole?.permissions?.some(
              (rolePermission) => rolePermission.Id === permission.Id
            ) ?? false;

            return (
              <div
                key={permission.Id}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <span className="min-w-0">
                  <span className="block font-medium">
                    {permission.name}
                  </span>
                  <span className="text-xs text-gray-500">
                    {permission.permission_key}
                  </span>
                </span>

                <span
                  role="switch"
                  aria-checked={enabled}
                  aria-label={permission.name}
                  className={`relative inline-flex h-4 w-7 shrink-0 items-center rounded-full ${
                    enabled ? "bg-red-500" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`h-3 w-3 rounded-full bg-white shadow-sm ${
                      enabled ? "translate-x-3.5" : "translate-x-0.5"
                    }`}
                  />
                </span>
              </div>
            );
          })}
        </div>
      </fieldset>
    ))}
  </div>
</div>

              {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setSelectedUser(null)} disabled={saving} className="rounded-lg bg-gray-200 px-4 py-2">Cancelar</button>
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
