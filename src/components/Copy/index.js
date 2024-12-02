/**
TODO: 없는 URL일 경우 에러 처리
*/

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
        // id 해당 제목과 같거나 상위 레벨을 가진 다음 제목의 인덱스 확인 후 순회 종료
        if (shouldFindNext && node.depth <= currentDepth) {
          nextIndex = index;
          shouldFindNext = false;
          return EXIT;
        }

        // Copy할 id 해당 제목 검색
        if (
          node.children.some((child) =>
            child.value.trim().includes(`{#${pathId}}`),
          )
        ) {
          currentIndex = index;
          currentDepth = node.depth;
          shouldFindNext = true;
        }
      });

      // id에 해당하는 인덱스부터 다음 제목 인덱스까지의 노드를 Copy하기 위해 저장
      if (currentIndex !== null && nextIndex !== null) {
        collectedItems = tree.children.slice(currentIndex, nextIndex);
      } else if (currentIndex !== null) {
        // nextIndex가 null인 경우, 문서 끝까지 수집
        collectedItems = tree.children.slice(currentIndex);
      }

      //// 전처리 종료, 후처리 시작

      // 수집한 문서를 HAST로 변환
      const hast = toHast(
        {
          type: "root",
          children: collectedItems,
        },
        { allowDangerousHtml: true }, // br 태그 유지하기 위한 html 보존 옵션
      );

      // 수집한 문서의 HAST를 HTML 변환
      const rawHtml = toHtml(hast, { allowDangerousHtml: true }); // br 태그 유지하기 위한 html 보존 옵션

      // 도큐사우루스 복사 앵커 지원을 위한 클래스, 태그 추가
      // TODO: 제목 RNB 노출 구현?
      // TODO: 하드코딩 개선
      const headingRegex = new RegExp(
        `<(h[2-5])>\\s*(.*?)\\s*\\{\\#(.*?)\\}\\s*<\\/(h[2-5])>`,
        "g",
      );
      const html = rawHtml.replace(
        headingRegex,
        (match, hTag, title, id) =>
          `<${hTag} class="anchor anchorWithStickyNavbar_node_modules-@docusaurus-theme-classic-lib-theme-Heading-styles-module" id="${id.trim()}">${title.trim()}<a href="#${id.trim()}" class="hash-link" aria-label="Direct link to Copy" title="Direct link to Copy">​</a></${hTag}>`,
      );

      setHtml(html);
    }
  }, [tree]);

  // TODO: 이 컴포넌트에서 html return 위험 확인 필요
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
