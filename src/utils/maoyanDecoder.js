// 字体映射缓存
const fontMappingCache = new Map();

// 历史值缓存
const valueHistoryCache = new Map();

// 字体映射表 - 更新为更完整的映射
const FONT_MAPPINGS = {
  '75e5b39d': {
    'ec68': '3', 'e5ac': '0', 'e274': '1', 'e6d5': '2',
    'f615': '4', 'eab3': '5', 'f66d': '6', 'ef74': '7',
    'e1b7': '8', 'e916': '.', 'f05a': '8', 'e132': '9',
    'eac9': '0', 'f477': '1', 'f47a': '2', 'ee5d': '3',
    'e0b8': '5', 'e260': '6', 'f1a1': '7', 'e6f0': '8',
    'eff9': '9'
  },
  '20a70494': {
    'e886': '0', 'f23f': '1', 'eba2': '2', 'f16b': '3',
    'ec4b': '4', 'e583': '5', 'ed8f': '6', 'f11c': '7',
    'f3e8': '8', 'f7d2': '9', 'e916': '.', 'f05a': '8',
    'e8d7': '0', 'f85e': '1', 'e8ee': '2', 'e99c': '3',
    'e9ea': '4', 'f1fc': '5', 'eb92': '6', 'f726': '7',
    'f7ff': '8', 'e132': '9', 'eac9': '0', 'f477': '1'
  },
  '432017e7': {
    'f0f0': '0', 'f70e': '1', 'ed4f': '2', 'ed98': '3',
    'e85f': '4', 'efe9': '5', 'f7b3': '6', 'f11c': '7',
    'f3e8': '8', 'f7d2': '9', 'e916': '.', 'f05a': '8',
    'e132': '9', 'eac9': '0', 'ee5d': '3', 'e0b8': '5'
  },
  'e3dfe524': {
    'e886': '0', 'f23f': '1', 'eba2': '2', 'f16b': '3',
    'ec4b': '4', 'e583': '5', 'ed8f': '6', 'f11c': '7',
    'f3e8': '8', 'f7d2': '9', 'e916': '.', 'f05a': '8',
    'e3ec': '4', 'eb19': '5', 'ed30': '6', 'e3df': '7',
    'ea60': '8', 'ef28': '3', 'ea6f': '4', 'e132': '9'
  },
  '2a70c44b': {
    'e886': '0', 'f23f': '1', 'eba2': '2', 'f16b': '3',
    'ec4b': '4', 'e583': '5', 'ed8f': '6', 'f11c': '7',
    'f3e8': '8', 'f7d2': '9', 'e916': '.', 'f05a': '8',
    'e83d': '0', 'e132': '9'
  }
};

// 数据波动检测配置
const FLUCTUATION_CONFIG = {
  MAX_PERCENTAGE: 100, // 增加到100%以适应大盘数据的波动
  MIN_VALUE: 0.1,
  MAX_VALUE: 1000000, // 增加最大值范围
  HISTORY_SIZE: 5  // 增加历史记录大小以提高准确性
};

/**
 * 优化的字体ID提取函数
 */
const extractFontId = (fontStyle) => {
  if (!fontStyle) return null;
  const cached = fontMappingCache.get('lastFontId');
  if (cached && fontStyle.includes(cached)) return cached;
  
  // 增加更多的字体URL匹配模式
  const fontUrls = fontStyle.match(/url\(['"]*([^'")]+)['"]*\)/g) || [];
  for (const fontUrl of fontUrls) {
    const url = fontUrl.match(/url\(['"]*([^'")]+)['"]*\)/)[1];
    const fontId = url.split('/').pop().split('.')[0];
    if (FONT_MAPPINGS[fontId]) {
      fontMappingCache.set('lastFontId', fontId);
      return fontId;
    }
  }
  
  return null;
};

/**
 * 优化的数值波动检查函数
 */
const isFluctuationReasonable = (currentValue, prevValue, key) => {
  if (!prevValue) return true;
  if (currentValue < FLUCTUATION_CONFIG.MIN_VALUE || currentValue > FLUCTUATION_CONFIG.MAX_VALUE) return false;

  const percentageChange = Math.abs((currentValue - prevValue) / prevValue * 100);
  
  // 检查是否是单位变化（万到亿）
  if (percentageChange > FLUCTUATION_CONFIG.MAX_PERCENTAGE) {
    const scaledCurrent = currentValue * (currentValue < prevValue ? 10000 : 0.0001);
    const scaledPercentageChange = Math.abs((scaledCurrent - prevValue) / prevValue * 100);
    if (scaledPercentageChange < FLUCTUATION_CONFIG.MAX_PERCENTAGE) {
      return true;
    }
    console.warn(`数据波动异常 [${key}]:`, { current: currentValue, previous: prevValue, change: percentageChange.toFixed(2) + '%' });
    return false;
  }

  return true;
};

/**
 * 优化的HTML实体解码函数
 */
const decodeHtmlEntity = (text, fontStyle, key = 'default') => {
  
  if (!text || !fontStyle) return '0';
  
  try {
    const fontId = extractFontId(fontStyle);
    if (!fontId) {
      console.warn(`未找到有效的字体ID [${key}]`);
      return valueHistoryCache.get(key)?.[0]?.toString() || '0';
    }
    
    // 获取字体映射
    let numMap = fontMappingCache.get(fontId);
    if (!numMap) {
      numMap = FONT_MAPPINGS[fontId];
      if (!numMap) {
        console.warn(`未找到字体映射: ${fontId}`);
        return valueHistoryCache.get(key)?.[0]?.toString() || '0';
      }
      fontMappingCache.set(fontId, numMap);
    }

    // 记录原始编码用于调试
    const originalCodes = text.match(/&#x([0-9a-f]{4});/gi) || [];
    console.log(`原始编码 [${key}]:`, originalCodes.join(', '));

    // 使用正则一次性替换所有编码
    const decodedText = text.replace(/&#x([0-9a-f]{4});/gi, (match, code) => {
      const decoded = numMap[code.toLowerCase()];
      if (!decoded) {
        console.warn(`未找到字符映射 [${key}]: ${code}`);
        return '0';
      }
      return decoded;
    });

    console.log(`解码结果 [${key}]:`, decodedText);

    // 获取历史值并检查波动
    const history = valueHistoryCache.get(key) || [];
    const currentValue = parseFloat(decodedText);
    
    // 针对大盘票房数据的特殊处理
    if (key === 'nationBox' || key === 'nationSplitBox') {
      // 如果是大盘数据，允许更大的波动范围
      if (currentValue > 0 && currentValue < FLUCTUATION_CONFIG.MAX_VALUE) {
        // 检查数值是否合理
        if (history.length > 0) {
          const prevValue = history[0];
          const percentageChange = Math.abs((currentValue - prevValue) / prevValue * 100);
          if (percentageChange > FLUCTUATION_CONFIG.MAX_PERCENTAGE) {
            console.warn(`大盘数据波动过大 [${key}]:`, {
              current: currentValue,
              previous: prevValue,
              change: `${percentageChange.toFixed(2)}%`
            });
            return prevValue.toString();
          }
        }
        
        history.unshift(currentValue);
        if (history.length > FLUCTUATION_CONFIG.HISTORY_SIZE) {
          history.pop();
        }
        valueHistoryCache.set(key, history);
        return decodedText;
      }
    } else if (!isFluctuationReasonable(currentValue, history[0], key)) {
      return history[0]?.toString() || '0';
    }

    // 更新历史值
    history.unshift(currentValue);
    if (history.length > FLUCTUATION_CONFIG.HISTORY_SIZE) {
      history.pop();
    }
    valueHistoryCache.set(key, history);

    return decodedText;
  } catch (error) {
    console.error('解码错误:', error);
    return valueHistoryCache.get(key)?.[0]?.toString() || '0';
  }
};

/**
 * 格式化数字
 * @param {string|number} num - 需要格式化的数字
 * @param {string} unit - 单位（默认为"万"）
 * @returns {string} 格式化后的数字字符串
 */
const formatNumber = (num, unit = '万') => {
  const value = parseFloat(num);
  return isNaN(value) ? `0${unit}` : `${value.toFixed(1)}${unit}`;
};

/**
 * 检查数值是否有效
 * @param {string|number} value - 要检查的值
 * @returns {boolean} 是否有效
 */
const isValidNumber = (value) => {
  if (!value) return false;
  const num = parseFloat(value);
  return !isNaN(num) && num >= 0;
};

/**
 * 格式化观影人次和场次数据
 * @param {string} value - 需要格式化的数值
 * @param {string} unit - 单位（万）
 * @returns {string} 格式化后的数值
 */
const formatViewAndShowCount = (value) => {
  if (!value) return '0';
  // 移除非数字和小数点
  const cleanValue = value.replace(/[^0-9.]/g, '');
  const num = parseFloat(cleanValue);
  return isNaN(num) ? '0' : num.toLocaleString();
};

/**
 * 处理全国大盘数据
 * @param {Object} data - 原始数据
 * @param {Object} prevData - 上一次的数据
 * @returns {Object} 处理后的数据
 */
const processNationBoxData = (data, prevData = null) => {
  try {
    const nationBoxInfo = data?.movieList?.nationBoxInfo;
    if (!nationBoxInfo) {
      console.warn('全国大盘数据缺失');
      return {
        viewCount: prevData?.viewCount || '0',
        viewCountUnit: prevData?.viewCountUnit || '万',
        showCount: prevData?.showCount || '0',
        showCountUnit: prevData?.showCountUnit || '场',
        nationBox: prevData?.nationBox || '0'
      };
    }

    // 处理实时大盘数据
    let nationBox = '0';
    let nationSplitBox = '0';

    // 解码大盘总票房
    if (nationBoxInfo.nationBoxSplitUnit?.num && data.fontStyle) {
      nationBox = decodeHtmlEntity(
        nationBoxInfo.nationBoxSplitUnit.num, 
        data.fontStyle,
        'nationBox'
      );
    }

    // 解码大盘分账票房
    if (nationBoxInfo.nationSplitBoxSplitUnit?.num && data.fontStyle) {
      nationSplitBox = decodeHtmlEntity(
        nationBoxInfo.nationSplitBoxSplitUnit.num, 
        data.fontStyle,
        'nationSplitBox'
      );
    }

    // 检查解码结果
    if (nationBox === '0' && prevData?.nationBox) {
      console.log('使用上一次的大盘总票房数据');
      nationBox = prevData.nationBox;
    }

    if (nationSplitBox === '0' && prevData?.nationSplitBox) {
      console.log('使用上一次的大盘分账票房数据');
      nationSplitBox = prevData.nationSplitBox;
    }

    // 格式化票房数据
    nationBox = formatNumber(nationBox, nationBoxInfo.nationBoxSplitUnit?.unit || '万');
    nationSplitBox = formatNumber(nationSplitBox, nationBoxInfo.nationSplitBoxSplitUnit?.unit || '万');

    // 处理观影人次数据
    let viewCount = '0';
    let viewCountUnit = '万';
    if (nationBoxInfo.viewCountDesc) {
      const matches = nationBoxInfo.viewCountDesc.match(/([0-9.]+)([^0-9.]+)/);
      if (matches) {
        viewCount = matches[1];
        viewCountUnit = matches[2].trim();
      }
    } else if (prevData?.viewCount) {
      viewCount = prevData.viewCount;
      viewCountUnit = prevData.viewCountUnit;
      console.log('使用上一次的观影人次数据:', viewCount, viewCountUnit);
    }

    // 处理场次数据
    let showCount = '0';
    let showCountUnit = '场';
    if (nationBoxInfo.showCountDesc) {
      const matches = nationBoxInfo.showCountDesc.match(/([0-9.]+)([^0-9.]+)/);
      if (matches) {
        showCount = matches[1];
        showCountUnit = matches[2].trim();
      }
    } else if (prevData?.showCount) {
      showCount = prevData.showCount;
      showCountUnit = prevData.showCountUnit;
      console.log('使用上一次的场次数据:', showCount, showCountUnit);
    }

    // 数据波动检测
    if (prevData) {
      const viewCountNum = parseFloat(viewCount);
      const prevViewCountNum = parseFloat(prevData.viewCount);
      const showCountNum = parseFloat(showCount);
      const prevShowCountNum = parseFloat(prevData.showCount);
      const nationBoxNum = parseFloat(nationBox);
      const prevNationBoxNum = parseFloat(prevData.nationBox);
      const nationSplitBoxNum = parseFloat(nationSplitBox);
      const prevNationSplitBoxNum = parseFloat(prevData.nationSplitBox);

      // 检查各项数据的波动
      if (prevViewCountNum > 0 && Math.abs(viewCountNum - prevViewCountNum) / prevViewCountNum > 0.5) {
        console.warn('观影人次数据波动异常，使用上一次数据');
        viewCount = prevData.viewCount;
        viewCountUnit = prevData.viewCountUnit;
      }
      if (prevShowCountNum > 0 && Math.abs(showCountNum - prevShowCountNum) / prevShowCountNum > 0.5) {
        console.warn('场次数据波动异常，使用上一次数据');
        showCount = prevData.showCount;
        showCountUnit = prevData.showCountUnit;
      }
      if (prevNationBoxNum > 0 && Math.abs(nationBoxNum - prevNationBoxNum) / prevNationBoxNum > 0.5) {
        console.warn('大盘总票房数据波动异常，使用上一次数据');
        nationBox = prevData.nationBox;
      }
      if (prevNationSplitBoxNum > 0 && Math.abs(nationSplitBoxNum - prevNationSplitBoxNum) / prevNationSplitBoxNum > 0.5) {
        console.warn('大盘分账票房数据波动异常，使用上一次数据');
        nationSplitBox = prevData.nationSplitBox;
      }
    }

    return {
      viewCount,
      viewCountUnit,
      showCount,
      showCountUnit,
      nationBox,
      nationSplitBox
    };
  } catch (error) {
    console.error('全国大盘数据处理错误:', error);
    return {
      viewCount: prevData?.viewCount || '0',
      viewCountUnit: prevData?.viewCountUnit || '万',
      showCount: prevData?.showCount || '0',
      showCountUnit: prevData?.showCountUnit || '场',
      nationBox: prevData?.nationBox || '0',
      nationSplitBox: prevData?.nationSplitBox || '0'
    };
  }
};

/**
 * 优化的票房数据处理函数
 */
const processBoxOfficeData = (data, prevData = null) => {
  console.log('原始数据:', JSON.stringify(data, null, 2));
  
  // 1. 基础数据格式验证
  if (!data || typeof data !== 'object') {
    console.warn('数据格式无效 - 不是对象类型');
    return prevData;
  }

  try {
    // 2. 详细的数据结构验证
    console.log('数据结构验证开始...');
    console.log('movieList 存在:', !!data.movieList);
    console.log('movieInfo 存在:', !!data.movieInfo);
    console.log('fontStyle 存在:', !!data.fontStyle);

    // 获取第一个电影的数据（通常是目标电影）
    const movieList = data.movieList?.list?.[0];
    const movieInfo = movieList?.movieInfo || data.movieInfo;
    const fontStyle = data.fontStyle;

    // 3. 数据完整性检查
    if (Object.keys(data).length === 1 && data.fontStyle) {
      console.log('仅接收到字体样式数据，保持当前状态');
      return prevData;
    }

    // 4. 合并数据，使用默认值
    const mergedData = {
      // 基础信息 - 优先使用 movieList 中的 movieInfo
      movieInfo: {
        movieName: movieInfo?.movieName || prevData?.movieInfo?.movieName || '加载中...',
        releaseInfo: movieInfo?.releaseInfo || prevData?.movieInfo?.releaseInfo || '0'
      },
      fontStyle: fontStyle || prevData?.fontStyle,
      
      // 票房数据
      boxSplitUnit: movieList?.boxSplitUnit || prevData?.boxSplitUnit || { num: '0', unit: '万' },
      splitBoxSplitUnit: movieList?.splitBoxSplitUnit || prevData?.splitBoxSplitUnit || { num: '0', unit: '万' },
      
      // 其他统计数据
      showCount: movieList?.showCount || data.movieList?.nationBoxInfo?.showCountDesc?.replace(/[^0-9.]/g, '') || prevData?.showCount || '0',
      showRate: movieList?.showRate || prevData?.showRate || '0%',
      avgShowView: movieList?.avgShowView || prevData?.avgShowView || '0',
      avgShowViewRank: movieList?.avgShowViewRank || prevData?.avgShowViewRank || '1',
      avgSeatView: movieList?.avgSeatView || prevData?.avgSeatView || '0%',
      boxRate: movieList?.boxRate || prevData?.boxRate || '0%',
      splitBoxRate: movieList?.splitBoxRate || prevData?.splitBoxRate || '0%',
      sumBoxDesc: movieList?.sumBoxDesc || prevData?.sumBoxDesc || '0万'
    };

    // 5. 处理全国大盘数据
    const nationBoxData = processNationBoxData(data, prevData);
    
    // 6. 合并全国大盘数据
    const finalData = {
      ...mergedData,
      viewCount: nationBoxData.viewCount,
      viewCountUnit: nationBoxData.viewCountUnit,
      showCount: nationBoxData.showCount || mergedData.showCount,
      showCountUnit: nationBoxData.showCountUnit,
      nationBox: nationBoxData.nationBox,
      nationSplitBox: nationBoxData.nationSplitBox
    };

    // 7. 数据有效性最终验证
    console.log('处理后的数据:', JSON.stringify(finalData, null, 2));
    
    const isDataValid = Boolean(
      finalData.movieInfo?.movieName &&
      finalData.fontStyle &&
      finalData.movieInfo.movieName !== '加载中...'
    );

    if (!isDataValid) {
      console.warn('数据验证失败 - 使用上一次数据');
      return prevData;
    }

    return Object.freeze(finalData);
  } catch (error) {
    console.error('数据处理错误:', error);
    return prevData;
  }
};

/**
 * 计算分账比例
 * @param {string} split - 分账数值
 * @param {string} total - 总数值
 * @param {string} [rateString] - 已有的比率字符串
 * @returns {number} 分账比例
 */
const calculateSplitRate = (split, total, rateString) => {
  if (rateString) {
    const rate = parseFloat(rateString.replace('%', ''));
    return isNaN(rate) ? 0 : rate;
  }
  const splitValue = parseFloat(split);
  const totalValue = parseFloat(total);
  return (isNaN(splitValue) || isNaN(totalValue) || totalValue === 0) ? 0 : (splitValue / totalValue * 100);
};

export {
  decodeHtmlEntity,
  formatNumber,
  processBoxOfficeData,
  calculateSplitRate,
  processNationBoxData
}; 