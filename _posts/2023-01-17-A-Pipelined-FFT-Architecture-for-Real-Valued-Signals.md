---
layout: post
title: "A Pipelined FFT Architecture for Real-Valued Signals"
author: "Yonghwan Kwon"
tags: "Archive"
comments: true
excerpt_separator: ---
---

과거에 작성했던 게시글 중 markdown이 남아있는 글들을 복원하고 있습니다. 기존의 FFT 아키텍처에 대한 연구는 주로 복소수 고속 푸리에 변환(CFFT, Complex Fast Fourier Transform)을 중심으로 진행되었습니다. 본 포스팅에서는 실제 환경에서 입력 데이터의 대부분이 실수(Real Value)라는 점에 착안하여 제안된 논문인 'A Pipelined FFT Architecture for Real-Valued Signals'를 리뷰합니다. 핵심 쟁점인 켤레 대칭(Conjugate Symmetry), RFFT Flow chart 최적화, 그리고 Pipelined RFFT Architecture 제안에 대해 심도 있게 다룹니다. [A Pipelined FFT Architecture for Real-Valued Signals](https://ieeexplore-ieee-org-ssl.webgate.khu.ac.kr/document/4799153)

---

## Conjugate Symmetry

{% include image.html url="https://user-images.githubusercontent.com/120978778/212918653-91f369d2-59d3-487c-bc1b-faca86923b65.png" text="Figure 1. 일반적인 DFT 수식" id="figure-1" %}

[`Figure 1`](#figure-1)은 일반적으로 알려진 이산 푸리에 변환(DFT) 수식입니다. 이때, 시스템의 입력이 실수(Real value)일 경우 다음 식이 성립합니다.

{% include image.html url="https://user-images.githubusercontent.com/120978778/212919161-d63d9b35-af34-4606-8168-4829c51533c1.png" text="Figure 2. 실수 입력 시 성립하는 Conjugate Symmetry 수식" id="figure-2" %}

[`Figure 2`](#figure-2)의 식은 회전 인자(Twiddle factor)의 주기성에 의해 원래의 DFT 식에 $X[N-k]$와 $X^*[k]$를 대입하면 수학적으로 쉽게 증명됩니다.

---

## RFFT Flow chart

본 논문에서는 Conjugate Symmetry에 근거하여 RFFT(Real Fast Fourier Transform) 알고리즘으로 제안되었던 기존 방법들을 소개하고 그 한계점을 지적합니다. 본 포스팅에서는 해당 알고리즘 자체보다는 제안된 RFFT Flow chart의 최적화 과정에 집중합니다.

Conjugate Symmetry의 결론에 따르면, 출력단에서 $\frac{N-2}{2}$개의 데이터는 서로 대칭을 이룹니다. RFFT 하드웨어 설계의 핵심은 바로 이 출력의 절반에 해당하는 중복 연산을 Flow chart에서 제거하는 것입니다. 관건은 살릴 절반과 제거할 절반을 어떻게 선택하느냐인데, 기존 연구들은 살릴 절반 $k$를 $[0, N/2]$ 혹은 $[0, N/4] \cup [N/2, 3N/4]$ 구간으로 선택했습니다.

{% include image.html url="https://user-images.githubusercontent.com/120978778/212921607-564e5b51-c3b5-4b1c-80b7-491ab4e9390a.png" text="Figure 3. DIF의 일반적인 Flow chart" id="figure-3" %}

[`Figure 3`](#figure-3)은 주파수 솎음(DIF, Decimation-in-Frequency) 방식의 일반적인 Flow chart입니다. 앞서 언급한 방식대로 구간을 설정하여 선택되지 않은 나머지 출력을 지우고 연결된 선들을 제거해 보더라도, 실제로 하드웨어 상에서 제거되는 영역의 크기는 그리 크지 않습니다. 본 논문은 이 비효율성에 주목했습니다.

최대한 많은 연산 영역을 지우기 위해 단순히 Flow chart를 물리적으로 반으로 나누는 것은 불가능합니다. 다시 Flow chart의 출력단을 살펴보면, 인덱스 0과 8은 Conjugate Symmetry 쌍이 아닙니다. 4의 대칭은 12이고, 2와 10의 대칭은 14와 6입니다. 또한 1, 9, 5, 13의 대칭은 15, 7, 11, 3이 됩니다. 로그 스케일(Logarithmic) 규칙에 따라 대칭 쌍의 개수가 늘어남을 알 수 있습니다. 따라서 Logarithmic 규칙에 따라 선택적 제거를 수행해야 최대한 많은 면적(Area)을 줄일 수 있습니다.

{% include image.html url="https://user-images.githubusercontent.com/120978778/212924558-356bfad7-8c21-43c9-a9bc-331b189490c6.png" text="Figure 4. Logarithmic 기준으로 불필요한 연산을 지운 Flow chart" id="figure-4" %}

[`Figure 4`](#figure-4)는 Logarithmic 방식으로 불필요한 부분을 지워낸 Flow chart입니다. 저자는 여기서 멈추지 않고 회전 인자의 주기성을 활용하여 구조를 한 번 더 최적화합니다.

{% include image.html url="https://user-images.githubusercontent.com/120978778/212925778-0bf8572d-ca07-4668-9e6d-507588cb0037.png" text="Figure 5. 2번째 Stage 출력 수식" id="figure-5" %}

위 식에서 $i \in \{0, 1, 2, 3\}$이며, 좌변은 두 번째 Stage의 출력을 의미합니다. 이때 다음 수식이 성립합니다.

{% include image.html url="https://user-images.githubusercontent.com/120978778/212928831-8255b2cf-e696-4679-82a5-aada36a7961c.png" text="Figure 6. Twiddle factor의 주기성 적용" id="figure-6" %}

이 식에 따라 $X_2$의 수식은 다음과 같이 변형됩니다.

{% include image.html url="https://user-images.githubusercontent.com/120978778/212930665-656687c7-0318-4cdf-8fc2-f2f799ca7f41.png" text="Figure 7. 변형된 X_2 수식" id="figure-7" %}

이를 통해 회전 인자를 곱하는 복소 연산이 한 번 줄어듭니다. 허수 단위 $j$를 곱하는 것은 값의 크기 변화 없이 실수부(Real value)를 허수부(Imaginary value)로 전환하는 물리적 의미만을 갖습니다. 저자는 이 특성을 이용하여 Flow chart를 다음과 같이 최종 변형합니다.

{% include image.html url="https://user-images.githubusercontent.com/120978778/212931371-5fdf55c9-062f-481a-a17c-b6d941057eed.png" text="Figure 8. Imaginary path를 분리한 최종 Flow chart" id="figure-8" %}

넘버링이 된 박스의 상단 라인은 실수(Real value)를, 하단 라인은 허수(Imaginary value)를 의미합니다. 박스 안의 숫자는 두 입력에 곱해질 회전 인자의 지수(Exponent)입니다. Conjugate Symmetry에 의해 제거된 부분을 잉여 자원인 허수 경로(Imaginary path)로 맵핑하는 창의적인 접근을 보여줍니다. 이 논문이 학계의 주목을 받은 이유는, 제안된 하드웨어 아키텍처 자체의 우수성보다도 이러한 최적화된 Flow chart를 논리적으로 유도해 내는 과정에 있습니다.
 
---

## Pipelined RFFT Architecture

완성된 RFFT Flow chart는 일반적인 형태의 Butterfly 연산기, 2종류의 제어 박스, 그리고 별도 연산 없이 패스(Passing)되는 경로로 구성됩니다. 본 논문은 이를 하드웨어로 구현하기 위해 다음과 같은 파이프라인 아키텍처를 제안합니다.

{% include image.html url="https://user-images.githubusercontent.com/120978778/212939827-ef84f534-9586-4c6f-aceb-0a285a0bdc80.png" text="Figure 9. 제안된 Pipelined RFFT Architecture" id="figure-9" %}

[`Figure 9`](#figure-9)에서 R2는 멀티플렉서(Mux) 제어에 의해 일반 Butterfly 연산과 단순 패싱을 선택적으로 수행합니다. ROTATOR는 허수부에 $-1$을 곱한 뒤 회전 인자를 연산하는 모드와, 단순히 회전 인자만 연산하는 모드를 Mux로 선택하여 수행합니다.

또한, Stage 2 이후에는 2개의 Mux와 FIFO 버퍼로 구성된 `Shuffling Structure`가 삽입됩니다. 이는 스테이지가 진행됨에 따라 Butterfly의 Stride가 변하는 메모리 접근 패턴에 대응하기 위해 고안된 회로입니다. Stage 2와 3 사이의 Shuffling 동작은 다음과 같이 일어납니다.

{% include image.html url="https://user-images.githubusercontent.com/120978778/212940889-ef8b8057-91f7-46bb-a611-39349ecad2e3.png" text="Figure 10. Shuffling Structure 동작 구조" id="figure-10" %}

본 논문에서는 Selection 신호의 구체적인 발생 조건(Control Logic)을 명시하지 않았으나, 이 논문을 기반으로 파생된 후속 연구들에서 해당 제어 조건들이 보완되어 제시되었습니다.

{% include image.html url="https://user-images.githubusercontent.com/120978778/212941469-56f06192-88c1-431c-ad34-deac2958534a.png" text="Figure 11. 전체 Flow 조건을 만족시키기 위한 제어 타이밍도" id="figure-11" %}

[`Figure 11`](#figure-11)은 논문의 구조를 검증하기 위해 직접 재구성해 본 Flow 타이밍도입니다. 출력 인덱스를 살펴보면 0~7은 순차적으로 출력되지만, 8, 9, 12, 13과 10, 11, 14, 15는 순서가 뒤섞여 출력됨을 알 수 있습니다. 저자는 논문에서 모든 데이터가 순차 출력된다고 서술하였으나 이는 명백한 오류로 보이며, 하단의 마지막 Shuffling Structure 앞에 스위치를 추가하여 10, 11과 12, 13을 명시적으로 교환(Switching)해 주어야 순차 출력 문제를 해결할 수 있습니다.

---

## Limitation

본 아키텍처는 혁신적인 접근에도 불구하고 구현상 꽤나 치명적인 한계점들을 내포하고 있습니다.

1. **제어 로직의 부재:** 앞서 언급한 바와 같이 R2와 ROTATOR의 세부 구조, Shuffling Structure의 Selection 신호 조건 등 전반적인 제어 로직이 제대로 기술되지 않았습니다.
2. **비대칭적 경로 구조:** Flow chart가 중간을 기준으로 비대칭적인 구조를 가지므로, 하드웨어 면적을 최소화하기 위한 단일 경로(Single path) 아키텍처로 구현하는 데 근본적인 어려움이 있습니다.
3. **메모리 인덱싱의 난해함 (가장 치명적):** 허수 경로를 별도로 분리함에 따라, CFFT에서 DIF는 출력 측이, DIT는 입력 측이 규칙적으로 Bit-reverse 되던 고유의 패턴이 붕괴되었습니다. 예를 들어, $X[3]$을 연산하기 위해서는 대칭 쌍인 $X[13]$을 선택하여 $R_{13}$과 $I_{13}$을 동시에 꺼내야 합니다. 그러나 $R_{13}$은 13번 사이클에, $I_{13}$은 15번 사이클에 출력되며, $X[0]$과 $X[N/2]$는 실수부만 갖기 때문에 데이터를 읽어오는(Read) 타이밍 패턴을 일반화하기가 불가능에 가깝습니다. 이를 해결하기 위해 메모리 버퍼를 추가하면 시스템 오버헤드가 기하급수적으로 증가합니다.
4. **회전 인자 생성 로직 누락:** ROTATOR에 사용되는 회전 인자의 지수(Exponent) 생성 조건 역시 명확히 일반화되지 않았습니다.

결론적으로, 파이프라인 아키텍처가 실시간(Real-time) 처리에 강력한 이점을 제공함에도 불구하고, 포인트(N) 수가 커짐에 따라 면적 오버헤드가 급격히 증가하며 메모리 Read 패턴이 일반화되지 않는 한 실제 산업계 적용에는 큰 제약이 따르는 구조입니다.

---

## Appendix

본 논문의 Appendix에서는 DIT(Decimation-in-Time) RFFT Flow chart에 대한 흥미로운 통찰을 제공하고 있습니다.

{% include image.html url="https://user-images.githubusercontent.com/120978778/212948549-9e167567-74aa-48d6-8106-85a414e807f7.png" text="Figure 12. DIT RFFT Flow chart" id="figure-12" %}

기존에 알려진 DIT 구조는 DIF와 대칭적인 형태(입력 측이 Bit-reverse)를 띱니다. 그러나 [`Figure 12`](#figure-12)와 같이 DIF와 시각적으로 동일한 뼈대를 사용하되, 회전 인자가 곱해지는 위치만 변경하여 DIT를 표현할 수 있습니다. 첫 Stage에서 0번과 8번 인덱스가 교차해야 한다는 본질적인 규칙만 충족한다면, 입력 데이터 순서를 재배치하여 동일한 Flow를 사용할 수 있다는 유용한 설계 관점을 제시합니다.

또한, 출력단에서 어그러진 Bit-reverse 패턴을 복구하는 메커니즘도 부록으로 다룹니다. 완성된 Flow chart는 실수/허수 경로가 분리되어 출력 순서가 복잡해지지만, 허수 경로를 분리하기 전 절반만 잘라낸 초기 Flow chart를 기준으로 재정렬을 수행하면 일관된 패턴을 찾을 수 있습니다.

{% include image.html url="https://user-images.githubusercontent.com/120978778/212954603-b651315e-0254-400b-b961-9736c92261ad.png" text="Figure 13. 32-point 출력 절반 선택 Flow chart 예시" id="figure-13" %}

[`Figure 13`](#figure-13)은 32-point 구조의 예시입니다. 출력 주파수가 16을 초과하는 숫자들은 모두 16을 빼서 정렬 순서(Order)를 0부터 16까지로 정규화합니다. 이후 도식화된 화살표를 따라가면 출력 결과가 자연스럽게 Bit-reverse 된 형태로 떨어지게 됩니다.

{% include image.html url="https://user-images.githubusercontent.com/120978778/212955652-cd464efa-1d58-4872-b233-871c2a29526e.png" text="Figure 14. Bit-reverse 재정렬 동작의 시각화" id="figure-14" %}

이를 명확히 재표현한 것이 [`Figure 14`](#figure-14)입니다. 데이터가 1칸 또는 2칸 단위로 교차되는 패턴을 띠는데, 이는 $L=1$, $L=2$, $L=2$, $L=1$ 크기의 Shuffling Structure를 직렬로 이어 붙인 후, 적절한 Selection 제어 신호를 인가함으로써 완벽하게 정렬된 출력을 얻어낼 수 있음을 입증합니다.