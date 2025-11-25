<template>
  <div class="right_bottom">
    <div class="chart-controls">
      <div class="time-range">
        <button 
          v-for="range in timeRanges" 
          :key="range.value"
          :class="['time-btn', { active: currentTimeRange === range.value }]"
          @click="changeTimeRange(range.value)"
        >
          {{ range.label }}
        </button>
      </div>
    </div>
    
    <Echart
      id="combinedChart"
      :options="chartOption"
      class="chart-container"
      v-if="chartDataReady"
      ref="combinedChart"
    />
    
    <div v-else class="no-data">
      <div class="placeholder">📊</div>
      <p>请选择大罐查看历史数据</p>
    </div>
  </div>
</template>

<script>
import { graphic } from 'echarts'

export default {
  name: "RightBottom",
  props: {
    selectedTank: {
      type: Object,
      default: null
    }
  },
  data() {
    return {
      timeRanges: [
        { label: '24小时', value: '24h' },
        { label: '7天', value: '7d' },
        { label: '30天', value: '30d' }
      ],
      currentTimeRange: '24h',
      chartOption: {},
      chartDataReady: false,
      levelData: [],
      temperatureData: [],
      timeLabels: [],
      dataTimer: null,
      maxDataPoints: 96,
      currentTankId: null,
      // 添加状态跟踪 - 调整为大罐参数
      baseLevel: 12000, // 基础液位高度（大罐）
      lastTemperature: 21, // 上次温度
      leakRate: 5, // 渗漏罐的下降速率（大罐下降更快）
      // 泸州月平均气温数据 (单位：°C) - 大罐温度相对稳定，但仍有季节性变化
      luzhouMonthlyTemps: {
        1: 8.2,   // 一月
        2: 10.5,  // 二月
        3: 15.3,  // 三月
        4: 20.1,  // 四月
        5: 23.8,  // 五月
        6: 26.2,  // 六月
        7: 29.5,  // 七月
        8: 29.1,  // 八月
        9: 25.3,  // 九月
        10: 20.2, // 十月
        11: 15.6, // 十一月
        12: 10.1  // 十二月
      },
      // 温度波动范围 - 大罐温度变化较小
      tempFluctuation: 0.5
    };
  },
  watch: {
    selectedTank: {
      handler(newTank) {
        if (newTank && newTank.id !== this.currentTankId) {
          this.currentTankId = newTank.id;
          this.initializeChartData();
        } else if (!newTank) {
          this.clearChartData();
          this.currentTankId = null;
        }
      },
      immediate: true
    },
    currentTimeRange() {
      if (this.selectedTank) {
        this.initializeChartData();
      }
    }
  },
  mounted() {
    this.startDataUpdate();
  },
  beforeDestroy() {
    this.clearData();
  },
  methods: {
    // 改变时间范围
    changeTimeRange(range) {
      this.currentTimeRange = range;
      this.maxDataPoints = this.getMaxDataPoints(range);
    },

    // 根据时间范围获取最大数据点数
    getMaxDataPoints(range) {
      const pointsMap = {
        '24h': 96,   // 每15分钟一个点
        '7d': 84,    // 每2小时一个点
        '30d': 90    // 每天3个点（8小时一个点）
      };
      return pointsMap[range] || 96;
    },

    // 获取基于月份的基础温度 - 大罐温度相对稳定，但仍有季节性调整
    getBaseTemperatureByMonth(month) {
      const baseTemp = this.luzhouMonthlyTemps[month] || 20;
      // 大罐温度控制在18-25°C之间，根据季节微调
      let tankTemp;
      if (month >= 5 && month <= 9) {
        // 夏季：22-25°C
        tankTemp = 22 + (baseTemp - 20) * 0.3;
      } else if (month >= 11 || month <= 2) {
        // 冬季：18-21°C
        tankTemp = 19 + (baseTemp - 10) * 0.2;
      } else {
        // 春秋季：20-23°C
        tankTemp = 21 + (baseTemp - 15) * 0.2;
      }
      return Math.max(18, Math.min(25, tankTemp));
    },

    // 模拟大罐的自然温度变化 - 变化幅度较小
    getNaturalTemperature(date, isUpdate = false) {
      const month = date.getMonth() + 1;
      const hour = date.getHours();
      const baseTemp = this.getBaseTemperatureByMonth(month);
      
      // 大罐昼夜变化较小 - 约1°C
      const dailyCycle = Math.sin((hour - 6) * Math.PI / 12) * 0.5;
      
      // 随机波动较小
      let randomNoise;
      if (isUpdate) {
        // 更新时基于上次温度做更小幅度的变化
        const change = (Math.random() - 0.5) * 0.3;
        randomNoise = Math.max(-this.tempFluctuation, Math.min(this.tempFluctuation, change));
      } else {
        randomNoise = (Math.random() - 0.5) * this.tempFluctuation;
      }
      
      const temperature = baseTemp + dailyCycle + randomNoise;
      
      return Math.max(17, Math.min(26, temperature)); // 大罐温度控制在17-26°C
    },

    // 初始化图表数据 - 修改为大罐数据
    initializeChartData() {
      if (!this.selectedTank) {
        this.chartDataReady = false;
        return;
      }

      // 根据大罐状态设置基础液位
      if (this.selectedTank.status === 'empty') {
        this.baseLevel = 0;
      } else {
        // 大罐正常液位在9000-12000mm之间
        this.baseLevel = 9000 + Math.random() * 3000;
      }

      this.generateInitialData();
      this.updateChart();
      this.chartDataReady = true;
    },

    // 生成初始数据 - 修改为大罐参数
    generateInitialData() {
      this.levelData = [];
      this.temperatureData = [];
      this.timeLabels = [];

      const now = new Date();
      const pointCount = this.maxDataPoints;

      // 设置初始温度 - 使用新的温度生成方法
      const currentMonth = now.getMonth() + 1;
      this.lastTemperature = this.getBaseTemperatureByMonth(currentMonth);

      // 计算起始时间
      let startTime = new Date(now);
      switch (this.currentTimeRange) {
        case '24h':
          startTime.setMinutes(startTime.getMinutes() - (pointCount - 1) * 15);
          break;
        case '7d':
          startTime.setHours(startTime.getHours() - (pointCount - 1) * 2);
          break;
        case '30d':
          startTime.setHours(startTime.getHours() - (pointCount - 1) * 8);
          break;
      }

      // 从最早的时间开始生成数据
      for (let i = 0; i < pointCount; i++) {
        const time = new Date(startTime);
        
        // 根据时间范围调整时间间隔
        switch (this.currentTimeRange) {
          case '24h':
            time.setMinutes(time.getMinutes() + i * 15);
            this.timeLabels.push(time.getHours().toString().padStart(2, '0') + ':' + time.getMinutes().toString().padStart(2, '0'));
            break;
          case '7d':
            time.setHours(time.getHours() + i * 2);
            this.timeLabels.push(time.getMonth() + 1 + '/' + time.getDate() + ' ' + time.getHours().toString().padStart(2, '0') + ':00');
            break;
          case '30d':
            time.setHours(time.getHours() + i * 8);
            this.timeLabels.push(time.getMonth() + 1 + '/' + time.getDate() + ' ' + time.getHours().toString().padStart(2, '0') + ':00');
            break;
        }

        // 使用新的温度生成方法
        const temperature = this.getNaturalTemperature(time);
        
        // 根据大罐状态和温度变化生成液位数据
        let level;
        if (this.selectedTank.status === 'empty') {
          level = 0;
        } else if (this.selectedTank.status === 'leaking') {
          // 渗漏罐：液位持续下降，不受温度影响
          const leakAmount = i * this.leakRate;
          level = Math.max(0, this.baseLevel - leakAmount);
        } else {
          // 正常罐：液位随温度变化，温度变化5°C液位变化10mm（大罐变化幅度更大）
          const tempChangeFromBase = temperature - 21; // 相对于21°C基准的变化
          const levelChange = tempChangeFromBase * 2; // 温度每变化1°C，液位变化2mm
          level = this.baseLevel + levelChange;
        }

        // 添加微小随机波动
        const microFluctuation = (Math.random() - 0.5) * 10; // ±5mm的微小波动
        level += microFluctuation;

        // 确保液位不超过15000mm且不小于0
        level = Math.max(0, Math.min(15000, level));

        // 液位取整，不要小数
        this.levelData.push(Math.round(level));
        this.temperatureData.push(Number(temperature.toFixed(1)));
        
        // 更新最后温度用于连续性
        this.lastTemperature = temperature;
      }
    },

    // 模拟数据更新 - 修改为大罐参数
    simulateDataUpdate() {
      if (!this.selectedTank || this.levelData.length === 0) return;

      const now = new Date();
      let timeLabel = '';
      
      switch (this.currentTimeRange) {
        case '24h':
          timeLabel = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
          break;
        case '7d':
        case '30d':
          timeLabel = now.getMonth() + 1 + '/' + now.getDate() + ' ' + now.getHours().toString().padStart(2, '0') + ':00';
          break;
      }

      // 使用新的温度生成方法，传入true表示是更新操作
      const newTemp = this.getNaturalTemperature(now, true);

      // 计算液位变化
      let newLevel;
      if (this.selectedTank.status === 'empty') {
        newLevel = 0;
      } else if (this.selectedTank.status === 'leaking') {
        // 渗漏罐：持续下降
        const lastLevel = this.levelData[this.levelData.length - 1];
        newLevel = Math.max(0, lastLevel - this.leakRate);
      } else {
        // 正常罐：根据温度变化计算液位
        const lastLevel = this.levelData[this.levelData.length - 1];
        const tempChange = newTemp - this.lastTemperature;
        const levelChange = tempChange * 2; // 温度每变化1°C，液位变化2mm
        
        // 微小随机波动
        const microFluctuation = (Math.random() - 0.5) * 10;
        
        newLevel = lastLevel + levelChange + microFluctuation;
        newLevel = Math.max(0, Math.min(15000, newLevel));
      }

      // 更新最后温度
      this.lastTemperature = newTemp;

      // 添加新数据到数组末尾（最新时间），液位取整
      this.levelData.push(Math.round(newLevel));
      this.temperatureData.push(Number(newTemp.toFixed(1)));
      this.timeLabels.push(timeLabel);

      // 保持数据点数量，移除最旧的数据（数组开头）
      if (this.levelData.length > this.maxDataPoints) {
        this.levelData.shift();
        this.temperatureData.shift();
        this.timeLabels.shift();
      }

      this.updateChart();
    },

    // 更新图表配置 - 调整y轴范围为15000mm和温度范围
    updateChart() {
      this.chartOption = {
        tooltip: {
          trigger: 'axis',
          backgroundColor: 'rgba(0,0,0,.8)',
          borderColor: 'rgba(147, 235, 248, .8)',
          textStyle: {
            color: '#FFF',
          },
          formatter: (params) => {
            let result = params[0].axisValue + '<br/>';
            params.forEach(param => {
              const unit = param.seriesName === '液位' ? 'mm' : '°C';
              result += param.seriesName + ': ' + param.data + unit + '<br/>';
            });
            return result;
          }
        },
        legend: {
          data: ['液位', '温度'],
          textStyle: {
            color: '#7EB7FD'
          },
          top: 0
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          top: '15%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: this.timeLabels,
          axisLine: {
            lineStyle: {
              color: 'rgba(31,99,163,.1)',
            },
          },
          axisLabel: {
            color: '#7EB7FD',
            fontSize: 10,
            rotate: this.timeLabels.length > 20 ? 45 : 0
          },
          splitLine: {
            show: true,
            lineStyle: {
              color: 'rgba(31,99,163,.2)',
            },
          },
        },
        yAxis: [
          {
            type: 'value',
            name: '液位(mm)',
            position: 'left',
            nameTextStyle: {
              color: '#00EAFF',
              fontSize: 12
            },
            axisLine: {
              lineStyle: {
                color: '#00EAFF',
              },
            },
            axisLabel: {
              color: '#00EAFF',
              fontSize: 10
            },
            splitLine: {
              show: true,
              lineStyle: {
                color: 'rgba(31,99,163,.2)',
              },
            },
            min: 0,
            max: 15000 // 修改为大罐上限15000mm
          },
          {
            type: 'value',
            name: '温度(°C)',
            position: 'right',
            nameTextStyle: {
              color: '#FFA500',
              fontSize: 12
            },
            axisLine: {
              lineStyle: {
                color: '#FFA500',
              },
            },
            axisLabel: {
              color: '#FFA500',
              fontSize: 10
            },
            splitLine: {
              show: false,
            },
            min: 17, // 调整温度范围为大罐控制范围
            max: 26
          }
        ],
        series: [
          {
            name: '液位',
            type: 'line',
            yAxisIndex: 0,
            data: this.levelData,
            smooth: true,
            symbol: 'circle',
            symbolSize: 4,
            lineStyle: {
              width: 2,
              color: '#00EAFF'
            },
            itemStyle: {
              color: '#00EAFF'
            },
            areaStyle: {
              color: new graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: 'rgba(0,234,255,0.3)' },
                { offset: 1, color: 'rgba(0,234,255,0.1)' }
              ])
            }
          },
          {
            name: '温度',
            type: 'line',
            yAxisIndex: 1,
            data: this.temperatureData,
            smooth: true,
            symbol: 'circle',
            symbolSize: 4,
            lineStyle: {
              width: 2,
              color: '#FFA500'
            },
            itemStyle: {
              color: '#FFA500'
            }
          }
        ]
      };
    },

    // 启动数据更新
    startDataUpdate() {
      if (this.dataTimer) {
        clearInterval(this.dataTimer);
      }
      
      this.dataTimer = setInterval(() => {
        if (this.selectedTank) {
          this.simulateDataUpdate();
        }
      }, 5000); // 每5秒更新一次数据
    },

    // 清空图表数据
    clearChartData() {
      this.chartDataReady = false;
      this.levelData = [];
      this.temperatureData = [];
      this.timeLabels = [];
      this.chartOption = {};
      this.baseLevel = 12000; // 重置为大罐基础液位
      this.lastTemperature = 21;
    },

    // 清理资源
    clearData() {
      if (this.dataTimer) {
        clearInterval(this.dataTimer);
        this.dataTimer = null;
      }
    }
  }
};
</script>

<style lang='scss' scoped>
.right_bottom {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 10px;
  box-sizing: border-box;

  .chart-controls {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    margin-bottom: 15px;
    flex-shrink: 0;

    .time-range {
      display: flex;
      gap: 5px;

      .time-btn {
        background: rgba(0, 231, 238, 0.1);
        border: 1px solid rgba(0, 231, 238, 0.3);
        color: #8abcd1;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 10px;
        cursor: pointer;
        transition: all 0.3s;

        &:hover {
          background: rgba(0, 231, 238, 0.2);
          color: #00eaff;
        }

        &.active {
          background: rgba(0, 231, 238, 0.3);
          border-color: #00eaff;
          color: #00eaff;
        }
      }
    }
  }

  .chart-container {
    flex: 1;
    min-height: 0;
    width: 100%;
  }

  .no-data {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #8abcd1;

    .placeholder {
      font-size: 48px;
      margin-bottom: 15px;
    }

    p {
      margin: 0;
      font-size: 14px;
    }
  }
}
</style>