# 部署到 GitHub Pages · 完整步骤

写给没接触过 Git 和 GitHub Pages 的情况。全程大约 15 分钟，其中一半时间在装东西。

---

## 0. 先确认你要的网址形态

GitHub Pages 的地址由**仓库名**决定：

| 仓库名 | 部署后的网址 |
|---|---|
| `anime-sedai` | `https://<你的用户名>.github.io/anime-sedai/` |
| `<你的用户名>.github.io` | `https://<你的用户名>.github.io/`（根路径） |

两种都可以，第二种网址更短，但**一个账号只能有一个**这种仓库，通常留给个人主页用。
下面按第一种（普通仓库）讲，工作流已经会自动处理路径差异。

---

## 1. 安装 Git

Windows 上下载安装包：

> https://git-scm.com/download/win

双击运行，**所有选项保持默认，一路 Next 到最后**。不需要改任何设置。

装完后**新开一个终端**（重要：旧终端不会自动更新 PATH），输入：

```bash
git --version
```

能打印出版本号（例如 `git version 2.47.0.windows.1`）就成功了。

> 如果你更想要图形界面，也可以装 **GitHub Desktop**（https://desktop.github.com/），
> 它自带登录和推送功能，可以跳过下面的第 3、5 步。两条路选一条即可。

---

## 2. 在 GitHub 上创建仓库

1. 打开 https://github.com 并登录
2. 点右上角的 **`+`** 号 → **New repository**
3. 填写：
   - **Repository name**：`anime-sedai`（或你喜欢的名字）
   - **Description**：可留空
   - **Public** ← **必须选公开**，私有仓库的 Pages 要付费
   - **不要**勾选 `Add a README file`、`Add .gitignore`、`Choose a license`
     （本地项目里已经有了，勾了会导致后面推送冲突）
4. 点 **Create repository**

创建完会看到一个空仓库页面，上面写着「…or push an existing repository from the command line」，
那就是下一步要用的地址。

---

## 3. 告诉 Git 你是谁

只需做一次。在终端里执行（把引号里换成你自己的）：

```bash
git config --global user.name "你的名字"
git config --global user.email "你的邮箱@example.com"
```

这里的名字和邮箱只是**提交记录的署名**，不要求跟 GitHub 账号一致，但建议用同一个邮箱。

---

## 4. 在本地提交代码

```bash
cd "D:\DSH\37. anime-sedai 本地复刻"

git init
git add .
git commit -m "动画世代本地修改版"
git branch -M main
```

逐条解释：

| 命令 | 作用 |
|---|---|
| `cd ...` | 进入项目目录（**路径含空格，引号不能省**） |
| `git init` | 把这个目录变成 Git 仓库，会生成隐藏的 `.git` 文件夹 |
| `git add .` | 把当前所有文件加入待提交列表（`node_modules` 和 `dist` 已被 `.gitignore` 排除） |
| `git commit -m "..."` | 生成一次提交记录 |
| `git branch -M main` | 把分支名改成 `main`（GitHub 的默认分支名） |

> **如果 `git commit` 报错说需要先配置身份**，说明第 3 步没做成功，回去补上。

---

## 5. 推送到 GitHub

### 5.1 关联远程仓库

在 GitHub 那个空仓库页面上复制 HTTPS 地址，形如
`https://github.com/<你的用户名>/anime-sedai.git`，然后：

```bash
git remote add origin https://github.com/<你的用户名>/anime-sedai.git
```

### 5.2 创建访问令牌（Personal Access Token）

**GitHub 从 2021 年起不再允许用账号密码推送**，必须用令牌代替密码。

1. 打开 https://github.com/settings/tokens
2. 点 **Generate new token** → **Generate new token (classic)**
3. 填写：
   - **Note**：`push anime-sedai`（随便写，只是备注）
   - **Expiration**：选 `90 days`（到期后重新生成一个即可）
   - **Scopes**：只勾 **`repo`** 这一项（它下面的子项会自动勾上）
4. 拉到底点 **Generate token**
5. **立刻复制那串 `ghp_` 开头的字符**——页面关掉后就再也看不到了

### 5.3 推送

```bash
git push -u origin main
```

会弹出验证提示：

- **Username**：填你的 GitHub 用户名
- **Password**：**粘贴刚才那个令牌**（不是账号密码；粘贴时屏幕不显示任何字符，是正常的）

看到类似 `branch 'main' set up to track 'origin/main'` 就是成功了。

---

## 6. 开启 GitHub Pages

1. 回到仓库页面 → 点 **Settings**（顶部菜单栏）
2. 左侧栏找到 **Pages**
3. **Source** 这一项选 **GitHub Actions**（不是 "Deploy from a branch"）
4. 不用点保存，选完即生效

---

## 7. 等部署完成并访问

1. 点仓库顶部的 **Actions** 标签
2. 应该能看到一个叫 **Deploy to GitHub Pages** 的任务正在跑（黄色圆点）
3. 等 1～2 分钟，变成绿色对勾就是成功了
4. 回到 **Settings → Pages**，顶部会出现绿色提示框，里面就是你的网址

最终地址：`https://<你的用户名>.github.io/anime-sedai/`

---

## 8. 以后怎么更新内容

改了代码之后，只要三条命令：

```bash
cd "D:\DSH\37. anime-sedai 本地复刻"
git add .
git commit -m "更新说明"
git push
```

推送后 Actions 会自动重新构建部署，一分钟左右生效。

---

## 常见问题

**Q：Actions 里那个任务跑失败了，红叉怎么办？**
点进去看日志。最常见的原因是 `npm ci` 失败（`package-lock.json` 没提交上去），
或者是 `tsconfig.json` 里引用了不存在的文件。把报错发我，我看一眼就知道。

**Q：推送时提示 `remote origin already exists`**
说明之前加过，改用：
```bash
git remote set-url origin https://github.com/<用户名>/<仓库名>.git
```

**Q：网页打开是 404**
- 检查是不是刚部署完，再等一分钟
- 检查仓库 Settings → Pages 里 Source 是否真的是 **GitHub Actions**
- 检查 Actions 任务是否真的绿了

**Q：页面出来了但样式全丢、一片白**
这是 `base` 路径没对上。本项目已处理（工作流会自动注入 `VITE_BASE`），
如果你手动改过 `vite.config.ts`，把它恢复成 `base: process.env.VITE_BASE || "/"`。

**Q：国内打开很慢或者打不开**
`*.github.io` 在国内访问不稳定，这是网络环境问题，不是配置问题。
换 Cloudflare Pages 或 Vercel 会好一些，代码不用动，只要在那边"导入 GitHub 仓库"即可。

**Q：想用自己的域名**
在仓库 Settings → Pages → Custom domain 里填你的域名，
然后到域名服务商那边加一条 CNAME 记录指向 `<你的用户名>.github.io`。
GitHub 会自动签发 HTTPS 证书，但证书生效可能要几分钟到几小时。
