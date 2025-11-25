<template>
  <div class="login-container">
    <div class="login-form">
      <div class="title-container">
        <h3 class="title">数智化原酒监测可视化平台</h3>
      </div>

      <el-form 
        ref="loginForm" 
        :model="loginForm" 
        :rules="loginRules" 
        class="demo-ruleForm"
        @submit.native.prevent
      >
        <el-form-item prop="username" class="form-item-custom">
          <span class="svg-container">
            <i class="el-icon-user"></i>
          </span>
          <el-input
            ref="username"
            v-model="loginForm.username"
            placeholder="用户名"
            name="username"
            type="text"
            class="input-custom"
          />
        </el-form-item>

        <el-form-item prop="password" class="form-item-custom">
          <span class="svg-container">
            <i class="el-icon-lock"></i>
          </span>
          <el-input
            ref="password"
            v-model="loginForm.password"
            :type="passwordType"
            placeholder="密码"
            name="password"
            class="input-custom"
            @keyup.enter.native="handleLogin"
          />
          <span class="show-pwd" @click="showPwd">
            <i :class="passwordType === 'password' ? 'el-icon-view' : 'el-icon-hide'"></i>
          </span>
        </el-form-item>

        <el-button 
          :loading="loading" 
          type="primary" 
          class="login-button"
          @click.native.prevent="handleLogin"
        >
          登录
        </el-button>
      </el-form>
    </div>
  </div>
</template>

<script>
// 引入登录 API
import { login } from '@/api/modules'
import axios from 'axios'

export default {
  name: 'Login',
  data() {
    return {
      loginForm: {
        username: '',
        password: ''
      },
      loginRules: {
        username: [
          { required: true, message: '请输入用户名', trigger: 'blur' }
        ],
        password: [
          { required: true, message: '请输入密码', trigger: 'blur' },
          { min: 12, message: '密码长度不能少于12位', trigger: 'blur' }
        ]
      },
      passwordType: 'password',
      loading: false
    }
  },
  created() {
    const token = localStorage.getItem('token')
    if (token) {
      this.$router.push('/')
    }
  },
  mounted() {
    this.$nextTick(() => {
      if (this.loginForm.username === '') {
        this.$refs.username.focus()
      }
    })
  },
  methods: {
    showPwd() {
      if (this.passwordType === 'password') {
        this.passwordType = ''
      } else {
        this.passwordType = 'password'
      }
      this.$nextTick(() => {
        this.$refs.password.focus()
      })
    },
    handleLogin() {    
      // 使用表单验证
      this.$refs.loginForm.validate((valid) => {
        if (valid) {
          this.performLogin()
        } else {
          return false
        }
      })
    },
    // 执行登录 - 根据后端返回格式调整
    async performLogin() {
      this.loading = true
      
      try {
        const response = await login({
          user_id: this.loginForm.username,
          user_pwd: this.loginForm.password
        })
     
        // 解析后端返回的数据
        let result
        if (typeof response === 'string') {
          // 如果返回的是字符串，需要解析
          result = JSON.parse(response)
        } else {
          // 如果已经是对象，直接使用
          result = response
        }
        
        if (result.code === 0) { // 登录成功
          const token = 'token-' + Date.now() + '-' + Math.random().toString(36).substr(2)
          localStorage.setItem('token', token)
          localStorage.setItem('userInfo', JSON.stringify({
            username: this.loginForm.username,
            loginTime: new Date()
          }))
          
          this.$message.success('登录成功'|| result.message )
          this.$router.push('/')
        } else if (result.code === -1) { // 密码错误
          this.$message.error('密码错误'||result.message)
        } else if (result.code === -2) { // 用户不存在
          this.$message.error('用户不存在'||result.message)
        } else { // 其他错误码
          this.$message.error('登录失败'||result.message)
        }
      } catch (error) {
        console.error('登录请求失败:', error)
        
        // 根据错误类型显示不同的提示信息
        if (error.response) {
          // 服务器返回了错误状态码
          switch (error.response.status) {
            case 401:
              this.$message.error('用户名或密码错误')
              break
            case 403:
              this.$message.error('没有访问权限')
              break
            case 500:
              this.$message.error('服务器内部错误')
              break
            default:
              this.$message.error('登录失败，请稍后重试')
              break
          }
        } else if (error.request) {
          // 请求发送了但没有收到响应
          this.$message.error('网络错误，请检查网络连接')
        } else if (error instanceof SyntaxError) {
          // JSON 解析错误
          this.$message.error('服务器响应格式错误')
        } else {
          // 其他错误
          this.$message.error('登录失败，请稍后重试')
        }
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>
.login-container {
  height: 100vh;
  width: 100%;
  /* 背景图片设置 */
  background-size: cover;           /* 确保图片覆盖整个容器 */
  background-position: center;      /* 图片居中显示 */
  background-repeat: no-repeat;     /* 防止图片重复 */
  background-attachment: fixed;     /* 固定背景，滚动时不动 */
  
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  
  /* 备用背景色，如果图片加载失败时显示 */
  background-color: #1e3c72;
}

/* 添加一个遮罩层，提高文字可读性 */
.login-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4); /* 半透明黑色遮罩 */
  z-index: 1;
}

.login-form {
  width: 400px;
  padding: 40px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
  backdrop-filter: blur(4px);
  border: 1px solid rgba(255, 255, 255, 0.18);
  position: relative; /* 确保表单在遮罩层之上 */
  z-index: 2;
}

.title-container {
  text-align: center;
  margin-bottom: 30px;
}

.title {
  font-size: 24px;
  color: #fff;
  font-weight: bold;
  margin: 0;
}

.svg-container {
  padding: 0 15px;
  color: #889aa4;
  vertical-align: middle;
  width: 30px;
  display: inline-block;
  font-size: 16px;
}

.show-pwd {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 16px;
  color: #889aa4;
  cursor: pointer;
  user-select: none;
}

.login-button {
  width: 100%;
  height: 45px;
  font-size: 16px;
  margin-top: 10px;
}

/* 响应式设计 - 适配移动设备 */
@media (max-width: 768px) {
  .login-form {
    width: 90%;
    padding: 30px 20px;
    margin: 0 20px;
  }
  
  .title {
    font-size: 20px;
  }
  
  .login-container {
    background-attachment: scroll; /* 移动设备上取消固定背景 */
  }
}
</style>

<style>
/* 全局样式修复 */
.demo-ruleForm .el-form-item {
  margin-bottom: 22px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  background: rgba(0, 0, 0, 0.1);
  border-radius: 5px;
}

.demo-ruleForm .el-form-item__content {
  display: flex;
  align-items: center;
  line-height: normal;
}

.input-custom .el-input__inner {
  background: transparent !important;
  border: 0 !important;
  -webkit-appearance: none;
  border-radius: 0;
  padding: 12px 5px 12px 0;
  color: #fff !important;
  height: 47px;
  caret-color: #fff;
}

.input-custom .el-input__inner::placeholder {
  color: rgba(255, 255, 255, 0.6) !important;
}

.input-custom .el-input__inner:-webkit-autofill {
  box-shadow: 0 0 0 1000px transparent inset !important;
  -webkit-text-fill-color: #fff !important;
  transition: background-color 5000s ease-in-out 0s;
}

.login-button {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: #fff;
}

.login-button:hover {
  background: rgba(255, 255, 255, 0.3);
}
</style>