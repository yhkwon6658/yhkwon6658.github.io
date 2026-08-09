---
layout: post
title: "Windows 환경의 무료 SystemVerilog 컴파일러 및 시뮬레이터 활용 가이드"
author: "Yonghwan Kwon"
tags: "Archive"
comments: true
excerpt_separator: ---
---

과거에 작성했던 게시글 중 markdown이 남아있는 글들을 복원하고 있습니다. 

Verilog에서 SystemVerilog로 넘어가는 과정에서, Windows 로컬 환경을 지원하는 적절한 무료 컴파일러와 시뮬레이터를 구성하는 것은 매우 중요합니다. 이 글에서는 가장 범용적으로 접근할 수 있는 **Xilinx Vivado**와 **ModelSim (Intel FPGA Starter Edition)**을 활용하여 CLI 환경에서 SystemVerilog를 컴파일하고 시뮬레이션하는 방법을 소개합니다.

오픈소스인 Icarus Verilog의 경우 `-g2012` 플래그를 통해 SystemVerilog를 일부 지원하지만 완전하지 않으며, Verilator는 성능이 강력한 대신 C++ 변환 등 초기 설정의 허들이 존재합니다. 따라서 상용 툴의 무료 버전을 활용하는 것이 학습 및 검증 목적에서 가장 안정적인 선택이 될 수 있습니다.

---

## 1. Xilinx Vivado 활용하기

Vivado는 많은 개발자의 로컬 환경에 기본적으로 설치되어 있어 접근성이 뛰어납니다. GUI 환경은 무거울 수 있으므로, 효율적인 작업을 위해 터미널(CLI) 명령어를 적극 활용하는 것을 권장합니다.

### 1.1 환경 변수 설정
터미널에서 Vivado의 컴파일러와 시뮬레이터를 바로 호출하기 위해 환경 변수를 등록해야 합니다.

1. **Windows 설정** - **시스템 환경 변수 편집** - **환경 변수**로 이동합니다.
2. 사용자 변수의 `Path`를 편집하여 Vivado의 bin 폴더 경로를 추가합니다.
   * 예시 경로: `C:\Xilinx\Vivado\2020.2\bin` (설치된 버전에 맞게 수정)

### 1.2 테스트용 SystemVerilog 코드 작성
간단한 메모리 모듈과 테스트벤치 코드를 작성합니다.

**`mem.sv`**
```verilog
module mem #(
    parameter 
    width = 32,
    addr_bits = 8,
    height = 256
) (
    input i_clk,
    input i_en,
    input [width-1:0] i_data,
    input [addr_bits-1:0] i_addr,
    output logic [width-1:0] o_data
);

// Variables
logic [width-1:0] mem [0:height-1];

// Initialization
initial begin
    for(int i=0; i<height; i=i+1) begin
        mem[i] = 0;
    end
end

// Design
always_ff @(posedge i_clk) begin : memory
    if(i_en) begin
        mem[i_addr] <= i_data;
    end
    else begin
        o_data <= mem[i_addr];
    end
end
endmodule
```

**`mem_tb.sv`**
```verilog
`timescale 1ns/1ns
`include "mem.sv"

`define width 32
`define addr_bits 8
`define height 256

module tb();
logic i_clk;
logic i_en;
logic [`width-1:0] i_data;
logic [`addr_bits-1:0] i_addr;
wire [`width-1:0] o_data; // net out must be wire

// Instantiation
mem #(`width, `addr_bits, `height) 
u_mem (i_clk, i_en, i_data, i_addr, o_data);

// Initialization
initial begin
    i_clk = 0;
    i_en = 0;
    i_data = 0;
    i_addr = 0;
end

// Clock generation
always #5 i_clk = ~i_clk; // 100MHz

// Testbench
initial begin
    $display("time\ti_en\ti_data\ti_addr\to_data");
    $monitor("%0t\t%0b\t%0d\t%0d\t%0d",$time, i_en, i_data, i_addr, o_data);
    i_en = 1;
    i_data = 128;
    i_addr = 3;
    #10;
    i_en = 0;
    #50;
    $finish;
end

endmodule
```

### 1.3 CLI 컴파일 및 시뮬레이션

VS Code 등의 터미널(PowerShell 또는 CMD)을 열고 다음 명령어를 순서대로 실행합니다.

**터미널 로그만 모니터링할 경우:**
```bash
xvlog -sv mem_tb.sv
xelab -R tb
```
* `xvlog`: SystemVerilog(`-sv`) 코드를 파싱합니다. (`mem_tb.sv` 내부에 `` `include ``가 있으므로 타겟 파일만 지정하면 됩니다.)
* `xelab`: Elaboration을 수행하고 지정된 Top 모듈(`tb`)을 실행(`-R`)합니다.

**Waveform(파형)을 확인하고 싶을 경우:**
```bash
xvlog -sv mem_tb.sv
xelab --debug wave tb
xsim -g tb
```
명령어를 실행하면 [`Figure 1`](#figure-1)과 같이 Vivado 시뮬레이션 GUI 창이 호출됩니다.

{% include image.html url="https://user-images.githubusercontent.com/120978778/215289481-d5252df7-7932-48b6-9451-966fd0541a7e.png" text="Figure 1. Vivado 시뮬레이션 GUI 창" id="figure-1" %}

상단의 **File - Simulation Waveform - New Configuration**을 선택합니다. ([`Figure 2`](#figure-2))

{% include image.html url="https://user-images.githubusercontent.com/120978778/215290055-db9a368b-560d-44b9-a85c-7e9eb1e0273c.png" text="Figure 2. New Configuration 추가" id="figure-2" %}

이후 Objects 패널에서 확인하려는 신호를 우클릭하여 **Add to Wave Window**를 클릭합니다. ([`Figure 3`](#figure-3))

{% include image.html url="https://user-images.githubusercontent.com/120978778/215290146-c3a29b56-f638-4aa1-b3a8-50019547cf5e.png" text="Figure 3. 확인하려는 신호를 Wave Window에 추가" id="figure-3" %}

단축키 `F3`을 눌러 시뮬레이션을 실행(Run)하면 [`Figure 4`](#figure-4)와 같이 파형을 확인할 수 있습니다.

{% include image.html url="https://user-images.githubusercontent.com/120978778/215290184-12f963b0-1c88-43ef-a045-80001c76001e.png" text="Figure 4. 최종 Waveform 결과" id="figure-4" %}

### 1.4 시뮬레이션 부산물 정리(Clean)
Vivado CLI를 사용하면 디렉터리에 다수의 로그 및 중간 산출물 파일이 생성됩니다. PowerShell 기준으로 다음 명령어를 사용하여 불필요한 부산물을 한 번에 정리할 수 있습니다.

```powershell
rm *xsim*, *webtalk*, *wdb*, *xelab*, *xvlog*, *Xil*
```

---

## 2. ModelSim (Intel FPGA Starter Edition) 활용하기

Vivado 환경이 무겁거나 다른 대안이 필요하다면, Intel Quartus Prime Lite Edition에 무료로 포함되어 제공되는 **ModelSim-Intel FPGA Starter Edition** (또는 Questa)을 활용할 수 있습니다. 이 버전은 별도의 라이선스 등록 없이도 기본적인 SystemVerilog 컴파일 및 시뮬레이션을 훌륭하게 지원하며, 컴파일 진입 속도가 매우 경쾌하다는 장점이 있습니다.

### 2.1 테스트용 SystemVerilog 코드 작성

**`add4.sv`**
```verilog
module add4 (
    input [7:0] din [0:3],
    output [7:0] dout
);

assign dout = din[0] + din[1] + din[2] + din[3];
    
endmodule
```

**`tb.sv`**
```verilog
`timescale 1ps/1ps

module tb();

logic [7:0] din [0:3];
logic [7:0] dout;

// SystemVerilog Implicit Port Connection (.*)
add4 DUT (.*);

initial begin
    for(int i=0; i<4; i++) begin
        for(int j=0; j<4; j++) begin
            din[j] = $random();
        end
        #1;
    end    
    #1;
    $finish();
end

endmodule
```

### 2.2 CLI 컴파일 및 시뮬레이션
터미널을 열고 코드가 위치한 디렉터리에서 다음 명령어를 순서대로 실행합니다.

```bash
vlib work
vlog *.sv
vsim tb
```
* `vlib work`: 시뮬레이션을 위한 기본 작업 라이브러리(work 디렉터리)를 생성합니다.
* `vlog`: 디렉터리 내의 모든 SystemVerilog(`.sv`) 파일을 컴파일합니다.
* `vsim`: Top 모듈(`tb`)을 대상으로 시뮬레이터를 실행합니다.

명령어를 실행하면 ModelSim (또는 Questa) GUI가 실행됩니다. 

> **💡 시뮬레이션 최적화 옵션 (Visibility 설정)**
> 최신 버전의 Questa/ModelSim 엔진에서는 시뮬레이션 속도 향상을 위해 내부 Object들을 기본적으로 은닉(No design object visibility) 처리하는 경우가 있습니다. GUI 화면에서 Waveform을 정상적으로 추적하려면 시뮬레이션 시작 시 가시성 설정을 변경해야 합니다.

1. 상단의 **Simulate - Start Simulation**을 누릅니다.
2. `work` 디렉터리 하위의 `tb` 모듈을 선택한 후, 우측 하단의 **Optimization Options**를 클릭합니다.
3. 가시성 탭에서 **Apply full visibility to all modules (vopt +acc)**를 체크한 후 확인을 누릅니다. 

이 설정을 완료하면 원하는 Object를 Waveform 창에 추가하여 정상적으로 신호의 변화를 시뮬레이션할 수 있습니다. ModelSim 계열은 순수 로직 검증이나 알고리즘 모델링 시 작업 효율을 높이는 데 탁월한 선택이 될 것입니다.