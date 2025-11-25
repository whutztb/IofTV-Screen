/*
 * @Author: daidai
 * @Date: 2022-01-12 14:22:29
 * @LastEditors: Please set LastEditors
 * @LastEditTime: 2022-04-28 14:53:02
 * @FilePath: \web-pc\src\pages\big-screen\router\index.js
 */
import Vue from "vue";
import VueRouter from "vue-router";

Vue.use(VueRouter);

const routes = [  
  {
    path: '/',
    redirect: '/index',
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import(/* webpackChunkName: "LSD.bighome" */ '../views/login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/home',
    name: 'home',
    component: () => import(/* webpackChunkName: "LSD.bighome" */ '../views/home.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '/index',
        name: 'index',
        // 修改这里：指向新的主入口文件，而不是原来的 indexs/index.vue
        component: () => import(/* webpackChunkName: "LSD.bighome" */ '../views/index.vue'),
      }
    ]
  }, 
];

const router = new VueRouter({
  mode: "hash",
  // base: process.env.BASE_URL,
  routes
});

// 路由守卫
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token');
  
  // 如果路由需要认证且没有token，则跳转到登录页
  if (to.matched.some(record => record.meta.requiresAuth) && !token) {
    next('/login');
  } else if (to.path === '/login' && token) {
    // 如果已经登录且访问登录页，则跳转到首页
    next('/');
  } else {
    next();
  }
});

export default router;