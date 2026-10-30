export interface WebDevTest {
  id: string;
  description: string;
  testFn: string; // Evaluated in the sandbox context: returns boolean or throws error
}

export interface WebDevChallenge {
  id: string;
  title: string;
  category: "components" | "dom" | "react" | "playground";
  difficulty: "EASY" | "MEDIUM" | "HARD";
  description: string;
  instructions: string[];
  points: number;
  tags: string[];
  files: {
    html: string;
    css: string;
    js: string;
  };
  tests: WebDevTest[];
}

export const webdevChallenges: WebDevChallenge[] = [
  {
    id: "dynamic_counter",
    title: "Interactive Dynamic Counter",
    category: "components",
    difficulty: "EASY",
    description: "Build an interactive counter app that increments, decrements, and resets the count. It should feature a status badge reflecting whether the number is Positive, Zero, or Negative, and clamp between -10 and 10.",
    instructions: [
      "Clicking `#btn-increment` increases count by 1 (max +10).",
      "Clicking `#btn-decrement` decreases count by 1 (min -10).",
      "Clicking `#btn-reset` resets count to 0.",
      "Update `#count-display` with the current number.",
      "Update `#badge-status` text to 'Positive', 'Zero', or 'Negative' with corresponding classes."
    ],
    points: 15,
    tags: ["DOM", "Events", "CSS", "UI"],
    files: {
      html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Dynamic Counter</title>
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <div class="counter-container">
    <div class="counter-card">
      <span class="badge" id="badge-status">Zero</span>
      <h1 class="count" id="count-display">0</h1>
      <p class="subtitle">Clamped between -10 and +10</p>
      
      <div class="button-group">
        <button id="btn-decrement" class="btn btn-danger">−</button>
        <button id="btn-reset" class="btn btn-secondary">Reset</button>
        <button id="btn-increment" class="btn btn-primary">+</button>
      </div>
    </div>
  </div>
  <script src="script.js"></script>
</body>
</html>`,
      css: `* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  background: radial-gradient(circle at 50% 10%, #1e293b, #0f172a);
  color: #f8fafc;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.counter-container {
  width: 100%;
  max-width: 360px;
}

.counter-card {
  background: rgba(30, 41, 59, 0.7);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 32px 24px;
  text-align: center;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
}

.badge {
  display: inline-block;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  padding: 4px 12px;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.2);
  color: #94a3b8;
  margin-bottom: 12px;
  transition: all 0.2s ease;
}

.badge.positive {
  background: rgba(16, 185, 129, 0.2);
  color: #34d399;
}

.badge.negative {
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
}

.count {
  font-size: 72px;
  font-weight: 800;
  margin: 10px 0;
  color: #ffffff;
  transition: transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.subtitle {
  font-size: 13px;
  color: #64748b;
  margin-bottom: 28px;
}

.button-group {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.btn {
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  padding: 12px 20px;
  transition: all 0.15s ease;
  user-select: none;
}

.btn:active {
  transform: scale(0.95);
}

.btn-primary {
  background: #0284c7;
  color: #ffffff;
  flex: 1;
}

.btn-primary:hover {
  background: #0369a1;
}

.btn-danger {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.3);
  flex: 1;
}

.btn-danger:hover {
  background: rgba(239, 68, 68, 0.3);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.08);
  color: #cbd5e1;
  flex: 1;
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.15);
}`,
      js: `// Implement the Counter Logic below
let count = 0;
const MIN_LIMIT = -10;
const MAX_LIMIT = 10;

const countDisplay = document.getElementById("count-display");
const badgeStatus = document.getElementById("badge-status");
const btnIncrement = document.getElementById("btn-increment");
const btnDecrement = document.getElementById("btn-decrement");
const btnReset = document.getElementById("btn-reset");

function updateUI() {
  countDisplay.textContent = count;
  
  if (count > 0) {
    badgeStatus.textContent = "Positive";
    badgeStatus.className = "badge positive";
  } else if (count < 0) {
    badgeStatus.textContent = "Negative";
    badgeStatus.className = "badge negative";
  } else {
    badgeStatus.textContent = "Zero";
    badgeStatus.className = "badge";
  }
}

btnIncrement.addEventListener("click", () => {
  if (count < MAX_LIMIT) {
    count++;
    updateUI();
  }
});

btnDecrement.addEventListener("click", () => {
  if (count > MIN_LIMIT) {
    count--;
    updateUI();
  }
});

btnReset.addEventListener("click", () => {
  count = 0;
  updateUI();
});
`
    },
    tests: [
      {
        id: "elements_exist",
        description: "Contains count-display, badge-status, and control buttons",
        testFn: `Boolean(document.getElementById('count-display') && document.getElementById('badge-status') && document.getElementById('btn-increment') && document.getElementById('btn-decrement'))`
      },
      {
        id: "increment_works",
        description: "Clicking increment button increases count",
        testFn: `(() => {
          const btn = document.getElementById('btn-increment');
          const display = document.getElementById('count-display');
          const initial = parseInt(display.textContent);
          btn.click();
          const after = parseInt(display.textContent);
          return after === initial + 1;
        })()`
      },
      {
        id: "decrement_works",
        description: "Clicking decrement button decreases count",
        testFn: `(() => {
          const btn = document.getElementById('btn-decrement');
          const display = document.getElementById('count-display');
          const initial = parseInt(display.textContent);
          btn.click();
          const after = parseInt(display.textContent);
          return after === initial - 1;
        })()`
      },
      {
        id: "badge_updates",
        description: "Badge status reflects Positive/Negative/Zero text correctly",
        testFn: `(() => {
          const reset = document.getElementById('btn-reset');
          const inc = document.getElementById('btn-increment');
          const badge = document.getElementById('badge-status');
          reset.click();
          if (badge.textContent.trim().toLowerCase() !== 'zero') return false;
          inc.click();
          return badge.textContent.trim().toLowerCase() === 'positive';
        })()`
      }
    ]
  },
  {
    id: "glassmorphism_pricing",
    title: "Glassmorphism Pricing Card",
    category: "components",
    difficulty: "EASY",
    description: "Design a high-converting, frosted-glass pricing card with glowing accents, animated feature highlights, and a modern call-to-action button.",
    instructions: [
      "Ensure `.pricing-card` has backdrop-filter blur and border styling.",
      "Include a `#plan-title` (e.g., 'Pro Developer') and `#plan-price` (e.g., '$29').",
      "Include at least 3 feature check items inside `.feature-list`.",
      "Add a hover scale/glow effect on the `#btn-subscribe` button."
    ],
    points: 20,
    tags: ["CSS", "Glassmorphism", "Layout", "Hover Effects"],
    files: {
      html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Pricing Card</title>
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <div class="pricing-card">
    <div class="popular-tag">MOST POPULAR</div>
    <h3 id="plan-title">Pro Developer</h3>
    <p class="description">Everything you need to master full-stack and competitive coding.</p>
    
    <div class="price-wrapper">
      <span class="currency">$</span>
      <span id="plan-price" class="amount">29</span>
      <span class="period">/ month</span>
    </div>

    <ul class="feature-list">
      <li><span>✓</span> Unlimited 1v1 Coding Duels</li>
      <li><span>✓</span> Real-Time Sandboxed Execution</li>
      <li><span>✓</span> Access to 5,000+ Algorithmic Challenges</li>
      <li><span>✓</span> Custom Badges & Priority Matchmaking</li>
    </ul>

    <button id="btn-subscribe" class="cta-button">Get Started Now →</button>
  </div>
  <script src="script.js"></script>
</body>
</html>`,
      css: `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  background: radial-gradient(ellipse at 80% 20%, #1e1b4b 0%, #030712 100%);
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.pricing-card {
  position: relative;
  width: 100%;
  max-width: 380px;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 24px;
  padding: 40px 32px;
  color: #ffffff;
  box-shadow: 0 30px 60px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2);
  transition: transform 0.3s ease, border-color 0.3s ease;
}

.pricing-card:hover {
  transform: translateY(-6px);
  border-color: rgba(0, 242, 254, 0.4);
}

.popular-tag {
  position: absolute;
  top: -12px;
  right: 28px;
  background: linear-gradient(135deg, #00f2fe, #4facfe);
  color: #030712;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1px;
  padding: 4px 12px;
  border-radius: 999px;
  box-shadow: 0 4px 12px rgba(0, 242, 254, 0.3);
}

#plan-title {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 8px;
}

.description {
  font-size: 13px;
  color: #94a3b8;
  line-height: 1.5;
  margin-bottom: 24px;
}

.price-wrapper {
  display: flex;
  align-items: baseline;
  margin-bottom: 24px;
}

.currency {
  font-size: 22px;
  font-weight: 600;
  color: #94a3b8;
  margin-right: 4px;
}

.amount {
  font-size: 48px;
  font-weight: 800;
  color: #ffffff;
}

.period {
  font-size: 13px;
  color: #94a3b8;
  margin-left: 8px;
}

.feature-list {
  list-style: none;
  margin-bottom: 32px;
}

.feature-list li {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  color: #cbd5e1;
  margin-bottom: 14px;
}

.feature-list li span {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  background: rgba(0, 242, 254, 0.15);
  color: #00f2fe;
  border-radius: 50%;
  font-size: 11px;
  font-weight: bold;
}

.cta-button {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #00f2fe, #0284c7);
  color: #ffffff;
  border: none;
  border-radius: 14px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 10px 25px rgba(2, 132, 199, 0.3);
}

.cta-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 14px 30px rgba(0, 242, 254, 0.4);
}`,
      js: `const subscribeBtn = document.getElementById("btn-subscribe");

subscribeBtn.addEventListener("click", () => {
  subscribeBtn.textContent = "Subscribed! Welcome 🎉";
  subscribeBtn.style.background = "#10b981";
  console.log("Subscribed to Pro Developer plan successfully!");
});
`
    },
    tests: [
      {
        id: "card_structure",
        description: "Pricing card element exists with plan title and price",
        testFn: `Boolean(document.querySelector('.pricing-card') && document.getElementById('plan-title') && document.getElementById('plan-price'))`
      },
      {
        id: "feature_count",
        description: "Feature list contains at least 3 feature items",
        testFn: `document.querySelectorAll('.feature-list li').length >= 3`
      },
      {
        id: "cta_interactive",
        description: "CTA button clicks and handles subscription event",
        testFn: `(() => {
          const btn = document.getElementById('btn-subscribe');
          btn.click();
          return btn.textContent.includes('Subscribed') || btn.textContent.includes('Welcome');
        })()`
      }
    ]
  },
  {
    id: "interactive_todo",
    title: "Task Flow: Interactive Todo App",
    category: "dom",
    difficulty: "MEDIUM",
    description: "Build an interactive task manager that adds tasks, toggles them completed with strikethrough, deletes tasks, and updates the pending tasks counter.",
    instructions: [
      "Typing in `#task-input` and clicking `#btn-add-task` (or pressing Enter) creates a task item.",
      "Clicking a task checkbox toggles `.completed` class on the task label.",
      "Clicking the delete button (`.btn-delete`) removes that task item from the list.",
      "Update `#task-counter` with the count of remaining active tasks."
    ],
    points: 25,
    tags: ["DOM Manipulation", "Forms", "Events", "State"],
    files: {
      html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Task Flow</title>
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <div class="todo-app">
    <header class="app-header">
      <h2>Task Flow</h2>
      <span id="task-counter" class="counter-badge">2 tasks remaining</span>
    </header>

    <div class="input-row">
      <input type="text" id="task-input" placeholder="What needs to be done?" />
      <button id="btn-add-task">Add</button>
    </div>

    <ul id="task-list" class="task-list">
      <li class="task-item">
        <label class="task-label">
          <input type="checkbox" class="task-checkbox" />
          <span>Implement responsive grid system</span>
        </label>
        <button class="btn-delete" title="Delete task">×</button>
      </li>
      <li class="task-item">
        <label class="task-label">
          <input type="checkbox" class="task-checkbox" />
          <span>Optimize Judge0 sandbox memory limit</span>
        </label>
        <button class="btn-delete" title="Delete task">×</button>
      </li>
    </ul>
  </div>
  <script src="script.js"></script>
</body>
</html>`,
      css: `* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  background: #09090b;
  color: #fafafa;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.todo-app {
  width: 100%;
  max-width: 440px;
  background: #18181b;
  border: 1px solid #27272a;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
}

.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.app-header h2 {
  font-size: 20px;
  font-weight: 700;
  color: #00f2fe;
}

.counter-badge {
  font-size: 12px;
  background: #27272a;
  color: #a1a1aa;
  padding: 4px 10px;
  border-radius: 999px;
  font-weight: 500;
}

.input-row {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
}

#task-input {
  flex: 1;
  background: #27272a;
  border: 1px solid #3f3f46;
  border-radius: 10px;
  padding: 10px 14px;
  color: #fafafa;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}

#task-input:focus {
  border-color: #00f2fe;
}

#btn-add-task {
  background: #00f2fe;
  color: #09090b;
  border: none;
  border-radius: 10px;
  padding: 0 18px;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;
}

#btn-add-task:hover {
  background: #38bdf8;
}

.task-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.task-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #27272a;
  padding: 12px 14px;
  border-radius: 10px;
  transition: background 0.2s;
}

.task-item:hover {
  background: #323238;
}

.task-label {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  font-size: 14px;
  flex: 1;
}

.task-checkbox {
  accent-color: #00f2fe;
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.task-item.completed span {
  text-decoration: line-through;
  color: #71717a;
}

.btn-delete {
  background: transparent;
  border: none;
  color: #71717a;
  font-size: 18px;
  cursor: pointer;
  padding: 0 6px;
  transition: color 0.15s;
}

.btn-delete:hover {
  color: #ef4444;
}`,
      js: `const taskInput = document.getElementById("task-input");
const btnAddTask = document.getElementById("btn-add-task");
const taskList = document.getElementById("task-list");
const taskCounter = document.getElementById("task-counter");

function updateCounter() {
  const total = taskList.querySelectorAll(".task-item").length;
  const completed = taskList.querySelectorAll(".task-item.completed").length;
  const remaining = total - completed;
  taskCounter.textContent = \`\${remaining} task\${remaining === 1 ? '' : 's'} remaining\`;
}

function bindTaskEvents(item) {
  const checkbox = item.querySelector(".task-checkbox");
  const deleteBtn = item.querySelector(".btn-delete");

  checkbox.addEventListener("change", () => {
    item.classList.toggle("completed", checkbox.checked);
    updateCounter();
  });

  deleteBtn.addEventListener("click", () => {
    item.remove();
    updateCounter();
  });
}

// Bind existing
document.querySelectorAll(".task-item").forEach(bindTaskEvents);

btnAddTask.addEventListener("click", () => {
  const text = taskInput.value.trim();
  if (!text) return;

  const li = document.createElement("li");
  li.className = "task-item";
  li.innerHTML = \`
    <label class="task-label">
      <input type="checkbox" class="task-checkbox" />
      <span>\${text}</span>
    </label>
    <button class="btn-delete" title="Delete task">×</button>
  \`;

  taskList.appendChild(li);
  bindTaskEvents(li);
  taskInput.value = "";
  updateCounter();
});

taskInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") btnAddTask.click();
});

updateCounter();
`
    },
    tests: [
      {
        id: "input_elements",
        description: "Task input and add task button exist",
        testFn: `Boolean(document.getElementById('task-input') && document.getElementById('btn-add-task'))`
      },
      {
        id: "add_task",
        description: "Adding task increases list items count",
        testFn: `(() => {
          const input = document.getElementById('task-input');
          const btn = document.getElementById('btn-add-task');
          const countBefore = document.querySelectorAll('.task-item').length;
          input.value = "New Test Task Item";
          btn.click();
          const countAfter = document.querySelectorAll('.task-item').length;
          return countAfter === countBefore + 1;
        })()`
      },
      {
        id: "checkbox_toggle",
        description: "Checking checkbox marks task completed",
        testFn: `(() => {
          const firstCheckbox = document.querySelector('.task-checkbox');
          if (!firstCheckbox) return false;
          firstCheckbox.click();
          const item = firstCheckbox.closest('.task-item');
          return item.classList.contains('completed');
        })()`
      }
    ]
  },
  {
    id: "dark_mode_theme",
    title: "Theme Switcher & CSS Variables",
    category: "components",
    difficulty: "EASY",
    description: "Build a fluid Dark/Light mode theme toggle using CSS Custom Properties (CSS variables) and data attributes.",
    instructions: [
      "Clicking `#theme-toggle-btn` toggles the active theme between 'light' and 'dark'.",
      "Update `document.body` or `.theme-card` with `data-theme='dark'` or `data-theme='light'`.",
      "Update `#theme-label` to display 'Dark Mode' or 'Light Mode'.",
      "Ensure background and text colors change via CSS variables."
    ],
    points: 15,
    tags: ["CSS Variables", "Theming", "DOM"],
    files: {
      html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Theme Switcher</title>
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <div class="theme-card" id="theme-card">
    <div class="header">
      <span class="icon">🌓</span>
      <h2 id="theme-label">Dark Mode</h2>
    </div>
    <p class="description">SkillSphere synchronizes with system preference or manual user control with instant CSS tokens.</p>
    
    <div class="palette-preview">
      <div class="color-chip primary"></div>
      <div class="color-chip card"></div>
      <div class="color-chip text"></div>
    </div>

    <button id="theme-toggle-btn" class="toggle-btn">
      <span id="btn-icon">☀️</span>
      <span>Switch to Light Mode</span>
    </button>
  </div>
  <script src="script.js"></script>
</body>
</html>`,
      css: `:root {
  --bg-color: #09090b;
  --card-bg: #18181b;
  --text-main: #fafafa;
  --text-muted: #a1a1aa;
  --border-color: #27272a;
  --accent-color: #00f2fe;
}

[data-theme="light"] {
  --bg-color: #f8fafc;
  --card-bg: #ffffff;
  --text-main: #0f172a;
  --text-muted: #64748b;
  --border-color: #e2e8f0;
  --accent-color: #0284c7;
}

body {
  margin: 0;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--bg-color);
  color: var(--text-main);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  transition: background-color 0.3s ease, color 0.3s ease;
  padding: 20px;
}

.theme-card {
  width: 100%;
  max-width: 400px;
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 20px;
  padding: 32px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
}

.header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.icon {
  font-size: 24px;
}

h2 {
  font-size: 22px;
  font-weight: 700;
}

.description {
  font-size: 14px;
  color: var(--text-muted);
  line-height: 1.6;
  margin-bottom: 24px;
}

.palette-preview {
  display: flex;
  gap: 10px;
  margin-bottom: 28px;
}

.color-chip {
  flex: 1;
  height: 36px;
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

.color-chip.primary { background: var(--accent-color); }
.color-chip.card { background: var(--card-bg); }
.color-chip.text { background: var(--text-main); }

.toggle-btn {
  width: 100%;
  padding: 12px;
  background: var(--accent-color);
  color: #ffffff;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: transform 0.15s ease, opacity 0.2s ease;
}

.toggle-btn:hover {
  opacity: 0.9;
}

.toggle-btn:active {
  transform: scale(0.98);
}`,
      js: `const toggleBtn = document.getElementById("theme-toggle-btn");
const themeLabel = document.getElementById("theme-label");
const btnIcon = document.getElementById("btn-icon");

let currentTheme = "dark";

toggleBtn.addEventListener("click", () => {
  currentTheme = currentTheme === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", currentTheme);
  
  if (currentTheme === "light") {
    themeLabel.textContent = "Light Mode";
    btnIcon.textContent = "🌙";
    toggleBtn.querySelector("span:last-child").textContent = "Switch to Dark Mode";
  } else {
    themeLabel.textContent = "Dark Mode";
    btnIcon.textContent = "☀️";
    toggleBtn.querySelector("span:last-child").textContent = "Switch to Light Mode";
  }
});
`
    },
    tests: [
      {
        id: "theme_btn_exists",
        description: "Theme toggle button exists",
        testFn: `Boolean(document.getElementById('theme-toggle-btn'))`
      },
      {
        id: "theme_switches",
        description: "Clicking toggle button toggles data-theme attribute",
        testFn: `(() => {
          const btn = document.getElementById('theme-toggle-btn');
          const before = document.documentElement.getAttribute('data-theme') || 'dark';
          btn.click();
          const after = document.documentElement.getAttribute('data-theme');
          return before !== after;
        })()`
      }
    ]
  },
  {
    id: "fcc_reverse_string",
    title: "Reverse a String (Algorithm)",
    category: "dom",
    difficulty: "EASY",
    description: "Reverse the provided string and output the reversed text live. Demonstrates core JavaScript string handling.",
    instructions: [
      "Input field `#str-input` takes string text.",
      "Clicking `#btn-reverse` reverses the string and outputs to `#result-output`.",
      "Handle edge cases such as empty strings and palindrome words."
    ],
    points: 10,
    tags: ["JavaScript", "Strings", "Algorithm"],
    files: {
      html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Reverse a String</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div class="box">
    <h2>Reverse String</h2>
    <input id="str-input" value="hello" placeholder="Type text..." />
    <button id="btn-reverse">Reverse Now</button>
    <div id="result-output" class="output">olleh</div>
  </div>
  <script src="script.js"></script>
</body>
</html>`,
      css: `body {
  background: #0f172a;
  color: #fff;
  font-family: sans-serif;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  margin: 0;
}
.box {
  background: #1e293b;
  padding: 30px;
  border-radius: 12px;
  text-align: center;
  width: 320px;
}
input {
  width: 100%;
  padding: 10px;
  border-radius: 8px;
  border: 1px solid #334155;
  background: #0f172a;
  color: #fff;
  margin: 15px 0;
}
button {
  background: #00f2fe;
  color: #000;
  border: none;
  padding: 10px 16px;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
}
.output {
  margin-top: 20px;
  font-size: 24px;
  font-weight: bold;
  color: #38bdf8;
}`,
      js: `function reverseString(str) {
  return str.split("").reverse().join("");
}

const input = document.getElementById("str-input");
const btn = document.getElementById("btn-reverse");
const output = document.getElementById("result-output");

btn.addEventListener("click", () => {
  output.textContent = reverseString(input.value);
});
`
    },
    tests: [
      {
        id: "reverse_fn",
        description: "Reverses string correctly",
        testFn: `(() => {
          const input = document.getElementById('str-input');
          const btn = document.getElementById('btn-reverse');
          const output = document.getElementById('result-output');
          input.value = "SkillSphere";
          btn.click();
          return output.textContent.trim() === "erehpSllikS";
        })()`
      }
    ]
  },
  {
    id: "free_playground",
    title: "Blank Canvas: Full Web Playground",
    category: "playground",
    difficulty: "EASY",
    description: "An open Web Development sandbox. Build any HTML, CSS, and modern JavaScript idea with instant live rendering, console logging, and responsive viewport emulation.",
    instructions: [
      "Write semantic HTML in index.html.",
      "Style with modern CSS or flexbox/grid in styles.css.",
      "Add interactive JavaScript and console statements in script.js.",
      "Test responsiveness by toggling Desktop, Tablet, and Mobile views!"
    ],
    points: 10,
    tags: ["Sandbox", "HTML5", "CSS3", "JavaScript", "Playground"],
    files: {
      html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SkillSphere Web Playground</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div class="canvas-container">
    <div class="hero">
      <div class="glow"></div>
      <h1 class="title">SkillSphere WebDev</h1>
      <p class="subtitle">Live Sandboxed HTML • CSS • JavaScript Engine</p>
      
      <div class="interactive-box">
        <p id="time-text">Ready to code!</p>
        <button id="magic-btn" class="glow-button">Click for Magic ✨</button>
      </div>
    </div>
  </div>
  <script src="script.js"></script>
</body>
</html>`,
      css: `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  background: #09090b;
  color: #fafafa;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.canvas-container {
  text-align: center;
  padding: 40px;
}

.hero {
  position: relative;
}

.glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 250px;
  height: 250px;
  background: radial-gradient(circle, rgba(0, 242, 254, 0.25) 0%, transparent 70%);
  filter: blur(40px);
  z-index: 0;
}

.title {
  font-size: 42px;
  font-weight: 800;
  background: linear-gradient(135deg, #00f2fe 0%, #4facfe 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 8px;
  position: relative;
  z-index: 1;
}

.subtitle {
  color: #a1a1aa;
  font-size: 16px;
  margin-bottom: 32px;
  position: relative;
  z-index: 1;
}

.interactive-box {
  background: #18181b;
  border: 1px solid #27272a;
  border-radius: 16px;
  padding: 24px;
  display: inline-block;
  min-width: 280px;
  position: relative;
  z-index: 1;
}

#time-text {
  font-size: 14px;
  color: #cbd5e1;
  margin-bottom: 16px;
}

.glow-button {
  background: linear-gradient(135deg, #00f2fe, #0284c7);
  color: #09090b;
  font-weight: 700;
  border: none;
  padding: 12px 24px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 15px rgba(0, 242, 254, 0.3);
}

.glow-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 242, 254, 0.5);
}`,
      js: `const magicBtn = document.getElementById("magic-btn");
const timeText = document.getElementById("time-text");

magicBtn.addEventListener("click", () => {
  const date = new Date().toLocaleTimeString();
  timeText.textContent = \`Magic triggered at: \${date}\`;
  console.log("✨ Magic button activated! Live preview updated at", date);
});
`
    },
    tests: [
      {
        id: "renders_playground",
        description: "Magic button triggers click interaction and updates status",
        testFn: `(() => {
          const btn = document.getElementById('magic-btn');
          const time = document.getElementById('time-text');
          btn.click();
          return time.textContent.includes('Magic');
        })()`
      }
    ]
  }
];
