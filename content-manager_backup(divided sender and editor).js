const fs = require("fs");
const path = require("path");
const unified = require("unified_9.2.2");
const remarkParse = require("remark-parse_9.0.0");
const remarkMdx = require("remark-mdx_1.6.22");

// editor에서 추가 사용
const visit = require("unist-util-visit_2.0.3");

const sender = (context, options) => {
  return {
    name: "content-sender",
    async loadContent() {
      // TODO: 문서 경로대로 json 저장 경로 지정
      const docsDir = path.join(__dirname, "docs");
      const files = fs.readdirSync(docsDir);
      const content = {};

      for (const file of files) {
        const filePath = path.join(docsDir, file);
        const ext = path.extname(file);

        //// 파일 파싱
        if (ext === ".md" || ext === ".mdx") {
          const doc = fs.readFileSync(filePath, "utf-8");
          const processor = unified().use(remarkParse);

          if (ext === ".mdx") {
            processor.use(remarkMdx);
          }

          const tree = processor.parse(doc);
          content[file] = tree;
        }
      }

      return content;
    },

    async contentLoaded({ content, actions }) {
      const { createData } = actions;

      //// 데이터 저장
      for (const [file, tree] of Object.entries(content)) {
        // TODO: 문서 경로대로 json 파일 저장
        const jsonFileName = `${path.basename(file, path.extname(file))}.json`;
        await createData(jsonFileName, JSON.stringify(tree));
      }
    },
  };
};

// TODO: editor 플러그인 구현
const editor = () => {
  return (tree) => {
    // <a id -> {#ID}로 변경
    visit(tree, "heading", (node) => {
      node.children.forEach((child, index) => {
        if (child.type === "jsx") {
          const regex = /\s*<a id="(.+?)">\s*/g;
          const match = regex.exec(child.value);
          if (match) {
            const idValue = match[1];

            // <a id="ABC">, </a> 삭제
            // TODO: 다음 노드가 </a>인 경우만 삭제로 분기
            node.children.splice(index, 2);
            // 제목에 {#ABC} 형태로 포함
            node.children.push({
              type: "text",
              value: ` {#${idValue}}`,
            });
          }
        }
      });
    });
  };
};

module.exports = { sender, editor };
