// src/utils/timezone.js
const timezoneOffsetMap = {
    '+00:00': 'WET',
    '+01:00': 'MET',
    '+02:00': 'Europe/Vilnius',
    '+03:00': 'Europe/Volgograd',
    '-10:00': 'Pacific/Tahiti',
    '-09:00': 'Pacific/Gambier',
    '-03:00': 'Etc/GMT+3',
    '-04:00': 'Etc/GMT+4',
    '-06:00': 'Pacific/Galapagos',
    '-05:00': 'Etc/GMT+5',
    '-07:00': 'MST7MDT',
    '-08:00': 'Pacific/Pitcairn',
    '-02:00': 'Etc/GMT+2',
    '-01:00': 'Etc/GMT+1',
    '-03:30': 'America/St_Johns',
    '+11:00': 'Pacific/Noumea',
    '+07:00': 'Etc/GMT-7',
    '+10:00': 'Pacific/Port_Moresby',
    '+05:00': 'Indian/Maldives',
    '+06:00': 'Indian/Chagos',
    '+12:00': 'Pacific/Tarawa',
    '+04:00': 'Indian/Mauritius',
    '+09:00': 'Pacific/Palau',
    '+08:00': 'Etc/GMT-8',
    '+05:30': 'Asia/Kolkata',
    '+04:30': 'Asia/Kabul',
    '+05:45': 'Asia/Kathmandu',
    '+03:30': 'Asia/Tehran',
    '+06:30': 'Asia/Yangon',
    '+09:30': 'Australia/Darwin',
    '+08:45': 'Australia/Eucla',
    '+10:30': 'Australia/Lord_Howe',
    '-11:00': 'Pacific/Pago_Pago',
    '-12:00': 'Etc/GMT+12',
    '+13:00': 'Pacific/Tongatapu',
    '+14:00': 'Pacific/Kiritimati',
    '+12:45': 'Pacific/Chatham',
    '-09:30': 'Pacific/Marquesas'
  };
  
  // 将 UTC±X 格式转换为标准时区名称
  export function getTimezoneName(utcOffset) {
    // 处理 UTC+8 格式的输入
    if (typeof utcOffset === 'string') {
      if (utcOffset.startsWith('UTC')) {
        // 转换 UTC+8 为 +08:00 格式
        const offset = utcOffset.replace('UTC', '');
        const sign = offset[0] === '-' ? '-' : '+';
        const hours = offset.replace(/[+-]/, '').padStart(2, '0');
        utcOffset = `${sign}${hours}:00`;
      }
      
      // 检查是否在映射表中
      if (timezoneOffsetMap[utcOffset]) {
        return timezoneOffsetMap[utcOffset];
      }
    }
    
    // 处理数字偏移量 (如 8 表示 UTC+8)
    if (typeof utcOffset === 'number') {
      const sign = utcOffset >= 0 ? '+' : '-';
      const hours = Math.abs(utcOffset).toString().padStart(2, '0');
      const formattedOffset = `${sign}${hours}:00`;
      
      if (timezoneOffsetMap[formattedOffset]) {
        return timezoneOffsetMap[formattedOffset];
      }
    }
    
    // 默认回退到 UTC
    return 'UTC';
  }
  
  // 获取时区显示名称
  export function getTimezoneDisplayName(timezone) {
    // 如果是 UTC±X 格式，转换为更友好的显示
    if (timezone.startsWith('UTC')) {
      return timezone.replace('UTC', 'GMT');
    }
    
    // 如果是标准时区名称，提取主要部分
    const parts = timezone.split('/');
    return parts[parts.length - 1].replace(/_/g, ' ');
  }