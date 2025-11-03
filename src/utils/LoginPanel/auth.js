// src/utils/auth.js
import { useAuthStore, fetchUserProfile as fetchUserProfileFromStore, handleAuthError } from "@/store/auth";
import StorageManager from "@/utils/StorageManager";
import axios from "axios";
import { getApiUrl } from "@/utils/apiEndpoints";

export const fetchUserProfile = async (emit, toast, t) => {
  // 触发加载状态更新
  emit("update:profileLoading", true);
  try {
    // 使用store中的fetchUserProfile函数
    const result = await fetchUserProfileFromStore(toast, t);

    // 如果请求成功，获取store中的用户信息并通过emit通知父组件
    if (result) {
      const authStore = useAuthStore();
      emit("update:user", {
        id: authStore.user.id,
        username: authStore.user.username,
        nickname: authStore.user.nickname,
        avatar: authStore.user.avatar,
        settings_metadata: authStore.user.settings_metadata
      });
    }

    return result;
  } catch (error) {
    console.error("Fetch user profile error:", error);
    // 错误已经在store中处理，这里只需要重新抛出以保持原有行为
    throw error;
  } finally {
    // 触发加载状态更新
    emit("update:profileLoading", false);
  }
};

export const login = async (formData, turnstileToken, toast, t, emit) => {
  try {
    const response = await axios.post(getApiUrl("LOGIN"), {
      username: formData.username,
      password: formData.password,
      cf_token: turnstileToken,
    });

    if (response.data.code === 200) {
      const token = response.data.data.token;
      StorageManager.set("auth_token", token);
      await fetchUserProfile(emit, toast, t);

      toast.showToast(t("app.settings.account.loginSuccess"), "success");
      return true;
    } else {
      const error = new Error(response.data.message || t("app.settings.account.loginFailed"));
      error.code = response.data.error_code;
      throw error;
    }
  } catch (error) {
    console.error("Login error:", error);
    if (error.response?.data?.error_code) {
      error.code = error.response.data.error_code;
    }
    throw error;
  }
};

export const logout = async (emit, toast, t) => {
  try {
    const token = StorageManager.get("auth_token");
    if (!token) return;

    const response = await axios.post(
      getApiUrl("LOGOUT"),
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (response.data.code === 200) {
      StorageManager.remove("auth_token");
      StorageManager.remove("user_id");
      // 添加调用authStore.clearUser()来更新store中的用户状态
      const authStore = useAuthStore();
      authStore.clearUser();
      emit("update:user", { id: null, username: "", nickname: "", avatar: "" });
      emit("logout");

      toast.showToast(t("app.settings.account.logoutSuccess"), "success");
    } else {
      const error = new Error(response.data.message || t("app.settings.account.logoutFailed"));
      error.code = response.data.error_code;
      throw error;
    }
  } catch (error) {
    console.error("Logout error:", error);
    if (error.response?.data?.error_code) {
      error.code = error.response.data.error_code;
    }
    throw error;
  }
};

export const logoutAllSessions = async (emit, toast, t) => {
  emit("update:loggingOutAll", true);

  try {
    const token = StorageManager.get("auth_token");
    if (!token) return;

    const response = await axios.post(
      getApiUrl("LOGOUT_ALL"),
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (response.data.code === 200) {
      StorageManager.remove("auth_token");
      StorageManager.remove("user_id");
      // 添加调用authStore.clearUser()来更新store中的用户状态
      const authStore = useAuthStore();
      authStore.clearUser();
      emit("update:user", { id: null, username: "", nickname: "", avatar: "" });
      emit("logoutAllSessions");

      toast.showToast(t("app.settings.account.logoutAllSuccess"), "success");
    } else {
      const error = new Error(response.data.message || t("app.settings.account.logoutAllFailed"));
      error.code = response.data.error_code;
      throw error;
    }
  } catch (error) {
    console.error("Logout all error:", error);
    if (error.response?.data?.error_code) {
      error.code = error.response.data.error_code;
    }
    throw error;
  } finally {
    emit("update:loggingOutAll", false);
  }
};

export const registerUser = async (formData, turnstileToken, toast, t) => {
  try {
    const response = await axios.post(getApiUrl("REGISTER"), {
      username: formData.username,
      email: formData.email,
      password: formData.password,
      cf_token: turnstileToken,
    });

    if (response.data.code === 201) {
      toast.showToast(t("app.settings.account.registerSuccess"), "success");
      return true;
    } else {
      const error = new Error(response.data.message || t("app.settings.account.registerFailed"));
      error.code = response.data.error_code;
      throw error;
    }
  } catch (error) {
    console.error("Registration error:", error);
    if (error.response?.data?.error_code) {
      error.code = error.response.data.error_code;
    }
    throw error;
  }
};

export const verifyEmail = async (toast, t) => {
  const token = new URLSearchParams(window.location.search).get("verify_token");
  if (!token) return;

  try {
    const response = await axios.get(
      `${getApiUrl("VERIFY_EMAIL")}&token=${token}`
    );
    if (response.data.code === 200) {
      // 添加toast对象的空值检查
      if (toast) {
        toast.showToast(
          t("app.settings.account.emailVerifiedSuccess"),
          "success"
        );
      } else {
        console.log("Email verified successfully");
      }
    } else {
      const error = new Error(response.data.message || t("app.settings.account.emailVerifiedFailed"));
      error.code = response.data.error_code;
      throw error;
    }
  } catch (error) {
    console.error("Email verification error:", error);
    if (error.response?.data?.error_code) {
      error.code = error.response.data.error_code;
    }
    throw error;
  } finally {
    // Remove the token from URL without reloading
    window.history.replaceState({}, document.title, "/settings");
  }
};

export const resendVerification = async (email, turnstileToken, toast, t) => {
  try {
    const response = await axios.post(getApiUrl("RESEND_VERIFICATION"), {
      email: email,
      cf_token: turnstileToken,
    });

    if (response.data.code === 200) {
      toast.showToast(
        t("app.settings.account.verificationResent"),
        "success"
      );
      return true;
    } else {
      const error = new Error(response.data.message);
      error.code = response.data.error_code;
      throw error;
    }
  } catch (error) {
    console.error("Resend verification error:", error);
    if (error.response?.data?.error_code) {
      error.code = error.response.data.error_code;
    }
    throw error;
  }
};