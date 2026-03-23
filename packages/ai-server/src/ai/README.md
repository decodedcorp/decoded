# ai 디렉토리

이 디렉토리는 프로젝트의 **AI 계층**을 담당합니다.

- AI 모델(예: CLIP, Llama 등)과 임베딩, 추론, 전처리 등 AI 관련 로직을 포함합니다.
- embedding, 모델 관리, AI inference 등 인공지능 기능의 핵심 구현이 위치합니다.
- 서비스 계층에서 AI 기능이 필요할 때 이 디렉토리의 모듈을 활용합니다.

**AI 기능의 확장성과 독립성을 위해 별도의 계층으로 분리하였습니다.**

---

## 구조 설명 및 실제 사용 예시

- **기능별 하위 디렉토리**: 예를 들어, `embedding/` 디렉토리에는 임베딩 관련 로직이, `generation/`에는 생성 모델 관련 로직이 위치합니다.
- **모델별 파일 분리**: 각 기능 디렉토리 내부에는 CLIP, Llama 등 모델별로 파일이 분리되어 있습니다. 예) `embedding/clip.py`, `embedding/llama.py`
- **config를 통한 모델 관리**: 각 모델의 파인튜닝(학습된 가중치, 하이퍼파라미터 등) 값은 config 파일/객체로 분리하여 관리합니다.

### 폴더 구조 예시

```
ai/
├── embedding/
│   ├── configs.py      # 임베딩 모델 프리셋/설정값
│   ├── models.py       # 임베딩 모델의 Pydantic BaseModel 등
│   ├── clip.py         # CLIP 임베딩 모델 구현
│   ├── llama.py        # Llama 임베딩 모델 구현
│   └── ...             # 기타 임베딩 모델별 파일
├── generation/
│   ├── configs.py      # 생성 모델 프리셋/설정값
│   ├── models.py       # 생성 모델의 Pydantic BaseModel 등
│   ├── gpt.py          # GPT 기반 생성 모델 구현
│   └── ...             # 기타 생성 모델별 파일
└── ...
```

- 각 기능별 디렉토리(`embedding/`, `generation/` 등)에는 항상 `configs.py`, `models.py`, 그리고 여러 모델별 파일(`clip.py`, `llama.py`, `gpt.py` 등)이 들어갑니다.

### 실제 예시 (CLIP + fashionclip)

- `embedding/configs.py`:
  ```python
  from pydantic import BaseModel

  class ClipModel(BaseModel):
      model_name: str
      tokenizer: str
      max_length: int
      padding: str
      truncation: bool
      vector_size: int

  # 실제 사용되는 fashionclip 프리셋 예시
  fashionclip = ClipModel(
      model_name="fashion-clip",
      tokenizer="fashion-clip-tokenizer",
      max_length=77,
      padding="max_length",
      truncation=True,
      vector_size=512,
  )
  ```

- `embedding/clip.py`:
  ```python
  from .configs import fashionclip
  
  class ClipEmbeddingModel:
      def __init__(self, clip_model=fashionclip):
          self.clip_model = clip_model
          # ... 이하 생략 ...
  ```

- **확장성**: 새로운 AI 기능이나 모델이 추가될 때, 기능별 디렉토리와 모델별 파일, config만 추가하면 되므로 구조가 매우 유연합니다.

---

## 관리 주체 구분

- **Local resource AI(직접 관리하는 모델)**: 이 디렉토리(`ai/`)에서 관리합니다. (예: huggingface 기반 모델, 직접 파인튜닝한 모델 등)
- **외부 AI(외부 API/서비스 기반)**: `managers/` 디렉토리에서 관리합니다. (예: OpenAI API, 외부 AI 서비스 등)

이 계층 구조를 통해 AI 관련 코드의 관심사 분리, 재사용성, 유지보수성을 극대화할 수 있습니다. 