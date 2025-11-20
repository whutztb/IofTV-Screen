<!--
 * @Author: daidai
 * @Date: 2022-02-28 16:16:42
 * @LastEditors: Please set LastEditors
 * @LastEditTime: 2022-10-25 09:18:22
 * @FilePath: \web-pc\src\pages\big-screen\view\indexs\left-center.vue
-->
<template>
  <div class="cellar-stats-container" v-if="pageflag">
    <div class="table-container" ref="tableContainer">
      <!-- 固定表头 -->
      <div class="table-header-fixed">
        <table class="stats-table">
          <thead>
            <tr>
              <th style="width: 15%">酒库名称</th>
              <th style="width: 10%">缸型</th>
              <th style="width: 8%">总数</th>
              <th style="width: 10%">正常坛</th>
              <th style="width: 10%">渗漏坛</th>
              <th style="width: 8%">空坛</th>
              <th style="width: 12%">现有酒量</th>
              <th style="width: 12%">总容积</th>
              <th style="width: 15%">利用率</th>
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
                v-for="cellar in cellarData" 
                :key="cellar.id"
                :class="getRowClass(cellar)"
              >
                <td class="cellar-name" style="width: 15%">{{ cellar.cellar_name }}</td>
                <td style="width: 10%">{{ cellar.jar_type }}</td>
                <td style="width: 8%">{{ cellar.all_jar_num }}</td>
                <td class="normal-num" style="width: 10%">{{ getNormalNum(cellar) }}</td>
                <td class="leaking-num" style="width: 10%">{{ cellar.bad_jar_num }}</td>
                <td class="empty-num" style="width: 8%">{{ cellar.empty_jar_num }}</td>
                <td class="wine-volume" style="width: 12%">{{ formatVolume(cellar.all_wine_volume) }}</td>
                <td class="total-volume" style="width: 12%">{{ formatVolume(cellar.all_jar_volume) }}</td>
                <td class="usage-rate" style="width: 15%">
                  <div class="rate-bar">
                    <div 
                      class="rate-fill" 
                      :style="{ width: cellar.cellar_usage_rate + '%' }"
                    ></div>
                    <span class="rate-text">{{ cellar.cellar_usage_rate.toFixed(1) }}%</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          
          <!-- 复制一份用于无缝滚动 -->
          <table class="stats-table" v-if="cellarData.length > 0 && needScroll">
            <tbody>
              <tr 
                v-for="cellar in cellarData" 
                :key="cellar.id + '-copy'"
                :class="getRowClass(cellar)"
              >
                <td class="cellar-name" style="width: 15%">{{ cellar.cellar_name }}</td>
                <td style="width: 10%">{{ cellar.jar_type }}</td>
                <td style="width: 8%">{{ cellar.all_jar_num }}</td>
                <td class="normal-num" style="width: 10%">{{ getNormalNum(cellar) }}</td>
                <td class="leaking-num" style="width: 10%">{{ cellar.bad_jar_num }}</td>
                <td class="empty-num" style="width: 8%">{{ cellar.empty_jar_num }}</td>
                <td class="wine-volume" style="width: 12%">{{ formatVolume(cellar.all_wine_volume) }}</td>
                <td class="total-volume" style="width: 12%">{{ formatVolume(cellar.all_jar_volume) }}</td>
                <td class="usage-rate" style="width: 15%">
                  <div class="rate-bar">
                    <div 
                      class="rate-fill" 
                      :style="{ width: cellar.cellar_usage_rate + '%' }"
                    ></div>
                    <span class="rate-text">{{ cellar.cellar_usage_rate.toFixed(1) }}%</span>
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
        总计: {{ totalCellars }} 个酒库 | 
        正常坛: {{ totalNormal }} 个 | 
        渗漏坛: {{ totalLeaking }} 个 | 
        空坛: {{ totalEmpty }} 个
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
      cellarData: [],
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
    totalCellars() {
      return this.cellarData.length;
    },
    totalNormal() {
      return this.cellarData.reduce((sum, cellar) => {
        return sum + (cellar.all_jar_num - cellar.empty_jar_num - cellar.bad_jar_num);
      }, 0);
    },
    totalLeaking() {
      return this.cellarData.reduce((sum, cellar) => {
        return sum + cellar.bad_jar_num;
      }, 0);
    },
    totalEmpty() {
      return this.cellarData.reduce((sum, cellar) => {
        return sum + cellar.empty_jar_num;
      }, 0);
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
      this.useMockData();
    },
    
    // 生成与设备分布图一致的模拟数据
    useMockData() {
      const cellarData = [];
      
      // 4栋楼，每栋5层，每层8个房间
      const buildings = ['1号楼', '2号楼', '3号楼', '4号楼'];
      // 修改缸型描述：标准坛 -> 吨坛
      const jarTypes = ['吨坛', '半吨坛', '300KG坛', '吨坛', '半吨坛']; // 按楼层分配不同的缸型
      
      buildings.forEach((building, buildingIndex) => {
        for (let floor = 1; floor <= 5; floor++) {
          for (let roomNum = 1; roomNum <= 8; roomNum++) {
            // 房间编号：楼层+房间号，如101, 102, ..., 508
            const roomNumber = floor * 100 + roomNum;
            
            // 生成唯一酒库名称：楼栋-楼层-房间号库，如1-1-01库
            const cellarName = `${buildingIndex + 1}-${floor}-${roomNum.toString().padStart(2, '0')}库`;
            
            // 随机生成酒库数据，保持与设备分布图一致
            const allJarNum = 100; // 每个房间100个陶坛
            const emptyJarNum = Math.floor(Math.random() * 6); // 0-5个空坛
            const badJarNum = Math.floor(Math.random() * 4); // 0-3个渗漏坛
            const normalJarNum = allJarNum - emptyJarNum - badJarNum;
            
            // 根据楼层选择缸型
            const jarType = jarTypes[floor - 1];
            
            // 计算容积（根据缸型）
            let singleJarVolume;
            switch(jarType) {
              case '吨坛':
                singleJarVolume = 1000; // 1000L
                break;
              case '半吨坛':
                singleJarVolume = 500; // 500L
                break;
              case '300KG坛':
                singleJarVolume = 300; // 300L
                break;
              default:
                singleJarVolume = 1000;
            }
            
            const allJarVolume = allJarNum * singleJarVolume;
            
            // 计算现有酒量（正常坛满容量，渗漏坛部分容量，空坛0容量）
            const normalVolume = normalJarNum * singleJarVolume*0.9;
            const leakingVolume = badJarNum * singleJarVolume * (0.2 + Math.random() * 0.3); // 渗漏坛剩余20%-50%
            const allWineVolume = normalVolume + leakingVolume;
            
            // 计算利用率
            const cellarUsageRate = (allWineVolume / allJarVolume) * 100;
            
            cellarData.push({
              id: `${buildingIndex + 1}-${floor}-${roomNum}`,
              cellar_id: `${building.charAt(0)}${roomNumber}`,
              cellar_name: cellarName, // 使用唯一酒库名称
              cellar_pos: `${building}-${floor}层`,
              jar_type: jarType,
              all_jar_num: allJarNum,
              empty_jar_num: emptyJarNum,
              bad_jar_num: badJarNum,
              all_wine_volume: Math.round(allWineVolume),
              all_jar_volume: allJarVolume,
              cellar_usage_rate: parseFloat(cellarUsageRate.toFixed(1))
            });
          }
        }
      });
      
      this.cellarData = cellarData;
      
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
    
    // 计算正常坛数量
    getNormalNum(cellar) {
      return cellar.all_jar_num - cellar.empty_jar_num - cellar.bad_jar_num;
    },
    
    // 格式化体积显示
    formatVolume(volume) {
      if (volume >= 10000) {
        return (volume / 1000).toFixed(1) + '吨';
      }
      return volume.toFixed(0) + 'L';
    },
    
    // 获取行样式
    getRowClass(cellar) {
      const classes = [];
      
      // 根据利用率设置不同样式
      if (cellar.cellar_usage_rate >= 90) {
        classes.push('high-usage');
      } else if (cellar.cellar_usage_rate <= 60) {
        classes.push('low-usage');
      }
      
      // 根据异常坛数量设置警告样式
      if (cellar.bad_jar_num > 5) {
        classes.push('warning-row');
      }
      
      return classes;
    }
  }
};
</script>

<style lang="scss" scoped>
.cellar-stats-container {
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
    table-layout: fixed;
    
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
}

.stats-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  table-layout: fixed;
  
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
    
    &.warning-row {
      background: rgba(255, 77, 79, 0.1);
    }
  }
  
  .cellar-name {
    color: #00eaff;
    font-weight: bold;
  }
  
  .normal-num {
    color: #56B557;
  }
  
  .leaking-num {
    color: #FF4D4F;
  }
  
  .empty-num {
    color: #ECA444;
  }
  
  .wine-volume {
    color: #33A1DB;
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