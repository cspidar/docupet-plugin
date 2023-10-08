import React from "react";
import clsx from "clsx";
import styles from "./styles.module.css";

import { unified } from "unified";
import { visit } from "unist-util-visit";

import tree from "/.docusaurus/content-sender/default/k-mdx.json";

// TODO: Table 입력/출력 개선 방법을 찾고 적용한 뒤 코드 수정
// TODO: useEffect 사용 시 테이블 늦게 생성, 미사용 시 데이터 2번 가져오는 문제 수정
const tableRows = [];
export default function Doc({ children }) {
  const SKIP = visit.SKIP;
  const EXIT = visit.EXIT;

  let list = [];
  //// "기본 정보" 이름이 포함된 제목 찾기
  visit(tree, "heading", (node, index, parent) => {
    node.children.forEach((child) => {
      if (child.type === "text" && child.value.includes("기본 정보")) {
        // 현재 노드 정보 출력
        // console.log(`현재 노드: ${node.children[0].value}, 인덱스: ${index}`);

        //// 이전 노드 탐색 - API 이름
        for (let i = index - 1; i >= 0; i--) {
          const prevNode = parent.children[i];
          // TODO: 검색 조건 강화 필요
          if (prevNode.type === "heading") {
            // console.log(
            // `찾은 이전 노드: ${prevNode.type}, 값: ${prevNode.children[0].value}`);
            list.push(prevNode.children[0].value);
            break;
          }
        }

        //// 다음 노드 탐색 - Method, URL
        for (let i = index + 1; i < parent.children.length; i++) {
          const nextNode = parent.children[i];
          if (nextNode.type === "paragraph") {
            // console.log(
            // `찾은 다음 노드: ${nextNode.type}, 값: ${nextNode.children[3].value}`);
            list.push(nextNode.children[1].value, nextNode.children[3].value);
            break;
          }
        }
      }
    });
  });
  console.log(list);

  //// prop에 따라 리턴 분기 처리(name, method, url)
  list.forEach((item, index) => {
    if (index % 3 === 0) {
      tableRows.push(
        <tr key={index}>
          <td>{item}</td>
          <td>
            <code>{list[index + 1]}</code>
          </td>
          <td>{list[index + 2]}</td>
        </tr>
      );
    }
  });

  return (
    <>
      <table>
        <th>API</th>
        <th>Method</th>
        <th>URL</th>
        <tbody>{tableRows}</tbody>
      </table>
      <button>Hi</button>
      <div>{children}</div>
    </>
  );
}
