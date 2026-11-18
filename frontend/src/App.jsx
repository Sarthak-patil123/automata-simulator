import React, { useState, useEffect, useRef } from 'react';
import LandingPage from './components/LandingPage';
import TopBar from './components/TopBar';
import LeftPanel from './components/LeftPanel';
import RightPanel from './components/RightPanel';
import GraphCanvas from './components/GraphCanvas';
import BottomDock from './components/BottomDock';
import BenchmarkModal from './components/BenchmarkModal';
import QuickHelpModal from './components/QuickHelpModal';
import TestcaseGeneratorModal from './components/TestcaseGeneratorModal';
import { api } from './services/api';
import { computeGraphLayout } from './utils/graphLayout';
import { fireConfetti } from './utils/confetti';
import { simulateAutomaton } from './utils/simulation';
import { QUICK_SAMPLES, BENCHMARK_QUESTIONS } from './data/benchmarkQuestions';

export default function App() {
  const [sessionId, setSessionId] = useState(() => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return 'sess_' + Math.random().toString(36).substring(2, 11);
  });

  // Current view: 'landing' or 'simulator'
  const [currentView, setCurrentView] = useState('landing');

  // Drawer states
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);

  // Active benchmark / preset info
  const [activeBenchmarkTitle, setActiveBenchmarkTitle] = useState('End with 01');
  const [activePresetKey, setActivePresetKey] = useState('ends_with_01');

  // Dataset & Preprocessing
  const [csvContent, setCsvContent] = useState(
    QUICK_SAMPLES.ends_with_01?.csv || QUICK_SAMPLES.ends_with_0?.csv || ''
  );
  const [preprocessed, setPreprocessed] = useState(null);
  const [isPreprocessing, setIsPreprocessing] = useState(false);

  // Model & Graph
  const [modelType, setModelType] = useState('dfa');
  const [isGenerating, setIsGenerating] = useState(false);
  const [graphData, setGraphData] = useState(null);
  const [nodePositions, setNodePositions] = useState({});
  const [modelMetrics, setModelMetrics] = useState(null);
  const [inferenceEngine, setInferenceEngine] = useState(null);

  // State selection in canvas
  const [selectedNodeId, setSelectedNodeId] = useState(null);

  // HITL Active Learning
  const [hitlMode, setHitlMode] = useState('idle'); // 'idle' | 'querying' | 'conjecture_ready' | 'converged'
  const [hitlQuery, setHitlQuery] = useState(null);
  const [hitlQueryCount, setHitlQueryCount] = useState(0);
  const [hitlFeedback, setHitlFeedback] = useState(null);

  // Simulation
  const [testString, setTestString] = useState('101');
  const [simulationTrace, setSimulationTrace] = useState(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  // Modals & Errors
  const [isBenchmarkModalOpen, setIsBenchmarkModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isGeneratorModalOpen, setIsGeneratorModalOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Initial Preprocess & auto warm-start
  useEffect(() => {
    handlePreprocess(csvContent, true);
  }, []);

  const handlePreprocess = async (text, autoTrain = false, overrideType = null) => {
    setIsPreprocessing(true);
    setErrorMsg(null);
    try {
      const data = await api.preprocessCsv(text);
      setPreprocessed(data);
      if (autoTrain && data.is_valid) {
        trainInitialModel(data, overrideType || modelType);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to preprocess CSV. Ensure backend is running.');
    } finally {
      setIsPreprocessing(false);
    }
  };

  const trainInitialModel = async (prepData, type) => {
    setIsGenerating(true);
    try {
      const activeType = type || modelType || 'dfa';
      const data = await api.trainModel({
        sessionId,
        modelType: activeType,
        positiveStrings: prepData.positive_strings,
        negativeStrings: prepData.negative_strings,
        alphabet: prepData.alphabet,
      });

      const firstGraph = data.first_pass_graph || data.graph;
      const firstMetrics = data.first_pass_metrics || data.metrics;

      if (firstGraph) {
        setGraphData(firstGraph);
        setNodePositions(computeGraphLayout(firstGraph));

        // Initialize simulation with sample string
        const initTrace = simulateAutomaton(firstGraph, testString, type);
        setSimulationTrace(initTrace);
        setCurrentStepIndex(0);
        if (initTrace.steps.length > 1) {
          setIsPlaying(true);
        }
      }
      if (firstMetrics) setModelMetrics(firstMetrics);
      if (data.inference_engine) setInferenceEngine(data.inference_engine);

      if (data.needs_hitl) {
        processHitlResponse(data);
      } else {
        setHitlMode('converged');
      }
    } catch (err) {
      // Backend may not be running during initial page load
    } finally {
      setIsGenerating(false);
    }
  };

  // Route HITL response updates (drawers do NOT auto-open unless user explicitly asks)
  const processHitlResponse = (data, autoOpen = false) => {
    if (data.inference_engine) setInferenceEngine(data.inference_engine);
    if (data.metrics) setModelMetrics(data.metrics);
    if (data.message) setHitlFeedback(data.message);

    if (data.hitl_status === 'NEED_MEMBERSHIP_QUERY') {
      setHitlMode('querying');
      if (autoOpen) setLeftOpen(true);
      setHitlQuery({
        query_string: data.query_string,
        query_index: data.query_index,
        total_queries: data.total_queries,
        total_queries_asked: data.total_queries_asked,
      });
      setHitlQueryCount(data.total_queries_asked || 0);
    } else if (data.hitl_status === 'CONJECTURE_READY') {
      setHitlMode('conjecture_ready');
      if (autoOpen) setLeftOpen(true);
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
    }
  };

  // Handle Dataset Preset Selection (Fixes Issue #3)
  const handleSelectPreset = async (key, presetData) => {
    setActivePresetKey(key);
    const sample = presetData || QUICK_SAMPLES[key];
    if (!sample) return;

    setActiveBenchmarkTitle(sample.name);
    setCsvContent(sample.csv);
    setIsGenerating(true);
    setErrorMsg(null);
    setSimulationTrace(null);
    setCurrentStepIndex(0);
    setIsPlaying(false);

    try {
      const prep = await api.preprocessCsv(sample.csv);
      setPreprocessed(prep);

      const data = await api.trainModel({
        sessionId,
        modelType,
        positiveStrings: prep.positive_strings,
        negativeStrings: prep.negative_strings,
        alphabet: prep.alphabet,
      });

      const firstGraph = data.first_pass_graph || data.graph;
      const firstMetrics = data.first_pass_metrics || data.metrics;

      if (firstGraph) {
        setGraphData(firstGraph);
        setNodePositions(computeGraphLayout(firstGraph));
      }
      if (firstMetrics) setModelMetrics(firstMetrics);
      if (data.inference_engine) setInferenceEngine(data.inference_engine);

      const sampleStr = sample.sampleString || prep.positive_strings?.[0] || '01';
      setTestString(sampleStr);

      if (data.needs_hitl) {
        processHitlResponse(data);
      } else {
        setHitlMode('converged');
      }

      // Automatically evaluate simulation for new preset
      if (firstGraph) {
        const localTrace = simulateAutomaton(firstGraph, sampleStr, modelType);
        setSimulationTrace(localTrace);
        setCurrentStepIndex(0);
        if (localTrace.steps.length > 1) {
          setIsPlaying(true);
        }
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to switch preset.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate / Switch Model (DFA / NFA)
  const handleGenerateModel = async (type) => {
    setModelType(type);
    setIsGenerating(true);
    setHitlMode('idle');
    setHitlQuery(null);
    setHitlQueryCount(0);
    setHitlFeedback(null);
    setSimulationTrace(null);
    setCurrentStepIndex(0);
    setIsPlaying(false);
    setErrorMsg(null);

    // If preprocessed data is available, try synthesizing machine
    if (preprocessed?.is_valid) {
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

          const initTrace = simulateAutomaton(firstGraph, testString, type);
          setSimulationTrace(initTrace);
          setCurrentStepIndex(0);
          if (initTrace.steps.length > 1) {
            setIsPlaying(true);
          }
        }
        if (firstMetrics) setModelMetrics(firstMetrics);
        if (data.inference_engine) setInferenceEngine(data.inference_engine);

        // Update HITL status without forcing drawers open or firing unexpected popovers
        if (data.needs_hitl) {
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
          }
        } else {
          setHitlMode('converged');
        }
      } catch (err) {
        console.warn('Backend machine synthesis notice:', err.message);
        // Fallback: preserve existing graph and switch simulation engine to target type
        if (graphData) {
          const initTrace = simulateAutomaton(graphData, testString, type);
          setSimulationTrace(initTrace);
          setCurrentStepIndex(0);
          if (initTrace.steps.length > 1) {
            setIsPlaying(true);
          }
        }
      } finally {
        setIsGenerating(false);
      }
    } else {
      // If no dataset is loaded yet, update active simulation on current graph
      if (graphData) {
        const initTrace = simulateAutomaton(graphData, testString, type);
        setSimulationTrace(initTrace);
        setCurrentStepIndex(0);
        if (initTrace.steps.length > 1) {
          setIsPlaying(true);
        }
      }
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

  // Simulation Runner - Pure frontend mathematically verified execution
  const handleRunSimulation = (str) => {
    if (!graphData) return;
    setIsPlaying(false);

    const cleanStr = str != null ? String(str).trim() : '';

    // Direct mathematically verified simulation based strictly on the active graphData
    const localTrace = simulateAutomaton(graphData, cleanStr, modelType);
    setSimulationTrace(localTrace);
    setCurrentStepIndex(0);

    // Auto-play trace if multi-step so user watches the tape read and graph traversal
    if (localTrace.steps.length > 1) {
      setIsPlaying(true);
    }
  };

  // Clean, drift-free animation playback
  useEffect(() => {
    if (!isPlaying || !simulationTrace) return;

    const maxStep = simulationTrace.steps.length - 1;
    if (currentStepIndex >= maxStep) {
      setIsPlaying(false);
      return;
    }

    const intervalMs = Math.round(750 / playbackSpeed);
    const timer = setTimeout(() => {
      setCurrentStepIndex((prev) => {
        const next = prev + 1;
        if (next >= maxStep) {
          setIsPlaying(false);
        }
        return next;
      });
    }, intervalMs);

    return () => clearTimeout(timer);
  }, [isPlaying, currentStepIndex, simulationTrace, playbackSpeed]);

  const handlePlayPause = () => {
    if (!simulationTrace) return;
    const maxStep = simulationTrace.steps.length - 1;
    if (currentStepIndex >= maxStep) {
      setCurrentStepIndex(0);
      setIsPlaying(true);
    } else {
      setIsPlaying((p) => !p);
    }
  };
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
    setCurrentStepIndex(0);
  };

  // Handle Benchmark Select (From Landing page or Modal)
  const handleSelectBenchmark = async (item) => {
    setActiveBenchmarkTitle(item.title);
    setActivePresetKey(item.slug || `q_${item.id}`);
    setCsvContent(item.csv);
    setCurrentView('simulator');
    setIsGenerating(true);
    setErrorMsg(null);
    setSimulationTrace(null);
    setCurrentStepIndex(0);
    setIsPlaying(false);

    try {
      const prep = await api.preprocessCsv(item.csv);
      setPreprocessed(prep);

      const isNfa = item.title?.toLowerCase().includes('nfa') || item.slug?.includes('nfa');
      const targetType = isNfa ? 'nfa' : 'dfa';
      setModelType(targetType);

      const data = await api.trainModel({
        sessionId,
        modelType: targetType,
        positiveStrings: prep.positive_strings,
        negativeStrings: prep.negative_strings,
        alphabet: prep.alphabet,
      });

      const firstGraph = data.first_pass_graph || data.graph;
      const firstMetrics = data.first_pass_metrics || data.metrics;

      if (firstGraph) {
        setGraphData(firstGraph);
        setNodePositions(computeGraphLayout(firstGraph));
      }
      if (firstMetrics) setModelMetrics(firstMetrics);
      if (data.inference_engine) setInferenceEngine(data.inference_engine);

      // Extract sample test string
      const posStrings = item.csv
        ? item.csv.split('\n').slice(1).filter((r) => r.endsWith(',1')).map((r) => r.split(',')[0]).filter(Boolean)
        : [];
      const testStr = posStrings[0] || '01';
      setTestString(testStr);

      if (data.needs_hitl) {
        processHitlResponse(data);
      } else {
        setHitlMode('converged');
      }

      if (firstGraph) {
        const localTrace = simulateAutomaton(firstGraph, testStr, targetType);
        setSimulationTrace(localTrace);
        setCurrentStepIndex(0);
        if (localTrace.steps.length > 1) {
          setIsPlaying(true);
        }
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to load benchmark into canvas.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle Dynamic Testcase Generator Application
  const handleApplyGeneratedDataset = async (newCsv, info = {}) => {
    setCsvContent(newCsv);
    if (info.title) setActiveBenchmarkTitle(info.title);
    if (info.slug) setActivePresetKey(info.slug);
    if (info.sampleString) setTestString(info.sampleString);

    const freshSession = 'sess_' + Math.random().toString(36).substring(2, 11);
    setSessionId(freshSession);

    await handlePreprocess(newCsv, true, modelType);
    setIsGeneratorModalOpen(false);
  };

  // Visual Canvas Actions
  const handleAddState = () => {
    const currentNodes = graphData?.nodes || [];
    const newId = `q${currentNodes.length}`;
    const newNodes = [...currentNodes, { id: newId, label: newId }];
    const newGraph = {
      ...(graphData || {
        nodes: [],
        edges: [],
        initial_state: newId,
        accepting_states: [],
        alphabet: preprocessed?.alphabet || ['0', '1'],
      }),
      nodes: newNodes,
      initial_state: graphData?.initial_state || newId,
    };

    setGraphData(newGraph);
    setNodePositions((prev) => ({
      ...prev,
      [newId]: {
        x: 240 + (currentNodes.length % 4) * 90,
        y: 180 + Math.floor(currentNodes.length / 4) * 90,
      },
    }));
    setSelectedNodeId(newId);
  };

  const handleSaveJson = () => {
    if (!graphData) return;
    const blob = new Blob([JSON.stringify(graphData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `automaton_${modelType.toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearCanvas = () => {
    setGraphData(null);
    setSimulationTrace(null);
    setCurrentStepIndex(0);
    setIsPlaying(false);
    setSelectedNodeId(null);
  };

  // Active step in execution
  const currentStep = simulationTrace?.steps?.[currentStepIndex];
  const activeStates =
    currentStep?.active_states ||
    (currentStepIndex === 0 && graphData?.initial_state ? [graphData.initial_state] : []);
  const activeState = activeStates[0] || (currentStepIndex === 0 ? graphData?.initial_state : '');
  const activeEdgeIds = currentStep?.traversed_edge_ids || [];
  const activeEdgeId = activeEdgeIds[0] || null;
  const consumedSymbol = currentStep?.consumed_symbol;

  return (
    <div className="min-h-screen bg-white text-zinc-900 flex flex-col font-sans selection:bg-brand-500 selection:text-white overflow-hidden">
      {/* ── LANDING PAGE VIEW ─────────────────────────────────────── */}
      {currentView === 'landing' ? (
        <LandingPage
          onOpenSimulator={() => setCurrentView('simulator')}
          onLoadExample={handleSelectBenchmark}
          onOpenHelp={() => setIsHelpModalOpen(true)}
          onOpenBenchmarks={() => setIsBenchmarkModalOpen(true)}
        />
      ) : (
        /* ── SIMULATOR WORKSPACE VIEW ─────────────────────────────── */
        <div className="h-screen flex flex-col overflow-hidden bg-white">
          {/* Top Navigation & Simulation Tape Bar (Screenshot 4) */}
          <TopBar
            onOpenLanding={() => setCurrentView('landing')}
            onOpenBenchmarks={() => setIsBenchmarkModalOpen(true)}
            onOpenGenerator={() => setIsGeneratorModalOpen(true)}
            onOpenHelp={() => setIsHelpModalOpen(true)}
            modelType={modelType.toUpperCase()}
            graphData={graphData}
            activeBenchmarkTitle={activeBenchmarkTitle}
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
            activeState={activeState}
          />

          {/* Error Banner */}
          {errorMsg && (
            <div className="bg-rose-50 border-b border-rose-200 text-rose-800 px-6 py-2 text-xs font-semibold flex items-center justify-between animate-fade-in z-30">
              <span>⚠️ {errorMsg}</span>
              <button
                onClick={() => setErrorMsg(null)}
                className="text-rose-400 hover:text-rose-900 font-bold ml-4"
              >
                ✕
              </button>
            </div>
          )}

          {/* Middle 3-Column Working Area (Canvas is primary focus) */}
          <div className="flex flex-1 overflow-hidden relative">
            {/* Left Drawer: Dataset & L* console */}
            {leftOpen && (
              <LeftPanel
                csvContent={csvContent}
                setCsvContent={setCsvContent}
                preprocessed={preprocessed}
                isPreprocessing={isPreprocessing}
                onPreprocess={handlePreprocess}
                onGenerateModel={handleGenerateModel}
                onSelectPreset={handleSelectPreset}
                onRunSimulation={handleRunSimulation}
                setTestString={setTestString}
                activeKey={activePresetKey}
                activeBenchmarkTitle={activeBenchmarkTitle}
                isGenerating={isGenerating}
                activeModelType={modelType}
                onOpenBenchmarks={() => setIsBenchmarkModalOpen(true)}
                onOpenGenerator={() => setIsGeneratorModalOpen(true)}
                hitlMode={hitlMode}
                hitlQuery={hitlQuery}
                hitlQueryCount={hitlQueryCount}
                onAnswerQuery={handleAnswerQuery}
                onSkipHitl={handleSkipHitl}
                onConfirmConjecture={handleConfirmConjecture}
                hitlFeedback={hitlFeedback}
                modelMetrics={modelMetrics}
                inferenceEngine={inferenceEngine}
                alphabet={preprocessed?.alphabet || ['0', '1']}
                graphData={graphData}
                onClose={() => setLeftOpen(false)}
              />
            )}

            {/* Main Interactive Automata Canvas (Screenshot 4) */}
            <GraphCanvas
              graphData={graphData}
              setGraphData={setGraphData}
              nodePositions={nodePositions}
              setNodePositions={setNodePositions}
              activeState={activeState}
              activeStates={activeStates}
              activeEdgeId={activeEdgeId}
              activeEdgeIds={activeEdgeIds}
              currentStep={currentStep}
              inferenceEngine={inferenceEngine}
              isConverged={hitlMode === 'converged'}
              automatonType={modelType.toUpperCase()}
              selectedNodeId={selectedNodeId}
              setSelectedNodeId={setSelectedNodeId}
            />

            {/* Right Drawer: Transition Table & Metrics Inspector */}
            {rightOpen && (
              <RightPanel
                graphData={graphData}
                activeState={activeState}
                fromState={currentStep?.from_state}
                consumedSymbol={consumedSymbol}
                modelMetrics={modelMetrics}
                inferenceEngine={inferenceEngine}
                automatonType={modelType.toUpperCase()}
                onClose={() => setRightOpen(false)}
              />
            )}

            {/* Bottom Floating Action Toolbar (Screenshot 4) */}
            <BottomDock
              onAddState={handleAddState}
              onOpenBenchmarks={() => setIsBenchmarkModalOpen(true)}
              leftOpen={leftOpen}
              onToggleLeft={() => setLeftOpen((prev) => !prev)}
              rightOpen={rightOpen}
              onToggleRight={() => setRightOpen((prev) => !prev)}
              onExportSvg={() => document.dispatchEvent(new CustomEvent('export-svg'))}
              onSaveJson={handleSaveJson}
              onClearCanvas={handleClearCanvas}
              onGenerateDfa={() => handleGenerateModel('dfa')}
              onGenerateNfa={() => handleGenerateModel('nfa')}
              canGenerate={Boolean(preprocessed?.is_valid && !isGenerating)}
              isGenerating={isGenerating}
              activeModelType={modelType}
              graphData={graphData}
            />
          </div>
        </div>
      )}

      {/* Modals */}
      <TestcaseGeneratorModal
        isOpen={isGeneratorModalOpen}
        onClose={() => setIsGeneratorModalOpen(false)}
        activeLanguageTitle={activeBenchmarkTitle}
        activePresetKey={activePresetKey}
        onApplyDataset={handleApplyGeneratedDataset}
        graphData={graphData}
      />
      <BenchmarkModal
        isOpen={isBenchmarkModalOpen}
        onClose={() => setIsBenchmarkModalOpen(false)}
        onSelectBenchmark={handleSelectBenchmark}
      />
      <QuickHelpModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
      />
    </div>
  );
}
