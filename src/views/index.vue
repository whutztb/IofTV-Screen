<!-- src/pages/big-screen/view/index.vue -->
<template>
  <component :is="currentComponent" />
</template>

<script>
export default {
  name: "BigScreen",
  computed: {
    currentComponent() {
      const deviceType = this.$store.state.setting.deviceType || 'vat';
      return deviceType === 'vat' ? 'IndexsVat' : 'IndexsTank';
    }
  },
  components: {
    IndexsVat: () => import('./indexs/index.vue'),
    IndexsTank: () => import('./indexs_tank/index.vue')
  }
};
</script>