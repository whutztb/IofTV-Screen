<!--
 * @Author: daidai
 * @Date: 2022-03-01 14:13:04
 * @LastEditors: Please set LastEditors
 * @LastEditTime: 2022-09-27 15:04:49
 * @FilePath: \web-pc\src\pages\big-screen\view\indexs\center-bottom.vue
-->
<template>
  <div class="center-bottom">
    <!-- 有选中大罐时显示的内容 -->
    <template v-if="selectedTank">
      <!-- 大罐基本信息 -->
      <div class="tank-info">
        <div class="info-grid">
          <div class="info-row">
            <div class="info-item">
              <span class="label">编号</span>
              <span class="value">{{ selectedTank.position }}</span>
            </div>
            <div class="info-item">
              <span class="label">状态</span>
              <span class="value" :class="getStatusClass(selectedTank.status)">
                {{ getStatusText(selectedTank.status) }}
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
              <span class="value">{{ selectedTank.aromaType }}</span>
            </div>
          </div>
          <div class="info-row">
            <div class="info-item">
              <span class="label">温度(°C)</span>
              <span class="value">{{ currentTemperature }}°C</span>
            </div>
            <div class="info-item">
              <span class="label">酒精度(%vol)</span>
              <span class="value">{{ selectedTank.alcohol }}%vol</span>
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
              <span class="label">折算重量(t)</span>
              <span class="value">{{ convertedWeight }}t</span>
            </div>
            <div class="info-item">
              <span class="label">入库时间</span>
              <span class="value">{{ selectedTank.storageDate }}</span>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- 无选中大罐时的提示 -->
    <div v-else class="no-tank-selected">
      <div class="placeholder-icon">📊</div>
      <p>请选择大罐查看详情</p>
    </div>
  </div>
</template>

<script>
export default {
  name: "CenterBottom",
  props: {
    selectedTank: {
      type: Object,
      default: null
    }
  },
  data() {
    return {
      liquidLevel: 12000, // 液位(mm) - 大罐液位更高
      currentTemperature: 21, // 温度(°C)
      density: 920, // 密度(kg/m³)
      convertedVolume: 120, // 折算体积(m³)
      convertedWeight: 110.4 // 折算重量(t)
    };
  },
  watch: {
    // 监听选中的大罐变化
    selectedTank: {
      handler(newTank) {
        if (newTank) {
          console.log('大罐详情更新:', newTank);
          this.updateTankData();
          // 确保新选中的罐有香型和酒精度数据
          if (!newTank.aromaType) {
            this.$set(newTank, 'aromaType', this.generateAromaType());
          }
          if (!newTank.alcohol) {
            this.$set(newTank, 'alcohol', this.generateAlcoholContent());
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
      const aromaTypes = ['浓香型', '酱香型'];
      return aromaTypes[Math.floor(Math.random() * aromaTypes.length)];
    },
    
    // 生成酒精度数据（45-70之间）
    generateAlcoholContent() {
      return (45 + Math.random() * 25).toFixed(1);
    },

    // 根据酒精度计算密度（符合物理规律：酒精度越高密度越低）
    calculateDensity(alcohol) {
      // 白酒密度与酒精度的经验公式
      // 酒精度45%vol时密度约920 kg/m³，70%vol时密度约860 kg/m³
      const minDensity = 860;  // 70%vol时的密度
      const maxDensity = 920;  // 45%vol时的密度
      
      // 线性插值计算密度
      const alcoholRatio = (alcohol - 45) / (70 - 45); // 0-1之间
      return maxDensity - alcoholRatio * (maxDensity - minDensity);
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
        empty: '空罐'
      };
      return statusMap[status] || '未知';
    },

    // 更新大罐数据
    updateTankData() {
      if (!this.selectedTank) return;

      // 根据大罐状态生成数据
      if (this.selectedTank.status === 'empty') {
        // 空罐数据
        this.liquidLevel = 0;
        this.currentTemperature = 20 + Math.random() * 2;
        this.density = 0;
        this.convertedVolume = 0;
        this.convertedWeight = 0;
      } else {
        // 正常或渗漏状态的大罐有液位
        const baseLevel = this.selectedTank.status === 'leaking' ? 
          Math.random() * 3000 + 2000 : // 渗漏状态液位较低 2000-5000mm
          Math.random() * 3000 + 9000;  // 正常状态液位较高 9000-12000mm
        
        this.liquidLevel = Math.max(0, Math.min(15000, baseLevel));
        this.currentTemperature = 20 + Math.random() * 2;
        
        // 密度计算（与酒精度成反比，符合物理规律）
        const alcohol = parseFloat(this.selectedTank.alcohol);
        this.density = this.calculateDensity(alcohol);
        
        // 折算体积计算（基于液位和大罐底面积10平方米）
        const baseArea = 10; // 大罐底面积10平方米
        this.convertedVolume = (this.liquidLevel / 1000) * baseArea; // mm转m，然后乘以底面积
        
        // 折算重量计算（吨 = kg / 1000）
        this.convertedWeight = (this.convertedVolume * this.density) / 1000;
      }

      // 格式化数据
      this.liquidLevel = Math.round(this.liquidLevel);
      this.currentTemperature = Number(this.currentTemperature.toFixed(1));
      this.density = Math.round(this.density);
      this.convertedVolume = Number(this.convertedVolume.toFixed(1));
      this.convertedWeight = Number(this.convertedWeight.toFixed(2));

      // 通知父组件数据更新（用于曲线图）
      this.$emit('data-update', {
        liquidLevel: this.liquidLevel,
        temperature: this.currentTemperature,
        density: this.density,
        convertedVolume: this.convertedVolume,
        convertedWeight: this.convertedWeight,
        timestamp: new Date(),
        tankId: this.selectedTank.id
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

.tank-info {
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
        padding: 8px 12px;
        background: rgba(0, 0, 0, 0.2);
        border-radius: 6px;
        border: 1px solid rgba(0, 231, 238, 0.1);

        .label {
          color: #8abcd1;
          font-size: 14px;
          font-weight: 500;
        }

        .value {
          color: #fff;
          font-size: 14px;
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

.no-tank-selected {
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
    font-size: 16px;
  }
}

// 响应式调整
@media (max-width: 1400px) {
  .info-grid .info-row {
    gap: 8px;
    
    .info-item {
      padding: 6px 10px;
      
      .label, .value {
        font-size: 13px;
      }
    }
  }
}
</style>