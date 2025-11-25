<template>
  <div class="centermap">
    <div class="maptitle">
      <div class="zuo"></div>
      <span class="titletext">{{ maptitle }}</span>
      <div class="you"></div>
    </div>
    <div class="mapwrap">
      <dv-border-box-13>
        <!-- 返回按钮，当不在顶层时显示 -->
        <div class="quanguo" @click="goBack" v-if="currentLevel !== 'area'">
          返回
        </div>

        <!-- 区域选择 -->
        <div v-if="currentLevel === 'area'" class="area-plan">
          <div class="areas-container">
            <div 
              v-for="area in areas" 
              :key="area.id"
              class="area-item"
              @click="selectArea(area)"
            >
              <div class="area-shape">
                <div class="tanks-grid">
                  <div 
                    v-for="n in 24" 
                    :key="n"
                    class="tank-indicator"
                  ></div>
                </div>
              </div>
              <div class="area-info">
                <div class="area-name">{{ area.name }}</div>
                <div class="area-stats">{{ area.tanks }}个大罐</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 大罐布置图 -->
        <div v-else-if="currentLevel === 'tank'" class="tank-plan">
          <div class="tank-header">
            <h3>{{ currentArea.name }} - 大罐分布</h3>
          </div>
          
          <div class="tank-container" ref="tankContainer">
            <div 
              v-for="tank in currentAreaTanks" 
              :key="tank.id"
              class="tank-item"
              :class="{ 
                active: selectedTankId === tank.id
              }"
              @click="selectTank(tank)"
            >
              <div class="tank-shape">
                <img 
                  :src="getTankImage(tank.status)" 
                  class="tank-image" 
                  :alt="'大罐' + tank.position"
                />
                <span class="tank-position">{{ tank.position }}</span>
              </div>
            </div>
          </div>
        </div>
      </dv-border-box-13>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      maptitle: "大罐分布图",
      currentLevel: "area", // area, tank
      currentArea: null,
      selectedTankId: null,
      areas: [
        { id: 1, name: "A区", tanks: 24, rows: 4, cols: 6 },
        { id: 2, name: "B区", tanks: 24, rows: 4, cols: 6 },
        { id: 3, name: "C区", tanks: 24, rows: 4, cols: 6 },
        { id: 4, name: "D区", tanks: 24, rows: 4, cols: 6 },
        { id: 5, name: "E区", tanks: 24, rows: 4, cols: 6 },
        { id: 6, name: "F区", tanks: 24, rows: 4, cols: 6 }
      ],
      tanks: [],
      tankSize: 30 // 默认大罐尺寸
    };
  },
  computed: {
    currentAreaTanks() {
      return this.tanks.filter(tank => tank.area === this.currentArea.id);
    }
  },
  created() {
    this.initializeTanks();
  },
  mounted() {
    // 添加窗口大小变化监听器
    window.addEventListener('resize', this.handleResize);
    this.$nextTick(() => {
      this.handleResize();
    });
  },
  beforeDestroy() {
    // 移除窗口大小变化监听器
    window.removeEventListener('resize', this.handleResize);
  },
  methods: {
    // 获取大罐图片（所有大罐都是正常状态）
    getTankImage(status) {
      try { 
        // 只使用绿色图片，因为所有大罐都是正常的
        return require('@/assets/img/tank.png');
      } catch (error) {
        console.error('加载图片失败:', error);
        return null;
      }
    },
    
    // 初始化大罐数据 - 所有大罐都是正常状态，4行6列布局
    initializeTanks() {
      const tanks = [];
      const areaNames = ['A', 'B', 'C', 'D', 'E', 'F'];
      
      // 6个区，每个区4行6列，共24个大罐
      areaNames.forEach((areaName, areaIndex) => {
        const areaId = areaIndex + 1;
        
        for (let row = 1; row <= 4; row++) {
          for (let col = 1; col <= 6; col++) {
            // 大罐编号：A01, A02, ..., F24
            const displayId = (row - 1) * 6 + col;
            const position = `${areaName}${row}-${col}`; // 位置：A1-1, A1-2, ...
            
            // 所有大罐状态都是正常的
            const status = 'normal';
            
            const fullId = `${areaName}-${displayId.toString().padStart(2, '0')}`;
            
            tanks.push({
              id: fullId,
              displayId: displayId.toString().padStart(2, '0'),
              position: position,
              area: areaId,
              row: row,
              col: col,
              status,
              capacity: 10000, // 大罐容量更大
              storageDate: this.generateRandomDate(),
              manager: this.generateRandomManager(),
              fullId: fullId
            });
          }
        }
      });
      
      this.tanks = tanks;
    },
    
    // 选择区域
    selectArea(area) {
      this.currentArea = area;
      this.currentLevel = "tank";
      this.maptitle = `${area.name} - 大罐分布`;
      
      // 调整大罐尺寸
      this.$nextTick(() => {
        this.adjustTankSize();
      });
    },
    
    // 选择大罐
    selectTank(tank) {
      this.selectedTankId = tank.id;
      
      // 将选中的大罐信息传递出去
      this.$emit('tank-selected', tank);
      
      console.log('选中大罐:', tank.fullId, '位置:', tank.position);
    },
    
    // 返回上一级
    goBack() {
      if (this.currentLevel === "tank") {
        this.currentLevel = "area";
        this.maptitle = "大罐分布图";
        this.selectedTankId = null;
      }
    },
    
    // 生成随机日期
    generateRandomDate() {
      const start = new Date(2020, 0, 1);
      const end = new Date();
      const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
      return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
    },
    
    // 生成随机负责人
    generateRandomManager() {
      const managers = ['张明堂', '李文东', '王乾坤'];
      return managers[Math.floor(Math.random() * managers.length)];
    },
    
    // 处理窗口大小变化
    handleResize() {
      // 根据窗口大小调整大罐尺寸
      this.adjustTankSize();
    },
    
    // 调整大罐尺寸 - 修改为4行6列布局
    adjustTankSize() {
      if (this.currentLevel !== 'tank') return;
      
      // 获取容器尺寸
      const container = this.$refs.tankContainer;
      if (!container) return;
      
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;
      
      // 计算合适的大罐尺寸 - 4行6列布局
      const gap = 8; // 间隙
      const cols = 6; // 列数改为6
      const rows = 4; // 行数改为4
      
      // 计算最大可能的大罐尺寸
      const maxTankWidth = (containerWidth - (cols - 1) * gap) / cols;
      const maxTankHeight = (containerHeight - (rows - 1) * gap) / rows;
      
      // 取较小值确保大罐能完全显示，留出一些边距
      const tankSize = Math.min(maxTankWidth, maxTankHeight) * 0.8;
      
      // 更新大罐尺寸
      this.tankSize = Math.max(25, Math.min(80, tankSize));
      document.documentElement.style.setProperty('--tank-size', `${this.tankSize}px`);
    }
  }
};
</script>

<style lang="scss" scoped>
// 定义CSS变量用于自适应布局
:root {
  --tank-size: 30px;
}

.centermap {
  margin-bottom: 30px;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;

  .maptitle {
    height: 60px;
    display: flex;
    justify-content: center;
    padding-top: 10px;
    box-sizing: border-box;
    flex-shrink: 0;

    .titletext {
      font-size: 28px;
      font-weight: 900;
      letter-spacing: 6px;
      background: linear-gradient(
        92deg,
        #0072ff 0%,
        #00eaff 48.8525390625%,
        #01aaff 100%
      );
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin: 0 10px;
    }

    .zuo,
    .you {
      background-size: 100% 100%;
      width: 29px;
      height: 20px;
      margin-top: 8px;
    }

    .zuo {
      background: url("../../assets/img/xiezuo.png") no-repeat;
    }

    .you {
      background: url("../../assets/img/xieyou.png") no-repeat;
    }
  }

  .mapwrap {
    flex: 1;
    min-height: 0;
    width: 100%;
    box-sizing: border-box;
    position: relative;

    // 强制第三方组件遵守容器尺寸
    ::v-deep .dv-border-box-13 {
      height: 100% !important;
      width: 100% !important;
      
      > div {
        height: 100% !important;
        width: 100% !important;
      }
    }

    .quanguo {
      position: absolute;
      right: 20px;
      top: 10px;
      width: 80px;
      height: 28px;
      border: 1px solid #00eded;
      border-radius: 10px;
      color: #00f7f6;
      text-align: center;
      line-height: 26px;
      letter-spacing: 6px;
      cursor: pointer;
      box-shadow: 0 2px 4px rgba(0, 237, 237, 0.5),
        0 0 6px rgba(0, 237, 237, 0.4);
      z-index: 10;
    }

    // 所有内部布局容器都需要高度约束
    .area-plan,
    .tank-plan {
      height: 100%;
      min-height: 0;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    // 区域选择样式 - 修改为4行6列预览
    .area-plan {
      .areas-container {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        grid-template-rows: repeat(2, 1fr);
        gap: 20px;
        padding: 20px;
        height: 100%;
        min-height: 0;
        
        .area-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 20px;
          border: 1px solid rgba(0, 231, 238, 0.5);
          border-radius: 10px;
          background: rgba(5, 25, 55, 0.5);
          cursor: pointer;
          transition: all 0.3s;
          min-height: 0;
          
          &:hover {
            transform: translateY(-5px);
            box-shadow: 0 5px 15px rgba(0, 231, 238, 0.3);
          }
          
          .area-shape {
            width: 140px; // 宽度增加以适应6列
            height: 100px; // 高度减少以适应4行
            background: linear-gradient(135deg, #2f90b9, #1781b5);
            border-radius: 8px;
            margin-bottom: 15px;
            position: relative;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 10px;
            
            .tanks-grid {
              display: grid;
              grid-template-columns: repeat(6, 1fr); // 改为6列
              grid-template-rows: repeat(4, 1fr);    // 改为4行
              gap: 2px;
              width: 100%;
              height: 100%;
              
              .tank-indicator {
                background: rgba(255, 255, 255, 0.3);
                border-radius: 2px;
                transition: all 0.3s ease;
                
                &:hover {
                  background: rgba(255, 255, 255, 0.5);
                }
              }
            }
          }
          
          .area-info {
            text-align: center;
            
            .area-name {
              font-size: 18px;
              color: #00eaff;
              margin-bottom: 5px;
              font-weight: bold;
            }
            
            .area-stats {
              font-size: 14px;
              color: #8abcd1;
            }
          }
        }
      }
    }

    // 大罐布置图样式 - 修改为4行6列布局
    .tank-plan {
      .tank-header {
        padding: 15px 20px;
        border-bottom: 1px solid rgba(0, 231, 238, 0.3);
        text-align: center;
        flex-shrink: 0;
        
        h3 {
          color: #00eaff;
          margin: 0;
          font-size: 20px;
        }
      }
      
      .tank-container {
        display: grid;
        grid-template-columns: repeat(6, 1fr); // 改为6列
        grid-template-rows: repeat(4, 1fr);    // 改为4行
        gap: 15px;
        padding: 20px;
        flex: 1;
        min-height: 0;
        overflow: hidden;
        
        .tank-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s ease;
          
          &:hover {
            transform: translateY(-3px);
          }

          &.active .tank-shape {
            box-shadow: 0 0 12px #00eaff, 0 0 20px rgba(0, 231, 238, 0.6);
          }

          .tank-shape {
            position: relative;
            width: var(--tank-size);
            height: var(--tank-size);
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .tank-image {
            width: 100%;
            height: 100%;
            object-fit: contain;
            filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.4));
          }

          .tank-position {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: calc(var(--tank-size) * 0.20); // 减小字体大小以适应位置标签
            color: white;
            font-weight: bold;
            text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
            z-index: 2;
            pointer-events: none;
          }
        }
      }
    }
  }
}

// 响应式设计
@media (max-width: 1200px) {
  .centermap .mapwrap .area-plan .areas-container {
    grid-template-columns: repeat(2, 1fr);
    grid-template-rows: repeat(3, 1fr);
    gap: 15px;
    padding: 15px;
  }
}

@media (max-width: 768px) {
  .centermap .mapwrap .area-plan .areas-container {
    grid-template-columns: 1fr;
    grid-template-rows: repeat(6, 1fr);
    gap: 10px;
    padding: 10px;
  }
  
  .centermap .mapwrap .tank-plan .tank-container {
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: repeat(8, 1fr);
    gap: 10px;
    padding: 10px;
  }
}
</style>