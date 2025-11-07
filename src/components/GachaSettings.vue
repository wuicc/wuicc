<template>
  <v-card variant="text">
    <v-card-title class="text-h6">
      <v-icon left>mdi-account</v-icon>
      {{ $t("app.pages.gacha.settings.accountInfo") }}
    </v-card-title>

    <v-card-text class="pb-2">
      <!-- 登录用户信息 -->
      <div v-if="user.user_id" class="d-flex align-center">
        <v-avatar color="accent" class="mr-3">
          <v-img v-if="user.avatar && !avatarLoadError" :src="user.avatar" @error="avatarLoadError = true"></v-img>
          <span v-else class="text-h5">{{ userInitial }}</span>
        </v-avatar>

        <div>
          <div class="text-h6">{{ user.nickname || user.username }}</div>
          <div class="text-caption text-medium-emphasis">
            {{ user.username }}
          </div>
        </div>
        <div class="ml-4">
          <v-btn color="accent" variant="outlined" :to="{ path: '/settings', query: { highlight: 'login' } }">
            <v-icon left>mdi-cog</v-icon>
            {{ $t("app.common.go_to", { target: $t("app.settings.title") }) }}
          </v-btn>
        </div>
      </div>

      <!-- 未登录状态 -->
      <div v-else class="text-center py-4">
        <v-icon size="64" color="grey">mdi-account-circle-outline</v-icon>
        <div class="text-h6 mt-2">
          {{ $t("app.pages.gacha.settings.notLoggedIn") }}
        </div>
        <v-btn color="accent" variant="outlined" class="mt-4"
          :to="{ path: '/settings', query: { highlight: 'login' } }">
          <v-icon left>mdi-login</v-icon>
          {{ $t("app.pages.gacha.settings.goToLogin") }}
        </v-btn>
      </div>

      <!-- 列表加载错误提示 -->
      <v-alert v-if="loadError" type="error" class="mt-4">
        {{ loadError }}
        <v-btn size="small" color="error-dark" variant="text" @click="retryLoadAuthorizedUids" class="ml-2">
          <v-icon left>mdi-reload</v-icon>
          {{ $t("app.common.retry") }}
        </v-btn>
      </v-alert>

      <!-- 已授权UID列表 -->
      <v-card class="mt-4" v-if="user.user_id && !loadError">
        <v-card-title>
          <v-icon left>mdi-account-multiple</v-icon>
          {{ $t("app.pages.gacha.settings.authorizedAccounts") }}
          <v-btn class="float-right" color="accent" @click="openImportDialog">
            <v-icon left>mdi-link-plus</v-icon>
            {{ $t("app.pages.gacha.settings.importOfficialLink") }}
          </v-btn>
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text class="pb-0 pt-1">
          <v-table>
            <thead>
              <tr>
                <th class="text-center">
                  {{ $t("app.pages.gacha.settings.game") }}
                </th>
                <th class="text-center">
                  {{ $t("app.pages.gacha.settings.uid") }}
                </th>
                <th class="text-center">
                  {{ $t("app.pages.gacha.settings.nickname") }}
                </th>
                <th class="text-center">
                  {{ $t("app.pages.gacha.settings.actions") }}
                </th>
              </tr>
            </thead>
            <tbody>
              <!-- 修改后：每个UID单独一行 -->
              <template v-for="(game, gameId) in authorizedUids" :key="gameId">
                <tr v-for="uidInfo in game" :key="uidInfo.uid">
                  <td>
                    <v-chip :color="getGameColor(gameId)" variant="tonal">
                      {{ getGameName(gameId) }}
                    </v-chip>
                  </td>
                  <td>
                    <v-btn size="small" :color="isSelectedUid(gameId, uidInfo.uid)
                      ? 'accent'
                      : 'secondary'
                      " variant="text" @click="selectUid(gameId, uidInfo.uid)">
                      <v-icon left>
                        {{
                          isSelectedUid(gameId, uidInfo.uid)
                            ? "mdi-check-circle"
                            : "mdi-circle-outline"
                        }}
                      </v-icon>
                      {{ uidInfo.uid }}
                      <v-tooltip v-if="isDownloadedUid(gameId, uidInfo.uid)" activator="parent" location="top">
                        {{ $t("app.pages.gacha.settings.recordsDownloaded") }}
                      </v-tooltip>
                    </v-btn>
                  </td>
                  <td>
                    {{
                      uidInfo.nickname ||
                      t("app.pages.gacha.settings.noNickname")
                    }}
                  </td>
                  <td>
                    <div class="d-flex flex-wrap justify-center" style="min-width: 200px;">
                      <div class="d-flex justify-center min-width-100">
                        <v-btn size="small" color="accent" variant="text" @click="downloadRecords(gameId, uidInfo.uid)"
                          :loading="loadingRecords[`${gameId}-${uidInfo.uid}`]" class="mr-2">
                          <v-icon left>mdi-download</v-icon>
                          {{ $t("app.pages.gacha.settings.downloadRecords") }}
                        </v-btn>
                        <v-btn size="small" color="warning" variant="text" @click="openEditDialog(gameId, uidInfo)">
                          <v-icon left>mdi-pencil</v-icon>
                          {{ $t("app.pages.gacha.settings.editNickname") }}
                        </v-btn>
                      </div>
                      <div class="d-flex justify-center min-width-100">
                        <v-btn size="small" color="error" variant="text" @click="revokeUid(gameId, uidInfo.uid)"
                          class="mr-2">
                          <v-icon left>mdi-account-off</v-icon>
                          {{ $t("app.pages.gacha.settings.revoke") }}
                        </v-btn>
                        <v-btn size="small" color="error" variant="text"
                          @click="openDeleteRecordsDialog(gameId, uidInfo.uid)">
                          <v-icon left>mdi-trash-can</v-icon>
                          {{ $t("app.pages.gacha.settings.deleteRecords") }}
                        </v-btn>
                      </div>
                    </div>
                  </td>
                </tr>
              </template>
            </tbody>
          </v-table>
        </v-card-text>
      </v-card>

      <!-- 确认撤销UID对话框 -->
      <v-dialog v-model="confirmRevokeDialog" max-width="400">
        <v-card>
          <v-card-title>
            {{ $t("app.pages.gacha.settings.confirmRevokeTitle") }}
          </v-card-title>
          <v-card-text class="pb-0">
            <div class="d-flex align-center mb-2">
              <v-chip :color="getGameColor(revokingGameId)" variant="tonal" class="mr-2">
                {{ getGameName(revokingGameId) }}
              </v-chip>
              <span class="text-body-1">{{ revokingUid }}</span>
            </div>
            <v-divider class="my-0"></v-divider>
          </v-card-text>

          <v-card-text class="pt-1 pb-1">
            {{ $t("app.pages.gacha.settings.confirmRevokeMessage") }}
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="secondary" @click="confirmRevokeDialog = false">
              {{ $t("app.common.cancel") }}
            </v-btn>
            <v-btn color="error" @click="confirmRevoke">
              {{ $t("app.common.confirm") }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- 删除记录对话框 -->
      <v-dialog v-model="deleteRecordsDialog" max-width="400">
        <v-card>
          <v-card-title>
            {{ $t("app.pages.gacha.settings.deleteRecordsTitle") }}
          </v-card-title>
          <v-card-text class="pb-0">
            <div class="d-flex align-center mb-2">
              <v-chip :color="getGameColor(deletingGameId)" variant="tonal" class="mr-2">
                {{ getGameName(deletingGameId) }}
              </v-chip>
              <span class="text-body-1">{{ deletingUid }}</span>
            </div>
            <v-divider class="my-0"></v-divider>
          </v-card-text>

          <v-card-text class="pt-4 pb-1">
            {{ $t("app.pages.gacha.settings.deleteRecordsMessage") }}
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="secondary" @click="deleteRecordsDialog = false">
              {{ $t("app.common.cancel") }}
            </v-btn>
            <v-btn color="warning" @click="selectDeleteType('local')">
              {{ $t("app.pages.gacha.settings.deleteLocal") }}
            </v-btn>
            <v-btn color="error" @click="selectDeleteType('cloud')">
              {{ $t("app.pages.gacha.settings.deleteCloud") }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- 确认删除对话框 -->
      <v-dialog v-model="deleteConfirmDialog" max-width="400">
        <v-card>
          <v-card-title>
            {{ $t("app.pages.gacha.settings.confirmDeleteTitle") }}
          </v-card-title>
          <v-card-text class="pb-0">
            <div class="d-flex align-center mb-2">
              <v-chip :color="getGameColor(deletingGameId)" variant="tonal" class="mr-2">
                {{ getGameName(deletingGameId) }}
              </v-chip>
              <span class="text-body-1">{{ deletingUid }}</span>
            </div>
            <v-divider class="my-0"></v-divider>
          </v-card-text>

          <v-card-text class="pt-4 pb-1">
            {{ deleteType === 'local'
              ? $t("app.pages.gacha.settings.confirmDeleteLocal")
              : $t("app.pages.gacha.settings.confirmDeleteCloud") }}
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="secondary" @click="deleteConfirmDialog = false">
              {{ $t("app.common.cancel") }}
            </v-btn>
            <v-btn color="error" @click="confirmDeleteRecords">
              {{ $t("app.common.confirm") }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- 编辑昵称对话框 -->
      <v-dialog v-model="editDialog" max-width="400">
        <v-card>
          <v-card-title>
            <span>{{ $t("app.pages.gacha.settings.editNickname") }}</span>
            <v-chip :color="getGameColor(editingUidInfo?.gameId)" label class="ml-2">
              {{ getGameName(editingUidInfo?.gameId) }} -
              {{ editingUidInfo?.uid }}
            </v-chip>
          </v-card-title>
          <v-card-text class="pb-3">
            <v-text-field v-model="editingNickname" :label="$t('app.pages.gacha.settings.nickname')" variant="outlined"
              density="comfortable" hide-details="auto"></v-text-field>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="secondary" @click="editDialog = false">
              {{ $t("app.common.cancel") }}
            </v-btn>
            <v-btn color="accent" @click="saveNickname" :loading="savingNickname">
              {{ $t("app.common.save") }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- 下载记录对话框 -->
      <v-dialog v-model="downloadDialog" max-width="500" persistent>
        <v-card>
          <v-card-title class="d-flex align-center flex-wrap">
            {{ $t("app.pages.gacha.settings.selectGachaTypeToDownload") }}
            <v-chip :color="getGameColor(downloadingGameId)" label class="ml-2">
              {{ getGameName(downloadingGameId) }} -
              {{ downloadingUid }}
            </v-chip>
          </v-card-title>
          <v-card-text class="py-2">
            <v-select v-model="selectedDownloadGachaType" :items="getGachaTypesForGame(downloadingGameId)"
              item-title="name" item-value="id" :label="$t('app.pages.gacha.records.selectGachaType')"
              variant="outlined" density="comfortable" hide-details="auto" class="mt-4"
              :disabled="downloadLoading || isShowingResult">
              <template v-slot:selection="{ item }">
                <v-chip :color="getGameColor(downloadingGameId)" variant="tonal" size="small">
                  {{ item.title }}
                </v-chip>
              </template>
            </v-select>

            <!-- 下载结果提示 -->
            <v-alert v-if="downloadResult" :type="downloadResult.success ? 'success' : 'error'" class="mt-4">
              {{ downloadResult.message }}
            </v-alert>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="secondary" @click="closeDownloadDialog" :disabled="downloadLoading">
              {{ $t("app.common.cancel") }}
            </v-btn>
            <v-btn color="accent" @click="confirmDownload" :loading="downloadLoading" :disabled="!selectedDownloadGachaType || downloadLoading || isShowingResult
              ">
              {{ $t("app.common.confirm") }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- 导入官方链接对话框 -->
      <v-dialog v-model="importDialog" persistent min-width="600px">
        <v-card>
          <v-card-title>
            <v-icon left>mdi-link-plus</v-icon>
            {{ $t("app.pages.gacha.settings.importOfficialLink") }}
          </v-card-title>

          <v-card-text class="py-1">
            <!-- 步骤1: 选择游戏 -->
            <div class="mb-2">
              <div class="text-subtitle-1 font-weight-bold mb-2">
                1. {{ $t("app.pages.gacha.settings.selectGame") }}
              </div>
              <v-select v-model="importGameId" :items="availableGames" item-title="name" item-value="id"
                :label="$t('app.pages.gacha.settings.selectGame')" variant="outlined" density="comfortable"
                hide-details="auto">
                <template v-slot:selection="{ item }">
                  <v-chip :color="getGameColor(item.value)" :variant="item.value ? 'tonal' : 'text'" size="small">
                    {{ item.title }}
                  </v-chip>
                </template>
              </v-select>
            </div>

            <!-- 步骤2: 选择平台 -->
            <div class="mb-2">
              <div class="text-subtitle-1 font-weight-bold mb-2">
                2. {{ $t("app.pages.gacha.settings.selectPlatform") }}
              </div>
              <v-radio-group v-model="importPlatform" inline density="comfortable" hide-details="auto">
                <v-radio label="Windows" value="windows" color="accent"></v-radio>
                <v-radio label="Android" value="android" color="accent"></v-radio>
                <v-radio label="iOS" value="ios" color="accent"></v-radio>
              </v-radio-group>

              <!-- Windows 平台指引 -->
              <div v-if="importPlatform === 'windows'" class="mt-4">
                <div class="text-body-2 mb-2">
                  {{ $t("app.pages.gacha.settings.windowsInstructions") }}
                </div>
                <v-textarea readonly variant="outlined" density="comfortable" :model-value="windowsScript" rows="2"
                  hide-details class="mb-2"></v-textarea>
                <v-btn class="float-right" variant="outlined" size="small" @click="copyToClipboard(windowsScript)"
                  :color="copySuccess ? 'success' : 'accent'">
                  <v-icon left>
                    {{ copySuccess ? "mdi-check" : "mdi-content-copy" }}
                  </v-icon>
                  {{
                    copySuccess
                      ? $t("app.common.copied")
                      : $t("app.common.copy")
                  }}
                </v-btn>
              </div>

              <!-- Android 平台指引 -->
              <div v-if="importPlatform === 'android'" class="mt-4">
                <div class="text-body-2">
                  {{ $t("app.pages.gacha.settings.androidInstructions") }}
                </div>
              </div>

              <!-- iOS 平台指引 -->
              <div v-if="importPlatform === 'ios'" class="mt-4">
                <div class="text-body-2">
                  {{ $t("app.pages.gacha.settings.iosInstructions") }}
                </div>
              </div>
            </div>

            <!-- 步骤3: 输入链接 -->
            <div class="mb-2">
              <div class="text-subtitle-1 font-weight-bold mb-2">
                3. {{ $t("app.pages.gacha.settings.pasteLink") }}
              </div>
              <v-text-field v-model="importLink" :label="$t('app.pages.gacha.settings.officialLink')" variant="outlined"
                density="comfortable" :placeholder="t('app.pages.gacha.settings.linkPlaceholder')"
                :rules="[validateImportLink]" hide-details="auto" @update:modelValue="clearImportError"></v-text-field>
            </div>

            <!-- 错误提示 -->
            <v-alert v-if="importError" type="error" class="mt-4">
              {{ importError }}
            </v-alert>

            <!-- 导入状态 -->
            <v-alert v-if="importTaskStatus" :type="importTaskStatus === 'completed' ? 'success' : 'info'" class="mt-4">
              {{ getImportStatusMessage(importTaskStatus) }}
            </v-alert>

            <!-- 进度条 -->
            <v-progress-linear v-if="importTaskProgress > 0" :model-value="importTaskProgress" height="20"
              color="accent" class="mt-4">
              <template v-slot:default="{ value }">
                <strong>{{ Math.ceil(value) }}%</strong>
              </template>
            </v-progress-linear>
          </v-card-text>

          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="secondary" @click="closeImportDialog" :disabled="isImporting">
              {{ $t("app.common.cancel") }}
            </v-btn>
            <v-btn color="accent" @click="submitImport" :loading="isImporting" :disabled="!importLink ||
              !importGameId ||
              validateImportLink(importLink) !== true ||
              isPolling
              ">
              <v-icon left>mdi-import</v-icon>
              {{ $t("app.common.import") }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useI18n } from "vue-i18n";
import { i18n } from "@/i18n";
import axios from "axios";
import { getApiUrl } from "@/utils/apiEndpoints";
import { IndexedDBManager } from "@/utils/IndexedDBManager";
import StorageManager from "@/utils/StorageManager";

const { t } = useI18n();

const props = defineProps({
  user: {
    type: Object,
    default: () => ({
      user_id: null,
      username: "",
      nickname: "",
      avatar: "",
    }),
  },
});

const dbManager = new IndexedDBManager("GachaTrackerDB_v2");
const authorizedUids = ref({});
const loadingRecords = ref({});
const avatarLoadError = ref(false);
const editDialog = ref(false);
const editingNickname = ref("");
const editingUidInfo = ref(null);
const savingNickname = ref(false);
const gachaUids = ref({
  selected: {},
  downloaded: {},
});
const confirmRevokeDialog = ref(false);
const revokingGameId = ref("");
const revokingUid = ref("");
const downloadDialog = ref(false);
const downloadingGameId = ref("");
const downloadingUid = ref("");
const selectedDownloadGachaType = ref("");
const downloadLoading = ref(false);

// 导入相关状态
const importDialog = ref(false);
const importGameId = ref("");
const importLink = ref("");
const isImporting = ref(false);
const importTaskId = ref("");
const importTaskStatus = ref("");
const importTaskProgress = ref(0);
const importPollingInterval = ref(null);
const importError = ref("");

// 列表加载错误状态
const loadError = ref("");

// 删除记录相关状态
const deleteRecordsDialog = ref(false);
const deleteConfirmDialog = ref(false);
const deletingGameId = ref("");
const deletingUid = ref("");
const deleteType = ref(""); // 'local' 或 'cloud'

// 初始化数据库
const initDB = async () => {
  await dbManager.openDB();
};

// 获取游戏名称
const getGameName = (gameId) => {
  const games = {
    genshin: t("app.games.genshin.title"),
    starrail: t("app.games.starrail.title"),
    zenless: t("app.games.zenless.title"),
    wuthering: t("app.games.wuthering.title"),
  };
  return games[gameId] || gameId;
};

// 获取游戏颜色
const getGameColor = (gameId) => {
  try {
    const gameList = StorageManager.get("gameList") || [];
    const game = gameList.find((g) => g.game_id === gameId);
    return game ? game.color : "#607D8B";
  } catch (error) {
    console.error("Failed to load game color:", error);
    return "#607D8B";
  }
};

// 获取用户首字母
const userInitial = computed(() => {
  if (props.user.nickname) {
    return props.user.nickname.charAt(0).toUpperCase();
  }
  if (props.user.username) {
    return props.user.username.charAt(0).toUpperCase();
  }
  return "U";
});

// 初始化gachaUids
const initGachaUids = () => {
  const savedGachaUids = StorageManager.get("gachaUids") || {};
  gachaUids.value = {
    selected: savedGachaUids.selected || {},
    downloaded: savedGachaUids.downloaded || {},
  };
  StorageManager.set("gachaUids", gachaUids.value);
};

// 检查是否是当前选中的UID
const isSelectedUid = (gameId, uid) => {
  return gachaUids.value.selected[gameId] === uid;
};

// 检查是否是已下载的UID
const isDownloadedUid = (gameId, uid) => {
  return gachaUids.value.downloaded[gameId]?.includes(uid) || false;
};

// 选择UID
const selectUid = (gameId, uid) => {
  gachaUids.value.selected[gameId] = uid;
  saveGachaUids();
  // 触发事件通知父组件
  emit("recordsUpdated", {
    gameId,
    uid,
  });
};

// 保存gachaUids到存储
const saveGachaUids = () => {
  StorageManager.set("gachaUids", gachaUids.value);
};

// 获取已授权UID列表
const fetchAuthorizedUids = async () => {
  try {
    // 清除之前的错误
    loadError.value = "";

    const token = StorageManager.get("auth_token");
    if (!token) return;

    const response = await axios.get(getApiUrl("GACHA_UID_LIST"), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.data && response.data.code === 200) {
      authorizedUids.value = response.data.data.uids_by_game;
    } else {
      loadError.value = response.data?.message
        ? `${t(`app.error.codes.${response.data.error_code}`)}: ${response.data?.message}`
        : t("app.pages.gacha.settings.loadUidsFailed");
    }
  } catch (error) {
    console.error("Failed to fetch authorized UIDs:", error);
    // 根据错误类型显示不同的错误消息
    if (error.response) {
      // 服务器返回了错误响应
      loadError.value = error.response.data?.message || error.response.statusText || t("app.pages.gacha.settings.loadUidsFailed");
    } else if (error.request) {
      // 请求已发出但没有收到响应
      loadError.value = t("app.pages.gacha.settings.networkError");
    } else {
      // 其他错误
      loadError.value = error.message || t("app.pages.gacha.settings.loadUidsFailed");
    }
  }
};

// 重试加载已授权UID列表
const retryLoadAuthorizedUids = () => {
  fetchAuthorizedUids();
};

// 打开编辑对话框
const openEditDialog = (gameId, uidInfo) => {
  editingUidInfo.value = {
    gameId,
    uid: uidInfo.uid,
    currentNickname: uidInfo.nickname,
  };
  editingNickname.value = uidInfo.nickname;
  editDialog.value = true;
};

// 保存昵称
const saveNickname = async () => {
  if (!editingUidInfo.value) return;

  savingNickname.value = true;
  try {
    const token = StorageManager.get("auth_token");
    if (!token) return;

    await axios.post(
      getApiUrl("GACHA_UID_UPDATE"),
      {
        game_id: editingUidInfo.value.gameId,
        uid: editingUidInfo.value.uid,
        nickname: editingNickname.value,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    // 更新本地数据
    if (authorizedUids.value[editingUidInfo.value.gameId]) {
      const uidInfo = authorizedUids.value[editingUidInfo.value.gameId].find(
        (u) => u.uid === editingUidInfo.value.uid
      );
      if (uidInfo) {
        uidInfo.nickname = editingNickname.value;
      }
    }

    editDialog.value = false;
  } catch (error) {
    console.error("Failed to update UID nickname:", error);
  } finally {
    savingNickname.value = false;
  }
};

const revokeUid = (gameId, uid) => {
  revokingGameId.value = gameId;
  revokingUid.value = uid;
  confirmRevokeDialog.value = true;
};

// 确认执行的方法
const confirmRevoke = async () => {
  try {
    const token = StorageManager.get("auth_token");
    if (!token) return;

    await axios.post(
      getApiUrl("GACHA_UID_REVOKE"),
      {
        game_id: revokingGameId.value,
        uid: revokingUid.value,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    // 刷新列表
    await fetchAuthorizedUids();

    // 如果删除的是当前选中的UID，清除选中状态
    if (gachaUids.value.selected[revokingGameId.value] === revokingUid.value) {
      delete gachaUids.value.selected[revokingGameId.value];
      saveGachaUids();
    }

    // 从下载列表中移除
    if (
      gachaUids.value.downloaded[revokingGameId.value]?.includes(
        revokingUid.value
      )
    ) {
      gachaUids.value.downloaded[revokingGameId.value] =
        gachaUids.value.downloaded[revokingGameId.value].filter(
          (u) => u !== revokingUid.value
        );
      saveGachaUids();
    }
  } catch (error) {
    console.error("Failed to revoke UID:", error);
  } finally {
    confirmRevokeDialog.value = false;
  }
};

// 获取游戏的卡池类型选项
const getGachaTypesForGame = (gameId) => {
  const options = {
    genshin: [
      { id: "301", name: t("app.pages.gacha.types.genshin.301") },
      { id: "302", name: t("app.pages.gacha.types.genshin.302") },
      { id: "500", name: t("app.pages.gacha.types.genshin.500") },
      { id: "200", name: t("app.pages.gacha.types.genshin.200") },
      { id: "100", name: t("app.pages.gacha.types.genshin.100") },
    ],
    starrail: [
      { id: "11", name: t("app.pages.gacha.types.starrail.11") },
      { id: "12", name: t("app.pages.gacha.types.starrail.12") },
      { id: "21", name: t("app.pages.gacha.types.starrail.21") },
      { id: "22", name: t("app.pages.gacha.types.starrail.22") },
      { id: "1", name: t("app.pages.gacha.types.starrail.1") },
      { id: "2", name: t("app.pages.gacha.types.starrail.2") },
    ],
    zenless: [
      { id: "2", name: t("app.pages.gacha.types.zenless.2") },
      { id: "3", name: t("app.pages.gacha.types.zenless.3") },
      { id: "1", name: t("app.pages.gacha.types.zenless.1") },
      { id: "5", name: t("app.pages.gacha.types.zenless.5") },
    ],
    wuthering: [
      { id: "1", name: t("app.pages.gacha.types.wuthering.1") },
      { id: "2", name: t("app.pages.gacha.types.wuthering.2") },
      { id: "3", name: t("app.pages.gacha.types.wuthering.3") },
      { id: "4", name: t("app.pages.gacha.types.wuthering.4") },
      { id: "5", name: t("app.pages.gacha.types.wuthering.5") },
      { id: "6", name: t("app.pages.gacha.types.wuthering.6") },
      { id: "7", name: t("app.pages.gacha.types.wuthering.7") },
      { id: "8", name: t("app.pages.gacha.types.wuthering.8") },
      { id: "9", name: t("app.pages.gacha.types.wuthering.9") },
    ],
  };
  return options[gameId] || [];
};

// 下载记录方法
const downloadRecords = (gameId, uid) => {
  downloadingGameId.value = gameId;
  downloadingUid.value = uid;

  // 获取该游戏的所有卡池类型
  const gachaTypes = getGachaTypesForGame(gameId);

  // 如果有可用的卡池类型，默认选择第一个
  selectedDownloadGachaType.value =
    gachaTypes.length > 0 ? gachaTypes[0].id : "";

  downloadDialog.value = true;
};

const downloadResult = ref(null);

// 修改关闭下载对话框方法
const closeDownloadDialog = () => {
  downloadDialog.value = false;
  downloadResult.value = null;
};

// 添加显示结果状态
const isShowingResult = ref(false);

// 修改确认下载方法
const confirmDownload = async () => {
  if (!selectedDownloadGachaType.value) return;

  downloadLoading.value = true;
  downloadResult.value = null;
  isShowingResult.value = false;
  const loadingKey = `${downloadingGameId.value}-${downloadingUid.value}`;
  loadingRecords.value[loadingKey] = true;

  try {
    const token = StorageManager.get("auth_token");
    if (!token) return;

    // 1. 获取抽卡记录
    const recordsResponse = await axios.get(
      getApiUrl("GACHA_RECORDS", {
        game_id: downloadingGameId.value,
        uid: downloadingUid.value,
      }),
      {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          gacha_type: selectedDownloadGachaType.value,
          limit: 10000,
        },
      }
    );

    if (recordsResponse.data?.code === 200) {
      const records = recordsResponse.data.data.records;
      const recordCount = records.length;

      // 2. 直接存储原始数据，不进行转换
      await dbManager.openDB();
      const tableName = `${downloadingGameId.value}-${downloadingUid.value}`;

      // 只清空当前卡池类型的记录
      // 对于原神，需要考虑uigf_gacha_type
      const gachaTypeToClear = selectedDownloadGachaType.value;
      await dbManager.clearGachaTypeRecords(
        tableName,
        gachaTypeToClear
      );

      // 添加新数据
      for (const record of records) {
        // 对于原神，使用uigf_gacha_type作为键，否则使用gacha_type
        const gachaTypeKey = downloadingGameId.value === 'genshin' && record.uigf_gacha_type
          ? record.uigf_gacha_type
          : record.gacha_type;
        await dbManager.addGachaRecord(tableName, gachaTypeKey, record);
      }

      // // 3. 获取统计信息并存储
      // const statsResponse = await axios.get(
      //   getApiUrl("GACHA_STATS", {
      //     game_id: downloadingGameId.value,
      //     uid: downloadingUid.value,
      //   }),
      //   { headers: { Authorization: `Bearer ${token}` } }
      // );

      // if (statsResponse.data?.code === 200) {
      //   await dbManager.setGameData(tableName, {
      //     stats: statsResponse.data.data.stats,
      //     lastUpdated: new Date().toISOString(),
      //   });
      // }

      // 4. 更新gachaUids中的下载记录
      if (!gachaUids.value.downloaded[downloadingGameId.value]) {
        gachaUids.value.downloaded[downloadingGameId.value] = [];
      }

      if (
        !gachaUids.value.downloaded[downloadingGameId.value].includes(
          downloadingUid.value
        )
      ) {
        gachaUids.value.downloaded[downloadingGameId.value].push(
          downloadingUid.value
        );
      }

      // 如果没有选中的UID，自动选中当前下载的UID
      if (!gachaUids.value.selected[downloadingGameId.value]) {
        gachaUids.value.selected[downloadingGameId.value] =
          downloadingUid.value;
      }

      saveGachaUids();
      emit("recordsUpdated", {
        gameId: downloadingGameId.value,
        uid: downloadingUid.value,
      });

      // 显示下载结果
      downloadResult.value = {
        success: true,
        message: t("app.pages.gacha.settings.downloadSuccess", {
          count: recordCount,
          type: getGachaTypesForGame(downloadingGameId.value).find(
            (t) => t.id === selectedDownloadGachaType.value
          )?.name,
        }),
      };

      // 设置显示结果状态
      isShowingResult.value = true;

      // 3秒后自动关闭对话框
      setTimeout(() => {
        isShowingResult.value = false;
        closeDownloadDialog();
      }, 3000);
    }
  } catch (error) {
    console.error("Failed to download records:", error);
    downloadResult.value = {
      success: false,
      message: t("app.pages.gacha.settings.downloadFailed"),
    };
    isShowingResult.value = true;

    // 3秒后自动关闭错误提示
    setTimeout(() => {
      isShowingResult.value = false;
    }, 3000);
  } finally {
    downloadLoading.value = false;
    loadingRecords.value[loadingKey] = false;
  }
};

// 获取可用游戏列表
const availableGames = computed(() => {
  const gameList = StorageManager.get("gameList") || [];
  return gameList.map((game) => ({
    id: game.game_id,
    name: getGameName(game.game_id),
    color: game.color,
  }));
});

// 打开导入对话框
const openImportDialog = () => {
  importDialog.value = true;
  importGameId.value = "";
  importLink.value = "";
  importTaskId.value = "";
  importTaskStatus.value = "";
  importTaskProgress.value = 0;
};

// 关闭导入对话框
const closeImportDialog = () => {
  importDialog.value = false;
  if (importPollingInterval.value) {
    clearInterval(importPollingInterval.value);
    importPollingInterval.value = null;
  }
};

// 获取导入状态消息
const getImportStatusMessage = (status) => {
  const messages = {
    pending: t("app.pages.gacha.settings.importPending"),
    processing: t("app.pages.gacha.settings.importProcessing"),
    completed: t("app.pages.gacha.settings.importCompleted"),
    failed: t("app.pages.gacha.settings.importFailed"),
  };
  return messages[status] || status;
};

const validateImportLink = (value) => {
  if (!value) return true; // 允许空值，由提交按钮的disabled状态控制

  try {
    // 尝试创建一个URL对象来验证
    new URL(value);

    // 检查是否是支持的根域名
    const supportedRootDomains = [
      "mihoyo.com",
      "hoyoverse.com",
      "aki-game.com",
      "aki-game2.com",
    ];

    const url = new URL(value);
    const domainParts = url.hostname.split(".");
    const rootDomain = domainParts.slice(-2).join("."); // 获取最后两部分作为根域名

    if (!supportedRootDomains.includes(rootDomain)) {
      return t("app.pages.gacha.settings.unsupportedDomain");
    }

    return true;
  } catch (err) {
    return t("app.pages.gacha.settings.invalidUrl");
  }
};

const clearImportError = () => {
  importError.value = "";
};

const isPolling = ref(false); // 新增状态变量
// 提交导入请求
const submitImport = async () => {
  if (!importLink.value || !importGameId.value) return;

  // 再次验证URL
  const validationResult = validateImportLink(importLink.value);
  if (validationResult !== true) {
    importError.value = validationResult;
    return;
  }

  isImporting.value = true;
  isPolling.value = false;
  importError.value = ""; // 清空之前的错误信息
  try {
    const token = StorageManager.get("auth_token");
    if (!token) return;

    const response = await axios.post(
      getApiUrl("GACHA_IMPORT_OFFICIAL"),
      {
        url: importLink.value,
        game_id: importGameId.value,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.data?.code === 200) {
      importTaskId.value = response.data.data.task_id;
      importTaskStatus.value = response.data.data.status;
      isPolling.value = true;
      startPollingImportTask();
    } else {
      // 如果返回的code不是200，显示错误消息
      importError.value = response.data?.message
        ? `${i18n.global.t(`app.error.codes.${response.data.error_code}`)}: ${response.data?.message
        }`
        : t("app.pages.gacha.settings.importFailed");
    }
  } catch (error) {
    console.error("Failed to submit import:", error);
    isPolling.value = false;
    // 根据错误类型显示不同的错误消息
    if (error.response) {
      // 服务器返回了错误响应
      importError.value =
        error.response.data?.message ||
        error.response.statusText ||
        t("app.pages.gacha.settings.importFailed");
    } else if (error.request) {
      // 请求已发出但没有收到响应
      importError.value = t("app.pages.gacha.settings.importNoResponse");
    } else {
      // 其他错误
      importError.value =
        error.message || t("app.pages.gacha.settings.importFailed");
    }
  } finally {
    isImporting.value = false;
  }
};

// 开始轮询导入任务状态
const startPollingImportTask = () => {
  if (importPollingInterval.value) {
    clearInterval(importPollingInterval.value);
  }

  importPollingInterval.value = setInterval(async () => {
    try {
      const token = StorageManager.get("auth_token");
      if (!token || !importTaskId.value) return;

      const response = await axios.get(
        getApiUrl("GACHA_IMPORT_TASK", { task_id: importTaskId.value }),
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data?.code === 200) {
        importTaskStatus.value = response.data.data.status;
        importTaskProgress.value = response.data.data.progress || 0;

        // 如果任务完成，停止轮询并刷新UID列表
        if (response.data.data.status === "completed") {
          clearInterval(importPollingInterval.value);
          isPolling.value = false;
          importPollingInterval.value = null;

          // 延迟1秒后刷新UID列表，确保服务器已处理完成
          setTimeout(async () => {
            await fetchAuthorizedUids();
            // 触发事件通知父组件
            emit("recordsUpdated", {
              gameId: importGameId.value,
              uid: response.data.data.uid, // 假设返回数据中包含导入的UID
            });
          }, 1000);
        }
      }
    } catch (error) {
      console.error("Failed to poll import task:", error);
      clearInterval(importPollingInterval.value);
      importPollingInterval.value = null;
      isPolling.value = false;
    }
  }, 2000);
};

// 在setup()中添加以下变量
const importPlatform = ref("windows");
// 在setup()中修改windowsScript的计算属性
const windowsScript = computed(() => {
  const domain = window.location.hostname;
  return `irm -useb "https://${domain}/import-scripts/wuicc-gacha-import.ps1" | iex`;
  // `iwr -useb "https://${domain}/import-scripts/wuicc-gacha-import.ps1" | %{[System.Text.Encoding]::UTF8.GetString($_.Content)} | iex`;
  //`$r=iwr -useb "https://${domain}/import-scripts/wuicc-gacha-import.ps1";$e=[System.Text.Encoding]::GetEncoding("UTF-8");$e.GetString($r.Content) | iex`;
});

// 在setup()中添加以下变量
const copySuccess = ref(false);

// 修改复制到剪贴板的方法
const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    copySuccess.value = true;
    // 3秒后恢复原始状态
    setTimeout(() => {
      copySuccess.value = false;
    }, 1500);
  } catch (err) {
    console.error("Failed to copy text: ", err);
    // 可以添加错误提示
    // importError.value = t('app.pages.gacha.settings.copyFailed');
  }
};

const emit = defineEmits(["recordsUpdated"]);

onMounted(async () => {
  await initDB();
  initGachaUids();
  if (props.user.user_id) {
    await fetchAuthorizedUids();
  }
});

// 打开删除记录对话框
const openDeleteRecordsDialog = (gameId, uid) => {
  deletingGameId.value = gameId;
  deletingUid.value = uid;
  deleteRecordsDialog.value = true;
};

// 选择删除类型
const selectDeleteType = (type) => {
  deleteType.value = type;
  deleteRecordsDialog.value = false;
  deleteConfirmDialog.value = true;
};

// 确认删除记录
const confirmDeleteRecords = async () => {
  try {
    if (deleteType.value === 'local') {
      // 删除本地记录
      await dbManager.openDB();
      await dbManager.deleteAllGameRecords(deletingGameId.value, deletingUid.value);

      // 从下载列表中移除
      if (gachaUids.value.downloaded[deletingGameId.value]) {
        gachaUids.value.downloaded[deletingGameId.value] =
          gachaUids.value.downloaded[deletingGameId.value].filter(
            (u) => u !== deletingUid.value
          );
        saveGachaUids();
      }

      // 如果删除的是当前选中的UID，清除选中状态
      if (gachaUids.value.selected[deletingGameId.value] === deletingUid.value) {
        delete gachaUids.value.selected[deletingGameId.value];
        saveGachaUids();
      }

      // 触发事件通知父组件
      emit("recordsUpdated", {
        gameId: deletingGameId.value,
        uid: deletingUid.value
      });
    } else if (deleteType.value === 'cloud') {
      // 删除云端记录
      const token = StorageManager.get("auth_token");
      if (!token) return;

      await axios.post(
        getApiUrl("GACHA_LOG_CLEAR", {
          game_id: deletingGameId.value,
          uid: deletingUid.value
        }),
        {
          confirm: true
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    }
  } catch (error) {
    console.error(`Failed to delete ${deleteType.value} records:`, error);
    // 这里可以添加错误提示
  } finally {
    deleteConfirmDialog.value = false;
    // 重置状态
    deletingGameId.value = "";
    deletingUid.value = "";
    deleteType.value = "";
  }
};

// 在组件卸载时清除轮询
onUnmounted(() => {
  if (importPollingInterval.value) {
    clearInterval(importPollingInterval.value);
  }
});
</script>

<style scoped>
.v-card {
  /* background: #fff; */
  margin: 0 auto;
}

.v-table {
  background-color: #fff8;
}

.v-theme--dark .v-table {
  background-color: #4448;
}

/* 选中按钮样式 */
.v-btn--selected {
  font-weight: bold;
}
</style>