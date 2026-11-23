"use client";

import { useEffect, useState } from "react";

function isEnabled(value) {
  return value === true || value === 1 || value === "1";
}

function getScheduleName(schedule) {
  let data = schedule.schedule_json;
  if (typeof data === "string") {
    try {
      data = JSON.parse(data);
    } catch {
      data = null;
    }
  }

  return data?.name || `Horário ${schedule.schedule_id}`;
}

const campaignsByItemType = {
  Produto: [
    ["product_accept", "Produto aceite"],
    ["product_in_progress", "Produto em progresso"],
    ["product_completed", "Produto concluído"],
    ["product_cancelled", "Produto cancelado"],
  ],
  Serviço: [
    ["service_confirmed", "Serviço confirmado"],
    ["service_modified", "Serviço alterado"],
    ["service_cancelled", "Serviço cancelado"],
  ],
  "Reserva de mesa": [
    ["reservation_confirmed", "Reserva confirmada"],
    ["reservation_cancelled", "Reserva cancelada"],
  ],
};

export default function ItemModal({
  item,
  shiftOptions = [],
  initialShiftIndex = 0,
  reservationAssignment = false,
  onClose,
  onSaved,
}) {
  const isTableReservation = item.item_type === "Reserva de mesa";
  const isProduct = item.item_type === "Produto";
  const isService = item.item_type === "Serviço";
  const campaignFields = campaignsByItemType[item.item_type] || [];
  const [form, setForm] = useState({
    item_name1: item.item_name1 || "",
    item_description1: item.item_description1 || "",
    item_price: item.item_price ?? "",
    item_vat: item.item_vat ?? "",
    item_duration: item.item_duration ?? "",
    schedule_id: item.schedule_id == null ? "" : String(item.schedule_id),
    reservation: isEnabled(item.reservation),
    takeaway_order: isEnabled(item.takeaway_order),
    cart: isEnabled(item.cart),
    order: isEnabled(item.order),
    sendStaychat: isEnabled(item.sendStaychat),
    checkin: isEnabled(item.checkin),
    ...Object.fromEntries(
      campaignFields.map(([field]) => [field, isEnabled(item[field])])
    ),
    ...Object.fromEntries(
      campaignFields.map(([field]) => [
        `${field}_campaign_id`,
        item[`${field}_campaign_id`] == null
          ? ""
          : String(item[`${field}_campaign_id`]),
      ])
    ),
    shift_index: String(
      shiftOptions.some((shift) => shift.shift_index === initialShiftIndex)
        ? initialShiftIndex
        : shiftOptions[0]?.shift_index ?? ""
    ),
  });
  const [staychatCampaigns, setStaychatCampaigns] = useState([]);
  const [loadingStaychatCampaigns, setLoadingStaychatCampaigns] = useState(true);
  const [staychatCampaignsError, setStaychatCampaignsError] = useState("");
  const [schedules, setSchedules] = useState([]);
  const [loadingSchedules, setLoadingSchedules] = useState(isService);
  const [schedulesError, setSchedulesError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadStaychatCampaigns() {
      try {
        const response = await fetch("/api/staychatCampaigns");
        const data = await response.json();
        if (!response.ok) {
          throw new Error(
            data.error || "Não foi possível carregar as campanhas Staychat."
          );
        }
        if (!Array.isArray(data)) {
          throw new Error("A lista de campanhas Staychat é inválida.");
        }
        if (!cancelled) setStaychatCampaigns(data);
      } catch (loadError) {
        if (!cancelled) {
          setStaychatCampaignsError(
            loadError.message ||
              "Não foi possível carregar as campanhas Staychat."
          );
        }
      } finally {
        if (!cancelled) setLoadingStaychatCampaigns(false);
      }
    }

    loadStaychatCampaigns();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isService) return;

    let cancelled = false;

    async function loadSchedules() {
      try {
        const response = await fetch("/api/schedules");
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Não foi possível carregar os horários.");
        }
        if (!Array.isArray(data)) {
          throw new Error("A lista de horários é inválida.");
        }
        if (!cancelled) setSchedules(data);
      } catch (loadError) {
        if (!cancelled) {
          setSchedulesError(
            loadError.message || "Não foi possível carregar os horários."
          );
        }
      } finally {
        if (!cancelled) setLoadingSchedules(false);
      }
    }

    loadSchedules();
    return () => {
      cancelled = true;
    };
  }, [isService]);

  const showStaychatToggle =
    (isProduct && form.order) ||
    (reservationAssignment && form.order) ||
    (!isProduct && !reservationAssignment && campaignFields.length > 0);
  const staychatEnabled =
    form.sendStaychat &&
    ((!isProduct && !reservationAssignment) || form.order);

  function handleChange(event) {
    const { name, value, type, checked } = event.target;
    setForm((currentForm) => ({
      ...currentForm,
      [name]: type === "checkbox" ? checked : value,
      ...(type === "checkbox" &&
      !checked &&
      campaignFields.some(([field]) => field === name)
        ? { [`${name}_campaign_id`]: "" }
        : {}),
      ...(name === "order" && !checked ? { sendStaychat: false } : {}),
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!form.item_name1.trim()) {
      setError("Indique o nome do item.");
      return;
    }

    if (
      form.item_price !== "" &&
      (!Number.isFinite(Number(form.item_price)) || Number(form.item_price) < 0)
    ) {
      setError("Indique um preço válido.");
      return;
    }

    if (
      form.item_vat !== "" &&
      (!Number.isFinite(Number(form.item_vat)) ||
        Number(form.item_vat) < 0 ||
        Number(form.item_vat) > 100)
    ) {
      setError("Indique uma percentagem de IVA entre 0 e 100.");
      return;
    }

    if (
      (isTableReservation || isService) &&
      (!Number.isSafeInteger(Number(form.item_duration)) ||
        Number(form.item_duration) <= 0)
    ) {
      setError("Indique uma duração válida em minutos.");
      return;
    }

    if (
      isService &&
      !schedules.some(
        (schedule) => schedule.schedule_id === Number(form.schedule_id)
      )
    ) {
      setError("Selecione um horário válido.");
      return;
    }

    if (
      isTableReservation &&
      reservationAssignment &&
      !shiftOptions.some(
        (shift) => shift.shift_index === Number(form.shift_index)
      )
    ) {
      setError("Selecione um turno válido no horário do outlet.");
      return;
    }

    const missingCampaign = campaignFields.find(
      ([field]) => form[field] && !form[`${field}_campaign_id`]
    );
    if (staychatEnabled && missingCampaign) {
      setError(
        `Selecione uma campanha Staychat para "${missingCampaign[1]}".`
      );
      return;
    }

    setIsSaving(true);

    try {
      await onSaved(
        {
          item_id: item.item_id,
          item_name1: form.item_name1.trim(),
          ...(isProduct
            ? { item_description1: form.item_description1.trim() }
            : {}),
          item_price: form.item_price,
          item_vat: form.item_vat,
          ...(isService
            ? {
                item_duration: Number(form.item_duration),
                schedule_id: Number(form.schedule_id),
              }
            : {}),
          ...(isProduct
            ? {
                takeaway_order: form.takeaway_order,
                cart: form.cart,
                order: form.order,
                sendStaychat: form.order && form.sendStaychat,
                checkin: form.checkin,
              }
            : {}),
          ...(isTableReservation
            ? {
                item_duration: Number(form.item_duration),
                ...(reservationAssignment
                  ? {
                      reservation: form.reservation,
                      takeaway_order: form.takeaway_order,
                      cart: form.cart,
                      order: form.order,
                      sendStaychat: form.order && form.sendStaychat,
                      checkin: form.checkin,
                    }
                  : {}),
              }
            : {}),
          ...(!isProduct && !reservationAssignment && campaignFields.length > 0
            ? { sendStaychat: form.sendStaychat }
            : {}),
          ...(staychatEnabled && campaignFields.length > 0
            ? {
                campaigns: Object.fromEntries(
                  campaignFields.map(([field]) => [field, form[field]])
                ),
                campaignIds: Object.fromEntries(
                  campaignFields.map(([field]) => [
                    field,
                    form[field]
                      ? Number(form[`${field}_campaign_id`])
                      : null,
                  ])
                ),
              }
            : {}),
        },
        reservationAssignment ? Number(form.shift_index) : null
      );
    } catch (saveError) {
      console.error(saveError);
      setError(saveError.message || "Não foi possível guardar o item.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSaving) onClose();
      }}
    >
      <form
        onSubmit={handleSubmit}
        className="flex max-h-[calc(100dvh-2rem)] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white p-6 shadow-xl"
        aria-labelledby="item-modal-title"
      >
        <h2 id="item-modal-title" className="mb-5 text-xl font-semibold">
          Editar item
        </h2>

        <div className="min-h-0 flex-1 overflow-y-auto flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="item-modal-name" className="text-sm font-medium text-gray-700">
              Nome do item
            </label>
            <input
              id="item-modal-name"
              name="item_name1"
              value={form.item_name1}
              onChange={handleChange}
              maxLength={150}
              required
              disabled={isSaving}
              className="h-10 rounded-lg border px-3"
            />
          </div>

          {isProduct && (
            <div className="flex flex-col gap-1">
              <label
                htmlFor="item-modal-description"
                className="text-sm font-medium text-gray-700"
              >
                Descrição
              </label>
              <textarea
                id="item-modal-description"
                name="item_description1"
                value={form.item_description1}
                onChange={handleChange}
                maxLength={150}
                rows={3}
                disabled={isSaving}
                className="rounded-lg border px-3 py-2"
              />
            </div>
          )}

          <div className={reservationAssignment ? "grid grid-cols-2 gap-3" : ""}>
            <div className="flex flex-col gap-1">
              <label htmlFor="item-modal-price" className="text-sm font-medium text-gray-700">
                Preço
              </label>
              <input
                id="item-modal-price"
                name="item_price"
                type="number"
                min="0"
                step="0.01"
                value={form.item_price}
                onChange={handleChange}
                disabled={isSaving}
                className="h-10 rounded-lg border px-3"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="item-modal-vat" className="text-sm font-medium text-gray-700 mt-3">
                IVA (%)
              </label>
              <input
                id="item-modal-vat"
                name="item_vat"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={form.item_vat}
                onChange={handleChange}
                disabled={isSaving}
                className="h-10 rounded-lg border px-3"
              />
            </div>
          </div>

          {isTableReservation && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label htmlFor="item-modal-duration" className="text-sm font-medium text-gray-700">
                    Duração (minutos)
                  </label>
                  <input
                    id="item-modal-duration"
                    name="item_duration"
                    type="number"
                    min="1"
                    step="1"
                    value={form.item_duration}
                    onChange={handleChange}
                    required
                    disabled={isSaving}
                    className="h-10 rounded-lg border px-3"
                  />
                </div>
                {reservationAssignment && (
                  <div className="flex flex-col gap-1">
                    <label htmlFor="item-modal-shift" className="text-sm font-medium text-gray-700">
                      Turno do horário
                    </label>
                    <select
                      id="item-modal-shift"
                      name="shift_index"
                      value={form.shift_index}
                      onChange={handleChange}
                      required
                      disabled={isSaving || shiftOptions.length === 0}
                      className="h-10 rounded-lg border px-3 disabled:bg-gray-100"
                    >
                      {shiftOptions.length === 0 ? (
                        <option value="">Sem turnos configurados</option>
                      ) : (
                        shiftOptions.map((shift) => (
                          <option key={shift.shift_index} value={shift.shift_index}>
                            {shift.label}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                )}
              </div>
              {reservationAssignment && <fieldset className="flex flex-col gap-2">
                <legend className="text-sm font-bold text-gray-600">
                  Condições do item
                </legend>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {[
                    ["reservation", "Reserva"],
                    ["takeaway_order", "Encomenda"],
                    ["cart", "Carrinho"],
                    ["order", "Pedido"],
                    ["checkin", "Check-in"],
                  ].map(([name, label]) => (
                    <label key={name} className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        name={name}
                        checked={form[name]}
                        onChange={handleChange}
                        disabled={isSaving}
                        className="h-4 w-4 accent-red-500"
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </fieldset>}
            </>
          )}
          {isService && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="item-modal-duration"
                  className="text-sm font-medium text-gray-700"
                >
                  Duração (minutos)
                </label>
                <input
                  id="item-modal-duration"
                  name="item_duration"
                  type="number"
                  min="1"
                  step="1"
                  value={form.item_duration}
                  onChange={handleChange}
                  required
                  disabled={isSaving}
                  className="h-10 rounded-lg border px-3"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="item-modal-schedule"
                  className="text-sm font-medium text-gray-700"
                >
                  Horário associado
                </label>
                <select
                  id="item-modal-schedule"
                  name="schedule_id"
                  value={form.schedule_id}
                  onChange={handleChange}
                  required
                  disabled={isSaving || loadingSchedules || schedulesError !== ""}
                  className="h-10 rounded-lg border px-3 disabled:bg-gray-100"
                >
                  <option value="">
                    {loadingSchedules
                      ? "A carregar horários..."
                      : schedules.length === 0
                        ? "Sem horários disponíveis"
                        : "Selecionar horário"}
                  </option>
                  {schedules.map((schedule) => (
                    <option key={schedule.schedule_id} value={schedule.schedule_id}>
                      {getScheduleName(schedule)}
                    </option>
                  ))}
                </select>
                {schedulesError && (
                  <p role="alert" className="text-sm text-red-700">
                    {schedulesError}
                  </p>
                )}
              </div>
            </div>
          )}
          {isProduct && (
            <fieldset className="flex flex-col gap-2">
              <legend className="text-sm font-bold text-gray-600">
                Condições do item
              </legend>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {[
                  ["takeaway_order", "Encomenda"],
                  ["cart", "Carrinho"],
                  ["order", "Pedido"],
                  ["checkin", "Check-in"],
                ].map(([name, label]) => (
                  <label key={name} className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      name={name}
                      checked={form[name]}
                      onChange={handleChange}
                      disabled={isSaving}
                      className="h-4 w-4 accent-red-500"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </fieldset>
          )}
          {showStaychatToggle && (
            <label className="flex items-start gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
              <input
                type="checkbox"
                name="sendStaychat"
                checked={form.sendStaychat}
                onChange={handleChange}
                disabled={isSaving}
                className="mt-0.5 h-4 w-4 accent-red-500"
              />
              <span>
                {isProduct
                  ? "Enviar notificações de pedidos para o Staychat"
                  : "Enviar notificações para o Staychat"}
              </span>
            </label>
          )}
          {staychatEnabled && campaignFields.length > 0 && (
            <fieldset className="flex flex-col gap-2 rounded-lg border border-red-100 bg-red-50/50 p-3">
              <legend className="px-1 text-sm font-bold text-gray-700">
                Campanhas Staychat
              </legend>
              {staychatCampaignsError && (
                <p role="alert" className="text-sm text-red-700">
                  {staychatCampaignsError}
                </p>
              )}
              {campaignFields.map(([field, label]) => (
                <div
                  key={field}
                  className="grid gap-2 rounded-lg border border-red-100 bg-white p-3"
                >
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      name={field}
                      checked={form[field]}
                      onChange={handleChange}
                      disabled={isSaving}
                      className="h-4 w-4 accent-red-500"
                    />
                    {label}
                  </label>
                  {form[field] && (
                    <label className="flex flex-col gap-1 text-xs font-medium text-gray-600">
                      Campanha associada
                      <select
                        name={`${field}_campaign_id`}
                        value={form[`${field}_campaign_id`]}
                        onChange={handleChange}
                        disabled={isSaving || loadingStaychatCampaigns}
                        className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm font-normal text-gray-900 disabled:bg-gray-100"
                      >
                        <option value="">
                          {loadingStaychatCampaigns
                            ? "A carregar campanhas..."
                            : "Selecione uma campanha"}
                        </option>
                        {staychatCampaigns.map((campaign) => (
                          <option
                            key={campaign.staychat_campaign_id}
                            value={campaign.staychat_campaign_id}
                          >
                            {campaign.campaign_name} ({campaign.campaign_id})
                          </option>
                        ))}
                      </select>
                      {!loadingStaychatCampaigns &&
                        staychatCampaigns.length === 0 && (
                          <span className="font-normal text-red-600">
                            Não existem campanhas registadas.
                          </span>
                        )}
                    </label>
                  )}
                </div>
                ))}
            </fieldset>
          )}
        </div>

        {error && (
          <p role="alert" className="mt-4 text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="rounded-lg bg-gray-200 px-4 py-2 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-lg bg-red-500 px-4 py-2 text-white disabled:opacity-50"
          >
            {isSaving ? "A guardar..." : "Guardar"}
          </button>
        </div>
      </form>
    </div>
  );
}
