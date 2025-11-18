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
        <div class="quanguo" @click="goBack" v-if="currentLevel !== 'building'">
          返回
        </div>

        <!-- 楼栋选择 -->
        <div v-if="currentLevel === 'building'" class="building-plan">
          <div class="buildings-container">
            <div 
              v-for="building in buildings" 
              :key="building.id"
              class="building-item"
              @click="selectBuilding(building)"
            >
              <div class="building-shape">
                <div class="building-floors">
                  <div 
                    v-for="n in building.floors" 
                    :key="n"
                    class="floor-indicator"
                  ></div>
                </div>
              </div>
              <div class="building-info">
                <div class="building-name">{{ building.name }}</div>
                <div class="building-stats">{{ building.rooms }}间房</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 楼层选择 -->
        <div v-else-if="currentLevel === 'floor'" class="floor-plan">
          <div class="floor-header">
            <h3>{{ currentBuilding.name }}</h3>
          </div>
          
          <div class="floors-container">
            <div 
              v-for="floor in floors" 
              :key="floor.level"
              class="floor-item"
              @click="selectFloor(floor)"
            >
              <div class="floor-shape">
                <div class="room-indicators">
                  <div 
                    v-for="n in 8" 
                    :key="n"
                    class="room-indicator"
                  ></div>
                </div>
              </div>
              <div class="floor-info">
                <div class="floor-name">{{ floor.name }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 房间选择 -->
        <div v-else-if="currentLevel === 'room'" class="room-plan">
          <div class="room-header">
            <h3>{{ currentBuilding.name }} - {{ currentFloor.name }}</h3>
          </div>
          
          <div class="rooms-container">
            <div 
              v-for="room in currentRooms" 
              :key="room.id"
              class="room-item"
              @click="enterRoom(room)"
            >
              <div class="room-shape"></div>
              <div class="room-info">
                <div class="room-name">{{ room.name }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 房间陶坛布置图 -->
        <div v-else-if="currentLevel === 'vat'" class="vat-plan">
          <div class="vat-container" ref="vatContainer">
            <div 
              v-for="vat in vats" 
              :key="vat.id"
              class="vat-item"
              :class="{ 
                active: selectedVatId === vat.id
              }"
              @click="selectVat(vat)"
            >
              <div class="vat-shape">
                <img 
                  :src="getVatImage(vat.status)" 
                  class="vat-image" 
                  :alt="'陶坛' + vat.displayId"
                />
                <span class="vat-number">{{ vat.displayId }}</span>
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
      maptitle: "陶坛位置",
      currentLevel: "building", // building, floor, room, vat
      currentBuilding: null,
      currentFloor: null,
      currentRoom: null,
      selectedVatId: null,
      buildings: [
        { id: 1, name: "1号楼", floors: 5, rooms: 40 },
        { id: 2, name: "2号楼", floors: 5, rooms: 40 },
        { id: 3, name: "3号楼", floors: 5, rooms: 40 },
        { id: 4, name: "4号楼", floors: 5, rooms: 40 }
      ],
      floors: [
        { level: 1, name: "1层" },
        { level: 2, name: "2层" },
        { level: 3, name: "3层" },
        { level: 4, name: "4层" },
        { level: 5, name: "5层" }
      ],
      rooms: [],
      vats: [],
      vatSize: 20 // 默认陶坛尺寸
    };
  },
  computed: {
    currentRooms() {
      return this.rooms.filter(room => 
        room.building === this.currentBuilding.id && 
        room.floor === this.currentFloor.level
      );
    }
  },
  created() {
    this.initializeRooms();
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
    // 获取陶坛图片
    getVatImage(status) {
      try { 
        // 尝试不同的路径写法
        const imageMap = {
          'normal': require('@/assets/img/green.png'),
          'leaking': require('@/assets/img/red.png'),
          'empty': require('@/assets/img/yellow.png')
        };
        return imageMap[status] || imageMap.normal;
      } catch (error) {
        console.error('加载图片失败:', error);
        // 备用方案：使用 CSS 背景色
        return null;
      }
    },
    
    // 初始化房间数据
    initializeRooms() {
      const rooms = [];
      
      // 4栋楼，每栋5层，每层8个房间
      for (let building = 1; building <= 4; building++) {
        for (let floor = 1; floor <= 5; floor++) {
          for (let roomNum = 1; roomNum <= 8; roomNum++) {
            // 房间编号：楼层+房间号，如201, 202, ..., 208
            const roomNumber = floor * 100 + roomNum;
            
            rooms.push({
              id: `${building}-${floor}-${roomNum}`,
              name: `${roomNumber}室`,
              building: building,
              floor: floor,
              roomNumber: roomNumber
            });
          }
        }
      }
      
      this.rooms = rooms;
    },
    
    // 选择楼栋
    selectBuilding(building) {
      this.currentBuilding = building;
      this.currentLevel = "floor";
      this.maptitle = building.name;
    },
    
    // 选择楼层
    selectFloor(floor) {
      this.currentFloor = floor;
      this.currentLevel = "room";
      this.maptitle = `${this.currentBuilding.name} - ${floor.name}`;
    },
    
    // 进入房间
    enterRoom(room) {
      this.currentRoom = room;
      this.currentLevel = "vat";
      this.maptitle = `${this.currentBuilding.name} - ${this.currentFloor.name} - ${room.name}`;
      
      // 根据房间信息生成陶坛数据
      this.initializeVats(room);
      
      // 调整陶坛尺寸
      this.$nextTick(() => {
        this.adjustVatSize();
      });
    },
    
    // 返回上一级
    goBack() {
      if (this.currentLevel === "vat") {
        this.currentLevel = "room";
        this.maptitle = `${this.currentBuilding.name} - ${this.currentFloor.name}`;
        this.selectedVatId = null;
      } else if (this.currentLevel === "room") {
        this.currentLevel = "floor";
        this.maptitle = this.currentBuilding.name;
      } else if (this.currentLevel === "floor") {
        this.currentLevel = "building";
        this.maptitle = "陶坛位置";
      }
    },
    
    // 初始化陶坛数据
    initializeVats(room) {
      const vats = [];
      const buildingCode = room.building;
      const floorCode = room.floor;
      const roomCode = room.roomNumber % 100; // 获取房间号，如201室获取01
      
      // 生成100个陶坛，编号格式：01-100
      for (let i = 1; i <= 100; i++) {
        // 随机生成状态：正常坛(70%)，渗漏坛(10%)，空坛(20%)
        const rand = Math.random();
        let status;
        if (rand < 0.9) {
          status = 'normal'; // 正常坛
        } else if (rand < 0.95) {
          status = 'leaking'; // 渗漏坛
        } else {
          status = 'empty'; // 空坛
        }
        
        // 陶坛编号：01, 02, ..., 100
        const displayId = i.toString().padStart(2, '0');
        const fullId = `${buildingCode}-${floorCode}-${room.roomNumber}-${displayId}`;
        
        vats.push({
          id: fullId,
          displayId: displayId,
          status,
          capacity: 500,
          storageDate: this.generateRandomDate(),
          manager: this.generateRandomManager(),
          fullId: fullId
        });
      }
      
      this.vats = vats;
    },
    
    // 选择陶坛
    selectVat(vat) {
      this.selectedVatId = vat.id;
      
      // 在实际应用中，这里会调用父组件的方法或触发事件
      // 将选中的陶坛信息传递出去，以便在其他位置显示详情
      this.$emit('vat-selected', vat);
      
      console.log('选中陶坛:', vat.fullId, '状态:', vat.status);
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
      const managers = ['张三', '李四', '王五', '赵六', '钱七'];
      return managers[Math.floor(Math.random() * managers.length)];
    },
    
    // 处理窗口大小变化
    handleResize() {
      // 根据窗口大小调整陶坛尺寸
      this.adjustVatSize();
    },
    
    // 调整陶坛尺寸
    adjustVatSize() {
      if (this.currentLevel !== 'vat') return;
      
      // 获取容器尺寸
      const container = this.$refs.vatContainer;
      if (!container) return;
      
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;
      
      // 计算合适的陶坛尺寸
      const gap = 4; // 减小间隙
      const cols = 10; // 列数
      const rows = 10; // 行数
      
      // 计算最大可能的陶坛尺寸
      const maxVatWidth = (containerWidth - (cols - 1) * gap) / cols;
      const maxVatHeight = (containerHeight - (rows - 1) * gap) / rows;
      
      // 取较小值确保陶坛能完全显示，留出一些边距
      const vatSize = Math.min(maxVatWidth, maxVatHeight) * 0.85;
      
      // 更新陶坛尺寸
      this.vatSize = Math.max(20, Math.min(40, vatSize)); // 限制最小和最大尺寸
      
      // 应用尺寸到CSS变量
      document.documentElement.style.setProperty('--vat-size', `${this.vatSize}px`);
    }
  }
};
</script>

<style lang="scss" scoped>
// 定义CSS变量用于自适应布局
:root {
  --vat-size: 20px;
}

.centermap {
  margin-bottom: 30px;
  width: 100%;
  height: 100%;
  display: flex; // 添加flex布局
  flex-direction: column; // 垂直排列
  min-height: 0; // 关键：允许缩小

  .maptitle {
    height: 60px;
    display: flex;
    justify-content: center;
    padding-top: 10px;
    box-sizing: border-box;
    flex-shrink: 0; // 防止标题被压缩

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
    flex: 1; // 关键：占据剩余所有空间
    min-height: 0; // 关键：允许缩小
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
    .building-plan,
    .floor-plan,
    .room-plan,
    .vat-plan {
      height: 100%;
      min-height: 0;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    // 楼栋选择样式 - 修复挤压问题
    .building-plan {
      .buildings-container {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        grid-template-rows: repeat(2, 1fr);
        gap: 20px; // 减小间隙
        padding: 20px; // 减小内边距
        height: 100%;
        min-height: 0;
        
        .building-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 15px; // 减小内边距
          border: 1px solid rgba(0, 231, 238, 0.5);
          border-radius: 10px;
          background: rgba(5, 25, 55, 0.5);
          cursor: pointer;
          transition: all 0.3s;
          min-height: 0; // 关键：允许缩小
          
          &:hover {
            transform: translateY(-5px);
            box-shadow: 0 5px 15px rgba(0, 231, 238, 0.3);
          }
          
          .building-shape {
            width: 100px; // 减小尺寸
            height: 120px; // 减小尺寸
            background: linear-gradient(135deg, #2f90b9, #1781b5);
            border-radius: 8px;
            margin-bottom: 10px; // 减小间距
            position: relative;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            justify-content: flex-end;
            padding: 8px; // 减小内边距
            
            .building-floors {
              display: flex;
              flex-direction: column;
              gap: 3px; // 减小间隙
              
              .floor-indicator {
                height: 6px; // 减小高度
                background: rgba(255, 255, 255, 0.3);
                border-radius: 2px;
              }
            }
          }
          
          .building-info {
            text-align: center;
            
            .building-name {
              font-size: 16px; // 减小字体
              color: #00eaff;
              margin-bottom: 3px; // 减小间距
            }
            
            .building-stats {
              font-size: 12px; // 减小字体
              color: #8abcd1;
            }
          }
        }
      }
    }

    // 楼层选择样式 - 修复挤压问题
    .floor-plan {
      .floor-header {
        padding: 10px 15px; // 减小垂直内边距
        border-bottom: 1px solid rgba(0, 231, 238, 0.3);
        text-align: center;
        flex-shrink: 0; // 防止头部被压缩
        
        h3 {
          color: #00eaff;
          margin-bottom: 3px; // 减小间距
          font-size: 18px; // 减小字体
        }
      }
      
      .floors-container {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        grid-template-rows: repeat(2, 1fr); // 明确指定2行
        gap: 15px; // 减小间隙
        padding: 15px; // 减小内边距
        flex: 1;
        min-height: 0;
        
        .floor-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 12px; // 减小内边距
          border: 1px solid rgba(0, 231, 238, 0.5);
          border-radius: 8px;
          background: rgba(5, 25, 55, 0.5);
          cursor: pointer;
          transition: all 0.3s;
          min-height: 0; // 关键：允许缩小
          
          &:hover {
            transform: translateY(-5px);
            box-shadow: 0 5px 15px rgba(0, 231, 238, 0.3);
          }
          
          .floor-shape {
            width: 80px; // 减小尺寸
            height: 60px; // 减小尺寸
            background: linear-gradient(135deg, #2f90b9, #1781b5);
            border-radius: 5px;
            margin-bottom: 8px; // 减小间距
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            
            .room-indicators {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              grid-template-rows: repeat(2, 1fr);
              gap: 3px; // 减小间隙
              width: 80%;
              height: 60%;
              
              .room-indicator {
                background: rgba(255, 255, 255, 0.3);
                border-radius: 2px;
              }
            }
          }
          
          .floor-info {
            text-align: center;
            
            .floor-name {
              font-size: 14px; // 减小字体
              color: #00eaff;
              margin-bottom: 3px; // 减小间距
            }
          }
        }
      }
    }

    // 房间选择样式 - 修复挤压问题
    .room-plan {
      .room-header {
        padding: 10px 15px; // 减小垂直内边距
        border-bottom: 1px solid rgba(0, 231, 238, 0.3);
        text-align: center;
        flex-shrink: 0;
        
        h3 {
          color: #00eaff;
          margin-bottom: 3px; // 减小间距
          font-size: 18px; // 减小字体
        }
      }
      
      .rooms-container {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        grid-template-rows: repeat(2, 1fr); // 明确指定2行
        gap: 12px; // 减小间隙
        padding: 15px; // 减小内边距
        flex: 1;
        min-height: 0;
        
        .room-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 12px; // 减小内边距
          border: 1px solid rgba(0, 231, 238, 0.5);
          border-radius: 8px;
          background: rgba(5, 25, 55, 0.5);
          cursor: pointer;
          transition: all 0.3s;
          min-height: 0; // 关键：允许缩小
          
          &:hover {
            transform: translateY(-5px);
            box-shadow: 0 5px 15px rgba(0, 231, 238, 0.3);
          }
          
          .room-shape {
            width: 60px; // 减小尺寸
            height: 45px; // 减小尺寸
            background: linear-gradient(135deg, #2f90b9, #1781b5);
            border-radius: 5px;
            margin-bottom: 8px; // 减小间距
            position: relative;
            overflow: hidden;
            
            &::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: 
                linear-gradient(90deg, transparent 49%, rgba(255,255,255,0.2) 50%, transparent 51%),
                linear-gradient(transparent 49%, rgba(255,255,255,0.2) 50%, transparent 51%);
              background-size: 15px 15px; // 减小网格尺寸
            }
          }
          
          .room-info {
            text-align: center;
            
            .room-name {
              font-size: 14px; // 减小字体
              color: #00eaff;
              margin-bottom: 3px; // 减小间距
            }
          }
        }
      }
    }

    // 房间陶坛布置图样式 - 保持不变
    .vat-plan {
      .vat-container {
        display: grid;
        grid-template-columns: repeat(10, 1fr);
        grid-template-rows: repeat(10, 1fr);
        gap: 4px;
        padding: 10px;
        flex: 1;
        min-height: 0;
        overflow: hidden;
      }

      .vat-item {
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.3s ease;
      }

      .vat-item:hover {
        transform: translateY(-2px);
      }

      .vat-item.active .vat-shape {
        box-shadow: 0 0 8px #00eaff, 0 0 16px rgba(0, 231, 238, 0.5);
      }

      .vat-shape {
        position: relative;
        width: var(--vat-size);
        height: var(--vat-size);
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .vat-image {
        width: 100%;
        height: 100%;
        object-fit: contain;
        filter: drop-shadow(0 2px 2px rgba(0, 0, 0, 0.3));
      }

      .vat-number {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: calc(var(--vat-size) * 0.4);
        color: black;
        font-weight: bold;
        text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.7);
        z-index: 2;
        pointer-events: none;
      }
    }
  }
}

// 响应式设计 - 调整以适应新布局
@media (max-width: 1200px) {
  .centermap .mapwrap .building-plan .buildings-container {
    grid-template-columns: 1fr;
    grid-template-rows: repeat(4, 1fr);
    gap: 15px;
    padding: 15px;
  }
}

@media (max-width: 768px) {
  .centermap .mapwrap .floor-plan .floors-container {
    grid-template-columns: 1fr;
    grid-template-rows: repeat(5, 1fr);
    gap: 10px;
    padding: 10px;
  }
  
  .centermap .mapwrap .room-plan .rooms-container {
    grid-template-columns: repeat(2, 1fr);
    grid-template-rows: repeat(4, 1fr);
    gap: 10px;
    padding: 10px;
  }
  
  .centermap .mapwrap .vat-plan .vat-container {
    grid-template-columns: repeat(5, 1fr);
    grid-template-rows: repeat(20, 1fr);
  }
}

// 响应式设计
@media (max-width: 1200px) {
  .centermap .mapwrap .building-plan .buildings-container {
    grid-template-columns: 1fr;
    grid-template-rows: repeat(4, 1fr);
  }
}

@media (max-width: 768px) {
  .centermap .mapwrap .floor-plan .floors-container {
    grid-template-columns: 1fr;
    grid-template-rows: repeat(5, 1fr);
  }
  
  .centermap .mapwrap .room-plan .rooms-container {
    grid-template-columns: repeat(2, 1fr);
    grid-template-rows: repeat(4, 1fr);
  }
  
  .centermap .mapwrap .vat-plan .vat-container {
    grid-template-columns: repeat(5, 1fr);
    grid-template-rows: repeat(20, 1fr);
  }
}
</style>