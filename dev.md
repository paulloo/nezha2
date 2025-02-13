### MVP 开发文档：实时票房数据展示 Web 项目

#### 1. 项目概述
本项目旨在快速开发一个 Web 应用，展示电影《哪吒之魔童闹海》的实时票房数据。通过调用猫眼专业版的 API，获取票房数据并展示在网页上。

#### 2. 技术栈
- **前端**：HTML、CSS、JavaScript（可选框架：Vue.js 或 React）
- **后端**：Node.js（Express.js 框架）
- **API 调用**：Axios（用于 HTTP 请求）
- **部署**：Vercel 或 Netlify（快速部署前端） + Heroku（部署后端）

#### 3. 项目结构
```
/movie-box-office
├── /backend
│   ├── server.js          # 后端服务，处理 API 请求
│   ├── package.json       # 后端依赖
├── /frontend
│   ├── index.html         # 前端页面
│   ├── styles.css         # 样式文件
│   ├── app.js             # 前端逻辑
│   ├── package.json       # 前端依赖
├── README.md              # 项目说明
```

#### 4. 后端开发

##### 4.1 安装依赖
在 `/backend` 目录下运行：
```bash
npm init -y
npm install express axios cors
```

##### 4.2 创建 `server.js`
```javascript
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = 3001;

app.use(cors());

// 代理请求猫眼 API
app.get('/api/box-office', async (req, res) => {
    try {
        const url = 'https://piaofang.maoyan.com/dashboard-ajax/movie?movieId=1294273&orderType=0&uuid=194fe65ad40c8-01e6fdc0c14adf-26011851-1fa400-194fe65ad40c8&timeStamp=1739434972217&User-Agent=TW96aWxsYS81LjAgKFdpbmRvd3MgTlQgMTAuMDsgV2luNjQ7IHg2NCkgQXBwbGVXZWJLaXQvNTM3LjM2IChLSFRNTCwgbGlrZSBHZWNrbykgQ2hyb21lLzEzMS4wLjAuMCBTYWZhcmkvNTM3LjM2&index=83&channelId=40009&sVersion=2&signKey=448f569ef293e7300e969f1a67f07b55&WuKongReady=h5';
        const response = await axios.get(url);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch data' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
```

##### 4.3 运行后端
```bash
node server.js
```

#### 5. 前端开发

##### 5.1 创建 `index.html`
```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>哪吒之魔童闹海 实时票房</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div id="app">
        <h1>哪吒之魔童闹海 实时票房</h1>
        <div id="box-office-data">
            <p>加载中...</p>
        </div>
    </div>
    <script src="app.js"></script>
</body>
</html>
```

##### 5.2 创建 `styles.css`
```css
body {
    font-family: Arial, sans-serif;
    background-color: #f4f4f4;
    color: #333;
    margin: 0;
    padding: 20px;
}

h1 {
    text-align: center;
}

#box-office-data {
    margin-top: 20px;
    padding: 20px;
    background-color: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
```

##### 5.3 创建 `app.js`
```javascript
document.addEventListener('DOMContentLoaded', () => {
    const boxOfficeData = document.getElementById('box-office-data');

    // 调用后端 API 获取数据
    fetch('http://localhost:3001/api/box-office')
        .then(response => response.json())
        .then(data => {
            const movie = data.movieList.list.find(m => m.movieInfo.movieId === 1294273);
            if (movie) {
                boxOfficeData.innerHTML = `
                    <p>电影名称：${movie.movieInfo.movieName}</p>
                    <p>上映天数：${movie.movieInfo.releaseInfo}</p>
                    <p>总票房：${movie.sumBoxDesc}</p>
                    <p>分账票房：${movie.sumSplitBoxDesc}</p>
                    <p>场均人次：${movie.avgShowView}</p>
                    <p>上座率：${movie.avgSeatView}</p>
                `;
            } else {
                boxOfficeData.innerHTML = '<p>未找到票房数据</p>';
            }
        })
        .catch(error => {
            boxOfficeData.innerHTML = '<p>加载数据失败，请稍后重试</p>';
            console.error('Error:', error);
        });
});
```

#### 6. 部署

##### 6.1 前端部署
- 将 `/frontend` 目录上传至 Vercel 或 Netlify。
- 配置构建命令（如 `npm install && npm run build`）。

##### 6.2 后端部署
- 将 `/backend` 目录上传至 Heroku。
- 配置 `Procfile`：
  ```
  web: node server.js
  ```
- 部署后，将前端 API 请求地址改为后端部署地址。

#### 7. 测试
- 访问前端页面，检查是否正常加载票房数据。
- 确保数据更新频率符合预期（根据 API 的 `updateGapSecond` 字段）。

#### 8. 后续优化
- 添加图表展示票房趋势（使用 Chart.js 或 ECharts）。
- 支持多电影选择。
- 增加缓存机制，减少 API 请求频率。

#### 9. 注意事项
- 猫眼 API 可能有访问限制，需确保合规使用。
- 部署时注意环境变量配置（如 API 密钥）。

---

通过以上步骤，你可以快速搭建一个 MVP 项目，展示《哪吒之魔童闹海》的实时票房数据。