---
layout: post
title: "Convolution layer의 kernel 개수"
author: "Yonghwan Kwon"
tags: "Archive"
comments: true
excerpt_separator: ---
---

과거에 작성했던 게시글 중 markdown이 남아있는 글들을 복원하고 있습니다. CNN 구조의 합성곱 계층(Convolution layer)에서 사용되는 필터(Filter)의 개수 산정 방식에 대해 정리합니다. 인터넷상에 종종 ($N_{\text{kernel}} = N_{\text{feature map}}$)으로 잘못 알려진 경우가 있으나, 이는 부정확한 정보입니다. 본 포스팅에서는 텐서플로우(TensorFlow) 코드를 통해 커널 개수에 대한 정확한 개념을 바로잡고자 합니다.

---

## 1. 커널(Kernel)의 개념

커널(Kernel)은 머신러닝 분야에서 종종 필터(Filter)라는 용어와 혼용되어 사용됩니다.

<figure>
  <img src="https://user-images.githubusercontent.com/15958325/58780750-defb7480-8614-11e9-943c-4d44a9d1efc4.gif" alt="2D Convolution 동작 예시" id="figure-1">
  <figcaption>Figure 1. 2D Convolution 동작 원리</figcaption>
</figure>

[`Figure 1`](#figure-1)은 3x3 커널이 5x5 이미지를 Stride 1로 스캐닝(Shifting)하며 2D Convolution 연산을 수행하는 과정을 직관적으로 보여줍니다. 여기서 가장 강조하고자 하는 핵심은 **Convolution layer의 커널 하나가 Fully-Connected (FC) layer의 가중치(Weight) 하나에 해당한다**는 사실입니다. (2D Convolution 동작 원리에 대한 기초적인 설명은 [이곳](https://gruuuuu.github.io/machine-learning/cnn-doc/)을 참고하시기 바랍니다.)

---

## 2. 커널(Kernel)의 올바른 개수 산정

본격적으로 커널의 실제 개수가 어떻게 결정되는지 살펴보겠습니다. 아래 예제 코드는 [sdc-james.gitbook.io](https://sdc-james.gitbook.io/onebook/4.-and/5.4.-tensorflow/5.4.2.-cnn-convolutional-neural-network)의 자료를 바탕으로 작성되었으며, 전체 모델의 동작보다는 합성곱 계층의 파라미터 변화에 초점을 맞추어 설명합니다.

```python
import sys
import tensorflow as tf
import keras
from keras.models import Sequential
from keras.layers import Dense, Dropout, Flatten
from keras.layers.convolutional import Conv2D, MaxPooling2D
import numpy as np

# Data Setting
img_rows = 28
img_cols = 28
(x_train, y_train), (x_test, y_test) = keras.datasets.mnist.load_data()

input_shape = (img_rows, img_cols, 1)
x_train = x_train.reshape(x_train.shape[0], img_rows, img_cols, 1)
x_test = x_test.reshape(x_test.shape[0], img_rows, img_cols, 1)

x_train = x_train.astype('float32') / 255.
x_test = x_test.astype('float32') / 255.

print('x_train shape:', x_train.shape)
print(x_train.shape[0], 'train samples')
print(x_test.shape[0], 'test samples')

num_classes = 10
y_train = keras.utils.to_categorical(y_train, num_classes)
y_test = keras.utils.to_categorical(y_test, num_classes)

# Model Building
model = Sequential()
model.add(Conv2D(32, kernel_size=(5, 5), strides=(1, 1), padding='same', activation='relu', input_shape=input_shape))
model.add(MaxPooling2D(pool_size=(2, 2), strides=(2, 2)))
model.add(Conv2D(64, (2, 2), activation='relu', padding='same'))
model.add(MaxPooling2D(pool_size=(2, 2)))
model.add(Dropout(0.25))
model.add(Flatten())
model.add(Dense(1000, activation='relu'))
model.add(Dropout(0.5))
model.add(Dense(num_classes, activation='softmax'))

model.summary()
model.compile(loss='categorical_crossentropy', optimizer='adam', metrics=['accuracy'])

# Weights Check
weights = model.get_weights()
print('weight check')
print(f'first convolution layer:\t{weights[0].T.shape}') # 32 x 1 x 5 x 5
print(f'second convolution layer:\t{weights[2].T.shape}') # 64 x 32 x 2 x 2
```

---

## 3. 결과 분석 및 오해 바로잡기

위 코드에서는 모델을 구성한 뒤, 첫 번째 `Conv2D`와 두 번째 `Conv2D` 계층의 가중치(Weights) 형태(Shape)를 출력하여 확인하고 있습니다.

주석에 명시된 바와 같이, 두 번째 `Conv2D` 계층의 가중치 형태(`weights[2].T.shape`)는 `64 x 32 x 2 x 2`로 나타납니다. 이 계층에서 커널 하나의 크기를 `2x2`로 설정했기 때문에, 실제 사용된 커널의 총 개수는 **64 x 32**개가 됩니다. 즉, Convolution layer의 전체 커널 개수는 다음과 같은 공식으로 정해집니다.

$$
N_{\text{kernel}} = C_{\text{in}} \times C_{\text{out}} \tag{1}
$$

여기서 각 기호가 의미하는 바는 다음과 같습니다.
* $N_{\text{kernel}}$ : 총 커널의 개수
* $C_{\text{in}}$ : 입력 피처 맵의 채널 수 (Input Channels)
* $C_{\text{out}}$ : 출력 피처 맵의 채널 수 (Output Channels 또는 Filters)

초보자들이 종종 "피처 맵(Feature Map)의 개수와 커널의 개수가 동일하다"고 착각하는 이유는 TensorFlow(Keras) 함수 설계 시 사용된 **파라미터의 명칭** 때문일 가능성이 높습니다.

`Conv2D` 함수의 첫 번째 파라미터 이름은 `filters`입니다. 우리는 일반적으로 커널과 필터를 동일한 용어로 인지하고 있기 때문에, 두 번째 계층에서 `filters=64`로 설정하면 단순히 '커널이 64개 생성되었구나'라고 오해하기 쉽습니다.
하지만 여기서의 `filters`는 전체 커널의 개수가 아니라 '출력으로 생성할 피처 맵의 깊이(채널 수)'를 의미합니다. 내부적으로는 입력된 이미지(피처 맵)의 채널 1개당 filters 개수만큼의 커널이 필요하므로, 최종적으로는 `입력 채널 수 × 출력 피처 맵 수`만큼의 커널 세트가 생성되는 것이 올바른 구조입니다.