---
layout: post
title: "ASIC 설계 레시피: Custom Standard Cell Library 제작 가이드"
author: "Yonghwan Kwon"
tags: "ASIC"
comments: true
excerpt_separator: ---
---

과거에 작성했던 게시글 중 markdown이 남아있는 글들을 복원하고 있습니다.

일반적으로 ASIC 설계 시 파운드리나 IP 벤더에서 제공하는 Standard Cell을 사용하지만, 연구 목적이나 특별한 아키텍처 구현을 위해 **독자적인 로직 셀이나 Flip-flop(FF)** 등을 직접 설계해야 하는 경우가 발생합니다. 이처럼 Full-Custom으로 설계한 특수 회로를 **Synthesis(합성) 및 PnR(Place & Route)** 단계에서 다른 표준 셀들과 함께 사용하려면, PnR 툴이 인식할 수 있는 **표준화된 라이브러리 포맷으로 변환하는 과정**이 필수적입니다.

본 포스팅에서는 ASIC 설계 Flow 중에서도 진입장벽이 높고 복잡한 **Custom Standard Cell Library 설계 및 제작 워크플로우**에 초점을 맞추어 다루도록 하겠습니다.

---

## 📝 들어가며
*최종 수정일: 2026-08-09.* 

이 글을 처음 작성할 당시만 하더라도 RTL-to-GDS를 넘어서 라이브러리 제작, Sign-off, 패키징/PCB 제작 및 측정 등 실제로 연구실에서 칩을 만들고 측정을 하기 위해 필요한 모든 과정을 한 글에 담으려고 했습니다. 하지만, 석사 기간 동안 ISCA, MICRO, ISSCC, DAC로 이어진 논문 투고와 2회의 tape-out으로 블로그에 포스팅을 할 수 있는 물리적인 시간이 없었습니다 🥺🥺

연구실을 나오게 되면서 더 이상 서버나 PDK/EDA를 자유롭게 이용할 수 없는 상황이 되었기 때문에 구체적인 커맨드나 실행 화면을 글에 담지는 못할 것 같습니다. 이 게시글이라도 조금 더 성의있게 쓸 걸 그랬나 싶은 마음이 들기도 하네요. 제가 개인적으로 여러가지 EDA에 대한 access 권한이 생기면 이후 다양한 툴을 핸들링 하기 위한 방법에 대한 연재를 꼭 해보도록 하겠습니다.

그 전에 앞으로 `ASIC`관련 글은 제 데스크톱에 `Verilator`, `OpenROAD`와 같은 Open source EDA를 셋업하고, Industrial PDK를 물려서 `ORFS`의 결과물이 Free PDK가 아닌 28nm, 65nm 정도를 물렸을 때 어떻게 나오는지 탐색해 보는 과정을 정리하려고 합니다. `OpenROAD`의 설명대로 라면 12nm 수준까지 tape-out 하는 데 성공했다고 이야기하고, 제가 가이드를 쭉 훑어봤을 때 느낌은 `Calibre`를 물려서 `Sign-off DRC/LVS`를 하기 전 단계(`DC`, `ICC`, `PT`, `RC`)의 영역은 커버가 가능한 것으로 판단됩니다.

다만, `MMCM`이나 `OCV`와 같은 최적화 방식은 일정 부분 한계가 있는 것으로 보입니다. 그래서 `ORFS`를 활용할 때의 한계점도 정리해 보려고 합니다. 개인적으로 양산 수준이 아닌 학교 혹은 기관의 연구실에서 제작하는 칩은 `ORFS`를 이용하더라도 저렴하고 빠르게 tape-out이 가능하지 않을까 하는 생각을 가지고 있습니다. 물론, 막상 툴을 셋업하고 써보면 생각이 달라질 수도 있겠지요.

그리고, 최근 `DAC`, `ICCAD`등의 EDA 학회에선 `AI agent`를 붙여서 `RTL`, `Verification`, `Implementation` 과정을 자동화 하는 연구에 주목을 많이 하고 있습니다. 저는 논문을 쓰는 것보다 지금은 공학적으로 의미가 있는 작업들에 관심이 많기 때문에 저도 Open Source 생태계를 이용하여 설계 flow를 자동화하는 시도를 해보고자 합니다.

> **사족입니다:** 요즘은 기업이 기술의 진보와 트렌드를 주도하고 학계는 그들이 제시한 새로운 기술들에 편승하여 자신들만의 논리체계로 이야기를 만들어 낼 뿐 의미있는 선행연구 및 요소기술 연구가 진행되지 못하고 그저 실적에만 매몰되어 구현 불가능한 알고리즘, 아키텍처, 실험 과정없이 임의로 만든 가짜 데이터로 점철된 fake 논문을 공장처럼 찍어내는 문화가 성행하고 있는 것 같아 안타까운 마음입니다. 그럼에도 불구하고 이 글을 찾아 들어온 학생 및 연구원 분들께서는 무언가를 실제로 구현하고 실험하기 위한 깊은 고민을 하고 계실 것이라 생각합니다. 실제로 tape-out 및 측정에 성공했던 cell library 설계 scripts가 필요한 분은 [제 개인 메일](mailto:yonghwankwon.6658@gmail.com)로 연락주시길 바랍니다.
>
> 💡 **Tip:** 혹시 위 링크 클릭 시 브라우저 설정 문제로 메일 쓰기 창이 바로 열리지 않는다면, 크롬 브라우저에서 Gmail(mail.google.com)에 접속하신 뒤 **주소창 우측 끝에 있는 프로토콜 핸들러 아이콘(마름모 두 개가 겹쳐진 모양)**을 클릭하여 **'허용'**으로 설정해 주시면 됩니다.

---

## 🔎 1. 라이브러리 파일 포맷의 이해
Custom Cell을 PnR 툴(Synopsys ICC/ICC2, Cadence Innovus 등)에 통합하기 위해서는 논리적, 물리적 특성을 담은 다양한 포맷의 데이터가 필요합니다. 각 파일이 담당하는 역할과 주로 사용되는 EDA 툴은 다음과 같습니다.

<table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 14px;">
  <thead>
    <tr>
      <th style="border: 1px solid #ddd; padding: 8px; background-color: rgba(0,0,0,0.05);">파일 포맷</th>
      <th style="border: 1px solid #ddd; padding: 8px; background-color: rgba(0,0,0,0.05);">주요 내용 및 역할</th>
      <th style="border: 1px solid #ddd; padding: 8px; background-color: rgba(0,0,0,0.05);">관련 EDA 툴</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="border: 1px solid #ddd; padding: 8px;"><b>GDSII (gds)</b></td>
      <td style="border: 1px solid #ddd; padding: 8px;">Well, Via, Metal, Poly 등 셀의 <b>모든 물리적 레이아웃 정보</b>를 포함하는 파운드리 제출용 최종 포맷.</td>
      <td style="border: 1px solid #ddd; padding: 8px;">Cadence Virtuoso</td>
    </tr>
    <tr>
      <td style="border: 1px solid #ddd; padding: 8px;"><b>LEF</b></td>
      <td style="border: 1px solid #ddd; padding: 8px;">GDS에서 PnR에 필요한 최소한의 정보(Pin 위치, Metal Layer, Boundary)만 추출한 <b>경량화된 물리 모델</b>.</td>
      <td style="border: 1px solid #ddd; padding: 8px;">Abstract Generator</td>
    </tr>
    <tr>
      <td style="border: 1px solid #ddd; padding: 8px;"><b>LIB / DB</b></td>
      <td style="border: 1px solid #ddd; padding: 8px;">Area, Capacitance, Transition time, Setup/Hold 등 <b>논리 및 타이밍/전력 정보</b>. (lib는 ASCII, db는 바이너리)</td>
      <td style="border: 1px solid #ddd; padding: 8px;">PrimeLib, Library Compiler</td>
    </tr>
    <tr>
      <td style="border: 1px solid #ddd; padding: 8px;"><b>SPICE Netlist</b></td>
      <td style="border: 1px solid #ddd; padding: 8px;">기생 성분(RC)이 포함된 <b>트랜지스터 레벨의 회로망</b>. 타이밍 Characterization 및 LVS에 사용.</td>
      <td style="border: 1px solid #ddd; padding: 8px;">HSPICE, Calibre PEX</td>
    </tr>
    <tr>
      <td style="border: 1px solid #ddd; padding: 8px;"><b>Verilog</b></td>
      <td style="border: 1px solid #ddd; padding: 8px;">IP의 동작을 기술한 <b>HDL 모델</b>로 시스템 레벨의 기능 검증에 사용.</td>
      <td style="border: 1px solid #ddd; padding: 8px;">VCS, Verdi</td>
    </tr>
  </tbody>
</table>

---

## 🚀 2. Custom Standard Cell Library 제작 워크플로우
하나의 Custom Cell이 설계되어 PnR 툴에 얹혀지기까지는 수많은 검증과 데이터 변환 단계를 거쳐야 합니다. 일반적인 제작 과정은 다음과 같은 순서로 진행됩니다.

### 1️⃣ Schematic 및 Layout 설계 (Full-Custom)
- **사용 툴**: Cadence Virtuoso, Siemens Calibre
- **과정**: 
  - Virtuoso 환경에서 Custom Cell의 Schematic을 구성하고 Layout을 완성합니다.
  - 이후 **DRC (Design Rule Check)**와 **LVS (Layout Versus Schematic)**를 통과한 뒤, **PEX (Parasitic Extraction)**를 수행합니다.
  - PEX 수행 시 후속 타이밍 분석을 위해 출력 형식을 **dspf** 또는 **spef** 포맷으로 지정하여 기생 성분이 포함된 Netlist를 추출합니다.

### 2️⃣ Characterization 및 `lib` 파일 생성
- **사용 툴**: Synopsys PrimeLib (내장 PrimeSim 또는 HSPICE)
- **과정**: 
  - 추출된 dspf 파일과 Analog PDK의 SPICE 모델을 PrimeLib에 입력으로 제공합니다.
  - IP 벤더가 제공하는 데이터시트와 기준을 참고하여 Transition time, Setup/Hold, Power 등을 측정할 **VT (Voltage, Temperature) 코너 및 조건**을 정의합니다.
  - SPICE 시뮬레이터(HSPICE 등)를 구동하여 각 조건에 대한 데이터를 수집하고, 최종적으로 논리 라이브러리인 **`lib` 파일**을 생성합니다.

### 3️⃣ Verilog 모델 추출 및 검증
- **사용 툴**: VCS, Verdi
- **과정**: 
  - PrimeLib에서 `lib` 파일과 함께 동작 모델인 **Verilog 모델**을 추출합니다.
  - 추출된 `lib`의 타이밍 정보가 원본 Schematic Simulation 결과와 유사한지 검증하고, Verilog 모델을 이용해 RTL Simulation이 정상적으로 수행되는지 확인합니다.

### 4️⃣ 물리적 추상화 (Physical Abstraction): `LEF` 파일 생성
- **사용 툴**: Cadence Abstract Generator
- **과정**: 
  - PnR 툴은 수백만 개의 셀을 배치해야 하므로 무거운 GDS 파일을 직접 다루지 않습니다. 
  - Abstract Generator를 사용하여 Virtuoso의 Layout과 `lib` 파일을 기반으로, Routing에 필요한 핵심 정보만 남긴 **LEF 파일**을 생성합니다.

### 5️⃣ Antenna Property 변환 (CLF 생성)
- **사용 툴**: Custom Batch Script
- **과정**: 
  - 공정 중 금속선이 안테나 역할을 하여 축적된 전하가 게이트 산화막을 파괴하는 현상(Antenna Effect)을 방지해야 합니다.
  - LEF 파일에서 Antenna Property 정보를 추출하여 Synopsys 포맷인 **CLF (Cell Library Format)** 파일로 변환하는 스크립트 작업이 필요합니다.

### 6️⃣ GDS Streamout
- **사용 툴**: Cadence Virtuoso
- **과정**: 완성된 Layout 데이터를 GDSII 포맷으로 **Streamout** 하여 최종 물리 데이터 준비를 마칩니다.

### 7️⃣ 논리 라이브러리 컴파일 (`lib` $\rightarrow$ `db`)
- **사용 툴**: Synopsys Library Compiler
- **과정**: 텍스트 기반의 무거운 `.lib` 파일을 Design Compiler(DC)와 IC Compiler(ICC)에서 고속으로 읽고 처리할 수 있도록 바이너리 압축 포맷인 **`.db` 파일**로 변환합니다.

### 8️⃣ 물리적 라이브러리 통합 구축 (Milkyway / NDM)
- **사용 툴**: Synopsys Milkyway (ICC용) / ICC2 Library Manager (ICC2용)
- **과정**: 
  - 앞서 생성된 `lef`, `gds`, `db`, `clf` 데이터를 모두 통합하여 PnR 전용 물리 라이브러리를 생성합니다.
  - **ICC 환경**: Milkyway 툴을 이용하여 **Milkyway Library**를 생성하며, 툴 내에서 Pin과 Metal 위치가 정확히 추출되었는지 확인합니다.
  - **ICC2 환경**: ICC2 내장 Library Manager를 통해 논리/물리 정보가 하나로 결합된 **NDM (New Data Model)** 라이브러리를 생성합니다. (NDM 생성 시 ICV를 활용하면 별도의 CLF 파일 없이도 Antenna Property 추출이 가능합니다.)

---

## ⚠️ 3. Custom Cell 설계 시 핵심 고려사항

Custom Standard Cell을 PnR 툴에서 오류 없이 촘촘하게 배치(Placement)하기 위해서는, Layout 설계 단계에서부터 다음과 같은 엄격한 표준 제약 조건을 반드시 준수해야 합니다.

1. **PG (Power/Ground) Pin의 정렬과 Pitch**
   - VDD 및 VSS PG Pin은 반드시 일정한 **Pitch(단위 간격)**로 배치되어야 하며, 일반적으로 수평 직선 형태로 레이아웃 됩니다.
   - PnR 툴은 일정 간격으로 Power Rail을 구성하고 그 위에 Standard Cell들을 레고 블록처럼 배치합니다. 따라서 VDD/VSS 메탈 라인과 핀의 위치는 PnR 툴이 구성하는 **Power Rail 간격에 완벽히 일치**해야 합니다.
   - Pitch에 대한 상세 정보는 일반적으로 ICC/ICC2 Techfile (`.tf`) 내부의 `unit` 혹은 `tile` 레이어에 기술되어 있으며, 파운드리 제공 Standard Cell을 열어 직접 간격을 측정하여 참고하는 것도 좋은 방법입니다.

2. **PnR을 고려한 DRC 준수**
   - PnR 과정에서 각 Standard Cells은 P/G Rail 위에 나란히 배치됩니다. 
   - 이 과정에서 제작한 Cell의 pin 배치는 항상 multi cells을 나란히 배치한 상황을 고려해야 합니다. 
   - HVH 스타일로 작업할 경우 cell의 왼쪽-왼쪽, 왼쪽-오른쪽, 오른쪽-왼쪽, 오른쪽-오른쪽 면이 맞닿을 수 있습니다. 따라서, 최소 4개의 cells을 이어붙인 후 DRC를 수행해야 합니다.

3. **Routability 및 Crosstalk 분석**
   - DRC를 통과하더라도 `Routability`를 반드시 확인해야 합니다. `Routability`란 cell에 routing을 진행할 때, cell 내부를 routing metal이 가로지를 수 있는 충분한 공간이 확보되었는지를 의미합니다.
   - 만약, 부적저란 pin 배치에 의해 routability warning이 발생할 경우 routing을 위한 metal이 cell 밖으로 돌아나가야 하는 상황이 발생합니다.
   - 이 경우 cell의 절대적인 area 외에 routing을 위한 추가적인 cost penalty가 상당히 커지게 됩니다.
   - 또한, multi cells을 상하좌우로 최대한 많이 배치한 상태에서 `Crosstalk` 분석이 필요합니다. 개별 cell 수주에서는 문제가 보이지 않을 수 있지만 routing 과정을 수행한 후 cell 내부의 metal layer와 인접한 routing metals 사이에서 `Crosstalk Noise`가 발생할 수 있기 때문입니다.

---

## 🏁 마무리
본래 ASIC 설계의 시작(Emulation)부터 끝(Measurement)까지의 방대한 A-Z를 하나의 포스팅에 담으려 했으나, 깊이 있는 정보 전달을 위해 `Solvnet` 혹은 구글링을 통해서 충분한 정보를 얻기 어려운 **Custom Standard Cell Library 설계 프로세스**로 스코프를 좁혀 정리해 보았습니다.

이처럼 회로 하나를 설계하고 검증하는 것을 넘어, 이를 시스템 단위로 엮기 위해 필요한 `lib`, `lef`, `db`, `Milkyway` 등의 데이터 체계를 이해하는 것은 성공적인 Tape-out을 위한 가장 중요한 밑거름이 될 것입니다.