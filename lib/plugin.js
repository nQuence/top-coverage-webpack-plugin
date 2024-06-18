const fs = require('fs');
const path = require('path');

class CreateFilePlugin {
  constructor(options = {}) {
    this.options = options;
  }
  apply(compiler) {
    let version = this.options.version && this.options.version.toLowerCase() || 'v3'
    let env = this.options.env
    if (version == 'v3') {
      compiler.hooks.beforeRun.tapAsync('CreateFilePlugin', (compiler, callback) => {
				 // 生成相关文件复制到项目根目录
				 const toPath = path.join(compiler.options.context, 'index.html');
				 const curerntfilePath = path.join(__dirname, '../template/index.html');
				 fs.copyFile(curerntfilePath, toPath, (err) => {
					 if (err) throw err;
					 console.log(`${filePath} has been created.`);
				 });
        const filePath = path.join(compiler.options.context, 'babel.config.js');
        const content = 'const str = process.env.npm_lifecycle_script; \nconst startIndex = str.indexOf("--env") + 6;\nconst envValue = str.slice(startIndex).trim();\nmodule.exports = {\n  presets: [\'@babel/preset-env\'],\n  plugins: [\n (envValue === \'test\' || envValue === \'qa\') && [\n \'istanbul\',\n {\n extension: [\'.js\', \'.cjs\', \'.mjs\', \'.ts\', \'.tsx\', \'.jsx\', \'.vue\']\n }\n ]\n ].filter(Boolean)\n}\n\n'
        fs.writeFile(filePath, content, err => {
          if (err) throw err;
          console.log(`file has been created`);
					callback();
        })
      });
    } else if (version == 'v23') {
      console.log('version is v23')
      compiler.hooks.beforeRun.tapAsync('CreateFilePlugin', (compiler, callback) => {
          // 生成相关文件复制到项目根目录
        const filePathIndex = path.join(compiler.options.context, './src/public/index.html')
        let indexData = fs.readFileSync(filePathIndex, 'utf-8')
        let newContent2 = this.insertCode(indexData)
        // 判断代码是否已插入
        if (indexData.includes('id="draggable-button"')) {
          console.log('代码已插入')
        } else {
          fs.writeFileSync(filePathIndex, newContent2, 'utf-8');
        }
        const filePath = path.join(compiler.options.context, 'babel.config.js');
        const content = 'const str = process.env.npm_lifecycle_script; \nconst startIndex = str.indexOf("--env") + 6;\nconst envValue = str.slice(startIndex).trim();\nmodule.exports = {\n  presets: [\'@babel/preset-env\'],\n  plugins: [\n (envValue === \'test\' || envValue === \'qa\') && [\n \'istanbul\',\n {\n extension: [\'.js\', \'.cjs\', \'.mjs\', \'.ts\', \'.tsx\', \'.jsx\', \'.vue\']\n }\n ]\n ].filter(Boolean)\n}\n\n'
        fs.writeFile(filePath, content, err => {
          if (err) throw err;
          console.log(`file has been created`);
          callback();
        })
      });
    } else {
      console.log('version is v2')
      if (env != 'testing') return
      console.log('env is testing')
      compiler.hooks.beforeRun.tapAsync('CreateFilePlugin', (compiler, callback) => {
        const filePath = path.join(compiler.options.context, './public/index.html')
        let indexData = fs.readFileSync(filePath, 'utf-8')
        let newContent2 = this.insertCode(indexData)
        // 判断代码是否已插入
        if (indexData.includes('id="draggable-button"')) {
          console.log('代码已插入')
        } else {
          fs.writeFileSync(filePath, newContent2, 'utf-8');
        }
        const babelFilePath = path.join(compiler.options.context, 'babel.config.js');
        // 在文件的结尾插入代码
        const extraCodeBabel = `
if (process.env.VUE_APP_ENV === "testing") {
  plugins.push([
    "istanbul",
    {
      extension: [".js", ".cjs", ".mjs", ".ts", ".tsx", ".jsx", ".vue"],
    },
  ]);
}
`
        let data = fs.readFileSync(babelFilePath, 'utf-8')
        if (data.includes('istanbul')) {
          console.log('babel代码已插入')
          callback()
          return
        } else {
          const newContentBabel = data + extraCodeBabel
          fs.writeFileSync(babelFilePath, newContentBabel, 'utf-8');
          callback()
        }
      })
    }
  }
  insertCode(indexData) {
    const extraCode = `
          <% if (process.env.VUE_APP_ENV =='testing' || htmlWebpackPlugin.options.env =='test') { %>
            <div id="draggable-button">上传测试报告</div>
            <div id="overlay"></div>
            <div id="modal">
              <div>请选择上传：</div>
              <div class="btns">
                <button id="upload-incremental">增量报告</button>
                <button id="upload-test">全量报告</button>
              </div>
            </div>
          <% } %>
        `
    const extraJs = `
      <% if (process.env.VUE_APP_ENV =='testing' || htmlWebpackPlugin.options.env =='test') { %>
      <script>
        var button = document.getElementById("draggable-button");
        var modal = document.getElementById("modal");
        var overlay = document.getElementById("overlay");
        var uploadIncrementalBtn = document.getElementById("upload-incremental");
        var uploadTestBtn = document.getElementById("upload-test");
        let isDragging = false;
        let offsetX = 0;
        let offsetY = 0;
        let initialX, initialY;
        let isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;
        button.addEventListener("click", function (e) {
          if (isDragging) {
            e.preventDefault();
            isDragging = false;
          } else {
            if (!isDragging) {
              overlay.style.display = "block";
              modal.style.display = "block";
            }
          }
        });
        button.addEventListener(isTouchDevice ? "touchstart" : "mousedown", function (e) {
          const rect = button.getBoundingClientRect();
          offsetX = isTouchDevice ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
          offsetY = isTouchDevice ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
          initialX = rect.left;
          initialY = rect.top;
          isDragging = true;
        });

        document.addEventListener(isTouchDevice ? "touchmove" : "mousemove", function (e) {
          if (!isDragging) return;
          e.preventDefault(); // 阻止默认的触摸事件
          const clientX = isTouchDevice ? e.touches[0].clientX : e.clientX;
          const clientY = isTouchDevice ? e.touches[0].clientY : e.clientY;
          // 计算新位置
          let newX = clientX - offsetX;
          let newY = clientY - offsetY;
          // 获取屏幕宽度和高度
          const screenWidth = window.innerWidth;
          const screenHeight = window.innerHeight;
          // 获取按钮宽度和高度
          const buttonWidth = button.offsetWidth;
          const buttonHeight = button.offsetHeight;
          // 限制新位置在屏幕边界内
          newX = Math.max(0, Math.min(newX, screenWidth - buttonWidth));
          newY = Math.max(0, Math.min(newY, screenHeight - buttonHeight));
          // 使用 requestAnimationFrame 确保动画的流畅性
          requestAnimationFrame(() => {
            button.style.left = newX + "px";
            button.style.top = newY + "px";
          });
        });
        document.addEventListener(isTouchDevice ? "touchend" : "mouseup", function () {
          isDragging = false;
        });
        overlay.addEventListener("click", function () {
          overlay.style.display = "none";
          modal.style.display = "none";
        });
        uploadIncrementalBtn.addEventListener("click", function () {
          overlay.style.display = "none";
          modal.style.display = "none";
          let uuid = new Date().getTime();
          uploadReport(2, uuid);
        });
        uploadTestBtn.addEventListener("click", function () {
          overlay.style.display = "none";
          modal.style.display = "none";
          let uuid = new Date().getTime();
          uploadReport(1, uuid);
        });
        async function uploadReport(type, uuid) {
          let newObjStr = await getIncrementData(type, uuid);
          // 本地json逻辑处理
          /*  let obj = JSON.parse(newObjStr)
          let str = Object.keys(obj)[0]
          console.log(str) */
          var commitHash = "<%= htmlWebpackPlugin.options.commitHash %>";
          let projectName = "<%= htmlWebpackPlugin.options.projectName %>";
          let gitUrl = "<%= htmlWebpackPlugin.options.gitUrl %>";
          let apiUrl = "<%= htmlWebpackPlugin.options.apiUrl %>";
          let reqUrl = apiUrl + "/tope-jacoco/cov/upload/vue?ocProjectId=1&ocProjectName=" + projectName + "&serviceName=" + projectName + "&serviceType=font&gitUrl=" + gitUrl + "&gitCommitId=" + commitHash + "&uuid=" + uuid + "&type=" + type;
          const fileBlob = new Blob([newObjStr], { type: "text/plain" });
          const formData = new FormData();
          formData.append("file", fileBlob, "out.txt");
          fetch(reqUrl, {
            method: "POST",
            body: formData,
          })
            .then((response) => response.json())
            .then((data) => {
              alert("上传成功");
              console.log("Success:", data);
            })
            .catch((error) => {
              alert("上传失败");
              console.error("Error:", error);
            });
        }
        async function getIncrementData(type, uuid) {
          let str = Object.keys(window.__coverage__)[0];
          let filePath = str.slice(0, str.indexOf("workspace") + 10).trim();
          let newObjStr = JSON.stringify(window.__coverage__).replace(new RegExp(filePath, "g"), "/font/release/" + uuid + "/");
          console.log("测试覆盖率", JSON.parse(newObjStr));
          if (type == 1) {
            return newObjStr;
          } else {
            const accessToken = "<%= htmlWebpackPlugin.options.accessToken %>";
            const gitlabUrl = "<%= htmlWebpackPlugin.options.gitlabUrl %>";
            // 目标分支正常都是master
            const branchName = "<%= htmlWebpackPlugin.options.branchName %>" || "master";
            const projectId = "<%= htmlWebpackPlugin.options.projectId %>";
            const apiUrl = gitlabUrl + "/api/v4/projects/" + encodeURIComponent(projectId) + "/repository/branches/" + branchName;
            // 目标分支commitId
            let commitIdMaster = "";
            // 当前代码的commitId
            let commitId2 = "<%= htmlWebpackPlugin.options.commitHash %>";
            const headers = {
              "PRIVATE-TOKEN": accessToken,
            };
            const outJson = JSON.parse(newObjStr);
            async function getCommitId() {
              try {
                // 发送 GET 请求获取目标分支的 commit ID
                let response = await fetch(apiUrl, { headers: headers });
                if (!response.ok) {
                  throw new Error("HTTP error! status: " + response.status);
                }
                let data = await response.json();
                commitIdMaster = data.commit.id;
                // 获取改变的文件列表
                let apiUrl2 = gitlabUrl + "/api/v4/projects/" + encodeURIComponent(projectId) + "/repository/compare?from=" + commitIdMaster + "&to=" + commitId2;
                response = await fetch(apiUrl2, { headers: headers });
                if (!response.ok) {
                  throw new Error("HTTP error! status:" + response.status);
                }
                data = await response.json();
                let list1 = data.diffs.map((item) => item.new_path);
                // 获取覆盖率文件列表
                const keys = Object.keys(outJson);
                let list2 = keys.map((item) => {
                  // 本地
                  item = item.replace(/\\/g, "/");
                  const parts = item.split("src/");
                  const result = parts.length > 1 ? "src/" + parts[1] : "";
                  return result;
                });
                // 找出 list1 和 list2 公用的元素
                let list3 = list1.filter((item) => list2.includes(item));
                // 根据 list3 过滤 outJson 对象的 key
                let result = {};
                list3.forEach((item) => {
                  // 本地
                  item = item.replace(/\//g, "\\");
                  for (let key in outJson) {
                    if (key.includes(item)) {
                      result[key] = outJson[key];
                    }
                  }
                });
                console.log("result", JSON.stringify(result));
                return JSON.stringify(result);
              } catch (error) {
                console.error("Error:", error);
              }
            }
            return await getCommitId();
          }
        }
          <% } %>
        `
    const extraStyle = `
        <% if (process.env.VUE_APP_ENV =='testing' || htmlWebpackPlugin.options.env =='test') { %>
          <style id="mainStyle">
            #draggable-button {
              position: fixed;
              top: 10px;
              right: 10px;
              padding: 2px;
              width: 120px;
              text-align: center;
              line-height: 28px;
              background-color: #07c160;
              color: #fff;
              border: none;
              border-radius: 5px;
              cursor: pointer;
              z-index: 1000;
              font-size: 16px;
              touch-action: none; /* 禁用默认的触摸操作 */
            }
            #modal {
              display: none;
              position: fixed;
              top: 40%;
              left: 50%;
              transform: translate(-50%, -50%);
              background-color: white;
              padding: 10px 20px 20px 20px;
              box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
              z-index: 1001;
              border-radius: 10px;
            }
            #modal div {
              padding: 10px 0px;
            }
            #modal button {
              display: inline-block;
              margin: 0px;
              padding: 5px 10px;
              margin-left: 0px;
              font-size: 16px;
              cursor: pointer;
              color: #fff;
              background-color: #07c160;
              border: none;
              border-radius: 5px;
            }
            #overlay {
              display: none;
              position: fixed;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              background: rgba(0, 0, 0, 0.5);
              z-index: 1000;
            }
            .btns {
              width: 180px;
              padding: 10px 20px;
              display: flex;
              flex-direction: row;
              justify-content: space-between;
            }
            </style>
          <% } %>
        `
    // 寻找 </body> 结束标签前面加入额外代码
    const bodyTagIndex = indexData.indexOf('</body>');
    const newContent = indexData.slice(0, bodyTagIndex) + extraCode + indexData.slice(bodyTagIndex);
    // 在</head>标签前面插入代码
    const headTagIndex = newContent.indexOf('</head>');
    const newContent1 = newContent.slice(0, headTagIndex) + extraStyle + newContent.slice(headTagIndex);
    // 在</body>标签前面插入代码
    const bodyEndTagIndex = newContent1.indexOf('</body>');
    const newContent2 = newContent1.slice(0, bodyEndTagIndex) + extraJs + newContent1.slice(bodyEndTagIndex);
    return newContent2
  }
}
module.exports = CreateFilePlugin;
