# Unreal Engine 5 Installation & Setup Guide (macOS)

UE5 에디터 설치부터 프로젝트 설정까지의 단계를 안내해 드립니다. 특히 우클릭이 안 되는 상황을 고려하여 키보드와 터미널을 활용한 방법을 포함했습니다.

## 1. Epic Games Launcher 및 UE5 설치

1.  **Epic Games Launcher 다운로드**:
    *   [Unreal Engine 공식 홈페이지](https://www.unrealengine.com/ko/download)에 접속합니다.
    *   "런처 다운로드"를 클릭하여 macOS용 설치 파일을 받습니다.
    *   다운로드된 `.dmg` 파일을 열고 Epic Games Launcher를 `Applications` 폴더로 드래그하여 설치합니다.

2.  **Unreal Engine 5 설치**:
    *   Epic Games Launcher를 실행하고 로그인합니다.
    *   왼쪽 메뉴에서 **Unreal Engine** 탭을 클릭합니다.
    *   상단 **라이브러리** 탭으로 이동합니다.
    *   **엔진 버전** 옆의 `+` 버튼을 누르고, **5.x.x** (최신 버전 또는 프로젝트에 맞는 버전)을 선택하여 **설치**를 클릭합니다.
    *   *참고: 설치 용량이 크므로 시간이 소요될 수 있습니다.*

3.  **Xcode 설치 (필수)**:
    *   Mac에서 C++ 프로젝트를 빌드하려면 **Xcode**가 필요합니다.
    *   App Store에서 **Xcode**를 검색하여 설치합니다.
    *   설치 후 터미널을 열고 다음 명령어를 입력하여 라이선스에 동의합니다:
        ```bash
        sudo xcodebuild -license
        ```
        (비밀번호 입력 후 `agree` 입력)

## 2. Mac 우클릭 대안 (Trackpad/Keyboard)

우클릭이 물리적으로 안 되는 경우 다음 방법을 사용하세요:

*   **Control + 클릭**: 키보드의 `Control` 키를 누른 상태에서 트랙패드나 마우스를 클릭하면 우클릭과 동일하게 작동합니다.
*   **트랙패드 설정**:
    *   `시스템 설정` -> `트랙패드` -> `보조 클릭` (Secondary Click) 설정을 확인하세요. 보통 "두 손가락으로 클릭"으로 설정되어 있습니다.

## 3. 프로젝트 파일 생성 (Generate Project Files) - 터미널 방법

우클릭 메뉴("Generate Project Files")를 사용할 수 없거나 에디터가 아직 연결되지 않은 경우, 터미널 명령어로 Xcode 프로젝트 파일을 생성할 수 있습니다.

1.  **터미널(Terminal)** 앱을 엽니다.
2.  다음 명령어를 입력하여 프로젝트 파일을 생성합니다. (UE5 설치 경로가 기본값인 경우)

    ```bash
    # UE5 설치 경로 (버전에 따라 5.0, 5.1 등 숫자가 다를 수 있습니다. 확인 필요)
    /Users/Shared/Epic\ Games/UE_5.0/Engine/Build/BatchFiles/Mac/GenerateProjectFiles.sh -project="/Users/changjurhee/Projects/GAG/src/bang_gu_cha_ue5/BangGuCha.uproject" -game
    ```

    *   *팁: 위 경로의 `UE_5.0` 부분은 실제 설치된 버전에 맞게 수정해야 할 수 있습니다. (예: `UE_5.1`, `UE_5.2`)*

3.  명령어가 성공하면 폴더에 `BangGuCha.xcworkspace` 파일이 생성됩니다.
4.  이 파일을 더블 클릭하여 **Xcode**에서 엽니다.
5.  Xcode 상단 메뉴에서 타겟을 **BangGuCha** (또는 **BangGuChaEditor**)로 선택하고 **Build** (Command + B)를 실행합니다.

## 4. 에디터 실행

*   Xcode에서 빌드가 성공하면, 상단의 재생 버튼(Run)을 눌러 에디터를 실행할 수 있습니다.
*   또는 Epic Games Launcher의 라이브러리에서 "내 프로젝트" 목록에 `BangGuCha`가 보인다면 더블 클릭하여 엽니다.
