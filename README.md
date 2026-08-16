# 2026 科技半年报 · Canvas 直出影片

用 **HTML Canvas 逐帧绘制**，再经 FFmpeg 封装成 **5 分钟 / 1920×1080** 纪录片式总结，覆盖 2026 年 2 月至 8 月公开报道中的重大科技进展。

成片：[`output/tech-2026-h1.mp4`](output/tech-2026-h1.mp4)

## 怎么看

- 浏览器预览（可跳转章节、变速、用 MediaRecorder 导出 WebM）：

```bash
npm run serve
```

打开提示的本地地址即可。

- 离线直出 MP4（推荐，含程序生成的环境配乐）：

```bash
npm install
npm run render
```

依赖：Node.js 18+、系统 `ffmpeg`、`@napi-rs/canvas`。

## 影片结构（300 秒）

| 时间 | 章节 | 内容 |
| --- | --- | --- |
| 0:00–0:16 | 开场 | 2026 · 二月至八月 |
| 0:16–0:28 | 六条主线 | 目录 |
| 0:28–1:18 | 实时智能 | GPT-5.6 Sol Ultrafast、Gemini 3.7 Flash、Grok 4.6 |
| 1:18–1:58 | 具身机器人 | Gemini Robotics ER 2 |
| 1:58–2:42 | 算力芯片 | Terafab、NASA HPSC |
| 2:42–3:30 | 能源存储 | 12.8 GWh 集群、Megapack 3、固态电池路试 |
| 3:30–4:08 | 生命科学 | Nature 实体瘤 T 细胞 CRISPR 体内筛选 |
| 4:08–4:46 | 太空计算 | 东方慧眼 AI 卫星、深空自主 |
| 4:46–5:00 | 收束 | 速度 · 落地 · 能源 |

## 说明

画面与旁白式文案依据公开报道整理，测试中、预览中的能力不等于全面量产。主要来源包括 NASA、OpenAI、Google、SpaceXAI、TechCrunch、Nature、新华社 / CGTN、Electrek、CleanTechnica 等 2026 年 2–8 月发布的材料。
