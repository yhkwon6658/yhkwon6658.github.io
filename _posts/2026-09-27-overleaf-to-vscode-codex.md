---
layout: post
title: "Overleaf 대신 VS Code + Codex로 논문을 써봤다"
author: "Chat GPT"
tags: [LaTeX, VSCode, Research, AI, Codex]
comments: true
excerpt_separator: ---
---

대학원에 있을 때는 주로 **Overleaf 유료 버전과 GPT Web Chat**을 이용해서 논문을 작성했습니다.

그동안 Codex와 같은 Agent를 논문 작성에 적극적으로 사용하지 않았던 이유도 단순했습니다.  
논문 작성은 처음부터 끝까지 한 번에 작성하는 작업이라기보다는, 문장과 수식, Figure, notation을 계속 앞뒤로 오가며 조금씩 수정하는 작업에 가깝다고 생각했기 때문입니다.

그런데 오랜만에 일정이 맞아 논문을 한 편 작성하게 되었고, 이번에는 작업환경 자체를 조금 바꿔보기로 했습니다.

---

## 1. Overleaf 대신 WSL + VS Code

현재 개발 환경으로 WSL Ubuntu를 사용하고 있고, VS Code도 이미 연결해서 사용하고 있었습니다.

그렇다면 굳이 LaTeX만 Overleaf에서 작업할 필요가 있을까 하는 생각이 들었습니다.

{% include image.html
   url="/assets/image/writing_environment.png"
   text="Figure 1. WSL Ubuntu와 VS Code를 이용해 구성한 LaTeX 논문 작성 환경."
   id="fig1"
%}

[Figure 1](#fig1)과 같이 왼쪽에는 project tree, 가운데에는 `.tex` source, 오른쪽에는 compiled PDF를 배치해두었습니다.

기존에 Overleaf에서 IEEE conference format에 맞춰 작성했던 `.tex` 파일을 그대로 가져와 동일한 환경에서 compile해 보았는데, 결과물은 Overleaf에서 얻었던 것과 동일했습니다.

오히려 실제 사용감은 로컬 환경이 더 좋았습니다.

가장 체감이 컸던 부분은 compile 속도였습니다.  
`.tex` 파일을 저장할 때마다 자동으로 compile하도록 설정해두니, 수정 결과를 확인하는 과정이 Overleaf보다 훨씬 빠르게 느껴졌습니다.

VS Code의 여러 extension을 사용할 수 있다는 점도 생각보다 편했습니다. Syntax highlighting이나 source navigation 같은 기본적인 편의 기능만으로도 `.tex` 파일의 가독성이 꽤 좋아졌습니다.

사용해보고 나니 오히려,

> 진작 이렇게 쓸 걸 그랬다.

는 생각이 들 정도였습니다.

## 2. 협업도 오히려 Git이 편하지 않을까?

로컬 LaTeX 환경을 이야기하면 가장 먼저 나오는 이야기가 아마 협업일 것 같습니다.

물론 Overleaf의 real-time collaboration은 편리합니다.

하지만 개발이나 연구를 어느 정도 하는 사람이라면 요즘 Git을 사용하는 것 자체가 특별한 일은 아닙니다.

논문 source도 결국 text file의 집합이기 때문에 Git을 이용하면

- commit 단위의 변경 이력 관리
- branch를 이용한 실험
- 특정 revision으로의 rollback
- 공동 저자 간 source 공유
- Figure 및 script와 manuscript의 통합 관리

같은 작업을 자연스럽게 할 수 있습니다.

오히려 연구 코드, Figure source, manuscript를 하나의 repository 안에서 관리할 수 있다는 점에서는 이 방식이 더 마음에 들었습니다.

예전에는 LaTeX 환경이 사람마다 달라서 생기는 문제도 귀찮은 부분이었지만, 요즘은 상황이 조금 다릅니다.

빌드가 깨지면 error log를 그대로 AI에게 보여주면 대부분의 환경 문제는 상당히 빠르게 해결할 수 있습니다.

덕분에 로컬 LaTeX 환경을 구성하는 진입 장벽 자체가 예전보다 훨씬 낮아졌다는 생각이 들었습니다.

## 3. 그런데 Codex까지 이미 설치되어 있다

여기까지 구성하고 나니 한 가지 궁금증이 생겼습니다.

어차피 LaTeX build environment가 Ubuntu 안에 있고, Codex 역시 같은 환경에 설치되어 있습니다.

그렇다면 Agent에게 manuscript부터 Figure, bibliography, compile까지 전부 맡기면 어느 정도까지 할 수 있을까?

기존에는 AI와 논문을 작성할 때 Web Chat을 이용했습니다.

제가 문단을 작성하거나 수정 방향을 정하고, AI에게 문장을 다듬도록 한 다음 다시 `.tex`에 반영하는 방식입니다.

이번에는 반대로 조금 극단적인 실험을 해봤습니다.

**Specification만 주고 Agent가 논문을 처음부터 끝까지 one-way로 작성하게 해보는 것입니다.**

## 4. 가장 큰 문제는 Figure였다

Text와 LaTeX source는 Agent가 비교적 잘 다룰 것이라고 예상했습니다.

문제는 Figure였습니다.

테스트를 위해 Figure까지 제가 직접 그리고 싶지는 않았기 때문에, Draw.io를 이용해 Agent가 SVG를 직접 생성하도록 환경을 구성했습니다.

최종 산출물을 SVG로 정한 이유는 간단합니다.

SVG는 XML 기반의 text format이기 때문에 Agent가 직접 읽고 수정할 수 있습니다.  
따라서 단순히 이미지를 생성하는 것보다 layout, text, line, color 등의 요소를 반복적으로 수정하기 훨씬 좋습니다.

이 부분을 셋업하면서 여러 모델을 비교해보기도 했는데, Figure generation에서는 모델 간 차이가 상당히 크게 느껴졌습니다.

`luna`, `terra`, `sol`, `astra`를 차례로 사용해보면 상위 모델로 갈수록 결과물이 눈에 띄게 좋아졌습니다.

일반적인 coding이나 EDA tool automation은 환경만 제대로 구성해두면 `luna medium` 정도로도 충분한 경우가 많았습니다.

반면 Figure는 조금 달랐습니다.

단순히 명령을 정확히 수행하는 것뿐 아니라,

- 전체적인 layout
- element alignment
- information hierarchy
- color balance
- visual abstraction

같은 요소를 동시에 고려해야 하기 때문인지, Astra가 확실히 더 좋은 결과를 만들어냈습니다.

특히 text-based SVG를 충분히 높은 품질로 자동 생성할 수 있다는 점 자체는 꽤 흥미로웠습니다.

앞으로 논문 Figure를 만들 때도 대략적인 layout과 전달하고 싶은 message, color tone 정도만 specification으로 작성하고 Agent에게 초안을 만들도록 하는 방식은 충분히 사용할 만해 보입니다.

다만 **Architecture diagram은 아직 마음에 들지 않았습니다.**

제가 작성한 specification이 부족한 문제일 수도 있지만, block diagram이나 architecture figure 특유의 정돈된 layout을 자동으로 만드는 능력은 아직 사람이 직접 그리는 수준에는 미치지 못한다는 느낌을 받았습니다.

## 5. 그럼 논문 전체를 한 번 써보자

Figure generation 환경까지 만든 뒤에는 manuscript generation을 테스트했습니다.

주제는 일부러 비교적 명확한 것으로 정했습니다.

- Fixed Point
- Floating Point
- Block Floating Point
- MXFP4
- NVFP4

를 연결해서 설명하는 **4페이지 분량의 짧은 technical letter**를 작성하도록 했습니다.

Agent에게는 `gpt-6-astra`를 사용했고 Reasoning Effort는 `high`로 설정했습니다.

놀라웠던 것은 첫 번째 run이었습니다.

처음부터 `.tex`, bibliography, Figure 등을 생성하고 compile까지 수행했는데, first run에서 이미 상당히 완성도 높은 draft가 만들어졌습니다.

아래 PDF가 그 결과를 몇 차례 수정한 최종 결과물입니다.

{% include pdf.html
   url="/assets/docs/gpt-6-astra-gen.pdf"
   title="gpt-6-astra-gen.pdf"
   caption="GPT-6 Astra를 세 차례 실행하여 생성하고 수정한 4-page technical letter."
   id="pdf-astra-gen"
%}

첫 번째 run 이후에는 대규모 재작성은 하지 않았습니다.

두 번째 run에서는 주로 Figure와 manuscript 사이에서 notation이나 표현이 일치하지 않는 부분을 찾아 수정하도록 했습니다.

세 번째 run에서는 전체적인 polishing을 수행하도록 했습니다.

마지막 페이지에서 일부 파란색으로 표시했던 부분은 별도로 `GPT-5.6 Sol` Web Chat을 이용해 수정했습니다.

## 6. 세 번의 Agent run

각 run의 비용을 기록해보면 다음과 같습니다.

### First Run

```text
# Codex Run Report

- Current Model: gpt-6-astra
- Reasoning Effort: high
- Token: 1,011,312
- Cache Ratio: 92.3%
- Working Time: 5m 35.5s
- Files Created: 21
- Files Modified: 0
- Files Deleted: 0
```

첫 번째 run에서는 project 자체를 처음부터 구성했기 때문에 21개의 파일이 새로 생성되었습니다.

### Second Run

```text
# Codex Run Report

- Current Model: gpt-6-astra
- Reasoning Effort: high
- Token: 1,003,973
- Cache Ratio: 97.3%
- Working Time: 2m 48.9s
- Files Created: 0
- Files Modified: 12
- Files Deleted: 1
```

두 번째 run에서는 manuscript와 Figure 사이의 consistency를 중심으로 수정했습니다.

### Third Run

```text
# Codex Run Report

- Current Model: gpt-6-astra
- Reasoning Effort: high
- Token: 836,012
- Cache Ratio: 97.9%
- Working Time: 1m 13.4s
- Files Created: 0
- Files Modified: 7
- Files Deleted: 0
```

세 번을 합치면 약 **285만 token**을 사용했습니다.

실제 wall-clock time은 모두 합쳐 약 10분도 되지 않았지만, token consumption은 상당히 컸습니다.

몇 번만 이런 방식으로 작업하면 usage limit을 금방 소모할 수 있겠다는 생각이 들었습니다.

## 7. 결과는 생각보다 좋았다

결과물 자체는 예상보다 훨씬 괜찮았습니다.

특히 first run에서 이미

- IEEE-style LaTeX manuscript
- section structure
- equations
- references
- Figure
- table
- bibliography

가 포함된 4페이지 draft를 한 번에 만들었다는 점은 꽤 인상적이었습니다.

예전 같으면 AI가 논문을 쓴다고 해도 결국 paragraph 단위로 복사하고 붙여넣는 작업을 반복해야 했습니다.

이번에는 Agent가 실제 repository를 직접 수정하고 compile 결과를 확인하면서 작업했기 때문에 작업 방식 자체가 완전히 달랐습니다.

즉,

> AI가 글을 작성하는 것

이 아니라,

> AI가 LaTeX project 자체를 수정하는 것

에 가까웠습니다.

이 차이가 생각보다 컸습니다.

## 8. 하지만 그대로 논문에 쓰기에는 아직 위험하다

물론 결과물을 자세히 보면 마음에 들지 않는 부분도 있습니다.

가장 먼저 눈에 들어온 것은 Figure였습니다.

Figure 자체만 보면 나쁘지 않았지만, 실제 two-column paper에 삽입했을 때의 크기를 충분히 고려하지 못해 일부 text가 지나치게 작아졌습니다.

즉 Figure를 단독으로 보는 것과 실제 paper 안에서 보는 것은 전혀 다른 문제였습니다.

Agent가 Figure를 생성할 때부터

- final paper width
- column width
- font size
- aspect ratio
- minimum readable text size

까지 constraint로 주는 것이 필요해 보입니다.

Manuscript 역시 마찬가지입니다.

겉으로 보기에는 상당히 그럴듯한 논문이 만들어지지만, 실제 연구 논문에서는 단순한 문장 완성도보다 더 중요한 것들이 많습니다.

- 주장과 실험 결과가 정확히 대응하는가
- notation이 전체 manuscript에서 일관적인가
- citation이 실제 주장에 적절한가
- Figure와 text의 의미가 일치하는가
- 과도하게 일반화한 문장이 없는가
- 연구자가 의도한 contribution을 정확히 전달하는가

이런 부분은 결국 사람이 직접 확인해야 합니다.

특히 실제 submission을 목표로 하는 논문이라면 specification 하나만 주고 처음부터 끝까지 Agent에게 one-shot으로 맡기는 방식은 아직 상당히 risky하다고 느꼈습니다.

## 9. 논문보다 Report 작성에는 상당히 유용할지도

반대로 이번 실험을 하면서 꽤 명확하게 느낀 활용처도 있습니다.

**Technical report 작성입니다.**

예를 들어,

- 새로운 numerical format 정리
- architecture survey
- design-space exploration 결과
- 내부 실험 보고서
- 알고리즘 정리
- project documentation

처럼 내용 자체는 어느 정도 정해져 있고, 이를 일정한 형식의 문서로 정리하는 작업에는 상당히 유용해 보입니다.

Specification을 Markdown으로 잘 작성해두고,

> 이 내용을 기반으로 LaTeX report를 작성하고 Figure와 bibliography를 생성한 뒤 PDF까지 compile해라.

정도로 지시하면 사람이 직접 formatting에 시간을 쓰지 않고도 꽤 완성도 높은 문서를 얻을 수 있습니다.

이 경우에는 최종 결과를 사람이 검수한다는 전제도 자연스럽기 때문에, 연구 논문을 완전히 자동 생성하는 것보다 훨씬 현실적인 사용 방법이라고 생각합니다.

## 마치며

이번에 논문 작업환경을 다시 구성하면서 생각보다 많은 것이 바뀌었다는 것을 느꼈습니다.

처음에는 단순히 Overleaf 대신 VS Code에서 LaTeX을 작성해보려는 것이었습니다.

그런데 build environment가 로컬에 있다는 것만으로도 Codex와 같은 Agent가 manuscript, Figure, bibliography, compilation까지 직접 다룰 수 있게 되었습니다.

결과적으로 현재 제 작업환경은 대략 다음과 같이 정리할 수 있을 것 같습니다.

```text
WSL Ubuntu
 ├─ VS Code
 │   ├─ LaTeX editing
 │   └─ PDF preview
 │
 ├─ LaTeX toolchain
 │   └─ automatic build
 │
 ├─ Git
 │   └─ version control / collaboration
 │
 └─ Codex
     ├─ manuscript
     ├─ bibliography
     ├─ SVG figures
     ├─ revision
     └─ compile / verification
```

지금 당장 논문을 Agent에게 통째로 맡기고 싶다는 생각은 들지 않습니다.

논문은 여전히 사람이 여러 번 읽고, 앞뒤를 오가며 고쳐야 하는 작업이라고 생각합니다.

다만 **연구자가 논문의 모든 파일을 직접 수정해야만 하는 시대는 확실히 지나가고 있는 것 같습니다.**

제가 방향을 정하고, Agent가 실제 project를 수정하고, 다시 제가 결과를 검토하는 방식이라면 꽤 실용적인 workflow가 될 수 있을 것 같습니다.

그리고 무엇보다,

**Overleaf에서 진작 나올 걸 그랬습니다.**