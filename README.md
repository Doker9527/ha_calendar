# 中华万年历

一个完全在 Home Assistant 本地运行的中华万年历集成，使用
[`lunar-python`](https://github.com/6tail/lunar-python) 计算农历、节气、节日、
干支、生肖、宜忌、冲煞和吉神方位。

## 功能

- 通过“设备与服务”界面添加，无需 YAML 配置集成
- `sensor.今日农历` 实体及完整黄历属性
- 六周、42 格月历，不同月份切换时布局不跳动
- 日期详情、宜忌、冲煞与吉方位
- 使用 Home Assistant 主题变量，自动适配浅色和深色主题
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
   /chinese-calendar/chinese-calendar-card.js?v=0.1.0
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
| `show_header` | `true` | 是否显示卡片自身标题；弹窗版建议保留，便于显示标题与关闭按钮 |

## 用作 Pad 弹窗

卡片在宽度大于 `900px` 时自动显示三栏 Pad 布局；手机宽度自动改成纵向信息流。
如果你已经安装 Browser Mod，可以将同一张卡放入弹窗：

```yaml
action: fire-dom-event
browser_mod:
  service: browser_mod.popup
  data:
    title: 中华万年历
    size: wide
    content:
      type: custom:chinese-calendar-card
      show_details: true
      show_header: true
```

Browser Mod 不是本集成的必需依赖；也可以把卡片直接放在普通仪表盘中。

## 发布给 HACS 使用

本仓库已经是 HACS 的 **Integration** 标准目录：`custom_components/chinese_calendar`、
`manifest.json` 和根目录 `hacs.json` 都已就位。将整个仓库推送到 GitHub 后，创建
`v0.1.0` Release；HACS 即可从自定义仓库安装和检查更新。

## 致谢与许可证

日期算法来自 MIT 许可的 [`6tail/lunar-python`](https://github.com/6tail/lunar-python)。
本项目使用 [MIT License](LICENSE)。
