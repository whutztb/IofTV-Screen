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
                            <div class="stat-label">陶坛总数</div>
                            <div class="stat-value">
                                <dv-digital-flop :config="potteryNumConfig" style="width:100%;height:50px;" />
                                <span class="stat-unit">个</span>
                            </div>
                        </div>
                        <div class="stat-divider"></div>
                        <div class="stat-item">
                            <div class="stat-label">总储酒量</div>
                            <div class="stat-value">
                                <dv-digital-flop :config="potteryWineConfig" style="width:100%;height:50px;" />
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
import { currentGET } from 'api/modules'

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
                potteryTotal: 0,           // 陶坛总数
                potteryInUse: 0,           // 使用中陶坛数量
                potteryWineTotal: 0,       // 陶坛总储酒量(吨)
                potteryCapacity: 0,        // 陶坛总容量(吨)
            },
            pageflag: true,
            timer: null,
            
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
            potteryNumConfig: {
                number: [0],
                content: '{nt}',
                style: { ...style, fill: "#00fdfa" },
            },
            potteryWineConfig: {
                number: [0],
                content: '{nt}',
                style: { ...style, fill: "#07f7a8" },
            },
        };
    },
    computed: {
        // 计算陶坛使用率
        usageRate() {
            if (this.inventoryOverview.potteryTotal === 0) return 0;
            return ((this.inventoryOverview.potteryInUse / this.inventoryOverview.potteryTotal) * 100).toFixed(1);
        },
        // 计算平均每坛储酒量
        avgWinePerPottery() {
            if (this.inventoryOverview.potteryInUse === 0) return 0;
            return (this.inventoryOverview.potteryWineTotal * 1000 / this.inventoryOverview.potteryInUse).toFixed(0);
        }
    },
    filters: {
        numsFilter(msg) {
            return msg || 0;
        },
    },
    created() {
        this.getData()
    },
    mounted() {
    },
    beforeDestroy() {
        this.clearData()
    },
    methods: {
        clearData() {
            if (this.timer) {
                clearInterval(this.timer)
                this.timer = null
            }
        },
        async getData() {
            this.pageflag = true;
            try {
                // 注释掉后端接口调用，使用模拟数据
                // const deviceRes = await currentGET("countDeviceNum");
                // const inventoryRes = await currentGET("countPotteryInventory");

                // 使用模拟数据
                this.useMockData();

                // 启动定时刷新
                this.switper()
                
            } catch (error) {
                this.pageflag = false;
                this.$Message.warning('数据获取失败');
                console.error('数据获取失败:', error);
            }
        },

        // 生成与陶坛分布图一致的模拟数据
        useMockData() {
            // 设备统计数据模拟 - 基于4栋×5层×8房间结构
            const totalDevices = 1600; // 4栋×5层×8房间×10设备 = 1600个设备
            const onlineRate = 0.95; // 95%在线率
            const alarmRate = 0.02; // 2%告警率
            
            const deviceData = {
                totalNum: totalDevices,
                onlineNum: Math.floor(totalDevices * onlineRate),
                offlineNum: totalDevices - Math.floor(totalDevices * onlineRate),
                alarmNum: Math.floor(totalDevices * alarmRate)
            };

            // 库存统计数据模拟 - 与陶坛分布图完全对应
            const totalPotteries = 16000; // 4栋×5层×8房间×100陶坛 = 16000个陶坛
            
            // 计算总容量和储酒量（按不同缸型）
            const jarTypes = [
                { type: '吨坛', capacity: 1000, count: 13000 },      // 1层和4层：4栋×8房间×100 = 3200个
                { type: '半吨坛', capacity: 500, count: 2000 },     // 2层和5层：4栋×8房间×100 = 3200个
                { type: '300KG坛', capacity: 300, count: 1000 }     // 3层：4栋×8房间×100 = 1600个
            ];
            
            let totalCapacity = 0;
            let totalWineVolume = 0;
            let usedPotteries = 0;
            
            jarTypes.forEach(jar => {
                totalCapacity += jar.capacity * jar.count;
                // 模拟分布：90%正常坛，5%渗漏坛，5%空坛
                const normalCount = Math.floor(jar.count * 0.9);
                const leakingCount = Math.floor(jar.count * 0.05);
                const emptyCount = jar.count - normalCount - leakingCount;
                
                // 正常坛使用率90%，渗漏坛使用率35%，空坛0%
                const normalRate = 0.9;
                const leakingRate = 0.35;
                
                totalWineVolume += (normalCount * jar.capacity * normalRate) + 
                                 (leakingCount * jar.capacity * leakingRate);
                usedPotteries += normalCount + leakingCount;
            });
            
            // 转换为吨（1吨=1000L）
            const totalCapacityTon = totalCapacity / 1000;
            const totalWineVolumeTon = totalWineVolume / 1000;
            
            const inventoryData = {
                potteryTotal: totalPotteries,
                potteryInUse: usedPotteries,
                potteryWineTotal: Math.round(totalWineVolumeTon),
                potteryCapacity: Math.round(totalCapacityTon)
            };

            // 更新设备统计数据
            this.userOverview = deviceData;
            this.onlineconfig = {
                ...this.onlineconfig,
                number: [deviceData.onlineNum]
            }
            this.config = {
                ...this.config,
                number: [deviceData.totalNum]
            }
            this.offlineconfig = {
                ...this.offlineconfig,
                number: [deviceData.offlineNum]
            }
            this.laramnumconfig = {
                ...this.laramnumconfig,
                number: [deviceData.alarmNum]
            }

            // 更新库存统计数据
            this.inventoryOverview = inventoryData;
            this.potteryNumConfig = {
                ...this.potteryNumConfig,
                number: [inventoryData.potteryTotal]
            }
            this.potteryWineConfig = {
                ...this.potteryWineConfig,
                number: [inventoryData.potteryWineTotal]
            }
        },
        
        //轮询 - 只刷新动画效果，不更新数据
        switper() {
            if (this.timer) {
                return
            }
            let looper = (a) => {
                // 定时刷新时只重新触发数字翻牌器动画，不重新生成数据
                // 通过重新设置相同的数字来触发动画效果
                this.onlineconfig = {
                    ...this.onlineconfig,
                    number: [this.userOverview.onlineNum]
                }
                this.config = {
                    ...this.config,
                    number: [this.userOverview.totalNum]
                }
                this.offlineconfig = {
                    ...this.offlineconfig,
                    number: [this.userOverview.offlineNum]
                }
                this.laramnumconfig = {
                    ...this.laramnumconfig,
                    number: [this.userOverview.alarmNum]
                }
                this.potteryNumConfig = {
                    ...this.potteryNumConfig,
                    number: [this.inventoryOverview.potteryTotal]
                }
                this.potteryWineConfig = {
                    ...this.potteryWineConfig,
                    number: [this.inventoryOverview.potteryWineTotal]
                }
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