
"use client";

import { useEffect, useState } from "react";
import Topbar from "@/components/layout/Topbar";
import { FiX } from "react-icons/fi";

const languages = [
  [1, "Português 1"],
  [2, "Português 2"],
  [3, "Português 3"],
  [4, "Português 4"],
  [5, "Português 5"],
];

const emptyTemplate = {
  email_title1: "",
  email_title2: "",
  email_title3: "",
  email_title4: "",
  email_title5: "",
  email_body1: "",
  email_body2: "",
  email_body3: "",
  email_body4: "",
  email_body5: "",
};

const emptySettings = {
  reply_email: "",
  reply_password: "",
  sending_server: "",
  sending_port: "587",
};

const emptyChatbotSettings = {
  active: true,
  provider: "Hijiffy",
  hijiffyToken: "",
  hijiffyCampaign: "",
  staychatToken: "",
  staychatPhoneID: "",
  staychatWebhook: "",
};

const staychatCampaignSections = [
  [
    "Produtos",
    "Produto",
    [
      ["product_accept", "Produto aceite"],
      ["product_in_progress", "Produto em progresso"],
      ["product_completed", "Produto concluído"],
      ["product_cancelled", "Produto cancelado"],
    ],
  ],
  [
    "Serviços",
    "Serviço",
    [
      ["service_confirmed", "Serviço confirmado"],
      ["service_modified", "Serviço alterado"],
      ["service_cancelled", "Serviço cancelado"],
    ],
  ],
  [
    "Reservas",
    "Reserva de mesa",
    [
      ["reservation_confirmed", "Reserva confirmada"],
      ["reservation_cancelled", "Reserva cancelada"],
    ],
  ],
];

const staychatCampaignFields = staychatCampaignSections.flatMap(
  ([, , fields]) => fields
);

const staychatCampaignsByItemType = Object.fromEntries(
  staychatCampaignSections.map(([, itemType, fields]) => [
    itemType,
    fields.map(([name]) => name),
  ])
);

function toChatbotFormSettings(settings) {
  return {
    active: settings.active ?? emptyChatbotSettings.active,
    provider: settings.provider || emptyChatbotSettings.provider,
    hijiffyToken: settings.hijiffyToken || "",
    hijiffyCampaign: settings.hijiffyCampaign || "",
    staychatToken: settings.staychatToken || "",
    staychatPhoneID: settings.staychatPhoneID || "",
    staychatWebhook: settings.staychatWebhook || "",
  };
}

function groupItemsByOutlet(items) {
  const groups = new Map();

  for (const item of items) {
    const key = item.outlet_id ?? `sem-outlet-${item.outlet_item_id}`;
    const group = groups.get(key) || {
      key,
      title: item.outlet_name || "Outlet sem nome",
      items: new Map(),
    };
    group.items.set(item.outlet_item_id, item);
    groups.set(key, group);
  }

  return [...groups.values()].map((group) => ({
    ...group,
    items: [...group.items.values()],
  }));
}

export default function AdvancedConfigurationsPage() {
  const [settings, setSettings] = useState(emptySettings);
  const [templates, setTemplates] = useState([]);
  const [templateForm, setTemplateForm] = useState(emptyTemplate);
  const [chatbotSettings, setChatbotSettings] = useState(emptyChatbotSettings);
  const [staychatCampaigns, setStaychatCampaigns] = useState([]);
  const [campaignForm, setCampaignForm] = useState({
    campaign_name: "",
    campaign_id: "",
  });
  const [editingStaychatCampaignId, setEditingStaychatCampaignId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [activeLanguage, setActiveLanguage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [savingChatbotSettings, setSavingChatbotSettings] = useState(false);
  const [savingStaychatCampaigns, setSavingStaychatCampaigns] = useState(false);
  const [showMassUpdateModal, setShowMassUpdateModal] = useState(false);
  const [massUpdateStep, setMassUpdateStep] = useState("campaigns");
  const [selectedMassCampaigns, setSelectedMassCampaigns] = useState({});
  const [massUpdateItems, setMassUpdateItems] = useState([]);
  const [selectedMassItemIds, setSelectedMassItemIds] = useState([]);
  const [loadingMassUpdateItems, setLoadingMassUpdateItems] = useState(false);
  const [savingMassUpdate, setSavingMassUpdate] = useState(false);
  const [massUpdateError, setMassUpdateError] = useState("");
  const [showMassCleanupModal, setShowMassCleanupModal] = useState(false);
  const [massCleanupItems, setMassCleanupItems] = useState([]);
  const [selectedCleanupCampaigns, setSelectedCleanupCampaigns] = useState([]);
  const [loadingMassCleanupItems, setLoadingMassCleanupItems] = useState(false);
  const [savingMassCleanup, setSavingMassCleanup] = useState(false);
  const [confirmedMassCleanup, setConfirmedMassCleanup] = useState(false);
  const [massCleanupError, setMassCleanupError] = useState("");
  const [showAssociationModal, setShowAssociationModal] = useState(false);
  const [associationItems, setAssociationItems] = useState([]);
  const [loadingAssociationItems, setLoadingAssociationItems] = useState(false);
  const [associationItemsError, setAssociationItemsError] = useState("");
  const [editingCampaignItem, setEditingCampaignItem] = useState(null);
  const [editingItemCampaigns, setEditingItemCampaigns] = useState({});
  const [editingItemCampaignIds, setEditingItemCampaignIds] = useState({});
  const [savingItemCampaigns, setSavingItemCampaigns] = useState(false);
  const [itemCampaignError, setItemCampaignError] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const affectedCleanupItems = massCleanupItems.filter((item) =>
    selectedCleanupCampaigns.some((field) => item.campaigns[field])
  );

  useEffect(() => {
    async function loadData() {
      try {
        const [settingsResponse, templatesResponse, chatbotResponse, campaignsResponse] = await Promise.all([
          fetch("/api/emailSettings"),
          fetch("/api/emailTemplates"),
          fetch("/api/chatbotsStay"),
          fetch("/api/staychatCampaigns"),
        ]);

        if (!campaignsResponse.ok) {
          throw new Error("Não foi possível carregar as campanhas Staychat.");
        }

        const settingsData = await settingsResponse.json();
        const templatesData = await templatesResponse.json();
        const chatbotData = await chatbotResponse.json();
        const campaignsData = await campaignsResponse.json();

        if (settingsData) {
          setSettings({
            reply_email: settingsData.reply_email || "",
            // Nunca esperamos receber a password/hash da API.
            reply_password: "",
            sending_server: settingsData.sending_server || "",
            sending_port: String(settingsData.sending_port || "587"),
          });
        }

        setTemplates(Array.isArray(templatesData) ? templatesData : []);

        if (chatbotData) {
          setChatbotSettings(toChatbotFormSettings(chatbotData));
        }

        setStaychatCampaigns(Array.isArray(campaignsData) ? campaignsData : []);
      } catch (error) {
        setMessageType("error");
        setMessage("Não foi possível carregar as configurações.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  function updateSettings(event) {
    const { name, value } = event.target;

    setSettings((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function updateTemplate(event) {
    const { name, value } = event.target;

    setTemplateForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function updateChatbotSettings(event) {
    const { name, value, type, checked } = event.target;

    setChatbotSettings((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function saveSettings(event) {
    event.preventDefault();

    setSavingSettings(true);
    setMessage("");
    setMessageType("");

    try {
      const response = await fetch("/api/emailSettings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Não foi possível guardar a configuração.");
      }

      setSettings((current) => ({
        ...current,
        reply_email: data.reply_email || current.reply_email,
        sending_server: data.sending_server || current.sending_server,
        sending_port: String(
          data.sending_port || current.sending_port || "587"
        ),
        // Não colocar password/hash no estado vindo da API.
        reply_password: "",
      }));

      setMessageType("success");
      setMessage("Configuração de email guardada com sucesso.");
    } catch (error) {
      setMessageType("error");
      setMessage(
        error.message || "Não foi possível guardar a configuração."
      );
    } finally {
      setSavingSettings(false);
    }
  }

  async function saveTemplate(event) {
    event.preventDefault();

    setSavingTemplate(true);
    setMessage("");
    setMessageType("");

    try {
      const response = await fetch(
        editingId
          ? `/api/emailTemplates/${editingId}`
          : "/api/emailTemplates",
        {
          method: editingId ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(templateForm),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      setTemplates((current) =>
        editingId
          ? current.map((template) =>
              template.email_template_id === editingId
                ? data
                : template
            )
          : [...current, data]
      );

      resetTemplateForm();

      setMessageType("success");
      setMessage("Modelo de email guardado.");
    } catch (error) {
      setMessageType("error");
      setMessage(
        error.message || "Não foi possível guardar o modelo."
      );
    } finally {
      setSavingTemplate(false);
    }
  }

  async function saveChatbotSettings(event) {
    event.preventDefault();

    setSavingChatbotSettings(true);
    setMessage("");
    setMessageType("");

    try {
      const response = await fetch("/api/chatbotsStay", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(chatbotSettings),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Não foi possível guardar a configuração dos chatbots.");
      }

      setChatbotSettings(toChatbotFormSettings(data));
      setMessageType("success");
      setMessage("Configuração dos chatbots guardada com sucesso.");
    } catch (error) {
      setMessageType("error");
      setMessage(
        error.message || "Não foi possível guardar a configuração dos chatbots."
      );
    } finally {
      setSavingChatbotSettings(false);
    }
  }

  function updateCampaignForm(event) {
    const { name, value } = event.target;
    setCampaignForm((current) => ({ ...current, [name]: value }));
  }

  function resetCampaignForm() {
    setCampaignForm({ campaign_name: "", campaign_id: "" });
    setEditingStaychatCampaignId(null);
  }

  function editStaychatCampaign(campaign) {
    setCampaignForm({
      campaign_name: campaign.campaign_name || "",
      campaign_id: campaign.campaign_id || "",
    });
    setEditingStaychatCampaignId(campaign.staychat_campaign_id);
  }

  async function saveStaychatCampaign(event) {
    event.preventDefault();

    setSavingStaychatCampaigns(true);
    setMessage("");
    setMessageType("");

    try {
      const response = await fetch(
        editingStaychatCampaignId
          ? `/api/staychatCampaigns/${editingStaychatCampaignId}`
          : "/api/staychatCampaigns",
        {
          method: editingStaychatCampaignId ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(campaignForm),
        }
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Não foi possível guardar a campanha Staychat.");
      }

      setStaychatCampaigns((current) =>
        editingStaychatCampaignId
          ? current.map((campaign) =>
              campaign.staychat_campaign_id === editingStaychatCampaignId
                ? data
                : campaign
            )
          : [...current, data]
      );
      resetCampaignForm();
      setMessageType("success");
      setMessage("Campanha Staychat guardada com sucesso.");
    } catch (error) {
      setMessageType("error");
      setMessage(
        error.message || "Não foi possível guardar a campanha Staychat."
      );
    } finally {
      setSavingStaychatCampaigns(false);
    }
  }

  async function deleteStaychatCampaign(id) {
    if (!window.confirm("Eliminar esta campanha Staychat?")) return;

    try {
      const response = await fetch(`/api/staychatCampaigns/${id}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Não foi possível eliminar a campanha.");
      }

      setStaychatCampaigns((current) =>
        current.filter((campaign) => campaign.staychat_campaign_id !== id)
      );
      if (editingStaychatCampaignId === id) resetCampaignForm();
      setMessageType("success");
      setMessage("Campanha Staychat eliminada.");
    } catch (error) {
      setMessageType("error");
      setMessage(error.message || "Não foi possível eliminar a campanha.");
    }
  }

  function openMassUpdateModal() {
    setMassUpdateStep("campaigns");
    setSelectedMassCampaigns({});
    setMassUpdateItems([]);
    setSelectedMassItemIds([]);
    setMassUpdateError("");
    setShowMassUpdateModal(true);
  }

  function toggleMassCampaign(campaign) {
    setSelectedMassCampaigns((current) => {
      const next = { ...current };
      if (Object.prototype.hasOwnProperty.call(next, campaign)) {
        delete next[campaign];
      } else {
        next[campaign] = "";
      }
      return next;
    });
  }

  function toggleAllMassCampaigns() {
    setSelectedMassCampaigns((current) =>
      Object.keys(current).length === staychatCampaignFields.length
        ? {}
        : Object.fromEntries(
            staychatCampaignFields.map(([name]) => [name, ""])
          )
    );
  }

  function toggleCleanupCampaign(field) {
    setConfirmedMassCleanup(false);
    setSelectedCleanupCampaigns((current) =>
      current.includes(field)
        ? current.filter((value) => value !== field)
        : [...current, field]
    );
  }

  function toggleAllCleanupCampaigns() {
    setConfirmedMassCleanup(false);
    setSelectedCleanupCampaigns((current) =>
      current.length === staychatCampaignFields.length
        ? []
        : staychatCampaignFields.map(([field]) => field)
    );
  }

  function updateMassCampaignId(field, campaignId) {
    setSelectedMassCampaigns((current) => ({
      ...current,
      [field]: campaignId,
    }));
  }

  async function loadMassUpdateItems() {
    const selectedFields = Object.keys(selectedMassCampaigns);
    if (selectedFields.length === 0) {
      setMassUpdateError("Selecione pelo menos uma campanha.");
      return;
    }
    if (selectedFields.some((field) => !selectedMassCampaigns[field])) {
      setMassUpdateError("Selecione a campanha a associar a cada estado ativo.");
      return;
    }

    setLoadingMassUpdateItems(true);
    setMassUpdateError("");

    try {
      const response = await fetch("/api/staychatCampaigns/mass-update");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Não foi possível carregar os itens Staychat.");
      }

      setMassUpdateItems(Array.isArray(data) ? data : []);
      setSelectedMassItemIds([]);
      setMassUpdateStep("items");
    } catch (error) {
      setMassUpdateError(
        error.message || "Não foi possível carregar os itens Staychat."
      );
    } finally {
      setLoadingMassUpdateItems(false);
    }
  }

  function toggleMassItems(itemIds) {
    setSelectedMassItemIds((current) => {
      const selectedIds = new Set(current);
      const shouldDeselect = itemIds.every((id) => selectedIds.has(id));

      itemIds.forEach((id) => {
        if (shouldDeselect) selectedIds.delete(id);
        else selectedIds.add(id);
      });

      return [...selectedIds];
    });
  }

  function toggleMassItem(itemId) {
    setSelectedMassItemIds((current) =>
      current.includes(itemId)
        ? current.filter((id) => id !== itemId)
        : [...current, itemId]
    );
  }

  async function applyMassUpdate() {
    if (selectedMassItemIds.length === 0) {
      setMassUpdateError("Selecione pelo menos um item.");
      return;
    }

    const selectedItemTypes = new Set(
      massUpdateItems
        .filter((item) => selectedMassItemIds.includes(item.outlet_item_id))
        .map((item) => item.item_type)
    );
    const hasMatchingCampaign = [...selectedItemTypes].some((itemType) =>
      (staychatCampaignsByItemType[itemType] || []).some((field) =>
        Object.prototype.hasOwnProperty.call(selectedMassCampaigns, field)
      )
    );
    if (!hasMatchingCampaign) {
      setMassUpdateError(
        "As campanhas selecionadas não correspondem ao tipo dos itens selecionados."
      );
      return;
    }

    setSavingMassUpdate(true);
    setMassUpdateError("");

    try {
      const response = await fetch("/api/staychatCampaigns/mass-update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          campaignAssignments: Object.fromEntries(
            Object.entries(selectedMassCampaigns).map(([field, campaignId]) => [
              field,
              Number(campaignId),
            ])
          ),
          outletItemIds: selectedMassItemIds,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Não foi possível atualizar as campanhas.");
      }

      setShowMassUpdateModal(false);
      const selectedIds = new Set(selectedMassItemIds);
      setAssociationItems((current) =>
        current.map((item) => {
          if (!selectedIds.has(item.outlet_item_id)) return item;

          const applicableAssignments = Object.entries(selectedMassCampaigns).filter(
            ([field]) => staychatCampaignsByItemType[item.item_type]?.includes(field)
          );
          const campaigns = {
            ...item.campaigns,
            ...Object.fromEntries(
              applicableAssignments.map(([field]) => [field, true])
            ),
          };
          const campaignIds = {
            ...item.campaignIds,
            ...Object.fromEntries(
              applicableAssignments.map(([field, campaignId]) => [
                field,
                Number(campaignId),
              ])
            ),
          };

          return {
            ...item,
            campaigns,
            campaignIds,
            activeCampaigns: staychatCampaignFields
              .map(([field]) => field)
              .filter((field) => campaigns[field]),
          };
        })
      );
      setMessageType("success");
      setMessage(
        `Campanhas atualizadas em ${data.updatedCount} ${data.updatedCount === 1 ? "item" : "itens"}.`
      );
    } catch (error) {
      setMassUpdateError(
        error.message || "Não foi possível atualizar as campanhas."
      );
    } finally {
      setSavingMassUpdate(false);
    }
  }

  async function openMassCleanupModal() {
    setShowMassCleanupModal(true);
    setMassCleanupItems([]);
    setSelectedCleanupCampaigns(staychatCampaignFields.map(([field]) => field));
    setConfirmedMassCleanup(false);
    setMassCleanupError("");
    setLoadingMassCleanupItems(true);

    try {
      const response = await fetch("/api/staychatCampaigns/mass-cleanup");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Não foi possível carregar os itens com campanhas ativas."
        );
      }

      setMassCleanupItems(Array.isArray(data) ? data : []);
    } catch (error) {
      setMassCleanupError(
        error.message || "Não foi possível carregar os itens com campanhas ativas."
      );
    } finally {
      setLoadingMassCleanupItems(false);
    }
  }

  async function executeMassCleanup() {
    if (
      !confirmedMassCleanup ||
      massCleanupItems.length === 0 ||
      selectedCleanupCampaigns.length === 0
    ) return;

    setSavingMassCleanup(true);
    setMassCleanupError("");

    try {
      const response = await fetch("/api/staychatCampaigns/mass-cleanup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          outletItemIds: massCleanupItems.map((item) => item.outlet_item_id),
          campaignFields: selectedCleanupCampaigns,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Não foi possível limpar as campanhas.");
      }

      setShowMassCleanupModal(false);
      const cleanedIds = new Set(
        affectedCleanupItems.map((item) => item.outlet_item_id)
      );
      setAssociationItems((current) =>
        current.map((item) =>
          cleanedIds.has(item.outlet_item_id)
            ? {
                ...item,
                campaigns: {
                  ...item.campaigns,
                  ...Object.fromEntries(
                    selectedCleanupCampaigns.map((field) => [field, false])
                  ),
                },
                campaignIds: {
                  ...item.campaignIds,
                  ...Object.fromEntries(
                    selectedCleanupCampaigns.map((field) => [field, null])
                  ),
                },
                activeCampaigns: staychatCampaignFields
                  .map(([field]) => field)
                  .filter(
                    (field) =>
                      item.campaigns[field] &&
                      !selectedCleanupCampaigns.includes(field)
                  ),
              }
            : item
        )
      );
      setMessageType("success");
      setMessage(
        `Campanhas limpas em ${data.cleanedCount} ${
          data.cleanedCount === 1 ? "item" : "itens"
        }. O envio Staychat foi mantido.`
      );
    } catch (error) {
      setMassCleanupError(
        error.message || "Não foi possível limpar as campanhas."
      );
    } finally {
      setSavingMassCleanup(false);
    }
  }

  async function openAssociationModal() {
    setShowAssociationModal(true);
    setAssociationItems([]);
    setAssociationItemsError("");
    setLoadingAssociationItems(true);

    try {
      const response = await fetch("/api/staychatCampaigns/mass-update");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Não foi possível carregar os itens Staychat.");
      }

      setAssociationItems(Array.isArray(data) ? data : []);
    } catch (error) {
      setAssociationItemsError(
        error.message || "Não foi possível carregar os itens Staychat."
      );
    } finally {
      setLoadingAssociationItems(false);
    }
  }

  function openItemCampaignEditor(item) {
    const itemFields = staychatCampaignsByItemType[item.item_type] || [];
    setEditingCampaignItem(item);
    setEditingItemCampaigns(
      Object.fromEntries(
        itemFields.map((field) => [field, item.campaigns?.[field] === true])
      )
    );
    setEditingItemCampaignIds(
      Object.fromEntries(
        itemFields.map((field) => [
          field,
          item.campaignIds?.[field] == null
            ? ""
            : String(item.campaignIds[field]),
        ])
      )
    );
    setItemCampaignError("");
  }

  function updateEditingItemCampaign(event) {
    const { name, checked } = event.target;
    setEditingItemCampaigns((current) => ({ ...current, [name]: checked }));
    if (!checked) {
      setEditingItemCampaignIds((current) => ({ ...current, [name]: "" }));
    }
  }

  function updateEditingItemCampaignId(event) {
    const { name, value } = event.target;
    setEditingItemCampaignIds((current) => ({ ...current, [name]: value }));
  }

  async function saveItemCampaigns() {
    if (!editingCampaignItem) return;

    const missingCampaign = Object.entries(editingItemCampaigns).find(
      ([field, active]) => active && !editingItemCampaignIds[field]
    );
    if (missingCampaign) {
      const label =
        staychatCampaignFields.find(([field]) => field === missingCampaign[0])?.[1] ||
        missingCampaign[0];
      setItemCampaignError(`Selecione uma campanha para "${label}".`);
      return;
    }

    setSavingItemCampaigns(true);
    setItemCampaignError("");

    try {
      const response = await fetch(
        `/api/staychatCampaigns/items/${editingCampaignItem.outlet_item_id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            campaigns: editingItemCampaigns,
            campaignIds: Object.fromEntries(
              Object.entries(editingItemCampaigns).map(([field, active]) => [
                field,
                active ? Number(editingItemCampaignIds[field]) : null,
              ])
            ),
          }),
        }
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Não foi possível guardar as campanhas do item.");
      }

      setAssociationItems((current) =>
        current.map((item) =>
          item.outlet_item_id === editingCampaignItem.outlet_item_id
            ? {
                ...item,
                campaigns: data.campaigns,
                campaignIds: data.campaignIds,
                activeCampaigns: staychatCampaignFields
                  .map(([field]) => field)
                  .filter((field) => data.campaigns[field]),
              }
            : item
        )
      );
      setEditingCampaignItem(null);
      setMessageType("success");
      setMessage("Campanhas do item guardadas com sucesso.");
    } catch (error) {
      setItemCampaignError(
        error.message || "Não foi possível guardar as campanhas do item."
      );
    } finally {
      setSavingItemCampaigns(false);
    }
  }

  function editTemplate(template) {
    setEditingId(template.email_template_id);

    setTemplateForm({
      ...emptyTemplate,
      ...Object.fromEntries(
        Object.entries(template).filter(([key]) =>
          key.startsWith("email_")
        )
      ),
    });

    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: "smooth",
    });
  }

  async function deleteTemplate(id) {
    if (!window.confirm("Eliminar este modelo de email?")) return;

    const response = await fetch(`/api/emailTemplates/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      setMessageType("error");
      setMessage("Não foi possível eliminar o modelo.");
      return;
    }

    setTemplates((current) =>
      current.filter(
        (template) => template.email_template_id !== id
      )
    );

    if (editingId === id) {
      resetTemplateForm();
    }

    setMessageType("success");
    setMessage("Modelo de email eliminado.");
  }

  function resetTemplateForm() {
    setEditingId(null);
    setTemplateForm(emptyTemplate);
    setActiveLanguage(1);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-sm text-gray-500">
          A carregar...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="-mx-6 -mt-6">
        <Topbar title="Configurações avançadas" />
      </div>

      <main className="mx-auto flex max-w-5xl flex-col gap-6 p-6">
        {message && (
          <div
            className={`rounded-xl border px-4 py-3 text-sm  mb-4 ${
              messageType === "success"
                ? "border-green-200 bg-green-50 text-green-700"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {message}
          </div>
        )}

        <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <SectionTitle
            title="Configuração de email"
            description="Defina o servidor utilizado para enviar mensagens da aplicação."
          />

          <form
            onSubmit={saveSettings}
            className="mt-5 grid gap-4 md:grid-cols-2"
          >
            <Field
              label="Email de resposta"
              name="reply_email"
              type="email"
              value={settings.reply_email}
              onChange={updateSettings}
              required
            />

            <Field
              label="Palavra-passe"
              name="reply_password"
              type="password"
              value={settings.reply_password}
              onChange={updateSettings}
              placeholder="Deixe vazio para manter a password atual"
              autoComplete="new-password"
            />
            <Field
              label="Servidor de envio"
              name="sending_server"
              value={settings.sending_server}
              onChange={updateSettings}
              required
            />

            <Field
              label="Porta de envio"
              name="sending_port"
              type="number"
              value={settings.sending_port}
              onChange={updateSettings}
              min="1"
              max="65535"
              required
            />

            <div className="md:col-span-2 flex justify-end pt-2">
              <button
                type="submit"
                disabled={savingSettings}
                className="
                  inline-flex items-center justify-center
                  rounded-xl
                  bg-gradient-to-r from-red-600 to-red-500
                  px-6 py-3
                  text-sm font-semibold text-white
                  shadow-md shadow-red-200
                  transition-all duration-200
                  hover:-translate-y-0.5
                  hover:from-red-700
                  hover:to-red-600
                  hover:shadow-lg hover:shadow-red-200
                  focus:outline-none
                  focus:ring-4 focus:ring-red-100
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                  disabled:hover:translate-y-0
                "
              >
                {savingSettings ? (
                  <>
                    A guardar...
                  </>
                ) : (
                  <>
                    <svg
                      className="mr-2 h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
                      <path d="M17 21v-8H7v8" />
                      <path d="M7 3v5h8" />
                    </svg>
                    Guardar configuração
                  </>
                )}
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm mt-3">
          <SectionTitle
            title="Configuração dos chatbots"
            description="Escolha o provider e preencha as respetivas credenciais de integração."
          />

          <form
            onSubmit={saveChatbotSettings}
            className="mt-5 grid gap-4 md:grid-cols-2"
          >
            <SelectField
              label="Provider"
              name="provider"
              value={chatbotSettings.provider}
              onChange={updateChatbotSettings}
              options={["Hijiffy", "Staychat"]}
            />

            <CheckboxField
              label="Configuração ativa"
              name="active"
              checked={chatbotSettings.active}
              onChange={updateChatbotSettings}
            />

            {chatbotSettings.provider === "Hijiffy" ? (
              <>
                <Field
                  label="Hijiffy token"
                  name="hijiffyToken"
                  value={chatbotSettings.hijiffyToken}
                  onChange={updateChatbotSettings}
                  required
                />
                <Field
                  label="Hijiffy campaign"
                  name="hijiffyCampaign"
                  value={chatbotSettings.hijiffyCampaign}
                  onChange={updateChatbotSettings}
                  required
                />
              </>
            ) : (
              <>
                <Field
                  label="Staychat token"
                  name="staychatToken"
                  value={chatbotSettings.staychatToken}
                  onChange={updateChatbotSettings}
                  required
                />
                <Field
                  label="Staychat phone ID"
                  name="staychatPhoneID"
                  value={chatbotSettings.staychatPhoneID}
                  onChange={updateChatbotSettings}
                  required
                />
                <Field
                  label="Staychat Webhook"
                  name="staychatWebhook"
                  value={chatbotSettings.staychatWebhook}
                  onChange={updateChatbotSettings}
                  maxLength={150}
                  placeholder="URL do webhook"
                />
              </>
            )}

            <div className="md:col-span-2 flex justify-end pt-2">
              <button
                type="submit"
                disabled={savingChatbotSettings}
                className="flex rounded-xl bg-gradient-to-r from-red-600 to-red-500 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-red-200 transition hover:-translate-y-0.5 hover:from-red-700 hover:to-red-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <svg
                      className="mr-2 h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
                      <path d="M17 21v-8H7v8" />
                      <path d="M7 3v5h8" />
                    </svg>
                {savingChatbotSettings ? "A guardar..." : "Guardar configuração"}
              </button>
            </div>
          </form>
        </section>

        {chatbotSettings.provider === "Staychat" && (
          <section className="mt-3 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <SectionTitle
                title="Campanhas Staychat"
                description="Adicione e gira as campanhas Staychat disponíveis."
              />
              <button
                type="button"
                onClick={openAssociationModal}
                className="shrink-0 rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
              >
                Associar campanhas
              </button>
            </div>

            <form onSubmit={saveStaychatCampaign} className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field
                label="Nome"
                name="campaign_name"
                value={campaignForm.campaign_name}
                onChange={updateCampaignForm}
                maxLength={200}
                required
              />
              <Field
                label="Campaign ID"
                name="campaign_id"
                value={campaignForm.campaign_id}
                onChange={updateCampaignForm}
                maxLength={200}
                required
              />
              <div className="flex flex-wrap justify-end gap-3 sm:col-span-2">
                {editingStaychatCampaignId && (
                  <button
                    type="button"
                    onClick={resetCampaignForm}
                    disabled={savingStaychatCampaigns}
                    className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
                  >
                    Cancelar edição
                  </button>
                )}
                <button
                  type="submit"
                  disabled={savingStaychatCampaigns}
                  className="flex rounded-xl bg-gradient-to-r from-red-600 to-red-500 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-red-200 transition hover:-translate-y-0.5 hover:from-red-700 hover:to-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingStaychatCampaigns
                    ? "A guardar..."
                    : editingStaychatCampaignId
                      ? "Guardar alterações"
                      : "Adicionar campanha"}
                </button>
              </div>
            </form>

            <div className="mt-6 overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Nome</th>
                    <th className="px-4 py-3 font-semibold">Campaign ID</th>
                    <th className="px-4 py-3 text-right font-semibold">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {staychatCampaigns.map((campaign) => (
                    <tr key={campaign.staychat_campaign_id}>
                      <td className="px-4 py-3 text-gray-800">
                        {campaign.campaign_name}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {campaign.campaign_id}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-3">
                          <button
                            type="button"
                            onClick={() => editStaychatCampaign(campaign)}
                            className="font-medium text-red-600 hover:text-red-700"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              deleteStaychatCampaign(campaign.staychat_campaign_id)
                            }
                            className="font-medium text-gray-500 hover:text-red-600"
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {staychatCampaigns.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                        Ainda não existem campanhas. Adicione a primeira acima.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {showAssociationModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            role="presentation"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                setShowAssociationModal(false);
                setEditingCampaignItem(null);
              }
            }}
          >
            <section
              className="flex max-h-[90vh] w-full max-w-5xl flex-col rounded-2xl bg-white p-6 shadow-2xl"
              role="dialog"
              aria-modal="true"
              aria-labelledby="association-title"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2
                    id="association-title"
                    className="text-lg font-semibold text-gray-900"
                  >
                    Associar campanhas Staychat
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Edite as campanhas por item. Só são apresentados itens com
                    envio Staychat ativo e tipo elegível.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAssociationModal(false)}
                  aria-label="Fechar"
                  className="rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                >
                  <FiX aria-hidden="true" className="h-5 w-5" />
                </button>
              </div>

              {associationItemsError && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {associationItemsError}
                </div>
              )}

              <div className="mt-5 min-h-0 flex-1 overflow-y-auto">
                {loadingAssociationItems ? (
                  <p className="py-10 text-center text-sm text-gray-500">
                    A carregar itens...
                  </p>
                ) : associationItems.length === 0 ? (
                  <p className="rounded-xl bg-gray-50 px-4 py-10 text-center text-sm text-gray-500">
                    Não existem itens elegíveis com envio Staychat ativo.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {groupItemsByOutlet(associationItems).map((group) => (
                      <section
                        key={group.key}
                        className="overflow-hidden rounded-xl border border-gray-200"
                      >
                        <h3 className="bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-800">
                          {group.title}
                        </h3>
                        <div className="divide-y divide-gray-100">
                          {group.items.map((item) => (
                            <div
                              key={item.outlet_item_id}
                              className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                            >
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-gray-900">
                                  {item.item_name || "Item sem nome"}
                                </p>
                                <p className="mt-0.5 text-xs text-gray-500">
                                  {item.item_type}
                                  {item.activeCampaigns.length
                                    ? ` · ${item.activeCampaigns.length} campanha(s) ativa(s)`
                                    : " · sem campanhas ativas"}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => openItemCampaignEditor(item)}
                                className="shrink-0 rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                              >
                                Editar campanhas
                              </button>
                            </div>
                          ))}
                        </div>
                      </section>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={openMassUpdateModal}
                    disabled={loadingAssociationItems}
                    className="rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                  >
                    Atualização massiva
                  </button>
                  <button
                    type="button"
                    onClick={openMassCleanupModal}
                    className="rounded-xl bg-red-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-800"
                  >
                    Limpeza massiva
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAssociationModal(false)}
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                  Cancelar
                </button>
              </div>
            </section>
          </div>
        )}

        {showMassUpdateModal && (
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
            role="presentation"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget && !savingMassUpdate) {
                setShowMassUpdateModal(false);
              }
            }}
          >
            <section
              className="flex max-h-[90vh] w-full max-w-4xl flex-col rounded-2xl bg-white p-6 shadow-2xl"
              role="dialog"
              aria-modal="true"
              aria-labelledby="mass-update-title"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2
                    id="mass-update-title"
                    className="text-lg font-semibold text-gray-900"
                  >
                    Atualização massiva de campanhas
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    {massUpdateStep === "campaigns"
                      ? "Selecione os estados a ativar e a campanha a associar a cada estado."
                      : "Selecione os itens Staychat a atualizar."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowMassUpdateModal(false)}
                  disabled={savingMassUpdate}
                  aria-label="Fechar"
                  className="rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
                >
                  <FiX aria-hidden="true" className="h-5 w-5" />
                </button>
              </div>

              {massUpdateError && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {massUpdateError}
                </div>
              )}

              {massUpdateStep === "campaigns" ? (
                <div className="mt-5 min-h-0 overflow-y-auto">
                  <div className="mb-3 flex justify-end">
                    <button
                      type="button"
                      onClick={toggleAllMassCampaigns}
                      className="text-sm font-medium text-red-600 hover:text-red-700"
                    >
                      {Object.keys(selectedMassCampaigns).length === staychatCampaignFields.length
                        ? "Limpar seleção"
                        : "Selecionar todas"}
                    </button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {staychatCampaignSections.map(
                      ([sectionTitle, itemType, fields]) => (
                      <fieldset
                        key={sectionTitle}
                        className="rounded-xl border border-gray-200 p-4"
                      >
                        <legend className="px-1 text-sm font-semibold text-gray-800">
                          {sectionTitle}{" "}
                          <span className="font-normal text-gray-500">
                            (tipo {itemType})
                          </span>
                        </legend>
                        <div className="grid gap-3">
                          {fields.map(([name, label]) => (
                            <div
                              key={name}
                              className="grid gap-2 rounded-lg border border-gray-100 p-3"
                            >
                              <label className="flex cursor-pointer items-center gap-3 text-sm text-gray-700">
                                <input
                                  type="checkbox"
                                  checked={Object.prototype.hasOwnProperty.call(
                                    selectedMassCampaigns,
                                    name
                                  )}
                                  onChange={() => toggleMassCampaign(name)}
                                  className="h-4 w-4 accent-red-600"
                                />
                                {label}
                              </label>
                              {Object.prototype.hasOwnProperty.call(
                                selectedMassCampaigns,
                                name
                              ) && (
                                <CampaignSelect
                                  campaigns={staychatCampaigns}
                                  name={name}
                                  value={selectedMassCampaigns[name]}
                                  onChange={(event) =>
                                    updateMassCampaignId(name, event.target.value)
                                  }
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      </fieldset>
                      )
                    )}
                  </div>
                </div>
              ) : (
                <div className="mt-5 min-h-0 overflow-y-auto">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-sm text-gray-500">
                      {massUpdateItems.length}{" "}
                      {massUpdateItems.length === 1 ? "item encontrado" : "itens encontrados"}
                    </p>
                    {massUpdateItems.length > 0 && (
                      <button
                        type="button"
                        onClick={() =>
                          toggleMassItems(
                            massUpdateItems.map((item) => item.outlet_item_id)
                          )
                        }
                        className="text-sm font-medium text-red-600 hover:text-red-700"
                      >
                        {massUpdateItems.every((item) =>
                          selectedMassItemIds.includes(item.outlet_item_id)
                        )
                          ? "Limpar seleção"
                          : "Selecionar todos"}
                      </button>
                    )}
                  </div>
                  {massUpdateItems.length === 0 ? (
                    <p className="rounded-xl bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
                      Não existem itens com envio Staychat ativo.
                    </p>
                  ) : (
                    <div className="overflow-hidden rounded-xl border border-gray-200">
                      <div className="grid grid-cols-[auto_1.2fr_1fr_1.4fr] gap-3 bg-gray-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500 max-sm:grid-cols-[auto_1fr] max-sm:gap-x-3">
                        <span />
                        <span>Item</span>
                        <span className="max-sm:col-start-2">Outlet</span>
                        <span className="max-sm:col-start-2">Menu / Submenu</span>
                      </div>
                      <div className="max-h-[50vh] overflow-y-auto">
                        {staychatCampaignSections.map(
                          ([sectionTitle, itemType]) => {
                            const typedItems = massUpdateItems.filter(
                              (item) => item.item_type === itemType
                            );
                            if (typedItems.length === 0) return null;

                            const typedItemIds = typedItems.map(
                              (item) => item.outlet_item_id
                            );
                            const allTypedItemsSelected = typedItemIds.every(
                              (id) => selectedMassItemIds.includes(id)
                            );

                            return (
                              <div
                                key={itemType}
                                className="border-b border-gray-100 last:border-b-0"
                              >
                                <div className="flex items-center justify-between gap-3 bg-white px-4 py-2">
                                  <h3 className="text-sm font-semibold text-gray-800">
                                    {sectionTitle}{" "}
                                    <span className="font-normal text-gray-500">
                                      ({itemType})
                                    </span>
                                  </h3>
                                  <button
                                    type="button"
                                    onClick={() => toggleMassItems(typedItemIds)}
                                    className="text-xs font-medium text-red-600 hover:text-red-700"
                                  >
                                    {allTypedItemsSelected
                                      ? "Limpar"
                                      : "Selecionar todos"}
                                  </button>
                                </div>
                                {typedItems.map((item) => (
                                  <label
                                    key={item.outlet_item_id}
                                    className="grid cursor-pointer grid-cols-[auto_1.2fr_1fr_1.4fr] items-center gap-3 border-t border-gray-100 px-4 py-3 text-sm hover:bg-gray-50 max-sm:grid-cols-[auto_1fr] max-sm:gap-x-3"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={selectedMassItemIds.includes(
                                        item.outlet_item_id
                                      )}
                                      onChange={() =>
                                        toggleMassItem(item.outlet_item_id)
                                      }
                                      className="h-4 w-4 accent-red-600"
                                    />
                                    <span className="font-medium text-gray-900">
                                      {item.item_name || "Item sem nome"}
                                    </span>
                                    <span className="text-gray-600 max-sm:col-start-2">
                                      {item.outlet_name || "Outlet sem nome"}
                                    </span>
                                    <span className="text-gray-500 max-sm:col-start-2">
                                      {item.locations.length
                                        ? item.locations
                                            .map((location) =>
                                              [location.menu, location.submenu]
                                                .filter(Boolean)
                                                .join(" / ")
                                            )
                                            .join(", ")
                                        : "Sem menu ou submenu"}
                                    </span>
                                  </label>
                                ))}
                              </div>
                            );
                          }
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-5 flex justify-end gap-3 border-t border-gray-100 pt-4">
                {massUpdateStep === "items" && (
                  <button
                    type="button"
                    onClick={() => {
                      setMassUpdateStep("campaigns");
                      setMassUpdateError("");
                    }}
                    disabled={savingMassUpdate}
                    className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Voltar
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowMassUpdateModal(false)}
                  disabled={savingMassUpdate || loadingMassUpdateItems}
                  className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancelar
                </button>
                {massUpdateStep === "campaigns" ? (
                  <button
                    type="button"
                    onClick={loadMassUpdateItems}
                    disabled={loadingMassUpdateItems}
                    className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loadingMassUpdateItems ? "A carregar..." : "Continuar"}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={applyMassUpdate}
                    disabled={savingMassUpdate || selectedMassItemIds.length === 0}
                    className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {savingMassUpdate ? "A atualizar..." : "Atualizar campanhas"}
                  </button>
                )}
              </div>
            </section>
          </div>
        )}

        {showMassCleanupModal && (
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4"
            role="presentation"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget && !savingMassCleanup) {
                setShowMassCleanupModal(false);
              }
            }}
          >
            <section
              className="flex max-h-[90vh] w-full max-w-4xl flex-col rounded-2xl bg-white p-6 shadow-2xl"
              role="dialog"
              aria-modal="true"
              aria-labelledby="mass-cleanup-title"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2
                    id="mass-cleanup-title"
                    className="text-lg font-semibold text-gray-900"
                  >
                    Limpeza massiva de campanhas Staychat
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Itens com pelo menos uma campanha atualmente ativa.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowMassCleanupModal(false)}
                  disabled={savingMassCleanup}
                  aria-label="Fechar"
                  className="rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
                >
                  <FiX aria-hidden="true" className="h-5 w-5" />
                </button>
              </div>

              <div
                className="mt-4 rounded-xl border-2 border-red-300 bg-red-50 p-4 text-sm text-red-900"
                role="alert"
              >
                <p className="font-bold">
                  ATENÇÃO — ESTA AÇÃO É IRREVERSÍVEL
                </p>
                <p className="mt-1">
                  Serão desativados os estados selecionados nos itens abaixo e
                  removidas as respetivas associações.{" "}
                  <strong>Esta operação não pode ser desfeita.</strong> O campo{" "}
                  <strong>sendStaychat</strong> será mantido.
                </p>
              </div>

              <div className="mt-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-gray-800">
                    Estados a desativar
                  </p>
                  <button
                    type="button"
                    onClick={toggleAllCleanupCampaigns}
                    className="text-sm font-medium text-red-600 hover:text-red-700"
                  >
                    {selectedCleanupCampaigns.length === staychatCampaignFields.length
                      ? "Limpar seleção"
                      : "Selecionar todos"}
                  </button>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  {staychatCampaignSections.map(
                    ([sectionTitle, , fields]) => (
                      <fieldset
                        key={sectionTitle}
                        className="rounded-xl border border-gray-200 p-3"
                      >
                        <legend className="px-1 text-sm font-semibold text-gray-800">
                          {sectionTitle}
                        </legend>
                        <div className="grid gap-2">
                          {fields.map(([field, label]) => (
                            <label
                              key={field}
                              className="flex cursor-pointer items-center gap-2 text-sm text-gray-700"
                            >
                              <input
                                type="checkbox"
                                checked={selectedCleanupCampaigns.includes(field)}
                                onChange={() => toggleCleanupCampaign(field)}
                                className="h-4 w-4 accent-red-700"
                              />
                              {label}
                            </label>
                          ))}
                        </div>
                      </fieldset>
                    )
                  )}
                </div>
              </div>

              {massCleanupError && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {massCleanupError}
                </div>
              )}

              <div className="mt-4 min-h-0 overflow-y-auto">
                {loadingMassCleanupItems ? (
                  <p className="py-8 text-center text-sm text-gray-500">
                    A carregar itens afetados...
                  </p>
                ) : massCleanupItems.length === 0 ? (
                  <p className="rounded-xl bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
                    Não existem itens com campanhas ativas para limpar.
                  </p>
                ) : affectedCleanupItems.length === 0 ? (
                  <p className="rounded-xl bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
                    Nenhum item tem os estados selecionados ativos.
                  </p>
                ) : (
                  <>
                    <p className="mb-2 text-sm font-medium text-gray-700">
                      {affectedCleanupItems.length}{" "}
                      {affectedCleanupItems.length === 1
                        ? "item será afetado"
                        : "itens serão afetados"}:
                    </p>
                    <div className="max-h-[40vh] overflow-y-auto rounded-xl border border-gray-200">
                      {affectedCleanupItems.map((item) => (
                        <div
                          key={item.outlet_item_id}
                          className="border-b border-gray-100 px-4 py-3 last:border-b-0"
                        >
                          <div className="grid gap-1 text-sm sm:grid-cols-[1.2fr_1fr_1fr] sm:gap-3">
                            <span className="font-semibold text-gray-900">
                              {item.item_name || "Item sem nome"}
                            </span>
                            <span className="text-gray-600">
                              {item.outlet_name || "Outlet sem nome"}
                            </span>
                            <span className="text-gray-600">
                              {item.item_type || "Tipo não definido"}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-gray-500">
                            Campanhas ativas:{" "}
                            {item.activeCampaigns
                              .filter((field) =>
                                selectedCleanupCampaigns.includes(field)
                              )
                              .map(
                                (field) => {
                                  const label = staychatCampaignFields.find(
                                    ([name]) => name === field
                                  )?.[1] || field;
                                  const linkedCampaign = staychatCampaigns.find(
                                    (campaign) =>
                                      campaign.staychat_campaign_id ===
                                      item.campaignIds[field]
                                  );
                                  return `${label}: ${
                                    linkedCampaign?.campaign_name ||
                                    linkedCampaign?.campaign_id ||
                                    "sem campanha associada"
                                  }`;
                                }
                              )
                              .join(", ")}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            {item.locations.length
                              ? item.locations
                                  .map((location) =>
                                    [location.menu, location.submenu]
                                      .filter(Boolean)
                                      .join(" / ")
                                  )
                                  .join(", ")
                              : "Sem menu ou submenu"}
                          </p>
                        </div>
                      ))}
                    </div>
                    <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-lg border border-red-200 p-3 text-sm text-gray-800">
                      <input
                        type="checkbox"
                        checked={confirmedMassCleanup}
                        onChange={(event) =>
                          setConfirmedMassCleanup(event.target.checked)
                        }
                        className="mt-0.5 h-4 w-4 accent-red-700"
                      />
                      <span>
                        Compreendo que os estados selecionados serão
                        desativados e as associações removidas de todos os itens
                        listados; esta operação não é reversível.
                      </span>
                    </label>
                  </>
                )}
              </div>

              <div className="mt-5 flex justify-end gap-3 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={() => setShowMassCleanupModal(false)}
                  disabled={savingMassCleanup}
                  className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={executeMassCleanup}
                  disabled={
                    loadingMassCleanupItems ||
                    savingMassCleanup ||
                    !confirmedMassCleanup ||
                    affectedCleanupItems.length === 0 ||
                    selectedCleanupCampaigns.length === 0
                  }
                  className="rounded-xl bg-red-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {savingMassCleanup
                    ? "A limpar..."
                    : "Limpar estados selecionados"}
                </button>
              </div>
            </section>
          </div>
        )}

        {editingCampaignItem && (
          <div
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4"
            role="presentation"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget && !savingItemCampaigns) {
                setEditingCampaignItem(null);
                setItemCampaignError("");
              }
            }}
          >
            <section
              className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
              role="dialog"
              aria-modal="true"
              aria-labelledby="item-campaign-title"
            >
              <h2
                id="item-campaign-title"
                className="text-lg font-semibold text-gray-900"
              >
                Campanhas do item
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                {editingCampaignItem.item_name || "Item sem nome"} ·{" "}
                {editingCampaignItem.item_type}
              </p>

              {itemCampaignError && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {itemCampaignError}
                </div>
              )}

              <div className="mt-5 grid gap-3">
                {(staychatCampaignsByItemType[
                  editingCampaignItem.item_type
                ] || []).map((field) => (
                  <div
                    key={field}
                    className="grid gap-3 rounded-lg border border-gray-200 px-3 py-2.5"
                  >
                    <label className="flex cursor-pointer items-center gap-3 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        name={field}
                        checked={editingItemCampaigns[field] === true}
                        onChange={updateEditingItemCampaign}
                        disabled={savingItemCampaigns}
                        className="h-4 w-4 accent-red-600"
                      />
                      {staychatCampaignFields.find(
                        ([campaignField]) => campaignField === field
                      )?.[1] || field}
                    </label>
                    {editingItemCampaigns[field] && (
                      <CampaignSelect
                        campaigns={staychatCampaigns}
                        name={field}
                        value={editingItemCampaignIds[field]}
                        onChange={updateEditingItemCampaignId}
                        disabled={savingItemCampaigns}
                      />
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setEditingCampaignItem(null);
                    setItemCampaignError("");
                  }}
                  disabled={savingItemCampaigns}
                  className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={saveItemCampaigns}
                  disabled={savingItemCampaigns}
                  className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingItemCampaigns ? "A guardar..." : "Guardar campanhas"}
                </button>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

function SectionTitle({ title, description }) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900">
        {title}
      </h2>

      <p className="mt-1 text-sm text-gray-500">
        {description}
      </p>
    </div>
  );
}

function CampaignSelect({ campaigns, name, value, onChange, disabled = false }) {
  return (
    <label className="flex flex-col gap-1.5 text-xs font-medium text-gray-600">
      Campanha Staychat associada
      <select
        name={name}
        value={value || ""}
        onChange={onChange}
        disabled={disabled}
        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-normal text-gray-900 outline-none focus:border-red-400 focus:ring-4 focus:ring-red-50 disabled:cursor-not-allowed disabled:bg-gray-100"
      >
        <option value="">Selecione uma campanha</option>
        {campaigns.map((campaign) => (
          <option
            key={campaign.staychat_campaign_id}
            value={campaign.staychat_campaign_id}
          >
            {campaign.campaign_name} ({campaign.campaign_id})
          </option>
        ))}
      </select>
      {campaigns.length === 0 && (
        <span className="font-normal text-red-600">
          Não existem campanhas registadas. Adicione uma na configuração Staychat.
        </span>
      )}
    </label>
  );
}

function Field({
  label,
  name,
  value,
  onChange,
  type = "text",
  ...props
}) {
  return (
    <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
      {label}

      <input
        name={name}
        type={type}
        value={value || ""}
        onChange={onChange}
        className="
          rounded-xl
          border border-gray-300
          bg-white
          px-3 py-2.5
          font-normal text-gray-900
          outline-none
          transition
          placeholder:text-gray-400
          focus:border-red-400
          focus:ring-4 focus:ring-red-50
        "
        {...props}
      />
    </label>
  );
}

function SelectField({ label, name, value, onChange, options }) {
  return (
    <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
      {label}
      <select
        name={name}
        value={value}
        onChange={onChange}
        className="rounded-xl border border-gray-300 bg-white px-3 py-2.5 font-normal text-gray-900 outline-none transition focus:border-red-400 focus:ring-4 focus:ring-red-50"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function CheckboxField({ label, name, checked, onChange }) {
  return (
    <label className="flex items-center gap-3 self-end pb-2 text-sm font-medium text-gray-700">
      <input
        name={name}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 accent-red-600"
      />
      {label}
    </label>
  );
}
