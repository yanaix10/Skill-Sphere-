# DebugBench Dataset Analysis & Sample Questions

This directory contains samples fetched directly from the Hugging Face dataset **[`Rtian/DebugBench`](https://huggingface.co/datasets/Rtian/DebugBench)** (specifically inspecting the test split, including the requested row **112**).

---

## 1. Dataset Overview

* **Dataset Name**: `Rtian/DebugBench`
* **Dataset Purpose**: A benchmark designed to evaluate Large Language Models on code debugging tasks.
* **Total Rows**: 4,253 examples (all in the `test` split).
* **Source of Problems**: Real LeetCode algorithmic problems (Easy, Medium, Hard).
* **Languages**:
  * `cpp` (C++)
  * `java` (Java)
  * `python3` (Python 3)
* **Error Categories**:
  1. `syntax error`: Missing syntax elements, illegal operators, unclosed parentheses/brackets, illegal separation, invalid comments.
  2. `logic error`: Incorrect operations, inverted conditions, indexing mistakes, off-by-one errors, wrong variable updates.
  3. `reference error`: Undefined variables/objects, scope mistakes, name mismatches.
  4. `multiple error`: Code with 2, 3, or 4 bugs simultaneously (`double`, `triple`, `quadruple`).

---

## 2. Dataset Schema (Fields per Question)

Every row in DebugBench has the following 13 fields:

| Field Name | Type | Description |
| :--- | :--- | :--- |
| `slug` | String | Problem identifier slug (e.g., `destination-city`, `flood-fill`). |
| `question` | String | The full LeetCode problem description with problem statement. |
| `examples` | Array of Strings | Input/output example test cases with explanations. |
| `constraints` | String | Data constraints (e.g., array lengths, integer ranges). |
| `buggy_code` | String | The code snippet containing intentional bug(s). |
| `solution` | String | The canonical, working, bug-free solution. |
| `bug_explanation` | String | Precise explanation of what bug was introduced and where. |
| `solution_explanation` | String | Algorithmic explanation (Intuition, Approach, Complexity). |
| `category` | String | High-level bug type (`syntax error`, `logic error`, `reference error`, `multiple error`). |
| `subtype` | String | Granular bug classification (e.g., `illegal separation`, `operation error`, `double`). |
| `level` | String | Problem difficulty (`easy`, `medium`, `hard`). |
| `language` | String | Programming language (`cpp`, `java`, `python3`). |
| `release_time` | Int64 | Epoch timestamp of release. |

---

## 3. Detailed Inspection: Row 112 (User Requested)

* **Problem Slug**: `destination-city`
* **Language**: `cpp` (C++)
* **Difficulty**: `easy`
* **Category**: `multiple error`
* **Subtype**: `double` (2 concurrent bugs)
* **Bug Explanation**: `"a mixture of indexing error, variable value error"`

### Problem Statement:
> "You are given the array `paths`, where `paths[i] = [cityAi, cityBi]` means there exists a direct path going from `cityAi` to `cityBi`. Return the destination city, that is, the city without any path outgoing to another city."

### Buggy Code:
```cpp
class Solution {
public:
    string destCity(vector<vector<string>>& paths) {
        unordered_set<string> st;
        for (auto row : paths)st.insert(row[0]);  // BUG 1: Indexing error (inserted row[0] instead of row[1])
        for (auto row : paths)if(st.count(row[0]) > 0) st.erase(row[0]);
        return *st.end();                         // BUG 2: Dereferenced end() iterator instead of begin()
    }
};
```

### Correct Solution:
```cpp
class Solution {
public:
    string destCity(vector<vector<string>>& paths) {
        unordered_set<string> st;
        for (auto row : paths)st.insert(row[1]);  // Correct: destination city is row[1]
        for (auto row : paths)if(st.count(row[0]) > 0) st.erase(row[0]);
        return *st.begin();                       // Correct: first remaining element in set
    }
};
```

---

## 4. Other Sample Questions Across Different Types

### Sample A: Row 1500 (Java • Logic Error)
* **Slug**: `determine-the-winner-of-a-bowling-game` (Level: `easy`)
* **Category**: `logic error` (`operation error`)
* **Bug**: Variables `j` and `k` are decremented (`j--`, `k--`) instead of incremented (`j++`, `k++`), causing an infinite loop or wrong loop progression.

### Sample B: Row 3500 (Python 3 • Reference Error)
* **Slug**: `check-if-every-row-and-column-contains-all-numbers` (Level: `easy`)
* **Category**: `reference error` (`undefined objects`)
* **Bug**: The code references `dp_col`, but `dp_col` was never defined, raising a runtime `NameError`.

### Sample C: Row 0 (C++ • Syntax Error)
* **Slug**: `flood-fill` (Level: `easy`)
* **Category**: `syntax error` (`illegal separation`)
* **Bug**: Statements inside an `if` block are separated by illegal semicolons/syntax, preventing compilation.

### Sample D: Row 2500 (Java • Syntax Error)
* **Slug**: `maximal-rectangle` (Level: `hard`)
* **Category**: `syntax error` (`unclosed parentheses`)
* **Bug**: Unbalanced parentheses in arithmetic expression `nums[j] += (matrix[i][j] - ...`.

### Sample E: Row 3000 (Python 3 • Syntax Error)
* **Slug**: `next-greater-element-iv` (Level: `hard`)
* **Category**: `syntax error` (`illegal comment`)
* **Bug**: Unescaped or misplaced triple quotes turn the code into an unexecuted docstring.

---

## 5. Summary of Files Saved in this Directory

* [`samples.json`](file:///home/naitik/Projects/Skill-Sphere-/test_debugbench/samples.json): Full JSON payload containing the 6 sample questions fetched from the Hugging Face API.
* [`row_112_destination_city.json`](file:///home/naitik/Projects/Skill-Sphere-/test_debugbench/row_112_destination_city.json): Isolated JSON object of row 112 for direct inspection.
