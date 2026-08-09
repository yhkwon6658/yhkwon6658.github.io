---
layout: post
title: "CNN Backpropagation"
author: "Yonghwan Kwon"
tags: "Archive"
comments: true
excerpt_separator: ---
---

과거에 작성했던 게시글 중 markdown이 남아있는 글들을 복원하고 있습니다. 

CNN(합성곱 신경망)은 일반적으로 합성곱 계층(Convolution Layer)과 완전 연결 계층(Fully-Connected Layer)으로 이루어진 형태를 기본 구조로 합니다. FC Layer의 역전파(Back-Propagation) 과정은 이미 여러 매체를 통해 자세히 다루어지고 있습니다. 따라서 이번 포스팅에서는 상대적으로 덜 다루어지는 **Convolution Layer의 역전파**를 FC Layer와 동일한 관점과 방식으로 설명해 보고자 합니다.

---

## 1. Back-Propagation (역전파)의 이해
신경망(Neural Network, NN)은 학습을 위해 **역전파(Back-Propagation)** 알고리즘을 사용합니다. 용어 그대로 '뒤에서부터 앞으로 전달한다'는 의미인데, 여기에는 명확한 수학적 이유가 있습니다. 

신경망을 학습시키기 위해서는 항상 `Label`이라 불리는 정답지가 필요합니다. 모델에 입력을 넣어 얻은 예측 출력값과 이 실제 답지를 비교하여 `Cost(Error)`를 산출하게 되며, 당연히 이 Cost는 작으면 작을수록 이상적입니다. 모델 내부의 수많은 가중치(Weights)와 편향(Bias)은 이 Cost의 결과에 직접적인 영향을 미치며, 저는 이를 **"Cost에 기여한다"**고 표현합니다.

비용 함수(Cost Function)를 $f$라 할 때, 특정 변수 $x$에 의한 결과 $f(x)$가 최소화되도록 최적의 $x$를 찾아가는 과정이 바로 신경망의 핵심 학습 메커니즘인 [경사 하강법(Gradient Descent)](https://angeloyeo.github.io/2020/08/16/gradient_descent.html)입니다. 하지만 신경망은 파라미터의 수가 워낙 방대하여 $f$에 기여하는 각 변수를 독립적으로 계산하기가 매우 까다롭습니다.

이때 각 계층(Layer)의 상관관계를 떠올려 보면, **앞 계층의 출력은 항상 다음 계층의 입력**이 됩니다. 이는 수학에서 다루는 **합성함수(Chain Rule)**로 완벽하게 표현 가능합니다. 예를 들어, $y=f(x)$와 $z=g(y)$라는 함수가 있다면 최종적으로 $z=g(f(x))$로 나타낼 수 있습니다. 여기서 $z$를 Cost, $x$를 가중치(Weight)라고 가정해 보겠습니다.

<figure>
  <img src="https://user-images.githubusercontent.com/120978778/210169159-bdcd1988-8c41-4deb-807d-af2334666f3c.png" alt="Chain Rule Concept" id="figure-1">
  <figcaption>Figure 1. 합성함수의 미분(Chain Rule) 개념도</figcaption>
</figure>

[`Figure 1`](#figure-1)에서 볼 수 있듯이, $z$에 대한 $x$의 기여도(기울기)를 구하기 위해서는 **반드시** $z$에 대한 $y$의 기여도를 먼저 구해야만 합니다. 바로 이러한 연쇄 법칙(Chain Rule)의 특성 때문에, 신경망에서는 항상 **가장 뒤의 출력 계층부터 Cost에 대한 기울기(Gradient)를 구한 뒤 이를 앞으로 전달**하는 방식을 취합니다. 이 과정을 통해 모든 가중치와 편향의 기울기를 효율적으로 계산하고 업데이트를 진행하게 됩니다.

이제 기본적인 역전파의 몇 가지 케이스를 살펴보겠습니다.

---

## 2. 기본적인 연산 노드의 역전파

### Case 1. 덧셈 노드 (Addition)
앞선 예시와 같이 $z=g(y)$, $y=f(x)$인 상황에서, 함수 $f$가 덧셈을 수행하는 $f(x_1, x_2) = x_1 + x_2$라고 가정해 보겠습니다. 이때 최종 결과 $z$에 대한 $x_1$의 기여도(기울기)는 다음과 같이 계산됩니다.

<figure>
  <img src="https://user-images.githubusercontent.com/120978778/210169454-b4db2ff1-dfb4-4572-a5a5-fe163a3aa512.png" alt="Addition Backpropagation" id="figure-2">
  <figcaption>Figure 2. 덧셈(Addition) 노드의 역전파</figcaption>
</figure>

[`Figure 2`](#figure-2)에서 알 수 있듯, 덧셈 노드의 경우 연결된 파라미터의 개수와 무관하게 **이전 노드로부터 전달받은 기울기(Gradient)를 변형 없이 그대로 다음 노드로 전달**하는 특징을 갖습니다.

### Case 3. 곱셈 노드 (Multiplication)
이번에는 함수 $f$가 곱셈을 수행하는 $f(x_1, x_2) = x_1 \times x_2$라고 가정해 보겠습니다. 이 경우 $z$에 대한 $x_1$의 기여도는 어떻게 될까요?

<figure>
  <img src="https://user-images.githubusercontent.com/120978778/210169804-6a936261-31cf-43a5-9426-aa7b2d2348b6.png" alt="Multiplication Backpropagation" id="figure-3">
  <figcaption>Figure 3. 곱셈(Multiplication) 노드의 역전파</figcaption>
</figure>

[`Figure 3`](#figure-3)을 살펴보면, 곱셈 노드에서 $x_1$의 기울기는 **이전 단계에서 전달받은 기울기에 자신과 함께 곱해졌던 다른 변수(여기서는 $x_2$)를 곱한 값**이 됩니다. 즉, 입력 신호들이 서로 교차(Cross)되어 곱해지는 형태로 역전파가 이루어집니다.

---

## 3. 활성화 함수 (Activation Function)의 역전파

일반적인 신경망 계층은 $h = w_1x_1 + w_2x_2 + w_3x_3$의 선형 연산 후, $z = \text{activation}(h)$를 거치는 구조를 가집니다. 우선 기본적인 완전 연결 신경망(DNN)을 기준으로, 가장 널리 사용되는 `Sigmoid`, `ReLU`, `Softmax` 함수의 역전파 과정을 정리해 보겠습니다. (이후 Convolution Layer에서도 동일한 논리가 적용됩니다.)

### I. Sigmoid
Sigmoid 함수는 다음과 같이 정의됩니다.

<figure>
  <img src="https://user-images.githubusercontent.com/120978778/210169955-6f7c65de-1486-4fa3-a1ce-67a14d4d65bf.png" alt="Sigmoid Equation" id="figure-4">
  <figcaption>Figure 4. Sigmoid 함수 정의</figcaption>
</figure>

$y = \text{sigmoid}(x)$라고 가정했을 때, 출력 $y$에 대한 입력 $x$의 기여도(미분값)는 다음과 같이 유도할 수 있습니다.

<figure>
  <img src="https://user-images.githubusercontent.com/120978778/210170113-b065f373-bb48-498c-a949-74ef6e3e7d07.png" alt="Sigmoid Derivative" id="figure-5">
  <figcaption>Figure 5. Sigmoid 함수의 편미분 결과</figcaption>
</figure>

[`Figure 5`](#figure-5)의 결과를 보면, Sigmoid 함수는 복잡한 $x$ 값에 의존하지 않고 오직 **출력값 $y$만으로 $y(1 - y)$라는 깔끔한 기울기 식**을 얻을 수 있어 경사 하강법에 적용하기 매우 편리합니다.

### II. ReLU
최근 딥러닝에서 가장 많이 사용되는 ReLU 함수는 다음과 같습니다.

<figure>
  <img src="https://user-images.githubusercontent.com/120978778/210170153-00c421ca-ae90-4edc-bd2b-695bca25f904.png" alt="ReLU Equation" id="figure-6">
  <figcaption>Figure 6. ReLU 함수 정의</figcaption>
</figure>

`max` 함수는 두 변수 중 큰 값을 출력하므로, ReLU는 $x \le 0$일 때는 0을, $x > 0$일 때는 $y = x$의 형태로 값을 통과시킵니다.

<figure>
  <img src="https://user-images.githubusercontent.com/120978778/210170173-e76a930b-70a2-4497-ae46-da01e2566376.png" alt="ReLU Conditional" id="figure-7">
  <figcaption>Figure 7. ReLU 함수의 편미분</figcaption>
</figure>

따라서 ReLU의 기울기는 $y$(또는 $x$)의 구간에 따라 달라집니다. 이를 역전파 계산이 용이하도록 $y$에 대하여 정리하면 다음과 같습니다.

<figure>
  <img src="https://user-images.githubusercontent.com/120978778/210170237-132e1a05-57a0-4eee-98b1-14b22141e764.png" alt="ReLU Derivative by y" id="figure-8">
  <figcaption>Figure 8. 출력값(y)에 대한 ReLU 함수의 편미분</figcaption>
</figure>

물론 $x$를 기준으로 정리할 수도 있지만, 역전파 과정에서는 출력값 $y$를 기준으로 정리하는 것이 구현상 훨씬 직관적입니다.

### III. Softmax
다중 클래스 분류의 출력층에서 주로 사용되는 Softmax 함수는 다음과 같이 정의됩니다.

<figure>
  <img src="https://user-images.githubusercontent.com/120978778/210170264-98076023-def6-48b5-952a-b91309584c2d.png" alt="Softmax Equation" id="figure-9">
  <figcaption>Figure 9. Softmax 함수 정의</figcaption>
</figure>

분수와 지수가 섞여 있어 그대로 미분하기에는 형태가 다소 까다롭습니다. 이런 경우에는 고등학교 수학에서 배우는 양변에 자연로그($\ln$)를 취하는 방식이 매우 효과적입니다.

<figure>
  <img src="https://user-images.githubusercontent.com/120978778/210170443-d8d14b2c-4175-4a24-adef-e9daa7b04b3e.png" alt="Log Softmax" id="figure-10">
  <figcaption>Figure 10. Softmax 함수에 로그(log) 적용</figcaption>
</figure>

이제 양변을 특정 입력 $x_i$에 대하여 편미분해 보겠습니다.

<figure>
  <img src="https://user-images.githubusercontent.com/120978778/210170524-df8afaa0-2a86-4ccf-ac6d-fc276f2585fb.png" alt="Softmax Derivative Steps" id="figure-11">
  <figcaption>Figure 11. Softmax 함수 편미분 전개 과정</figcaption>
</figure>

위 과정을 거쳐 최종적으로 Softmax 함수의 Gradient는 다음과 같이 깔끔하게 정리됩니다.

<figure>
  <img src="https://user-images.githubusercontent.com/120978778/210170591-f109d47a-70cf-4b8b-ac5c-c9329ee85ae2.png" alt="Softmax Derivative Result" id="figure-12">
  <figcaption>Figure 12. Softmax 함수 편미분 결과</figcaption>
</figure>

### IV. Example
<figure>
  <img src="https://user-images.githubusercontent.com/120978778/210170892-26d89765-44fe-4b2b-8248-163416cb16d7.png" alt="Backpropagation Example" id="figure-13">
  <figcaption>Figure 13. 역전파 유도 예제</figcaption>
</figure>

[`Figure 13`](#figure-13)은 앞서 배운 기본 노드들의 미분 방식을 바탕으로 구성된 예제입니다. 직접 $z_1$에 대한 $w_1, w_2, w_3$의 역전파 기울기를 각각 유도해 보시길 권장합니다.

---

## 4. Convolution Layer의 역전파 (Back-Propagation)

앞선 예제들을 충분히 이해하셨다면, 기본적인 FC Layer의 역전파 구조는 모두 숙지하셨을 것입니다. 하지만 여전히 많은 자료들이 Convolution Layer의 역전파 과정을 지나치게 복잡한 수식 위주로 설명하여 직관적인 이해를 방해하곤 합니다. 

이전 포스팅인 [`Convolution layer의 kernel 개수`](https://yhkwon6658.github.io/2022-12-28/Convolution-layer%EC%9D%98-Kernel-%EA%B0%9C%EC%88%98)에서 **"Convolution Layer의 커널(Kernel) 하나는 FC Layer의 가중치(Weight) 하나와 완벽하게 동일한 역할을 한다"**고 강조한 바 있습니다. 이번 역전파 과정에서도 커널 하나를 단일 가중치로 간주하고 아래의 논리를 따라가 보시기 바랍니다.

<figure>
  <img src="https://user-images.githubusercontent.com/120978778/210171592-43dc8d98-f53b-4a28-a27d-e855f71c28e0.png" alt="Convolution Layer Architecture" id="figure-14">
  <figcaption>Figure 14. Convolution Layer 예시 구조</figcaption>
</figure>

불필요하게 복잡한 예시보다는 [`Figure 14`](#figure-14)와 같은 간단한 형태의 구조로 접근해 보겠습니다. 입력 이미지의 크기를 28x28이라 하고, 커널과의 연산에서 Zero-padding을 적용했다고 가정하면 합성곱 출력 $C$의 크기는 28x28, Average Pooling을 거친 최종 출력 $S$의 크기는 14x14가 됩니다.

### I. C의 Gradient 구하기
합성곱 연산 결과인 $C$는 다음 단계인 $S$와 Average Pooling 관계로 묶여 있습니다. 따라서 손실 함수로부터 전달된 $S$의 기울기를 이용해 $C$의 기울기를 역산해야 하는데, 이 과정은 **Un-pooling(업샘플링)** 방식을 취하는 것 외에는 다른 특별한 방법이 없습니다. 대다수의 관련 논문에서도 이를 다음과 같이 명확히 기술하고 있습니다.

<figure>
  <img src="https://user-images.githubusercontent.com/120978778/210172015-1bd6ae01-85c9-43fb-8c15-047e076bacb2.png" alt="Average Pooling Gradient" id="figure-15">
  <figcaption>Figure 15. Average Pooling의 역전파 (C의 Gradient)</figcaption>
</figure>

[`Figure 15`](#figure-15)를 참고하면, Pooling의 역과정은 단순히 값을 균등하게 분배(Average)하거나 원래 인덱스에 할당(Max)하는 개념이므로 큰 무리 없이 직관적으로 이해하실 수 있을 것입니다.

### II. k(Kernel)의 Gradient 구하기
이제 앞서 구한 $C$의 기울기를 바탕으로 핵심이 되는 커널 $k$의 기울기를 구해야 합니다. 논의에 앞서 $k$의 노테이션(Notation)을 간략히 정의하고 넘어가겠습니다.

<figure>
  <img src="https://user-images.githubusercontent.com/120978778/210172159-44a35fe7-2c9a-4b7a-8ff7-1f9181cca88f.png" alt="Kernel Notation" id="figure-16">
  <figcaption>Figure 16. Kernel Notation</figcaption>
</figure>

[`Figure 16`](#figure-16)에서 위첨자는 계층(Layer)의 번호를, 아래첨자는 각각 Input Node와 Output Node의 채널 인덱스를 나타냅니다. 현재 예시에서는 입력 이미지가 1장(Input Node = 1)이므로 $p$는 모두 1이며, 출력 피처 맵이 2장(Output Node = 2)이므로 $q$는 1 또는 2가 됩니다.

<figure>
  <img src="https://user-images.githubusercontent.com/120978778/210172891-c5fd2d09-10e9-407c-b1ad-8917324e8c2e.png" alt="Convolution Backpropagation Base" id="figure-17">
  <figcaption>Figure 17. Convolution 역전파 편미분 식</figcaption>
</figure>

[`Figure 17`](#figure-17)의 수식을 보면 파라미터들에 위아래 인덱스가 붙어 있어 겉보기에는 매우 복잡해 보입니다. 하지만 본질적으로는 $\text{sigmoid}(xy)$를 $x$에 대해 미분했던 윗부분의 곱셈 노드 미분 과정과 완벽하게 동일한 결과임을 확인할 수 있습니다. 

다만, 수식이 완전히 고정되지 않은 이유는 **2D-Convolution을 수식으로 어떻게 정의할 것인가**에 따라 표기법이 조금씩 달라질 수 있기 때문입니다. 일반적인 학술 표기에서는 Convolution 연산을 다음과 같이 정의합니다.

<figure>
  <img src="https://user-images.githubusercontent.com/120978778/210173279-e5992df1-8e1d-4b6a-a8bb-3b9e65e025c6.png" alt="2D Convolution Definition" id="figure-18">
  <figcaption>Figure 18. 일반적인 2D-Convolution 수식 정의</figcaption>
</figure>

<figure>
  <img src="https://user-images.githubusercontent.com/120978778/210173390-d65b71a7-282e-46a8-9f57-a29f8a9b45be.png" alt="2D Convolution Indices" id="figure-19">
  <figcaption>Figure 19. 2D-Convolution 인덱스 표기</figcaption>
</figure>

[`Figure 18`](#figure-18)과 [`Figure 19`](#figure-19)의 가정에 따라, 커널 $k$는 -1을 시작 인덱스로 갖고 입력 데이터 $I$는 1을 시작 인덱스로 갖도록 맞춥니다. 이 기준을 적용하면 Gradient 수식은 다음과 같이 전개됩니다.

<figure>
  <img src="https://user-images.githubusercontent.com/120978778/210173494-e513e575-584f-483f-bb51-1021bc3aa714.png" alt="Gradient Rearrangement" id="figure-20">
  <figcaption>Figure 20. Gradient 정리 식</figcaption>
</figure>

여기서 앞서 정의한 표준 Convolution 수식 형태(합의 형태)로 완벽하게 맵핑하기 위해, 원본 이미지 $I$의 축을 180도 뒤집는(Flip) 트릭을 사용합니다. 즉, $x$축과 $y$축의 인덱스 부호를 반전시킵니다.

<figure>
  <img src="https://user-images.githubusercontent.com/120978778/210173572-52fc77e2-5a06-4447-812a-e2cf6ee1a45d.png" alt="Input Flip" id="figure-21">
  <figcaption>Figure 21. 입력(I)의 축 반전(180도 회전)</figcaption>
</figure>

이 과정을 거쳐 축을 재배열해 주면, 최종적으로 아래와 같은 Convolution 커널의 역전파 수식을 얻을 수 있습니다.

<figure>
  <img src="https://user-images.githubusercontent.com/120978778/210173644-791e4b9f-4178-4738-ab34-5eae508cee30.png" alt="Final Kernel Gradient" id="figure-22">
  <figcaption>Figure 22. 최종 Kernel Gradient 수식</figcaption>
</figure>

이러한 이미지 축 반전(Flip) 과정은 순수하게 **'수학적으로 Convolution 포맷에 깔끔하게 맞추기 위한'** 이론적 가정일 뿐입니다. 실제 하드웨어나 딥러닝 프레임워크에서의 연산은 단순한 곱셈과 덧셈의 반복적인 누적으로 이루어지기 때문에 이 과정을 생략하더라도 구현상의 문제는 전혀 발생하지 않습니다. 

또한, 최근 CNN 구현에서는 이론적인 편의를 위해 $I(x-u, y-v)$ 형태 대신 $I(x+u, y+v)$의 형태(Cross-Correlation)로 Convolution을 정의하는 경우가 훨씬 많습니다. 본문에서 다룬 내용을 바탕으로 Convolution을 $I(x+u, y+v)$로 가정했을 때 커널 $k$의 Gradient 수식이 어떻게 달라지는지 직접 유도해 보는 연습을 해보시길 적극 추천합니다.

더 깊이 있는 수학적 유도 과정이 궁금하시다면, 다음 [참고자료(Derivation of Backpropagation in Convolutional Neural Network)](https://zzutk.github.io/docs/reports/2016.10%20-%20Derivation%20of%20Backpropagation%20in%20Convolutional%20Neural%20Network%20(CNN).pdf)를 꼭 한 번 정독해 보시기 바랍니다.