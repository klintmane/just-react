<template>
  <div>
    <PageNavOrigin :sidebarItems="sidebarItems"/>
    <div class="icp-footer">
      <p>Copyright© 2020-{{(new Date()).getFullYear()}} Card Song</p>
      <a href="https://beian.miit.gov.cn/" target="_blank">Beijing ICP No. 20028082-1</a>
    </div>
  </div>
</template>

<script>
import PageNavOrigin from '@vuepress/theme-default/components/PageNav.vue'

export default {
  name: 'PageNav',
  props: ['sidebarItems'],
  components: {
    PageNavOrigin
  },
}
</script>

<style>
.icp-footer {
  text-align: center;
}

</style>
