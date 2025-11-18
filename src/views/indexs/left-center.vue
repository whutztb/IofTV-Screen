<!--
 * @Author: daidai
 * @Date: 2022-02-28 16:16:42
 * @LastEditors: Please set LastEditors
 * @LastEditTime: 2022-10-25 09:18:22
 * @FilePath: \web-pc\src\pages\big-screen\view\indexs\left-center.vue
-->
<template>
  <div class="cellar-stats-container" v-if="pageflag">
    <!-- 删除表头部分 -->
    
    <div class="table-container" ref="tableContainer">
      <div class="table-scroll" :style="scrollStyle">
        <table class="stats-table">
          <thead>
            <tr>
              <th>酒库名称</th>
              <th>位置</th>
              <th>缸型</th>
              <th>总数</th>
              <th>正常坛</th>
              <th>渗漏坛</th>
              <th>空坛</th>
              <th>现有酒量</th>
              <th>总容积</th>
              <th>利用率</th>
            </tr>
          </thead>
          <tbody>
            <tr 
              v-for="cellar in cellarData" 
              :key="cellar.id"
              :class="getRowClass(cellar)"
            >
              <td class="cellar-name">{{ cellar.cellar_name }}</td>
              <td>{{ cellar.cellar_pos }}</td>
              <td>{{ cellar.jar_type }}</td>
              <td>{{ cellar.all_jar_num }}</td>
              <td class="normal-num">{{ getNormalNum(cellar) }}</td>
              <td class="leaking-num">{{ cellar.bad_jar_num }}</td>
              <td class="empty-num">{{ cellar.empty_jar_num }}</td>
              <td class="wine-volume">{{ formatVolume(cellar.all_wine_volume) }}</td>
              <td class="total-volume">{{ formatVolume(cellar.all_jar_volume) }}</td>
              <td class="usage-rate">
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
          <thead>
            <tr>
              <th>酒库名称</th>
              <th>位置</th>
              <th>缸型</th>
              <th>总数</th>
              <th>正常坛</th>
              <th>渗漏坛</th>
              <th>空坛</th>
              <th>现有酒量</th>
              <th>总容积</th>
              <th>利用率</th>
            </tr>
          </thead>
          <tbody>
            <tr 
              v-for="cellar in cellarData" 
              :key="cellar.id + '-copy'"
              :class="getRowClass(cellar)"
            >
              <td class="cellar-name">{{ cellar.cellar_name }}</td>
              <td>{{ cellar.cellar_pos }}</td>
              <td>{{ cellar.jar_type }}</td>
              <td>{{ cellar.all_jar_num }}</td>
              <td class="normal-num">{{ getNormalNum(cellar) }}</td>
              <td class="leaking-num">{{ cellar.bad_jar_num }}</td>
              <td class="empty-num">{{ cellar.empty_jar_num }}</td>
              <td class="wine-volume">{{ formatVolume(cellar.all_wine_volume) }}</td>
              <td class="total-volume">{{ formatVolume(cellar.all_jar_volume) }}</td>
              <td class="usage-rate">
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
      scrollSpeed: 0.5,
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
      return this.cellarData.reduce(function(sum, cellar) {
        return sum + (cellar.all_jar_num - cellar.empty_jar_num - cellar.bad_jar_num);
      }, 0);
    },
    totalLeaking() {
      return this.cellarData.reduce(function(sum, cellar) {
        return sum + cellar.bad_jar_num;
      }, 0);
    },
    totalEmpty() {
      return this.cellarData.reduce(function(sum, cellar) {
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
      var self = this;
      this.scrollTimer = setInterval(function() {
        var container = self.$refs.tableContainer;
        if (!container) return;
        
        var tableElement = container.querySelector('.stats-table');
        var tableHeight = tableElement ? tableElement.offsetHeight : 0;
        var containerHeight = container.offsetHeight;
        
        // 如果表格高度小于容器高度，不需要滚动
        if (tableHeight <= containerHeight) {
          self.needScroll = false;
          return;
        }
        
        self.needScroll = true;
        self.scrollPosition += self.scrollSpeed * self.scrollDirection;
        
        // 到达底部或顶部时改变方向
        var maxScroll = tableHeight;
        if (self.scrollPosition >= maxScroll) {
          self.scrollPosition = 0;
        } else if (self.scrollPosition < 0) {
          self.scrollPosition = maxScroll - 1;
        }
      }, 50);
    },
    
    getData() {
      this.pageflag = true;
      
      // 使用模拟数据
      this.useMockData();
    },
    
    // 模拟数据
    useMockData() {
      this.cellarData = [
        {
          id: 1,
          cellar_id: "A001",
          cellar_name: "1号酒库",
          cellar_pos: "1号楼-1层",
          jar_type: "标准坛",
          all_jar_num: 100,
          empty_jar_num: 2,
          bad_jar_num: 1,
          all_wine_volume: 85600,
          all_jar_volume: 100000,
          cellar_usage_rate: 85.6
        },
        {
          id: 2,
          cellar_id: "A002",
          cellar_name: "2号酒库",
          cellar_pos: "1号楼-2层",
          jar_type: "标准坛",
          all_jar_num: 100,
          empty_jar_num: 5,
          bad_jar_num: 3,
          all_wine_volume: 81000,
          all_jar_volume: 100000,
          cellar_usage_rate: 81.0
        },
        {
          id: 3,
          cellar_id: "B001",
          cellar_name: "3号酒库",
          cellar_pos: "2号楼-1层",
          jar_type: "半吨坛",
          all_jar_num: 100,
          empty_jar_num: 3,
          bad_jar_num: 2,
          all_wine_volume: 42000,
          all_jar_volume: 50000,
          cellar_usage_rate: 94.0
        },
        {
          id: 4,
          cellar_id: "B002",
          cellar_name: "4号酒库",
          cellar_pos: "2号楼-2层",
          jar_type: "半吨坛",
          all_jar_num: 100,
          empty_jar_num: 0,
          bad_jar_num: 2,
          all_wine_volume: 48000,
          all_jar_volume: 50000,
          cellar_usage_rate: 96.0
        },
        {
          id: 5,
          cellar_id: "C001",
          cellar_name: "5号酒库",
          cellar_pos: "3号楼-1层",
          jar_type: "300KG坛",
          all_jar_num: 100,
          empty_jar_num: 5,
          bad_jar_num: 0,
          all_wine_volume: 27000,
          all_jar_volume: 30000,
          cellar_usage_rate: 90.0
        },
        {
          id: 6,
          cellar_id: "C002",
          cellar_name: "6号酒库",
          cellar_pos: "3号楼-2层",
          jar_type: "标准坛",
          all_jar_num: 100,
          empty_jar_num: 1,
          bad_jar_num: 2,
          all_wine_volume: 85000,
          all_jar_volume: 100000,
          cellar_usage_rate: 85.0
        }
      ];
      
      // 重新开始滚动
      var self = this;
      this.$nextTick(function() {
        self.stopAutoScroll();
        self.startAutoScroll();
      });
      
      // 启动轮询
      this.switper();
    },
    
    // 轮询
    switper() {
      if (this.timer) {
        return;
      }
      var self = this;
      var looper = function(a) {
        self.getData();
      };
      var intervalTime = this.$store.state.setting.echartsAutoTime || 30000;
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
      var classes = [];
      
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

/* 删除 stats-header 相关样式 */

.table-container {
  flex: 1;
  overflow: hidden;
  position: relative;
  /* 调整上边距，因为删除了表头 */
  padding-top: 10px;
}

.table-scroll {
  position: absolute;
  width: 100%;
  transition: transform 0.1s linear;
}

.stats-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  
  th {
    background: rgba(0, 114, 255, 0.2);
    color: #00eaff;
    font-weight: bold;
    padding: 8px 4px;
    text-align: center;
    border-bottom: 1px solid rgba(0, 231, 238, 0.3);
    white-space: nowrap;
  }
  
  td {
    padding: 6px 4px;
    text-align: center;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    color: #ffffff;
    white-space: nowrap;
  }
  
  tr {
    transition: all 0.3s ease;
    
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