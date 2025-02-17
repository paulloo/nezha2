import { useMemo } from 'react';
import { decodeHtmlEntity, formatNumber, processBoxOfficeData, calculateSplitRate } from '../../../utils/maoyanDecoder';

export const useBoxOfficeData = (data) => {
  return useMemo(() => {
    if (!data) {
      return {
        viewCountDesc: '0',
        viewCountUnit: '万张',
        showCountDesc: '0',
        showCountUnit: '万场',
        displayValue: '0万',
        splitDisplayValue: '0万',
        splitRate: 0,
        isDataValid: true
      };
    }

    try {
      // 解码票房数据
      const boxNum = data.boxSplitUnit?.num && data.fontStyle ? 
        decodeHtmlEntity(data.boxSplitUnit.num, data.fontStyle, 'boxOffice') : '0';
      const splitBoxNum = data.splitBoxSplitUnit?.num && data.fontStyle ? 
        decodeHtmlEntity(data.splitBoxSplitUnit.num, data.fontStyle, 'splitBoxOffice') : '0';

      // 数据有效性检查
      const isValidData = Boolean(
        data.boxSplitUnit?.num &&
        data.fontStyle &&
        boxNum !== '0' &&
        splitBoxNum !== '0'
      );

      // 格式化数据
      const formattedData = {
        viewCountDesc: data.viewCountDesc || '0',
        viewCountUnit: '万张',
        showCountDesc: data.showCountDesc || '0',
        showCountUnit: '万场',
        displayValue: data.sumBoxDesc || '0万',
        splitDisplayValue: data.sumSplitBoxDesc || '0万',
        splitRate: calculateSplitRate(splitBoxNum, boxNum, data.splitBoxRate),
        boxRate: data.boxRate || '0%',
        showCountRate: data.showCountRate || '0%',
        avgShowView: data.avgShowView || '0',
        avgShowViewRank: data.avgShowViewRank || '1',
        avgSeatView: data.avgSeatView || '0%',
        isDataValid: true
      };

      // 数据合理性检查
      const isReasonable = (
        parseFloat(formattedData.viewCountDesc) >= 0 &&
        parseFloat(formattedData.showCountDesc) >= 0 &&
        parseFloat(boxNum) >= 0 &&
        parseFloat(splitBoxNum) >= 0 &&
        formattedData.splitRate >= 0 &&
        formattedData.splitRate <= 100
      );

      if (!isReasonable) {
        console.warn('票房数据不合理，使用默认值');
        return {
          viewCountDesc: '0',
          viewCountUnit: '万张',
          showCountDesc: '0',
          showCountUnit: '万场',
          displayValue: '0万',
          splitDisplayValue: '0万',
          splitRate: 0,
          boxRate: '0%',
          showCountRate: '0%',
          avgShowView: '0',
          avgShowViewRank: '1',
          avgSeatView: '0%',
          isDataValid: true
        };
      }

      return formattedData;
    } catch (error) {
      console.error('票房数据处理错误:', error);
      return {
        viewCountDesc: data.viewCountDesc?.replace(/[^0-9.]/g, '') || '0',
        viewCountUnit: '万张',
        showCountDesc: data.showCountDesc?.replace(/[^0-9.]/g, '') || '0',
        showCountUnit: '万场',
        displayValue: data.sumBoxDesc || '0万',
        splitDisplayValue: data.sumSplitBoxDesc || '0万',
        splitRate: 0,
        boxRate: data.boxRate || '0%',
        showCountRate: data.showCountRate || '0%',
        avgShowView: data.avgShowView || '0',
        avgShowViewRank: data.avgShowViewRank || '1',
        avgSeatView: data.avgSeatView || '0%',
        isDataValid: true
      };
    }
  }, [data]);
}; 