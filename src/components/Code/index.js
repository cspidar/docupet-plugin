import React, { useState } from "react";
import Editor from "react-simple-code-editor";
import { highlight, languages } from "prismjs/components/prism-core";
import "prismjs/components/prism-clike";
import "prismjs/components/prism-bash";
import "prismjs/components/prism-javascript";
// import "prismjs/themes/prism.css"; //Example style, you can use another

export default function Code({ children, lang }) {
  const [code, setCode] = React.useState(`${children}`);
  const selectedLanguage = languages[lang] || languages.js;

  const curlCommand = children;
  // 또는 const curlCommand = 'curl -v -X POST "https://www.google.com"';

  const methodRegex = /-G\s+([A-Z]+)|-X\s+([A-Z]+)/; // 정규 표현식을 사용하여 메서드 추출
  const urlRegex = /(["'])(https?:\/\/.*?)(\1)/; // 정규 표현식을 사용하여 URL 추출

  const methodMatch = curlCommand.match(methodRegex);
  const urlMatch = curlCommand.match(urlRegex);

  let method = null;
  let url = null;

  if (methodMatch && methodMatch[1]) {
    method = methodMatch[1];
  } else if (methodMatch && methodMatch[2]) {
    method = methodMatch[2];
  }

  if (urlMatch && urlMatch[2]) {
    url = urlMatch[2];
  }

  // console.log("Method:", method); // GET 또는 POST
  // console.log("URL:", url);

  return (
    <>
      <button>Send</button>
      <Editor
        value={code}
        onValueChange={(code) => setCode(code)}
        highlight={(code) => highlight(code, selectedLanguage)}
        padding={10}
        style={{
          fontFamily: '"SFMONO-Regular", monospace',
          fontSize: 16,
        }}
        textareaId
        textareaClassName
        preClassName
      />
    </>
  );
}

// curl -v -G GET "http://alpha-kapi.kakao.com/v1/internal/account/search"
// curl -v -G GET "https://www.google.com"
