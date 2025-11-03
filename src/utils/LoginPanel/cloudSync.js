// src/utils/cloudSync.js
import axios from "axios";
import { getApiUrl } from "@/utils/apiEndpoints";
import StorageManager from "@/utils/StorageManager";

export const uploadSettings = async (slot, emit, toast, t) => {
  emit("update:uploadingSettings", true);
  try {
    const activityStatus = StorageManager.get("activityStatus") || {};
    const userGameSelections = StorageManager.get("userGameSelections");
    const gameOrder = StorageManager.get("gameOrder") || [];

    if (!activityStatus || !userGameSelections) {
      const error = new Error(t("app.settings.account.noLocalSettings"));
      error.code = "NO_LOCAL_SETTINGS";
      throw error;
    }

    if (![1, 2, 3].includes(slot)) {
      const error = new Error(t("app.settings.account.invalidSlot"));
      error.code = "INVALID_SLOT";
      throw error;
    }

    const response = await axios.post(
      getApiUrl("UPLOAD_SETTINGS"),
      {
        activityStatus,
        userGameSelections,
        gameOrder,
        slot
      },
      {
        headers: {
          Authorization: `Bearer ${StorageManager.get("auth_token")}`,
        },
      }
    );

    if (response.data.code === 200) {
      toast.showToast(
        t("app.settings.account.uploadSuccess", { slot }),
        "success"
      );
      return {
        updatedAt: response.data.data?.updated_at || new Date().toISOString()
      };
    } else {
      const error = new Error(response.data.message || t("app.settings.account.uploadFailed"));
      error.code = response.data.error_code;
      throw error;
    }
  } catch (error) {
    console.error("Upload settings error:", error);
    if (error.response?.data?.error_code) {
      error.code = error.response.data.error_code;
    }
    throw error;
  } finally {
    emit("update:uploadingSettings", false);
  }
};

export const downloadSettings = async (slot, emit, toast, t) => {
  emit("update:downloadingSettings", true);
  try {
    if (![1, 2, 3].includes(slot)) {
      const error = new Error(t("app.settings.account.invalidSlot"));
      error.code = "INVALID_SLOT";
      throw error;
    }

    const response = await axios.get(
      getApiUrl("DOWNLOAD_SETTINGS"),
      {
        params: { slot },
        headers: {
          Authorization: `Bearer ${StorageManager.get("auth_token")}`,
        },
      }
    );

    if (response.data.code === 200) {
      const { config, updated_at } = response.data.data;
      const { activityStatus, gameOrder, userGameSelections } = config;

      StorageManager.set("activityStatus", activityStatus);
      StorageManager.set("gameOrder", gameOrder);
      StorageManager.set("userGameSelections", userGameSelections);

      toast.showToast(
        t("app.settings.account.downloadSuccess", { slot }),
        "success"
      );

      return {
        config: { activityStatus, gameOrder, userGameSelections },
        updatedAt: updated_at
      };
    } else {
      const error = new Error(response.data.message || t("app.settings.account.downloadFailed"));
      error.code = response.data.error_code;
      throw error;
    }
  } catch (error) {
    console.error("Download settings error:", error);
    if (error.response?.data?.error_code) {
      error.code = error.response.data.error_code;
    }
    throw error;
  } finally {
    emit("update:downloadingSettings", false);
  }
};

export const clearCloudSettings = async (slot, emit, toast, t) => {
  emit("update:clearingCloud", true);
  try {
    if (![1, 2, 3].includes(slot)) {
      const error = new Error(t("app.settings.account.invalidSlot"));
      error.code = "INVALID_SLOT";
      throw error;
    }

    const response = await axios.post(
      getApiUrl("CLEAR_CLOUD_SETTINGS"),
      { slot },
      {
        headers: {
          Authorization: `Bearer ${StorageManager.get("auth_token")}`,
        },
      }
    );

    if (response.data.code === 200) {
      toast.showToast(
        t("app.settings.account.clearCloudSuccess", { slot }),
        "success"
      );
    } else {
      const error = new Error(response.data.message || t("app.settings.account.clearCloudFailed"));
      error.code = response.data.error_code;
      throw error;
    }
  } catch (error) {
    console.error("Clear cloud settings error:", error);
    if (error.response?.data?.error_code) {
      error.code = error.response.data.error_code;
    }
    throw error;
  } finally {
    emit("update:clearingCloud", false);
  }
};