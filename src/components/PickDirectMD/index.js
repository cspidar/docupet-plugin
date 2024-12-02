import React, { useState } from "react";
import { visit } from "unist-util-visit";

// 직접 md 파일 파싱이 안되는 이유와 구현 방법

/**
도큐사우루스의 useDoc() 은 현재 랜더링된 페이지 요소만 반환하는데, 프로젝트의 특정 경로에 있는 문서 파일을 읽어와서 반환하는 메서드 존재 여부

Docusaurus에서 특정 경로에 있는 문서 파일을 읽어와서 반환하는 기능은 기본적으로 제공되지 않습니다. `useDoc()` 훅은 현재 페이지와 관련된 문서 데이터를 반환하는 데 사용됩니다. 그러나 프로젝트의 특정 경로에 있는 문서 파일을 읽어와서 반환하는 것은 Docusaurus의 기본적인 사용 범위를 벗어나며, 커스텀 솔루션을 만들어야 합니다.

### 커스텀 솔루션

Docusaurus에서 특정 경로에 있는 Markdown 파일을 동적으로 읽어와서 처리하려면, 다음과 같은 방법으로 커스텀 솔루션을 구현할 수 있습니다:

1. **Node.js와 File System 모듈 사용**
2. **MDX 처리**
3. **React 컴포넌트에 전달**

#### 1. Node.js와 File System 모듈 사용

Node.js의 `fs` 모듈을 사용하여 파일 시스템에서 Markdown 파일을 읽어옵니다. 이 작업은 서버 측에서 수행되어야 합니다.

#### 2. MDX 처리

읽어온 Markdown 파일을 MDX로 처리하여 React 컴포넌트로 변환합니다. `@mdx-js/mdx` 패키지를 사용하여 이 작업을 수행할 수 있습니다.

#### 3. React 컴포넌트에 전달

변환된 React 컴포넌트를 Docusaurus 페이지 또는 컴포넌트에 전달하여 렌더링합니다.

### 예제 코드

다음은 Node.js 서버에서 파일을 읽고 MDX로 변환하여 React 컴포넌트로 렌더링하는 예제입니다.

#### 1. 필요한 패키지 설치

먼저 필요한 패키지를 설치합니다:

```bash
npm install @mdx-js/mdx @mdx-js/react fs
```

#### 2. MDX 처리 함수 작성

Node.js에서 파일을 읽고 MDX로 변환하는 함수를 작성합니다.

```javascript
// mdxLoader.js
const fs = require('fs');
const path = require('path');
const mdx = require('@mdx-js/mdx');
const { mdx: createMdxElement } = require('@mdx-js/react');

const loadMdxFile = async (filePath) => {
  const absolutePath = path.resolve(filePath);
  const fileContent = fs.readFileSync(absolutePath, 'utf-8');
  const jsxContent = await mdx(fileContent);
  return jsxContent;
};

module.exports = loadMdxFile;
```

#### 3. React 컴포넌트에서 사용

React 컴포넌트에서 이 함수를 호출하여 MDX 파일을 읽고 렌더링합니다.

```jsx
// src/components/CustomMarkdownRenderer.js
import React, { useEffect, useState } from 'react';
import loadMdxFile from '../../mdxLoader';
import { mdx } from '@mdx-js/react';

const CustomMarkdownRenderer = ({ filePath }) => {
  const [content, setContent] = useState(null);

  useEffect(() => {
    const fetchContent = async () => {
      const jsxContent = await loadMdxFile(filePath);
      setContent(jsxContent);
    };
    fetchContent();
  }, [filePath]);

  if (!content) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <MDXProvider>
        <div>{mdx(content)}</div>
      </MDXProvider>
    </div>
  );
};

export default CustomMarkdownRenderer;
```

#### 4. 페이지에서 사용

이제 커스텀 컴포넌트를 페이지에서 사용할 수 있습니다.

```jsx
// src/pages/custom-page.js
import React from 'react';
import CustomMarkdownRenderer from '../components/CustomMarkdownRenderer';

const CustomPage = () => {
  return (
    <div>
      <CustomMarkdownRenderer filePath="docs/my-markdown-file.md" />
    </div>
  );
};

export default CustomPage;
```

### 결론

Docusaurus는 기본적으로 특정 경로의 Markdown 파일을 동적으로 읽어오는 기능을 제공하지 않지만, Node.js의 `fs` 모듈과 `@mdx-js/mdx` 패키지를 사용하여 커스텀 솔루션을 구현할 수 있습니다. 이 접근 방식은 Markdown 파일을 읽고 MDX로 변환하여 React 컴포넌트로 렌더링하는 방법을 제시합니다. 이를 통해 Docusaurus 프로젝트에서 특정 경로의 문서 파일을 동적으로 읽어와서 사용할 수 있습니다.

*/

export default function PickDirectMD({ path, name, method, url }) {
  const [tree, setTree] = useState(null);
  const tableRows = [];

  // TODO: 문서 경로대로 json 파일 로드
  import(`/.docusaurus/content-sender/default/${path}.json`)
    // import(`/docs/${path}.md`)
    .then((module) => {
      setTree(module.default);
      // console.log(tree);
    })
    .catch((error) => {
      console.error("Failed to load JSON:", error);
    });

  if (tree) {
    //// "기본 정보" 이름이 포함된 제목 찾기
    visit(tree, "heading", (node, index, parent) => {
      node.children.forEach((child) => {
        if (child.type === "text" && /기본 정보\s*/.test(child.value)) {
          //// 위 노드 탐색 - API 이름
          let rowData = {};
          for (let i = index - 1; i >= 0; i--) {
            const prevNode = parent.children[i];
            if (prevNode.type === "heading") {
              const title = prevNode.children[0].value;
              // id 표기 제목에서 제거 ({#ID})
              rowData.name = title.replace(/ *{#.*?}/g, "");
              break;
            }
          }

          //// 아래 노드 탐색 - Method, URL
          for (let i = index + 1; i < parent.children.length; i++) {
            const nextNode = parent.children[i];
            // TODO: 검색 조건 강화 필요
            if (nextNode.type === "table") {
              // TODO: 하드코딩 개선
              rowData.method = nextNode.children[1].children[0].children[0].value;
              rowData.url = nextNode.children[1].children[1].children[0].value;
              break;
            }
          }

          //// prop에 따라 분기 처리(name, method, url)
          if ((name && rowData.name) || (method && rowData.method) || (url && rowData.url)) {
            // path 정보 포함해 고유 key 생성
            const uniqueKey = `${path}-${index}`;

            // 테이블 데이터 추가
            // TODO: 가독성 개선
            tableRows.push(
              <tr key={uniqueKey}>
                {name && <td>{name === "bold" ? <strong>{rowData.name}</strong> : rowData.name}</td>}
                {method && (
                  <td>
                    <code>{rowData.method}</code>
                  </td>
                )}
                {url && <td>{url === "code" ? <code>{rowData.url}</code> : rowData.url}</td>}
              </tr>,
            );
          }
        }
      });
    });
  }
  const tableHeader = (
    <tr>
      {name && <th>API</th>}
      {method && <th>Method</th>}
      {url && <th>URL</th>}
    </tr>
  );

  return (
    <table>
      <thead>{tableHeader}</thead>
      <tbody>{tableRows}</tbody>
    </table>
  );
}
