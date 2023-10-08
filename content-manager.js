//
/**
- sender: 컴포넌트에서 사용할 데이터 저장, 일반 플러그인(라이프사이클 API 사용)
- editor: 문서화 전 소스 데이터 전처리, beforeDefaultRemarkPlugins 전달용 플러그인
  - beforeDefaultRemarkPlugins
    - 도큐사우루스 Remark 플러그인의 실행 순서 조정 또는 새로운 Remark 플러그인 추가
    - Docusaurus의 라이프사이클 API 사용 불가

TODO: sender에서 전체 문서를 별도 파싱하고 있음, DefaultRemarkPlugin에서 저장한 파싱 데이터는 컴포넌트에서 사용 불가, 해당 이슈 해결 시 플러그인 1개로 통합 가능

TODO: dynamic Import 사용으로 라이브러리 최신화
*/

const fs = require("fs");
const path = require("path");
const unified = require("unified_9.2.2");
const remarkParse = require("remark-parse_9.0.0");
const remarkMdx = require("remark-mdx_1.6.22");
const visit = require("unist-util-visit_2.0.3");

// 테이블 파싱을 위해 사용
const remarkGfm = require("remark-gfm_1.0.0");

// <a id -> {#ID}로 변경 함수
const syncId = (tree) => {
  visit(tree, "heading", (node) => {
    node.children.forEach((child, index) => {
      if (child.type === "jsx" || child.type === "html") {
        const regex = /\s*<a id="(.+?)">\s*/g;
        const match = regex.exec(child.value);
        if (match) {
          const idValue = match[1];
          // json 파일에 저장될 <a id> </a> 삭제
          node.children.splice(index, 2);
          node.children.push({
            type: "text",
            value: ` {#${idValue}}`,
          });
        }
      }
    });
  });
};

const sender = (context, options) => {
  return {
    name: "content-sender",
    async loadContent() {
      const docsDir = path.join(__dirname, "docs");
      const content = {};

      const readDir = (dir) => {
        const files = fs.readdirSync(dir);
        for (const file of files) {
          const filePath = path.join(dir, file);
          const stat = fs.statSync(filePath);
          if (stat.isDirectory()) {
            readDir(filePath);
          } else {
            const ext = path.extname(file);
            if (ext === ".md" || ext === ".mdx") {
              const doc = fs.readFileSync(filePath, "utf-8");
              const processor = unified().use(remarkParse).use(remarkGfm);
              if (ext === ".mdx") {
                processor.use(remarkMdx);
              }
              const tree = processor.parse(doc);
              content[filePath] = tree;
            }
          }
        }
      };

      readDir(docsDir);

      return content;
    },

    async contentLoaded({ content, actions }) {
      const { createData } = actions;

      for (const [filePath, tree] of Object.entries(content)) {
        const relativePath = path.relative(
          path.join(__dirname, "docs"),
          filePath,
        );
        const fileName = path
          .basename(filePath)
          .split(".")
          .slice(0, -1)
          .join(".");
        const jsonFileName = `${fileName}.json`;
        const targetDir = path.dirname(relativePath);

        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }

        // <a id -> {#ID}로 변경
        syncId(tree);

        await createData(
          path.join(targetDir, jsonFileName),
          JSON.stringify(tree),
        );
      }
    },
  };
};

const editor = () => {
  return (tree) => {
    // <a id -> {#ID}로 변경
    syncId(tree);
  };
};

module.exports = { sender, editor };
