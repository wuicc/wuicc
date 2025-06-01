import { i18n } from '@/i18n';

// 提取标题内容
export function extractTitle(title) {
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
    const gameList = JSON.parse(localStorage.getItem("gameList") || "[]");
    if (!gameList) return "";

    const game = gameList.find((g) => g.game_id === activity.game_id);
    if (!game || !game.activities || !game.activities.gacha) return "";

    const language = localStorage.getItem("userLanguage");
    return game.activities.gacha.name[language] || "";
  } catch (error) {
    console.error("Failed to get gacha name:", error);
    return "";
  }
}

// 格式化版本活动
export function formatVersionActivity(activity) {
  const versionNumber = activity.title.match(/(\d\.\d)/)[0];
  const gameName = i18n.global.t(`app.games.${activity.game_id}.title`);
  return `${gameName} ${formatGameVersion(versionNumber)}`;
}

function formatGameVersion(version) {
  return i18n.global.t(`app.version_with_number`, { version });
}

// 主格式化函数
export function formatActivityTitle(activity) {
  const language = localStorage.getItem("userLanguage");
  
  if (activity.type === "version") {
    return formatVersionActivity(activity);
  }
  
  if (activity.type === "event") {
    if (
      (language.startsWith("en") ||
       language.startsWith("fr") ||
       language.startsWith("es")) &&
      activity.game_id === "starrail"
    ) {
      if (activity.title.includes(":")) {
        const title = extractTitle(activity.title);
        let lastColonIndex = title.lastIndexOf(":");
        return title.substring(0, lastColonIndex);
      }
    }
    return extractTitle(activity.title);
  } else if (activity.type === "gacha" && language !== "zh-Hans") {
    return `${getGachaName(activity)} - ${extractTitle(activity.title)}`;
  }
  
  return activity.title;
}