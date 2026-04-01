---
title: Recursion
category: Concept
tags: [programming, algorithms, computer-science]
date: 2026-04-01
---

# Recursion

**Recursion** is a programming technique where a function calls itself in order to solve a problem. Each recursive call works on a smaller subset of the original problem until a **base case** is reached.

## Key Components

- **Base Case**: The condition that stops the recursion. Without it, you get infinite recursion (stack overflow).
- **Recursive Case**: The part where the function calls itself with a modified argument.

## Classic Example — Factorial

```python
def factorial(n):
    if n <= 1:       # base case
        return 1
    return n * factorial(n - 1)  # recursive case
```

## When to Use

- Tree and graph traversal
- Divide and conquer algorithms (merge sort, quicksort)
- Mathematical computations (Fibonacci, power sets)
- Parsing nested structures (JSON, HTML)

## Pitfalls

1. **Stack overflow** from missing or incorrect base case
2. **Performance** — naive recursion can be exponential (use memoization)
3. **Readability** — sometimes an iterative approach is clearer

> Recursion is elegant when the problem naturally decomposes into sub-problems of the same shape.
