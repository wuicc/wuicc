import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import StorageManager from '@/utils/StorageManager'

export function useTimezone() {
  const { locale } = useI18n();

  const serverTimezone = StorageManager.get('serverTimezone') || 'UTC+8';
  const useLocalTimezone = StorageManager.get('useLocalTimezone') === 'true';

  const timezoneOffset = computed(() => {
    if (useLocalTimezone) return 0;

    const serverOffset = parseInt(serverTimezone.replace('UTC', ''));
    const localOffset = -new Date().getTimezoneOffset() / 60;
    return (serverOffset - localOffset) * 60 * 60 * 1000;
  });

  const formatDateWithTimezone = (dateString, options) => {
    const date = new Date(dateString);
    const adjustedDate = new Date(date.getTime() + timezoneOffset.value);

    const defaultOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };

    return adjustedDate.toLocaleString(locale.value, { ...defaultOptions, ...options });
  };

  return {
    formatDateWithTimezone
  };
}