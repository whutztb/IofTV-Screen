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
      <p>请选择陶坛查看历史数据</p>
    </div>
  </div>
</template>

<script>
import { graphic } from 'echarts'

export default {
  name: "RightBottom",
  props: {
    selectedVat: {
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
      currentVatId: null
    };
  },
  watch: {
    selectedVat: {
      handler(newVat) {
        console.log('曲线更新:');
        if (newVat && newVat.id !== this.currentVatId) {
          this.currentVatId = newVat.id;
          this.initializeChartData();
        } else if (!newVat) {
          this.clearChartData();
          this.currentVatId = null;
        }
      },
      immediate: true
    },
    currentTimeRange() {
      if (this.selectedVat) {
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

    // 初始化图表数据
    initializeChartData() {
      if (!this.selectedVat) {
        this.chartDataReady = false;
        return;
      }

      this.generateInitialData();
      this.updateChart();
      this.chartDataReady = true;
    },

    // 生成初始数据
    generateInitialData() {
      this.levelData = [];
      this.temperatureData = [];
      this.timeLabels = [];

      const now = new Date();
      const pointCount = this.maxDataPoints;

      for (let i = pointCount - 1; i >= 0; i--) {
        const time = new Date(now);
        
        // 根据时间范围调整时间间隔
        switch (this.currentTimeRange) {
          case '24h':
            time.setMinutes(time.getMinutes() - i * 15); // 每15分钟一个点
            this.timeLabels.push(time.getHours().toString().padStart(2, '0') + ':' + time.getMinutes().toString().padStart(2, '0'));
            break;
          case '7d':
            time.setHours(time.getHours() - i * 2); // 每2小时一个点
            this.timeLabels.push(`${time.getMonth() + 1}/${time.getDate()} ${time.getHours().toString().padStart(2, '0')}:00`);
            break;
          case '30d':
            time.setHours(time.getHours() - i * 8); // 每8小时一个点
            this.timeLabels.push(`${time.getMonth() + 1}/${time.getDate()} ${time.getHours().toString().padStart(2, '0')}:00`);
            break;
        }

        // 根据陶坛状态生成不同的数据（液位单位改为mm，范围0-5000mm）
        const baseLevel = this.selectedVat.status === 'empty' ? 0 : 
                         this.selectedVat.status === 'leaking' ? 2000 + Math.random() * 1000 : 
                         4000 + Math.random() * 1000;
        
        const levelTrend = this.selectedVat.status === 'leaking' ? -0.5 * i : -0.1 * i;
        const levelFluctuation = (Math.random() - 0.5) * (this.selectedVat.status === 'leaking' ? 100 : 50);
        const level = Math.max(0, baseLevel + levelTrend + levelFluctuation);
        
        // 温度数据根据陶坛状态略有不同
        const baseTemp = this.selectedVat.status === 'leaking' ? 22 + Math.random() * 3 : 20;
        const tempCycle = Math.sin(i * 0.2) * 2;
        const tempNoise = (Math.random() - 0.5) * 1;
        const temperature = baseTemp + tempCycle + tempNoise;

        this.levelData.push(Number(level.toFixed(0))); // 液位取整毫米
        this.temperatureData.push(Number(temperature.toFixed(1)));
      }

      this.timeLabels.reverse();
    },

    // 模拟数据更新
    simulateDataUpdate() {
      if (!this.selectedVat || this.levelData.length === 0) return;

      const now = new Date();
      let timeLabel = '';
      
      switch (this.currentTimeRange) {
        case '24h':
          timeLabel = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
          break;
        case '7d':
        case '30d':
          timeLabel = `${now.getMonth() + 1}/${now.getDate()} ${now.getHours().toString().padStart(2, '0')}:00`;
          break;
      }

      // 生成新的数据点
      const lastLevel = this.levelData[this.levelData.length - 1];
      const lastTemp = this.temperatureData[this.temperatureData.length - 1];
      
      const levelChange = (Math.random() - 0.5) * (this.selectedVat.status === 'leaking' ? 30 : 10);
      const tempChange = (Math.random() - 0.5) * 0.3;
      
      const newLevel = Math.max(0, lastLevel + levelChange);
      const newTemp = lastTemp + tempChange;

      // 添加新数据
      this.levelData.push(Number(newLevel.toFixed(0))); // 液位取整毫米
      this.temperatureData.push(Number(newTemp.toFixed(1)));
      this.timeLabels.push(timeLabel);

      // 保持数据点数量
      if (this.levelData.length > this.maxDataPoints) {
        this.levelData.shift();
        this.temperatureData.shift();
        this.timeLabels.shift();
      }

      this.updateChart();
    },

    // 更新图表配置
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
            let result = `${params[0].axisValue}<br/>`;
            params.forEach(param => {
              const unit = param.seriesName === '液位' ? 'mm' : '°C';
              result += `${param.seriesName}: ${param.data}${unit}<br/>`;
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
            max: 5000
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
            min: 10,
            max: 30
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
        if (this.selectedVat) {
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