"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiLock,
  FiLogIn,
} from "react-icons/fi";
import { FaArrowLeft } from "react-icons/fa6";

function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getLocalTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Lisbon";
}

function formatReservationDate(value, options = {}) {
  const parsedDate = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsedDate.getTime())) return value;

  return new Intl.DateTimeFormat("pt-PT", {
    timeZone: "UTC",
    weekday: options.long ? "long" : "short",
    day: "2-digit",
    month: options.long ? "long" : "short",
  }).format(parsedDate);
}

export default function ServiceReservationClient({
  outletId,
  outletItemId,
  itemId,
  authCheck,
}) {
  const router = useRouter();
  const [date, setDate] = useState(() => getLocalDateString());
  const dateInputRef = useRef(null);
  const [service, setService] = useState(null);
  const [outletImage, setOutletImage] = useState("");
  const [timeOptions, setTimeOptions] = useState([]);
  const [startingTime, setStartingTime] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerSurname, setCustomerSurname] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [sessionStatus, setSessionStatus] = useState("checking");
  const [loading, setLoading] = useState(true);
  const [isBooking, setIsBooking] = useState(false);
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [error, setError] = useState("");
  const [reservationId, setReservationId] = useState(null);
  const [reservationEmailSent, setReservationEmailSent] = useState(false);
  const [reservationEmailWarning, setReservationEmailWarning] = useState("");

  useEffect(() => {
    let active = true;

    setSessionStatus("checking");
    setLoading(true);
    setError("");

    fetch("/api/session", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Não foi possível verificar a sessão.");
        }
        return response.json();
      })
      .then((session) => {
        if (!active) return;
        if (session?.authenticated && session.user?.email) {
          setUserEmail(session.user.email);
          setSessionStatus("authenticated");
        } else {
          setSessionStatus("unauthenticated");
        }
      })
      .catch((sessionError) => {
        console.error("Não foi possível carregar os dados da sessão.", sessionError);
        if (active) {
          setSessionStatus("error");
          setError(sessionError.message || "Não foi possível verificar a sessão.");
        }
      });

    return () => {
      active = false;
    };
  }, [authCheck]);

  useEffect(() => {
    if (sessionStatus === "checking" || sessionStatus === "error") return;
    if (sessionStatus === "unauthenticated") {
      setLoading(false);
      return;
    }
    if (!outletId || (!outletItemId && !itemId) || !date) {
      setLoading(false);
      setError("O serviço solicitado é inválido.");
      return;
    }

    const controller = new AbortController();
    const params = new URLSearchParams({
      outlet_id: outletId,
      date,
      time_zone: getLocalTimeZone(),
      ...(outletItemId ? { outlet_item_id: outletItemId } : { item_id: itemId }),
    });

    setLoading(true);
    setError("");
    setSelectedTime("");

    fetch(`/api/service-reservations?${params}`, {
      signal: controller.signal,
      cache: "no-store",
    })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error || "Não foi possível carregar os horários.");
        }
        if (
          !result?.item ||
          !Array.isArray(result.time_options) ||
          typeof result.outlet_name !== "string"
        ) {
          throw new TypeError("A API devolveu dados de serviço inválidos.");
        }

        if (!controller.signal.aborted) {
          setService(result);
          setOutletImage(result.outlet_image || "");
          setTimeOptions(result.time_options);
          setStartingTime("");
        }
      })
      .catch((fetchError) => {
        if (fetchError.name !== "AbortError") {
          console.error("Não foi possível carregar o serviço.", fetchError);
          if (fetchError.message === "Inicie sessão para reservar este serviço.") {
            setSessionStatus("unauthenticated");
            return;
          }
          setService(null);
          setTimeOptions([]);
          setError(fetchError.message || "Não foi possível carregar os horários.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [date, itemId, outletId, outletItemId, sessionStatus]);

  async function submitReservation(event) {
    event.preventDefault();
    if (!service || !selectedTime || isBooking) return;

    setIsBooking(true);
    setError("");
    setIsSuccessOpen(false);
    setReservationEmailSent(false);
    setReservationEmailWarning("");

    try {
      const response = await fetch("/api/service-reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          outlet_id: Number(outletId),
          ...(outletItemId
            ? { outlet_item_id: Number(outletItemId) }
            : { item_id: Number(itemId) }),
          date,
          start_time: selectedTime,
          time_zone: getLocalTimeZone(),
          customer_name: customerName.trim(),
          customer_surname: customerSurname.trim(),
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        if (response.status === 401) {
          setSessionStatus("unauthenticated");
        }
        throw new Error(result.error || "Não foi possível confirmar a reserva.");
      }

      setReservationId(result.reservation_service_id);
      setReservationEmailSent(result.emailSent === true);
      setReservationEmailWarning(
        typeof result.emailWarning === "string" ? result.emailWarning : ""
      );
      setSelectedTime("");
      setIsConfirmationOpen(false);
      setIsSuccessOpen(true);
    } catch (bookingError) {
      console.error("Não foi possível confirmar a reserva do serviço.", bookingError);
      setError(bookingError.message || "Não foi possível confirmar a reserva.");
    } finally {
      setIsBooking(false);
    }
  }

  function openSignIn() {
    const returnUrl = new URL(
      `${window.location.pathname}${window.location.search}`,
      window.location.origin
    );
    returnUrl.searchParams.set("auth_check", String(Date.now()));
    const params = new URLSearchParams({
      opensigninmodal: "",
      service_reservation_return: `${returnUrl.pathname}${returnUrl.search}`,
    });
    router.push(`/homepage?${params}`);
  }

  const today = getLocalDateString();
  const selectedStartingTime = timeOptions.includes(startingTime)
    ? startingTime
    : timeOptions[0] || "";
  const selectableTimeOptions = timeOptions.filter(
    (time) => time >= selectedStartingTime
  );
  const formattedDate = date ? formatReservationDate(date) : "";
  const formattedPrice =
    service?.item.item_price == null
      ? null
      : new Intl.NumberFormat("pt-PT", {
          style: "currency",
          currency: "EUR",
        }).format(Number(service.item.item_price));

  return (
    <main className="flex min-h-screen bg-white text-gray-900">
      <div className="min-h-screen w-full max-w-md shrink-0 bg-white px-4 pb-8 pt-8 sm:px-6">
        <section>
          <div className="relative flex min-h-10 items-center justify-center">
            <button
              type="button"
              onClick={() => window.history.back()}
              className="absolute left-0 rounded-lg bg-white p-2 text-sm hover:bg-gray-100"
              aria-label="Voltar"
            >
              <FaArrowLeft aria-hidden="true" size={20} />
            </button>
            <h1 className="text-center text-2xl font-semibold">
              Reserve o seu serviço
            </h1>
          </div>
          {service?.outlet_name && (
            <p className="mt-1 text-center text-gray-600">
              {service.outlet_name}
            </p>
          )}

          {sessionStatus === "checking" ? (
            <p className="mt-6 text-sm text-gray-500" role="status">
              A verificar a sessão...
            </p>
          ) : sessionStatus === "unauthenticated" ? (
            <section className="mt-8 rounded-2xl border border-gray-200 p-6 text-center">
              <FiLock
                aria-hidden="true"
                className="mx-auto text-red-600"
                size={28}
              />
              <h2 className="mt-4 text-lg font-semibold">
                Inicie sessão para continuar
              </h2>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                A sua reserva ficará associada à conta. Depois de iniciar
                sessão, voltará a esta marcação.
              </p>
              <button
                type="button"
                onClick={openSignIn}
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
              >
                <FiLogIn aria-hidden="true" />
                Iniciar sessão
              </button>
            </section>
          ) : sessionStatus === "error" ? (
            <p className="mt-6 text-sm text-red-600" role="alert">
              {error}
            </p>
          ) : loading ? (
            <p className="mt-6 text-sm text-gray-500" role="status">
              A carregar os horários...
            </p>
          ) : error && !service ? (
            <p className="mt-6 text-sm text-red-600" role="alert">
              {error}
            </p>
          ) : service ? (
            <>
              <div className="mt-6 border-y border-gray-200 py-4">
                <h2 className="text-lg font-semibold">
                  {service.item.item_name1}
                </h2>
                <div className="mt-3 flex items-center justify-between gap-3 text-sm">
                  <span className="flex items-center gap-2 text-gray-600">
                    <FiClock aria-hidden="true" />
                    Duração
                  </span>
                  <strong>{service.item.item_duration} minutos</strong>
                </div>
                {formattedPrice && (
                  <div className="mt-3 flex items-center justify-between gap-3 text-sm">
                    <span className="text-gray-600">Preço</span>
                    <strong>{formattedPrice}</strong>
                  </div>
                )}
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="flex min-w-0 flex-col gap-2 text-sm font-medium">
                  <span>Data</span>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        const dateInput = dateInputRef.current;
                        if (typeof dateInput?.showPicker === "function") {
                          dateInput.showPicker();
                        } else {
                          dateInput?.click();
                        }
                      }}
                      className="relative flex h-11 w-full items-center rounded-lg border border-gray-300 bg-white px-3 pr-7 text-left font-normal outline-none focus:border-red-500"
                      aria-label={`Selecionar data, ${formattedDate}`}
                    >
                      <span aria-hidden="true">{formattedDate}</span>
                      <FiCalendar
                        aria-hidden="true"
                        className="absolute right-2 text-gray-600"
                      />
                    </button>
                    <input
                      ref={dateInputRef}
                      type="date"
                      min={today}
                      value={date}
                      onChange={(event) => {
                        setDate(event.target.value);
                        setStartingTime("");
                        setSelectedTime("");
                        setIsConfirmationOpen(false);
                        setIsSuccessOpen(false);
                        setReservationId(null);
                        setError("");
                      }}
                      aria-label="Data da reserva"
                      tabIndex={-1}
                      className="pointer-events-none absolute h-px w-px opacity-0"
                    />
                  </div>
                </div>

                <label className="flex min-w-0 flex-col gap-2 text-sm font-medium">
                  A partir das
                  <select
                    value={selectedStartingTime}
                    onChange={(event) => setStartingTime(event.target.value)}
                    className="h-11 rounded-lg border border-gray-300 px-3 outline-none focus:border-red-500"
                  >
                    {timeOptions.length ? (
                      timeOptions.map((time) => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))
                    ) : (
                      <option value="">Sem horários</option>
                    )}
                  </select>
                </label>
              </div>

              <div className="mt-8">
                <hr className="border-gray-300" />
                <h3 className="mt-4 text-sm font-semibold">
                  Horários disponíveis
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {formatReservationDate(date, { long: true })}
                </p>
                {selectableTimeOptions.length ? (
                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {selectableTimeOptions.map((time) => (
                      <button
                        type="button"
                        key={time}
                        onClick={() => {
                          setSelectedTime(time);
                          setIsConfirmationOpen(true);
                          setIsSuccessOpen(false);
                          setReservationId(null);
                          setError("");
                        }}
                        aria-pressed={selectedTime === time}
                        className={`rounded-lg border border-gray-300 px-3 py-3 text-center text-sm font-medium transition ${
                          selectedTime === time
                            ? "border-red-600 bg-red-600 text-white"
                            : "bg-white text-gray-900 hover:bg-gray-50"
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 flex items-center gap-2 text-sm text-gray-500">
                    <FiCalendar aria-hidden="true" size={20} />
                    Não existem horários disponíveis para esta data.
                  </p>
                )}
              </div>
            </>
          ) : null}
        </section>
      </div>

      <div
        role={outletImage ? "img" : undefined}
        aria-label={outletImage ? `${service?.outlet_name || "Outlet"} image` : undefined}
        className="sticky top-0 hidden h-screen min-w-0 flex-1 bg-gray-100 bg-cover bg-center lg:block"
        style={
          outletImage
            ? { backgroundImage: `url("${outletImage}")` }
            : undefined
        }
      />

      {isConfirmationOpen &&
        selectedTime &&
        service &&
        sessionStatus === "authenticated" && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget && !isBooking) {
                setIsConfirmationOpen(false);
                setSelectedTime("");
                setError("");
              }
            }}
          >
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="service-confirmation-title"
              className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            >
              <h2 id="service-confirmation-title" className="text-xl font-semibold">
                Confirme a sua reserva
              </h2>
              <dl className="mt-5 space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <FiCalendar aria-hidden="true" size={20} />
                  <div>
                    <p className="font-semibold">{service.item.item_name1}</p>
                    <p className="mt-1 text-gray-500">
                      {formatReservationDate(date, { long: true })} às{" "}
                      {selectedTime}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-gray-200 pt-3">
                  <span className="text-gray-600">Duração</span>
                  <strong>{service.item.item_duration} minutos</strong>
                </div>
                {formattedPrice && (
                  <div className="flex items-center justify-between border-t border-gray-200 pt-3">
                    <span className="text-gray-600">Preço</span>
                    <strong>{formattedPrice}</strong>
                  </div>
                )}
              </dl>

              <form onSubmit={submitReservation}>
                <div className="mt-5 border-t border-gray-200 pt-4">
                  <h3 className="font-semibold">Dados de contacto</h3>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <label className="grid min-w-0 gap-1 text-sm font-medium">
                      Nome
                      <input
                        value={customerName}
                        onChange={(event) => setCustomerName(event.target.value)}
                        maxLength={150}
                        autoComplete="given-name"
                        required
                        className="h-10 min-w-0 rounded-lg border border-gray-300 px-3 font-normal outline-none focus:border-red-500"
                      />
                    </label>
                    <label className="grid min-w-0 gap-1 text-sm font-medium">
                      Apelido
                      <input
                        value={customerSurname}
                        onChange={(event) =>
                          setCustomerSurname(event.target.value)
                        }
                        maxLength={150}
                        autoComplete="family-name"
                        required
                        className="h-10 min-w-0 rounded-lg border border-gray-300 px-3 font-normal outline-none focus:border-red-500"
                      />
                    </label>
                    <div className="col-span-2">
                      <span className="text-sm font-medium">Email da conta</span>
                      <p className="mt-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-600">
                        {userEmail}
                      </p>
                    </div>
                  </div>
                </div>
                {error && (
                  <p className="mt-3 text-sm text-red-600" role="alert">
                    {error}
                  </p>
                )}
                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsConfirmationOpen(false);
                      setSelectedTime("");
                      setError("");
                    }}
                    disabled={isBooking}
                    className="flex-1 rounded-lg border border-gray-300 px-4 py-3 font-semibold disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isBooking}
                    className="flex-1 rounded-lg bg-red-600 px-4 py-3 font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                  >
                    {isBooking ? "A confirmar..." : "Confirmar"}
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}

      {isSuccessOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="service-success-title"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
          >
            <FiCheckCircle
              aria-hidden="true"
              className="text-emerald-600"
              size={24}
            />
            <h2
              id="service-success-title"
              className="mt-3 text-lg font-semibold"
            >
              Reserva enviada com sucesso
            </h2>
            {reservationId && (
              <p className="mt-2 text-sm text-gray-600">
                Referência #{reservationId}. Pode acompanhar o estado nas
                notificações da sua conta.
              </p>
            )}
            <p
              role={reservationEmailWarning ? "alert" : "status"}
              className={`mt-2 text-sm ${
                reservationEmailWarning ? "text-amber-700" : "text-gray-600"
              }`}
            >
              {reservationEmailWarning ||
                (reservationEmailSent
                  ? `Foi enviado um email para ${userEmail}.`
                  : "A reserva foi criada, mas o email não foi enviado.")}
            </p>
            <button
              type="button"
              onClick={() => setIsSuccessOpen(false)}
              className="mt-6 ml-auto block rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
            >
              OK
            </button>
          </section>
        </div>
      )}
    </main>
  );
}
