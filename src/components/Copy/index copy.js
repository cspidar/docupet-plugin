import React, { useState, useEffect } from "react";
import { visit } from "unist-util-visit";
import { toHast } from "mdast-util-to-hast";
import { toHtml } from "hast-util-to-html";

export default function Copy({ path }) {
  const [tree, setTree] = useState(null);
  const [html, setHtml] = useState(null);

  const [pathDoc, pathId] = path.split("#");

  useEffect(() => {
    import(`/.docusaurus/content-sender/default/${pathDoc}.json`)
      .then((module) => {
        setTree(module.default);
      })
      .catch((error) => {
        console.error("Failed to load JSON:", error);
      });
  }, [pathDoc, pathId]);

  //////////// 개선 필요: 다음 제목의 index 확인해서 그 사이의 모든 노드 추가하도록
  useEffect(() => {
    if (tree) {
      let currentDepth = null;
      let collectedItems = [];
      let shouldCollect = false;
      let nextDepthIndex = null;

      const allNodes = [];
      visit(tree, (node) => {
        allNodes.push(node);
      });
      for (let i = 0; i < allNodes.length; i++) {
        const node = allNodes[i];
        // 제목 검색
        if (node.type === "heading") {
          // 같거나 상위 제목 만나면 수집 중단
          if (shouldCollect && node.depth <= currentDepth) {
            shouldCollect = false;
            nextDepthIndex = i;
            break; // 다음 제목을 찾았으므로 루프 종료
          }
          // id 특정
          if (
            node.children.some((child) => child.value.includes(`{#${pathId}}`))
          ) {
            shouldCollect = true;
            currentDepth = node.depth;
          }
        }
        if (shouldCollect) {
          collectedItems.push(node);
        }
      }
      if (nextDepthIndex !== null) {
        collectedItems = allNodes.slice(collectedItems[0], nextDepthIndex);
      }
      //////////////

      const hast = toHast({ type: "root", children: collectedItems });
      // console.log(JSON.stringify(hast, null, 2));

      const processedHtml = toHtml(hast);
      // console.log(JSON.stringify(processedHtml));

      // id 변경 하드코딩.. ({}형태에서 <id 로)
      const headingRegex = new RegExp(
        `<(h[2-5])>\\s*(.*?)\\s*\\{\\#(.*?)\\}\\s*<\\/(h[2-5])>`,
        "g",
      );

      // 복사 앵커 지원 하드코딩..
      const modifiedHtmlString = processedHtml.replace(
        headingRegex,
        (match, hTag, title, id) =>
          `<${hTag} class="anchor anchorWithStickyNavbar_node_modules-@docusaurus-theme-classic-lib-theme-Heading-styles-module" id="${id.trim()}">${title.trim()}<a href="#${id.trim()}" class="hash-link" aria-label="Direct link to Copy" title="Direct link to Copy">​</a></${hTag}>`,
      );

      // console.log(modifiedHtmlString);

      setHtml(modifiedHtmlString);
    }
  }, [tree]);

  // Editor-TODO: 1. 인가 코드 받기 와 같은 형태의 html 지원, 이외에도 html 지원 준비 해야할듯
  // TODO: return html에 class와 id 넣어주는 작업 하드코딩 개선 필요
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
