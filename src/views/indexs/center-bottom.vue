<!--
 * @Author: daidai
 * @Date: 2022-03-01 14:13:04
 * @LastEditors: Please set LastEditors
 * @LastEditTime: 2022-09-27 15:04:49
 * @FilePath: \web-pc\src\pages\big-screen\view\indexs\center-bottom.vue
-->
<template>
  <div class="center-bottom">
    <!-- 有选中陶坛时显示的内容 -->
    <template v-if="selectedVat">
      <!-- 陶坛基本信息 -->
      <div class="vat-info">
        <div class="info-grid">
          <div class="info-row">
            <div class="info-item">
              <span class="label">编号</span>
              <span class="value">{{ selectedVat.fullId }}</span>
            </div>
            <div class="info-item">
              <span class="label">状态</span>
              <span class="value" :class="getStatusClass(selectedVat.status)">
                {{ getStatusText(selectedVat.status) }}
              </span>
            </div>
          </div>
          <div class="info-row">
            <div class="info-item">
              <span class="label">液位(mm)</span>
              <span class="value">{{ liquidLevel }}mm</span>
            </div>
            <div class="info-item">
              <span class="label">香型</span>
              <span class="value">{{ selectedVat.aromaType }}</span>
            </div>
          </div>
          <div class="info-row">
            <div class="info-item">
              <span class="label">温度(°C)</span>
              <span class="value">{{ currentTemperature }}°C</span>
            </div>
            <div class="info-item">
              <span class="label">酒精度(%)</span>
              <span class="value">{{ selectedVat.alcohol }}%</span>
            </div>
          </div>
          <div class="info-row">
            <div class="info-item">
              <span class="label">密度(kg/m³)</span>
              <span class="value">{{ density }}kg/m³</span>
            </div>
            <div class="info-item">
              <span class="label">折算体积(m³)</span>
              <span class="value">{{ convertedVolume }}m³</span>
            </div>
          </div>
          <div class="info-row">
            <div class="info-item">
              <span class="label">折算重量(kg)</span>
              <span class="value">{{ convertedWeight }}kg</span>
            </div>
            <div class="info-item">
              <span class="label">入库时间</span>
              <span class="value">{{ selectedVat.storageDate }}</span>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- 无选中陶坛时的提示 -->
    <div v-else class="no-vat-selected">
      <div class="placeholder-icon">🏺</div>
      <p>请选择陶坛查看详情</p>
    </div>
  </div>
</template>

<script>
export default {
  name: "CenterBottom",
  props: {
    selectedVat: {
      type: Object,
      default: null
    }
  },
  data() {
    return {
      liquidLevel: 0, // 液位(mm)
      currentTemperature: 0, // 温度(°C)
      density: 0, // 密度(kg/m³)
      convertedVolume: 0, // 折算体积(m³)
      convertedWeight: 0 // 折算重量(kg)
    };
  },
  watch: {
    // 监听选中的陶坛变化
    selectedVat: {
      handler(newVat) {
        if (newVat) {
          console.log('属性更新:');
          this.updateRealTimeData();
          // 确保新选中的陶坛有香型和酒精度数据
          if (!newVat.aromaType) {
            this.$set(newVat, 'aromaType', this.generateAromaType());
          }
          if (!newVat.alcohol) {
            this.$set(newVat, 'alcohol', this.generateAlcoholContent());
          }
        } else {
          this.clearData();
        }
      },
      immediate: true
    }
  },
  methods: {
    // 生成香型数据
    generateAromaType() {
      const aromaTypes = ['酱香型', '浓香型', '清香型', '米香型', '兼香型'];
      return aromaTypes[Math.floor(Math.random() * aromaTypes.length)];
    },
    
    // 生成酒精度数据
    generateAlcoholContent() {
      return (40 + Math.random() * 20).toFixed(1);
    },
    
    // 获取状态样式类
    getStatusClass(status) {
      const statusMap = {
        normal: 'status-normal',
        leaking: 'status-leaking',
        empty: 'status-empty'
      };
      return statusMap[status] || 'status-normal';
    },
    
    // 获取状态文本
    getStatusText(status) {
      const statusMap = {
        normal: '正常',
        leaking: '渗漏',
        empty: '空坛'
      };
      return statusMap[status] || '未知';
    },

    // 更新实时数据（只在点击时触发）
    updateRealTimeData() {
      if (!this.selectedVat) return;

      // 根据陶坛状态生成数据
      if (this.selectedVat.status === 'empty') {
        // 空坛数据
        this.liquidLevel = 0;
        this.currentTemperature = 18 + Math.random() * 4;
        this.density = 0;
        this.convertedVolume = 0;
        this.convertedWeight = 0;
      } else {
        // 正常或渗漏状态的陶坛有液位
        const baseLevel = this.selectedVat.status === 'leaking' ? 
          Math.random() * 500 + 100 : // 渗漏状态液位较低 500-1000mm
          Math.random() * 500 + 500;  // 正常状态液位较高 1200-2000mm
        
        this.liquidLevel = Math.max(0, Math.min(1500, baseLevel));
        this.currentTemperature = 18 + Math.random() * 4;
        
        // 密度计算（与酒精度相关）
        const alcoholFactor = this.selectedVat.alcohol / 100;
        this.density = 950 + alcoholFactor * 40; // 900-940 kg/m³
        
        // 折算体积计算（基于液位和陶坛尺寸）
        // 假设陶坛底面积约为 0.8 m²
        const baseArea = 0.8;
        this.convertedVolume = (this.liquidLevel / 1000) * baseArea; // mm转m，然后乘以底面积
        
        // 折算重量计算
        this.convertedWeight = this.convertedVolume * this.density;
      }

      // 格式化数据
      this.liquidLevel = Math.round(this.liquidLevel);
      this.currentTemperature = Number(this.currentTemperature.toFixed(1));
      this.density = Math.round(this.density);
      this.convertedVolume = Number(this.convertedVolume.toFixed(3));
      this.convertedWeight = Math.round(this.convertedWeight);

      // 通知父组件数据更新（用于曲线图）
      this.$emit('data-update', {
        liquidLevel: this.liquidLevel,
        temperature: this.currentTemperature,
        density: this.density,
        convertedVolume: this.convertedVolume,
        convertedWeight: this.convertedWeight,
        timestamp: new Date(),
        vatId: this.selectedVat.id
      });
    },

    // 清理数据
    clearData() {
      this.liquidLevel = 0;
      this.currentTemperature = 0;
      this.density = 0;
      this.convertedVolume = 0;
      this.convertedWeight = 0;
    }
  }
};
</script>

<style lang="scss" scoped>
.center-bottom {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 10px;
  box-sizing: border-box;
}

.vat-info {
  background: rgba(5, 25, 55, 0.5);
  border: 1px solid rgba(0, 231, 238, 0.3);
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 15px;
  flex-shrink: 0;

  .info-grid {
    display: flex;
    flex-direction: column;
    gap: 10px;

    .info-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;

      .info-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 6px 10px;
        background: rgba(0, 0, 0, 0.2);
        border-radius: 6px;
        border: 1px solid rgba(0, 231, 238, 0.1);

        .label {
          color: #8abcd1;
          font-size: 12px;
          font-weight: 500;
        }

        .value {
          color: #fff;
          font-size: 12px;
          font-weight: 500;

          &.status-normal {
            color: #4ECDC4;
          }

          &.status-leaking {
            color: #FF6B6B;
          }

          &.status-empty {
            color: #FFA500;
          }
        }
      }
    }
  }
}

.no-vat-selected {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #8abcd1;

  .placeholder-icon {
    font-size: 48px;
    margin-bottom: 15px;
  }

  p {
    margin: 0;
    font-size: 14px;
  }
}

// 响应式调整
@media (max-width: 1400px) {
  .info-grid .info-row {
    gap: 8px;
    
    .info-item {
      padding: 4px 8px;
      
      .label, .value {
        font-size: 11px;
      }
    }
  }
}
</style>