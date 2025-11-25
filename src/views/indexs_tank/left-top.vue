<!--
 * @Author: daidai
 * @Date: 2022-02-28 16:16:42
 * @LastEditors: Please set LastEditors
 * @LastEditTime: 2022-07-20 17:57:11
 * @FilePath: \web-pc\src\pages\big-screen\view\indexs\left-center.vue
-->
<template>
    <div class="monitoring-container">
        <!-- 设备统计 -->
        <div class="statistics-section">
            <h3 class="section-title">设备监控统计</h3>
            <ul class="user_Overview flex" v-if="pageflag">
                <li class="user_Overview-item" style="color: #00fdfa">
                    <div class="user_Overview_nums allnum ">
                        <dv-digital-flop :config="config" style="width:100%;height:100%;" />
                    </div>
                    <p>总设备数</p>
                </li>
                <li class="user_Overview-item" style="color: #07f7a8">
                    <div class="user_Overview_nums online">
                        <dv-digital-flop :config="onlineconfig" style="width:100%;height:100%;" />
                    </div>
                    <p>在线数</p>
                </li>
                <li class="user_Overview-item" style="color: #e3b337">
                    <div class="user_Overview_nums offline">
                        <dv-digital-flop :config="offlineconfig" style="width:100%;height:100%;" />
                    </div>
                    <p>离线数</p>
                </li>
                <li class="user_Overview-item" style="color: #f5023d">
                    <div class="user_Overview_nums laramnum">
                        <dv-digital-flop :config="laramnumconfig" style="width:100%;height:100%;" />
                    </div>
                    <p>告警次数</p>
                </li>
            </ul>
        </div>

        <!-- 白酒库存统计 -->
        <div class="statistics-section">
            <h3 class="section-title">白酒库存统计</h3>
            <div class="inventory-container" v-if="pageflag">
                <div class="inventory-card pottery-card">

                    <div class="card-content">
                        <div class="stat-item">
                            <div class="stat-label">大罐总数</div>
                            <div class="stat-value">
                                <dv-digital-flop :config="tankNumConfig" style="width:100%;height:50px;" />
                                <span class="stat-unit">个</span>
                            </div>
                        </div>
                        <div class="stat-divider"></div>
                        <div class="stat-item">
                            <div class="stat-label">总储酒量</div>
                            <div class="stat-value">
                                <dv-digital-flop :config="tankWineConfig" style="width:100%;height:50px;" />
                                <span class="stat-unit">吨</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 重新获取组件 -->
        <Reacquire v-if="!pageflag" @onclick="getData" line-height="200px">
            重新获取
        </Reacquire>
    </div>
</template>

<script>
// import { currentGET } from 'api/modules'  // 注释掉后端接口

let style = {
    fontSize: 24
}

export default {
    data() {
        return {
            options: {},
            // 设备统计数据
            userOverview: {
                alarmNum: 0,
                offlineNum: 0,
                onlineNum: 0,
                totalNum: 0,
            },
            // 库存统计数据
            inventoryOverview: {
                tankTotal: 0,           // 大罐总数
                tankInUse: 0,           // 使用中大罐数量
                tankWineTotal: 0,       // 大罐总储酒量(吨)
                tankCapacity: 0,        // 大罐总容量(吨)
            },
            pageflag: true,
            timer: null,
            refreshTimer: null, // 新增定时刷新计时器
            
            // 设备统计配置
            config: {
                number: [100],
                content: '{nt}',
                style: { ...style, fill: "#00fdfa" },
            },
            onlineconfig: {
                number: [0],
                content: '{nt}',
                style: { ...style, fill: "#07f7a8" },
            },
            offlineconfig: {
                number: [0],
                content: '{nt}',
                style: { ...style, fill: "#e3b337" },
            },
            laramnumconfig: {
                number: [0],
                content: '{nt}',
                style: { ...style, fill: "#f5023d" },
            },

            // 库存统计配置
            tankNumConfig: {
                number: [0],
                content: '{nt}',
                style: { ...style, fill: "#00fdfa" },
            },
            tankWineConfig: {
                number: [0],
                content: '{nt}',
                style: { ...style, fill: "#07f7a8" },
            },
            
            // 存储固定的模拟数据
            fixedMockData: null
        };
    },
    computed: {
        // 计算大罐使用率
        usageRate() {
            if (this.inventoryOverview.tankTotal === 0) return 0;
            return ((this.inventoryOverview.tankInUse / this.inventoryOverview.tankTotal) * 100).toFixed(1);
        },
        // 计算平均每罐储酒量
        avgWinePerTank() {
            if (this.inventoryOverview.tankInUse === 0) return 0;
            return (this.inventoryOverview.tankWineTotal / this.inventoryOverview.tankInUse).toFixed(1);
        }
    },
    filters: {
        numsFilter(msg) {
            return msg || 0;
        },
    },
    created() {
        this.getData();
        // 启动定时刷新
        this.startAutoRefresh();
    },
    mounted() {
    },
    beforeDestroy() {
        this.clearData();
        // 清理定时刷新计时器
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
            this.refreshTimer = null;
        }
    },
    methods: {
        clearData() {
            if (this.timer) {
                clearInterval(this.timer);
                this.timer = null;
            }
        },
        // 启动定时刷新
        startAutoRefresh() {
            // 每30秒刷新一次界面，但不改变数据
            this.refreshTimer = setInterval(() => {
                this.refreshDisplay();
            }, 30000);
        },
        // 只刷新显示，不改变数据
        refreshDisplay() {
            // 这里可以添加一些界面刷新的逻辑，但数据保持不变
            // 例如强制组件重新渲染，但保持数据不变
            this.$forceUpdate();
        },
        async getData() {
            this.pageflag = true;
            try {
                // 如果是第一次获取数据，生成固定数据
                if (!this.fixedMockData) {
                    this.fixedMockData = {
                        deviceData: this.generateMockDeviceData(),
                        inventoryData: this.generateMockInventoryData()
                    };
                }

                // 使用固定的模拟数据
                const mockDeviceData = this.fixedMockData.deviceData;
                const mockInventoryData = this.fixedMockData.inventoryData;

                // 更新设备统计数据
                this.userOverview = mockDeviceData;
                this.onlineconfig = {
                    ...this.onlineconfig,
                    number: [mockDeviceData.onlineNum]
                }
                this.config = {
                    ...this.config,
                    number: [mockDeviceData.totalNum]
                }
                this.offlineconfig = {
                    ...this.offlineconfig,
                    number: [mockDeviceData.offlineNum]
                }
                this.laramnumconfig = {
                    ...this.laramnumconfig,
                    number: [mockDeviceData.alarmNum]
                }

                // 更新库存统计数据
                this.inventoryOverview = mockInventoryData;
                this.tankNumConfig = {
                    ...this.tankNumConfig,
                    number: [mockInventoryData.tankTotal]
                }
                this.tankWineConfig = {
                    ...this.tankWineConfig,
                    number: [mockInventoryData.tankWineTotal]
                }

                // 保持原有的轮询机制
                this.switper();

            } catch (error) {
                this.pageflag = false;
                this.$Message.warning('数据获取失败');
                console.error('数据获取失败:', error);
            }
        },
        
        // 生成模拟设备数据 - 使用固定值
        generateMockDeviceData() {
            // 使用固定数据，不随机变化
            return {
                alarmNum: 12,
                offlineNum: 10,
                onlineNum: 134,
                totalNum: 144,
            };
        },
        
        // 生成模拟库存数据 - 使用固定值
        generateMockInventoryData() {
            // 使用固定数据，不随机变化
            return {
                tankTotal: 144,
                tankInUse: 136,
                tankWineTotal: 18500,
                tankCapacity: 21600,
            };
        },

        //轮询
        switper() {
            if (this.timer) {
                return;
            }
            let looper = () => {
                // 轮询时也使用固定数据，不重新生成
                this.refreshDisplay();
            };
            this.timer = setInterval(looper, this.$store.state.setting.echartsAutoTime || 30000);
        },
    },
};
</script>
<style lang='scss' scoped>
.monitoring-container {
    width: 100%;
}

.statistics-section {
    margin-bottom: 30px;
    
    .section-title {
        color: #fff;
        font-size: 18px;
        margin-bottom: 20px;
        padding-left: 10px;
        border-left: 4px solid #00fdfa;
        text-align: left;
    }
}

.user_Overview {
    li {
        flex: 1;
        p {
            text-align: center;
            height: 16px;
            font-size: 16px;
            margin-bottom: 5px;
        }

        .user_Overview_nums {
            width: 100px;
            height: 100px;
            text-align: center;
            line-height: 100px;
            font-size: 22px;
            margin: 20px auto 15px;
            background-size: cover;
            background-position: center center;
            position: relative;

            &::before {
                content: '';
                position: absolute;
                width: 100%;
                height: 100%;
                top: 0;
                left: 0;
            }

            &.bgdonghua::before {
                animation: rotating 14s linear infinite;
            }
        }

        .allnum {
            &::before {
                background-image: url("../../assets/img/left_top_lan.png");
            }
        }

        .online {
            &::before {
                background-image: url("../../assets/img/left_top_lv.png");
            }
        }

        .offline {
            &::before {
                background-image: url("../../assets/img/left_top_huang.png");
            }
        }

        .laramnum {
            &::before {
                background-image: url("../../assets/img/left_top_hong.png");
            }
        }
    }
}

// 库存统计卡片样式
.inventory-container {
    display: flex;
    justify-content: center;
}

.pottery-card {
    background: linear-gradient(135deg, rgba(0, 253, 250, 0.1) 0%, rgba(7, 247, 168, 0.1) 100%);
    border: 1px solid rgba(0, 253, 250, 0.3);
    border-radius: 10px;
    padding: 20px;
    width: 100%;
    max-width: 400px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    
    .card-header {
        display: flex;
        align-items: center;
        margin-bottom: 20px;
        padding-bottom: 15px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.2);
        
        .card-icon {
            width: 40px;
            height: 40px;
            margin-right: 15px;
            
            &.pottery-icon {
                background: linear-gradient(45deg, #8B4513, #D2691E);
                border-radius: 50%;
                position: relative;
                
                &::after {
                    content: '';
                    position: absolute;
                    top: 5px;
                    left: 5px;
                    right: 5px;
                    bottom: 5px;
                    border: 2px solid rgba(255, 255, 255, 0.3);
                    border-radius: 50%;
                }
            }
        }
        
        .card-title {
            color: #00fdfa;
            font-size: 20px;
            font-weight: bold;
        }
    }
    
    .card-content {
        display: flex;
        justify-content: space-between;
        margin-bottom: 20px;
        
        .stat-item {
            flex: 1;
            text-align: center;
            
            .stat-label {
                color: rgba(255, 255, 255, 0.8);
                font-size: 14px;
                margin-bottom: 10px;
            }
            
            .stat-value {
                display: flex;
                align-items: center;
                justify-content: center;
                height: 50px;
                
                :deep(.dv-digital-flop) {
                    flex: 1;
                }
                
                .stat-unit {
                    color: rgba(255, 255, 255, 0.7);
                    font-size: 14px;
                    margin-left: 5px;
                }
            }
        }
        
        .stat-divider {
            width: 1px;
            background: rgba(255, 255, 255, 0.2);
            margin: 0 20px;
        }
    }
    
    .card-footer {
        display: flex;
        justify-content: space-around;
        padding-top: 15px;
        border-top: 1px solid rgba(255, 255, 255, 0.2);
        
        .footer-item {
            text-align: center;
            
            .footer-label {
                display: block;
                color: rgba(255, 255, 255, 0.7);
                font-size: 12px;
                margin-bottom: 5px;
            }
            
            .footer-value {
                display: block;
                color: #07f7a8;
                font-size: 14px;
                font-weight: bold;
            }
        }
    }
}

// 旋转动画
@keyframes rotating {
    from {
        transform: rotate(0deg);
    }
    to {
        transform: rotate(360deg);
    }
}

// 响应式调整
@media (max-width: 768px) {
    .inventory-container {
        flex-direction: column;
        align-items: center;
    }
    
    .pottery-card {
        max-width: 100%;
    }
}
</style>