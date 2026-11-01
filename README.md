# Travellings Check-Tool

开往巡查工具前端仓库

版本：V2

基于以下技术构建：

* React
* Vite
* Tailwind CSS
* MUI
* Emotion


## 配置文件解释

| 参数名 | 定义 | 可用参数 |
| ---- | ---- | ---- |
| `API_BASE_URL` | 后端API地址 | 完整URL |

## 登录方式

本前端不再提供账号密码 / 验证码登录，统一使用 **GitHub 第三方 SSO（OAuth 2.0 授权码流程）**，OAuth 全过程由后端完成：

1. 登录页点击「使用 GitHub 登录」，整页跳转到 `{API_BASE_URL}/auth/github/login?redirect=<站内路径>`；
2. 后端引导用户完成 GitHub 授权，成功后 302 回到 `{前端地址}/auth-transition?type=login&redirect=<站内路径>#token=<token>`；
3. `/auth-transition` 从 URL fragment 取出 token 写入 `localStorage`（随后立即清掉地址栏里的 fragment），再通过 `GET /auth/me` 换取用户信息；
4. 此后所有请求由 `src/api/client.js` 带上 `Authorization: Bearer <token>`，401 时自动回到登录页。

> 前端不保存任何 GitHub 密钥；`GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` 只在后端配置。

**本地联调**（后端跑在 `http://localhost:8080`）时，前端走 Vite 代理绕开跨域：

```bash
# 终端 1：后端（需先配好 config/application-local.properties 里的 GitHub 凭据与数据库）
cd travellings-checktools-backend && ./gradlew bootRun

# 终端 2：前端，代理指向本机后端
DEV_API_TARGET=http://localhost:8080 npm run dev   # Windows PowerShell: $env:DEV_API_TARGET='http://localhost:8080'; npm run dev
```

此时 `.env.development.local` 里的 `API_BASE_URL=/api` 生效，`/api/*` 被代理到后端根路径（后端路由没有 `/api` 前缀）。
后端 `FRONTEND_URL` 要写 `http://localhost:5174`（Vite dev 实际端口），否则登录回来会跳到错误地址。

## 部署与开发指南

>项目初始开发环境建议基于 NodeJS v20+ 的版本，推荐使用 `npm` 作为该项目的包管理器。
>为了保障后续的开发，目前该采用 `MUI` 为前端框架，具体框架文档请参考 [`MUI Docs`](https://mui.com/material-ui/getting-started/) 。


1.安装

使用 `npm install` 安装项目相关依赖，该步骤会自动完成。

2.开发测试

使用 `npm run dev` 会默认在本地的 `TCP 5174` 端口打开一个开发服务器，具体端口开放请查看控制台输出。

3.部署

项目支持通过 SaaS 进行部署，当然，如果你想要构建静态文件只需要在命令行执行 `npm run build` 进行构建。构建弄好的文件将会直接放在该项目根目录下的 `dist` 文件夹当中

## 许可证

本项目采用 [GNU GPL v3](./LICENSE) 开源协议发布。
您可以自由使用、修改和分发本项目，但请遵守 GPL v3 的相关条款。

