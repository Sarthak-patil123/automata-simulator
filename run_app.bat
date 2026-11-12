@echo off
echo ===================================================================
echo  AURELIA: Formal Automata Inference & Visualization Studio
echo ===================================================================
echo Starting local web server on port 8000...
start "" http://localhost:8000
python server.py 8000
pause

