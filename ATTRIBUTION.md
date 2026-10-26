# Dataset Attribution & Licenses

The question dataset in **Coding Duel** (`data/questions.json`) is composed from two open-source datasets:

---

## 1. Mostly Basic Python Problems (MBPP) - Sanitized Subset
* **Authors:** Google Research
* **Repository:** [https://github.com/google-research/google-research/tree/master/mbpp](https://github.com/google-research/google-research/tree/master/mbpp)
* **License:** Creative Commons Attribution 4.0 International ([CC BY 4.0](https://creativecommons.org/licenses/by/4.0/))
* **Attribution Notice:**
  > Austin, J., Odena, A., Nye, M., Bosma, M., Michalewski, H., Dohan, D., Jiang, E., Cai, C., Terry, M., Le, Q., & Sutton, C. (2021). *Program Synthesis with Large Language Models*. arXiv preprint arXiv:2108.07732.
* **Usage in SkillSphere:**
  Used for canonical problem statements, Python reference solutions, and baseline assertion test suites.

---

## 2. MultiPL-E (mbpp-cpp Subset)
* **Authors:** NUPRL (Northeastern University Programming Research Laboratory)
* **Repository:** [https://huggingface.co/datasets/nuprl/MultiPL-E](https://huggingface.co/datasets/nuprl/MultiPL-E) / [https://github.com/nuprl/MultiPL-E](https://github.com/nuprl/MultiPL-E)
* **License:** [MIT License](https://opensource.org/licenses/MIT)
* **Attribution Notice:**
  > Cassano, F., Gouwar, J., Nguyen, D., Nguyen, S., Phipps-Costin, L., Pinckney, D., Yee, M. D., Zi, Y., Anderson, C. J., Feldman, M. Q., Guha, A., Greenberg, M., & Jangda, A. (2023). *MultiPL-E: A Scalable and Polyglot Approach to Benchmarking Neural Code Generation*. IEEE Transactions on Software Engineering.
* **Usage in SkillSphere:**
  Used for C++ function headers, type signatures, and native assertion test harnesses (`mbpp-cpp`).
