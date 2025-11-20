<!--
 * @Author: daidai
 * @Date: 2022-02-28 16:16:42
 * @LastEditors: Please set LastEditors
 * @LastEditTime: 2022-10-25 09:18:22
 * @FilePath: \web-pc\src\pages\big-screen\view\indexs\left-center.vue
-->
<template>
  <div class="tank-stats-container" v-if="pageflag">
    <div class="table-container" ref="tableContainer">
      <!-- 固定表头 -->
      <div class="table-header-fixed">
        <table class="stats-table">
          <thead>
            <tr>
              <th style="width: 15%">大罐编号</th>
              <th style="width: 10%">罐型</th>
              <th style="width: 12%">液位(mm)</th>
              <th style="width: 10%">酒度(%)</th>
              <th style="width: 10%">温度(°C)</th>
              <th style="width: 12%">现有酒量(t)</th>
              <th style="width: 10%">总容积(t)</th>
              <th style="width: 21%">利用率</th>
            </tr>
          </thead>
        </table>
      </div>
      
      <!-- 滚动内容区域 -->
      <div class="table-content-scroll" ref="tableContent">
        <div class="table-scroll" :style="scrollStyle">
          <table class="stats-table">
            <tbody>
              <tr 
                v-for="tank in tankData" 
                :key="tank.id"
                :class="getRowClass(tank)"
              >
                <td class="tank-name" style="width: 15%">{{ tank.tank_number }}</td>
                <td style="width: 10%">{{ tank.tank_type }}</td>
                <td class="liquid-level" style="width: 12%">{{ tank.liquid_level }}</td>
                <td class="alcohol-content" style="width: 10%">{{ tank.alcohol_content }}</td>
                <td class="temperature" style="width: 10%">{{ tank.temperature }}</td>
                <td class="current-volume" style="width: 12%">{{ tank.current_volume }}</td>
                <td class="total-volume" style="width: 10%">{{ tank.total_volume }}</td>
                <td class="usage-rate" style="width: 21%">
                  <div class="rate-bar">
                    <div 
                      class="rate-fill" 
                      :style="{ width: tank.utilization_rate + '%' }"
                    ></div>
                    <span class="rate-text">{{ tank.utilization_rate.toFixed(1) }}%</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          
          <!-- 复制一份用于无缝滚动 -->
          <table class="stats-table" v-if="tankData.length > 0 && needScroll">
            <tbody>
              <tr 
                v-for="tank in tankData" 
                :key="tank.id + '-copy'"
                :class="getRowClass(tank)"
              >
                <td class="tank-name" style="width: 15%">{{ tank.tank_number }}</td>
                <td style="width: 10%">{{ tank.tank_type }}</td>
                <td class="liquid-level" style="width: 12%">{{ tank.liquid_level }}</td>
                <td class="alcohol-content" style="width: 10%">{{ tank.alcohol_content }}</td>
                <td class="temperature" style="width: 10%">{{ tank.temperature }}</td>
                <td class="current-volume" style="width: 12%">{{ tank.current_volume }}</td>
                <td class="total-volume" style="width: 10%">{{ tank.total_volume }}</td>
                <td class="usage-rate" style="width: 21%">
                  <div class="rate-bar">
                    <div 
                      class="rate-fill" 
                      :style="{ width: tank.utilization_rate + '%' }"
                    ></div>
                    <span class="rate-text">{{ tank.utilization_rate.toFixed(1) }}%</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
    
    <div class="stats-footer">
      <div class="total-info">
        总计: {{ totalTanks }} 个大罐 | 
        正常罐: {{ totalNormal }} 个 | 
        高利用率(>90%): {{ totalHighUsage }} 个 | 
        低利用率(<60%): {{ totalLowUsage }} 个
      </div>
    </div>
  </div>
  
  <Reacquire v-else @onclick="getData" style="line-height:200px">
    重新获取
  </Reacquire>
</template>

<script>
import { currentGET } from 'api/modules'

export default {
  data() {
    return {
      tankData: [],
      scrollPosition: 0,
      scrollSpeed: 2,
      scrollDirection: 1,
      scrollTimer: null,
      pageflag: true,
      timer: null,
      needScroll: false
    };
  },
  computed: {
    scrollStyle() {
      return {
        transform: 'translateY(-' + this.scrollPosition + 'px)'
      };
    },
    totalTanks() {
      return this.tankData.length;
    },
    totalNormal() {
      return this.tankData.filter(tank => tank.status === 'normal').length;
    },
    totalHighUsage() {
      return this.tankData.filter(tank => tank.utilization_rate >= 90).length;
    },
    totalLowUsage() {
      return this.tankData.filter(tank => tank.utilization_rate <= 60).length;
    }
  },
  created() {
    this.getData();
  },
  mounted() {
    this.startAutoScroll();
  },
  beforeDestroy() {
    this.clearData();
    this.stopAutoScroll();
  },
  methods: {
    clearData() {
      if (this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }
    },
    
    stopAutoScroll() {
      if (this.scrollTimer) {
        clearInterval(this.scrollTimer);
        this.scrollTimer = null;
      }
    },
    
    startAutoScroll() {
      const self = this;
      this.scrollTimer = setInterval(() => {
        const container = self.$refs.tableContent;
        if (!container) return;
        
        const tableElement = container.querySelector('.stats-table');
        const tableHeight = tableElement ? tableElement.offsetHeight : 0;
        const containerHeight = container.offsetHeight;
        
        if (tableHeight <= containerHeight) {
          self.needScroll = false;
          return;
        }
        
        self.needScroll = true;
        self.scrollPosition += self.scrollSpeed * self.scrollDirection;
        
        const maxScroll = tableHeight;
        if (self.scrollPosition >= maxScroll) {
          self.scrollPosition = 0;
        } else if (self.scrollPosition < 0) {
          self.scrollPosition = maxScroll - 1;
        }
      }, 50);
    },
    
    getData() {
      this.pageflag = true;
      this.generateTankData();
    },
    
    // 生成大罐数据
    generateTankData() {
      const tankData = [];
      const areas = ['A', 'B', 'C', 'D', 'E', 'F'];
      const tankTypes = ['150t', '100t', '200t', '150t', '100t', '200t'];
      
      areas.forEach((area, areaIndex) => {
        for (let row = 1; row <= 4; row++) {
          for (let col = 1; col <= 6; col++) {
            // 大罐编号：A1-1, A1-2, ..., F4-6
            const tankNumber = `${area}${row}-${col}`;
            
            // 随机生成大罐数据
            const tankType = tankTypes[areaIndex];
            
            // 根据罐型确定总容积
            let totalVolume;
            switch(tankType) {
              case '150t':
                totalVolume = 150;
                break;
              case '100t':
                totalVolume = 100;
                break;
              case '200t':
                totalVolume = 200;
                break;
              default:
                totalVolume = 150;
            }
            
            // 生成液位数据 (0-15000mm)
            const maxLiquidLevel = 15000;
            const liquidLevel = Math.floor(Math.random() * maxLiquidLevel);
            
            // 计算当前酒量 (基于液位比例)
            const utilizationRate = (liquidLevel / maxLiquidLevel) * 100;
            const currentVolume = (totalVolume * utilizationRate / 100).toFixed(1);
            
            // 生成其他数据
            const alcoholContent = (45 + Math.random() * 25).toFixed(1); // 45-70%
            const temperature = (15 + Math.random() * 10).toFixed(1); // 15-25°C
            
            // 确定状态
            let status = 'normal';
            if (utilizationRate === 0) {
              status = 'empty';
            } else if (utilizationRate < 10) {
              status = 'low';
            } else if (utilizationRate > 95) {
              status = 'full';
            }
            
            tankData.push({
              id: `${area}-${row}-${col}`,
              tank_number: tankNumber,
              tank_type: tankType,
              liquid_level: liquidLevel,
              alcohol_content: alcoholContent,
              temperature: temperature,
              current_volume: currentVolume,
              total_volume: totalVolume,
              utilization_rate: parseFloat(utilizationRate.toFixed(1)),
              status: status,
              area: area,
              row: row,
              col: col
            });
          }
        }
      });
      
      this.tankData = tankData;
      
      const self = this;
      this.$nextTick(() => {
        self.stopAutoScroll();
        self.startAutoScroll();
      });
      
      this.switper();
    },
    
    // 轮询
    switper() {
      if (this.timer) {
        return;
      }
      const self = this;
      const looper = () => {
        self.getData();
      };
      const intervalTime = this.$store.state.setting.echartsAutoTime || 30000;
      this.timer = setInterval(looper, intervalTime);
    },
    
    // 获取行样式
    getRowClass(tank) {
      const classes = [];
      
      // 根据利用率设置不同样式
      if (tank.utilization_rate >= 90) {
        classes.push('high-usage');
      } else if (tank.utilization_rate <= 20) {
        classes.push('low-usage');
      }
      
      // 根据状态设置样式
      if (tank.status === 'empty') {
        classes.push('empty-tank');
      } else if (tank.status === 'low') {
        classes.push('low-tank');
      } else if (tank.status === 'full') {
        classes.push('full-tank');
      }
      
      return classes;
    }
  }
};
</script>

<style lang="scss" scoped>
.tank-stats-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: rgba(5, 25, 55, 0.8);
  border-radius: 8px;
  overflow: hidden;
}

.table-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

.table-header-fixed {
  flex-shrink: 0;
  z-index: 10;
  position: relative;
  
  .stats-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 12px;
    
    th {
      background: rgba(0, 114, 255, 0.3);
      color: #00eaff;
      font-weight: bold;
      padding: 8px 4px;
      text-align: center;
      border-bottom: 1px solid rgba(0, 231, 238, 0.3);
      white-space: nowrap;
    }
  }
}

.table-content-scroll {
  flex: 1;
  overflow: hidden;
  position: relative;
}

.table-scroll {
  position: absolute;
  width: 100%;
  /* 移除之前的transform样式，现在通过top定位来实现滚动 */
}

.stats-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  table-layout: fixed; /* 固定表格布局，确保列宽一致 */
  
  td {
    padding: 6px 4px;
    text-align: center;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    color: #ffffff;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  tr {
    &:hover {
      background: rgba(0, 231, 238, 0.1);
    }
    
    &.high-usage {
      background: rgba(86, 181, 87, 0.1);
    }
    
    &.low-usage {
      background: rgba(236, 164, 68, 0.1);
    }
    
    &.empty-tank {
      background: rgba(128, 128, 128, 0.1);
    }
    
    &.low-tank {
      background: rgba(255, 193, 7, 0.1);
    }
    
    &.full-tank {
      background: rgba(40, 167, 69, 0.1);
    }
  }
  
  .tank-name {
    color: #00eaff;
    font-weight: bold;
  }
  
  .liquid-level {
    color: #33A1DB;
    font-weight: bold;
  }
  
  .alcohol-content {
    color: #FFA500;
  }
  
  .temperature {
    color: #FF6B6B;
  }
  
  .current-volume {
    color: #56B557;
    font-weight: bold;
  }
  
  .total-volume {
    color: #8abcd1;
  }
  
  .usage-rate {
    min-width: 80px;
    
    .rate-bar {
      position: relative;
      height: 20px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 10px;
      overflow: hidden;
    }
    
    .rate-fill {
      height: 100%;
      background: linear-gradient(90deg, #56B557, #33A1DB);
      border-radius: 10px;
      transition: width 0.3s ease;
    }
    
    .rate-text {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 10px;
      font-weight: bold;
      color: #ffffff;
      text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
    }
  }
}

.stats-footer {
  padding: 8px 16px;
  background: rgba(0, 114, 255, 0.1);
  border-top: 1px solid rgba(0, 231, 238, 0.3);
  flex-shrink: 0;
  
  .total-info {
    font-size: 12px;
    color: #8abcd1;
    text-align: center;
  }
}

// 响应式调整
@media (max-width: 1400px) {
  .stats-table {
    font-size: 11px;
    
    th, td {
      padding: 4px 2px;
    }
  }
}
</style>