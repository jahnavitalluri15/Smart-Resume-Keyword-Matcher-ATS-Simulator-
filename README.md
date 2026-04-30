# ATS Resume Keyword Matcher

A smart ATS simulator using Dynamic Programming algorithms.

## Algorithms Used
- **Edit Distance (DP)** → Calculates text similarity between resume & JD
- **LCS (Longest Common Subsequence)** → Keyword matching score
- **Keyword Extraction** → Stopword filtering + set comparison

## Project Structure
```
ats-matcher/
├── app.py              ← Flask backend (all algorithms here)
├── requirements.txt    ← Dependencies
├── templates/
│   └── index.html      ← Frontend HTML
└── static/
    ├── style.css       ← Styling
    └── script.js       ← Frontend logic
```

## How to Run in VS Code

### Step 1: Open the folder in VS Code
```
File → Open Folder → select ats-matcher/
```

### Step 2: Create virtual environment (recommended)
```bash
python -m venv venv
venv\Scripts\activate        # Windows
source venv/bin/activate     # Mac/Linux
```

### Step 3: Install dependencies
```bash
pip install -r requirements.txt
```

### Step 4: Run the app
```bash
python app.py
```

### Step 5: Open browser
Go to: http://127.0.0.1:5000

## Usage
1. Paste your resume text in the left box
2. Paste the job description in the right box
3. Click **RUN ANALYSIS** (or press Ctrl+Enter)
4. View your ATS score, matched/missing keywords, and tips

## Scoring Explanation
- **ATS Score** = 40% Edit Distance Similarity + 60% LCS Keyword Match
- **Edit Distance Similarity** = How similar the overall text is
- **LCS Keyword Score** = What % of job keywords appear in resume
