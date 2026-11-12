"""
FastAPI Server for Automata Learning & Visualization Engine.
Provides REST API endpoints for datasets, model training, string simulations, and ablation curves.
"""

from typing import List, Optional
try:
    from fastapi import FastAPI, HTTPException
    from fastapi.middleware.cors import CORSMiddleware
    from pydantic import BaseModel
except ImportError:
    FastAPI = None

from .api import AutomataMLService

service = AutomataMLService()

if FastAPI is not None:
    app = FastAPI(
        title="Automata ML Engine API",
        description="Educational API for learning, testing, and visualizing DFA/NFA models.",
        version="1.0.0",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    class GenerateDataRequest(BaseModel):
        preset_index: int = 1
        num_positive: int = 30
        num_negative: int = 30
        max_length: int = 10
        noise_rate: float = 0.0
        seed: Optional[int] = 42

    class TrainModelRequest(BaseModel):
        positive_strings: List[str]
        negative_strings: List[str]
        alphabet: Optional[List[str]] = None
        algorithm: str = "rpni"  # "rpni", "edsm", "lstar", "nfa"
        preset_reference_index: Optional[int] = None

    class SimulateStringRequest(BaseModel):
        test_string: str

    class RunAblationRequest(BaseModel):
        preset_index: int = 4
        study_type: str = "sample_size"  # "sample_size" or "noise"
        learner_type: str = "rpni"

    @app.get("/api/presets")
    def get_presets():
        return service.get_preset_languages()

    class PreprocessCsvRequest(BaseModel):
        csv_text: str

    @app.post("/api/dataset/preprocess-csv")
    def preprocess_csv(req: PreprocessCsvRequest):
        try:
            return service.preprocess_csv(req.csv_text)
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

    @app.post("/api/dataset/generate")
    def generate_dataset(req: GenerateDataRequest):
        try:
            return service.generate_data(
                preset_index=req.preset_index,
                num_positive=req.num_positive,
                num_negative=req.num_negative,
                max_length=req.max_length,
                noise_rate=req.noise_rate,
                seed=req.seed,
            )
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

    @app.post("/api/model/train")
    def train_model(req: TrainModelRequest):
        try:
            return service.train_model(
                positive_strings=req.positive_strings,
                negative_strings=req.negative_strings,
                alphabet=req.alphabet,
                algorithm=req.algorithm,
                preset_reference_index=req.preset_reference_index,
            )
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

    @app.post("/api/model/simulate")
    def simulate_string(req: SimulateStringRequest):
        try:
            return service.simulate(req.test_string)
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

    class StartInteractiveRequest(BaseModel):
        alphabet: List[str] = ["0", "1"]
        initial_positive: Optional[List[str]] = None
        initial_negative: Optional[List[str]] = None
        preset_reference_index: Optional[int] = None

    class AnswerQueryRequest(BaseModel):
        is_accepted: bool

    class ConfirmConjectureRequest(BaseModel):
        counterexample: Optional[str] = None

    @app.post("/api/active/start")
    def start_active_learning(req: StartInteractiveRequest):
        try:
            return service.start_interactive_learning(
                alphabet=req.alphabet,
                initial_positive=req.initial_positive,
                initial_negative=req.initial_negative,
                preset_reference_index=req.preset_reference_index,
            )
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

    @app.post("/api/active/answer")
    def answer_active_query(req: AnswerQueryRequest):
        try:
            return service.answer_interactive_query(req.is_accepted)
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

    @app.post("/api/active/confirm")
    def confirm_active_conjecture(req: ConfirmConjectureRequest):
        try:
            return service.confirm_interactive_conjecture(req.counterexample)
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

    @app.post("/api/ablation/run")
    def run_ablation(req: RunAblationRequest):
        try:
            return service.run_ablation(
                preset_index=req.preset_index,
                study_type=req.study_type,
                learner_type=req.learner_type,
            )
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

else:
    app = None

