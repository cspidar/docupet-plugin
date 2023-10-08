const fs = require("fs");
const path = require("path");
const visit = require("unist-util-visit_2.0.3");

const editor = () => {
  return (tree, file) => {
    // 파일 경로와 이름 추출
    const filePath = file.history[0];
    const fileName = path.basename(filePath).split(".").slice(0, -1).join("."); // 확장자 제거

    // 프로젝트 폴더 이후의 폴더 구조만 추출
    const projectFolder = path.resolve(__dirname); // 현재 디렉토리를 프로젝트 폴더로 가정
    const relativeDir = path.relative(projectFolder, path.dirname(filePath));

    // <a id -> {#ID}로 변경
    visit(tree, "heading", (node) => {
      node.children.forEach((child, index) => {
        if (child.type === "jsx") {
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

    // "z-data" 폴더가 없으면 생성
    const zDataDir = path.join(projectFolder, "z-data");
    if (!fs.existsSync(zDataDir)) {
      fs.mkdirSync(zDataDir);
    }

    // z-data 폴더 내에 프로젝트 폴더 이후의 폴더 구조 반영
    // TODO: 문서 폴더 구조 동기화(삭제된 폴더/파일 반영)
    const targetDir = path.join(zDataDir, relativeDir);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // JSON 파일로 저장
    // TODO: 필요없는 항목(position, end, indent) 제외 처리
    const jsonPath = path.join(targetDir, `${fileName}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(tree, null, 2));
  };
};

module.exports = { editor };
