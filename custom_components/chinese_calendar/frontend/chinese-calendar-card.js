const CARD_VERSION = "0.1.2";

class ChineseCalendarCard extends HTMLElement {
  static getStubConfig() { return { title: "中华万年历", show_details: true, show_header: true }; }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    const now = new Date();
    this._viewYear = now.getFullYear();
    this._viewMonth = now.getMonth() + 1;
    this._selected = this._localIso(now);
    this._data = null;
    this._loading = false;
    this._error = "";
  }

  setConfig(config) {
    if (!config) throw new Error("缺少卡片配置");
    this._config = { title: "中华万年历", show_details: true, show_header: true, ...config };
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._data && !this._loading) this._loadMonth();
  }

  getCardSize() { return 12; }
  getGridOptions() { return { columns: 12, rows: 12, min_columns: 6 }; }

  _localIso(value) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  async _loadMonth() {
    if (!this._hass) return;
    this._loading = true;
    this._error = "";
    this._render();
    try {
      this._data = await this._hass.callApi("GET", `chinese_calendar/month?year=${this._viewYear}&month=${this._viewMonth}`);
      if (!this._data.days.some((item) => item.date === this._selected)) {
        this._selected = this._data.days.find((item) => item.in_month)?.date;
      }
    } catch (error) {
      this._error = error?.message || "无法读取万年历数据";
    } finally {
      this._loading = false;
      this._render();
    }
  }

  _changeMonth(offset) {
    const next = new Date(this._viewYear, this._viewMonth - 1 + offset, 1);
    this._viewYear = next.getFullYear();
    this._viewMonth = next.getMonth() + 1;
    this._selected = `${this._viewYear}-${String(this._viewMonth).padStart(2, "0")}-01`;
    this._data = null;
    this._loadMonth();
  }

  _goToday() {
    const now = new Date();
    this._viewYear = now.getFullYear();
    this._viewMonth = now.getMonth() + 1;
    this._selected = this._localIso(now);
    this._data = null;
    this._loadMonth();
  }

  _escape(value) {
    return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
  }

  _join(values, fallback = "诸事不宜") {
    return Array.isArray(values) && values.length ? values.map((item) => this._escape(item)).join("　") : fallback;
  }

  _panel(title, body, tone = "neutral", extraClass = "") {
    return `<section class="info-panel ${tone} ${extraClass}"><h3><span class="section-icon">${this._icon(title)}</span>${this._escape(title)}</h3><div class="panel-body">${body}</div></section>`;
  }

  _icon(title) {
    const paths = title.includes("生肖") ? '<path d="M7.5 9.5c-2.2 0-3.5-1.6-3.5-3.3S5.3 3 7 3s3 1.4 3 3.2"/><path d="M16.5 9.5c2.2 0 3.5-1.6 3.5-3.3S18.7 3 17 3s-3 1.4-3 3.2"/><path d="M6 12.5c0-3 2.7-5 6-5s6 2 6 5-2.7 7.5-6 7.5-6-4.5-6-7.5Z"/>'
      : title.includes("节气") ? '<path d="M20 4C11 4 5 8 4 20c8-1 12-5 16-16Z"/><path d="M4 20 13 11"/>'
      : title === "宜" ? '<path d="m7 11 3 3 7-8"/><path d="M5 4h14v16H5z"/>'
      : title.includes("吉神") ? '<path d="m12 3 2.2 5.2L20 10l-4.1 3.7 1.2 5.8-5.1-2.8-5.1 2.8 1.2-5.8L4 10l5.8-1.8L12 3Z"/>'
      : title.includes("值日") ? '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3v4M16 3v4M4 10h16"/>'
      : title === "忌" ? '<circle cx="12" cy="12" r="8"/><path d="M8 12h8"/>'
      : title.includes("凶煞") ? '<circle cx="12" cy="12" r="8"/><path d="M12 8v5M12 16h.01"/>'
      : '<path d="M5 4h10a4 4 0 0 1 4 4v12H9a4 4 0 0 1-4-4V4Z"/><path d="M9 20V8a4 4 0 0 1 4-4"/>';
    return `<svg viewBox="0 0 24 24" aria-hidden="true">${paths}</svg>`;
  }

  _cellLabel(day) {
    return day.jieqi || day.lunar_festivals?.[0] || day.solar_festivals?.[0]
      || day.festivals?.[0] || day.lunar_day;
  }

  _renderCell(day) {
    const classes = ["day"];
    if (!day.in_month) classes.push("outside");
    if (day.is_weekend) classes.push("weekend");
    if (day.date === this._localIso(new Date())) classes.push("today");
    if (day.date === this._selected) classes.push("selected");
    const special = Boolean(day.jieqi || day.lunar_festivals?.length);
    return `<button class="${classes.join(" ")}" data-date="${day.date}" aria-label="${day.date} ${this._escape(day.lunar)}"><span class="solar">${day.day}</span><span class="lunar ${special ? "special" : ""}">${this._escape(this._cellLabel(day))}</span></button>`;
  }

  _renderDateSummary(day) {
    const isToday = day.date === this._localIso(new Date());
    return `<section class="date-summary"><div class="date-row"><b>公历</b><strong>${day.date}</strong><span>星期${this._escape(day.weekday)}</span>${isToday ? "<em>今天</em>" : ""}</div><div class="date-row"><b>农历</b><span>${this._escape(day.year_ganzhi)}年</span><strong>${this._escape(day.lunar)}</strong><span>${this._escape(day.zodiac)}年</span></div></section>`;
  }

  _renderCalendar() {
    const weekdays = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];
    return `<section class="calendar-shell"><nav class="month-nav" aria-label="月份导航"><button class="nav-button prev" aria-label="上个月"><svg viewBox="0 0 24 24"><path d="m15 18-6-6 6-6"/></svg></button><span>${this._viewYear}年</span><button class="today-button">今天</button><span>${this._viewMonth}月</span><button class="nav-button next" aria-label="下个月"><svg viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg></button></nav><div class="weekdays">${weekdays.map((item, index) => `<div class="${index > 4 ? "weekend" : ""}">${item}</div>`).join("")}</div><div class="days">${this._data.days.map((day) => this._renderCell(day)).join("")}</div></section>`;
  }

  _shiftSelected(offset) {
    const index = this._data?.days?.findIndex((item) => item.date === this._selected) ?? -1;
    if (index < 0) return;
    const next = this._data.days[Math.max(0, Math.min(this._data.days.length - 1, index + offset))];
    if (next) { this._selected = next.date; this._render(); }
  }

  _renderFortuneStrip(day) {
    const index = this._data.days.findIndex((item) => item.date === day.date);
    const start = Math.max(0, Math.min(index - 6, this._data.days.length - 13));
    const items = this._data.days.slice(start, start + 13);
    return `<section class="fortune-strip"><h3>十三日干支运势 <small>${items[0].date} ～ ${items.at(-1).date}</small></h3><div class="fortune-row"><button class="fortune-arrow fortune-prev" aria-label="前一天">‹</button><div class="fortune-days">${items.map((item) => { const luckClass = item.tian_shen_luck === "吉" ? "lucky" : item.tian_shen_luck === "凶" ? "unlucky" : "plain"; return `<button data-date="${item.date}" class="fortune-day ${item.date === day.date ? "active" : ""}"><span>${item.day}</span><b>${this._escape(item.day_ganzhi)}</b><em class="${luckClass}">${this._escape(item.tian_shen_luck)}</em></button>`; }).join("")}</div><button class="fortune-arrow fortune-next" aria-label="后一天">›</button></div></section>`;
  }

  _renderDirections(day, mobile = false) {
    const directions = [["喜神", day.xishen], ["福神", day.fushen], ["财神", day.caishen], ["阳贵", day.yanggui], ["阴贵", day.yingui]];
    return `<section class="directions ${mobile ? "mobile-directions" : "desktop-directions"}"><h3>今日吉方</h3><div>${directions.map(([name, value]) => `<span><b>${name}</b>${this._escape(value)}</span>`).join("")}</div></section>`;
  }

  _renderMobileDetails(day) {
    const tile = (title, value, tone = "") => `<section class="mobile-tile ${tone}"><b>${this._escape(title)}</b><span>${this._escape(value || "—")}</span></section>`;
    return `<div class="mobile-details"><div class="mobile-grid">${tile("宜", this._join(day.yi, "诸事不宜"), "good-tile")}${tile("忌", this._join(day.ji, "诸事不宜"), "bad-tile")}${tile(`生肖年　${day.year_zodiac}`, `${day.year_ganzhi}年`, "bad-tile")}${tile("相冲", `冲${day.chong}\n岁煞 ${day.sha}`, "bad-tile")}${tile("吉神宜趋", this._join(day.ji_shen, "—"), "good-tile")}${tile("凶煞宜忌", this._join(day.xiong_sha, "—"), "bad-tile")}${tile("彭祖百忌", day.pengzu, "bad-tile")}${tile("胎神", `${day.month_tai_shen} ${day.tai_shen}`, "good-tile")}${tile("日禄\n物候", `${day.day_lu}\n${day.hou} ${day.wu_hou}`, "bad-tile")}${tile("九星\n星宿", `${day.nine_star}\n${day.xiu}`, "good-tile")}</div>${this._renderDirections(day, true)}</div>`;
  }

  _renderLeft(day) {
    const zodiac = `<div class="zodiac-line"><b>生肖年</b><span>${this._escape(day.year_zodiac)}（${this._escape(day.year_ganzhi)}）</span><small>${this._escape(day.year_nayin)}</small></div><div class="zodiac-line"><b>生肖月</b><span>${this._escape(day.month_zodiac)}（${this._escape(day.month_ganzhi)}）</span><small>${this._escape(day.month_nayin)}</small></div><div class="zodiac-line"><b>生肖日</b><span>${this._escape(day.day_zodiac)}（${this._escape(day.day_ganzhi)}）</span><small>${this._escape(day.day_nayin)}</small></div>`;
    const terms = this._data.solar_terms?.length ? this._data.solar_terms.map((term) => `<div class="term"><b>${this._escape(term.name)}</b><span>${term.date} 周${this._escape(term.weekday)}</span></div>`).join("") : "本月无节气数据";
    return `<aside class="side left-side">${this._panel("生肖 · 纳音", zodiac, "accent", "zodiac-panel")}${this._panel("本月节气", terms, "teal", "terms-panel")}${this._panel("宜", this._join(day.yi), "good", "advice-panel")}${this._panel("吉神宜趋", this._join(day.ji_shen, "—"), "good")}${this._panel("彭祖百忌", this._escape(day.pengzu), "bad")}${this._panel("日禄", this._escape(day.day_lu), "bad", "compact-panel")}${this._panel("物候", `${this._escape(day.hou)}　${this._escape(day.wu_hou)}`, "bad", "compact-panel")}</aside>`;
  }

  _renderRight(day) {
    const conflict = `<div class="key-value"><b>相冲</b><span>冲${this._escape(day.chong)}</span></div><div class="key-value"><b>岁煞</b><span>${this._escape(day.sha)}</span></div><div class="key-value"><b>天神</b><span>${this._escape(day.tian_shen)}（${this._escape(day.tian_shen_type)}）</span></div>`;
    const nextTerm = this._data.solar_terms?.find((term) => term.date > day.date) || this._data.solar_terms?.[0];
    const termBody = nextTerm ? `${this._escape(nextTerm.name)}　${nextTerm.date} 周${this._escape(nextTerm.weekday)}` : "本月无节气数据";
    return `<aside class="side right-side">${this._panel("值日 · 冲煞", conflict, "bad", "conflict-panel")}${this._panel("下次节气", termBody, "teal", "compact-panel")}${this._panel("忌", this._join(day.ji), "bad", "advice-panel")}${this._panel("凶煞宜忌", this._join(day.xiong_sha, "—"), "bad")}${this._panel("胎神", `${this._escape(day.month_tai_shen)}　${this._escape(day.tai_shen)}`, "bad", "compact-panel")}${this._panel("九星", this._escape(day.nine_star), "bad", "compact-panel")}${this._panel("星宿", this._escape(day.xiu), "bad", "compact-panel")}</aside>`;
  }

  _render() {
    if (!this.shadowRoot || !this._config) return;
    const day = this._data?.days?.find((item) => item.date === this._selected);
    const header = this._config.show_header === false ? "" : `<header class="card-title"><h2>${this._escape(this._config.title)}</h2><button class="close-button" aria-label="关闭">×</button></header>`;
    const details = this._config.show_details !== false;
    const compact = this._config.compact === true;
    const body = day ? `<div class="almanac-layout"><div class="upper-layout">${details ? this._renderLeft(day) : ""}<main class="center-column">${this._renderDateSummary(day)}${this._renderCalendar()}${this._renderFortuneStrip(day)}${details ? this._renderDirections(day) : ""}</main>${details ? this._renderRight(day) : ""}</div>${details ? this._renderMobileDetails(day) : ""}</div>` : "";
    this.shadowRoot.innerHTML = `<style>${this._styles()}</style><ha-card class="calendar-card ${compact ? "compact-card" : ""}">${header}${this._error ? `<div class="message error">${this._escape(this._error)}</div>` : ""}${this._loading && !this._data ? '<div class="message">正在计算本月农历…</div>' : ""}${body}</ha-card>`;
    this.shadowRoot.querySelector(".prev")?.addEventListener("click", () => this._changeMonth(-1));
    this.shadowRoot.querySelector(".next")?.addEventListener("click", () => this._changeMonth(1));
    this.shadowRoot.querySelector(".today-button")?.addEventListener("click", () => this._goToday());
    this.shadowRoot.querySelector(".close-button")?.addEventListener("click", () => this.dispatchEvent(new Event("close")));
    this.shadowRoot.querySelector(".fortune-prev")?.addEventListener("click", () => this._shiftSelected(-1));
    this.shadowRoot.querySelector(".fortune-next")?.addEventListener("click", () => this._shiftSelected(1));
    this.shadowRoot.querySelectorAll("[data-date]").forEach((button) => button.addEventListener("click", () => { this._selected = button.dataset.date; this._render(); }));
  }

  _styles() {
    return `
      :host{--surface:var(--ha-card-background,var(--card-background-color,#fff));--panel:var(--secondary-background-color,#f7f8fa);--text:var(--primary-text-color,#272a35);--muted:var(--secondary-text-color,#747b89);--line:var(--divider-color,rgba(80,88,104,.14));--accent:var(--info-color,var(--primary-color,#43a1f4));--good:var(--success-color,#26a65b);--bad:var(--error-color,#e74646);display:block;color:var(--text);font-family:var(--paper-font-body1_-_font-family,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif)}
      *{box-sizing:border-box}button{font:inherit}.calendar-card{display:block;width:100%;overflow:hidden;padding:clamp(12px,1.5vw,20px);border:1px solid var(--line);border-radius:var(--ha-card-border-radius,24px);background:var(--surface);box-shadow:var(--ha-card-box-shadow,0 8px 28px rgba(30,39,56,.07))}.card-title{display:flex;align-items:center;justify-content:space-between;margin:0 0 14px 3px}.card-title h2{margin:0;font-size:26px;font-weight:720;letter-spacing:.02em}.close-button{width:34px;height:34px;border:0;color:var(--muted);background:transparent;font-size:34px;font-weight:300;line-height:1;cursor:pointer}.close-button:hover{color:var(--text)}
      .almanac-layout{display:flex;min-width:0;flex-direction:column;gap:10px}.compact-card{max-width:1100px;margin-inline:auto}.upper-layout{display:grid;grid-template-columns:minmax(0,.85fr) minmax(0,1.65fr) minmax(0,.75fr);align-items:stretch;gap:10px}.center-column{display:flex;min-width:0;flex-direction:column;gap:10px}.side{display:flex;min-width:0;flex-direction:column;gap:10px}.right-side{justify-content:space-between}.date-summary,.calendar-shell,.fortune-strip,.directions,.info-panel{border:1px solid var(--line);border-radius:13px;background:color-mix(in srgb,var(--panel) 48%,var(--surface));box-shadow:0 2px 8px rgba(25,35,50,.025)}
      .date-summary{padding:13px 17px}.date-row{display:flex;align-items:center;gap:clamp(10px,2vw,25px);min-height:31px;font-size:16px}.date-row b{width:42px}.date-row strong{font-size:19px}.date-row:first-child strong{color:var(--accent)}.date-row em{padding:3px 10px;border-radius:999px;color:var(--accent);background:color-mix(in srgb,var(--accent) 13%,transparent);font-size:13px;font-style:normal}
      .calendar-shell{display:flex;min-width:0;flex-direction:column;overflow:hidden;padding:9px}.month-nav{display:grid;grid-template-columns:38px 1fr auto 1fr 38px;align-items:center;gap:6px;padding:1px 5px 8px;text-align:center;font-weight:620}.nav-button,.today-button{height:34px;border:0;border-radius:9px;color:var(--text);background:transparent;cursor:pointer}.nav-button{display:grid;place-items:center}.nav-button svg{width:20px;height:20px;fill:none;stroke:var(--accent);stroke-width:2;stroke-linecap:round;stroke-linejoin:round}.today-button{padding:0 14px;background:color-mix(in srgb,var(--accent) 11%,transparent)}.nav-button:hover,.today-button:hover{background:color-mix(in srgb,var(--accent) 18%,transparent)}
      .weekdays,.days{display:grid;grid-template-columns:repeat(7,minmax(0,1fr))}.days{flex:1;grid-template-rows:repeat(6,minmax(52px,1fr))}.weekdays div{padding:8px 2px;text-align:center;color:var(--muted);font-size:13px;font-weight:650}.weekend{color:var(--bad)!important}.day{position:relative;min-width:0;min-height:52px;padding:5px 2px;border:0;border-radius:9px;color:var(--text);background:transparent;text-align:center;cursor:pointer}.day:hover{background:color-mix(in srgb,var(--accent) 8%,transparent)}.day.selected{color:#fff!important;background:var(--accent);box-shadow:0 4px 12px color-mix(in srgb,var(--accent) 25%,transparent)}.day.today:not(.selected){box-shadow:inset 0 0 0 2px var(--accent)}.day.selected span{color:#fff!important}.day.outside{opacity:.28}.solar{display:block;font-size:17px;font-weight:650}.lunar{display:block;overflow:hidden;margin-top:3px;color:var(--muted);font-size:11px;white-space:nowrap;text-overflow:ellipsis}.lunar.special{color:var(--good);font-weight:650}
      .fortune-strip{padding:10px}.fortune-strip h3,.directions h3{margin:0 0 8px;font-size:14px}.fortune-strip h3 small{margin-left:6px;color:var(--muted);font-weight:400}.fortune-row{display:flex;align-items:stretch;gap:5px}.fortune-days{display:grid;flex:1;grid-template-columns:repeat(13,minmax(34px,1fr));gap:4px}.fortune-arrow{display:grid;width:22px;flex:none;place-items:center;border:0;border-radius:8px;color:var(--muted);background:transparent;font-size:28px;line-height:1;cursor:pointer}.fortune-arrow:hover{color:var(--accent);background:color-mix(in srgb,var(--accent) 9%,transparent)}.fortune-day{display:flex;min-width:0;flex-direction:column;gap:2px;align-items:center;padding:5px 1px;border:1px solid var(--line);border-radius:8px;color:var(--text);background:transparent;cursor:pointer}.fortune-day.active{border-color:var(--accent);background:color-mix(in srgb,var(--accent) 11%,transparent)}.fortune-day span{font-size:10px;color:var(--muted)}.fortune-day b{font-size:11px}.fortune-day em{font-size:11px;font-style:normal}.lucky{color:var(--good)}.unlucky{color:var(--bad)}.plain{color:var(--muted)}
      .directions{padding:10px 14px}.directions>div{display:grid;grid-template-columns:repeat(5,1fr);gap:8px}.directions span{display:flex;flex-direction:column;gap:3px;text-align:center;font-size:12px}.directions span b{color:var(--good)}.mobile-details{display:none}.mobile-directions{display:none}.info-panel{display:flex;min-height:0;flex-direction:column;padding:12px}.info-panel h3{display:flex;align-items:center;gap:7px;margin:0 0 8px;font-size:15px}.section-icon{display:grid;width:22px;height:22px;flex:none;place-items:center}.section-icon svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}.info-panel.good h3{color:var(--good)}.info-panel.bad h3{color:var(--bad)}.info-panel.teal h3,.info-panel.accent h3{color:var(--accent)}.panel-body{overflow:hidden;font-size:13px;line-height:1.58}.advice-panel{min-height:0}.compact-panel{padding-block:10px}.compact-panel h3{margin-bottom:4px}.key-value,.zodiac-line,.term{display:grid;grid-template-columns:auto 1fr;gap:2px 7px;margin-bottom:6px}.key-value:last-child,.zodiac-line:last-child,.term:last-child{margin-bottom:0}.key-value b{color:var(--bad)}.zodiac-line b{color:var(--bad)}.zodiac-line small{grid-column:2;color:var(--muted)}.term b{color:var(--good)}.term span{color:var(--muted)}.misc-row{display:grid;grid-template-columns:36px 1fr;gap:6px;margin-bottom:4px}.misc-row:last-child{margin-bottom:0}.misc-row b{color:var(--accent)}.mobile-band{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:12px;padding:12px 14px;border:1px solid var(--line);border-radius:14px;background:var(--surface)}.mobile-band>div{display:grid;grid-template-columns:auto 1fr;gap:8px;min-width:0;align-items:start}.mobile-band b{font-size:15px;line-height:1.55}.mobile-band span{min-width:0;font-size:14px;line-height:1.55;overflow-wrap:anywhere}.advice-band>div:first-child b,.good-bad-band>div:first-child b,.green-band b{color:var(--good)}.advice-band>div:last-child b,.good-bad-band>div:last-child b{color:var(--bad)}.mixed-band b{color:var(--bad)}.mobile-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.mobile-tile{display:grid;grid-template-columns:auto 1fr;gap:8px;min-width:0;align-items:start;padding:10px 12px;border:1px solid var(--line);border-radius:12px;background:var(--surface)}.mobile-tile b{font-size:14px;line-height:1.5;white-space:pre-line}.mobile-tile span{min-width:0;font-size:12px;line-height:1.5;white-space:pre-line;overflow-wrap:anywhere}.good-tile b{color:var(--good)}.bad-tile b{color:var(--bad)}button:focus-visible{outline:2px solid var(--accent);outline-offset:2px}.message{padding:55px;text-align:center;color:var(--muted)}.message.error{color:var(--bad)}
      .fortune-days{min-width:0;grid-template-columns:repeat(13,minmax(0,1fr))}
      @media(min-width:901px) and (max-width:1200px){.fortune-days{gap:2px}.fortune-arrow{width:16px}.fortune-day b{font-size:10px;white-space:nowrap}}
      @media(max-width:1200px) and (min-width:901px){.calendar-card{padding:12px}.upper-layout{grid-template-columns:minmax(170px,.82fr) minmax(380px,1.7fr) minmax(170px,.78fr);gap:7px}.info-panel{padding:9px}.info-panel h3{font-size:14px}.panel-body{font-size:12px}.days{grid-template-rows:repeat(6,minmax(44px,1fr))}.solar{font-size:14px}}
      @media(max-width:900px){.calendar-card{padding:12px;border-radius:var(--ha-card-border-radius,22px)}.card-title{margin-bottom:10px}.card-title h2{font-size:21px}.upper-layout{display:flex;height:auto;min-height:0;flex-direction:column}.center-column{order:1;min-height:0}.left-side,.right-side{display:none}.side{grid-template-columns:1fr 1fr;grid-template-rows:auto}.date-summary{padding:8px 12px}.date-row{min-height:25px;gap:10px;font-size:13px}.date-row b{width:34px}.date-row strong{font-size:15px}.calendar-shell{flex:none;min-height:0;padding:5px}.day{min-height:49px}.solar{font-size:14px}.lunar{font-size:10px}.fortune-days{overflow-x:auto;grid-template-columns:repeat(13,44px);padding-bottom:3px}.directions>div{grid-template-columns:repeat(5,1fr)}}
      @media(max-width:540px){.card-title{display:flex;margin:0 8px 10px}.card-title h2{font-size:22px}.close-button{width:30px;height:30px;font-size:30px}.calendar-card{padding:8px;border:0;border-radius:0;background:color-mix(in srgb,var(--panel) 70%,var(--surface));box-shadow:none}.almanac-layout,.upper-layout,.center-column,.mobile-details,.compact-calendar{gap:7px}.date-row{flex-wrap:wrap}.date-row em{margin-left:auto}.month-nav{grid-template-columns:32px 1fr auto 1fr 32px;font-size:13px}.weekdays div{padding:6px 1px;font-size:11px}.days{grid-template-rows:repeat(6,minmax(45px,1fr))}.day{min-height:45px;padding:4px 1px}.solar{font-size:13px}.lunar{font-size:9px}.date-summary,.calendar-shell,.fortune-strip,.directions,.mobile-tile{border-radius:14px;background:var(--surface)}.mobile-details{display:flex;flex-direction:column}.mobile-tile{gap:6px;padding:9px 10px}.mobile-tile b{font-size:14px}.mobile-tile span{font-size:11px}.desktop-directions{display:none}.mobile-directions{display:block}.fortune-strip h3{font-size:16px}.fortune-strip h3 small{display:block;margin:3px 0 0;font-size:11px}.fortune-row{gap:2px}.fortune-arrow{width:24px;font-size:26px}.fortune-days{min-width:0;overflow:hidden;grid-template-columns:repeat(5,minmax(0,1fr));gap:4px;padding:0}.fortune-day{display:none}.fortune-day:nth-child(n+5):nth-child(-n+9){display:flex}.directions{padding:9px}.directions span{font-size:10px}}
      @media(max-width:900px){.mobile-details{display:flex;flex-direction:column;gap:8px}.desktop-directions{display:none}.mobile-directions{display:block}.calendar-shell{flex:none}.upper-layout{min-height:0;align-items:stretch}.center-column{min-height:0;width:100%}}
      @media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important}}
    `;
  }
}

if (!customElements.get("chinese-calendar-card")) customElements.define("chinese-calendar-card", ChineseCalendarCard);
window.customCards = window.customCards || [];
window.customCards.push({ type: "chinese-calendar-card", name: "中华万年历", description: "响应式公历、农历与每日黄历。", preview: true });
console.info(`%c 中华万年历 %c v${CARD_VERSION} `, "color:#fff;background:#43a1f4;padding:3px 6px", "color:#334;background:#eef3f8;padding:3px 6px");
