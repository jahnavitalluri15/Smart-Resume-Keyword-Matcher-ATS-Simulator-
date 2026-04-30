from flask import Flask, render_template, request, jsonify
import re

app = Flask(__name__)

# ---------------------------
# Clean Text
# ---------------------------
def clean_text(text):
    text = text.lower()
    text = re.sub(r'[^a-zA-Z0-9 ]', '', text)
    return text

# ---------------------------
# Extract Keywords
# ---------------------------
def extract_keywords(text):
    words = clean_text(text).split()
    stopwords = {
        'the', 'is', 'and', 'in', 'to', 'for', 'of',
        'a', 'an', 'on', 'with', 'by', 'at', 'from',
        'we', 'you', 'are', 'be', 'will', 'have', 'has',
        'or', 'that', 'this', 'it', 'as', 'your', 'our'
    }
    keywords = [word for word in words if word not in stopwords and len(word) > 2]
    return list(set(keywords))

# ---------------------------
# Edit Distance (DP)
# ---------------------------
def edit_distance(str1, str2):
    m, n = len(str1), len(str2)
    dp = [[0] * (n + 1) for _ in range(m + 1)]
    for i in range(m + 1):
        dp[i][0] = i
    for j in range(n + 1):
        dp[0][j] = j
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if str1[i - 1] == str2[j - 1]:
                dp[i][j] = dp[i - 1][j - 1]
            else:
                dp[i][j] = 1 + min(
                    dp[i - 1][j],     # delete
                    dp[i][j - 1],     # insert
                    dp[i - 1][j - 1]  # replace
                )
    return dp[m][n]

# ---------------------------
# LCS Algorithm
# ---------------------------
def lcs(X, Y):
    m, n = len(X), len(Y)
    dp = [[0] * (n + 1) for _ in range(m + 1)]
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if X[i - 1] == Y[j - 1]:
                dp[i][j] = dp[i - 1][j - 1] + 1
            else:
                dp[i][j] = max(dp[i - 1][j], dp[i][j - 1])
    return dp[m][n]

# ---------------------------
# Similarity Score (Edit Distance based)
# ---------------------------
def compute_similarity(resume_clean, job_clean):
    # For long texts, use word-level edit distance for speed
    resume_words = resume_clean.split()
    job_words = job_clean.split()
    dist = edit_distance(resume_words[:80], job_words[:80])  # cap for performance
    max_len = max(len(resume_words[:80]), len(job_words[:80]))
    if max_len == 0:
        return 0
    return round((1 - dist / max_len) * 100, 1)

# ---------------------------
# Resume Matcher
# ---------------------------
def resume_matcher(resume, job_desc):
    resume_clean = clean_text(resume)
    job_clean = clean_text(job_desc)

    # Edit Distance Similarity
    similarity = compute_similarity(resume_clean, job_clean)

    # Keyword Matching
    resume_keywords = extract_keywords(resume)
    job_keywords = extract_keywords(job_desc)

    matched = []
    missing = []
    for word in job_keywords:
        if word in resume_keywords:
            matched.append(word)
        else:
            missing.append(word)

    # LCS Score on keyword lists
    lcs_score = lcs(resume_keywords, job_keywords)
    lcs_percent = round((lcs_score / max(len(job_keywords), 1)) * 100, 1)

    # Overall ATS Score (weighted)
    ats_score = round((similarity * 0.4) + (lcs_percent * 0.6), 1)

    return {
        "ats_score": min(ats_score, 100),
        "similarity": similarity,
        "lcs_score": lcs_score,
        "lcs_percent": lcs_percent,
        "matched_keywords": sorted(matched),
        "missing_keywords": sorted(missing),
        "total_job_keywords": len(job_keywords),
        "matched_count": len(matched),
        "missing_count": len(missing),
    }

# ---------------------------
# Routes
# ---------------------------
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/analyze', methods=['POST'])
def analyze():
    data = request.get_json()
    resume = data.get('resume', '').strip()
    job_desc = data.get('job_desc', '').strip()

    if not resume or not job_desc:
        return jsonify({"error": "Both fields are required"}), 400

    result = resume_matcher(resume, job_desc)
    return jsonify(result)

if __name__ == '__main__':
    app.run(debug=True)
