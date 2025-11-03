import { i18n } from '@/i18n';
import StorageManager from '@/utils/StorageManager'

// 提取标题内容
export function extractTitle(title, game_id = "") {
  // 对于 "wuthering" 游戏，只匹配方括号
  if (game_id === "wuthering") {
    const squareBracketRegex = /\[([^\]]+)\]/;
    const squareBracketMatch = squareBracketRegex.exec(title);
    if (squareBracketMatch) {
      return squareBracketMatch[1];
    }
    return title;
  }

  const cjkRegex = /[「\[]([^「\]」]+)[」\]]/;
  const cjkMatch = cjkRegex.exec(title);

  if (cjkMatch) {
    return cjkMatch[1];
  }

  const quoteRegex = /"([^"]+)"/;
  const quoteMatch = quoteRegex.exec(title);

  if (quoteMatch) {
    return quoteMatch[1];
  }

  const frenchQuoteRegex = /«\s*([^»]+)\s*»/;
  const frenchQuoteMatch = frenchQuoteRegex.exec(title);

  if (frenchQuoteMatch) {
    return frenchQuoteMatch[1].trim();
  }

  const germanQuoteRegex = /„([^“]+)“/;
  const germanQuoteMatch = germanQuoteRegex.exec(title);

  if (germanQuoteMatch) {
    return germanQuoteMatch[1].trim();
  }

  return title;
}

// 获取祈愿名称
export function getGachaName(activity) {
  try {
    const gameList = (StorageManager.get("gameList") || "[]");
    if (!gameList) return "";

    const game = gameList.find((g) => g.game_id === activity.game_id);
    if (!game || !game.activities || !game.activities.gacha) return "";

    const language = StorageManager.get("userLanguage");
    return game.activities.gacha.name[language] || "";
  } catch (error) {
    console.error("Failed to get gacha name:", error);
    return "";
  }
}

// 格式化版本活动
export function formatVersionActivity(activity) {
  try {
    const versionNumber = activity.title.match(/(\d\.\d)/)[0];
    const gameName = i18n.global.t(`app.games.${activity.game_id}.title`);
    const language = StorageManager.get("userLanguage");

    // 检查是否为原神6.x版本活动
    const isGenshin6x = activity.game_id === "genshin" && versionNumber.startsWith("6");

    if (isGenshin6x) {
      // 获取版本号的小版本号，用于转换为罗马数字
      const minorVersion = parseInt(versionNumber.split('.')[1], 10);
      const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
      const romanNumeral = minorVersion < romanNumerals.length ? romanNumerals[minorVersion] : minorVersion.toString();

      // 根据不同语言返回不同格式
      if (language.startsWith("zh")) {
        // 中文简体和繁体：原神「月之一」版本
        const chineseNumbers = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
        const chineseNumber = minorVersion < chineseNumbers.length ? chineseNumbers[minorVersion] : minorVersion.toString();
        return `${gameName}「月之${chineseNumber}」版本`;
      } else if (language.startsWith("en") || language.startsWith("fr")) {
        // 英文和法文：Genshin Impact - Version Luna I
        return `${gameName} - Version Luna ${romanNumeral}`;
      } else if (language.startsWith("ja")) {
        // 日文：原神「Luna I」
        return `${gameName}「Luna ${romanNumeral}」`;
      } else if (language.startsWith("ko")) {
        // 韩文：原神「X번째 달」版本
        const koreanNumbers = ['첫', '두', '세', '네', '다섯', '여섯', '일곱', '여덟', '아홉', '열'];
        const koreanNumber = minorVersion <= koreanNumbers.length ? koreanNumbers[minorVersion] : minorVersion.toString();
        return `${gameName}「${koreanNumber} 번째 달」버전`;
      }
    }

    // 检查是否为非中日韩语言
    const isNonCJK = !language.startsWith("zh") &&
      !language.startsWith("ja") &&
      !language.startsWith("ko");

    return isNonCJK
      ? `${gameName} - ${formatGameVersion(versionNumber)}`
      : `${gameName} ${formatGameVersion(versionNumber)}`;
  } catch (e) {
    return activity.title;
  }
}

function formatGameVersion(version) {
  return i18n.global.t(`app.version_with_number`, { version });
}

// 主格式化函数
export function formatActivityTitle(activity) {
  const language = StorageManager.get("userLanguage");

  if (activity.type === "version") {
    return formatVersionActivity(activity);
  }

  if (activity.type === "event") {
    if (
      (language.startsWith("en") ||
        language.startsWith("fr") ||
        language.startsWith("es"))
    ) {
      if (activity.game_id === "genshin"
      ) {
        if (activity.title.includes(":") && !activity.title.includes('"')) {
          return activity.title.split(":")[0];
        } else if (activity.game_id === "starrail"
        ) {
          const title = extractTitle(activity.title, activity.game_id);
          return title;
          // let lastColonIndex = title.lastIndexOf(":");
          // return title.substring(0, lastColonIndex);
        }
      }
    }
    return extractTitle(activity.title, activity.game_id);
  } else if (activity.type === "gacha" && language !== "zh-Hans" && !(language === "ja" && activity.game_id === "wuthering")) {
    return `${getGachaName(activity)} - ${extractTitle(activity.title, activity.game_id)}`;
  }
  return activity.title;
}