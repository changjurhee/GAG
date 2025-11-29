# Lotto 6/45 Generator & Probability Lab

이 프로젝트는 로또 6/45 번호 생성기이자, **확률과 무작위성(Randomness)**을 탐구하기 위한 교육용 웹 애플리케이션입니다.

## � 프로젝트 목적 및 확률의 이해

> **⚠️ 주의**: 이 프로젝트는 사행성 도박을 조장하기 위한 것이 아닙니다. 수학적 확률의 희박함과 컴퓨터가 난수를 생성하는 다양한 방식을 시각적으로 이해하는 데 목적이 있습니다.

### 45C6: 814만 분의 1의 의미
로또 6/45는 1부터 45까지의 숫자 중 순서에 상관없이 6개를 선택하는 게임입니다. 수학적으로 이는 **45C6 (Combination)**으로 계산됩니다.

$$_{45}C_6 = \frac{45 \times 44 \times 43 \times 42 \times 41 \times 40}{6 \times 5 \times 4 \times 3 \times 2 \times 1} = 8,145,060$$

*   **총 조합 수**: 8,145,060가지
*   **1등 당첨 확률**: 약 **0.00001227%**

이는 매주 로또를 한 장씩 구매한다고 가정했을 때, 산술적으로 약 **15만 6천 년**이 걸려야 한 번 당첨될 수 있는 확률입니다. 이 시뮬레이터를 통해 "무작위"라는 개념이 얼마나 예측 불가능한지 체험해 보세요.

---

## 🎲 다양한 난수 생성 방식 (RNG)

이 애플리케이션은 단순한 랜덤 생성을 넘어, 컴퓨터 공학에서 다루는 다양한 난수 생성 방식을 구현하고 있습니다.

1.  **Basic PRNG (Pseudo-Random Number Generator)**
    *   자바스크립트의 기본 `Math.random()`을 사용합니다.
    *   빠르지만, 알고리즘에 의해 결정되므로 진정한 의미의 무작위는 아닙니다.

2.  **Secure RNG (Web Crypto API)**
    *   브라우저의 `crypto.getRandomValues()`를 사용합니다.
    *   암호학적으로 안전한 난수를 생성하며, 예측이 훨씬 어렵습니다.

3.  **VRF (Verifiable Random Function) Simulation**
    *   블록체인 등에서 사용되는 '검증 가능한 난수'를 시뮬레이션합니다.
    *   Seed 값과 카운터를 해시(SHA-256)하여 난수를 만듭니다.

4.  **Blockchain Randomness**
    *   실제 비트코인 블록체인의 최신 블록 해시값을 가져와 시드(Seed)로 사용합니다.
    *   외부 세계의 예측 불가능한 데이터를 난수 생성의 원천으로 활용하는 방식입니다.

5.  **AI & Physics Simulation**
    *   **TensorFlow.js**: LSTM 모델을 사용하여 과거 당첨 번호 패턴을 학습합니다.
    *   **Headless Simulation**: 2,000회의 물리 시뮬레이션을 고속으로 수행하여 AI 학습 데이터를 생성합니다.

---

## 🏗️ 아키텍처 (Architecture)

이 프로젝트의 상세한 아키텍처, 다이어그램(Context, Module, Component, Class, Sequence), 그리고 QA 전략은 [ARCHITECTURE.md](ARCHITECTURE.md) 문서에서 확인할 수 있습니다.

---

## �🚀 실행 방법

이 프로젝트는 정적 웹사이트(Static Website)로 구성되어 있어 별도의 서버 설치 없이 바로 실행할 수 있습니다.

1.  **`index.html` 파일 열기**
    *   파일 탐색기(Finder)에서 `index.html` 파일을 더블 클릭하여 웹 브라우저(Chrome, Safari 등)에서 엽니다.

## 🛠️ 개발 및 테스트 환경 설정

이 프로젝트는 순수 JavaScript로 작성되었지만, 테스트 및 의존성 관리를 위해 Node.js 환경을 지원합니다.

### 1. 설치 (Installation)
프로젝트 루트에서 다음 명령어를 실행하여 테스트 의존성(Jest)을 설치합니다.
```bash
npm install
```

### 2. 테스트 실행 (Running Tests)
작성된 유닛 테스트(Unit Tests)를 실행하여 알고리즘의 정상 동작을 검증할 수 있습니다.
```bash
npm test
```

## 📊 데이터 업데이트 (Data Updates)

최신 로또 당첨 번호를 가져오기 위해 두 가지 방법을 제공합니다.

### 방법 A: 자동 웹 크롤링 (추천)
Python 스크립트를 사용하여 동행복권 사이트에서 최신 데이터를 자동으로 가져옵니다.
```bash
python crawl_numbers.py
```
*   `winning_numbers.js` 파일이 자동으로 갱신됩니다.
*   기존 데이터가 있다면 최신 회차만 추가로 가져옵니다 (Incremental Update).

### 방법 B: 엑셀 파일 처리 (수동)
동행복권 사이트에서 엑셀 파일을 다운로드 받아 처리할 수도 있습니다.
1.  엑셀 파일을 프로젝트 폴더에 위치시킵니다.
2.  `extract_numbers.py`를 실행합니다.
    ```bash
    python extract_numbers.py
    ```

## 📂 프로젝트 구조

*   **`index.html`**: 메인 웹 페이지
*   **`js/`**: 자바스크립트 모듈 폴더
    *   `algorithms.js`: 번호 생성 알고리즘 (가중치, 적응형 등)
    *   `rng.js`: 다양한 난수 생성 구현체
    *   `simulation.js`: 물리 엔진 기반 추첨 시뮬레이션
*   **`extract_numbers.py`**: 엑셀 데이터 추출 스크립트
