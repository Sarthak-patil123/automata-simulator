import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import WorkflowSteps from './components/WorkflowSteps';
import DatasetPanel from './components/DatasetPanel';
import ActiveLearningPanel from './components/ActiveLearningPanel';
import SimulationPanel from './components/SimulationPanel';
import GraphCanvas from './components/GraphCanvas';
import TransitionTable from './components/TransitionTable';
import MetricsBar from './components/MetricsBar';
import BenchmarkModal from './components/BenchmarkModal';
import QuickHelpModal from './components/QuickHelpModal';
import { api } from './services/api';
import { computeGraphLayout } from './utils/graphLayout';
import { fireConfetti } from './utils/confetti';
import { QUICK_SAMPLES } from './data/benchmarkQuestions';

export default function App() {
  const [sessionId] = useState(() => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return 'sess_' + Math.random().toString(36).substring(2, 11);
  });

  // Dataset & Preprocessing
  const [csvContent, setCsvContent] = useState(QUICK_SAMPLES.ends_with_01.csv);
  const [preprocessed, setPreprocessed] = useState(null);
  const [isPreprocessing, setIsPreprocessing] = useState(false);

  // Model & Graph
  const [modelType, setModelType] = useState('dfa');
  const [isGenerating, setIsGenerating] = useState(false);
  const [graphData, setGraphData] = useState(null);
  const [nodePositions, setNodePositions] = useState({});
  const [modelMetrics, setModelMetrics] = useState(null);
  const [inferenceEngine, setInferenceEngine] = useState(null);

  // HITL Active Learning
  const [hitlMode, setHitlMode] = useState('idle'); // 'idle' | 'querying' | 'conjecture_ready' | 'converged'
  const [hitlQuery, setHitlQuery] = useState(null);
  const [hitlQueryCount, setHitlQueryCount] = useState(0);
  const [hitlFeedback, setHitlFeedback] = useState(null);

  // Simulation
  const [testString, setTestString] = useState('10101');
  const [simulationTrace, setSimulationTrace] = useState(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const timerRef = useRef(null);

  // Modals & Errors
  const [isBenchmarkModalOpen, setIsBenchmarkModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Initial Preprocess
  useEffect(() => {
    handlePreprocess(csvContent);
  }, []);

  const handlePreprocess = async (text) => {
    setIsPreprocessing(true);
    setErrorMsg(null);
    try {
      const data = await api.preprocessCsv(text);
      setPreprocessed(data);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to preprocess CSV. Ensure backend is running.');
    } finally {
      setIsPreprocessing(false);
    }
  };

  // Route HITL response updates
  const processHitlResponse = (data) => {
    if (data.inference_engine) setInferenceEngine(data.inference_engine);
    if (data.metrics) setModelMetrics(data.metrics);
    if (data.message) setHitlFeedback(data.message);

    if (data.hitl_status === 'NEED_MEMBERSHIP_QUERY') {
      setHitlMode('querying');
      setHitlQuery({
        query_string: data.query_string,
        query_index: data.query_index,
        total_queries: data.total_queries,
        total_queries_asked: data.total_queries_asked,
      });
      setHitlQueryCount(data.total_queries_asked || 0);
    } else if (data.hitl_status === 'CONJECTURE_READY') {
      setHitlMode('conjecture_ready');
      setHitlQueryCount(data.total_queries_asked || 0);
      if (data.conjectured_graph) {
        setGraphData(data.conjectured_graph);
        setNodePositions(computeGraphLayout(data.conjectured_graph));
      }
    } else if (data.hitl_status === 'CONVERGED') {
      setHitlMode('converged');
      setHitlQueryCount(data.total_queries_asked || 0);
      const finalG = data.final_graph || data.graph;
      if (finalG) {
        setGraphData(finalG);
        setNodePositions(computeGraphLayout(finalG));
      }
      fireConfetti();
    }
  };

  // Generate Model
  const handleGenerateModel = async (type) => {
    if (!preprocessed?.is_valid) return;
    setModelType(type);
    setIsGenerating(true);
    setHitlMode('idle');
    setHitlQuery(null);
    setHitlQueryCount(0);
    setHitlFeedback(null);
    setSimulationTrace(null);
    setCurrentStepIndex(0);
    setErrorMsg(null);

    try {
      const data = await api.trainModel({
        sessionId,
        modelType: type,
        positiveStrings: preprocessed.positive_strings,
        negativeStrings: preprocessed.negative_strings,
        alphabet: preprocessed.alphabet,
      });

      const firstGraph = data.first_pass_graph || data.graph;
      const firstMetrics = data.first_pass_metrics || data.metrics;

      if (firstGraph) {
        setGraphData(firstGraph);
        setNodePositions(computeGraphLayout(firstGraph));
      }
      if (firstMetrics) setModelMetrics(firstMetrics);
      if (data.inference_engine) setInferenceEngine(data.inference_engine);

      if (data.needs_hitl) {
        processHitlResponse(data);
      } else {
        setHitlMode('converged');
        fireConfetti(1800);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Model training failed.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Answer Query
  const handleAnswerQuery = async (isAccepted) => {
    try {
      const data = await api.answerHitlQuery(sessionId, isAccepted);
      processHitlResponse(data);
    } catch (err) {
      setErrorMsg(err.message || 'Error sending answer.');
    }
  };

  // Skip HITL
  const handleSkipHitl = async () => {
    try {
      const data = await api.skipHitl(sessionId);
      processHitlResponse(data);
    } catch (err) {
      setErrorMsg(err.message || 'Error skipping queries.');
    }
  };

  // Confirm Conjecture or Counterexample
  const handleConfirmConjecture = async (counterexample, expectedLabel = null) => {
    try {
      const data = await api.confirmHitlConjecture(sessionId, counterexample, expectedLabel);
      processHitlResponse(data);
    } catch (err) {
      setErrorMsg(err.message || 'Error confirming conjecture.');
    }
  };

  // Simulation
  const handleRunSimulation = async (str) => {
    if (!graphData) return;
    setIsPlaying(false);
    if (timerRef.current) clearInterval(timerRef.current);

    try {
      const trace = await api.simulateString(sessionId, str);
      setSimulationTrace(trace);
      setCurrentStepIndex(0);
    } catch (err) {
      setErrorMsg(err.message || 'Simulation failed. Train a model first.');
    }
  };

  // Animation Playback
  useEffect(() => {
    if (isPlaying) {
      const intervalMs = Math.round(800 / playbackSpeed);
      timerRef.current = setInterval(() => {
        setCurrentStepIndex((prev) => {
          if (simulationTrace && prev < simulationTrace.steps.length - 1) {
            return prev + 1;
          } else {
            setIsPlaying(false);
            clearInterval(timerRef.current);
            return prev;
          }
        });
      }, intervalMs);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, simulationTrace, playbackSpeed]);

  const handlePlayPause = () => setIsPlaying(!isPlaying);
  const handleStepNext = () => {
    if (simulationTrace && currentStepIndex < simulationTrace.steps.length - 1) {
      setCurrentStepIndex((p) => p + 1);
    }
  };
  const handleStepPrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((p) => p - 1);
    }
  };
  const handleResetSimulation = () => {
    setIsPlaying(false);
    if (timerRef.current) clearInterval(timerRef.current);
    setCurrentStepIndex(0);
  };

  // Handle Benchmark Select
  const handleSelectBenchmark = (item) => {
    setCsvContent(item.csv);
    handlePreprocess(item.csv);
  };

  // Active step in execution
  const currentStep = simulationTrace?.steps?.[currentStepIndex];
  const activeState = currentStep?.active_states?.[0] || (currentStepIndex === 0 && graphData?.initial_state);
  const activeEdgeId = currentStep?.traversed_edge_ids?.[0];
  const consumedSymbol = currentStep?.consumed_symbol;

  // Compute active workflow step number
  let currentWorkflowStep = 1;
  if (graphData) {
    if (simulationTrace) {
      currentWorkflowStep = 4;
    } else if (hitlMode === 'querying' || hitlMode === 'conjecture_ready') {
      currentWorkflowStep = 3;
    } else {
      currentWorkflowStep = 2;
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Header */}
      <Header
        sessionId={sessionId}
        onOpenBenchmarks={() => setIsBenchmarkModalOpen(true)}
        onOpenHelp={() => setIsHelpModalOpen(true)}
      />

      {/* Error Banner */}
      {errorMsg && (
        <div className="bg-rose-950/80 border-b border-rose-800 text-rose-200 px-6 py-2.5 text-xs font-semibold flex items-center justify-between animate-fadeIn">
          <span>⚠️ {errorMsg}</span>
          <button
            onClick={() => setErrorMsg(null)}
            className="text-rose-400 hover:text-white font-bold ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Container */}
      <main className="max-w-7xl mx-auto w-full p-6 flex-1 flex flex-col">
        {/* Guided Workflow Steps Stepper */}
        <WorkflowSteps
          currentStep={currentWorkflowStep}
          isConverged={hitlMode === 'converged'}
        />

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-12 gap-6 flex-1 items-start">
          {/* Left Column: Data Input, HITL, & Simulation Controls */}
          <div className="col-span-12 lg:col-span-5 flex flex-col gap-5">
            {/* 1. Dataset Input Panel */}
            <DatasetPanel
              csvContent={csvContent}
              setCsvContent={setCsvContent}
              preprocessed={preprocessed}
              isPreprocessing={isPreprocessing}
              onPreprocess={handlePreprocess}
              onGenerateModel={handleGenerateModel}
              isGenerating={isGenerating}
              activeModelType={modelType}
              onOpenBenchmarks={() => setIsBenchmarkModalOpen(true)}
            />

            {/* 2. Active Learning (HITL) Panel */}
            {graphData && (
              <ActiveLearningPanel
                hitlMode={hitlMode}
                hitlQuery={hitlQuery}
                hitlQueryCount={hitlQueryCount}
                onAnswerQuery={handleAnswerQuery}
                onSkipHitl={handleSkipHitl}
                onConfirmConjecture={handleConfirmConjecture}
                hitlFeedback={hitlFeedback}
                modelMetrics={modelMetrics}
                modelType={modelType}
                inferenceEngine={inferenceEngine}
                alphabet={preprocessed?.alphabet || ['0', '1']}
              />
            )}

            {/* 3. Interactive String Testing & Tape */}
            {graphData && (
              <SimulationPanel
                testString={testString}
                setTestString={setTestString}
                onRunSimulation={handleRunSimulation}
                simulationTrace={simulationTrace}
                currentStepIndex={currentStepIndex}
                onStepNext={handleStepNext}
                onStepPrev={handleStepPrev}
                onPlayPause={handlePlayPause}
                onReset={handleResetSimulation}
                isPlaying={isPlaying}
                playbackSpeed={playbackSpeed}
                setPlaybackSpeed={setPlaybackSpeed}
                activeState={activeState}
                initialState={graphData.initial_state}
                alphabet={preprocessed?.alphabet || ['0', '1']}
              />
            )}
          </div>

          {/* Right Column: Interactive Graph Visualization & Transition Table */}
          <div className="col-span-12 lg:col-span-7 flex flex-col gap-4">
            <GraphCanvas
              graphData={graphData}
              nodePositions={nodePositions}
              setNodePositions={setNodePositions}
              activeState={activeState}
              activeEdgeId={activeEdgeId}
              inferenceEngine={inferenceEngine}
              isConverged={hitlMode === 'converged'}
              automatonType={modelType.toUpperCase()}
            />

            {/* Inferred Model Metrics Bar */}
            <MetricsBar
              modelMetrics={modelMetrics}
              graphData={graphData}
              inferenceEngine={inferenceEngine}
            />

            {/* Transition Function Table δ(q, σ) */}
            <TransitionTable
              graphData={graphData}
              activeState={activeState}
              consumedSymbol={consumedSymbol}
              automatonType={modelType.toUpperCase()}
            />
          </div>
        </div>
      </main>

      {/* Benchmarks Catalog Modal */}
      <BenchmarkModal
        isOpen={isBenchmarkModalOpen}
        onClose={() => setIsBenchmarkModalOpen(false)}
        onSelectBenchmark={handleSelectBenchmark}
      />

      {/* Workflow Guide Modal */}
      <QuickHelpModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
      />
    </div>
  );
}
