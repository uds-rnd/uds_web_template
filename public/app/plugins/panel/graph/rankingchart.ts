import _ from 'lodash';
import TimeSeries from 'app/core/time_series2';

/**
 * Convert series into array of series values.
 * @param data Array of series
 */
export function getSeriesValues(dataList: TimeSeries[]): number[][] {
  const VALUE_INDEX = 0;
  const values = [];

  // Count rankingchart stats
  for (let i = 0; i < dataList.length; i++) {
    const series = dataList[i];
    const datapoints = series.datapoints;
    for (let j = 0; j < datapoints.length; j++) {
      if (datapoints[j][VALUE_INDEX] !== null) {
        values.push([datapoints[j][VALUE_INDEX], datapoints[j][VALUE_INDEX + 1]]);
      }
    }
  }
  return values;
}

/**
 * Convert array of values into timeseries-like ranking:
 * [[val_1, count_1], [val_2, count_2], ..., [val_n, count_n]]
 * @param values
 */
export function convertValuesToRanking(values: number[][]): any[][] {
  const distinct: any = {};

  for (let i = 0; i < values.length; i++) {
    const temp = distinct[values[i][0]];
    if (temp) {
      if (temp[1][values[i][1]]) {
        temp[1][values[i][1]] = temp[1][values[i][1]] + 1;
      } else {
        temp[1][values[i][1]] = 1;
      }
      temp[0] = temp[0] + 1;
    } else {
      let msg: any = {};
      msg[values[i][1]] = 1;
      distinct[values[i][0]] = [1, msg];
    }
  }
  let i = 0;
  let ranking_series = _.map(distinct, (count, bound) => {
    return [i++, count[0], count[1], Number(bound)];
  });
  return _.sortBy(ranking_series, (point) => point[1]).reverse();
}

/**
 * Convert series into array of histogram data.
 * @param data Array of series
 */
export function convertToRankingData(data: any, hiddenSeries: any): any[] {
  return data.map((series: any) => {
    let values = getSeriesValues([series]);
    series.rankingchart = true;
    if (!hiddenSeries[series.alias]) {
      let ranking = convertValuesToRanking(values);
      if (ranking.length > 10) {
        ranking.length = 10;
      }
      for (let i = 0; i < ranking.length; i++) {
        ranking[i][0] = i;
      }
      series.data = ranking;
      series.stats.min = series.data[0][0];
      series.stats.max = series.data[series.data.length - 1][0];
    } else {
      series.data = [];
    }
    return series;
  });
}
