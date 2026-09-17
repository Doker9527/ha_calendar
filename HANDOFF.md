# 开发交接（2026-09-16）

本文件用于在另一台电脑上继续开发。仓库：<https://github.com/Doker9527/ha_calendar>，默认分支 `main`。当前代码版本为 `0.1.5`。不要把 Home Assistant 登录信息、令牌或本地配置文件提交到此公开仓库。

## 在新电脑开始

```powershell
git clone https://github.com/Doker9527/ha_calendar.git
cd ha_calendar
git status -sb
```

安装 Python 开发依赖后可运行测试（需要本机安装 Python 与 Node.js）：

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install pytest lunar_python==1.4.8
.\.venv\Scripts\python.exe -m pytest -q
node --check custom_components/chinese_calendar/frontend/chinese-calendar-card.js
```

如果新电脑已克隆过仓库，先在该仓库目录执行 `git pull --ff-only origin main`，不要覆盖未提交的本地修改。

## 项目位置

- `custom_components/chinese_calendar/`：HACS 集成、传感器、日期 API 与本地前端文件。
- `custom_components/chinese_calendar/frontend/chinese-calendar-card.js`：万年历卡片布局与样式。
- `dashboard/chinese-calendar-entry.yaml`：可直接粘贴到 Home Assistant 仪表盘的 Tile 入口及 Browser Mod 弹窗配置。
- `README.md`：安装、资源地址和使用说明。

Home Assistant 仪表盘资源地址为 `/chinese-calendar/chinese-calendar-card.js?v=0.1.5`，类型为 JavaScript 模块。弹窗使用 `custom:chinese-calendar-card`，无需将 HACS 的 `update` 实体填入卡片。示例入口实体 `sensor.jin_ri_nong_li` 应按实际 HA 实体 ID 调整。

## 尚未解决：手机端仍显示旧详情布局

用户反馈手机弹窗仍把标题与内容挤在同一行，且只显示“生肖年”，将“日禄/物候”和“九星/星宿”各混为一项。`0.1.4` 的源码已经改为标题在上、内容在下，补齐生肖月/日、纳音、冲煞及节气，并为日禄、物候、九星、星宿分别标明标题。桌面端此前反馈正常。

已确认的事实：

1. `main` 已推送到 GitHub，包含提交 `d5b98df`（`Refine mobile almanac details`）。
2. 用户重新下载过 HACS 集成；从 HA 的 `/chinese-calendar/chinese-calendar-card.js` 直接打开，首行显示 `const CARD_VERSION = "0.1.4";`。
3. HA 仪表盘资源列表截图中只看到一条万年历资源，地址为 `/chinese-calendar/chinese-calendar-card.js?v=0.1.4`，类型为 JavaScript 模块。
4. 上述事实还不足以确定手机页面实际执行的是哪个卡片构造函数；不能把问题写成已解决或断定一定是缓存。

建议下一步先做**不改配置**的对照诊断：在手机浏览器的无痕窗口打开同一个 HA 仪表盘，比较弹窗；若仍旧，检查实际加载的脚本和注册的自定义元素。在浏览器开发者工具中可执行：

```javascript
customElements.get("chinese-calendar-card")?.prototype._renderMobileDetails.toString().includes("mobile-block")
```

`true` 表示当前注册的是新版手机详情方法；`false` 表示仍在运行旧定义。进一步检查网络请求是否获取了 `0.1.4`、是否存在 Service Worker/前端缓存、以及 Browser Mod 弹窗内容是否在同一页面会话中沿用了旧自定义元素。只有确认实际执行代码后，再决定修复方向。不要仅凭资源 URL 或 GitHub 版本号断定运行版本。

## 修改与发布

在本地修改并验证后，更新 `manifest.json` 的版本、JS 中的 `CARD_VERSION`、README 中的资源查询参数及 `CHANGELOG.md`，再提交并推送。用户的 HA 需要通过 HACS 获取新版集成，并在仪表盘资源中更新查询参数；仅修改 `?v=` 不会更新 HA 本机的集成文件。
