# 中华万年历

一个完全在 Home Assistant 本地运行的中华万年历集成，使用
[`lunar-python`](https://github.com/6tail/lunar-python) 计算农历、节气、节日、
干支、生肖、宜忌、冲煞和吉神方位。

跨电脑继续开发及当前待排查问题见 [`HANDOFF.md`](HANDOFF.md)。

## 功能

- 通过“设备与服务”界面添加，无需 YAML 配置集成
- 今日农历传感器及完整黄历属性（实体 ID 以 Home Assistant 中实际生成的为准）
- 六周、42 格月历，不同月份切换时布局不跳动
- 日期详情、宜忌、冲煞与吉方位
- 使用 Home Assistant 主题变量，自动适配浅色和深色主题
- 公历与农历信息旁显示实时翻页时钟（时:分:秒），跟随设备本地时间
- 数据本地计算，日常使用不需要互联网

## 通过 HACS 安装

发布到 GitHub 后，在 Home Assistant 中执行：

1. 打开 **HACS → 右上角三点 → 自定义仓库**。
2. 粘贴本项目的 GitHub 仓库地址，类别选择 **Integration（集成）**。
3. 搜索并下载“中华万年历”，然后重启 Home Assistant。
4. 打开 **设置 → 设备与服务 → 添加集成**，搜索“中华万年历”。
5. 按下方“添加仪表盘卡片”配置资源和卡片。

HACS 会自动把集成放到 `/config/custom_components/chinese_calendar`。首次发布不必提交到 HACS 默认商店；使用“自定义仓库”即可安装和更新。

## 手动安装（可选）

1. 将 `custom_components/chinese_calendar` 复制到 Home Assistant 的
   `/config/custom_components/chinese_calendar`。
2. 重启 Home Assistant。
3. 打开 **设置 → 设备与服务 → 添加集成**，搜索“中华万年历”。
4. 打开 **设置 → 仪表盘 → 资源**，添加：

   ```text
   /chinese-calendar/chinese-calendar-card.js?v=0.1.5
   ```

   资源类型选择“JavaScript 模块”。
5. 向仪表盘添加“手动”卡片：

   ```yaml
   type: custom:chinese-calendar-card
   title: 中华万年历
   show_details: true
   ```

## 卡片配置

| 配置项 | 默认值 | 说明 |
| --- | --- | --- |
| `type` | 必填 | `custom:chinese-calendar-card` |
| `title` | `中华万年历` | 卡片标题 |
| `show_details` | `true` | 是否显示日期详情和宜忌 |
| `show_header` | `true` | 是否显示卡片自身标题；Browser Mod 已提供弹窗标题时设为 `false` |
| `compact` | `false` | 将完整卡片限制在适合弹窗的最大宽度，保留黄历内容 |

## 仪表盘入口与弹窗

在仪表盘中添加一张“手动”卡片，切换到 YAML 编辑，粘贴下面配置。仪表盘只显示一张横向 Tile 卡片，名称下面显示今日农历；点击后打开完整万年历。`sensor.jin_ri_nong_li` 是示例中使用的实际实体 ID，如果你的实体 ID 不同，请替换。

需要先安装 Browser Mod 2.6 或更新版本，并在 **设置 → 仪表盘 → 资源** 中加入 `/chinese-calendar/chinese-calendar-card.js?v=0.1.5`，资源类型选择“JavaScript 模块”。若已经添加旧资源，编辑原条目的版本号，不要重复新增。手机上还需完全关闭 Home Assistant App 或浏览器标签页后重新打开，以清除旧前端脚本。

完整可复制配置位于 [`dashboard/chinese-calendar-entry.yaml`](dashboard/chinese-calendar-entry.yaml)。弹窗不显示重复标题；桌面和平板按日历内容收紧弹窗，手机使用屏幕宽度并在内容过长时滚动。

`fire-dom-event` 是 Browser Mod 的自定义动作。Home Assistant 的可视化编辑器可能提示“不支持可视化编辑器”，这不代表 YAML 无效；继续使用 YAML 编辑并保存即可。

配置中的 `calendar-fit` 是 Browser Mod 的自定义弹窗样式。卡片在较宽空间展示完整三栏，在较窄空间改为日历加两列黄历详情。无需安装 Mushroom、Button Card 或 Card Mod。

## 发布给 HACS 使用

本仓库已经是 HACS 的 **Integration** 标准目录：`custom_components/chinese_calendar`、
`manifest.json` 和根目录 `hacs.json` 都已就位。将整个仓库推送到 GitHub 后，
即可作为自定义仓库安装和检查更新；也可以为正式版本创建对应的 GitHub Release。

## 致谢与许可证

日期算法来自 MIT 许可的 [`6tail/lunar-python`](https://github.com/6tail/lunar-python)。
本项目使用 [MIT License](LICENSE)。
