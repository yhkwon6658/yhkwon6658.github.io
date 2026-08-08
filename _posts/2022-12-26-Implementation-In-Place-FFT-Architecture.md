---
layout: post
title: "FPGA 기반 In-Place FFT 하드웨어 아키텍처 구현"
author: "Yonghwan Kwon"
tags: "Archive"
comments: true
excerpt_separator: ---
---

과거에 작성했던 게시글 중 markdown이 남아있는 글들을 복원하고 있습니다. 과거 프로젝트로 진행했던 `In-Place FFT Architecture`의 하드웨어 설계 및 구현 과정을 정리한 기록입니다. `Verilog HDL`을 이용해 FPGA에 FFT 아키텍처를 포팅하고, PC와 FPGA 간의 UART 통신을 제어하는 전용 GUI 프로그램을 개발하여 최종적으로 Spectrogram을 출력하는 시스템을 구축했습니다. 

---

## 1. Project Overview & Repository

<figure>
  <img src="https://user-images.githubusercontent.com/120978778/210115307-8ddc62be-96ad-420c-a57b-b1d52ca96a3a.gif" alt="SPECTRO GUI Demo" id="figure-1">
  <figcaption>Figure 1. SPECTRO GUI 실행 데모</figcaption>
</figure>

* **GitHub Repository**: [yhkwon6658/Inplace-FFT](http://github.com/yhkwon6658/Inplace-FFT)

**Prerequisites**
본 글은 FFT에 대한 기초적인 튜토리얼이 아니며, DIT, DIF, Radix, Twiddle Factor 등 기본 용어와 수식을 이미 숙지하고 있다는 전제하에 작성되었습니다. 핵심적으로 [L. G. Johnson's Conflict Free Memory Addressing for Dedicated FFT Hardware](https://ieeexplore.ieee.org/document/142032) 논문에 대한 리뷰와 함께, 원문이 지닌 표기상의 오류나 한계를 보완하여 하드웨어 설계 관점에서의 Block Diagram과 GUI 활용법을 다루는 데 집중합니다.

---

## 2. System Environment

* **FPGA Board**: Terasic DE2 (Intel Quartus II SDK 사용)
    * *Tip: ALTERA(Xilinx) 계열 보드 사용 시, Quartus(Vivado)에서 제공하는 Standard IP로 FPU를 교체하면 Synthesis 과정이 더욱 빨라집니다.*
* **Data Format**: [IEEE 754 Single Precision (32-bit)](https://ko.wikipedia.org/wiki/IEEE_754)
* **Reference IP**: 
    * `Butterfly` 연산용 FPU: Usselmannm의 [FPU 모듈](https://opencores.org/projects/fpu) 활용
    * `UART Controller`: Nandland의 [UART RX/TX 모듈](https://nandland.com/uart-serial-port-module/) 활용

---

## 3. Spectrogram 분석 기법

일반적으로 FFT는 Time domain의 데이터를 Frequency domain으로 변환하여 신호를 `Nyquist frequency` 이하로 표현하기 위해 사용됩니다. 이를 통해 노이즈 필터링이나 양자화 처리가 용이해집니다.

<figure>
  <img src="https://www.mwmresearchgroup.org/uploads/3/0/8/6/30861243/editor/image-3-ft.png?1597158887" alt="FFT Concept" id="figure-2">
  <figcaption>Figure 2. Time Domain과 Frequency Domain의 변환</figcaption>
</figure>

[`Figure 2`](#figure-2)는 Fourier Transform의 성격을 직관적으로 보여줍니다. 시간 영역에서는 복잡한 곡선으로 보이는 데이터가 주파수 영역에서는 몇 개의 핵심 주파수 성분으로 명확하게 분리됩니다.

그러나 일반적인 FFT는 주파수의 분포(Distribution)만 보여줄 뿐, **해당 주파수가 어느 시점에 발생하는지**에 대한 시간 정보는 잃게 됩니다. 이를 해결하기 위해 도입된 기법이 바로 **STFT(Short-Time-Fourier-Transform)**입니다. 

<figure>
  <img src="https://miro.medium.com/max/720/1*V2mgZ7y0ngd3q4DZ01xkEQ.webp" alt="Spectrogram Example" id="figure-3">
  <figcaption>Figure 3. Spectrogram의 시각화 예시</figcaption>
</figure>

예를 들어 8,192개의 데이터를 한 번에 FFT 하는 대신, 1,024개씩 8구간으로 나누어 연산하는 방식입니다. 이 결과를 시간에 따른 2차원 히트맵(Heat map) 형태로 나타낸 것이 바로 [`Figure 3`](#figure-3)과 같은 **Spectrogram**입니다. 

본 프로젝트에서는 검증 환경인 `SPECTRO` GUI를 직접 개발하여, PC에서 연산한 Spectrogram 결과와 FPGA에서 하드웨어로 가속하여 전송받은 FFT 결과를 시각적으로 비교하고 오차를 검증할 수 있도록 구성했습니다. (GUI 소스코드는 내부 보완을 위해 릴리즈 버전 실행 파일만 배포 중입니다.)

---

## 4. Paper Analysis: Conflict Free Memory Addressing

하드웨어 FFT 구현 방식은 크게 2가지로 나뉩니다.
1.  **In-Place FFT (Memory-base FFT)**: 단일 메모리와 PE(Processing-Element)를 기반으로 하여 자원(Area) 소모를 극대화해 줄이는 방식.
2.  **Pipelined-FFT**: In-Place 방식의 긴 Latency 문제를 극복하여 Real-time 처리에 적합하게 고안된 방식.

우리가 구현한 방식은 In-Place FFT이며, 바탕이 된 L. G. Johnson의 논문은 **CFA(Conflict Free Addressing)** 기법을 제안하여 메모리 뱅크 충돌 없이 데이터를 읽고 쓰는 방법을 수식화했습니다. 다만, 원문에는 표기법(Notation)의 설명 누락과 다수의 Typo가 존재하여, 본 프로젝트에서는 이를 바로잡고 특히 DIF 방식에 대한 수식을 새롭게 정립했습니다.

### I. Notation

<figure>
  <img src="https://user-images.githubusercontent.com/120978778/209723250-34dbfd7a-f405-46ce-a1dd-59f774ceb169.png" alt="DFT Equation" id="figure-4">
  <figcaption>Figure 4. DFT Equation</figcaption>
</figure>

<figure>
  <img src="https://user-images.githubusercontent.com/120978778/209724382-83c7dd29-e51e-413c-a282-9791878a37eb.png" alt="Decomposition" id="figure-5">
  <figcaption>Figure 5. Decomposition</figcaption>
</figure>

원문 논문의 Decomposition 식 좌변($n_{R-2-c}$, $k_c$)에서 콤마(,)가 누락된 오류가 있습니다. 이 수식을 살펴보면 DFT의 결과로 $n$의 차원이 하나 줄고 $k$가 하나 늘어나는 구조를 가집니다. Johnson은 스테이지(Stage)마다 $n$과 $k$로 인덱싱을 변경하여 표기하는데, DIT의 전형적인 Flow와 정확히 일치합니다.

### II. Memory Banking

<figure>
  <img src="https://user-images.githubusercontent.com/120978778/209725419-4063f5be-8a58-4616-84c6-2751ac05933d.png" alt="Memory Banking" id="figure-6">
  <figcaption>Figure 6. Memory Banking Equation</figcaption>
</figure>

In-Place 연산의 핵심은 **"데이터를 꺼낸 메모리 주소에 연산 결과를 다시 그대로 덮어쓰는 것"**입니다. $r$개의 데이터를 읽어 연산 후 다시 $r$개의 뱅크에 나누어 저장해야 충돌(Conflict)이 발생하지 않습니다. 

Radix-4 시스템에서 나비 연산(Butterfly)의 날개 간격은 Stage에 따라 1, 4, 16으로 증가합니다. 서로 연산되어야 할 데이터들은 인덱스 표기상 **단 하나의 Digit만 다르기 때문**에, 이 다른 하나의 Digit을 기준으로 Modulo-addition 연산을 수행하여 Banking을 처리하면 충돌 없이 분산 저장이 가능합니다.

### III. CFA & Exponent Generation

각 뱅크는 전체 어드레스 공간 중 일부만을 담당하므로, 인덱스의 파라미터 중 $R-1$개만을 선택하여 주소로 사용하게 됩니다. Johnson의 알고리즘에 따르면 DIT일 때는 하위 2개의 Digit을, DIF일 때는 상위 2개의 Digit을 Address 파라미터로 선택합니다.

<figure>
  <img src="https://user-images.githubusercontent.com/120978778/210103249-b2e8d11a-d003-4219-96fc-fdd7d8387115.png" alt="Twiddle factor Generation" id="figure-7">
  <figcaption>Figure 7. Exponent for Twiddle factor</figcaption>
</figure>

Twiddle factor의 Exponent는 연산의 가짓수를 결정짓는 $k$와 stride를 결정하는 $n$에 의해 정해집니다. Stage를 거칠 때마다 경우의 수가 $r$배씩 증가하므로 $mod\ r^c$ 연산이 적용됩니다.

### IV. 보완된 DIF (Decimation-In-Frequency) 수식 제안

원문 논문은 하드웨어 구현을 위한 주소 생성기(Address Generator) 수식을 제시할 때, DIF에 대해서는 명확한 식을 제공하지 않거나 음수 인덱스를 0으로 간주하라는 등 다소 비효율적인 방식을 취했습니다.

<figure>
  <img src="https://user-images.githubusercontent.com/120978778/210111790-0832b3bd-2663-4d00-a7b2-1faa665d2535.png" alt="Proposed DIF Address Generator" id="figure-8">
  <figcaption>Figure 8. 프로젝트에서 새롭게 제안한 DIF Address Generator</figcaption>
</figure>

따라서 본 프로젝트에서는 DIF 방식을 완벽하게 하드웨어로 구현하기 위해 위와 같이 주소 생성 구간을 명확히 나누고 수식을 깔끔하게 재정립했습니다. 구현된 FPGA 시스템 역시 해당 DIF 기반 수식을 적용하여 성공적으로 동작함을 검증했습니다.

---

## 5. Hardware Block Diagram

<figure>
  <img src="https://user-images.githubusercontent.com/120978778/210112541-7dd62ef1-1478-4905-afbb-6e632adf2d64.png" alt="Block Diagram" id="figure-9">
  <figcaption>Figure 9. 전체 시스템 Block Diagram</figcaption>
</figure>

시스템은 크게 3가지 주요 컴포넌트로 구성됩니다.
1.  **TESTROM**: 실험용 원본 데이터를 보관하는 On-chip 메모리.
2.  **UART CONTROLLER**: PC와 FPGA 간 64bits(Real 32bit + Imaginary 32bit) 통신을 위해 8bits씩 8회 연속으로 송수신을 제어하는 인터페이스.
3.  **FFT CONTROLLER (FSM 기반)**:
    * PC에서 `tx_ready` 신호 수신 시 TESTROM의 Raw 데이터를 뱅크에 초기화.
    * Address Generator와 Exponent Generator를 통해 메모리를 읽고 Twiddle factor를 매핑하여 Butterfly 연산 수행.
    * Bit-reverse 출력 특성을 고려해 `Find Data Module`이 오름차순으로 어드레스를 재생성하여 PC로 결과 전송.

---

## 6. How to Run

### Step 1. Data Processing (MATLAB)

입력 음원 데이터에서 원하는 구간을 샘플링하여 64-bit Hexadecimal 포맷(.txt)으로 변환합니다.

```matlab
clear; clc; close all;

%% 1. Input/Output 설정
infile = "input\chopin_etude_op25_no11.mp3";
outfile = "C:output\sample.txt";
[y, Fs_ori] = audioread(infile);

%% 2. 파라미터 셋업 (Start, End, Sample Rate, Mode)
START = 5; END = 6;
Fs = 8192;
mode = 1; % 0: SW, 1: HW (64-bit Hexadecimal 추출 모드)

y = y(round(START*Fs_ori):round(END*Fs_ori));
x = resample(y, Fs, Fs_ori);
L = length(x) - 1;

fileID = fopen(outfile,'w');
if (mode == 0)
    fprintf(fileID,'%f\n',x);
else
    xx = zeros(1, 2*L);
    for i = 1:L
        xx(2*i-1) = x(i);
        xx(2*i) = 0; % Imaginary part 초기화
    end
    formatSpec = '%tx%tx\n';
    fprintf(fileID, formatSpec, xx);
end
fclose(fileID);

fprintf('Sample Rate: %d\n', Fs);
fprintf('# Sample: %d\nDONE\n', L);
```