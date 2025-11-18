<!--
 * @Author: daidai
 * @Date: 2022-03-04 09:23:59
 * @LastEditors: Please set LastEditors
 * @LastEditTime: 2022-05-07 11:05:02
 * @FilePath: \web-pc\src\pages\big-screen\view\indexs\index.vue
-->
<template>
  <div class="contents">
    <div class="contetn_left">
      <div class="pagetab">
        <!-- <div class="item">实时监测</div> -->
        
      </div>
      <ItemWrap class="contetn_left-top contetn_lr-item" title="系统总览">
        <LeftTop/>
      </ItemWrap>

      <ItemWrap
        class="contetn_left-bottom contetn_lr-item"
        title="设备提醒"
        style="padding: 0 10px 16px 10px"
      >
        <LeftBottom />
      </ItemWrap>
    </div>
    <div class="contetn_center">
      <CenterMap class="contetn_center_top" @vat-selected="handleVatSelected" />
      <ItemWrap class="contetn_center-bottom" title="陶坛详情">
        <CenterBottom :selectedVat="selectedVat" />
      </ItemWrap>
    </div>
    <div class="contetn_right">
      <ItemWrap class="contetn_left-center contetn_lr-item" title="酒库统计">
        <LeftCenter />
      </ItemWrap>
      <!--<ItemWrap class="contetn_left-bottom contetn_lr-item" title="历史报警" >
        <RightTop />
      </ItemWrap>
      <ItemWrap
        class="contetn_left-bottom contetn_lr-item"
        title="报警排名(TOP8)"
        style="padding: 0 10px 16px 10px"
      >
        <RightCenter />
      </ItemWrap>-->
      <ItemWrap
        class="contetn_left-bottom contetn_lr-item"
        title="陶坛历史数据 "
      >
        <RightBottom :selectedVat="selectedVat" />
      </ItemWrap>
    </div>
  </div>
</template>

<script>
import LeftTop from './left-top.vue'
import LeftCenter from "./left-center.vue";
import LeftBottom from "./left-bottom.vue";
import CenterMap from "./center-map.vue";
import CenterBottom from "./center-bottom.vue";
import RightTop from "./right-top.vue";
import RightCenter from "./right-center.vue";
import RightBottom from "./right-bottom.vue";

export default {
  components: {
    LeftTop,
    LeftCenter,
    LeftBottom,
    CenterMap,
    RightTop,
    RightCenter,
    RightBottom,
    CenterBottom,
  },
  data() {
    return {
      selectedVat: null, // 添加选中的陶坛数据
    
    };
  },
  filters: {
    numsFilter(msg) {
      return msg || 0;
    },
  },
  created() {
  },

  mounted() {},
  methods: {
    handleVatSelected(vat) {
      console.log('主页面接收到选中的陶坛事件:', vat);
      this.selectedVat = vat;
      
      // 可选：在控制台输出更多调试信息
      console.log('selectedVat 已更新:', this.selectedVat);
    }
  
  },
};
</script>
<style lang="scss" scoped>
.contents {
  display: flex;
  height: 100vh;
  padding: 16px;
  box-sizing: border-box;
  justify-content: space-between;
  overflow: hidden;

  .contetn_left,
  .contetn_right {
    width: 540px;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    
    .contetn_lr-item {
      flex: 1;
      min-height: 0;
      margin-bottom: 16px;
      overflow: hidden;
      
      &:last-child {
        margin-bottom: 0;
      }
    }
  }

  .contetn_center {
    width: 720px;
    height: 100%;
    display: grid;
    grid-template-rows: 2fr 1fr;
    gap: 16px;
    
    .contetn_center_top {
      min-height: 0;
      overflow: hidden;
    }

    .contetn_center-bottom {
      min-height: 0;
      overflow: hidden;
    }
  }
}

@keyframes rotating {
    0% {
        -webkit-transform: rotate(0) scale(1);
        transform: rotate(0) scale(1);
    }
    50% {
        -webkit-transform: rotate(180deg) scale(1.1);
        transform: rotate(180deg) scale(1.1);
    }
    100% {
        -webkit-transform: rotate(360deg) scale(1);
        transform: rotate(360deg) scale(1);
    }
}
</style>