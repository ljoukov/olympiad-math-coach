import type { Move, Problem } from "@/lib/schemas"

export const SEED_MOVES: Move[] = [
  // CORE 8
  {
    id: "move_01",
    name: "Try small cases",
    category: "CORE",
    whenToUse:
      "When you need to spot a pattern or understand a general statement, start with n=1,2,3...",
    templateJson: {
      steps: [
        "Pick the smallest case",
        "Compute or verify",
        "Look for what changes as you increase",
      ],
    },
    commonTrap:
      "Assuming a pattern from too few cases without proving it holds generally.",
  },
  {
    id: "move_02",
    name: "Draw a diagram / table",
    category: "CORE",
    whenToUse:
      "When relationships between objects are hard to see in words alone.",
    templateJson: {
      steps: [
        "Identify the key objects",
        "Sketch or tabulate",
        "Label everything carefully",
      ],
    },
    commonTrap:
      "Drawing an inaccurate diagram and then reasoning from it as if it were exact.",
  },
  {
    id: "move_03",
    name: "Work backwards",
    category: "CORE",
    whenToUse:
      "When you know the desired result and want to find what must be true to reach it.",
    templateJson: {
      steps: [
        "State the desired conclusion",
        "Ask: what would immediately imply this?",
        "Chain backwards to something you can prove",
      ],
    },
    commonTrap:
      "Accidentally assuming the result (circular reasoning) instead of genuinely working backwards.",
  },
  {
    id: "move_04",
    name: "Spot a pattern, then justify",
    category: "CORE",
    whenToUse:
      "When computing several cases reveals a regularity that might be provable.",
    templateJson: {
      steps: [
        "Compute cases and record results",
        "Conjecture the pattern",
        "Prove it (induction, direct, etc.)",
      ],
    },
    commonTrap:
      "Presenting the pattern as the proof. You must justify WHY the pattern holds.",
  },
  {
    id: "move_05",
    name: "Parity / mod check",
    category: "CORE",
    whenToUse: "When a problem involves even/odd, divisibility, or remainders.",
    templateJson: {
      steps: [
        "Classify objects by remainder mod k",
        "Check which operations preserve or change parity",
        "Derive a constraint",
      ],
    },
    commonTrap:
      "Checking parity but not connecting it to the conclusion you need.",
  },
  {
    id: "move_06",
    name: "Factor / rewrite",
    category: "CORE",
    whenToUse:
      "When an algebraic expression can be simplified by factoring or rearranging.",
    templateJson: {
      steps: [
        "Look for common factors",
        "Try difference of squares, grouping, or substitution",
        "Simplify and see if the structure helps",
      ],
    },
    commonTrap:
      "Expanding when you should be factoring - always consider both directions.",
  },
  {
    id: "move_07",
    name: "Bounding / squeeze",
    category: "CORE",
    whenToUse:
      "When you need to show something is impossible or find an exact value by trapping it between bounds.",
    templateJson: {
      steps: [
        "Find an upper bound",
        "Find a lower bound",
        "Show they meet (or leave no room for the quantity)",
      ],
    },
    commonTrap:
      "Making bounds too loose so they do not actually constrain the answer.",
  },
  {
    id: "move_08",
    name: "Rephrase the problem precisely",
    category: "CORE",
    whenToUse:
      "When the problem statement is wordy or confusing - restate it in your own clean mathematical language.",
    templateJson: {
      steps: [
        "Identify the given information",
        "Identify what you must show or find",
        "Write a crisp one-sentence restatement",
      ],
    },
    commonTrap:
      "Losing a condition from the original problem when you rephrase.",
  },
  // SUGGESTED
  {
    id: "move_09",
    name: "Pigeonhole",
    category: "SUGGESTED",
    whenToUse:
      "When you have more objects than containers, so at least one container must hold two.",
    templateJson: {
      steps: [
        "Identify the pigeons and holes",
        "Count to verify |pigeons| > |holes|",
        "State the conclusion",
      ],
    },
    commonTrap:
      "Miscounting the pigeons or the holes - be precise about what each represents.",
  },
  {
    id: "move_10",
    name: "Invariant / monovariant",
    category: "SUGGESTED",
    whenToUse:
      "When a process or game repeats and you need to show something never changes (invariant) or always moves one way (monovariant).",
    templateJson: {
      steps: [
        "Define the quantity",
        "Show it is preserved or monotone under each operation",
        "Derive the conclusion",
      ],
    },
    commonTrap:
      "Choosing a quantity that is not actually preserved under all operations.",
  },
  {
    id: "move_11",
    name: "Symmetry",
    category: "SUGGESTED",
    whenToUse:
      "When the problem has a natural symmetry that can simplify counting or structure.",
    templateJson: {
      steps: [
        "Identify the symmetry (reflection, rotation, relabelling)",
        "Use it to reduce cases",
        "Check the argument works in all cases",
      ],
    },
    commonTrap:
      "Assuming symmetry exists when the problem is not actually symmetric.",
  },
  {
    id: "move_12",
    name: "Double counting",
    category: "SUGGESTED",
    whenToUse:
      "When you can count the same quantity in two different ways to derive an equation.",
    templateJson: {
      steps: [
        "Identify what to count",
        "Count it one way",
        "Count it another way",
        "Set the two expressions equal",
      ],
    },
    commonTrap:
      "Over-counting or under-counting on one side due to missed cases.",
  },
  {
    id: "move_13",
    name: "Extremal principle",
    category: "SUGGESTED",
    whenToUse:
      "When considering the largest, smallest, or most extreme element leads to useful constraints.",
    templateJson: {
      steps: [
        "Consider the extremal element (max, min, longest, etc.)",
        "Derive properties it must have",
        "Use these to prove the result",
      ],
    },
    commonTrap:
      "Forgetting to verify the extremal element actually exists (e.g., finite set needed).",
  },
  {
    id: "move_14",
    name: "Construct example / counterexample",
    category: "SUGGESTED",
    whenToUse:
      "When you need to show something is possible (example) or disprove a claim (counterexample).",
    templateJson: {
      steps: [
        "Understand exactly what needs to be demonstrated",
        "Build the simplest object satisfying the conditions",
        "Verify all conditions are met",
      ],
    },
    commonTrap:
      "Building an example that almost works but misses one condition.",
  },
]

export const SEED_PROBLEMS: Problem[] = [
  {
    id: "prob_01",
    title: "Sum of Consecutive Integers",
    statement:
      "Prove that the sum of any three consecutive integers is always divisible by 3.",
    topicTags: ["number-theory", "algebra"],
    difficulty: 1,
    movesSuggested: ["move_06", "move_01"],
    rubricJson: [
      {
        name: "Setup",
        marks: 2,
        description: "Correctly defines three consecutive integers",
        keywords: ["n", "n+1", "n+2", "consecutive"],
      },
      {
        name: "Calculation",
        marks: 4,
        description: "Computes the sum correctly",
        keywords: ["3n+3", "3(n+1)", "sum", "equals"],
      },
      {
        name: "Conclusion",
        marks: 2,
        description: "States divisibility by 3",
        keywords: ["divisible", "factor", "multiple"],
      },
      {
        name: "Presentation",
        marks: 2,
        description: "Clear mathematical writing",
        keywords: ["therefore", "hence", "thus", "QED"],
      },
    ],
    solutionOutline: [
      "Let the three consecutive integers be n, n+1, and n+2.",
      "Their sum is n + (n+1) + (n+2) = 3n + 3.",
      "Factor: 3n + 3 = 3(n + 1).",
      "Since 3(n+1) is a multiple of 3, the sum is divisible by 3.",
      "This holds for all integers n.",
    ],
  },
  {
    id: "prob_02",
    title: "Chessboard Domino Covering",
    statement:
      "A standard 8x8 chessboard has two diagonally opposite corners removed. Can the remaining 62 squares be covered exactly by 31 dominoes (each covering 2 adjacent squares)? Prove your answer.",
    topicTags: ["combinatorics", "proof"],
    difficulty: 3,
    movesSuggested: ["move_05", "move_02", "move_14"],
    rubricJson: [
      {
        name: "Key Insight",
        marks: 3,
        description: "Identifies colouring argument",
        keywords: ["colour", "color", "black", "white", "same"],
      },
      {
        name: "Counting",
        marks: 3,
        description: "Counts black and white squares correctly",
        keywords: ["30", "32", "removed", "opposite"],
      },
      {
        name: "Domino Property",
        marks: 2,
        description: "Each domino covers one black and one white",
        keywords: ["domino", "adjacent", "one of each"],
      },
      {
        name: "Conclusion",
        marks: 2,
        description: "Clear impossibility argument",
        keywords: ["impossible", "cannot", "unequal"],
      },
    ],
    solutionOutline: [
      "Colour the chessboard in the standard alternating pattern.",
      "A standard 8x8 board has 32 black and 32 white squares.",
      "Two diagonally opposite corners have the same colour, say both white.",
      "After removal: 32 black squares and 30 white squares remain.",
      "Each domino covers exactly one black and one white square.",
      "31 dominoes would need 31 black and 31 white squares.",
      "Since 32 =/= 30, the covering is impossible.",
    ],
  },
  {
    id: "prob_03",
    title: "Pigeonhole with Socks",
    statement:
      "A drawer contains 10 red socks, 10 blue socks, and 10 green socks. What is the minimum number of socks you must draw (without looking) to guarantee that you have at least 4 socks of the same colour? Prove your answer.",
    topicTags: ["combinatorics"],
    difficulty: 2,
    movesSuggested: ["move_09", "move_01"],
    rubricJson: [
      {
        name: "Upper Bound",
        marks: 3,
        description: "Shows 10 socks suffice",
        keywords: ["10", "worst case", "at most 3"],
      },
      {
        name: "Pigeonhole",
        marks: 3,
        description: "Applies pigeonhole principle correctly",
        keywords: ["pigeonhole", "3 colours", "4 socks"],
      },
      {
        name: "Lower Bound",
        marks: 2,
        description: "Shows 9 is not enough",
        keywords: ["9", "3 of each", "possible"],
      },
      {
        name: "Presentation",
        marks: 2,
        description: "Clear and complete argument",
        keywords: ["therefore", "minimum", "exactly"],
      },
    ],
    solutionOutline: [
      "There are 3 colours (pigeonholes) and we want 4 of one colour (pigeons).",
      "In the worst case, we draw 3 of each colour first: 3+3+3 = 9 socks, all different colours.",
      "The 10th sock must match one of the 3 colours, giving us 4 of that colour.",
      "With 9 socks, it is possible to have exactly 3 of each (no 4 guaranteed).",
      "Therefore the minimum number is 10.",
    ],
  },
  {
    id: "prob_04",
    title: "Handshake Lemma",
    statement:
      "At a party of n people, prove that the number of people who have shaken hands an odd number of times is always even.",
    topicTags: ["combinatorics", "graph-theory"],
    difficulty: 3,
    movesSuggested: ["move_12", "move_05"],
    rubricJson: [
      {
        name: "Graph Model",
        marks: 2,
        description: "Models as a graph",
        keywords: ["graph", "vertex", "edge", "degree"],
      },
      {
        name: "Sum of Degrees",
        marks: 3,
        description: "Sum of degrees = 2 * edges",
        keywords: ["sum", "degree", "2|E|", "twice"],
      },
      {
        name: "Parity Argument",
        marks: 3,
        description: "Deduces parity constraint",
        keywords: ["even", "odd", "parity", "sum"],
      },
      {
        name: "Conclusion",
        marks: 2,
        description: "Correctly concludes",
        keywords: ["even number", "odd degree"],
      },
    ],
    solutionOutline: [
      "Model the party as a graph: people are vertices, handshakes are edges.",
      "Each person's number of handshakes is their degree.",
      "The sum of all degrees equals 2 * (number of edges), which is even.",
      "Let S_odd be the sum of odd degrees and S_even the sum of even degrees.",
      "S_even is even (sum of even numbers). So S_odd must also be even.",
      "A sum of odd numbers is even only if there are an even number of them.",
      "Therefore the number of people with odd degree is even.",
    ],
  },
  {
    id: "prob_05",
    title: "Squares Ending in 5 or 6",
    statement:
      "Prove that if a perfect square ends in the digit 5, then it ends in 25. Also prove that if a perfect square ends in the digit 6, then it ends in 76.",
    topicTags: ["number-theory"],
    difficulty: 2,
    movesSuggested: ["move_05", "move_01", "move_06"],
    rubricJson: [
      {
        name: "Modular Setup",
        marks: 2,
        description: "Sets up analysis mod 100",
        keywords: ["mod", "last two digits", "remainder"],
      },
      {
        name: "Case for 5",
        marks: 3,
        description: "Proves squares ending in 5 end in 25",
        keywords: ["5", "25", "10k+5", "ends in"],
      },
      {
        name: "Case for 6",
        marks: 3,
        description: "Proves squares ending in 6 end in 76",
        keywords: ["6", "76", "ends in"],
      },
      {
        name: "Presentation",
        marks: 2,
        description: "Clear structure",
        keywords: ["therefore", "thus", "proved"],
      },
    ],
    solutionOutline: [
      "For a square ending in 5: the number must end in 5 (since only 5^2 ends in 5).",
      "Write n = 10k + 5. Then n^2 = 100k^2 + 100k + 25.",
      "The last two digits of n^2 are determined by 25.",
      "For a square ending in 6: check n mod 10 in {0,...,9}.",
      "Only n ending in 4 or 6 gives n^2 ending in 6.",
      "If n = 10k+4: n^2 = 100k^2+80k+16, last two digits from 80k+16.",
      "If n = 10k+6: n^2 = 100k^2+120k+36, last two digits from 20k+36.",
      "Check: both cases give last two digits 76 (verify k mod 5 cases).",
    ],
  },
  {
    id: "prob_06",
    title: "Triangle Inequality Application",
    statement:
      "Three positive real numbers a, b, c satisfy a + b > c, b + c > a, and c + a > b. Prove that a^2 + b^2 + c^2 < 2(ab + bc + ca).",
    topicTags: ["algebra", "inequalities"],
    difficulty: 3,
    movesSuggested: ["move_06", "move_07"],
    rubricJson: [
      {
        name: "Key Manipulation",
        marks: 3,
        description: "Rewrites inequality helpfully",
        keywords: ["rearrange", "factor", "subtract"],
      },
      {
        name: "Using Conditions",
        marks: 3,
        description: "Uses triangle inequality conditions",
        keywords: ["a+b>c", "positive", "triangle"],
      },
      {
        name: "Algebra",
        marks: 2,
        description: "Correct algebraic steps",
        keywords: ["expand", "simplify", "equals"],
      },
      {
        name: "Conclusion",
        marks: 2,
        description: "Completes the proof",
        keywords: ["proved", "therefore", "holds"],
      },
    ],
    solutionOutline: [
      "Rearrange: need to show a^2 + b^2 + c^2 - 2ab - 2bc - 2ca < 0.",
      "Equivalently: (a-b-c)^2 - 4bc < 0 ... or use symmetry.",
      "Alternative: show (a-b)^2 < c^2, (b-c)^2 < a^2, (c-a)^2 < b^2.",
      "Each follows from triangle inequality: |a-b| < c, etc.",
      "Adding: (a-b)^2 + (b-c)^2 + (c-a)^2 < a^2 + b^2 + c^2.",
      "Expand left: 2(a^2+b^2+c^2) - 2(ab+bc+ca) < a^2+b^2+c^2.",
      "Therefore a^2+b^2+c^2 < 2(ab+bc+ca).",
    ],
  },
  {
    id: "prob_07",
    title: "Divisibility by 7",
    statement:
      "Prove that 3^(2n+1) + 2^(n+2) is divisible by 7 for all non-negative integers n.",
    topicTags: ["number-theory", "induction"],
    difficulty: 3,
    movesSuggested: ["move_01", "move_05", "move_04"],
    rubricJson: [
      {
        name: "Base Case",
        marks: 2,
        description: "Verifies n=0",
        keywords: ["n=0", "base", "3+4=7"],
      },
      {
        name: "Inductive Step Setup",
        marks: 2,
        description: "Sets up induction correctly",
        keywords: ["assume", "inductive", "k", "k+1"],
      },
      {
        name: "Algebra",
        marks: 4,
        description: "Completes the inductive step",
        keywords: ["9", "multiply", "subtract", "factor"],
      },
      {
        name: "Conclusion",
        marks: 2,
        description: "Properly concludes induction",
        keywords: ["induction", "all n", "proved"],
      },
    ],
    solutionOutline: [
      "Base case: n=0 gives 3^1 + 2^2 = 3 + 4 = 7, divisible by 7.",
      "Assume 3^(2k+1) + 2^(k+2) is divisible by 7.",
      "Need: 3^(2k+3) + 2^(k+3) is divisible by 7.",
      "3^(2k+3) = 9 * 3^(2k+1) and 2^(k+3) = 2 * 2^(k+2).",
      "Expression = 9*3^(2k+1) + 2*2^(k+2) = 7*3^(2k+1) + 2*(3^(2k+1) + 2^(k+2)).",
      "Both terms divisible by 7 (first obviously, second by hypothesis).",
      "By induction, the result holds for all n >= 0.",
    ],
  },
  {
    id: "prob_08",
    title: "Grid Path Counting",
    statement:
      "How many shortest paths are there from corner A (bottom-left) to corner B (top-right) of a 4x3 grid, if you can only move right or up? Justify your answer.",
    topicTags: ["combinatorics"],
    difficulty: 2,
    movesSuggested: ["move_02", "move_01", "move_04"],
    rubricJson: [
      {
        name: "Model",
        marks: 2,
        description: "Identifies the combinatorial model",
        keywords: ["right", "up", "steps", "sequence"],
      },
      {
        name: "Counting Formula",
        marks: 3,
        description: "Applies binomial coefficient correctly",
        keywords: ["C(7,3)", "C(7,4)", "35", "choose"],
      },
      {
        name: "Justification",
        marks: 3,
        description: "Explains why the formula works",
        keywords: ["choose", "positions", "arrange"],
      },
      {
        name: "Presentation",
        marks: 2,
        description: "Clear solution",
        keywords: ["therefore", "answer"],
      },
    ],
    solutionOutline: [
      "A shortest path uses exactly 4 right-steps and 3 up-steps (7 steps total).",
      "The path is determined by choosing which 3 of the 7 steps are 'up'.",
      "Number of ways = C(7,3) = 35.",
      "Alternatively, C(7,4) = 35 (choosing right-steps).",
      "Each such sequence gives a unique shortest path.",
    ],
  },
  {
    id: "prob_09",
    title: "Product of Consecutive Integers",
    statement:
      "Prove that the product of any four consecutive positive integers is one less than a perfect square.",
    topicTags: ["algebra", "number-theory"],
    difficulty: 3,
    movesSuggested: ["move_06", "move_01"],
    rubricJson: [
      {
        name: "Setup",
        marks: 2,
        description: "Defines four consecutive integers",
        keywords: ["n", "n+1", "n+2", "n+3"],
      },
      {
        name: "Algebraic Manipulation",
        marks: 4,
        description: "Factors the product correctly",
        keywords: ["n(n+3)", "n^2+3n", "(n^2+3n+1)^2", "factor"],
      },
      {
        name: "Identification",
        marks: 2,
        description: "Identifies the perfect square",
        keywords: ["square", "minus 1", "perfect"],
      },
      {
        name: "Conclusion",
        marks: 2,
        description: "Completes the proof",
        keywords: ["therefore", "proved"],
      },
    ],
    solutionOutline: [
      "Let the integers be n, n+1, n+2, n+3.",
      "Product = n(n+1)(n+2)(n+3).",
      "Rearrange: [n(n+3)][(n+1)(n+2)] = (n^2+3n)(n^2+3n+2).",
      "Let m = n^2 + 3n + 1. Then product = (m-1)(m+1) = m^2 - 1.",
      "So the product is m^2 - 1, which is one less than the perfect square m^2.",
    ],
  },
  {
    id: "prob_10",
    title: "Infinite Primes",
    statement: "Prove that there are infinitely many prime numbers.",
    topicTags: ["number-theory", "proof"],
    difficulty: 2,
    movesSuggested: ["move_14", "move_03"],
    rubricJson: [
      {
        name: "Strategy",
        marks: 2,
        description: "Sets up proof by contradiction",
        keywords: ["assume", "finite", "contradiction", "suppose"],
      },
      {
        name: "Construction",
        marks: 3,
        description: "Constructs the key number",
        keywords: ["p1*p2*...*pn", "product", "+1", "N"],
      },
      {
        name: "Contradiction",
        marks: 3,
        description: "Derives the contradiction",
        keywords: ["divides", "remainder 1", "not divisible", "new prime"],
      },
      {
        name: "Conclusion",
        marks: 2,
        description: "Concludes correctly",
        keywords: ["infinitely many", "contradiction", "proved"],
      },
    ],
    solutionOutline: [
      "Suppose for contradiction that there are only finitely many primes: p1, p2, ..., pn.",
      "Consider N = p1 * p2 * ... * pn + 1.",
      "N > 1, so N has a prime factor p.",
      "p must be one of p1, ..., pn (our complete list).",
      "But then p divides N and p divides p1*...*pn, so p divides N - p1*...*pn = 1.",
      "No prime divides 1. Contradiction.",
      "Therefore there are infinitely many primes.",
    ],
  },
  {
    id: "prob_11",
    title: "AM-GM for Two Numbers",
    statement:
      "Prove that for all positive real numbers a and b, (a + b)/2 >= sqrt(ab). When does equality hold?",
    topicTags: ["algebra", "inequalities"],
    difficulty: 2,
    movesSuggested: ["move_06", "move_07"],
    rubricJson: [
      {
        name: "Equivalent Form",
        marks: 3,
        description: "Reduces to (a-b)^2 >= 0",
        keywords: ["a-b", "square", "non-negative", ">=0"],
      },
      {
        name: "Algebra",
        marks: 3,
        description: "Correct algebraic steps",
        keywords: ["multiply", "rearrange", "subtract"],
      },
      {
        name: "Equality",
        marks: 2,
        description: "Identifies equality case",
        keywords: ["a=b", "equality", "if and only if"],
      },
      {
        name: "Presentation",
        marks: 2,
        description: "Clear logical flow",
        keywords: ["therefore", "proved", "QED"],
      },
    ],
    solutionOutline: [
      "Want to show (a+b)/2 >= sqrt(ab), i.e., a+b >= 2*sqrt(ab).",
      "Square both sides (both positive): (a+b)^2 >= 4ab.",
      "Expand: a^2 + 2ab + b^2 >= 4ab, i.e., a^2 - 2ab + b^2 >= 0.",
      "This is (a-b)^2 >= 0, which is always true.",
      "Equality holds iff (a-b)^2 = 0, i.e., a = b.",
    ],
  },
  {
    id: "prob_12",
    title: "Tiling with L-trominoes",
    statement:
      "A 2^n x 2^n grid has one square removed. Prove that the remaining squares can be tiled with L-shaped trominoes (pieces covering exactly 3 squares in an L-shape).",
    topicTags: ["combinatorics", "induction"],
    difficulty: 4,
    movesSuggested: ["move_01", "move_02", "move_04"],
    rubricJson: [
      {
        name: "Base Case",
        marks: 2,
        description: "Handles 2x2 case",
        keywords: ["2x2", "base", "L-tromino", "1 removed"],
      },
      {
        name: "Inductive Strategy",
        marks: 3,
        description: "Divides into quadrants",
        keywords: ["quadrant", "divide", "four", "2^(n-1)"],
      },
      {
        name: "Key Trick",
        marks: 3,
        description: "Places tromino at center",
        keywords: ["center", "central", "tromino", "one from each"],
      },
      {
        name: "Conclusion",
        marks: 2,
        description: "Completes induction",
        keywords: ["induction", "hypothesis", "all n"],
      },
    ],
    solutionOutline: [
      "Base case: 2x2 grid with one square removed is exactly an L-tromino.",
      "Inductive step: divide the 2^n x 2^n grid into four 2^(n-1) x 2^(n-1) quadrants.",
      "One quadrant contains the removed square.",
      "Place an L-tromino at the center covering one square from each of the other three quadrants.",
      "Now each quadrant is a 2^(n-1) x 2^(n-1) grid with one square removed.",
      "By induction, each can be tiled.",
      "The full tiling works.",
    ],
  },
  {
    id: "prob_13",
    title: "Sum of First n Cubes",
    statement:
      "Prove that 1^3 + 2^3 + 3^3 + ... + n^3 = [n(n+1)/2]^2 for all positive integers n.",
    topicTags: ["algebra", "induction"],
    difficulty: 2,
    movesSuggested: ["move_01", "move_04"],
    rubricJson: [
      {
        name: "Base Case",
        marks: 2,
        description: "Verifies n=1",
        keywords: ["n=1", "1=1", "base case"],
      },
      {
        name: "Inductive Hypothesis",
        marks: 2,
        description: "States hypothesis correctly",
        keywords: ["assume", "1^3+...+k^3", "hypothesis"],
      },
      {
        name: "Inductive Step",
        marks: 4,
        description: "Completes the step",
        keywords: ["(k+1)^3", "add", "factor", "simplify"],
      },
      {
        name: "Conclusion",
        marks: 2,
        description: "Closes induction",
        keywords: ["induction", "all n", "proved"],
      },
    ],
    solutionOutline: [
      "Base case: n=1 gives 1 = [1*2/2]^2 = 1. True.",
      "Assume 1^3+...+k^3 = [k(k+1)/2]^2.",
      "Add (k+1)^3: sum = [k(k+1)/2]^2 + (k+1)^3.",
      "Factor out (k+1)^2: = (k+1)^2 [k^2/4 + (k+1)].",
      "Simplify bracket: k^2/4 + k + 1 = (k^2+4k+4)/4 = (k+2)^2/4.",
      "So sum = (k+1)^2(k+2)^2/4 = [(k+1)(k+2)/2]^2.",
      "This is the formula for n=k+1. QED.",
    ],
  },
  {
    id: "prob_14",
    title: "Friendship Theorem (Simple Version)",
    statement:
      "In a group of 6 people, prove that there must exist either 3 mutual friends or 3 mutual strangers.",
    topicTags: ["combinatorics", "graph-theory"],
    difficulty: 3,
    movesSuggested: ["move_09", "move_05"],
    rubricJson: [
      {
        name: "Graph Model",
        marks: 2,
        description: "Models as 2-coloured K_6",
        keywords: ["graph", "colour", "red", "blue", "edge"],
      },
      {
        name: "Pigeonhole on Edges",
        marks: 3,
        description: "Uses pigeonhole on vertex degree",
        keywords: ["5 edges", "pigeonhole", "at least 3"],
      },
      {
        name: "Case Analysis",
        marks: 3,
        description: "Analyses the 3 neighbours",
        keywords: ["among", "triangle", "monochromatic"],
      },
      {
        name: "Conclusion",
        marks: 2,
        description: "Completes the proof",
        keywords: ["therefore", "R(3,3)", "proved"],
      },
    ],
    solutionOutline: [
      "Model as a complete graph K_6 with edges coloured red (friend) or blue (stranger).",
      "Pick any vertex v. It has 5 edges. By pigeonhole, at least 3 are the same colour.",
      "WLOG, v has at least 3 red edges, to vertices a, b, c.",
      "If any edge among {a,b,c} is red, that edge plus v forms a red triangle (3 mutual friends).",
      "If no edge among {a,b,c} is red, all 3 edges are blue: a blue triangle (3 mutual strangers).",
      "In either case, we find a monochromatic triangle.",
    ],
  },
  {
    id: "prob_15",
    title: "Integer Roots of Polynomial",
    statement:
      "Let p(x) be a polynomial with integer coefficients. If p(a) = 0 for some integer a, prove that a divides the constant term p(0).",
    topicTags: ["algebra", "number-theory"],
    difficulty: 3,
    movesSuggested: ["move_06", "move_08"],
    rubricJson: [
      {
        name: "Setup",
        marks: 2,
        description: "Writes polynomial explicitly",
        keywords: ["p(x)", "a_n x^n", "coefficients", "integer"],
      },
      {
        name: "Factoring",
        marks: 3,
        description: "Factors out (x-a)",
        keywords: ["x-a", "factor", "p(x) = (x-a)q(x)"],
      },
      {
        name: "Evaluation",
        marks: 3,
        description: "Evaluates at x=0",
        keywords: ["p(0)", "x=0", "-a * q(0)", "constant term"],
      },
      {
        name: "Conclusion",
        marks: 2,
        description: "Deduces divisibility",
        keywords: ["divides", "a | p(0)", "integer"],
      },
    ],
    solutionOutline: [
      "Write p(x) = a_n x^n + ... + a_1 x + a_0, with all a_i integers.",
      "Since p(a) = 0, (x - a) divides p(x), so p(x) = (x - a) q(x) for some polynomial q(x).",
      "Since p has integer coefficients and a is an integer, q(x) has integer coefficients.",
      "Evaluate at x = 0: p(0) = (0 - a) q(0) = -a * q(0).",
      "So p(0) = -a * q(0), meaning a divides p(0) = a_0.",
    ],
  },
  {
    id: "prob_16",
    title: "Coins on a Table",
    statement:
      "There are 100 coins on a table, some heads up and some tails up. You are blindfolded and told that exactly 20 coins are heads up. How can you divide the coins into two groups such that each group has the same number of heads-up coins? You may flip coins.",
    topicTags: ["combinatorics", "logic"],
    difficulty: 3,
    movesSuggested: ["move_08", "move_03", "move_14"],
    rubricJson: [
      {
        name: "Strategy",
        marks: 3,
        description: "Identifies the key idea",
        keywords: ["take 20", "flip all", "group"],
      },
      {
        name: "Verification",
        marks: 3,
        description: "Proves it works with algebra",
        keywords: ["k heads", "20-k", "flip", "equal"],
      },
      {
        name: "Clarity",
        marks: 2,
        description: "Clear explanation of why it works",
        keywords: ["flip", "becomes", "tails", "heads"],
      },
      {
        name: "Presentation",
        marks: 2,
        description: "Well-structured solution",
        keywords: ["therefore", "works", "proved"],
      },
    ],
    solutionOutline: [
      "Take any 20 coins and put them in a separate group. Flip all 20.",
      "In the group of 20, suppose k were originally heads. Then 20-k were tails.",
      "After flipping: k become tails, 20-k become heads. So this group has 20-k heads.",
      "The other group of 80 coins has 20-k heads (since 20 total heads, k were removed).",
      "Both groups now have 20-k heads. Done.",
    ],
  },
  {
    id: "prob_17",
    title: "Perfect Square Differences",
    statement:
      "Prove that the difference of two consecutive perfect squares is always odd.",
    topicTags: ["number-theory", "algebra"],
    difficulty: 1,
    movesSuggested: ["move_06", "move_01"],
    rubricJson: [
      {
        name: "Setup",
        marks: 2,
        description: "Defines consecutive squares",
        keywords: ["n^2", "(n+1)^2", "consecutive"],
      },
      {
        name: "Calculation",
        marks: 4,
        description: "Computes the difference",
        keywords: ["2n+1", "expand", "subtract"],
      },
      {
        name: "Odd Argument",
        marks: 2,
        description: "Shows 2n+1 is odd",
        keywords: ["odd", "2n+1", "not divisible by 2"],
      },
      {
        name: "Presentation",
        marks: 2,
        description: "Clean presentation",
        keywords: ["therefore", "always"],
      },
    ],
    solutionOutline: [
      "Consecutive perfect squares: n^2 and (n+1)^2.",
      "Difference: (n+1)^2 - n^2 = n^2 + 2n + 1 - n^2 = 2n + 1.",
      "2n + 1 is always odd (one more than an even number).",
      "Therefore the difference of consecutive squares is always odd.",
    ],
  },
  {
    id: "prob_18",
    title: "Symmetric Sum Inequality",
    statement: "For positive reals a, b, c, prove that a/b + b/c + c/a >= 3.",
    topicTags: ["algebra", "inequalities"],
    difficulty: 3,
    movesSuggested: ["move_06", "move_07"],
    rubricJson: [
      {
        name: "AM-GM Application",
        marks: 4,
        description: "Applies AM-GM correctly",
        keywords: ["AM-GM", "arithmetic", "geometric", "mean"],
      },
      {
        name: "Computation",
        marks: 2,
        description: "Correct algebra",
        keywords: ["product", "abc/abc", "1", "cube root"],
      },
      {
        name: "Equality",
        marks: 2,
        description: "Identifies equality case",
        keywords: ["a=b=c", "equality"],
      },
      {
        name: "Presentation",
        marks: 2,
        description: "Clear writing",
        keywords: ["therefore", "proved", "QED"],
      },
    ],
    solutionOutline: [
      "By AM-GM: (a/b + b/c + c/a) / 3 >= (a/b * b/c * c/a)^(1/3).",
      "The product a/b * b/c * c/a = abc/abc = 1.",
      "So (a/b + b/c + c/a) / 3 >= 1.",
      "Therefore a/b + b/c + c/a >= 3.",
      "Equality iff a/b = b/c = c/a, i.e., a = b = c.",
    ],
  },
  {
    id: "prob_19",
    title: "Euler's Formula for Planar Graphs",
    statement:
      "A connected planar graph has V vertices, E edges, and F faces. Verify Euler's formula V - E + F = 2 for the octahedron, and explain why removing one edge decreases F by exactly 1.",
    topicTags: ["graph-theory", "combinatorics"],
    difficulty: 3,
    movesSuggested: ["move_02", "move_01"],
    rubricJson: [
      {
        name: "Octahedron Values",
        marks: 3,
        description: "Correctly identifies V, E, F",
        keywords: ["6", "12", "8", "vertices", "edges", "faces"],
      },
      {
        name: "Verification",
        marks: 2,
        description: "Checks 6-12+8=2",
        keywords: ["6-12+8", "=2", "holds"],
      },
      {
        name: "Edge Removal",
        marks: 3,
        description: "Explains edge removal effect",
        keywords: ["merge", "two faces", "one face", "boundary"],
      },
      {
        name: "Presentation",
        marks: 2,
        description: "Clear explanation",
        keywords: ["therefore", "Euler"],
      },
    ],
    solutionOutline: [
      "Octahedron: V=6, E=12, F=8 (including outer face).",
      "Check: 6 - 12 + 8 = 2. Euler's formula holds.",
      "When an edge is removed (keeping connectivity):",
      "The edge was shared by two faces, which merge into one.",
      "So F decreases by 1 and E decreases by 1: (V) - (E-1) + (F-1) = V-E+F = 2.",
    ],
  },
  {
    id: "prob_20",
    title: "No Three in a Line",
    statement:
      "What is the maximum number of points that can be placed on a 4x4 grid such that no three points are collinear? Prove your answer.",
    topicTags: ["combinatorics", "geometry"],
    difficulty: 4,
    movesSuggested: ["move_14", "move_01", "move_02"],
    rubricJson: [
      {
        name: "Upper Bound",
        marks: 3,
        description: "Argues for an upper bound",
        keywords: ["at most", "8", "row", "2 per row"],
      },
      {
        name: "Construction",
        marks: 3,
        description: "Provides a valid configuration",
        keywords: ["example", "placed", "coordinates"],
      },
      {
        name: "Verification",
        marks: 2,
        description: "Checks no three are collinear",
        keywords: ["check", "collinear", "no three"],
      },
      {
        name: "Conclusion",
        marks: 2,
        description: "States and proves the answer",
        keywords: ["maximum", "therefore", "answer is 8"],
      },
    ],
    solutionOutline: [
      "Each row has 4 points; at most 2 can be chosen (3 in a row are collinear).",
      "Similarly for columns: at most 2 per column.",
      "With 4 rows and at most 2 per row, upper bound is 8.",
      "An 8-point configuration exists (e.g., one known arrangement).",
      "Verify no three chosen points are collinear.",
      "Therefore the maximum is 8.",
    ],
  },
]
