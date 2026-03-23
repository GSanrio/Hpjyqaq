# 五曜赐福部署说明

这份文档说明如何把当前项目部署到：

- GitHub Pages
- NAS

目标是让这个纯静态前端项目可以被外部访问。

本项目的特点很适合部署：

- 没有后端
- 没有数据库
- 没有构建步骤
- 只需要把静态文件发布出去即可

项目入口文件：

- [index.html](./index.html)
- 实际页面在 [wycf/Demo.html](./wycf/Demo.html)

## 一、部署前先确认什么

在部署前，建议先确认下面几点：

1. 本地直接双击或本地静态服务打开时，页面能正常运行。
2. 主页入口是 [index.html](./index.html)，它会跳转到 `wycf/Demo.html`。
3. 所有资源路径目前都是相对路径，适合放在同一静态目录下部署。
4. 子页面 [wycf/Archive.html](./wycf/Archive.html) 依赖浏览器 `localStorage`，只能读取当前浏览器本地保存的数据，不会跨浏览器同步。

## 二、部署到 GitHub Pages

GitHub Pages 最适合这个项目，因为它天然支持静态网站托管。

### 方案 A：直接用当前仓库发布

如果你的仓库已经在 GitHub 上，步骤如下：

1. 把本地代码推送到 GitHub 仓库。
2. 打开仓库页面。
3. 进入 `Settings`。
4. 点击左侧 `Pages`。
5. 在 `Build and deployment` 中选择：
   `Source -> Deploy from a branch`
6. 选择分支：
   `main` 或 `master`
7. 选择目录：
   `/ (root)`
8. 保存。

如果发布成功，GitHub 会给你一个地址，通常类似：

```text
https://你的用户名.github.io/仓库名/
```

因为项目根目录已经有 [index.html](./index.html)，所以访问这个地址时会自动进入项目首页。

### 方案 B：单独建一个仓库专门托管页面

如果你不想把所有内容放在现有仓库，也可以：

1. 新建一个 GitHub 仓库。
2. 把整个 `chouche` 项目目录内容上传进去。
3. 保证根目录下有：
   - `index.html`
   - `wycf/`
4. 按上面的 GitHub Pages 流程开启发布。

### 推送代码的常用命令

如果你已经在本地 git 仓库里，可以用：

```bash
git add .
git commit -m "deploy: update wheel site"
git push origin main
```

### GitHub Pages 的优点

- 免费
- 配置简单
- 很适合纯静态项目
- 不需要自己维护 Web 服务

### GitHub Pages 的注意事项

1. 如果仓库是私有仓库，要确认你的账号套餐是否支持 Pages。
2. 如果你修改了文件，必须重新 `git push`，页面才会更新。
3. GitHub Pages 是静态托管，不会替你保存服务器端数据。
4. 本项目里的日志、背包、令牌、徽章等状态目前依赖 `localStorage`，只保存在访问者自己的浏览器里。

## 三、部署到 NAS

如果你想通过 NAS 对外提供访问，本项目也非常适合，因为它只需要静态文件服务。

常见方式有两种：

- 把项目放进 NAS 自带的 Web 服务目录
- 用 Docker/Nginx 在 NAS 上托管静态站点

下面分别说明。

## 四、NAS 方式一：使用 NAS 自带 Web 服务

不同品牌 NAS 的名字略有不同，但思路基本一致：

- 开启 Web Server
- 指定网站根目录
- 把项目文件放进去

### 通用步骤

1. 在 NAS 管理后台开启 Web 服务。
2. 找到站点根目录，常见名字例如：
   - `web`
   - `www`
   - `htdocs`
3. 把项目整个内容上传进去。

建议目录结构像这样：

```text
web/
  chouche/
    index.html
    _config.yml
    README.md
    README_EN.md
    README-bushu.md
    wycf/
      Demo.html
      Demo.css
      Demo.js
      Archive.html
      Archive.css
      Archive.js
      imgs/
```

4. 浏览器访问：

```text
http://你的NAS地址/chouche/
```

如果站点根目录直接就是项目目录，也可以直接访问：

```text
http://你的NAS地址/
```

### 群晖 Synology 的典型做法

如果你用的是群晖，通常可以这样做：

1. 打开 `套件中心`
2. 安装并启用 `Web Station`
3. 确认 `web` 共享文件夹存在
4. 把项目上传到：

```text
/web/chouche
```

5. 访问：

```text
http://NAS局域网IP/chouche/
```

如果还想配域名和 HTTPS，可以再在 Web Station 或反向代理里配置。

## 五、NAS 方式二：使用 Docker + Nginx

如果 NAS 支持 Docker，这是更通用也更稳定的方案。

### 目录准备

先在 NAS 上准备一个目录，比如：

```text
/volume1/docker/chouche
```

把项目文件上传进去，确保里面有：

- `index.html`
- `wycf/`

### 启动一个最简单的 Nginx 容器

示例命令：

```bash
docker run -d \
  --name chouche-nginx \
  -p 8080:80 \
  -v /volume1/docker/chouche:/usr/share/nginx/html:ro \
  nginx:alpine
```

启动后可以通过下面地址访问：

```text
http://NAS局域网IP:8080/
```

### docker-compose 示例

如果你用 `docker compose`，可以写一个 `compose.yaml`：

```yaml
services:
  chouche:
    image: nginx:alpine
    container_name: chouche-nginx
    ports:
      - "8080:80"
    volumes:
      - /volume1/docker/chouche:/usr/share/nginx/html:ro
    restart: unless-stopped
```

然后执行：

```bash
docker compose up -d
```

## 六、如何实现外部访问

无论你部署在 GitHub 还是 NAS，想让“外网能打开”，方式不同。

### GitHub Pages

GitHub Pages 天然就是外网可访问的。

你只需要把仓库发布成功，然后把地址发给别人即可。

### NAS 外部访问

NAS 默认通常只有局域网能访问，要实现外网访问，通常要补下面几步。

#### 1. 固定 NAS 的局域网 IP

建议在路由器里给 NAS 绑定固定 IP，例如：

```text
192.168.1.20
```

这样后面的端口映射才不会失效。

#### 2. 路由器做端口转发

例如你在 NAS 上开放了：

- `80`
- 或 `8080`

那么要在路由器里把公网端口转发到 NAS。

例如：

```text
公网 8080 -> 192.168.1.20:8080
```

然后外网就可以通过：

```text
http://你的公网IP:8080/
```

访问。

#### 3. 建议配置 DDNS

因为公网 IP 可能变化，建议配置动态域名解析，比如：

- 群晖 DDNS
- 阿里云 DDNS
- Cloudflare DDNS
- 花生壳

有了 DDNS 后，就可以用固定域名访问，例如：

```text
http://yourname.synology.me:8080/
```

#### 4. 建议加 HTTPS

如果对外长期开放，建议上 HTTPS。

常见做法：

- NAS 反向代理 + 证书
- Nginx + Let’s Encrypt
- Cloudflare 代理

## 七、推荐部署方案

如果你的目标只是“让别人能直接访问页面”，推荐优先级如下：

### 最推荐：GitHub Pages

适合情况：

- 只是展示页面
- 不想维护服务器
- 希望最快上线

优点：

- 最省事
- 免费
- 外网天然可访问

### 第二推荐：NAS 自带 Web 服务

适合情况：

- 你已经有 NAS
- 希望自己控制站点
- 主要是家庭或小范围使用

优点：

- 操作直观
- 适合静态站点

### 第三推荐：NAS + Docker + Nginx

适合情况：

- 你熟悉容器
- 后续可能还会部署别的站点
- 希望配置更标准

优点：

- 可迁移
- 易于扩展
- 比较接近正式部署环境

## 八、关于本项目“数据保存”的现实限制

这点很重要。

当前项目虽然可以对外访问，但它不是后端系统，所有状态都保存在访问者浏览器本地：

- 余额
- 总消费
- 令牌
- 徽章
- 日志
- 背包

也就是说：

1. 换浏览器后数据不会同步。
2. 换设备后数据不会同步。
3. 清空浏览器存储后数据会丢失。
4. 不同访问者之间也不会共享同一份数据。

如果你以后希望：

- 多人共用同一套数据
- 登录后保留进度
- 所有人看到同一份背包/记录

那就需要继续增加后端服务，例如：

- Node.js + SQLite / MySQL
- PHP + MySQL
- Supabase / Firebase
- 其他数据库服务

## 九、最简上线建议

如果你现在只想最快把页面发出去，建议直接选 GitHub Pages：

1. 把项目推到 GitHub
2. 开启 Pages
3. 用生成的网址访问

如果你更想自己控制外网访问：

1. 把项目上传到 NAS
2. 开启 Web 服务
3. 配置端口转发或反向代理
4. 用 DDNS 或域名访问

## 十、部署后访问路径示例

### GitHub Pages

```text
https://用户名.github.io/chouche/
```

### NAS 子目录方式

```text
http://你的域名/chouche/
```

### NAS 端口方式

```text
http://你的公网IP:8080/
```

## 十一、部署完成后建议自检

部署完成后，建议检查：

1. 首页能否正常打开
2. 是否能自动跳转到 `wycf/Demo.html`
3. 抽奖按钮是否正常转动
4. 子页面 `wycf/Archive.html` 是否能打开
5. 页面资源图片是否加载正常
6. 手机端是否能完整展示页面

---

如果你愿意，我下一步可以继续帮你补一份：

- `README-bushu-en.md` 英文部署文档

或者直接帮你再写一份：

- “GitHub Pages 一步一步图文版部署流程”
- “群晖 NAS 部署操作手册”
