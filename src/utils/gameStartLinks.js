const gameLinks = {
  genshin: {
    cn: {
      pc: "hyp-cn://launchgame?gamebiz=hk4e_cn",
      mobile: "yuanshen://",
      cloud_mobile: "yscloud://",
      cloud_url: "https://ys.mihoyo.com/cloud"
    },
    global: {
      pc: "hyp-global://launchgame?gamebiz=hk4e_global",
      mobile: "genshin://",
      cloud_mobile: "cloudgenshin://",
      cloud_url: null
    }
  },
  starrail: {
    cn: {
      pc: "hyp-cn://launchgame?gamebiz=hkrpg_cn",
      mobile: "starrailmihoyo://",
      cloud_mobile: "srcloud://",
      cloud_url: "https://sr.mihoyo.com/cloud"
    },
    global: {
      pc: "hyp-global://launchgame?gamebiz=hkrpg_global",
      mobile: "honkaistarrail://",
      cloud_mobile: null,
      cloud_url: null
    }
  },
  zenless: {
    cn: {
      pc: "hyp-cn://launchgame?gamebiz=nap_cn",
      mobile: "zenless://",
      cloud_mobile: "zenlesscloud://",
      cloud_url: "https://zzz.mihoyo.com/cloud-feat/"
    },
    global: {
      pc: "hyp-global://launchgame?gamebiz=nap_global",
      mobile: "zenlessglobal://",
      cloud_mobile: null,
      cloud_url: null
    }
  },
  wuthering: {
    cn: {
      pc: null,
      mobile: "akicn://",
      cloud_mobile: "akiyun://",
      cloud_url: "https://mc.kurogames.com/cloud/"
    },
    global: {
      pc: null,
      mobile: "wutheringwaves://",
      cloud_mobile: null,
      cloud_url: null
    }
  }
};

/**
 * 获取游戏所有可用链接
 * @param {string} gameId 游戏ID
 * @returns {Object} 返回包含所有地区链接的对象
 */
export function getAllGameLinks(gameId) {
  if (!gameLinks[gameId]) {
    return null;
  }
  return gameLinks[gameId];
}

/**
* 获取游戏链接
* @param {string} gameId 游戏ID (genshin, starrail, zenless, wuthering)
* @param {string} region 地区 (cn, global)
* @param {string} platform 平台 (pc, mobile, cloud_mobile, cloud_url)
* @returns {string|null} 返回对应的链接，如果没有则返回null
*/
export function getGameLink(gameId, region, platform) {
  // 检查游戏是否存在
  if (!gameLinks[gameId]) {
    return null;
  }

  // 检查地区是否存在
  if (!gameLinks[gameId][region]) {
    return null;
  }

  // 检查平台是否存在
  if (!gameLinks[gameId][region][platform]) {
    return null;
  }

  return gameLinks[gameId][region][platform];
}