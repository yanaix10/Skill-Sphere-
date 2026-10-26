import { describe, it, expect } from 'vitest';
import { pythonAdapter, cppAdapter } from '../src/runner/adapters.js';

describe('Language Adapters & Program Builders', () => {
  it('builds Python program by appending harness after player code', () => {
    const variant = {
      starterCode: 'def solve(n):\n    pass\n',
      harness: 'assert solve(2) == 4\nassert solve(3) == 6\n',
      example: 'assert solve(2) == 4'
    };

    const playerCode = 'def solve(n):\n    return n * 2';
    const program = pythonAdapter.buildProgram(playerCode, variant);

    expect(program).toContain(playerCode);
    expect(program).toContain('assert solve(2) == 4');
    expect(program).toContain('assert solve(3) == 6');
    expect(program).toMatchSnapshot();
  });

  it('builds C++ program with player file and harness main()', () => {
    const variant = {
      starterCode: '#include<assert.h>\n#include<bits/stdc++.h>\n// Statement\nbool solve(int n) {\n    // your code here\n}\n',
      harness: 'int main() {\n    auto candidate = solve;\n    assert(candidate(2) == true);\n    return 0;\n}',
      example: 'assert(candidate(2) == true);'
    };

    const playerCode = '#include<assert.h>\n#include<bits/stdc++.h>\n\nbool solve(int n) {\n    return n > 0;\n}';
    const program = cppAdapter.buildProgram(playerCode, variant);

    expect(program).toContain(playerCode);
    expect(program).toContain('int main()');
    expect(program).toContain('assert(candidate(2) == true);');
    expect(program).toMatchSnapshot();
  });
});
