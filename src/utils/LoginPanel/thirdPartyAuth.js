// src/utils/thirdPartyAuth.js
import axios from "axios";
import { getApiUrl } from "@/utils/apiEndpoints";
import StorageManager from "@/utils/StorageManager";

export const loginWithQQ = async (toast, t) => {
  try {
    const response = await axios.get(getApiUrl("QQ_LOGIN"));
    if (response.data.code === 200) {
      window.location.href = response.data.data.auth_url;
    } else {
      const error = new Error(response.data.message || t("app.settings.account.qqLoginFailed"));
      error.code = response.data.error_code;
      throw error;
    }
  } catch (error) {
    console.error("QQ login error:", error);
    if (error.response?.data?.error_code) {
      error.code = error.response.data.error_code;
    }
    throw error;
  }
};

export const handleQQCallback = async (code, state, emit, toast, t) => {
  try {
    const response = await axios.get(
      `${getApiUrl("QQ_CALLBACK")}&qq_code=${code}&qq_state=${state}&json=1`
    );

    if (response.data.code === 200) {
      StorageManager.set("auth_token", response.data.data.token);
      return true;
    } else {
      const error = new Error(
        response.data.message || t("app.settings.account.qqCallbackError")
      );
      error.code = response.data.error_code;
      throw error;
    }
  } catch (error) {
    console.error("QQ callback error:", error);
    if (error.response?.data?.error_code) {
      error.code = error.response.data.error_code;
    }
    throw error;
  }
};

export const loginWithMicrosoft = async (toast, t) => {
  try {
    const isDomestic = window.location.hostname === import.meta.env.VITE_DOMESTIC_DOMAIN;
    const url = `${getApiUrl("MICROSOFT_LOGIN")}&is_domestic=${isDomestic ? 1 : 0
      }`;

    const response = await axios.get(url);

    if (response.data.code === 200) {
      window.location.href = response.data.data.auth_url;
    } else {
      const error = new Error(response.data.message || t("app.settings.account.microsoftLoginFailed"));
      error.code = response.data.error_code;
      throw error;
    }
  } catch (error) {
    console.error("Microsoft login error:", error);
    if (error.response?.data?.error_code) {
      error.code = error.response.data.error_code;
    }
    throw error;
  }
};

export const handleMicrosoftCallback = async (code, state, emit, toast, t) => {
  try {
    const url = `${getApiUrl(
      "MICROSOFT_CALLBACK"
    )}&ms_code=${code}&ms_state=${state}&json=1`;

    const response = await axios.get(url);

    if (response.data.code === 200) {
      StorageManager.set("auth_token", response.data.data.token);
      return true;
    } else {
      const error = new Error(
        response.data.message ||
        t("app.settings.account.microsoftCallbackError")
      );
      error.code = response.data.error_code;
      throw error;
    }
  } catch (error) {
    console.error("Microsoft callback error:", error);
    if (error.response?.data?.error_code) {
      error.code = error.response.data.error_code;
    }
    throw error;
  }
};