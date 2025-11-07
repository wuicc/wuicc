<template>
  <v-card :class="{ 'highlight-card': isHighlighting, 'expanded-panel': isExpanded }">
    <v-card-title class="text-h6">
      <v-icon left>mdi-account</v-icon>
      {{ $t("app.settings.account.title") }}
    </v-card-title>
    <v-card-text>
      <!-- Profile loading indicator -->
      <div v-if="profileLoading" class="text-center py-8">
        <v-progress-circular indeterminate size="64" color="accent"></v-progress-circular>
        <div class="mt-4 text-h6">
          {{ $t("app.common.loading") }}
        </div>
      </div>

      <!-- Main content when not loading profile -->
      <template v-else>
        <!-- Logged-in user info -->
        <div v-if="isLoggedIn">
          <div class="d-flex align-center mb-4 justify-space-between">
            <div class="d-flex align-center">
              <v-avatar color="accent" class="mr-3">
                <v-img v-if="currentUser.avatar && !avatarLoadError" :src="currentUser.avatar" alt="User avatar"
                  @error="avatarLoadError = true"></v-img>
                <span v-else class="text-h5">{{ userInitial }}</span>
              </v-avatar>
              <div>
                <div class="text-h6">
                  {{ currentUser.nickname || currentUser.username }}
                </div>
                <div class="text-caption text-medium-emphasis">
                  {{ currentUser.username }}
                </div>
              </div>
            </div>

            <!-- 登出按钮组 -->
            <div class="d-flex">
              <v-btn color="warning" variant="outlined" @click="logout" class="mr-2">
                <v-icon left>mdi-logout</v-icon>
                {{ $t("app.settings.account.logout") }}
              </v-btn>

              <v-btn color="warning" variant="outlined" @click="confirmLogoutAll" :loading="loggingOutAll"
                style="display: none">
                <v-icon left>mdi-logout-variant</v-icon>
                {{ $t("app.settings.account.logoutAll") }}
              </v-btn>
            </div>
          </div>

          <!-- Cloud sync buttons -->
          <div class="d-flex flex-wrap">
            <v-divider class="mb-0"></v-divider>
            <div class="text-h6 mt-2 mb-2">
              <v-icon left>mdi-cloud</v-icon>
              {{ $t("app.settings.account.cloudSync") }}
            </div>

            <!-- Slot selector and last update time in a row -->
            <div class="d-flex flex-wrap align-center pb-0">
              <div class="d-flex flex-grow-1 flex-wrap align-center" style="gap: 4px; width: 100%">
                <!-- Slot selector -->
                <v-btn-toggle v-model="selectedSlot" mandatory density="compact" color="accent" rounded="lg">
                  <v-btn v-for="slot in [1, 2, 3]" :key="slot" :value="slot" variant="outlined" density="compact">
                    {{ slot }}
                  </v-btn>
                </v-btn-toggle>

                <!-- Force line break -->
                <div style="flex-basis: 100%; height: 0;"></div>

                <!-- Last update time -->
                <div v-if="slotMetadata" class="d-flex align-center">
                  <v-chip variant="outlined" color="accent" class="mr-2">
                    {{ slotMetadata.lastUpdatedLabel }}
                  </v-chip>
                  <span v-if="slotMetadata.updatedAt" class="text-medium-emphasis">
                    {{ formatDate(slotMetadata.updatedAt) }}
                  </span>
                  <span v-else class="text-medium-emphasis">
                    {{ $t("app.settings.account.neverUpdated") }}
                  </span>
                </div>
              </div>

              <!-- Operation buttons -->
              <div class="d-flex flex-wrap mt-2">
                <v-btn color="accent" variant="outlined" @click="checkBeforeUpload" class="mr-2 mb-2"
                  :loading="uploadingSettings" :disabled="uploadingSettings || downloadingSettings || clearingCloud
                    ">
                  <v-icon left>mdi-cloud-upload</v-icon>
                  {{ $t("app.settings.account.uploadSettings") }}
                </v-btn>

                <v-btn color="accent" variant="outlined" @click="downloadSettings" class="mr-2 mb-2"
                  :loading="downloadingSettings" :disabled="isSlotEmpty ||
                    downloadingSettings ||
                    uploadingSettings ||
                    clearingCloud
                    ">
                  <v-icon left>mdi-cloud-download</v-icon>
                  {{ $t("app.settings.account.downloadSettings") }}
                </v-btn>

                <v-btn color="error" variant="outlined" @click="confirmClearCloud" class="mb-2" :loading="clearingCloud"
                  :disabled="isSlotEmpty ||
                    clearingCloud ||
                    uploadingSettings ||
                    downloadingSettings
                    ">
                  <v-icon left>mdi-cloud-off-outline</v-icon>
                  {{ $t("app.settings.account.clearCloud") }}
                </v-btn>
              </div>
            </div>
          </div>
          <v-divider class="my-2"></v-divider>
        </div>

        <div v-if="qqCallbackLoading || microsoftCallbackLoading" class="text-center py-8">
          <v-progress-circular indeterminate size="64" color="accent"></v-progress-circular>
          <div class="mt-4 text-h6">
            {{ $t("app.settings.account.thirdPartyLoggingIn") }}
          </div>
        </div>

        <!-- Not logged in content -->
        <template v-else>
          <!-- Clear data buttons -->
      <!-- Activity status last updated -->
      <div v-if="activityStatusLastUpdated" class="my-1">
        <div>{{ $t("app.settings.account.activityStatusLastUpdated") }}: {{ activityStatusLastUpdated }}</div>
      </div>
      
      <!-- Confirm overwrite local dialog -->
      <v-dialog v-model="confirmOverwriteLocalDialog" max-width="400">
        <v-card>
          <v-card-title class="text-h6">
            {{ $t("app.settings.account.localNewerTitle") }}
          </v-card-title>
          <v-card-text>
            {{ $t("app.settings.account.localNewerMessage", { slot: selectedSlot }) }}
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="secondary" @click="confirmOverwriteLocalDialog = false">
              {{ $t("app.common.cancel") }}
            </v-btn>
            <v-btn color="accent" @click="confirmOverwriteLocal">
              {{ $t("app.common.confirm") }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
          <div class="d-flex flex-wrap" style="gap: 8px">
            <v-btn color="error" variant="outlined" @click="confirmClearLocal" :loading="clearingLocal">
              <v-icon left>mdi-delete</v-icon>
              {{ $t("app.settings.account.clearLocal") }}
            </v-btn>
            <v-btn color="accent" variant="outlined" @click="toggleLoginForm" v-if="!isLoggedIn" class="">
              <v-icon left>{{
                showLoginForm ? "mdi-eye-off" : "mdi-eye"
                }}</v-icon>
              {{
                showLoginForm
                  ? $t("app.settings.account.hideLoginForm")
                  : $t("app.settings.account.showLoginForm")
              }}
            </v-btn>
            <v-spacer></v-spacer>
            <v-btn v-if="isLoggedIn && !scanningQRCode && !qrError && !qrLoading" color="purple" variant="outlined"
              @click="startQRScanner">
              <v-icon left>mdi-qrcode-scan</v-icon>
              {{ $t("app.settings.account.startScan") }}
            </v-btn>
            <v-btn v-if="scanningQRCode && !qrLoading && !qrError" color="error" @click="stopQRScanner" class="mt-0">
              <v-icon left>mdi-close</v-icon>
              {{ $t("app.settings.account.stopScan") }}
            </v-btn>
          </div>

          <!-- Logout buttons for logged in users -->
          <div v-if="isLoggedIn">
            <v-dialog v-model="logoutAllDialog" max-width="400">
              <v-card>
                <v-card-title class="text-h6">
                  {{ $t("app.settings.account.logoutAllConfirmTitle") }}
                </v-card-title>
                <v-card-text>
                  {{ $t("app.settings.account.logoutAllConfirmMessage") }}
                </v-card-text>
                <v-card-actions>
                  <v-spacer></v-spacer>
                  <v-btn color="secondary" @click="logoutAllDialog = false">
                    {{ $t("app.common.cancel") }}
                  </v-btn>
                  <v-btn color="warning" @click="logoutAllSessions">
                    {{ $t("app.common.confirm") }}
                  </v-btn>
                </v-card-actions>
              </v-card>
            </v-dialog>

            <!-- Camera Scanner -->
            <div v-if="qrLoading" class="qr-loading-overlay" :class="{ 'qr-scanning': scanningQRCode }">
              <v-progress-circular indeterminate size="64" color="accent"></v-progress-circular>
              <div class="mt-4 text-h6">
                {{ $t("app.common.loading") }}
              </div>
            </div>
            <div v-if="scanningQRCode" v-show="!qrLoading" class="qr-scanner-container mt-2">
              <video ref="qrVideo" class="qr-video" playsinline></video>
              <canvas ref="qrCanvas" class="qr-canvas"
                :style="{ visibility: qrLoading ? 'hidden' : 'visible' }"></canvas>
            </div>

            <!-- Scan Button -->
            <div class="mt-2">
              <div v-if="qrError" class="qr-error-message">
                <v-alert type="error" variant="tonal">
                  {{ qrError }}
                </v-alert>
              </div>
            </div>
          </div>

          <!-- Login/register forms for non-logged in users -->
          <div v-else-if="isLoaded && showLoginForm">
            <!-- QR Code Login Section -->
            <div class="mb-2">
              <v-tabs v-model="loginTab" grow color="accent" class="mb-2">
                <v-tab value="password">
                  <v-icon left>mdi-form-textbox-password</v-icon>
                  {{ $t("app.settings.account.passwordLogin") }}
                </v-tab>
                <v-tab value="qr">
                  <v-icon left>mdi-qrcode</v-icon>
                  {{ $t("app.settings.account.qrLogin") }}
                </v-tab>
              </v-tabs>

              <v-window v-model="loginTab">
                <v-window-item value="password">
                  <!-- Login/register toggle buttons -->
                  <div class="d-flex flex-wrap justify-center mb-2" style="gap: 8px">
                    <!-- 登录/注册切换按钮 -->
                    <div class="d-flex flex-wrap" style="gap: 8px">
                      <v-btn :variant="!showRegisterForm ? 'elevated' : 'text'" color="accent"
                        @click="showRegisterForm = false">
                        {{ $t("app.settings.account.login") }}
                      </v-btn>
                      <v-btn :variant="showRegisterForm ? 'elevated' : 'text'" color="accent"
                        @click="showRegisterForm = true">
                        {{ $t("app.settings.account.register") }}
                      </v-btn>
                    </div>

                    <!-- 第三方登录按钮 -->
                    <div class="d-flex flex-wrap" style="gap: 8px">
                      <v-btn v-if="isDomestic" color="red" variant="outlined" @click="loginWithQQ"
                        :loading="qqLoginLoading" :disabled="qqLoginLoading || qqLoginCooldown">
                        <img src="/assets/images/qq-login-icon.png" alt="QQ" />
                        {{ $t("app.settings.account.loginWithQQ") }}
                        <template v-if="qqLoginCooldown">{{
                          $t("app.common.paused")
                          }}</template>
                      </v-btn>
                      <v-btn color="#00A1F1" variant="outlined" @click="loginWithMicrosoft"
                        :loading="microsoftLoginLoading" :disabled="microsoftLoginLoading || microsoftLoginCooldown
                          ">
                        <v-icon left>mdi-microsoft</v-icon>
                        {{ $t("app.settings.account.loginWithMicrosoft") }}
                        <template v-if="microsoftLoginCooldown">{{
                          $t("app.common.paused")
                          }}</template>
                      </v-btn>
                    </div>
                  </div>

                  <!-- Login form -->
                  <v-form v-if="!showRegisterForm" @submit.prevent="login" class="mt-4">
                    <v-text-field v-model="loginForm.username" :label="$t('app.settings.account.username')"
                      density="comfortable" hide-details="auto" class="mb-2" autocomplete="username"
                      required></v-text-field>

                    <v-text-field v-model="loginForm.password" :label="$t('app.settings.account.password')"
                      type="password" density="comfortable" hide-details="auto" class="mb-4"
                      autocomplete="current-password" required></v-text-field>

                    <!-- Turnstile captcha -->
                    <div class="text-center mb-2">
                      <vue-turnstile ref="loginTurnstile" :site-key="TURNSTILE_SITE_KEY" v-model="loginTurnstileToken"
                        @error="onTurnstileError" @expire="onTurnstileExpire" :language="turnstileLanguage" />
                    </div>

                    <v-btn type="submit" color="accent" block :loading="loginLoading"
                      :disabled="loginLoading || loginDisabled">
                      <v-icon left>mdi-login</v-icon>
                      {{ $t("app.settings.account.login") }}
                      <template v-if="loginDisabled">{{
                        $t("app.common.paused")
                        }}</template>
                    </v-btn>

                    <div v-if="loginError" class="mt-3 text-error">
                      <v-icon small color="error">mdi-alert-circle</v-icon>
                      {{ loginError }}
                    </div>
                  </v-form>

                  <!-- Register form -->
                  <v-form v-else @submit.prevent="register" class="mt-4">
                    <v-text-field v-model="registerForm.username" :label="$t('app.settings.account.username')"
                      density="comfortable" hide-details="auto" class="mb-2" autocomplete="username"
                      required></v-text-field>

                    <v-text-field v-model="registerForm.email" :label="$t('app.settings.account.email')" type="email"
                      density="comfortable" hide-details="auto" class="mb-2" autocomplete="email"
                      required></v-text-field>

                    <v-text-field v-model="registerForm.password" :label="$t('app.settings.account.password')"
                      type="password" density="comfortable" hide-details="auto" class="mb-2" autocomplete="new-password"
                      required></v-text-field>

                    <v-text-field v-model="registerForm.confirmPassword"
                      :label="$t('app.settings.account.confirmPassword')" type="password" density="comfortable"
                      hide-details="auto" class="mb-4" autocomplete="new-password" required></v-text-field>

                    <!-- Turnstile captcha -->
                    <div class="text-center mb-2">
                      <vue-turnstile ref="registerTurnstile" :site-key="TURNSTILE_SITE_KEY"
                        v-model="registerTurnstileToken" @error="onTurnstileError" @expire="onTurnstileExpire"
                        :language="turnstileLanguage" />
                    </div>

                    <v-btn type="submit" color="accent" block :loading="registerLoading"
                      :disabled="registerLoading || registerDisabled">
                      <v-icon left>mdi-account-plus</v-icon>
                      {{ $t("app.settings.account.register") }}
                      <template v-if="registerDisabled">{{
                        $t("app.common.paused")
                        }}</template>
                    </v-btn>

                    <v-btn color="secondary" variant="text" block class="mt-2" @click="showResendVerification">
                      <v-icon left>mdi-email-fast-outline</v-icon>
                      {{ $t("app.settings.account.resendVerification") }}
                    </v-btn>

                    <div v-if="registerError" class="mt-3 text-error">
                      <v-icon small color="error">mdi-alert-circle</v-icon>
                      {{ registerError }}
                    </div>
                  </v-form>
                </v-window-item>

                <v-window-item value="qr">
                  <div class="text-center mt-2 mb-2">
                    <!-- QR Code Display -->
                    <div v-if="qrSession" class="qr-code-container">
                      <!-- 如果扫码成功返回 user_info，显示用户头像与昵称并隐藏二维码 -->
                      <div v-if="scannedUserInfo" class="mb-2 d-flex align-center"
                        style="gap:12px; justify-content:center;">
                        <v-avatar size="56" class="mr-2">
                          <v-img v-if="scannedUserInfo.avatar" :src="scannedUserInfo.avatar"
                            alt="scanned avatar"></v-img>
                          <span v-else class="text-h6">{{ scannedUserInitial }}</span>
                        </v-avatar>
                        <div class="text-h6">{{ scannedUserInfo.nickname || scannedUserInfo.username ||
                          scannedUserInfo.name }}</div>
                      </div>

                      <qrcode-vue v-if="!scannedUserInfo && qrSession.qr_code" :value="qrSession.qr_code" :size="200"
                        level="L" class="mb-2" render-as="svg" :image-settings="qrLogoConfig" />
                      <div v-if="!scannedUserInfo" class="text-caption mb-2">
                        {{ $t("app.settings.account.scanQRCode") }}
                      </div>
                      <div class="text-caption text-medium-emphasis mb-2">
                        {{
                          $t("app.settings.account.qrExpiresIn", {
                            minutes: qrRemainingSeconds,
                          })
                        }}
                      </div>
                      <v-btn color="accent" @click="generateQRCode" :loading="generatingQRCode">
                        <v-icon left>mdi-refresh</v-icon>
                        {{ $t("app.settings.account.refreshQRCode") }}
                      </v-btn>
                    </div>

                    <!-- QR Code Loading -->
                    <div v-else-if="generatingQRCode" class="py-8">
                      <v-progress-circular indeterminate size="64" color="accent"></v-progress-circular>
                      <div class="mt-4 text-h6">
                        {{ $t("app.settings.account.generatingQRCode") }}
                      </div>
                    </div>

                    <!-- QR Code Not Generated or Expired -->
                    <div v-else class="py-8">
                      <v-icon size="64" color="grey">mdi-qrcode-remove</v-icon>
                      <div>
                        <v-btn color="accent" @click="generateQRCode" class="mt-4">
                          <v-icon left>mdi-refresh</v-icon>

                          {{ $t("app.settings.account.refreshQRCode") }}
                        </v-btn>
                      </div>
                    </div>

                    <!-- QR Code Status -->
                    <div v-if="qrStatusMessage" class="mt-2">
                      <v-alert :type="qrStatusType" variant="tonal" class="text-left">
                        {{ qrStatusMessage }}
                      </v-alert>
                    </div>
                  </div>
                </v-window-item>
              </v-window>
            </div>
          </div>
        </template>

        <!-- 密码管理部分 -->
        <!-- 修改密码表单 (仅登录用户可见) -->
        <v-expansion-panels v-if="isLoggedIn" class="mt-4">
          <v-expansion-panel>
            <v-expansion-panel-title>
              <v-icon left>mdi-key</v-icon>
              {{ $t("app.settings.account.changePassword") }}
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-form @submit.prevent="changePassword">
                <v-text-field v-model="changePasswordForm.currentPassword"
                  :label="$t('app.settings.account.currentPassword')" type="password" density="comfortable"
                  hide-details="auto" class="mb-2" required></v-text-field>

                <v-text-field v-model="changePasswordForm.newPassword" :label="$t('app.settings.account.newPassword')"
                  type="password" density="comfortable" hide-details="auto" class="mb-2" required></v-text-field>

                <v-text-field v-model="changePasswordForm.confirmPassword"
                  :label="$t('app.settings.account.confirmNewPassword')" type="password" density="comfortable"
                  hide-details="auto" class="mb-4" required></v-text-field>

                <div class="password-strength-meter">
                  <div class="password-strength-meter-fill" :class="'password-strength-' + passwordStrength.strength">
                  </div>
                </div>
                <div class="password-hint">
                  {{ passwordStrength.message }}
                </div>

                <v-btn type="submit" color="accent" block :loading="changingPassword">
                  <v-icon left>mdi-key-variant</v-icon>
                  {{ $t("app.settings.account.changePassword") }}
                </v-btn>

                <div v-if="changePasswordError" class="mt-3 text-error">
                  <v-icon small color="error">mdi-alert-circle</v-icon>
                  {{ changePasswordError }}
                </div>
              </v-form>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>

        <!-- 重置密码表单 (未登录用户可见) -->
        <v-expansion-panels v-else-if="showLoginForm" class="mt-4" v-model="resetPasswordPanel">
          <v-expansion-panel value="reset">
            <v-expansion-panel-title>
              <v-icon left>mdi-key-remove</v-icon>
              {{ $t("app.settings.account.resetPassword") }}
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-tabs v-model="resetPasswordTab" grow color="accent" class="mb-2">
                <v-tab value="request">
                  {{ $t("app.settings.account.requestReset") }}
                </v-tab>
                <v-tab value="reset" :disabled="!resetPasswordForm.token">
                  {{ $t("app.settings.account.resetPassword") }}
                </v-tab>
              </v-tabs>

              <v-window v-model="resetPasswordTab">
                <v-window-item value="request">
                  <v-form @submit.prevent="requestPasswordReset">
                    <v-text-field v-model="resetPasswordForm.email" :label="$t('app.settings.account.email')"
                      type="email" density="comfortable" hide-details="auto" class="mb-4" required></v-text-field>

                    <div class="text-center mb-2">
                      <vue-turnstile ref="resetTurnstile" :site-key="TURNSTILE_SITE_KEY"
                        v-model="resetPasswordForm.cf_token" @error="onTurnstileError" @expire="onTurnstileExpire"
                        :language="turnstileLanguage" />
                    </div>

                    <v-btn type="submit" color="accent" block :loading="requestingReset" :disabled="!resetPasswordForm.email || !resetPasswordForm.cf_token
                      ">
                      <v-icon left>mdi-email-fast</v-icon>
                      {{ $t("app.settings.account.sendResetLink") }}
                    </v-btn>
                  </v-form>
                </v-window-item>

                <v-window-item value="reset">
                  <v-form @submit.prevent="resetPassword">
                    <v-text-field v-model="resetPasswordForm.token" :label="$t('app.settings.account.resetToken')"
                      density="comfortable" hide-details="auto" class="mb-2" required @blur="verifyResetToken"
                      readonly></v-text-field>

                    <v-alert v-if="resetTokenValid" type="success" variant="tonal" class="mb-4">
                      {{
                        $t("app.settings.account.tokenValidFor", {
                          username: resetTokenInfo.username,
                        })
                      }}
                    </v-alert>

                    <v-text-field v-model="resetPasswordForm.newPassword"
                      :label="$t('app.settings.account.newPassword')" type="password" density="comfortable"
                      hide-details="auto" class="mb-2" required :disabled="!resetTokenValid"></v-text-field>

                    <v-text-field v-model="resetPasswordForm.confirmPassword"
                      :label="$t('app.settings.account.confirmNewPassword')" type="password" density="comfortable"
                      hide-details="auto" class="mb-4" required :disabled="!resetTokenValid"></v-text-field>

                    <div class="password-strength-meter">
                      <div class="password-strength-meter-fill" :class="'password-strength-' + passwordStrength.strength
                        "></div>
                    </div>
                    <div class="password-hint">
                      {{ passwordStrength.message }}
                    </div>

                    <div class="text-center mb-2">
                      <vue-turnstile ref="resetConfirmTurnstile" :site-key="TURNSTILE_SITE_KEY"
                        v-model="resetPasswordForm.cf_token" @error="onTurnstileError" @expire="onTurnstileExpire"
                        :language="turnstileLanguage" />
                    </div>

                    <v-btn type="submit" color="accent" block :loading="resettingPassword" :disabled="!resetTokenValid || !resetPasswordForm.cf_token
                      ">
                      <v-icon left>mdi-key-plus</v-icon>
                      {{ $t("app.settings.account.resetPassword") }}
                    </v-btn>
                  </v-form>
                </v-window-item>
              </v-window>

              <div v-if="resetPasswordError" class="mt-3 text-error">
                <v-icon small color="error">mdi-alert-circle</v-icon>
                {{ resetPasswordError }}
              </div>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>

        <div v-if="showJumpTip && jumpTip" class="text-center mt-4 jump-tip" v-html="jumpTip"></div>
      </template>
    </v-card-text>
    <v-dialog v-model="overwriteDialog" max-width="400">
      <v-card>
        <v-card-title class="text-h6">
          {{ $t("app.settings.account.overwriteConfirmTitle") }}
        </v-card-title>
        <v-card-text>
          {{
            $t("app.settings.account.overwriteConfirmMessage", {
              slot: selectedSlot,
            })
          }}
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="secondary" @click="overwriteDialog = false">
            {{ $t("app.common.cancel") }}
          </v-btn>
          <v-btn color="accent" @click="confirmUpload">
            {{ $t("app.common.confirm") }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog v-model="confirmDialog" max-width="400">
      <v-card>
        <v-card-title>{{ confirmTitle }}</v-card-title>
        <v-card-text>{{ confirmMessage }}</v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="secondary" @click="confirmDialog = false">
            {{ $t("app.common.cancel") }}
          </v-btn>
          <v-btn color="error" @click="executeClear">
            {{ $t("app.common.confirm") }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog v-model="qrConfirmDialog" max-width="500">
      <v-card>
        <v-card-title class="text-h6">
          {{ $t("app.settings.account.qrLoginConfirmTitle") }}
        </v-card-title>
        <v-card-text>
          <div class="mb-4">
            {{ $t("app.settings.account.qrLoginConfirmMessage") }}
          </div>

          <v-divider class="my-3"></v-divider>

          <div class="device-info">
            <div class="d-flex align-center mb-2">
              <v-icon class="mr-2">mdi-desktop-classic</v-icon>
              <span>{{ qrLoginInfo.device_info }}</span>
            </div>
            <div class="d-flex align-center">
              <v-icon class="mr-2">mdi-ip-network</v-icon>
              <span>{{ qrLoginInfo.ip_address }}</span>
            </div>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="secondary" @click="cancelQRLogin">
            {{ $t("app.common.cancel") }}
          </v-btn>
          <v-btn color="accent" @click="confirmQRLogin" :loading="confirmingQRLogin">
            {{ $t("app.common.confirm") }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <!-- Resend verification dialog -->
    <v-dialog v-model="resendVerificationDialog" max-width="400" @after-leave="resetResendTurnstile" persistent>
      <v-card>
        <v-card-title class="text-h6">
          {{ $t("app.settings.account.resendVerification") }}
        </v-card-title>
        <v-card-text class="pb-0">
          <v-text-field v-model="resendEmailForm.email" :label="$t('app.settings.account.email')" density="comfortable"
            hide-details="auto" class="mb-4" required></v-text-field>

          <!-- Turnstile for resend verification -->
          <div id="resend-turnstile-container" class="text-center"></div>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="secondary" @click="resendVerificationDialog = false" :disabled="resendingVerification">
            {{ $t("app.common.cancel") }}
          </v-btn>
          <v-btn color="accent" @click="resendVerification" :loading="resendingVerification"
            :disabled="resendingVerification || resendVerificationDisabled">
            {{ $t("app.common.submit") }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from "vue";
import { useI18n } from "vue-i18n";
import { i18n } from "@/i18n";
import QrcodeVue from "qrcode.vue";
import jsQR from "jsqr";
import StorageManager from "@/utils/StorageManager";
import VueTurnstile from "vue-turnstile";
import axios from "axios";
import { format } from "date-fns";

// 导入模块化工具函数
import { getApiUrl } from "@/utils/apiEndpoints";
import * as Auth from "@/utils/LoginPanel/auth";
import * as CloudSync from "@/utils/LoginPanel/cloudSync";
import * as ThirdPartyAuth from "@/utils/LoginPanel/thirdPartyAuth";
import * as QRCodeUtils from "@/utils/LoginPanel/qrCode";

// 导入auth store
import { useAuthStore } from "@/store/auth";
import { useEventsStore } from "@/store/events";
const authStore = useAuthStore();
const eventsStore = useEventsStore();

const props = defineProps({
  isLoaded: Boolean,
  jumpTip: String,
  uploadingSettings: Boolean,
  downloadingSettings: Boolean,
  clearingLocal: Boolean,
  clearingCloud: Boolean,
  loggingOutAll: Boolean,
  toast: Object,
  profileLoading: Boolean,
  "onUpdate:profileLoading": Function,
});

const emit = defineEmits([
  "update:uploadingSettings",
  "update:downloadingSettings",
  "update:clearingLocal",
  "update:clearingCloud",
  "update:loggingOutAll",
  "update:user",
  "update:profileLoading",
  "uploadSettings",
  "downloadSettings",
  "clearLocalSettings",
  "clearCloudSettings",
  "logout",
  "logoutAllSessions",
]);

const { t, locale } = useI18n();

// 基础状态
const TURNSTILE_SITE_KEY =
  import.meta.env.VITE_TURNSTILE_SITE_KEY || "0x4AAAAAABfxQUKwtmTmcMcj";
const DOMESTIC_DOMAIN = import.meta.env.VITE_DOMESTIC_DOMAIN;
const INTERNATIONAL_DOMAIN = import.meta.env.VITE_INTERNATIONAL_DOMAIN;

const showJumpTip = computed(() => {
  return (
    locale.value === "zh-Hans" &&
    window.location.hostname === INTERNATIONAL_DOMAIN
  );
});
const isDomestic = computed(() => {
  return window.location.hostname === DOMESTIC_DOMAIN;
});

// 用户登录状态 - 直接从auth store读取
const isLoggedIn = computed(() => authStore.isLoggedIn);
const userInitial = computed(() => {
  if (authStore.user.nickname) {
    return authStore.user.nickname.charAt(0).toUpperCase();
  }
  if (authStore.user.username) {
    return authStore.user.username.charAt(0).toUpperCase();
  }
  return "U";
});

// 获取当前登录用户信息
const currentUser = computed(() => authStore.user);

// 表单切换状态
const showRegisterForm = ref(false);
const avatarLoadError = ref(false);

// 登录表单
const loginForm = ref({ username: "", password: "" });
const loginLoading = ref(false);
const loginError = ref(null);
const loginTurnstileToken = ref(null);
const loginTurnstile = ref(null);
const loginDisabled = ref(false);
let loginDisableTimer = null;

// 注册表单
const registerForm = ref({
  username: "",
  email: "",
  password: "",
  confirmPassword: "",
});
const registerLoading = ref(false);
const registerError = ref(null);
const registerTurnstileToken = ref(null);
const registerTurnstile = ref(null);
const registerDisabled = ref(false);
let registerDisableTimer = null;

// 邮箱重发验证
const resendVerificationDialog = ref(false);
const resendEmailForm = ref({ email: "" });
const resendingVerification = ref(false);
const resendTurnstileToken = ref(null);
const resendVerificationDisabled = ref(false);
let resendVerificationDisableTimer = null;

// 密码管理状态
const changePasswordForm = ref({
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
});
const changingPassword = ref(false);
const changePasswordError = ref(null);

const resetPasswordForm = ref({
  email: "",
  token: "",
  newPassword: "",
  confirmPassword: "",
  cf_token: "",
});
const requestingReset = ref(false);
const resettingPassword = ref(false);
const resetPasswordError = ref(null);
const resetTokenValid = ref(false);
const resetTokenInfo = ref(null);
const resetPasswordPanel = ref([]);
const resetPasswordTab = ref("request");

const turnstileLanguage = computed(() => {
  const lang = locale.value;
  if (lang === "zh-Hans") return "zh-cn";
  if (lang === "zh-Hant") return "zh-tw";
  return lang;
});

// 清除数据确认
const confirmDialog = ref(false);
const confirmTitle = ref("");
const confirmMessage = ref("");
const pendingClearAction = ref(null);

// 登出所有会话
const logoutAllDialog = ref(false);

// QQ登录状态
const qqLoginLoading = ref(false);
const qqCallbackLoading = ref(false);
const qqCallbackError = ref(null);
const qqLoginCooldown = ref(false);
let qqLoginCooldownTimer = null;

// 微软登录状态
const microsoftLoginLoading = ref(false);
const microsoftCallbackLoading = ref(false);
const microsoftCallbackError = ref(null);
const microsoftLoginCooldown = ref(false);
let microsoftLoginCooldownTimer = null;

// QR Code Login
const loginTab = ref("password");
const qrSession = ref(null);
const generatingQRCode = ref(false);
const scanningQRCode = ref(false);
const qrStatusMessage = ref(null);
const qrStatusType = ref("info");
const qrCheckInterval = ref(null);
const qrExpiresIn = ref(5);

// 扫码返回的用户信息（当远端扫描设备扫码后可能返回）
const scannedUserInfo = ref(null);

// QR扫码相关状态
const qrVideo = ref(null);
const qrCanvas = ref(null);
const qrCanvasContext = ref(null);
const qrStream = ref(null);
const qrLoading = ref(false);
const qrError = ref(null);

// Activity status 最后更新时间
const activityStatusLastUpdated = ref(null);

// 更新activity status最后更新时间
function updateActivityStatusLastUpdated() {
  activityStatusLastUpdated.value = formatDate(StorageManager.get('activityStatusLastUpdated'));
}

const qrLogoConfig = {
  src: "/assets/images/logo-256.png",
  height: 30,
  width: 30,
  excavate: true,
};

const scannedUserInitial = computed(() => {
  const info = scannedUserInfo.value;
  if (!info) return "U";
  if (info.nickname) return info.nickname.charAt(0).toUpperCase();
  if (info.username) return info.username.charAt(0).toUpperCase();
  if (info.name) return info.name.charAt(0).toUpperCase();
  return "U";
});

// 检测是否为移动设备
const isMobile = computed(() => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
});

// 密码强度检查
const checkPasswordStrength = (password) => {
  if (!password) return { strength: 0, message: "" };

  let strength = 0;
  let messages = [];

  // 长度检查
  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;

  // 字符多样性检查
  if (/[A-Z]/.test(password)) strength++;
  if (/[a-z]/.test(password)) strength++;
  if (/\d/.test(password)) strength++;
  if (/[^A-Za-z0-9]/.test(password)) strength++;

  // 生成提示消息
  if (password.length < 8) {
    messages.push(t("app.settings.account.passwordTooShort"));
  }
  if (!/[A-Z]/.test(password)) {
    messages.push(t("app.settings.account.passwordNoUpper"));
  }
  if (!/[a-z]/.test(password)) {
    messages.push(t("app.settings.account.passwordNoLower"));
  }
  if (!/\d/.test(password)) {
    messages.push(t("app.settings.account.passwordNoNumber"));
  }

  let strengthLevel;
  if (strength <= 3) {
    strengthLevel = "weak";
  } else if (strength <= 6) {
    strengthLevel = "medium";
  } else {
    strengthLevel = "strong";
  }

  return {
    strength: strengthLevel,
    message:
      messages.length > 0
        ? messages.join(" - ")
        : t("app.settings.account.passwordStrong"),
  };
};

const passwordStrength = computed(() => {
  const password =
    resetPasswordTab.value === "reset"
      ? resetPasswordForm.value.newPassword
      : changePasswordForm.value.newPassword;
  return checkPasswordStrength(password);
});

// 修改密码方法
const changePassword = async () => {
  changingPassword.value = true;
  changePasswordError.value = null;

  try {
    // 检查字段是否为空
    if (!changePasswordForm.value.currentPassword) {
      throw new Error(t("app.settings.account.currentPasswordRequired"));
    }
    if (!changePasswordForm.value.newPassword) {
      throw new Error(t("app.settings.account.newPasswordRequired"));
    }
    if (!changePasswordForm.value.confirmPassword) {
      throw new Error(t("app.settings.account.confirmPasswordRequired"));
    }

    if (
      changePasswordForm.value.newPassword !==
      changePasswordForm.value.confirmPassword
    ) {
      throw new Error(t("app.settings.account.passwordMismatch"));
    }

    const response = await axios.post(
      getApiUrl("CHANGE_PASSWORD"),
      {
        current_password: changePasswordForm.value.currentPassword,
        new_password: changePasswordForm.value.newPassword,
      },
      {
        headers: {
          Authorization: `Bearer ${StorageManager.get("auth_token")}`,
        },
      }
    );

    if (response.data.code === 200) {
      props.toast.showToast(
        t("app.settings.account.passwordChangedSuccess"),
        "success"
      );
      changePasswordForm.value = {
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      };
    } else {
      const error = new Error(response.data.message);
      error.code = response.data.error_code;
      throw error;
    }
  } catch (error) {
    changePasswordError.value = handleError(
      error,
      t("app.settings.account.changePasswordFailed")
    );
  } finally {
    changingPassword.value = false;
  }
};

const resetTurnstile = ref(null);
const resetConfirmTurnstile = ref(null);

// 请求密码重置方法
const requestPasswordReset = async () => {
  requestingReset.value = true;
  resetPasswordError.value = null;

  try {
    if (!resetPasswordForm.value.email) {
      throw new Error(t("app.settings.account.emailRequired"));
    }

    if (!resetPasswordForm.value.cf_token) {
      throw new Error(t("app.settings.account.turnstileError"));
    }

    const response = await axios.post(getApiUrl("REQUEST_PASSWORD_RESET"), {
      email: resetPasswordForm.value.email,
      cf_token: resetPasswordForm.value.cf_token,
    });

    if (response.data.code === 200) {
      props.toast.showToast(
        t("app.settings.account.resetEmailSent"),
        "success"
      );

      // Reset form and Turnstile after successful request
      resetPasswordForm.value.email = "";
      if (resetTurnstile.value) {
        resetTurnstile.value.reset();
        resetPasswordForm.value.cf_token = null;
      }

      // Switch to reset tab if token is returned
      if (response.data.data?.token) {
        resetPasswordForm.value.token = response.data.data.token;
        resetPasswordTab.value = "reset";
      }
    } else {
      const error = new Error(response.data.message);
      error.code = response.data.error_code;
      throw error;
    }
  } catch (error) {
    resetPasswordError.value = handleError(
      error,
      t("app.settings.account.resetRequestFailed")
    );

    // Reset Turnstile on error
    if (resetTurnstile.value) {
      resetTurnstile.value.reset();
      resetPasswordForm.value.cf_token = null;
    }
  } finally {
    requestingReset.value = false;
  }
};

// 验证重置令牌方法
const verifyResetToken = async () => {
  try {
    const response = await axios.get(getApiUrl("VERIFY_RESET_TOKEN"), {
      params: {
        token: resetPasswordForm.value.token,
      },
    });

    if (response.data.code === 200) {
      resetTokenValid.value = true;
      resetTokenInfo.value = response.data.data;
    } else {
      const error = new Error(response.data.message);
      error.code = response.data.error_code;
      throw error;
    }
  } catch (error) {
    resetTokenValid.value = false;
    resetPasswordError.value = handleError(
      error,
      t("app.settings.account.invalidResetToken")
    );
  }
};

// 执行密码重置方法
const resetPassword = async () => {
  resettingPassword.value = true;
  resetPasswordError.value = null;

  try {
    // 检查字段是否为空
    if (!resetPasswordForm.value.newPassword) {
      throw new Error(t("app.settings.account.newPasswordRequired"));
    }
    if (!resetPasswordForm.value.confirmPassword) {
      throw new Error(t("app.settings.account.confirmPasswordRequired"));
    }

    if (
      resetPasswordForm.value.newPassword !==
      resetPasswordForm.value.confirmPassword
    ) {
      throw new Error(t("app.settings.account.passwordMismatch"));
    }

    const response = await axios.post(getApiUrl("RESET_PASSWORD"), {
      token: resetPasswordForm.value.token,
      new_password: resetPasswordForm.value.newPassword,
      cf_token: resetPasswordForm.value.cf_token,
    });

    if (response.data.code === 200) {
      // 重置成功后清除URL中的reset_token参数
      const urlParams = new URLSearchParams(window.location.search);
      urlParams.delete("reset_token");
      const newUrl = urlParams.toString()
        ? `${window.location.pathname}?${urlParams.toString()}`
        : window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);

      props.toast.showToast(
        t("app.settings.account.passwordResetSuccess"),
        "success"
      );
      // 重置表单和Turnstile
      resetPasswordForm.value = {
        email: "",
        token: "",
        newPassword: "",
        confirmPassword: "",
        cf_token: "",
      };
      resetTokenValid.value = false;

      // 重置Turnstile验证
      if (resetTurnstile.value) {
        resetTurnstile.value.reset();
      }
      if (resetConfirmTurnstile.value) {
        resetConfirmTurnstile.value.reset();
      }
    } else {
      const error = new Error(response.data.message);
      error.code = response.data.error_code;
      throw error;
    }
  } catch (error) {
    resetPasswordError.value = handleError(
      error,
      t("app.settings.account.resetPasswordFailed")
    );

    // 出错时也重置Turnstile
    if (resetTurnstile.value) {
      resetTurnstile.value.reset();
    }
    if (resetConfirmTurnstile.value) {
      resetConfirmTurnstile.value.reset();
    }
  } finally {
    resettingPassword.value = false;
  }
};

const confirmLogoutAll = () => {
  logoutAllDialog.value = true;
};

// Turnstile 事件处理
const onTurnstileError = () => {
  loginTurnstileToken.value = null;
  registerTurnstileToken.value = null;
  resetPasswordForm.value.cf_token = null;
};

const onTurnstileExpire = () => {
  loginTurnstileToken.value = null;
  registerTurnstileToken.value = null;
  resetPasswordForm.value.cf_token = null;
};

const showResendVerification = () => {
  resendEmailForm.value.email = registerForm.value.email || "";
  resendVerificationDialog.value = true;
};

const loadTurnstileScript = () => {
  return new Promise((resolve) => {
    if (window.turnstile) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
    script.async = true;
    script.defer = true;
    script.onload = resolve;
    document.head.appendChild(script);
  });
};

// 监听表单切换，重置错误信息
watch(showRegisterForm, () => {
  loginError.value = null;
  registerError.value = null;
  if (loginTurnstile.value) {
    loginTurnstile.value.reset();
    loginTurnstileToken.value = null;
  }
  if (registerTurnstile.value) {
    registerTurnstile.value.reset();
    registerTurnstileToken.value = null;
  }
});

watch(
  () => currentUser.value.avatar,
  () => {
    avatarLoadError.value = false;
  }
);

// 登录方法
const login = async () => {
  loginDisabled.value = false;
  if (loginDisableTimer) clearTimeout(loginDisableTimer);

  loginLoading.value = true;
  loginError.value = null;

  if (!loginForm.value.username || !loginForm.value.password) {
    loginError.value = t("app.settings.account.fillAllFields");
    loginLoading.value = false;
    return;
  }

  if (!loginTurnstileToken.value) {
    loginError.value = t("app.settings.account.turnstileError");
    loginLoading.value = false;
    return;
  }

  try {
    const success = await Auth.login(
      loginForm.value,
      loginTurnstileToken.value,
      props.toast,
      t,
      emit
    );

    if (success) {
      loginForm.value = { username: "", password: "" };
    }
  } catch (error) {
    loginError.value = handleError(
      error,
      t("app.settings.account.loginFailed")
    );
    if (loginTurnstile.value) {
      loginTurnstile.value.reset();
      loginTurnstileToken.value = null;
    }
  } finally {
    loginDisabled.value = true;
    loginDisableTimer = setTimeout(() => {
      loginDisabled.value = false;
    }, 10000);

    loginLoading.value = false;
    if (loginTurnstile.value) {
      loginTurnstile.value.reset();
      loginTurnstileToken.value = null;
    }
  }
};

// 登出方法
const logout = async () => {
  try {
    await Auth.logout(emit, props.toast, t);
  } catch (error) {
    props.toast.showToast(
      handleError(error, t("app.settings.account.logoutFailed")),
      "error"
    );
  }
};

// 登出所有会话
const logoutAllSessions = async () => {
  emit("update:loggingOutAll", true);

  try {
    await Auth.logoutAllSessions(emit, props.toast, t);
  } catch (error) {
    props.toast.showToast(
      handleError(error, t("app.settings.account.logoutAllFailed")),
      "error"
    );
  } finally {
    emit("update:loggingOutAll", false);
    logoutAllDialog.value = false;
  }
};

// 注册方法
const register = async () => {
  registerDisabled.value = false;
  if (registerDisableTimer) clearTimeout(registerDisableTimer);

  registerLoading.value = true;
  registerError.value = null;

  // 验证表单
  if (
    !registerForm.value.username ||
    !registerForm.value.email ||
    !registerForm.value.password ||
    !registerForm.value.confirmPassword
  ) {
    registerError.value = t("app.settings.account.fillAllFields");
    registerLoading.value = false;
    return;
  }

  if (registerForm.value.password !== registerForm.value.confirmPassword) {
    registerError.value = t("app.settings.account.passwordMismatch");
    registerLoading.value = false;
    return;
  }

  if (!registerTurnstileToken.value) {
    registerError.value = t("app.settings.account.turnstileError");
    registerLoading.value = false;
    return;
  }

  try {
    const success = await Auth.registerUser(
      registerForm.value,
      registerTurnstileToken.value,
      props.toast,
      t
    );

    if (success) {
      registerDisabled.value = true;
      registerDisableTimer = setTimeout(() => {
        registerDisabled.value = false;
      }, 30000);

      showRegisterForm.value = false;
      // 重置表单
      registerForm.value = {
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
      };
    }
  } catch (error) {
    registerDisabled.value = true;
    registerDisableTimer = setTimeout(() => {
      registerDisabled.value = false;
    }, 10000);
    registerError.value = handleError(
      error,
      t("app.settings.account.registerFailed")
    );
    if (registerTurnstile.value) {
      registerTurnstile.value.reset();
      registerTurnstileToken.value = null;
    }
  } finally {
    registerLoading.value = false;
    if (registerTurnstile.value) {
      registerTurnstile.value.reset();
      registerTurnstileToken.value = null;
    }
  }
};

// 邮箱验证
const verifyEmail = async () => {
  try {
    await Auth.verifyEmail(props.toast, t);
  } catch (error) {
    // 添加toast对象的空值检查
    if (props.toast) {
      props.toast.showToast(
        handleError(error, t("app.settings.account.emailVerifiedFailed")),
        "error"
      );
    } else {
      console.error("Email verification error:", error);
    }
  }
};

// 重发验证邮件
const resendVerification = async () => {
  resendVerificationDisabled.value = false;
  if (resendVerificationDisableTimer)
    clearTimeout(resendVerificationDisableTimer);

  resendingVerification.value = true;

  try {
    const success = await Auth.resendVerification(
      resendEmailForm.value.email,
      resendTurnstileToken.value,
      props.toast,
      t
    );

    if (success) {
      resendVerificationDialog.value = false;
      resendVerificationDisabled.value = true;
      resendVerificationDisableTimer = setTimeout(() => {
        resendVerificationDisabled.value = false;
      }, 30000);
      // 重置表单和Turnstile
      resetResendForm();
    }
  } catch (error) {
    resetResendTurnstile();
    resendVerificationDisabled.value = true;
    resendVerificationDisableTimer = setTimeout(() => {
      resendVerificationDisabled.value = false;
    }, 10000);
    props.toast.showToast(
      handleError(error, t("app.settings.account.resendFailed")),
      "error"
    );
  } finally {
    resendingVerification.value = false;
  }
};

const resetResendForm = () => {
  resendEmailForm.value.email = "";
  resetResendTurnstile();

  nextTick(() => {
    renderResendTurnstile();
  });
};

const resetResendTurnstile = () => {
  resendTurnstileToken.value = null;

  if (turnstileWidgetId && window.turnstile) {
    try {
      window.turnstile.reset(turnstileWidgetId);
    } catch (e) {
      console.error("Failed to reset Turnstile:", e);
      renderResendTurnstile();
    }
  } else {
    renderResendTurnstile();
  }
};

// 新增状态变量
const selectedSlot = ref(1);
const slotMetadata = computed(() => {
  if (!currentUser.value.settings_metadata) return null;

  const slotKey = `slot_${selectedSlot.value}`;
  const updatedAtUTC = currentUser.value.settings_metadata[slotKey];
  const isSlotEmpty = !updatedAtUTC;

  // 将UTC时间转换为本地时间
  let localUpdatedAt = null;
  if (updatedAtUTC) {
    try {
      const utcDate = new Date(updatedAtUTC);
      localUpdatedAt = new Date(
        utcDate.getTime() - utcDate.getTimezoneOffset() * 60000
      );
    } catch (e) {
      console.error("Failed to parse date:", updatedAtUTC, e);
      localUpdatedAt = null;
    }
  }

  return {
    updatedAt: localUpdatedAt,
    lastUpdatedLabel: i18n.global.t("app.settings.account.lastUpdated"),
    isEmpty: isSlotEmpty,
  };
});

// 计算属性 - 检查槽位是否为空
const isSlotEmpty = computed(
  () => !slotMetadata.value || slotMetadata.value.isEmpty
);

const formatDate = (dateObj) => {
  if (!dateObj) return "";
  return format(dateObj, "yyyy-MM-dd HH:mm:ss");
};

// 在script部分添加新的状态和方法
const overwriteDialog = ref(false);

// 检查是否已有更新记录
const checkBeforeUpload = async () => {
  if (isSlotEmpty.value) {
    // 如果槽位为空，直接上传
    await uploadSettings();
  } else {
    // 如果槽位不为空，显示确认对话框
    overwriteDialog.value = true;
  }
};

// 确认上传
const confirmUpload = async () => {
  overwriteDialog.value = false;
  await uploadSettings();
};

// 修改原有的uploadSettings方法，移除对话框逻辑
const uploadSettings = async () => {
  emit("update:uploadingSettings", true);
  try {
    const result = await CloudSync.uploadSettings(
      selectedSlot.value,
      emit,
      props.toast,
      t
    );

    // 更新成功后获取最新用户资料
    await Auth.fetchUserProfile(emit, props.toast, t);
  } catch (error) {
    props.toast.showToast(
      handleError(error, t("app.settings.account.uploadFailed")),
      "error"
    );
  } finally {
    emit("update:uploadingSettings", false);
  }
};

// 添加确认覆盖本地数据的弹窗状态
const confirmOverwriteLocalDialog = ref(false);

const downloadSettings = async () => {
  // 获取本地数据的最后更新时间
  const localLastUpdated = StorageManager.get('activityStatusLastUpdated');
  const localLastUpdatedTime = localLastUpdated ? new Date(localLastUpdated).getTime() : 0;
  
  // 获取云端数据的最后更新时间（从auth store中）
  const cloudLastUpdated = currentUser.value.settings_metadata?.[`slot_${selectedSlot.value}`];
  const cloudLastUpdatedTime = cloudLastUpdated ? new Date(cloudLastUpdated).getTime() : 0;
  
  // 如果本地有数据且本地数据比云端新，则显示确认覆盖弹窗
  if (localLastUpdatedTime > 0 && localLastUpdatedTime > cloudLastUpdatedTime) {
    confirmOverwriteLocalDialog.value = true;
    return;
  }
  
  // 如果本地没有数据或本地数据比云端旧，则直接下载
  await performDownloadSettings();
};

const performDownloadSettings = async () => {
  emit("update:downloadingSettings", true);
  try {
    await CloudSync.downloadSettings(
      selectedSlot.value, // 添加槽位参数
      emit,
      props.toast,
      t
    );

    // 清除 store 中的活动数据
    eventsStore.clearAll();

    // props.toast.showToast(
    //   t("app.settings.account.downloadSuccess", { slot: selectedSlot.value }),
    //   "success"
    // );
  } catch (error) {
    // props.toast.showToast(
    //   error.message || t("app.settings.account.downloadFailed"),
    //   "error"
    // );
  } finally {
    emit("update:downloadingSettings", false);
  }
};

// 确认覆盖本地数据
const confirmOverwriteLocal = async () => {
  confirmOverwriteLocalDialog.value = false;
  await performDownloadSettings();
};

const clearCloudSettings = async (slot) => {
  emit("update:clearingCloud", true);
  try {
    await CloudSync.clearCloudSettings(
      selectedSlot.value, // 添加槽位参数
      emit,
      props.toast,
      t
    );

    // 清除成功后获取最新用户资料
    await Auth.fetchUserProfile(emit, props.toast, t);

    props.toast.showToast(
      t("app.settings.account.clearCloudSuccess", { slot: selectedSlot.value }),
      "success"
    );
  } catch (error) {
    props.toast.showToast(
      handleError(error, t("app.settings.account.clearCloudFailed")),
      "error"
    );
  } finally {
    emit("update:clearingCloud", false);
  }
};

// 修改确认弹窗处理
const confirmClearCloud = () => {
  confirmTitle.value = t("app.settings.account.clearCloudConfirmTitle");
  confirmMessage.value = t("app.settings.account.clearCloudConfirmMessage", {
    slot: selectedSlot.value,
  });
  pendingClearAction.value = "cloud";
  confirmDialog.value = true;
};

// 第三方登录方法
const loginWithQQ = async () => {
  qqLoginLoading.value = true;
  try {
    await ThirdPartyAuth.loginWithQQ(props.toast, t);
  } catch (error) {
    props.toast.showToast(
      handleError(error, t("app.settings.account.qqLoginError")),
      "error"
    );
  } finally {
    startQQLoginCooldown();
    qqLoginLoading.value = false;
  }
};

const handleQQCallback = async (code, state) => {
  qqCallbackLoading.value = true;
  window.history.replaceState({}, document.title, window.location.pathname);

  try {
    const success = await ThirdPartyAuth.handleQQCallback(
      code,
      state,
      emit,
      props.toast,
      t
    );

    if (success) {
      await Auth.fetchUserProfile(emit, props.toast, t);
    }
  } catch (error) {
    qqCallbackError.value = handleError(
      error,
      t("app.settings.account.qqCallbackError")
    );
    props.toast?.showToast(
      handleError(error, t("app.settings.account.qqCallbackError")),
      "error"
    );
  } finally {
    qqCallbackLoading.value = false;
  }
};

const startQQLoginCooldown = () => {
  qqLoginCooldown.value = true;

  if (qqLoginCooldownTimer) clearTimeout(qqLoginCooldownTimer);

  qqLoginCooldownTimer = setTimeout(() => {
    qqLoginCooldown.value = false;
  }, 10000);
};

const loginWithMicrosoft = async () => {
  microsoftLoginLoading.value = true;
  try {
    await ThirdPartyAuth.loginWithMicrosoft(props.toast, t);
  } catch (error) {
    props.toast.showToast(
      handleError(error, t("app.settings.account.microsoftLoginError")),
      "error"
    );
  } finally {
    startMicrosoftLoginCooldown();
    microsoftLoginLoading.value = false;
  }
};

const handleMicrosoftCallback = async (code, state) => {
  microsoftCallbackLoading.value = true;
  window.history.replaceState({}, document.title, window.location.pathname);

  try {
    const success = await ThirdPartyAuth.handleMicrosoftCallback(
      code,
      state,
      emit,
      props.toast,
      t
    );

    if (success) {
      await Auth.fetchUserProfile(emit, props.toast, t);
    }
  } catch (error) {
    microsoftCallbackError.value = handleError(
      error,
      t("app.settings.account.microsoftCallbackError")
    );
    props.toast?.showToast(
      handleError(error, t("app.settings.account.microsoftCallbackError")),
      "error"
    );
  } finally {
    microsoftCallbackLoading.value = false;
  }
};

const startMicrosoftLoginCooldown = () => {
  microsoftLoginCooldown.value = true;

  if (microsoftLoginCooldownTimer) clearTimeout(microsoftLoginCooldownTimer);

  microsoftLoginCooldownTimer = setTimeout(() => {
    microsoftLoginCooldown.value = false;
  }, 10000);
};

// QR Code 相关方法
const generateQRCode = async () => {
  generatingQRCode.value = true;
  qrStatusMessage.value = null;
  // 当生成新的二维码时清除之前的扫码用户信息
  scannedUserInfo.value = null;
  try {
    qrSession.value = await QRCodeUtils.generateQRCode(props.toast, t);
    startQRCodeCheck();
  } catch (error) {
    qrStatusMessage.value = handleError(
      error,
      t("app.settings.account.qrGenerationFailed")
    );
    qrStatusType.value = "error";
  } finally {
    generatingQRCode.value = false;
  }
};

const startQRScanner = async () => {
  scanningQRCode.value = true;
  qrLoading.value = true;
  qrError.value = null;

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: "environment",
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
    });

    qrStream.value = stream;

    // Wait for the next tick to ensure DOM is updated
    await nextTick();

    if (qrVideo.value) {
      qrVideo.value.srcObject = stream;
      // Add event listener to handle when video is ready
      await new Promise((resolve) => {
        qrVideo.value.onloadedmetadata = () => {
          qrVideo.value.play().then(resolve).catch(console.error);
        };
      });
    }

    if (qrCanvas.value) {
      qrCanvas.value.width = qrVideo.value.videoWidth;
      qrCanvas.value.height = qrVideo.value.videoHeight;
      qrCanvasContext.value = qrCanvas.value.getContext("2d", {
        willReadFrequently: true,
      });
    }

    qrLoading.value = false;
    scanQRCode();
  } catch (error) {
    console.error("QR scanner error:", error);
    qrError.value = error.message || t("app.settings.account.qrScannerError");
    scanningQRCode.value = false;
    qrLoading.value = false;

    // 3秒后自动重试
    setTimeout(() => {
      qrError.value = null;
      startQRScanner();
    }, 3000);
  }
};

const scanQRCode = () => {
  if (!scanningQRCode.value || !qrVideo.value || !qrCanvasContext.value) return;

  try {
    qrCanvasContext.value.drawImage(
      qrVideo.value,
      0,
      0,
      qrCanvas.value.width,
      qrCanvas.value.height
    );

    const imageData = qrCanvasContext.value.getImageData(
      0,
      0,
      qrCanvas.value.width,
      qrCanvas.value.height
    );

    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: "dontInvert",
    });

    if (code) {
      QRCodeUtils.drawQRCodeBoundingBox(
        qrCanvasContext.value,
        qrCanvas.value,
        qrVideo.value,
        code
      );

      if (code.data) {
        handleScannedQRCode(code.data);
      }
    }

    requestAnimationFrame(scanQRCode);
  } catch (error) {
    console.error("QR scan error:", error);
    stopQRScanner();
    // scanningQRCode.value = false;
    
    // 如果是IndexSizeError，使用toast显示错误
    if (error.name === 'IndexSizeError') {
      props.toast?.showToast(
        t("app.settings.account.qrScanError"),
        "error"
      );
    } else {
      qrStatusMessage.value = t("app.settings.account.qrScanError");
      qrStatusType.value = "error";
    }
  }
};

const stopQRScanner = () => {
  scanningQRCode.value = false;
  if (qrStream.value) {
    qrStream.value.getTracks().forEach((track) => {
      track.stop();
    });
    qrStream.value = null;
  }
  if (qrVideo.value) {
    qrVideo.value.srcObject = null;
  }
  if (qrCanvasContext.value) {
    qrCanvasContext.value.clearRect(
      0,
      0,
      qrCanvas.value?.width || 0,
      qrCanvas.value?.height || 0
    );
  }
};

const qrConfirmDialog = ref(false);
const confirmingQRLogin = ref(false);
const currentQRSessionId = ref(null);

const qrLoginInfo = ref({
  device_info: "",
  ip_address: "",
});

// 修改handleScannedQRCode方法
const handleScannedQRCode = async (qrCode) => {
  let invalidQr;
  try {
    console.log("Scanned QR code:", qrCode);
    let urlObj;
    try {
      urlObj = new URL(qrCode);
    } catch (e) {
      throw new Error(t("app.settings.account.invalidQRCode"));
    }

    const qr_code = urlObj.searchParams.get("qr_code");
    const sessionId = urlObj.searchParams.get("qr_session_id");

    if (!qr_code && !sessionId) {
      invalidQr = true;
      throw new Error(t("app.settings.account.invalidQRCode"));
    }

    stopQRScanner();
    qrLoading.value = true;

    // 获取当前用户的auth token（如果已登录）
    const authToken = StorageManager.get("auth_token");

    const requestData = {
      qr_code: qr_code,
      session_id: sessionId
    };

    // 如果用户已登录，添加auth token到请求头
    const config = authToken ? {
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    } : {};

    const response = await axios.post(
      getApiUrl("QR_SCAN"),
      requestData,
      config
    );

    qrLoading.value = false;

    if (response.data.code === 200) {
      props.toast.showToast(
        t("app.settings.account.qrCodeScannedSuccess"),
        "success"
      );
      qrError.value = null;

      // 保存sessionId和设备信息
      currentQRSessionId.value = sessionId;
      qrLoginInfo.value = {
        device_info: response.data.data.device_info || "-",
        ip_address: response.data.data.ip_address || "-",
      };

      qrConfirmDialog.value = true;
    } else {
      setTimeout(() => {
        qrLoading.value = false;
        qrError.value = null;
        startQRScanner();
      }, 5000);
      throw new Error(
        response.data.message || t("app.settings.account.qrCodeScanFailed")
      );
    }
  } catch (error) {
    console.error("Handle scanned QR code error:", error);
    qrLoading.value = false;

    // 处理错误显示
    if (!invalidQr) {
      qrError.value =
        error.message || t("app.settings.account.qrCodeScanFailed");
    }

    // 在canvas上绘制错误信息
    if (qrCanvasContext.value) {
      const canvas = qrCanvas.value;
      const ctx = qrCanvasContext.value;

      // 设置文本样式
      ctx.fillStyle = "#FF3B58";
      ctx.font = "60px bold";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // 绘制错误文本
      const errorMessage =
        error.message || t("app.settings.account.qrCodeScanFailed");
      const lines = errorMessage.split("\n");
      const lineHeight = 30;
      const startY = 150;

      // 计算文本的宽度和高度
      ctx.font = "60px bold";
      const maxLineWidth = Math.max(
        ...lines.map((line) => ctx.measureText(line).width)
      );
      const totalHeight = lines.length * lineHeight;

      // 设置背景样式
      const padding = 40;
      const borderRadius = 16;

      // 绘制半透明灰色圆角矩形背景
      ctx.beginPath();
      ctx.roundRect(
        canvas.width / 2 - maxLineWidth / 2 - padding,
        startY - lineHeight - padding / 2,
        maxLineWidth + padding * 2,
        totalHeight + padding + 40,
        borderRadius
      );
      ctx.fillStyle = "rgba(128, 128, 128, 0.7)";
      ctx.fill();

      // 绘制文本
      lines.forEach((line, index) => {
        ctx.fillStyle = "#FF3B58";
        ctx.fillText(line, canvas.width / 2, startY + index * lineHeight);
      });
    }

    // 5秒后自动恢复扫描
    // console.log("invalidQr:", invalidQr);
    if (!invalidQr) {
      setTimeout(() => {
        qrLoading.value = false;
        qrError.value = null;
        startQRScanner();
      }, 5000);
    }
  }
};

// 添加确认登录方法
const confirmQRLogin = async () => {
  confirmingQRLogin.value = true;
  try {
    await QRCodeUtils.confirmQRLogin(currentQRSessionId.value, props.toast, t);
    qrConfirmDialog.value = false;

    // 如果用户已经登录，可以直接获取用户资料
    const token = StorageManager.get("auth_token");
    if (token) {
      await Auth.fetchUserProfile(emit, props.toast, t);
    }
  } catch (error) {
    props.toast.showToast(
      handleError(error, t("app.settings.account.qrConfirmFailed")),
      "error"
    );
  } finally {
    confirmingQRLogin.value = false;
  }
};

const resetQRLoginInfo = () => {
  qrLoginInfo.value = {
    device_info: "",
    ip_address: "",
  };
};

// 修改cancelQRLogin方法
const cancelQRLogin = () => {
  qrConfirmDialog.value = false;
  resetQRLoginInfo();
  currentQRSessionId.value = null;
  startQRScanner();
};

// 清除数据相关方法
const confirmClearLocal = () => {
  confirmTitle.value = t("app.settings.account.clearLocalConfirmTitle");
  confirmMessage.value = t("app.settings.account.clearLocalConfirmMessage");
  pendingClearAction.value = "local";
  confirmDialog.value = true;
};

const executeClear = async () => {
  confirmDialog.value = false;

  if (pendingClearAction.value === "local") {
    emit("clearLocalSettings");
  } else if (pendingClearAction.value === "cloud") {
    try {
      emit("update:clearingCloud", true);
      await CloudSync.clearCloudSettings(
        selectedSlot.value, // 使用当前选中的槽位
        emit,
        props.toast,
        t
      );

      // 清除成功后获取最新用户资料以更新UI
      await Auth.fetchUserProfile(emit, props.toast, t);
    } catch (error) {
      props.toast.showToast(
        handleError(error, t("app.settings.account.clearCloudFailed")),
        "error"
      );
    } finally {
      emit("update:clearingCloud", false);
    }
  }

  pendingClearAction.value = null;
};

// 在data部分添加
const showLoginForm = ref(false);

// 添加方法
const toggleLoginForm = () => {
  showLoginForm.value = !showLoginForm.value;
  // 重置表单状态
  if (!showLoginForm.value) {
    loginError.value = null;
    registerError.value = null;
    if (loginTurnstile.value) {
      loginTurnstile.value.reset();
      loginTurnstileToken.value = null;
    }
    if (registerTurnstile.value) {
      registerTurnstile.value.reset();
      registerTurnstileToken.value = null;
    }
  }
};

const qrCheckActive = ref(false);
const qrRemainingSeconds = ref(60);
let qrCountdownInterval = null;

const startQRCodeCheck = () => {
  // 先清除已有的定时器
  stopQRCodeCheck();

  // 设置新的定时器
  // qrCheckInterval.value = setInterval(checkQRCodeStatus, 5000);

  // 重置倒计时
  qrRemainingSeconds.value = 60;
  qrCheckActive.value = true;

  // 设置状态检查定时器
  qrCheckInterval.value = setInterval(checkQRCodeStatus, 3000);

  // 设置倒计时定时器
  qrCountdownInterval = setInterval(() => {
    qrRemainingSeconds.value -= 1;

    if (qrRemainingSeconds.value <= 0) {
      stopQRCodeCheck();
      qrStatusMessage.value = t("app.settings.account.qrCodeExpired");
      qrStatusType.value = "error";
      qrSession.value = null;
    }
  }, 1000);
};

const stopQRCodeCheck = () => {
  if (qrCheckInterval.value) {
    clearInterval(qrCheckInterval.value);
    qrCheckInterval.value = null;
  }
  if (qrCountdownInterval) {
    clearInterval(qrCountdownInterval);
    qrCountdownInterval = null;
  }
  qrCheckActive.value = false;
  // 停止检查时清除临时扫码用户信息
  scannedUserInfo.value = null;
};

const checkQRCodeStatus = async () => {
  if (!qrSession.value) return;

  try {
    const data = await QRCodeUtils.checkQRCodeStatus(
      qrSession.value.session_id,
      props.toast,
      t
    );

    handleQRStatusUpdate(data);
  } catch (error) {
    handleQRStatusError(error);
  }
};

const handleQRStatusUpdate = (data) => {
  const status = data.status;
  // 如果后端返回了 user_info 且状态为 scanned，保留 user info 用于展示
  if (status === "scanned" && data.user_info) {
    scannedUserInfo.value = data.user_info;
  }
  if (status === "scanned") {
    qrStatusMessage.value = t("app.settings.account.qrCodeScanned");
    qrStatusType.value = "success";
  } else if (status === "confirmed") {
    qrStatusMessage.value = t("app.settings.account.qrCodeConfirmed");
    qrStatusType.value = "success";
    stopQRCodeCheck();
    handleQRLoginSuccess(data.token);
  } else if (status === "expired") {
    qrStatusMessage.value = t("app.settings.account.qrCodeExpired");
    qrStatusType.value = "error";
    qrSession.value = null;
    // 过期时清除扫码用户信息
    scannedUserInfo.value = null;
    stopQRCodeCheck();
  }
};

const handleQRStatusError = (error) => {
  console.error("Check QR code status error:", error);
  if (error.response?.status === 404) {
    qrStatusMessage.value = t("app.settings.account.qrSessionNotFound");
    qrStatusType.value = "error";
    qrSession.value = null;
    stopQRCodeCheck();
  }
};

const handleQRLoginSuccess = async (token) => {
  if (token) {
    StorageManager.set("auth_token", token);
    await Auth.fetchUserProfile(emit, props.toast, t);
    props.toast.showToast(t("app.settings.account.loginSuccess"), "success");
  }
};

watch(isLoggedIn, (newVal, oldVal) => {
  if (!newVal && oldVal && showLoginForm.value) {
    generateQRCode();
  }
});

const renderResendTurnstile = async () => {
  await loadTurnstileScript();

  const container = document.getElementById("resend-turnstile-container");
  if (!container || !window.turnstile) return;

  container.innerHTML = "";

  window.turnstileWidgetId = window.turnstile.render(container, {
    sitekey: TURNSTILE_SITE_KEY,
    language: turnstileLanguage.value,
    callback: (token) => {
      resendTurnstileToken.value = token;
    },
    "error-callback": () => {
      resendTurnstileToken.value = null;
    },
    "expired-callback": () => {
      resendTurnstileToken.value = null;
    },
  });
};

// 新增函数：选择最后更新的槽位
const selectLatestSlot = () => {
  if (!authStore.user.settings_metadata) {
    selectedSlot.value = 1; // 默认选择槽位 1
    return;
  }

  const slots = [
    { slot: 1, updatedAt: authStore.user.settings_metadata.slot_1 },
    { slot: 2, updatedAt: authStore.user.settings_metadata.slot_2 },
    { slot: 3, updatedAt: authStore.user.settings_metadata.slot_3 },
  ];

  // 过滤出有更新时间的槽位并按时间降序排序
  const validSlots = slots
    .filter((s) => s.updatedAt)
    .map((s) => ({
      slot: s.slot,
      updatedAt: new Date(s.updatedAt).getTime(),
    }))
    .sort((a, b) => b.updatedAt - a.updatedAt);

  // 如果有有效槽位，选择最近更新的槽位，否则默认槽位 1
  selectedSlot.value = validSlots.length > 0 ? validSlots[0].slot : 1;
};

const handleError = (error, defaultMessage) => {
  const errorCode = error.response?.data?.error_code || error.code || "unknown";
  const serverMessage = error.response?.data?.message || error.message;

  if (errorCode === "unknown" || (typeof errorCode === "string" && errorCode.startsWith("ERR"))) {
    return serverMessage || defaultMessage;
  }
  return `${i18n.global.t(`app.error.codes.${errorCode}`)}: ${serverMessage || defaultMessage
    }`;
};

const isHighlighting = ref(false);
const isExpanded = ref(false);

const highlight = (expandForm = false) => {
  isHighlighting.value = true;
  isExpanded.value = expandForm;

  if (expandForm) {
    showLoginForm.value = true;
    loginTab.value = "password"; // 默认显示密码登录标签
  }

  setTimeout(() => {
    isHighlighting.value = false;
  }, 1500);
};

// 生命周期钩子
onMounted(() => {
  selectLatestSlot();
  // 获取activityStatus更新时间
  updateActivityStatusLastUpdated();
  // 监听存储变化
  StorageManager.onStorageChange(({ key }) => {
    if (key === 'activityStatus' || key === 'activityStatusLastUpdated') {
      updateActivityStatusLastUpdated();
    }
  });
  watch(resendVerificationDialog, (newVal) => {
    if (newVal) {
      nextTick(() => {
        renderResendTurnstile();
      });
    }
  });

  // 监听authStore中的用户信息变化
  watch(() => authStore.user, () => {
    selectLatestSlot();
  }, { deep: true });

  const urlParams = new URLSearchParams(window.location.search);
  const cleanUrl = window.location.pathname;

  // 直接使用auth store中的用户信息，不再在挂载时请求API

  // 检查是否有QR验证参数
  const qrCode = urlParams.get("qr_code");
  const qrSessionId = urlParams.get("qr_session_id");

  // 获取auth token
  const token = StorageManager.get("auth_token");

  // 如果已有有效token，则不需要处理回调或验证
  if (token) {
    if (qrCode && qrSessionId) {
      // 自动确认QR登录
      const qrUrl = new URL(window.location.href);
      // 自动调用扫描处理
      handleScannedQRCode(qrUrl.toString()).finally(() => {
        // 处理完成后清除URL中的QR码参数
        urlParams.delete("qr_code");
        urlParams.delete("qr_session_id");
        const newUrl = urlParams.toString()
          ? `${window.location.pathname}?${urlParams.toString()}`
          : window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
      });
    } else if (window.location.search) {
      // 没有QR参数但有其他参数，直接清除
      window.history.replaceState({}, document.title, cleanUrl);
    }
    return;
  } else if (qrCode && qrSessionId) {
    window.history.replaceState({}, document.title, cleanUrl);
  } else {
    const resetToken = urlParams.get("reset_token");
    if (resetToken) {
      resetPasswordPanel.value = ["reset"];
      // 跳转到重置密码标签页
      resetPasswordTab.value = "reset";
      // 设置令牌值
      resetPasswordForm.value.token = resetToken;
      // 自动验证令牌
      verifyResetToken();
    }
  }

  // 原有回调参数检测和处理
  const qqCode = urlParams.get("qq_code");
  const qqState = urlParams.get("qq_state");
  const qqError = urlParams.get("qq_error");
  const msCode = urlParams.get("ms_code");
  const msState = urlParams.get("ms_state");
  const msError = urlParams.get("ms_error");

  if (qqError) {
    props.toast.showToast(t("app.settings.account.qqCallbackError"), "error");
    window.history.replaceState({}, document.title, window.location.pathname);
  } else if (msError) {
    props.toast.showToast(
      t("app.settings.account.microsoftCallbackError"),
      "error"
    );
    window.history.replaceState({}, document.title, window.location.pathname);
  } else if (qqCode && qqState) {
    handleQQCallback(qqCode, qqState);
  } else if (msCode && msState) {
    handleMicrosoftCallback(msCode, msState);
  } else {
    // 延迟调用verifyEmail，确保toast组件已经完全加载
    nextTick(() => {
      setTimeout(() => {
        verifyEmail();
      }, 100);
    });
  }

  // 如果显示登录表单，自动生成二维码
  if (showLoginForm.value && loginTab.value === "qr") {
    generateQRCode();
  }
});

onUnmounted(() => {
  stopQRScanner();
  if (loginDisableTimer) clearTimeout(loginDisableTimer);
  if (registerDisableTimer) clearTimeout(registerDisableTimer);
  if (resendVerificationDisableTimer)
    clearTimeout(resendVerificationDisableTimer);
  if (qqLoginCooldownTimer) clearTimeout(qqLoginCooldownTimer);
  if (microsoftLoginCooldownTimer) clearTimeout(microsoftLoginCooldownTimer);
  stopQRCodeCheck();
});

// 监听登录标签切换
watch(loginTab, (newVal) => {
  if (newVal === "qr" && showLoginForm.value) {
    // generateQRCode();
  } else {
    stopQRCodeCheck();
    qrSession.value = null;
    qrStatusMessage.value = null;
  }
});

// 已在onMounted中添加了对authStore.user的监听，移除对props.user的监听

defineExpose({
  getApiUrl,
  highlight,
});
</script>

<style>
.qr-scanner-container {
  position: relative;
  width: 100%;
  max-width: 500px;
  margin: 0 auto;
}

.qr-video {
  width: 100%;
  height: auto;
  border-radius: 8px;
  background-color: #000;
  visibility: hidden;
}

.qr-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  border-radius: 8px;
}

.qr-code-container {
  padding: 16px;
  background: white;
  border-radius: 8px;
  display: inline-block;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.qr-loading-overlay {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 10;
}

.qr-loading-overlay.qr-scanning {
  /* position: absolute; */
  margin-top: 20px;
  left: 0;
  width: 100%;
  z-index: 100;
}

.jump-tip a {
  color: #00b0ff;
  text-decoration: none;
  transition: color 0.3s ease;
}

.jump-tip a:hover {
  color: #33beff;
}

.device-info {
  background-color: rgba(0, 0, 0, 0.05);
  border-radius: 8px;
  padding: 12px;
  margin-top: 16px;
}

.device-info .v-icon {
  color: rgba(0, 0, 0, 0.6);
}

.highlight-card {
  animation: highlight 0.5s ease-in-out 3;
}

.expanded-panel {
  transition: all 0.3s ease;
  /* box-shadow: 0 4px 20px rgba(var(--v-theme-accent), 0.3); */
}

.password-strength-meter {
  height: 4px;
  background-color: #e0e0e0;
  border-radius: 2px;
  margin: 8px 0;
  overflow: hidden;
}

.password-strength-meter-fill {
  height: 100%;
  transition: width 0.3s ease, background-color 0.3s ease;
}

.password-strength-weak {
  background-color: #ff5252;
  width: 33%;
}

.password-strength-medium {
  background-color: #ffb74d;
  width: 66%;
}

.password-strength-strong {
  background-color: #4caf50;
  width: 100%;
}

.password-hint {
  font-size: 0.75rem;
  color: rgba(0, 0, 0, 0.6);
  margin-bottom: 8px;
}

@keyframes highlight {

  0%,
  100% {
    /* 默认状态 */
  }

  50% {
    background-color: rgba(var(--v-theme-accent), 0.2);
    box-shadow: 0 0 10px rgba(var(--v-theme-accent), 0.5);
  }
}
</style>