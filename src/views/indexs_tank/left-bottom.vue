<!--
 * @Author: daidai
 * @Date: 2022-03-01 09:43:37
 * @LastEditors: Please set LastEditors
 * @LastEditTime: 2022-09-09 11:40:22
 * @FilePath: \web-pc\src\pages\big-screen\view\indexs\left-bottom.vue
-->
<template>
  <div
    v-if="pageflag"
    class="left_boottom_wrap beautify-scroll-def"
    :class="{ 'overflow-y-auto': !sbtxSwiperFlag }"
  >
    <component :is="components" :data="combinedAlarms" :class-option="defaultOption">
      <ul class="left_boottom">
        <li class="left_boottom_item" v-for="(item, i) in combinedAlarms" :key="i">
          <span class="orderNum doudong">{{ i + 1 }}</span>
          <div class="inner_right">
            <div class="dibu"></div>
            
            <!-- 报警类型行 -->
            <div class="alarm-type-row">
              <span
                class="alarm-type doudong"
                :class="{
                  'vibration-alarm': item.alarm_type === 'vibration',
                  'pressure-low-alarm': item.alarm_type === 'pressure_low',
                  'pressure-high-alarm': item.alarm_type === 'pressure_high',
                }"
              >
                {{ getAlarmTypeText(item.alarm_type) }}
              </span>
              <div v-if="item.alarm_type.includes('pressure')" class="alarm-detail-info">
                <span class="pressure-value">
                  压力值: {{ item.pressure_value }}kPa
                </span>
              </div>
            </div>
            
            <!-- 基本信息行 -->
            <div class="basic-info-row">
              <div class="info-item">
                <span class="label">大罐编号：</span>
                <span class="value tank-no">{{ item.tank_no }}</span>
              </div>
              <div class="info-item">
                <span class="label">报警时间：</span>
                <span class="value alarm-time">{{ formatTime(item.alarm_time) }}</span>
              </div>
            </div>
            
            <!-- 位置信息 -->
            <div class="position-info">
              <span class="label">大罐分布图：</span>
              <span class="value tank-position">{{ item.tank_pos }}</span>
            </div>

            <!-- 状态信息 -->
            <div class="status-info">
              <div class="status-item">
                <span class="label">处理状态：</span>
                <span
                  class="status-value"
                  :class="{
                    'status-pending': item.deal_status === '未处理',
                    'status-resolved': item.deal_status === '已处理',
                  }"
                >
                  {{ item.deal_status }}
                </span>
              </div>
              <div v-if="item.deal_person" class="deal-person-item">
                <span class="label">处理人：</span>
                <span class="value">{{ item.deal_person }}</span>
              </div>
            </div>

            <!-- 处理说明 -->
            <div v-if="item.deal_desc" class="deal-desc">
              <span class="label">处理说明：</span>
              <span class="value desc-text">{{ item.deal_desc }}</span>
            </div>
          </div>
        </li>
      </ul>
    </component>
  </div>

  <Reacquire v-else @onclick="getData" style="line-height: 200px" />
</template>

<script>
import { currentGET } from "api";
import vueSeamlessScroll from "vue-seamless-scroll"; // vue2引入方式
import Kong from "../../components/kong.vue";
export default {
  components: { vueSeamlessScroll, Kong },
  data() {
    return {
      lidAlarms: [], // 振动报警数据
      pressureAlarms: [], // 压力报警数据
      pageflag: true,
      components: vueSeamlessScroll,
      defaultOption: {
        ...this.$store.state.setting.defaultOption,
        singleHeight: 280,
        limitMoveNum: 5, 
        step: 0,
      },
    };
  },
  computed: {
    sbtxSwiperFlag() {
      let sbtxSwiper = this.$store.state.setting.sbtxSwiper;
      if (sbtxSwiper) {
        this.components = vueSeamlessScroll;
      } else {
        this.components = Kong;
      }
      return sbtxSwiper;
    },
    
    // 合并两种报警数据并按时间排序
    combinedAlarms() {
      const combined = [];
      
      // 处理振动报警数据
      this.lidAlarms.forEach(alarm => {
        combined.push({
          ...alarm,
          alarm_type: 'vibration',
          alarm_time: alarm.open_time,
          alarm_detail: '大罐异常开启'
        });
      });
      
      // 处理压力报警数据
      this.pressureAlarms.forEach(alarm => {
        combined.push({
          ...alarm,
          alarm_type: alarm.pressure_type,
          alarm_time: alarm.alarm_time,
          alarm_detail: `压力${alarm.pressure_type === 'pressure_low' ? '偏低' : '偏高'}，当前值: ${alarm.pressure_value}kPa`
        });
      });
      
      // 按报警时间倒序排列
      return combined.sort((a, b) => new Date(b.alarm_time) - new Date(a.alarm_time));
    }
  },
  created() {
    
  },

  mounted() {
    this.getData();
  },
  methods: {
    // 格式化时间显示
    formatTime(time) {
      if (!time) return '';
      const date = new Date(time);
      return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    },

    // 获取报警类型文本
    getAlarmTypeText(type) {
      const typeMap = {
        'vibration': '振动报警',
        'pressure_low': '压力偏低',
        'pressure_high': '压力偏高'
      };
      return typeMap[type] || '未知报警';
    },

    // 获取报警数据
    getData() {
      this.pageflag = true;
      
      // 并行获取两种报警数据
      Promise.all([
        currentGET("lidAlarms", { limitNum: 10 }),
        currentGET("pressureAlarms", { limitNum: 10 })
      ]).then(([lidRes, pressureRes]) => {
        console.log("振动报警数据:", lidRes);
        console.log("压力报警数据:", pressureRes);
        
        if (lidRes.success) {
          this.lidAlarms = lidRes.data.list || this.generateMockLidData();
        } else {
          this.lidAlarms = this.generateMockLidData();
        }
        
        if (pressureRes.success) {
          this.pressureAlarms = pressureRes.data.list || this.generateMockPressureData();
        } else {
          this.pressureAlarms = this.generateMockPressureData();
        }
        
        let timer = setTimeout(() => {
          clearTimeout(timer);
          this.defaultOption.step = this.$store.state.setting.defaultOption.step;
        }, this.$store.state.setting.defaultOption.waitTime);
        
      }).catch((error) => {
        console.error("获取报警数据失败:", error);
        // 接口异常时使用模拟数据
        this.lidAlarms = this.generateMockLidData();
        this.pressureAlarms = this.generateMockPressureData();
      });
    },

    // 生成模拟振动报警数据
    generateMockLidData() {
      const mockData = [];
      const now = new Date();
      const areaNames = ['A', 'B', 'C', 'D', 'E', 'F'];
      
      // 生成6个报警数据，每个区一个
      for (let areaIndex = 0; areaIndex < 6; areaIndex++) {
        const areaName = areaNames[areaIndex];
        const row = Math.floor(Math.random() * 4) + 1; // 1-4行
        const col = Math.floor(Math.random() * 6) + 1; // 1-6列
        
        const status = Math.random() > 0.5 ? '已处理' : '未处理';
        const randomTime = new Date(now.getTime() - Math.random() * 24 * 60 * 60 * 1000);
        
        // 生成大罐编号和位置，与主界面一致
        const tankNo = `${areaName}${row}-${col}`;
        const tankPos = `${areaName}区-${row}排-${col}列`;
        
        mockData.push({
          id: areaIndex + 1,
          tank_id: `${areaName}-${((row - 1) * 6 + col).toString().padStart(2, '0')}`,
          tank_pos: tankPos,
          tank_no: tankNo,
          open_time: randomTime.toISOString(),
          deal_status: status,
          deal_time: status === '已处理' ? new Date(randomTime.getTime() + 30 * 60 * 1000).toISOString() : null,
          deal_person: status === '已处理' ? ['张三', '李四', '王五'][Math.floor(Math.random() * 3)] : null,
          deal_desc: status === '已处理' ? '已现场检查并复位' : null
        });
      }
      
      return mockData;
    },

    // 生成模拟压力报警数据
    generateMockPressureData() {
      const mockData = [];
      const now = new Date();
      const areaNames = ['A', 'B', 'C', 'D', 'E', 'F'];
      
      // 生成6个报警数据，每个区一个
      for (let areaIndex = 0; areaIndex < 6; areaIndex++) {
        const areaName = areaNames[areaIndex];
        const row = Math.floor(Math.random() * 4) + 1; // 1-4行
        const col = Math.floor(Math.random() * 6) + 1; // 1-6列
        
        const status = Math.random() > 0.5 ? '已处理' : '未处理';
        const randomTime = new Date(now.getTime() - Math.random() * 24 * 60 * 60 * 1000);
        const pressureType = Math.random() > 0.5 ? 'pressure_low' : 'pressure_high';
        const pressureValue = pressureType === 'pressure_low' 
          ? (Math.random() * 50 + 50).toFixed(1)  // 50-100 kPa (偏低)
          : (Math.random() * 100 + 200).toFixed(1); // 200-300 kPa (偏高)
        
        // 生成大罐编号和位置，与主界面一致
        const tankNo = `${areaName}${row}-${col}`;
        const tankPos = `${areaName}区-${row}排-${col}列`;
        
        mockData.push({
          id: areaIndex + 1,
          tank_id: `${areaName}-${((row - 1) * 6 + col).toString().padStart(2, '0')}`,
          tank_pos: tankPos,
          tank_no: tankNo,
          alarm_time: randomTime.toISOString(),
          pressure_type: pressureType,
          pressure_value: pressureValue,
          deal_status: status,
          deal_time: status === '已处理' ? new Date(randomTime.getTime() + 30 * 60 * 1000).toISOString() : null,
          deal_person: status === '已处理' ? ['张三', '李四', '王五'][Math.floor(Math.random() * 3)] : null,
          deal_desc: status === '已处理' ? 
            (pressureType === 'pressure_low' ? '已调整压力阀' : '已检查泄压装置') : null
        });
      }
      
      return mockData;
    }
  }
};
</script>
<style lang='scss' scoped>
.left_boottom_wrap {
  overflow: hidden;
  width: 100%;
  height: 100%;
}

.doudong {
  overflow: hidden;
  -webkit-backface-visibility: hidden;
  -moz-backface-visibility: hidden;
  -ms-backface-visibility: hidden;
  backface-visibility: hidden;
}

.overflow-y-auto {
  overflow-y: auto;
}

.left_boottom {
  width: 100%;
  height: 100%;
  padding: 0 5px;

  .left_boottom_item {
    display: flex;
    align-items: flex-start;
    padding: 12px 8px;
    font-size: 14px;
    margin: 8px 0;
    background: rgba(5, 25, 55, 0.3);
    border: 1px solid rgba(0, 231, 238, 0.2);
    border-radius: 6px;
    
    .orderNum {
      margin: 0 12px 0 0;
      font-weight: bold;
      color: #00eaff;
      font-size: 16px;
      min-width: 24px;
      text-align: center;
      line-height: 1.4;
    }

    .inner_right {
      position: relative;
      flex: 1;
      max-width: 380px;
      line-height: 1.4;
      display: flex;
      flex-direction: column;
      gap: 8px;
      
      .dibu {
        position: absolute;
        height: 2px;
        width: 104%;
        background-image: url("../../assets/img/zuo_xuxian.png");
        bottom: -12px;
        left: -2%;
        background-size: cover;
      }

      // 报警类型行
      .alarm-type-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        
        .alarm-type {
          font-weight: bold;
          font-size: 14px;
          padding: 4px 10px;
          border-radius: 4px;
          
          &.vibration-alarm {
            color: #ff6b6b;
            background: rgba(255, 107, 107, 0.1);
            border: 1px solid rgba(255, 107, 107, 0.3);
          }
          
          &.pressure-low-alarm {
            color: #4ECDC4;
            background: rgba(78, 205, 196, 0.1);
            border: 1px solid rgba(78, 205, 196, 0.3);
          }
          
          &.pressure-high-alarm {
            color: #ffa500;
            background: rgba(255, 165, 0, 0.1);
            border: 1px solid rgba(255, 165, 0, 0.3);
          }
        }
        
        .alarm-detail-info {
          .pressure-value {
            color: #ffa500;
            font-size: 12px;
            font-weight: bold;
          }
        }
      }

      // 基本信息行
      .basic-info-row {
        display: flex;
        justify-content: space-between;
        
        .info-item {
          display: flex;
          align-items: center;
          
          .label {
            color: rgba(255, 255, 255, 0.6);
            font-size: 12px;
            margin-right: 4px;
            flex-shrink: 0;
          }
          
          .value {
            color: #fff;
            font-size: 12px;
            
            &.tank-no {
              color: #1890ff;
              font-weight: bold;
            }
            
            &.alarm-time {
              color: #ffa500;
              font-weight: bold;
            }
          }
        }
      }

      // 位置信息
      .position-info {
        display: flex;
        align-items: center;
        
        .label {
          color: rgba(255, 255, 255, 0.6);
          font-size: 12px;
          margin-right: 4px;
          flex-shrink: 0;
        }
        
        .value {
          color: #8abcd1;
          font-size: 12px;
        }
      }

      // 状态信息
      .status-info {
        display: flex;
        justify-content: space-between;
        
        .status-item {
          display: flex;
          align-items: center;
          
          .label {
            color: rgba(255, 255, 255, 0.6);
            font-size: 12px;
            margin-right: 4px;
            flex-shrink: 0;
          }
          
          .status-value {
            font-size: 12px;
            font-weight: bold;
            padding: 2px 8px;
            border-radius: 4px;
            
            &.status-pending {
              color: #ff4757;
              background: rgba(255, 71, 87, 0.2);
            }
            
            &.status-resolved {
              color: #2ed573;
              background: rgba(46, 213, 115, 0.2);
            }
          }
        }
        
        .deal-person-item {
          display: flex;
          align-items: center;
          
          .label {
            color: rgba(255, 255, 255, 0.6);
            font-size: 12px;
            margin-right: 4px;
            flex-shrink: 0;
          }
          
          .value {
            color: rgba(255, 255, 255, 0.7);
            font-size: 12px;
          }
        }
      }

      // 处理说明
      .deal-desc {
        display: flex;
        
        .label {
          color: rgba(255, 255, 255, 0.6);
          font-size: 12px;
          margin-right: 4px;
          flex-shrink: 0;
        }
        
        .value {
          color: #8abcd1;
          font-size: 12px;
          flex: 1;
        }
      }
    }
  }
}

// 滚动条美化
.beautify-scroll-def::-webkit-scrollbar {
  width: 6px;
}

.beautify-scroll-def::-webkit-scrollbar-thumb {
  background: rgba(0, 231, 238, 0.3);
  border-radius: 3px;
}

.beautify-scroll-def::-webkit-scrollbar-track {
  background: rgba(5, 25, 55, 0.3);
}
</style>