// src/utils/qrCodeUtils.js
import axios from "axios";
import { getApiUrl } from "@/utils/apiEndpoints";
import StorageManager from "@/utils/StorageManager";
import * as Auth from "@/utils/LoginPanel/auth";

/**
 * 生成二维码会话
 * @param {Object} toast - Toast通知对象
 * @param {Function} t - 国际化函数
 * @returns {Promise<Object>} QR会话对象
 */
export const generateQRCode = async (toast, t) => {
  try {
    const response = await axios.post(getApiUrl("QR_GENERATE"));
    if (response.data.code === 200) {
      const qrSession = response.data.data;

      // 构建包含当前页面URL和验证参数的二维码内容
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.set("qr_code", qrSession.qr_code);
      currentUrl.searchParams.set("qr_session_id", qrSession.session_id);

      qrSession.qr_code = currentUrl.toString();
      return qrSession;
    } else {
      const error = new Error(response.data.message || t("app.settings.account.qrCodeGenerateFailed"));
      error.code = response.data.error_code;
      throw error;
    }
  } catch (error) {
    console.error("Generate QR code error:", error);
    throw error;
  }
};

/**
 * 检查二维码状态
 * @param {string} sessionId - 会话ID
 * @param {Object} toast - Toast通知对象
 * @param {Function} t - 国际化函数
 * @returns {Promise<Object>} 二维码状态数据
 */
export const checkQRCodeStatus = async (sessionId, toast, t) => {
  try {
    const response = await axios.get(
      `${getApiUrl("QR_CHECK")}&session_id=${sessionId}`
    );

    if (response.data.code === 200) {
      return response.data.data;
    } else if (response.data.code === 410) {
      const error = new Error(t("app.settings.account.qrCodeExpired"));
      error.code = response.data.error_code;
      throw error;
    } else {
      const error = new Error(response.data.message || t("app.settings.account.qrCodeCheckFailed"));
      error.code = response.data.error_code;
      throw error;
    }
  } catch (error) {
    console.error("Check QR code status error:", error);
    throw error;
  }
};

/**
 * 处理扫描到的二维码
 * @param {string} qrCode - 二维码内容
 * @param {Object} toast - Toast通知对象
 * @param {Function} t - 国际化函数
 * @returns {Promise<string>} 会话ID
 */
export const handleScannedQRCode = async (qrCode, toast, t) => {
  try {
    let urlObj;
    try {
      urlObj = new URL(qrCode);
    } catch (e) {
      const error = new Error(t("app.settings.account.invalidQRCode"));
      error.code = "INVALID_QR_CODE";
      throw error;
    }

    const qr_code = urlObj.searchParams.get("qr_code");
    const sessionId = urlObj.searchParams.get("qr_session_id");

    if (!sessionId) {
      const error = new Error(t("app.settings.account.invalidQRCode"));
      error.code = "INVALID_QR_CODE";
      throw error;
    }

    const response = await axios.post(getApiUrl("QR_SCAN"), {
      qr_code: qr_code,
      session_id: sessionId,
    });

    if (response.data.code === 200) {
      toast.showToast(
        t("app.settings.account.qrCodeScannedSuccess"),
        "success"
      );
      return sessionId;
    } else {
      const error = new Error(response.data.message || t("app.settings.account.qrCodeScanFailed"));
      error.code = response.data.error_code;
      throw error;
    }
  } catch (error) {
    console.error("Handle scanned QR code error:", error);
    throw error;
  }
};

/**
 * 确认二维码登录
 * @param {string} sessionId - 会话ID
 * @param {Object} toast - Toast通知对象
 * @param {Function} t - 国际化函数
 * @returns {Promise<boolean>} 是否成功
 */
export const confirmQRLogin = async (sessionId, toast, t) => {
  try {
    const token = StorageManager.get("auth_token");
    if (!token) {
      const error = new Error(t("app.settings.account.loginRequired"));
      error.code = "LOGIN_REQUIRED";
      throw error;
    }

    const response = await axios.post(
      getApiUrl("QR_CONFIRM"),
      { session_id: sessionId },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (response.data.code === 200) {
      toast.showToast(
        t("app.settings.account.qrConfirmSuccess"),
        "success"
      );
      return true;
    } else {
      const error = new Error(response.data.message || t("app.settings.account.qrConfirmFailed"));
      error.code = response.data.error_code;
      throw error;
    }
  } catch (error) {
    console.error("Confirm QR login error:", error);
    throw error;
  }
};

/**
 * 初始化二维码扫描器
 * @param {Object} refs - 包含qrVideo和qrCanvas的引用对象
 * @returns {Promise<Object>} 包含stream和canvasContext的对象
 */
export const initQRScanner = async (refs) => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: "environment",
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
    });

    if (refs.qrVideo) {
      refs.qrVideo.srcObject = stream;
      await refs.qrVideo.play();
    }

    let canvasContext = null;
    if (refs.qrCanvas) {
      refs.qrCanvas.width = refs.qrVideo.videoWidth;
      refs.qrCanvas.height = refs.qrVideo.videoHeight;
      canvasContext = refs.qrCanvas.getContext("2d", {
        willReadFrequently: true,
      });
    }

    return { stream, canvasContext };
  } catch (error) {
    console.error("Initialize QR scanner error:", error);
    error.code = "CAMERA_ERROR";
    throw error;
  }
};

/**
 * 绘制二维码边界框
 * @param {Object} canvasContext - Canvas上下文
 * @param {Object} canvas - Canvas元素
 * @param {Object} video - Video元素
 * @param {Object} code - 检测到的二维码数据
 */
export const drawQRCodeBoundingBox = (canvasContext, canvas, video, code) => {
  // Clear previous drawings
  canvasContext.clearRect(0, 0, canvas.width, canvas.height);

  // Draw the video frame again
  canvasContext.drawImage(video, 0, 0, canvas.width, canvas.height);

  // Draw bounding box
  canvasContext.beginPath();
  canvasContext.moveTo(
    code.location.topLeftCorner.x,
    code.location.topLeftCorner.y
  );
  canvasContext.lineTo(
    code.location.topRightCorner.x,
    code.location.topRightCorner.y
  );
  canvasContext.lineTo(
    code.location.bottomRightCorner.x,
    code.location.bottomRightCorner.y
  );
  canvasContext.lineTo(
    code.location.bottomLeftCorner.x,
    code.location.bottomLeftCorner.y
  );
  canvasContext.closePath();

  // Style the bounding box
  canvasContext.lineWidth = 4;
  canvasContext.strokeStyle = "#FF3B58";
  canvasContext.stroke();

  // Add corner squares for better visibility
  const cornerSize = 20;

  // Top-left corner
  canvasContext.fillStyle = "#FF3B58";
  canvasContext.fillRect(
    code.location.topLeftCorner.x - 2,
    code.location.topLeftCorner.y - 2,
    cornerSize,
    4
  );
  canvasContext.fillRect(
    code.location.topLeftCorner.x - 2,
    code.location.topLeftCorner.y - 2,
    4,
    cornerSize
  );

  // Top-right corner
  canvasContext.fillRect(
    code.location.topRightCorner.x - cornerSize + 2,
    code.location.topRightCorner.y - 2,
    cornerSize,
    4
  );
  canvasContext.fillRect(
    code.location.topRightCorner.x - 2,
    code.location.topRightCorner.y - 2,
    4,
    cornerSize
  );

  // Bottom-right corner
  canvasContext.fillRect(
    code.location.bottomRightCorner.x - cornerSize + 2,
    code.location.bottomRightCorner.y - 2,
    cornerSize,
    4
  );
  canvasContext.fillRect(
    code.location.bottomRightCorner.x - 2,
    code.location.bottomRightCorner.y - cornerSize + 2,
    4,
    cornerSize
  );

  // Bottom-left corner
  canvasContext.fillRect(
    code.location.bottomLeftCorner.x - 2,
    code.location.bottomLeftCorner.y - 2,
    cornerSize,
    4
  );
  canvasContext.fillRect(
    code.location.bottomLeftCorner.x - 2,
    code.location.bottomLeftCorner.y - cornerSize + 2,
    4,
    cornerSize
  );
};