---
layout: post
title: "PDF Widget Test"
author: "Yonghwan Kwon"
tags: [Blog, Test, PDF]
comments: true
excerpt_separator: ---
---

This post is a temporary test page for the PDF viewer component used in this blog.

---

## PDF Viewer Test

아래 PDF는 `assets/docs/gpt-6-astra-gen.pdf` 파일을 블로그 내부에 직접 임베드한 테스트입니다.

{% include pdf.html
   url="/assets/docs/gpt-6-astra-gen.pdf"
   title="gpt-6-astra-gen.pdf"
   caption="Embedded PDF viewer test."
   id="pdf-astra-gen"
%}

## Direct Link Test

PDF를 별도 탭에서 직접 열 수도 있습니다.

[Open gpt-6-astra-gen.pdf](/assets/docs/gpt-6-astra-gen.pdf){:target="_blank"}