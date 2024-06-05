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
          <% } %>
        `
    const extraJs = `
        <% if (process.env.VUE_APP_ENV =='testing' || htmlWebpackPlugin.options.env =='test') { %>
          <script>
          var button = document.getElementById("draggable-button")
          let isDragging = false
          let isMoved = false
          let offsetX = 0
          let offsetY = 0
          let isTouchDevice =
            "ontouchstart" in window ||
            navigator.maxTouchPoints > 0 ||
            navigator.msMaxTouchPoints > 0
          button.addEventListener("click", function (e) {
            if (isMoved) {
              e.preventDefault()
              isMoved = false
            } else {
              console.log("上传测试报告", window.__coverage__)
              let str = Object.keys(window.__coverage__)[0]
              let filePath = str.slice(0, str.indexOf("workspace") + 10).trim()
              let uuid = new Date().getTime()
              let newObjStr = JSON.stringify(window.__coverage__).replace(
                new RegExp(filePath, "g"),
                "/font/release/" + uuid + "/"
              )
              var commitHash = "<%= htmlWebpackPlugin.options.commitHash %>"
              let projectName = "<%= htmlWebpackPlugin.options.projectName %>"
              let gitUrl = "<%= htmlWebpackPlugin.options.gitUrl %>"
              let reqUrl =
                "https://g-gateway.tope365.com/tope-jacoco/cov/upload/vue?ocProjectId=1&ocProjectName=" +
                projectName +
                "&serviceName=" +
                projectName +
                "&serviceType=font&gitUrl=" +
                gitUrl +
                "&gitCommitId=" +
                commitHash +
                "&uuid=" +
                uuid
              const fileBlob = new Blob([newObjStr], { type: "text/plain" })
              const formData = new FormData()
              formData.append("file", fileBlob, "out.txt")
              fetch(reqUrl, {
                method: "POST",
                body: formData
              })
                .then((response) => response.json())
                .then((data) => {
                  console.log("Success:", data)
                })
                .catch((error) => {
                  console.error("Error:", error)
                })
            }
          })
          button.addEventListener(
            isTouchDevice ? "touchstart" : "mousedown",
            function (e) {
              const rect = button.getBoundingClientRect()
              offsetX = isTouchDevice
                ? e.touches[0].clientX - rect.left
                : e.clientX - rect.left
              offsetY = isTouchDevice
                ? e.touches[0].clientY - rect.top
                : e.clientY - rect.top
              isDragging = true
            }
          )

          document.addEventListener(
            isTouchDevice ? "touchmove" : "mousemove",
            function (e) {
              if (isDragging) {
                button.style.left =
                  (isTouchDevice ? e.touches[0].clientX : e.clientX) - offsetX + "px"
                button.style.top =
                  (isTouchDevice ? e.touches[0].clientY : e.clientY) - offsetY + "px"
                isMoved = true
              }
            }
          )

          document.addEventListener(
            isTouchDevice ? "touchend" : "mouseup",
            function (e) {
              isDragging = false
            }
          )

          // Double tap to toggle visibility
          let lastTap = 0
          button.addEventListener(
            isTouchDevice ? "touchend" : "mouseup",
            function (e) {
              const currentTime = new Date().getTime()
              const tapLength = currentTime - lastTap
              if (tapLength < 500 && tapLength > 0) {
                button.style.display =
                  button.style.display === "none" ? "block" : "none"
              }
              lastTap = currentTime
            }
          )
          </script>
          <% } %>
        `
    const extraStyle = `
        <% if (process.env.VUE_APP_ENV =='testing' || htmlWebpackPlugin.options.env =='test') { %>
          <style>
            #draggable-button {
              position: fixed;
              top: 20px;
              right: 20px;
              padding: 5px;
              width: 120px;
              text-align: center;
              line-height: 28px;
              background-color: #409eff;
              color: #fff;
              border: none;
              border-radius: 5px;
              position: fixed;
              cursor: pointer;
              z-index: 1000;
              font-size: 16px;
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
