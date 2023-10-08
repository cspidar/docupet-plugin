import React, { useState, useEffect } from "react";
import { CONTINUE, EXIT, SKIP, visit } from "unist-util-visit";
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

  useEffect(() => {
    if (tree) {
      let currentIndex = null;
      let currentDepth = null;
      let nextIndex = null;
      let collectedItems = [];
      let shouldFindNext = false;

      visit(tree, "heading", (node, index, parent) => {
        // 다음 제목 인덱스를 찾고 방문 종료
        if (shouldFindNext && node.depth <= currentDepth) {
          nextIndex = index;
          shouldFindNext = false;
          return EXIT;
        }

        if (
          node.children.some((child) =>
            child.value.trim().includes(`{#${pathId}}`),
          )
        ) {
          currentIndex = index;
          currentDepth = node.depth;
          shouldFindNext = true; // 다음 노드를 찾기 위한 플래그를 설정합니다.
        }
      });

      if (currentIndex !== null && nextIndex !== null) {
        collectedItems = tree.children.slice(currentIndex, nextIndex);
      } else if (currentIndex !== null) {
        // nextIndex가 null인 경우, 문서의 끝까지 수집합니다.
        collectedItems = tree.children.slice(currentIndex);
      }

      console.log("Current Index:", currentIndex);
      console.log("Next Index:", nextIndex);

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
  // TODO: Copy 한 문서 헤딩 RNB 노출?
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
