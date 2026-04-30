// ============================================================
// ATS Resume Matcher — Frontend Logic
// ============================================================

// Word counter
function countWords(text) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

document.getElementById('resume-input').addEventListener('input', function () {
  document.getElementById('resume-count').textContent = countWords(this.value) + ' words';
});

document.getElementById('jd-input').addEventListener('input', function () {
  document.getElementById('jd-count').textContent = countWords(this.value) + ' words';
});

// ============================================================
// Analyze Resume
// ============================================================
async function analyzeResume() {
  const resume = document.getElementById('resume-input').value.trim();
  const jobDesc = document.getElementById('jd-input').value.trim();

  if (!resume || !jobDesc) {
    shake(resume ? 'jd-card' : 'resume-card');
    return;
  }

  // Show loading
  const btn = document.getElementById('analyze-btn');
  btn.disabled = true;
  showLoading();

  try {
    const response = await fetch('/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resume, job_desc: jobDesc })
    });

    const data = await response.json();

    if (data.error) {
      alert('Error: ' + data.error);
      return;
    }

    hideLoading();
    renderResults(data);

  } catch (err) {
    hideLoading();
    alert('Server error. Make sure Flask is running.');
    console.error(err);
  } finally {
    btn.disabled = false;
  }
}

// ============================================================
// Render Results
// ============================================================
function renderResults(data) {
  const resultsEl = document.getElementById('results');
  resultsEl.style.display = 'block';

  setTimeout(() => {
    resultsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 100);

  // ATS Score ring animation
  const score = data.ats_score;
  const circumference = 314;
  const offset = circumference - (score / 100) * circumference;

  document.getElementById('ring-fill').style.strokeDashoffset = offset;
  document.getElementById('ats-score-display').textContent = score + '%';

  // Ring color based on score
  const ring = document.getElementById('ring-fill');
  if (score >= 75) ring.style.stroke = '#00e5b4';
  else if (score >= 50) ring.style.stroke = '#ffd166';
  else ring.style.stroke = '#ff4b6e';

  // Verdict
  const verdictEl = document.getElementById('score-verdict');
  if (score >= 80) {
    verdictEl.textContent = '✓ STRONG MATCH';
    verdictEl.style.color = '#00e5b4';
  } else if (score >= 60) {
    verdictEl.textContent = '~ GOOD MATCH';
    verdictEl.style.color = '#ffd166';
  } else if (score >= 40) {
    verdictEl.textContent = '! NEEDS WORK';
    verdictEl.style.color = '#ffd166';
  } else {
    verdictEl.textContent = '✕ WEAK MATCH';
    verdictEl.style.color = '#ff4b6e';
  }

  // Metric bars
  setTimeout(() => {
    document.getElementById('similarity-bar').style.width = data.similarity + '%';
    document.getElementById('similarity-val').textContent = data.similarity + '%';
    document.getElementById('lcs-bar').style.width = data.lcs_percent + '%';
    document.getElementById('lcs-val').textContent = data.lcs_percent + '%';
  }, 200);

  // Stats
  document.getElementById('matched-count').textContent = data.matched_count;
  document.getElementById('missing-count').textContent = data.missing_count;
  document.getElementById('lcs-raw').textContent = data.lcs_score;
  document.getElementById('missing-badge').textContent = data.missing_count;
  document.getElementById('matched-badge').textContent = data.matched_count;

  // Missing keywords
  const missingTags = document.getElementById('missing-tags');
  missingTags.innerHTML = '';
  if (data.missing_keywords.length === 0) {
    missingTags.innerHTML = '<span style="font-family:var(--mono);font-size:0.7rem;color:var(--text-muted);">No missing keywords!</span>';
  } else {
    data.missing_keywords.slice(0, 40).forEach((kw, i) => {
      const tag = document.createElement('span');
      tag.className = 'kw-tag missing';
      tag.textContent = kw;
      tag.style.animationDelay = (i * 0.02) + 's';
      missingTags.appendChild(tag);
    });
  }

  // Matched keywords
  const matchedTags = document.getElementById('matched-tags');
  matchedTags.innerHTML = '';
  if (data.matched_keywords.length === 0) {
    matchedTags.innerHTML = '<span style="font-family:var(--mono);font-size:0.7rem;color:var(--text-muted);">No matches found.</span>';
  } else {
    data.matched_keywords.slice(0, 40).forEach((kw, i) => {
      const tag = document.createElement('span');
      tag.className = 'kw-tag matched';
      tag.textContent = kw;
      tag.style.animationDelay = (i * 0.02) + 's';
      matchedTags.appendChild(tag);
    });
  }

  // Tips
  renderTips(data);
}

// ============================================================
// Tips Generator
// ============================================================
function renderTips(data) {
  const tipsEl = document.getElementById('tips-section');
  const tips = [];

  if (data.missing_count > 10) {
    tips.push(`Your resume is missing ${data.missing_count} keywords from the job description. Add the most relevant ones naturally to your skills and experience sections.`);
  }

  if (data.similarity < 40) {
    tips.push(`Edit Distance similarity is low (${data.similarity}%). Try restructuring your resume to use more language from the job description.`);
  }

  if (data.lcs_percent < 50) {
    tips.push(`LCS keyword alignment is ${data.lcs_percent}%. Focus on adding the top missing keywords in your summary or skills section.`);
  }

  if (data.matched_count > data.missing_count) {
    tips.push(`Good foundation! You match ${data.matched_count} keywords. A few targeted additions could push your score significantly higher.`);
  }

  if (data.ats_score >= 75) {
    tips.push(`Strong ATS match! Make sure your formatting uses standard headings like "Experience", "Education", and "Skills" for best parsing results.`);
  }

  if (tips.length === 0) {
    tips.push('Review the missing keywords above and naturally incorporate the most relevant ones into your resume.');
    tips.push('Avoid keyword stuffing — use terms in context within your actual experience descriptions.');
  }

  tipsEl.innerHTML = `
    <div class="tips-title">// RECOMMENDATIONS</div>
    ${tips.map(t => `
      <div class="tip-item">
        <span class="tip-bullet">→</span>
        <span class="tip-text">${t}</span>
      </div>
    `).join('')}
  `;
}

// ============================================================
// Loading Animation
// ============================================================
function showLoading() {
  document.getElementById('results').style.display = 'none';
  const loading = document.getElementById('loading');
  loading.style.display = 'block';

  let progress = 0;
  const fill = document.getElementById('loading-fill');
  const interval = setInterval(() => {
    progress = Math.min(progress + Math.random() * 15, 90);
    fill.style.width = progress + '%';
  }, 200);

  loading._interval = interval;
}

function hideLoading() {
  const loading = document.getElementById('loading');
  const fill = document.getElementById('loading-fill');
  clearInterval(loading._interval);
  fill.style.width = '100%';
  setTimeout(() => { loading.style.display = 'none'; }, 300);
}

// ============================================================
// Reset Form
// ============================================================
function resetForm() {
  document.getElementById('results').style.display = 'none';
  document.getElementById('resume-input').value = '';
  document.getElementById('jd-input').value = '';
  document.getElementById('resume-count').textContent = '0 words';
  document.getElementById('jd-count').textContent = '0 words';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================================
// Shake animation for empty fields
// ============================================================
function shake(id) {
  const el = document.getElementById(id);
  el.style.animation = 'shake 0.4s ease';
  el.style.borderColor = 'var(--red)';
  setTimeout(() => {
    el.style.animation = '';
    el.style.borderColor = '';
  }, 500);
}

// Inject shake keyframe
const style = document.createElement('style');
style.textContent = `
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    20% { transform: translateX(-6px); }
    40% { transform: translateX(6px); }
    60% { transform: translateX(-4px); }
    80% { transform: translateX(4px); }
  }
`;
document.head.appendChild(style);

// Enter key support
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key === 'Enter') analyzeResume();
});
