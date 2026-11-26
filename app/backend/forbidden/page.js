export default function ForbiddenPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow">
        <h1 className="text-xl font-semibold text-gray-900">Acesso não autorizado</h1>
        <p className="mt-2 text-sm text-gray-600">
          A sua role não tem permissão para aceder a esta secção.
        </p>
        <a
          href="/backend"
          className="mt-6 inline-flex rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
        >
          Voltar ao backend
        </a>
      </div>
    </main>
  );
}
