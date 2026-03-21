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
| `TURNSTILE_ENABLED` | Trunstile人机验证开关 | Bool |
| `TURNSTILE_SITE_KEY` | Trunstile站点密钥 | 密钥值 |
| `TURNSTILE_VERIFY_MODE` | Trunstile验证模式 | 预留值，默认为 `frontend` |

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

