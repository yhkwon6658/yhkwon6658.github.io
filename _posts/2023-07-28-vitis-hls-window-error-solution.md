---
layout: post
title: "Vitis HLS ERROR: [IMPL 213-28] 해결법"
author: "Yonghwan Kwon"
tags: "Archive"
comments: true
excerpt_separator: ---
---

과거에 작성했던 게시글 중 markdown이 남아있는 글들을 복원하고 있습니다.

Vitis HLS Windows 버전을 사용할 때 초기 단계에서 빈번하게 마주치는 `ERROR: [IMPL 213-28]`의 원인과 명확한 해결 방법을 정리했습니다. 

---

## 1. 잘못된 해결 방법 (Xilinx Community 패치)

Xilinx Community 포럼에는 [특정 패치 파일](https://support.xilinx.com/s/article/76960?language=en_US)을 적용하여 이 문제를 해결할 수 있다는 가이드가 존재합니다. 그러나 실제 검증 결과, 안내된 대로 Xilinx 폴더 하위에서 압축을 풀고 `patch.py`를 실행하여 패치를 적용하더라도 해당 에러 코드는 근본적으로 해결되지 않았습니다. 

*(단, 툴의 공식적인 버그를 수정하는 패치이므로 가급적 적용해 두는 것을 권장합니다.)*

## 2. 올바른 해결 방법

해당 에러 코드는 일반적으로 **Export RTL** 버튼을 눌러 IP를 추출(Export)하려 할 때 Console 창에 출력되며 프로세스가 중단되는 상황에서 발생합니다. 문제의 원인은 버전 정보의 누락이며, 해결 방법은 매우 간단합니다.

1. **Export RTL** 메뉴 창을 다시 연 후, **Configuration** 버튼을 클릭합니다.
2. **Version** 입력란에 반드시 `x.y.z` 형식으로 숫자를 명시적으로 기입합니다. (예: `0.0.0`)
3. 설정을 반영한 후 다시 Export를 진행하면 에러 없이 정상적으로 IP가 생성됩니다.