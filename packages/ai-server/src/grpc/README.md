# gRPC 디렉토리 구조

이 디렉토리는 프로젝트 내 gRPC 통신과 관련된 모든 컴포넌트를 포함하고 있습니다.

## gRPC를 사용하는 이유
- **backend 서버와 ai 서버 간의 빠르고 효율적인 통신**을 위해 REST API 대신 gRPC를 채택하였습니다.
- gRPC는 바이너리 프로토콜을 사용하여 속도가 빠르고, 명확한 인터페이스(proto 파일) 정의로 서비스 간 연동이 용이합니다.

각 하위 디렉토리의 역할은 다음과 같습니다.

---

## 1. `proto/`
- **역할:**
  - 모든 Protocol Buffer(`.proto`) 파일을 보관합니다.
  - gRPC 서비스 인터페이스, 요청/응답 메시지 포맷, 서비스 계약을 정의합니다.
- **주요 내용:**
  - `.proto` 파일
  - proto 정의로부터 생성된 Python(또는 기타 언어) 코드
- **폴더 구조:**
  - `inbound/`: 외부 클라이언트 → AI 서버로 들어오는 요청 (Queue service)
  - `outbound/`: AI 서버 → Backend 서버로 나가는 콜백 (Metadata service)

---

## 2. `server/`
- **역할:**
  - gRPC 서버의 구현을 담당합니다.
  - gRPC 서버를 시작하고, 서비스 등록 및 gRPC 요청을 처리합니다.
- **주요 내용:**
  - 서버 시작 스크립트
  - 서비스 등록 로직
  - 서버 엔트리포인트

---

## 3. `servicer/`
- **역할:**
  - proto 파일에 정의된 메서드를 실제로 구현하는 서비스 로직(Servicer 클래스)을 포함합니다.
  - 각 Servicer 클래스는 특정 gRPC 서비스의 비즈니스 로직을 제공합니다.
- **주요 내용:**
  - gRPC 서비스 인터페이스를 구현한 Python 클래스
  - 각 gRPC 엔드포인트의 비즈니스 로직

---

## 4. `client/`
- **역할:**
  - gRPC 서버와 통신하는 클라이언트 코드가 들어 있습니다.
  - 애플리케이션의 다른 부분에서 gRPC 서버에 요청을 보낼 때 사용합니다.
- **주요 내용:**
  - 클라이언트 래퍼(wrapper)
  - gRPC 요청을 위한 헬퍼 함수
  - 클라이언트 사용 예제 스크립트

---

## proto 파일 컴파일 방법

### 왜 컴파일이 필요한가?
- `.proto` 파일이 변경되면, 해당 변경사항이 Python 코드에 반영되어야 합니다.
- proto 파일을 컴파일하면, gRPC 통신에 필요한 Python 코드(`*_pb2.py`, `*_pb2_grpc.py`)가 자동으로 생성됩니다.
- **즉, proto 파일이 바뀔 때마다 아래 명령어로 코드를 업데이트해야 합니다.**

### 1. 필요한 패키지 설치

```bash
pip install grpcio grpcio-tools
```

### 2. 컴파일 명령어 예시

아래는 실제 프로젝트 구조에 맞춘 컴파일 명령어 예시입니다.

#### inbound.proto를 컴파일하는 경우

```bash
python3 -m grpc_tools.protoc \
    --proto_path=src/grpc/proto \
    --python_out=src/grpc/proto/inbound \
    --grpc_python_out=src/grpc/proto/inbound \
    src/grpc/proto/inbound/inbound.proto
```

- `--proto_path`는 proto 파일의 루트 경로를 지정합니다.
- `--python_out`, `--grpc_python_out`은 생성된 Python 파일의 출력 경로입니다.
- 마지막 인자는 실제 컴파일할 proto 파일 경로입니다.

#### outbound.proto를 컴파일하는 경우

```bash
python3 -m grpc_tools.protoc \
    --proto_path=src/grpc/proto \
    --python_out=src/grpc/proto/outbound \
    --grpc_python_out=src/grpc/proto/outbound \
    src/grpc/proto/outbound/outbound.proto
```

#### 여러 proto 파일을 한 번에 컴파일하려면

```bash
python3 -m grpc_tools.protoc \
    --proto_path=src/grpc/proto \
    --python_out=src/grpc/proto/inbound \
    --grpc_python_out=src/grpc/proto/inbound \
    src/grpc/proto/inbound/inbound.proto

python3 -m grpc_tools.protoc \
    --proto_path=src/grpc/proto \
    --python_out=src/grpc/proto/outbound \
    --grpc_python_out=src/grpc/proto/outbound \
    src/grpc/proto/outbound/outbound.proto
```

### 3. 컴파일 후 import 경로 수정 안내
- gRPC 는 proto 파일이 최상위 패키지에 직접 위치하는 상황을 기본 가정하기 합니다.
- 그래서 proto 파일을 컴파일하면, 생성된 pd2_grpc.py에 아래와 같이 같이 상대 import가 생성될 수 있습니다:

```python
from outbound import outbound_pb2 as outbound_dot_outbound__pb2
```

- 하지만 실제 프로젝트 구조에서는 아래와 같이 **절대 경로로 수정**해야 합니다:

```python
from src.grpc.proto.outbound import outbound_pb2 as outbound_dot_outbound__pb2
```

- 여러 proto 파일을 import하는 경우에도 동일하게 경로를 맞춰주세요.
- 이 과정을 통해 Python import 에러를 방지할 수 있습니다.

---

## 요약 표
| 디렉토리  | 역할                                   |
|-----------|----------------------------------------|
| proto/    | gRPC 서비스 및 메시지 정의             |
| server/   | gRPC 서버 시작 및 서비스 등록          |
| servicer/ | proto 메서드를 구현한 서비스 로직      |
| client/   | gRPC 서비스 호출용 클라이언트 코드     |

---

이 구조는 gRPC 관련 코드를 체계적으로 관리하고, 프로젝트가 커져도 유지보수와 확장이 쉽도록 도와줍니다.