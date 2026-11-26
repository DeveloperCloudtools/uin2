"use client";

import { useEffect, useState } from "react";
import Topbar from "@/components/layout/Topbar";
import { FaCheck } from "react-icons/fa";
import { MdClose } from "react-icons/md";

async function getErrorMessage(response, fallback) {
  const result = await response.json().catch(() => null);
  return result?.error || fallback;
}

function formatDate(value) {
  return value ? new Date(value).toLocaleString("pt-PT") : "—";
}

export default function UsersFOPage() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/users/fo")
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(await getErrorMessage(response, "Não foi possível carregar utilizadores FO."));
        }
        setUsers(await response.json());
      })
      .catch((loadError) => {
        console.error(loadError);
        setError(loadError.message);
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredUsers = users.filter((user) => {
    if (status === "active" && user.expired) return false;
    if (status === "expired" && !user.expired) return false;
    const query = search.trim().toLowerCase();
    return (
      !query ||
      [user.email, String(user.id)]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query))
    );
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="-mx-6 -mt-6">
        <Topbar title="Utilizadores FO" />
      </div>

      <div className="my-6 flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Pesquisar email ou ID..."
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
          <option value="expired">Expirados</option>
        </select>
      </div>

      {error && <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-md">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-left text-gray-600">
            <tr>
              <th className="p-4">Email</th>
              <th className="p-4">Criado</th>
              <th className="p-4">Expira</th>
              <th className="p-4">Estado</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="p-6 text-center text-gray-500">A carregar utilizadores FO...</td></tr>
            ) : filteredUsers.length === 0 ? (
              <tr><td colSpan={4} className="p-6 text-center text-gray-500">Nenhum utilizador encontrado.</td></tr>
            ) : filteredUsers.map((user) => (
              <tr key={user.id} className="border-t border-gray-100">
                <td className="p-4">
                  <span className="block font-medium text-gray-900">{user.email || "Sem email"}</span>
                  <span className="text-xs text-gray-500">ID {user.id}</span>
                </td>
                <td className="p-4 text-gray-600">{formatDate(user.created_at)}</td>
                <td className="p-4 text-gray-600">{formatDate(user.expires_at)}</td>
                <td className="p-4">
        
                  <span
  className={`inline-flex items-center justify-center rounded-md px-2 py-1 shadow-md ${
    user.expired
      ? "bg-red-100 text-red-700 shadow-red-300/60"
      : "bg-green-100 text-green-700 shadow-green-300/60"
  }`}
>
  {user.expired ? (
     <MdClose className="h-3 w-3" />
  ) : (
    <FaCheck className="h-3 w-3" />
  )}
</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
