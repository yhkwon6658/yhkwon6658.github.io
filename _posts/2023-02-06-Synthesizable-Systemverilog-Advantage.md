---
layout: post
title: "Synthesizable SystemVerilog Design을 위한 이점과 활용"
author: "Yonghwan Kwon"
tags: "Archive"
comments: true
excerpt_separator: ---
---

과거에 작성했던 게시글 중 markdown이 남아있는 글들을 복원하고 있습니다.
SystemVerilog는 흔히 검증(Verification)을 위한 언어로 인식되는 경향이 있으나, 하드웨어 합성(Synthesis) 측면에서도 기존 Verilog 대비 강력한 이점을 제공합니다. 2005년을 기점으로 Verilog의 IEEE 1364 규약은 SystemVerilog의 IEEE 1800 규약으로 통합되었습니다. 즉, 현대의 설계 환경에서 Verilog는 SystemVerilog의 부분집합으로 이해하는 것이 타당합니다. 

SystemVerilog를 설계에 도입하면 Functional Coding에 있어 코드의 길이를 획기적으로 줄일 수 있으며, `Package`와 `Interface`, `Generate` 구문을 조합하여 설계 자동화 및 모듈화에 크게 기여할 수 있습니다. 또한 Verilog에서 컴파일러가 버그로 판별하지 못하고 묵인하던 모호한 구문들을 에러로 인식하게 함으로써, Synthesis와 Simulation 간의 불일치를 줄이는 데 탁월한 효과를 발휘합니다. 본 포스트에서는 하드웨어 설계 시 유리하게 활용할 수 있는 SystemVerilog의 주요 특징과 문법들을 정리합니다.

---

## 1. Simulation을 위한 bit, Design을 위한 logic
SystemVerilog에 도입된 새로운 데이터 타입 중 대표적인 것이 `bit`와 `logic`입니다.
* `bit`: 2-state variable로 0과 1의 값만을 가집니다.
* `logic`: 4-state variable로 0, 1, X, Z 값을 가질 수 있습니다.

`logic`은 기존 Verilog의 `wire`와 `reg`를 모두 대체하여 사용할 수 있습니다. 즉, 설계자는 포트나 내부 신호를 선언할 때 `wire`로 선언할지 `reg`로 선언할지 더 이상 고민할 필요가 없으며, 이는 코드가 복잡해질 때 발생할 수 있는 인적 오류(Human Error)를 방지하는 데 큰 도움이 됩니다. 

주의할 점은 `bit`가 0과 1만을 갖는다는 것은 Simulation 단계에 국한된 특성이라는 것입니다. Synthesis 툴은 하드웨어의 물리적 특성을 반영하여 이를 4-state variable로 간주하고 로직을 합성합니다.

---

## 2. enum의 활용
SystemVerilog에 추가된 `enum`은 가독성을 높이고 코드 길이를 단축하는 데 매우 유용합니다.

```verilog
enum {WAITE, LOAD, DONE} State;
```
위와 같이 type과 length를 생략할 경우, `enum`은 기본적으로 `int` (2-state, 32-bits) 타입으로 지정됩니다. 그러나 합성 시에는 4-state로 인식된다는 점을 유의해야 합니다. (참고로 SystemVerilog에는 4-state인 `integer`와 구분되는 2-state `int` 형식이 존재합니다.)

합성을 고려한 가장 명시적이고 일반적인 코딩 스타일은 다음과 같습니다.
```verilog
enum logic [2:0] {WAITE, LOAD, DONE} State;
```
위 선언에서 WAITE, LOAD, DONE은 순서대로 0, 1, 2의 값을 가집니다. 물론 아래와 같이 값을 직접 지정하는 것도 가능합니다.

```verilog
enum logic [2:0] {WAITE = 3'b100, LOAD = 3'b010, DONE = 3'b001} State;
```

기존 Verilog에서는 State Machine을 구현할 때 `localparam`을 나열해야 했으나, `enum`을 사용하면 코드가 훨씬 간결해집니다. 또한 Simulation 파형(Waveform)을 확인할 때, State 값이 단순한 바이너리가 아닌 WAITE, LOAD, DONE 등의 명시적인 텍스트로 바로 표기되므로 디버깅 효율이 크게 향상됩니다.

---

## 3. typedef (User-Defined-Type)
SystemVerilog는 C 언어의 `typedef`와 같은 User-Defined-Type (UDT)을 지원합니다. UDT는 `enum`, `struct`와 결합되어 설계를 구조화하는 데 핵심적인 역할을 합니다.

```verilog
typedef logic [31:0] bus32_t;
typedef enum logic [0:0] {FALSE, TRUE} bool_t;

module mod1 (
    input bus32_t a, b,
    output bool_t aok
);
// 모듈 내부 구현
endmodule
```

이러한 `typedef` 선언은 이후에 설명할 `struct` 및 `package`와 함께 사용될 때 모듈 간 인터페이스를 극도로 깔끔하게 만들어 주는 시너지를 발휘합니다.

---

## 4. struct
SystemVerilog는 신호들을 그룹화할 수 있는 구조체(`struct`)를 지원합니다. `struct`는 내부적으로 다른 `struct`를 중첩하여 포함할 수 있으며, 모듈의 포트나 내부 변수를 선언할 때 유용하게 활용됩니다.

아래는 `typedef`로 선언한 구조체를 파라미터화(Parameterizable)하여 사용하는 예시입니다.

```verilog
localparam N = 8; 

typedef struct {
    logic [N-1:0] a;
    logic [N-1:0] b;
} packet_s;

module top (
    input clk,
    input rst,
    output logic [N-1:0] c
);

packet_s p1;

always_ff @(posedge clk) begin
    if(rst) p1 <= '{default: 0}; // 구조체 내 모든 변수를 0으로 초기화
    else    p1 <= '{0, 1};       // a에 0, b에 1 할당
end

core u_core (.*); // 이름이 동일한 모든 포트를 자동 연결(Implicit Port Connection)

endmodule

module core (
    input packet_s p1,
    output logic [N-1:0] c
);

assign c = p1.a ^ p1.b;

endmodule
```

---

## 5. package
SystemVerilog가 제공하는 가장 강력한 설계 구조화 도구 중 하나는 `package`입니다. 복잡한 시스템을 다수의 엔지니어가 분업하여 설계할 때, 공통으로 사용될 파라미터나 포트 구조를 사전 정의하지 않으면 치명적인 호환성 문제가 발생합니다. `package`는 이러한 글로벌 정의들을 하나로 묶어 관리합니다.

`package` 내부에 포함할 수 있는 요소는 다음과 같습니다.
1. `parameter`, `localparam`
2. `const` 변수
3. `typedef` UDT (`enum`, `struct` 등)
4. `automatic task`, `function` (단, 함수/태스크는 Interface에 묶어 역할을 분리하는 기법도 널리 쓰입니다.)

### Package 정의 및 사용 예시

`package.sv`
```verilog
package TABLE;
    parameter N = 8;
    parameter L = 32;

    typedef logic [N-1:0] bus_t;
    typedef enum logic [1:0] {IDLE, ADDR, CAL, DONE} state_t;

    typedef struct {
        logic [L-1:0] signal_0;
        logic [L-1:0] signal_1;
    } signal_s;
endpackage
```

`core1.sv` (Wildcard Import 활용)
```verilog
module core1 import TABLE::*; 
(
    input bus_t a, b,
    input signal_s signals
);

state_t PS;

always_ff @(posedge clk) begin : STATE_BLOCK
    if(rst) begin : RESET_CODE
        // 리셋 처리
    end : RESET_CODE
    else begin
        case(PS)
        IDLE : begin : IDLE_STATE
            // 상태 처리 로직
        end : IDLE_STATE
        // 기타 상태 생략
        endcase
    end
end : STATE_BLOCK

endmodule : core1
```
> **Tip:** SystemVerilog에서는 `begin ... end`, `module ... endmodule` 등 Block 요소에 이름을 지정할 수 있습니다. 복잡한 조건문이 중첩될 때 이를 명시하면 코드의 가독성을 높이고 실수를 방지할 수 있습니다.

`core2.sv` (Explicit Import 및 Reference 활용)
```verilog
module core2
import TABLE::signal_s; // 특정 Item만 Import
(
    input TABLE::bus_t a, b, // Import 없이 명시적 참조(Explicit Reference)
    input signal_s signals
);

TABLE::state_t PS;

endmodule : core2
```
> **주의사항:** 패키지를 참조하는 모듈을 컴파일하기 위해서는 패키지 파일(`package.sv`)이 반드시 **먼저 컴파일(Pre-compile)** 되어 있어야 계층(Hierarchy) 충돌이 발생하지 않습니다.

---

## 6. Special Procedural Blocks
기존 Verilog에서는 조합 논리회로(Combinational Logic)와 순차 논리회로(Sequential Logic)를 모두 `always` 블록으로 모델링했습니다. 특히 조합 회로의 경우 민감도 목록(`@*`) 누락이나 의도치 않은 래치(Latch) 추론으로 인해 합성과 시뮬레이션 결과가 틀어지는 버그가 빈번하게 발생했습니다.

SystemVerilog는 설계자의 의도를 합성 툴에 명확히 전달하기 위해 특화된 Procedural Block을 도입했습니다.
1. `always_ff @(posedge clk)`: 순차 논리회로 (Flip-Flop 모델링)
2. `always_comb`: 조합 논리회로. 민감도 목록을 자동으로 추론하며, 내부 로직에 의해 래치가 발생할 경우 툴이 즉각적인 에러/경고를 출력합니다.
3. `always_latch`: 명시적인 래치 모델링 블록. 

합성 가능한 코드 작성 시 가장 권장되는 방식은 조합 회로에 `always_comb`를 사용하여 의도치 않은 래치 생성을 컴파일 단계에서 원천 차단하는 것입니다.

---

## 7. case ... inside의 강력함
기존 Verilog의 `casex`는 X-Propagation(X 상태가 시스템 전체로 전파되는 현상)을 유발할 수 있어 합성 가능한 설계에서는 사용이 금지되는 것이 일반적입니다. 대안으로 사용되는 `casez`의 경우 Z를 Don't Care로 처리하지만, 양방향(Symmetric) 마스킹을 수행한다는 치명적인 단점이 있습니다. 

즉, `casez`는 조건 항목(Item)의 Z뿐만 아니라 **입력 신호(Selector)로 들어오는 Z 상태 역시 Don't Care로 취급**합니다. 만약 회로 단선(Open Circuit) 등으로 인해 입력에 Z가 인가될 경우, 시스템은 에러를 발생시키지 않고 조건이 일치한 것으로 오판하여 동작해버리는 심각한 논리적 오류를 초래합니다.

이를 완벽하게 해결하기 위해 도입된 문법이 **`case ... inside`** 입니다.

### case ... inside의 비대칭(Asymmetric) 마스킹 기능
`case ... inside`는 조건 항목(RHS)에 있는 `?`나 `Z`는 Don't Care로 처리하지만, 입력 신호(LHS)로 들어오는 `X`나 `Z`는 절대 Don't Care로 처리하지 않습니다(Asymmetric Masking). 따라서 입력 오류로 인한 맹목적인 조건 매칭을 방지합니다.

```verilog
module test2 (
    input [2:0] sel,
    output logic a, b, c
);

always_comb begin
    {a, b, c} = 3'b000;
    case(sel) inside
        3'b1?? : a = 1'b1;
        3'b?1? : b = 1'b1;
        3'b??1 : c = 1'b1;
        default : {a,b,c} = 3'b000;
    endcase
end
endmodule
```

### 파라미터 범위를 활용한 조건 간소화
`case ... inside`의 또 다른 강력한 기능은 **범위(Range) 매칭**입니다. 다수의 조건을 묶어서 처리해야 할 때 코드를 극적으로 간소화할 수 있습니다.

```verilog
module test3(
    input [4:0] sel_state,
    output logic [4:0] next_state
);

always_comb begin
    case(sel_state) inside
        [0 : 15] : next_state = sel_state + 1;
        [16 : 31] : next_state = 0;
        default  : next_state = 'x; // 안전을 위해 default 정의
    endcase
end
endmodule
```

---

## 8. priority와 unique
`always_comb` 내에서 `case` 구문을 사용할 때 발생할 수 있는 주요 문제점은 다음과 같습니다.
1. 의도치 않은 래치(Latch) 발생
2. 다중 조건의 동시 만족 (Multiple Hits)
3. 만족하는 조건도 없고 `default` 구문도 없는 경우 (Missing Default)

SystemVerilog는 설계자의 명시적 의도를 툴에 전달하고 예기치 않은 오류 검출을 강화하기 위해 `priority`와 `unique` 키워드를 제공합니다.
* `priority`: 조건 중 하나 이상이 반드시 매칭됨을 선언합니다. (Missing Default 에러 발생)
* `unique`: 조건이 단 하나만 매칭되며 동시에 여러 개가 매칭되지 않음을 선언합니다. (Multiple Hits 및 Missing Default 에러 발생)

이는 설계자가 '완벽한 분기 처리를 했다'고 판단할 때 사용하며, 시뮬레이션 단계에서 실수로 조건이 누락되거나 중복되었을 때 경고 메시지를 출력해주어 버그를 조기 차단하는 데 큰 역할을 합니다. 단, 이 키워드들은 래치 생성을 물리적으로 막아주지는 않으므로 **조건문 진입 전 변수를 기본값으로 초기화**하는 습관을 들이는 것이 가장 안전합니다.

---

## 9. void function의 활용
과거 Verilog 기반 설계에서는 반복적인 조합 회로를 모듈화하기 위해 주로 `task`를 사용했습니다. Verilog의 `function`은 리턴 값을 하나만 가질 수 있고 `output`이나 `inout` 포트를 사용할 수 없었기 때문입니다. 하지만 합성 툴에서 `task` 처리는 종종 예기치 않은 문제를 발생시키곤 했습니다.

SystemVerilog에서는 **리턴 값이 없는 `void function`**의 선언이 가능해졌으며, 함수 내부에서도 `output` 및 `inout` 포트를 자유롭게 정의할 수 있게 되었습니다. 이를 통해 합성 툴에 친화적이면서도 `task`를 대체할 수 있는 조합 회로 모듈화가 가능합니다.

```verilog
function void f_add (
    input [31:0] a,
    output logic [31:0] b, c
);
    automatic int i = 1; 
    const automatic int j = 1; 

    i = i + 1;
    b = a + i;
    c = a + j;
endfunction

module test4 (
    input [31:0] a,
    output logic [31:0] b, c 
);

always_comb begin
    f_add(a, b, c);
end
endmodule
```
> **핵심 원칙:** SystemVerilog는 C언어와 반대로 변수 선언 시 기본적으로 정적(Static) 수명을 가집니다. 따라서 함수 호출 시마다 지역 변수가 독립적으로 초기화되고 할당되도록 하려면, 변수 선언 시 반드시 **`automatic`** 키워드를 명시해야 합니다. 조합 회로를 모델링하기 위한 함수 내부 변수는 항상 `automatic`으로 선언하는 것을 권장합니다.

---

## 10. Interface
Interface는 설계의 모듈 간 연결 포트(Port)와 통신 프로토콜 관련 신호들을 추상화하여 하나로 묶는 강력한 기능입니다. 패키지(Package)가 전역 파라미터나 타입을 공유한다면, 인터페이스는 신호 다발과 해당 신호들을 조작하는 함수(`function`)를 번들링하는 역할을 합니다. 인터페이스 내부에 선언된 함수 역시 변수에 `automatic`을 지정하여 의도치 않은 상태 보존을 방지해야 합니다.

`interface.sv`
```verilog
interface test_if;
    import param_pk::N;

    function void f_add (
        input logic [N-1:0] a,
        output logic [N-1:0] b, c
    );
        automatic int i = 1; 
        const automatic int j = 1; 

        i = i + 1;
        b = a + i;
        c = a + j;
    endfunction
endinterface 
```

`test5.sv` (인터페이스를 포트로 사용)
```verilog
module test5 import param_pk::N;
(
    input logic [N-1:0] a,
    output logic [N-1:0] b, c
);
    
    test_if itf();

    always_comb begin
        itf.f_add(a, b, c);
    end
endmodule
```

실제 PYNQ-Z2 FPGA 위에 상기 코드를 합성 및 구현한 결과는 다음 이미지들과 같습니다.

{% include image.html url="https://user-images.githubusercontent.com/120978778/216857583-140e6b76-b8e9-4a19-b57c-c4ee6d6a72ef.png" text="Figure 1. Hierarchy View" id="figure-1" %}

계층(Hierarchy) 구조를 살펴보면 인스턴스화된 `test5` 모듈만이 표시됨을 확인할 수 있습니다.

{% include image.html url="https://user-images.githubusercontent.com/120978778/216857843-e2f4cab5-344d-465a-a8f6-fdddaab9efe0.png" text="Figure 2. Libraries View" id="figure-2" %}

`package`와 `interface`는 물리적인 모듈 인스턴스가 아니므로 Libraries 영역에 독립적으로 할당되어 참조됩니다.

{% include image.html url="https://user-images.githubusercontent.com/120978778/216858175-771adbc7-f665-4534-a2a7-5cbe84173459.png" text="Figure 3. Implementation Schematic" id="figure-3" %}

최종 Implementation을 거친 Schematic입니다. 컴파일러에 의해 논리가 정상적으로 로직 게이트로 변환되었음을 증명합니다.

---

## 11. generate 구문의 간소화
설계의 자동화를 위해 `generate` 블록을 사용할 때, SystemVerilog는 기존 Verilog-2005에 비해 훨씬 직관적이고 간소화된 문법을 지원합니다. `genvar` 변수를 이용한 `for` 루프를 구성할 때 `generate ... endgenerate` 키워드를 명시하지 않아도 컴파일러가 이를 자동 추론합니다.

```verilog
module test6 (
    input [2:0] a [0:2],
    input [2:0] b [0:2],
    output logic [2:0] c
);

logic [2:0] w [0:2];

genvar i;
// generate ... endgenerate 생략 가능
for (i = 0; i < 3; i++) begin : AND_LOOP
    always_comb w[i] = a[i] & b[i];
    // 또는 모듈 인스턴시에이션
    // and_3bit u_and_3bit (a[i], b[i], w[i]);
end
    
int I;
always_comb begin
    c = w[0];
    for (I = 1; I < 3; I++) begin
        c = c ^ w[I];
    end
end
endmodule
```
이처럼 간결화된 구조는 모듈 인스턴시에이션이나 연속 할당문(Continuous Assignment)의 반복 전개를 훨씬 수월하게 만들어 코드의 유지보수성을 극대화합니다.

---

## 12. 맺음말
본 포스트에서 다루지 않은 각종 System Task나 Assertion 등의 세부적인 기법들은 추후 별도의 포스팅을 통해 새롭게 정리하여 공유할 예정입니다.